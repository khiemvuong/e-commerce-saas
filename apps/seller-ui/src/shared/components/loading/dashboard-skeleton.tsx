'use client';

import React from 'react';

/**
 * Dashboard Skeleton - Shows loading state while dashboard is loading
 * Mimics the dashboard layout structure
 */
const DashboardSkeleton = () => {
  return (
    <div className="flex h-full bg-black min-h-screen animate-pulse">
      {/* Sidebar Skeleton */}
      <aside className="w-[280px] min-w-[250px] max-w-[300px] border-r border-r-slate-800 p-4">
        <div className="sticky top-0">
          {/* Logo area */}
          <div className="flex gap-2 mb-8">
            <div className="w-10 h-10 bg-slate-700 rounded-lg" />
            <div className="flex-1">
              <div className="h-5 bg-slate-700 rounded w-24 mb-2" />
              <div className="h-3 bg-slate-700 rounded w-32" />
            </div>
          </div>

          {/* Menu items */}
          <div className="space-y-2">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg">
                <div className="w-5 h-5 bg-slate-700 rounded" />
                <div className="h-4 bg-slate-700 rounded w-20" />
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* Main Content Skeleton */}
      <main className="flex-1 p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="h-8 bg-slate-800 rounded w-48 mb-2" />
          <div className="h-4 bg-slate-800 rounded w-64" />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-slate-800 rounded-xl p-6">
              <div className="h-4 bg-slate-700 rounded w-20 mb-3" />
              <div className="h-8 bg-slate-700 rounded w-16" />
            </div>
          ))}
        </div>

        {/* Content area */}
        <div className="bg-slate-800 rounded-xl p-6">
          <div className="h-6 bg-slate-700 rounded w-32 mb-4" />
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-slate-700 rounded" />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardSkeleton;
