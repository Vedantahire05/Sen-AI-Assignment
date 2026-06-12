import React, { useState, useEffect, useCallback } from 'react';
import { Card, SectionHeader, Spinner, EmptyState, Button, ChurnRisk, StatusBadge, CategoryBadge, SentimentBadge } from '../components/UI';
import { api } from '../utils/api';
import { toast } from '../components/UI';

const STATUS_OPTIONS = ['Active', 'VIP', 'Churned', 'Blocked'];

function ContactCard({ contact, selected, onClick }) {
  const risk = contact.churnRiskScore || 0;
  const riskColor = risk > 0.7 ? 'var(--critical)' : risk > 0.4 ? 'var(--high)' : 'var(--positive)';
  return (
    <div
      onClick={onClick}
      style={{
        padding: '14px 16px', cursor: 'pointer',
        borderBottom: '1px solid var(--border-subtle)',
        background: selected ? 'var(--bg-active)' : 'transparent',
        borderLeft: selected ? '2px solid var(--accent)' : '2px solid transparent',
        transition: 'background 0.1s',
      }}
      onMouseEnter={e => { if (!selected) e.currentTarget.style.background = 'var(--bg-hover)'; }}
      onMouseLeave={e => { if (!selected) e.currentTarget.style.background = 'transparent'; }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
          {contact.email}
        </div>
        <span style={{
          fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 100,
          color: riskColor, background: `${riskColor}18`, flexShrink: 0, marginLeft: 8,
        }}>{Math.round(risk * 100)}%</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{contact.company || 'Unknown company'}</span>
        <StatusBadge status={contact.status} />
      </div>
    </div>
  );
}

function ContactDetail({ email, onUpdate }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.contact(email).then(setData).catch(console.error).finally(() => setLoading(false));
  }, [email]);

  const updateStatus = async (status) => {
    setUpdating(true);
    try {
      await api.updateContactStatus(email, status);
      toast(`Status updated to ${status}`, 'success');
      const fresh = await api.contact(email);
      setData(fresh);
      onUpdate?.();
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spinner /></div>;
  if (!data) return <EmptyState icon="👤" title="Contact not found" />;

  const c = data.contact || {};
  const riskPct = Math.round((c.churnRiskScore || 0) * 100);

  return (
    <div style={{ padding: 24, overflowY: 'auto', height: '100%' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{c.name || c.email}</h2>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{c.email}</div>
            {c.company && <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{c.company}</div>}
          </div>
          <StatusBadge status={c.status} />
        </div>

        {/* Status changer */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {STATUS_OPTIONS.map(s => (
            <button
              key={s}
              onClick={() => updateStatus(s)}
              disabled={updating || c.status === s}
              style={{
                fontSize: 11, padding: '4px 10px', borderRadius: 100, border: '1px solid var(--border)',
                background: c.status === s ? 'var(--accent)' : 'var(--bg-elevated)',
                color: c.status === s ? '#fff' : 'var(--text-muted)',
                cursor: c.status === s ? 'default' : 'pointer', transition: 'all 0.15s',
              }}
            >{s}</button>
          ))}
        </div>
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
        <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 14 }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Account Value</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
            ${(c.accountValue || 0).toLocaleString()}
          </div>
        </div>
        <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 14 }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Subscription</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{c.subscriptionTier || 'Standard'}</div>
          {c.openTickets > 0 && <div style={{ fontSize: 11, color: 'var(--high)', marginTop: 4 }}>{c.openTickets} open tickets</div>}
        </div>
      </div>

      {/* Churn risk */}
      <div style={{ background: 'var(--bg-elevated)', border: `1px solid ${riskPct > 70 ? 'rgba(240,75,75,0.3)' : 'var(--border)'}`, borderRadius: 'var(--radius)', padding: 16, marginBottom: 20 }}>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Churn Risk Score</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
          <div style={{ fontSize: 36, fontWeight: 800, fontFamily: 'var(--font-mono)', color: riskPct > 70 ? 'var(--critical)' : riskPct > 40 ? 'var(--high)' : 'var(--positive)' }}>
            {riskPct}%
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{c.churnRiskLabel || 'Low'} Risk</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Based on sentiment trend & response history</div>
          </div>
        </div>
        <ChurnRisk score={c.churnRiskScore} label={c.churnRiskLabel} />
      </div>

      {/* Recent emails */}
      {c.recentEmails?.length > 0 && (
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Recent emails</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {c.recentEmails.map((e, i) => (
              <div key={i} style={{
                display: 'flex', gap: 8, alignItems: 'center',
                padding: '8px 12px', background: 'var(--bg-elevated)',
                border: '1px solid var(--border)', borderRadius: 'var(--radius)',
                fontSize: 12,
              }}>
                <SentimentBadge sentiment={e.sentiment} />
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-secondary)' }}>
                  {e.subject || '(no subject)'}
                </span>
                <CategoryBadge category={e.category} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [minRisk, setMinRisk] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (minRisk) params.min_churn_risk = minRisk;
      const r = await api.contacts(params);
      setContacts(r.contacts || []);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, minRisk]);

  useEffect(() => { load(); }, [load]);

  const filtered = contacts.filter(c =>
    !filter || c.email.toLowerCase().includes(filter.toLowerCase()) || (c.company || '').toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* List pane */}
      <div style={{ width: 320, flexShrink: 0, borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700 }}>Contacts</h2>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{filtered.length}</span>
          </div>
          <input
            value={filter} onChange={e => setFilter(e.target.value)}
            placeholder="Search contacts…"
            style={{
              width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border)',
              borderRadius: 6, color: 'var(--text-primary)', padding: '7px 10px', fontSize: 12, marginBottom: 8,
            }}
          />
          <div style={{ display: 'flex', gap: 6 }}>
            <select
              value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              style={{
                flex: 1, background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                borderRadius: 6, color: statusFilter ? 'var(--text-primary)' : 'var(--text-muted)', padding: '5px 8px', fontSize: 11,
              }}
            >
              <option value="">All statuses</option>
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select
              value={minRisk} onChange={e => setMinRisk(e.target.value)}
              style={{
                flex: 1, background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                borderRadius: 6, color: minRisk ? 'var(--text-primary)' : 'var(--text-muted)', padding: '5px 8px', fontSize: 11,
              }}
            >
              <option value="">Any risk</option>
              <option value="0.4">Medium+</option>
              <option value="0.7">High only</option>
            </select>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spinner /></div>
          ) : filtered.length === 0 ? (
            <EmptyState icon="👥" title="No contacts" subtitle="Stream the dataset first" />
          ) : (
            filtered.map(c => (
              <ContactCard
                key={c._id || c.email}
                contact={c}
                selected={selected === c.email}
                onClick={() => setSelected(selected === c.email ? null : c.email)}
              />
            ))
          )}
        </div>
      </div>

      {/* Detail pane */}
      <div style={{ flex: 1, overflow: 'hidden', background: 'var(--bg-base)' }}>
        {selected ? (
          <ContactDetail email={selected} onUpdate={load} />
        ) : (
          <EmptyState icon="👤" title="Select a contact" subtitle="Click any contact to view their profile and churn risk" />
        )}
      </div>
    </div>
  );
}
