import React from 'react';
import { Link } from 'react-router-dom';
import BlockchainStatusBadge from './BlockchainStatusBadge';
import {
  ArrowTopRightOnSquareIcon,
  ArrowsRightLeftIcon,
  CpuChipIcon,
  QrCodeIcon,
} from '@heroicons/react/24/outline';

const ProductCard = ({ product, showTransfer = false, onTransferClick }) => {
  if (!product) return null;

  const {
    productId,
    name,
    brand,
    model,
    category,
    serialNumber,
    blockchainStatus,
    blockchainTxHash,
    status = 'active',
    purchaseDate,
  } = product;

  return (
    <div className="card hover:border-cyan-500/50 transition-all duration-300 flex flex-col justify-between group relative overflow-hidden">
      {/* Top ambient highlight */}
      <div className="absolute -top-12 -right-12 w-28 h-28 bg-cyan-500/10 rounded-full blur-xl group-hover:bg-cyan-500/20 transition-all pointer-events-none" />

      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-navy-700/80 rounded-lg text-cyan-400 border border-navy-600">
              <CpuChipIcon className="w-5 h-5" />
            </span>
            <div>
              <span className="text-xs font-mono font-bold tracking-wider text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/60">
                {productId || 'N/A'}
              </span>
              <p className="text-xs text-gray-400 capitalize mt-0.5">
                {brand} &bull; {category || 'Device'}
              </p>
            </div>
          </div>
          <BlockchainStatusBadge status={blockchainStatus} />
        </div>

        <h3 className="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors line-clamp-1">
          {name}
        </h3>
        <p className="text-xs text-gray-400 mb-4 line-clamp-1">
          Model: <span className="text-gray-300 font-medium">{model || 'Standard'}</span>
        </p>

        <div className="grid grid-cols-2 gap-2 text-xs bg-navy-900/60 p-2.5 rounded-lg border border-navy-700/60 mb-4">
          <div>
            <span className="text-gray-400 block text-[10px] uppercase tracking-wider">Serial</span>
            <span className="font-mono text-gray-200 truncate block" title={serialNumber}>
              {serialNumber || '—'}
            </span>
          </div>
          <div>
            <span className="text-gray-400 block text-[10px] uppercase tracking-wider">Status</span>
            <span
              className={`inline-block font-semibold capitalize ${
                status === 'active' ? 'text-emerald-400' : 'text-amber-400'
              }`}
            >
              {status}
            </span>
          </div>
          {purchaseDate && (
            <div className="col-span-2 pt-1 border-t border-navy-700/40">
              <span className="text-gray-400 block text-[10px] uppercase tracking-wider">Purchased</span>
              <span className="text-gray-300">
                {new Date(purchaseDate).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="pt-2 border-t border-navy-700/80 flex items-center gap-2">
        <Link
          to={`/passport/${productId}`}
          className="flex-1 btn-secondary text-xs py-2 flex items-center justify-center gap-1.5 text-cyan-300 hover:text-white"
        >
          <QrCodeIcon className="w-4 h-4" />
          <span>Passport</span>
          <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5 opacity-60" />
        </Link>

        {showTransfer && (
          <Link
            to={`/owner/transfer/${productId}`}
            className="btn-primary text-xs py-2 px-3 flex items-center justify-center gap-1"
            title="Transfer ownership of this product"
          >
            <ArrowsRightLeftIcon className="w-3.5 h-3.5" />
            <span>Transfer</span>
          </Link>
        )}
      </div>
    </div>
  );
};

export default ProductCard;
