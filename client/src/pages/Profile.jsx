import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import { BADGES, getBadgesForUser } from '../lib/badges.js';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';

export default function Profile() {
  const { username } = useParams();
  const [data, setData] = useState(null);
  const [solutions, setSolutions] = useState([]);
  const [addressData, setAddressData] = useState(null);
  const [loading, setLoading] = useState(true);
  useDocumentTitle(data ? `${data.username} 的主页` : '用户主页', data?.bio);

  useEffect(() => {
    setLoading(true);
    api.getUser(username)
      .then(r => {
        setData(r.user);
        return Promise.all([
          api.solutions({ user_id: r.user.id, limit: 50 }).catch(() => ({ solutions: [] })),
          api.address(r.user.walletAddress, { limit: 30 }).catch(() => ({ transactions: [] }))
        ]);
      })
      .then(([s, a]) => {
        setSolutions(s?.solutions || []);
        setAddressData(a);
      })
      .catch(e => alert(e.message))
      .finally(() => setLoading(false));
  }, [username]);

  if (loading) return <div className="container-page py-20 text-center text-slate-400">加载中...</div>;
  if (!data) return <div className="container-page py-20 text-center text-slate-400">用户不存在</div>;

  const userBadges = getBadgesForUser({ totalScore: data.totalScore, solutionCount: solutions.length });
  const nextBadge = BADGES.find(b => data.totalScore < b.min_score || solutions.length < b.min_solutions);

  return (
    <div className="container-page py-8">
      <div className="card mb-6">
        <div className="flex items-start gap-4 flex-wrap">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-2xl sm:text-3xl font-display font-bold flex-shrink-0">
            {data.username[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-display font-bold">{data.username}</h1>
              {userBadges.length > 0 && (
                <div className="flex items-center gap-1">
                  {userBadges.map(b => (
                    <span key={b.id} title={b.name} className={`text-lg ${b.color}`}>{b.icon}</span>
                  ))}
                </div>
              )}
            </div>
            {data.bio && <p className="text-slate-400 mt-1">{data.bio}</p>}
            <div className="text-xs text-slate-500 mt-2">
              加入于 {new Date(data.createdAt).toLocaleDateString('zh-CN')}
            </div>
            {nextBadge && (
              <div className="mt-2 text-xs text-slate-400">
                <span className="opacity-60">下一勋章:</span> {nextBadge.icon} {nextBadge.name} ·
                需 ⚡{nextBadge.min_score - data.totalScore} HPW + {nextBadge.min_solutions - solutions.length} 解答
              </div>
            )}
          </div>
          <div className="text-right">
            <div className="text-3xl sm:text-4xl font-display font-bold gradient-text">⚡ {data.balance}</div>
            <div className="text-xs text-slate-500 mt-1">HPW 余额</div>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-white/5 grid grid-cols-3 gap-3 text-center text-sm">
          <div>
            <div className="font-bold text-lg">{solutions.length}</div>
            <div className="text-xs text-slate-500">解答数</div>
          </div>
          <div>
            <div className="font-bold text-lg">{addressData?.transactions?.length || 0}</div>
            <div className="text-xs text-slate-500">链上交易</div>
          </div>
          <div>
            <div className="font-bold text-lg text-amber-300">{data.totalScore}</div>
            <div className="text-xs text-slate-500">累计获得</div>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-white/5">
          <div className="text-xs text-slate-500 mb-1">🔑 区块链钱包地址</div>
          <code className="text-xs font-mono text-violet-300 break-all">{data.walletAddress}</code>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <h2 className="text-xl font-display font-bold mb-3">💬 解答</h2>
          {solutions.length === 0 ? (
            <div className="card text-center text-slate-500 py-12">
              <div className="text-3xl mb-2">🌱</div>
              还没提交过解答
            </div>
          ) : (
            <div className="space-y-3">
              {solutions.map(s => (
                <Link key={s.id} to={`/problems/${s.problemId}`} className="card block hover:border-violet-400/30">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="badge bg-violet-500/15 text-violet-300">{s.problemId}</span>
                    {s.aiAssisted && <span className="badge bg-fuchsia-500/15 text-fuchsia-300">🤖</span>}
                    {s.aiQualityScore > 0 && <span className="badge bg-white/5 text-slate-400">AI {s.aiQualityScore}</span>}
                    <span className="ml-auto">{new Date(s.createdAt).toLocaleString('zh-CN', { hour12: false })}</span>
                  </div>
                  {s.title && <h3 className="font-display font-bold text-lg mt-1">{s.title}</h3>}
                  <p className="text-sm text-slate-300 mt-1 line-clamp-3 whitespace-pre-wrap">{s.content}</p>
                  <div className="mt-2 text-xs text-slate-500">
                    {s.votesUp} 赞 / {s.votesDown} 踩 · 奖励 <b className="text-amber-300">⚡{s.scoreAwarded}</b>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="text-xl font-display font-bold mb-3">📨 链上记录</h2>
          <div className="space-y-2 max-h-[700px] overflow-y-auto scrollbar-thin pr-2">
            {addressData?.transactions?.length === 0 ? (
              <div className="card text-center text-slate-500 py-6 text-sm">暂无链上交易</div>
            ) : addressData?.transactions?.map(t => (
              <div key={t.id} className="card p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className={`badge ${t.type === 'reward' ? 'bg-amber-500/15 text-amber-300' : 'bg-cyan-500/15 text-cyan-300'}`}>{t.type}</span>
                  <span className="font-mono text-amber-300">+{t.amount}</span>
                </div>
                <div className="text-xs text-slate-400 mt-1 line-clamp-2">{t.note}</div>
                <div className="text-xs text-slate-500 font-mono mt-1">区块 {t.block_id?.slice(0, 8) || 'pending'} · {new Date(t.timestamp).toLocaleTimeString('zh-CN', { hour12: false })}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
