import { readFileSync, existsSync } from 'fs';
import { glob } from 'glob';
import { join, dirname } from 'path';

export interface GxpAnnotation {
  gxp_id: string;
  type: string;
  title?: string;
  description?: string;
  traces?: string[];
  risk?: string;
  file: string;
  line: number;
}

// Regex patterns for @gxp-* tags
const patterns = {
  // @gxp-id: REF-FRS-001
  id: /@gxp-id:\s*([A-Z0-9-]+)/gi,
  // @gxp-type: OQ
  type: /@gxp-type:\s*(\w+)/gi,
  // @gxp-traces: REF-FRS-001, REF-DS-001
  traces: /@gxp-traces?:\s*([A-Z0-9-,\s]+)/gi,
  // @gxp-title: Some title
  title: /@gxp-title:\s*(.+)/gi,
  // @gxp-risk: High
  risk: /@gxp-risk:\s*(\w+)/gi,
};

export function extractAnnotationsFromFile(filePath: string): GxpAnnotation[] {
  if (!existsSync(filePath)) {
    return [];
  }

  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const annotations: GxpAnnotation[] = [];

  let currentAnnotation: Partial<GxpAnnotation> | null = null;
  let lineNumber = 0;

  for (const line of lines) {
    lineNumber++;

    // Check for @gxp-id (starts a new annotation block)
    const idMatch = /@gxp-id:\s*([A-Z0-9-]+)/i.exec(line);
    if (idMatch) {
      // Save previous annotation if exists
      if (currentAnnotation?.gxp_id) {
        annotations.push({
          gxp_id: currentAnnotation.gxp_id,
          type: currentAnnotation.type || 'TC',
          title: currentAnnotation.title,
          description: currentAnnotation.description,
          traces: currentAnnotation.traces,
          risk: currentAnnotation.risk,
          file: filePath,
          line: currentAnnotation.line || lineNumber,
        } as GxpAnnotation);
      }

      // Start new annotation
      currentAnnotation = {
        gxp_id: idMatch[1],
        line: lineNumber,
        traces: [],
      };
      continue;
    }

    // Only process other tags if we have a current annotation
    if (currentAnnotation) {
      // @gxp-type
      const typeMatch = /@gxp-type:\s*(\w+)/i.exec(line);
      if (typeMatch) {
        currentAnnotation.type = typeMatch[1];
      }

      // @gxp-traces
      const tracesMatch = /@gxp-traces?:\s*([A-Z0-9-,\s]+)/i.exec(line);
      if (tracesMatch) {
        const ids = tracesMatch[1].split(',').map(s => s.trim()).filter(Boolean);
        currentAnnotation.traces = [...(currentAnnotation.traces || []), ...ids];
      }

      // @gxp-title
      const titleMatch = /@gxp-title:\s*(.+)/i.exec(line);
      if (titleMatch) {
        currentAnnotation.title = titleMatch[1].trim();
      }

      // @gxp-risk
      const riskMatch = /@gxp-risk:\s*(\w+)/i.exec(line);
      if (riskMatch) {
        currentAnnotation.risk = riskMatch[1];
      }
    }
  }

  // Don't forget the last annotation
  if (currentAnnotation?.gxp_id) {
    annotations.push({
      gxp_id: currentAnnotation.gxp_id,
      type: currentAnnotation.type || 'TC',
      title: currentAnnotation.title,
      description: currentAnnotation.description,
      traces: currentAnnotation.traces,
      risk: currentAnnotation.risk,
      file: filePath,
      line: currentAnnotation.line || 0,
    } as GxpAnnotation);
  }

  return annotations;
}

export async function scanDirectory(baseDir: string): Promise<GxpAnnotation[]> {
  const patterns = [
    '**/*.ts',
    '**/*.js',
    '**/*.tsx',
    '**/*.jsx',
    '**/*.spec.ts',
    '**/*.test.ts',
  ];

  const annotations: GxpAnnotation[] = [];

  for (const pattern of patterns) {
    const files = await glob(pattern, {
      cwd: baseDir,
      ignore: ['node_modules/**', 'dist/**', 'build/**'],
    });

    for (const file of files) {
      const fullPath = join(baseDir, file);
      const fileAnnotations = extractAnnotationsFromFile(fullPath);
      annotations.push(...fileAnnotations);
    }
  }

  return annotations;
}
