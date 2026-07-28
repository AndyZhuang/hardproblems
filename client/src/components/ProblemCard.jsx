import { Link } from 'react-router-dom';

const DIFFICULTY_LABEL = ['', '入门', '简单', '中等', '困难', '极难'];
const STATUS_LABEL = { open: '未解', partially_solved: '部分', solved: '已解' };
const STATUS_COLOR = { open: 'bg-amber-500/20 text-amber-300', partially_solved: 'bg-cyan-500/20 text-cyan-300', solved: 'bg-emerald-500/20 text-emerald-300' };

export default function ProblemCard({ problem }) {
  return (
    <Link to={`/problems/${problem.id}`} className="group card relative overflow-hidden block">
      <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity pointer-events-none" style={{ backgroundImage: `linear-gradient(135deg, var(--tw-gradient-stops))` }} />
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="badge bg-white/10 text-slate-300">{DIFFICULTY_LABEL[problem.difficulty] || problem.difficulty}</span>
        <span className={`badge ${STATUS_COLOR[problem.status] || 'bg-slate-500/20 text-slate-300'}`}>{STATUS_LABEL[problem.status] || problem.status}</span>
      </div>
      <h3 className="text-lg font-display font-bold text-white group-hover:text-violet-300 transition-colors leading-snug mb-1">{problem.title}</h3>
      <div className="text-xs text-slate-500 mb-2 font-mono">{problem.titleEn} · {problem.year}</div>
      <p className="text-sm text-slate-300 line-clamp-3 leading-relaxed">{problem.summary}</p>
      <div className="mt-4 flex items-center justify-between text-xs">
        <div className="flex flex-wrap gap-1">
          {problem.tags?.slice(0, 2).map(t => (
            <span key={t} className="badge bg-violet-500/15 text-violet-300">{t}</span>
          ))}
        </div>
        <div className="text-amber-300 font-mono">⚡ {problem.reward} HPW</div>
      </div>
      <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-slate-500">
        <span>{problem.solutionCount || 0} 个解答</span>
        <span>{problem.netVotes || 0} 净投票</span>
      </div>
    </Link>
  );
}
