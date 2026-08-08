#!/usr/bin/env python3
"""
把 gen_problems.py 里的 PROBLEMS 转成 problems.js
"""
import json
import os
import sys

# 动态加载 gen_problems
sys.path.insert(0, os.path.dirname(__file__))
import gen_problems as gp

print(f"Total: {len(gp.PROBLEMS)}")

# 生成 JS 内容
JS_HEAD = '''// Hard Problems 数据集
// 涵盖数学、物理、化学、生物、计算机、哲学、工程、社会科学等
// 每条记录包含：基本信息 + 小朋友能懂的解释 + AI 求解 prompt 模板 + 视频介绍 + 用户参与方式

export const CATEGORIES = [
  { id: 'mathematics',  name: '数学',     icon: '∑', color: 'from-blue-500 to-cyan-500',     blurb: '关于数、空间、结构的奥秘' },
  { id: 'physics',      name: '物理',     icon: '⚛', color: 'from-violet-500 to-fuchsia-500', blurb: '关于宇宙和物质如何运作' },
  { id: 'chemistry',    name: '化学',     icon: '⚗', color: 'from-emerald-500 to-teal-500',  blurb: '关于分子和物质如何变化' },
  { id: 'biology',      name: '生命科学', icon: '🧬', color: 'from-lime-500 to-green-500',   blurb: '关于生命如何运作' },
  { id: 'cs',           name: '计算机',   icon: '⌘', color: 'from-orange-500 to-rose-500',  blurb: '关于算法、智能和信息' },
  { id: 'philosophy',   name: '哲学',     icon: '?',  color: 'from-amber-500 to-yellow-500',  blurb: '关于意识、意义和价值' },
  { id: 'engineering',  name: '工程',     icon: '⚙', color: 'from-slate-500 to-zinc-500',    blurb: '把想法变成现实' },
  { id: 'social',       name: '社会',     icon: '👥', color: 'from-pink-500 to-red-500',     blurb: '关于人和社会的运作' }
];

// 挑战者勋章（基于解题数自动发放）
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

// 参与方式字典（用于前端 i18n 和 UI 展示）
export const PARTICIPATE_TYPES = {
  solve:           { icon: '🧠', color: 'text-violet-300',   bg: 'bg-violet-500/10',   label: '求解/证明',    desc: '用数学/逻辑写出严格证明，或找到反例' },
  code:            { icon: '💻', color: 'text-cyan-300',     bg: 'bg-cyan-500/10',     label: '写代码/算法',  desc: '用代码实现算法、模拟或数值实验' },
  experiment:      { icon: '🔬', color: 'text-emerald-300',  bg: 'bg-emerald-500/10',  label: '动手实验',    desc: '设计并执行物理/化学/生物实验，收集数据' },
  data:            { icon: '📊', color: 'text-blue-300',     bg: 'bg-blue-500/10',     label: '数据收集/标注', desc: '收集、清洗或标注数据集' },
  survey:          { icon: '📚', color: 'text-amber-300',    bg: 'bg-amber-500/10',    label: '文献综述',    desc: '阅读并总结已有论文/书籍，写综述' },
  discuss:         { icon: '💬', color: 'text-fuchsia-300',  bg: 'bg-fuchsia-500/10',  label: '想法/讨论',   desc: '在论坛/社区发表你的思路、问题、反驳' },
  prototype:       { icon: '🛠️', color: 'text-orange-300',  bg: 'bg-orange-500/10',   label: '原型设计',    desc: '设计并搭建硬件/软件原型' },
  community:       { icon: '🤝', color: 'text-rose-300',     bg: 'bg-rose-500/10',     label: '社区/组织',   desc: '组织或参与社区活动、众包项目' },
  'citizen-science':{ icon: '🌍', color: 'text-lime-300',   bg: 'bg-lime-500/10',     label: '公民科学',    desc: '参与面向公众的科学项目' },
  'kid-project':   { icon: '🧒', color: 'text-yellow-300',   bg: 'bg-yellow-500/10',   label: '儿童项目',    desc: '和小朋友一起做适合的子项目' },
  visualize:       { icon: '🎨', color: 'text-pink-300',     bg: 'bg-pink-500/10',     label: '可视化',      desc: '制作信息图、动画或交互式可视化' },
  model:           { icon: '📐', color: 'text-indigo-300',   bg: 'bg-indigo-500/10',   label: '建模/模拟',   desc: '建立数学/计算模型，模拟真实系统' },
  analyze:         { icon: '📈', color: 'text-teal-300',     bg: 'bg-teal-500/10',     label: '数据分析',    desc: '用统计/ML 方法分析已有数据' },
  essay:           { icon: '✍️', color: 'text-sky-300',      bg: 'bg-sky-500/10',      label: '写文章/论文',  desc: '撰写研究文章、博客或论文' },
  team:            { icon: '👥', color: 'text-violet-300',   bg: 'bg-violet-500/10',   label: '组队',        desc: '找到合作者，分工合作' },
  translate:       { icon: '🌐', color: 'text-emerald-300',  bg: 'bg-emerald-500/10',  label: '翻译/本地化',  desc: '把资料翻译成你的母语' },
  teach:           { icon: '🎓', color: 'text-amber-300',    bg: 'bg-amber-500/10',    label: '教学/讲解',   desc: '给其他人讲解这个问题' },
  fund:            { icon: '💰', color: 'text-yellow-300',   bg: 'bg-yellow-500/10',   label: '资助/投资',   desc: '给研究者或项目提供资金' }
};

export const PROBLEMS = [
'''

