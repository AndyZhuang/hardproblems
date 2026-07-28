import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import { useI18n, t } from '../lib/i18n.js';

export default function Auth() {
  const { lang } = useI18n();
  useDocumentTitle(
    lang === 'zh-CN' ? '登录 / 注册' : 'Log in / Sign up',
    lang === 'zh-CN' ? '加入 HardProblems.World 开启你的硬问题之旅' : 'Join HardProblems.World and start solving'
  );
  const [mode, setMode] = useState('register');
  const { register, login, user } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ username: '', password: '', bio: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) {
    nav('/');
    return null;
  }

  const isZh = lang === 'zh-CN';
  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'register') {
        await register(form);
      } else {
        await login({ username: form.username, password: form.password });
      }
      nav('/');
    } catch (e) {
      // 尝试翻译常见错误
      let msg = e.message;
      if (msg.includes('用户名已被占用')) msg = t('auth.errTaken');
      else if (msg.includes('用户名只能包含')) msg = t('auth.errUsername');
      else if (msg.includes('密码长度')) msg = t('auth.errPassword');
      else if (msg.includes('用户名或密码错误')) msg = t('auth.errWrong');
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-page py-12 max-w-md mx-auto">
      <div className="card">
        <h1 className="text-2xl font-display font-bold text-center mb-1">
          {mode === 'register' ? t('auth.title') : (isZh ? '欢迎回来' : 'Welcome back')}
        </h1>
        <p className="text-center text-sm text-slate-400 mb-6">
          {mode === 'register' ? t('auth.subtitle') : (isZh ? '登录以继续解题' : 'Log in to continue')}
        </p>

        <div className="flex bg-white/5 rounded-lg p-1 mb-5">
          <button onClick={() => setMode('login')} className={`flex-1 py-1.5 rounded-md text-sm font-medium transition ${mode === 'login' ? 'bg-white text-slate-900' : 'text-slate-400'}`}>{t('auth.login')}</button>
          <button onClick={() => setMode('register')} className={`flex-1 py-1.5 rounded-md text-sm font-medium transition ${mode === 'register' ? 'bg-white text-slate-900' : 'text-slate-400'}`}>{t('auth.register')}</button>
        </div>

        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">{t('auth.username')}</label>
            <input
              type="text"
              className="input"
              value={form.username}
              onChange={e => setForm({ ...form, username: e.target.value })}
              placeholder={isZh ? '字母数字下划线' : 'alphanumeric, _'}
              required
              minLength={2}
              maxLength={30}
              autoFocus
            />
            <div className="text-[10px] text-slate-500 mt-1">{t('auth.usernameHint')}</div>
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">{t('auth.password')}</label>
            <input
              type="password"
              className="input"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              required
              minLength={6}
            />
            <div className="text-[10px] text-slate-500 mt-1">{t('auth.passwordHint')}</div>
          </div>
          {mode === 'register' && (
            <div>
              <label className="text-xs text-slate-400 mb-1 block">{t('auth.bio')}</label>
              <input
                type="text"
                className="input"
                value={form.bio}
                onChange={e => setForm({ ...form, bio: e.target.value })}
                placeholder={isZh ? '比如：数学博士 / 8 岁好奇宝宝 / AI 工程师' : 'e.g. Math PhD / 8yo curious / AI engineer'}
                maxLength={100}
              />
            </div>
          )}
          {error && <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-2.5">{error}</div>}
          <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
            {loading ? t('common.loading') : (mode === 'register' ? (isZh ? '创建账户 → 获得 100 HPW' : 'Create account · get 100 HPW') : t('auth.login'))}
          </button>
        </form>

        <div className="mt-5 text-center text-xs text-slate-500">
          {mode === 'register' ? (isZh ? '已有账户？' : 'Have an account?') : (isZh ? '还没账户？' : 'No account?')}{' '}
          <button onClick={() => setMode(mode === 'register' ? 'login' : 'register')} className="text-violet-400 hover:text-violet-300">
            {mode === 'register' ? t('auth.login') : t('auth.register')}
          </button>
        </div>
      </div>

      <div className="mt-4 text-center text-xs text-slate-500">
        {isZh
          ? '注册即表示你同意：你的解答会公开可见；你的积分会记在区块链上。'
          : 'By signing up you agree: your solutions are public, your points are on-chain.'}
      </div>
    </div>
  );
}
