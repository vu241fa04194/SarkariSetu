import React from 'react';
import { Search, X } from 'lucide-react';

const SearchBar = ({
  value,
  onChange,
  onSubmit,
  placeholder = 'Search by scheme name, keywords, or department...',
  size = 'large', // 'normal' | 'large'
  onClear,
}) => {
  const isLarge = size === 'large';

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSubmit) onSubmit(e);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full relative">
      <div
        className={`relative flex items-center bg-white rounded-xl border border-slate-300 shadow-sm transition-all focus-within:border-gov-blue focus-within:ring-2 focus-within:ring-blue-100 ${
          isLarge ? 'p-1.5 sm:p-2' : 'p-1'
        }`}
      >
        <div className="pl-3 text-slate-400">
          <Search className={isLarge ? 'w-5 h-5 sm:w-6 sm:h-6' : 'w-4 h-4'} />
        </div>

        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full bg-transparent border-none text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-0 ${
            isLarge ? 'px-3 py-2 text-sm sm:text-base' : 'px-2 py-1.5 text-sm'
          }`}
        />

        {value && (
          <button
            type="button"
            onClick={onClear}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition mr-1"
            title="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        <button
          type="submit"
          className={`bg-gov-blue hover:bg-blue-900 text-white font-semibold rounded-lg shadow-sm transition flex items-center justify-center flex-shrink-0 ${
            isLarge
              ? 'px-4 sm:px-6 py-2.5 sm:py-3 text-xs sm:text-sm'
              : 'px-3 py-1.5 text-xs'
          }`}
        >
          Search Schemes
        </button>
      </div>
    </form>
  );
};

export default SearchBar;
