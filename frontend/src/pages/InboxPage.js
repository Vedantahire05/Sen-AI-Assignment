import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  UrgencyBadge, SentimentBadge, CategoryBadge, StatusBadge,
  TabBar, EmptyState, Spinner, Button, Card, SectionHeader, ConfidenceBar, ChurnRisk,
} from '../components/UI';
import AgentPanel from '../components/AgentPanel';
import StreamPanel from '../components/StreamPanel';
import { api } from '../utils/api';
import { toast } from '../components/UI';

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'human', label: 'Needs Human' },
  { key: 'replied', label: 'Auto-replied' },
  { key: 'escalated', label: 'Escalated' },
  { key: 'spam', label: 'Spam' },
];

function formatTime(ts) {
  if (!ts) return '—';
  const d = new Date(ts);
  const now = new Date();
  const diff = now - d;
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function EmailRow({ email, selected, onClick }) {
  const isSpam = email.category === 'Spam';
  const isCritical = email.urgency === 'Critical';
  return (
    <div
      onClick={onClick}
      style={{
        padding: '12px 20px', cursor: 'pointer', display: 'flex', gap: 14,
        alignItems: 'flex-start', borderBottom: '1px solid var(--border-subtle)',
        background: selected ? 'var(--bg-active)' : isCritical ? 'var(--critical-bg)' : 'transparent',
        borderLeft: selected ? '2px solid var(--accent)' : isCritical ? '2px solid var(--critical)' : '2px solid transparent',
        opacity: isSpam ? 0.6 : 1,
        transition: 'background 0.1s',
      }}
      onMouseEnter={e => { if (!selected) e.currentTarget.style.background = 'var(--bg-hover)'; }}
      onMouseLeave={e => { if (!selected) e.currentTarget.style.background = isCritical ? 'var(--critical-bg)' : 'transparent'; }}
    >
      {/* Urgency dot */}
      <div style={{
        width: 6, height: 6, borderRadius: '50%', flexShrink: 0, marginTop: 6,
        background: { Critical: 'var(--critical)', High: 'var(--high)', Medium: 'var(--medium)', Low: 'var(--low)' }[email.urgency] || 'var(--text-muted)',
      }} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 3 }}>
          <span style={{
            fontSize: 13, fontWeight: 600, color: 'var(--text-primary)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>{email.sender}</span>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>{formatTime(email.timestamp)}</span>
        </div>

        <div style={{
          fontSize: 12, color: 'var(--text-secondary)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 6,
        }}>{email.subject || '(no subject)'}</div>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          <CategoryBadge category={email.category} />
          <UrgencyBadge urgency={email.urgency} />
          <SentimentBadge sentiment={email.sentiment} />
          {email.status !== 'Received' && <StatusBadge status={email.status} />}
          {email.requiresHuman && (
            <span style={{ fontSize: 10, color: 'var(--high)', fontWeight: 600 }}>👤 Human</span>
          )}
        </div>
      </div>
    </div>
  );
}

function EmailDetail({ email, contact, agentRuns, onClose }) {
  if (!email) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px', borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'flex-start', gap: 12,
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6, lineHeight: 1.3 }}>
            {email.subject || '(no subject)'}
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>From: <span style={{ color: 'var(--text-secondary)' }}>{email.sender}</span></span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{formatTime(email.timestamp)}</span>
            <UrgencyBadge urgency={email.urgency} />
            <CategoryBadge category={email.category} />
            <SentimentBadge sentiment={email.sentiment} />
          </div>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 18, cursor: 'pointer', flexShrink: 0 }}>✕</button>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflow: 'auto', padding: '0 20px 20px' }}>
        {/* Email body */}
        <div style={{
          margin: '16px 0', padding: '16px', background: 'var(--bg-elevated)',
          border: '1px solid var(--border)', borderRadius: 'var(--radius)',
          fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.8, whiteSpace: 'pre-wrap',
        }}>{email.body || '(empty body)'}</div>

        {/* Classification details */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
          <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 14 }}>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Classification</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span style={{ color: 'var(--text-muted)' }}>Status</span>
                <StatusBadge status={email.status} />
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Confidence</span>
                </div>
                <ConfidenceBar value={email.confidence || 0} />
              </div>
              {email.escalationReason && (
                <div style={{ fontSize: 11, color: 'var(--high)', background: 'var(--high-bg)', padding: '6px 10px', borderRadius: 6 }}>
                  ⚠ {email.escalationReason}
                </div>
              )}
            </div>
          </div>

          <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 14 }}>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Entities</div>
            {email.detectedEntities && Object.entries(email.detectedEntities).some(([, v]) => v?.length > 0) ? (
              Object.entries(email.detectedEntities).filter(([, v]) => v?.length > 0).map(([key, vals]) => (
                <div key={key} style={{ marginBottom: 6 }}>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 3 }}>{key.replace('_', ' ')}</div>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {vals.map((v, i) => (
                      <code key={i} style={{ fontSize: 10, background: 'var(--accent-glow)', color: 'var(--accent)', padding: '1px 6px', borderRadius: 3 }}>{v}</code>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>No entities detected</div>
            )}
          </div>
        </div>

        {/* Suggested reply */}
        {email.suggestedReply && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Suggested Reply</div>
            <div style={{
              padding: '12px 16px', background: 'rgba(76,175,130,0.05)',
              border: '1px solid rgba(76,175,130,0.2)', borderRadius: 'var(--radius)',
              fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7,
            }}>{email.suggestedReply}</div>
          </div>
        )}

        {/* Contact card */}
        {contact && (
          <div style={{ marginBottom: 20, background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 14 }}>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Contact</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span style={{ color: 'var(--text-muted)' }}>{contact.contact?.company || contact.email}</span>
                <span style={{
                  fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 100,
                  background: contact.contact?.status === 'VIP' ? 'rgba(232,200,74,0.15)' : 'var(--bg-hover)',
                  color: contact.contact?.status === 'VIP' ? 'var(--medium)' : 'var(--text-muted)',
                }}>{contact.contact?.status}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span style={{ color: 'var(--text-muted)' }}>Account value</span>
                <span style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                  ${(contact.contact?.accountValue || 0).toLocaleString()}
                </span>
              </div>
              <ChurnRisk score={contact.contact?.churnRiskScore} label={contact.contact?.churnRiskLabel} />
            </div>
          </div>
        )}

        {/* Agent panel */}
        <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 16 }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Agent reasoning
          </div>
          <AgentPanel emailId={email._id} emailUrgency={email.urgency} />
        </div>
      </div>
    </div>
  );
}

