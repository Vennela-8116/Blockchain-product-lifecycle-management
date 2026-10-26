import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import BlockchainStatusBadge from '../components/BlockchainStatusBadge';
import SearchBar from '../components/SearchBar';
import api from '../api/axios';
import {
  WrenchScrewdriverIcon,
  CheckCircleIcon,
  PlusIcon,
  TrashIcon,
  CpuChipIcon,
  DocumentDuplicateIcon,
  ArrowTopRightOnSquareIcon,
  SparklesIcon,
  CurrencyDollarIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const ServiceCenterDashboardPage = () => {
  // Product Search State
  const [searching, setSearching] = useState(false);
  const [foundProduct, setFoundProduct] = useState(null);
  const [searchError, setSearchError] = useState('');

  // Event Recording Form State
  const [submitting, setSubmitting] = useState(false);
  const [submittedTx, setSubmittedTx] = useState(null);

  const initialFormState = {
    eventType: 'REPAIR',
    title: '',
    description: '',
    serviceDate: new Date().toISOString().split('T')[0],
    technicianName: '',
    laborCost: '',
    partsCost: '',
    currency: 'USD',
    notes: '',
    parts: [],
  };

  const [formData, setFormData] = useState(initialFormState);

  // Recent Events by this Service Center
  const [recentEvents, setRecentEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);

  useEffect(() => {
    fetchMyEvents();
  }, []);

  const fetchMyEvents = async () => {
    try {
      setLoadingEvents(true);
      // Fetch events submitted by me or global events list
      const res = await api.get('/events');
      const list = Array.isArray(res.data) ? res.data : res.data.events || [];
      setRecentEvents(list);
    } catch (err) {
      console.warn('Could not fetch events', err);
    } finally {
      setLoadingEvents(false);
    }
  };

  const handleSearchProduct = async (query) => {
    if (!query) {
      setFoundProduct(null);
      setSearchError('');
      return;
    }

    try {
      setSearching(true);
      setSearchError('');
      setSubmittedTx(null);
      const res = await api.get(`/products/${encodeURIComponent(query)}`);
      const prod = res.data.product || res.data;
      if (prod && prod.productId) {
        setFoundProduct(prod);
        toast.success(`Found: ${prod.name} (${prod.productId})`);
      } else {
        setFoundProduct(null);
        setSearchError(`No product found matching "${query}"`);
        toast.error(`No product found matching "${query}"`);
      }
    } catch (err) {
      setFoundProduct(null);
      const msg = err.response?.data?.error || `Product "${query}" not found in registry`;
      setSearchError(msg);
      toast.error(msg);
    } finally {
      setSearching(false);
    }
  };

  // Add Part Row
  const handleAddPart = () => {
    setFormData((prev) => ({
      ...prev,
      parts: [
        ...prev.parts,
        { name: '', partNumber: '', manufacturer: '', condition: 'new' },
      ],
    }));
  };

  // Remove Part Row
  const handleRemovePart = (index) => {
    setFormData((prev) => ({
      ...prev,
      parts: prev.parts.filter((_, idx) => idx !== index),
    }));
  };

  // Update Part Field
  const handlePartChange = (index, field, value) => {
    setFormData((prev) => {
      const updated = [...prev.parts];
      updated[index][field] = value;
      return { ...prev, parts: updated };
    });
  };

  const handleSubmitEvent = async (e) => {
    e.preventDefault();
    if (!foundProduct) {
      toast.error('Please search and select a product first');
      return;
    }

    if (!formData.title.trim() || !formData.description.trim()) {
      toast.error('Event title and description are required');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        productId: foundProduct.productId,
        eventType: formData.eventType,
        title: formData.title.trim(),
        description: formData.description.trim(),
        serviceDate: formData.serviceDate,
        technicianName: formData.technicianName.trim(),
        laborCost: Number(formData.laborCost) || 0,
        partsCost: Number(formData.partsCost) || 0,
        currency: formData.currency || 'USD',
        notes: formData.notes.trim(),
        parts: formData.parts.filter((p) => p.name.trim() !== ''),
      };

      const res = await api.post('/events', payload);
      const eventData = res.data.event || res.data;
      setSubmittedTx(eventData);
      toast.success('Lifecycle event recorded and hashed to blockchain!');

      // Reset form
      setFormData(initialFormState);
      fetchMyEvents();
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        'Failed to record lifecycle event. Verify service center authorization.';
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

  return (
    <DashboardLayout
      title="Service Center Operations"
      subtitle="Verify hardware identities and append cryptographically signed repair & maintenance records"
    >
      {/* 1. PRODUCT SEARCH SECTION */}
      <div className="card p-6 mb-8 border border-navy-700">
        <div className="flex items-center gap-2 mb-3">
          <WrenchScrewdriverIcon className="w-5 h-5 text-cyan-400" />
          <h2 className="text-base font-bold text-white">Find Hardware to Service</h2>
        </div>
        <p className="text-xs text-gray-400 mb-4">
          Scan or search by Product ID (e.g. RC-00001) or hardware serial number to load the passport
        </p>

        <SearchBar
          onSearch={handleSearchProduct}
          placeholder="Search Product ID (RC-00001) or Serial Number..."
          buttonText="Lookup Product"
          size="lg"
        />

        {searching && (
          <div className="mt-4 text-xs text-cyan-400 animate-pulse flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
            <span>Querying blockchain passport registry...</span>
          </div>
        )}

        {searchError && (
          <div className="mt-4 p-3 rounded-lg bg-red-950/60 border border-red-800/80 text-xs text-red-300 flex items-center gap-2">
            <ExclamationCircleIcon className="w-4 h-4 text-red-400 shrink-0" />
            <span>{searchError}</span>
          </div>
        )}

        {/* Found Product Summary Card */}
        {foundProduct && (
          <div className="mt-5 p-4 rounded-xl bg-navy-900/90 border border-cyan-500/40 flex flex-wrap items-center justify-between gap-4 animate-fadeIn">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-cyan-950/80 rounded-xl border border-cyan-800/60 text-cyan-400">
                <CpuChipIcon className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-mono text-xs font-bold text-cyan-300 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                    {foundProduct.productId}
                  </span>
                  <BlockchainStatusBadge status={foundProduct.blockchainStatus} />
                </div>
                <h4 className="text-base font-bold text-white">{foundProduct.name}</h4>
                <p className="text-xs text-gray-300">
                  {foundProduct.brand} &bull; Serial:{' '}
                  <span className="font-mono text-gray-200">{foundProduct.serialNumber}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link
                to={`/passport/${foundProduct.productId}`}
                target="_blank"
                rel="noreferrer"
                className="btn-secondary text-xs py-2 px-3 flex items-center gap-1.5"
              >
                <span>View Full Passport</span>
                <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* 2. SUBMISSION SUCCESS BANNER */}
      {submittedTx && (
        <div className="card mb-8 p-6 bg-emerald-950/40 border border-emerald-500/50 animate-fadeIn">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <CheckCircleIcon className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-base font-bold text-white">Lifecycle Event Successfully Committed</h3>
                <p className="text-xs text-gray-300 mt-0.5">
                  "{submittedTx.title}" has been appended to the passport and hashed on the blockchain ledger.
                </p>
              </div>
            </div>
            <Link
              to={`/passport/${submittedTx.productId}`}
              className="btn-primary text-xs py-2 px-3 flex items-center gap-1"
            >
              <span>View On Passport</span>
              <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
            </Link>
          </div>

          {submittedTx.blockchainTxHash && (
            <div className="mt-3 bg-navy-900/90 p-2.5 rounded-lg border border-navy-700/80 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-gray-400">Tx Hash:</span>
                <span className="font-mono text-cyan-300 break-all">{submittedTx.blockchainTxHash}</span>
              </div>
              <button
                type="button"
                onClick={() => copyToClipboard(submittedTx.blockchainTxHash, 'Tx Hash')}
                className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
              >
                <DocumentDuplicateIcon className="w-3.5 h-3.5" />
                <span>Copy</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* 3. RECORD EVENT FORM (Appears after product is found) */}
      {foundProduct && (
        <div className="card p-6 mb-8 border border-cyan-500/30 animate-fadeIn">
          <div className="flex items-center gap-2 pb-3 mb-5 border-b border-navy-700">
            <SparklesIcon className="w-5 h-5 text-cyan-400" />
            <div>
              <h3 className="text-base font-bold text-white">Record Lifecycle Event</h3>
              <p className="text-xs text-gray-400">
                Target Product: <span className="text-cyan-300 font-mono font-semibold">{foundProduct.productId}</span> ({foundProduct.name})
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmitEvent} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Event Type */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1">
                  Event Type *
                </label>
                <select
                  value={formData.eventType}
                  onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
                  className="input cursor-pointer"
                >
                  <option value="REPAIR" className="bg-navy-800 text-white">REPAIR (Fix malfunctioning hardware)</option>
                  <option value="MAINTENANCE" className="bg-navy-800 text-white">MAINTENANCE (Routine servicing)</option>
                  <option value="INSPECTION" className="bg-navy-800 text-white">INSPECTION (Quality & diagnostic check)</option>
                  <option value="COMPONENT_REPLACEMENT" className="bg-navy-800 text-white">COMPONENT REPLACEMENT (Swap parts)</option>
                  <option value="WARRANTY_CLAIM" className="bg-navy-800 text-white">WARRANTY CLAIM (Covered warranty fix)</option>
                  <option value="OTHER" className="bg-navy-800 text-white">OTHER (Custom lifecycle action)</option>
                </select>
              </div>

              {/* Service Date */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1">
                  Service Date *
                </label>
                <input
                  type="date"
                  required
                  value={formData.serviceDate}
                  onChange={(e) => setFormData({ ...formData, serviceDate: e.target.value })}
                  className="input"
                />
              </div>

              {/* Title */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1">
                  Event Title / Summary *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Battery Replacement & Thermal Paste Application"
                  className="input"
                />
              </div>

              {/* Description */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1">
                  Detailed Service Description *
                </label>
                <textarea
                  required
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe diagnosing steps, test results, issues identified, and service resolution..."
                  className="input resize-none"
                />
              </div>

              {/* Technician Name */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1">
                  Lead Technician Name
                </label>
                <input
                  type="text"
                  value={formData.technicianName}
                  onChange={(e) => setFormData({ ...formData, technicianName: e.target.value })}
                  placeholder="e.g. Alex Rivera, Senior Tech"
                  className="input"
                />
              </div>

              {/* Financials: Labor & Parts */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1">
                    Labor Cost ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.laborCost}
                    onChange={(e) => setFormData({ ...formData, laborCost: e.target.value })}
                    placeholder="0.00"
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1">
                    Parts Cost ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.partsCost}
                    onChange={(e) => setFormData({ ...formData, partsCost: e.target.value })}
                    placeholder="0.00"
                    className="input"
                  />
                </div>
              </div>
            </div>

            {/* Replaced Parts Array Section */}
            <div className="pt-4 border-t border-navy-700/80">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-300">
                    Replaced Hardware Parts
                  </h4>
                  <p className="text-[11px] text-gray-400">
                    Itemize components installed during this procedure
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddPart}
                  className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1 text-cyan-300"
                >
                  <PlusIcon className="w-3.5 h-3.5" />
                  <span>Add Component</span>
                </button>
              </div>

              {formData.parts.length === 0 ? (
                <div className="p-4 bg-navy-900/50 rounded-lg border border-navy-700/60 text-xs text-gray-400 text-center">
                  No replacement parts itemized. Click "Add Component" if hardware pieces were installed.
                </div>
              ) : (
                <div className="space-y-3">
                  {formData.parts.map((part, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-navy-900/70 rounded-lg border border-navy-700 grid grid-cols-1 sm:grid-cols-4 gap-2 items-center"
                    >
                      <div>
                        <input
                          type="text"
                          required
                          placeholder="Part Name (e.g. Battery)"
                          value={part.name}
                          onChange={(e) => handlePartChange(idx, 'name', e.target.value)}
                          className="input text-xs py-1.5"
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          placeholder="Part # / SKU"
                          value={part.partNumber}
                          onChange={(e) => handlePartChange(idx, 'partNumber', e.target.value)}
                          className="input text-xs py-1.5 font-mono"
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          placeholder="Manufacturer"
                          value={part.manufacturer}
                          onChange={(e) => handlePartChange(idx, 'manufacturer', e.target.value)}
                          className="input text-xs py-1.5"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          value={part.condition}
                          onChange={(e) => handlePartChange(idx, 'condition', e.target.value)}
                          className="input text-xs py-1.5 cursor-pointer flex-1"
                        >
                          <option value="new">New OEM</option>
                          <option value="refurbished">Refurbished</option>
                          <option value="oem">Certified OEM</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => handleRemovePart(idx)}
                          className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-950/60 rounded"
                          title="Remove part"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submit Action */}
            <div className="pt-4 border-t border-navy-700 flex justify-end gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary text-sm py-2.5 px-6 font-bold flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Signing & Hashing Event on Blockchain...</span>
                  </>
                ) : (
                  <>
                    <SparklesIcon className="w-4 h-4" />
                    <span>Commit Event to Blockchain</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 4. RECENT EVENTS TABLE */}
      <div className="card p-0 overflow-hidden">
        <div className="p-5 border-b border-navy-700 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-white">Recent Service Logs</h3>
            <p className="text-xs text-gray-400">Audit trail of submitted maintenance events</p>
          </div>
          <button
            type="button"
            onClick={fetchMyEvents}
            className="text-xs text-cyan-400 hover:underline"
          >
            Refresh
          </button>
        </div>

        {loadingEvents ? (
          <div className="p-8 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-navy-700/50 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : recentEvents.length === 0 ? (
          <div className="p-10 text-center text-gray-400 text-sm">
            <WrenchScrewdriverIcon className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p>No service logs submitted yet. Search a product above to record an event.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="text-[10px] uppercase font-bold text-gray-400 bg-navy-900/60 border-b border-navy-700">
                <tr>
                  <th className="py-3 px-4">Event Title</th>
                  <th className="py-3 px-4">Product ID</th>
                  <th className="py-3 px-4">Event Type</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Blockchain Status</th>
                  <th className="py-3 px-4 text-right">Passport</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-700/60">
                {recentEvents.map((ev) => (
                  <tr key={ev._id} className="hover:bg-navy-700/30">
                    <td className="py-3.5 px-4 font-semibold text-white max-w-xs truncate">
                      {ev.title}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-cyan-300">
                      <Link to={`/passport/${ev.productId}`} className="hover:underline">
                        {ev.productId}
                      </Link>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-navy-900 border border-navy-700 text-gray-300 uppercase">
                        {ev.eventType}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-gray-400">
                      {ev.serviceDate ? new Date(ev.serviceDate).toLocaleDateString() : '—'}
                    </td>
                    <td className="py-3.5 px-4">
                      <BlockchainStatusBadge status={ev.blockchainStatus} />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        to={`/passport/${ev.productId}`}
                        className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-semibold"
                      >
                        <span>Passport</span>
                        <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ServiceCenterDashboardPage;
