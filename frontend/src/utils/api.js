const BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

async function req(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...opts.headers },
    ...opts,
  });
  const data = await res.json();
  if (!res.ok) throw Object.assign(new Error(data.message || 'Request failed'), { data });
  return data;
}

export const api = {
  // Ingest
  ingest: (body) => req('/api/ingest', { method: 'POST', body: JSON.stringify(body) }),
  jobStatus: (jobId) => req(`/api/status/${jobId}`),

  // Emails list (direct endpoint — much faster than fetching per-contact)
  emails: (params = {}) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v != null && v !== ''))
    ).toString();
    return req(`/api/emails${qs ? '?' + qs : ''}`);
  },

  // Stream
  startStream: (speed = 1, limit) =>
    req('/api/stream/start', { method: 'POST', body: JSON.stringify({ speed, limit }) }),
  streamStatus: () => req('/api/stream/status'),

  // Dashboard
  stats: () => req('/dashboard/stats'),

  // Emails / Threads
  threadByEmail: (email) => req(`/threads/${encodeURIComponent(email)}`),
  threadByThreadId: (id) => req(`/threads/thread/${id}`),
  allEmails: () => req('/dashboard/stats'),

  // Agent
  agentRun: (emailId) => req(`/agent/run/${emailId}`, { method: 'POST' }),
  agentDryRun: (emailId) => req(`/agent/dry-run/${emailId}`, { method: 'POST' }),
  agentRuns: (emailId) => req(`/agent/runs/${emailId}`),

  // Analytics
  sentimentTrend: (sender, days = 30) =>
    req(`/analytics/sentiment-trend?${sender ? `sender=${encodeURIComponent(sender)}&` : ''}days=${days}`),
  categories: (startDate, endDate) =>
    req(`/analytics/categories${startDate ? `?start_date=${startDate}&end_date=${endDate}` : ''}`),
  escalations: () => req('/analytics/escalations'),
  atRisk: () => req('/analytics/at-risk'),
  agentPerformance: () => req('/analytics/agent-performance'),

  // Contacts
  contacts: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return req(`/contacts${qs ? '?' + qs : ''}`);
  },
  contact: (email) => req(`/contacts/${encodeURIComponent(email)}`),
  updateContactStatus: (email, status) =>
    req(`/contacts/${encodeURIComponent(email)}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  // RAG
  ragSearch: (q) => req(`/rag/search?q=${encodeURIComponent(q)}`),

  // Intelligence
  reputation: () => req('/intelligence/reputation'),
  enrich: (body) => req('/intelligence/enrich', { method: 'POST', body: JSON.stringify(body) }),

  // Audit
  audit: (type, id) => req(`/audit/${type}/${id}`),
};