export default function InboxPage({ isLive, setIsLive, reloadStats }) {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');
  const [selected, setSelected] = useState(null);
  const [contact, setContact] = useState(null);
  const [search, setSearch] = useState('');
  const [newCount, setNewCount] = useState(0);
  const socketRef = useRef(null);

  const load = useCallback(async () => {
    try {
      // Load all emails from threads endpoint via stats, then fetch from multiple threads
      // Use stream/status for email counts and get emails via a broader fetch
      const [statusRes] = await Promise.allSettled([api.streamStatus()]);
      // Fetch recent emails via a direct approach — get all known thread IDs from stats
      // Since we don't have a direct /emails endpoint, use the stream status + contacts
      const contactsRes = await api.contacts({ limit: 100 });
      
      // Load emails for each contact (up to 20 most recent)
      if (contactsRes.contacts && contactsRes.contacts.length > 0) {
        const emailPromises = contactsRes.contacts.slice(0, 30).map(c =>
          api.threadByEmail(c.email).catch(() => null)
        );
        const results = await Promise.allSettled(emailPromises);
        const allEmails = [];
        results.forEach(r => {
          if (r.status === 'fulfilled' && r.value?.emails) {
            allEmails.push(...r.value.emails);
          }
        });
        // Sort by timestamp desc
        allEmails.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        // Deduplicate by _id
        const seen = new Set();
        const unique = allEmails.filter(e => {
          if (seen.has(e._id)) return false;
          seen.add(e._id);
          return true;
        });
        setEmails(unique);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // WebSocket for live updates
  useEffect(() => {
    try {
      const { io } = require('socket.io-client');
      const socket = io('http://localhost:5000', { transports: ['websocket', 'polling'] });
      socketRef.current = socket;
      socket.on('email_ingested', (data) => {
        if (!data.duplicate) {
          setNewCount(c => c + 1);
          // Refresh after a short delay to allow backend processing
          setTimeout(() => {
            load();
            reloadStats?.();
          }, 1000);
        }
      });
      socket.on('stream_complete', () => {
        load();
        reloadStats?.();
        toast('Stream complete — inbox updated', 'success');
      });
      return () => socket.disconnect();
    } catch (e) {}
  }, [load, reloadStats]);

  // Load contact when email selected
  useEffect(() => {
    if (!selected) { setContact(null); return; }
    api.contact(selected.sender).then(setContact).catch(() => setContact(null));
  }, [selected]);

  const filtered = emails.filter(e => {
    const matchTab =
      tab === 'all' ? true :
      tab === 'human' ? e.requiresHuman :
      tab === 'replied' ? e.status === 'Replied' :
      tab === 'escalated' ? e.status === 'Escalated' :
      tab === 'spam' ? e.category === 'Spam' : true;

    const matchSearch = !search || [e.sender, e.subject, e.body].join(' ').toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  const tabsWithCounts = TABS.map(t => ({
    ...t,
    count: t.key === 'all' ? emails.length
      : t.key === 'human' ? emails.filter(e => e.requiresHuman).length
      : t.key === 'replied' ? emails.filter(e => e.status === 'Replied').length
      : t.key === 'escalated' ? emails.filter(e => e.status === 'Escalated').length
      : t.key === 'spam' ? emails.filter(e => e.category === 'Spam').length
      : 0,
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Top bar */}
      <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.3px' }}>Mission Control</h1>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
              {emails.length} emails
              {newCount > 0 && (
                <span style={{ marginLeft: 8, color: 'var(--positive)', fontWeight: 600 }}>
                  +{newCount} new
                </span>
              )}
            </div>
          </div>
          <Button onClick={() => { load(); setNewCount(0); }} variant="ghost" size="sm">Refresh</Button>
        </div>
        <StreamPanel isLive={isLive} setIsLive={setIsLive} onDone={() => { load(); reloadStats?.(); setNewCount(0); }} />
      </div>

      {/* Content */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Email list */}
        <div style={{ width: selected ? 360 : '100%', flexShrink: 0, display: 'flex', flexDirection: 'column', borderRight: selected ? '1px solid var(--border)' : 'none', overflow: 'hidden' }}>
          {/* Search + tabs */}
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search emails…"
              style={{
                width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius)', padding: '8px 12px', fontSize: 13,
                color: 'var(--text-primary)', outline: 'none',
              }}
            />
            <div style={{ overflowX: 'auto' }}>
              <TabBar tabs={tabsWithCounts} active={tab} onChange={setTab} />
            </div>
          </div>

          {/* List */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spinner /></div>
            ) : filtered.length === 0 ? (
              <EmptyState icon="📭" title="No emails" subtitle={search ? 'Try a different search' : 'Stream the dataset to load emails'} />
            ) : (
              filtered.map(email => (
                <EmailRow
                  key={email._id}
                  email={email}
                  selected={selected?._id === email._id}
                  onClick={() => setSelected(selected?._id === email._id ? null : email)}
                />
              ))
            )}
          </div>
        </div>

        {/* Detail panel */}
        {selected && (
          <div style={{ flex: 1, overflow: 'hidden', animation: 'slide-in 0.15s ease' }}>
            <EmailDetail
              email={selected}
              contact={contact}
              onClose={() => setSelected(null)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
