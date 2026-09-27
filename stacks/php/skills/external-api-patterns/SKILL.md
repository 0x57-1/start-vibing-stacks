---
name: external-api-patterns
version: 2.0.1
description: "Laravel patterns for consuming external APIs / SDKs / webhooks (2026). Two recommended approaches: (1) Laravel HTTP Client (`Http::`) wrapped in a Service for one-off integrations; (2) Saloon v3 for SDK-style integrations with multiple endpoints (Connectors + Requests + Responses, retry/auth/middleware/pagination first-class, mock client for testing, Laravel plugin). Octane-safe (no static client state), typed DTOs, typed exceptions, structured logging, idempotent webhook reception with signature verification (2025-A10 fail-closed). Invoke when adding any third-party integration or webhook handler."
---

# External API Patterns — Laravel + Octane (2026)

**ALWAYS invoke when consuming external APIs, webhooks, or third-party services.**

## Choose your tool

## Jev tool

No key or `SVS_JEV=0`: the table below.

With a key: Choice `laravel_http` | `saloon` | `vendor_sdk` before the long
examples. Read only the winner. Confidence &lt; 0.75 → the table. Questions:
`typesafe-jev/reference/skill-routines.md` § stack-pick.

### Tool table

| Scenario | Tool |
|---|---|
| 1–3 endpoints from one vendor, simple req/res | Laravel `Http::` Client wrapped in a Service |
| SDK-shaped integration: many endpoints, auth flows, pagination, custom responses | **Saloon v3** (Connectors + Requests + Responses) |
| Vendor publishes its own SDK | Use the SDK; still wrap in a Service for testability |

Either way: **never call `Http::` or a vendor SDK directly from a Controller**. Always go through an injected Service.

## Architecture

```
Controller / Job / Listener
        ↓
ApiService (business logic, transactions)
        ↓
HTTP transport
  ├── Http::baseUrl(...) → response()->json()        (Laravel Client path)
  └── new Connector → ->send(new Request())          (Saloon path)
        ↓
Typed DTO (readonly class)
        ↓
Typed exception on failure / log + return on success
```

## Service Pattern

```php
// app/Services/External/OpenAiService.php
namespace App\Services\External;

use App\DTOs\Api\ChatCompletionRequest;
use App\DTOs\Api\ChatCompletionResponse;
use App\Exceptions\Api\ApiConnectionException;
use App\Exceptions\Api\ApiRateLimitException;
use App\Exceptions\Api\ApiValidationException;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\Client\RequestException;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class OpenAiService
{
    private PendingRequest $client;

    public function __construct()
    {
        $this->client = Http::baseUrl(config('services.openai.base_url', 'https://api.openai.com/v1'))
            ->withToken(config('services.openai.key'))
            ->timeout(30)
            ->connectTimeout(5)
            ->withHeaders([
                'Accept' => 'application/json',
                'Content-Type' => 'application/json',
            ])
            ->retry(
                times: 3,
                sleepMilliseconds: fn (int $attempt) => $attempt * 500, // 500ms, 1s, 1.5s
                when: fn ($exception) => $this->shouldRetry($exception),
                throw: true,
            );
    }

    public function chatCompletion(ChatCompletionRequest $request): ChatCompletionResponse
    {
        try {
            $response = $this->client
                ->post('/chat/completions', $request->toArray())
                ->throw();

            return ChatCompletionResponse::fromArray($response->json());

        } catch (ConnectionException $e) {
            Log::error('[OpenAI] Connection failed', [
                'error' => $e->getMessage(),
            ]);
            throw new ApiConnectionException('OpenAI', $e);

        } catch (RequestException $e) {
            $this->handleRequestException($e, 'chatCompletion');
        }
    }

    private function shouldRetry(\Exception $exception): bool
    {
        if ($exception instanceof ConnectionException) return true;

        if ($exception instanceof RequestException) {
            $status = $exception->response->status();
            // Retry on: 408 timeout, 429 rate limit, 500+ server errors
            return in_array($status, [408, 429, 500, 502, 503, 504]);
        }

        return false;
    }

    private function handleRequestException(RequestException $e, string $method): never
    {
        $status = $e->response->status();
        $body = $e->response->json();

        Log::error("[OpenAI] {$method} failed", [
            'status' => $status,
            'error' => $body['error']['message'] ?? $e->getMessage(),
            'type' => $body['error']['type'] ?? 'unknown',
        ]);

        match (true) {
            $status === 429 => throw new ApiRateLimitException('OpenAI', $body, $e),
            $status === 422 => throw new ApiValidationException('OpenAI', $body, $e),
            $status >= 500 => throw new ApiConnectionException('OpenAI', $e),
            default => throw new ApiConnectionException('OpenAI', $e),
        };
    }
}
```

