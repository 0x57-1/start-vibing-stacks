import { readFileSync } from 'fs';
import { join } from 'path';

export interface ChunkEvaluation {
  chunkId: string;
  text: string;
  scores: {
    relevance: number;
    specificity: number;
    actionability: number;
    uniqueness: number;
    freshness: number;
  };
  finalScore: number;
  recommendation: 'keep' | 'merge' | 'archive' | 'rewrite';
  reason: string;
}

export interface JudgeConfig {
  model: string;
  temperature: number;
  criteria: Record<string, number>;
  thresholds: {
    minScore: number;
    mergeThreshold: number;
    archiveThreshold: number;
  };
}

const DEFAULT_CRITERIA = {
  relevance: 0.30,
  specificity: 0.25,
  actionability: 0.20,
  uniqueness: 0.15,
  freshness: 0.10
};

export async function evaluateChunk(
  chunk: { id: string; text: string },
  config: JudgeConfig,
  context: string
): Promise<ChunkEvaluation> {
  const prompt = buildJudgePrompt(chunk.text, config.criteria, context);

  // In a real implementation, this would call the Claude API
  // For now, we return a placeholder structure.
  // The actual LLM call will be implemented when integrating with the pipeline.

  const mockScores = {
    relevance: 0.85,
    specificity: 0.70,
    actionability: 0.65,
    uniqueness: 0.80,
    freshness: 0.90
  };

  const finalScore = Object.entries(mockScores).reduce((acc, [key, value]) => {
    return acc + value * (config.criteria[key as keyof typeof config.criteria] || 0);
  }, 0);

  let recommendation: ChunkEvaluation['recommendation'] = 'keep';
  if (finalScore < config.thresholds.archiveThreshold) recommendation = 'archive';
  else if (finalScore < config.thresholds.minScore) recommendation = 'rewrite';
  else if (finalScore > config.thresholds.mergeThreshold) recommendation = 'merge';

  return {
    chunkId: chunk.id,
    text: chunk.text,
    scores: mockScores,
    finalScore: Math.round(finalScore * 100) / 100,
    recommendation,
    reason: `Score ${finalScore.toFixed(2)} — ${recommendation} based on weighted criteria.`
  };
}

function buildJudgePrompt(text: string, criteria: Record<string, number>, context: string): string {
  return `You are an expert memory curator for AI coding agents.

Evaluate the following memory chunk according to these weighted criteria:

${Object.entries(criteria).map(([k, v]) => `- ${k}: ${v * 100}%`).join('\n')}

Context about the project:
${context}

Chunk to evaluate:
"""
${text}
"""

Respond ONLY with a valid JSON object:
{
  "relevance": 0.0-1.0,
  "specificity": 0.0-1.0,
  "actionability": 0.0-1.0,
  "uniqueness": 0.0-1.0,
  "freshness": 0.0-1.0,
  "recommendation": "keep" | "merge" | "archive" | "rewrite",
  "reason": "one sentence justification"
}`;
}