import { randomUUID } from 'crypto';

export interface MemoryChunk {
  id: string;
  text: string;
  sourceFile: string;
  startLine?: number;
  endLine?: number;
}

/**
 * Semantic chunker (placeholder).
 * In a real implementation, this would use LLM to split memories into
 * semantically coherent chunks instead of naive line-based splitting.
 */
export function chunkMemory(content: string, sourceFile: string): MemoryChunk[] {
  const lines = content.split('\n');
  const chunks: MemoryChunk[] = [];
  let currentChunk: string[] = [];
  let startLine = 1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    currentChunk.push(line);

    // Naive heuristic: split on double newlines or section headers
    if (line.trim() === '' || line.startsWith('##')) {
      if (currentChunk.length > 3) {
        chunks.push({
          id: randomUUID(),
          text: currentChunk.join('\n').trim(),
          sourceFile,
          startLine,
          endLine: i + 1
        });
        currentChunk = [];
        startLine = i + 2;
      }
    }
  }

  if (currentChunk.length > 3) {
    chunks.push({
      id: randomUUID(),
      text: currentChunk.join('\n').trim(),
      sourceFile,
      startLine,
      endLine: lines.length
    });
  }

  return chunks;
}