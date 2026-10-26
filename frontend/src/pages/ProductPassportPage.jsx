import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import BlockchainStatusBadge from '../components/BlockchainStatusBadge';
import TimelineEvent from '../components/TimelineEvent';
import LoadingSpinner from '../components/LoadingSpinner';
import api from '../api/axios';
import {
  ShieldCheckIcon,
  CpuChipIcon,
  DocumentDuplicateIcon,
  CalendarDaysIcon,
  UserIcon,
  ArrowsRightLeftIcon,
  CheckBadgeIcon,
  ExclamationTriangleIcon,
  QrCodeIcon,
  ArrowLeftIcon,
  SparklesIcon,
  LockClosedIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const ProductPassportPage = () => {
  const { productId } = useParams();

  const [product, setProduct] = useState(null);
  const [events, setEvents] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetchPassportData();
  }, [productId]);

  const fetchPassportData = async () => {
    if (!productId) return;
    setLoading(true);
    setNotFound(false);

    try {
      // 1. Fetch Product
      const prodRes = await api.get(`/products/${encodeURIComponent(productId)}`);
      const prodData = prodRes.data.product || prodRes.data;
      setProduct(prodData);

      // 2. Fetch Events & Transfers in parallel
      const actualId = prodData.productId || productId;

      const [eventsRes, transfersRes] = await Promise.allSettled([
        api.get(`/events/product/${encodeURIComponent(actualId)}`).catch(() =>
          api.get(`/events?productId=${encodeURIComponent(actualId)}`)
        ),
        api.get(`/transfers/product/${encodeURIComponent(actualId)}`).catch(() =>
          api.get(`/transfers?productId=${encodeURIComponent(actualId)}`)
        ),
      ]);

      if (eventsRes.status === 'fulfilled') {
        const eData = eventsRes.value.data;
        const eList = Array.isArray(eData) ? eData : eData.events || [];
        // Sort chronologically ascending or descending (standard passport shows newest on top or chronological)
        setEvents(
          [...eList].sort(
            (a, b) => new Date(b.serviceDate || b.createdAt) - new Date(a.serviceDate || a.createdAt)
          )
        );
      }

      if (transfersRes.status === 'fulfilled') {
        const tData = transfersRes.value.data;
        const tList = Array.isArray(tData) ? tData : tData.transfers || [];
        setTransfers(tList);
      }
    } catch (err) {
      console.warn('Passport lookup failed:', err);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text, label) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-navy-900 text-white flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <LoadingSpinner size="lg" message={`Retrieving blockchain passport for ${productId}...`} />
        </div>
      </div>
    );
  }

  if (notFound || !product) {
    return (
      <div className="min-h-screen bg-navy-900 text-white flex flex-col">
        <Navbar />
        <main className="flex-1 max-w-2xl mx-auto px-4 py-20 text-center flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-2xl bg-red-950/80 border border-red-700/60 flex items-center justify-center text-red-400 mb-6">
            <ExclamationTriangleIcon className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">
            Passport Not Found
          </h1>
          <p className="text-gray-400 text-sm max-w-md mb-8">
            No registered hardware passport could be located for query:
            <span className="block font-mono text-cyan-400 font-bold mt-1 text-base">{productId}</span>
          </p>
          <Link to="/" className="btn-primary py-2.5 px-6 text-sm flex items-center gap-2">
            <ArrowLeftIcon className="w-4 h-4" />
            <span>Search Another Product</span>
          </Link>
        </main>
      </div>
    );
  }

  // Current Owner Display Name (Never expose owner email publicly)
  const currentOwnerName =
    typeof product.currentOwner === 'object' && product.currentOwner !== null
      ? product.currentOwner.name || 'Verified Device Custodian'
      : 'Verified Device Custodian';

  const contractAddress =
    import.meta.env.VITE_CONTRACT_ADDRESS || '0x5FbDB2315678afecb367f032d93F642f64180aa3';

  return (
    <div className="min-h-screen bg-navy-900 text-white flex flex-col selection:bg-cyan-500 selection:text-navy-900">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between text-xs text-gray-400">
          <Link to="/" className="flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 font-medium">
            <ArrowLeftIcon className="w-3.5 h-3.5" />
            <span>Back to Explorer</span>
          </Link>
          <span className="font-mono bg-navy-800 px-2.5 py-1 rounded border border-navy-700 text-gray-300">
            Passport: {product.productId}
          </span>
        </div>

        {/* 1. PRODUCT HEADER HERO CARD */}
        <div className="card-glass relative overflow-hidden border border-navy-700/80 p-6 sm:p-8">
          <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-cyan-500/15 via-violet-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div>
              <div className="flex flex-wrap items-center gap-2.5 mb-2">
                <span className="font-mono text-sm font-extrabold tracking-wider text-cyan-300 bg-cyan-950/80 px-3 py-1 rounded-lg border border-cyan-700/60 shadow-sm shadow-cyan-500/20">
                  {product.productId}
                </span>
                <span className="text-xs uppercase font-semibold tracking-wider text-violet-300 bg-violet-950/60 px-2.5 py-1 rounded-lg border border-violet-800/50">
                  {product.category || 'Hardware Asset'}
                </span>
                <BlockchainStatusBadge status={product.blockchainStatus} />
              </div>

              <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                {product.name}
              </h1>

              <p className="text-sm sm:text-base text-gray-300 mt-1">
                Brand: <span className="font-semibold text-white">{product.brand}</span> &bull; Model:{' '}
                <span className="text-gray-200">{product.model || 'Standard Edition'}</span>
              </p>
            </div>

            {/* Serial & Status Pill Box */}
            <div className="bg-navy-900/90 p-4 rounded-xl border border-navy-700/80 shrink-0 min-w-[240px]">
              <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">
                Serial Number
              </div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="font-mono text-base font-bold text-white truncate" title={product.serialNumber}>
                  {product.serialNumber}
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(product.serialNumber, 'Serial Number')}
                  className="p-1 text-gray-400 hover:text-cyan-400 shrink-0"
                  title="Copy serial"
                >
                  <DocumentDuplicateIcon className="w-4 h-4" />
                </button>
              </div>

              <div className="pt-2 border-t border-navy-700/60 flex items-center justify-between text-xs">
                <span className="text-gray-400">Device Status</span>
                <span className="capitalize font-semibold text-emerald-400">{product.status || 'Active'}</span>
              </div>
            </div>
          </div>

          {product.description && (
            <p className="mt-4 pt-4 border-t border-navy-700/60 text-xs sm:text-sm text-gray-300 leading-relaxed">
              {product.description}
            </p>
          )}
        </div>

        {/* 2. BLOCKCHAIN VERIFICATION BOX */}
        <div className="card p-6 border border-cyan-500/30 bg-gradient-to-r from-navy-800/90 to-navy-900/90 shadow-xl">
          <div className="flex items-center gap-2 mb-4 text-cyan-400">
            <LockClosedIcon className="w-5 h-5" />
            <h2 className="text-base font-bold text-white">Cryptographic Verification Details</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Smart Contract Address */}
            <div className="bg-navy-950/70 p-3.5 rounded-lg border border-navy-700/70">
              <span className="text-gray-400 block text-[10px] uppercase font-semibold tracking-wider mb-1">
                Smart Contract Address
              </span>
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-violet-300 break-all select-all font-medium">
                  {contractAddress}
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(contractAddress, 'Contract Address')}
                  className="p-1 text-gray-400 hover:text-white shrink-0"
                  title="Copy address"
                >
                  <DocumentDuplicateIcon className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Registration Transaction Hash */}
            <div className="bg-navy-950/70 p-3.5 rounded-lg border border-navy-700/70">
              <span className="text-gray-400 block text-[10px] uppercase font-semibold tracking-wider mb-1">
                Asset Registration Tx Hash
              </span>
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-cyan-300 break-all select-all font-medium">
                  {product.blockchainTxHash || 'Committed on Genesis Block'}
                </span>
                {product.blockchainTxHash && (
                  <button
                    type="button"
                    onClick={() => copyToClipboard(product.blockchainTxHash, 'Registration Tx')}
                    className="p-1 text-gray-400 hover:text-white shrink-0"
                    title="Copy Tx Hash"
                  >
                    <DocumentDuplicateIcon className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 3. OWNERSHIP & PROVENANCE METADATA */}
        <div className="card p-6">
          <h2 className="text-base font-bold text-white flex items-center gap-2 mb-4">
            <UserIcon className="w-5 h-5 text-violet-400" />
            <span>Ownership & Custody Provenance</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="bg-navy-900/80 p-3.5 rounded-lg border border-navy-700">
              <span className="text-gray-400 block text-[10px] uppercase tracking-wider mb-1">
                Current Custodian
              </span>
              <span className="font-bold text-white text-sm">{currentOwnerName}</span>
              <span className="block text-[11px] text-gray-400 mt-0.5">
                (Privacy-protected identity)
              </span>
            </div>

            <div className="bg-navy-900/80 p-3.5 rounded-lg border border-navy-700">
              <span className="text-gray-400 block text-[10px] uppercase tracking-wider mb-1">
                Registration / Purchase Date
              </span>
              <span className="font-semibold text-white text-sm">
                {product.purchaseDate
                  ? new Date(product.purchaseDate).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })
                  : product.createdAt
                  ? new Date(product.createdAt).toLocaleDateString()
                  : 'N/A'}
              </span>
            </div>

            <div className="bg-navy-900/80 p-3.5 rounded-lg border border-navy-700">
              <span className="text-gray-400 block text-[10px] uppercase tracking-wider mb-1">
                Warranty Expiry
              </span>
              <span className="font-semibold text-cyan-300 text-sm">
                {product.warrantyExpiry
                  ? new Date(product.warrantyExpiry).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })
                  : 'No active manufacturer warranty specified'}
              </span>
            </div>
          </div>
        </div>

        {/* 4. CHRONOLOGICAL TIMELINE OF LIFECYCLE EVENTS */}
        <div className="card p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-6 pb-4 border-b border-navy-700">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <SparklesIcon className="w-5 h-5 text-cyan-400" />
                <span>Lifecycle & Maintenance Ledger</span>
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Cryptographic timeline of certified repair, part replacement, and diagnostic operations
              </p>
            </div>
            <span className="text-xs font-mono bg-navy-900 px-3 py-1 rounded-lg border border-navy-700 text-cyan-300">
              {events.length} {events.length === 1 ? 'Event' : 'Events'} Logged
            </span>
          </div>

          {events.length === 0 ? (
            <div className="p-8 text-center text-gray-400 bg-navy-900/40 rounded-xl border border-navy-700/60">
              <CheckBadgeIcon className="w-10 h-10 mx-auto mb-2 text-cyan-500/60" />
              <h3 className="text-sm font-bold text-white mb-1">Pristine Lifecycle Record</h3>
              <p className="text-xs text-gray-400 max-w-sm mx-auto">
                No repair or maintenance operations have been logged for this hardware yet. All future authorized services will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {events.map((event, idx) => (
                <TimelineEvent
                  key={event._id || idx}
                  event={event}
                  isLast={idx === events.length - 1}
                />
              ))}
            </div>
          )}
        </div>

        {/* 5. OWNERSHIP TRANSFER HISTORY */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-navy-700">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <ArrowsRightLeftIcon className="w-5 h-5 text-violet-400" />
                <span>Ownership Transfer History</span>
              </h2>
              <p className="text-xs text-gray-400">
                Auditable chain of custody transfers between registered owners
              </p>
            </div>
            <span className="text-xs font-mono bg-navy-900 px-2.5 py-1 rounded text-gray-300 border border-navy-700">
              {transfers.length} {transfers.length === 1 ? 'Transfer' : 'Transfers'}
            </span>
          </div>

          {transfers.length === 0 ? (
            <p className="text-xs text-gray-400 italic py-2">
              No ownership transfers have taken place. Device remains with original custodian.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="text-[10px] uppercase font-bold text-gray-400 bg-navy-900/60 border-b border-navy-700">
                  <tr>
                    <th className="py-2.5 px-3">From</th>
                    <th className="py-2.5 px-3">To</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Blockchain Tx</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy-700/60">
                  {transfers.map((t) => {
                    const fromName = t.fromOwner?.name || 'Previous Owner';
                    const toName = t.toOwner?.name || t.toEmail || 'New Custodian';
                    const txHash = t.acceptTxHash || t.initTxHash;

                    return (
                      <tr key={t._id} className="hover:bg-navy-700/30">
                        <td className="py-3 px-3 font-medium text-white">{fromName}</td>
                        <td className="py-3 px-3 font-medium text-white">{toName}</td>
                        <td className="py-3 px-3 text-gray-400">
                          {new Date(t.acceptedAt || t.initiatedAt || t.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                              t.status === 'accepted'
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                : t.status === 'pending'
                                ? 'bg-yellow-950 text-yellow-400 border border-yellow-800'
                                : 'bg-red-950 text-red-400 border border-red-800'
                            }`}
                          >
                            {t.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-mono">
                          {txHash ? (
                            <button
                              type="button"
                              onClick={() => copyToClipboard(txHash, 'Transfer Tx')}
                              className="text-cyan-400 hover:text-cyan-300 text-[11px] inline-flex items-center gap-1"
                              title="Click to copy full Tx Hash"
                            >
                              <span>{txHash.slice(0, 8)}...{txHash.slice(-6)}</span>
                              <DocumentDuplicateIcon className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <span className="text-gray-500">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 6. VERIFICATION DISCLAIMER NOTICE */}
        <div className="bg-navy-800/80 border border-navy-700 rounded-xl p-5 text-xs text-gray-400 leading-relaxed flex items-start gap-3">
          <ShieldCheckIcon className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <strong className="text-white block font-semibold mb-1">
              Cryptographic Integrity Guarantee:
            </strong>
            The RepairChain blockchain proves recorded data has not been silently altered, rolled back, or deleted after its timestamped commitment. It does not independently verify that the physical repair was genuinely performed or that physical components were not subsequently swapped offline.
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProductPassportPage;
