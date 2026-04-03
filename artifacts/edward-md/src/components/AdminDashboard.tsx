import { useState, useEffect, useCallback } from 'react';
import {
  Crown, Server, Users, Key, Plus, Trash2, RefreshCw, Copy, CheckCircle,
  AlertCircle, Loader2, LogOut, Shield, Star, Zap, Edit2, Check, X,
  BarChart3, TrendingUp, Phone
} from 'lucide-react';

const API = import.meta.env.VITE_API_URL || '';

interface ServerRecord {
  id: string;
  name: string;
  ownerNumber: string;
  plan: 'free' | 'premium';
  key: string | null;
  registeredAt: string;
  notes: string;
  usersCount: number;
}

interface Stats {
  totalServers: number;
  freeServers: number;
  premiumServers: number;
  totalUsers: number;
  totalKeys: number;
  usedKeys: number;
  unusedKeys: number;
}

interface KeyRecord {
  key: string;
  generated: string;
  activated: boolean;
  activatedAt: string | null;
}

interface Props { token: string; onLogout: () => void; }

function apiFetch(path: string, token: string, opts: RequestInit = {}) {
  return fetch(`${API}${path}`, {
    ...opts,
    headers: { 'Content-Type': 'application/json', 'x-admin-token': token, ...(opts.headers || {}) },
  }).then(r => r.json());
}

