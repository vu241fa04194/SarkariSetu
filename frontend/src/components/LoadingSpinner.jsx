import React from 'react';
import { Loader2 } from 'lucide-react';

export const LoadingSpinner = ({ text = 'Loading schemes...' }) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <Loader2 className="w-10 h-10 text-gov-blue animate-spin mb-3" />
      <p className="text-sm font-medium text-slate-600">{text}</p>
    </div>
  );
};

export const SchemeCardSkeleton = () => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm animate-pulse flex flex-col justify-between h-full">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="h-5 bg-slate-200 rounded-full w-24"></div>
          <div className="h-5 bg-slate-200 rounded-full w-20"></div>
        </div>
        <div className="h-6 bg-slate-200 rounded w-3/4"></div>
        <div className="h-4 bg-slate-100 rounded w-1/2"></div>
        <div className="h-16 bg-slate-100 rounded"></div>
      </div>
      <div className="pt-4 border-t border-slate-100 flex items-center justify-between mt-4">
        <div className="h-4 bg-slate-200 rounded w-28"></div>
        <div className="h-9 bg-slate-200 rounded-lg w-28"></div>
      </div>
    </div>
  );
};

export default LoadingSpinner;
