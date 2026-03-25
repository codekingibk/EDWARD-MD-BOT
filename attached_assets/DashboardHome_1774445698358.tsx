import { useApp } from '../store';
import { getTotalUsage } from '../data/plugins';
import {
  MessageSquare, Send, Terminal, Users, UsersRound, Clock, Zap, HardDrive,
  Cpu, TrendingUp, AlertTriangle, Wifi, Activity, BarChart3, ArrowUp, ArrowDown, Globe
} from 'lucide-react';

function formatUptime(ms: number) {
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

function StatCard({ icon: Icon, label, value, subtext, color, trend }: {
  icon: any; label: string; value: string; subtext?: string; color: string; trend?: 'up' | 'down';
}) {
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
        {trend && (
          <div className={`flex items-center gap-0.5 text-xs font-medium ${trend === 'up' ? 'text-wa-green' : 'text-accent-red'}`}>
            {trend === 'up' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
            {trend === 'up' ? '+12%' : '-3%'}
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-text-primary">{value}</p>
      <p className="text-xs text-text-muted mt-1">{label}</p>
      {subtext && <p className="text-xs text-text-muted mt-0.5">{subtext}</p>}
    </div>
  );
}

function MiniChart({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const h = 40;
  const w = 100;
  const step = w / (data.length - 1);

  const points = data.map((v, i) => `${i * step},${h - ((v - min) / range) * (h - 5)}`).join(' ');
  const areaPoints = `0,${h} ${points} ${w},${h}`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-10">
      <defs>
        <linearGradient id={`grad-${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill={`url(#grad-${color})`} />
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function DashboardHome() {
  const { stats, plugins, logs, botConfig } = useApp();

  const recentLogs = logs.slice(0, 8);
  const errorCount = logs.filter(l => l.level === 'error').length;
  const successCount = logs.filter(l => l.level === 'success').length;

  const chartData1 = [20, 45, 28, 80, 60, 95, 70, 85, 90, 78, 95, 100];
  const chartData2 = [30, 55, 45, 60, 50, 75, 65, 80, 70, 90, 85, 95];
  const chartData3 = [10, 15, 8, 20, 18, 25, 22, 30, 28, 35, 32, 38];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Status Banner */}
      <div className="glass rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-wa-green to-wa-dark-green flex items-center justify-center">
              <Wifi className="w-6 h-6 text-white" />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-wa-green rounded-full border-2 border-bg-card animate-pulse" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
              {botConfig.botName}
              <span className="text-xs bg-wa-green/20 text-wa-green px-2 py-0.5 rounded-full font-medium">Online</span>
            </h2>
            <p className="text-xs text-text-muted">Connected • Prefix: {botConfig.prefix} • {plugins.filter(p => p.enabled).length} plugins active</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="text-center">
            <p className="text-lg font-bold text-text-primary">{formatUptime(stats.uptime)}</p>
            <p className="text-xs text-text-muted">Uptime</p>
          </div>
          <div className="w-px h-8 bg-border" />
          <div className="text-center">
            <p className="text-lg font-bold text-text-primary">{stats.avgResponseTime}ms</p>
            <p className="text-xs text-text-muted">Avg Response</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={MessageSquare} label="Messages Received" value={formatNumber(stats.messagesReceived)} color="blue" trend="up" />
        <StatCard icon={Send} label="Messages Sent" value={formatNumber(stats.messagesSent)} color="green" trend="up" />
        <StatCard icon={Terminal} label="Commands Executed" value={formatNumber(stats.commandsExecuted)} color="purple" trend="up" />
        <StatCard icon={Users} label="Active Groups" value={stats.activeGroups.toString()} color="orange" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={UsersRound} label="Active Users" value={formatNumber(stats.activeUsers)} color="cyan" trend="up" />
        <StatCard icon={Zap} label="Total Plugins" value={`${stats.enabledPlugins}/${stats.totalPlugins}`} color="pink" />
        <StatCard icon={AlertTriangle} label="Errors Today" value={stats.errorsToday.toString()} color="red" trend="down" />
        <StatCard icon={Globe} label="Bandwidth Used" value={`${stats.bandwidthUsed} GB`} color="blue" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-wa-green" />
              <h3 className="text-sm font-semibold text-text-primary">Messages</h3>
            </div>
            <span className="text-xs text-text-muted">Last 12h</span>
          </div>
          <MiniChart data={chartData1} color="#25D366" />
          <div className="flex justify-between mt-2 text-xs text-text-muted">
            <span>12h ago</span>
            <span>Now</span>
          </div>
        </div>
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-accent-blue" />
              <h3 className="text-sm font-semibold text-text-primary">Commands</h3>
            </div>
            <span className="text-xs text-text-muted">Last 12h</span>
          </div>
          <MiniChart data={chartData2} color="#3b82f6" />
          <div className="flex justify-between mt-2 text-xs text-text-muted">
            <span>12h ago</span>
            <span>Now</span>
          </div>
        </div>
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-accent-purple" />
              <h3 className="text-sm font-semibold text-text-primary">Users</h3>
            </div>
            <span className="text-xs text-text-muted">Last 12h</span>
          </div>
          <MiniChart data={chartData3} color="#8b5cf6" />
          <div className="flex justify-between mt-2 text-xs text-text-muted">
            <span>12h ago</span>
            <span>Now</span>
          </div>
        </div>
      </div>

      {/* System Health + Recent Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* System Health */}
        <div className="glass rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-accent-cyan" />
            System Health
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-text-secondary flex items-center gap-1.5">
                  <Cpu className="w-3 h-3" /> CPU Usage
                </span>
                <span className={stats.cpuUsage > 80 ? 'text-accent-red' : 'text-wa-green'}>{stats.cpuUsage}%</span>
              </div>
              <div className="w-full bg-bg-input rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${stats.cpuUsage > 80 ? 'bg-accent-red' : stats.cpuUsage > 50 ? 'bg-accent-orange' : 'bg-wa-green'}`}
                  style={{ width: `${stats.cpuUsage}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-text-secondary flex items-center gap-1.5">
                  <HardDrive className="w-3 h-3" /> Memory Usage
                </span>
                <span className={stats.memoryUsage > 80 ? 'text-accent-red' : 'text-accent-blue'}>{stats.memoryUsage}%</span>
              </div>
              <div className="w-full bg-bg-input rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${stats.memoryUsage > 80 ? 'bg-accent-red' : stats.memoryUsage > 50 ? 'bg-accent-orange' : 'bg-accent-blue'}`}
                  style={{ width: `${stats.memoryUsage}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-text-secondary flex items-center gap-1.5">
                  <Clock className="w-3 h-3" /> Response Time
                </span>
                <span className={stats.avgResponseTime > 300 ? 'text-accent-red' : 'text-wa-green'}>{stats.avgResponseTime}ms</span>
              </div>
              <div className="w-full bg-bg-input rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${stats.avgResponseTime > 300 ? 'bg-accent-red' : 'bg-wa-green'}`}
                  style={{ width: `${Math.min(stats.avgResponseTime / 5, 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-3 mt-5 pt-4 border-t border-border">
            <div className="bg-bg-input rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-text-primary">{getTotalUsage(plugins).toLocaleString()}</p>
              <p className="text-xs text-text-muted">Total Plugin Uses</p>
            </div>
            <div className="bg-bg-input rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-text-primary">{successCount}/{errorCount}</p>
              <p className="text-xs text-text-muted">Success/Errors</p>
            </div>
          </div>
        </div>

        {/* Recent Logs */}
        <div className="glass rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-wa-green" />
            Recent Activity
          </h3>
          <div className="space-y-2 max-h-[340px] overflow-y-auto">
            {recentLogs.length === 0 ? (
              <p className="text-text-muted text-sm text-center py-8">No logs yet. Bot activity will appear here.</p>
            ) : (
              recentLogs.map(log => (
                <div key={log.id} className="flex items-start gap-2.5 bg-bg-input/50 rounded-lg px-3 py-2">
                  <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                    log.level === 'info' ? 'bg-accent-blue' :
                    log.level === 'success' ? 'bg-wa-green' :
                    log.level === 'warn' ? 'bg-accent-orange' : 'bg-accent-red'
                  }`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-text-secondary truncate">{log.message}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {log.source && <span className="text-[10px] text-text-muted">{log.source}</span>}
                      <span className="text-[10px] text-text-muted">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
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
          <TrendingUp className="w-4 h-4 text-accent-pink" />
          Top Used Plugins
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[...plugins].sort((a, b) => b.usageCount - a.usageCount).slice(0, 8).map((plugin, i) => (
            <div key={plugin.id} className="bg-bg-input rounded-xl p-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-wa-green/20 to-accent-blue/20 flex items-center justify-center text-xs font-bold text-wa-green">
                #{i + 1}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-text-primary truncate">{plugin.name}</p>
                <p className="text-[10px] text-text-muted">{plugin.usageCount.toLocaleString()} uses</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
