import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Grid3X3, Search, AlertCircle, ArrowRight } from 'lucide-react';
import { getCategories } from '../services/api';
import CategoryCard from '../components/CategoryCard';
import { LoadingSpinner } from '../components/LoadingSpinner';

const CategoriesPage = () => {
  const { t } = useTranslation();
  const [categories, setCategories] = useState([]);
  const [filterQuery, setFilterQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCategoriesList = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await getCategories();
        if (res?.data) {
          setCategories(res.data);
        }
      } catch (err) {
        console.error('Failed to load categories:', err);
        setError(err.message || 'Failed to retrieve categories from backend.');
      } finally {
        setLoading(false);
      }
    };

    fetchCategoriesList();
  }, []);

  const filteredCategories = categories.filter((cat) =>
    (cat.name || '').toLowerCase().includes(filterQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 shadow-sm">
        <div className="max-w-3xl space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-gov-blue">
            {t('categories.title', 'Scheme Categories Directory')}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            {t('categories.title', 'Browse Schemes by Welfare Category')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            {t('categories.subtitle', 'Browse verified government schemes grouped into 14 key citizen welfare categories.')}
          </p>
        </div>

        {/* Filter categories input */}
        <div className="mt-6 max-w-md relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder={t('schemes.searchPlaceholder', 'Search category (e.g. Health, Agriculture, Students)...')}
            className="w-full bg-slate-50 text-slate-800 pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 text-xs sm:text-sm focus:outline-none focus:border-gov-blue focus:bg-white"
          />
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-xs sm:text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading && !error && (
        <LoadingSpinner text={t('common.loading', 'Loading scheme categories...')} />
      )}

      {/* Categories Grid */}
      {!loading && !error && (
        <>
          {filteredCategories.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-sm">
              <p className="text-sm font-medium text-slate-600">
                {t('schemes.emptyTitle', 'No categories found')}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredCategories.map((category) => (
                <CategoryCard key={category.name} category={category} />
              ))}
            </div>
          )}
        </>
      )}

      {/* Bottom CTA */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center space-y-3">
        <h3 className="text-base font-bold text-slate-900">
          {t('home.heroTitle', 'Want to explore all government schemes together?')}
        </h3>
        <p className="text-xs text-slate-600 max-w-xl mx-auto">
          {t('schemes.subtitle', 'You can also search across all departments and states using our comprehensive filters on the Schemes page.')}
        </p>
        <Link
          to="/schemes"
          className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-gov-blue hover:bg-blue-900 text-white text-xs font-semibold shadow transition"
        >
          <span>{t('home.exploreAllBtn', 'View All Schemes')}</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
};

export default CategoriesPage;
