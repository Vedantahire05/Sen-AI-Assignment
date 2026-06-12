import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import InboxPage from './pages/InboxPage';
import AnalyticsPage from './pages/AnalyticsPage';
import ContactsPage from './pages/ContactsPage';
import RAGPage from './pages/RAGPage';
import { ToastContainer } from './components/UI';
import { api } from './utils/api';

export default function App() {
  const [page, setPage] = useState('inbox');
  const [stats, setStats] = useState(null);
  const [isLive, setIsLive] = useState(false);

  const loadStats = useCallback(async () => {
    try {
      const r = await api.stats();
      setStats(r.stats || r);
    } catch (_) {}
  }, []);

  useEffect(() => { loadStats(); }, [loadStats]);

  // Poll stats every 10s
  useEffect(() => {
    const t = setInterval(loadStats, 10000);
    return () => clearInterval(t);
  }, [loadStats]);

  const renderPage = () => {
    switch (page) {
      case 'inbox':     return <InboxPage isLive={isLive} setIsLive={setIsLive} reloadStats={loadStats} />;
      case 'analytics': return <AnalyticsPage />;
      case 'contacts':  return <ContactsPage />;
      case 'rag':       return <RAGPage />;
      default:          return <InboxPage isLive={isLive} setIsLive={setIsLive} reloadStats={loadStats} />;
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg-base)' }}>
      <Sidebar page={page} setPage={setPage} stats={stats} isLive={isLive} />
      <main style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {renderPage()}
      </main>
      <ToastContainer />
    </div>
  );
}
