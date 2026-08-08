import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import { lazy, Suspense, useState, useEffect } from 'react';
import { api } from '../lib/api.js';
import PWABanner from './PWABanner.jsx';
import LangSwitcher from './LangSwitcher.jsx';
import { useI18n, t } from '../lib/i18n.js';

// 钱包按钮 + viem 按需加载（懒加载 chunk，约 300KB）
const WalletButton = lazy(() => import('./WalletButton.jsx'));

export default function Layout() {
  const { user, loading, logout } = useAuth();
  const { lang } = useI18n();
  const loc = useLocation();
  const [stats, setStats] = useState(null);
  const [chainInfo, setChainInfo] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  // NAV 随语言变化重新计算
  const NAV = [
    { to: '/problems', label: t('nav.problems') },
    { to: '/leaderboard', label: t('nav.leaderboard') },
    { to: '/chain', label: t('nav.chain') }
  ];

  useEffect(() => {
    api.stats().then(s => setStats(s)).catch(() => {});
    api.chainInfo().then(c => setChainInfo(c)).catch(() => {});
    const t = setInterval(() => {
      api.stats().then(s => setStats(s)).catch(() => {});
      api.chainInfo().then(c => setChainInfo(c)).catch(() => {});
    }, 8000);
    return () => clearInterval(t);
  }, [loc.pathname, lang]);

  return (
    <div className="min-h-full bg-stars bg-grid relative">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-violet-900/20 via-transparent to-transparent" />
      <div className="relative z-10">
        <PWABanner />
        <header className="sticky top-0 z-40 backdrop-blur-xl bg-[#0a0a0f]/70 border-b border-white/5">
          <div className="container-page flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="text-2xl font-display font-extrabold gradient-text group-hover:scale-105 transition-transform">HardProblems</div>
              <span className="hidden sm:inline text-xs text-slate-400 font-mono">.world</span>
            </Link>
            <nav className="hidden md:flex items-center gap-1">
              {NAV.map(n => (
                <Link key={n.to} to={n.to}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${loc.pathname.startsWith(n.to) ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
                  {n.label}
                </Link>
              ))}
            </nav>
            <div className="flex items-center gap-2">
              {stats && (
                <div className="hidden lg:flex items-center gap-3 text-xs text-slate-400 mr-2">
                  <span><b className="text-slate-200">{stats.problems}</b> {lang === 'zh-CN' ? '题' : 'p'}</span>
                  <span><b className="text-slate-200">{stats.solutions}</b> {lang === 'zh-CN' ? '答' : 's'}</span>
                  <span><b className="text-emerald-300">{stats.users}</b> {lang === 'zh-CN' ? '人' : 'u'}</span>
                </div>
              )}
              <LangSwitcher />
              <Suspense fallback={null}>
                <WalletButton />
              </Suspense>
              {loading ? null : user ? (
                <div className="flex items-center gap-2">
                  <Link to={`/u/${user.username}`} className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-white/5">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-xs font-bold">
                      {user.username[0].toUpperCase()}
                    </div>
                    <div className="hidden sm:block text-sm">
                      <div className="font-medium">{user.username}</div>
                      <div className="text-xs text-amber-300 -mt-0.5">⚡ {user.balance} HPW</div>
                    </div>
                  </Link>
                  <button onClick={logout} className="text-xs text-slate-500 hover:text-slate-300 px-2">{t('nav.logout')}</button>
                </div>
              ) : (
                <Link to="/auth" className="btn-primary text-sm">{t('nav.login')} / {t('nav.register')}</Link>
              )}
              <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2 text-slate-400" aria-label="Menu">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
              </button>
            </div>
          </div>
          {menuOpen && (
            <div className="md:hidden border-t border-white/5 px-4 py-2 flex flex-col gap-1">
              {NAV.map(n => (
                <Link key={n.to} to={n.to} onClick={() => setMenuOpen(false)}
                  className="px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-white/5">
                  {n.label}
                </Link>
              ))}
            </div>
          )}
        </header>

        <main className="min-h-[calc(100vh-4rem-3rem)]">
          <Outlet />
        </main>

        <footer className="mt-16 border-t border-white/5 py-8 text-center text-xs text-slate-500">
          <div className="container-page">
            <div>HardProblems.World — {lang === 'zh-CN' ? '让任何人都能用 AI 解决世界上最难的问题' : 'Let anyone solve the world\'s hardest problems with AI'}</div>
            <div className="mt-2 flex items-center justify-center gap-4 flex-wrap">
              {chainInfo && (
                <span>
                  {lang === 'zh-CN'
                    ? <>链高 <b className="text-slate-300">{chainInfo.blockCount}</b> 区块 · <b className="text-slate-300">{chainInfo.txCount}</b> 交易</>
                    : <>Height <b className="text-slate-300">{chainInfo.blockCount}</b> · <b className="text-slate-300">{chainInfo.txCount}</b> txs</>
                  }
                </span>
              )}
              <span className="hidden sm:inline">·</span>
              <span>{lang === 'zh-CN' ? '每个解答获得 HPW 积分奖励' : 'Every solution earns HPW points'}</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
