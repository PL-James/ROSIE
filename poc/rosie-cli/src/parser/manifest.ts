import { readFileSync, existsSync } from 'fs';
import matter from 'gray-matter';

export interface ProductManifest {
  product_name: string;
  version: string;
  product_code: string;
  id_schema: string;
  sync: {
    mode: string;
    system_of_record_id: string;
  };
  gxp_metadata: {
    gamp_category: number;
    risk_impact: string;
  };
}

export function parseManifest(filePath: string): ProductManifest | null {
  if (!existsSync(filePath)) {
    return null;
  }

  const content = readFileSync(filePath, 'utf-8');
  const { data } = matter(content);

  return {
    product_name: data.product_name || 'Unknown',
    version: data.version || '0.0.0',
    product_code: data.product_code || 'UNK',
    id_schema: data.id_schema || 'URS | FRS | DS | TC',
    sync: data.sync || { mode: 'repo-first', system_of_record_id: 'default' },
    gxp_metadata: data.gxp_metadata || { gamp_category: 5, risk_impact: 'Medium' },
  };
}

export function parseSpecFile(filePath: string): {
  gxp_id: string;
  type: string;
  title: string;
  description: string;
  traces?: string[];
  risk?: string;
} | null {
  if (!existsSync(filePath)) {
    return null;
  }

  const content = readFileSync(filePath, 'utf-8');
  const { data, content: body } = matter(content);

  // Extract title from first heading
  const titleMatch = body.match(/^#\s+(.+)$/m);
  const title = titleMatch ? titleMatch[1] : data.title || 'Untitled';

  // Extract description from body
  const lines = body.split('\n').filter(l => l.trim() && !l.startsWith('#'));
  const description = lines.slice(0, 3).join(' ').trim();

  return {
    gxp_id: data.gxp_id || data['gxp-id'] || 'UNKNOWN',
    type: data.type || 'URS',
    title,
    description: description.substring(0, 200),
    traces: data.traces || data['traces-to'] || [],
    risk: data.risk || 'Medium',
  };
}
