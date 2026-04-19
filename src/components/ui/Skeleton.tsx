'use client';

/**
 * Premium Skeleton Loaders
 * Shimmer-based skeleton loading states for lists, cards, tables
 */

import type { ReactNode } from 'react';

/* ═══ Base Skeleton ═══ */
export function Skeleton({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`relative overflow-hidden bg-gray-200/70 dark:bg-slate-700/40 rounded-lg ${className}`}
      {...props}
    >
      <div className="absolute inset-0 -translate-x-full skel-shimmer bg-gradient-to-r from-transparent via-white/50 dark:via-slate-600/40 to-transparent" />
      <style jsx>{`
        @keyframes skel-shimmer {
          100% { transform: translateX(100%); }
        }
        .skel-shimmer {
          animation: skel-shimmer 1.8s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

/* ═══ Page Header Skeleton ═══ */
export function PageHeaderSkeleton() {
  return (
    <div className="mb-6 p-6 sm:p-7 rounded-3xl bg-white/80 dark:bg-slate-800/60 backdrop-blur-xl border border-white/60 dark:border-slate-700/60 shadow-sm">
      <div className="flex items-center gap-4">
        <Skeleton className="w-14 h-14 rounded-2xl shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-7 w-48 rounded-lg" />
          <Skeleton className="h-4 w-64 rounded" />
        </div>
      </div>
    </div>
  );
}

/* ═══ Stat Card Skeleton ═══ */
export function StatCardSkeleton() {
  return (
    <div className="relative bg-white/80 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-white/60 dark:border-slate-700/60 p-4 sm:p-5 shadow-sm overflow-hidden">
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
        <div className="space-y-1.5 flex-1">
          <Skeleton className="h-3 w-16 rounded" />
          <Skeleton className="h-6 w-12 rounded" />
        </div>
      </div>
    </div>
  );
}

/* ═══ Stat Cards Grid ═══ */
export function StatCardsGrid({ count = 4, cols = 4 }: { count?: number; cols?: 2 | 3 | 4 }) {
  const gridClass = {
    2: 'grid-cols-2',
    3: 'grid-cols-2 sm:grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-4',
  }[cols];

  return (
    <div className={`grid ${gridClass} gap-3 sm:gap-4 mb-5`}>
      {Array.from({ length: count }).map((_, i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>
  );
}

/* ═══ List Row Skeleton ═══ */
export function ListRowSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-50 dark:border-slate-700/40 last:border-b-0">
      <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
      <div className="flex-1 space-y-1.5 min-w-0">
        <Skeleton className="h-4 w-2/3 rounded" />
        <Skeleton className="h-3 w-1/2 rounded" />
      </div>
      <Skeleton className="w-16 h-6 rounded-full" />
    </div>
  );
}

/* ═══ List Skeleton (card with rows) ═══ */
export function ListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="bg-white/80 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-white/60 dark:border-slate-700/60 shadow-sm overflow-hidden">
      {Array.from({ length: count }).map((_, i) => (
        <ListRowSkeleton key={i} />
      ))}
    </div>
  );
}

/* ═══ Card Grid Skeleton ═══ */
export function CardGridSkeleton({ count = 6, cols = 3 }: { count?: number; cols?: 1 | 2 | 3 | 4 }) {
  const gridClass = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  }[cols];

  return (
    <div className={`grid ${gridClass} gap-4`}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white/80 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-white/60 dark:border-slate-700/60 p-5 shadow-sm space-y-3"
        >
          <div className="flex items-center gap-3">
            <Skeleton className="w-12 h-12 rounded-xl shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-3/4 rounded" />
              <Skeleton className="h-3 w-1/2 rounded" />
            </div>
          </div>
          <Skeleton className="h-3 w-full rounded" />
          <Skeleton className="h-3 w-5/6 rounded" />
          <div className="flex gap-2 pt-2">
            <Skeleton className="h-8 w-20 rounded-lg" />
            <Skeleton className="h-8 w-20 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ═══ Table Skeleton ═══ */
export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="bg-white/80 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-white/60 dark:border-slate-700/60 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50/70 dark:bg-slate-800/80 px-4 py-3 border-b border-gray-100 dark:border-slate-700/60">
        <div className="flex gap-4">
          {Array.from({ length: cols }).map((_, i) => (
            <Skeleton key={i} className="h-3 flex-1 rounded" />
          ))}
        </div>
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="px-4 py-4 border-b border-gray-50 dark:border-slate-700/40 last:border-b-0 flex gap-4">
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton key={j} className="h-4 flex-1 rounded" />
          ))}
        </div>
      ))}
    </div>
  );
}

/* ═══ Dashboard Page Skeleton ═══ */
export function DashboardSkeleton() {
  return (
    <div className="space-y-5">
      {/* Welcome banner */}
      <div className="relative rounded-3xl overflow-hidden bg-white/80 dark:bg-slate-800/60 backdrop-blur-xl border border-white/60 dark:border-slate-700/60 p-6 sm:p-8 shadow-sm">
        <div className="space-y-3">
          <Skeleton className="h-8 w-64 rounded-lg" />
          <Skeleton className="h-4 w-80 rounded" />
        </div>
      </div>
      {/* Stats */}
      <StatCardsGrid count={4} cols={4} />
      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white/80 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-white/60 dark:border-slate-700/60 p-5 shadow-sm space-y-3">
          <Skeleton className="h-5 w-40 rounded" />
          <Skeleton className="h-3 w-full rounded" />
          <Skeleton className="h-3 w-5/6 rounded" />
          <Skeleton className="h-3 w-4/6 rounded" />
        </div>
        <div className="bg-white/80 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-white/60 dark:border-slate-700/60 p-5 shadow-sm space-y-3">
          <Skeleton className="h-5 w-40 rounded" />
          <Skeleton className="h-3 w-full rounded" />
          <Skeleton className="h-3 w-5/6 rounded" />
          <Skeleton className="h-3 w-4/6 rounded" />
        </div>
      </div>
    </div>
  );
}

/* ═══ Text Block Skeleton ═══ */
export function TextBlockSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={`h-3 rounded ${i === lines - 1 ? 'w-3/4' : 'w-full'}`}
        />
      ))}
    </div>
  );
}

/* ═══ Full Page Loading Skeleton (with PageHeader + stats + list) ═══ */
export function ListPageSkeleton({ statsCount = 4, rowsCount = 6 }: { statsCount?: number; rowsCount?: number }) {
  return (
    <div>
      <PageHeaderSkeleton />
      <StatCardsGrid count={statsCount} cols={4} />
      <ListSkeleton count={rowsCount} />
    </div>
  );
}

/* ═══ Wrapper: Conditional Skeleton or Content ═══ */
export function Loading({
  loading,
  skeleton,
  children,
}: {
  loading: boolean;
  skeleton: ReactNode;
  children: ReactNode;
}) {
  return <>{loading ? skeleton : children}</>;
}
