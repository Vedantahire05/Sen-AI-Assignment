import React, { useState } from 'react';
import { Button, Spinner, LiveDot } from './UI';
import { api } from '../utils/api';
import { toast } from './UI';

export default function StreamPanel({ isLive, setIsLive, onDone }) {
  const [speed, setSpeed] = useState(1);
  const [limit, setLimit] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const start = async () => {
    setLoading(true);
    try {
      const r = await api.startStream(speed, limit ? parseInt(limit) : undefined);
      setResult(r);
      setIsLive(true);
      toast(`Streaming ${r.total} emails at ${speed}/sec`, 'success');
      setTimeout(() => { setIsLive(false); onDone?.(); }, (r.estimatedSeconds + 2) * 1000);
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      background: 'var(--bg-surface)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)', padding: 16, display: 'flex',
      alignItems: 'center', gap: 16, flexWrap: 'wrap',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 200 }}>
        {isLive ? <LiveDot /> : <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>▶</span>}
        <span style={{ fontSize: 13, fontWeight: 600, color: isLive ? 'var(--positive)' : 'var(--text-primary)' }}>
          {isLive ? 'Streaming dataset…' : 'Stream email dataset'}
        </span>
        {result && !isLive && (
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Last run: {result.total} emails
          </span>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>Speed</label>
        <select
          value={speed}
          onChange={e => setSpeed(Number(e.target.value))}
          style={{
            background: 'var(--bg-elevated)', border: '1px solid var(--border)',
            borderRadius: 6, color: 'var(--text-primary)', padding: '5px 8px', fontSize: 12,
          }}
        >
          {[0.5, 1, 2, 5].map(v => <option key={v} value={v}>{v}/sec</option>)}
        </select>

        <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>Limit</label>
        <input
          type="number" placeholder="all" value={limit}
          onChange={e => setLimit(e.target.value)}
          style={{
            width: 60, background: 'var(--bg-elevated)', border: '1px solid var(--border)',
            borderRadius: 6, color: 'var(--text-primary)', padding: '5px 8px', fontSize: 12,
          }}
        />
      </div>

      <Button onClick={start} disabled={isLive || loading} loading={loading} size="sm">
        {isLive ? 'Running…' : 'Start Stream'}
      </Button>
    </div>
  );
}
