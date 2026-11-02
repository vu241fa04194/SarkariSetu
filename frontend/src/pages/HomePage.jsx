import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Compass,
  ArrowRight,
  ShieldCheck,
  CheckCircle,
  Sparkles,
  FileText,
  AlertCircle,
  SlidersHorizontal,
  Info,
} from 'lucide-react';
import { getSchemes, getCategories } from '../services/api';
import SearchBar from '../components/SearchBar';
import SchemeCard from '../components/SchemeCard';
import CategoryCard from '../components/CategoryCard';
import { SchemeCardSkeleton } from '../components/LoadingSpinner';

const HomePage = () => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [featuredSchemes, setFeaturedSchemes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [totalSchemesCount, setTotalSchemesCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch schemes and categories from backend concurrently
        const [schemesRes, categoriesRes] = await Promise.all([
          getSchemes(),
          getCategories(),
        ]);

        if (schemesRes?.data) {
          setTotalSchemesCount(schemesRes.count || schemesRes.data.length);
          // Take top 6 active schemes for featured showcase
          setFeaturedSchemes(schemesRes.data.slice(0, 6));
        }

        if (categoriesRes?.data) {
          // Take top 8 popular categories
          setCategories(categoriesRes.data.slice(0, 8));
        }
      } catch (err) {
        console.error('Error loading homepage data:', err);
        setError(err.message || 'Failed to load schemes from backend.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSearchSubmit = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/schemes?search=${encodeURIComponent(searchTerm.trim())}`);
    } else {
      navigate('/schemes');
    }
  };

  const handleChipClick = (keyword) => {
    navigate(`/schemes?search=${encodeURIComponent(keyword)}`);
  };

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-blue-900 via-gov-blue to-slate-900 text-white pt-16 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Subtle geometric pattern overlay */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative z-10 space-y-6">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-xs font-medium text-amber-300">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t('home.badge')}</span>
          </div>

          {/* Heading & Tagline */}
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            {t('home.heroTitle')}{' '}
            <span className="text-amber-300">{t('home.heroHighlight')}</span>
          </h1>
          <p className="text-base sm:text-lg text-slate-200 max-w-2xl mx-auto font-normal leading-relaxed">
            {t('home.heroSubtitle')}
          </p>

          {/* Large Hero Search Bar */}
          <div className="pt-2 max-w-2xl mx-auto">
            <SearchBar
              value={searchTerm}
              onChange={setSearchTerm}
              onSubmit={handleSearchSubmit}
              onClear={() => setSearchTerm('')}
              placeholder={t('home.searchPlaceholder')}
              size="large"
            />

            {/* Quick Suggestions / Keyword Chips */}
            <div className="flex items-center justify-center gap-2 mt-4 flex-wrap text-xs text-slate-300">
              <span className="font-semibold text-slate-400">Popular:</span>
              {['Farmer', 'Student', 'Ayushman', 'Housing', 'Scholarship', 'Pension'].map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleChipClick(tag)}
                  className="px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-slate-200 border border-white/15 transition focus:outline-none"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Real Statistics from MongoDB (No Fake Numbers) */}
          {totalSchemesCount > 0 && (
            <div className="pt-4 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs text-slate-300 border-t border-white/10 max-w-xl mx-auto">
              <div className="text-center">
                <span className="block text-xl sm:text-2xl font-extrabold text-amber-300">
                  {totalSchemesCount}+
                </span>
                <span className="text-[11px] text-slate-300 uppercase tracking-wider">
                  {t('home.stats.schemesCount')}
                </span>
              </div>
              <div className="text-center">
                <span className="block text-xl sm:text-2xl font-extrabold text-emerald-400">
                  {categories.length}+
                </span>
                <span className="text-[11px] text-slate-300 uppercase tracking-wider">
                  {t('home.stats.categoriesCount')}
                </span>
              </div>
              <div className="text-center">
                <span className="block text-xl sm:text-2xl font-extrabold text-blue-300">
                  100%
                </span>
                <span className="text-[11px] text-slate-300 uppercase tracking-wider">
                  {t('home.stats.freeResource')}
                </span>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Trust & Transparency Feature Ribbon */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20">
        <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">{t('home.howItWorks.step3Title')}</h4>
              <p className="text-xs text-slate-500 mt-1">
                {t('home.howItWorks.step3Desc')}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-gov-blue flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">{t('home.howItWorks.step2Title')}</h4>
              <p className="text-xs text-slate-500 mt-1">
                {t('home.howItWorks.step2Desc')}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">{t('common.freeAccess')}</h4>
              <p className="text-xs text-slate-500 mt-1">
                {t('home.howItWorks.step1Desc')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Eligibility Checker Call-to-Action Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-blue-900 to-indigo-900 rounded-3xl p-8 sm:p-12 text-white shadow-lg flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-amber-300 text-xs font-semibold">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>{t('eligibility.title')}</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {t('home.heroTitle')} {t('home.heroHighlight')}?
            </h3>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
              {t('eligibility.subtitle')}
            </p>
          </div>
          <Link
            to="/eligibility"
            className="flex-shrink-0 inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-900 font-extrabold text-xs sm:text-sm shadow-md transition"
          >
            <span>{t('common.buttons.checkEligibility')}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Error Banner (if any) */}
      {error && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        </section>
      )}

      {/* Popular Categories Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-gov-blue mb-1">
              {t('home.popularCategories')}
            </div>
            <h2 className="text-2xl font-bold text-slate-900">{t('categories.title')}</h2>
          </div>
          <Link
            to="/categories"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-gov-blue hover:text-blue-900 group"
          >
            <span>{t('categories.exploreCategory')}</span>
            <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
          {loading
            ? Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-36 bg-slate-100 rounded-xl animate-pulse" />
              ))
            : categories.map((cat) => (
                <CategoryCard key={cat.name} category={cat} />
              ))}
        </div>
      </section>

      {/* Featured Government Schemes Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-gov-blue mb-1">
              {t('home.featuredTitle')}
            </div>
            <h2 className="text-2xl font-bold text-slate-900">{t('home.featuredSubtitle')}</h2>
          </div>
          <Link
            to="/schemes"
            className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-gov-blue text-white text-xs font-semibold hover:bg-blue-900 shadow-sm transition"
          >
            <Compass className="w-4 h-4 mr-1.5" />
            {t('common.buttons.exploreAll')}
          </Link>
        </div>

        {/* Schemes Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <SchemeCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredSchemes.map((scheme) => (
              <SchemeCard key={scheme._id} scheme={scheme} />
            ))}
          </div>
        )}

        {/* Informational Disclaimer Banner on Homepage */}
        <div className="mt-12 bg-slate-50 border border-slate-200 rounded-2xl p-6 text-xs text-slate-500 flex items-start gap-3">
          <Info className="w-5 h-5 text-gov-blue flex-shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            {t('common.disclaimer')}
          </p>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
