import { useState } from 'react';
import { useApp } from '../store';
import {
  MessageSquare, Send, Terminal, Users, UsersRound, Clock, Zap, HardDrive,
  Cpu, TrendingUp, AlertTriangle, Wifi, WifiOff, Activity, BarChart3, Globe, RefreshCw
} from 'lucide-react';

function formatUptime(ms: number) {
  if (!ms) return '—';
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m ${sec}s`;
  return `${m}m ${sec}s`;
}

function formatNumber(n: number) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n.toString();
}

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color: string }) {
  const colorMap: Record<string, string> = {
    green: 'from-wa-green/10 to-wa-green/5 border-wa-green/20 text-wa-green',
    blue: 'from-accent-blue/10 to-accent-blue/5 border-accent-blue/20 text-accent-blue',
    purple: 'from-accent-purple/10 to-accent-purple/5 border-accent-purple/20 text-accent-purple',
    orange: 'from-accent-orange/10 to-accent-orange/5 border-accent-orange/20 text-accent-orange',
    cyan: 'from-accent-cyan/10 to-accent-cyan/5 border-accent-cyan/20 text-accent-cyan',
    pink: 'from-accent-pink/10 to-accent-pink/5 border-accent-pink/20 text-accent-pink',
    red: 'from-accent-red/10 to-accent-red/5 border-accent-red/20 text-accent-red',
  };
  const c = colorMap[color] || colorMap.green;
  const parts = c.split(' ');
  const textColor = parts[parts.length - 1];

  return (
    <div className={`stat-card bg-gradient-to-br ${c} border rounded-2xl p-5`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${parts[0].replace('/10', '/20')} ${parts[1].replace('/5', '/10')} flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${textColor}`} />
        </div>
      </div>
      <p className="text-2xl font-bold text-text-primary">{value}</p>
      <p className="text-xs text-text-muted mt-1">{label}</p>
    </div>
  );
}

