import { useState, useEffect } from 'react';
import { RefreshCw, Download, Filter, Hash } from 'lucide-react';
import { api, type AuditEntry } from '../api';
import { Timeline } from '../components/Timeline';

export function AuditLogPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await api.getAudit(100);
      setEntries(data.entries);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const filteredEntries = filter
    ? entries.filter(e =>
        e.action.toLowerCase().includes(filter.toLowerCase()) ||
        e.details?.toLowerCase().includes(filter.toLowerCase()) ||
        e.user_id?.toLowerCase().includes(filter.toLowerCase())
      )
    : entries;

  const exportAuditLog = () => {
    const content = entries.map(e => ({
      timestamp: e.timestamp,
      action: e.action,
      user: e.user_id,
      details: e.details,
      hash: e.payload_hash,
    }));

    const blob = new Blob([JSON.stringify(content, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-log-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading && entries.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner w-8 h-8" />
      </div>
    );
  }

  if (error && entries.length === 0) {
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
          <h1 className="text-2xl font-bold text-rosie-text">Audit Log</h1>
          <p className="text-rosie-text-muted mt-1">
            Immutable record of all system actions
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchData} className="btn btn-ghost">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          <button onClick={exportAuditLog} className="btn btn-ghost">
            <Download size={16} className="mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Filter */}
      <div className="card">
        <div className="flex items-center gap-3">
          <Filter size={16} className="text-rosie-text-muted" />
          <input
            type="text"
            placeholder="Filter by action, user, or details..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-rosie-text placeholder-rosie-text-muted"
          />
          {filter && (
            <button
              onClick={() => setFilter('')}
              className="text-rosie-text-muted hover:text-rosie-text text-sm"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Entries Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-rosie-border">
                <th className="text-left py-3 px-4 text-rosie-text-muted text-xs uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="text-left py-3 px-4 text-rosie-text-muted text-xs uppercase tracking-wider">
                  Action
                </th>
                <th className="text-left py-3 px-4 text-rosie-text-muted text-xs uppercase tracking-wider">
                  User
                </th>
                <th className="text-left py-3 px-4 text-rosie-text-muted text-xs uppercase tracking-wider">
                  Details
                </th>
                <th className="text-left py-3 px-4 text-rosie-text-muted text-xs uppercase tracking-wider">
                  Hash
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-rosie-text-muted">
                    {filter ? 'No matching entries' : 'No audit entries yet'}
                  </td>
                </tr>
              ) : (
                filteredEntries.map((entry) => (
                  <tr
                    key={entry.id}
                    className="border-b border-rosie-border/50 hover:bg-rosie-surface-light transition-colors"
                  >
                    <td className="py-3 px-4 text-sm text-rosie-text-muted font-mono whitespace-nowrap">
                      {new Date(entry.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-sm font-medium ${
                        entry.action === 'APPROVAL' ? 'text-rosie-green' :
                        entry.action === 'REJECTION' ? 'text-rosie-red' :
                        entry.action === 'MANIFEST_SYNC' ? 'text-rosie-cyan' :
                        entry.action === 'EVIDENCE_UPLOAD' ? 'text-rosie-purple' :
                        entry.action === 'RRT_ISSUED' ? 'text-rosie-green' :
                        'text-rosie-text'
                      }`}>
                        {entry.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-rosie-text-muted">
                      {entry.user_id || '-'}
                    </td>
                    <td className="py-3 px-4 text-sm text-rosie-text max-w-xs truncate">
                      {entry.details || '-'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1 text-rosie-text-muted">
                        <Hash size={12} />
                        <code className="text-xs font-mono">
                          {entry.payload_hash.substring(0, 16)}...
                        </code>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Hash Verification Note */}
      <div className="text-center text-rosie-text-muted text-xs">
        All entries are cryptographically hashed to ensure immutability.
        <br />
        Export the audit log for external verification.
      </div>
    </div>
  );
}
