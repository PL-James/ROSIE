import { FileSync, CheckCircle, XCircle, Upload, Key, RotateCcw } from 'lucide-react';
import type { AuditEntry } from '../api';

interface TimelineProps {
  entries: AuditEntry[];
  limit?: number;
}

const actionConfig: Record<string, { icon: typeof FileSync; color: string; label: string }> = {
  MANIFEST_SYNC: { icon: FileSync, color: 'text-rosie-cyan', label: 'Manifest Sync' },
  APPROVAL: { icon: CheckCircle, color: 'text-rosie-green', label: 'Approval' },
  REJECTION: { icon: XCircle, color: 'text-rosie-red', label: 'Rejection' },
  EVIDENCE_UPLOAD: { icon: Upload, color: 'text-rosie-purple', label: 'Evidence Upload' },
  RRT_ISSUED: { icon: Key, color: 'text-rosie-green', label: 'RRT Issued' },
};

function formatRelativeTime(timestamp: string): string {
  const now = new Date();
  const then = new Date(timestamp);
  const diff = now.getTime() - then.getTime();

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  return `${days} day${days > 1 ? 's' : ''} ago`;
}

export function Timeline({ entries, limit }: TimelineProps) {
  const displayEntries = limit ? entries.slice(0, limit) : entries;

  if (displayEntries.length === 0) {
    return (
      <div className="text-rosie-text-muted text-sm text-center py-8">
        No activity yet
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {displayEntries.map((entry) => {
        const config = actionConfig[entry.action] || {
          icon: RotateCcw,
          color: 'text-rosie-text-muted',
          label: entry.action,
        };
        const Icon = config.icon;

        return (
          <div
            key={entry.id}
            className="flex items-start gap-3 py-2 px-2 rounded-lg hover:bg-rosie-surface-light transition-colors"
          >
            <div className={`p-1.5 rounded-lg bg-rosie-surface ${config.color}`}>
              <Icon size={14} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-rosie-text font-medium">{config.label}</span>
                <span className="text-rosie-text-muted text-xs">
                  {formatRelativeTime(entry.timestamp)}
                </span>
              </div>
              {entry.details && (
                <p className="text-rosie-text-muted text-xs mt-0.5 truncate">
                  {entry.details}
                </p>
              )}
              {entry.user_id && (
                <p className="text-rosie-text-muted text-xs mt-0.5">
                  by {entry.user_id}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
