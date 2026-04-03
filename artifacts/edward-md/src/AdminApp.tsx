import { useState, useEffect } from 'react';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';
import './index.css';

export default function AdminApp() {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const saved = sessionStorage.getItem('admin-token');
    if (saved) setToken(saved);
  }, []);

  function handleLogin(t: string) {
    setToken(t);
  }

  function handleLogout() {
    sessionStorage.removeItem('admin-token');
    setToken(null);
  }

  if (!token) return <AdminLogin onLogin={handleLogin} />;
  return <AdminDashboard token={token} onLogout={handleLogout} />;
}
