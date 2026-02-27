# External API Patterns — HTTP Client for Laravel + Octane

**ALWAYS invoke when consuming external APIs, webhooks, or third-party services.**

## Architecture

```
Controller/Job
  → ApiService (business logic)
    → Http::withOptions() (Laravel HTTP Client)
      → Response handling (DTO)
        → Error handling (typed exceptions)
          → Logging + monitoring

NEVER call Http:: directly in controllers. Always through a Service.
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

## Frontend Consumption (React + Inertia)

```tsx
// resources/js/services/api.ts
import axios, { AxiosError } from 'axios';

interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
    errors?: Record<string, string[]>;
}

interface ApiErrorResponse {
    success: false;
    message: string;
    errors?: Record<string, string[]>;
    retry_after?: number;
}

export async function apiCall<T>(
    method: 'get' | 'post' | 'put' | 'delete',
    url: string,
    data?: unknown,
): Promise<T> {
    try {
        const response = await axios({ method, url, data });
        const body = response.data as ApiResponse<T>;
        if (!body.success) throw new ApiError(body.message, response.status);
        return body.data;
    } catch (error) {
        if (error instanceof AxiosError) {
            const body = error.response?.data as ApiErrorResponse;
            const status = error.response?.status ?? 500;

            if (status === 429) {
                throw new RateLimitError(body?.retry_after ?? 60);
            }
            if (status === 422 && body?.errors) {
                throw new ValidationError(body.message, body.errors);
            }
            throw new ApiError(body?.message ?? 'Connection failed', status);
        }
        throw error;
    }
}

// Typed errors
export class ApiError extends Error {
    constructor(message: string, public status: number) { super(message); }
}
export class ValidationError extends ApiError {
    constructor(message: string, public errors: Record<string, string[]>) { super(message, 422); }
}
export class RateLimitError extends ApiError {
    constructor(public retryAfter: number) { super('Too many requests', 429); }
}
```

### React Component Usage

```tsx
const LABELS = {
    generating: __('messages.ai.generating'),
    error: __('messages.errors.error'),
    rateLimited: __('messages.errors.rate_limited'),
} as const;

export default function AiChat() {
    const [loading, setLoading] = useState(false);

    const generate = async () => {
        setLoading(true);
        try {
            const result = await apiCall<{ content: string }>('post', route('api.v1.ai.generate'), {
                model: 'gpt-4',
                messages: [{ role: 'user', content: prompt }],
            });
            setResponse(result.content);
        } catch (error) {
            if (error instanceof RateLimitError) {
                toast.error(`${LABELS.rateLimited} (${error.retryAfter}s)`);
            } else if (error instanceof ValidationError) {
                Object.values(error.errors).flat().forEach(msg => toast.error(msg));
            } else {
                toast.error(error instanceof ApiError ? error.message : LABELS.error);
            }
        } finally {
            setLoading(false);
        }
    };
}
```

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
| Webhook without signature check | ALWAYS verify signatures |
| Webhook sync processing | Dispatch job for async |
| `dd()` / `dump()` API responses | Structured `Log::info/error` |
