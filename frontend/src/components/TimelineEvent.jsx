import React, { useState } from 'react';
import BlockchainStatusBadge from './BlockchainStatusBadge';
import {
  WrenchScrewdriverIcon,
  ShieldCheckIcon,
  MagnifyingGlassCircleIcon,
  Cog6ToothIcon,
  DocumentCheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  UserIcon,
  CurrencyDollarIcon,
  CalendarDaysIcon,
  BuildingOffice2Icon,
  CheckBadgeIcon,
  DocumentDuplicateIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const getEventIcon = (eventType) => {
  switch (eventType?.toUpperCase()) {
    case 'REPAIR':
      return <WrenchScrewdriverIcon className="w-5 h-5 text-cyan-400" />;
    case 'MAINTENANCE':
      return <Cog6ToothIcon className="w-5 h-5 text-violet-400" />;
    case 'INSPECTION':
      return <MagnifyingGlassCircleIcon className="w-5 h-5 text-amber-400" />;
    case 'COMPONENT_REPLACEMENT':
      return <WrenchScrewdriverIcon className="w-5 h-5 text-emerald-400" />;
    case 'WARRANTY_CLAIM':
      return <ShieldCheckIcon className="w-5 h-5 text-pink-400" />;
    default:
      return <DocumentCheckIcon className="w-5 h-5 text-gray-400" />;
  }
};

const TimelineEvent = ({ event, isLast = false }) => {
  const [expanded, setExpanded] = useState(false);

  if (!event) return null;

  const {
    eventType,
    title,
    description,
    serviceDate,
    completionDate,
    serviceCenterId,
    technicianName,
    parts = [],
    laborCost = 0,
    partsCost = 0,
    currency = 'USD',
    blockchainStatus = 'pending',
    blockchainTxHash,
    blockchainBlockNumber,
    eventHash,
    notes,
  } = event;

  const serviceCenterName =
    typeof serviceCenterId === 'object' && serviceCenterId !== null
      ? serviceCenterId.name
      : typeof serviceCenterId === 'string'
      ? 'Authorized Service Partner'
      : 'Authorized Service Center';

  const totalCost = Number(laborCost || 0) + Number(partsCost || 0);

  const copyToClipboard = (text, label) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  return (
    <div className="relative pl-8 sm:pl-10 pb-8 group">
      {/* Vertical line connecting timeline nodes */}
      {!isLast && (
        <div className="absolute left-3.5 sm:left-4.5 top-9 bottom-0 w-0.5 bg-navy-700 group-hover:bg-cyan-500/30 transition-colors" />
      )}

      {/* Timeline Node Icon */}
      <div className="absolute left-0 top-1 w-8 h-8 rounded-full bg-navy-800 border-2 border-cyan-500/70 flex items-center justify-center shadow-lg shadow-cyan-500/10 group-hover:border-cyan-400 group-hover:scale-105 transition-all">
        {getEventIcon(eventType)}
      </div>

      {/* Main Event Card */}
      <div className="bg-navy-800/90 rounded-xl border border-navy-700 hover:border-navy-600 transition-all p-5 shadow-lg">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-mono tracking-wider uppercase font-semibold text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/50">
                {eventType?.replace(/_/g, ' ')}
              </span>
              <div className="flex items-center text-xs text-gray-400 gap-1">
                <CalendarDaysIcon className="w-3.5 h-3.5" />
                <span>
                  {serviceDate
                    ? new Date(serviceDate).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })
                    : 'Date unspecified'}
                </span>
              </div>
            </div>
            <h4 className="text-base sm:text-lg font-bold text-white tracking-wide">{title}</h4>
          </div>

          <div className="flex items-center gap-2">
            <BlockchainStatusBadge status={blockchainStatus} />
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-300 leading-relaxed mb-3">{description}</p>

        {/* Service Center & Quick Meta */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400 pt-2 border-t border-navy-700/60">
          <div className="flex items-center gap-1.5 text-gray-300">
            <BuildingOffice2Icon className="w-4 h-4 text-cyan-400 shrink-0" />
            <span className="font-medium">{serviceCenterName}</span>
          </div>

          {technicianName && (
            <div className="flex items-center gap-1.5">
              <UserIcon className="w-3.5 h-3.5 text-violet-400 shrink-0" />
              <span>Tech: {technicianName}</span>
            </div>
          )}

          {totalCost > 0 && (
            <div className="flex items-center gap-1 text-emerald-400 font-medium">
              <CurrencyDollarIcon className="w-4 h-4" />
              <span>
                {currency} {totalCost.toFixed(2)}
              </span>
            </div>
          )}
        </div>

        {/* Blockchain Verification Bar */}
        {blockchainStatus === 'confirmed' && (
          <div className="mt-3 bg-navy-900/80 rounded-lg p-2.5 border border-emerald-900/50 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <CheckBadgeIcon className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-xs text-emerald-300 font-medium">
                Verified on Blockchain
              </span>
              {blockchainBlockNumber && (
                <span className="text-[11px] font-mono text-gray-400 bg-navy-800 px-1.5 py-0.5 rounded">
                  Block #{blockchainBlockNumber}
                </span>
              )}
            </div>

            {blockchainTxHash && (
              <button
                type="button"
                onClick={() => copyToClipboard(blockchainTxHash, 'Transaction Hash')}
                className="text-[11px] font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 bg-navy-800 px-2 py-1 rounded border border-navy-700 transition-colors"
                title="Click to copy full transaction hash"
              >
                <span>Tx: {blockchainTxHash.slice(0, 10)}...{blockchainTxHash.slice(-8)}</span>
                <DocumentDuplicateIcon className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {/* Expand / Collapse Button */}
        <div className="mt-3 pt-2 flex justify-end">
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
          >
            <span>{expanded ? 'Hide Details' : 'View Full Details & Parts'}</span>
            {expanded ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />}
          </button>
        </div>

        {/* Expandable Details Section */}
        {expanded && (
          <div className="mt-4 pt-4 border-t border-navy-700/80 space-y-4 animate-fadeIn">
            {/* Parts replaced */}
            {parts && parts.length > 0 && (
              <div>
                <h5 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                  Replaced Components & Parts ({parts.length})
                </h5>
                <div className="overflow-x-auto rounded-lg border border-navy-700">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-navy-900/80 text-gray-400 uppercase text-[10px]">
                      <tr>
                        <th className="px-3 py-2">Part Name</th>
                        <th className="px-3 py-2">Part Number</th>
                        <th className="px-3 py-2">Manufacturer</th>
                        <th className="px-3 py-2">Condition</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-navy-700 bg-navy-800/60">
                      {parts.map((p, idx) => (
                        <tr key={idx} className="hover:bg-navy-700/40">
                          <td className="px-3 py-2 font-medium text-white">{p.name}</td>
                          <td className="px-3 py-2 font-mono text-gray-300">{p.partNumber || '—'}</td>
                          <td className="px-3 py-2 text-gray-300">{p.manufacturer || '—'}</td>
                          <td className="px-3 py-2">
                            <span className="capitalize px-2 py-0.5 text-[10px] rounded font-semibold bg-navy-700 text-cyan-300">
                              {p.condition || 'new'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Financials & Technician Details */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-navy-900/60 p-3 rounded-lg border border-navy-700/60 text-xs">
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Labor Cost</span>
                <span className="text-gray-200 font-semibold">
                  {currency} {Number(laborCost || 0).toFixed(2)}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Parts Cost</span>
                <span className="text-gray-200 font-semibold">
                  {currency} {Number(partsCost || 0).toFixed(2)}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Total Service Cost</span>
                <span className="text-emerald-400 font-bold">
                  {currency} {totalCost.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Cryptographic Event Hash & Verification */}
            {eventHash && (
              <div className="bg-navy-900/60 p-3 rounded-lg border border-navy-700/60 text-xs">
                <span className="text-gray-400 block text-[10px] uppercase mb-1">
                  Keccak256 Cryptographic Event Hash
                </span>
                <div className="flex items-center justify-between gap-2 bg-navy-950 p-2 rounded border border-navy-800">
                  <span className="font-mono text-[11px] text-violet-300 break-all select-all">
                    {eventHash}
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(eventHash, 'Event Hash')}
                    className="p-1 text-gray-400 hover:text-white shrink-0"
                    title="Copy event hash"
                  >
                    <DocumentDuplicateIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {notes && (
              <div className="bg-navy-900/40 p-3 rounded-lg border border-navy-700/40 text-xs">
                <span className="text-gray-400 block text-[10px] uppercase mb-1">Internal Notes</span>
                <p className="text-gray-300 italic">{notes}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TimelineEvent;
