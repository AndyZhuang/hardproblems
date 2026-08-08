// 团队详情页：成员 + 贡献
import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { PROBLEMS } from '../lib/problems';
import { useAuth } from '../hooks/useAuth';
import { useI18n } from '../lib/i18n';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

const ROLE_ICON = {
  leader: '👑',
  mentor: '🧙',
  researcher: '🔬',
  engineer: '🛠️',
  student: '🎓',
  observer: '👁️'
};

const ROLE_LABEL = {
  leader: '队长',
  mentor: '导师',
  researcher: '研究员',
  engineer: '工程师',
  student: '学生',
  observer: '观察者'
};

export default function TeamDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useI18n();
  const [team, setTeam] = useState(null);
  const [contributions, setContributions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');

  useDocumentTitle(team ? `🤝 ${team.name}` : 'Loading...');

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const r = await api.getTeam(id);
      setTeam(r.team);
      setContributions(r.contributions || []);
      setEditName(r.team.name);
      setEditDesc(r.team.description || '');
    } catch (e) {
      console.warn('load team:', e.message);
      if (String(e.message).includes('不存在') || String(e.message).includes('404')) {
        setTeam(null);
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const leave = async () => {
    if (!confirm(t('collab.confirmLeave'))) return;
    try {
      await api.leaveTeam(id);
      load();
    } catch (e) { alert(e.message); }
  };

  const disband = async () => {
    if (!confirm(t('collab.confirmDisband'))) return;
    try {
      await api.disbandTeam(id);
      navigate('/teams');
    } catch (e) { alert(e.message); }
  };

  const save = async () => {
    try {
      await api.updateTeam(id, { name: editName, description: editDesc });
      setEditing(false);
      load();
    } catch (e) { alert(e.message); }
  };

  if (loading) return <div className="container-page py-8 text-slate-500">{t('common.loading')}</div>;
  if (!team) return (
    <div className="container-page py-8">
      <div className="card text-center py-12 text-slate-500">
        <div className="text-3xl mb-2">😢</div>
        {t('collab.teamNotFound')}
        <div className="mt-4">
          <Link to="/teams" className="text-violet-400 hover:underline">← {t('collab.backToTeams')}</Link>
        </div>
      </div>
    </div>
  );

  const problem = PROBLEMS.find(p => p.id === team.problemId);

  return (
    <div className="container-page py-8">
      <Link to="/teams" className="text-sm text-slate-500 hover:text-slate-300">← {t('collab.backToTeams')}</Link>

      <div className="card mt-4 mb-6 bg-gradient-to-br from-emerald-500/5 to-cyan-500/5 border-emerald-500/20">
        {editing ? (
          <div className="space-y-2">
            <input
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xl font-bold"
              value={editName}
              onChange={e => setEditName(e.target.value)}
              maxLength={60}
            />
            <textarea
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10"
              value={editDesc}
              onChange={e => setEditDesc(e.target.value)}
              rows={2}
              maxLength={500}
            />
            <div className="flex gap-2">
              <button onClick={save} className="px-3 py-1.5 rounded-lg bg-emerald-500 text-white text-sm">{t('common.save')}</button>
              <button onClick={() => setEditing(false)} className="px-3 py-1.5 rounded-lg bg-white/5 text-sm">{t('common.cancel')}</button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-display font-extrabold">{team.name}</h1>
              {team.isLeader && <span className="badge bg-amber-500/15 text-amber-300">👑 {t('collab.youAreLeader')}</span>}
              {team.isMember && !team.isLeader && <span className="badge bg-emerald-500/15 text-emerald-300">✓ {t('collab.youAreMember')}</span>}
            </div>
            {team.description && <p className="text-slate-300 mb-3">{team.description}</p>}
            <div className="flex items-center gap-3 text-sm text-slate-400 flex-wrap">
              <span>📚 <Link to={`/problems/${team.problemId}`} className="text-emerald-300 hover:underline">{problem?.title || team.problemId}</Link></span>
              <span>· 👥 {team.memberCount} {t('collab.members')}</span>
              <span>· {new Date(team.createdAt).toLocaleDateString()}</span>
            </div>
            {user && (team.isMember || team.isLeader) && (
              <div className="mt-3 flex gap-2">
                {team.isLeader && (
                  <>
                    <button onClick={() => setEditing(true)} className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-sm">✎ {t('common.edit')}</button>
                    <button onClick={disband} className="px-3 py-1.5 rounded-lg bg-red-500/15 hover:bg-red-500/25 text-red-300 text-sm">🗑️ {t('collab.disband')}</button>
                  </>
                )}
                {!team.isLeader && (
                  <button onClick={leave} className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-sm">↩ {t('collab.leaveTeam')}</button>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h2 className="text-xl font-display font-bold mb-3">👥 {t('collab.members')} ({team.members.length})</h2>
          <ul className="space-y-2">
            {team.members.map(m => (
              <li key={m.userId} className="card flex items-center gap-3">
                <div className="text-2xl">{ROLE_ICON[m.role] || '👤'}</div>
                <div className="flex-1 min-w-0">
                  <Link to={`/u/${m.username}`} className="font-medium text-violet-300 hover:underline">{m.username}</Link>
                  <div className="text-xs text-slate-500">{ROLE_LABEL[m.role] || m.role}</div>
                </div>
                <div className="text-right text-xs text-slate-500">
                  <div>📝 {m.solutionsCount || 0}</div>
                  <div className="text-amber-300">⚡{m.totalScore || 0}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-display font-bold mb-3">📊 {t('collab.contributions')}</h2>
          {contributions.length === 0 ? (
            <div className="card text-center py-8 text-slate-500 text-sm">{t('collab.noContributions')}</div>
          ) : (
            <div className="card">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 text-xs">
                    <th className="pb-2">{t('collab.member')}</th>
                    <th className="pb-2 text-right">{t('collab.solutions')}</th>
                    <th className="pb-2 text-right">⚡ {t('collab.score')}</th>
                  </tr>
                </thead>
                <tbody>
                  {contributions.map(c => (
                    <tr key={c.userId} className="border-t border-white/5">
                      <td className="py-2 text-violet-300">{c.username}</td>
                      <td className="py-2 text-right font-mono">{c.solutionsCount || 0}</td>
                      <td className="py-2 text-right font-mono text-amber-300">{c.totalScore || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
