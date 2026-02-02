import { useState, useEffect } from 'react';
import { RefreshCw, X, Download, Maximize2 } from 'lucide-react';
import { api, type Node, type Edge } from '../api';
import { GraphView } from '../components/GraphView';
import { StatusBadge } from '../components/StatusBadge';
import { NodeCard } from '../components/NodeCard';

export function TraceGraphPage() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await api.getNodes();
      setNodes(data.nodes);
      setEdges(data.edges);
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

  const handleApprove = async (node: Node) => {
    try {
      await api.approveNode(node.id);
      fetchData();
      setSelectedNode(null);
    } catch (err) {
      console.error('Failed to approve:', err);
    }
  };

  const handleReject = async (node: Node) => {
    const reason = prompt('Reason for rejection:');
    if (reason) {
      try {
        await api.rejectNode(node.id, reason);
        fetchData();
        setSelectedNode(null);
      } catch (err) {
        console.error('Failed to reject:', err);
      }
    }
  };

  const handleNodeClick = (node: Node) => {
    setSelectedNode(node);
  };

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
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-rosie-text">Traceability Graph</h1>
          <p className="text-rosie-text-muted mt-1">
            {nodes.length} nodes, {edges.length} edges
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchData} className="btn btn-ghost">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Graph Container */}
      <div className="flex-1 card p-0 overflow-hidden relative">
        {loading && nodes.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="spinner w-8 h-8" />
          </div>
        ) : (
          <GraphView
            nodes={nodes}
            edges={edges}
            onNodeClick={handleNodeClick}
          />
        )}

        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-rosie-surface/90 backdrop-blur border border-rosie-border rounded-lg p-3">
          <p className="text-xs text-rosie-text-muted mb-2">Legend</p>
          <div className="flex gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded border-2 border-rosie-green" />
              <span className="text-rosie-text-muted">Approved</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded border-2 border-rosie-yellow" />
              <span className="text-rosie-text-muted">Pending</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded border-2 border-rosie-red" />
              <span className="text-rosie-text-muted">Rejected</span>
            </div>
          </div>
        </div>
      </div>

      {/* Node Detail Panel */}
      {selectedNode && (
        <div className="fixed inset-y-0 right-0 w-96 bg-rosie-surface border-l border-rosie-border p-6 overflow-y-auto z-50">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-medium text-rosie-text">Node Details</h2>
            <button
              onClick={() => setSelectedNode(null)}
              className="p-1 hover:bg-rosie-surface-light rounded"
            >
              <X size={20} className="text-rosie-text-muted" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-rosie-text-muted text-xs uppercase tracking-wider mb-1">ID</p>
              <p className="font-mono text-rosie-cyan">{selectedNode.gxp_id}</p>
            </div>

            <div>
              <p className="text-rosie-text-muted text-xs uppercase tracking-wider mb-1">Type</p>
              <p className="text-rosie-text">{selectedNode.type}</p>
            </div>

            <div>
              <p className="text-rosie-text-muted text-xs uppercase tracking-wider mb-1">Status</p>
              <StatusBadge status={selectedNode.status} />
            </div>

            {selectedNode.title && (
              <div>
                <p className="text-rosie-text-muted text-xs uppercase tracking-wider mb-1">Title</p>
                <p className="text-rosie-text">{selectedNode.title}</p>
              </div>
            )}

            {selectedNode.description && (
              <div>
                <p className="text-rosie-text-muted text-xs uppercase tracking-wider mb-1">Description</p>
                <p className="text-rosie-text text-sm">{selectedNode.description}</p>
              </div>
            )}

            {selectedNode.risk && (
              <div>
                <p className="text-rosie-text-muted text-xs uppercase tracking-wider mb-1">Risk Level</p>
                <p className={
                  selectedNode.risk === 'High' ? 'text-rosie-red' :
                  selectedNode.risk === 'Medium' ? 'text-rosie-yellow' :
                  'text-rosie-green'
                }>{selectedNode.risk}</p>
              </div>
            )}

            {selectedNode.approved_by && (
              <div>
                <p className="text-rosie-text-muted text-xs uppercase tracking-wider mb-1">
                  {selectedNode.status === 'Approved' ? 'Approved By' : 'Reviewed By'}
                </p>
                <p className="text-rosie-text">{selectedNode.approved_by}</p>
                {selectedNode.approved_at && (
                  <p className="text-rosie-text-muted text-xs mt-1">
                    {new Date(selectedNode.approved_at).toLocaleString()}
                  </p>
                )}
              </div>
            )}

            {/* Actions */}
            {selectedNode.status === 'Pending' && (
              <div className="pt-4 border-t border-rosie-border space-y-2">
                <button
                  onClick={() => handleApprove(selectedNode)}
                  className="btn btn-success w-full"
                >
                  Approve
                </button>
                <button
                  onClick={() => handleReject(selectedNode)}
                  className="btn btn-ghost w-full"
                >
                  Reject with Comment
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
