import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import AppLayout from './components/layout/AppLayout';
import Login     from './pages/Login';
import Register  from './pages/Register';
import Dashboard from './pages/Dashboard';
import Leads     from './pages/Leads';
import Campaigns from './pages/Campaigns';
import LiveCalls from './pages/LiveCalls';
import Pipeline  from './pages/Pipeline';
import Buyers    from './pages/Buyers';
import Settings  from './pages/Settings';
import Aria      from './pages/Aria';

function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-page)' }}>
      <div style={{ width: 32, height: 32, border: '3px solid var(--border-default)', borderTopColor: 'var(--blue)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login"    element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
          <Route path="/aria"     element={<Aria />} />

          {/* Protected — inside platform layout */}
          <Route element={<RequireAuth><AppLayout /></RequireAuth>}>
            <Route index               element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard"   element={<Dashboard />} />
            <Route path="/leads"       element={<Leads />} />
            <Route path="/campaigns"   element={<Campaigns />} />
            <Route path="/live"        element={<LiveCalls />} />
            <Route path="/pipeline"    element={<Pipeline />} />
            <Route path="/buyers"      element={<Buyers />} />
            <Route path="/settings"    element={<Settings />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
