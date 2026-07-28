import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import ProblemCard from '../components/ProblemCard.jsx';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';

export default function Home() {
  useDocumentTitle(null, '用 AI 解决 8 大学科 64 个世界级硬问题，链上积分奖励。');
  const [cats, setCats] = useState([]);
  const [problems, setProblems] = useState([]);
  const [stats, setStats] = useState(null);
  const [top, setTop] = useState([]);

  useEffect(() => {
    api.categories().then(r => setCats(r?.categories || [])).catch(() => setCats([]));
    api.problems({ limit: 6 }).then(r => setProblems(r?.problems || [])).catch(() => setProblems([]));
    api.stats().then(setStats).catch(() => setStats(null));
    api.leaderboard({ limit: 5 }).then(r => setTop(r?.leaderboard || [])).catch(() => setTop([]));
  }, []);

  return (
    <div>
      {/* Hero */}
      <section className="relative py-16 sm:py-24 overflow-hidden">
        <div className="container-page text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-slate-400 mb-6">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>链上 {stats?.transactions || 0} 笔交易 · {stats?.users || 0} 位解题者</span>
          </div>
          <h1 className="font-display text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-tight">
            用 <span className="gradient-text">AI</span> 解决<br className="sm:hidden" />世界上最难的
            <span className="gradient-text"> {stats?.problems || 64}</span> 个问题
          </h1>
          <p className="mt-6 text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            从黎曼猜想到室温超导，从意识本质到核聚变。<br className="hidden sm:block" />
            每个小朋友都能用 AI 尝试解决，每个解答都获得<strong className="text-amber-300">链上 HPW 积分奖励</strong>。
          </p>
          <div className="mt-8 flex items-center justify-center gap-3 flex-wrap">
            <Link to="/problems" className="btn-primary px-6 py-3 text-base">开始解题 →</Link>
            <Link to="/leaderboard" className="btn-ghost px-6 py-3 text-base">查看排行榜</Link>
          </div>
          <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 max-w-3xl mx-auto">
            {[
              { k: stats?.problems || 64, l: '硬问题' },
              { k: stats?.solutions || 0, l: '已提交解答' },
              { k: stats?.users || 0, l: '解题者' },
              { k: stats?.totalReward || 0, l: 'HPW 已发放' }
            ].map(s => (
              <div key={s.l} className="glass rounded-2xl p-4 text-center">
                <div className="text-2xl sm:text-3xl font-display font-bold gradient-text">{s.k}</div>
                <div className="text-xs text-slate-400 mt-1">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-8">
        <div className="container-page">
          <div className="flex items-end justify-between mb-6">
            <div>
              <h2 className="text-2xl sm:text-3xl font-display font-bold">8 大领域</h2>
              <p className="text-sm text-slate-400 mt-1">点击进入任一领域，看看人类还没解决的问题</p>
            </div>
            <Link to="/problems" className="text-sm text-violet-400 hover:text-violet-300">全部问题 →</Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {cats.map(c => (
              <Link key={c.id} to={`/problems?category=${c.id}`}
                className={`group relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br ${c.color} hover:scale-[1.02] transition-transform`}>
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors" />
                <div className="relative">
                  <div className="text-3xl font-mono font-bold opacity-80">{c.icon}</div>
                  <div className="mt-2 text-lg font-display font-bold text-white">{c.name}</div>
                  <div className="text-xs text-white/70 mt-1">{c.blurb}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured problems */}
      <section className="py-8">
        <div className="container-page">
          <div className="flex items-end justify-between mb-6">
            <div>
              <h2 className="text-2xl sm:text-3xl font-display font-bold">🔥 高分悬赏</h2>
              <p className="text-sm text-slate-400 mt-1">挑战这些大难题，最高可获数千 HPW 奖励</p>
            </div>
            <Link to="/problems?sort=reward" className="text-sm text-violet-400 hover:text-violet-300">查看全部 →</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {problems.sort((a,b) => b.reward - a.reward).slice(0, 6).map(p => (
              <ProblemCard key={p.id} problem={p} />
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-12">
        <div className="container-page">
          <h2 className="text-2xl sm:text-3xl font-display font-bold text-center mb-10">怎么玩？3 步开始</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { i: '1', t: '选一个问题', d: '从数学、物理到哲学、社会，挑一个你觉得有趣的' },
              { i: '2', t: '用 AI 解题', d: '一键调用 AI 给出思路，再结合你的理解撰写解答' },
              { i: '3', t: '获得 HPW', d: '提交解答后 AI 自动评估，奖励自动上链，进入排行榜' }
            ].map(s => (
              <div key={s.i} className="card text-center">
                <div className="w-12 h-12 mx-auto rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-xl font-bold">{s.i}</div>
                <h3 className="mt-3 font-display font-bold text-lg">{s.t}</h3>
                <p className="text-sm text-slate-400 mt-2">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Top solvers */}
      {top.length > 0 && (
        <section className="py-8">
          <div className="container-page">
            <div className="flex items-end justify-between mb-6">
              <h2 className="text-2xl sm:text-3xl font-display font-bold">🏆 当前榜首</h2>
              <Link to="/leaderboard" className="text-sm text-violet-400 hover:text-violet-300">完整榜单 →</Link>
            </div>
            <div className="card divide-y divide-white/5">
              {top.map((u, i) => (
                <Link key={u.id} to={`/u/${u.username}`} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0 hover:bg-white/5 -mx-2 px-2 rounded-lg">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${i === 0 ? 'bg-amber-500/20 text-amber-300' : i === 1 ? 'bg-slate-400/20 text-slate-300' : i === 2 ? 'bg-orange-500/20 text-orange-300' : 'bg-white/5 text-slate-400'}`}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{u.username}</div>
                    <div className="text-xs text-slate-500">{u.solutionCount} 解答 · {u.netVotes} 净投票</div>
                  </div>
                  <div className="font-mono text-amber-300">⚡ {u.totalScore}</div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
