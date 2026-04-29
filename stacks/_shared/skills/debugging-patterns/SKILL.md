---
name: debugging-patterns
version: 1.0.0
---

# Debugging Patterns

## Universal Approach

1. **Read the error** — fully, including stack trace
2. **Reproduce** — confirm you can trigger it
3. **Isolate** — minimal reproduction
4. **Fix** — one change at a time
5. **Test** — verify fix, add regression test
6. **Document** — add to domain attention points

## Stack-Specific Tools

### PHP
```bash
# Error logs
tail -f /var/log/php/error.log
# Xdebug
php -dxdebug.mode=debug script.php
# Built-in server with errors
php -S localhost:8000 -d display_errors=1
```

### Node.js
```bash
# Debug mode
node --inspect script.js
# Verbose logging
DEBUG=* node script.js
```

## Anti-Patterns

| Don't | Do |
|-------|-----|
| `var_dump` / `console.log` everywhere | Use proper debugger |
| Fix symptom, not cause | Trace to root cause |
| Skip writing test for fix | Always add regression test |
| Leave debug code in commit | Clean before commit |
