// 简体中文语言包
export default {
  __meta: { code: 'zh-CN', label: '简体中文', short: '中' },

  // 通用
  common: {
    yes: '是',
    no: '否',
    cancel: '取消',
    confirm: '确认',
    save: '保存',
    submit: '提交',
    loading: '加载中…',
    retry: '重试',
    back: '返回',
    next: '下一步',
    prev: '上一步',
    search: '搜索',
    filter: '筛选',
    sort: '排序',
    all: '全部',
    more: '更多',
    less: '收起',
    close: '关闭',
    edit: '编辑',
    delete: '删除',
    copy: '复制',
    share: '分享',
    minutesAgo: '{n} 分钟前',
    hoursAgo: '{n} 小时前',
    daysAgo: '{n} 天前',
    online: '在线',
    offline: '离线'
  },

  // 导航
  nav: {
    home: '首页',
    problems: '硬问题',
    leaderboard: '排行榜',
    chain: '区块链',
    login: '登录',
    register: '注册',
    logout: '退出',
    profile: '我的',
    language: '语言'
  },

  // 首页
  home: {
    title: '用 AI 解决世界上最难的 {n} 个问题',
    subtitle: '从黎曼猜想到室温超导，从意识到本质到核聚变',
    desc: '每个小朋友都能用 AI 尝试解决，每个解答都获得{reward}奖励。',
    reward: '链上 HPW 积分',
    cta: '开始解题 →',
    ctaLeaderboard: '查看排行榜',
    statsProblems: '硬问题',
    statsSolved: '已提交解答',
    statsUsers: '解题者',
    statsRewards: 'HPW 已发放',
    categories: '{n} 大领域',
    categoriesDesc: '点击进入任一领域，看看人类还没解决的问题',
    viewAll: '全部问题 →',
    liveOnChain: '链上 {txs} 笔交易 · {blocks} 个区块'
  },

  // 问题列表
  problems: {
    title: '所有硬问题',
    subtitle: '{n} 个挑战，覆盖 8 个领域',
    searchPlaceholder: '搜索问题、标签、关键词…',
    filterCategory: '学科',
    filterStatus: '状态',
    statusAll: '全部',
    statusOpen: '未解',
    statusPartial: '部分解',
    statusSolved: '已解',
    difficulty: '难度',
    reward: '奖励',
    solutions: '解答',
    votes: '净投票',
    tags: '标签',
    year: '提出年份',
    proposer: '提出者',
    empty: '没找到匹配的问题'
  },

  // 问题详情
  problem: {
    back: '← 返回问题列表',
    info: '问题信息',
    kidExplain: '小朋友版解释',
    formalStatement: '严格陈述',
    whyHard: '为什么这么难',
    howToEarn: '怎么获得积分',
    earnSubmit: '提交任何解答：+{n} HPW',
    earnAi: 'AI 评分 ≥ {n}：每分 +{m} HPW',
    earnVote: '被点赞（每人每次）：+{n} HPW 给作者',
    earnFullSolve: '解难题：最高 {n} HPW',
    earnRule: '所有积分 5 秒自动上链，永久可查。',
    aiSolver: 'AI 助手解题',
    aiSolverDesc: '告诉 AI 你的想法或附加要求，AI 会按"科普 → 学术 → 思路"三层结构来解答这个问题。',
    aiUsingLLM: '调用真实 LLM',
    aiFallback: '启发式回退',
    userInputPlaceholder: '（可选）比如：用例子帮助理解？',
    runAi: '用 AI 解答',
    noSolution: '还没有解答，做第一个！',
    submitSolution: '提交解答',
    submittedBy: '由 {user} 提交',
    quality: 'AI 评分',
    selfTest: '我的解答'
  },

  // 提交
  submit: {
    title: '我的解答',
    contentPlaceholder: '把你想说的写下来。至少 20 字。结构越好分越高。',
    tooShort: '解答内容太短（至少 20 字）',
    submitted: '提交成功！',
    submitFailed: '提交失败：{msg}'
  },

  // 排行榜
  leaderboard: {
    title: '排行榜',
    subtitle: '按链上 HPW 积分排序。每 5 秒自动结算到新区块。',
    solvers: '解题者',
    solutions: '解答总数',
    txOnChain: '链上交易',
    height: '链高度',
    rewardsPaid: '已发奖励',
    rank: '排名',
    score: '积分',
    badges: '徽章',
    badgesTitle: '{n} 阶挑战者徽章'
  },

  // 区块链
  chain: {
    title: '区块链浏览器',
    subtitle: '每笔积分交易都不可篡改地上链。点击区块查看详情。',
    height: '链高度（区块）',
    totalTxs: '总交易（笔）',
    totalSupply: '总供应（HPW）',
    valid: '有效',
    invalid: '无效',
    selectBlock: '点左侧区块查看交易明细',
    latestBlocks: '最新区块',
    latestTxs: '最新交易',
    txId: '交易 ID',
    type: '类型',
    to: '接收方',
    amount: '金额',
    time: '时间',
    empty: '暂无数据'
  },

  // 登录/注册
  auth: {
    title: '加入硬问题',
    subtitle: '注册一个账号，开始你的硬问题之旅',
    username: '用户名',
    usernameHint: '2-30 字符，字母数字下划线中文横线',
    password: '密码',
    passwordHint: '6-200 字符',
    bio: '简介（可选）',
    bioHint: '最多 200 字符',
    register: '注册',
    login: '登录',
    switchToLogin: '已有账号？登录',
    switchToRegister: '没有账号？注册',
    welcome: '注册即送 100 HPW',
    errUsername: '用户名长度需在 2-30 之间',
    errPassword: '密码长度需在 6-200 之间',
    errTaken: '用户名已被占用',
    errWrong: '用户名或密码错误'
  },

  // 404
  notFound: {
    title: '404 — 这页走丢了',
    desc: '你要找的页面不存在，或者还没有被收录到 HardProblems 的索引里。不如去看看 {n} 个硬问题？',
    home: '← 回到首页',
    browse: '浏览问题',
    rank: '排行榜'
  },

  // PWA
  pwa: {
    install: '把 HardProblems 安装到桌面，随时查看',
    installShort: '安装到桌面',
    update: '新版本已就绪',
    updateNow: '立即更新',
    offline: '当前离线 · 部分功能不可用'
  },

  // 学科
  categories: {
    mathematics: '数学',
    physics: '物理',
    chemistry: '化学',
    biology: '生命科学',
    cs: '计算机',
    philosophy: '哲学',
    engineering: '工程',
    social: '社会'
  }
};
