import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import ProductCard from '../components/ProductCard';
import BlockchainStatusBadge from '../components/BlockchainStatusBadge';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import {
  CubeIcon,
  ArrowsRightLeftIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ShieldCheckIcon,
  QrCodeIcon,
  ArrowTopRightOnSquareIcon,
  DocumentDuplicateIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const OwnerDashboardPage = () => {
  const { user } = useAuth();

  const [products, setProducts] = useState([]);
  const [transfers, setTransfers] = useState({ incoming: [], outgoing: [] });
  const [loading, setLoading] = useState(true);
  const [transferActionLoadingId, setTransferActionLoadingId] = useState(null);

  useEffect(() => {
    fetchOwnerData();
  }, []);

  const fetchOwnerData = async () => {
    try {
      setLoading(true);
      // Fetch products and transfers
      const [prodRes, transRes] = await Promise.allSettled([
        api.get('/products/my').catch(() => api.get('/products')),
        api.get('/transfers/my').catch(() => api.get('/transfers')),
      ]);

      if (prodRes.status === 'fulfilled') {
        const pData = prodRes.value.data;
        const list = Array.isArray(pData) ? pData : pData.products || [];
        // Filter by user if returned list is global
        const myProds = list.filter((p) => {
          if (!user) return true;
          const ownerId = typeof p.currentOwner === 'object' ? p.currentOwner?._id : p.currentOwner;
          return ownerId === user._id || ownerId === user.id || p.ownerEmail === user.email;
        });
        setProducts(myProds.length > 0 ? myProds : list);
      }

      if (transRes.status === 'fulfilled') {
        const tData = transRes.value.data;
        if (tData.incoming && tData.outgoing) {
          setTransfers({ incoming: tData.incoming, outgoing: tData.outgoing });
        } else if (Array.isArray(tData)) {
          // Categorize into incoming / outgoing
          const currentUserId = user?._id || user?.id;
          const incoming = tData.filter(
            (t) =>
              (t.toOwner?._id === currentUserId || t.toOwner === currentUserId || t.toEmail === user?.email) &&
              t.status === 'pending'
          );
          const outgoing = tData.filter(
            (t) =>
              (t.fromOwner?._id === currentUserId || t.fromOwner === currentUserId) &&
              t.status === 'pending'
          );
          setTransfers({ incoming, outgoing });
        } else if (tData.transfers) {
          const list = tData.transfers;
          const currentUserId = user?._id || user?.id;
          const incoming = list.filter(
            (t) =>
              (t.toOwner?._id === currentUserId || t.toOwner === currentUserId || t.toEmail === user?.email) &&
              t.status === 'pending'
          );
          const outgoing = list.filter(
            (t) =>
              (t.fromOwner?._id === currentUserId || t.fromOwner === currentUserId) &&
              t.status === 'pending'
          );
          setTransfers({ incoming, outgoing });
        }
      }
    } catch (err) {
      console.warn('Error loading owner data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptTransfer = async (transferId, prodId) => {
    try {
      setTransferActionLoadingId(transferId);
      await api.put(`/transfers/${transferId}/accept`).catch(() =>
        api.post(`/transfers/${transferId}/accept`)
      );
      toast.success(`Ownership transfer accepted for product ${prodId}!`);
      fetchOwnerData();
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Failed to accept transfer';
      toast.error(msg);
    } finally {
      setTransferActionLoadingId(null);
    }
  };

  const handleCancelTransfer = async (transferId, prodId) => {
    if (!window.confirm(`Are you sure you want to cancel the transfer for ${prodId}?`)) {
      return;
    }
    try {
      setTransferActionLoadingId(transferId);
      await api.put(`/transfers/${transferId}/cancel`).catch(() =>
        api.post(`/transfers/${transferId}/cancel`)
      );
      toast.success(`Transfer cancelled for product ${prodId}`);
      fetchOwnerData();
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Failed to cancel transfer';
      toast.error(msg);
    } finally {
      setTransferActionLoadingId(null);
    }
  };

  return (
    <DashboardLayout
      title="Hardware Assets & Custody"
      subtitle="View verified ownership, inspect passport history, and safely transfer device custody on-chain"
    >
      {/* 1. INCOMING PENDING TRANSFERS ALERT */}
      {transfers.incoming.length > 0 && (
        <div className="mb-8 card bg-yellow-950/30 border border-yellow-600/60 p-5 animate-pulse">
          <div className="flex items-center gap-2 mb-3 text-yellow-400">
            <ClockIcon className="w-5 h-5 shrink-0" />
            <h3 className="text-base font-bold">Incoming Ownership Transfers ({transfers.incoming.length})</h3>
          </div>
          <p className="text-xs text-gray-300 mb-4">
            Another user has initiated a blockchain ownership transfer to your account. Accept custody to confirm ownership on the smart contract.
          </p>

          <div className="space-y-3">
            {transfers.incoming.map((t) => {
              const isActionLoading = transferActionLoadingId === t._id;
              const sender = t.fromOwner?.name || t.fromOwner?.email || 'Previous Owner';
              const pId = t.productId;

              return (
                <div
                  key={t._id}
                  className="bg-navy-900/90 p-4 rounded-xl border border-yellow-700/50 flex flex-wrap items-center justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs font-bold text-cyan-300 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                        {pId}
                      </span>
                      <span className="badge-pending">Pending Acceptance</span>
                    </div>
                    <p className="text-xs text-gray-300">
                      Initiated by: <span className="font-semibold text-white">{sender}</span> &bull; Date:{' '}
                      {new Date(t.initiatedAt || t.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      to={`/passport/${pId}`}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-secondary text-xs py-2 px-3 flex items-center gap-1"
                    >
                      <QrCodeIcon className="w-4 h-4" />
                      <span>Passport</span>
                    </Link>
                    <button
                      type="button"
                      disabled={isActionLoading}
                      onClick={() => handleAcceptTransfer(t._id, pId)}
                      className="btn-primary text-xs py-2 px-4 flex items-center gap-1 font-bold"
                    >
                      {isActionLoading ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <CheckCircleIcon className="w-4 h-4" />
                          <span>Accept Ownership</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. OUTGOING PENDING TRANSFERS */}
      {transfers.outgoing.length > 0 && (
        <div className="mb-8 card bg-navy-800/80 border border-navy-700 p-5">
          <div className="flex items-center gap-2 mb-3 text-cyan-400">
            <ArrowsRightLeftIcon className="w-5 h-5 shrink-0" />
            <h3 className="text-base font-bold text-white">
              Outgoing Ownership Transfers ({transfers.outgoing.length})
            </h3>
          </div>
          <p className="text-xs text-gray-400 mb-4">
            Transfers you initiated awaiting confirmation from the recipient.
          </p>

          <div className="space-y-3">
            {transfers.outgoing.map((t) => {
              const isActionLoading = transferActionLoadingId === t._id;
              const recipient = t.toEmail || t.toOwner?.email || 'Recipient';
              const pId = t.productId;

              return (
                <div
                  key={t._id}
                  className="bg-navy-900/90 p-4 rounded-xl border border-navy-700 flex flex-wrap items-center justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs font-bold text-cyan-300 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                        {pId}
                      </span>
                      <BlockchainStatusBadge status="pending" />
                    </div>
                    <p className="text-xs text-gray-300">
                      Sent to: <span className="font-semibold text-white">{recipient}</span> &bull; Awaiting acceptance
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={isActionLoading}
                      onClick={() => handleCancelTransfer(t._id, pId)}
                      className="btn-danger text-xs py-2 px-3 flex items-center gap-1 font-semibold"
                    >
                      {isActionLoading ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <XCircleIcon className="w-4 h-4" />
                          <span>Cancel Transfer</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. MY PRODUCTS SECTION */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <CubeIcon className="w-6 h-6 text-cyan-400" />
            <span>My Registered Devices</span>
          </h2>
          <p className="text-xs text-gray-400">
            Hardware items currently bound to your custody in the RepairChain registry
          </p>
        </div>
        <span className="text-xs font-mono bg-navy-800 border border-navy-700 px-3 py-1.5 rounded-lg text-gray-300">
          Total: {products.length} {products.length === 1 ? 'Device' : 'Devices'}
        </span>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card h-64 bg-navy-800/50 animate-pulse" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="card p-12 text-center text-gray-400 border border-navy-700">
          <CubeIcon className="w-12 h-12 mx-auto mb-3 opacity-40 text-cyan-400" />
          <h3 className="text-lg font-bold text-white mb-1">No Hardware Products Owned</h3>
          <p className="text-xs text-gray-400 max-w-md mx-auto mb-6 leading-relaxed">
            You currently have no registered devices linked to your account. When an administrator registers a product with your email or an owner transfers a device to you, it will appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <ProductCard
              key={product._id || product.productId}
              product={product}
              showTransfer={true}
            />
          ))}
        </div>
      )}
    </DashboardLayout>
  );
};

export default OwnerDashboardPage;