export default function AdminDashboard({ token, onLogout }: Props) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [servers, setServers] = useState<ServerRecord[]>([]);
  const [keys, setKeys] = useState<KeyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'servers' | 'keys'>('overview');

  // Create server form
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newServer, setNewServer] = useState({ name: '', ownerNumber: '', plan: 'free', notes: '', usersCount: '0' });
  const [creating, setCreating] = useState(false);
  const [createStatus, setCreateStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  // Inline edit
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<ServerRecord>>({});

  // Key gen
  const [generatingKey, setGeneratingKey] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, serversRes, keysRes] = await Promise.all([
        apiFetch('/api/admin/stats', token),
        apiFetch('/api/admin/servers', token),
        apiFetch('/api/admin/keys', token),
      ]);
      if (statsRes.ok) setStats(statsRes.stats);
      if (serversRes.ok) setServers(serversRes.servers);
      if (keysRes.ok) setKeys(keysRes.keys);
    } catch {}
    setLoading(false);
  }, [token]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  async function handleCreateServer() {
    if (!newServer.name.trim()) return;
    setCreating(true);
    setCreateStatus(null);
    const data = await apiFetch('/api/admin/servers', token, {
      method: 'POST',
      body: JSON.stringify(newServer),
    });
    if (data.ok) {
      setCreateStatus({ type: 'success', msg: 'Server created!' });
      setNewServer({ name: '', ownerNumber: '', plan: 'free', notes: '', usersCount: '0' });
      setShowCreateForm(false);
      fetchAll();
    } else {
      setCreateStatus({ type: 'error', msg: data.error });
    }
    setCreating(false);
  }

  async function handleDeleteServer(id: string) {
    if (!confirm('Delete this server?')) return;
    await apiFetch(`/api/admin/servers/${id}`, token, { method: 'DELETE' });
    fetchAll();
  }

  async function handleSaveEdit(id: string) {
    await apiFetch(`/api/admin/servers/${id}`, token, { method: 'PATCH', body: JSON.stringify(editValues) });
    setEditingId(null);
    fetchAll();
  }

  async function handleGenerateKey() {
    setGeneratingKey(true);
    const data = await apiFetch('/api/admin/generate-key', token, { method: 'POST' });
    if (data.ok) { fetchAll(); }
    setGeneratingKey(false);
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    setCopiedKey(text);
    setTimeout(() => setCopiedKey(null), 2000);
  }

  async function handleLogout() {
    await apiFetch('/api/admin/logout', token, { method: 'POST' });
    onLogout();
  }

  if (loading) return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent-orange mx-auto mb-3" />
        <p className="text-sm text-text-muted">Loading admin panel...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Header */}
      <header className="glass-strong border-b border-border px-6 py-4 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent-orange to-accent-pink flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-text-primary text-sm">EDWARD MD Admin</h1>
              <p className="text-[10px] text-text-muted">Administration Panel</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={fetchAll} className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-card transition-all">
              <RefreshCw className="w-4 h-4" />
            </button>
            <button onClick={handleLogout} className="flex items-center gap-1.5 px-3 py-2 bg-accent-red/10 border border-accent-red/20 text-accent-red text-xs font-medium rounded-xl hover:bg-accent-red/20 transition-all">
              <LogOut className="w-3.5 h-3.5" />Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 lg:px-6 py-6 space-y-6">

        {/* Stats grid */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Total Servers', value: stats.totalServers, icon: Server, color: 'text-accent-blue', bg: 'bg-accent-blue/10' },
              { label: 'Free Servers', value: stats.freeServers, icon: Zap, color: 'text-text-muted', bg: 'bg-bg-input' },
              { label: 'Premium Servers', value: stats.premiumServers, icon: Crown, color: 'text-accent-orange', bg: 'bg-accent-orange/10' },
              { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-wa-green', bg: 'bg-wa-green/10' },
            ].map(({ label, value, icon: Icon, color, bg }) => (
              <div key={label} className="glass rounded-2xl p-4">
                <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center mb-3`}>
                  <Icon className={`w-4 h-4 ${color}`} />
                </div>
                <p className="text-2xl font-bold text-text-primary">{value}</p>
                <p className="text-xs text-text-muted mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 border-b border-border">
          {(['overview', 'servers', 'keys'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-xs font-medium capitalize border-b-2 -mb-px transition-colors ${activeTab === tab ? 'border-accent-orange text-accent-orange' : 'border-transparent text-text-muted hover:text-text-primary'}`}>
              {tab === 'keys' ? 'Premium Keys' : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="glass rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2"><BarChart3 className="w-4 h-4 text-accent-orange" />Server Distribution</h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-text-muted flex items-center gap-1"><Zap className="w-3 h-3" />Free</span>
                    <span className="text-text-secondary font-medium">{stats.freeServers} servers</span>
                  </div>
                  <div className="h-2 bg-bg-input rounded-full overflow-hidden">
                    <div className="h-full bg-border rounded-full transition-all" style={{ width: stats.totalServers ? `${(stats.freeServers / stats.totalServers) * 100}%` : '0%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-accent-orange flex items-center gap-1"><Crown className="w-3 h-3" />Premium</span>
                    <span className="text-text-secondary font-medium">{stats.premiumServers} servers</span>
                  </div>
                  <div className="h-2 bg-bg-input rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-accent-orange to-accent-pink rounded-full transition-all" style={{ width: stats.totalServers ? `${(stats.premiumServers / stats.totalServers) * 100}%` : '0%' }} />
                  </div>
                </div>
              </div>
            </div>

            <div className="glass rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2"><Key className="w-4 h-4 text-accent-purple" />Key Status</h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-3 bg-bg-input rounded-xl">
                  <p className="text-xl font-bold text-text-primary">{stats.totalKeys}</p>
                  <p className="text-[10px] text-text-muted mt-0.5">Total</p>
                </div>
                <div className="text-center p-3 bg-wa-green/10 rounded-xl">
                  <p className="text-xl font-bold text-wa-green">{stats.usedKeys}</p>
                  <p className="text-[10px] text-text-muted mt-0.5">Activated</p>
                </div>
                <div className="text-center p-3 bg-accent-orange/10 rounded-xl">
                  <p className="text-xl font-bold text-accent-orange">{stats.unusedKeys}</p>
                  <p className="text-[10px] text-text-muted mt-0.5">Available</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Servers Tab */}
        {activeTab === 'servers' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-text-primary">Registered Servers ({servers.length})</h2>
              <button onClick={() => { setShowCreateForm(!showCreateForm); setCreateStatus(null); }} className="flex items-center gap-1.5 px-4 py-2 bg-accent-orange/10 border border-accent-orange/20 text-accent-orange text-xs font-medium rounded-xl hover:bg-accent-orange/20 transition-all">
                <Plus className="w-3.5 h-3.5" />{showCreateForm ? 'Cancel' : 'Add Server'}
              </button>
            </div>

            {showCreateForm && (
              <div className="glass rounded-2xl p-5 border border-accent-orange/20 space-y-4">
                <h3 className="text-sm font-semibold text-accent-orange">New Server</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-text-muted mb-1 block">Server Name *</label>
                    <input value={newServer.name} onChange={e => setNewServer(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Bot Alpha" className="w-full bg-bg-input border border-border rounded-xl py-2.5 px-3 text-sm text-text-primary focus:outline-none focus:border-accent-orange/50 transition-all" />
                  </div>
                  <div>
                    <label className="text-xs text-text-muted mb-1 block">Owner WhatsApp</label>
                    <input value={newServer.ownerNumber} onChange={e => setNewServer(p => ({ ...p, ownerNumber: e.target.value }))} placeholder="+1234567890" className="w-full bg-bg-input border border-border rounded-xl py-2.5 px-3 text-sm text-text-primary focus:outline-none focus:border-accent-orange/50 transition-all" />
                  </div>
                  <div>
                    <label className="text-xs text-text-muted mb-1 block">Plan</label>
                    <select value={newServer.plan} onChange={e => setNewServer(p => ({ ...p, plan: e.target.value }))} className="w-full bg-bg-input border border-border rounded-xl py-2.5 px-3 text-sm text-text-primary focus:outline-none focus:border-accent-orange/50 transition-all">
                      <option value="free">🆓 Free</option>
                      <option value="premium">👑 Premium (generates key)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-text-muted mb-1 block">Users Count</label>
                    <input type="number" min="0" value={newServer.usersCount} onChange={e => setNewServer(p => ({ ...p, usersCount: e.target.value }))} className="w-full bg-bg-input border border-border rounded-xl py-2.5 px-3 text-sm text-text-primary focus:outline-none focus:border-accent-orange/50 transition-all" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-xs text-text-muted mb-1 block">Notes</label>
                    <input value={newServer.notes} onChange={e => setNewServer(p => ({ ...p, notes: e.target.value }))} placeholder="Optional notes" className="w-full bg-bg-input border border-border rounded-xl py-2.5 px-3 text-sm text-text-primary focus:outline-none focus:border-accent-orange/50 transition-all" />
                  </div>
                </div>
                {createStatus && (
                  <div className={`flex items-center gap-2 p-3 rounded-xl text-xs ${createStatus.type === 'success' ? 'bg-wa-green/10 text-wa-green border border-wa-green/20' : 'bg-accent-red/10 text-accent-red border border-accent-red/20'}`}>
                    {createStatus.type === 'success' ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                    {createStatus.msg}
                  </div>
                )}
                <button onClick={handleCreateServer} disabled={creating || !newServer.name.trim()} className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-accent-orange to-accent-pink text-white text-xs font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 transition-all">
                  {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}Create Server
                </button>
              </div>
            )}

            {servers.length === 0 ? (
              <div className="glass rounded-2xl p-12 text-center">
                <Server className="w-10 h-10 text-text-muted mx-auto mb-3 opacity-40" />
                <p className="text-text-muted text-sm">No servers registered yet</p>
                <p className="text-text-muted text-xs mt-1">Click "Add Server" to register the first one</p>
              </div>
            ) : (
              <div className="space-y-3">
                {servers.map(server => {
                  const isEditing = editingId === server.id;
                  return (
                    <div key={server.id} className="glass rounded-2xl p-4">
                      {isEditing ? (
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <input defaultValue={server.name} onChange={e => setEditValues(p => ({ ...p, name: e.target.value }))} className="bg-bg-input border border-border rounded-xl py-2 px-3 text-sm text-text-primary focus:outline-none focus:border-accent-orange/50 transition-all" />
                            <input defaultValue={server.ownerNumber} onChange={e => setEditValues(p => ({ ...p, ownerNumber: e.target.value }))} placeholder="Owner number" className="bg-bg-input border border-border rounded-xl py-2 px-3 text-sm text-text-primary focus:outline-none focus:border-accent-orange/50 transition-all" />
                            <input type="number" min="0" defaultValue={server.usersCount} onChange={e => setEditValues(p => ({ ...p, usersCount: Number(e.target.value) }))} placeholder="Users count" className="bg-bg-input border border-border rounded-xl py-2 px-3 text-sm text-text-primary focus:outline-none focus:border-accent-orange/50 transition-all" />
                            <input defaultValue={server.notes} onChange={e => setEditValues(p => ({ ...p, notes: e.target.value }))} placeholder="Notes" className="bg-bg-input border border-border rounded-xl py-2 px-3 text-sm text-text-primary focus:outline-none focus:border-accent-orange/50 transition-all" />
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => handleSaveEdit(server.id)} className="flex items-center gap-1.5 px-3 py-1.5 bg-wa-green/10 border border-wa-green/20 text-wa-green text-xs font-medium rounded-lg hover:bg-wa-green/20 transition-all"><Check className="w-3 h-3" />Save</button>
                            <button onClick={() => { setEditingId(null); setEditValues({}); }} className="flex items-center gap-1.5 px-3 py-1.5 bg-bg-input border border-border text-text-muted text-xs font-medium rounded-lg hover:bg-bg-card transition-all"><X className="w-3 h-3" />Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3 min-w-0">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${server.plan === 'premium' ? 'bg-gradient-to-br from-accent-orange to-accent-pink' : 'bg-bg-input border border-border'}`}>
                              {server.plan === 'premium' ? <Crown className="w-4 h-4 text-white" /> : <Zap className="w-4 h-4 text-text-muted" />}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold text-text-primary text-sm">{server.name}</span>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${server.plan === 'premium' ? 'bg-accent-orange/15 text-accent-orange' : 'bg-bg-input text-text-muted border border-border'}`}>
                                  {server.plan === 'premium' ? '👑 PREMIUM' : '🆓 FREE'}
                                </span>
                              </div>
                              {server.ownerNumber && <p className="text-xs text-text-muted mt-0.5 flex items-center gap-1"><Phone className="w-3 h-3" />{server.ownerNumber}</p>}
                              <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                                <span className="text-xs text-text-muted flex items-center gap-1"><Users className="w-3 h-3" />{server.usersCount} users</span>
                                <span className="text-xs text-text-muted">{new Date(server.registeredAt).toLocaleDateString()}</span>
                                {server.notes && <span className="text-xs text-text-muted italic">"{server.notes}"</span>}
                              </div>
                              {server.key && (
                                <div className="flex items-center gap-2 mt-2 p-2 bg-accent-orange/5 border border-accent-orange/15 rounded-lg">
                                  <code className="text-xs font-mono text-accent-orange flex-1 truncate">{server.key}</code>
                                  <button onClick={() => copyToClipboard(server.key!)} className="text-text-muted hover:text-accent-orange transition-colors shrink-0">
                                    {copiedKey === server.key ? <CheckCircle className="w-3.5 h-3.5 text-wa-green" /> : <Copy className="w-3.5 h-3.5" />}
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button onClick={() => { setEditingId(server.id); setEditValues({}); }} className="p-2 rounded-lg text-text-muted hover:text-accent-orange hover:bg-accent-orange/10 transition-all"><Edit2 className="w-3.5 h-3.5" /></button>
                            <button onClick={() => handleDeleteServer(server.id)} className="p-2 rounded-lg text-text-muted hover:text-accent-red hover:bg-accent-red/10 transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Keys Tab */}
        {activeTab === 'keys' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-text-primary">Premium Keys ({keys.length})</h2>
              <button onClick={handleGenerateKey} disabled={generatingKey} className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-accent-orange to-accent-pink text-white text-xs font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 transition-all">
                {generatingKey ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Key className="w-3.5 h-3.5" />}Generate Key
              </button>
            </div>

            {keys.length === 0 ? (
              <div className="glass rounded-2xl p-12 text-center">
                <Key className="w-10 h-10 text-text-muted mx-auto mb-3 opacity-40" />
                <p className="text-text-muted text-sm">No keys generated yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {[...keys].reverse().map((k, i) => (
                  <div key={i} className={`glass rounded-xl p-4 flex items-center gap-4 ${k.activated ? 'border border-wa-green/20' : 'border border-border'}`}>
                    <div className={`w-2 h-2 rounded-full shrink-0 ${k.activated ? 'bg-wa-green' : 'bg-accent-orange'}`} />
                    <code className="flex-1 text-xs font-mono text-text-primary truncate">{k.key}</code>
                    <div className="text-right shrink-0">
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${k.activated ? 'bg-wa-green/15 text-wa-green' : 'bg-accent-orange/15 text-accent-orange'}`}>
                        {k.activated ? '✓ Activated' : 'Available'}
                      </span>
                      <p className="text-[10px] text-text-muted mt-0.5">{new Date(k.generated).toLocaleDateString()}</p>
                    </div>
                    <button onClick={() => copyToClipboard(k.key)} className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-card transition-all shrink-0">
                      {copiedKey === k.key ? <CheckCircle className="w-4 h-4 text-wa-green" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
