/**
 * Start Vibing Stacks — Type Definitions
 */

export interface StackConfig {
  id: string;
  name: string;
  icon: string;
  runtime: string;
  minVersion: string;
  packageManager: string;
  extensions: string[];
  testExtensions: string[];
  detectFiles: string[];
  commands: Record<string, string | null>;
  qualityGates: QualityGate[];
  frameworks: FrameworkOption[];
  databases: DatabaseOption[];
  frontendOptions: FrontendOption[];
  deployTargets: DeployTarget[];
  skills: string[];
  requirements: Requirement[];
}

export interface QualityGate {
  name: string;
  command: string;
  required: boolean;
  order: number;
}

export interface FrameworkOption {
  id: string;
  name: string;
  icon: string;
  detectFiles?: string[];
  skills?: string[];
  default?: boolean;
  extra?: Record<string, unknown>;
}

export interface DatabaseOption {
  id: string;
  name: string;
  icon: string;
  default?: boolean;
}

export interface FrontendOption {
  id: string;
  name: string;
  icon: string;
  frameworks?: string[];
  skillsDir?: string;
  /**
   * Optional sibling folder under `stacks/frontend/` whose `skills/` directory
   * is copied BEFORE this option's own `skills/`. Lets a stack inherit base
   * skills (e.g. `react-api` re-uses `react/skills/` plus its own additions).
   */
  baseSkillsDir?: string;
  default?: boolean;
}

export interface DeployTarget {
  id: string;
  name: string;
  icon: string;
}

export interface Requirement {
  name: string;
  command: string;
  versionFlag: string;
  minVersion: string;
  installCommand: {
    macos: string;
    linux: string;
  };
  versionRegex: string;
}

export interface ProjectConfig {
  name: string;
  stack: string;
  framework: string;
  database: string;
  frontend: string;
  frontendSkillsDir?: string;
  /** Inherited base frontend folder copied BEFORE the main frontend skills. */
  frontendBaseSkillsDir?: string;
  deploy: string;
  path: string;
  createdAt: string;
  skills: string[];
  qualityGates: string;
  cursorRules: boolean;
  domains: Record<string, { patterns: string[] }>;
  standardsReview?: StandardsReview;
}

export interface DetectionResult {
  files: string[];
  stacks: { id: string; confidence: number; reason: string }[];
  hasCursorRules: boolean;
  hasClaudeMd: boolean;
  hasGit: boolean;
}

export interface PatternMatch {
  category: string;
  name: string;
  confidence: number;
  detail?: string;
}

export interface ScanResult {
  source: string;
  patterns: PatternMatch[];
}

export interface StandardsReview {
  status: 'adapted' | 'defaults' | 'pending';
  scannedAt: string;
  sources: string[];
  patterns: PatternMatch[];
  userChoice: 'adapt' | 'defaults' | 'pending';
}
