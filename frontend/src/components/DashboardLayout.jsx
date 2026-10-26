import React, { useState } from 'react';
import Sidebar from './Sidebar';
import { Bars3Icon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const DashboardLayout = ({ children, title, subtitle, action }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-navy-900 flex flex-col lg:flex-row text-white">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-x-hidden">
        {/* Mobile Top Header */}
        <header className="lg:hidden h-16 bg-navy-800 border-b border-navy-700 px-4 flex items-center justify-between sticky top-0 z-30">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="p-2 text-gray-400 hover:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
            aria-label="Open sidebar"
          >
            <Bars3Icon className="w-6 h-6" />
          </button>

          <Link to="/" className="flex items-center gap-2">
            <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">
              RepairChain
            </span>
          </Link>

          <div className="w-8" />
        </header>

        {/* Optional Page Header */}
        {(title || action) && (
          <div className="border-b border-navy-800 bg-navy-900/60 backdrop-blur-sm px-6 py-5 flex flex-wrap items-center justify-between gap-4">
            <div>
              {title && <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">{title}</h1>}
              {subtitle && <p className="text-xs sm:text-sm text-gray-400 mt-0.5">{subtitle}</p>}
            </div>
            {action && <div>{action}</div>}
          </div>
        )}

        {/* Content Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
