import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import LoadingSpinner from '../components/LoadingSpinner';
import BlockchainStatusBadge from '../components/BlockchainStatusBadge';
import api from '../api/axios';
import {
  ArrowsRightLeftIcon,
  CheckCircleIcon,
  DocumentDuplicateIcon,
  EnvelopeIcon,
  ArrowLeftIcon,
  SparklesIcon,
  ExclamationCircleIcon,
  ShieldExclamationIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const TransferPage = () => {
  const { productId } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toEmail, setToEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [transferResult, setTransferResult] = useState(null);

  useEffect(() => {
    fetchProduct();
  }, [productId]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/products/${encodeURIComponent(productId)}`);
      setProduct(res.data.product || res.data);
    } catch (err) {
      toast.error('Failed to load product details');
    } finally {
      setLoading(false);
    }
  };

  const handleTransfer = async (e) => {
    e.preventDefault();
    if (!toEmail.trim()) {
      toast.error("Please enter the recipient's email address");
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.post('/transfers/initiate', {
        productId,
        toEmail: toEmail.trim(),
        notes: notes.trim(),
      }).catch(() =>
        api.post('/transfers', {
          productId,
          toEmail: toEmail.trim(),
          notes: notes.trim(),
        })
      );

      const data = res.data.transfer || res.data;
      setTransferResult(data);
      toast.success('Ownership transfer initiated on blockchain!');
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        'Failed to initiate transfer. Ensure recipient has an active account.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const copyToClipboard = (text, label) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied!`);
  };

  if (loading) {
    return (
      <DashboardLayout title="Transfer Device Ownership">
        <LoadingSpinner message="Loading device metadata..." />
      </DashboardLayout>
    );
  }

  if (!product) {
    return (
      <DashboardLayout title="Device Not Found">
        <div className="card text-center p-12">
          <ExclamationCircleIcon className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-white mb-2">Product Not Found</h2>
          <p className="text-xs text-gray-400 mb-6">Could not load asset {productId}.</p>
          <Link to="/owner" className="btn-secondary text-xs py-2 px-4">
            Back to My Devices
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Transfer Device Custody"
      subtitle="Initiate an on-chain ownership handover to another registered user"
    >
      <div className="max-w-2xl mx-auto space-y-6">
        <Link
          to="/owner"
          className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-white"
        >
          <ArrowLeftIcon className="w-3.5 h-3.5" />
          <span>Back to My Products</span>
        </Link>

        {/* Success / Pending State */}
        {transferResult && (
          <div className="card bg-navy-800 border border-emerald-500/50 p-6 animate-fadeIn">
            <div className="flex items-start gap-3">
              <div className="p-3 bg-emerald-950/80 rounded-xl border border-emerald-700/60 text-emerald-400">
                <CheckCircleIcon className="w-8 h-8" />
              </div>
              <div className="flex-1">
                <span className="badge-pending mb-2">Transfer Pending</span>
                <h3 className="text-lg font-bold text-white">Transfer Initiated Successfully</h3>
                <p className="text-xs text-gray-300 mt-1">
                  Device custody will officially transfer to{' '}
                  <span className="font-semibold text-cyan-300">{toEmail}</span> once they accept the transfer in their dashboard.
                </p>

                {transferResult.initTxHash && (
                  <div className="mt-4 bg-navy-900/90 p-3 rounded-lg border border-navy-700 text-xs">
                    <span className="text-gray-400 block text-[10px] uppercase font-semibold mb-1">
                      Initiation Transaction Hash
                    </span>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-cyan-300 break-all select-all">
                        {transferResult.initTxHash}
                      </span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(transferResult.initTxHash, 'Tx Hash')}
                        className="text-cyan-400 hover:text-cyan-300 p-1 shrink-0"
                        title="Copy Tx Hash"
                      >
                        <DocumentDuplicateIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                <div className="mt-5 flex items-center gap-3">
                  <Link to="/owner" className="btn-primary text-xs py-2 px-4 font-semibold">
                    Return to My Products
                  </Link>
                  <Link
                    to={`/passport/${productId}`}
                    className="btn-secondary text-xs py-2 px-3 text-cyan-300"
                  >
                    View Passport
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Product Summary Card */}
        <div className="card p-5 border border-navy-700">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-xs font-bold text-cyan-300 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                  {product.productId}
                </span>
                <BlockchainStatusBadge status={product.blockchainStatus} />
              </div>
              <h3 className="text-lg font-bold text-white">{product.name}</h3>
              <p className="text-xs text-gray-300">
                {product.brand} &bull; Model: {product.model || 'Standard'} &bull; Serial:{' '}
                <span className="font-mono text-gray-200">{product.serialNumber}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Transfer Form (Only if not already transferred) */}
        {!transferResult && (
          <div className="card p-6 sm:p-8">
            <div className="flex items-center gap-2 pb-3 mb-6 border-b border-navy-700">
              <ArrowsRightLeftIcon className="w-5 h-5 text-cyan-400" />
              <div>
                <h3 className="text-base font-bold text-white">Recipient Information</h3>
                <p className="text-xs text-gray-400">
                  Specify the account that will receive custody of this hardware
                </p>
              </div>
            </div>

            <form onSubmit={handleTransfer} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                  Recipient Account Email *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <EnvelopeIcon className="w-5 h-5" />
                  </div>
                  <input
                    type="email"
                    required
                    value={toEmail}
                    onChange={(e) => setToEmail(e.target.value)}
                    placeholder="recipient@example.com"
                    className="input pl-10"
                  />
                </div>
                <p className="text-[11px] text-gray-400 mt-1.5 leading-relaxed">
                  The recipient must have an active RepairChain account. They will be notified to accept custody on-chain.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                  Transfer Notes / Memo (Optional)
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Sold via secondary marketplace, included accessories..."
                  className="input resize-none"
                />
              </div>

              {/* Warning Notice */}
              <div className="p-3.5 rounded-xl bg-navy-900/80 border border-amber-600/40 text-xs text-amber-300 flex items-start gap-2.5">
                <ShieldExclamationIcon className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-semibold mb-0.5">Custody Transition Notice:</strong>
                  Once accepted by the recipient, you will no longer hold administrative ownership rights over this hardware passport on the smart contract.
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <Link to="/owner" className="btn-secondary text-xs py-2 px-4">
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary text-xs py-2.5 px-6 font-bold flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Initiating on Blockchain...</span>
                    </>
                  ) : (
                    <>
                      <SparklesIcon className="w-4 h-4" />
                      <span>Initiate Transfer</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default TransferPage;
