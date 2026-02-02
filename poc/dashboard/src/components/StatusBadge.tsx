import { CheckCircle, Clock, XCircle, AlertTriangle } from 'lucide-react';

interface StatusBadgeProps {
  status: 'Approved' | 'Pending' | 'Rejected' | 'passed' | 'failed' | 'skipped' | 'blocked' | 'ready';
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

const statusConfig = {
  Approved: {
    label: 'Approved',
    color: 'bg-rosie-green/20 text-rosie-green border-rosie-green/30',
    icon: CheckCircle,
  },
  Pending: {
    label: 'Pending',
    color: 'bg-rosie-yellow/20 text-rosie-yellow border-rosie-yellow/30',
    icon: Clock,
  },
  Rejected: {
    label: 'Rejected',
    color: 'bg-rosie-red/20 text-rosie-red border-rosie-red/30',
    icon: XCircle,
  },
  passed: {
    label: 'Passed',
    color: 'bg-rosie-green/20 text-rosie-green border-rosie-green/30',
    icon: CheckCircle,
  },
  failed: {
    label: 'Failed',
    color: 'bg-rosie-red/20 text-rosie-red border-rosie-red/30',
    icon: XCircle,
  },
  skipped: {
    label: 'Skipped',
    color: 'bg-rosie-text-muted/20 text-rosie-text-muted border-rosie-text-muted/30',
    icon: AlertTriangle,
  },
  blocked: {
    label: 'Blocked',
    color: 'bg-rosie-red/20 text-rosie-red border-rosie-red/30',
    icon: XCircle,
  },
  ready: {
    label: 'Ready',
    color: 'bg-rosie-green/20 text-rosie-green border-rosie-green/30',
    icon: CheckCircle,
  },
};

const sizeConfig = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-2.5 py-1',
  lg: 'text-base px-3 py-1.5',
};

const iconSizeConfig = {
  sm: 12,
  md: 14,
  lg: 16,
};

export function StatusBadge({ status, size = 'md', showIcon = true }: StatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-medium ${config.color} ${sizeConfig[size]}`}
    >
      {showIcon && <Icon size={iconSizeConfig[size]} />}
      {config.label}
    </span>
  );
}
