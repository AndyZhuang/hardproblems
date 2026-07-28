import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';

export default function Auth() {
  useDocumentTitle('登录 / 注册', '加入 HardProblems.World 开启你的硬问题之旅');
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
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-page py-12 max-w-md mx-auto">
      <div className="card">
        <h1 className="text-2xl font-display font-bold text-center mb-1">
          {mode === 'register' ? '加入解题者行列' : '欢迎回来'}
        </h1>
        <p className="text-center text-sm text-slate-400 mb-6">
          {mode === 'register' ? '注册即获 100 HPW + 独立区块链钱包' : '登录以继续解题'}
        </p>

        <div className="flex bg-white/5 rounded-lg p-1 mb-5">
          <button onClick={() => setMode('login')} className={`flex-1 py-1.5 rounded-md text-sm font-medium transition ${mode === 'login' ? 'bg-white text-slate-900' : 'text-slate-400'}`}>登录</button>
          <button onClick={() => setMode('register')} className={`flex-1 py-1.5 rounded-md text-sm font-medium transition ${mode === 'register' ? 'bg-white text-slate-900' : 'text-slate-400'}`}>注册</button>
        </div>

        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">用户名</label>
            <input
              type="text"
              className="input"
              value={form.username}
              onChange={e => setForm({ ...form, username: e.target.value })}
              required
              minLength={2}
              maxLength={30}
              autoFocus
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">密码</label>
            <input
              type="password"
              className="input"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              required
              minLength={6}
            />
          </div>
          {mode === 'register' && (
            <div>
              <label className="text-xs text-slate-400 mb-1 block">简介（可选）</label>
              <input
                type="text"
                className="input"
                value={form.bio}
                onChange={e => setForm({ ...form, bio: e.target.value })}
                placeholder="比如：数学博士 / 8 岁好奇宝宝 / AI 工程师"
                maxLength={100}
              />
            </div>
          )}
          {error && <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-2.5">{error}</div>}
          <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
            {loading ? '处理中…' : (mode === 'register' ? '创建账户 → 获得 100 HPW' : '登录')}
          </button>
        </form>

        <div className="mt-5 text-center text-xs text-slate-500">
          {mode === 'register' ? '已有账户？' : '还没账户？'}{' '}
          <button onClick={() => setMode(mode === 'register' ? 'login' : 'register')} className="text-violet-400 hover:text-violet-300">
            {mode === 'register' ? '去登录' : '去注册'}
          </button>
        </div>
      </div>

      <div className="mt-4 text-center text-xs text-slate-500">
        注册即表示你同意：你的解答会公开可见；你的积分会记在区块链上。
      </div>
    </div>
  );
}
