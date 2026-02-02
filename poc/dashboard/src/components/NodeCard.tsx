import { FileText, Code, TestTube, Beaker, ChevronRight } from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import type { Node } from '../api';

interface NodeCardProps {
  node: Node;
  onApprove?: () => void;
  onReject?: () => void;
  onClick?: () => void;
  showActions?: boolean;
}

const typeConfig: Record<string, { label: string; icon: typeof FileText; color: string }> = {
  URS: { label: 'User Requirement', icon: FileText, color: 'text-rosie-cyan' },
  FRS: { label: 'Functional Requirement', icon: Code, color: 'text-rosie-purple' },
  DS: { label: 'Design Specification', icon: Code, color: 'text-rosie-yellow' },
  OQ: { label: 'Operational Qualification', icon: TestTube, color: 'text-rosie-green' },
  PQ: { label: 'Performance Qualification', icon: Beaker, color: 'text-rosie-green' },
  TC: { label: 'Test Case', icon: TestTube, color: 'text-rosie-green' },
};

export function NodeCard({ node, onApprove, onReject, onClick, showActions = true }: NodeCardProps) {
  const config = typeConfig[node.type] || typeConfig.URS;
  const Icon = config.icon;

  return (
    <div
      className={`card card-hover ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className={`p-2 rounded-lg bg-rosie-surface-light ${config.color}`}>
            <Icon size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-rosie-cyan font-medium">{node.gxp_id}</span>
              <span className="text-rosie-text-muted text-xs">{config.label}</span>
            </div>
            {node.title && (
              <h3 className="text-rosie-text font-medium truncate">{node.title}</h3>
            )}
            {node.description && (
              <p className="text-rosie-text-muted text-sm mt-1 line-clamp-2">
                {node.description}
              </p>
            )}
            {node.risk && (
              <div className="mt-2 text-xs text-rosie-text-muted">
                Risk: <span className={
                  node.risk === 'High' ? 'text-rosie-red' :
                  node.risk === 'Medium' ? 'text-rosie-yellow' :
                  'text-rosie-green'
                }>{node.risk}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <StatusBadge status={node.status} size="sm" />

          {showActions && node.status === 'Pending' && (
            <div className="flex gap-2 mt-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onApprove?.();
                }}
                className="btn btn-success text-xs py-1 px-2"
              >
                Approve
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onReject?.();
                }}
                className="btn btn-ghost text-xs py-1 px-2"
              >
                Reject
              </button>
            </div>
          )}

          {onClick && (
            <ChevronRight size={16} className="text-rosie-text-muted" />
          )}
        </div>
      </div>

      {node.approved_by && (
        <div className="mt-3 pt-3 border-t border-rosie-border text-xs text-rosie-text-muted">
          {node.status === 'Approved' ? 'Approved' : 'Reviewed'} by {node.approved_by}
          {node.approved_at && (
            <span className="ml-2">
              on {new Date(node.approved_at).toLocaleString()}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
