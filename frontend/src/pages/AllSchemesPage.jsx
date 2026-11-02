import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Search,
  Filter,
  X,
  RotateCcw,
  SlidersHorizontal,
  Building2,
  MapPin,
  Tag,
  AlertCircle,
} from 'lucide-react';
import { getSchemes, getFilterOptions } from '../services/api';
import SchemeCard from '../components/SchemeCard';
import { SchemeCardSkeleton } from '../components/LoadingSpinner';

const AllSchemesPage = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  // Filter states initialized from URL params
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [category, setCategory] = useState(searchParams.get('category') || 'All');
  const [state, setState] = useState(searchParams.get('state') || 'All');
  const [department, setDepartment] = useState(searchParams.get('department') || 'All');
  const [sort, setSort] = useState(searchParams.get('sort') || 'latest');

  // Schemes data
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Available options for dropdowns
  const [filterOptions, setFilterOptions] = useState({
    categories: [],
    states: [],
    departments: [],
  });

  // Mobile filters open/close
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Load distinct filter options on mount
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const res = await getFilterOptions();
        if (res?.data) {
          setFilterOptions({
            categories: res.data.categories || [],
            states: res.data.states || [],
            departments: res.data.departments || [],
          });
        }
      } catch (err) {
        console.error('Failed to load filter metadata:', err);
      }
    };
    fetchFilters();
  }, []);

  // Sync state if URL searchParams changes externally
  useEffect(() => {
    const urlSearch = searchParams.get('search') || '';
    const urlCategory = searchParams.get('category') || 'All';
    const urlState = searchParams.get('state') || 'All';
    const urlDepartment = searchParams.get('department') || 'All';
    const urlSort = searchParams.get('sort') || 'latest';

    setSearch(urlSearch);
    setCategory(urlCategory);
    setState(urlState);
    setDepartment(urlDepartment);
    setSort(urlSort);
  }, [searchParams]);

  // Fetch schemes from backend whenever filters change
  const fetchSchemesList = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {};
      if (search.trim()) params.search = search.trim();
      if (category && category !== 'All') params.category = category;
      if (state && state !== 'All') params.state = state;
      if (department && department !== 'All') params.department = department;
      if (sort) params.sort = sort;

      const res = await getSchemes(params);
      if (res?.data) {
        setSchemes(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch schemes:', err);
      setError(err.message || 'Unable to connect to the backend server.');
    } finally {
      setLoading(false);
    }
  }, [search, category, state, department, sort]);

  useEffect(() => {
    fetchSchemesList();
  }, [fetchSchemesList]);

  // Apply filters and update URL
  const updateUrlParams = (newParams) => {
    const nextParams = new URLSearchParams(searchParams);
    Object.entries(newParams).forEach(([key, val]) => {
      if (!val || val === 'All') {
        nextParams.delete(key);
      } else {
        nextParams.set(key, val);
      }
    });
    setSearchParams(nextParams);
  };

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearch(val);
    updateUrlParams({ search: val });
  };

  const handleCategoryChange = (val) => {
    setCategory(val);
    updateUrlParams({ category: val });
  };

  const handleStateChange = (val) => {
    setState(val);
    updateUrlParams({ state: val });
  };

  const handleDepartmentChange = (val) => {
    setDepartment(val);
    updateUrlParams({ department: val });
  };

  const handleSortChange = (val) => {
    setSort(val);
    updateUrlParams({ sort: val });
  };

  const handleClearFilters = () => {
    setSearch('');
    setCategory('All');
    setState('All');
    setDepartment('All');
    setSort('latest');
    setSearchParams({});
  };

  // Count active filters
  const activeFiltersCount =
    (search ? 1 : 0) +
    (category !== 'All' ? 1 : 0) +
    (state !== 'All' ? 1 : 0) +
    (department !== 'All' ? 1 : 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-gov-blue mb-1">
              {t('common.brandTagline')}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
              {t('schemes.title')}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              {t('schemes.subtitle')}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Mobile Filter Toggle */}
            <button
              type="button"
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              className="md:hidden inline-flex items-center gap-2 px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}</span>
            </button>

            {/* Clear Filters Button */}
            {activeFiltersCount > 0 && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{t('common.buttons.resetFilters')}</span>
              </button>
            )}
          </div>
        </div>

        {/* Search bar inside header */}
        <div className="mt-6 relative">
          <div className="relative flex items-center">
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5" />
            <input
              type="text"
              value={search}
              onChange={handleSearchChange}
              placeholder={t('schemes.searchPlaceholder')}
              className="w-full bg-slate-50 text-slate-900 pl-11 pr-10 py-3 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-gov-blue focus:bg-white focus:ring-1 focus:ring-gov-blue transition"
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  updateUrlParams({ search: '' });
                }}
                className="absolute right-3 p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid: Filters Sidebar + Results */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters Sidebar (Desktop & Mobile Drawer) */}
        <div
          className={`lg:block ${
            showMobileFilters ? 'block' : 'hidden'
          } lg:col-span-1 space-y-5`}
        >
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-6 sticky top-24">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <Filter className="w-4 h-4 text-gov-blue" />
                <span>{t('schemes.categoryFilter')}</span>
              </div>
              {activeFiltersCount > 0 && (
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="text-[11px] font-semibold text-slate-500 hover:text-red-600"
                >
                  {t('common.buttons.clearFilters')}
                </button>
              )}
            </div>

            {/* Category Filter */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wider">
                <Tag className="w-3.5 h-3.5 text-gov-blue" />
                {t('schemes.categoryFilter')}
              </label>
              <select
                value={category}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:border-gov-blue focus:bg-white"
              >
                <option value="All">{t('common.allCategories')}</option>
                {filterOptions.categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* State Filter */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wider">
                <MapPin className="w-3.5 h-3.5 text-gov-blue" />
                {t('schemes.stateFilter')}
              </label>
              <select
                value={state}
                onChange={(e) => handleStateChange(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:border-gov-blue focus:bg-white"
              >
                <option value="All">{t('common.allStates')}</option>
                {filterOptions.states.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            {/* Department Filter */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wider">
                <Building2 className="w-3.5 h-3.5 text-gov-blue" />
                {t('common.allDepartments')}
              </label>
              <select
                value={department}
                onChange={(e) => handleDepartmentChange(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:border-gov-blue focus:bg-white"
              >
                <option value="All">{t('common.allDepartments')}</option>
                {filterOptions.departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            {/* Sorting Option */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                {t('schemes.sortBy')}
              </label>
              <select
                value={sort}
                onChange={(e) => handleSortChange(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:border-gov-blue focus:bg-white"
              >
                <option value="latest">{t('schemes.sortOptions.newest')}</option>
                <option value="name_asc">{t('schemes.sortOptions.nameAsc')}</option>
                <option value="name_desc">{t('schemes.sortOptions.nameDesc')}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results Area */}
        <div className="lg:col-span-3 space-y-4">
          {/* Active filter pills & total counts */}
          <div className="bg-white rounded-xl border border-slate-200 px-4 py-3 flex flex-wrap items-center justify-between gap-3 shadow-sm text-xs">
            <div className="font-semibold text-slate-700">
              {loading ? (
                <span>{t('common.loading')}</span>
              ) : (
                <span>
                  Showing <strong className="text-gov-blue">{schemes.length}</strong>{' '}
                  {schemes.length === 1 ? 'Scheme' : 'Schemes'}
                </span>
              )}
            </div>

            {/* Active Pills */}
            <div className="flex flex-wrap items-center gap-2">
              {category !== 'All' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-gov-blue border border-blue-100">
                  <span>Category: {category}</span>
                  <button
                    type="button"
                    onClick={() => handleCategoryChange('All')}
                    className="hover:text-red-500"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {state !== 'All' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-100">
                  <span>State: {state}</span>
                  <button
                    type="button"
                    onClick={() => handleStateChange('All')}
                    className="hover:text-red-500"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {department !== 'All' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-100 max-w-xs truncate">
                  <span className="truncate">Dept: {department}</span>
                  <button
                    type="button"
                    onClick={() => handleDepartmentChange('All')}
                    className="hover:text-red-500 flex-shrink-0"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {search && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-800 border border-slate-200">
                  <span>Keyword: "{search}"</span>
                  <button
                    type="button"
                    onClick={() => {
                      setSearch('');
                      updateUrlParams({ search: '' });
                    }}
                    className="hover:text-red-500"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>
          </div>

          {/* Backend Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-xl text-center space-y-3">
              <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
              <h3 className="font-bold text-base">{t('common.error')}</h3>
              <p className="text-xs text-red-600 max-w-md mx-auto">{error}</p>
              <button
                type="button"
                onClick={fetchSchemesList}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700"
              >
                {t('common.buttons.retry')}
              </button>
            </div>
          )}

          {/* Loading State Skeleton */}
          {loading && !error && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <SchemeCardSkeleton key={i} />
              ))}
            </div>
          )}

          {/* Empty Result State */}
          {!loading && !error && schemes.length === 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-sm space-y-4">
              <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Search className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">
                {t('schemes.emptyTitle')}
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                {t('schemes.emptyDesc')}
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gov-blue text-white text-xs font-semibold hover:bg-blue-900 transition shadow-sm"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>{t('common.buttons.resetFilters')}</span>
                </button>
              </div>
            </div>
          )}

          {/* Scheme Cards Grid */}
          {!loading && !error && schemes.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {schemes.map((scheme) => (
                <SchemeCard key={scheme._id} scheme={scheme} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AllSchemesPage;
