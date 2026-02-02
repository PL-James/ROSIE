import { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle, XCircle, Copy, Download, Shield, AlertTriangle } from 'lucide-react';
import { api, type ReleaseReadiness, type DashboardData } from '../api';

export function ReleasePage() {
  const [data, setData] = useState<ReleaseReadiness | null>(null);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const dashboardData = await api.getDashboard();
      setDashboard(dashboardData);

      if (dashboardData.manifest?.commit_sha) {
        const releaseData = await api.getReleaseReadiness(dashboardData.manifest.commit_sha);
        setData(releaseData);
      }
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const copyToken = async () => {
    if (data?.rrt?.token) {
      await navigator.clipboard.writeText(data.rrt.token);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const downloadToken = () => {
    if (data?.rrt) {
      const content = {
        token: data.rrt.token,
        product_code: data.rrt.product_code,
        version: data.rrt.version,
        commit_sha: data.rrt.commit_sha,
        issued_at: data.rrt.issued_at,
        expires_at: data.rrt.expires_at,
      };
      const blob = new Blob([JSON.stringify(content, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rrt-${data.rrt.product_code}-${data.rrt.version}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner w-8 h-8" />
      </div>
    );
  }

  if (!dashboard?.manifest) {
    return (
      <div className="card text-center py-12">
        <Shield size={48} className="mx-auto text-rosie-text-muted opacity-50 mb-4" />
        <h3 className="text-lg font-medium text-rosie-text mb-2">No Manifest Found</h3>
        <p className="text-rosie-text-muted text-sm mb-4">
          Sync a manifest first to check release readiness.
        </p>
        <code className="bg-rosie-surface-light px-4 py-2 rounded-lg text-rosie-cyan text-sm">
          cd example-app && npx rosie sync --sor-url http://localhost:3000
        </code>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-rosie-text">Release Readiness</h1>
          <p className="text-rosie-text-muted mt-1">
            Commit: <code className="text-rosie-cyan">{dashboard.manifest.commit_sha}</code>
          </p>
        </div>
        <button onClick={fetchData} className="btn btn-ghost">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Status Banner */}
      <div className={`card ${data?.is_ready ? 'glow-green' : 'glow-red'}`}>
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 ${
              data?.is_ready
                ? 'bg-rosie-green/20 border-2 border-rosie-green'
                : 'bg-rosie-red/20 border-2 border-rosie-red'
            }`}>
              {data?.is_ready ? (
                <CheckCircle size={48} className="text-rosie-green" />
              ) : (
                <XCircle size={48} className="text-rosie-red" />
              )}
            </div>
            <h2 className={`text-2xl font-bold ${data?.is_ready ? 'text-rosie-green' : 'text-rosie-red'}`}>
              {data?.is_ready ? 'APPROVED FOR RELEASE' : 'BLOCKED'}
            </h2>
            <p className="text-rosie-text-muted mt-2">
              {data?.is_ready
                ? 'All gates passed. RRT issued.'
                : `${data?.blocking_issues.length || 0} blocking issue${(data?.blocking_issues.length || 0) !== 1 ? 's' : ''}`}
            </p>
          </div>
        </div>
      </div>

      {/* Gate Conditions */}
      <div className="card">
        <h3 className="text-lg font-medium text-rosie-text mb-4">Gate Conditions</h3>
        <div className="space-y-3">
          {data?.conditions.map((condition, idx) => (
            <div
              key={idx}
              className={`flex items-center justify-between p-3 rounded-lg ${
                condition.passed ? 'bg-rosie-green/10' : 'bg-rosie-red/10'
              }`}
            >
              <div className="flex items-center gap-3">
                {condition.passed ? (
                  <CheckCircle size={20} className="text-rosie-green" />
                ) : (
                  <XCircle size={20} className="text-rosie-red" />
                )}
                <span className="text-rosie-text">{condition.name}</span>
              </div>
              <span className="text-rosie-text-muted text-sm">{condition.details}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Blocking Issues */}
      {data && !data.is_ready && data.blocking_issues.length > 0 && (
        <div className="card border-rosie-red/30">
          <h3 className="text-lg font-medium text-rosie-red mb-4 flex items-center gap-2">
            <AlertTriangle size={20} />
            Blocking Issues
          </h3>
          <ul className="space-y-2">
            {data.blocking_issues.map((issue, idx) => (
              <li key={idx} className="flex items-start gap-2 text-rosie-text">
                <XCircle size={16} className="text-rosie-red mt-0.5 flex-shrink-0" />
                {issue}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* RRT Token */}
      {data?.rrt && (
        <div className="card border-rosie-green/30">
          <h3 className="text-lg font-medium text-rosie-green mb-4 flex items-center gap-2">
            <Shield size={20} />
            Release Readiness Token
          </h3>

          <div className="bg-rosie-bg rounded-lg p-4 mb-4">
            <div className="flex items-start gap-2">
              <code className="flex-1 text-rosie-cyan text-sm font-mono break-all">
                {data.rrt.token}
              </code>
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={copyToken} className="btn btn-ghost flex-1">
              <Copy size={16} className="mr-2" />
              {copied ? 'Copied!' : 'Copy'}
            </button>
            <button onClick={downloadToken} className="btn btn-ghost flex-1">
              <Download size={16} className="mr-2" />
              Download
            </button>
          </div>

          <div className="mt-4 pt-4 border-t border-rosie-border text-sm text-rosie-text-muted">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs uppercase tracking-wider mb-1">Product</p>
                <p className="text-rosie-text">
                  {data.rrt.product_code} v{data.rrt.version}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider mb-1">Commit</p>
                <code className="text-rosie-cyan text-sm">{data.rrt.commit_sha.substring(0, 7)}</code>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider mb-1">Issued</p>
                <p className="text-rosie-text">{new Date(data.rrt.issued_at).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider mb-1">Expires</p>
                <p className="text-rosie-text">{new Date(data.rrt.expires_at).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manifest Hash */}
      {data?.manifest_hash && (
        <div className="text-center text-rosie-text-muted text-xs">
          Manifest Hash: <code className="text-rosie-cyan">{data.manifest_hash}</code>
        </div>
      )}
    </div>
  );
}
