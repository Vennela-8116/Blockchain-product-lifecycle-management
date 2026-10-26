import React from 'react';

const LoadingSpinner = ({ message = 'Loading...', size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  };

  return (
    <div className={`flex flex-col items-center justify-center py-10 px-4 text-center ${className}`}>
      <div
        className={`${sizeClasses[size] || sizeClasses.md} border-navy-600 border-t-cyan-400 border-r-violet-400 rounded-full animate-spin mb-3`}
        role="status"
        aria-label="loading"
      />
      {message && <p className="text-gray-400 text-sm font-medium animate-pulse">{message}</p>}
    </div>
  );
};

export default LoadingSpinner;
