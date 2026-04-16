import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import AssistantPanel from '../chat/AssistantPanel';
import { getLiveCalls } from '../../services/api';
import { MessageCircle } from 'lucide-react';

export default function AppLayout() {
  const [liveCalls, setLiveCalls]           = useState(0);
  const [assistantOpen, setAssistantOpen]   = useState(false);

  useEffect(() => {
    const poll = () => getLiveCalls().then(r => setLiveCalls(r.data.calls?.length || 0)).catch(() => {});
    poll();
    const id = setInterval(poll, 10000);
    return () => clearInterval(id);
  }, []);

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar liveCalls={liveCalls} />

      <main style={{ flex: 1, overflow: 'auto', background: 'var(--bg-page)' }}>
        <Outlet />
      </main>

      {/* Operator AI Assistant FAB */}
      <button
        onClick={() => setAssistantOpen(o => !o)}
        title="Veori Assistant"
        style={{
          position: 'fixed', bottom: 28, right: 28, zIndex: 100,
          width: 48, height: 48, borderRadius: '50%',
          background: 'var(--blue)', color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 20px rgba(59,130,246,0.4)',
          border: 'none', cursor: 'pointer',
          transition: 'transform 0.15s, box-shadow 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.08)'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(59,130,246,0.5)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(59,130,246,0.4)'; }}
      >
        <MessageCircle size={20} />
      </button>

      {assistantOpen && <AssistantPanel onClose={() => setAssistantOpen(false)} />}
    </div>
  );
}
