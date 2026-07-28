import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import { useState, useEffect } from 'react';
import { api } from '../lib/api.js';

const NAV = [
  { to: '/problems', label: '硬问题' },
  { to: '/leaderboard', label: '排行榜' },
  { to: '/chain', label: '区块链' }
];

export default function Layout() {
  const { user, loading, logout } = useAuth();
  const loc = useLocation();
  const [stats, setStats] = useState(null);
  const [chainInfo, setChainInfo] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    api.stats().then(s => setStats(s)).catch(() => {});
    api.chainInfo().then(c => setChainInfo(c)).catch(() => {});
    const t = setInterval(() => {
      api.stats().then(s => setStats(s)).catch(() => {});
      api.chainInfo().then(c => setChainInfo(c)).catch(() => {});
    }, 8000);
    return () => clearInterval(t);
  }, [loc.pathname]);

  return (
    <div className="min-h-full bg-stars bg-grid relative">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-violet-900/20 via-transparent to-transparent" />
      <div className="relative z-10">
        <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#0a0a0f]/70 border-b border-white/5">
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
                  <span><b className="text-slate-200">{stats.problems}</b> 题</span>
                  <span><b className="text-slate-200">{stats.solutions}</b> 答</span>
                  <span><b className="text-emerald-300">{stats.users}</b> 人</span>
                </div>
              )}
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
                  <button onClick={logout} className="text-xs text-slate-500 hover:text-slate-300 px-2">退出</button>
                </div>
              ) : (
                <Link to="/auth" className="btn-primary text-sm">登录 / 注册</Link>
              )}
              <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2 text-slate-400">
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
            <div>HardProblems.World — 让任何人都能用 AI 解决世界上最难的问题</div>
            <div className="mt-2 flex items-center justify-center gap-4">
              {chainInfo && (
                <span>链高 <b className="text-slate-300">{chainInfo.blockCount}</b> 区块 · <b className="text-slate-300">{chainInfo.txCount}</b> 交易</span>
              )}
              <span className="hidden sm:inline">·</span>
              <span>每个解答获得 HPW 积分奖励</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
