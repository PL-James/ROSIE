import { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle, XCircle, AlertTriangle, Clock, Terminal } from 'lucide-react';
import { api, type Evidence, type EvidenceResult } from '../api';
import { StatusBadge } from '../components/StatusBadge';

function TestResultCard({ result }: { result: EvidenceResult }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="card card-hover">
      <div
        className="flex items-start justify-between cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start gap-3 flex-1">
          <div className={`p-2 rounded-lg bg-rosie-surface-light ${
            result.status === 'passed' ? 'text-rosie-green' :
            result.status === 'failed' ? 'text-rosie-red' :
            'text-rosie-text-muted'
          }`}>
            {result.status === 'passed' ? <CheckCircle size={20} /> :
             result.status === 'failed' ? <XCircle size={20} /> :
             <AlertTriangle size={20} />}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-rosie-cyan text-sm">{result.gxp_id}</span>
              <StatusBadge status={result.status} size="sm" showIcon={false} />
            </div>
            <h3 className="text-rosie-text font-medium">{result.name}</h3>
            {result.duration_ms && (
              <div className="flex items-center gap-1 mt-1 text-rosie-text-muted text-xs">
                <Clock size={12} />
                {result.duration_ms}ms
              </div>
            )}
          </div>
        </div>
      </div>

      {expanded && result.logs && result.logs.length > 0 && (
        <div className="mt-4 pt-4 border-t border-rosie-border">
          <div className="flex items-center gap-2 mb-2 text-rosie-text-muted text-xs">
            <Terminal size={12} />
            Logs
          </div>
          <pre className="bg-rosie-bg p-3 rounded-lg text-xs text-rosie-text-muted overflow-x-auto font-mono">
            {result.logs.join('\n')}
          </pre>
        </div>
      )}
    </div>
  );
}

export function EvidencePage() {
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await api.getEvidence();
      setEvidence(data.evidence);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading && evidence.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner w-8 h-8" />
      </div>
    );
  }

  if (error && evidence.length === 0) {
    return (
      <div className="card text-center py-8">
        <p className="text-rosie-red mb-4">{error}</p>
        <button onClick={fetchData} className="btn btn-ghost">
          <RefreshCw size={16} className="mr-2" />
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-rosie-text">Test Evidence</h1>
          <p className="text-rosie-text-muted mt-1">
            {evidence.length} execution{evidence.length !== 1 ? 's' : ''} recorded
          </p>
        </div>
        <button onClick={fetchData} className="btn btn-ghost">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {evidence.length === 0 ? (
        <div className="card text-center py-12">
          <Terminal size={48} className="mx-auto text-rosie-text-muted opacity-50 mb-4" />
          <h3 className="text-lg font-medium text-rosie-text mb-2">No Evidence Yet</h3>
          <p className="text-rosie-text-muted text-sm mb-4">
            Run tests and upload evidence using the CLI:
          </p>
          <code className="bg-rosie-surface-light px-4 py-2 rounded-lg text-rosie-cyan text-sm block">
            npm test && npx rosie evidence --file ./gxp-execution.json
          </code>
        </div>
      ) : (
        evidence.map((exec) => {
          const passed = exec.results.filter(r => r.status === 'passed').length;
          const failed = exec.results.filter(r => r.status === 'failed').length;
          const skipped = exec.results.filter(r => r.status === 'skipped').length;

          return (
            <div key={exec.id} className="space-y-4">
              {/* Execution Header */}
              <div className="card bg-rosie-surface-light">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h2 className="text-lg font-medium text-rosie-text">
                        Execution: {exec.execution_id}
                      </h2>
                      {exec.commit_sha && (
                        <code className="text-xs bg-rosie-surface px-2 py-0.5 rounded text-rosie-text-muted">
                          {exec.commit_sha.substring(0, 7)}
                        </code>
                      )}
                    </div>
                    {exec.environment && (
                      <p className="text-rosie-text-muted text-sm mb-1">
                        Environment: {exec.environment}
                      </p>
                    )}
                    {exec.executed_at && (
                      <p className="text-rosie-text-muted text-sm">
                        Executed: {new Date(exec.executed_at).toLocaleString()}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-rosie-green">{passed} passed</span>
                      {failed > 0 && <span className="text-rosie-red">{failed} failed</span>}
                      {skipped > 0 && <span className="text-rosie-text-muted">{skipped} skipped</span>}
                    </div>
                    <div className="mt-2">
                      {failed === 0 ? (
                        <StatusBadge status="passed" />
                      ) : (
                        <StatusBadge status="failed" />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Test Results */}
              <div className="space-y-3">
                {exec.results.map((result, idx) => (
                  <TestResultCard key={`${exec.id}-${idx}`} result={result} />
                ))}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
