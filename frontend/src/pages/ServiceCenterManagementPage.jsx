import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import api from '../api/axios';
import {
  BuildingOffice2Icon,
  CheckCircleIcon,
  XCircleIcon,
  PlusIcon,
  ShieldCheckIcon,
  DocumentDuplicateIcon,
  CheckBadgeIcon,
  XMarkIcon,
  UserPlusIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const ServiceCenterManagementPage = () => {
  const [serviceCenters, setServiceCenters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // New Service Center Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    userEmail: '',
    name: '',
    address: '',
    city: '',
    walletAddress: '',
  });

  useEffect(() => {
    fetchServiceCenters();
  }, []);

  const fetchServiceCenters = async () => {
    try {
      setLoading(true);
      const res = await api.get('/service-centers');
      const list = Array.isArray(res.data) ? res.data : res.data.serviceCenters || [];
      setServiceCenters(list);
    } catch (err) {
      toast.error('Failed to load service centers');
    } finally {
      setLoading(false);
    }
  };

  const handleAuthorize = async (id, name) => {
    try {
      setActionLoadingId(id);
      const res = await api.put(`/service-centers/${id}/authorize`);
      toast.success(`${name} successfully authorized on blockchain!`);
      fetchServiceCenters();
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Authorization failed';
      toast.error(msg);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeactivate = async (id, name) => {
    if (!window.confirm(`Are you sure you want to deactivate ${name}? They will no longer be permitted to log verified repairs on-chain.`)) {
      return;
    }
    try {
      setActionLoadingId(id);
      const res = await api.put(`/service-centers/${id}/deactivate`);
      toast.success(`${name} deactivated successfully.`);
      fetchServiceCenters();
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Deactivation failed';
      toast.error(msg);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.walletAddress.trim() || !formData.userEmail.trim()) {
      toast.error('Name, User Email, and Wallet Address are required');
      return;
    }

    try {
      setFormSubmitting(true);
      const res = await api.post('/service-centers', {
        name: formData.name.trim(),
        userEmail: formData.userEmail.trim(),
        walletAddress: formData.walletAddress.trim(),
        address: formData.address.trim(),
        city: formData.city.trim(),
      });
      toast.success('Service Center registered successfully!');
      setShowAddForm(false);
      setFormData({
        userEmail: '',
        name: '',
        address: '',
        city: '',
        walletAddress: '',
      });
      fetchServiceCenters();
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        'Failed to register service center. Check user email & wallet address.';
      toast.error(msg);
    } finally {
      setFormSubmitting(false);
    }
  };

  const copyToClipboard = (text, label) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied!`);
  };

  return (
    <DashboardLayout
      title="Service Center Governance"
      subtitle="Manage cryptographic authorization of certified repair partners on the smart contract"
      action={
        <button
          type="button"
          onClick={() => setShowAddForm(!showAddForm)}
          className="btn-primary text-xs sm:text-sm py-2 px-3.5 flex items-center gap-1.5"
        >
          {showAddForm ? <XMarkIcon className="w-4 h-4" /> : <PlusIcon className="w-4 h-4" />}
          <span>{showAddForm ? 'Close Form' : 'Register Service Center'}</span>
        </button>
      }
    >
      {/* Registration Drawer / Form */}
      {showAddForm && (
        <div className="card p-6 mb-8 border border-cyan-500/50 shadow-2xl animate-fadeIn">
          <div className="flex items-center justify-between pb-3 mb-5 border-b border-navy-700">
            <div className="flex items-center gap-2 text-white">
              <UserPlusIcon className="w-5 h-5 text-cyan-400" />
              <h3 className="text-base font-bold">Register New Service Center</h3>
            </div>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-gray-400 hover:text-white"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleAddSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1">
                  Service Center Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Apex Certified Tech Hub"
                  className="input"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1">
                  Associated User Email *
                </label>
                <input
                  type="email"
                  required
                  value={formData.userEmail}
                  onChange={(e) => setFormData({ ...formData, userEmail: e.target.value })}
                  placeholder="e.g. service@repairchain.io"
                  className="input"
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  Account must be registered with role 'serviceCenter'.
                </p>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1">
                  Ethereum Wallet Address *
                </label>
                <input
                  type="text"
                  required
                  value={formData.walletAddress}
                  onChange={(e) => setFormData({ ...formData, walletAddress: e.target.value })}
                  placeholder="0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
                  className="input font-mono"
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  The wallet used to sign on-chain lifecycle event transactions.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1">
                  Physical Address
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="e.g. 100 Market St, Suite 400"
                  className="input"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1">
                  City & State
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="e.g. San Francisco, CA"
                  className="input"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="btn-secondary text-xs py-2 px-4"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={formSubmitting}
                className="btn-primary text-xs py-2 px-6 font-bold flex items-center gap-1.5"
              >
                {formSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <span>Register Center</span>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Service Centers Table */}
      <div className="card p-0 overflow-hidden">
        <div className="p-5 border-b border-navy-700 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-white">Registered Service Partners</h3>
            <p className="text-xs text-gray-400">
              Only authorized centers can submit valid hashes to the RepairChain contract
            </p>
          </div>
          <span className="text-xs font-mono bg-navy-900 px-2.5 py-1 rounded text-gray-300 border border-navy-700">
            Total: {serviceCenters.length}
          </span>
        </div>

        {loading ? (
          <div className="p-8 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-navy-700/50 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : serviceCenters.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <BuildingOffice2Icon className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <h4 className="text-base font-bold text-white mb-1">No Service Centers Registered</h4>
            <p className="text-xs text-gray-400 max-w-sm mx-auto mb-4">
              Authorize service centers so technicians can begin logging verified lifecycle events on-chain.
            </p>
            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              className="btn-primary text-xs py-2 px-4"
            >
              Add First Service Center
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="text-[10px] uppercase font-bold text-gray-400 bg-navy-900/60 border-b border-navy-700">
                <tr>
                  <th className="py-3 px-4">Center Name & Location</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Wallet Address</th>
                  <th className="py-3 px-4">On-Chain Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-700/60">
                {serviceCenters.map((sc) => {
                  const isActionLoading = actionLoadingId === sc._id;
                  const email = sc.contactEmail || sc.userId?.email || '—';

                  return (
                    <tr key={sc._id} className="hover:bg-navy-700/30">
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-white block text-sm">{sc.name}</span>
                        <span className="text-[11px] text-gray-400">
                          {sc.city || sc.address ? `${sc.city || ''} ${sc.address ? `• ${sc.address}` : ''}` : 'Location unlisted'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-gray-300">{email}</td>

                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          onClick={() => copyToClipboard(sc.walletAddress, 'Wallet Address')}
                          className="font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 text-[11px] bg-navy-900/80 px-2 py-1 rounded border border-navy-700"
                          title="Click to copy full wallet address"
                        >
                          <span>
                            {sc.walletAddress
                              ? `${sc.walletAddress.slice(0, 8)}...${sc.walletAddress.slice(-6)}`
                              : '—'}
                          </span>
                          <DocumentDuplicateIcon className="w-3.5 h-3.5 opacity-60" />
                        </button>
                      </td>

                      <td className="py-3.5 px-4">
                        {sc.isAuthorized ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-950/70 text-emerald-400 border border-emerald-700/60">
                            <CheckBadgeIcon className="w-3.5 h-3.5" />
                            <span>Authorized</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-950/70 text-red-400 border border-red-700/60">
                            <XCircleIcon className="w-3.5 h-3.5" />
                            <span>Deactivated</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        {isActionLoading ? (
                          <div className="inline-block w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                        ) : sc.isAuthorized ? (
                          <button
                            type="button"
                            onClick={() => handleDeactivate(sc._id, sc.name)}
                            className="btn-danger text-[11px] py-1.5 px-3"
                            title="Revoke authorization on-chain"
                          >
                            Deactivate
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleAuthorize(sc._id, sc.name)}
                            className="btn-primary text-[11px] py-1.5 px-3"
                            title="Grant authorization on-chain"
                          >
                            Authorize
                          </button>
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
    </DashboardLayout>
  );
};

export default ServiceCenterManagementPage;
