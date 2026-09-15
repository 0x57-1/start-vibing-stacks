---
name: eas-release
version: 1.0.0
description: >-
  EAS Build, Submit, and Update for Expo apps on iOS and Android. Use when
  preparing store binaries, credentials, or OTA JS updates. Not TestFlight
  phishing or sideload stores.
---

# EAS release

## Builds

```bash
npx eas-cli login
npx eas-cli build --platform all --profile production
npx eas-cli submit --platform ios
npx eas-cli submit --platform android
```

Development: `--profile development` (dev client). Preview: internal
distribution. Production: store.

## Credentials

Let EAS manage iOS certs / Android keystore unless the operator already
has them. Never commit `.p8`, `.jks`, or `google-services.json` with
private keys. `eas.json` is OK to commit; secrets stay in EAS or CI.

## OTA (`expo-updates`)

JS-only updates. Native module or permission changes require a **new
binary**. Do not promise “undetectable” store review bypass.

## Forbidden

| Action | Why |
|---|---|
| Commit keystore / provisioning profile | Leak |
| Sideload store as the official Plowf/app listing | Impersonation / policy |
| Disable Play integrity as the goal | Policy |

## See Also

- `expo-modules` — when a binary is required
- memory `post-push-ci-verification` — watch the GitHub run after push
