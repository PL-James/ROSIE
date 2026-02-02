import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, CheckCircle, AlertTriangle, ArrowRight, RefreshCw } from 'lucide-react';
import { api, type DashboardData, type AuditEntry } from '../api';
import { Timeline } from '../components/Timeline';

function StatCard({
  label,
  value,
  subtext,
  icon: Icon,
  color,
}: {
  label: string;
  value: number | string;
  subtext?: string;
  icon: typeof FileText;
  color: string;
}) {
  return (
    <div className="card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-rosie-text-muted text-sm uppercase tracking-wider">{label}</p>
          <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
          {subtext && <p className="text-rosie-text-muted text-sm mt-1">{subtext}</p>}
        </div>
        <div className={`p-3 rounded-lg bg-rosie-surface-light ${color}`}>
          <Icon size={24} />
        </div>
      </div>
    </div>
  );
}

export function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [dashboardData, auditData] = await Promise.all([
        api.getDashboard(),
        api.getAudit(10),
      ]);
      setData(dashboardData);
      setAudit(auditData.entries);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, []);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner w-8 h-8" />
      </div>
    );
  }

  if (error) {
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

  const stats = data?.stats || { total: 0, approved: 0, pending: 0, rejected: 0 };
  const manifest = data?.manifest;
  const approvalRate = stats.total > 0 ? Math.round((stats.approved / stats.total) * 100) : 0;
  const isReleaseReady = stats.pending === 0 && stats.rejected === 0 && stats.total > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-rosie-text">Dashboard</h1>
          {manifest && (
            <p className="text-rosie-text-muted mt-1">
              {manifest.product_code} v{manifest.version}
            </p>
          )}
        </div>
        <button onClick={fetchData} className="btn btn-ghost">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          label="Requirements"
          value={stats.total}
          subtext="total"
          icon={FileText}
          color="text-rosie-cyan"
        />
        <StatCard
          label="Approved"
          value={`${stats.approved}/${stats.total}`}
          subtext={`${approvalRate}%`}
          icon={CheckCircle}
          color="text-rosie-green"
        />
        <StatCard
          label="Release"
          value={isReleaseReady ? 'READY' : 'BLOCKED'}
          subtext={isReleaseReady ? 'All gates passed' : `${stats.pending} pending`}
          icon={AlertTriangle}
          color={isReleaseReady ? 'text-rosie-green' : 'text-rosie-red'}
        />
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link to="/graph" className="card card-hover group">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-rosie-text font-medium">View Trace Graph</h3>
              <p className="text-rosie-text-muted text-sm mt-1">
                Interactive DAG visualization of requirements
              </p>
            </div>
            <ArrowRight
              size={20}
              className="text-rosie-text-muted group-hover:text-rosie-cyan transition-colors"
            />
          </div>
        </Link>

        <Link to="/approvals" className="card card-hover group">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-rosie-text font-medium">Pending Approvals</h3>
              <p className="text-rosie-text-muted text-sm mt-1">
                {stats.pending} items waiting for review
              </p>
            </div>
            <ArrowRight
              size={20}
              className="text-rosie-text-muted group-hover:text-rosie-cyan transition-colors"
            />
          </div>
        </Link>
      </div>

      {/* Activity Timeline */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-rosie-text">Latest Activity</h2>
          <Link to="/audit" className="text-rosie-cyan text-sm hover:underline">
            View all
          </Link>
        </div>
        <Timeline entries={audit} limit={5} />
      </div>

      {/* Empty State */}
      {!data?.hasData && (
        <div className="card text-center py-12">
          <div className="text-rosie-text-muted mb-4">
            <FileText size={48} className="mx-auto opacity-50" />
          </div>
          <h3 className="text-lg font-medium text-rosie-text mb-2">No Data Yet</h3>
          <p className="text-rosie-text-muted text-sm mb-4">
            Run the following command to sync your first manifest:
          </p>
          <code className="bg-rosie-surface-light px-4 py-2 rounded-lg text-rosie-cyan text-sm">
            cd example-app && npx rosie sync --sor-url http://localhost:3000
          </code>
        </div>
      )}
    </div>
  );
}
