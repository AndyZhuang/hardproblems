// 日本語 language pack
export default {
  __meta: { code: 'ja-JP', label: '日本語', short: '日' },

  common: {
    yes: 'はい',
    no: 'いいえ',
    cancel: 'キャンセル',
    confirm: '確認',
    save: '保存',
    submit: '送信',
    loading: '読み込み中…',
    retry: '再試行',
    back: '戻る',
    next: '次へ',
    prev: '前へ',
    search: '検索',
    filter: 'フィルター',
    sort: '並び替え',
    all: 'すべて',
    more: 'もっと見る',
    less: '閉じる',
    close: '閉じる',
    edit: '編集',
    delete: '削除',
    copy: 'コピー',
    share: '共有',
    minutesAgo: '{n}分前',
    hoursAgo: '{n}時間前',
    daysAgo: '{n}日前',
    online: 'オンライン',
    offline: 'オフライン'
  },

  nav: {
    home: 'ホーム',
    problems: '問題',
    leaderboard: 'ランキング',
    chain: 'チェーン',
    login: 'ログイン',
    register: '登録',
    logout: 'ログアウト',
    profile: 'プロフィール',
    language: '言語'
  },

  home: {
    title: 'AIで世界{count}の最も難しい{n}問を解く',
    subtitle: 'リーマンから室温超伝導まで、意識から核融合まで',
    desc: '誰でもAIで挑戦できます。すべての解答に{reward}。',
    reward: 'オンチェーンHPWポイント',
    cta: '解き始める →',
    ctaLeaderboard: 'ランキング',
    statsProblems: '問題',
    statsSolved: '解答',
    statsUsers: '解答者',
    statsRewards: 'HPW配布済み',
    categories: '{n}つの分野',
    categoriesDesc: '分野を選んで、人類がまだ解いていない問題を見てみよう',
    viewAll: 'すべての問題 →',
    liveOnChain: 'オンチェーン{txs}件 · {blocks}ブロック'
  },

  problems: {
    title: 'すべての難問',
    subtitle: '8つの分野にわたる{n}の挑戦',
    searchPlaceholder: '問題、タグ、キーワードを検索…',
    filterCategory: 'カテゴリー',
    filterStatus: 'ステータス',
    statusAll: 'すべて',
    statusOpen: '未解決',
    statusPartial: '部分解決',
    statusSolved: '解決済み',
    difficulty: '難易度',
    reward: '報酬',
    solutions: '解答',
    votes: 'ネット投票',
    tags: 'タグ',
    year: '年',
    proposer: '提案者',
    empty: '条件に一致する問題がありません'
  },

  problem: {
    back: '← 問題一覧に戻る',
    info: '情報',
    kidExplain: '子ども向け説明',
    formalStatement: '厳密な記述',
    whyHard: 'なぜ難しいか',
    howToEarn: 'ポイントの獲得方法',
    earnSubmit: '解答を送信: +{n} HPW',
    earnAi: 'AIスコア ≥ {n}: 1点ごとに +{m} HPW',
    earnVote: '高評価(各): 著者に +{n} HPW',
    earnFullSolve: '完全解決: 最大 {n} HPW',
    earnRule: 'すべてのポイントは5秒で自動ステーキング。永続的にオンチェーン。',
    aiSolver: 'AIアシスタント',
    aiSolverDesc: 'AIにあなたの視点を伝えてください。3層構造で回答: 入門 → 学術 → 研究の方向性。',
    aiUsingLLM: '実LLM使用',
    aiFallback: 'ヒューリスティック',
    userInputPlaceholder: '(任意) 例で説明?',
    runAi: 'AIに聞く',
    noSolution: 'まだ解答がありません。最初の一人になろう!',
    submitSolution: '解答を送信',
    submittedBy: 'by {user}',
    quality: 'AIスコア',
    selfTest: '私の解答'
  },

  submit: {
    title: '私の解答',
    contentPlaceholder: 'あなたの考えを書いてください。最低20文字。構造が良いほど高得点。',
    tooShort: '解答が短すぎます(最低20文字)',
    submitted: '送信しました!',
    submitFailed: '送信失敗: {msg}'
  },

  leaderboard: {
    title: 'ランキング',
    subtitle: 'オンチェーンHPWで並び替え。5秒ごとに新しいブロック。',
    solvers: '解答者',
    solutions: '総解答数',
    txOnChain: 'オンチェーンTX',
    height: 'チェーン高',
    rewardsPaid: '配布済み報酬',
    rank: '順位',
    score: 'ポイント',
    badges: 'バッジ',
    badgesTitle: '{n}段階のチャレンジバッジ'
  },

  chain: {
    title: 'ブロックチェーンエクスプローラー',
    subtitle: 'すべてのポイント取引は不変的にオンチェーン。ブロックをクリックして詳細を見る。',
    height: '高さ (ブロック)',
    totalTxs: '総TX数',
    totalSupply: '総供給量 (HPW)',
    valid: '有効',
    invalid: '無効',
    selectBlock: '左側のブロックをクリックして取引を表示',
    latestBlocks: '最新ブロック',
    latestTxs: '最新TX',
    txId: 'TX ID',
    type: 'タイプ',
    to: '送信先',
    amount: '金額',
    time: '時刻',
    empty: 'データなし'
  },

  auth: {
    title: '難問に参加',
    subtitle: 'アカウントを作成して解き始めよう',
    username: 'ユーザー名',
    usernameHint: '2-30文字、英数字、_, CJK, -',
    password: 'パスワード',
    passwordHint: '6-200文字',
    bio: '自己紹介 (任意)',
    bioHint: '最大200文字',
    register: '登録',
    login: 'ログイン',
    switchToLogin: 'アカウントをお持ちですか? ログイン',
    switchToRegister: 'アカウントがない? 登録',
    welcome: '登録で100 HPWボーナス',
    errUsername: 'ユーザー名は2-30文字',
    errPassword: 'パスワードは6-200文字',
    errTaken: 'ユーザー名は使用中',
    errWrong: 'ユーザー名またはパスワードが間違っています'
  },

  notFound: {
    title: '404 — ページが見つかりません',
    desc: 'お探しのページは存在しないか、まだインデックスされていません。{n}問の難問を見てみませんか?',
    home: '← ホーム',
    browse: '問題を閲覧',
    rank: 'ランキング'
  },

  pwa: {
    install: 'HardProblemsをデバイスにインストール',
    installShort: 'インストール',
    update: '新しいバージョンが利用可能',
    updateNow: '今すぐ更新',
    offline: 'オフライン · 一部機能利用不可'
  },

  categories: {
    mathematics: '数学',
    physics: '物理学',
    chemistry: '化学',
    biology: '生命科学',
    cs: '情報科学',
    philosophy: '哲学',
    engineering: '工学',
    social: '社会科学'
  }
};
