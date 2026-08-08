// 路线图时间线组件
import React, { useEffect, useState, useCallback } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import { useI18n } from '../lib/i18n';

const REACTIONS = [
  { key: 'like', icon: '👍', label: 'like' },
  { key: 'fire', icon: '🔥', label: 'fire' },
  { key: 'bulb', icon: '💡', label: 'bulb' },
  { key: 'rocket', icon: '🚀', label: 'rocket' },
  { key: 'eyes', icon: '👀', label: 'eyes' }
];

const STATUS_META = {
  proposed:    { icon: '🌱', zh: '提议', en: 'Proposed', es: 'Propuesto', ja: '提案' },
  exploring:   { icon: '🔍', zh: '探索中', en: 'Exploring', es: 'Explorando', ja: '調査中' },
  in_progress: { icon: '⚙️', zh: '进行中', en: 'In Progress', es: 'En curso', ja: '進行中' },
  breakthrough:{ icon: '💥', zh: '突破', en: 'Breakthrough', es: 'Avance', ja: '突破' },
  blocked:     { icon: '⛔', zh: '受阻', en: 'Blocked', es: 'Bloqueado', ja: '受阻' },
  done:        { icon: '✅', zh: '完成', en: 'Done', es: 'Hecho', ja: '完了' }
};

function statusLabel(status, lang) {
  const meta = STATUS_META[status] || STATUS_META.proposed;
  if (lang === 'zh-CN') return meta.zh;
  if (lang === 'es-ES') return meta.es;
  if (lang === 'ja-JP') return meta.ja;
  return meta.en;
}

function timeAgo(ts) {
  if (!ts || isNaN(ts)) return '';
  const t = typeof ts === 'number' ? ts : new Date(ts).getTime();
  if (isNaN(t)) return '';
  const diff = Date.now() - t;
  const d = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (d > 30) return new Date(t).toISOString().slice(0, 10);
  if (d > 0) return d + 'd';
  const h = Math.floor(diff / (1000 * 60 * 60));
  if (h > 0) return h + 'h';
  const m = Math.floor(diff / (1000 * 60));
  if (m > 0) return m + 'm';
  return 'now';
}

export default function Roadmap({ problemId }) {
  const { user } = useAuth();
  const { t, lang } = useI18n();
  const [entries, setEntries] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [draftTitle, setDraftTitle] = useState('');
  const [draftDesc, setDraftDesc] = useState('');
  const [draftStatus, setDraftStatus] = useState('proposed');
  const [posting, setPosting] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const load = useCallback(async () => {
    if (!problemId) return;
    setLoading(true);
    try {
      const r = await api.listRoadmap(problemId);
      setEntries(r.entries || []);
      setTotal(r.total || 0);
    } catch (e) {
      console.warn('load roadmap:', e.message);
    } finally {
      setLoading(false);
    }
  }, [problemId]);

  useEffect(() => { load(); }, [load]);

  const submit = async (e) => {
    e?.preventDefault();
    if (!user) { alert(t('collab.loginRequired')); return; }
    if (!draftTitle.trim()) return;
    setPosting(true);
    try {
      await api.createRoadmap({
        problemId, title: draftTitle, description: draftDesc, status: draftStatus
      });
      setDraftTitle(''); setDraftDesc(''); setDraftStatus('proposed');
      await load();
    } catch (e) { alert(e.message); }
    finally { setPosting(false); }
  };

  const react = async (id, value) => {
    if (!user) { alert(t('collab.loginRequired')); return; }
    try {
      const entry = entries.find(e => e.id === id);
      const next = entry?.myReactions?.includes(value) ? null : value;
      await api.reactRoadmap(id, next);
      await load();
    } catch (e) { alert(e.message); }
  };

  const changeStatus = async (id, status) => {
    try {
      await api.updateRoadmap(id, { status });
      await load();
    } catch (e) { alert(e.message); }
  };

  const onDelete = async (id) => {
    if (!confirm(t('collab.confirmDelete'))) return;
    try {
      await api.deleteRoadmap(id);
      await load();
    } catch (e) { alert(e.message); }
  };

  return (
    <section className="roadmap-section">
      <div className="rm-header">
        <h3>🗺️ {t('collab.roadmap')} <span className="rm-count">{total}</span></h3>
        <p className="rm-subtitle">{t('collab.roadmapSubtitle')}</p>
      </div>

      {user ? (
        <form className="rm-composer" onSubmit={submit}>
          <input
            className="rm-title-input"
            placeholder={t('collab.roadmapTitlePlaceholder')}
            value={draftTitle}
            onChange={e => setDraftTitle(e.target.value)}
            maxLength={120}
          />
          <textarea
            className="rm-desc-input"
            placeholder={t('collab.roadmapDescPlaceholder')}
            value={draftDesc}
            onChange={e => setDraftDesc(e.target.value)}
            rows={2}
            maxLength={1000}
          />
          <div className="rm-composer-foot">
            <select value={draftStatus} onChange={e => setDraftStatus(e.target.value)}>
              {Object.keys(STATUS_META).map(s => (
                <option key={s} value={s}>{STATUS_META[s].icon} {statusLabel(s, lang)}</option>
              ))}
            </select>
            <button type="submit" disabled={posting || !draftTitle.trim()}>
              {posting ? '...' : t('collab.addEntry')}
            </button>
          </div>
        </form>
      ) : (
        <div className="rm-login-prompt">
          <span>{t('collab.loginToContribute')}</span>
        </div>
      )}

      {loading ? (
        <div className="rm-loading">{t('common.loading')}</div>
      ) : entries.length === 0 ? (
        <div className="rm-empty">{t('collab.noRoadmap')}</div>
      ) : (
        <ol className="rm-timeline">
          {entries.map(e => (
            <li key={e.id} className={'rm-item status-' + e.status}>
              <div className="rm-dot" />
              <div className="rm-card">
                <div className="rm-card-head">
                  <span className="rm-status-badge">
                    {STATUS_META[e.status]?.icon} {statusLabel(e.status, lang)}
                  </span>
                  <span className="rm-time">{timeAgo(e.createdAt)}</span>
                </div>
                <h4 className="rm-title">{e.title}</h4>
                {e.description && <p className="rm-desc">{e.description}</p>}
                <div className="rm-card-foot">
                  <span className="rm-author">👤 {e.user?.username}</span>
                  <div className="rm-reactions">
                    {REACTIONS.map(r => {
                      const cnt = e.reactions?.[r.key] || 0;
                      const active = e.myReactions?.includes(r.key);
                      return (
                        <button
                          key={r.key}
                          className={'rm-react' + (active ? ' active' : '')}
                          onClick={() => react(e.id, r.key)}
                          disabled={!user}
                          title={r.label}
                        >
                          <span className="rm-react-icon">{r.icon}</span>
                          {cnt > 0 && <span className="rm-react-count">{cnt}</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
                {user && user.id === e.user?.id && (
                  <div className="rm-card-actions">
                    <select
                      value={e.status}
                      onChange={ev => changeStatus(e.id, ev.target.value)}
                    >
                      {Object.keys(STATUS_META).filter(s => s !== e.status).map(s => (
                        <option key={s} value={s}>{STATUS_META[s].icon} {statusLabel(s, lang)}</option>
                      ))}
                    </select>
                    <button className="rm-link danger" onClick={() => onDelete(e.id)}>×</button>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
