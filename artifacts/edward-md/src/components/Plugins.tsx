import { useState } from 'react';
import { useApp } from '../store';
import { pluginCategories, getPluginsByCategory } from '../data/plugins';
import {
  Search, ToggleLeft, ToggleRight, Download, Users, Shield, Gamepad2, Wrench,
  Image, Brain, Crown, ArrowLeftRight, Smile, Tv, EyeOff, Grid3X3, Zap, Hash,
  CheckCircle2, XCircle, Power, PowerOff, Play, X, Loader2
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import ExecutionModal from './ExecutionModal';
import type { Plugin } from '../data/plugins';

const iconMap: Record<string, LucideIcon> = {
  Grid3X3, Download, Users, Shield, Gamepad2, Wrench, Search,
  Image, Brain, Crown, ArrowLeftRight, Smile, Tv, EyeOff,
};

async function safeJson(res: Response) {
  const text = await res.text();
  if (!text) return {} as any;
  try { return JSON.parse(text); } catch { return { ok: false, error: text.slice(0, 200) } as any; }
}

function RunModal({ plugin, onClose }: { plugin: Plugin; onClose: () => void }) {
  const [args, setArgs] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  async function handleRun() {
    setLoading(true); setError(''); setResult(null);
    const argList = args.trim() ? args.trim().split(/\s+/) : [];
    try {
      const exec = (window as any).executePlugin;
      let res: any;
      if (exec) {
        res = await exec(plugin.id, argList);
      } else {
        const r = await fetch('/api/execute', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ id: plugin.id, args: argList }),
        });
        const data = await safeJson(r);
        if (!r.ok) throw new Error(data?.error || `HTTP ${r.status}`);
        res = data;
      }
      setResult(res?.output ?? res);
    } catch (e: any) {
      setError(e.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-bg-card border border-border rounded-2xl p-5 w-full max-w-md z-10 animate-slide-up shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-text-primary text-sm flex items-center gap-2">
              <Play className="w-4 h-4 text-wa-green" />{plugin.name}
            </h3>
            <code className="text-[10px] text-text-muted font-mono">{plugin.usage}</code>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-text-muted mb-4">{plugin.description}</p>

        <div className="mb-4">
          <label className="text-xs font-medium text-text-secondary block mb-1.5">
            Arguments <span className="text-text-muted font-normal">(space-separated, leave blank if none)</span>
          </label>
          <input
            type="text"
            value={args}
            onChange={e => setArgs(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !loading) handleRun(); }}
            placeholder={`e.g. ${plugin.usage.replace(/^\.[\w-]+\s*/, '') || 'no arguments needed'}`}
            className="w-full bg-bg-input border border-border rounded-xl py-2.5 px-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-wa-green/50 focus:ring-1 focus:ring-wa-green/20 transition-all font-mono"
            autoFocus
          />
        </div>

        {error && (
          <div className="mb-3 p-3 bg-accent-red/10 border border-accent-red/20 rounded-xl text-xs text-accent-red">
            {error}
          </div>
        )}

        {result !== null && (
          <div className="mb-3 p-3 bg-bg-input rounded-xl border border-border max-h-40 overflow-auto">
            <pre className="text-xs text-text-secondary whitespace-pre-wrap break-words font-mono">
              {typeof result === 'string' ? result : JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm text-text-secondary hover:text-text-primary glass transition-colors"
          >
            Close
          </button>
          <button
            onClick={handleRun}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-wa-green text-white hover:bg-wa-dark-green disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
          >
            {loading
              ? <><Loader2 className="w-4 h-4 animate-spin" />Running...</>
              : <><Play className="w-4 h-4" />Run</>}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Plugins() {
  const { plugins, togglePlugin, toggleAllPlugins } = useApp();
  const [resultModalOpen, setResultModalOpen] = useState(false);
  const [resultModalTitle, setResultModalTitle] = useState('');
  const [resultModalData, setResultModalData] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [runPlugin, setRunPlugin] = useState<Plugin | null>(null);

  const filtered = getPluginsByCategory(plugins, selectedCategory).filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.command.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const enabledInCategory = filtered.filter(p => p.enabled).length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
            <Zap className="w-5 h-5 text-wa-green" />Plugin Manager
          </h2>
          <p className="text-sm text-text-muted mt-1">
            {enabledInCategory}/{filtered.length} enabled • {plugins.length} total plugins
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => toggleAllPlugins(selectedCategory, true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-wa-green/10 border border-wa-green/20 text-wa-green text-xs font-medium rounded-lg hover:bg-wa-green/20 transition-colors"
          >
            <Power className="w-3 h-3" />Enable All
          </button>
          <button
            onClick={() => toggleAllPlugins(selectedCategory, false)}
            className="flex items-center gap-1.5 px-3 py-2 bg-accent-red/10 border border-accent-red/20 text-accent-red text-xs font-medium rounded-lg hover:bg-accent-red/20 transition-colors"
          >
            <PowerOff className="w-3 h-3" />Disable All
          </button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full bg-bg-input border border-border rounded-xl py-3 pl-10 pr-4 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-wa-green/50 focus:ring-1 focus:ring-wa-green/20 transition-all"
          placeholder="Search plugins by name, command, or description..."
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
        {pluginCategories.map(cat => {
          const Icon = iconMap[cat.icon] || Grid3X3;
          const count = cat.id === 'all' ? plugins.length : plugins.filter(p => p.category === cat.id).length;
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all shrink-0 ${
                isActive ? 'bg-wa-green/15 text-wa-green border border-wa-green/30' : 'glass text-text-secondary hover:text-text-primary'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />{cat.name}
              <span className={`px-1.5 py-0.5 rounded text-[10px] ${isActive ? 'bg-wa-green/20' : 'bg-bg-input'}`}>{count}</span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {filtered.map(plugin => {
          const catInfo = pluginCategories.find(c => c.id === plugin.category);
          return (
            <div
              key={plugin.id}
              className={`glass rounded-xl p-4 transition-all stat-card ${plugin.enabled ? 'border-wa-green/10' : 'opacity-60'}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold"
                    style={{ backgroundColor: `${catInfo?.color || '#25D366'}15`, color: catInfo?.color || '#25D366' }}
                  >
                    <Hash className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-text-primary">{plugin.name}</h4>
                    <code className="text-[10px] text-text-muted font-mono bg-bg-input px-1.5 py-0.5 rounded">{plugin.usage}</code>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => togglePlugin(plugin.id)}
                    className="shrink-0"
                    title={plugin.enabled ? 'Disable plugin' : 'Enable plugin'}
                  >
                    {plugin.enabled
                      ? <ToggleRight className="w-8 h-8 text-wa-green" />
                      : <ToggleLeft className="w-8 h-8 text-text-muted" />}
                  </button>
                  <button
                    onClick={() => setRunPlugin(plugin)}
                    className="px-3 py-1.5 rounded-lg bg-wa-green/10 text-wa-green text-xs font-medium hover:bg-wa-green/20 transition-colors flex items-center gap-1"
                    title="Run this plugin"
                  >
                    <Play className="w-3 h-3" />Run
                  </button>
                </div>
              </div>
              <p className="text-xs text-text-muted mb-3 line-clamp-2">{plugin.description}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-[10px] text-text-muted">
                  <span className="flex items-center gap-1">
                    {plugin.enabled
                      ? <CheckCircle2 className="w-3 h-3 text-wa-green" />
                      : <XCircle className="w-3 h-3 text-accent-red" />}
                    {plugin.enabled ? 'Active' : 'Disabled'}
                  </span>
                  <span>⏱ {plugin.cooldown}s CD</span>
                </div>
                <span className="text-[10px] text-text-muted">{plugin.usageCount.toLocaleString()} uses</span>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <Search className="w-10 h-10 text-text-muted mx-auto mb-3" />
          <p className="text-text-secondary text-sm">No plugins found matching your search.</p>
        </div>
      )}

      {runPlugin && (
        <RunModal plugin={runPlugin} onClose={() => setRunPlugin(null)} />
      )}

      <ExecutionModal
        open={resultModalOpen}
        onClose={() => setResultModalOpen(false)}
        title={resultModalTitle}
        result={resultModalData}
      />
    </div>
  );
}
