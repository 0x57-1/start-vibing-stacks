---
version: 1.0.0
---

# Memory: Mobile secure coding (owned RN app)

> MASVS-style rules for **this** app's source. Not third-party APK cracking.

- Secrets stay off the JS bundle. `.env.example` only in git.
- No WebView of the web panel unless the user explicitly asks — prefer the
  mobile API + native screens.
- Never log Bearer, refresh, 2FA, or full payment keys.
- Zod every write. ATS / no cleartext in production.
- Hard limits: no exploit PoCs; no official bank UI as app chrome.

Skills: `react-native-security`, `react-native-secure-coding`, `react-native-http`.
