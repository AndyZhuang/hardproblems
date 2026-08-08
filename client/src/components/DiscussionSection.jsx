// 讨论区组件：嵌入 ProblemDetail，线程式回复 + 投票
import React, { useEffect, useState, useCallback } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import { useI18n } from '../lib/i18n';

function timeAgo(ts) {
  if (!ts || isNaN(ts)) return '';
  const t = typeof ts === 'number' ? ts : new Date(ts).getTime();
  if (isNaN(t)) return '';
  const diff = Date.now() - t;
  const s = Math.floor(diff / 1000);
  if (s < 60) return s + 's';
  const m = Math.floor(s / 60);
  if (m < 60) return m + 'm';
  const h = Math.floor(m / 60);
  if (h < 24) return h + 'h';
  const d = Math.floor(h / 24);
  if (d < 30) return d + 'd';
  return new Date(t).toISOString().slice(0, 10);
}

export default function DiscussionSection({ problemId }) {
  const { user } = useAuth();
  const { t } = useI18n();
  const [list, setList] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState('');
  const [posting, setPosting] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [replyDraft, setReplyDraft] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState('');

  const load = useCallback(async () => {
    if (!problemId) return;
    setLoading(true);
    try {
      const r = await api.listDiscussions(problemId);
      setList(r.discussions || []);
      setTotal(r.total || 0);
    } catch (e) {
      console.warn('load discussions:', e.message);
    } finally {
      setLoading(false);
    }
  }, [problemId]);

  useEffect(() => { load(); }, [load]);

  const submit = async (e) => {
    e?.preventDefault();
    if (!user) { alert(t('collab.loginRequired')); return; }
    if (!draft.trim()) return;
    setPosting(true);
    try {
      await api.createDiscussion({ problemId, content: draft });
      setDraft('');
      await load();
    } catch (e) {
      alert(e.message || 'failed');
    } finally {
      setPosting(false);
    }
  };

  const submitReply = async (parentId) => {
    if (!user) { alert(t('collab.loginRequired')); return; }
    if (!replyDraft.trim()) return;
    try {
      await api.createDiscussion({ problemId, content: replyDraft, parentId });
      setReplyDraft('');
      setReplyTo(null);
      await load();
    } catch (e) {
      alert(e.message);
    }
  };

  const vote = async (id, value) => {
    if (!user) { alert(t('collab.loginRequired')); return; }
    try {
      const next = list.find(d => d.id === id)?.myVote === value ? 0 : value;
      await api.voteDiscussion(id, next);
      await load();
    } catch (e) {
      alert(e.message);
    }
  };

  const onEdit = async (id) => {
    if (!editDraft.trim()) return;
    try {
      await api.editDiscussion(id, editDraft);
      setEditingId(null); setEditDraft('');
      await load();
    } catch (e) { alert(e.message); }
  };

  const onDelete = async (id) => {
    if (!confirm(t('collab.confirmDelete'))) return;
    try {
      await api.deleteDiscussion(id);
      await load();
    } catch (e) { alert(e.message); }
  };

  return (
    <section className="discussion-section">
      <div className="ds-header">
        <h3>💬 {t('collab.discussions')} <span className="ds-count">{total}</span></h3>
      </div>

      {user ? (
        <form className="ds-composer" onSubmit={submit}>
          <textarea
            placeholder={t('collab.startDiscussion')}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={3}
            maxLength={4000}
          />
          <div className="ds-composer-foot">
            <span className="ds-char-count">{draft.length}/4000</span>
            <button type="submit" disabled={posting || !draft.trim()}>
              {posting ? '...' : t('collab.post')}
            </button>
          </div>
        </form>
      ) : (
        <div className="ds-login-prompt">
          <span>{t('collab.loginToDiscuss')}</span>
        </div>
      )}

      {loading ? (
        <div className="ds-loading">{t('common.loading')}</div>
      ) : list.length === 0 ? (
        <div className="ds-empty">{t('collab.noDiscussions')}</div>
      ) : (
        <ul className="ds-list">
          {list.map(d => (
            <li key={d.id} className="ds-item">
              <div className="ds-vote-col">
                <button
                  className={'ds-vote-btn' + (d.myVote === 1 ? ' up active' : ' up')}
                  onClick={() => vote(d.id, 1)}
                  disabled={!user || d.user?.id === user.id}
                  title={t('collab.upvote')}
                >▲</button>
                <span className="ds-vote-score">{d.votesUp - d.votesDown}</span>
                <button
                  className={'ds-vote-btn' + (d.myVote === -1 ? ' down active' : ' down')}
                  onClick={() => vote(d.id, -1)}
                  disabled={!user || d.user?.id === user.id}
                  title={t('collab.downvote')}
                >▼</button>
              </div>
              <div className="ds-body">
                <div className="ds-meta">
                  <strong>{d.user?.username || '?'}</strong>
                  <span className="ds-time">{timeAgo(d.createdAt)}</span>
                  {d.edited && <span className="ds-edited">({t('collab.edited')})</span>}
                </div>
                {editingId === d.id ? (
                  <div className="ds-edit-form">
                    <textarea value={editDraft} onChange={e => setEditDraft(e.target.value)} rows={3} />
                    <button onClick={() => onEdit(d.id)}>{t('common.save')}</button>
                    <button onClick={() => { setEditingId(null); setEditDraft(''); }}>{t('common.cancel')}</button>
                  </div>
                ) : (
                  <div className="ds-content">{d.content}</div>
                )}
                <div className="ds-actions">
                  <button className="ds-link" onClick={() => {
                    if (!user) { alert(t('collab.loginRequired')); return; }
                    setReplyTo(replyTo === d.id ? null : d.id);
                    setReplyDraft('');
                  }}>{t('collab.reply')}</button>
                  {user && user.id === d.user?.id && (
                    <>
                      <button className="ds-link" onClick={() => {
                        setEditingId(d.id);
                        setEditDraft(d.content);
                      }}>{t('common.edit')}</button>
                      <button className="ds-link danger" onClick={() => onDelete(d.id)}>{t('common.delete')}</button>
                    </>
                  )}
                </div>
                {replyTo === d.id && (
                  <div className="ds-reply-form">
                    <textarea
                      placeholder={t('collab.replyPlaceholder')}
                      value={replyDraft}
                      onChange={e => setReplyDraft(e.target.value)}
                      rows={2}
                    />
                    <button onClick={() => submitReply(d.id)} disabled={!replyDraft.trim()}>{t('collab.post')}</button>
                    <button onClick={() => { setReplyTo(null); setReplyDraft(''); }}>{t('common.cancel')}</button>
                  </div>
                )}
                {d.replies && d.replies.length > 0 && (
                  <ul className="ds-replies">
                    {d.replies.map(r => (
                      <li key={r.id} className="ds-reply">
                        <div className="ds-meta">
                          <strong>{r.user?.username || '?'}</strong>
                          <span className="ds-time">{timeAgo(r.createdAt)}</span>
                          {r.edited && <span className="ds-edited">({t('collab.edited')})</span>}
                        </div>
                        <div className="ds-content">{r.content}</div>
                        <div className="ds-reply-foot">
                          <span className="ds-mini-vote">👍 {r.votesUp || 0} · 👎 {r.votesDown || 0}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
