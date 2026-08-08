import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useAuth } from '../hooks/useAuth.jsx';
import { useI18n, t as i18nT } from '../lib/i18n.js';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import { PARTICIPATE_TYPES } from '../lib/problems.js';
import { t } from '../lib/i18n.js';

const DIFFICULTY_LABEL = ['', '入门', '简单', '中等', '困难', '极难'];
const STATUS_LABEL = { open: '未解', partially_solved: '部分', solved: '已解' };
const STATUS_COLOR = { open: 'bg-amber-500/20 text-amber-300', partially_solved: 'bg-cyan-500/20 text-cyan-300', solved: 'bg-emerald-500/20 text-emerald-300' };

export default function ProblemDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { lang } = useI18n();
  const [problem, setProblem] = useState(null);
  const [solutions, setSolutions] = useState([]);
  const [loading, setLoading] = useState(true);

  // AI 多轮对话
  const [chatMessages, setChatMessages] = useState([]);  // [{role, content, model, source, turn}]
  const [chatInput, setChatInput] = useState('');
  const [chatSending, setChatSending] = useState(false);
  const [chatError, setChatError] = useState(null);
  // 提交时 AI 评估（rubric 多维度）
  const [submitEval, setSubmitEval] = useState(null);
  const [submitEvalLoading, setSubmitEvalLoading] = useState(false);

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
    if (!chatInput.trim()) return;
    setChatSending(true);
    setChatError(null);
    const userMsg = { role: 'user', content: chatInput.trim() };
    const nextHistory = [...chatMessages, userMsg];
    setChatMessages(nextHistory);
    setChatInput('');
    try {
      const r = await api.chat(id, nextHistory, lang);
      setChatMessages([...nextHistory, {
        role: 'assistant',
        content: r.reply,
        model: r.model,
        source: r.source,
        turn: r.turn
      }]);
    } catch (e) {
      setChatError(e.message);
    } finally {
      setChatSending(false);
    }
  };

  const handleResetChat = () => {
    setChatMessages([]);
    setChatError(null);
  };

  const handleCopyLastReply = () => {
    const lastAi = [...chatMessages].reverse().find(m => m.role === 'assistant');
    if (lastAi) {
      setSubmitContent(lastAi.content);
      setSubmitTitle(`基于 AI 第 ${lastAi.turn || 1} 轮: ${problem.title}`);
    }
  };

  // 提交前用 5 维度 rubric 评估
  const handlePreEvaluate = async () => {
    if (!submitContent || submitContent.length < 20) {
      alert('请先写一些解答（至少 20 字）');
      return;
    }
    setSubmitEvalLoading(true);
    try {
      const r = await api.evaluate(id, submitContent);
      setSubmitEval(r);
    } catch (e) {
      alert('评估失败: ' + e.message);
    } finally {
      setSubmitEvalLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!user) { navigate('/auth'); return; }
    if (submitContent.length < 20) { alert('解答内容太短（至少 20 字）'); return; }
    setSubmitting(true);
    try {
      // 自动跑一次评估（如果还没跑）
      let evalData = submitEval;
      if (!evalData) {
        try {
          evalData = await api.evaluate(id, submitContent);
          setSubmitEval(evalData);
        } catch {}
      }
      // 判断是否用 LLM (heuristic 也算 AI 辅助)
      const lastAi = [...chatMessages].reverse().find(m => m.role === 'assistant');
      const aiModel = lastAi?.model || evalData?.model || '';
      const r = await api.submitSolution({
        problem_id: id,
        title: submitTitle,
        content: submitContent,
        ai_assisted: !!lastAi || (evalData?.source !== 'fallback' && !!evalData),
        ai_model: aiModel,
        ai_score: evalData?.score || 0
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
        <h1 className="text-3xl sm:text-4xl font-display font-extrabold leading-tight">
          {lang === 'en-US' && problem.titleEn ? problem.titleEn : problem.title}
        </h1>
        {lang !== 'en-US' && (
          <div className="text-slate-500 font-mono mt-1">{problem.titleEn}</div>
        )}
        <p className="text-lg text-slate-300 mt-4 leading-relaxed">
          {lang === 'en-US' && problem.summaryEn ? problem.summaryEn : problem.summary}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {problem.tags.map(t => <span key={t} className="badge bg-white/5 text-slate-400">#{t}</span>)}
          <span className="ml-auto text-amber-300 font-mono">⚡ 奖励 {problem.reward} HPW</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧主内容 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 视频介绍 */}
          {problem.videoUrl && problem.videoUrl !== '' && (
            <div className="card overflow-hidden p-0">
              <div className="aspect-video w-full bg-black/50">
                <iframe
                  src={problem.videoUrl}
                  title={problem.videoTitle || problem.title}
                  className="w-full h-full"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                />
              </div>
              {(problem.videoTitle || problem.videoChannel) && (
                <div className="px-4 py-2 text-xs text-slate-500 border-t border-white/5 flex items-center gap-2">
                  <span>🎬</span>
                  {problem.videoTitle && <span className="text-slate-300">{problem.videoTitle}</span>}
                  {problem.videoChannel && <span className="ml-auto">{problem.videoChannel}</span>}
                </div>
              )}
            </div>
          )}

          {/* 怎么参与解决 */}
          {problem.participate && problem.participate.length > 0 && (
            <div className="card bg-gradient-to-br from-emerald-500/5 to-cyan-500/5 border-emerald-500/20">
              <h2 className="text-lg font-display font-bold text-emerald-200 mb-3">🙋 我能怎么参与？</h2>
              <p className="text-sm text-slate-400 mb-4">不需要你是专家。以下任何方式都能帮到这道问题：</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {problem.participate.map((p, idx) => {
                  const meta = PARTICIPATE_TYPES[p.type] || { icon: '✨', color: 'text-slate-300', bg: 'bg-white/5', label: p.label, desc: p.desc };
                  return (
                    <div key={idx} className={`${meta.bg} border border-white/5 rounded-lg p-3`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{meta.icon}</span>
                        <span className={`font-medium text-sm ${meta.color}`}>{p.label || meta.label}</span>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">{p.desc || meta.desc}</p>
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 text-xs text-slate-500">
                💡 不确定怎么做？直接 <button onClick={handleAiSolve} className="text-violet-400 hover:text-violet-300 underline">问 AI</button>，或在 <Link to="/leaderboard" className="text-violet-400 hover:text-violet-300 underline">排行榜</Link> 找合作者。
              </div>
            </div>
          )}

          {/* 小朋友版 */}
          <div className="card bg-gradient-to-br from-amber-500/10 to-orange-500/5 border-amber-500/20">
            <div className="flex items-start gap-3">
              <div className="text-3xl">🧒</div>
              <div className="flex-1">
                <h2 className="text-lg font-display font-bold text-amber-200 mb-2">{t('problem.kidExplain')}</h2>
                <p className="text-slate-200 leading-relaxed">
                  {lang === 'en-US' && problem.kidEn ? problem.kidEn : problem.kid}
                </p>
              </div>
            </div>
          </div>

          {/* 严格陈述 */}
          <div className="card">
            <h2 className="text-lg font-display font-bold mb-2">{t('problem.formalStatement')}</h2>
            <p className="text-slate-300 leading-relaxed whitespace-pre-line">
              {lang === 'en-US' && problem.formalEn ? problem.formalEn : problem.formal}
            </p>
          </div>

          {/* 为什么难 */}
          <div className="card">
            <h2 className="text-lg font-display font-bold mb-2">🔥 {t('problem.whyHard')}</h2>
            <p className="text-slate-300 leading-relaxed whitespace-pre-line">
              {lang === 'en-US' && problem.whyHardEn ? problem.whyHardEn : problem.whyHard}
            </p>
          </div>

          {/* AI 多轮对话 */}
          <div className="card border-violet-500/30 bg-gradient-to-br from-violet-500/5 to-fuchsia-500/5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-display font-bold">💬 AI 助手 · 多轮对话</h2>
              {chatMessages.length > 0 && (
                <button onClick={handleResetChat} className="text-xs text-slate-500 hover:text-slate-300">
                  清空对话
                </button>
              )}
            </div>
            <p className="text-sm text-slate-400 mb-3">
              AI 已经读过这道问题的 <b>小朋友版</b>、<b>严格陈述</b>、<b>为什么难</b> 和 3 道相关问题。
              你可以连续追问、反驱、要求举例、要求简化。
            </p>

            {/* 对话历史 */}
            {chatMessages.length > 0 && (
              <div className="mb-4 max-h-[500px] overflow-y-auto scrollbar-thin space-y-3 pr-1">
                {chatMessages.map((m, i) => (
                  <div key={i} className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {m.role === 'assistant' && (
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-xs flex-shrink-0">🤖</div>
                    )}
                    <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                      m.role === 'user'
                        ? 'bg-violet-500/20 border border-violet-500/30 text-slate-100'
                        : 'bg-slate-800/60 border border-white/5 text-slate-200'
                    }`}>
                      {m.role === 'user' ? (
                        <div className="whitespace-pre-wrap">{m.content}</div>
                      ) : (
                        <>
                          <pre className="whitespace-pre-wrap font-sans">{m.content}</pre>
                          <div className="mt-2 pt-2 border-t border-white/5 flex items-center gap-2 text-[10px] text-slate-500">
                            <span>第 {m.turn || '?'} 轮</span>
                            <span>·</span>
                            <span>{m.source === 'llm' ? `LLM (${m.model})` : '启发式回退'}</span>
                          </div>
                        </>
                      )}
                    </div>
                    {m.role === 'user' && (
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-xs flex-shrink-0">👤</div>
                    )}
                  </div>
                ))}
                {chatSending && (
                  <div className="flex gap-2 justify-start">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-xs flex-shrink-0">🤖</div>
                    <div className="rounded-2xl px-3.5 py-2.5 text-sm bg-slate-800/60 border border-white/5 text-slate-400">
                      <span className="inline-block animate-pulse">🌀 思考中…</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 输入框 */}
            <div className="flex gap-2">
              <textarea
                className="input min-h-[60px] text-sm flex-1"
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault();
                    handleAiSolve();
                  }
                }}
                placeholder="问 AI 一个具体问题... (Ctrl/Cmd+Enter 发送)"
              />
              <button
                onClick={handleAiSolve}
                disabled={chatSending || !chatInput.trim()}
                className="btn-primary self-end px-4"
              >
                {chatSending ? '…' : '↑'}
              </button>
            </div>

            {/* 快捷问题 */}
            {chatMessages.length === 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {[
                  '用 8 岁能懂的话解释',
                  '列出 3 个可能的研究方向',
                  '这个问题的严格数学表述是？',
                  '历史上最接近的突破是什么？'
                ].map((q, i) => (
                  <button
                    key={i}
                    onClick={() => setChatInput(q)}
                    className="text-xs px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-200 transition"
                  >
                    💡 {q}
                  </button>
                ))}
              </div>
            )}

            {chatError && (
              <div className="mt-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-sm">❌ {chatError}</div>
            )}

            {chatMessages.some(m => m.role === 'assistant') && (
              <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                <button onClick={handleCopyLastReply} className="text-violet-400 hover:text-violet-300 underline">
                  📋 复制最后一轮到提交框
                </button>
                <span>·</span>
                <span>基于 AI 的内容修改后再提交，会被标记为 "AI 辅助"</span>
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
                  placeholder="写你的解答... （可以基于上面的 AI 对话修改）"
                  value={submitContent}
                  onChange={e => setSubmitContent(e.target.value)}
                />
                <div className="mt-3 flex items-center justify-between gap-2 flex-wrap">
                  <div className="text-xs text-slate-500">
                    提交前可先 <b>5 维评估</b> 看看分数。
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handlePreEvaluate}
                      disabled={submitEvalLoading || submitContent.length < 20}
                      className="px-3 py-1.5 rounded-lg text-sm bg-violet-500/20 hover:bg-violet-500/30 text-violet-200 disabled:opacity-50"
                    >
                      {submitEvalLoading ? '评估中…' : '📊 5 维评估'}
                    </button>
                    <button onClick={handleSubmit} disabled={submitting} className="btn-primary">
                      {submitting ? '提交中…' : '提交并上链 →'}
                    </button>
                  </div>
                </div>

                {/* 5 维评估结果 */}
                {submitEval && <EvalBreakdown eval={submitEval} />}

                {submitResult && (
                  <div className="mt-3 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                    <div className="text-emerald-300 font-medium">✅ 提交成功！</div>
                    <div className="text-sm text-slate-300 mt-1">
                      AI 评分: <b>{submitResult.evaluation?.score || '?'}</b> · 获得 <b className="text-amber-300">{submitResult.reward} HPW</b>
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      已自动上链，5 秒内可在 <Link to="/chain" className="text-violet-400 hover:text-violet-300 underline">区块链</Link> 看到。
                    </div>
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

          {/* 分享给朋友 / 社区 */}
          <div className="card bg-gradient-to-br from-violet-500/10 to-fuchsia-500/5 border-violet-500/20">
            <h3 className="text-sm font-bold text-violet-200 mb-2">🌟 分享这道硬问题</h3>
            <p className="text-xs text-slate-400 mb-3 leading-relaxed">
              如果你喜欢这道问题，把它分享给朋友、同学、同事——
              也许他们能提出新角度，或者一起组队来解答。
            </p>
            <button
              onClick={() => {
                const url = window.location.href;
                if (navigator.share) {
                  navigator.share({ title: problem.title, text: problem.summary, url });
                } else {
                  navigator.clipboard.writeText(url);
                  alert('已复制链接到剪贴板！');
                }
              }}
              className="w-full py-2 rounded-lg bg-violet-500/20 hover:bg-violet-500/30 text-violet-200 text-xs font-medium transition-colors"
            >
              🔗 分享这道问题
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// 5 维评估明细
function EvalBreakdown({ eval: e }) {
  if (!e) return null;
  const dims = e.dimensions || {};
  const dimList = [
    { key: 'accuracy', label: '准确性', desc: '事实正确' },
    { key: 'depth', label: '深度', desc: '超越表面' },
    { key: 'originality', label: '原创性', desc: '新角度' },
    { key: 'rigor', label: '严谨性', desc: '逻辑严密' },
    { key: 'clarity', label: '表达', desc: '清晰易读' }
  ];
  const score = e.score ?? 0;
  const verdictColor = score >= 70 ? 'text-emerald-300' : score >= 50 ? 'text-amber-300' : 'text-red-300';
  const sourceLabel = e.source === 'llm' ? `LLM (${e.model})` : e.source === 'fallback' ? '启发式回退' : (e.model || 'unknown');

  return (
    <div className="mt-3 p-4 rounded-lg bg-violet-500/5 border border-violet-500/20">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-baseline gap-2">
          <div className="text-2xl font-display font-bold gradient-text">{score}<span className="text-sm text-slate-500">/100</span></div>
          <div className={`text-sm font-medium ${verdictColor}`}>{e.verdict || (score >= 70 ? '良好' : score >= 50 ? '及格' : '需要加强')}</div>
        </div>
        <div className="text-xs text-slate-500">{sourceLabel}</div>
      </div>

      {/* 5 维度进度条 */}
      <div className="space-y-1.5 mb-3">
        {dimList.map(d => {
          const v = dims[d.key] ?? 0;
          const pct = (v / 20) * 100;
          const color = v >= 15 ? 'bg-emerald-500' : v >= 10 ? 'bg-amber-500' : 'bg-red-500';
          return (
            <div key={d.key} className="flex items-center gap-2 text-xs">
              <div className="w-16 text-slate-400 flex-shrink-0">{d.label}</div>
              <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div className={`h-full ${color} transition-all`} style={{ width: `${pct}%` }} />
              </div>
              <div className="w-10 text-right font-mono text-slate-300">{v}/20</div>
            </div>
          );
        })}
      </div>

      {e.reasoning && (
        <div className="text-xs text-slate-400 mb-2 italic">{e.reasoning}</div>
      )}

      {e.strengths?.length > 0 && (
        <div className="text-xs mb-1">
          <span className="text-emerald-300">✓ 优势：</span>
          <span className="text-slate-300">{e.strengths.join('； ')}</span>
        </div>
      )}
      {e.weaknesses?.length > 0 && (
        <div className="text-xs">
          <span className="text-amber-300">⚠ 不足：</span>
          <span className="text-slate-300">{e.weaknesses.join('； ')}</span>
        </div>
      )}
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
