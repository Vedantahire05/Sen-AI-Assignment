import React, { useState, useEffect, useCallback } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { Card, SectionHeader, Spinner, EmptyState, Button, CategoryBadge, UrgencyBadge } from '../components/UI';
import { api } from '../utils/api';

const COLORS = ['#4f7df3','#4caf82','#f07030','#e8c84a','#c07af0','#f04b4b','#4d5568','#8892a4'];

function StatCard({ label, value, sub, color = 'var(--accent)' }) {
  return (
    <Card>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color, fontFamily: 'var(--font-mono)', letterSpacing: '-1px', marginBottom: 4 }}>{value ?? '—'}</div>
      {sub && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{sub}</div>}
    </Card>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--bg-elevated)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius)', padding: '10px 14px', fontSize: 12,
    }}>
      <div style={{ color: 'var(--text-muted)', marginBottom: 6 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, display: 'flex', gap: 8 }}>
          <span>{p.name}:</span>
          <span style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{typeof p.value === 'number' ? p.value.toFixed(3) : p.value}</span>
        </div>
      ))}
    </div>
  );
};

export default function AnalyticsPage() {
  const [trend, setTrend] = useState(null);
  const [cats, setCats] = useState([]);
  const [perf, setPerf] = useState(null);
  const [atRisk, setAtRisk] = useState(null);
  const [loading, setLoading] = useState(true);
  const [senderInput, setSenderInput] = useState('');
  const [senderFilter, setSenderFilter] = useState('');
  const [days, setDays] = useState(30);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [trendRes, catRes, perfRes, riskRes] = await Promise.allSettled([
        api.sentimentTrend(senderFilter || undefined, days),
        api.categories(),
        api.agentPerformance(),
        api.atRisk(),
      ]);
      if (trendRes.status === 'fulfilled') setTrend(trendRes.value);
      if (catRes.status === 'fulfilled') setCats(catRes.value.data || []);
      if (perfRes.status === 'fulfilled') setPerf(perfRes.value);
      if (riskRes.status === 'fulfilled') setAtRisk(riskRes.value);
    } finally {
      setLoading(false);
    }
  }, [senderFilter, days]);

  useEffect(() => { load(); }, [load]);

  const trendData = (trend?.trend || []).map((t, i) => ({
    i: i + 1,
    score: t.score,
    movingAvg: t.movingAvg,
    date: t.date ? new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '',
  }));

  const catData = cats.map(c => ({ name: c._id || 'Unknown', value: c.count }));

  return (
    <div style={{ padding: '24px', overflowY: 'auto', height: '100%' }}>
      <div style={{ maxWidth: 1100 }}>
        <SectionHeader
          title="Analytics"
          subtitle="Sentiment trends, category breakdowns, and agent performance"
          right={<Button onClick={load} variant="ghost" size="sm">Refresh</Button>}
        />

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Spinner /></div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

            {/* Agent performance stats */}
            {perf && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
                <StatCard label="Total Processed" value={perf.totalProcessed} color="var(--text-primary)" />
                <StatCard label="Auto-Reply Rate" value={`${perf.autoReplyRate}%`} color="var(--positive)" sub="Handled automatically" />
                <StatCard label="Escalation Rate" value={`${perf.escalationRate}%`} color="var(--high)" sub="Needed human review" />
                <StatCard label="Avg Confidence" value={perf.averageConfidence ? `${(perf.averageConfidence * 100).toFixed(0)}%` : '—'} color="var(--accent)" sub="Classification accuracy" />
              </div>
            )}

            {/* Sentiment trend */}
            <Card>
              <SectionHeader
                title="Sentiment Trend"
                subtitle={trend?.escalationAlert ? '⚠ Escalation alert — 3+ consecutive negative emails' : `${trend?.totalEmails || 0} emails in last ${days} days`}
                right={
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input
                      value={senderInput}
                      onChange={e => setSenderInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') setSenderFilter(senderInput); }}
                      placeholder="Filter by sender…"
                      style={{
                        background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                        borderRadius: 6, color: 'var(--text-primary)', padding: '5px 10px', fontSize: 12, width: 180,
                      }}
                    />
                    <select
                      value={days}
                      onChange={e => setDays(Number(e.target.value))}
                      style={{
                        background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                        borderRadius: 6, color: 'var(--text-primary)', padding: '5px 8px', fontSize: 12,
                      }}
                    >
                      {[7, 14, 30, 60, 90].map(d => <option key={d} value={d}>{d}d</option>)}
                    </select>
                    <Button size="sm" variant="ghost" onClick={() => setSenderFilter(senderInput)}>Apply</Button>
                    {senderFilter && <Button size="sm" variant="ghost" onClick={() => { setSenderFilter(''); setSenderInput(''); }}>Clear</Button>}
                  </div>
                }
              />

              {trend?.escalationAlert && (
                <div style={{
                  padding: '10px 14px', marginBottom: 16, background: 'var(--critical-bg)',
                  border: '1px solid rgba(240,75,75,0.3)', borderRadius: 'var(--radius)',
                  fontSize: 12, color: 'var(--critical)',
                }}>
                  🚨 {trend.escalationAlertMessage}
                </div>
              )}

              {trendData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={trendData} margin={{ top: 5, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickLine={false} />
                    <YAxis domain={[-1, 1]} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 12, color: 'var(--text-muted)' }} />
                    <Line type="monotone" dataKey="score" stroke="#4f7df3" strokeWidth={1.5} dot={{ r: 3, fill: '#4f7df3' }} name="Score" />
                    <Line type="monotone" dataKey="movingAvg" stroke="#4caf82" strokeWidth={2} dot={false} strokeDasharray="4 2" name="3-pt avg" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState icon="📈" title="No trend data" subtitle="Stream emails to populate" />
              )}
            </Card>

            {/* Category + At-risk row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {/* Category breakdown */}
              <Card>
                <SectionHeader title="Category Breakdown" />
                {catData.length > 0 ? (
                  <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                    <ResponsiveContainer width="50%" height={160}>
                      <PieChart>
                        <Pie data={catData} cx="50%" cy="50%" outerRadius={60} dataKey="value" strokeWidth={0}>
                          {catData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {catData.slice(0, 7).map((c, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ width: 8, height: 8, borderRadius: 2, background: COLORS[i % COLORS.length], flexShrink: 0 }} />
                            <span style={{ color: 'var(--text-secondary)' }}>{c.name}</span>
                          </div>
                          <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>{c.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <EmptyState icon="📊" title="No data yet" />
                )}
              </Card>

              {/* At-risk accounts */}
              <Card>
                <SectionHeader title="At-Risk Accounts" subtitle="High churn risk or stale critical emails" />
                {atRisk?.highChurnRiskContacts?.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {atRisk.highChurnRiskContacts.slice(0, 5).map((c, i) => (
                      <div key={i} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '8px 10px', background: 'var(--bg-elevated)',
                        borderRadius: 'var(--radius)', fontSize: 12,
                      }}>
                        <div>
                          <div style={{ fontWeight: 500, color: 'var(--text-primary)', marginBottom: 2 }}>{c.email}</div>
                          <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>{c.company || 'Unknown company'}</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          {c.accountValue > 0 && (
                            <span style={{ color: 'var(--text-muted)', fontSize: 11, fontFamily: 'var(--font-mono)' }}>
                              ${c.accountValue.toLocaleString()}
                            </span>
                          )}
                          <span style={{
                            fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 100,
                            color: 'var(--critical)', background: 'var(--critical-bg)',
                          }}>{Math.round(c.churnRiskScore * 100)}% risk</span>
                        </div>
                      </div>
                    ))}
                    {atRisk.highChurnRiskContacts.length > 5 && (
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', paddingTop: 4 }}>
                        +{atRisk.highChurnRiskContacts.length - 5} more
                      </div>
                    )}
                  </div>
                ) : (
                  <EmptyState icon="✅" title="No at-risk accounts" subtitle="All contacts looking healthy" />
                )}

                {/* Stale critical emails */}
                {atRisk?.staleCriticalEmails?.length > 0 && (
                  <div style={{ marginTop: 16 }}>
                    <div style={{ fontSize: 11, color: 'var(--high)', marginBottom: 8, fontWeight: 600 }}>
                      ⏱ Stale critical emails ({atRisk.staleCriticalEmails.length})
                    </div>
                    {atRisk.staleCriticalEmails.slice(0, 3).map((e, i) => (
                      <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6, fontSize: 12 }}>
                        <UrgencyBadge urgency={e.urgency} />
                        <span style={{ color: 'var(--text-secondary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {e.subject}
                        </span>
                        <span style={{ color: 'var(--critical)', fontSize: 11, flexShrink: 0 }}>{e.hoursOld}h old</span>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>

            {/* Bar chart of categories */}
            {catData.length > 0 && (
              <Card>
                <SectionHeader title="Volume by Category" />
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={catData} margin={{ top: 5, right: 20, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} angle={-25} textAnchor="end" tickLine={false} />
                    <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" name="Emails" radius={[3, 3, 0, 0]}>
                      {catData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
