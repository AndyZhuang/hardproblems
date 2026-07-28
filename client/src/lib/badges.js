// 挑战者勋章（前端 mirror，与后端同步）
export const BADGES = [
  { id: 'newcomer',     name: '新手',     icon: '🌱', min_score: 0,        min_solutions: 0,  color: 'text-emerald-300' },
  { id: 'explorer',     name: '探索者',   icon: '🔍', min_score: 100,      min_solutions: 1,  color: 'text-cyan-300' },
  { id: 'thinker',      name: '思考者',   icon: '💭', min_score: 300,      min_solutions: 3,  color: 'text-violet-300' },
  { id: 'researcher',   name: '研究员',   icon: '🔬', min_score: 800,      min_solutions: 8,  color: 'text-blue-300' },
  { id: 'solver',       name: '解题者',   icon: '🧩', min_score: 2000,     min_solutions: 20, color: 'text-amber-300' },
  { id: 'pioneer',      name: '先驱',     icon: '🚀', min_score: 5000,     min_solutions: 50, color: 'text-fuchsia-300' },
  { id: 'legend',       name: '传奇',     icon: '👑', min_score: 15000,    min_solutions: 100,color: 'text-rose-300' }
];

export function getBadgesForUser(user) {
  const score = user.totalScore || 0;
  const solCount = user.solutionCount || 0;
  return BADGES.filter(b => score >= b.min_score && solCount >= b.min_solutions);
}