## DTOs (Data Transfer Objects)

```php
// app/DTOs/Api/ChatCompletionRequest.php
namespace App\DTOs\Api;

readonly class ChatCompletionRequest
{
    public function __construct(
        public string $model,
        public array $messages,
        public float $temperature = 0.7,
        public int $maxTokens = 4096,
    ) {}

    public function toArray(): array
    {
        return [
            'model' => $this->model,
            'messages' => $this->messages,
            'temperature' => $this->temperature,
            'max_tokens' => $this->maxTokens,
        ];
    }
}

// app/DTOs/Api/ChatCompletionResponse.php
namespace App\DTOs\Api;

readonly class ChatCompletionResponse
{
    public function __construct(
        public string $id,
        public string $content,
        public int $promptTokens,
        public int $completionTokens,
        public string $model,
        public string $finishReason,
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            id: $data['id'],
            content: $data['choices'][0]['message']['content'] ?? '',
            promptTokens: $data['usage']['prompt_tokens'] ?? 0,
            completionTokens: $data['usage']['completion_tokens'] ?? 0,
            model: $data['model'],
            finishReason: $data['choices'][0]['finish_reason'] ?? 'unknown',
        );
    }
}
```

## Typed Exceptions

```php
// app/Exceptions/Api/ApiConnectionException.php
namespace App\Exceptions\Api;

class ApiConnectionException extends \RuntimeException
{
    public function __construct(
        public readonly string $service,
        ?\Throwable $previous = null,
    ) {
        parent::__construct("Connection to {$service} API failed", 503, $previous);
    }
}

// app/Exceptions/Api/ApiRateLimitException.php
class ApiRateLimitException extends \RuntimeException
{
    public function __construct(
        public readonly string $service,
        public readonly array $body = [],
        ?\Throwable $previous = null,
    ) {
        $retryAfter = $body['error']['retry_after'] ?? 'unknown';
        parent::__construct("{$service} rate limit exceeded. Retry after: {$retryAfter}s", 429, $previous);
    }
}

// app/Exceptions/Api/ApiValidationException.php
class ApiValidationException extends \RuntimeException
{
    public function __construct(
        public readonly string $service,
        public readonly array $body = [],
        ?\Throwable $previous = null,
    ) {
        $message = $body['error']['message'] ?? 'Validation failed';
        parent::__construct("{$service}: {$message}", 422, $previous);
    }
}
```

## API Response Standard (Your API → Frontend)

```php
// app/Traits/ApiResponse.php
namespace App\Traits;

use Illuminate\Http\JsonResponse;

trait ApiResponse
{
    protected function success(mixed $data = null, string $message = 'OK', int $status = 200): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => $data,
        ], $status);
    }

    protected function created(mixed $data = null, string $message = 'Created'): JsonResponse
    {
        return $this->success($data, $message, 201);
    }

    protected function error(string $message, int $status = 400, array $errors = []): JsonResponse
    {
        $response = [
            'success' => false,
            'message' => $message,
        ];

        if (!empty($errors)) {
            $response['errors'] = $errors;
        }

        return response()->json($response, $status);
    }

    protected function notFound(string $resource = 'Resource'): JsonResponse
    {
        return $this->error("{$resource} not found", 404);
    }

    protected function unauthorized(string $message = 'Unauthorized'): JsonResponse
    {
        return $this->error($message, 401);
    }

    protected function rateLimited(int $retryAfter = 60): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => 'Too many requests',
            'retry_after' => $retryAfter,
        ], 429)->header('Retry-After', $retryAfter);
    }
}
```

### Controller Usage

```php
class AiModelController extends Controller
{
    use ApiResponse;

    public function __construct(
        private readonly OpenAiService $openAi,
    ) {}

    public function generate(GenerateRequest $request): JsonResponse
    {
        try {
            $dto = new ChatCompletionRequest(
                model: $request->validated('model'),
                messages: $request->validated('messages'),
                temperature: $request->validated('temperature', 0.7),
            );

            $result = $this->openAi->chatCompletion($dto);

            return $this->success([
                'content' => $result->content,
                'tokens' => $result->promptTokens + $result->completionTokens,
                'model' => $result->model,
            ]);

        } catch (ApiRateLimitException $e) {
            return $this->rateLimited(60);
        } catch (ApiValidationException $e) {
            return $this->error($e->getMessage(), 422);
        } catch (ApiConnectionException $e) {
            return $this->error('Service temporarily unavailable', 503);
        }
    }
}
```

