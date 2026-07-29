import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import ProblemCard from '../components/ProblemCard.jsx';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import { PROBLEMS } from '../lib/problems.js';

const STATUS_OPTS = [
  { v: '', l: '全部' },
  { v: 'open', l: '未解' },
  { v: 'partially_solved', l: '部分解' },
  { v: 'solved', l: '已解' }
];

export default function Problems() {
  useDocumentTitle('硬问题列表', `8 大学科 ${PROBLEMS.length} 个世界级硬问题，按学科、状态、关键词筛选。`);
  const [sp, setSp] = useSearchParams();
  const [cats, setCats] = useState([]);
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  const category = sp.get('category') || 'all';
  const search = sp.get('search') || '';
  const status = sp.get('status') || '';

  useEffect(() => {
    api.categories().then(r => setCats(r?.categories || [])).catch(() => setCats([]));
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = {};
    if (category && category !== 'all') params.category = category;
    if (search) params.search = search;
    if (status) params.status = status;
    api.problems(params).then(r => {
      setProblems(r?.problems || []);
      setTotal(r?.total || 0);
    }).catch(() => {
      setProblems([]);
      setTotal(0);
    }).finally(() => setLoading(false));
  }, [category, search, status]);

  const setParam = (k, v) => {
    const next = new URLSearchParams(sp);
    if (v) next.set(k, v);
    else next.delete(k);
    setSp(next);
  };

  return (
    <div className="container-page py-8">
      <div className="mb-6">
        <h1 className="text-3xl sm:text-4xl font-display font-bold">所有硬问题</h1>
        <p className="text-slate-400 mt-2 text-sm">{total} 个挑战，覆盖 8 个领域</p>
      </div>

      <div className="flex flex-col gap-3 mb-6">
        <input
          type="text"
          value={search}
          onChange={e => setParam('search', e.target.value)}
          placeholder="🔍 搜索问题、标签、关键词..."
          className="input"
        />
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setParam('category', 'all')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${category === 'all' ? 'bg-white text-slate-900' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}>
            全部
          </button>
          {cats.map(c => (
            <button key={c.id}
              onClick={() => setParam('category', c.id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${category === c.id ? 'bg-white text-slate-900' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}>
              <span className="mr-1">{c.icon}</span>{c.name}
            </button>
          ))}
        </div>
        <div className="flex gap-1.5">
          {STATUS_OPTS.map(s => (
            <button key={s.v}
              onClick={() => setParam('status', s.v)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${(status || '') === s.v ? 'bg-amber-500/30 text-amber-200' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}>
              {s.l}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-400">加载中...</div>
      ) : problems.length === 0 ? (
        <div className="text-center py-20 text-slate-500">
          <div className="text-4xl mb-2">🔍</div>
          没找到匹配的问题，试试别的关键词？
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {problems.map(p => <ProblemCard key={p.id} problem={p} />)}
        </div>
      )}
    </div>
  );
}
