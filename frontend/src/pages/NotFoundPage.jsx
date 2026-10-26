import React from 'react';
import { Link } from 'react-router-dom';
import { SparklesIcon, HomeIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

const NotFoundPage = () => {
  return (
    <div className="min-h-screen bg-navy-900 text-white flex flex-col justify-center items-center px-4 text-center relative overflow-hidden py-12">
      {/* Background glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-md w-full card-glass p-8 sm:p-10 border border-navy-700">
        <div className="w-16 h-16 rounded-2xl bg-cyan-950/80 border border-cyan-800/60 flex items-center justify-center text-cyan-400 mx-auto mb-6 shadow-lg shadow-cyan-500/10">
          <SparklesIcon className="w-8 h-8" />
        </div>

        <span className="font-mono text-xs font-bold uppercase tracking-wider text-cyan-400 bg-cyan-950/60 px-2.5 py-1 rounded border border-cyan-800/60 mb-2 inline-block">
          Error 404: Not Found
        </span>

        <h1 className="text-3xl sm:text-4xl font-black text-white mt-2 mb-3">
          Page Does Not Exist
        </h1>

        <p className="text-xs sm:text-sm text-gray-300 leading-relaxed mb-8">
          The requested URL was not found on RepairChain. It may have moved or the address may have been entered incorrectly.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/"
            className="w-full sm:w-auto btn-primary text-xs py-2.5 px-5 flex items-center justify-center gap-1.5 font-bold"
          >
            <HomeIcon className="w-4 h-4" />
            <span>Return to Homepage</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
