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
  extra?: Record<string, unknown>;
}

export interface DatabaseOption {
  id: string;
  name: string;
  icon: string;
}

export interface FrontendOption {
  id: string;
  name: string;
  icon: string;
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
  deploy: string;
  path: string;
  createdAt: string;
  skills: string[];
  qualityGates: string;
  cursorRules: boolean;
  domains: Record<string, { patterns: string[] }>;
}

export interface DetectionResult {
  files: string[];
  stacks: { id: string; confidence: number; reason: string }[];
  hasCursorRules: boolean;
  hasClaudeMd: boolean;
  hasGit: boolean;
}
