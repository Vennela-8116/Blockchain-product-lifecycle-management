import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { SparklesIcon, ArrowRightIcon } from '@heroicons/react/24/outline';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();

  const getDashboardPath = () => {
    if (!user) return '/login';
    switch (user.role) {
      case 'admin':
        return '/admin';
      case 'serviceCenter':
        return '/service-center';
      case 'owner':
      default:
        return '/owner';
    }
  };

  return (
    <nav className="border-b border-navy-800 bg-navy-900/80 backdrop-blur-md sticky top-0 z-40 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-violet-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
            <SparklesIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-black text-xl tracking-tight bg-gradient-to-r from-cyan-400 via-sky-300 to-violet-400 bg-clip-text text-transparent">
              RepairChain
            </span>
            <span className="hidden sm:inline-block ml-2 text-[10px] font-mono uppercase tracking-widest text-cyan-400/80 px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/40">
              Web3 Passport
            </span>
          </div>
        </Link>

        {/* Navigation CTAs */}
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <Link
                to={getDashboardPath()}
                className="btn-primary text-xs sm:text-sm py-2 px-4 flex items-center gap-1.5"
              >
                <span>Dashboard</span>
                <ArrowRightIcon className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                to="/login"
                className="text-xs sm:text-sm font-semibold text-gray-300 hover:text-white px-3 py-2 rounded-lg hover:bg-navy-800 transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="btn-primary text-xs sm:text-sm py-2 px-4"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
