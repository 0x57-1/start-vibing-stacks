#!/bin/bash
# @sv-version: 1.0.0
# Universal Hook Runner — Start Vibing Stacks
# Tries: bun → npx tsx

HOOK_NAME="$1"
HOOKS_DIR="$(dirname "$0")"

command_exists() { command -v "$1" >/dev/null 2>&1; }

if command_exists bun && [ -f "$HOOKS_DIR/$HOOK_NAME.ts" ]; then
    exec bun "$HOOKS_DIR/$HOOK_NAME.ts"
fi

if command_exists npx && [ -f "$HOOKS_DIR/$HOOK_NAME.ts" ]; then
    exec npx tsx "$HOOKS_DIR/$HOOK_NAME.ts"
fi

echo '{"decision":"approve","continue":true,"reason":"No runtime available"}'
exit 0
