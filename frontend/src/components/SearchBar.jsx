import React, { useState } from 'react';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';

const SearchBar = ({
  placeholder = 'Search by Product ID (e.g. RC-00001) or Serial Number...',
  initialValue = '',
  onSearch,
  buttonText = 'Search Passport',
  className = '',
  size = 'md',
}) => {
  const [query, setQuery] = useState(initialValue);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(query.trim());
    }
  };

  const handleClear = () => {
    setQuery('');
    if (onSearch) {
      onSearch('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`relative flex items-center w-full ${className}`}>
      <div className="relative flex-1">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
          <MagnifyingGlassIcon className="w-5 h-5" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className={`w-full bg-navy-800/90 text-white rounded-xl border border-navy-600/80 pl-11 pr-10 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 placeholder-gray-400 shadow-inner transition-all ${
            size === 'lg' ? 'py-3.5 text-base sm:text-lg' : 'py-2.5 text-sm sm:text-base'
          }`}
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white"
            title="Clear search"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        )}
      </div>
      <button
        type="submit"
        className={`ml-3 btn-primary shrink-0 flex items-center gap-2 ${
          size === 'lg' ? 'py-3.5 px-6 text-base' : 'py-2.5 px-4 text-sm'
        }`}
      >
        <MagnifyingGlassIcon className="w-4 h-4" />
        <span>{buttonText}</span>
      </button>
    </form>
  );
};

export default SearchBar;
