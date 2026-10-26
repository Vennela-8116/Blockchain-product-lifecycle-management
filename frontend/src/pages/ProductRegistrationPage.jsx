import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import BlockchainStatusBadge from '../components/BlockchainStatusBadge';
import api from '../api/axios';
import {
  CubeIcon,
  CheckCircleIcon,
  DocumentDuplicateIcon,
  ArrowTopRightOnSquareIcon,
  PlusCircleIcon,
  ExclamationCircleIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const ProductRegistrationPage = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    model: '',
    category: 'laptop',
    serialNumber: '',
    description: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    warrantyExpiry: '',
    currentOwnerEmail: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [createdProduct, setCreatedProduct] = useState(null);

  const categories = [
    { value: 'laptop', label: 'Laptop / Computer' },
    { value: 'phone', label: 'Smartphone' },
    { value: 'tablet', label: 'Tablet' },
    { value: 'appliance', label: 'Home Appliance' },
    { value: 'vehicle', label: 'Electric / Vehicle' },
    { value: 'other', label: 'Other Electronic' },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.brand.trim() || !formData.serialNumber.trim()) {
      toast.error('Name, Brand, and Serial Number are required');
      return;
    }

    if (!formData.currentOwnerEmail.trim()) {
      toast.error('Owner Email is required to bind initial custody');
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.post('/products', {
        name: formData.name.trim(),
        brand: formData.brand.trim(),
        model: formData.model.trim(),
        category: formData.category,
        serialNumber: formData.serialNumber.trim(),
        description: formData.description.trim(),
        purchaseDate: formData.purchaseDate || undefined,
        warrantyExpiry: formData.warrantyExpiry || undefined,
        currentOwnerEmail: formData.currentOwnerEmail.trim(),
      });

      const prod = res.data.product || res.data;
      setCreatedProduct(prod);
      toast.success(`Product ${prod.productId || ''} registered successfully on blockchain!`);
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        'Failed to register product. Verify owner email and serial number.';
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
      title="Register New Hardware Asset"
      subtitle="Issue a cryptographic product passport and register serial numbers to the smart contract"
    >
      <div className="max-w-4xl mx-auto">
        {/* Success Modal / Result Card */}
        {createdProduct && (
          <div className="mb-8 card bg-navy-800/90 border border-emerald-500/50 p-6 shadow-2xl relative overflow-hidden animate-fadeIn">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-3 bg-emerald-950/80 rounded-xl border border-emerald-700/60 text-emerald-400">
                  <CheckCircleIcon className="w-8 h-8" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                      ID: {createdProduct.productId}
                    </span>
                    <BlockchainStatusBadge status={createdProduct.blockchainStatus || 'confirmed'} />
                  </div>
                  <h3 className="text-xl font-bold text-white">{createdProduct.name}</h3>
                  <p className="text-xs text-gray-300 mt-1">
                    Brand: <span className="font-semibold text-white">{createdProduct.brand}</span> &bull; Serial:{' '}
                    <span className="font-mono text-cyan-300">{createdProduct.serialNumber}</span>
                  </p>
                </div>
              </div>

              <Link
                to={`/passport/${createdProduct.productId}`}
                className="btn-primary text-xs py-2 px-3.5 flex items-center gap-1.5 shrink-0"
              >
                <span>View Passport</span>
                <ArrowTopRightOnSquareIcon className="w-4 h-4" />
              </Link>
            </div>

            {/* Blockchain Transaction Hash Box */}
            {createdProduct.blockchainTxHash && (
              <div className="mt-4 pt-4 border-t border-navy-700/80 flex flex-wrap items-center justify-between gap-2 text-xs bg-navy-900/80 p-3 rounded-lg border border-navy-700/60">
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 font-medium">Blockchain Tx:</span>
                  <span className="font-mono text-cyan-300 break-all select-all">
                    {createdProduct.blockchainTxHash}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(createdProduct.blockchainTxHash, 'Tx Hash')}
                  className="text-cyan-400 hover:text-cyan-300 p-1 flex items-center gap-1 text-[11px]"
                >
                  <DocumentDuplicateIcon className="w-4 h-4" />
                  <span>Copy</span>
                </button>
              </div>
            )}

            <div className="mt-4 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setCreatedProduct(null);
                  setFormData({
                    name: '',
                    brand: '',
                    model: '',
                    category: 'laptop',
                    serialNumber: '',
                    description: '',
                    purchaseDate: new Date().toISOString().split('T')[0],
                    warrantyExpiry: '',
                    currentOwnerEmail: '',
                  });
                }}
                className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1"
              >
                <PlusCircleIcon className="w-4 h-4" />
                <span>Register Another Device</span>
              </button>
            </div>
          </div>
        )}

        {/* Registration Form */}
        <div className="card p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="border-b border-navy-700/80 pb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <CubeIcon className="w-5 h-5 text-cyan-400" />
                <span>Product Information</span>
              </h2>
              <p className="text-xs text-gray-400 mt-1">
                Enter manufacturer specs and hardware serial identity
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Product Name */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. MacBook Pro 16-inch M3"
                  className="input"
                />
              </div>

              {/* Brand */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                  Brand / Manufacturer *
                </label>
                <input
                  type="text"
                  required
                  name="brand"
                  value={formData.brand}
                  onChange={handleChange}
                  placeholder="e.g. Apple, Dell, Lenovo, Samsung"
                  className="input"
                />
              </div>

              {/* Model */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                  Model Number / Designation *
                </label>
                <input
                  type="text"
                  required
                  name="model"
                  value={formData.model}
                  onChange={handleChange}
                  placeholder="e.g. A2991 / Space Black"
                  className="input"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                  Category *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="input cursor-pointer"
                >
                  {categories.map((c) => (
                    <option key={c.value} value={c.value} className="bg-navy-800 text-white">
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Serial Number */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                  Hardware Serial Number *
                </label>
                <input
                  type="text"
                  required
                  name="serialNumber"
                  value={formData.serialNumber}
                  onChange={handleChange}
                  placeholder="e.g. C02GL3ABMD6R (Must be unique)"
                  className="input font-mono"
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  This serial number will be hashed and permanently committed to the smart contract.
                </p>
              </div>

              {/* Description */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                  Hardware Description / Specs
                </label>
                <textarea
                  name="description"
                  rows={3}
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="CPU specs, RAM, internal storage capacity, original cosmetic condition..."
                  className="input resize-none"
                />
              </div>
            </div>

            {/* Ownership & Warranty Section */}
            <div className="border-t border-navy-700/80 pt-6">
              <h2 className="text-lg font-bold text-white mb-1">Ownership & Warranty Binding</h2>
              <p className="text-xs text-gray-400 mb-4">
                Assign the registered device to an existing user account
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div className="sm:col-span-3">
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                    Owner Account Email *
                  </label>
                  <input
                    type="email"
                    required
                    name="currentOwnerEmail"
                    value={formData.currentOwnerEmail}
                    onChange={handleChange}
                    placeholder="e.g. owner@repairchain.io"
                    className="input"
                  />
                  <p className="text-[11px] text-gray-400 mt-1">
                    The user must be registered as an owner in the system. The admin contract will bind custody to their wallet.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                    Purchase Date
                  </label>
                  <input
                    type="date"
                    name="purchaseDate"
                    value={formData.purchaseDate}
                    onChange={handleChange}
                    className="input"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                    Warranty Expiry Date
                  </label>
                  <input
                    type="date"
                    name="warrantyExpiry"
                    value={formData.warrantyExpiry}
                    onChange={handleChange}
                    className="input"
                  />
                </div>
              </div>
            </div>

            {/* Submit Action */}
            <div className="border-t border-navy-700/80 pt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => navigate('/admin')}
                className="btn-secondary text-sm py-2.5 px-4"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary text-sm py-2.5 px-6 font-bold flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Minting on Blockchain...</span>
                  </>
                ) : (
                  <>
                    <SparklesIcon className="w-4 h-4" />
                    <span>Register Product on Chain</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ProductRegistrationPage;
