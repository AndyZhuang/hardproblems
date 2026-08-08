// 团队列表页：按问题筛选 + 创建新团队
import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../lib/api';
import { PROBLEMS } from '../lib/problems';
import { useAuth } from '../hooks/useAuth';
import { useI18n } from '../lib/i18n';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

function timeAgo(ts) {
  const d = Math.floor((Date.now() - ts) / (1000 * 60 * 60 * 24));
  if (d > 30) return new Date(ts).toISOString().slice(0, 10);
  if (d > 0) return d + 'd ago';
  const h = Math.floor((Date.now() - ts) / (1000 * 60 * 60));
  if (h > 0) return h + 'h ago';
  return 'just now';
}

export default function Teams() {
  const [params, setParams] = useSearchParams();
  const problemId = params.get('problem') || '';
  const { user } = useAuth();
  const { t } = useI18n();
  const [list, setList] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createDesc, setCreateDesc] = useState('');
  const [creating, setCreating] = useState(false);

  useDocumentTitle('🤝 ' + t('collab.teams'));

  const load = useCallback(async () => {
    if (!problemId) {
      setList([]); setTotal(0);
      return;
    }
    setLoading(true);
    try {
      const r = await api.listTeams(problemId);
      setList(r.teams || []);
      setTotal(r.total || 0);
    } catch (e) {
      console.warn('load teams:', e.message);
    } finally {
      setLoading(false);
    }
  }, [problemId]);

  useEffect(() => { load(); }, [load]);

  const onProblemChange = (id) => {
    if (id) setParams({ problem: id });
    else setParams({});
  };

  const create = async (e) => {
    e?.preventDefault();
    if (!user) { alert(t('collab.loginRequired')); return; }
    if (!createName.trim()) return;
    setCreating(true);
    try {
      const r = await api.createTeam({ problemId, name: createName, description: createDesc });
      setShowCreate(false);
      setCreateName(''); setCreateDesc('');
      // 跳到团队详情
      window.location.href = '/teams/' + r.team.id;
    } catch (e) { alert(e.message); }
    finally { setCreating(false); }
  };

  const join = async (id) => {
    if (!user) { alert(t('collab.loginRequired')); return; }
    try {
      await api.joinTeam(id);
      window.location.href = '/teams/' + id;
    } catch (e) { alert(e.message); }
  };

  return (
    <div className="container-page py-8">
      <div className="flex items-baseline justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-3xl font-display font-extrabold">🤝 {t('collab.teams')}</h1>
        <p className="text-sm text-slate-400">{t('collab.teamsSubtitle')}</p>
      </div>

      <div className="card mb-6">
        <label className="block text-sm text-slate-300 mb-2">{t('collab.selectProblem')}</label>
        <select
          className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-slate-100"
          value={problemId}
          onChange={e => onProblemChange(e.target.value)}
        >
          <option value="">— {t('collab.chooseProblem')} —</option>
          {PROBLEMS.map(p => (
            <option key={p.id} value={p.id}>{p.title}</option>
          ))}
        </select>
      </div>

      {!problemId ? (
        <div className="card text-center py-12 text-slate-500">
          <div className="text-3xl mb-2">🔍</div>
          {t('collab.pickProblemFirst')}
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-slate-400">
              {t('collab.teamsFor')}: <b className="text-slate-200">{PROBLEMS.find(p => p.id === problemId)?.title}</b>
              {' · '}{total} {t('collab.teamsCount')}
            </span>
            {user && (
              <button
                onClick={() => setShowCreate(!showCreate)}
                className="px-4 py-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 text-sm font-medium"
              >
                {showCreate ? '×' : '+ ' + t('collab.createTeam')}
              </button>
            )}
          </div>

          {showCreate && (
            <form onSubmit={create} className="card mb-4 bg-emerald-500/5 border-emerald-500/20">
              <h3 className="text-lg font-bold text-emerald-200 mb-3">{t('collab.createTeam')}</h3>
              <input
                className="w-full px-3 py-2 mb-2 rounded-lg bg-white/5 border border-white/10 text-slate-100"
                placeholder={t('collab.teamNamePlaceholder')}
                value={createName}
                onChange={e => setCreateName(e.target.value)}
                maxLength={60}
              />
              <textarea
                className="w-full px-3 py-2 mb-2 rounded-lg bg-white/5 border border-white/10 text-slate-100"
                placeholder={t('collab.teamDescPlaceholder')}
                value={createDesc}
                onChange={e => setCreateDesc(e.target.value)}
                rows={2}
                maxLength={500}
              />
              <button
                type="submit"
                disabled={creating || !createName.trim()}
                className="px-4 py-2 rounded-lg bg-emerald-500 text-white text-sm font-medium disabled:opacity-50"
              >
                {creating ? '...' : t('collab.create')}
              </button>
            </form>
          )}

          {loading ? (
            <div className="card text-center py-8 text-slate-500">{t('common.loading')}</div>
          ) : list.length === 0 ? (
            <div className="card text-center py-12 text-slate-500">
              <div className="text-3xl mb-2">🌱</div>
              {t('collab.noTeamsYet')}
              {user && <p className="text-sm mt-2">{t('collab.beFirstToCreate')}</p>}
            </div>
          ) : (
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {list.map(team => (
                <li key={team.id} className="card hover:border-emerald-500/40 transition-colors">
                  <Link to={`/teams/${team.id}`} className="block">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-bold text-slate-100">{team.name}</h3>
                      {team.isLeader && <span className="badge bg-amber-500/15 text-amber-300">👑 {t('collab.leader')}</span>}
                      {team.isMember && !team.isLeader && <span className="badge bg-emerald-500/15 text-emerald-300">✓ {t('collab.member')}</span>}
                    </div>
                    {team.description && (
                      <p className="text-sm text-slate-400 mb-2 line-clamp-2">{team.description}</p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span>👥 {team.memberCount} {t('collab.members')}</span>
                      <span>· {timeAgo(team.createdAt)}</span>
                    </div>
                  </Link>
                  {user && !team.isMember && (
                    <button
                      onClick={() => join(team.id)}
                      className="mt-3 w-full py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-200 text-xs font-medium"
                    >
                      + {t('collab.joinTeam')}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
