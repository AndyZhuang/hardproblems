import { useEffect, useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { CATEGORIES, PARTICIPATE_TYPES } from '../lib/problems.js';
import { api } from '../lib/api.js';
import { useAuth } from '../hooks/useAuth.jsx';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';

const STATUS_OPTIONS = [
  { v: 'open', l: '未解', color: 'bg-amber-500/20 text-amber-300' },
  { v: 'partially_solved', l: '部分解', color: 'bg-cyan-500/20 text-cyan-300' },
  { v: 'solved', l: '已解', color: 'bg-emerald-500/20 text-emerald-300' }
];

const DIFF_OPTIONS = [
  { v: 1, l: '入门' },
  { v: 2, l: '简单' },
  { v: 3, l: '中等' },
  { v: 4, l: '困难' },
  { v: 5, l: '极难' }
];

// Local storage key for pending problems
const PENDING_KEY = 'hpw_pending_problems';

function loadPending() {
  try { return JSON.parse(localStorage.getItem(PENDING_KEY) || '[]'); }
  catch { return []; }
}
function savePending(arr) {
  try { localStorage.setItem(PENDING_KEY, JSON.stringify(arr)); }
  catch (e) { console.error('localStorage save failed', e); }
}

export default function Contribute() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  useDocumentTitle('提交新问题', '用 AI 帮你把粗略想法扩展成完整的硬问题');

  const initialCategory = searchParams.get('category') || '';

  // Step 1: 粗略输入
  const [roughIdea, setRoughIdea] = useState('');
  const [category, setCategory] = useState(initialCategory);
  const [extraHints, setExtraHints] = useState('');

  // Step 2: AI 生成
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(null);
  const [genError, setGenError] = useState(null);

  // Step 3: 审核/编辑
  const [editing, setEditing] = useState(null);

  // Step 4: 已提交
  const [mySubmissions, setMySubmissions] = useState(loadPending());

  useEffect(() => { savePending(mySubmissions); }, [mySubmissions]);

  // 1. 用 AI 把粗略想法扩展成完整问题
  const handleGenerate = async () => {
    if (!roughIdea.trim() || roughIdea.length < 5) {
      alert('请先输入你对这个问题的粗略想法（至少 5 个字）');
      return;
    }
    if (!category) {
      alert('请选择一个学科');
      return;
    }
    setGenerating(true);
    setGenError(null);
    try {
      const r = await api.contributeProblem({
        rough_idea: roughIdea,
        category,
        extra_hints: extraHints
      });
      if (r?.problem) {
        setGenerated(r.problem);
        setEditing(r.problem);
      } else {
        setGenError('AI 没有返回内容，请重试或调整你的描述');
      }
    } catch (e) {
      // 浏览器模式无后端时，使用本地启发式生成
      console.warn('AI generation failed, using local fallback:', e.message);
      const fallback = localFallbackGenerate(roughIdea, category);
      setGenerated(fallback);
      setEditing(fallback);
    } finally {
      setGenerating(false);
    }
  };

  // 2. 重新生成
  const handleRegenerate = () => handleGenerate();

  // 3. 保存并提交到待审核列表
  const handleSubmit = () => {
    if (!editing) return;
    if (!editing.title || !editing.title.trim()) {
      alert('请填写问题标题');
      return;
    }
    if (!editing.kid || editing.kid.length < 20) {
      alert('请写清楚"小朋友版"解释（至少 20 字）');
      return;
    }
    const submission = {
      ...editing,
      id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      submittedAt: new Date().toISOString(),
      submittedBy: user?.username || 'anonymous',
      status: 'pending'
    };
    setMySubmissions([submission, ...mySubmissions]);
    setGenerated(null);
    setEditing(null);
    setRoughIdea('');
    setExtraHints('');
  };

  // 删除已提交
  const handleDelete = (id) => {
    if (!confirm('确认从你的待提交列表中移除？')) return;
    setMySubmissions(mySubmissions.filter(p => p.id !== id));
  };

  // 重新编辑
  const handleEdit = (p) => {
    setEditing(p);
    setGenerated(p);
  };

  return (
    <div className="container-page py-8">
      <div className="mb-6">
        <Link to="/problems" className="text-sm text-slate-500 hover:text-slate-300">← 返回问题列表</Link>
        <h1 className="text-3xl sm:text-4xl font-display font-bold mt-3">✍️ 提交一个新问题</h1>
        <p className="text-slate-400 mt-2 text-sm">
          你知道一个值得所有人挑战的硬问题吗？用 AI 帮你把粗略想法扩展成完整记录，审核后提交。
        </p>
      </div>

      {/* 流程指示 */}
      <div className="card mb-6 bg-gradient-to-br from-violet-500/5 to-fuchsia-500/5 border-violet-500/20">
        <div className="flex items-center gap-2 text-xs text-slate-400 flex-wrap">
          <span className="px-2 py-1 rounded-full bg-violet-500/20 text-violet-300">1. 粗略输入</span>
          <span>→</span>
          <span className={`px-2 py-1 rounded-full ${generated ? 'bg-violet-500/20 text-violet-300' : 'bg-white/5 text-slate-500'}`}>2. AI 扩展</span>
          <span>→</span>
          <span className={`px-2 py-1 rounded-full ${editing ? 'bg-violet-500/20 text-violet-300' : 'bg-white/5 text-slate-500'}`}>3. 审核编辑</span>
          <span>→</span>
          <span className={`px-2 py-1 rounded-full ${mySubmissions.length > 0 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/5 text-slate-500'}`}>4. 提交待审核</span>
        </div>
      </div>

      {/* Step 1: 粗略输入 */}
      <div className="card mb-6">
        <h2 className="text-lg font-display font-bold mb-3">1️⃣ 你粗略的想法是什么？</h2>
        <p className="text-sm text-slate-400 mb-4">
          写得不专业没关系。比如："为什么会有意识"、"AI 真的能思考吗"、"海洋塑料怎么清掉"。
        </p>

        <textarea
          className="input min-h-[100px] mb-3"
          value={roughIdea}
          onChange={e => setRoughIdea(e.target.value)}
          placeholder="例如：让 AI 帮我写一首古诗，AI 真的理解古诗的美吗？为什么有些诗让我们感动？这跟语言模型的预测有关吗？"
        />

        <div className="mb-3">
          <label className="text-xs text-slate-400 mb-1 block">学科</label>
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map(c => (
              <button
                key={c.id}
                onClick={() => setCategory(c.id)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${category === c.id ? 'bg-white text-slate-900' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
              >
                <span className="mr-1">{c.icon}</span>{c.name}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <label className="text-xs text-slate-400 mb-1 block">附加要求（可选）</label>
          <textarea
            className="input min-h-[60px] text-sm"
            value={extraHints}
            onChange={e => setExtraHints(e.target.value)}
            placeholder="比如：让 AI 解释给小 8 岁孩子听 / 强调伦理影响 / 给出 3 个实验方向..."
          />
        </div>

        <button
          onClick={handleGenerate}
          disabled={generating}
          className="btn-primary w-full sm:w-auto"
        >
          {generating ? '🌀 AI 正在扩展...' : '✨ 用 AI 扩展成完整问题 →'}
        </button>

        {genError && (
          <div className="mt-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-sm">
            ⚠️ {genError}（已自动使用本地启发式生成，你仍可编辑后再提交）
          </div>
        )}
      </div>

      {/* Step 2 & 3: AI 生成 + 审核 */}
      {editing && (
        <div className="card mb-6 border-violet-500/30 bg-gradient-to-br from-violet-500/5 to-fuchsia-500/5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-display font-bold text-violet-200">2️⃣ & 3️⃣ 审核与编辑</h2>
            <button onClick={handleRegenerate} className="text-xs text-violet-400 hover:text-violet-300">
              🔄 重新生成
            </button>
          </div>

          <EditForm
            problem={editing}
            onChange={setEditing}
            category={category}
          />

          <div className="mt-4 flex flex-wrap gap-2 justify-end">
            <button onClick={() => { setEditing(null); setGenerated(null); }} className="btn-ghost text-sm">
              取消
            </button>
            <button onClick={handleSubmit} className="btn-primary text-sm">
              📥 保存到我的待提交列表
            </button>
          </div>
        </div>
      )}

      {/* Step 4: 我的待提交 */}
      {mySubmissions.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-display font-bold">📚 我的待提交问题 · {mySubmissions.length}</h2>
            <span className="text-xs text-slate-500">本地保存，刷新不会丢</span>
          </div>
          <p className="text-xs text-slate-500 mb-4">
            你的提交暂存在浏览器本地。管理员审核后会发布到问题列表。 （你也可以复制 JSON 提交给项目维护者）
          </p>
          <div className="space-y-3">
            {mySubmissions.map(p => (
              <SubmissionCard
                key={p.id}
                problem={p}
                onEdit={() => handleEdit(p)}
                onDelete={() => handleDelete(p.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ===== 审核编辑表单 =====
function EditForm({ problem, onChange, category }) {
  const set = (k, v) => onChange({ ...problem, [k]: v });
  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs text-slate-400 mb-1 block">标题 *</label>
        <input
          className="input"
          value={problem.title || ''}
          onChange={e => set('title', e.target.value)}
          placeholder="问题标题（中文）"
        />
      </div>
      <div>
        <label className="text-xs text-slate-400 mb-1 block">英文标题</label>
        <input
          className="input"
          value={problem.titleEn || ''}
          onChange={e => set('titleEn', e.target.value)}
          placeholder="English Title"
        />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div>
          <label className="text-xs text-slate-400 mb-1 block">状态</label>
          <select className="input" value={problem.status || 'open'} onChange={e => set('status', e.target.value)}>
            {STATUS_OPTIONS.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1 block">难度</label>
          <select className="input" value={problem.difficulty || 3} onChange={e => set('difficulty', parseInt(e.target.value))}>
            {DIFF_OPTIONS.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1 block">奖励 HPW</label>
          <input
            type="number"
            min="0"
            className="input"
            value={problem.reward ?? 1000}
            onChange={e => set('reward', parseInt(e.target.value || 0))}
          />
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1 block">提出年</label>
          <input
            type="number"
            className="input"
            value={problem.year ?? new Date().getFullYear()}
            onChange={e => set('year', parseInt(e.target.value || 0))}
          />
        </div>
      </div>
      <div>
        <label className="text-xs text-slate-400 mb-1 block">提出者 / 机构</label>
        <input
          className="input"
          value={problem.proposer || ''}
          onChange={e => set('proposer', e.target.value)}
          placeholder="例如：J. Doe / 多个 / —"
        />
      </div>
      <div>
        <label className="text-xs text-slate-400 mb-1 block">一句话简介 *</label>
        <textarea
          className="input min-h-[60px]"
          value={problem.summary || ''}
          onChange={e => set('summary', e.target.value)}
          placeholder="比如：为什么有些 AI 看起来有意识而有些没有？"
        />
      </div>
      <div>
        <label className="text-xs text-slate-400 mb-1 block">🧒 小朋友版解释 * (至少 20 字)</label>
        <textarea
          className="input min-h-[100px]"
          value={problem.kid || ''}
          onChange={e => set('kid', e.target.value)}
          placeholder="用 8-12 岁能懂的语言，3-5 句话讲清楚"
        />
        <div className="text-xs text-slate-500 mt-1">{(problem.kid || '').length} 字</div>
      </div>
      <div>
        <label className="text-xs text-slate-400 mb-1 block">📐 严格陈述</label>
        <textarea
          className="input min-h-[60px] font-mono text-sm"
          value={problem.formal || ''}
          onChange={e => set('formal', e.target.value)}
          placeholder="给一个数学/逻辑的严格表述"
        />
      </div>
      <div>
        <label className="text-xs text-slate-400 mb-1 block">🔥 为什么难</label>
        <textarea
          className="input min-h-[60px]"
          value={problem.whyHard || ''}
          onChange={e => set('whyHard', e.target.value)}
          placeholder="1-3 句话讲难点"
        />
      </div>
      <div>
        <label className="text-xs text-slate-400 mb-1 block">🤖 AI 解题 prompt（给 AI 看的）</label>
        <textarea
          className="input min-h-[80px] text-sm"
          value={problem.aiPrompt || ''}
          onChange={e => set('aiPrompt', e.target.value)}
          placeholder="例如：你是一位计算机科学教授，请向一个 12 岁小朋友解释这个问题的背景、当前研究状态、可尝试的方向。"
        />
      </div>
      <div>
        <label className="text-xs text-slate-400 mb-1 block">🏷 标签（用英文逗号分隔）</label>
        <input
          className="input"
          value={(problem.tags || []).join(', ')}
          onChange={e => set('tags', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
          placeholder="例如: 数论, 素数, 经典"
        />
      </div>
      <div>
        <label className="text-xs text-slate-400 mb-1 block">🎬 视频介绍 URL（YouTube embed 形式，可选）</label>
        <input
          className="input"
          value={problem.videoUrl || ''}
          onChange={e => set('videoUrl', e.target.value)}
          placeholder="https://www.youtube.com/embed/..."
        />
      </div>

      <div>
        <label className="text-xs text-slate-400 mb-2 block">🙋 用户参与方式（选择 1-6 项）</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {Object.entries(PARTICIPATE_TYPES).map(([type, meta]) => {
            const selected = (problem.participate || []).some(p => p.type === type);
            return (
              <button
                key={type}
                onClick={() => {
                  const cur = problem.participate || [];
                  if (selected) {
                    onChange({ ...problem, participate: cur.filter(p => p.type !== type) });
                  } else if (cur.length < 6) {
                    onChange({ ...problem, participate: [...cur, { type, label: meta.label, desc: meta.desc }] });
                  }
                }}
                className={`p-2 rounded-lg text-left text-xs transition-all ${selected ? `${meta.bg} ${meta.color} ring-1 ring-current` : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
              >
                <div className="font-medium flex items-center gap-1.5">
                  <span>{meta.icon}</span>
                  <span>{meta.label}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ===== 已提交卡片 =====
function SubmissionCard({ problem, onEdit, onDelete }) {
  return (
    <div className="rounded-lg bg-white/5 border border-white/5 p-3">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap text-xs text-slate-500 mb-1">
            <span className="badge bg-amber-500/15 text-amber-300">⏳ 待审核</span>
            <span className="badge bg-violet-500/15 text-violet-300">{problem.category}</span>
            <span>·</span>
            <span>{new Date(problem.submittedAt).toLocaleString('zh-CN', { hour12: false })}</span>
          </div>
          <div className="font-display font-bold text-white">{problem.title}</div>
          <div className="text-xs text-slate-500 font-mono">{problem.titleEn}</div>
        </div>
      </div>
      <p className="text-sm text-slate-300 line-clamp-2">{problem.summary}</p>
      <div className="mt-2 flex items-center gap-2 text-xs">
        <button onClick={onEdit} className="text-violet-400 hover:text-violet-300">✏️ 编辑</button>
        <span className="text-slate-700">·</span>
        <button
          onClick={() => {
            navigator.clipboard.writeText(JSON.stringify(problem, null, 2));
            alert('已复制 JSON 到剪贴板');
          }}
          className="text-cyan-400 hover:text-cyan-300"
        >
          📋 复制 JSON
        </button>
        <span className="text-slate-700">·</span>
        <button onClick={onDelete} className="text-red-400 hover:text-red-300">🗑️ 删除</button>
      </div>
    </div>
  );
}

// ===== 浏览器模式下的本地启发式生成（无后端时的兜底） =====
function localFallbackGenerate(roughIdea, category) {
  const idea = roughIdea.trim();
  // 简单启发式：根据 category 给出模板
  const cat = CATEGORIES.find(c => c.id === category) || CATEGORIES[0];

  // 关键词检测
  const hasAI = /ai|人工智能|gpt|大模型|chatgpt|llm/i.test(idea);
  const hasConsciousness = /意识|consciou|主观|感受|qualia|心灵|心智/i.test(idea);
  const hasClimate = /气候|环境|碳|暖|co2|塑料|污染/i.test(idea);
  const hasHealth = /健康|疾病|癌症|长寿|衰老|医/i.test(idea);
  const hasMath = /数|证明|方程|猜想|函数/i.test(idea);

  const titleGuess = idea.length > 30 ? idea.slice(0, 30) + '...' : idea;

  return {
    title: `用户提交：${titleGuess}`,
    titleEn: `User-submitted: ${titleGuess.slice(0, 50)}`,
    year: new Date().getFullYear(),
    proposer: '—',
    difficulty: 3,
    reward: 500,
    status: 'open',
    summary: idea,
    kid: `${idea} —— 这是一个${cat.name}领域的问题，目前还没有公认的答案。小朋友可以从"为什么"开始思考。`,
    formal: `用数学/逻辑形式化描述：${idea}`,
    whyHard: '这是一个开放问题，暂无公认解决方法。需要新的想法和工具。',
    aiPrompt: `你是一位${cat.name}领域的专家。向一个 12 岁的小朋友解释这个问题的背景、为什么重要、当前研究状态。给出 3 个可能的尝试方向。`,
    tags: [cat.name, '用户提交', '待审核'],
    videoUrl: '',
    videoTitle: '',
    videoChannel: '',
    participate: [
      { type: 'discuss', label: '想法/讨论', desc: '在评论里分享你的思路' },
      { type: 'essay', label: '写文章/论文', desc: '写一篇关于这个问题的研究笔记' },
      { type: 'survey', label: '文献综述', desc: '找已有的相关资料并总结' }
    ]
  };
}
