import React from 'react';
import { CheckCircle, AlertCircle, XCircle, Activity } from 'lucide-react';

interface StatusBadgeProps {
  status: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const styles = {
    confirmed: 'bg-green-500/10 text-green-500 border-green-500/20',
    pending: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    cancelled: 'bg-red-500/10 text-red-500 border-red-500/20',
    completed: 'bg-red-500/10 text-red-500 border-red-500/20',
    active: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  };
  
  const icons = {
    confirmed: CheckCircle,
    pending: AlertCircle,
    cancelled: XCircle,
    completed: XCircle,
    active: Activity,
  };
  
  const Icon = icons[status as keyof typeof icons] || AlertCircle;
  
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${styles[status as keyof typeof styles] || styles.pending}`} style={{ fontFamily: 'Urbanist, sans-serif' }}>
      <Icon className="w-3 h-3" />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};
