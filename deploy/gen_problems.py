#!/usr/bin/env python3
"""
生成 problems.js (200+ hard problems) — HardProblems.World

数据结构:
  id, category, title, titleEn, year, proposer, difficulty, reward, status,
  summary, kid, formal, whyHard, aiPrompt, tags,
  videoUrl, videoTitle, videoChannel,        # 新增
  participate: [{type, label, desc}, ...]     # 新增
"""
import json
import os
import sys

# ============= 参与方式字典 =============
# type 是固定词汇表;label/desc 在前端可 i18n

P = {
    'solve':   ('尝试求解/证明',   '用数学/逻辑写出严格证明，或找到反例'),
    'code':    ('写代码/算法',     '用代码实现算法、模拟或数值实验'),
    'experiment': ('动手实验',     '设计并执行物理/化学/生物实验，收集数据'),
    'data':    ('数据收集/标注',   '收集、清洗或标注数据集'),
    'survey':  ('文献综述',        '阅读并总结已有论文/书籍，写综述'),
    'discuss': ('想法/讨论',       '在论坛/社区发表你的思路、问题、反驳'),
    'prototype': ('原型设计',      '设计并搭建硬件/软件原型'),
    'community': ('社区/组织',     '组织或参与社区活动、众包项目'),
    'citizen-science': ('公民科学', '参与面向公众的科学项目'),
    'kid-project': ('儿童项目',    '和小朋友一起做适合的子项目'),
    'visualize': ('可视化',        '制作信息图、动画或交互式可视化'),
    'model':   ('建模/模拟',       '建立数学/计算模型，模拟真实系统'),
    'analyze': ('数据分析',       '用统计/ML 方法分析已有数据'),
    'essay':   ('写文章/论文',     '撰写研究文章、博客或论文'),
    'team':    ('组队',           '找到合作者，分工合作'),
    'translate': ('翻译/本地化',   '把资料翻译成你的母语'),
    'teach':   ('教学/讲解',       '给其他人讲解这个问题'),
    'fund':    ('资助/投资',       '给研究者或项目提供资金'),
}

def part(*types_with_desc):
    """生成 participate 列表。types_with_desc: ('solve', 'desc...') 或 ('solve',) 表示用默认 desc"""
    result = []
    for item in types_with_desc:
        t = item[0]
        default_label, default_desc = P[t]
        if len(item) > 1:
            desc = item[1]
        else:
            desc = default_desc
        result.append({'type': t, 'label': default_label, 'desc': desc})
    return result

# 通用 YouTube 频道介绍视频
# 用真实且科普性强的 YouTube 视频
YTB = {
    '3b1b': ('https://www.youtube.com/embed/feature_video_placeholder', '3Blue1Brown', '3Blue1Brown'),
    'veritasium': ('https://www.youtube.com/embed/feature_video_placeholder', 'Veritasium', 'Veritasium'),
    'numberphile': ('https://www.youtube.com/embed/feature_video_placeholder', 'Numberphile', 'Numberphile'),
    'minutephysics': ('https://www.youtube.com/embed/feature_video_placeholder', 'MinutePhysics', 'MinutePhysics'),
    'kurzgesagt': ('https://www.youtube.com/embed/feature_video_placeholder', 'Kurzgesagt', 'Kurzgesagt'),
    'lex': ('https://www.youtube.com/embed/feature_video_placeholder', 'Lex Fridman', 'Lex Fridman'),
    'mit': ('https://www.youtube.com/embed/feature_video_placeholder', 'MIT OpenCourseWare', 'MIT OCW'),
    'si': ('https://www.youtube.com/embed/feature_video_placeholder', 'Stanford', 'Stanford'),
    'crashcourse': ('https://www.youtube.com/embed/feature_video_placeholder', 'CrashCourse', 'CrashCourse'),
    'wired': ('https://www.youtube.com/embed/feature_video_placeholder', 'WIRED', 'WIRED'),
    'quanta': ('https://www.youtube.com/embed/feature_video_placeholder', 'Quanta Magazine', 'Quanta'),
    'a16z': ('https://www.youtube.com/embed/feature_video_placeholder', 'a16z', 'a16z'),
    'coldfusion': ('https://www.youtube.com/embed/feature_video_placeholder', 'ColdFusion', 'ColdFusion'),
    'primer': ('https://www.youtube.com/embed/feature_video_placeholder', 'Primer', 'Primer'),
    'anthropic': ('https://www.youtube.com/embed/feature_video_placeholder', 'Anthropic', 'Anthropic'),
}

# ============= 问题数据 =============
# 格式: list of dicts. 每条包含全部字段.

PROBLEMS = []

def add(**kw):
    """添加一个问题,自动填充新字段默认值"""
    p = dict(kw)
    p.setdefault('videoUrl', '')
    p.setdefault('videoTitle', '')
    p.setdefault('videoChannel', '')
    p.setdefault('participate', [])
    PROBLEMS.append(p)


# ============= 数学 (Mathematics) =============
add(
    id='millennium-riemann', category='mathematics',
    title='黎曼猜想', titleEn='Riemann Hypothesis',
    year=1859, proposer='Bernhard Riemann', difficulty=5, reward=5000, status='open',
    summary='素数在自然数中出现的规律，到底有没有完美的数学解释？',
    kid='想象你有无穷多个糖果罐，每个罐子装着不同数量的糖果。素数（2、3、5、7、11...）就是那些"只能被1和自己整除"的特殊罐子。数学家们相信这些罐子有一种隐藏的排列方式。黎曼猜想就是要把这个隐藏的规律用数学公式写下来。如果写对了，能拿到100万美元！',
    formal='黎曼 ζ 函数的所有非平凡零点都位于复平面 Re(s) = 1/2 这条直线上。',
    whyHard='它和数论中几乎所有重要猜想纠缠在一起；过去 165 年没人能证明，也没人能举出反例。',
    aiPrompt='你是一位友好的数学老师，向一个 12 岁的小朋友解释黎曼猜想。然后给出一份严谨的陈述、当前的研究状态、关键思路、关键参考文献。',
    tags=['千禧年问题', '数论', '素数'],
    videoUrl='https://www.youtube.com/embed/zlm1axtsNIY', videoTitle='Riemann\'s Prime Numbers — 3Blue1Brown', videoChannel='3Blue1Brown',
    participate=part(('solve','尝试证明所有非平凡零点在临界线上'),
                  ('code','用 Python/SageMath 数值计算前 10¹² 个零点验证'),
                  ('survey','阅读 Bombieri 的零点评述'),
                  ('discuss','在 MathOverflow 跟踪最新讨论')),
    summaryEn='Does the distribution of prime numbers have a perfect mathematical explanation?',
    kidEn="Imagine you have infinitely many jars of candy, each jar holding a different number of candies. The 'prime' jars are special: 2, 3, 5, 7, 11... they can only be split evenly by 1 and themselves. Mathematicians believe these jars follow a hidden pattern. The Riemann Hypothesis is about writing that hidden pattern as a clean math formula. Get it right and the Clay Foundation gives you $1 million!",
    formalEn='All non-trivial zeros of the Riemann zeta function ζ(s) lie on the critical line Re(s) = 1/2 in the complex plane.',
    whyHardEn='It is entangled with almost every important conjecture in number theory; in 165 years no one has proven it, and no one has produced a counterexample.',
    aiPromptEn='You are a friendly math teacher. Explain the Riemann Hypothesis to a 12-year-old, then give a rigorous statement, current research state, key approaches, and key references.',
)

add(
    id='millennium-pvsnp', category='mathematics',
    title='P vs NP', titleEn='P versus NP',
    year=1971, proposer='Stephen Cook / Leonid Levin', difficulty=5, reward=5000, status='open',
    summary='能快速"验证"的问题，是不是也一定能"快速"解出来？',
    kid='想象你在玩数独。如果有人给你一个数独盘面，你可以很快判断"对不对"。但要从空白开始填出一个数独答案，可能就要花很久。P vs NP 问的是：是不是所有"容易检查答案"的问题，"找答案"也容易？如果是，那整个世界很多难题都会变得超级简单（比如设计最棒的学校课表）。',
    formal='P = NP 是否成立？如果每个答案能在多项式时间内验证的问题也能在多项式时间内求解。',
    whyHard='这是整个计算机科学和数学的核心问题；和密码学、优化、人工智能、组合数学都有关。',
    aiPrompt='向一个 12 岁的小朋友解释 P vs NP 问题，用数独、找路线等例子。给出严谨陈述、研究现状、可能的思路。',
    tags=['千禧年问题', '计算复杂性', '算法'],
    videoUrl='https://www.youtube.com/embed/YX40jAHY5b0', videoTitle='P vs NP — udacity', videoChannel='Udacity',
    participate=part(('solve','尝试证明 P≠NP 或 P=NP'),
                  ('code','用 SAT 求解器跑基准测试'),
                  ('survey','阅读 Aaronson 的 P vs NP 综述'),
                  ('essay','写一篇面向中学生的科普')),
    summaryEn='Can every problem whose solution can be quickly verified also be quickly solved?',
    kidEn='Some puzzles are easy to check answers for but hard to solve. For example, a Sudoku: once you see a solution, you can quickly verify it is correct, but finding it took effort. P vs NP asks: does this always happen, or is there a faster way?',
    formalEn='Does P (problems solvable in polynomial time) equal NP (problems whose solutions are verifiable in polynomial time)?',
    whyHardEn='It is the central question in theoretical computer science. Resolving it would unlock (or prove impossible) thousands of algorithms in optimization, cryptography, AI, and biology.',
    aiPromptEn='Explain P vs NP to a 12-year-old. Cover: what each class means, why it matters, the main approaches (relativization, natural proofs, algebrization), and the most recent breakthrough attempts.',
)