## Saloon v3 — SDK-style integrations *(2026 recommended)*

Use when the integration has **many endpoints, auth flows, pagination, or warrants its own folder**. Saloon turns "an API" into an OOP shape: a `Connector` (base URL + auth + middleware) plus one `Request` per endpoint plus optional custom `Response` classes.

### Install

```bash
composer require saloonphp/saloon "^3.0"
composer require saloonphp/laravel-plugin "^4.0"   # Laravel integration
php artisan vendor:publish --tag=saloon-config
```

### Folder layout

```
app/Http/Integrations/
└── OpenAi/
    ├── OpenAiConnector.php
    ├── Requests/
    │   ├── ChatCompletion.php
    │   └── Embeddings.php
    └── Responses/
        └── ChatCompletionResponse.php
```

### Connector

```php
// app/Http/Integrations/OpenAi/OpenAiConnector.php
namespace App\Http\Integrations\OpenAi;

use Saloon\Http\Connector;
use Saloon\Http\Auth\TokenAuthenticator;
use Saloon\Traits\Plugins\AcceptsJson;
use Saloon\RateLimitPlugin\Traits\HasRateLimits;

class OpenAiConnector extends Connector
{
    use AcceptsJson;
    use HasRateLimits;

    public function resolveBaseUrl(): string
    {
        return config('services.openai.base_url', 'https://api.openai.com/v1');
    }

    protected function defaultHeaders(): array
    {
        return ['User-Agent' => 'myapp/1.0'];
    }

    protected function defaultAuth(): TokenAuthenticator
    {
        return new TokenAuthenticator(config('services.openai.key'));
    }

    protected function defaultConfig(): array
    {
        return ['timeout' => 30, 'connect_timeout' => 5];
    }
}
```

### Request

```php
// app/Http/Integrations/OpenAi/Requests/ChatCompletion.php
namespace App\Http\Integrations\OpenAi\Requests;

use Saloon\Contracts\Body\HasBody;
use Saloon\Enums\Method;
use Saloon\Http\Request;
use Saloon\Traits\Body\HasJsonBody;

class ChatCompletion extends Request implements HasBody
{
    use HasJsonBody;

    protected Method $method = Method::POST;

    public function __construct(
        protected readonly string $model,
        protected readonly array  $messages,
        protected readonly float  $temperature = 0.7,
    ) {}

    public function resolveEndpoint(): string { return '/chat/completions'; }

    protected function defaultBody(): array
    {
        return [
            'model'       => $this->model,
            'messages'    => $this->messages,
            'temperature' => $this->temperature,
        ];
    }
}
```

### Calling from a Service

```php
namespace App\Services\External;

use App\Http\Integrations\OpenAi\OpenAiConnector;
use App\Http\Integrations\OpenAi\Requests\ChatCompletion;
use App\DTOs\Api\ChatCompletionResponse;

class OpenAiService
{
    public function __construct(private readonly OpenAiConnector $api) {}

    public function chat(string $model, array $messages): ChatCompletionResponse
    {
        $response = $this->api
            ->send(new ChatCompletion($model, $messages))
            ->throw();
        return ChatCompletionResponse::fromArray($response->json());
    }
}
```

### Test with Saloon's MockClient

```php
use Saloon\Http\Faking\MockClient;
use Saloon\Http\Faking\MockResponse;
use App\Http\Integrations\OpenAi\Requests\ChatCompletion;

it('returns the assistant message', function () {
    $mock = new MockClient([
        ChatCompletion::class => MockResponse::make(['choices' => [['message' => ['content' => 'hi']]], 'usage' => ['prompt_tokens' => 1, 'completion_tokens' => 1]], 200),
    ]);
    app(OpenAiConnector::class)->withMockClient($mock);

    $resp = app(OpenAiService::class)->chat('gpt-4', [['role' => 'user', 'content' => 'hi']]);
    expect($resp->content)->toBe('hi');
});
```

### When Saloon shines vs raw `Http::`

- **Auth is non-trivial** (OAuth2 device flow, signed requests, paginated tokens)
- **Pagination** (cursor / page / link-header) — Saloon ships first-class paginators
- **Many endpoints** sharing the same base config — DRY via the Connector
- **Test coverage matters** — `MockClient` captures request shape, not just HTTP verb
- **Ratelimit awareness** — `HasRateLimits` plugin tracks per-connector budgets
- **Want the API to feel like a vendor SDK** to your call sites

