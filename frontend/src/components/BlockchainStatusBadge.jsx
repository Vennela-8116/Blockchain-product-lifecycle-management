import React from 'react';
import {
  CheckCircleIcon,
  ClockIcon,
  ExclamationCircleIcon,
  MinusCircleIcon,
} from '@heroicons/react/24/solid';

const BlockchainStatusBadge = ({ status = 'not_submitted', showLabel = true, className = '' }) => {
  const normalized = (status || 'not_submitted').toLowerCase();

  switch (normalized) {
    case 'confirmed':
      return (
        <span className={`badge-confirmed ${className}`} title="Confirmed on blockchain">
          <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          {showLabel && <span>Confirmed</span>}
        </span>
      );
    case 'pending':
      return (
        <span className={`badge-pending ${className}`} title="Transaction pending on blockchain">
          <ClockIcon className="w-3.5 h-3.5 text-yellow-400 shrink-0 animate-spin" />
          {showLabel && <span>Pending</span>}
        </span>
      );
    case 'failed':
      return (
        <span className={`badge-failed ${className}`} title="Blockchain transaction failed">
          <ExclamationCircleIcon className="w-3.5 h-3.5 text-red-400 shrink-0" />
          {showLabel && <span>Failed</span>}
        </span>
      );
    case 'not_submitted':
    default:
      return (
        <span className={`badge-notsubmitted ${className}`} title="Not submitted to blockchain">
          <MinusCircleIcon className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          {showLabel && <span>Not Submitted</span>}
        </span>
      );
  }
};

export default BlockchainStatusBadge;