JS_TAIL = '''
];

// 派生：按类别分组
export const PROBLEMS_BY_CATEGORY = PROBLEMS.reduce((acc, p) => {
  (acc[p.category] = acc[p.category] || []).push(p);
  return acc;
}, {});

// 工具函数
export function getProblemById(id) {
  return PROBLEMS.find(p => p.id === id);
}

export function searchProblems(query) {
  if (!query) return PROBLEMS;
  const q = query.toLowerCase();
  return PROBLEMS.filter(p =>
    p.title.toLowerCase().includes(q) ||
    p.titleEn.toLowerCase().includes(q) ||
    p.summary.toLowerCase().includes(q) ||
    (p.summaryEn && p.summaryEn.toLowerCase().includes(q)) ||
    p.kid.toLowerCase().includes(q) ||
    (p.kidEn && p.kidEn.toLowerCase().includes(q)) ||
    p.tags.some(t => t.toLowerCase().includes(q))
  );
}
'''


def escape_js_string(s):
    """转义 JS 字符串内的单引号和反斜杠"""
    if s is None:
        return ''
    s = str(s)
    s = s.replace('\\', '\\\\')
    s = s.replace("'", "\\'")
    return s


def js_value(v):
    if isinstance(v, str):
        return f"'{escape_js_string(v)}'"
    elif isinstance(v, bool):
        return 'true' if v else 'false'
    elif isinstance(v, (int, float)):
        return str(v)
    elif isinstance(v, list):
        items = []
        for item in v:
            if isinstance(item, dict):
                obj_items = []
                for k, val in item.items():
                    obj_items.append(f"{k}: {js_value(val)}")
                items.append('{ ' + ', '.join(obj_items) + ' }')
            else:
                items.append(js_value(item))
        return '[' + ', '.join(items) + ']'
    elif isinstance(v, dict):
        obj_items = []
        for k, val in v.items():
            obj_items.append(f"{k}: {js_value(val)}")
        return '{ ' + ', '.join(obj_items) + ' }'
    elif v is None:
        return 'null'
    else:
        return js_value(str(v))


def problem_to_js(p):
    parts = []
    for key in ['id', 'category', 'title', 'titleEn', 'year', 'proposer',
                'difficulty', 'reward', 'status',
                'summary', 'summaryEn',
                'kid', 'kidEn',
                'formal', 'formalEn',
                'whyHard', 'whyHardEn',
                'aiPrompt', 'aiPromptEn',
                'tags', 'videoUrl', 'videoTitle',
                'videoChannel', 'participate']:
        val = p.get(key)
        if val is None or val == '':
            if key in ['participate', 'tags', 'videoUrl', 'videoTitle', 'videoChannel']:
                # keep empty for participate/tags
                if key in ['participate', 'tags']:
                    parts.append(f"    {key}: []")
                else:
                    parts.append(f"    {key}: ''")
            continue
        parts.append(f"    {key}: {js_value(val)}")
    return '  {\n' + ',\n'.join(parts) + '\n  }'


# 生成全部问题
problems_js = []
for p in gp.PROBLEMS:
    problems_js.append(problem_to_js(p))

# 拼接
output = JS_HEAD + ',\n'.join(problems_js) + JS_TAIL

# 写到两个文件
client_path = os.path.join(os.path.dirname(__file__), '..', 'client', 'src', 'lib', 'problems.js')
server_path = os.path.join(os.path.dirname(__file__), '..', 'server', 'src', 'data', 'problems.js')
client_path = os.path.abspath(client_path)
server_path = os.path.abspath(server_path)

for path in [client_path, server_path]:
    with open(path, 'w', encoding='utf-8') as f:
        f.write(output)
    print(f"Wrote: {path} ({len(output)} bytes)")

print("Done!")
