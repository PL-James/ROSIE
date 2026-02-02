import { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle2 } from 'lucide-react';
import { api, type Node } from '../api';
import { NodeCard } from '../components/NodeCard';

export function ApprovalsPage() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [approving, setApproving] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await api.getNodes();
      setNodes(data.nodes);
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

  const pendingNodes = nodes.filter(n => n.status === 'Pending');
  const approvedNodes = nodes.filter(n => n.status === 'Approved');
  const rejectedNodes = nodes.filter(n => n.status === 'Rejected');

  const handleApprove = async (node: Node) => {
    try {
      setApproving(node.id);
      await api.approveNode(node.id);
      fetchData();
    } catch (err) {
      console.error('Failed to approve:', err);
    } finally {
      setApproving(null);
    }
  };

  const handleReject = async (node: Node) => {
    const reason = prompt('Reason for rejection:');
    if (reason) {
      try {
        setApproving(node.id);
        await api.rejectNode(node.id, reason);
        fetchData();
      } catch (err) {
        console.error('Failed to reject:', err);
      } finally {
        setApproving(null);
      }
    }
  };

  const handleApproveAll = async () => {
    if (!confirm(`Approve all ${pendingNodes.length} pending items?`)) return;
    try {
      setApproving('all');
      await api.approveAll();
      fetchData();
    } catch (err) {
      console.error('Failed to approve all:', err);
    } finally {
      setApproving(null);
    }
  };

  if (loading && nodes.length === 0) {
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-rosie-text">Pending Approvals</h1>
          <p className="text-rosie-text-muted mt-1">
            {pendingNodes.length} pending, {approvedNodes.length} approved, {rejectedNodes.length} rejected
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchData} className="btn btn-ghost">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          {pendingNodes.length > 0 && (
            <button
              onClick={handleApproveAll}
              className="btn btn-success"
              disabled={approving === 'all'}
            >
              <CheckCircle2 size={16} className="mr-2" />
              Approve All ({pendingNodes.length})
            </button>
          )}
        </div>
      </div>

      {/* Pending Section */}
      {pendingNodes.length > 0 ? (
        <div className="space-y-4">
          <h2 className="text-lg font-medium text-rosie-yellow flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rosie-yellow" />
            Pending Review
          </h2>
          <div className="space-y-3">
            {pendingNodes.map(node => (
              <NodeCard
                key={node.id}
                node={node}
                onApprove={() => handleApprove(node)}
                onReject={() => handleReject(node)}
                showActions={approving !== node.id}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="card text-center py-12">
          <CheckCircle2 size={48} className="mx-auto text-rosie-green opacity-50 mb-4" />
          <h3 className="text-lg font-medium text-rosie-text mb-2">All Caught Up!</h3>
          <p className="text-rosie-text-muted text-sm">
            No pending approvals. All requirements have been reviewed.
          </p>
        </div>
      )}

      {/* Approved Section */}
      {approvedNodes.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-medium text-rosie-green flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rosie-green" />
            Approved ({approvedNodes.length})
          </h2>
          <div className="space-y-3">
            {approvedNodes.map(node => (
              <NodeCard
                key={node.id}
                node={node}
                showActions={false}
              />
            ))}
          </div>
        </div>
      )}

      {/* Rejected Section */}
      {rejectedNodes.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-medium text-rosie-red flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rosie-red" />
            Rejected ({rejectedNodes.length})
          </h2>
          <div className="space-y-3">
            {rejectedNodes.map(node => (
              <NodeCard
                key={node.id}
                node={node}
                showActions={false}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
