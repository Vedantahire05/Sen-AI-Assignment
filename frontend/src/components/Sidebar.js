import React from 'react';
import { LiveDot } from './UI';

const NAV = [
  { key: 'inbox',     label: 'Inbox',      icon: '◉' },
  { key: 'analytics', label: 'Analytics',  icon: '▦' },
  { key: 'contacts',  label: 'Contacts',   icon: '⊞' },
  { key: 'rag',       label: 'RAG Debug',  icon: '⊛' },
];

export default function Sidebar({ page, setPage, stats, isLive }) {
  return (
    <aside style={{
      width: 220, flexShrink: 0, background: 'var(--bg-surface)',
      borderRight: '1px solid var(--border)', display: 'flex',
      flexDirection: 'column', height: '100vh', position: 'sticky', top: 0,
    }}>
      {/* Logo */}
      <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8, background: 'var(--accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, fontWeight: 800, color: '#fff', letterSpacing: '-1px',
          }}>S</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, letterSpacing: '-0.3px' }}>SenAI</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 500 }}>CRM Intelligence</div>
          </div>
        </div>
      </div>

      {/* Live status indicator */}
      <div style={{
        margin: '12px 12px 4px', padding: '8px 12px',
        background: isLive ? 'rgba(76,175,130,0.06)' : 'var(--bg-elevated)',
        border: `1px solid ${isLive ? 'rgba(76,175,130,0.2)' : 'var(--border)'}`,
        borderRadius: 'var(--radius)', display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <LiveDot color={isLive ? 'var(--positive)' : 'var(--text-muted)'} />
        <span style={{ fontSize: 12, color: isLive ? 'var(--positive)' : 'var(--text-muted)', fontWeight: 500 }}>
          {isLive ? 'Streaming live' : 'Idle'}
        </span>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {NAV.map(item => {
          const active = page === item.key;
          return (
            <button
              key={item.key}
              onClick={() => setPage(item.key)}
              style={{
                width: '100%', textAlign: 'left', padding: '9px 12px',
                borderRadius: 'var(--radius)', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: active ? 'var(--accent-glow)' : 'transparent',
                color: active ? 'var(--accent)' : 'var(--text-secondary)',
                fontWeight: active ? 600 : 400, fontSize: 13,
                transition: 'all 0.12s',
                borderLeft: active ? '2px solid var(--accent)' : '2px solid transparent',
              }}
              onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-primary)'; }}}
              onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 14 }}>{item.icon}</span>
                {item.label}
              </span>
              {item.key === 'inbox' && stats?.critical > 0 && (
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: '1px 5px', borderRadius: 100,
                  background: 'var(--critical)', color: '#fff',
                }}>{stats.critical}</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Stats footer */}
      {stats && (
        <div style={{ padding: '12px 14px', borderTop: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 12px' }}>
            {[
              { label: 'Pending', value: stats.pending, color: 'var(--text-secondary)' },
              { label: 'Critical', value: stats.critical, color: 'var(--critical)' },
              { label: 'Escalated', value: stats.escalated, color: 'var(--high)' },
              { label: 'Spam', value: stats.spam, color: 'var(--text-muted)' },
            ].map(s => (
              <div key={s.label}>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 1 }}>{s.label}</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: s.color, fontFamily: 'var(--font-mono)' }}>{s.value ?? '—'}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}
