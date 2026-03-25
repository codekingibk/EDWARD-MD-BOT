import { useState, useEffect, useRef } from 'react';
import { useApp } from '../store';
import { Activity, Search, Trash2, Download, Filter, Info, AlertTriangle, XCircle, CheckCircle2, Pause, Play, ChevronDown } from 'lucide-react';

export default function Logs() {
  const { logs, clearLogs } = useApp();
  const [filter, setFilter] = useState<'all' | 'info' | 'success' | 'warn' | 'error'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [paused, setPaused] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleLogs, setVisibleLogs] = useState(logs);

  useEffect(() => {
    if (paused) return;
    const filtered = logs.filter(l => {
      if (filter !== 'all' && l.level !== filter) return false;
      if (searchQuery && !l.message.toLowerCase().includes(searchQuery.toLowerCase()) && !(l.source && l.source.toLowerCase().includes(searchQuery.toLowerCase()))) return false;
      return true;
    });
    setVisibleLogs(filtered);
  }, [logs, filter, searchQuery, paused]);

  useEffect(() => { if (autoScroll && containerRef.current) containerRef.current.scrollTop = 0; }, [visibleLogs, autoScroll]);

  const levelConfig = {
    info: { icon: Info, color: 'text-accent-blue', bg: 'bg-accent-blue/10', border: 'border-accent-blue/20', label: 'INFO' },
    success: { icon: CheckCircle2, color: 'text-wa-green', bg: 'bg-wa-green/10', border: 'border-wa-green/20', label: 'OK' },
    warn: { icon: AlertTriangle, color: 'text-accent-orange', bg: 'bg-accent-orange/10', border: 'border-accent-orange/20', label: 'WARN' },
    error: { icon: XCircle, color: 'text-accent-red', bg: 'bg-accent-red/10', border: 'border-accent-red/20', label: 'ERR' },
  };

  const counts = { all: logs.length, info: logs.filter(l => l.level === 'info').length, success: logs.filter(l => l.level === 'success').length, warn: logs.filter(l => l.level === 'warn').length, error: logs.filter(l => l.level === 'error').length };

  const handleExport = () => {
    const text = visibleLogs.map(l => `[${new Date(l.timestamp).toISOString()}] [${l.level.toUpperCase()}] ${l.source ? `[${l.source}] ` : ''}${l.message}`).join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `edward-md-logs-${Date.now()}.txt`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div><h2 className="text-xl font-bold text-text-primary flex items-center gap-2"><Activity className="w-5 h-5 text-wa-green" />Live Logs</h2><p className="text-sm text-text-muted mt-1">{visibleLogs.length} entries • {paused ? 'Paused' : 'Live'}</p></div>
        <div className="flex items-center gap-2">
          <button onClick={() => setPaused(!paused)} className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${paused ? 'bg-wa-green/10 border border-wa-green/20 text-wa-green' : 'bg-accent-orange/10 border border-accent-orange/20 text-accent-orange'}`}>
            {paused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}{paused ? 'Resume' : 'Pause'}
          </button>
          <button onClick={handleExport} className="flex items-center gap-1.5 px-3 py-2 bg-accent-blue/10 border border-accent-blue/20 text-accent-blue text-xs font-medium rounded-lg hover:bg-accent-blue/20 transition-colors"><Download className="w-3 h-3" />Export</button>
          <button onClick={clearLogs} className="flex items-center gap-1.5 px-3 py-2 bg-accent-red/10 border border-accent-red/20 text-accent-red text-xs font-medium rounded-lg hover:bg-accent-red/20 transition-colors"><Trash2 className="w-3 h-3" />Clear</button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full bg-bg-input border border-border rounded-xl py-2.5 pl-10 pr-4 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-wa-green/50 focus:ring-1 focus:ring-wa-green/20 transition-all" placeholder="Filter logs..." />
        </div>
        <div className="flex gap-1.5">
          {(['all', 'info', 'success', 'warn', 'error'] as const).map(level => (
            <button key={level} onClick={() => setFilter(level)} className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors flex items-center gap-1 ${filter === level ? level === 'all' ? 'bg-wa-green/15 text-wa-green border border-wa-green/30' : `${levelConfig[level as keyof typeof levelConfig].bg} ${levelConfig[level as keyof typeof levelConfig].color} border ${levelConfig[level as keyof typeof levelConfig].border}` : 'glass text-text-secondary hover:text-text-primary'}`}>
              {level === 'all' ? <Filter className="w-3 h-3" /> : null}
              {level === 'all' ? 'All' : levelConfig[level as keyof typeof levelConfig].label}
              <span className="opacity-70">{counts[level]}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="glass rounded-2xl overflow-hidden">
        <div className="bg-bg-input/50 px-4 py-2 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-text-muted font-mono">
            <div className={`w-2 h-2 rounded-full ${paused ? 'bg-accent-orange' : 'bg-wa-green'} animate-pulse`} />
            {paused ? 'PAUSED' : 'STREAMING'}
          </div>
          <button onClick={() => setAutoScroll(!autoScroll)} className={`text-xs flex items-center gap-1 ${autoScroll ? 'text-wa-green' : 'text-text-muted'}`}>
            <ChevronDown className="w-3 h-3" />Auto-scroll {autoScroll ? 'ON' : 'OFF'}
          </button>
        </div>
        <div ref={containerRef} className="max-h-[500px] overflow-y-auto p-2 space-y-1 font-mono">
          {visibleLogs.length === 0 ? (
            <div className="text-center py-16"><Activity className="w-10 h-10 text-text-muted mx-auto mb-3 opacity-50" /><p className="text-text-muted text-sm">No log entries to display</p><p className="text-text-muted text-xs mt-1">Logs will appear here as the bot processes messages</p></div>
          ) : (
            visibleLogs.map(log => {
              const config = levelConfig[log.level];
              const LevelIcon = config.icon;
              return (
                <div key={log.id} className={`flex items-start gap-2 px-3 py-2 rounded-lg ${config.bg} border ${config.border} animate-fade-in`}>
                  <LevelIcon className={`w-3.5 h-3.5 ${config.color} mt-0.5 shrink-0`} />
                  <div className="min-w-0 flex-1 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                    <span className="text-[10px] text-text-muted shrink-0 tabular-nums">{new Date(log.timestamp).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                    {log.source && <span className={`text-[10px] ${config.color} shrink-0 px-1.5 py-0.5 rounded ${config.bg}`}>{log.source}</span>}
                    <span className="text-xs text-text-secondary truncate">{log.message}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
