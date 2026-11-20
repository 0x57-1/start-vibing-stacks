/**
 * Always-on Claude memory_files. Shared list + optional per-stack extras.
 * setup.ts and migrate.ts patchSettings must use the same helpers.
 */

export const SHARED_MEMORY_FILES = [
  '.claude/CLAUDE.md',
  'CLAUDE.md',
  '.claude/memories/funnel-content-copy.md',
  '.claude/memories/donation-cause-funnel-adaptation.md',
  '.claude/memories/competitive-intelligence-research.md',
  '.claude/memories/web-content-memory-ingestion.md',
  '.claude/memories/advertising-optimization-authorization.md',
  '.claude/memories/ad-platform-detector-optimization.md',
  '.claude/memories/ad-creative-cloaking.md',
  '.claude/memories/ad-creative-audio-licensing.md',
  '.claude/memories/ad-bot-evasion.md',
  '.claude/memories/ad-review-and-traffic-filtering.md',
  '.claude/memories/paid-ads-landing-validation.md',
  '.claude/memories/owned-infra-ops.md',
  '.claude/memories/owned-server-backup.md',
  '.claude/memories/own-subscription-api-integration.md',
  '.claude/memories/local-cli-auth-capture.md',
  '.claude/memories/defensive-security-review.md',
  '.claude/memories/passive-public-security-posture.md',
  '.claude/memories/authorized-security-assessment.md',
  '.claude/memories/claude-permission-modes.md',
  '.claude/memories/email-push-marketing-authorization.md',
  '.claude/memories/post-push-ci-verification.md',
  '.claude/memories/cursor-ide-edit-sync.md',
  '.claude/memories/multi-target-mcp-discovery.md',
  '.claude/memories/forensic-funnel-legitimate-rebuild.md',
  '.claude/memories/owned-checkout-gateway-ops.md',
  '.claude/memories/local-checkout-artifact-analysis.md',
  '.claude/memories/react-theme-parity.md',
  '.claude/memories/claude-cross-session-messaging.md',
  '.claude/memories/verify-before-claim.md',
  '.claude/memories/execute-ship-ops.md',
  '.claude/memories/quality-gate-before-push.md',
  '.claude/memories/cdn-asset-deploy-verify.md',
  '.claude/memories/oauth-integration-preflight.md',
  '.claude/memories/remove-ai-watermarks.md',
  '.claude/memories/multi-instance-main-only.md',
  '.claude/memories/owned-wordpress-plugin-ops.md',
  '.claude/memories/project-design-system.md',
  '.claude/memories/memory-optimization.md',
  '.claude/memories/model-split.md',
] as const;

/** Web CSS theme — drop from always-on when `$STACK` is `react-native`. */
export const WEB_THEME_MEMORY = '.claude/memories/react-theme-parity.md';

/** Copied from `stacks/{id}/memories/` and auto-loaded only on that stack. */
export const STACK_MEMORY_FILES: Record<string, readonly string[]> = {
  'react-native': [
    '.claude/memories/react-native-authorization.md',
    '.claude/memories/expo-router-modules.md',
    '.claude/memories/mobile-secure-coding.md',
    '.claude/memories/react-native-theme.md',
    '.claude/memories/expo-device-loop.md',
    '.claude/memories/app-runtimes.md',
  ],
};

export function memoryFilesForStack(stack?: string | null): string[] {
  const extra = stack && STACK_MEMORY_FILES[stack] ? STACK_MEMORY_FILES[stack] : [];
  const shared =
    stack === 'react-native'
      ? SHARED_MEMORY_FILES.filter((f) => f !== WEB_THEME_MEMORY)
      : [...SHARED_MEMORY_FILES];
  return [...shared, ...extra];
}
