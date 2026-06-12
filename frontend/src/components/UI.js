import React from 'react';

/* ── Badge ─────────────────────────────────────────────────────────────────── */
const URGENCY_COLORS = {
  Critical: { color: 'var(--critical)', bg: 'var(--critical-bg)' },
  High:     { color: 'var(--high)',     bg: 'var(--high-bg)' },
  Medium:   { color: 'var(--medium)',   bg: 'var(--medium-bg)' },
  Low:      { color: 'var(--low)',      bg: 'var(--low-bg)' },
};
const SENTIMENT_COLORS = {
  Positive: { color: 'var(--positive)', bg: 'rgba(76,175,130,0.1)' },
  Negative: { color: 'var(--negative)', bg: 'rgba(240,75,75,0.1)' },
  Neutral:  { color: 'var(--neutral)',  bg: 'rgba(136,146,164,0.1)' },
  Mixed:    { color: 'var(--mixed)',    bg: 'rgba(192,122,240,0.1)' },
};
const CATEGORY_COLORS = {
  Complaint: '#f04b4b', Legal: '#f04b4b', Billing: '#f07030',
  'Bug Report': '#e8c84a', Compliance: '#c07af0', Inquiry: '#4f7df3',
  'Feature Request': '#4caf82', Spam: '#4d5568', Internal: '#8892a4', Other: '#8892a4',
};

export function UrgencyBadge({ urgency }) {
  const c = URGENCY_COLORS[urgency] || URGENCY_COLORS.Low;
  return (
    <span style={{
      fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 100,
      color: c.color, background: c.bg, letterSpacing: '0.03em', whiteSpace: 'nowrap',
    }}>{urgency}</span>
  );
}

export function SentimentBadge({ sentiment }) {
  const c = SENTIMENT_COLORS[sentiment] || SENTIMENT_COLORS.Neutral;
  return (
    <span style={{
      fontSize: 11, fontWeight: 500, padding: '2px 7px', borderRadius: 100,
      color: c.color, background: c.bg, whiteSpace: 'nowrap',
    }}>{sentiment}</span>
  );
}

export function CategoryBadge({ category }) {
  const color = CATEGORY_COLORS[category] || '#8892a4';
  return (
    <span style={{
      fontSize: 11, fontWeight: 500, padding: '2px 7px', borderRadius: 4,
      color, background: `${color}15`, border: `1px solid ${color}25`, whiteSpace: 'nowrap',
    }}>{category}</span>
  );
}

export function StatusBadge({ status }) {
  const map = {
    Received: '#4f7df3', Processing: '#e8c84a', Replied: '#4caf82',
    Escalated: '#f04b4b', Ignored: '#4d5568',
  };
  const color = map[status] || '#8892a4';
  return (
    <span style={{
      fontSize: 11, fontWeight: 500, padding: '2px 7px', borderRadius: 100,
      color, background: `${color}18`, whiteSpace: 'nowrap',
    }}>{status}</span>
  );
}

/* ── Spinner ────────────────────────────────────────────────────────────────── */
export function Spinner({ size = 18, color = 'var(--accent)' }) {
  return (
    <span style={{
      display: 'inline-block', width: size, height: size,
      border: `2px solid ${color}30`, borderTopColor: color,
      borderRadius: '50%', animation: 'spin 0.7s linear infinite', flexShrink: 0,
    }} />
  );
}

/* ── Empty state ────────────────────────────────────────────────────────────── */
export function EmptyState({ icon = '📭', title, subtitle, action }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', gap: 12, padding: '60px 24px', textAlign: 'center',
    }}>
      <span style={{ fontSize: 36 }}>{icon}</span>
      <div>
        <div style={{ color: 'var(--text-secondary)', fontWeight: 600, marginBottom: 4 }}>{title}</div>
        {subtitle && <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>{subtitle}</div>}
      </div>
      {action}
    </div>
  );
}

/* ── Card ───────────────────────────────────────────────────────────────────── */
export function Card({ children, style = {}, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--bg-surface)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)', padding: '20px',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'border-color 0.15s, background 0.15s',
        ...style,
      }}
      onMouseEnter={onClick ? e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.background = 'var(--bg-hover)'; } : undefined}
      onMouseLeave={onClick ? e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg-surface)'; } : undefined}
    >
      {children}
    </div>
  );
}

