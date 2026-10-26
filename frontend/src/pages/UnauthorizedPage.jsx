import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldExclamationIcon, ArrowLeftIcon, HomeIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';

const UnauthorizedPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const getRoleDashboard = () => {
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
    <div className="min-h-screen bg-navy-900 text-white flex flex-col justify-center items-center px-4 text-center relative overflow-hidden py-12">
      {/* Background glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-md w-full card-glass p-8 sm:p-10 border border-red-500/30">
        <div className="w-16 h-16 rounded-2xl bg-red-950/80 border border-red-700/60 flex items-center justify-center text-red-400 mx-auto mb-6 shadow-lg shadow-red-500/10">
          <ShieldExclamationIcon className="w-8 h-8" />
        </div>

        <span className="font-mono text-xs font-bold uppercase tracking-wider text-red-400 bg-red-950/60 px-2.5 py-1 rounded border border-red-800/60 mb-2 inline-block">
          Error 403: Forbidden
        </span>

        <h1 className="text-2xl sm:text-3xl font-black text-white mt-2 mb-3">
          Access Restricted
        </h1>

        <p className="text-xs sm:text-sm text-gray-300 leading-relaxed mb-6">
          Your current account role <span className="font-mono text-cyan-300 font-semibold">({user?.role || 'Guest'})</span> is not authorized to access this section of the RepairChain protocol.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-full sm:w-auto btn-secondary text-xs py-2.5 px-4 flex items-center justify-center gap-1.5"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            <span>Go Back</span>
          </button>

          <Link
            to={getRoleDashboard()}
            className="w-full sm:w-auto btn-primary text-xs py-2.5 px-4 flex items-center justify-center gap-1.5"
          >
            <HomeIcon className="w-4 h-4" />
            <span>My Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default UnauthorizedPage;
