import { useState, useEffect } from 'react';
import { useApp } from '../store';
import {
  Server, Crown, Zap, Users, HardDrive, CheckCircle, Key, ChevronRight,
  Bot, RefreshCw, AlertCircle, Star, Shield, Lock, Wifi, Globe, MessageCircle
} from 'lucide-react';

interface ServerInfo {
  id: string;
  name: string;
  tier: 'free' | 'premium';
  maxUsers: number;
  maxStorageMB: number;
  usedStorageMB: number;
  userCount: number;
  region: string;
  features: string[];
  notes: string;
}

function CapacityBar({ used, max, label }: { used: number; max: number; label: string }) {
  const pct = Math.min(100, Math.round((used / max) * 100));
  const color = pct > 85 ? 'bg-accent-red' : pct > 60 ? 'bg-accent-orange' : 'bg-wa-green';
  return (
    <div>
      <div className="flex justify-between text-[10px] text-text-muted mb-1">
        <span>{label}</span>
        <span>{pct}% used</span>
      </div>
      <div className="h-1.5 bg-bg-input rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function ServerCard({ server, onSelect }: { server: ServerInfo; onSelect: () => void }) {
  const isPremium = server.tier === 'premium';
  const userPct = Math.round((server.userCount / server.maxUsers) * 100);
  const storagePct = Math.round((server.usedStorageMB / server.maxStorageMB) * 100);
  const isFull = userPct >= 100;

  return (
    <div className={`glass rounded-2xl p-5 border transition-all hover:scale-[1.01] ${
      isPremium ? 'border-accent-orange/30 bg-gradient-to-br from-accent-orange/5 to-accent-pink/5'
               : 'border-border hover:border-wa-green/30'
    } ${isFull ? 'opacity-60' : ''}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            isPremium ? 'bg-gradient-to-br from-accent-orange to-accent-pink' : 'bg-wa-green/15'
          }`}>
            {isPremium ? <Crown className="w-5 h-5 text-white" /> : <Server className="w-5 h-5 text-wa-green" />}
          </div>
          <div>
            <p className="text-sm font-semibold text-text-primary">{server.name}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Globe className="w-3 h-3 text-text-muted" />
              <span className="text-[10px] text-text-muted">{server.region}</span>
            </div>
          </div>
        </div>
        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
          isPremium ? 'bg-gradient-to-r from-accent-orange to-accent-pink text-white'
                   : 'bg-wa-green/15 text-wa-green'
        }`}>
          {isPremium ? '👑 PREMIUM' : '🆓 FREE'}
        </span>
      </div>

      <div className="space-y-2.5 mb-4">
        <CapacityBar used={server.userCount} max={server.maxUsers} label={`Users (${server.userCount}/${server.maxUsers})`} />
        <CapacityBar used={server.usedStorageMB} max={server.maxStorageMB} label={`Storage (${server.usedStorageMB}MB/${server.maxStorageMB}MB)`} />
      </div>

      <div className="mb-4">
        <p className="text-[10px] text-text-muted uppercase tracking-wider font-medium mb-2">
          {isPremium ? 'Included Features' : 'Free Tier Limits'}
        </p>
        <div className="space-y-1">
          {server.features.map((f, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <CheckCircle className={`w-3 h-3 shrink-0 ${isPremium ? 'text-accent-orange' : 'text-wa-green'}`} />
              <span className="text-[11px] text-text-secondary">{f}</span>
            </div>
          ))}
        </div>
        {!isPremium && (
          <p className="text-[10px] text-text-muted mt-2 italic">
            Contact admin for a premium key to unlock all features.
          </p>
        )}
      </div>

      <button
        onClick={onSelect}
        disabled={isFull}
        className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
          isFull ? 'bg-bg-input text-text-muted cursor-not-allowed'
          : isPremium ? 'bg-gradient-to-r from-accent-orange to-accent-pink text-white hover:opacity-90'
                     : 'bg-wa-green text-white hover:bg-wa-dark-green'
        }`}
      >
        {isFull ? 'Server Full' : isPremium ? <><Lock className="w-4 h-4" />Select (Key Required)</> : <><Zap className="w-4 h-4" />Select Server</>}
        {!isFull && <ChevronRight className="w-4 h-4" />}
      </button>
    </div>
  );
}

