import React from 'react';

interface SkeletonProps {
  className?: string;
  height?: string;
  width?: string;
}

export const SkeletonLoader: React.FC<SkeletonProps> = ({ className = '', height = 'h-4', width = 'w-full' }) => {
  return (
    <div 
      className={`animate-pulse bg-slate-200 dark:bg-slate-700 rounded-md ${height} ${width} ${className}`}
    />
  );
};

export const CardSkeleton: React.FC = () => (
  <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
    <div className="flex items-center gap-4 mb-4">
      <SkeletonLoader height="h-12" width="w-12" className="rounded-full" />
      <div className="flex-1 space-y-2">
        <SkeletonLoader height="h-4" width="w-1/3" />
        <SkeletonLoader height="h-3" width="w-1/2" />
      </div>
    </div>
    <div className="space-y-3">
      <SkeletonLoader height="h-4" />
      <SkeletonLoader height="h-4" />
      <SkeletonLoader height="h-4" width="w-2/3" />
    </div>
  </div>
);
