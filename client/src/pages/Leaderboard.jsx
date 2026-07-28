import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import { useI18n, t } from '../lib/i18n.js';

export default function Leaderboard() {
  const { lang } = useI18n();
  useDocumentTitle(
    lang === 'zh-CN' ? '排行榜' : 'Leaderboard',
    lang === 'zh-CN' ? '看看谁在解决硬问题，按学科筛选' : 'See who\'s solving hard problems, filter by category'
  );
  const [lb, setLb] = useState([]);
  const [stats, setStats] = useState(null);
  const [category, setCategory] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.leaderboard(category !== 'all' ? { category } : {}).then(r => setLb(r?.leaderboard || [])).catch(() => setLb([])).finally(() => setLoading(false));
    api.stats().then(setStats).catch(() => setStats(null));
  }, [category]);

  return (
    <div className="container-page py-8">
      <div className="mb-6">
        <h1 className="text-3xl sm:text-4xl font-display font-bold">🏆 {t('leaderboard.title')}</h1>
        <p className="text-slate-400 mt-2 text-sm">{t('leaderboard.subtitle')}</p>
      </div>

      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
          {[
            { l: t('leaderboard.solvers'), v: stats.users, c: 'text-violet-300' },
            { l: t('leaderboard.solutions'), v: stats.solutions, c: 'text-fuchsia-300' },
            { l: t('leaderboard.txOnChain'), v: stats.transactions, c: 'text-cyan-300' },
            { l: t('leaderboard.height'), v: stats.blocks, c: 'text-emerald-300' },
            { l: t('leaderboard.rewardsPaid'), v: stats.totalReward, c: 'text-amber-300' }
          ].map(s => (
            <div key={s.l} className="card text-center">
              <div className={`text-2xl font-display font-bold ${s.c}`}>{s.v}</div>
              <div className="text-xs text-slate-500 mt-1">{s.l}</div>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-1.5 mb-4">
        <CategoryTab id="all" name={t('common.all')} current={category} onClick={setCategory} />
        {stats?.categories?.map(c => (
          <CategoryTab key={c.id} id={c.id} name={`${t('categories.' + c.id) || c.name} (${c.solved}/${c.count})`} current={category} onClick={setCategory} />
        ))}
      </div>

      <div className="card overflow-hidden p-0">
        {loading ? (
          <div className="p-8 text-center text-slate-400">{t('common.loading')}</div>
        ) : lb.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <div className="text-4xl mb-2">🏁</div>
            {lang === 'zh-CN' ? '还没有人来答题。' : 'No one has submitted yet.'}
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {lb.map(u => (
              <Link key={u.id} to={`/u/${u.username}`} className="flex items-center gap-3 p-4 hover:bg-white/5 transition-colors">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-display font-bold text-sm flex-shrink-0 ${u.rank === 1 ? 'bg-amber-500/20 text-amber-300 ring-2 ring-amber-400/30' : u.rank === 2 ? 'bg-slate-400/20 text-slate-200' : u.rank === 3 ? 'bg-orange-500/20 text-orange-300' : 'bg-white/5 text-slate-500'}`}>
                  {u.rank}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium truncate">{u.username}</span>
                    {u.badges && u.badges.length > 0 && (
                      <div className="flex items-center gap-0.5">
                        {u.badges.slice(-3).map(b => (
                          <span key={b.id} title={b.name} className={`text-sm ${b.color}`}>{b.icon}</span>
                        ))}
                      </div>
                    )}
                    {u.bio && <span className="text-xs text-slate-500 truncate hidden sm:inline">· {u.bio}</span>}
                  </div>
                  <div className="text-xs text-slate-500">
                    {u.solutionCount} 解答 · {u.netVotes} 净投票 · <span className="font-mono">{u.wallet.slice(0, 10)}…</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-display font-bold text-lg text-amber-300">⚡ {u.totalScore}</div>
                  <div className="text-xs text-slate-500">HPW</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {stats?.badges && (
        <div className="mt-8">
          <h2 className="text-xl font-display font-bold mb-3">🎖 挑战者勋章</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {stats.badges.map(b => (
              <div key={b.id} className="card text-center">
                <div className="text-3xl mb-1">{b.icon}</div>
                <div className={`font-display font-bold text-sm ${b.color}`}>{b.name}</div>
                <div className="text-xs text-slate-500 mt-1">⚡ {b.min_score} · {b.min_solutions} 解答</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function CategoryTab({ id, name, current, onClick }) {
  const active = current === id;
  return (
    <button onClick={() => onClick(id)}
      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${active ? 'bg-white text-slate-900' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}>
      {name}
    </button>
  );
}