For 1-2 throwaway endpoints, raw `Http::` is fine — don't over-engineer.

## Octane Safety

```php
// ✅ New client instance per request (no stale state)
public function __construct()
{
    // Http::baseUrl() creates a NEW PendingRequest each time
    // Safe in Octane — no shared state between requests
    $this->client = Http::baseUrl(config('services.openai.base_url'))
        ->withToken(config('services.openai.key'));
}

// ❌ NEVER static client (leaks between Octane requests)
private static PendingRequest $client; // ❌ Shared across ALL requests!
```

## Config Pattern

```php
// config/services.php
'openai' => [
    'key' => env('OPENAI_API_KEY'),
    'base_url' => env('OPENAI_BASE_URL', 'https://api.openai.com/v1'),
    'timeout' => env('OPENAI_TIMEOUT', 30),
    'max_retries' => env('OPENAI_MAX_RETRIES', 3),
],

'stripe' => [
    'key' => env('STRIPE_KEY'),
    'secret' => env('STRIPE_SECRET'),
    'webhook_secret' => env('STRIPE_WEBHOOK_SECRET'),
],
```

**Rule:** All API keys in `.env` → `config/services.php` → `config('services.x.key')`. NEVER `env()` directly in code (cached in Octane).

## Webhook Receiving

```php
// app/Http/Controllers/Webhooks/StripeWebhookController.php
class StripeWebhookController extends Controller
{
    public function handle(Request $request): JsonResponse
    {
        // 1. Verify signature
        $payload = $request->getContent();
        $signature = $request->header('Stripe-Signature');

        try {
            $event = \Stripe\Webhook::constructEvent(
                $payload,
                $signature,
                config('services.stripe.webhook_secret')
            );
        } catch (\Exception $e) {
            Log::warning('[Stripe Webhook] Invalid signature', ['error' => $e->getMessage()]);
            return response()->json(['error' => 'Invalid signature'], 400);
        }

        // 2. Process idempotently (check if already processed)
        if (WebhookEvent::where('event_id', $event->id)->exists()) {
            return response()->json(['status' => 'already_processed']);
        }

        // 3. Store event
        WebhookEvent::create([
            'event_id' => $event->id,
            'type' => $event->type,
            'payload' => $payload,
        ]);

        // 4. Dispatch job (async processing)
        ProcessStripeEvent::dispatch($event->type, $event->data->object);

        return response()->json(['status' => 'received']);
    }
}
```

## Logging Standard

```php
// Structured logging for all API calls
Log::info('[ServiceName] API call', [
    'method' => 'POST',
    'endpoint' => '/chat/completions',
    'status' => 200,
    'duration_ms' => $duration,
    'tokens' => $response->promptTokens + $response->completionTokens,
]);

Log::error('[ServiceName] API failed', [
    'method' => 'POST',
    'endpoint' => '/chat/completions',
    'status' => $e->response->status(),
    'error' => $e->response->json('error.message'),
    'duration_ms' => $duration,
]);
```

## FORBIDDEN

| ❌ Don't | ✅ Do |
|---|---|
| `Http::get()` in controller | Service class with typed DTOs |
| `env('API_KEY')` in code | `config('services.x.key')` |
| Raw arrays for API data | `readonly class` DTOs |
| Catch generic `Exception` | Typed exceptions per error type |
| `static $client` in Octane | Instance `$this->client` per request |
| No timeout on HTTP calls | `->timeout(30)->connectTimeout(5)` |
| No retry logic | `->retry(3, backoff, when)` |
| Webhook without signature check | ALWAYS verify signatures (2025-A10 fail-closed) |
| Webhook sync processing | Dispatch job for async |
| `dd()` / `dump()` API responses | Structured `Log::info/error` |
| Many endpoints inlined as `Http::` calls | Promote to Saloon Connector + Requests |
| Mocking Saloon by stubbing `Http::` | Use `MockClient` (matches by Request class) |

## See Also

- `axios-laravel-api` (frontend) — the React side that consumes this Laravel API
- `api-design` / `api-security` — request shape + Sanctum patterns
- `_shared/skills/security-baseline` (2025-A03 + 2025-A10) — supply chain + fail-closed
- `_shared/skills/observability` — structured logging + redaction
- `mariadb-octane` — transaction safety when API call participates in a DB transaction
- `phpunit-testing` — Pest 4 patterns for Saloon `MockClient` and `Http::fake()`
