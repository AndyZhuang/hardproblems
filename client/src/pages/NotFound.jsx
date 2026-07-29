import React from 'react';
import { Link } from 'react-router-dom';
import { useI18n, t } from '../lib/i18n.js';
import { PROBLEMS } from '../lib/problems.js';

export default function NotFound() {
  const { lang } = useI18n();
  const count = PROBLEMS.length;
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-6">
      <div className="text-7xl mb-4">🧭</div>
      <h1 className="text-3xl font-bold text-white mb-2">{t('notFound.title')}</h1>
      <p className="text-slate-300 max-w-md mb-6">
        {t('notFound.desc', { n: count })}
      </p>
      <div className="flex flex-wrap gap-3 justify-center">
        <Link to="/" className="px-5 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-sm">{t('notFound.home')}</Link>
        <Link to="/problems" className="px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm">{t('notFound.browse')}</Link>
        <Link to="/leaderboard" className="px-5 py-2.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-200 text-sm">{t('notFound.rank')}</Link>
      </div>
    </div>
  );
}