export default function ServerSelect() {
  const { setSelectedServer, setPage, botConfig, currentUser } = useApp();
  const [servers, setServers] = useState<ServerInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedForKey, setSelectedForKey] = useState<ServerInfo | null>(null);
  const [premiumKey, setPremiumKey] = useState('');
  const [keyError, setKeyError] = useState('');
  const [keyLoading, setKeyLoading] = useState(false);

  async function loadServers() {
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/servers/public');
      const data = await res.json();
      if (data.ok) setServers(data.servers);
      else setError(data.error || 'Failed to load servers');
    } catch {
      setError('Could not reach server. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadServers(); }, []);

  function handleFreeSelect(server: ServerInfo) {
    setSelectedServer({ id: server.id, name: server.name, tier: server.tier });
    setPage('pairing');
  }

  function handlePremiumSelect(server: ServerInfo) {
    setSelectedForKey(server);
    setPremiumKey(''); setKeyError('');
  }

  async function handleKeyValidate() {
    if (!premiumKey.trim()) { setKeyError('Please enter your premium key'); return; }
    setKeyLoading(true); setKeyError('');
    try {
      const res = await fetch('/api/servers/validate-key', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ key: premiumKey.trim() }),
      });
      const data = await res.json();
      if (data.ok) {
        setSelectedServer({ id: selectedForKey!.id, name: selectedForKey!.name, tier: 'premium' });
        setPage('pairing');
      } else {
        setKeyError(data.error || 'Invalid key');
      }
    } catch {
      setKeyError('Could not validate key. Please try again.');
    } finally {
      setKeyLoading(false);
    }
  }

  const freeServers = servers.filter(s => s.tier !== 'premium');
  const premiumServers = servers.filter(s => s.tier === 'premium');

  return (
    <div className="min-h-screen bg-bg-primary flex items-start justify-center pt-8 pb-16 px-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-wa-green/5 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-blue/5 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative z-10 w-full max-w-4xl">
        <div className="text-center mb-8 animate-slide-up">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-wa-green to-wa-dark-green mb-4 shadow-lg shadow-wa-green/20">
            <Bot className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary">{botConfig.botName}</h1>
          <p className="text-text-muted mt-1 text-sm">Choose a server to pair your WhatsApp account</p>
          {currentUser && (
            <p className="text-xs text-text-muted mt-1">Welcome, <span className="text-wa-green font-medium">{currentUser.displayName}</span></p>
          )}
        </div>

        {/* Premium Key Modal */}
        {selectedForKey && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="glass-strong rounded-2xl p-6 w-full max-w-md animate-slide-up">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-orange to-accent-pink flex items-center justify-center">
                  <Crown className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-text-primary text-sm">Premium Server Access</p>
                  <p className="text-[10px] text-text-muted">{selectedForKey.name}</p>
                </div>
              </div>

              <div className="mb-4">
                <div className="space-y-1.5 mb-4">
                  {selectedForKey.features.map((f, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <Star className="w-3 h-3 text-accent-orange shrink-0" />
                      <span className="text-[11px] text-text-secondary">{f}</span>
                    </div>
                  ))}
                </div>

                <label className="text-xs font-medium text-text-secondary mb-1.5 block">Premium Key</label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input
                    type="text"
                    value={premiumKey}
                    onChange={e => { setPremiumKey(e.target.value.toUpperCase()); setKeyError(''); }}
                    placeholder="EDWARD-XXXXXX-XXXXXX-XXXXXX"
                    className="w-full bg-bg-input border border-border rounded-xl py-3 pl-10 pr-4 text-sm text-text-primary font-mono placeholder:text-text-muted focus:outline-none focus:border-accent-orange/50 focus:ring-1 focus:ring-accent-orange/20 transition-all"
                  />
                </div>
                {keyError && (
                  <div className="flex items-center gap-1.5 mt-2 text-accent-red text-[11px]">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />{keyError}
                  </div>
                )}
                <p className="text-[10px] text-text-muted mt-2">Don't have a key? Contact the bot owner to get one.</p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => { setSelectedForKey(null); setPremiumKey(''); setKeyError(''); }}
                  className="flex-1 py-2.5 rounded-xl text-sm text-text-secondary hover:text-text-primary glass transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleKeyValidate}
                  disabled={keyLoading || !premiumKey.trim()}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-accent-orange to-accent-pink text-white hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
                >
                  {keyLoading
                    ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : <><Shield className="w-4 h-4" />Activate</>}
                </button>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-20">
            <div className="w-10 h-10 border-2 border-wa-green/30 border-t-wa-green rounded-full animate-spin mx-auto mb-3" />
            <p className="text-text-muted text-sm">Loading available servers...</p>
          </div>
        ) : error ? (
          <div className="glass-strong rounded-2xl p-8 text-center">
            <AlertCircle className="w-12 h-12 text-accent-red mx-auto mb-3" />
            <p className="text-text-primary font-semibold mb-1">Could not load servers</p>
            <p className="text-text-muted text-sm mb-4">{error}</p>
            <button onClick={loadServers} className="flex items-center gap-2 mx-auto px-4 py-2 bg-wa-green text-white rounded-xl text-sm font-medium hover:bg-wa-dark-green transition-colors">
              <RefreshCw className="w-4 h-4" />Try Again
            </button>
          </div>
        ) : (
          <>
            {freeServers.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <Wifi className="w-4 h-4 text-wa-green" />
                  <h2 className="text-sm font-semibold text-text-primary">Free Servers</h2>
                  <span className="text-[10px] bg-wa-green/15 text-wa-green px-2 py-0.5 rounded-full">No key required</span>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  {freeServers.map(s => (
                    <ServerCard key={s.id} server={s} onSelect={() => handleFreeSelect(s)} />
                  ))}
                </div>
              </div>
            )}

            {premiumServers.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Crown className="w-4 h-4 text-accent-orange" />
                  <h2 className="text-sm font-semibold text-text-primary">Premium Servers</h2>
                  <span className="text-[10px] bg-accent-orange/15 text-accent-orange px-2 py-0.5 rounded-full">Key required</span>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  {premiumServers.map(s => (
                    <ServerCard key={s.id} server={s} onSelect={() => handlePremiumSelect(s)} />
                  ))}
                </div>
              </div>
            )}

            {servers.length === 0 && (
              <div className="glass-strong rounded-2xl p-12 text-center">
                <Server className="w-12 h-12 text-text-muted mx-auto mb-3 opacity-50" />
                <p className="text-text-primary font-semibold mb-1">No servers available</p>
                <p className="text-text-muted text-sm">The admin hasn't set up any servers yet. Please try again later.</p>
              </div>
            )}

            <div className="mt-6 glass rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left">
              <div className="w-9 h-9 rounded-xl bg-[#25D366]/15 flex items-center justify-center shrink-0">
                <MessageCircle className="w-5 h-5 text-[#25D366]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-text-primary">Want full access?</p>
                <p className="text-xs text-text-muted">Contact the admin on WhatsApp or Telegram to get a premium key.</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <a href="https://wa.me/2347019706826" target="_blank" rel="noopener noreferrer"
                   className="px-3 py-2 rounded-xl bg-[#25D366]/15 text-[#25D366] text-xs font-medium hover:bg-[#25D366]/25 transition-colors">
                  WhatsApp
                </a>
                <a href="https://t.me/IBUKUNHASBIGBALLS" target="_blank" rel="noopener noreferrer"
                   className="px-3 py-2 rounded-xl bg-[#229ED9]/15 text-[#229ED9] text-xs font-medium hover:bg-[#229ED9]/25 transition-colors">
                  Telegram
                </a>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
