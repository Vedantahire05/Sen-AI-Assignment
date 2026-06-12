import React, { useState } from 'react';
import { Button, Spinner, EmptyState, Card, SectionHeader } from '../components/UI';
import { api } from '../utils/api';

const EXAMPLE_QUERIES = [
  'GDPR data portability Article 20',
  'refund policy 14 days exception',
  'P0 incident SLA credit calculation',
  'ransomware extortion escalation',
  'enterprise pricing non-profit discount',
  'HIPAA BAA compliance SOC 2',
];

function ResultCard({ result, index }) {
  const pct = result.score != null ? Math.round(result.score * 100) : null;
  const scoreColor = pct == null ? 'var(--text-muted)' : pct >= 70 ? 'var(--positive)' : pct >= 40 ? 'var(--medium)' : 'var(--high)';

  return (
    <div style={{
      background: 'var(--bg-elevated)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)', padding: 16,
      animation: 'slide-in 0.15s ease',
      animationDelay: `${index * 0.05}s`, animationFillMode: 'both',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10, gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            width: 20, height: 20, borderRadius: '50%', background: 'var(--accent-glow)',
            color: 'var(--accent)', fontSize: 10, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>{index + 1}</span>
          <code style={{
            fontSize: 11, color: 'var(--accent)', background: 'var(--accent-glow)',
            padding: '2px 8px', borderRadius: 4, fontFamily: 'var(--font-mono)',
          }}>{result.source || result.metadata?.source || 'Unknown source'}</code>
        </div>
        {pct != null && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            <div style={{ width: 40, height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ width: `${pct}%`, height: '100%', background: scoreColor, borderRadius: 2 }} />
            </div>
            <span style={{ fontSize: 11, color: scoreColor, fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
              {pct}%
            </span>
          </div>
        )}
      </div>
      <p style={{
        fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7,
        margin: 0, borderLeft: '2px solid var(--border)', paddingLeft: 12,
      }}>
        {result.text || result.document || result.content || JSON.stringify(result)}
      </p>
    </div>
  );
}

export default function RAGPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastQuery, setLastQuery] = useState('');

  const search = async (q) => {
    const searchTerm = q || query;
    if (!searchTerm.trim()) return;
    setLoading(true);
    setError(null);
    setLastQuery(searchTerm);
    try {
      const r = await api.ragSearch(searchTerm);
      setResults(r);
    } catch (e) {
      setError(e.message);
      setResults(null);
    } finally {
      setLoading(false);
    }
  };

  const chunks = React.useMemo(() => {

  if (!results) return null;

  // Old array format
  if (Array.isArray(results)) {
    return results;
  }

  // Existing chunks format
  if (Array.isArray(results?.chunks)) {
    return results.chunks;
  }

  // ChromaDB format
  if (
    results?.results?.documents?.[0]
  ) {

    return results.results.documents[0].map(
      (document, index) => ({
        content: document,
        source:
          results.results.metadatas?.[0]?.[index]
            ?.source_doc || "Unknown",
        score:
          results.results.distances?.[0]?.[index]
            ? Math.max(
                0,
                Math.min(
                  1,
                  1 -
                    (
                      results.results.distances[0][index] /
                      2
                    )
                )
              )
            : null,
      })
    );

  }

  return [];

}, [results]);

  return (
    <div style={{ padding: 24, overflowY: 'auto', height: '100%' }}>
      <div style={{ maxWidth: 800 }}>
        <SectionHeader
          title="RAG Debug"
          subtitle="Query the knowledge base and inspect retrieved chunks with similarity scores"
        />

        {/* Search input */}
        <div style={{
          display: 'flex', gap: 10, marginBottom: 20,
          background: 'var(--bg-surface)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)', padding: '12px 16px',
        }}>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') search(); }}
            placeholder="Enter a query to retrieve KB chunks…"
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              color: 'var(--text-primary)', fontSize: 14, fontFamily: 'var(--font-mono)',
            }}
          />
          <Button onClick={() => search()} disabled={loading || !query.trim()} loading={loading}>
            Search
          </Button>
        </div>

        {/* Example queries */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>Example queries</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {EXAMPLE_QUERIES.map(q => (
              <button
                key={q}
                onClick={() => { setQuery(q); search(q); }}
                style={{
                  fontSize: 11, padding: '4px 10px', borderRadius: 100,
                  background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                  color: 'var(--text-secondary)', cursor: 'pointer', transition: 'all 0.12s',
                  fontFamily: 'var(--font-mono)',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
              >{q}</button>
            ))}
          </div>
        </div>

        {/* Results */}
        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'var(--text-muted)', padding: '20px 0' }}>
            <Spinner />
            <span style={{ fontSize: 13 }}>Searching knowledge base…</span>
          </div>
        )}

        {error && (
          <div style={{
            padding: '12px 16px', background: 'var(--critical-bg)', border: '1px solid rgba(240,75,75,0.3)',
            borderRadius: 'var(--radius)', fontSize: 13, color: 'var(--critical)', marginBottom: 16,
          }}>
            <strong>Error:</strong> {error}
            {error.includes('connect') && (
              <div style={{ marginTop: 6, fontSize: 12 }}>
                Make sure the Python RAG service is running: <code style={{ fontFamily: 'var(--font-mono)' }}>cd ai-service && python main.py</code>
              </div>
            )}
          </div>
        )}

        {chunks && !loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                {chunks.length} chunk{chunks.length !== 1 ? 's' : ''} retrieved for:
                <code style={{ marginLeft: 8, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', background: 'var(--bg-elevated)', padding: '1px 6px', borderRadius: 4 }}>
                  "{lastQuery}"
                </code>
              </span>
            </div>
            {chunks.length === 0
              ? <EmptyState icon="🔍" title="No matching chunks" subtitle="Try a different query or re-seed the knowledge base" />
              : chunks.map((r, i) => <ResultCard key={i} result={r} index={i} />)
            }
          </div>
        )}

        {!results && !loading && !error && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⊛</div>
            <div style={{ fontSize: 13 }}>Enter a query or click an example above</div>
          </div>
        )}
      </div>
    </div>
  );
}
