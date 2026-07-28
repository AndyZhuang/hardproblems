import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-6">
      <div className="text-7xl mb-4">🧭</div>
      <h1 className="text-3xl font-bold text-white mb-2">404 — 这页走丢了</h1>
      <p className="text-slate-300 max-w-md mb-6">
        你要找的页面不存在，或者还没有被收录到 HardProblems 的索引里。
        不如去看看 64 个硬问题？
      </p>
      <div className="flex flex-wrap gap-3 justify-center">
        <Link
          to="/"
          className="px-5 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-sm"
        >
          ← 回到首页
        </Link>
        <Link
          to="/problems"
          className="px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm"
        >
          浏览问题
        </Link>
        <Link
          to="/leaderboard"
          className="px-5 py-2.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-200 text-sm"
        >
          排行榜
        </Link>
      </div>
    </div>
  );
}