/* ── Button ─────────────────────────────────────────────────────────────────── */
export function Button({ children, onClick, variant = 'primary', size = 'md', disabled, style = {}, loading }) {
  const base = {
    display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 500,
    borderRadius: 'var(--radius)', border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.15s', fontFamily: 'var(--font-sans)', whiteSpace: 'nowrap',
    opacity: disabled ? 0.5 : 1,
  };
  const sizes = { sm: { fontSize: 12, padding: '5px 12px' }, md: { fontSize: 13, padding: '7px 16px' }, lg: { fontSize: 14, padding: '10px 20px' } };
  const variants = {
    primary: { background: 'var(--accent)', color: '#fff' },
    danger: { background: 'var(--critical)', color: '#fff' },
    ghost: { background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border)' },
    subtle: { background: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border)' },
  };
  return (
    <button onClick={disabled ? undefined : onClick} style={{ ...base, ...sizes[size], ...variants[variant], ...style }}>
      {loading ? <Spinner size={13} color={variant === 'ghost' ? 'var(--accent)' : '#fff'} /> : null}
      {children}
    </button>
  );
}

/* ── Section header ─────────────────────────────────────────────────────────── */
export function SectionHeader({ title, subtitle, right }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
      <div>
        <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>{title}</div>
        {subtitle && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{subtitle}</div>}
      </div>
      {right}
    </div>
  );
}

/* ── Live dot ───────────────────────────────────────────────────────────────── */
export function LiveDot({ color = 'var(--positive)' }) {
  return (
    <span style={{ position: 'relative', display: 'inline-flex', width: 8, height: 8, flexShrink: 0 }}>
      <span style={{
        position: 'absolute', inset: 0, borderRadius: '50%',
        background: color, opacity: 0.6, animation: 'stream-ping 1.4s ease-out infinite',
      }} />
      <span style={{ borderRadius: '50%', width: 8, height: 8, background: color }} />
    </span>
  );
}

/* ── Confidence bar ─────────────────────────────────────────────────────────── */
export function ConfidenceBar({ value = 0 }) {
  const pct = Math.round(value * 100);
  const color = pct >= 80 ? 'var(--positive)' : pct >= 60 ? 'var(--medium)' : 'var(--negative)';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 4, background: 'var(--bg-elevated)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 2, transition: 'width 0.4s' }} />
      </div>
      <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', minWidth: 28 }}>{pct}%</span>
    </div>
  );
}

/* ── Churn risk indicator ────────────────────────────────────────────────────── */
export function ChurnRisk({ score = 0, label }) {
  const pct = Math.round(score * 100);
  const color = pct > 70 ? 'var(--critical)' : pct > 40 ? 'var(--high)' : 'var(--positive)';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
        <span style={{ color: 'var(--text-muted)' }}>Churn risk</span>
        <span style={{ color, fontWeight: 600 }}>{label || (pct > 70 ? 'High' : pct > 40 ? 'Medium' : 'Low')}</span>
      </div>
      <div style={{ height: 4, background: 'var(--bg-elevated)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 2, transition: 'width 0.5s' }} />
      </div>
    </div>
  );
}

/* ── Tab bar ─────────────────────────────────────────────────────────────────── */
export function TabBar({ tabs, active, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 2, background: 'var(--bg-elevated)', borderRadius: 'var(--radius)', padding: 3 }}>
      {tabs.map(tab => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          style={{
            padding: '6px 14px', borderRadius: 6, border: 'none', fontSize: 13, fontWeight: 500,
            cursor: 'pointer', transition: 'all 0.15s',
            background: active === tab.key ? 'var(--bg-surface)' : 'transparent',
            color: active === tab.key ? 'var(--text-primary)' : 'var(--text-muted)',
            boxShadow: active === tab.key ? 'var(--shadow)' : 'none',
            display: 'flex', alignItems: 'center', gap: 6,
          }}
        >
          {tab.label}
          {tab.count != null && (
            <span style={{
              fontSize: 10, fontWeight: 600, padding: '1px 5px', borderRadius: 100,
              background: active === tab.key ? 'var(--accent)' : 'var(--border)',
              color: active === tab.key ? '#fff' : 'var(--text-muted)',
            }}>{tab.count}</span>
          )}
        </button>
      ))}
    </div>
  );
}

/* ── Toast container (global) ────────────────────────────────────────────────── */
let _addToast = null;
export function setToastFn(fn) { _addToast = fn; }
export function toast(msg, type = 'info') { _addToast?.(msg, type); }

export function ToastContainer() {
  const [toasts, setToasts] = React.useState([]);
  React.useEffect(() => {
    setToastFn((msg, type) => {
      const id = Date.now();
      setToasts(t => [...t, { id, msg, type }]);
      setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
    });
  }, []);
  const COLORS = { info: 'var(--accent)', success: 'var(--positive)', error: 'var(--negative)', warning: 'var(--medium)' };
  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          background: 'var(--bg-elevated)', border: `1px solid ${COLORS[t.type]}40`,
          borderLeft: `3px solid ${COLORS[t.type]}`, borderRadius: 'var(--radius)',
          padding: '10px 16px', color: 'var(--text-primary)', fontSize: 13,
          boxShadow: 'var(--shadow-lg)', animation: 'slide-in 0.2s ease', maxWidth: 320,
        }}>{t.msg}</div>
      ))}
    </div>
  );
}
