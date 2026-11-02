import React from 'react';
import { Link } from 'react-router-dom';
import { Home, Compass } from 'lucide-react';

const NotFoundPage = () => {
  return (
    <div className="max-w-xl mx-auto px-4 py-24 text-center space-y-6">
      <div className="text-6xl font-extrabold text-gov-blue">404</div>
      <h1 className="text-2xl font-bold text-slate-900">Page Not Found</h1>
      <p className="text-sm text-slate-600 leading-relaxed">
        The page or government scheme link you are looking for does not exist or has been moved.
      </p>
      <div className="flex items-center justify-center gap-3 pt-2">
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gov-blue text-white text-xs font-semibold hover:bg-blue-900 transition"
        >
          <Home className="w-4 h-4" />
          <span>Go to Home</span>
        </Link>
        <Link
          to="/schemes"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 text-xs font-semibold transition"
        >
          <Compass className="w-4 h-4" />
          <span>Explore Schemes</span>
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
