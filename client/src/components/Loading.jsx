import React from 'react';

/**
 * 通用加载占位符
 * - fullPage: 全屏 loading（默认）
 * - inline / skeleton: 局部骨架屏
 */
export function Loading({ label = '加载中…', fullPage = true }) {
  if (fullPage) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-slate-300 gap-3">
        <div className="w-10 h-10 border-2 border-slate-700 border-t-indigo-400 rounded-full animate-spin" />
        <div className="text-sm">{label}</div>
      </div>
    );
  }
  return <span className="text-slate-400 text-sm">{label}</span>;
}

/** 卡片骨架屏 */
export function CardSkeleton({ count = 6 }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 space-y-3 animate-pulse"
        >
          <div className="h-3 w-16 bg-slate-800 rounded" />
          <div className="h-5 w-3/4 bg-slate-800 rounded" />
          <div className="h-3 w-full bg-slate-800 rounded" />
          <div className="h-3 w-5/6 bg-slate-800 rounded" />
          <div className="flex gap-2 pt-2">
            <div className="h-5 w-12 bg-slate-800 rounded-full" />
            <div className="h-5 w-16 bg-slate-800 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** 列表骨架屏 */
export function ListSkeleton({ rows = 5 }) {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 rounded-lg bg-slate-900/40">
          <div className="h-10 w-10 rounded-full bg-slate-800" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-1/3 bg-slate-800 rounded" />
            <div className="h-3 w-1/2 bg-slate-800 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