function MiniChart({ data, color }: { data: number[]; color: string }) {
  const safeData = data.length >= 2 ? data : [...data, ...new Array(Math.max(0, 2 - data.length)).fill(0)];
  const max = Math.max(...safeData, 1);
  const min = Math.min(...safeData, 0);
  const range = max - min || 1;
  const h = 40, w = 100;
  const step = w / (safeData.length - 1);
  const points = safeData.map((v, i) => `${i * step},${h - ((v - min) / range) * (h - 5)}`).join(' ');
  const areaPoints = `0,${h} ${points} ${w},${h}`;
  const gradId = `grad-${color.replace('#', '')}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-10">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill={`url(#${gradId})`} />
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function DashboardHome() {
  const { stats, plugins, logs, botConfig, isConnected } = useApp();
  const recentLogs = logs.slice(0, 8);
  const errorCount = logs.filter(l => l.level === 'error').length;
  const successCount = logs.filter(l => l.level === 'success').length;

  const msgHistory = stats.history?.messages?.length ? stats.history.messages : [0, 0];
  const cmdHistory = stats.history?.commands?.length ? stats.history.commands : [0, 0];
  const userHistory = stats.history?.users?.length ? stats.history.users : [0, 0];

  const totalPluginUses = stats.commandsExecuted;
  const memLabel = stats.memoryUsedMB ? `${stats.memoryUsedMB}MB / ${stats.memoryTotalMB}MB` : '';

  const [reconnecting, setReconnecting] = useState(false);
  const [reconnectMsg, setReconnectMsg] = useState('');

  const handleReconnect = async () => {
    setReconnecting(true);
    setReconnectMsg('');
    try {
      const res = await fetch('/api/restart', { method: 'POST' });
      const d = await res.json().catch(() => ({}));
      setReconnectMsg(d.message || 'Reconnecting…');
    } catch {
      setReconnectMsg('Failed to reconnect.');
    } finally {
      setTimeout(() => { setReconnecting(false); setReconnectMsg(''); }, 4000);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Status Banner */}
      <div className="glass rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isConnected ? 'bg-gradient-to-br from-wa-green to-wa-dark-green' : 'bg-gradient-to-br from-gray-500 to-gray-700'}`}>
              {isConnected ? <Wifi className="w-6 h-6 text-white" /> : <WifiOff className="w-6 h-6 text-white" />}
            </div>
            {isConnected && <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-wa-green rounded-full border-2 border-bg-card animate-pulse" />}
          </div>
          <div>
            <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
              {botConfig.botName}
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isConnected ? 'bg-wa-green/20 text-wa-green' : 'bg-gray-500/20 text-gray-400'}`}>
                {isConnected ? 'Online' : 'Offline'}
              </span>
            </h2>
            <p className="text-xs text-text-muted">
              {isConnected ? 'Connected' : 'Disconnected'} • Prefix: {botConfig.prefix} • {plugins.filter(p => p.enabled).length} plugins active
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <div className="text-center">
            <p className="text-lg font-bold text-text-primary">{formatUptime(stats.uptime)}</p>
            <p className="text-xs text-text-muted">Uptime</p>
          </div>
          <div className="w-px h-8 bg-border" />
          <div className="text-center">
            <p className="text-lg font-bold text-text-primary">{stats.totalPlugins || plugins.length}</p>
            <p className="text-xs text-text-muted">Plugins Loaded</p>
          </div>
          <div className="w-px h-8 bg-border" />
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={handleReconnect}
              disabled={reconnecting}
              title="Reconnect WhatsApp without clearing session"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-accent-blue/10 border border-accent-blue/25 text-accent-blue text-xs font-medium rounded-lg hover:bg-accent-blue/20 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${reconnecting ? 'animate-spin' : ''}`} />
              {reconnecting ? 'Reconnecting…' : 'Reconnect'}
            </button>
            {reconnectMsg && <p className="text-[10px] text-text-muted max-w-[110px] text-center leading-tight">{reconnectMsg}</p>}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={MessageSquare} label="Messages Received" value={formatNumber(stats.messagesReceived)} color="blue" />
        <StatCard icon={Send} label="Messages Sent" value={formatNumber(stats.messagesSent)} color="green" />
        <StatCard icon={Terminal} label="Commands Executed" value={formatNumber(stats.commandsExecuted)} color="purple" />
        <StatCard icon={Users} label="Active Groups" value={stats.activeGroups.toString()} color="orange" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={UsersRound} label="Active Users" value={formatNumber(stats.activeUsers)} color="cyan" />
        <StatCard icon={Zap} label="Plugins" value={`${stats.enabledPlugins}/${stats.totalPlugins || plugins.length}`} color="pink" />
        <StatCard icon={AlertTriangle} label="Errors Today" value={stats.errorsToday.toString()} color="red" />
        <StatCard icon={Globe} label="Memory Used" value={stats.memoryUsedMB ? `${stats.memoryUsedMB} MB` : '—'} color="blue" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {[
          { icon: BarChart3, title: 'Messages (5min intervals)', data: msgHistory, color: '#25D366', iconColor: 'text-wa-green' },
          { icon: Activity, title: 'Commands (5min intervals)', data: cmdHistory, color: '#3b82f6', iconColor: 'text-accent-blue' },
          { icon: TrendingUp, title: 'Active Users', data: userHistory, color: '#8b5cf6', iconColor: 'text-accent-purple' },
        ].map(({ icon: Icon, title, data, color, iconColor }) => (
          <div key={title} className="glass rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Icon className={`w-4 h-4 ${iconColor}`} />
                <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
              </div>
              <span className="text-xs text-text-muted">Live</span>
            </div>
            <MiniChart data={data} color={color} />
            <div className="flex justify-between mt-2 text-xs text-text-muted">
              <span>Earlier</span><span>Now</span>
            </div>
          </div>
        ))}
      </div>

      {/* System Health + Recent Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-accent-cyan" />System Health
          </h3>
          <div className="space-y-4">
            {[
              { icon: Cpu, label: 'CPU Usage', value: stats.cpuUsage, threshold: 80, colorHigh: 'bg-accent-red', colorMid: 'bg-accent-orange', colorLow: 'bg-wa-green', textHigh: 'text-accent-red', textLow: 'text-wa-green', displayMax: 100, unit: '%' },
              { icon: HardDrive, label: 'Memory Usage', value: stats.memoryUsage, threshold: 80, colorHigh: 'bg-accent-red', colorMid: 'bg-accent-orange', colorLow: 'bg-accent-blue', textHigh: 'text-accent-red', textLow: 'text-accent-blue', displayMax: 100, unit: '%' },
            ].map(({ icon: Icon, label, value, threshold, colorHigh, colorMid, colorLow, textHigh, textLow, displayMax, unit }) => (
              <div key={label}>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-text-secondary flex items-center gap-1.5"><Icon className="w-3 h-3" />{label}</span>
                  <span className={value > threshold ? textHigh : textLow}>{value > 0 ? `${Math.round(value)}${unit}` : '—'}</span>
                </div>
                <div className="w-full bg-bg-input rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${value > threshold ? colorHigh : value > threshold * 0.6 ? colorMid : colorLow}`}
                    style={{ width: `${Math.min((value / displayMax) * 100, 100)}%` }}
                  />
                </div>
              </div>
            ))}
            {memLabel && (
              <p className="text-[10px] text-text-muted pt-1">{memLabel} RAM used by bot process</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3 mt-5 pt-4 border-t border-border">
            <div className="bg-bg-input rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-text-primary">{totalPluginUses.toLocaleString()}</p>
              <p className="text-xs text-text-muted">Total Commands Run</p>
            </div>
            <div className="bg-bg-input rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-text-primary">{successCount}/{errorCount}</p>
              <p className="text-xs text-text-muted">Success/Errors (logs)</p>
            </div>
          </div>
        </div>

        <div className="glass rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-wa-green" />Recent Activity
          </h3>
          <div className="space-y-2 max-h-[340px] overflow-y-auto">
            {recentLogs.length === 0 ? (
              <p className="text-text-muted text-sm text-center py-8">No activity yet. Connect the bot to see live logs here.</p>
            ) : (
              recentLogs.map(log => (
                <div key={log.id} className="flex items-start gap-2.5 bg-bg-input/50 rounded-lg px-3 py-2">
                  <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${log.level === 'info' ? 'bg-accent-blue' : log.level === 'success' ? 'bg-wa-green' : log.level === 'warn' ? 'bg-accent-orange' : 'bg-accent-red'}`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-text-secondary truncate">{log.message}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {log.source && <span className="text-[10px] text-text-muted">{log.source}</span>}
                      <span className="text-[10px] text-text-muted">{new Date(log.timestamp).toLocaleTimeString()}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Top Plugins */}
      <div className="glass rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-accent-pink" />Top Used Commands
        </h3>
        {[...plugins].filter(p => p.usageCount > 0).sort((a, b) => b.usageCount - a.usageCount).length === 0 ? (
          <p className="text-text-muted text-sm text-center py-4">No commands used yet. Usage will appear here after commands are run on WhatsApp.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[...plugins].sort((a, b) => b.usageCount - a.usageCount).slice(0, 8).map((plugin, i) => (
              <div key={plugin.id} className="bg-bg-input rounded-xl p-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-wa-green/20 to-accent-blue/20 flex items-center justify-center text-xs font-bold text-wa-green">#{i + 1}</div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-text-primary truncate">{plugin.name}</p>
                  <p className="text-[10px] text-text-muted">{plugin.usageCount.toLocaleString()} uses</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
