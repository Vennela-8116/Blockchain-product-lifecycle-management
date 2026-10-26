import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import {
  ShieldCheckIcon,
  DocumentDuplicateIcon,
  WrenchScrewdriverIcon,
  GlobeAltIcon,
  MagnifyingGlassIcon,
  ArrowRightIcon,
  LockClosedIcon,
  CheckBadgeIcon,
  CpuChipIcon,
  SparklesIcon,
  LinkIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const HomePage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) {
      toast.error('Please enter a Product ID or Serial Number');
      return;
    }
    navigate(`/passport/${encodeURIComponent(q)}`);
  };

  const sampleProducts = ['RC-00001', 'RC-00002', 'RC-00003'];

  return (
    <div className="min-h-screen bg-navy-900 text-white flex flex-col relative overflow-hidden">
      {/* Background glowing gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[450px] bg-gradient-to-tr from-cyan-500/20 via-sky-500/10 to-violet-600/20 rounded-full blur-3xl pointer-events-none -z-0" />
      <div className="absolute top-1/3 -left-32 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none -z-0" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-violet-600/15 rounded-full blur-3xl pointer-events-none -z-0" />

      <Navbar />

      {/* Hero Section */}
      <main className="flex-1 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 pt-12 pb-20 relative z-10 max-w-6xl mx-auto w-full text-center">
        {/* Web3 live network pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-navy-800/90 border border-cyan-500/30 text-cyan-300 text-xs font-medium mb-8 shadow-lg shadow-cyan-500/10 animate-pulse">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span>Decentralized Product Identity & Lifecycle Ledger</span>
        </div>

        {/* Large Headline with animated gradient */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6">
          <span className="bg-gradient-to-r from-cyan-400 via-sky-200 to-violet-400 bg-clip-text text-transparent drop-shadow-sm">
            RepairChain
          </span>
        </h1>

        {/* Subheadline */}
        <p className="text-lg sm:text-xl md:text-2xl text-gray-300 max-w-3xl mb-10 font-normal leading-relaxed">
          Blockchain-powered product lifecycle verification. Transparent service history, verifiable ownership transitions, and tamper-proof maintenance records.
        </p>

        {/* Search Passport Box */}
        <div className="w-full max-w-2xl bg-navy-800/90 backdrop-blur-xl border border-navy-700/90 hover:border-cyan-500/60 p-3 sm:p-4 rounded-2xl shadow-2xl transition-all duration-300 mb-6">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-cyan-400">
                <MagnifyingGlassIcon className="w-5 h-5" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Enter Product ID (e.g. RC-00001) or Serial Number..."
                className="w-full bg-navy-900/90 text-white placeholder-gray-400 pl-11 pr-4 py-3.5 rounded-xl border border-navy-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-sm sm:text-base transition-all font-mono"
              />
            </div>
            <button
              type="submit"
              className="w-full sm:w-auto btn-primary py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 text-sm sm:text-base shrink-0"
            >
              <span>Verify Passport</span>
              <ArrowRightIcon className="w-4 h-4" />
            </button>
          </form>

          {/* Quick sample IDs */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-3 pt-3 border-t border-navy-700/50 text-xs text-gray-400">
            <span>Try searching:</span>
            {sampleProducts.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setSearchQuery(id);
                  navigate(`/passport/${id}`);
                }}
                className="font-mono text-cyan-400 hover:text-cyan-300 bg-navy-900/80 hover:bg-navy-700 px-2.5 py-1 rounded border border-navy-700 transition-colors"
              >
                {id}
              </button>
            ))}
          </div>
        </div>

        {/* Action CTAs */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-20">
          <Link
            to="/login"
            className="btn-primary py-3 px-8 text-sm sm:text-base rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-cyan-500/25"
          >
            <span>Sign In to Portal</span>
            <ArrowRightIcon className="w-4 h-4" />
          </Link>
          <Link
            to="/register"
            className="btn-secondary py-3 px-8 text-sm sm:text-base rounded-xl font-bold flex items-center gap-2 hover:border-violet-500/50"
          >
            <span>Create Account</span>
          </Link>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full text-left">
          {/* Card 1 */}
          <div className="card-glass hover:border-cyan-500/50 transition-all duration-300 group">
            <div className="w-12 h-12 rounded-xl bg-cyan-950/80 border border-cyan-800/60 flex items-center justify-center text-cyan-400 mb-4 group-hover:scale-110 transition-transform">
              <LockClosedIcon className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2 group-hover:text-cyan-300 transition-colors">
              Immutable Records
            </h3>
            <p className="text-sm text-gray-300 leading-relaxed">
              Every maintenance log, diagnostic result, and component replacement is cryptographically committed to an immutable smart contract ledger.
            </p>
          </div>

          {/* Card 2 */}
          <div className="card-glass hover:border-violet-500/50 transition-all duration-300 group">
            <div className="w-12 h-12 rounded-xl bg-violet-950/80 border border-violet-800/60 flex items-center justify-center text-violet-400 mb-4 group-hover:scale-110 transition-transform">
              <LinkIcon className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2 group-hover:text-violet-300 transition-colors">
              Ownership History
            </h3>
            <p className="text-sm text-gray-300 leading-relaxed">
              Verifiable transfer flow between authenticated owners, ensuring chain-of-custody integrity for second-hand resale and warranty coverage.
            </p>
          </div>

          {/* Card 3 */}
          <div className="card-glass hover:border-emerald-500/50 transition-all duration-300 group">
            <div className="w-12 h-12 rounded-xl bg-emerald-950/80 border border-emerald-800/60 flex items-center justify-center text-emerald-400 mb-4 group-hover:scale-110 transition-transform">
              <WrenchScrewdriverIcon className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2 group-hover:text-emerald-300 transition-colors">
              Repair Verification
            </h3>
            <p className="text-sm text-gray-300 leading-relaxed">
              Only authorized service centers with certified on-chain cryptographic identities can append repair and replacement event hashes.
            </p>
          </div>

          {/* Card 4 */}
          <div className="card-glass hover:border-sky-500/50 transition-all duration-300 group">
            <div className="w-12 h-12 rounded-xl bg-sky-950/80 border border-sky-800/60 flex items-center justify-center text-sky-400 mb-4 group-hover:scale-110 transition-transform">
              <GlobeAltIcon className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2 group-hover:text-sky-300 transition-colors">
              Public Verification
            </h3>
            <p className="text-sm text-gray-300 leading-relaxed">
              Anyone can look up a product passport via serial or ID without authentication to verify warranty status, origin authenticity, and service history.
            </p>
          </div>
        </div>

        {/* How It Works Diagram Section */}
        <div className="mt-20 w-full bg-navy-800/50 rounded-2xl border border-navy-700/60 p-8 sm:p-10 text-left">
          <div className="flex items-center gap-2 mb-2 text-cyan-400">
            <CpuChipIcon className="w-5 h-5" />
            <span className="text-xs uppercase font-bold tracking-wider">Protocol Architecture</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-4">
            How RepairChain Secures Device Lifecycles
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            <div className="bg-navy-900/70 p-5 rounded-xl border border-navy-700/60">
              <div className="text-2xl font-black text-cyan-400 mb-2 font-mono">01</div>
              <h4 className="text-base font-bold text-white mb-1">Mint Product Identity</h4>
              <p className="text-xs text-gray-300 leading-relaxed">
                Admins register hardware serial numbers to the smart contract, binding initial owner addresses and issuing a unique Passport ID.
              </p>
            </div>
            <div className="bg-navy-900/70 p-5 rounded-xl border border-navy-700/60">
              <div className="text-2xl font-black text-violet-400 mb-2 font-mono">02</div>
              <h4 className="text-base font-bold text-white mb-1">Log Certified Events</h4>
              <p className="text-xs text-gray-300 leading-relaxed">
                Authorized technicians log diagnostics and replaced parts. The canonical record is hashed via Keccak256 and committed on-chain.
              </p>
            </div>
            <div className="bg-navy-900/70 p-5 rounded-xl border border-navy-700/60">
              <div className="text-2xl font-black text-emerald-400 mb-2 font-mono">03</div>
              <h4 className="text-base font-bold text-white mb-1">Trustless Passport Proof</h4>
              <p className="text-xs text-gray-300 leading-relaxed">
                Buyers and insurers verify on-chain hashes directly against recorded database payloads to detect any silent alteration or tampering.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer with Disclaimer */}
      <footer className="border-t border-navy-800 bg-navy-950/80 py-10 px-4 sm:px-6 lg:px-8 mt-auto relative z-10 text-center">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="flex items-center justify-center gap-2">
            <SparklesIcon className="w-5 h-5 text-cyan-400" />
            <span className="font-bold text-base tracking-tight bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">
              RepairChain Protocol
            </span>
          </div>

          <div className="bg-navy-900/80 border border-navy-700/60 rounded-xl p-4 text-xs text-gray-400 max-w-2xl mx-auto leading-relaxed text-left">
            <div className="flex items-start gap-2.5">
              <CheckBadgeIcon className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-gray-200 block mb-0.5 font-semibold">
                  Blockchain Verification Disclaimer:
                </strong>
                The RepairChain blockchain ledger provides mathematical proof that recorded data has not been silently altered or deleted after submission. It does not independently verify that the physical repair or part replacement was genuinely performed. Physical authenticity relies on the authorization of certified service centers.
              </div>
            </div>
          </div>

          <p className="text-xs text-gray-400">
            &copy; {new Date().getFullYear()} RepairChain. Built for transparency, device longevity, and circular economy.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