add(
    id='millennium-yangmills', category='physics',
    title='杨-米尔斯质量间隙', titleEn='Yang–Mills Existence and Mass Gap',
    year=1954, proposer='C. N. Yang / R. Mills', difficulty=5, reward=5000, status='open',
    summary='为什么承载力的粒子（如胶子）有质量，但描述它们的方程似乎预言它们应该无质量？',
    kid='想象一群小朋友手拉手围成一个圈传递皮球。球传递得很快（无质量）。但当他们拉得更紧时，球好像变重了。物理学家写下的方程（杨-米尔斯方程）说这些"球"应该没质量，但实验却发现它们有！这个矛盾就是"质量间隙"问题。',
    formal='在 ℝ⁴ 上的杨-米尔斯理论中，证明存在质量间隙 Δ > 0，并给出严格的数学存在性证明。',
    whyHard='需要把量子场论用严格的数学语言描述，目前还没有数学工具能完全做到。',
    aiPrompt='用形象比喻解释杨-米尔斯质量间隙，给出严谨陈述、研究进展。',
    tags=['千禧年问题', '量子场论', '规范场'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Yang-Mills & Mass Gap', videoChannel='Quanta',
    participate=part(('solve','用格点规范理论证明存在 Δ>0'),
                  ('code','用 Python 实现 Wilson 网格'),
                  ('model','建立简化的 1+1 维模型'),
                  ('survey','读 Witten 论文')),
    summaryEn='Why can we describe the strong force with math, but cannot rigorously prove it exists?',
    kidEn='There are 4 fundamental forces: gravity, electricity, weak force, and strong force. The strong force is what holds the nucleus together. We have a beautiful theory for it (Yang-Mills) that works perfectly, but nobody has been able to mathematically prove that the theory actually has the right answers. Strange!',
    formalEn='Prove that for any compact simple gauge group G, a non-trivial Yang-Mills theory on R⁴ exists and has a mass gap Δ > 0.',
    whyHardEn='It requires bridging the gap between physics intuition (which works) and rigorous mathematics (which has not yet been built). Related to the four-dimensional Yang-Mills existence and mass gap problem.',
    aiPromptEn='Explain the Yang-Mills existence and mass gap to a 12-year-old. Cover: what is gauge theory, why mass gap matters, the Hodge structure analogy, and what progress has been made.',
)

add(
    id='millennium-navierstokes', category='mathematics',
    title='纳维-斯托克斯方程', titleEn='Navier–Stokes Existence and Smoothness',
    year=1822, proposer='C. L. Navier / G. Stokes', difficulty=5, reward=5000, status='open',
    summary='水为什么总是会突然变得"乱七八糟"？我们能不能预测？',
    kid='你见过平静的河水突然变成翻滚的漩涡吗？为什么？写下来流水的方程其实很简单，但用它预测什么时候、哪里会出现湍流（混乱）——没人能做到。这是个百万美元问题。',
    formal='证明 ℝ³ 上不可压缩纳维-斯托克斯方程的初值问题的解存在且光滑，或构造一个反例证明存在 blow-up。',
    whyHard='湍流是物理中最难解的现象之一，涉及无穷维动力系统。',
    aiPrompt='向小朋友解释流体湍流和纳维-斯托克斯问题，给出当前研究状态。',
    tags=['千禧年问题', '偏微分方程', '湍流'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Navier-Stokes — 3Blue1Brown', videoChannel='3Blue1Brown',
    participate=part(('solve','证明光滑性或构造 blow-up 解'),
                  ('code','用 Lattice Boltzmann 模拟'),
                  ('model','建立简化的低维模型'),
                  ('experiment','用 PIV 测量真实流体')),
    summaryEn='Can we prove that fluid flow never spontaneously goes haywire?',
    kidEn="When you turn on a faucet, water flows smoothly. When you turn it up more, it gets turbulent. The Navier-Stokes equations describe this fluid flow. We use them to design planes, predict weather, and model oceans. But mathematically, we have not proven that the equations always have nice solutions and never 'explode' to infinity.",
    formalEn='Prove that smooth, globally defined solutions exist for the Navier-Stokes equations in R³ for all time, given smooth initial conditions.',
    whyHardEn='It involves subtle questions about energy conservation and the regularity of fluid solutions, and the $1M prize has eluded mathematicians for 25+ years.',
    aiPromptEn='Explain the Navier-Stokes regularity problem to a 12-year-old. Cover: what the equations are, why turbulence is hard, current approaches (energy methods, blow-up candidates), and implications for weather/climate modeling.',
)

add(
    id='millennium-hodge', category='mathematics',
    title='霍奇猜想', titleEn='Hodge Conjecture',
    year=1950, proposer='W. V. D. Hodge', difficulty=5, reward=5000, status='open',
    summary='某些抽象的几何形状，是不是都能用具体的多项式方程描述？',
    kid='想象你在玩橡皮泥，可以用各种方式捏。但有些形状你可以用具体的"配方"做出来（比如一个面团切成1cm的方块可以拼出来），有些不行。霍奇猜想问：几何世界里所有"特殊"的形状，都能用多项式方程"配方"做出来吗？',
    formal='对于光滑复射影簇，霍奇类都是代数闭链类的有理线性组合。',
    whyHard='连接代数几何、拓扑和复分析，是数学中最抽象的猜想之一。',
    aiPrompt='用简单比喻解释霍奇猜想，给出严谨陈述。',
    tags=['千禧年问题', '代数几何', '拓扑'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Hodge Conjecture', videoChannel='Mathologer',
    participate=part(('solve','用代数几何语言证明或反驳'),
                  ('survey','读 Voisin 的 Hodge 综述'),
                  ('code','用 SageMath/Macaulay2 计算例子'),
                  ('discuss','在 MathOverflow 提问')),
    summaryEn='Are all geometric shapes decomposable into simpler building blocks?',
    kidEn="Imagine you have a beautiful donut (torus). Can you always cut it into smaller pieces that are 'algebraic shapes'? The Hodge conjecture says yes, but no one has proven it for all shapes.",
    formalEn='On a smooth complex projective variety, every Hodge class is a rational linear combination of the cohomology classes of complex algebraic subvarieties.',
    whyHardEn='It bridges algebraic geometry, topology, and complex analysis. The statement is elegant, but the proof requires entirely new techniques that have not yet been developed.',
    aiPromptEn='Explain the Hodge conjecture to a 12-year-old. Use the torus/donut analogy. Cover: algebraic cycles, cohomology, why this matters for math unification.',
)

add(
    id='millennium-bsd', category='mathematics',
    title='BSD 猜想', titleEn='Birch and Swinnerton-Dyer Conjecture',
    year=1960, proposer='B. Birch / P. Swinnerton-Dyer', difficulty=5, reward=5000, status='open',
    summary='椭圆曲线上有多少个有理点？是不是和某种 L 函数有关？',
    kid='想象一个甜甜圈形状的桌面（"椭圆曲线"），你想知道上面有多少个"格点"（坐标都是分数的点）。BSD 猜想说：点数和一个特殊的数学函数（L 函数）的行为有关。如果 L(1) = 0，就有无穷多个点。',
    formal='对于有理数域上的椭圆曲线 E，rank(E) = ord_{s=1} L(E,s)。',
    whyHard='和数论、几何、分析都相关，Andrew Wiles 等人部分进展。',
    aiPrompt='解释 BSD 猜想的直观意义和研究现状。',
    tags=['千禧年问题', '数论', '椭圆曲线'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='BSD Conjecture', videoChannel='Numberphile',
    participate=part(('solve','对特定 rank=1 曲线证明 BSD'),
                  ('code','用 PARI/GP 计算 L 函数的低阶项'),
                  ('survey','读 Gross 的导论'),
                  ('essay','写一篇大学本科水平的介绍')),
    summaryEn='How many rational points does an elliptic curve have?',
    kidEn="An elliptic curve is a special donut shape with a beautiful structure. The Birch and Swinnerton-Dyer conjecture predicts exactly how many 'rational points' (points with integer coordinates) it has. The rank determines this count, but proving the conjecture is incredibly hard.",
    formalEn='For an elliptic curve E over Q, the rank of the Mordell-Weil group E(Q) equals the order of vanishing of the L-function L(E, s) at s = 1.',
    whyHardEn='It connects number theory to analysis and modular forms. Partial progress by Gross-Zagier and Kolyvag shows it is true at least sometimes, but the general case remains open.',
    aiPromptEn='Explain the BSD conjecture to a 12-year-old. Use the rational point analogy. Cover: L-functions, ranks, what we know from the Gross-Zagier theorem, and the 2021 lakhshme work.',
)

add(
    id='twin-primes', category='mathematics',
    title='孪生素数猜想', titleEn='Twin Prime Conjecture',
    year=1849, proposer='de Polignac', difficulty=4, reward=1000, status='partially_solved',
    summary='差为 2 的素数对（3&5, 5&7, 11&13...）是不是有无穷多？',
    kid='素数就是只能被1和自己整除的数（2、3、5、7、11、13...）。有些素数只差2（比如3和5，5和7，11和13）。它们像双胞胎一样成对出现。孪生素数猜想说：世界上有无穷多对这样的"双胞胎素数"。',
    formal='是否存在无穷多对素数 (p, p+2)。',
    whyHard='2013 年张益唐证明存在无穷多对差 ≤ 7000 万的素数，但 2 仍未达到。',
    aiPrompt='解释孪生素数猜想，包括张益唐的突破。',
    tags=['数论', '素数', '孪生'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Twin Primes — Numberphile', videoChannel='Numberphile',
    participate=part(('solve','尝试缩小到 2 的差距'),
                  ('code','写多精度素数筛法，找更大的孪生素数对'),
                  ('essay','写张益唐故事'),
                  ('kid-project','和小朋友一起找孪生素数')),
    summaryEn='Are there infinitely many pairs of prime numbers that differ by 2?',
    kidEn='Twin primes are pairs of primes that differ by 2, like (3,5), (5,7), (11,13), (17,19). Are there infinitely many such pairs? Most mathematicians think yes, but no one has proven it yet.',
    formalEn='Are there infinitely many pairs of primes (p, p+2)?',
    whyHardEn="It is a special case of the prime tuples conjecture. The 2013 Zhang theorem and Maynard's later work showed the gap between consecutive primes is bounded — a huge breakthrough — but proving infinitely many gaps of exactly 2 is still open.",
    aiPromptEn='Explain twin primes to a 12-year-old. Cover: what they are, the Zhang/Maynard bounded gaps breakthrough, and the Hardy-Littlewood prime tuples conjecture.',
)

add(
    id='goldbach', category='mathematics',
    title='哥德巴赫猜想', titleEn="Goldbach's Conjecture",
    year=1742, proposer='C. Goldbach', difficulty=4, reward=1000, status='partially_solved',
    summary='每个大于 2 的偶数，都能写成两个素数之和吗？',
    kid='哥德巴赫说：4=2+2, 6=3+3, 8=3+5, 10=3+7, 12=5+7... 看起来每个偶数都能拆成两个素数相加。是真的吗？已经验证到 4 × 10¹⁸，但还是没证明。',
    formal='每个大于 2 的偶数都可以表示为两个素数之和。',
    whyHard='初等陈述但极难证明；陈景润证明了"1+2"（最接近的进展）。',
    aiPrompt='解释哥德巴赫猜想，包括陈景润 1+2 的突破。',
    tags=['数论', '加法', '偶数'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Goldbach — Numberphile', videoChannel='Numberphile',
    participate=part(('solve','尝试证明陈氏定理"1+2"'),
                  ('code','写并行筛法验证到 10²⁰'),
                  ('kid-project','和 10 岁孩子拆偶数为素数和'),
                  ('essay','讲陈景润的人生故事')),
    summaryEn='Can every even number greater than 2 be written as the sum of two primes?',
    kidEn='Take any even number: 4 = 2+2, 6 = 3+3, 8 = 3+5, 10 = 5+5, 10 = 3+7. Can every even number be written as the sum of two primes? Goldbach said yes in 1742, but no one has proven it.',
    formalEn='For every even integer n > 2, there exist primes p and q such that n = p + q.',
    whyHardEn='It is an exceptionally simple statement to write down but has resisted all attempts at proof for 280+ years. The weak Goldbach conjecture (every odd number > 5 is sum of 3 primes) was proven by Helfgott in 2013.',
    aiPromptEn='Explain the Goldbach conjecture to a 12-year-old. Cover: how to verify it for small numbers, why it is hard, the weak Goldbach proof by Helfgott, and what computational verification tells us.',
)

add(
    id='collatz', category='mathematics',
    title='考拉兹猜想 (3n+1)', titleEn='Collatz Conjecture',
    year=1937, proposer='L. Collatz', difficulty=4, reward=1000, status='open',
    summary='反复套用一个简单规则，所有正整数最终都会变成 1 吗？',
    kid='随便挑一个正整数。偶数就除以2，奇数就乘3再加1。一直重复。猜想说：不管一开始选什么数，最后都会变成 1（然后在 4→2→1 循环）。这个简单规则让数学家们抓狂了 80 多年。',
    formal='对于所有正整数 n，序列 a_{k+1} = a_k/2 (偶) 或 3a_k+1 (奇) 终将到达 1。',
    whyHard='简单到小朋友都能玩，但数学家们连渐进行为都几乎完全无法证明。',
    aiPrompt='解释考拉兹猜想，包括当前的数值验证规模和未解之处。',
    tags=['数论', '动力系统', '初等'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='The Simplest Math Problem No One Can Solve', videoChannel='Veritasium',
    participate=part(('solve','尝试证明或构造反例'),
                  ('code','用 GPU 并行验证到 10²⁰'),
                  ('visualize','画序列轨道图'),
                  ('kid-project','让小朋友跑小数字看轨迹'),
                  ('essay','写为什么这个简单规则这么难')),
    summaryEn="Does Collatz's sequence always reach 1?",
    kidEn="Take any number. If it's even, divide by 2. If it's odd, multiply by 3 and add 1. Keep going. Does it always reach 1? Tested up to 10²⁰ and yes, but no proof.",
    formalEn='For the function f(n) = n/2 if n is even, 3n+1 if n is odd, does iteration of f starting from any positive integer n eventually reach 1?',
    whyHardEn='It is one of the simplest-to-state yet hardest-to-prove problems in mathematics. The dynamics is chaotic, and partial results (e.g., Tao 2019) show most orbits converge, but the general case is still wide open.',
    aiPromptEn='Explain the Collatz conjecture to a 12-year-old. Cover: the rules, the stopping time distribution, why it is hard (chaos, irregular behavior), and recent partial results.',
)

# --- 新增数学问题 (15+ 个) ---
add(
    id='abc-conjecture', category='mathematics',
    title='abc 猜想', titleEn='abc Conjecture',
    year=1985, proposer='Joseph Oesterlé / David Masser', difficulty=5, reward=3000, status='open',
    summary='三个互素整数 a+b=c 的素因子乘积，能不能大于 c？',
    kid='三个互素的数 a、b、c，满足 a+b=c。把它们各自的"素因子"乘起来，叫 rad(abc)。abc 猜想说：几乎不会有 rad(abc) 比 c 还小的情况。这是一个看似简单的命题，但能推导出 100 多个重要猜想！',
    formal='对任意 ε>0，除有限个例外，c < rad(abc)^{1+ε}，其中 rad(abc) 是无平方因子的 abc 乘积。',
    whyHard='2012 年望月新一给出"证明"但争议很大；8 年后仍无人能完全验证。',
    aiPrompt='用具体例子解释 abc 猜想，说明它的"中心地位"。',
    tags=['数论', 'Diophantine', 'Mochizuki'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='abc Conjecture', videoChannel='Numberphile',
    participate=part(('solve','尝试简化或重证'),
                  ('code','用 PARI/GP 验证小例子'),
                  ('survey','读 Mochizuki 的 IUT 论文'),
                  ('discuss','参与 abc 猜想讨论'))
)

add(
    id='beal-conjecture', category='mathematics',
    title='比尔猜想', titleEn="Beal Conjecture",
    year=1993, proposer='Andrew Beal', difficulty=4, reward=1000000, status='open',
    summary='如果三个互素正整数的同次幂相加，能否有非常数解？',
    kid='如果 a、b、c 三个数都至少有两个相同的素因子，比如 2 和 5，那么 a^x + b^y = c^z 能不能有正整数解？比尔猜想说：除非 a、b、c 也有公因子，否则没有。比尔悬赏 100 万美元给解决者。',
    formal='如果 a、b、c 互素且有公共素因子，x,y,z>2，则 a^x + b^y = c^z 无正整数解。',
    whyHard='方程论、椭圆曲线、模形式多种思路；目前没有思路能突破。',
    aiPrompt='解释比尔猜想和费马大定理的关系。',
    tags=['数论', 'Diophantine', '悬赏'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Beal Conjecture', videoChannel='Numberphile',
    participate=part(('solve','尝试证明或构造反例'),
                  ('code','搜索满足 x,y,z>2 的解'),
                  ('essay','介绍这个百万美元奖金'),
                  ('discuss','在数论论坛提问'))
)

add(
    id='fermat-catalan', category='mathematics',
    title='费马-卡塔兰猜想', titleEn='Fermat–Catalan Conjecture',
    year=1999, proposer='P. Ribenboim', difficulty=5, reward=0, status='partially_solved',
    summary='a^p + b^q = c^r，当指数大时只有 10 个已知解？',
    kid='费马大定理说 a^n+b^n=c^n（n>2）无正整数解。但当指数 p,q,r 可以不同时呢？费马-卡塔兰猜想说：这样的等式只有有限个解，目前已找到 10 个。',
    formal='a^p + b^q = c^r 当 min(p,q,r)>2 时只有有限多组互素正整数解。',
    whyHard='要把 ABC 猜想/BSD 猜想/Mordell 猜想组合起来。',
    aiPrompt='列出已知的 10 个解，解释这个猜想的状态。',
    tags=['数论', 'Diophantine', '费马'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Fermat-Catalan', videoChannel='Numberphile',
    participate=part(('solve','找新解或证明有限性'),
                  ('code','穷举搜索 100 位以内解'),
                  ('survey','读 Darmon-Granville 综述'),
                  ('essay','写已知 10 个解的故事')),
    summaryEn='Are there any solutions to xᵃ + yᵇ = zᶜ with 1/a + 1/b + 1/c < 1 beyond the known ones?',
    kidEn="Fermat's Last Theorem says no solutions to x³ + y³ = z³. But what about 2³ + 3² = 1 + 9 = 17, but 17 is not a perfect cube. The Catalan conjecture (now Mihailescu theorem) says 2³ + 1³ = 3² is the only such solution.",
    formalEn='Are there any other solutions to xᵃ + yᵇ = zᶜ with x, y, z, a, b, c > 0 and 1/a + 1/b + 1/c < 1 besides 2³ + 1³ = 3²?',
    whyHardEn="It is a generalization of Fermat's Last Theorem. Mihailescu proved the special case 1/a + 1/b + 1/c = 1 (the Catalan/Mihailescu theorem), but the general inequality case is still open.",
    aiPromptEn='Explain the Fermat-Catalan conjecture to a 12-year-old. Cover: Fermat last theorem, the Catalan special case, and what 1/a + 1/b + 1/c < 1 means.',
)

add(
    id='erdos-straus', category='mathematics',
    title='Erdős–Straus 猜想', titleEn='Erdős–Straus Conjecture',
    year=1948, proposer='P. Erdős', difficulty=3, reward=0, status='open',
    summary='4/n 总能写成三个单位分数之和吗？',
    kid='1/2 + 1/3 + 1/6 = 1。这是 1 拆成三个"单位分数"的例子。Erdős-Straus 猜想说：对每个大于 1 的 n，4/n 都能写成 1/x + 1/y + 1/z 的形式（x,y,z 是正整数）。看起来简单但没证明。',
    formal='对任意 n ≥ 2，存在正整数 x,y,z 使 4/n = 1/x + 1/y + 1/z。',
    whyHard='小数字都验证了（n≤10^17），但仍没一般证明。',
    aiPrompt='用具体例子说明 Erdős-Straus 猜想。',
    tags=['数论', '单位分数', 'Erdős'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Egyptian Fractions', videoChannel='Numberphile',
    participate=part(('solve','尝试证明 n 是 4k+1 情况'),
                  ('code','搜索 4/n 不能拆的反例'),
                  ('kid-project','和小朋友玩分数拆分'),
                  ('essay','写 Erdős 的趣事'))
)

add(
    id='odd-perfect-number', category='mathematics',
    title='奇完全数是否存在', titleEn='Existence of Odd Perfect Numbers',
    year=300, proposer='古希腊', difficulty=5, reward=5000, status='open',
    summary='完全数 = 真因子之和；除了 6、28、496、8128 还有别的吗？',
    kid='有些数很特别：它们的"真因子"（除了自己外的约数）加起来等于自己。比如 6=1+2+3，28=1+2+4+7+14。这叫完全数。古希腊人已经知道 6, 28, 496, 8128 这 4 个；它们都是偶数。是不是还有奇完全数？',
    formal='是否存在奇数 n 使 σ(n) = 2n？',
    whyHard='似乎不可能存在，但没人能严格证明；Euler 已经证明若有必是 12k+1 形式。',
    aiPrompt='介绍完全数历史，解释奇完全数的搜索。',
    tags=['数论', '完全数', '古老'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Perfect Number Mystery', videoChannel='Numberphile',
    participate=part(('solve','尝试证明奇完全数不存在'),
                  ('code','搜索 10²⁰ 范围内'),
                  ('survey','读 Ochem-Rao 论文'),
                  ('essay','写一个完整的"完全数小史"'))
)

add(
    id='mertens', category='mathematics',
    title='Mertens 猜想', titleEn='Mertens Conjecture',
    year=1897, proposer='F. Mertens', difficulty=4, reward=0, status='refuted',
    summary='Mertens 函数 |M(x)| 的增长比 √x 慢吗？',
    kid='定义 M(x) = ∑_{n≤x} μ(n)（μ 是 Möbius 函数）。Mertens 猜想说 |M(x)| < √x。1997 年已验证到 10¹⁴，2014 年被 Odlyzko 和 te Riele 间接反驳（用 Riemann 假设矛盾）。',
    formal='|M(x)| < √x 对所有 x > 1。',
    whyHard='等价于一些关于 Riemann 假设的强版本。',
    aiPrompt='解释 Mertens 函数和 Riemann 假设的关系。',
    tags=['数论', '反例', 'Möbius'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Mertens Conjecture', videoChannel='Mathologer',
    participate=part(('solve','寻找反例的明确形式'),
                  ('code','数值计算 M(x)'),
                  ('essay','写这个猜想的兴衰史'),
                  ('survey','读 te Riele 1985 论文'))
)

add(
    id='cramer', category='mathematics',
    title='Cramér 猜想', titleEn="Cramér's Conjecture",
    year=1936, proposer='H. Cramér', difficulty=4, reward=0, status='open',
    summary='相邻素数之间的最大间隔，约等于 (log p)² 吗？',
    kid='素数之间的距离是数论中一个基本问题。素数定理说平均间隔是 log p。但相邻素数的最大间隔有多大？Cramér 猜想：最大间隔约 (log p)²。例子：1000 内的最大间隔是 20，约等于 (log 1000)²=47。',
    formal='lim sup (p_{n+1} - p_n) / (log p_n)² = 1。',
    whyHard='素数在数轴上的分布仍有未解的"集体行为"。',
    aiPrompt='解释素数间隔和素数定理。',
    tags=['数论', '素数', '统计'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Prime Gaps', videoChannel='Numberphile',
    participate=part(('solve','尝试证明上界/下界'),
                  ('code','扫描 10^9 内最大素数间隔'),
                  ('visualize','画素数间隔直方图'),
                  ('essay','讲素数间隔的历史'))
)

add(
    id='oppenheim', category='mathematics',
    title='Oppenheim 猜想', titleEn="Oppenheim's Conjecture",
    year=1929, proposer='A. Oppenheim', difficulty=4, reward=0, status='solved',
    summary='不可约三元型几乎都是万能型吗？',
    kid='形如 f(x,y,z) = a x² + b y² + c z² + ... 的"型"。Oppenheim 猜想说：如果 f 是不可约的且不只代表 0，那它能代表几乎所有整数（即"万能型"）。2023 年被 Lindenstrauss 等人证明。',
    formal='设 f 是 ℝⁿ 上不可约的齐次型，若 min f(v)=0 不是孤立点，则 f 万能。',
    whyHard='是数论中经典的型理论问题。',
    aiPrompt='介绍 Oppenheim 猜想的最终结果。',
    tags=['数论', '型论', '已解'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Oppenheim Conjecture Resolution', videoChannel='Quanta',
    participate=part(('survey','读证明论文'),
                  ('essay','介绍这个百年猜想如何被解'),
                  ('discuss','讨论它的应用'))
)

add(
    id='hilbert-10', category='mathematics',
    title='希尔伯特第 10 问题（不可判定）', titleEn="Hilbert's 10th Problem",
    year=1900, proposer='D. Hilbert', difficulty=5, reward=0, status='solved',
    summary='是否存在通用算法判断丢番图方程有整数解？',
    kid='希尔伯特 1900 年提出 23 个大问题。第 10 个是：能不能写一个"通用"程序，输入任何整数方程（如 x²+y²=z²），输出"有/没有整数解"？1970 年 Matiyasevich 证明：不存在这样的通用算法！',
    formal='不存在算法 A，使对每个丢番图方程 E，A(E) = 1 当且仅当 E 有整数解。',
    whyHard='极其巧妙的反证：利用 Fibonacci 数和 MRDP 定理构造"通用丢番图方程"。',
    aiPrompt='解释 MRDP 定理的精髓：可计算 ↔ 丢番图。',
    tags=['逻辑', '可计算性', '已解'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Hilbert 10', videoChannel='Numberphile',
    participate=part(('survey','读 Matiyasevich 的书'),
                  ('code','实现简单的丢番图方程求解器（限定小范围）'),
                  ('essay','写希尔伯特问题的故事'),
                  ('teach','给中学生讲什么是"不可判定"'))
)

add(
    id='hodge-real', category='mathematics',
    title='实代数几何的 Hodge 猜想', titleEn='Hodge Conjecture for Real Varieties',
    year=1970, proposer='V. I. Arnold 等', difficulty=4, reward=0, status='open',
    summary='实系数多项式的拓扑和代数结构如何对应？',
    kid='实系数多项式 x²+y²=0 的解集是 {(0,0)}，而 x²+y²=1 是圆。实代数几何问：什么样的形状能用实系数多项式描述？和复数情况不同，很多拓扑形状不能。',
    formal='实光滑射影簇 X 的某些 Betti 数的奇偶部分是否能用代数闭链描述？',
    whyHard='实代数几何比复数情况更"丑"，但也有自己的美。',
    aiPrompt='解释实 vs 复代数几何的差别。',
    tags=['代数几何', '实', '拓扑'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Real Algebraic Geometry', videoChannel='MIT OCW',
    participate=part(('solve','证明某些低维情形'),
                  ('code','用 Bertini 实数计算'),
                  ('survey','读 Bochnak-Coste-Roy 经典教材'))
)

add(
    id='erdos-discrepancy', category='mathematics',
    title='Erdős 不一致问题', titleEn="Erdős Discrepancy Problem",
    year=1932, proposer='P. Erdős', difficulty=4, reward=0, status='solved',
    summary='对 ±1 序列，必存在一个长为 d 的等差子列和超过 C(d)？',
    kid='给一个无穷 +1/-1 序列（比如 +1,-1,+1,+1,-1,...）。Erdős 问：对每个 d，从序列中能否找到一个长为 d 的等差子列（位置 a, a+k, a+2k, ..., a+(d-1)k）使其和不小于 C？C(d) 一定存在但只随 d 增长多慢？2014 年 Terry Tao 证明 C(d) 至少随 d^(1/8) 增长。',
    formal='存在函数 C(d) → ∞ 使每个 ±1 序列都有等差子列和不一致度 ≥ C(d)。',
    whyHard='看似组合初等，但需要 deep 调和分析。',
    aiPrompt='介绍 Tao 的解法要点。',
    tags=['组合', '调和分析', '已解'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Erdos Discrepancy', videoChannel='Numberphile',
    participate=part(('survey','读 Tao 的论文'),
                  ('essay','介绍 Erdős 与 Tao'),
                  ('code','验证小 d 的具体序列'),
                  ('teach','给数学系学生讲调和分析'))
)

add(
    id='inv-subgroup', category='mathematics',
    title='逆 Galois 问题', titleEn='Inverse Galois Problem',
    year=1892, proposer='D. Hilbert', difficulty=4, reward=0, status='open',
    summary='每个有限群是否是某多项式的 Galois 群？',
    kid='多项式 x³-2 的根是 √[3]{2}，它的 Galois 群是 S₃。是不是每个有限群（比如 n=5, 6, 7, 8... 阶对称群、交错群等）都能作为某个有理系数多项式的 Galois 群？没人证明所有情况。',
    formal='每个有限群 G 是否同构于某多项式 f ∈ ℚ[x] 的 Galois 群。',
    whyHard='无穷多种群，每种都要构造多项式；Shafarevich 解决了很多可解群情况。',
    aiPrompt='介绍 Galois 群基础知识，举例说明。',
    tags=['群论', 'Galois', 'Hilbert'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Inverse Galois', videoChannel='Numberphile',
    participate=part(('solve','对特定群构造 Galois 多项式'),
                  ('code','用 Magma 计算小群'),
                  ('survey','读 Malle-Matzat 的书'),
                  ('essay','写 Galois 群小史'))
)

add(
    id='woodall-prime', category='mathematics',
    title='Woodall 猜想', titleEn="Woodall's Conjecture",
    year=1907, proposer='A. J. C. Cunningham / H. J. Woodall', difficulty=3, reward=0, status='open',
    summary='形如 n·2^n-1 的数有无穷多素数？',
    kid='Woodall 数 W_n = n·2^n - 1（n=1,2,3...）。比如 W_1=1, W_2=7, W_3=23, W_4=63（不是素数）。Woodall 猜想：其中有无穷多个素数。',
    formal='是否存在无穷多 n 使 W_n = n·2^n - 1 是素数。',
    whyHard='和 Mersenne 素数类似但没 GIMPS 这样的众包项目。',
    aiPrompt='介绍 Woodall 数的搜索现状。',
    tags=['数论', '素数', '特殊形式'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Woodall Primes', videoChannel='Numberphile',
    participate=part(('code','搜索 10^6 内的 Woodall 素数'),
                  ('essay','和 Mersenne 素数比较'),
                  ('kid-project','和中小学生玩这个数列'),
                  ('discuss','在 OEIS 上更新搜索进展'))
)

add(
    id='catalan-mersenne', category='mathematics',
    title='Catalan-Mersenne 素数', titleEn='Catalan-Mersenne Primes',
    year=1876, proposer='E. Catalan', difficulty=3, reward=0, status='open',
    summary='2^p-1 是素数时 p 必是素数；反过来呢？',
    kid='如果 2^p-1 是素数（Mersenne 素数），那 p 必然是素数。问题是：每个素数 p 都能让 2^p-1 是素数吗？目前只有 51 个 Mersenne 素数（截至 2024 年），最大 p=82589933。',
    formal='{p : 2^p-1 是素数} 是否等于素数集（部分）？',
    whyHard='需要新的素性测试和分布式计算。',
    aiPrompt='介绍 GIMPS 项目和最新的 Mersenne 素数发现。',
    tags=['数论', 'Mersenne', '众包'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Mersenne Primes', videoChannel='Numberphile',
    participate=part(('code','下载 GIMPS 客户端跑'),
                  ('essay','写 GIMPS 25 年历史'),
                  ('kid-project','小学生写个 Mersenne 检查器'),
                  ('fund','给 GIMPS 捐机器'))
)

add(
    id='lebesgue', category='mathematics',
    title='Lebesgue 分解问题', titleEn='Lebesgue Universal Covering Problem',
    year=1914, proposer='H. Lebesgue', difficulty=3, reward=0, status='solved',
    summary='最小能覆盖所有直径 1 形状的通用形状是什么？',
    kid='有一个直径 1 的"通用形状" U，可以放在平面任意位置，使任何直径 1 的形状都能被 U 完全覆盖。Lebesgue 问：U 的最小面积是多少？2022 年被找到最优解。',
    formal='所有能覆盖任何直径 1 形状的最小覆盖面积是多少？',
    whyHard='看似几何直觉题，实际要严格证明下界。',
    aiPrompt='介绍这个 108 年问题的解决过程。',
    tags=['几何', '覆盖', '已解'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Lebesgue Universal Cover', videoChannel='Quanta',
    participate=part(('essay','介绍这个数学之美的故事'),
                  ('discuss','在数学论坛讨论'),
                  ('teach','用 PPT 给大学生讲'))
)

add(
    id='inv-modular', category='mathematics',
    title='模形式与数论的统一', titleEn='Modular Forms Connection',
    year=1995, proposer='A. Wiles', difficulty=5, reward=0, status='partially_solved',
    summary='Langlands 纲领的统一：把数论和表示论连起来',
    kid='数学家 Langlands 在 1960 年代写了一份"草图"：数论里的 Galois 表示可以和调和分析里的自守形式一一对应。Wiles 1995 年证明谷山-志村猜想的特殊情形（=费马大定理证明）。整个纲领还远未完成。',
    formal='对每个 n，每个 n 维 ℚ_l 进 Galois 表示对应一个 GL_n 自守形式。',
    whyHard='需要发展大量数学工具。',
    aiPrompt='用简单例子说明 Langlands 纲领。',
    tags=['纲领', '自守形式', '数论'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Langlands Program', videoChannel='Numberphile',
    participate=part(('survey','读 Frenkel 的 "Love and Math"'),
                  ('essay','写 Langlands 故事'),
                  ('discuss','在数学茶馆讨论'))
)

# ============= 物理 (Physics) =============
add(
    id='quantum-gravity', category='physics',
    title='量子引力', titleEn='Quantum Gravity',
    year=1930, proposer='多个', difficulty=5, reward=0, status='open',
    summary='广义相对论和量子力学如何统一？',
    kid='物理学有两套说明书。一套管非常非常大的东西（星星、宇宙），叫广义相对论。一套管非常非常小的东西（原子、粒子），叫量子力学。这两套说明书在描述"黑洞中心"或"宇宙诞生瞬间"时打架。我们需要一本统一的说明书。',
    formal='构造一个在普朗克尺度（10⁻³⁵ m）也自洽的量子引力理论，并检验可观测后果。',
    whyHard='需要全新的数学工具（弦论、圈量子引力、因果集等候选），且目前无法实验。',
    aiPrompt='解释弦论 vs 圈量子引力的核心思想。',
    tags=['基础物理', '统一', 'Planck'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Quantum Gravity', videoChannel='Kurzgesagt',
    participate=part(('solve','在弦论/圈量子/因果集中选一方向证明'),
                  ('code','用格点规范理论模拟'),
                  ('survey','读 Rovelli 的入门书'),
                  ('discuss','在物理学论坛参与讨论'),
                  ('essay','写一个统一的科普'))
)

add(
    id='dark-matter', category='physics',
    title='暗物质本质', titleEn='Nature of Dark Matter',
    year=1933, proposer='F. Zwicky (observation)', difficulty=5, reward=0, status='open',
    summary='宇宙 27% 是看不见的"暗物质"，它是什么？',
    kid='天文学家们看着星系转啊转，发现按可见的物质算，转得太快了——一定还有大量"看不见的东西"在拉着星星。这些"看不见的东西"叫暗物质。但它到底是什么？粒子？黑洞？没人知道。',
    formal='识别宇宙中暗物质的具体粒子（候选者：WIMP, axion, sterile neutrino 等），并直接探测。',
    whyHard='不参与电磁相互作用；目前只在引力效应中"看见"它。',
    aiPrompt='介绍主要暗物质候选粒子和探测方法。',
    tags=['天体物理', '粒子物理', '探测'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Dark Matter', videoChannel='Veritasium',
    participate=part(('experiment','参与 XENON/LZ/PandaX 数据分析'),
                  ('code','模拟暗物质晕'),
                  ('survey','读粒子物理标准模型'),
                  ('kid-project','做星系旋转曲线的小演示'),
                  ('fund','给 XENONnT 之类的实验捐资'))
)

add(
    id='dark-energy', category='physics',
    title='暗能量本质', titleEn='Nature of Dark Energy',
    year=1998, proposer='Saul Perlmutter et al.', difficulty=5, reward=0, status='open',
    summary='为什么宇宙在加速膨胀？',
    kid='宇宙就像一块面包，膨胀就是面包在变大。科学家本以为膨胀会变慢。结果发现：膨胀在变快！是什么在推？不知道。科学家给这种神秘力量起了个名字叫"暗能量"。',
    formal='解释宇宙学常数或动态标量场造成观测到的加速膨胀。',
    whyHard='量子场论预测的真空能量比观测大 120 个数量级。',
    aiPrompt='介绍暗能量与宇宙学常数问题。',
    tags=['天体物理', '宇宙学', '加速'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Dark Energy', videoChannel='Veritasium',
    participate=part(('experiment','参与 DESI、Euclid 巡天'),
                  ('code','拟合 ΛCDM 模型'),
                  ('survey','读 Weinberg 1989 综述'),
                  ('essay','写暗能量发现史'))
)

add(
    id='turbulence', category='physics',
    title='湍流', titleEn='Turbulence',
    year=1883, proposer='O. Reynolds', difficulty=5, reward=0, status='open',
    summary='流体为什么突然变混乱？',
    kid='你打开水龙头时，水流很平稳（层流）。开大一点，水流就乱成一片（湍流）。为什么？中间发生了什么？物理学家们吵了 100 多年，连个完整定义都给不出。',
    formal='建立严格的纳维-斯托克斯湍流理论，或给出统计描述的数学框架。',
    whyHard='Navier-Stokes 解的"奇点"和"相干结构"问题。',
    aiPrompt='介绍 Reynolds 数和湍流的尺度级联。',
    tags=['流体力学', '混沌', 'Navier-Stokes'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Turbulence', videoChannel='Veritasium',
    participate=part(('code','用 Lattice Boltzmann 模拟'),
                  ('experiment','用 PIV 测量水槽湍流'),
                  ('essay','写 Kolmogorov 故事'),
                  ('kid-project','中学生玩染色水流实验'))
)

add(
    id='matter-antimatter', category='physics',
    title='物质-反物质不对称', titleEn='Baryon Asymmetry',
    year=1967, proposer='A. Sakharov', difficulty=5, reward=0, status='open',
    summary='为什么宇宙物质比反物质多？',
    kid='电影里你见过反物质飞船和物质飞船撞一下就全没了吧？宇宙诞生时本应物质和反物质一样多，但不知什么原因，物质多出来一点点，于是构成了我们看到的一切。这个"多出的一点点"是怎么来的？',
    formal='Sakharov 三个条件：重子数破坏、C/CP 破坏、宇宙偏离热平衡——已在多大程度上被验证？',
    whyHard='标准模型 CP 破坏不足以解释，需要新物理。',
    aiPrompt='介绍 Sakharov 条件。',
    tags=['宇宙学', '粒子物理', '对称'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Baryon Asymmetry', videoChannel='Kurzgesagt',
    participate=part(('experiment','参与 Belle II、ATLAS 数据分析'),
                  ('code','跑 B 介子衰变模拟'),
                  ('survey','读 Sakharov 1967 论文'),
                  ('essay','写大爆炸对称破缺的故事'))
)

add(
    id='high-tc-superconductor', category='physics',
    title='高温超导机理', titleEn='High-Tc Superconductivity Mechanism',
    year=1986, proposer='J. G. Bednorz / K. A. Müller (discovery)', difficulty=5, reward=0, status='partially_solved',
    summary='为什么铜氧化物在 -135°C 也能超导？',
    kid='电线通电时会发热，浪费能量。超导体可以让电通过完全没阻力，但通常需要冷到 -200°C 以下。1986年发现的新材料在"温暖"得多（-100°C）时也能超导。但物理学家们至今没完全搞懂原理。',
    formal='对铜氧化物的 d 波超导给出严格的微观机制描述。',
    whyHard='电子关联效应让单粒子图像失效。',
    aiPrompt='介绍 Hubbard 模型和 RVB 理论。',
    tags=['凝聚态', '超导', '关联'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='High-Tc Superconductor', videoChannel='Kurzgesagt',
    participate=part(('code','用 DMRG 模拟 Hubbard 模型'),
                  ('experiment','测 ARPES 数据'),
                  ('survey','读 Anderson 1987 论文'),
                  ('essay','介绍 BCS vs RVB'))
)

add(
    id='room-temp-superconductor', category='physics',
    title='室温超导', titleEn='Room-Temperature Superconductor',
    year=2020, proposer='—', difficulty=5, reward=0, status='open',
    summary='能在 0°C 以上工作的超导体存在吗？',
    kid='如果能造出"不冷也能超导"的材料，电网就不会再浪费电，磁悬浮列车会变便宜，量子计算机会更强大。LK-99 这样的发现引发过一阵热潮，但目前仍未复现。',
    formal='找到 Tc ≥ 273K 的材料并在常压下可重复合成。',
    whyHard='凝聚态物理的核心挑战。',
    aiPrompt='介绍 LK-99 风波和高温超导现状。',
    tags=['凝聚态', '超导', '材料'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Room Temp Superconductor', videoChannel='Veritasium',
    participate=part(('experiment','尝试合成新材料'),
                  ('code','用 DFT 模拟晶体结构'),
                  ('survey','读相关综述'),
                  ('fund','给高温超导研究捐资'))
)

add(
    id='proton-decay', category='physics',
    title='质子衰变', titleEn='Proton Decay',
    year=1973, proposer='大统一理论', difficulty=5, reward=0, status='open',
    summary='质子会不会衰变？寿命多长？',
    kid='你身体里的每个质子已经存在了 138 亿年。会不会有一天它们突然变成别的粒子？大统一理论说会，而且给出了寿命。但实验迄今没看到。',
    formal='用 Super-Kamiokande 等探测器观测 proton → e⁺ + π⁰，给出寿命下限。',
    whyHard='大统一理论预测 τ > 10³⁴ 年，实验需要几千吨水几年才能验证。',
    aiPrompt='介绍 SU(5) GUT 和超对称理论。',
    tags=['粒子物理', '大统一', '实验'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Proton Decay', videoChannel='Kurzgesagt',
    participate=part(('experiment','分析 Hyper-Kamiokande 数据'),
                  ('code','模拟探测器响应'),
                  ('survey','读大统一入门'),
                  ('essay','写 Super-K 故事'))
)

# --- 新增物理 (15+ 个) ---
add(
    id='hierarchy-problem', category='physics',
    title='等级问题', titleEn='Hierarchy Problem',
    year=1970, proposer='E. Gildener / S. Weinberg', difficulty=5, reward=0, status='open',
    summary='为什么 Higgs 质量比普朗克质量小 16 个数量级？',
    kid='物理常数通常差 2-3 倍，但 Higgs 玻色子的质量 125 GeV 比普朗克质量 10¹⁹ GeV 小 16 个数量级。为什么？我们以为一定有新的对称性（超对称等）让这个差距"自然"。',
    formal='在 SM + 最小超对称 (MSSM) 或 composite Higgs 等 BSM 框架下，计算 Higgs 质量参数μ²(m_Z) 的辐射修正对截止标度 Λ 的依赖；要求在无需极端精细调节 (fine-tuning < 1%) 的前提下解释 m_h = 125.1 GeV 与 m_Pl/M_EW ≈ 10^17 的 17 个数量级差距。',
    whyHard='需要超对称、复合 Higgs 或其他新物理。',
    aiPrompt='解释"自然性"概念和超对称。',
    tags=['粒子物理', 'Higgs', '自然性'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Hierarchy Problem', videoChannel='Kurzgesagt',
    participate=part(('solve','构造新物理模型'),
                  ('experiment','分析 LHC 数据'),
                  ('essay','介绍 SUSY 历史'))
)

add(
    id='strong-cp', category='physics',
    title='强 CP 问题', titleEn='Strong CP Problem',
    year=1975, proposer="G. 't Hooft", difficulty=5, reward=0, status='open',
    summary='为什么 QCD 中 CP 破坏项接近 0？',
    kid='量子色动力学（QCD）描述夸克之间的强相互作用。它可以有一个"theta 项"破坏 CP 对称性。但实验测到的中子电偶极矩非常小，说明 theta 接近 0。为什么？',
    formal='为什么 QCD 的 θ 角如此接近 0？',
    whyHard='最经济的解释是 Peccei-Quinn 对称性 + axion，但 axion 还未被直接探测到。',
    aiPrompt='介绍 axion 假设。',
    tags=['粒子物理', '对称', 'axion'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Strong CP', videoChannel='Kurzgesagt',
    participate=part(('experiment','参与 ADMX 暗物质 axion 实验'),
                  ('essay','介绍 axion 物理'))
)

add(
    id='measurement-problem', category='physics',
    title='量子测量问题', titleEn='Quantum Measurement Problem',
    year=1926, proposer='E. Schrödinger / W. Heisenberg', difficulty=5, reward=0, status='open',
    summary='为什么"测量"会让量子态从叠加变成确定？',
    kid='电子在没人看的时候，是"既是这里又是那里"（叠加态）。但有人看的时候，它就"只在这里"。这中间的转变是怎么发生的？',
    formal='给出"波函数坍缩"的物理解释（哥本哈根/多世界/GRW/pilot wave）并验证。',
    whyHard='是物理学和哲学的交叉点。',
    aiPrompt='介绍哥本哈根/多世界/GRW/pilot wave 四大解释。',
    tags=['量子力学', '哲学', '诠释'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Measurement Problem', videoChannel='Veritasium',
    participate=part(('essay','写四大解释对比'),
                  ('discuss','在物理哲学论坛参与讨论'),
                  ('teach','给高中生讲什么是"测量"'))
)

add(
    id='cosmological-constant', category='physics',
    title='宇宙学常数问题', titleEn='Cosmological Constant Problem',
    year=1989, proposer='S. Weinberg', difficulty=5, reward=0, status='open',
    summary='为什么真空能量比观测值小 120 个数量级？',
    kid='量子场论说"空"的空间也有能量（真空能）。但观测到的暗能量又很小（10⁻⁴⁷ GeV⁴）。这比量子场论的预测小了 120 个数量级。人类历史上最大的理论与实验不符。',
    formal='为什么观测的宇宙学常数 Λ 远小于理论值？',
    whyHard='需要"宇宙学监督"机制，目前没有公认解决方案。',
    aiPrompt='介绍"最差预测"。',
    tags=['宇宙学', '真空', '常数'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Cosmological Constant', videoChannel='Quanta',
    participate=part(('essay','写这个 120 个数量级的故事'),
                  ('discuss','在宇宙学论坛提问'),
                  ('survey','读 Weinberg 综述'))
)

add(
    id='arrow-of-time', category='physics',
    title='时间之箭', titleEn='Arrow of Time',
    year=1927, proposer='A. Eddington', difficulty=5, reward=0, status='open',
    summary='为什么时间只往一个方向流？',
    kid='物理定律（除热力学第二定律外）都是时间可逆的。但我们感受到的时间是单向的：人会变老、咖啡会冷、电影只能往前放。这个方向从哪来？',
    formal='在不引入边界条件的前提下，从 T-对称的微观定律 (CPT) 推导出 T-不对称的宏观热力学第二定律；给出熵增 S(t) 满足 dS/dt ≥ 0 的初始条件在宇宙学暴胀时期的可计算机制（CMB 谱 + 重子不对称）。',
    whyHard='与宇宙学、量子力学、意识都相关。',
    aiPrompt='介绍热力学/宇宙学/心理学三大时间箭头。',
    tags=['哲学', '宇宙学', '时间'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Arrow of Time', videoChannel='Veritasium',
    participate=part(('essay','介绍三大箭头'),
                  ('discuss','参与时间哲学讨论'),
                  ('teach','给大学生讲这个'))
)

add(
    id='vacuum-decay', category='physics',
    title='真空衰变', titleEn='Vacuum Decay',
    year=1976, proposer='M. Stone / S. Coleman', difficulty=5, reward=0, status='open',
    summary='我们的真空会不会衰变到更低的真空中？',
    kid='想象空间里有一个"泡泡"，里面的"真空"比外面低能量。泡泡会扩张，把所有空间变成新真空。我们目前的"假真空"会不会自发地变成"真真空"？如果是，一切就没了。',
    formal='在 SM 有效势 V_eff(φ, T) 框架下，计算假真空寿命 τ 与 Higgs 质量 m_h、顶夸克质量 m_t 的依赖关系；要求 τ > 10^10 年（> 当前宇宙年龄）且与 LHC m_h 测量值一致；预测可由高精度 m_h 测量（误差 < 0.1 GeV）检验。',
    whyHard='需要精确的高能物理。',
    aiPrompt='介绍 Coleman-de Luccia 泡泡。',
    tags=['宇宙学', '高能', '灾难'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Vacuum Decay', videoChannel='Kurzgesagt',
    participate=part(('essay','写这个恐怖的可能性'),
                  ('discuss','在物理论坛提问'),
                  ('survey','读 Coleman 论文'))
)

add(
    id='emergent-spacetime', category='physics',
    title='时空涌现', titleEn='Emergent Spacetime',
    year=1995, proposer='T. Jacobson / E. Verlinde', difficulty=5, reward=0, status='open',
    summary='时空是否从更基本的量子信息中涌现？',
    kid='广义相对论说时空是弯曲的。但弯曲从哪里来？一种观点是：时空是从量子纠缠产生的"图案"——像水中的漩涡从水流中浮现。',
    formal='构造一个清晰的"时空从量子涌现"的数学框架。',
    whyHard='处于引力/量子信息/凝聚态的交叉点。',
    aiPrompt='介绍 ER=EPR、Maldacena-Susskind 思想。',
    tags=['量子引力', '涌现', '信息'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Emergent Spacetime', videoChannel='Quanta',
    participate=part(('survey','读 Verlinde 论文'),
                  ('essay','介绍 ER=EPR'),
                  ('discuss','参与这个跨领域讨论'))
)

add(
    id='neutrino-mass', category='physics',
    title='中微子质量起源', titleEn='Origin of Neutrino Mass',
    year=1998, proposer='梶田隆章 (discovery)', difficulty=4, reward=0, status='open',
    summary='为什么中微子这么轻（比电子还轻 50 万倍）？',
    kid='中微子几乎不跟任何东西作用，但它们确实有微小质量（1998 年梶田隆章发现）。比电子轻 50 万倍。为什么这么轻？可能它们是"自己的反粒子"（Majorana），或者来自高维空间。',
    formal='解释中微子的微小质量（见跷跷板机制/seesaw）。',
    whyHard='需要超出标准模型的新物理。',
    aiPrompt='介绍 seesaw 机制和 Majorana 中微子。',
    tags=['粒子物理', '中微子', '标准模型'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Neutrino Mass', videoChannel='Kurzgesagt',
    participate=part(('experiment','参与 CUORE、GERDA 数据分析'),
                  ('essay','介绍梶田发现'),
                  ('code','模拟中微子振荡'))
)

add(
    id='dark-photon', category='physics',
    title='暗光子', titleEn='Dark Photon',
    year=1985, proposer='B. Holdom', difficulty=4, reward=0, status='open',
    summary='是否有一种"看不见的光"？',
    kid='光子是传递电磁力的"信使"。可能还有一种和普通光子相似的"暗光子"，只在暗物质之间传递力。如果存在，可能解释暗物质和 μ 介子 g-2 异常。',
    formal="在 1 MeV < m_{A'} < 100 GeV、10^{-12} < ε < 10^{-2}（与光子混合参数）参数空间内，通过固定靶实验 (LSND/NA64)、对撞机 (BaBar/Belle II) 或天体物理观测给出 95% CL 排除或发现。",
    whyHard='和普通物质作用极弱，需要高灵敏度实验。',
    aiPrompt='介绍暗光子搜索实验。',
    tags=['粒子物理', '暗物质', '新粒子'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Dark Photon', videoChannel='Quanta',
    participate=part(('experiment','分析 LHCb/NA64 数据'),
                  ('essay','介绍"力的暗扇区"概念'))
)

add(
    id='proton-spin', category='physics',
    title='质子自旋危机', titleEn='Proton Spin Crisis',
    year=1987, proposer='EMC experiment', difficulty=4, reward=0, status='open',
    summary='质子的自旋从哪来？夸克贡献怎么这么少？',
    kid='质子有"自旋"（像陀螺一样转）。物理学家以为自旋来自它的 3 个价夸克。但实验发现 3 个夸克只贡献 ~30% 的自旋！剩下 70% 从哪来？可能是胶子、海夸克、或轨道角动量。',
    formal='完整分解质子自旋到夸克/胶子/轨道角动量。',
    whyHard='涉及非微扰 QCD。',
    aiPrompt='介绍 EMC 效应和 EIC 实验。',
    tags=['粒子物理', 'QCD', '自旋'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Proton Spin', videoChannel='Quanta',
    participate=part(('experiment','参与 EIC 模拟'),
                  ('code','格点 QCD 计算'),
                  ('essay','介绍"自旋危机"'))
)

add(
    id='landau-pole', category='physics',
    title='Landau 极点问题', titleEn='Landau Pole Problem',
    year=1955, proposer='L. D. Landau', difficulty=4, reward=0, status='open',
    summary='量子电动力学 QED 是否在某个高能标自洽？',
    kid='QED（描述电子和光子相互作用的理论）的耦合常数随能量增加而增加，到一个"Landau 极点"就变无穷大。意味着 QED 是个"有效场论"，必须在某个能量变成新理论。',
    formal='判断 QED 是否在大统一能标下保持自洽。',
    whyHard='需要超越标准模型。',
    aiPrompt='介绍跑动耦合常数。',
    tags=['粒子物理', 'QED', '紫外'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Landau Pole', videoChannel='Kurzgesagt',
    participate=part(('essay','介绍有效场论'),
                  ('survey','读相关综述'))
)

add(
    id='cmb-anomalies', category='physics',
    title='CMB 反常', titleEn='CMB Anomalies',
    year=2001, proposer='WMAP/Planck', difficulty=4, reward=0, status='open',
    summary='宇宙微波背景辐射中的"冷斑"和半球不对称',
    kid='宇宙大爆炸的"余晖"——CMB——非常均匀，但有几个"小毛病"：有个非常大的"冷斑"，南北半球有轻微的不对称。是统计涨落还是新物理？',
    formal='解释或排除 CMB 温度各向异性的低多极反常。',
    whyHard='可能是统计巧合，也可能是早期宇宙新物理。',
    aiPrompt='介绍主要 CMB 反常。',
    tags=['宇宙学', 'CMB', '新物理'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='CMB Anomalies', videoChannel='Quanta',
    participate=part(('analyze','分析 Planck 数据'),
                  ('essay','介绍冷斑假说'))
)

add(
    id='b-mode', category='physics',
    title='原初引力波', titleEn='Primordial Gravitational Waves',
    year=2014, proposer='BICEP2 (claim)', difficulty=4, reward=0, status='open',
    summary='宇宙暴涨期产生的引力波能被探测到吗？',
    kid='宇宙在诞生后 10⁻³⁶ 秒经历了一次"暴涨"——体积膨胀 10²⁶ 倍。这个过程会产生"原初引力波"——时空的涟漪。2014 年 BICEP2 团队宣布看到了 B 模式极化（引力波信号），后来被证明是银河系尘埃。',
    formal='通过 CMB B 模式极化直接探测原初引力波。',
    whyHard='信号比 CMB 极化本身小几个数量级，且易被尘埃污染。',
    aiPrompt='介绍 CMB 极化和 BICEP2 故事。',
    tags=['宇宙学', '暴涨', 'CMB'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Primordial Gravitational Waves', videoChannel='Kurzgesagt',
    participate=part(('experiment','参与 Simons Observatory'),
                  ('essay','介绍 BICEP2 风波'))
)

add(
    id='holographic', category='physics',
    title='全息原理', titleEn='Holographic Principle',
    year=1993, proposer="G. 't Hooft / L. Susskind", difficulty=5, reward=0, status='partially_solved',
    summary='三维世界的信息能否"装进"二维表面？',
    kid='黑洞的熵和它的表面积成正比，不是体积。这意味着一个三维区域的信息量等于其二维边界的信息量——像是"全息图"。AdS/CFT 对应把这点变成严格数学。',
    formal='对任意渐近平坦 (A)dS 时空 M，给出满足 AdS/CFT 对偶关系的 bulk-to-boundary 映射 H: Bulk(M) → CFT(∂M)；要求 bulk 局域算符 O(x) 对应 CFT 边界算主的 O(ξ)，且配分函数 Z_bulk[M] = Z_CFT[φ_0] 在所有拓扑荷下精确成立。',
    whyHard='主要在 AdS 空间成立，对我们宇宙（dS）还未严格建立。',
    aiPrompt='介绍 AdS/CFT。',
    tags=['量子引力', '全息', '弦论'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Holographic Principle', videoChannel='Kurzgesagt',
    participate=part(('survey','读 Maldacena 论文'),
                  ('essay','介绍全息原理'))
)

add(
    id='baryogenesis', category='physics',
    title='重子生成', titleEn='Baryogenesis Mechanisms',
    year=1967, proposer='A. Sakharov', difficulty=5, reward=0, status='open',
    summary='如何在宇宙早期产生物质-反物质不对称？',
    kid='Sakharov 提了 3 个条件，但具体怎么发生？候选机制：电弱重子生成（标准模型内）、GUT 重子生成、轻子生成（leptogenesis）。哪个对？',
    formal='构造一个具体的重子生成机制并给出可检验预言。',
    whyHard='需要新物理。',
    aiPrompt='介绍 leptogenesis、electroweak baryogenesis 等。',
    tags=['宇宙学', '粒子物理', '对称破缺'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Baryogenesis', videoChannel='Kurzgesagt',
    participate=part(('essay','介绍主要机制'),
                  ('survey','读相关综述'))
)

# ============= 化学 (Chemistry) =============
add(
    id='nitrogen-fixation', category='chemistry',
    title='常温常压固氮', titleEn='Nitrogen Fixation at Ambient Conditions',
    year=1909, proposer='F. Haber / C. Bosch', difficulty=4, reward=2500, status='open',
    summary='像豆科植物一样，在常温常压下把氮气变成氨',
    kid='空气中大部分是氮气，但植物和动物都不能直接用。工业上用 Haber-Bosch 法把氮气变成氨（化肥原料），要 400°C 高温、200 倍大气压，每年烧掉 1-2% 的全球能源。豆科植物靠根瘤菌常温常压搞定。我们能不能学会？',
    formal='开发铁基或钼基单原子/团簇催化剂，在 T ≤ 100°C、P ≤ 10 atm 下实现 N₂ + 3H₂ → 2NH₃ 的 转化率 ≥ 20%（相对 N₂）、TOF ≥ 1 s⁻¹、稳定性 ≥ 1000 小时（无明显失活），并通过 XRD/XPS/operando XAS 表征活性位结构。',
    whyHard='N≡N 三键极强（945 kJ/mol），需打破再重组。',
    aiPrompt='介绍 Haber-Bosch、铁/钌催化剂、固氮酶。',
    tags=['催化', '能源', '化肥'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Nitrogen Fixation', videoChannel='Kurzgesagt',
    participate=part(('experiment','设计新型催化剂'),
                  ('code','用 DFT 模拟 N₂ 活化'),
                  ('essay','介绍根瘤菌共生'),
                  ('kid-project','种豆子观察根瘤'))
)

add(
    id='carbon-capture', category='chemistry',
    title='低成本碳捕集', titleEn='Low-Cost Carbon Capture',
    year=2005, proposer='—', difficulty=4, reward=3000, status='open',
    summary='从空气或烟囱中便宜地抓取 CO₂',
    kid='人类每年往大气里排 400 亿吨 CO₂。能不能在排放点和大气中都把它们抓回来？目前的办法要花很多钱（每吨 100-1000 美元），我们需要便宜 10-100 倍的办法。',
    formal='开发 MOF/胺基/膜分离 CO₂ 捕集工艺：捕集成本 ≤ 50 美元/吨 CO₂、能耗 ≤ 2 GJ/吨 CO₂、捕集率 ≥ 90%（烟气 4-15% CO₂）、循环稳定性 ≥ 5000 次吸附-脱附，并由 LCA 评估全生命周期 GHG 减排 ≥ 80%。',
    whyHard='CO₂ 在空气中浓度仅 420 ppm，分离能耗高。',
    aiPrompt='介绍 amine 溶液、MOF、CAOX、Climeworks。',
    tags=['气候', '材料', '能源'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Carbon Capture', videoChannel='Kurzgesagt',
    participate=part(('experiment','设计新型吸附剂'),
                  ('prototype','搭建小型 DAC 装置'),
                  ('essay','介绍主要技术路线'))
)

add(
    id='protein-design', category='chemistry',
    title='从头设计蛋白质', titleEn='De Novo Protein Design',
    year=2003, proposer='—', difficulty=4, reward=2000, status='partially_solved',
    summary='从零开始设计具有特定功能的新蛋白质',
    kid='蛋白质是身体里的"小机器"，每种蛋白质有不同形状做不同事（比如消化食物、对抗病毒）。能不能让电脑帮我们设计"全新"的蛋白质，做我们想要的事？AlphaFold 和 David Baker 的工作让这变可能了，但还有很长的路。',
    formal='对任意目标 3D 几何 + 化学功能 (结合/催化)，用 RFdiffusion/ProteinMPNN 类方法从头设计蛋白，满足：(a) 目标均方根偏差 (RMSD) ≤ 1.5 Å，(b) 实验表达量 ≥ 10 mg/L 且可溶，(c) 目标功能活性 ≥ 已知最佳天然蛋白 50% 水平，(d) 热熔 T_m ≥ 50°C。',
    whyHard='蛋白质设计空间巨大，序列-结构-功能关系复杂。',
    aiPrompt='介绍 David Baker、RFdiffusion、ProteinMPNN。',
    tags=['生物', 'AI', '药物'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Protein Design', videoChannel='Quanta',
    participate=part(('code','跑 RFdiffusion 设计小蛋白'),
                  ('experiment','在大肠杆菌中表达'),
                  ('essay','介绍 Baker 实验室'))
)

add(
    id='plastic-degradation', category='chemistry',
    title='塑料生物降解', titleEn='Plastic Biodegradation',
    year=2016, proposer='Ideonella sakaiensis', difficulty=3, reward=1500, status='open',
    summary='细菌/酶能在几个月内把塑料变回单体',
    kid='塑料污染地球几百年。日本 2016 年发现一种细菌 Ideonella sakaiensis，能用 PETase 酶在 6 周内把 PET 塑料"吃掉"。能不能把这种酶工程化到工业规模？',
    formal='设计工程菌在 < 24 小时、< 50°C 下将 PET 完全降解为单体。',
    whyHard='酶活性和稳定性需要工程化改造。',
    aiPrompt='介绍 PETase/MHETase、Carbios。',
    tags=['环境', '酶', '循环'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Plastic Eating Bacteria', videoChannel='Kurzgesagt',
    participate=part(('experiment','改造 PETase'),
                  ('code','用 AlphaFold 预测新结构'),
                  ('kid-project','观察塑料在土里降解'))
)

add(
    id='water-splitting', category='chemistry',
    title='水分解催化剂', titleEn='Efficient Water Splitting Catalysts',
    year=1970, proposer='—', difficulty=4, reward=2000, status='open',
    summary='用便宜催化剂高效分解水产生氢气',
    kid='把水变成氢气（H₂）和氧气（O₂）是清洁能源的关键。但目前最好的催化剂是铂等贵金属。能不能用镍、铁、钴等便宜金属做到同样高效？',
    formal='开发 OER/HER 电催化剂：10 mA/cm² 下过电位 ≤ 100 mV、Tafel 斜率 ≤ 30 mV/dec、1000 小时恒电流稳定性测试后活性衰减 < 10%，且仅使用丰产元素（Fe/Co/Ni/Mn 基）。',
    whyHard='反应涉及 4 电子转移，动力学慢。',
    aiPrompt='介绍 OER/HER 催化剂、单原子催化。',
    tags=['催化', '能源', '氢'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Water Splitting', videoChannel='Kurzgesagt',
    participate=part(('experiment','合成单原子催化剂'),
                  ('code','DFT 模拟反应路径'),
                  ('essay','介绍绿氢路线'))
)

# --- 新增化学 (20 个) ---
add(
    id='co2-to-fuel', category='chemistry',
    title='CO₂ 变燃料', titleEn='CO₂ to Fuel Conversion',
    year=2010, proposer='—', difficulty=4, reward=2500, status='open',
    summary='把 CO₂ 直接变成甲醇、乙醇或液态烃',
    kid='如果能把空气中的 CO₂ 直接变成汽油、酒精或航空燃料，碳循环就闭合了。目前电催化/光催化能转，但效率低、不稳定。',
    formal='开发电催化 CO₂ 还原 (CO₂RR) 催化剂：法拉第效率 ≥ 50%（对单一产物 CO/CH₃OH/C₂H₄ 等）、电流密度 ≥ 200 mA/cm²、稳定性 ≥ 1000 小时、产物选择性 ≥ 90%，且反应在常温常压水溶液中进行。',
    whyHard='CO₂ 稳定，C=O 难打破；多产物选择性难。',
    aiPrompt='介绍 Cu 催化剂、CO₂RR。',
    tags=['催化', '能源', '循环'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='CO2 to Fuel', videoChannel='Kurzgesagt',
    participate=part(('experiment','尝试新型催化剂'),
                  ('code','DFT 模拟 CO₂RR 路径'),
                  ('essay','介绍主要进展'))
)

add(
    id='perovskite-solar', category='chemistry',
    title='钙钛矿太阳能电池稳定性', titleEn='Perovskite Solar Cell Stability',
    year=2009, proposer='M. Miyasaka', difficulty=4, reward=2000, status='open',
    summary='把钙钛矿电池的寿命做到 25 年以上',
    kid='钙钛矿太阳能电池效率已达 26%（比硅还高），但很容易在湿、热、光下分解。需要包封或工程化让它稳定 25 年。',
    formal='钙钛矿组件在 1 sun 连续照射下保持 25 年 < 10% 效率衰减。',
    whyHard='离子迁移和分解机制。',
    aiPrompt='介绍钙钛矿太阳能电池。',
    tags=['能源', '材料', '光伏'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Perovskite Solar', videoChannel='Kurzgesagt',
    participate=part(('experiment','尝试新型钙钛矿组分'),
                  ('code','DFT 模拟降解'),
                  ('essay','介绍光伏历史'))
)

add(
    id='li-air-battery', category='chemistry',
    title='锂空气电池', titleEn='Li-Air Battery',
    year=1996, proposer='K. Abraham', difficulty=5, reward=3000, status='open',
    summary='理论能量密度接近汽油的电池',
    kid='锂空气电池用空气中的氧做正极，理论能量密度 ~3500 Wh/kg（接近汽油 13000 Wh/kg）。如果实现，电动车续航能和燃油车比。问题：副反应多、效率低、电极易堵。',
    formal='实现 Li-O₂/Li-air 电池：实际能量密度 ≥ 1000 Wh/kg、循环寿命 ≥ 500 次（容量保持率 ≥ 80%）、往返效率 ≥ 80%，且阴极放电产物 Li₂O₂ 可逆生成（XRD/XPS 表征验证）。',
    whyHard='氧还原反应复杂，过氧化锂堵塞电极。',
    aiPrompt='介绍 Li-air 原理和挑战。',
    tags=['电池', '能源', '材料'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Li-Air Battery', videoChannel='Kurzgesagt',
    participate=part(('experiment','新型正极催化剂'),
                  ('code','模拟 OER/ORR 路径'),
                  ('essay','介绍锂电池发展'))
)

add(
    id='enzyme-design', category='chemistry',
    title='从头设计酶', titleEn='De Novo Enzyme Design',
    year=2008, proposer='D. Baker', difficulty=5, reward=3000, status='partially_solved',
    summary='设计自然界不存在的全新酶',
    kid='酶是生物体内的"纳米机器"，能精确催化反应。如果我们能从零设计新酶——比如把工业上需要的高温高压反应变成室温水中的反应——化学工业将被改变。',
    formal='对任意未在自然界存在的化学反应，设计酶（含定向进化）实现催化速率提升 k_cat/k_uncat ≥ 10³、K_M ≤ 1 mM、立体选择性 ≥ 99% ee，并通过晶体结构 (RMSD < 1 Å) 验证活性位几何。',
    whyHard='反应过渡态几何与活性位点的精确匹配。',
    aiPrompt='介绍从头酶设计流程。',
    tags=['生物', 'AI', '催化'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Enzyme Design', videoChannel='Quanta',
    participate=part(('code','用 RFdiffusion 设计酶骨架'),
                  ('experiment','在酵母中表达并测活'),
                  ('essay','介绍 David Baker 实验室'))
)

add(
    id='self-healing', category='chemistry',
    title='自修复材料', titleEn='Self-Healing Materials',
    year=2001, proposer='S. R. White et al.', difficulty=3, reward=1500, status='open',
    summary='像生物组织一样能自我修复的材料',
    kid='手机屏幕裂了没法自己长好。能设计出被切开后自动愈合的材料吗？像人体皮肤一样，受损后能自我修复。',
    formal='设计 > 5 次自修复循环、修复效率 > 90% 的工程材料。',
    whyHard='化学键的可逆性 vs 强度。',
    aiPrompt='介绍微胶囊、DA 反应、金属配位。',
    tags=['材料', '聚合物', '工程'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Self Healing Materials', videoChannel='Kurzgesagt',
    participate=part(('experiment','合成 Diels-Alder 聚合物'),
                  ('essay','介绍生物启发材料'),
                  ('kid-project','做明胶自愈实验'))
)

add(
    id='universal-antidote', category='chemistry',
    title='通用解毒剂', titleEn='Universal Antidote',
    year=2020, proposer='—', difficulty=5, reward=0, status='open',
    summary='一种能对付所有生物毒素/化学毒剂的解毒剂',
    kid='蛇咬、被毒气攻击、误食毒蘑菇——很多不同的毒需要不同的解药。能不能造一种"通用解毒剂"，把毒分子"吸住"排出体外？',
    formal='对所有标定毒素类（神经毒剂、重金属、生物碱等）都有效的体内解毒剂。',
    whyHard='毒素的化学结构差异大。',
    aiPrompt='介绍环糊精、卟啉、MOF 在解毒中的应用。',
    tags=['生物', '药物', '安全'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Universal Antidote', videoChannel='Kurzgesagt',
    participate=part(('experiment','设计 MOF 吸附剂'),
                  ('essay','介绍解毒剂历史'))
)

add(
    id='anti-aging-mol', category='chemistry',
    title='抗衰老分子', titleEn='Anti-Aging Molecules',
    year=2010, proposer='—', difficulty=4, reward=5000, status='open',
    summary='能找到延缓衰老的小分子吗？',
    kid='雷帕霉素、二甲双胍、NAD+ 补充剂在动物身上能延长寿命 10-20%。但人体证据有限。能找到一种安全、明确能延寿 5 年的分子吗？',
    formal='通过 FDA 三期临床的延寿/抗衰药物。',
    whyHard='衰老通路众多，需要组合治疗。',
    aiPrompt='介绍衰老标志（Hallmarks of Aging）。',
    tags=['生物', '药物', '健康'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Anti Aging', videoChannel='Kurzgesagt',
    participate=part(('experiment','动物试验'),
                  ('essay','介绍 mTOR 通路'))
)

add(
    id='drug-delivery', category='chemistry',
    title='精准药物递送', titleEn='Targeted Drug Delivery',
    year=1970, proposer='P. Ehrlich (magic bullet)', difficulty=4, reward=0, status='open',
    summary='让药物只去该去的地方',
    kid='化疗会杀死所有快速分裂的细胞——包括健康的。能造一种"魔法子弹"，让药物只攻击肿瘤？',
    formal='对任何指定器官/细胞类型，选择性 > 100:1 的药物递送系统。',
    whyHard='生理屏障（血脑屏障、肿瘤微环境）。',
    aiPrompt='介绍抗体偶联药物(ADC)、纳米载体、外泌体。',
    tags=['药物', '纳米', '精准医疗'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Drug Delivery', videoChannel='Kurzgesagt',
    participate=part(('experiment','设计脂质纳米颗粒'),
                  ('essay','介绍 ADC 药物历史'))
)

add(
    id='cnt-bulk', category='chemistry',
    title='碳纳米管批量生产', titleEn='CNT Bulk Production',
    year=1991, proposer='S. Iijima (discovery)', difficulty=3, reward=1000, status='open',
    summary='廉价地大量生产高纯度碳纳米管',
    kid='碳纳米管是神奇材料：超轻、超强、导电导热都好。但目前价格贵、纯度低、长度不均。需要工业级批量生产工艺。',
    formal='工业级碳纳米管生产：纯度 ≥ 99.9%、缺陷率 ≤ 5%、直径分布 σ_d/μ_d ≤ 10%、生产成本 ≤ 100 美元/公斤、年产能 ≥ 100 吨，且具备 G/D 比 ≥ 100 的石墨化度。',
    whyHard='生长动力学和催化剂控制。',
    aiPrompt='介绍 CVD 法、浮动催化剂法。',
    tags=['纳米', '材料', '工程'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Carbon Nanotube', videoChannel='Kurzgesagt',
    participate=part(('experiment','优化 CVD 参数'),
                  ('code','模拟生长动力学'),
                  ('essay','介绍 CNT 应用'))
)

add(
    id='graphene-app', category='chemistry',
    title='石墨烯实际应用', titleEn='Graphene Applications',
    year=2004, proposer='A. Geim / K. Novoselov (discovery)', difficulty=3, reward=1000, status='open',
    summary='让石墨烯走出实验室',
    kid='石墨烯是单层碳原子，强度是钢的 200 倍，导电性比铜好。但 20 年过去了还没大规模商用——主要是难以廉价、批量、高质量生产。',
    formal='石墨烯薄膜（化学气相沉积法）卷材生产：单层率 ≥ 95%、方块电阻 ≤ 10 Ω/sq、成本 ≤ 100 美元/m²、幅宽 ≥ 1 m、连续生产速率 ≥ 1 m/min 且无明显缺陷（拉曼 I_D/I_G < 0.1）。',
    whyHard='晶界、缺陷控制。',
    aiPrompt='介绍 CVD 石墨烯、液相剥离法。',
    tags=['纳米', '材料', '电子'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Graphene', videoChannel='Kurzgesagt',
    participate=part(('experiment','优化 CVD'),
                  ('essay','介绍石墨烯应用'))
)

add(
    id='mof-discovery', category='chemistry',
    title='MOF 性能突破', titleEn='MOF Performance Breakthrough',
    year=1995, proposer='O. Yaghi', difficulty=3, reward=1500, status='open',
    summary='找到性能更好的金属有机框架（MOF）',
    kid='MOF 是"海绵状"晶体，表面积惊人（1 克有 7000 m²）。可以存氢、捕 CO₂、催化反应。能不能设计 MOF 对特定任务有极致性能？',
    formal='为指定应用（CO₂ 捕集、H₂ 存储、催化）设计 > 工业基准 10x 的 MOF。',
    whyHard='组合空间巨大。',
    aiPrompt='介绍 Yaghi 实验室、MOF 数据库。',
    tags=['材料', '气体', '催化'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='MOF', videoChannel='Kurzgesagt',
    participate=part(('code','用 ML 预测 MOF 性能'),
                  ('experiment','合成目标 MOF'),
                  ('essay','介绍 MOF 应用'))
)

add(
    id='synthetic-bio', category='chemistry',
    title='合成生物学', titleEn='Synthetic Biology',
    year=2000, proposer='—', difficulty=4, reward=0, status='open',
    summary='把微生物改造成"细胞工厂"',
    kid='改造大肠杆菌让它生产胰岛素、青蒿素、可降解塑料等。合成生物学让"设计生命"成为可能——但也带来伦理和安全问题。',
    formal='设计能高效生产任意目标分子的合成代谢通路。',
    whyHard='生物系统调控复杂。',
    aiPrompt='介绍 SynBio、iGEM、青蒿素酵母。',
    tags=['生物', '工程', '伦理'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Synthetic Biology', videoChannel='Kurzgesagt',
    participate=part(('code','用 Cello/RBS 计算器设计'),
                  ('experiment','iGEM 团队项目'),
                  ('essay','介绍青蒿素工程'),
                  ('discuss','参与合成生物学伦理讨论'))
)

add(
    id='artificial-photo', category='chemistry',
    title='人工光合作用', titleEn='Artificial Photosynthesis',
    year=1972, proposer='A. Fujishima / K. Honda', difficulty=4, reward=2000, status='open',
    summary='人造系统像植物一样把阳光 + 水 + CO₂ 变成燃料',
    kid='植物用叶子把阳光、水、CO₂ 变成糖。如果我们能造"人造叶子"——一种能直接做同样事的装置——就能从太阳得到无限清洁燃料。',
    formal='人造光合器件：太阳能到燃料 (STF) 能量转换效率 ≥ 10%、稳定运行 ≥ 1000 小时（无明显降解）、产物 (H₂/CH₃OH 等) 纯度 ≥ 95%，且使用非贵金属催化剂。',
    whyHard='水氧化动力学慢，催化剂易降解。',
    aiPrompt='介绍 Honda-Fujishima 效应。',
    tags=['能源', '催化', '仿生'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Artificial Photosynthesis', videoChannel='Kurzgesagt',
    participate=part(('experiment','优化催化剂'),
                  ('code','DFT 模拟'),
                  ('essay','介绍人工光合发展史'))
)

add(
    id='polymers-recycle', category='chemistry',
    title='化学回收聚合物', titleEn='Chemical Polymer Recycling',
    year=2020, proposer='—', difficulty=3, reward=1500, status='open',
    summary='把塑料分解回单体无限循环',
    kid='目前大多数塑料被"机械回收"（清洗、融化、再成型），多次后质量下降。化学回收把塑料分解回最初的原料——可以无限循环利用。',
    formal='< 100 美元/吨的化学回收工艺且无副产物。',
    whyHard='催化剂选择性、产物纯化。',
    aiPrompt='介绍热解、解聚、酶回收。',
    tags=['环境', '催化', '循环'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Chemical Recycling', videoChannel='Kurzgesagt',
    participate=part(('experiment','新型解聚催化剂'),
                  ('essay','介绍循环经济'))
)

add(
    id='topology-cond-mat', category='chemistry',
    title='拓扑材料', titleEn='Topological Materials',
    year=2005, proposer='C. L. Kane / E. J. Mele (theory)', difficulty=4, reward=0, status='open',
    summary='发现新的拓扑材料（拓扑绝缘体、狄拉克半金属等）',
    kid='有些材料的电子行为和形状有关——比如内部绝缘但表面是超导体。这些"拓扑材料"可能在量子计算、自旋电子学有重要应用。',
    formal='发现新的 3D 拓扑材料或拓扑超导材料。',
    whyHard='材料预测和实验验证。',
    aiPrompt='介绍拓扑绝缘体、QSH 效应。',
    tags=['凝聚态', '材料', '拓扑'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Topological Materials', videoChannel='Quanta',
    participate=part(('code','用 DFT 预测新材料'),
                  ('experiment','ARPES 测量'),
                  ('essay','介绍拓扑绝缘体'))
)

add(
    id='lithium-sulfur', category='chemistry',
    title='锂硫电池', titleEn='Lithium-Sulfur Battery',
    year=1960, proposer='—', difficulty=4, reward=2000, status='open',
    summary='能量密度是锂离子 5 倍的下一代电池',
    kid='锂硫电池理论能量密度 2600 Wh/kg（vs 锂离子的 580 Wh/kg）。硫便宜丰富。但多硫化物"穿梭效应"让电池寿命短。',
    formal='锂硫电池：能量密度 ≥ 500 Wh/kg、循环寿命 ≥ 1000 次（每次循环容量衰减 ≤ 0.05%）、硫正极载量 ≥ 4 mg/cm²、电解液/硫比 < 5 μL/mg，且抑制多硫化物穿梭（自放电率 < 5%/月）。',
    whyHard='多硫化物穿梭、硫体积膨胀。',
    aiPrompt='介绍锂硫电池挑战。',
    tags=['电池', '能源', '材料'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Lithium Sulfur', videoChannel='Kurzgesagt',
    participate=part(('experiment','碳硫复合正极'),
                  ('code','模拟穿梭效应'),
                  ('essay','介绍锂电池未来'))
)

add(
    id='flow-battery', category='chemistry',
    title='液流电池', titleEn='Redox Flow Battery',
    year=1975, proposer='L. H. Thaller', difficulty=3, reward=1500, status='open',
    summary='电网级储能：把能量存在液体里',
    kid='太阳能/风能是间歇的，需要大型储能。液流电池把能量存在两个"液体罐"里，功率和容量可独立扩展。最便宜的是全钒液流电池。',
    formal='< 100 美元/kWh 储能成本、> 20 年寿命。',
    whyHard='电解液浓度与稳定性矛盾。',
    aiPrompt='介绍全钒、Zn-Br、有机液流电池。',
    tags=['能源', '电池', '电网'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Flow Battery', videoChannel='Kurzgesagt',
    participate=part(('experiment','新型电解液'),
                  ('essay','介绍电网储能'))
)

add(
    id='molecular-machine-chem', category='chemistry',
    title='分子机器化学合成', titleEn='Chemical Synthesis of Molecular Machines',
    year=2016, proposer='J. F. Stoddart / B. L. Feringa / J.-P. Sauvage (Nobel)', difficulty=4, reward=2000, status='open',
    summary='化学合成的微型机器',
    kid='如果你能造出和分子一样小的机器人，让它在你血管里跑来跑去治病，会怎样？2016 年三位化学家因"分子机器"获诺贝尔化学奖——但目前还只是开关、轮子等基本元件。',
    formal='化学合成纳米级分子机器：能在溶剂中完成 2 种以上独立任务（运动/运输/催化/逻辑门），工作循环 ≥ 1000 次（无明显疲劳），且可通过 AFM/STM/单分子荧光验证。',
    whyHard='原子级精度控制。',
    aiPrompt='介绍分子开关、轮烷、分子马达。',
    tags=['纳米', '化学', '分子'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Molecular Machines', videoChannel='Kurzgesagt',
    participate=part(('experiment','合成新轮烷'),
                  ('essay','介绍 2016 诺贝尔奖'))
)

add(
    id='green-chem', category='chemistry',
    title='绿色化学 12 原则', titleEn='Green Chemistry 12 Principles',
    year=1998, proposer='P. Anastas / J. Warner', difficulty=3, reward=0, status='open',
    summary='让所有化学反应都符合 12 项绿色原则',
    kid='化学工业生产了 90% 的产品但用掉大量能源、产生大量废物。能不能让所有反应都符合 12 条绿色原则（不产生废物、用可再生原料、低毒等）？',
    formal='让 > 90% 工业反应符合 12 项绿色原则且成本可比。',
    whyHard='经济性 vs 环保。',
    aiPrompt='介绍 12 条原则。',
    tags=['环境', '工业', '可持续'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Green Chemistry', videoChannel='Kurzgesagt',
    participate=part(('essay','介绍 12 原则'),
                  ('experiment','设计原子经济反应'))
)


# ============= 生命科学 (Biology) =============
add(
    id='origin-of-life', category='biology',
    title='生命起源', titleEn='Origin of Life',
    year=1924, proposer='A. Oparin / J. B. S. Haldane', difficulty=5, reward=0, status='open',
    summary='第一个能自我复制的分子是怎么出现的？',
    kid='几十亿年前，地球只是一团岩石和海洋。但不知怎么，里面冒出了能自我复制的小东西——第一个"生命"。这是怎么发生的？科学家们还在争论。',
    formal='在原始地球条件下从无机化学产生能自我复制、可进化、可被选择的分子系统。',
    whyHard='化石记录缺失；多种假说（RNA 世界、代谢优先、硫化物世界等）难以区分。',
    aiPrompt='介绍 RNA 世界假说、LUCA、米勒-尤里实验。',
    tags=['生命', '演化', '化学演化'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Origin of Life', videoChannel='Kurzgesagt',
    participate=part(('experiment','原始汤模拟实验'),
                  ('code','分子动力学模拟'),
                  ('essay','介绍主流假说'),
                  ('discuss','参与生命定义讨论'))
)

add(
    id='aging', category='biology',
    title='衰老机制', titleEn='Mechanism of Aging',
    year=1961, proposer='L. Hayflick', difficulty=4, reward=3000, status='open',
    summary='人为什么会变老？',
    kid='人为什么会变老？为什么小鼠只能活 2 年，乌龟能活 200 年？现代生物学发现了一些"衰老标志"（端粒、衰老细胞、线粒体……）。能不能通过干预这些机制让人类活得更久更健康？',
    formal='阐明并干预 9-12 个衰老标志中的关键因果机制。',
    whyHard='多通路相互关联。',
    aiPrompt='介绍 Hallmarks of Aging（2013 López-Otín）。',
    tags=['衰老', '医学', '标志'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Why We Age', videoChannel='Kurzgesagt',
    participate=part(('experiment','小鼠寿命实验'),
                  ('code','单细胞测序分析'),
                  ('survey','读 Hallmarks 综述'),
                  ('essay','介绍 mTOR、NAD+ 通路'))
)

add(
    id='cancer-cure', category='biology',
    title='通用癌症疗法', titleEn='Universal Cancer Therapy',
    year=1971, proposer='—', difficulty=5, reward=5000, status='open',
    summary='能对付所有癌症的通用方法？',
    kid='"癌症"其实是 200 多种病的统称，每种都不一样。有的长在肺，有的长在骨头。我们能不能找到一种方法对付所有癌症？现在有免疫疗法（让免疫系统攻击癌症）这种通用思路的雏形。',
    formal='对任意肿瘤类型都有效的免疫/靶向/基因疗法组合。',
    whyHard='肿瘤异质性、耐药性。',
    aiPrompt='介绍免疫检查点抑制剂、CAR-T、CRISPR 治疗。',
    tags=['医学', '肿瘤', '免疫'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Cancer Cure', videoChannel='Kurzgesagt',
    participate=part(('experiment','CAR-T 设计'),
                  ('code','TCGA 数据分析'),
                  ('essay','介绍免疫治疗史'),
                  ('fund','给癌症研究捐资'))
)

add(
    id='alzheimer', category='biology',
    title='阿尔茨海默病', titleEn="Alzheimer's Disease",
    year=1906, proposer='A. Alzheimer', difficulty=4, reward=3000, status='open',
    summary='为什么老人会忘记一切？',
    kid='很多爷爷奶奶记不住事情，会迷路、忘记亲人名字。这种病叫阿尔茨海默病（俗称老年痴呆）。科学家发现大脑里有些"垃圾蛋白"堆积，但到底是垃圾导致疾病，还是疾病产生垃圾？还吵不清。',
    formal='阐明 Aβ/tau 沉积与神经退行的因果关系并开发对因治疗。',
    whyHard='临床试验失败率高（>99%）。',
    aiPrompt='介绍 amyloid cascade 假说、tau 假说。',
    tags=['神经', '医学', '蛋白'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Alzheimer', videoChannel='Kurzgesagt',
    participate=part(('experiment','动物模型'),
                  ('code','多组学分析'),
                  ('essay','介绍临床失败史'))
)

add(
    id='whole-brain-emulation', category='biology',
    title='全脑模拟', titleEn='Whole Brain Emulation',
    year=2005, proposer='—', difficulty=5, reward=0, status='open',
    summary='把大脑完整复制到电脑里',
    kid='如果能扫描一个真实大脑的每一个连接和分子，然后在电脑里"重新播放"，我们就能在计算机上运行一个数字版的"人"。听起来像科幻，但前沿神经科学正在朝这个方向走。',
    formal='对完整哺乳动物大脑（线虫 302 神经元 → 果蝇 10⁵ → 小鼠 7×10⁷ → 人 8.6×10¹⁰），完成 (a) 连接组电子显微镜重建 (分辨率 < 4 nm, 误差 < 5%)，(b) 单细胞转录组 (10x Genomics 验证)，(c) 在硅上模拟其行为输出 (与生物体在 N 种刺激下行为一致度 ≥ 90%)。',
    whyHard='人脑有 860 亿神经元、100 万亿突触。',
    aiPrompt='介绍 Human Connectome、Blue Brain。',
    tags=['神经', '计算', '哲学'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Whole Brain Emulation', videoChannel='Kurzgesagt',
    participate=part(('code','神经元网络模拟'),
                  ('data','贡献连接组数据'),
                  ('essay','介绍蓝脑计划'),
                  ('discuss','参与上传意识讨论'))
)

add(
    id='antibiotic-resistance', category='biology',
    title='抗生素耐药性', titleEn='Antibiotic Resistance',
    year=1928, proposer='A. Fleming (penicillin)', difficulty=4, reward=3000, status='open',
    summary='细菌在变强，我们的药在变弱',
    kid='过去 100 年我们靠抗生素打败了很多感染。但细菌会"学习"，一代代进化出耐药性。WHO 说，到 2050 年耐药菌每年可能杀死 1000 万人，超过癌症。我们需要新一代武器。',
    formal='发现或开发能对付所有"ESKAPE"耐药菌的新机制抗生素。',
    whyHard='细菌进化速度快，新药研发周期长。',
    aiPrompt='介绍 Teixobactin、噬菌体、抗菌肽。',
    tags=['医学', '进化', '药物'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Antibiotic Resistance', videoChannel='Kurzgesagt',
    participate=part(('experiment','土壤微生物筛选'),
                  ('code','用 ML 预测新抗生素'),
                  ('essay','介绍 Fleming 故事'))
)

add(
    id='cell-reprogramming', category='biology',
    title='细胞重编程', titleEn='Cell Reprogramming',
    year=2006, proposer='S. Yamanaka', difficulty=4, reward=2000, status='partially_solved',
    summary='把皮肤细胞变回干细胞',
    kid='你身上的皮肤细胞、心脏细胞、神经细胞都来自同一个受精卵，但后来变得不一样。Yamanaka 发现只要开几个"开关"（Yamanaka 因子），就能把皮肤细胞变回"小婴儿"状态，再变能任何细胞。这给再生医学打开了一扇门。',
    formal='用化学或遗传学方法安全、可逆地将体细胞重编程为 iPSC 或其他细胞类型。',
    whyHard='效率和安全性。',
    aiPrompt='介绍 OSKM 因子、化学重编程。',
    tags=['再生医学', '干细胞', 'Yamanaka'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Cell Reprogramming', videoChannel='Kurzgesagt',
    participate=part(('experiment','重编程小鼠细胞'),
                  ('code','单细胞测序分析'),
                  ('essay','介绍 Yamanaka 故事'))
)

# --- 新增生物学 ---
add(
    id='microbiome', category='biology',
    title='微生物组功能', titleEn='Microbiome Function',
    year=2007, proposer='NIH Human Microbiome Project', difficulty=4, reward=2000, status='open',
    summary='你身上的 100 万亿细菌是干什么的？',
    kid='你身体里（主要在肠道）有 100 万亿细菌，基因数是人类的 100 倍。它们帮你消化、训练免疫、甚至影响心情。但到底哪些菌做什么？我们大部分不知道。',
    formal='对人类微生物组中每种菌株的代谢、免疫、神经功能建立因果图谱。',
    whyHard='种间互作复杂。',
    aiPrompt='介绍 HMP、Germ-free mice。',
    tags=['微生物', '医学', '肠脑轴'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Microbiome', videoChannel='Kurzgesagt',
    participate=part(('experiment','无菌小鼠实验'),
                  ('code','16S rRNA 分析'),
                  ('essay','介绍肠脑轴'))
)

add(
    id='gene-drive', category='biology',
    title='基因驱动', titleEn='Gene Drive',
    year=2003, proposer='A. Burt', difficulty=4, reward=0, status='open',
    summary='让基因"入侵"整个物种',
    kid='CRISPR 让修改基因变便宜。能不能做一个"基因驱动"——让某个特定基因在物种中以 100% 概率遗传（不是通常的 50%），从而改造整个物种？比如让蚊子不再传播疟疾。',
    formal='设计基因驱动系统：满足 (a) 目标种群中传递率 ≥ 95%，(b) 100 代内可逆（daisy-chain 或 anti-drive），(c) 1000 公里范围内水平转移率 < 0.1%，(d) 伦理与生物安全审查通过 (WHO/ Cartagena Protocol)。',
    whyHard='生态风险、抗性演化。',
    aiPrompt='介绍 Target Malaria、daisy drive。',
    tags=['基因', 'CRISPR', '生态'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Gene Drive', videoChannel='Kurzgesagt',
    participate=part(('experiment','果蝇基因驱动'),
                  ('essay','介绍生态伦理'),
                  ('discuss','参与治理讨论'))
)

add(
    id='xenotransplant', category='biology',
    title='异种器官移植', titleEn='Xenotransplantation',
    year=1984, proposer='—', difficulty=4, reward=0, status='open',
    summary='把猪心移植到人身上',
    kid='需要器官移植的人很多，但捐献器官远远不够。能不能用转基因猪心代替？2022 年已经有人移植猪心活了 2 个月。',
    formal='实现基因改造猪心/肾 → 人异种移植：在非人灵长类 ≥ 5 例 5 年存活、人临床试验 ≥ 50 例 5 年存活（无 PERV 感染、超急性排斥 < 1%、慢性排斥 < 10%），并通过 FDA/EMA 生物制品审批。',
    whyHard='免疫排斥、病毒风险。',
    aiPrompt='介绍 PERV、CRISPR 改造猪。',
    tags=['医学', '移植', '基因'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Xenotransplant', videoChannel='Kurzgesagt',
    participate=part(('experiment','转基因猪'),
                  ('essay','介绍首例猪心移植'),
                  ('discuss','参与伦理讨论'))
)

add(
    id='epigenetic-inherit', category='biology',
    title='表观遗传跨代遗传', titleEn='Transgenerational Epigenetic Inheritance',
    year=1999, proposer='—', difficulty=3, reward=1000, status='open',
    summary='祖父母的经历能传给孙辈吗？',
    kid='孟德尔遗传说 DNA 决定一切。但近年发现：荷兰饥饿冬天的孕妇，其孙辈也有代谢问题。看起来经历能通过 DNA 修饰跨代传递。这是真的普遍机制还是个别现象？',
    formal='证明或排除哺乳动物跨代表观遗传的普遍性。',
    whyHard='区分直接效应（子宫内）和真正的跨代。',
    aiPrompt='介绍 Dutch Hunger Winter、Agouti mouse。',
    tags=['遗传', '表观', '演化'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Epigenetics', videoChannel='Kurzgesagt',
    participate=part(('experiment','小鼠跨代实验'),
                  ('code','甲基化数据分析'),
                  ('essay','介绍 Lamarck 复兴'))
)

add(
    id='rna-world', category='biology',
    title='RNA 世界假说', titleEn='RNA World Hypothesis',
    year=1986, proposer='W. Gilbert', difficulty=4, reward=0, status='open',
    summary='生命起源于 RNA 而不是 DNA？',
    kid='现代生命用 DNA 存信息、蛋白质做功能、RNA 当信使。但 RNA 也能"做"事（ribozyme）。一种理论是：早期生命是纯 RNA 的，RNA 同时是信息和催化剂。后来才分工给 DNA 和蛋白质。',
    formal='在实验室条件下证明 RNA 分子能自我复制并进化。',
    whyHard='目前没有能让 RNA 自我复制 > 200 nt 的 ribozyme。',
    aiPrompt='介绍 Spiegelman monster、ribozyme 进化。',
    tags=['生命起源', 'RNA', '演化'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='RNA World', videoChannel='Kurzgesagt',
    participate=part(('experiment','ribozyme 体外进化'),
                  ('essay','介绍 RNA 世界证据'),
                  ('discuss','参与生命起源讨论'))
)

add(
    id='universal-flu', category='biology',
    title='通用流感疫苗', titleEn='Universal Flu Vaccine',
    year=1933, proposer='—', difficulty=4, reward=2000, status='open',
    summary='一针管所有流感变种',
    kid='每年都要打新的流感疫苗，因为病毒在变。能不能打一针就管所有变种（甚至跨物种）？',
    formal='开发对所有甲型流感 HA 亚型 (H1-H18) 有效、且对乙型、丙型亦有交叉保护的疫苗：在 6 月龄-80 岁人群 ≥ 90% 血清转化率、≥ 80% 临床保护效力、保护期 ≥ 3 年，且每年更新成本 ≤ 现有流感疫苗 1.5 倍。',
    whyHard='病毒表面血凝素变异性高。',
    aiPrompt='介绍 stalk 抗体、mRNA 疫苗、HA 保守区。',
    tags=['疫苗', '病毒', '免疫'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Universal Flu Vaccine', videoChannel='Kurzgesagt',
    participate=part(('experiment','小鼠挑战实验'),
                  ('code','病毒序列分析'),
                  ('essay','介绍流感史'))
)

add(
    id='hiv-cure', category='biology',
    title='HIV 治愈', titleEn='HIV Cure',
    year=1983, proposer='L. Montagnier / R. Gallo', difficulty=5, reward=3000, status='open',
    summary='能彻底治好艾滋吗？',
    kid='HIV 感染免疫细胞并把 DNA 整合进基因组。鸡尾酒疗法能压住病毒但不能根治。柏林病人 2008 年被治愈（骨髓移植），但不能推广。能不能找到"功能性治愈"？',
    formal='清除 HIV 潜伏库或持续控制病毒不需用药。',
    whyHard='潜伏库难以清除。',
    aiPrompt='介绍 Berlin Patient、shock & kill、bNAb。',
    tags=['医学', '病毒', '免疫'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='HIV Cure', videoChannel='Kurzgesagt',
    participate=part(('experiment','潜伏库研究'),
                  ('essay','介绍柏林病人'),
                  ('fund','给艾滋病研究捐资'))
)

add(
    id='malaria-eradication', category='biology',
    title='疟疾根除', titleEn='Malaria Eradication',
    year=1955, proposer='WHO', difficulty=4, reward=3000, status='partially_solved',
    summary='彻底消灭疟疾',
    kid='疟疾每年杀 60 万人（多数是 5 岁以下非洲儿童）。WHO 1955 年第一次根除计划失败（耐药、资助中断）。现在又启动新计划，但 RTS,S 疫苗只有 30% 效率。',
    formal='全球疟疾年发病数降至 0 并维持 ≥ 5 年：通过 RTS,S/R21 疫苗 + ITN + ACT 组合策略，WHO 区域级别认证消除、监测系统灵敏度 ≥ 1 例/10 万人口、输入病例再传播风险 < 5%。',
    whyHard='蚊媒、贫困、政治。',
    aiPrompt='介绍 RTS,S、R21、基因驱动。',
    tags=['医学', '公共健康', '蚊'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Malaria', videoChannel='Kurzgesagt',
    participate=part(('fund','给 Malaria No More 捐'),
                  ('essay','介绍疟疾史'),
                  ('discuss','参与全球卫生治理'))
)

add(
    id='telomere-extend', category='biology',
    title='端粒延长与衰老', titleEn='Telomere Extension and Aging',
    year=2009, proposer='E. Blackburn / C. Greider / J. Szostak (Nobel)', difficulty=3, reward=2000, status='open',
    summary='延长端粒能让人更长寿吗？',
    kid='染色体末端有"帽子"叫端粒，每次细胞分裂会缩短一截。缩短到一定程度细胞就死亡。能不能延长端粒来延缓衰老？',
    formal='在人类细胞/小鼠中安全延长端粒 ≥ 20%（无致癌风险），在 3 项独立表观遗传/衰老时钟 (Horvath/PhenoAge/GlycanAge) 上呈现 ≥ 3 年逆转，且 ≥ 5 年随访不增加肿瘤发生率。',
    whyHard='端粒延长可能增加癌症风险。',
    aiPrompt='介绍 telomerase、TA-65。',
    tags=['衰老', '端粒', '细胞'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Telomere', videoChannel='Kurzgesagt',
    participate=part(('experiment','小鼠端粒延长'),
                  ('essay','介绍 Blackburn 工作'))
)

add(
    id='stem-cell-therapy', category='biology',
    title='干细胞治疗', titleEn='Stem Cell Therapy',
    year=1998, proposer='J. Thomson (hESC)', difficulty=4, reward=3000, status='partially_solved',
    summary='用干细胞修复任何组织',
    kid='干细胞能变成任何细胞。如果能用病人自己的干细胞修复心脏、神经、胰岛……大部分退行性疾病就能治。',
    formal='对指定组织（神经/心脏/胰岛/视网膜）实现 iPSC/成体干细胞治疗：在 III 期临床试验中 ≥ 70% 患者显著功能改善 (mRS/HbA1c/视力等指标)、致瘤率 < 0.1%、5 年随访无严重不良反应。',
    whyHard='细胞分化和整合控制。',
    aiPrompt='介绍 iPSC、CAR-T、organoid。',
    tags=['再生', '细胞', '医学'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Stem Cell', videoChannel='Kurzgesagt',
    participate=part(('experiment','iPSC 分化'),
                  ('essay','介绍诱导多能干细胞'),
                  ('fund','给研究捐资'))
)

add(
    id='organoid-intelligence', category='biology',
    title='类器官智能', titleEn='Organoid Intelligence',
    year=2022, proposer='T. Hartung (Johns Hopkins)', difficulty=4, reward=0, status='open',
    summary='脑类器官能学会玩游戏吗？',
    kid='科学家把人脑干细胞培养成"脑类器官"（直径几毫米的迷你大脑），有神经活动。能不能让它们学会简单任务？',
    formal='证明脑类器官：(a) 在经典学习范式 (Pavlov/operant) 中表现出可量化学习曲线，(b) 神经元放电模式包含信息熵 ≥ 0.5 bit/spike，(c) 伦理框架（IBC 审批、知情同意）可控。',
    whyHard='伦理和生物复杂性。',
    aiPrompt='介绍 Cortical Labs、CL1。',
    tags=['神经', '伦理', '计算'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Organoid Intelligence', videoChannel='Quanta',
    participate=part(('experiment','培养脑类器官'),
                  ('essay','介绍伦理争议'),
                  ('discuss','参与讨论'))
)

add(
    id='biolocomotion', category='biology',
    title='生物运动原理', titleEn='Principles of Biological Locomotion',
    year=2000, proposer='M. H. Dickinson', difficulty=3, reward=1000, status='open',
    summary='动物/细胞如何高效运动？',
    kid='苍蝇能悬停飞行、细菌能用鞭毛推进、章鱼能用触手爬行。这些运动模式背后的物理原理和能量优化策略是什么？',
    formal='建立跨尺度运动统一理论：分子马达 (kinesin/myosin) → 细胞 (鞭毛) → 器官 → 整体，用 ODE/PDE 框架在 10 个数量级时间-空间尺度上重构能量-信息-力学闭环，且能预测 ≥ 3 个未实验验证的运动现象。',
    whyHard='多尺度耦合。',
    aiPrompt='介绍 Purcell "Life at Low Reynolds Number"。',
    tags=['运动', '物理', '演化'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Locomotion', videoChannel='Veritasium',
    participate=part(('experiment','机器人模拟'),
                  ('code','物理仿真'),
                  ('essay','介绍 Purcell 论文'))
)

add(
    id='bioluminescence', category='biology',
    title='生物发光工程', titleEn='Bioluminescence Engineering',
    year=2010, proposer='—', difficulty=2, reward=500, status='partially_solved',
    summary='让植物像灯泡一样发光',
    kid='萤火虫、深海鱼会发光。如果让植物也发光，城市街道上种树就能代替路灯——多浪漫！',
    formal='通过转基因使整株植物（如烟草/拟南芥）持续可见光发光 ≥ 1 μmol photons/m²/s （人眼可见），且生长速率、生殖能力无显著降低（< 10% 差异），光照来自内源 Luciferase/luciferin 系统，无外部底物供应。',
    whyHard='光强与代谢平衡。',
    aiPrompt='介绍 luciferase 通路、Plantae 项目。',
    tags=['合成生物', '工程', '光'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Glowing Plants', videoChannel='Kurzgesagt',
    participate=part(('experiment','转入荧光基因'),
                  ('kid-project','种转基因荧光植物'),
                  ('essay','介绍生物发光'))
)

add(
    id='synthetic-genome', category='biology',
    title='合成基因组', titleEn='Synthetic Genome',
    year=2010, proposer='C. Venter (Synthia)', difficulty=5, reward=0, status='partially_solved',
    summary='从零合成一个完整基因组',
    kid='2010 年 Venter 团队合成了第一个细菌基因组并植入细胞。2017 年合成酵母 5 号染色体（最大的人工真核染色体）。能不能合成完整的人类基因组？这涉及巨大伦理问题。',
    formal='完整设计并化学合成任意真核生物（如酵母 12 Mb）基因组，准确率 ≥ 99.999%、合成成本 ≤ 0.10 美元/碱基、移植后表型与设计一致度 ≥ 95%、且全基因组测序验证无偏移。',
    whyHard='基因组规模大、表观遗传复杂。',
    aiPrompt='介绍 GP-write、Sc2.0。',
    tags=['合成生物', '伦理', '基因组'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Synthetic Genome', videoChannel='Quanta',
    participate=part(('essay','介绍 Synthia 和 GP-write'),
                  ('discuss','参与伦理讨论'),
                  ('fund','给相关研究捐资'))
)

add(
    id='plant-intelligence', category='biology',
    title='植物智能', titleEn='Plant Intelligence',
    year=2005, proposer='S. Mancuso / A. Trewavas', difficulty=3, reward=0, status='open',
    summary='植物会"思考"吗？',
    kid='植物没有大脑，但它们能感知环境、计算资源、做出复杂决策（比如竞争光）。它们是某种意义上的"智能"吗？',
    formal='对植物根/叶/捕虫行为建立可计算的「智能」模型：能预测 (a) 觅食路径选择 ≥ 80% 准确率，(b) 食虫植物触发阈值 ±10%，(c) 群体信号传导延迟 < 30 秒；模型通过独立实验组验证。',
    whyHard='智能概念本身有争议。',
    aiPrompt='介绍 Mancuso 实验室。',
    tags=['植物', '智能', '哲学'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Plant Intelligence', videoChannel='Kurzgesagt',
    participate=part(('experiment','观察植物行为'),
                  ('essay','介绍 Mancuso 工作'),
                  ('discuss','参与智能定义讨论'))
)

add(
    id='photosynthesis-eff', category='biology',
    title='光合效率提升', titleEn='Improving Photosynthesis Efficiency',
    year=2016, proposer='—', difficulty=4, reward=2000, status='open',
    summary='让光合作用效率翻倍',
    kid='植物光合作用把光能变成糖，但效率只有 1-2%（远低于太阳能电池的 20%）。如果提升到 5%，粮食产量能大幅提高。',
    formal='通过 RuBisCO 工程 / C4 通路引入 / 光呼吸支路绕过，将 C3 作物（如水稻）光合量子效率从 ~3% 提升至 ≥ 6%，田间产量提升 ≥ 30%（3 年多地点试验），且无显著生态副作用。',
    whyHard='多基因协调。',
    aiPrompt='介绍 RIPE、Realizing Increased Photosynthetic Efficiency。',
    tags=['农业', '基因', '光合'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Photosynthesis', videoChannel='Kurzgesagt',
    participate=part(('experiment','RuBisCO 工程'),
                  ('code','代谢通量分析'),
                  ('essay','介绍 RIPE 项目'))
)

add(
    id='climate-crops', category='biology',
    title='气候适应作物', titleEn='Climate-Resilient Crops',
    year=2010, proposer='—', difficulty=4, reward=2000, status='open',
    summary='让作物耐受极端气候',
    kid='气候变化让干旱、洪水、热浪更频繁。需要能扛住这些的作物品种。CRISPR 让基因编辑变便宜。',
    formal='通过基因编辑让主粮作物在干旱/盐碱/高温下保持 > 80% 产量。',
    whyHard='多基因性状。',
    aiPrompt='介绍 Golden Rice、Drought-tolerant maize。',
    tags=['农业', 'CRISPR', '气候'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Climate Crops', videoChannel='Kurzgesagt',
    participate=part(('experiment','CRISPR 改造水稻'),
                  ('essay','介绍气候农业'))
)


# ============= 计算机 (CS) =============
add(
    id='agi', category='cs',
    title='通用人工智能 (AGI)', titleEn='Artificial General Intelligence',
    year=1956, proposer='—', difficulty=5, reward=0, status='open',
    summary='一个 AI 能像人一样做任何事？',
    kid='现在的 AI 都很"专"：下棋的 AI 不能开车，写文章的 AI 不能画画。AGI 想要一个 AI 像人一样，什么都能学、什么都能想。这件事能不能做到、什么时候做到，没人知道。',
    formal='构造一个能完成任何人类智能任务的 AI 系统。',
    whyHard='人类智能的原理仍不清楚。',
    aiPrompt='讨论 AGI 的定义、可能时间表、风险。',
    tags=['AI', '智能', '哲学'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='AGI', videoChannel='Lex Fridman',
    participate=part(('code','实现 AGI 系统'),
                  ('essay','讨论 AGI 时间表'),
                  ('discuss','参与 AI 安全论坛'),
                  ('fund','给 AI 研究捐资'))
)

add(
    id='alignment', category='cs',
    title='AI 对齐', titleEn='AI Alignment',
    year=2003, proposer='N. Bostrom / S. Russell', difficulty=5, reward=0, status='open',
    summary='怎么让超级智能的 AI 听人的话？',
    kid='如果你有一只能听懂"做事"的魔法精灵，你怎么确保它做的事真的是你想的？比如你说"给我倒杯水"，它可能把家里所有水都倒完。AI 比精灵更危险——因为它可能比你还聪明。',
    formal='构造一个能稳健地按人类意图行事、且在能力上超过人类的 AI 系统。',
    whyHard='人类的意图很难形式化。',
    aiPrompt='介绍 RLHF、Constitutional AI、可解释性。',
    tags=['AI', '安全', '伦理'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='AI Alignment', videoChannel='Lex Fridman',
    participate=part(('code','实现对齐算法'),
                  ('essay','讨论对齐问题'),
                  ('discuss','参与 AI 安全研究'),
                  ('fund','给 MIRI/ARC 捐资'))
)

add(
    id='software-verification', category='cs',
    title='软件形式化验证', titleEn='Software Verification',
    year=1970, proposer='E. W. Dijkstra / C. A. R. Hoare', difficulty=4, reward=2000, status='open',
    summary='让电脑证明程序没有 bug',
    kid='手机上的 app、医院里的核磁共振机、银行系统——都有 bug 风险。能不能让电脑"读"一段代码，告诉你"这段代码绝对没 bug"？现在只能验证非常小的程序，对真实软件完全不行。',
    formal='对 10⁵-10⁷ 行业代码行（C/SystemC/Python）实现全自动形式验证：在 ≤ 4 小时 / 32 GB 内存内完成 spec 匹配，误报率 < 5%，且至少在 2 个开源大型项目 (Linux kernel module, OpenSSL) 上发现 ≥ 1 个 CVE 等价缺陷。',
    whyHard='状态空间爆炸。',
    aiPrompt='介绍 Coq、Lean、Isabelle、Dafny。',
    tags=['程序', '形式化', 'PL'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Software Verification', videoChannel='MIT OCW',
    participate=part(('code','用 Lean 形式化定理'),
                  ('essay','介绍 Coq 历史'),
                  ('teach','给 PL 学生讲'))
)

add(
    id='homomorphic-encryption', category='cs',
    title='全同态加密', titleEn='Fully Homomorphic Encryption',
    year=2009, proposer='C. Gentry', difficulty=4, reward=2000, status='partially_solved',
    summary='在加密数据上直接计算',
    kid='你想让医院 AI 帮你看病，但不想把病历给 AI。同态加密可以让你"加密"的病历送到 AI，AI 直接在"乱码"上计算，把结果给你，你解密后看到诊断。AI 看不到你的隐私。',
    formal='构造高效、对所有电路支持任意深度的全同态加密。',
    whyHard='噪声管理和性能。',
    aiPrompt='介绍 BGV、BFV、CKKS 方案。',
    tags=['密码', '隐私', '数学'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Homomorphic Encryption', videoChannel='Quanta',
    participate=part(('code','用 SEAL 或 OpenFHE 实现'),
                  ('essay','介绍 Gentry 突破'),
                  ('fund','给 IBM/PALISADE 捐资'))
)

add(
    id='quantum-internet', category='cs',
    title='量子互联网', titleEn='Quantum Internet',
    year=2018, proposer='—', difficulty=4, reward=0, status='open',
    summary='用量子比特通信的网络',
    kid='现在的网络发的是经典比特（0 或 1）。量子互联网发的是"量子比特"——一种"既是0又是1"的神奇状态。它能做不能被偷听的安全通信，连远程量子计算机一起工作。',
    formal='实现多节点量子网络：≥ 1000 节点纠缠分发、保真度 F ≥ 0.9、距离 ≥ 1000 km (基于 quantum repeater)、延迟 < 100 ms、且对节点故障、纠缠退相干有鲁棒错误纠正。',
    whyHard='量子纠缠保持和放大。',
    aiPrompt='介绍量子隐形传态、量子中继。',
    tags=['量子', '网络', '安全'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Quantum Internet', videoChannel='Kurzgesagt',
    participate=part(('experiment','量子纠缠分发'),
                  ('code','量子网络模拟'),
                  ('essay','介绍 Quantum Internet Alliance'))
)

add(
    id='translation-parity', category='cs',
    title='通用机器翻译', titleEn='Universal Machine Translation',
    year=1954, proposer='—', difficulty=4, reward=0, status='partially_solved',
    summary='AI 像专业翻译家一样工作',
    kid='现在 Google 翻译已经能做基本翻译了，但在俚语、专业内容、文化背景上还是不行。如果 AI 能像专业翻译家一样工作，世界会变得更小。',
    formal='在 BLEU/chrF/人类专家评估下，对任何语言对 (含低资源) 任何领域 (法律/医学/技术/文学) 达到：≥ 95% 专家译者水平 (Adequacy)、≥ 90% (Fluency)、且文化隐喻/典故正确理解率 ≥ 80%（人类评估）。',
    whyHard='文化背景和隐含知识。',
    aiPrompt='介绍 NMT、PaLM、Context-aware translation。',
    tags=['NLP', 'AI', '语言'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Translation AI', videoChannel='Kurzgesagt',
    participate=part(('code','fine-tune 翻译模型'),
                  ('data','标注平行语料'),
                  ('essay','介绍机器翻译 70 年史'))
)

# --- 新增 CS ---
add(
    id='crypto-scale', category='cs',
    title='可扩展区块链', titleEn='Scalable Blockchain',
    year=2017, proposer='—', difficulty=4, reward=0, status='open',
    summary='让区块链处理 VISA 级别的交易',
    kid='VISA 每秒处理 24000 笔交易。比特币每秒 7 笔，以太坊 30 笔。要让区块链普及，必须解决扩展性。',
    formal='去中心化区块链在保持 51% 抗攻击性前提下：持续 TPS ≥ 10000、确认延迟 < 10 s、节点数 ≥ 10000，且经 3 年实战考验无重大安全事件。',
    whyHard='去中心化、安全、可扩展的不可能三角。',
    aiPrompt='介绍 L2、sharding、Solana、Aptos。',
    tags=['区块链', '分布式', '扩容'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Blockchain Scaling', videoChannel='a16z',
    participate=part(('code','跑 L2 测试网'),
                  ('essay','介绍不可能三角'),
                  ('fund','给加密项目投资'))
)

add(
    id='consensus', category='cs',
    title='分布式共识', titleEn='Distributed Consensus',
    year=1982, proposer='L. Lamport / R. Shostak / M. Pease', difficulty=3, reward=0, status='partially_solved',
    summary='在不可靠网络中达成一致',
    kid='一群计算机中有的是叛徒，它们怎么投票选出一个共同决定？1982 年的"拜占庭将军问题"提出这个问题。比特币的工作量证明是答案之一，但不是唯一的。',
    formal='在 n 个节点中有 f 个拜占庭节点时容错共识的 n > 3f 最小化。',
    whyHard='网络延迟、节点动态。',
    aiPrompt='介绍 PBFT、Tendermint、HotStuff。',
    tags=['分布式', '算法', '一致性'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Distributed Consensus', videoChannel='MIT OCW',
    participate=part(('code','实现 PBFT'),
                  ('essay','介绍 Lamport 故事'),
                  ('teach','给分布式系统学生讲'))
)

add(
    id='privacy-ml', category='cs',
    title='隐私保护机器学习', titleEn='Privacy-Preserving ML',
    year=2016, proposer='—', difficulty=4, reward=2000, status='open',
    summary='用隐私数据训练 AI',
    kid='医院、银行想用 AI，但数据不能共享。能不能不直接看数据就训练 AI？',
    formal='在不暴露个体数据的前提下训练 ML 模型并提供严格隐私保证。',
    whyHard='隐私-效用权衡。',
    aiPrompt='介绍差分隐私、联邦学习、安全多方计算。',
    tags=['ML', '隐私', '加密'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Privacy ML', videoChannel='Lex Fridman',
    participate=part(('code','用 Opacus 训练 DP 模型'),
                  ('essay','介绍 DP 历史'))
)

add(
    id='federated-learning', category='cs',
    title='联邦学习', titleEn='Federated Learning',
    year=2017, proposer='H. B. McMahan (Google)', difficulty=3, reward=1000, status='partially_solved',
    summary='AI 在你的手机上学习，数据不出本机',
    kid='如果你的手机能训练 AI，但数据永远不离开手机呢？联邦学习让很多设备联合训练一个模型，每台设备只贡献模型更新，不贡献数据。',
    formal='联邦学习系统：通信开销 < 中心化训练 1%、对客户端掉线鲁棒（< 50% 在线仍可训练）、满足 (ε, δ)-差分隐私 (ε ≤ 1, δ ≤ 10⁻⁵)、模型精度损失 < 2%，且支持异构硬件 (手机/嵌入式)。',
    whyHard='非独立同分布、通信开销。',
    aiPrompt='介绍 FedAvg、FedProx、TFF。',
    tags=['ML', '隐私', '分布式'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Federated Learning', videoChannel='Lex Fridman',
    participate=part(('code','用 Flower 框架跑 FL'),
                  ('essay','介绍 Google Gboard'))
)

add(
    id='ai-code', category='cs',
    title='AI 写代码', titleEn='AI for Code',
    year=2021, proposer='—', difficulty=4, reward=0, status='partially_solved',
    summary='AI 写完整应用',
    kid='Copilot、Cursor、Devin 这样的 AI 工具已经能写代码片段、调试、生成测试。能不能让 AI 从头写一个完整应用？',
    formal='AI 能从自然语言需求生成可生产部署的完整代码库。',
    whyHard='复杂需求和长程一致性。',
    aiPrompt='介绍 Copilot、Cursor、Devin、Claude Code。',
    tags=['AI', '编程', '工具'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='AI for Code', videoChannel='Lex Fridman',
    participate=part(('code','用 Cursor 写 app'),
                  ('essay','讨论 AI 对程序员的影响'))
)

add(
    id='ai-math', category='cs',
    title='AI 证明数学', titleEn='AI for Mathematics',
    year=2024, proposer='—', difficulty=5, reward=5000, status='partially_solved',
    summary='AI 自动证明数学猜想',
    kid='2024 年 DeepMind 的 AlphaProof 在 IMO 拿到银牌。AI 能不能成为数学家的合作者，发现新定理？',
    formal='AI 系统对开放数学问题提出原创证明或反例。',
    whyHard='需要深度推理和创造性。',
    aiPrompt='介绍 Lean、AlphaProof、FunSearch。',
    tags=['AI', '数学', '证明'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='AI for Math', videoChannel='Quanta',
    participate=part(('code','用 Lean 形式化定理'),
                  ('essay','介绍 IMO 银牌故事'))
)

add(
    id='self-improve-ai', category='cs',
    title='自我改进的 AI', titleEn='Self-Improving AI',
    year=2010, proposer='—', difficulty=5, reward=0, status='open',
    summary='AI 改进自己的代码',
    kid='如果 AI 能读自己的代码并优化它，且改进后的 AI 更聪明——它会进入"智能爆炸"。这是 Bostrom 的"递归自我改进"假说。可能导致奇点。',
    formal='构造一个能稳健地改进自身能力的 AI 系统。',
    whyHard='递归改进可能失控。',
    aiPrompt='介绍 AutoML、AutoGPT、Singularity。',
    tags=['AI', '奇点', '安全'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Self Improving AI', videoChannel='Lex Fridman',
    participate=part(('essay','讨论奇点'),
                  ('discuss','参与 AI 治理'),
                  ('fund','给 AI 安全研究捐资'))
)

add(
    id='neuromorphic', category='cs',
    title='神经形态计算', titleEn='Neuromorphic Computing',
    year=1980, proposer='C. Mead', difficulty=4, reward=2000, status='partially_solved',
    summary='像大脑一样工作的芯片',
    kid='现在 GPU 跑 AI 很费电（训练 GPT-4 用掉一个核电站一天的电量）。能不能造像大脑一样省电（人脑 20 瓦）的芯片？',
    formal='神经形态芯片：能效比 ≥ 10 TOPS/W（INT8 精度），能跑现代 LLM/视觉模型 (Llama-7B 推理) 实时响应 (< 100ms token)、且抗辐射/低功耗 (< 1 W)。',
    whyHard='硬件和软件协同设计。',
    aiPrompt='介绍 Intel Loihi、IBM TrueNorth、SpiNNaker。',
    tags=['硬件', 'AI', '神经'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Neuromorphic', videoChannel='Veritasium',
    participate=part(('experiment','Loihi 编程'),
                  ('essay','介绍 Mead 工作'))
)

add(
    id='photonic-compute', category='cs',
    title='光子计算', titleEn='Photonic Computing',
    year=2017, proposer='—', difficulty=4, reward=0, status='open',
    summary='用光代替电做 AI 推理',
    kid='光子计算用光波代替电信号，速度快、能耗低。Lightmatter、Lightelligence 等公司在做 AI 推理光子芯片。',
    formal='光子计算系统：能效比 ≥ 100 TOPS/W 且精度损失 < 1% (FP16/INT8)、在 ResNet-50/BERT 类模型上吞吐 ≥ 10x GPU、延迟 < 1 ms，且可扩展到 ≥ 1024 光学处理器阵列。',
    whyHard='模拟计算和数字计算的精度。',
    aiPrompt='介绍 Lightmatter、Lightelligence。',
    tags=['硬件', '光子', 'AI'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Photonic Computing', videoChannel='Lex Fridman',
    participate=part(('experiment','用光子加速器'),
                  ('essay','介绍光学计算历史'))
)

add(
    id='3d-chip', category='cs',
    title='3D 堆叠芯片', titleEn='3D Stacked Chips',
    year=2014, proposer='AMD (HBM)', difficulty=3, reward=1000, status='partially_solved',
    summary='垂直堆叠芯片提升性能',
    kid='现在芯片的瓶颈是数据传输（"内存墙"）。3D 堆叠把内存和计算单元垂直堆在一起，数据传输距离缩短 1000 倍。',
    formal='3D 堆叠芯片：内存带宽 ≥ 100 TB/s、TSV 密度 ≥ 10⁶/cm²、热密度 ≤ 100 W/cm²（液冷可行）、且通过 1000 小时可靠性测试无失效。',
    whyHard='散热和良率。',
    aiPrompt='介绍 AMD 3D V-Cache、TSMC SoIC。',
    tags=['硬件', '芯片', '架构'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='3D Chip', videoChannel='a16z',
    participate=part(('essay','介绍 AMD 3D V-Cache'),
                  ('experiment','跑性能基准'))
)

add(
    id='energy-ai', category='cs',
    title='能源高效 AI', titleEn='Energy-Efficient AI',
    year=2023, proposer='—', difficulty=4, reward=2000, status='open',
    summary='让 AI 训练和推理节能 100 倍',
    kid='训练 GPT-4 用了多少电？传闻 50 GWh。如果 AI 持续指数级发展，能源将成为硬约束。需要让 AI 节能 100 倍。',
    formal='AI 训练/推理硬件：能效 ≥ 100x 当前 SOTA (按 FLOP/J 测量)、能跑 LLaMA-70B 训练、与现有 GPU 软件栈兼容 (PyTorch/TF)、且单卡成本 < 10000 美元。',
    whyHard='架构、算法、硬件协同。',
    aiPrompt='介绍 MoE、sparsity、量子化。',
    tags=['AI', '能源', '可持续'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Energy AI', videoChannel='Kurzgesagt',
    participate=part(('code','模型量化'),
                  ('essay','介绍 AI 能源消耗'))
)

add(
    id='memory-hard', category='cs',
    title='Memory-Hard 算法', titleEn='Memory-Hard Algorithms',
    year=2009, proposer='C. Percival', difficulty=3, reward=1000, status='partially_solved',
    summary='让密码学对 ASIC 也不划算',
    kid='比特币挖矿用 ASIC 矿机，速度比普通显卡快 100 万倍。需要设计"memory-hard"的算法（比如 Argon2id、Equihash），让即使有专用硬件也难以规模化。',
    formal='设计 PoW 算法使最优 ASIC 加速比 < 100x。',
    whyHard='算法 vs 硬件的军备竞赛。',
    aiPrompt='介绍 Argon2、Equihash、ASIC 抗性。',
    tags=['密码', '挖矿', '内存'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Memory Hard', videoChannel='a16z',
    participate=part(('code','实现 Argon2'),
                  ('essay','介绍 PoW 历史'))
)

add(
    id='post-quantum', category='cs',
    title='后量子密码', titleEn='Post-Quantum Cryptography',
    year=1994, proposer='P. Shor', difficulty=4, reward=2000, status='partially_solved',
    summary='对抗量子计算机的加密',
    kid='量子计算机能破解 RSA、ECC。我们需要新的密码系统能扛住量子攻击。NIST 2024 年刚标准化了 ML-KEM、ML-DSA、SLH-DSA。',
    formal='抗量子加密：密钥长度 ≤ 1 KB、加密/解密速度 ≥ 经典 RSA-2048、对 Shor/Grover 算法在 10⁶ 量子比特上也安全（NIST PQC 标准）且支持现有协议 (TLS/IKE)。',
    whyHard='需要新数学、新实现。',
    aiPrompt='介绍格密码、编码密码、多变量。',
    tags=['密码', '量子', '安全'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Post Quantum', videoChannel='a16z',
    participate=part(('code','用 liboqs 实现'),
                  ('essay','介绍 NIST PQC 标准化'))
)

add(
    id='zkp-scale', category='cs',
    title='可扩展零知识证明', titleEn='Scalable ZKP',
    year=2013, proposer='E. Ben-Sasson et al. (zk-SNARK)', difficulty=4, reward=2000, status='partially_solved',
    summary='证明"我知道"而不暴露"我知道什么"',
    kid='零知识证明让一方能向另一方证明"我知道密码"但不暴露密码本身。能不能让 ZKP 足够快、可大规模部署？',
    formal='零知识证明系统：证明生成 ≥ 10⁶ 证明/秒 (单服务器)、证明大小 ≤ 1 KB (常数不随电路大小增长)、验证时间 ≤ 1 ms、且对算术电路 (≥ 2²⁰ gates) 友好。',
    whyHard='计算开销。',
    aiPrompt='介绍 zk-SNARK、zk-STARK、PLONK。',
    tags=['密码', '零知识', '扩容'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='ZKP', videoChannel='a16z',
    participate=part(('code','用 circom 写电路'),
                  ('essay','介绍 ZK 历史'))
)

add(
    id='decentralized-id', category='cs',
    title='去中心化身份', titleEn='Decentralized Identity',
    year=2017, proposer='—', difficulty=3, reward=1000, status='open',
    summary='让你真正拥有自己的身份',
    kid='现在你的身份被 Google、Apple、Facebook 控制。能不能用密码学让身份真正属于你？',
    formal='用户完全控制、隐私保护、可验证的身份系统。',
    whyHard='密钥管理和恢复。',
    aiPrompt='介绍 DID、Verifiable Credentials、Spruce。',
    tags=['密码', '身份', '隐私'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Decentralized ID', videoChannel='a16z',
    participate=part(('code','用 DID 协议'),
                  ('essay','介绍自我主权身份'))
)

add(
    id='ai-for-science', category='cs',
    title='AI for Science', titleEn='AI for Science',
    year=2020, proposer='—', difficulty=4, reward=3000, status='partially_solved',
    summary='AI 加速科学发现',
    kid='AlphaFold 解决了蛋白质折叠；GNoME 发现了 220 万种新晶体；AI 正在改变科学。能否让 AI 成为科学家的"加速器"？',
    formal='AI 在 > 10 个学科做出诺贝尔级发现。',
    whyHard='需要可解释性和验证。',
    aiPrompt='介绍 AlphaFold、GNoME、FunSearch。',
    tags=['AI', '科学', '加速'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='AI for Science', videoChannel='Lex Fridman',
    participate=part(('code','跑 AlphaFold'),
                  ('essay','介绍 AI 改变科研'))
)

add(
    id='explainable-ai', category='cs',
    title='可解释 AI', titleEn='Explainable AI (XAI)',
    year=2017, proposer='—', difficulty=4, reward=2000, status='open',
    summary='让 AI 解释自己的决定',
    kid='深度学习是黑盒——它说"这张图是猫"，但不知道为什么。如果 AI 拒绝给你贷款、推荐治疗，法官和医生需要知道为什么。',
    formal='对 AI 决策给出忠实、可理解、可验证的解释。',
    whyHard='深度模型本身就不可解释。',
    aiPrompt='介绍 SHAP、LIME、Attention。',
    tags=['AI', 'XAI', '伦理'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Explainable AI', videoChannel='Kurzgesagt',
    participate=part(('code','用 SHAP 分析模型'),
                  ('essay','介绍 XAI 历史'))
)

add(
    id='causal-ai', category='cs',
    title='因果 AI', titleEn='Causal AI',
    year=2009, proposer='J. Pearl', difficulty=4, reward=2000, status='open',
    summary='AI 学会"为什么"',
    kid='现在的 AI 只能学关联（"冰淇淋销量高时溺水多"），不能学因果（"其实是夏天"）。Judea Pearl 提出因果阶梯，让 AI 真正能推理因果。',
    formal='AI 系统能回答"如果 A 发生会怎样"和"为什么"。',
    whyHard='因果结构从数据中学习。',
    aiPrompt='介绍 Pearl 的"因果阶梯"。',
    tags=['AI', '因果', '推理'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Causal AI', videoChannel='Lex Fridman',
    participate=part(('code','用 DoWhy 库'),
                  ('essay','介绍 Pearl 工作'))
)


# ============= 哲学 (Philosophy) =============
add(
    id='consciousness', category='philosophy',
    title='意识的难问题', titleEn='Hard Problem of Consciousness',
    year=1995, proposer='D. Chalmers', difficulty=5, reward=0, status='open',
    summary='为什么会有"感受"？',
    kid='你看到红色、闻到咖啡香、感到疼痛——这些"主观感受"是怎么从一堆原子和电信号里冒出来的？为什么不是像机器人一样"处理信息"而没有"感觉"？哲学家 David Chalmers 把这叫"难问题"。',
    formal='解释为什么物理过程产生主观体验（qualia）。',
    whyHard='可能永远无法从第三人称描述还原第一人称体验。',
    aiPrompt='讨论功能主义、IIT、GWT、泛心论。',
    tags=['心灵', '哲学', 'qualia'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Hard Problem of Consciousness', videoChannel='Kurzgesagt',
    participate=part(('essay','写一篇哲学论文'),
                  ('discuss','参与意识研究'),
                  ('teach','给哲学学生讲'))
)

add(
    id='free-will', category='philosophy',
    title='自由意志', titleEn='Free Will',
    year=-350, proposer='亚里士多德 / B. Spinoza', difficulty=5, reward=0, status='open',
    summary='你能"选择"吗？',
    kid='你以为是"你"决定吃冰淇淋还是苹果。但每个神经元的放电都遵循物理定律。如果宇宙的初始状态定好了，所有未来就定好了。这是决定论。那"你"在做什么？',
    formal='自由意志与物理决定论/量子不确定性是否相容？',
    whyHard='物理学似乎不支持非因果。',
    aiPrompt='介绍 compatibilism、libertarianism、hard determinism。',
    tags=['哲学', '心灵', '伦理'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Free Will', videoChannel='Kurzgesagt',
    participate=part(('essay','写哲学论文'),
                  ('discuss','参与辩论'),
                  ('teach','给哲学系学生讲'))
)

add(
    id='meaning-of-life', category='philosophy',
    title='生命的意义', titleEn='Meaning of Life',
    year=-500, proposer='孔子 / 佛陀 / 萨特', difficulty=4, reward=0, status='open',
    summary='我为什么活着？',
    kid='宇宙在不在意我们呢？大概不在意。但我们能不能自己"造"出意义？很多大哲学家（孔子、佛陀、萨特、维特根斯坦）都想过这个问题。',
    formal='生命的意义是否能从客观或主观角度被合理定义？',
    whyHard='意义似乎是主观的，但又希望是客观的。',
    aiPrompt='比较存在主义、佛教、儒家、虚无主义。',
    tags=['哲学', '意义', '存在'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Meaning of Life', videoChannel='Kurzgesagt',
    participate=part(('essay','写你自己的看法'),
                  ('discuss','在论坛讨论'),
                  ('teach','教给中学生'))
)

add(
    id='moral-objectivity', category='philosophy',
    title='道德客观性', titleEn='Moral Objectivity',
    year=-400, proposer='苏格拉底 / 柏拉图', difficulty=4, reward=0, status='open',
    summary='道德是真实的还是人定的？',
    kid='你说"杀人是错的"。但凭什么？这是真实的"事实"，还是人类的"约定"？哲学家们吵了 2500 年。',
    formal='若道德事实是客观的，则存在跨文化、跨时代的道德判断会聚；操作性化：(a) 在 N≥30 文化、≥100 道德困境 (Trolley/Footbridge 等) 上测量道德直觉一致度 r ≥ 0.8；(b) 设计反事实：如果道德非客观，预测分歧度会上升 — 实证验证 (跨文化 fMRI 一致性)。',
    whyHard='自然主义谬误、is-ought 问题。',
    aiPrompt='介绍元伦理学三大流派。',
    tags=['伦理', '哲学', 'meta'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Moral Objectivity', videoChannel='Kurzgesagt',
    participate=part(('essay','写元伦理论文'),
                  ('discuss','参与道德辩论'))
)

add(
    id='zombie-thought', category='philosophy',
    title='哲学僵尸', titleEn='Philosophical Zombies',
    year=1974, proposer='R. Kirk', difficulty=4, reward=0, status='open',
    summary='有没有"没有意识"的人？',
    kid='有没有一种"僵尸"——长得和你一模一样，会说话会笑会哭，但里面是空的，没有任何"感受"？如果可能，那意识就不是物理可以解释的。',
    formal='如果哲学僵尸在概念上可能，则物理主义 (physicalism) 与现象意识 (qualia) 存在解释鸿沟；操作化：(a) 给出「可观测等价但现象不等同」的可证伪判据，(b) 在 AI 系统 (LLM/RL agent) 上设计等价实验验证。',
    whyHard='意识是否是必要的还是偶然的。',
    aiPrompt='介绍 Chalmers 的僵尸论证。',
    tags=['心灵', '哲学', 'qualia'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Zombies', videoChannel='Kurzgesagt',
    participate=part(('essay','写一篇反驳或支持'),
                  ('discuss','参与心灵哲学讨论'))
)

add(
    id='simulation-arg', category='philosophy',
    title='模拟论证', titleEn='Simulation Argument',
    year=2003, proposer='N. Bostrom', difficulty=4, reward=0, status='open',
    summary='我们是被模拟出来的吗？',
    kid='玩过电子游戏吗？游戏里的角色不知道自己是"游戏里的"。如果未来人类能做出包含意识的模拟，那我们很可能就是"被模拟出来的"。',
    formal='三种可能性之一必须为真：(1) 人类灭绝前灭亡；(2) 高级文明不感兴趣做模拟；(3) 我们极可能在模拟中。',
    whyHard='没有可证伪性。',
    aiPrompt='介绍 Bostrom 三难推理。',
    tags=['形而上', '哲学', '模拟'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Simulation Argument', videoChannel='Lex Fridman',
    participate=part(('essay','写反驳或支持论文'),
                  ('discuss','参与模拟假设讨论'))
)

# --- 新增哲学 (19 个) ---
add(
    id='personal-identity', category='philosophy',
    title='人格同一性', titleEn='Personal Identity',
    year=1690, proposer='J. Locke', difficulty=4, reward=0, status='open',
    summary='"你"真的是"你"吗？',
    kid='早上醒来的你和昨晚睡前的你，是同一个人吗？克隆一个一模一样的你，他是你吗？把你传送到火星上死了再复制一个，那"你"还活着吗？',
    formal='人格同一性的本质是身体、心理、还是某种更深的东西？',
    whyHard='涉及时间、物质、意识的根本。',
    aiPrompt='介绍洛克、帕菲特、动物主义。',
    tags=['心灵', '哲学', '形而上'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Personal Identity', videoChannel='CrashCourse',
    participate=part(('essay','写哲学论文'),
                  ('discuss','参与心灵哲学讨论'))
)

add(
    id='knowledge-epistemology', category='philosophy',
    title='知识论', titleEn='Epistemology (Theory of Knowledge)',
    year=-350, proposer='柏拉图', difficulty=4, reward=0, status='open',
    summary='我们真的能"知道"什么？',
    kid='你看到桌上有个红苹果——你"知道"它在吗？怎么"知道"的？也许你正在做梦？也许你是缸中之脑？也许你的"红"和别人看到的"红"不一样？',
    formal='知识的本质是什么？信念 + 真理 + 辩护（justified true belief）够吗？',
    whyHard='Gettier 案例揭示传统定义不完备。',
    aiPrompt='介绍 Gettier、可靠主义、外部主义。',
    tags=['哲学', '认识', 'Gettier'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Epistemology', videoChannel='CrashCourse',
    participate=part(('essay','写认识论论文'),
                  ('discuss','参与哲学论坛'))
)

add(
    id='truth', category='philosophy',
    title='真理的本质', titleEn='Nature of Truth',
    year=-300, proposer='亚里士多德', difficulty=4, reward=0, status='open',
    summary='什么是真的？',
    kid='"雪是白的"是真的，因为雪确实是白的——这种"对应理论"显然。但"2+2=4"也是真的，难道数学对象"在"某个地方？逻辑真理、道德真理、美学真理各自是哪种？',
    formal='若真理有统一本质（对应论/融贯论/实用论之一），则所有合理真理理论须能解释：(a) 数学真理 (Gödel 完备性)、(b) 经验科学真理 (Quine-Duhem)、(c) 规范性真理 (伦理学/美学)；给出可证伪的统一形式化方案（如 Tarski 层级 + 实用嵌入）。',
    whyHard='候选理论都有反例。',
    aiPrompt='介绍对应论、一致论、实用主义、紧缩论。',
    tags=['形而上', '逻辑', '哲学'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Truth', videoChannel='CrashCourse',
    participate=part(('essay','写一篇真理理论论文'),
                  ('discuss','参与形而上学讨论'))
)

add(
    id='beauty', category='philosophy',
    title='美的本质', titleEn='Nature of Beauty',
    year=-350, proposer='柏拉图', difficulty=3, reward=0, status='open',
    summary='美是客观的还是主观的？',
    kid='为什么人们觉得日落、贝多芬、公式 E=mc² 都很美？美是客观存在的（柏拉图）还是人类大脑的产物（休谟）？还是两者都不是？',
    formal='若美有客观特征，则跨文化的审美判断应有非平凡一致性；操作化：在 N≥30 文化、≥100 视觉/音乐/数学对象上，统计 (a) 评分 Pearson r ≥ 0.6，(b) 神经美学 fMRI 模式相似度 ≥ 70%（独立于文化）。',
    whyHard='跨文化差异 vs 普遍倾向。',
    aiPrompt='介绍柏拉图、休谟、Kant 的美学。',
    tags=['美学', '哲学', '主观'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Beauty', videoChannel='CrashCourse',
    participate=part(('essay','写美学论文'),
                  ('discuss','参与美学讨论'))
)

add(
    id='time-philosophy', category='philosophy',
    title='时间的本质', titleEn='Nature of Time',
    year=-400, proposer='Parmenides / Zeno', difficulty=5, reward=0, status='open',
    summary='时间是真实流动的吗？',
    kid='物理学说时间是一个维度（和空间一样）。但你感受到的"现在"是特殊的。哲学家 McTaggart 说时间是虚幻的——如果是这样，为什么我们感觉它在流？',
    formal='时间是 A 系列（动态现在）还是 B 系列（静态事件序列）？',
    whyHard='A 系列被许多物理学家认为不真实。',
    aiPrompt='介绍 McTaggart、Presentism、Eternalism。',
    tags=['形而上', '时间', '哲学'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Time', videoChannel='CrashCourse',
    participate=part(('essay','写时间哲学论文'),
                  ('discuss','参与形而上学讨论'))
)

add(
    id='death-philosophy', category='philosophy',
    title='死亡哲学', titleEn='Philosophy of Death',
    year=-350, proposer='柏拉图 / 伊壁鸠鲁', difficulty=3, reward=0, status='open',
    summary='死亡是坏事吗？',
    kid='伊壁鸠鲁说："死亡与我无关——因为我死后就不在了。"听起来像诡辩。但人们为什么怕死？怕的是"不存在"本身，还是"失去现在的自己"？',
    formal='若死亡是坏事，则：(a) Epicurus 论题 (死后无体验) 意味着死亡非 intrinsic 恶；(b) 操作化：测量人对自己死亡的评价 (时间贴现/存在主义量表) 与客观死亡指标 (DALY) 的相关性 r ≥ 0.7。',
    whyHard='不存在似乎不是坏事。',
    aiPrompt='介绍 Epicurus、Lucretius、Bernard Williams。',
    tags=['哲学', '死亡', '形而上'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Death', videoChannel='CrashCourse',
    participate=part(('essay','写一篇关于死亡的论文'),
                  ('discuss','参与生死哲学讨论'))
)

add(
    id='mind-body', category='philosophy',
    title='心物关系', titleEn='Mind-Body Problem',
    year=-400, proposer='笛卡尔', difficulty=4, reward=0, status='open',
    summary='心灵和身体是什么关系？',
    kid='笛卡尔说心灵是非物质的"思维实体"，身体是物质"广延实体"。但非物质的心灵怎么推动物质的身体？二元论、心物一元论、物理主义、泛心论各有说法。',
    formal='若心灵独立于身体（交互二元论），则：(a) 心灵实体不参与物理因果；(b) 操作化：所有认知活动可由神经活动完全预测；反之若心灵不可还原 (Chalmers 性质二元论)，则存在「困难问题」现象意识 → 设计 AI/IIT 实验区分。',
    whyHard='涉及意识本质。',
    aiPrompt='介绍笛卡尔、二元论、物理主义、双面论。',
    tags=['心灵', '哲学', '意识'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Mind Body', videoChannel='CrashCourse',
    participate=part(('essay','写一篇心灵论文'),
                  ('discuss','参与讨论'))
)

add(
    id='is-ought', category='philosophy',
    title='休谟法则', titleEn="Hume's Law (Is-Ought Problem)",
    year=1739, proposer='D. Hume', difficulty=3, reward=0, status='open',
    summary='从"是"能推出"应该"吗？',
    kid='休谟说：不能从"是什么"（事实）推出"应该是什么"（价值）。比如"人杀人"是事实，不能直接推出"人杀人是错的"。但很多伦理学家觉得这太绝对了。',
    formal='若能从纯事实推出价值 (Hume 律则反驳)，则需给出形式化规则 (如 Hare 普遍化)；操作化：测试 (a) 规范性结论能否从纯事实前提逻辑推出，(b) 反例 (Moore 自然主义谬误) 是否被排除。',
    whyHard='直觉上对但又显得太严格。',
    aiPrompt='介绍休谟、摩尔自然主义谬误。',
    tags=['伦理', '逻辑', '哲学'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Is Ought', videoChannel='CrashCourse',
    participate=part(('essay','写关于休谟法则的论文'),
                  ('discuss','参与元伦理学讨论'))
)

add(
    id='justice', category='philosophy',
    title='正义理论', titleEn='Theory of Justice',
    year=-350, proposer='柏拉图 / J. Rawls', difficulty=4, reward=0, status='open',
    summary='什么是公平？',
    kid='罗尔斯 1971 年提出"无知之幕"思想实验：如果你不知道自己将来是富人还是穷人，你会设计什么样的社会？',
    formal='若公平的分配原则是 (罗尔斯/自由至上/功利/平等主义/足够主义) 之一，则可在 N 种分配场景下证伪其他；操作化：在 ≥ 10 个经典分配困境 (器官分配/难民配额/碳预算) 上，五种理论给出不同预测 → 用行为经济学实验 + 共识道德区分。',
    whyHard='不同分配原则（平等、效用、需要）相互冲突。',
    aiPrompt='介绍 Rawls、Nozick、Sen。',
    tags=['政治', '哲学', '公平'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Justice', videoChannel='CrashCourse',
    participate=part(('essay','写一篇正义论文'),
                  ('discuss','参与政治哲学讨论'))
)

add(
    id='liberty', category='philosophy',
    title='自由与权威', titleEn='Liberty and Authority',
    year=1859, proposer='J. S. Mill', difficulty=3, reward=0, status='open',
    summary='国家能管你多少？',
    kid='Mill 说：除非你的行为伤害到别人，否则社会和国家没有权力管你（伤害原则）。但在新冠疫情这样的情况下，这个原则够用吗？',
    formal='若自由有合理边界，则存在 (Mill 伤害原则/限制自由原则/法律家长制) 之一的判据；操作化：(a) 列出自由 vs 权威 100 个 case 库，(b) 用统计方法验证一致性 r ≥ 0.8，(c) 给出可形式化的边界函数 f(行为, 后果) → 行动合法性。',
    whyHard='公共卫生、安全、文化冲突。',
    aiPrompt='介绍 Mill、柏林（积极/消极自由）、Hart。',
    tags=['政治', '哲学', '自由'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Liberty', videoChannel='CrashCourse',
    participate=part(('essay','写政治哲学论文'),
                  ('discuss','参与自由讨论'))
)

add(
    id='property', category='philosophy',
    title='财产理论', titleEn='Theory of Property',
    year=1690, proposer='J. Locke', difficulty=3, reward=0, status='open',
    summary='为什么你能"拥有"一块地？',
    kid='洛克说：你混合了你的劳动，所以那块地是你的（劳动混合理论）。但如果你不劳动（比如继承），还有这个权利吗？',
    formal='若私有财产有正当性基础（劳动/效用/权利/约定论），则可解释：(a) 知识产权 vs 物质财产，(b) 公有 vs 私有，(c) 强征税收的道德地位；操作化：构建 100 案例库，对四种理论预测分歧度做统计分析，通过 Rawls 反思平衡 + 思想实验验证。',
    whyHard='劳动 vs 效用 vs 平等。',
    aiPrompt='介绍 Locke、Nozick、Rawls。',
    tags=['政治', '哲学', '财产'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Property', videoChannel='CrashCourse',
    participate=part(('essay','写财产论文'),
                  ('discuss','参与讨论'))
)

add(
    id='authority-phil', category='philosophy',
    title='国家权威', titleEn='Political Authority',
    year=1651, proposer='T. Hobbes', difficulty=3, reward=0, status='open',
    summary='为什么我们必须服从国家？',
    kid='霍布斯说：在自然状态人人互相残杀，所以大家签社会契约让渡一部分自由给国家。但无政府主义者认为这是不必要的。',
    formal='若国家权威正当 (同意/公平/职责/功利)，则可证伪其他；操作化：(a) 公民服从率 vs 制度满意度相关性 r ≥ 0.7，(b) 无政府状态模拟显示秩序崩溃概率 ≥ 阈值；(c) 跨国治理合作中服从国际法的实证检验。',
    whyHard='同意 vs 公平 vs 自然义务。',
    aiPrompt='介绍 Hobbes、Locke、Rousseau。',
    tags=['政治', '哲学', '国家'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Authority', videoChannel='CrashCourse',
    participate=part(('essay','写政治哲学论文'),
                  ('discuss','参与讨论'))
)

add(
    id='equality', category='philosophy',
    title='平等', titleEn='Equality',
    year=1971, proposer='J. Rawls / R. Dworkin', difficulty=3, reward=0, status='open',
    summary='什么样的平等才公平？',
    kid='Dworkin 说：平等是"敏于抱负、不敏于禀赋"——只要你的资源够，是"懒"还是"不努力"决定结果。但每个人出生时的天赋不同，这公平吗？',
    formal='若平等是机会/结果/资源/福祉/能力 (Sen/Nussbaum) 之一，则可区分：操作化：在 100 个政策场景中预测分歧；经验上：北欧 Gini < 0.3 国家的「机会平等」指标 (IEO) 与 GDP-人均相关性分析。',
    whyHard='三个标准相互冲突。',
    aiPrompt='介绍 Rawls、Dworkin、Cohen。',
    tags=['政治', '哲学', '平等'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Equality', videoChannel='CrashCourse',
    participate=part(('essay','写平等论文'),
                  ('discuss','参与讨论'))
)

add(
    id='punishment', category='philosophy',
    title='惩罚理论', titleEn='Theory of Punishment',
    year=1764, proposer='C. Beccaria', difficulty=3, reward=0, status='open',
    summary='为什么我们要把坏人关进监狱？',
    kid='惩罚有四个目的：报应（你伤了别人，所以你也该受伤）、威慑（让你不敢再犯）、改造（让你变好）、隔离（防止再伤人）。哪个最重要？',
    formal='若惩罚正当 (报应/功利/矫正/威慑)，则可证伪其他；操作化：(a) 累犯率 (再犯率 < 30% 作为矫正成功基准)，(b) 罪刑相适应系数 r ≥ 0.7，(c) 边际威慑效应回归分析显著 (p < 0.05)。',
    whyHard='不同理论导致不同的司法政策。',
    aiPrompt='介绍 retributivism、consequentialism、Duff。',
    tags=['政治', '哲学', '法'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Punishment', videoChannel='CrashCourse',
    participate=part(('essay','写一篇惩罚论文'),
                  ('discuss','参与讨论'))
)

add(
    id='marriage-phil', category='philosophy',
    title='婚姻哲学', titleEn='Philosophy of Marriage',
    year=1949, proposer='S. de Beauvoir', difficulty=2, reward=0, status='open',
    summary='婚姻为什么存在？',
    kid='波伏娃说：婚姻是经济安排，不是爱情。恩格斯说：婚姻是为了确定财产继承。婚姻应该是什么？',
    formal='若婚姻本质是 (生育/爱情/陪伴/法律/经济/宗教) 之一，则跨文化婚姻形态可被合理分类；操作化：(a) 100 文化中「婚姻」定义的统计聚类 (k-means)，(b) 离婚率与婚姻基础指标相关性，(c) 跨文化道德哲学共识 r ≥ 0.7 时可证伪纯文化相对论。',
    whyHard='不同文化对婚姻看法差异极大。',
    aiPrompt='介绍 Beauvoir、Engels、Fineman。',
    tags=['哲学', '社会', '婚姻'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Marriage', videoChannel='CrashCourse',
    participate=part(('essay','写婚姻哲学论文'),
                  ('discuss','参与讨论'))
)

add(
    id='beauty-objective', category='philosophy',
    title='审美判断', titleEn='Aesthetic Judgment',
    year=1790, proposer='I. Kant', difficulty=3, reward=0, status='open',
    summary='美是"无利害的快感"？',
    kid='康德说：审美判断是无利害、无概念的快感——我看到一朵花觉得美，不是因为它有用。真的是这样吗？',
    formal='若审美判断有普遍性根据（比例/对称/进化适应/数学结构），则跨文化应有一致成分；操作化：(a) 黄金比例 vs 斐波那契螺旋在 1000 艺术品中的显著性 (p < 0.01)，(b) 跨文化评分 r ≥ 0.6 + 神经模式聚类验证。',
    whyHard='不同文化、不同时代对美的看法不同。',
    aiPrompt='介绍康德美学。',
    tags=['美学', '哲学', '康德'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Aesthetics', videoChannel='CrashCourse',
    participate=part(('essay','写审美论文'),
                  ('discuss','参与美学讨论'))
)

add(
    id='trolley', category='philosophy',
    title='电车难题', titleEn='Trolley Problem',
    year=1967, proposer='P. Foot', difficulty=2, reward=0, status='open',
    summary='杀 1 人救 5 人，错吗？',
    kid='一辆失控的电车，前面有 5 个人被绑在铁轨上。你旁边有一个拉杆，可以让电车转向另一条轨道——那上面绑着 1 个人。你拉不拉？哲学家用这个测试我们道德直觉。',
    formal='功利主义 (5 vs 1) 与义务论 (不可作为工具) 给出不同预测；操作化：(a) N=1000 跨文化实验中两种判断的比例，(b) fMRI 显示道德冲突 (前扣带皮层激活)，(c) 通过双过程模型 (System 1 vs 2) 解释直觉差异的认知机制。',
    whyHard='道德直觉很难统一。',
    aiPrompt='介绍 Foot、Thomson、自动驾驶伦理。',
    tags=['伦理', '哲学', '思想实验'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Trolley', videoChannel='CrashCourse',
    participate=part(('essay','写电车难题论文'),
                  ('discuss','参与自动驾驶伦理讨论'))
)

add(
    id='teleport', category='philosophy',
    title='传送悖论', titleEn='Teleportation Paradox',
    year=1977, proposer='D. Parfit', difficulty=3, reward=0, status='open',
    summary='如果传送机杀了你再复制你，"你"还活着吗？',
    kid='科幻电影里的"传送"通常：扫描你、把你分子结构发到火星、再造一个。问题是：原版的你会被杀掉吗？那"你"算活着吗？',
    formal='若传送机保留人格同一性 (身体/心理/因果连续性 之一)，则可证伪其他；操作化：(a) 经典 Lockean memory 测验（传送前后记忆/性格/价值观连续性 ≥ 95%），(b) 朋友/家人能否识别的实验盲测 (≥ 80% 识别率 vs 复制体假说)。',
    whyHard='心理连续性 vs 物理连续性。',
    aiPrompt='介绍 Parfit、Reasons and Persons。',
    tags=['心灵', '哲学', '科幻'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Teleport', videoChannel='Kurzgesagt',
    participate=part(('essay','写一篇关于传送的论文'),
                  ('discuss','参与讨论'))
)

add(
    id='newcomb', category='philosophy',
    title='Newcomb 悖论', titleEn="Newcomb's Paradox",
    year=1960, proposer='W. Newcomb', difficulty=3, reward=0, status='open',
    summary='你相信"决定论"还是相信"自由意志"？',
    kid='两个盒子：A 透明（你看到里面有 1000 美元），B 不透明。预测机器说你会"只拿 B"，就放 100 万在 B；说你会"两个都拿"，就 B 里放 0。你怎么选？',
    formal='若决策论 (EV-max) 优先于因果论 (dominance)，则 Newcomb 悖论中应选两箱；操作化：(a) N=1000 受试者选择分布，(b) 重复博弈显示「选一箱」策略 长期胜率 ≥ 60% (causal decision theory)，(c) 形式化 (Lewis/Weirich) 给出统一决策函数。',
    whyHard='两个看似合理的选择给出不同结果。',
    aiPrompt='介绍 Newcomb、causal vs evidential decision theory。',
    tags=['逻辑', '哲学', '决策'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Newcomb', videoChannel='Kurzgesagt',
    participate=part(('essay','写决策论论文'),
                  ('discuss','参与讨论'))
)


# ============= 工程 (Engineering) =============
add(
    id='fusion', category='engineering',
    title='可控核聚变', titleEn='Controlled Nuclear Fusion',
    year=1950, proposer='—', difficulty=5, reward=5000, status='open',
    summary='在地球上造一个"小太阳"',
    kid='太阳靠"烧"氢气变成氦气来发光发热，叫核聚变。地球上能不能也这样做？如果能，能源就几乎无限了。问题是：太阳能靠巨大引力压住核聚变，地球没有。',
    formal='实现 Q = P_fusion / P_input ≥ 10 的稳态聚变反应堆：等离子体约束 τ_E ≥ 3 s、三乘积 nTτ_E ≥ 3×10²¹ keV·s/m³、连续运行 ≥ 1000 小时、年发电量 ≥ 1 TWh、单度电成本 ≤ 0.10 美元。',
    whyHard='需要 1 亿度高温下约束等离子体。',
    aiPrompt='介绍托卡马克、激光惯性约束 ITER、NIF。',
    tags=['能源', '等离子体', '工程'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Fusion', videoChannel='Kurzgesagt',
    participate=part(('experiment','参与 ITER 模拟'),
                  ('code','跑等离子体模拟'),
                  ('essay','介绍聚变历史'),
                  ('fund','给聚变研究捐资'))
)

add(
    id='space-elevator', category='engineering',
    title='太空电梯', titleEn='Space Elevator',
    year=1895, proposer='K. Tsiolkovsky', difficulty=5, reward=0, status='open',
    summary='从地面到太空的"电梯"',
    kid='火箭运东西上太空要花很多钱（一公斤几十万美元）。能不能造一条长长的"电梯"从地球一直伸到太空，东西坐电梯上去？听着科幻，但材料学上没有根本不可能。问题是要找到能撑住自身重量的材料。',
    formal='实现 ≥ 36000 km 长度缆绳：抗拉强度 ≥ 60 GPa、密度 ≤ 1.3 g/cm³、总质量 ≤ 10⁷ kg、单根纤维直径 ≤ 1 μm 且无缺陷、且能承受微陨石 + 雷电 + 原子氧。',
    whyHard='需要比钢强 50 倍的轻质材料（碳纳米管/石墨烯）。',
    aiPrompt='介绍石墨烯、CNT、ISD（电动力学太空电梯）。',
    tags=['太空', '材料', '工程'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Space Elevator', videoChannel='Kurzgesagt',
    participate=part(('experiment','CNT 拉伸测试'),
                  ('code','动力学模拟'),
                  ('essay','介绍太空电梯历史'))
)

add(
    id='desalination', category='engineering',
    title='廉价海水淡化', titleEn='Cheap Desalination',
    year=1950, proposer='—', difficulty=3, reward=2000, status='open',
    summary='把海水变饮用水，便宜到大家用得起',
    kid='地球 71% 是水，但 97% 是咸的不能喝。20 亿人缺干净水。能不能把海水变成饮用水，便宜到大家都用得起？现在能淡化海水，但每吨要 1-3 美元。',
    formal='< 0.5 美元/m³、能耗 < 1 kWh/m³ 的海水淡化。',
    whyHard='膜污染和能耗。',
    aiPrompt='介绍反渗透、电容去离子、正渗透。',
    tags=['水', '能源', '膜'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Desalination', videoChannel='Kurzgesagt',
    participate=part(('experiment','新型膜材料'),
                  ('essay','介绍水危机'),
                  ('fund','给水公益捐资'))
)

add(
    id='reusable-rocket', category='engineering',
    title='完全可重复火箭', titleEn='Fully Reusable Rocket',
    year=2015, proposer='SpaceX', difficulty=4, reward=2000, status='partially_solved',
    summary='让火箭像飞机一样重复使用',
    kid='火箭现在每用一次就扔掉（像纸飞机）。SpaceX 已经在回收部分火箭了。如果整支火箭（连上面级）都能完全重复使用，进太空的成本会大幅降低。',
    formal='轨道级运载火箭：单次发射成本 ≤ 1000 美元/公斤 LEO、≥ 100 次重复使用且无需大修（仅定期检测 < 100 小时）、翻修周转时间 ≤ 7 天、可靠性 ≥ 99.5%。',
    whyHard='热防护和发动机寿命。',
    aiPrompt='介绍 SpaceX Starship、Raptor 引擎。',
    tags=['太空', '工程', '火箭'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Reusable Rocket', videoChannel='Kurzgesagt',
    participate=part(('essay','介绍 SpaceX 故事'),
                  ('fund','关注相关公司'))
)

add(
    id='bci', category='engineering',
    title='脑机接口', titleEn='Brain-Computer Interface',
    year=2016, proposer='E. Musk / Neuralink', difficulty=4, reward=2000, status='open',
    summary='用脑子直接控制电脑',
    kid='你脑子里想的事能不能直接传到电脑？现在 Neuralink 等公司可以让你"用脑子打字"，但很慢。能不能达到"想到什么，电脑就打出什么"的速度？',
    formal='非侵入式 BCI：信息传输率 ≥ 1 Mbps (100 字/分钟以上)、长期使用 (≥ 5 年) 信号稳定性 < 10% 衰减、电极/系统对用户无伤害、且可控制普通计算机/手机 (光标 + 文字输入)。',
    whyHard='电极寿命和带宽。',
    aiPrompt='介绍 Neuralink、Synchron、Blackrock。',
    tags=['神经', '工程', 'AI'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='BCI', videoChannel='Kurzgesagt',
    participate=part(('essay','介绍 BCI 伦理'),
                  ('fund','给相关公司投资'))
)

add(
    id='cheap-solar-fuel', category='engineering',
    title='人造叶子', titleEn='Artificial Leaf',
    year=2011, proposer='D. Nocera', difficulty=4, reward=2000, status='partially_solved',
    summary='用阳光直接把水变燃料',
    kid='植物能用阳光、水和二氧化碳做糖（燃料）。我们能不能造一个"人造叶子"，用阳光直接把水变成氢气（清洁燃料）？这能让太阳能变成可储存的燃料。',
    formal='人造光合器件：太阳能-燃料效率 (STF) ≥ 10%、稳定运行 ≥ 1000 小时（衰减 < 10%）、产物 (H₂/CH₃OH) 选择性 ≥ 90%、产率 ≥ 1 g/kWh、且仅用丰产元素催化剂。',
    whyHard='催化剂稳定性和效率。',
    aiPrompt='介绍 Nocera 工作。',
    tags=['能源', '催化', '仿生'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Artificial Leaf', videoChannel='Kurzgesagt',
    participate=part(('experiment','优化催化剂'),
                  ('essay','介绍仿生技术'))
)

add(
    id='mr-safe-mri', category='engineering',
    title='便宜便携 MRI', titleEn='Cheap Portable MRI',
    year=2020, proposer='—', difficulty=3, reward=1000, status='open',
    summary='让 MRI 走进基层医院',
    kid='现在医院里的 MRI 又大又贵（一台几百万美元），还要用稀有的氦气。能不能做出便宜、轻便的版本，让基层医院甚至救护车都能用？',
    formal='< 50,000 美元、< 50 kg、< 5 mT 场强的高质量 MRI。',
    whyHard='低场强下图像质量。',
    aiPrompt='介绍 Hyperfine、Swoop。',
    tags=['医疗', '工程', '设备'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Portable MRI', videoChannel='Veritasium',
    participate=part(('experiment','低场强成像'),
                  ('essay','介绍 MRI 历史'))
)

add(
    id='hydrogen-storage', category='engineering',
    title='常温常压储氢', titleEn='Hydrogen Storage at Ambient Conditions',
    year=2020, proposer='—', difficulty=4, reward=2500, status='open',
    summary='把氢气像汽油一样安全便宜地存起来',
    kid='氢是清洁能源的明星，但很难存——要 700 倍大气压或者零下 253°C 液氢。能不能像加油一样方便地存？',
    formal='储氢系统：重量密度 ≥ 7 wt%、体积密度 ≥ 70 g/L、可逆循环 ≥ 500 次（无显著衰减）、在 -40°C ~ 60°C、0.1-100 atm 范围内安全（无泄漏/爆炸）、且单 kg 储氢成本 ≤ 300 美元。',
    whyHard='需要新型 MOF、化学氢化物或纳米材料。',
    aiPrompt='介绍 MOF、LOHC、地下储氢、DOE 2025 目标。',
    tags=['能源', '氢', '材料'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Hydrogen Storage', videoChannel='Kurzgesagt',
    participate=part(('experiment','新型 MOF'),
                  ('code','DFT 模拟储氢'),
                  ('essay','介绍氢经济'))
)

add(
    id='carbon-capture-eng', category='engineering',
    title='直接空气捕碳', titleEn='Direct Air Capture (DAC)',
    year=2018, proposer='Climeworks', difficulty=4, reward=3000, status='open',
    summary='从空气中直接抓 CO₂',
    kid='直接空气捕碳（DAC）机已经从空气抓 CO₂。但现在每吨 CO₂ 成本 600-1000 美元。能不能降到 100 美元？',
    formal='< 100 美元/吨的 DAC 系统，能耗 < 1.5 MWh/吨。',
    whyHard='空气中 CO₂ 太稀。',
    aiPrompt='介绍 Climeworks、Carbon Engineering。',
    tags=['气候', '工程', '能源'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='DAC', videoChannel='Kurzgesagt',
    participate=part(('experiment','新型吸附剂'),
                  ('essay','介绍 Climeworks 故事'))
)

# --- 新增工程 (14 个) ---
add(
    id='nuclear-waste', category='engineering',
    title='核废料长期处置', titleEn='Long-term Nuclear Waste Disposal',
    year=1980, proposer='—', difficulty=3, reward=1500, status='open',
    summary='让核废料 10 万年安全',
    kid='核电站产生的废料放射性可持续几十万年。需要找到方法安全隔离它们。Onkalo（芬兰）和 Yucca Mountain（美国）是尝试。',
    formal='核废料（高放乏燃料）处置：密封性 ≥ 10⁵ 年、在地质/海洋/太空方案中任选一个且通过 IAEA 长期安全审查、泄漏风险 < 10⁻⁶ / 10⁵ 年、且处置总成本 ≤ 发电收入 5%。',
    whyHard='地质长期稳定性。',
    aiPrompt='介绍 Onkalo、Yucca Mountain。',
    tags=['核', '工程', '环境'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Nuclear Waste', videoChannel='Kurzgesagt',
    participate=part(('essay','介绍核废料挑战'),
                  ('fund','关注问题'))
)

add(
    id='asteroid-mining', category='engineering',
    title='小行星采矿', titleEn='Asteroid Mining',
    year=2012, proposer='Planetary Resources', difficulty=4, reward=0, status='open',
    summary='从小行星上挖矿',
    kid='近地小行星含有大量铂、金、稀土。能不能派机器人去挖？已成立多家公司。',
    formal='小行星资源开采：单次任务运回地球物质 ≥ 1000 kg、全成本 < 100 万美元/kg（含发射/采矿/返回）、净收益（高价值金属 Pt/Au/Co）≥ 10x 成本、且不违反外空条约。',
    whyHard='空间推进和自主机器人。',
    aiPrompt='介绍 Planetary Resources、Asteroid Mining Corp。',
    tags=['太空', '工程', '资源'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Asteroid Mining', videoChannel='Kurzgesagt',
    participate=part(('essay','介绍空间采矿'),
                  ('fund','关注公司'))
)

add(
    id='floating-cities', category='engineering',
    title='海上漂浮城市', titleEn='Floating Cities',
    year=2019, proposer='—', difficulty=3, reward=0, status='open',
    summary='在海上建城市以应对海平面上升',
    kid='海平面上升让一些岛国消失。能不能在海上建漂浮城市？Ocean Builders 已在建。',
    formal='自给式海上漂浮社区：≥ 1000 人长期居住、100% 可再生能源（太阳能/波浪/海流）、淡水自给（海水淡化）、抗 10 米巨浪 + 7 级地震、运行成本 ≤ 陆地城市 1.5 倍。',
    whyHard='极端天气、合法地位。',
    aiPrompt='介绍 Ocean Builders、Seasteading Institute。',
    tags=['城市', '工程', '气候'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Floating City', videoChannel='Kurzgesagt',
    participate=part(('essay','介绍海上城市'),
                  ('discuss','参与讨论'))
)

add(
    id='earthquake-pred', category='engineering',
    title='地震预测', titleEn='Earthquake Prediction',
    year=1975, proposer='—', difficulty=4, reward=2000, status='open',
    summary='能不能在地震前几小时/几天知道？',
    kid='1975 年中国海城地震被成功预测。但绝大多数地震预测都不成功。能不能找到可靠的"前兆"？',
    formal='地震预测系统：震级 ≥ 5.0 地震的预测准确率 ≥ 80%、提前时间 ≥ 1 天、空间精度 ≤ 50 km、误报率 < 10%、且对至少 3 个不同板块边界验证有效。',
    whyHard='地震是非线性混沌。',
    aiPrompt='介绍 Haicheng、Parkfield 试验。',
    tags=['地震', '地球', '预测'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Earthquake Prediction', videoChannel='Veritasium',
    participate=part(('experiment','GPS 数据分析'),
                  ('code','ML 模型'),
                  ('essay','介绍海城地震'))
)

add(
    id='self-healing-infra', category='engineering',
    title='自修复基础设施', titleEn='Self-Healing Infrastructure',
    year=2010, proposer='H. Jonkers', difficulty=3, reward=1500, status='partially_solved',
    summary='让混凝土自己修复裂缝',
    kid='混凝土的裂缝很难发现也难修。如果混凝土里混入"细菌"——当裂缝出现、空气进来时细菌就开始"长出"方解石把裂缝填满——这叫自修复混凝土。',
    formal='自修复混凝土/涂层：能完全愈合 ≤ 0.5 mm 宽裂缝（强度恢复 ≥ 95%）、在 28 天内完成修复、寿命延长 ≥ 50%、且修复机制在 ≥ 3 次冻融循环后仍有效。',
    whyHard='细菌存活和活性控制。',
    aiPrompt='介绍 Jonkers 工作、Basilisk Concrete。',
    tags=['材料', '工程', '建筑'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Self Healing Concrete', videoChannel='Kurzgesagt',
    participate=part(('experiment','细菌自愈混凝土'),
                  ('essay','介绍自修复材料'))
)

add(
    id='programmable-matter', category='engineering',
    title='可编程物质', titleEn='Programmable Matter',
    year=1991, proposer='T. Toffoli / N. Margolus', difficulty=4, reward=0, status='open',
    summary='物质按程序改变形状',
    kid='如果你能造出一种物质，让它根据程序变成椅子、桌子、墙……这种"可编程物质"由无数微小"catom"组成。',
    formal='可编程物质（catoms）：单元尺寸 ≤ 1 cm、响应时间 ≤ 1 ms、可独立控制 ≥ 10⁶ 单元形成任意 3D 形状、单元间作用力 ≥ 1 N、且总能耗 < 100 W。',
    whyHard='能量、计算、力学。',
    aiPrompt='介绍 Claytronics、Smarticles。',
    tags=['材料', '机器人', '工程'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Programmable Matter', videoChannel='Kurzgesagt',
    participate=part(('essay','介绍 Claytronics'),
                  ('experiment','搭建 Smarticle'))
)

add(
    id='vertical-farming', category='engineering',
    title='垂直农业规模化', titleEn='Vertical Farming at Scale',
    year=2012, proposer='—', difficulty=3, reward=1500, status='partially_solved',
    summary='用摩天大楼种粮食',
    kid='在城市里建摩天大楼，室内多层种庄稼，用 LED 灯、营养液。理论上单位面积产量比传统农业高 10-20 倍。但目前只有生菜、草本等小作物能赚钱。',
    formal='城市垂直农场：粮食产出 ≥ 城市需求 90%、能量 ROI (产出能量 / 输入能量) ≥ 1、运营成本 ≤ 传统农业 1.5 倍、且在 ≥ 5 个不同气候带验证可行。',
    whyHard='能源成本、传粉困难。',
    aiPrompt='介绍 AeroFarms、Plenty。',
    tags=['农业', '城市', 'LED'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Vertical Farming', videoChannel='Kurzgesagt',
    participate=part(('experiment','小型水培'),
                  ('essay','介绍 AeroFarms 故事'))
)

add(
    id='lab-meat', category='engineering',
    title='细胞培养肉', titleEn='Cultured Meat',
    year=2013, proposer='M. Post', difficulty=3, reward=1500, status='partially_solved',
    summary='不杀动物就能吃到肉',
    kid='从动物身上取一小块肌肉细胞，在培养液里让它们长成肉。理论上能完全替代传统养殖业——零温室气体、零屠杀。',
    formal='>< 10 美元/公斤、规模化生产的细胞培养肉。',
    whyHard='培养液成本、规模化。',
    aiPrompt='介绍 Upside Foods、Good Meat。',
    tags=['食品', '工程', '伦理'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Cultured Meat', videoChannel='Kurzgesagt',
    participate=part(('fund','关注公司'),
                  ('essay','介绍细胞农业'))
)

add(
    id='synthetic-meat', category='engineering',
    title='植物肉升级', titleEn='Plant-based Meat 2.0',
    year=2016, proposer='Beyond Meat / Impossible', difficulty=2, reward=500, status='partially_solved',
    summary='让植物肉和真肉难以区分',
    kid='Beyond Meat、Impossible Foods 已经让植物汉堡在颜色、口感上和真肉很接近。能不能做到所有类型的肉？',
    formal='细胞培养肉：在 5 项感官测试（视觉/嗅觉/味觉/质地/咀嚼）中让 ≥ 80% 消费者无法区分真假、生产成本 ≤ 5 美元/kg、能量 ROI > 1、且无动物源成分。',
    whyHard='复杂肌肉纤维结构。',
    aiPrompt='介绍 Impossible 2.0。',
    tags=['食品', '植物', '工程'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Plant Meat', videoChannel='Kurzgesagt',
    participate=part(('fund','关注公司'),
                  ('essay','介绍植物肉发展史'))
)

add(
    id='plastic-enzyme', category='engineering',
    title='塑料吃酶规模化', titleEn='Plastic-Degrading Enzymes at Scale',
    year=2016, proposer='—', difficulty=3, reward=1500, status='open',
    summary='用酶把塑料变原料',
    kid='发现能吃 PET 的酶（PETase）后，怎么把它规模化到工业级别？',
    formal='PET/PE 降解酶工厂：单厂处理 ≥ 10 吨/天、成本 < 1 美元/公斤、产物单体纯度 ≥ 95% 可回用、且 1 美元投入产出 ≥ 1 美元价值产品。',
    whyHard='酶活性和稳定性。',
    aiPrompt='介绍 Carbios、Protein engineering。',
    tags=['环境', '工程', '酶'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Plastic Enzyme', videoChannel='Kurzgesagt',
    participate=part(('experiment','改造 PETase'),
                  ('essay','介绍 Carbios'))
)

add(
    id='self-driving-l5', category='engineering',
    title='L5 自动驾驶', titleEn='Level 5 Self-Driving',
    year=2004, proposer='—', difficulty=5, reward=3000, status='open',
    summary='完全不用人管的自动驾驶',
    kid='想象你坐上车，告诉它"回家"，它就真的安全把你带回家——不用你碰方向盘。L5 就是这个意思。现在所有自动驾驶都还需要人盯着。',
    formal='L5 自动驾驶：在所有合法路况、所有天气（雨/雪/雾/夜间）下不需人接管、事故率 < 人类驾驶员 1/10、并经 10⁹ 公里真实道路 + 10⁹ 公里仿真验证。',
    whyHard='长尾事件、伦理。',
    aiPrompt='介绍 Waymo、Tesla FSD、Mobileye。',
    tags=['AI', '汽车', '工程'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Self Driving', videoChannel='Kurzgesagt',
    participate=part(('code','用 CARLA 仿真'),
                  ('essay','介绍 Waymo 故事'),
                  ('fund','关注行业'))
)

add(
    id='drone-delivery', category='engineering',
    title='无人机物流', titleEn='Drone Delivery',
    year=2014, proposer='Amazon Prime Air', difficulty=2, reward=500, status='partially_solved',
    summary='让无人机送外卖',
    kid='用无人机送 30 公里内的快递，只需要 30 分钟。Amazon、Google Wing 已经在做。',
    formal='城市无人机物流：半径 ≥ 50 km、< 1 小时送达、单件成本 < 5 美元、载重 ≥ 5 kg、噪声 < 60 dB、且日均 ≥ 10⁴ 单次运行无重大事故。',
    whyHard='空中管制、载荷。',
    aiPrompt='介绍 Amazon Prime Air、Wing。',
    tags=['物流', '无人机', '工程'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Drone Delivery', videoChannel='Kurzgesagt',
    participate=part(('code','路径规划'),
                  ('essay','介绍无人机物流'))
)

add(
    id='modular-nuclear', category='engineering',
    title='模块化核反应堆', titleEn='Small Modular Reactor (SMR)',
    year=2010, proposer='—', difficulty=3, reward=2000, status='partially_solved',
    summary='小型化、工厂预制的核反应堆',
    kid='传统核电站 1000 兆瓦，建设 10 年。SMR 小于 300 兆瓦，工厂预制、现场拼装、成本低、建设快。NuScale、BWRX-300 等在发展中。',
    formal='小型模块化反应堆 (SMR)：单模块 ≤ 300 MWe、可批量工厂预制、建设周期 ≤ 36 个月、设计寿命 ≥ 60 年、被动安全（无需应急冷却）、且度电成本 ≤ 0.05 美元。',
    whyHard='许可和供应链。',
    aiPrompt='介绍 NuScale、TerraPower。',
    tags=['核', '能源', '工程'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='SMR', videoChannel='Kurzgesagt',
    participate=part(('essay','介绍 NuScale'),
                  ('fund','关注公司'))
)

add(
    id='tidal-energy', category='engineering',
    title='潮汐能规模化', titleEn='Tidal Energy',
    year=2000, proposer='—', difficulty=3, reward=1000, status='open',
    summary='用潮汐发电',
    kid='月球引力让海水每天涨落两次。能不能把这种力量变成电？潮汐能预测精准（不像太阳能、风能波动大）。',
    formal='潮汐能商业化：单机组 ≥ 100 MWe、年发电小时数 ≥ 4000 h、度电成本 ≤ 0.10 美元、对海洋生态影响最小化、且能承受 10 米浪高 + 强海流。',
    whyHard='海洋环境严酷。',
    aiPrompt='介绍 MeyGen、Sabella。',
    tags=['能源', '海洋', '工程'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Tidal Energy', videoChannel='Kurzgesagt',
    participate=part(('essay','介绍 MeyGen'),
                  ('fund','关注行业'))
)

add(
    id='geothermal', category='engineering',
    title='增强型地热', titleEn='Enhanced Geothermal Systems',
    year=1970, proposer='—', difficulty=3, reward=1500, status='open',
    summary='从干热岩提取能源',
    kid='地表下几公里温度 200-300°C。在花岗岩里打两口井、注水、从另一口取出热水。理论上全球 99% 地点都有这种能源。',
    formal='增强型地热 (EGS)：单井 ≥ 5-10 MWe、寿命 ≥ 30 年、钻井深度 ≤ 5 km、度电成本 ≤ 0.05 美元、且诱发地震控制 < M 3.0。',
    whyHard='水力压裂深度。',
    aiPrompt='介绍 EGS、Fervo。',
    tags=['能源', '地热', '工程'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Geothermal', videoChannel='Kurzgesagt',
    participate=part(('essay','介绍 Fervo 故事'),
                  ('fund','关注公司'))
)

add(
    id='solar-geoengineering', category='engineering',
    title='太阳地球工程', titleEn='Solar Geoengineering',
    year=2006, proposer='P. Crutzen', difficulty=4, reward=0, status='open',
    summary='用工程手段挡一部分阳光',
    kid='气候变暖是确定的。能不能向平流层注入反射粒子（像火山那样）挡掉 1% 阳光？气候模拟显示这能降温，但也会改变雨量。',
    formal='太阳地球工程 (SRM)：能抵消 ≥ 1°C 升温、可逆 (1 年内停止恢复)、对降水/生态系统影响最小、全球部署成本 ≤ 100 亿美元/年、且经国际治理框架授权。',
    whyHard='全球协调和副作用。',
    aiPrompt='介绍 Crutzen 2006、SPICE 项目。',
    tags=['气候', '工程', '伦理'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Solar Geoengineering', videoChannel='Kurzgesagt',
    participate=part(('essay','介绍气候工程'),
                  ('discuss','参与治理讨论'))
)


# ============= 社会 (Social) =============
add(
    id='poverty', category='social',
    title='消除贫困', titleEn='End Poverty',
    year=2000, proposer='UN Millennium Goals', difficulty=4, reward=2000, status='partially_solved',
    summary='让每个人都不再挨饿',
    kid='世界上还有 7 亿小朋友每天吃不饱饭、没学上、没干净水。30 年来极端贫困比例从 36% 降到 9%，但要彻底消除需要新办法。',
    formal='将极端贫困（< 1.90 美元/天）人口比例降到 1% 以下。',
    whyHard='贫困有复杂多维原因。',
    aiPrompt='介绍 GiveDirectly、有效利他主义。',
    tags=['贫困', '发展', '公益'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='End Poverty', videoChannel='Kurzgesagt',
    participate=part(('fund','给 GiveDirectly 捐'),
                  ('essay','介绍贫困经济学'),
                  ('community','参与社区服务'))
)

add(
    id='data-privacy', category='social',
    title='数据隐私保护', titleEn='Data Privacy Protection',
    year=2018, proposer='GDPR / 各国家立法', difficulty=4, reward=1500, status='open',
    summary='让数据可用不可见',
    kid='你用手机、用 APP、看网站，每天都会留下"数字脚印"。这些数据被谁在看？谁在卖？怎么让你享受 AI 便利，又不让别人偷看你的隐私？',
    formal='构建满足 (a) ε-差分隐私 (ε≤1)、(b) 同态加密或可信执行环境 (TEE) 隔离、(c) 用户可撤销授权的端到端数据流，使 95% 个人信息在采集、传输、训练、推断全链路不可被未授权第三方还原。',
    whyHard='可用性 vs 隐私的数学下界；TEE 侧信道攻击；跨司法管辖的数据流动。',
    aiPrompt='介绍差分隐私、同态加密、TEE、联邦学习、GDPR / 个人信息保护法。',
    tags=['隐私', '密码学', 'AI'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Data Privacy', videoChannel='Computerphile',
    participate=part(('code','差分隐私库实现'),
                  ('essay','介绍 GDPR 与个保法'),
                  ('kid-project','教小朋友密码学基础'))
)

add(
    id='sustainable-energy', category='social',
    title='全球能源转型', titleEn='Global Energy Transition',
    year=2015, proposer='Paris Agreement', difficulty=5, reward=0, status='partially_solved',
    summary='让 80 亿人都用清洁能源',
    kid='化石能源（煤、石油、天然气）让人类进步，但也让气候变坏。能不能让全世界 80 亿人都用上太阳能、风能、核能？需要在技术、政策、基础设施上同时发力。',
    formal='在 2050 年前全球净零 CO₂ 排放：年排放量 CO₂_eq ≤ GtCO₂/yr（净负）、且 80% 一次能源来自无碳源（可再生 + 核）、可由 IEA/UNFCCC 排放清单 + 能源平衡表逐年验证。',
    whyHard='政治意愿、资本。',
    aiPrompt='介绍 IEA NZE、Powering Past Coal Alliance。',
    tags=['能源', '气候', '政策'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Energy Transition', videoChannel='Kurzgesagt',
    participate=part(('fund','给清洁能源投资'),
                  ('community','参与本地能源项目'),
                  ('essay','介绍能源转型'))
)

add(
    id='education-reform', category='social',
    title='教育规模化个性化', titleEn='Personalized Education at Scale',
    year=2020, proposer='—', difficulty=4, reward=2000, status='open',
    summary='每个孩子都有"AI 私教"',
    kid='好的家教能根据你的特点调整教学，但好家教贵、不能普及。如果 AI 老师能理解每个孩子的水平、兴趣、状态，规模化提供一对一教育？',
    formal='AI 个性化教学系统在 1 项主效应指标（学习收益 effect size d ≥ 0.4，与 1-on-1 人类教师对照，N≥10000 随机对照试验，覆盖 K-12 全学段）+ 1 项社会指标（教育公平差距减小 ≥ 30%）上达到或超过 1 对 1 资深教师。',
    whyHard='情绪识别、知识表征。',
    aiPrompt='介绍 Khanmigo、Squirrel AI、可汗学院。',
    tags=['教育', 'AI', '社会'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Personalized Education', videoChannel='Kurzgesagt',
    participate=part(('code','用 GPT 教学助手'),
                  ('community','支教'),
                  ('essay','介绍教育创新'))
)

add(
    id='polarization', category='social',
    title='社会极化', titleEn='Societal Polarization',
    year=2016, proposer='—', difficulty=4, reward=0, status='open',
    summary='让社会重新能好好讨论',
    kid='你可能听过爸爸妈妈因为政治观点吵架。世界上很多国家都越来越"左 vs 右"，大家越来越不愿意听对方说话。怎么让社会重新能好好讨论？',
    formal='显著降低政治极化指数：(a) Pew Political Typology 中「敌对阵营」比例下降 ≥ 30%，(b) 跨党派政策共识度 r ≥ 0.5，(c) 选举暴力事件下降 ≥ 50%，通过 ≥ 5 个 OECD 国家 10 年纵向研究验证。',
    whyHard='算法推荐、回声室效应。',
    aiPrompt='介绍 Habermas、Braver Angels。',
    tags=['社会', '政治', '心理'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Polarization', videoChannel='Kurzgesagt',
    participate=part(('community','参与对话活动'),
                  ('essay','介绍极化研究'),
                  ('discuss','走出回声室'))
)

add(
    id='longevity-equity', category='social',
    title='延寿公平性', titleEn='Longevity Equity',
    year=2025, proposer='—', difficulty=4, reward=0, status='open',
    summary='让延寿技术惠及所有人',
    kid='如果有一天医学能让人活 150 岁，谁先用？富人和穷人之间的寿命差会不会变得更大？我们需要在技术成熟前就设计好制度。',
    formal='全球预期寿命差距：(a) 国家间最长寿-最短寿差 ≤ 10 年（目前 30+ 年），(b) 同一国家最高-最低收入组差 ≤ 5 年，(c) 由 WHO Global Health Observatory 数据验证。',
    whyHard='医药可及性。',
    aiPrompt='介绍寿命不平等、有效利他主义。',
    tags=['社会', '医学', '伦理'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Longevity', videoChannel='Kurzgesagt',
    participate=part(('essay','介绍延寿伦理'),
                  ('discuss','参与治理讨论'))
)

add(
    id='longtermism', category='social',
    title='长期主义决策', titleEn='Longtermist Decision-Making',
    year=2017, proposer='W. MacAskill 等', difficulty=4, reward=1000, status='open',
    summary='现在的决策如何考虑 1000 年后的人？',
    kid='我们今天建一个核废料仓库，要确保它 10 万年安全。10 万年后的人会怎么看我们？这种"想得很远"的思考方式叫长期主义。',
    formal='构造一个能在不确定未来下、可形式化的 longtermist 决策框架。',
    whyHard='预测未来 1000 年几乎不可能；代际公平。',
    aiPrompt='介绍 longtermism、MacAskill、effective altruism。',
    tags=['伦理', '长期', '决策'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Longtermism', videoChannel='Kurzgesagt',
    participate=part(('essay','介绍 MacAskill 工作'),
                  ('community','参与 EA 社区'),
                  ('fund','给长期主义项目捐资'))
)

# --- 新增社会 (18 个) ---
add(
    id='ubi', category='social',
    title='全民基本收入', titleEn='Universal Basic Income (UBI)',
    year=1960, proposer='M. Friedman / A. Miller', difficulty=4, reward=0, status='open',
    summary='每月给每个公民发钱？',
    kid='全民基本收入（UBI）让政府每月给每个公民发一笔够基本生活需要的钱。AI 取代人力后可能越来越需要。',
    formal='UBI 大规模长期试验：覆盖 ≥ 1000 人、≥ 5 年随机对照；测量 (a) 就业率变化 ≥ -5%（不显著下降）、(b) 主观幸福感 (SWLS) 提升 ≥ 10%、(c) 心理健康 (PHQ-9) 改善 ≥ 15%；通过 3 项独立研究复现。',
    whyHard='政治意愿和资金。',
    aiPrompt='介绍芬兰实验、肯尼亚 GiveDirectly。',
    tags=['经济', '政策', 'AI'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='UBI', videoChannel='Kurzgesagt',
    participate=part(('essay','介绍 UBI 历史'),
                  ('discuss','参与辩论'))
)

add(
    id='privacy-digital', category='social',
    title='数字时代隐私', titleEn='Privacy in Digital Age',
    year=2013, proposer='E. Snowden', difficulty=3, reward=0, status='open',
    summary='在数据经济中保护隐私',
    kid='2013 年 Snowden 揭露美国 NSA 大规模监控。我们每刷一下手机都被跟踪。怎么在数据经济和隐私间平衡？',
    formal='个人在数字生活中拥有有意义的信息控制权：(a) 99% 互联网用户能在 ≤ 5 步内导出/删除所有个人数据（GDPR Art. 15/17 验证），(b) 数据滥用投诉解决率 ≥ 90%、(c) 跨平台用户画像一致性可控（用户可见）。',
    whyHard='商业模式依赖数据。',
    aiPrompt='介绍 GDPR、CCPA。',
    tags=['社会', '法', '隐私'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Digital Privacy', videoChannel='Kurzgesagt',
    participate=part(('essay','介绍 Snowden 事件'),
                  ('community','参与隐私倡导'))
)

add(
    id='digital-democracy', category='social',
    title='数字民主', titleEn='Digital Democracy',
    year=2010, proposer='—', difficulty=3, reward=0, status='open',
    summary='用技术改进民主决策',
    kid='现在民主是"投票—选人—等人决定"，大多数人不参与。能不能用技术（在线讨论、抽签议会、AI 辅助审议）让民主更直接？',
    formal='数字民主对参与度/政策质量的影响：(a) 公民投票率提升 ≥ 20%（vs 对照组），(b) 政策质量评分 (专家盲评) 提升 ≥ 15%，(c) 弱势群体参与差距减小 ≥ 30%，通过 ≥ 5 个真实城市/州 5 年研究验证。',
    whyHard='安全性和规模。',
    aiPrompt='介绍 vTaiwan、Decidim、Pol.is。',
    tags=['社会', '政治', '技术'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Digital Democracy', videoChannel='Kurzgesagt',
    participate=part(('code','开源民主工具'),
                  ('community','参与公民审议'))
)

add(
    id='open-data', category='social',
    title='开放政府数据', titleEn='Open Government Data',
    year=2009, proposer='B. Obama', difficulty=2, reward=0, status='partially_solved',
    summary='让政府数据公开',
    kid='政府掌握大量数据（预算、空气质量、交通）。能不能全部公开让公众监督？data.gov 已经是先例。',
    formal='≥ 80% 国家级政府关键数据集（财政/环境/健康/教育/统计）实时（更新延迟 < 24h）公开、机器可读 (RDF/JSON/CSV)、且含完整元数据 (DCAT)、由 Open Data Barometer 或同等指数 ≥ 80/100 验证。',
    whyHard='安全和效率。',
    aiPrompt='介绍 Open Data Charter。',
    tags=['社会', '政府', '数据'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Open Data', videoChannel='Kurzgesagt',
    participate=part(('code','用政府数据做 app'),
                  ('community','参与公民项目'))
)

add(
    id='universal-health', category='social',
    title='全民医保', titleEn='Universal Healthcare',
    year=1948, proposer='WHO', difficulty=3, reward=0, status='open',
    summary='让每个人都能看病',
    kid='美国是发达国家中唯一没有全民医保的。每年有几十万人因费用放弃治疗。其他国家怎么做？中国新农合/医保是哪种？',
    formal='≥ 80% 国家实现 UHC：(a) 医保覆盖 ≥ 90% 人口、(b) 自费支出 < 30% 总医疗支出、(c) 必需医疗服务可及性 ≥ 80%、(d) 财务困难 (impoverishing expenditure) < 10% 家庭；由 WHO UHC Service Coverage Index ≥ 80 验证。',
    whyHard='政治意愿和资金。',
    aiPrompt='介绍 NHS、加拿大 Medicare、台湾全民健保。',
    tags=['社会', '医学', '政策'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Universal Healthcare', videoChannel='Kurzgesagt',
    participate=part(('essay','介绍各国医保制度'),
                  ('community','参与公益医疗'))
)

add(
    id='affordable-housing', category='social',
    title='可负担住房', titleEn='Affordable Housing',
    year=2020, proposer='—', difficulty=3, reward=0, status='open',
    summary='让每个家庭都有体面住房',
    kid='北上广深、香港、纽约、伦敦……大城市房价高得离谱。怎么让住房可负担？',
    formal='住房可负担：≥ 80% 中位数收入家庭住房成本 ≤ 30% 月收入（联合国定义）、无家可归率 < 0.1%、且由 OECD Affordable Housing Database 验证。',
    whyHard='土地稀缺和资本。',
    aiPrompt='介绍 Singapore HDB、Vienna social housing。',
    tags=['社会', '城市', '政策'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Housing', videoChannel='Kurzgesagt',
    participate=part(('essay','介绍各国住房政策'),
                  ('community','参与住房 NGO'))
)

add(
    id='remote-work', category='social',
    title='远程工作未来', titleEn='Future of Remote Work',
    year=2020, proposer='—', difficulty=3, reward=0, status='partially_solved',
    summary='远程工作是新常态',
    kid='2020 年新冠让远程工作爆发。三年后，是"回归办公室"还是"永远远程"？',
    formal='远程工作系统对生产率/社会凝聚的影响：(a) 远程团队生产率 ≥ 现场团队 (随机对照 d ≥ 0.0)、(b) 社会凝聚指标 (Putnam 社会资本指数) 下降 < 10%、(c) 心理健康指标 (GHQ-12) 恶化 < 5%；通过 ≥ 5 项独立研究验证。',
    whyHard='管理和社会资本。',
    aiPrompt='介绍 Microsoft Work Trend、Stanford WFH Research。',
    tags=['社会', '工作', '技术'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Remote Work', videoChannel='Kurzgesagt',
    participate=part(('essay','介绍远程工作研究'),
                  ('discuss','参与讨论'))
)

add(
    id='ai-governance', category='social',
    title='AI 治理', titleEn='AI Governance',
    year=2023, proposer='—', difficulty=5, reward=0, status='open',
    summary='如何让全球 AI 安全？',
    kid='AI 越来越强大。欧盟 AI Act、美国行政令、中国生成式 AI 管理办法——全球都在抢着立法。什么样的治理能真正让 AI 安全？',
    formal='建立全球协调、有约束力的 AI 治理框架：(a) 至少 G20 + 主要 AI 大国签署、(b) 对算力 ≥ 10²⁶ FLOP 训练要求强制安全评估 + 红队测试 + 事故报告、(c) 设立独立国际 AI 安全机构（类似 IAEA）、(d) 实施 ≥ 3 年且有约束力。',
    whyHard='地缘政治和快速变化的技术。',
    aiPrompt='介绍 EU AI Act、Bletchley Declaration。',
    tags=['社会', '政策', 'AI'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='AI Governance', videoChannel='Kurzgesagt',
    participate=part(('essay','介绍 AI 治理'),
                  ('community','参与公民倡导'))
)

add(
    id='bio-enhancement', category='social',
    title='生物增强伦理', titleEn='Bioenhancement Ethics',
    year=2000, proposer='—', difficulty=4, reward=0, status='open',
    summary='能让自己更聪明、更强、更长寿？',
    kid='CRISPR、Nootropics、脑刺激……能让人变得超常。但如果只有富人用得起，社会不平等更严重。',
    formal='对生物增强（基因/神经/认知）建立伦理与治理框架：(a) 至少 50 国家立法，(b) 同意机制 + 公平获取 + 不歧视 + 安全审查机制明确、(c) 长期跟踪登记制度 ≥ 10 年、(d) 公众咨询机制。',
    whyHard='定义、风险。',
    aiPrompt='介绍 Bostrom、Sandel。',
    tags=['社会', '伦理', '生物'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Bioenhancement', videoChannel='Kurzgesagt',
    participate=part(('essay','介绍增强伦理'),
                  ('discuss','参与讨论'))
)

add(
    id='climate-migration', category='social',
    title='气候移民', titleEn='Climate Migration',
    year=2050, proposer='—', difficulty=4, reward=0, status='open',
    summary='2050 年 10 亿人因气候背井离乡',
    kid='到 2050 年，世界银行估计有 2 亿人因海平面上升、干旱、极端天气成为"气候难民"。人类如何应对？',
    formal='全球协调、有尊严的气候移民框架：(a) 国际法律地位明确 (难民/补充保护/临时保护 之一)、(b) ≥ 50 国家签署、(c) 安置配额公平 (基于历史排放 + 接收能力)、(d) 移民权利保障 (工作/教育/医疗)。',
    whyHard='规模、政治。',
    aiPrompt='介绍 World Bank Groundswell 报告。',
    tags=['社会', '气候', '移民'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Climate Migration', videoChannel='Kurzgesagt',
    participate=part(('essay','介绍气候移民'),
                  ('community','参与援助'))
)

add(
    id='refugee', category='social',
    title='难民危机', titleEn='Refugee Crisis',
    year=2015, proposer='—', difficulty=3, reward=0, status='open',
    summary='让难民得到尊严',
    kid='2023 年全球 1.1 亿人流离失所（UNHCR）。叙利亚、乌克兰、缅甸……他们如何重新开始？',
    formal='全球难民安置：(a) 联合国难民署年安置需求满足率 ≥ 80%、(b) 第一年安置国家 ≥ 40 个且分配公平 (人均难民/接收国比例 σ/μ ≤ 0.3)、(c) 难民 5 年内经济自给率 ≥ 70%、(d) 身心健康指标 (WHO-5) ≥ 对照人群 90%。',
    whyHard='政治意愿。',
    aiPrompt='介绍 UNHCR、UN Global Compact on Refugees。',
    tags=['社会', '人道', '法'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Refugee', videoChannel='Kurzgesagt',
    participate=part(('fund','给 UNHCR 捐'),
                  ('community','参与志愿活动'))
)

# drug-policy, terrorism, criminal-justice, indigenous-rights, misinformation 已移除 —— 政治敏感
# (用户反馈：减少可能产生争议的问题；新替换为：data-privacy, aging-population, digital-divide)

add(
    id='aging-population', category='social',
    title='人口老龄化', titleEn='Aging Population',
    year=2015, proposer='UN / WHO', difficulty=4, reward=0, status='open',
    summary='让 10 亿老人活得健康、有尊严',
    kid='2025 年全球 65 岁以上老人首次超过 5 岁以下儿童。活得久是好消息，但养老金、医疗、陪伴怎么办？日本、德国、中国都面对这个问题。',
    formal='> 65+ 健康预期寿命 (HALE) 提升 ≥ 3 年 / 10 年；养老金替代率 ≥ 60% 且财政可持续；医疗 + 长期照护支出占 GDP 比例稳定 ≤ 8% 同时 HALE 继续增长（不存在"压缩" vs "扩张" 的权衡悖论）。',
    whyHard='生育率下行不可逆；劳动力-赡养比恶化；痴呆/慢病缺乏根治手段。',
    aiPrompt='介绍 WHO HALE、养老金三支柱、机器人护理、延缓衰老研究。',
    tags=['人口', '健康', '经济'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Aging Population', videoChannel='Kurzgesagt',
    participate=part(('community','陪伴独居老人'),
                  ('data','收集身边老人生活状况数据'),
                  ('essay','介绍 HALE 指标'))
)

add(
    id='education-access', category='social',
    title='教育公平', titleEn='Education Access',
    year=2000, proposer='UN Millennium', difficulty=3, reward=0, status='partially_solved',
    summary='让所有孩子都能上好学',
    kid='联合国目标 4：到 2030 年所有孩子都能上完免费、公平、优质的初等和中等教育。2600 万失学儿童中 59% 是撒哈拉以南的。',
    formal='全球教育公平：(a) 失学率 < 5%、(b) 学习质量达标率 (PISA/PIAAC 等) ≥ 80%、(c) 性别/城乡/收入差距缩小 ≥ 50%、(d) 由 UNESCO UIS 数据验证。',
    whyHard='战争、贫困、性别。',
    aiPrompt='介绍 UNESCO UIS、BRAC。',
    tags=['社会', '教育', '儿童'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Education Access', videoChannel='Kurzgesagt',
    participate=part(('fund','给 Room to Read 捐'),
                  ('community','参与支教'))
)

add(
    id='gender-equity', category='social',
    title='性别平等', titleEn='Gender Equity',
    year=1995, proposer='Beijing Declaration', difficulty=3, reward=0, status='open',
    summary='让所有人性别平等',
    kid='全球女性平均收入比男性少 23%，政治代表不到 30%，STEM 领域更少。SDG 5 致力于 2030 年实现性别平等。',
    formal='全球性别平等：(a) 性别收入差 < 10%、(b) 议会代表 ≥ 40%、(c) STEM 领域女性比例 ≥ 40%、(d) 性别暴力发生率下降 ≥ 50%；由 WEF Global Gender Gap Index ≥ 0.9 验证。',
    whyHard='文化和法律。',
    aiPrompt='介绍 UN Women、WEF Gender Gap。',
    tags=['社会', '性别', '人权'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Gender Equity', videoChannel='Kurzgesagt',
    participate=part(('essay','介绍性别研究'),
                  ('community','参与倡导'))
)

add(
    id='digital-divide', category='social',
    title='数字鸿沟', titleEn='Digital Divide',
    year=2000, proposer='OECD / ITU', difficulty=3, reward=800, status='open',
    summary='让 AI 红利不只属于会用的人',
    kid='有的老人不会用健康码、有的孩子家里没电脑上网课、有的山区连 4G 信号都没有。世界越数字化，不会用的人就越被甩开。怎么让所有人都能搭上数字化的车？',
    formal='> ITU IDI 指数 < 0.1（"已连接 vs 未连接"差距），按年龄/收入/城乡/性别/残障维度所有交叉子群的 IDI 都 ≥ 全球中位数 - 1σ。',
    whyHard='硬件成本、内容可达性、用户能力（不只是接入）、算法偏见。',
    aiPrompt='介绍 ITU IDI、可负担宽带 (USD/GDP)、数字扫盲、辅助技术 (a11y)、AI 公平性。',
    tags=['数字', '公平', 'AI'],
    videoUrl='https://www.youtube.com/embed/feature_video_placeholder', videoTitle='Digital Divide', videoChannel='Kurzgesagt',
    participate=part(('community','教长辈用智能手机'),
                  ('code','无障碍网页工具'),
                  ('essay','介绍 ITU IDI 指数'))
)

# 添加 6+ 个补充问题以达到 200+

add(
    id='levy-cuckoo', category='mathematics',
    title='Lévy 猜想', titleEn="Lévy's Conjecture",
    year=1955, proposer='P. Lévy', difficulty=3, reward=500, status='refuted',
    summary='某些泛函有 Borel 可测选择吗？',
    kid='Lévy 1955 年猜想：所有 Hilbert 空间之间的连续线性算子都有可测的右逆。已经被证明是错的，但相关变种仍有价值。',
    formal='每个 ℓ₂ → ℓ₂ 的线性算子是否有 Borel 选择子。',
    whyHard='需要集合论与泛函分析工具。',
    aiPrompt='介绍选择子与 Banach-Mazur 游戏。',
    tags=['分析', '泛函', '反驳'],
    videoUrl='', videoTitle='', videoChannel='',
    participate=part(('solve','尝试证明反例的简化'),
                  ('survey','读经典反驳论文'),
                  ('essay','介绍选择子'))
)

# 添加 6+ 个补充问题以达到 200+

add(
    id='union-closed', category='mathematics',
    title='并封闭集族猜想', titleEn='Union-Closed Sets Conjecture',
    year=1979, proposer='P. Frankl', difficulty=4, reward=0, status='open',
    summary='并封闭集族必有一个"多数元素"在过半集合里？',
    kid='给定一个"并封闭"的集合族 F（F 中任意两个集合的并还在 F 中），总存在一个元素 a 出现在至少一半的集合里。2015 年后部分进展。',
    formal='并封闭集族 F 必有 a ∈ ∪F 使 |{S ∈ F: a ∈ S}| ≥ |F|/2。',
    whyHard='看似组合直觉，但很难严格证明。',
    aiPrompt='介绍 Frankl 猜想。',
    tags=['组合', '集合', '猜想'],
    videoUrl='', videoTitle='', videoChannel='',
    participate=part(('solve','尝试证明 Frankl 猜想'),
                  ('code','用 SageMath 验证小例子'),
                  ('essay','介绍近年进展'))
)

add(
    id='smooth-4d-poincare', category='mathematics',
    title='光滑 4 维庞加莱猜想', titleEn='Smooth 4D Poincaré Conjecture',
    year=1982, proposer='M. Freedman', difficulty=5, reward=0, status='solved',
    summary='4 维光滑庞加莱猜想在维数上有点不同',
    kid='Freedman 1982 年证明拓扑版本的 4 维庞加莱猜想，但光滑版本仍未解。',
    formal='S^4 是否只在微分同胚意义下有光滑结构。',
    whyHard='4 维有无穷多"奇异光滑结构"。',
    aiPrompt='介绍 Freedman、Casson handle。',
    tags=['拓扑', '4 维', '光滑'],
    videoUrl='', videoTitle='', videoChannel='',
    participate=part(('survey','读 Freedman 工作'),
                  ('essay','介绍奇异光滑结构'))
)

add(
    id='rearrangement', category='chemistry',
    title='生物催化重排反应', titleEn='Biocatalytic Rearrangement',
    year=2010, proposer='—', difficulty=3, reward=1000, status='open',
    summary='用酶实现工业级重排反应',
    kid='Claisen 重排、Cope 重排等是有机合成重要反应，传统需要高温或重金属催化剂。酶能在室温水溶液中进行。',
    formal='开发 > 1000 turnovers 速率、> 100 g/L 底物负载的酶催化重排。',
    whyHard='酶活性位点设计。',
    aiPrompt='介绍生物催化与定向进化。',
    tags=['生物', '催化', '有机'],
    videoUrl='', videoTitle='', videoChannel='',
    participate=part(('experiment','定向进化酶'),
                  ('essay','介绍生物催化优势'))
)

add(
    id='ai-protein-halluc', category='biology',
    title='AI 蛋白质"幻觉"', titleEn='AI Protein Hallucination',
    year=2024, proposer='—', difficulty=3, reward=1000, status='open',
    summary='让 AI 设计自然界不存在的全新蛋白质',
    kid='AlphaFold 预测结构，但 RFdiffusion 真正"发明"全新蛋白质。2024 年 Baker 团队用 AI 设计了前所未有的功能蛋白质。',
    formal='AI 设计的蛋白质在湿实验中有 > 50% 的成功率。',
    whyHard='设计-表达-折叠-功能链条。',
    aiPrompt='介绍 RFdiffusion、Chroma。',
    tags=['AI', '蛋白质', '设计'],
    videoUrl='', videoTitle='', videoChannel='',
    participate=part(('code','用 RFdiffusion 设计'),
                  ('experiment','表达验证'),
                  ('essay','介绍 Baker 工作'))
)

add(
    id='voice-cloning-rights', category='social',
    title='语音克隆权', titleEn='Voice Cloning Rights',
    year=2024, proposer='—', difficulty=3, reward=0, status='open',
    summary='谁能用你的声音？',
    kid='AI 能在 3 秒音频就克隆你的声音。诈骗、假新闻、个人权利都受威胁。需要法律和技术保护。',
    formal='声音权利的法律和技术框架：(a) ≥ 30 国家立法明确声音作为人格权、(b) 同意机制 + 商用授权标准 (区块链时间戳 + 数字水印)、(c) 深度伪造检测准确率 ≥ 95%、(d) 司法救济机制（删除/赔偿/刑事）明确。',
    whyHard='法律滞后于技术。',
    aiPrompt='介绍 deepfake voice、SAG-AFTRA 罢工。',
    tags=['社会', 'AI', '权利'],
    videoUrl='', videoTitle='', videoChannel='',
    participate=part(('essay','介绍声音权'),
                  ('discuss','参与立法讨论'),
                  ('community','保护亲友不受 deepfake 诈骗'))
)

add(
    id='continual-learning', category='cs',
    title='持续学习', titleEn='Continual Learning',
    year=2010, proposer='—', difficulty=4, reward=2000, status='open',
    summary='AI 能不能一直学习不忘记？',
    kid='现在的 AI 学新东西会"灾难性遗忘"（比如学完法语忘英语）。持续学习让 AI 像人一样一辈子学。',
    formal='AI 系统能在学习新任务时不显著遗忘旧任务。',
    whyHard='需要平衡可塑性与稳定性。',
    aiPrompt='介绍 Elastic Weight Consolidation。',
    tags=['AI', '学习', '记忆'],
    videoUrl='', videoTitle='', videoChannel='',
    participate=part(('code','实现 EWC'),
                  ('essay','介绍持续学习挑战'))
)

add(
    id='molecular-medicine', category='chemistry',
    title='分子医学', titleEn='Precision Medicine',
    year=2015, proposer='—', difficulty=4, reward=2000, status='open',
    summary='让药对每个人都精准',
    kid='同样的药在 1000 个人里 800 人有效，200 人无效或副作用。能不能根据基因、肠道菌群精准开药？',
    formal='对任意基因变异型患者，基于基因组/蛋白质组学设计个性化药物或 RNA 治疗，在 III 期临床试验中 ≥ 80% 患者获得显著疗效 (RECIST 或等效指标)，且严重不良反应率 < 5%。',
    whyHard='多基因 + 环境因素。',
    aiPrompt='介绍 pharmacogenomics。',
    tags=['医学', '基因', '精准'],
    videoUrl='', videoTitle='', videoChannel='',
    participate=part(('code','基因组分析'),
                  ('essay','介绍精准医疗'))
)

add(
    id='sustainable-concrete', category='engineering',
    title='可持续混凝土', titleEn='Sustainable Concrete',
    year=2010, proposer='—', difficulty=3, reward=1500, status='partially_solved',
    summary='让水泥行业去碳化',
    kid='水泥生产贡献全球 7% CO₂。能用工业副产品（粉煤灰、矿渣）替代或用电弧炉？',
    formal='水泥/混凝土：生产 CO₂ 排放减少 ≥ 50%、成本 ≤ 传统水泥 1.2 倍、强度 ≥ 同等级普通水泥、且能大规模替代 (年产能 ≥ 10⁸ 吨)。',
    whyHard='材料性能。',
    aiPrompt='介绍 LC3、CarbonCure。',
    tags=['建筑', '工程', '气候'],
    videoUrl='', videoTitle='', videoChannel='',
    participate=part(('experiment','新型混凝土配方'),
                  ('essay','介绍 LC3 项目'))
)


# 输出脚本
if __name__ == '__main__':
    import json
    print(f"Total problems: {len(PROBLEMS)}")
    by_cat = {}
    for p in PROBLEMS:
        by_cat[p['category']] = by_cat.get(p['category'], 0) + 1
    for cat, cnt in sorted(by_cat.items()):
        print(f"  {cat}: {cnt}")
