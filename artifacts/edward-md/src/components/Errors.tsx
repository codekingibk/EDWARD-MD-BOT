import { useState, useEffect, useRef } from 'react';
import { useApp } from '../store';
import {
  AlertTriangle, XCircle, Search, Download, Trash2, Send, Copy, Check,
  Bug, RefreshCw, ExternalLink, Filter, ChevronDown, ChevronUp, Clock
} from 'lucide-react';

const API = import.meta.env.VITE_API_URL || '';

interface ErrorEntry {
  id: string;
  timestamp: number;
  level: 'error' | 'warn';
  message: string;
  source?: string;
}

interface PostResult {
  type: 'success' | 'error';
  msg: string;
}

function ErrorCard({ entry, currentUserId, userDisplayName, onPosted }: {
  entry: ErrorEntry;
  currentUserId: string;
  userDisplayName: string;
  onPosted: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [posting, setPosting] = useState(false);
  const [postResult, setPostResult] = useState<PostResult | null>(null);
  const [copied, setCopied] = useState(false);

  const isError = entry.level === 'error';

  const errorText = `[${new Date(entry.timestamp).toLocaleString()}] [${entry.level.toUpperCase()}]${entry.source ? ` [${entry.source}]` : ''} ${entry.message}`;

  function copyError() {
    navigator.clipboard.writeText(errorText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  async function postToCommunity() {
    setPosting(true);
    setPostResult(null);
    try {
      const title = `[${isError ? 'ERROR' : 'WARN'}] ${entry.source ? `[${entry.source}] ` : ''}${entry.message.slice(0, 80)}${entry.message.length > 80 ? '...' : ''}`;
      const content = `**Bot Error Report**\n\nOccurred at: ${new Date(entry.timestamp).toLocaleString()}\nSource: ${entry.source || 'Unknown'}\nLevel: ${entry.level.toUpperCase()}\n\n**Error Message:**\n\`\`\`\n${entry.message}\n\`\`\`\n\nReported by: ${userDisplayName}\n\nHas anyone else encountered this? Can an admin help fix this?`;

      const res = await fetch(`${API}/api/community/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          content,
          category: 'bugs',
          authorName: userDisplayName,
          authorId: currentUserId,
        }),
      });
      const data = await res.json();
      if (data._id || data.ok) {
        setPostResult({ type: 'success', msg: 'Posted to community! Others can now see and help.' });
        onPosted(entry.id);
      } else {
        setPostResult({ type: 'error', msg: data.error || 'Failed to post. Try again.' });
      }
    } catch (e: any) {
      setPostResult({ type: 'error', msg: `Network error: ${e.message}` });
    }
    setPosting(false);
  }

  return (
    <div className={`glass rounded-xl border overflow-hidden ${isError ? 'border-accent-red/30' : 'border-accent-orange/30'}`}>
      <div
        className={`flex items-start gap-3 p-4 cursor-pointer ${isError ? 'hover:bg-accent-red/5' : 'hover:bg-accent-orange/5'} transition-colors`}
        onClick={() => setExpanded(!expanded)}
      >
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${isError ? 'bg-accent-red/15 text-accent-red' : 'bg-accent-orange/15 text-accent-orange'}`}>
          {isError ? <XCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isError ? 'bg-accent-red/15 text-accent-red' : 'bg-accent-orange/15 text-accent-orange'}`}>
              {entry.level.toUpperCase()}
            </span>
            {entry.source && (
              <span className="text-[10px] bg-bg-input text-text-muted px-2 py-0.5 rounded-full border border-border font-mono">
                {entry.source}
              </span>
            )}
            <span className="text-[10px] text-text-muted flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {new Date(entry.timestamp).toLocaleString()}
            </span>
          </div>
          <p className="text-sm text-text-primary font-mono leading-relaxed break-all">{entry.message}</p>
        </div>
        <div className="text-text-muted shrink-0">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </div>

      {expanded && (
        <div className={`border-t px-4 py-3 space-y-3 ${isError ? 'border-accent-red/20 bg-accent-red/5' : 'border-accent-orange/20 bg-accent-orange/5'}`}>
          <div className="bg-bg-primary/80 rounded-lg p-3 font-mono text-xs text-text-secondary break-all border border-border">
            {errorText}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={copyError}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-accent-blue/10 border border-accent-blue/20 text-accent-blue text-xs font-medium rounded-lg hover:bg-accent-blue/20 transition-colors"
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied ? 'Copied!' : 'Copy Error'}
            </button>

            {!postResult?.type || postResult.type === 'error' ? (
              <button
                onClick={postToCommunity}
                disabled={posting}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-wa-green/10 border border-wa-green/20 text-wa-green text-xs font-medium rounded-lg hover:bg-wa-green/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {posting ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                {posting ? 'Posting...' : 'Post to Community'}
              </button>
            ) : null}
          </div>

          {postResult && (
            <div className={`flex items-center gap-2 p-2.5 rounded-lg text-xs font-medium ${postResult.type === 'success' ? 'bg-wa-green/10 text-wa-green border border-wa-green/20' : 'bg-accent-red/10 text-accent-red border border-accent-red/20'}`}>
              {postResult.type === 'success' ? <Check className="w-3.5 h-3.5 shrink-0" /> : <XCircle className="w-3.5 h-3.5 shrink-0" />}
              {postResult.msg}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function Errors() {
  const { logs, clearLogs, currentUser } = useApp();
  const [filter, setFilter] = useState<'all' | 'error' | 'warn'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [postedIds, setPostedIds] = useState<Set<string>>(new Set());

  const errorLogs: ErrorEntry[] = logs.filter(l => l.level === 'error' || l.level === 'warn') as ErrorEntry[];

  const filtered = errorLogs.filter(l => {
    if (filter !== 'all' && l.level !== filter) return false;
    if (searchQuery && !l.message.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !(l.source && l.source.toLowerCase().includes(searchQuery.toLowerCase()))) return false;
    return true;
  });

  const counts = {
    all: errorLogs.length,
    error: errorLogs.filter(l => l.level === 'error').length,
    warn: errorLogs.filter(l => l.level === 'warn').length,
  };

  function handleExport() {
    const text = filtered.map(l =>
      `[${new Date(l.timestamp).toISOString()}] [${l.level.toUpperCase()}]${l.source ? ` [${l.source}]` : ''} ${l.message}`
    ).join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `edward-md-errors-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleClearErrors() {
    clearLogs();
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
            <Bug className="w-5 h-5 text-accent-red" />
            Error Log
          </h2>
          <p className="text-sm text-text-muted mt-1">
            {counts.error} error{counts.error !== 1 ? 's' : ''} · {counts.warn} warning{counts.warn !== 1 ? 's' : ''} · Post to community for help
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            disabled={filtered.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 bg-accent-blue/10 border border-accent-blue/20 text-accent-blue text-xs font-medium rounded-lg hover:bg-accent-blue/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Download className="w-3 h-3" />Export
          </button>
          <button
            onClick={handleClearErrors}
            disabled={errorLogs.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 bg-accent-red/10 border border-accent-red/20 text-accent-red text-xs font-medium rounded-lg hover:bg-accent-red/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-3 h-3" />Clear
          </button>
        </div>
      </div>

      {counts.all > 0 && (
        <div className="glass rounded-2xl p-4 border border-accent-orange/20 bg-accent-orange/5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-accent-orange shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-text-primary">How to use this page</p>
              <p className="text-xs text-text-muted mt-1 leading-relaxed">
                Bot errors and warnings are logged here automatically. You can expand any error to see full details,
                copy the error message, or <strong className="text-wa-green">post it to the community</strong> to ask for help,
                check if others have the same issue, or request a fix from the admin.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-bg-input border border-border rounded-xl py-2.5 pl-10 pr-4 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-red/50 focus:ring-1 focus:ring-accent-red/20 transition-all"
            placeholder="Search errors..."
          />
        </div>
        <div className="flex gap-1.5">
          {(['all', 'error', 'warn'] as const).map(lvl => (
            <button
              key={lvl}
              onClick={() => setFilter(lvl)}
              className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors flex items-center gap-1 ${
                filter === lvl
                  ? lvl === 'error'
                    ? 'bg-accent-red/15 text-accent-red border border-accent-red/30'
                    : lvl === 'warn'
                    ? 'bg-accent-orange/15 text-accent-orange border border-accent-orange/30'
                    : 'bg-wa-green/15 text-wa-green border border-wa-green/30'
                  : 'glass text-text-secondary hover:text-text-primary'
              }`}
            >
              <Filter className="w-3 h-3" />
              {lvl === 'all' ? 'All' : lvl === 'error' ? 'Errors' : 'Warnings'}
              <span className="opacity-70">{counts[lvl]}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center border border-border">
            <Bug className="w-12 h-12 text-text-muted mx-auto mb-4 opacity-40" />
            <p className="text-text-primary font-medium">
              {errorLogs.length === 0 ? 'No errors logged' : 'No errors match your filter'}
            </p>
            <p className="text-text-muted text-sm mt-1">
              {errorLogs.length === 0
                ? 'Great news! Your bot is running cleanly. Errors will appear here if something goes wrong.'
                : 'Try adjusting your search or filter criteria.'}
            </p>
          </div>
        ) : (
          filtered.map(entry => (
            <ErrorCard
              key={entry.id}
              entry={entry}
              currentUserId={currentUser?.id || 'anonymous'}
              userDisplayName={currentUser?.displayName || 'Anonymous'}
              onPosted={(id) => setPostedIds(prev => new Set([...prev, id]))}
            />
          ))
        )}
      </div>

      {filtered.length > 0 && (
        <div className="text-center">
          <p className="text-xs text-text-muted">
            Showing {filtered.length} of {counts.all} errors/warnings ·{' '}
            <button
              onClick={() => setFilter('all')}
              className="text-wa-green hover:underline"
            >
              View all
            </button>
          </p>
        </div>
      )}
    </div>
  );
}
