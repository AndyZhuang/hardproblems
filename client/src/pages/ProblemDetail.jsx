import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useAuth } from '../hooks/useAuth.jsx';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';

const DIFFICULTY_LABEL = ['', '入门', '简单', '中等', '困难', '极难'];
const STATUS_LABEL = { open: '未解', partially_solved: '部分', solved: '已解' };
const STATUS_COLOR = { open: 'bg-amber-500/20 text-amber-300', partially_solved: 'bg-cyan-500/20 text-cyan-300', solved: 'bg-emerald-500/20 text-emerald-300' };

export default function ProblemDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [problem, setProblem] = useState(null);
  const [solutions, setSolutions] = useState([]);
  const [loading, setLoading] = useState(true);

  // AI 求解
  const [aiSolving, setAiSolving] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [aiInput, setAiInput] = useState('');

  // 提交解答
  const [showSubmit, setShowSubmit] = useState(false);
  const [submitContent, setSubmitContent] = useState('');
  const [submitTitle, setSubmitTitle] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState(null);

  useDocumentTitle(problem?.title || '加载中…', problem?.summary);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.problem(id).catch(() => null),
      api.solutions({ problem_id: id, sort: 'top', limit: 50 }).catch(() => ({ solutions: [] }))
    ]).then(([p, s]) => {
      setProblem(p?.problem || null);
      setSolutions(s?.solutions || []);
    }).catch(e => alert(e.message)).finally(() => setLoading(false));
  }, [id]);

  const handleAiSolve = async () => {
    if (!user) { navigate('/auth'); return; }
    setAiSolving(true);
    setAiResult(null);
    try {
      const r = await api.solve(id, aiInput);
      setAiResult(r);
      // 把 AI 结果填充到提交框，方便用户编辑提交
      setSubmitContent(r.solution);
      setSubmitTitle(`AI 解题: ${problem.title}`);
    } catch (e) {
      setAiResult({ error: e.message });
    } finally {
      setAiSolving(false);
    }
  };

  const handleSubmit = async () => {
    if (!user) { navigate('/auth'); return; }
    if (submitContent.length < 20) { alert('解答内容太短（至少 20 字）'); return; }
    setSubmitting(true);
    try {
      const r = await api.submitSolution({
        problem_id: id,
        title: submitTitle,
        content: submitContent,
        ai_assisted: !!aiResult,
        ai_model: aiResult?.model || ''
      });
      setSubmitResult(r);
      // 刷新解答列表
      const s = await api.solutions({ problem_id: id, sort: 'top', limit: 50 });
      setSolutions(s.solutions);
    } catch (e) {
      alert('提交失败: ' + e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleVote = async (solId, value) => {
    if (!user) { navigate('/auth'); return; }
    try {
      await api.vote(solId, value);
      const s = await api.solutions({ problem_id: id, sort: 'top', limit: 50 });
      setSolutions(s.solutions);
    } catch (e) {
      alert(e.message);
    }
  };

  if (loading) return <div className="container-page py-20 text-center text-slate-400">加载中...</div>;
  if (!problem) return <div className="container-page py-20 text-center text-slate-400">问题不存在</div>;

  return (
    <div className="container-page py-8">
      <Link to="/problems" className="text-sm text-slate-500 hover:text-slate-300">← 返回问题列表</Link>

      {/* 标题区 */}
      <div className="mt-4 mb-8">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className={`badge ${STATUS_COLOR[problem.status]}`}>{STATUS_LABEL[problem.status]}</span>
          <span className="badge bg-white/10 text-slate-300">{DIFFICULTY_LABEL[problem.difficulty]}</span>
          <span className="badge bg-violet-500/15 text-violet-300">{problem.category}</span>
          <span className="text-xs text-slate-500 font-mono ml-auto">{problem.year} · {problem.proposer || '—'}</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-display font-extrabold leading-tight">{problem.title}</h1>
        <div className="text-slate-500 font-mono mt-1">{problem.titleEn}</div>
        <p className="text-lg text-slate-300 mt-4 leading-relaxed">{problem.summary}</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {problem.tags.map(t => <span key={t} className="badge bg-white/5 text-slate-400">#{t}</span>)}
          <span className="ml-auto text-amber-300 font-mono">⚡ 奖励 {problem.reward} HPW</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧主内容 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 小朋友版 */}
          <div className="card bg-gradient-to-br from-amber-500/10 to-orange-500/5 border-amber-500/20">
            <div className="flex items-start gap-3">
              <div className="text-3xl">🧒</div>
              <div className="flex-1">
                <h2 className="text-lg font-display font-bold text-amber-200 mb-2">小朋友版解释</h2>
                <p className="text-slate-200 leading-relaxed">{problem.kid}</p>
              </div>
            </div>
          </div>

          {/* 严格陈述 */}
          <div className="card">
            <h2 className="text-lg font-display font-bold mb-2">📐 严格陈述</h2>
            <p className="text-slate-300 leading-relaxed whitespace-pre-line">{problem.formal}</p>
          </div>

          {/* 为什么难 */}
          <div className="card">
            <h2 className="text-lg font-display font-bold mb-2">🔥 为什么这么难</h2>
            <p className="text-slate-300 leading-relaxed whitespace-pre-line">{problem.whyHard}</p>
          </div>

          {/* AI 解题 */}
          <div className="card border-violet-500/30 bg-gradient-to-br from-violet-500/5 to-fuchsia-500/5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-display font-bold">🤖 AI 助手解题</h2>
              <span className="text-xs text-slate-500">调用真实 LLM</span>
            </div>
            <p className="text-sm text-slate-400 mb-3">
              告诉 AI 你的想法或附加要求，AI 会按"科普 → 学术 → 思路"三层结构来解答这个问题。
            </p>
            <textarea
              className="input min-h-[80px] text-sm"
              value={aiInput}
              onChange={e => setAiInput(e.target.value)}
              placeholder="（可选）想从哪里切入？有什么特殊视角？比如：用 8 岁能懂的语言 / 重点在数学严格证明 / 给我 3 个可实验的方向..."
            />
            <div className="mt-3 flex items-center gap-2">
              <button onClick={handleAiSolve} disabled={aiSolving} className="btn-primary">
                {aiSolving ? '🌀 AI 思考中…' : '✨ 让 AI 解题'}
              </button>
              {aiResult && !aiResult.error && (
                <span className="text-xs text-slate-500">来源: {aiResult.source === 'llm' ? `LLM (${aiResult.model})` : '启发式回退'}</span>
              )}
            </div>
            {aiResult?.error && (
              <div className="mt-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-sm">❌ {aiResult.error}</div>
            )}
            {aiResult?.solution && !aiResult.error && (
              <div className="mt-4 max-h-[500px] overflow-y-auto scrollbar-thin p-4 rounded-lg bg-black/30 border border-white/5">
                <pre className="whitespace-pre-wrap text-sm text-slate-200 font-mono leading-relaxed">{aiResult.solution}</pre>
              </div>
            )}
          </div>

          {/* 提交解答 */}
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-display font-bold">✍️ 提交你的解答</h2>
              <button onClick={() => setShowSubmit(!showSubmit)} className="text-sm text-violet-400 hover:text-violet-300">
                {showSubmit ? '收起' : '展开'}
              </button>
            </div>
            {showSubmit && (
              <>
                <input
                  type="text"
                  className="input mb-2"
                  placeholder="解答标题（可选）"
                  value={submitTitle}
                  onChange={e => setSubmitTitle(e.target.value)}
                />
                <textarea
                  className="input min-h-[200px] text-sm font-mono"
                  placeholder="写你的解答... （可以基于上面的 AI 结果修改）"
                  value={submitContent}
                  onChange={e => setSubmitContent(e.target.value)}
                />
                <div className="mt-3 flex items-center justify-between">
                  <div className="text-xs text-slate-500">
                    提交后 AI 会自动评估。评分 ≥ 60 会获得额外奖励。
                  </div>
                  <button onClick={handleSubmit} disabled={submitting} className="btn-primary">
                    {submitting ? '提交中…' : '提交并上链 →'}
                  </button>
                </div>
                {submitResult && (
                  <div className="mt-3 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                    <div className="text-emerald-300 font-medium">✅ 提交成功！</div>
                    <div className="text-sm text-slate-300 mt-1">
                      AI 评分: <b>{submitResult.evaluation.score}</b> · 获得 <b className="text-amber-300">{submitResult.reward} HPW</b>
                    </div>
                    {submitResult.evaluation.reasoning && (
                      <div className="text-xs text-slate-400 mt-2">{submitResult.evaluation.reasoning}</div>
                    )}
                    {submitResult.evaluation.strengths?.length > 0 && (
                      <div className="text-xs text-emerald-300/80 mt-2">
                        优势: {submitResult.evaluation.strengths.join('; ')}
                      </div>
                    )}
                    {submitResult.evaluation.weaknesses?.length > 0 && (
                      <div className="text-xs text-amber-300/80 mt-1">
                        不足: {submitResult.evaluation.weaknesses.join('; ')}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* 解答列表 */}
          <div>
            <h2 className="text-2xl font-display font-bold mb-4">💬 解答 · {solutions.length}</h2>
            {solutions.length === 0 ? (
              <div className="card text-center py-12 text-slate-500">
                <div className="text-3xl mb-2">🌱</div>
                还没有解答。要不要做第一个？
              </div>
            ) : (
              <div className="space-y-3">
                {solutions.map(s => (
                  <SolutionCard key={s.id} solution={s} onVote={handleVote} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 右侧侧边栏 */}
        <div className="space-y-4">
          <div className="card">
            <h3 className="text-sm font-bold text-slate-300 mb-2">📋 问题元信息</h3>
            <dl className="text-sm space-y-1.5">
              <div className="flex justify-between"><dt className="text-slate-500">提出年份</dt><dd className="font-mono">{problem.year}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">提出者</dt><dd className="font-mono text-right text-xs">{problem.proposer || '—'}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">难度</dt><dd>{DIFFICULTY_LABEL[problem.difficulty]} ({problem.difficulty}/5)</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">状态</dt><dd>{STATUS_LABEL[problem.status]}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">基础奖励</dt><dd className="text-amber-300">⚡ {problem.reward} HPW</dd></div>
            </dl>
          </div>
          <div className="card bg-amber-500/5 border-amber-500/20">
            <h3 className="text-sm font-bold text-amber-200 mb-2">💰 怎么获得积分？</h3>
            <ul className="text-xs text-slate-300 space-y-1.5">
              <li>· 提交任何解答：<b className="text-amber-300">+10 HPW</b></li>
              <li>· AI 评分 ≥ 60：<b className="text-amber-300">每分 +{Math.floor(problem.reward / 100)} HPW</b></li>
              <li>· 被点赞（每人每次）：<b className="text-amber-300">+5 HPW 给作者</b></li>
              <li>· 解开难题：<b className="text-amber-300">最高 {problem.reward + 50} HPW</b></li>
            </ul>
            <p className="text-xs text-slate-500 mt-2">所有积分 5 秒内自动上链，永久可查。</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function SolutionCard({ solution, onVote }) {
  const net = solution.votesUp - solution.votesDown;
  return (
    <div className="card">
      <div className="flex items-start gap-3">
        <div className="flex flex-col items-center gap-1 pt-1">
          <button onClick={() => onVote(solution.id, 1)} className="text-slate-400 hover:text-emerald-400 transition-colors text-lg leading-none">▲</button>
          <div className={`font-mono text-sm font-bold ${net > 0 ? 'text-emerald-400' : net < 0 ? 'text-red-400' : 'text-slate-500'}`}>{net}</div>
          <button onClick={() => onVote(solution.id, -1)} className="text-slate-400 hover:text-red-400 transition-colors text-lg leading-none">▼</button>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap text-xs text-slate-500">
            <Link to={`/u/${solution.user?.username}`} className="font-medium text-violet-300 hover:text-violet-200">{solution.user?.username}</Link>
            {solution.aiAssisted && <span className="badge bg-fuchsia-500/15 text-fuchsia-300">🤖 AI 辅助</span>}
            {solution.aiQualityScore > 0 && <span className="badge bg-white/5 text-slate-400">AI 评分 {solution.aiQualityScore}</span>}
            <span className="ml-auto">{new Date(solution.createdAt).toLocaleString('zh-CN', { hour12: false })}</span>
          </div>
          {solution.title && <h3 className="font-display font-bold text-lg mt-1">{solution.title}</h3>}
          <div className="text-sm text-slate-300 mt-2 whitespace-pre-wrap line-clamp-6 leading-relaxed">{solution.content}</div>
          <div className="mt-2 text-xs text-slate-500">
            获 {solution.votesUp} 赞 / {solution.votesDown} 踩 · 奖励 <b className="text-amber-300">⚡{solution.scoreAwarded}</b>
            {solution.txId && <span className="ml-2 font-mono">tx: {solution.txId.slice(0, 8)}…</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
