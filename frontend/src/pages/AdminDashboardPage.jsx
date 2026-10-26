import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import BlockchainStatusBadge from '../components/BlockchainStatusBadge';
import api from '../api/axios';
import {
  CubeIcon,
  WrenchScrewdriverIcon,
  BuildingOffice2Icon,
  ArrowsRightLeftIcon,
  PlusIcon,
  ArrowTopRightOnSquareIcon,
  CircleStackIcon,
  CheckCircleIcon,
  ClockIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const AdminDashboardPage = () => {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [serviceCenters, setServiceCenters] = useState([]);
  const [events, setEvents] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [blockchainInfo, setBlockchainInfo] = useState({ available: true, currentBlock: null });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Parallel requests for all admin data
      const [productsRes, scRes, eventsRes, transfersRes, bctRes] = await Promise.allSettled([
        api.get('/products'),
        api.get('/service-centers'),
        api.get('/events'),
        api.get('/transfers'),
        api.get('/blockchain/status'),
      ]);

      if (productsRes.status === 'fulfilled') {
        const data = productsRes.value.data;
        setProducts(Array.isArray(data) ? data : data.products || []);
      }

      if (scRes.status === 'fulfilled') {
        const data = scRes.value.data;
        setServiceCenters(Array.isArray(data) ? data : data.serviceCenters || []);
      }

      if (eventsRes.status === 'fulfilled') {
        const data = eventsRes.value.data;
        setEvents(Array.isArray(data) ? data : data.events || []);
      }

      if (transfersRes.status === 'fulfilled') {
        const data = transfersRes.value.data;
        setTransfers(Array.isArray(data) ? data : data.transfers || []);
      }

      if (bctRes.status === 'fulfilled') {
        setBlockchainInfo(bctRes.value.data);
      }
    } catch (err) {
      toast.error('Failed to load some dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  // Metric derivations
  const totalProducts = products.length;
  const confirmedEvents = events.filter((e) => e.blockchainStatus === 'confirmed').length;
  const totalServiceCenters = serviceCenters.length;
  const pendingTransfers = transfers.filter((t) => t.status === 'pending').length;

  const recentProducts = products.slice(0, 5);
  const recentEvents = events.slice(0, 5);

  return (
    <DashboardLayout
      title="Admin Protocol Overview"
      subtitle="Manage registered hardware identities, service partner authorizations, and blockchain lifecycle state"
      action={
        <div className="flex items-center gap-3">
          <Link to="/admin/products/new" className="btn-primary text-xs sm:text-sm py-2 px-3.5 flex items-center gap-1.5">
            <PlusIcon className="w-4 h-4" />
            <span>Register Product</span>
          </Link>
          <Link to="/admin/service-centers" className="btn-secondary text-xs sm:text-sm py-2 px-3.5 flex items-center gap-1.5">
            <BuildingOffice2Icon className="w-4 h-4" />
            <span>Service Centers</span>
          </Link>
        </div>
      }
    >
      {/* Blockchain Network Status Banner */}
      <div className="mb-6 bg-navy-800/80 border border-navy-700/80 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-950/80 border border-emerald-700/60 flex items-center justify-center text-emerald-400">
            <CircleStackIcon className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Smart Contract Network: Active</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </h4>
            <p className="text-xs text-gray-400">
              Contract transactions confirmed via JSON-RPC endpoint
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          {blockchainInfo.currentBlock && (
            <div className="bg-navy-900 px-3 py-1.5 rounded-lg border border-navy-700 text-cyan-400">
              Block #{blockchainInfo.currentBlock}
            </div>
          )}
          <button
            type="button"
            onClick={fetchDashboardData}
            className="text-xs text-cyan-400 hover:text-cyan-300 underline font-sans"
          >
            Refresh Data
          </button>
        </div>
      </div>

      {/* Stats Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card h-28 animate-pulse bg-navy-800/60" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Total Products */}
          <div className="card hover:border-cyan-500/50 transition-all p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Total Products
              </span>
              <span className="p-2 rounded-lg bg-cyan-950/80 text-cyan-400 border border-cyan-800/40">
                <CubeIcon className="w-5 h-5" />
              </span>
            </div>
            <div className="text-3xl font-black text-white font-mono">{totalProducts}</div>
            <p className="text-xs text-gray-400 mt-1">Registered hardware passports</p>
          </div>

          {/* Confirmed Events */}
          <div className="card hover:border-emerald-500/50 transition-all p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Confirmed Events
              </span>
              <span className="p-2 rounded-lg bg-emerald-950/80 text-emerald-400 border border-emerald-800/40">
                <WrenchScrewdriverIcon className="w-5 h-5" />
              </span>
            </div>
            <div className="text-3xl font-black text-white font-mono">{confirmedEvents}</div>
            <p className="text-xs text-gray-400 mt-1">Lifecycle repairs on-chain</p>
          </div>

          {/* Service Centers */}
          <div className="card hover:border-violet-500/50 transition-all p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Service Centers
              </span>
              <span className="p-2 rounded-lg bg-violet-950/80 text-violet-400 border border-violet-800/40">
                <BuildingOffice2Icon className="w-5 h-5" />
              </span>
            </div>
            <div className="text-3xl font-black text-white font-mono">{totalServiceCenters}</div>
            <p className="text-xs text-gray-400 mt-1">Authorized service partners</p>
          </div>

          {/* Pending Transfers */}
          <div className="card hover:border-yellow-500/50 transition-all p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Pending Transfers
              </span>
              <span className="p-2 rounded-lg bg-yellow-950/80 text-yellow-400 border border-yellow-800/40">
                <ArrowsRightLeftIcon className="w-5 h-5" />
              </span>
            </div>
            <div className="text-3xl font-black text-white font-mono">{pendingTransfers}</div>
            <p className="text-xs text-gray-400 mt-1">Awaiting recipient acceptance</p>
          </div>
        </div>
      )}

      {/* Two-Column Section: Recent Products & Recent Events */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Recent Products Table */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-navy-700">
            <div>
              <h3 className="text-base font-bold text-white">Recent Products</h3>
              <p className="text-xs text-gray-400">Newly registered devices</p>
            </div>
            <Link
              to="/admin/products/new"
              className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
            >
              <span>New Product</span>
              <PlusIcon className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-navy-700/50 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : recentProducts.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">
              <CubeIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No products registered yet.</p>
              <Link to="/admin/products/new" className="text-cyan-400 underline text-xs mt-1 block">
                Register the first product
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="text-[10px] uppercase font-bold text-gray-400 bg-navy-900/60">
                  <tr>
                    <th className="py-2.5 px-3">Product</th>
                    <th className="py-2.5 px-3">Serial #</th>
                    <th className="py-2.5 px-3">Blockchain</th>
                    <th className="py-2.5 px-3 text-right">Passport</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy-700/70">
                  {recentProducts.map((p) => (
                    <tr key={p._id || p.productId} className="hover:bg-navy-700/40">
                      <td className="py-3 px-3">
                        <span className="font-semibold text-white block">{p.name}</span>
                        <span className="text-[11px] text-gray-400">{p.brand} &bull; {p.productId}</span>
                      </td>
                      <td className="py-3 px-3 font-mono text-gray-300">{p.serialNumber}</td>
                      <td className="py-3 px-3">
                        <BlockchainStatusBadge status={p.blockchainStatus} />
                      </td>
                      <td className="py-3 px-3 text-right">
                        <Link
                          to={`/passport/${p.productId}`}
                          className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-semibold"
                        >
                          <span>View</span>
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

        {/* Recent Lifecycle Events Table */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-navy-700">
            <div>
              <h3 className="text-base font-bold text-white">Recent Lifecycle Events</h3>
              <p className="text-xs text-gray-400">Maintenance & repair transactions</p>
            </div>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-navy-700/50 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : recentEvents.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">
              <WrenchScrewdriverIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No lifecycle events logged yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="text-[10px] uppercase font-bold text-gray-400 bg-navy-900/60">
                  <tr>
                    <th className="py-2.5 px-3">Event</th>
                    <th className="py-2.5 px-3">Product</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy-700/70">
                  {recentEvents.map((ev) => (
                    <tr key={ev._id} className="hover:bg-navy-700/40">
                      <td className="py-3 px-3">
                        <span className="font-semibold text-white block truncate max-w-[150px]">{ev.title}</span>
                        <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider">{ev.eventType}</span>
                      </td>
                      <td className="py-3 px-3 font-mono text-gray-300">
                        <Link to={`/passport/${ev.productId}`} className="hover:underline text-cyan-300">
                          {ev.productId}
                        </Link>
                      </td>
                      <td className="py-3 px-3 text-gray-400">
                        {ev.serviceDate ? new Date(ev.serviceDate).toLocaleDateString() : '—'}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <BlockchainStatusBadge status={ev.blockchainStatus} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboardPage;
