# PHP Security Scan

## OWASP Top 10 for PHP

### A01 - Broken Access Control

```php
// ❌ NEVER trust user input for authorization
$userId = $_GET['user_id'];
$user = User::find($userId);

// ✅ Use authenticated session
$user = Auth::user();
```

### A02 - Cryptographic Failures

```php
// ❌ NEVER
md5($password);
sha1($password);

// ✅ ALWAYS
password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);
password_verify($input, $hash);
```

### A03 - Injection

```php
// ❌ SQL Injection
$db->query("SELECT * FROM users WHERE id = {$_GET['id']}");

// ✅ Prepared statements (PDO)
$stmt = $db->prepare("SELECT * FROM users WHERE id = :id");
$stmt->execute([':id' => $id]);

// ✅ Prepared statements (MySQLi)
$stmt = $db->prepare("SELECT * FROM users WHERE id = ?");
$stmt->bind_param('i', $id);
$stmt->execute();
```

### A07 - XSS Prevention

```php
// ❌ Raw output
echo $userInput;

// ✅ Always escape
echo htmlspecialchars($userInput, ENT_QUOTES, 'UTF-8');

// ✅ In templates (Blade)
{{ $userInput }}  // Auto-escaped
{!! $trustedHtml !!}  // Only for trusted content
```

## Security Checklist

- [ ] All SQL uses prepared statements
- [ ] All output is escaped (htmlspecialchars)
- [ ] CSRF tokens on all forms
- [ ] Passwords use password_hash/verify
- [ ] File uploads validated (type, size, extension)
- [ ] Sessions use httpOnly + secure cookies
- [ ] Input validated before processing
- [ ] No `eval()`, `exec()` with user input
- [ ] No `extract()` on user data
- [ ] Headers: X-Content-Type-Options, X-Frame-Options, CSP

## Sensitive Data Patterns (FORBIDDEN)

| Pattern | Risk |
|---------|------|
| `$_GET` used directly in SQL | SQL Injection |
| `echo $_POST[...]` | XSS |
| `md5()` / `sha1()` for passwords | Weak hashing |
| `eval($userInput)` | RCE |
| `include $_GET['page']` | LFI/RFI |
| `serialize()` user data | Object injection |
