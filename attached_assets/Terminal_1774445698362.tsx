import { useState, useRef, useEffect } from 'react';
import { useApp } from '../store';
import { Terminal as TermIcon, Send, Trash2, Copy, Check } from 'lucide-react';

interface TermLine {
  id: number;
  type: 'input' | 'output' | 'error' | 'system';
  text: string;
}

const helpText = `
╔══════════════════════════════════════════════╗
║         EDWARD MD Terminal Console           ║
╠══════════════════════════════════════════════╣
║  Available Commands:                         ║
║  ─────────────────────────────────────────── ║
║  help          - Show this help message      ║
║  status        - Show bot status             ║
║  stats         - Show bot statistics         ║
║  plugins       - List all plugins            ║
║  enable <id>   - Enable a plugin             ║
║  disable <id>  - Disable a plugin            ║
║  config        - Show bot configuration      ║
║  setname <n>   - Change bot name             ║
║  setprefix <p> - Change command prefix       ║
║  uptime        - Show bot uptime             ║
║  logs          - Show recent logs            ║
║  clear         - Clear terminal              ║
║  restart       - Restart bot                 ║
║  broadcast <m> - Send to all groups          ║
║  ping          - Check bot latency           ║
║  version       - Show version info           ║
║  users         - Show registered users       ║
║  whoami        - Show current user info      ║
╚══════════════════════════════════════════════╝`.trim();

export default function TerminalPage() {
  const { stats, plugins, botConfig, updateConfig, addLog, togglePlugin, currentUser, allUsers } = useApp();
  const [lines, setLines] = useState<TermLine[]>([
    { id: 0, type: 'system', text: '🟢 EDWARD MD Terminal v3.0.0 — Type "help" for available commands' },
  ]);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const [copied, setCopied] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  let lineId = useRef(1);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lines]);

  const addLine = (type: TermLine['type'], text: string) => {
    setLines(prev => [...prev, { id: lineId.current++, type, text }]);
  };

  const formatUptime = (ms: number) => {
    const s = Math.floor(ms / 1000);
    const d = Math.floor(s / 86400);
    const h = Math.floor((s % 86400) / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${d}d ${h}h ${m}m ${sec}s`;
  };

  const handleCommand = (cmd: string) => {
    const trimmed = cmd.trim();
    if (!trimmed) return;

    addLine('input', `$ ${trimmed}`);
    setHistory(prev => [trimmed, ...prev].slice(0, 50));
    setHistoryIdx(-1);

    const parts = trimmed.split(' ');
    const command = parts[0].toLowerCase();
    const args = parts.slice(1).join(' ');

    switch (command) {
      case 'help':
        addLine('output', helpText);
        break;

      case 'clear':
        setLines([{ id: lineId.current++, type: 'system', text: '🟢 Terminal cleared.' }]);
        break;

      case 'status':
        addLine('output', [
          `╭─── Bot Status ───────────────────╮`,
          `│ Name:     ${botConfig.botName.padEnd(23)}│`,
          `│ Status:   🟢 Online${' '.repeat(14)}│`,
          `│ Prefix:   ${botConfig.prefix.padEnd(23)}│`,
          `│ Mode:     ${(botConfig.publicMode ? 'Public' : 'Private').padEnd(23)}│`,
          `│ Uptime:   ${formatUptime(stats.uptime).padEnd(23)}│`,
          `│ Groups:   ${String(stats.activeGroups).padEnd(23)}│`,
          `│ Users:    ${String(stats.activeUsers).padEnd(23)}│`,
          `╰──────────────────────────────────╯`,
        ].join('\n'));
        break;

      case 'stats':
        addLine('output', [
          `📊 Bot Statistics:`,
          `   Messages Received: ${stats.messagesReceived.toLocaleString()}`,
          `   Messages Sent:     ${stats.messagesSent.toLocaleString()}`,
          `   Commands Executed:  ${stats.commandsExecuted.toLocaleString()}`,
          `   Avg Response Time:  ${stats.avgResponseTime}ms`,
          `   Memory Usage:       ${stats.memoryUsage}%`,
          `   CPU Usage:          ${stats.cpuUsage}%`,
          `   Bandwidth Used:     ${stats.bandwidthUsed} GB`,
        ].join('\n'));
        break;

      case 'plugins': {
        const enabled = plugins.filter(p => p.enabled).length;
        addLine('output', [
          `🔌 Plugins: ${enabled}/${plugins.length} enabled`,
          ``,
          ...plugins.slice(0, 20).map(p =>
            `   ${p.enabled ? '🟢' : '🔴'} ${p.id.padEnd(8)} ${p.name.padEnd(20)} ${p.command}`
          ),
          plugins.length > 20 ? `   ... and ${plugins.length - 20} more` : '',
        ].join('\n'));
        break;
      }

      case 'enable': {
        if (!args) { addLine('error', 'Usage: enable <plugin-id>'); break; }
        const pe = plugins.find(p => p.id === args || p.command === args);
        if (pe) { if (!pe.enabled) togglePlugin(pe.id); addLine('output', `✅ Plugin "${pe.name}" enabled`); }
        else addLine('error', `Plugin "${args}" not found`);
        break;
      }

      case 'disable': {
        if (!args) { addLine('error', 'Usage: disable <plugin-id>'); break; }
        const pd = plugins.find(p => p.id === args || p.command === args);
        if (pd) { if (pd.enabled) togglePlugin(pd.id); addLine('output', `❌ Plugin "${pd.name}" disabled`); }
        else addLine('error', `Plugin "${args}" not found`);
        break;
      }

      case 'config':
        addLine('output', [
          `⚙️ Bot Configuration:`,
          ...Object.entries(botConfig).map(([k, v]) => `   ${k}: ${v}`),
        ].join('\n'));
        break;

      case 'setname':
        if (!args) { addLine('error', 'Usage: setname <new name>'); break; }
        updateConfig('botName', args);
        addLine('output', `✅ Bot name changed to "${args}"`);
        break;

      case 'setprefix':
        if (!args) { addLine('error', 'Usage: setprefix <new prefix>'); break; }
        updateConfig('prefix', args);
        addLine('output', `✅ Prefix changed to "${args}"`);
        break;

      case 'uptime':
        addLine('output', `⏱ Uptime: ${formatUptime(stats.uptime)}`);
        break;

      case 'logs':
        addLine('output', '📋 Check the Logs page for full log history.');
        break;

      case 'ping': {
        const latency = Math.floor(Math.random() * 100 + 20);
        addLine('output', `🏓 Pong! Latency: ${latency}ms`);
        break;
      }

      case 'restart':
        addLine('system', '🔄 Restarting bot...');
        addLog('info', 'Bot restart initiated from terminal', 'Terminal');
        setTimeout(() => addLine('system', '🟢 Bot restarted successfully!'), 2000);
        break;

      case 'broadcast':
        if (!args) { addLine('error', 'Usage: broadcast <message>'); break; }
        addLine('output', `📢 Broadcasting to ${stats.activeGroups} groups: "${args}"`);
        addLog('info', `Broadcast sent: ${args}`, 'Terminal');
        break;

      case 'version':
        addLine('output', [
          `EDWARD MD v3.0.0`,
          `Built with Baileys @whiskeysockets/baileys`,
          `Node.js Runtime`,
          `${plugins.length} plugins loaded`,
        ].join('\n'));
        break;

      case 'whoami':
        if (currentUser) {
          addLine('output', [
            `👤 Current User:`,
            `   Display Name: ${currentUser.displayName}`,
            `   Username:     @${currentUser.username}`,
            `   Email:        ${currentUser.email}`,
            `   Role:         ${currentUser.role}`,
            `   Joined:       ${new Date(currentUser.createdAt).toLocaleDateString()}`,
            `   Sessions:     ${currentUser.sessions}`,
          ].join('\n'));
        } else {
          addLine('error', 'Not logged in');
        }
        break;

      case 'users':
        addLine('output', [
          `👥 Registered Users (${allUsers.length}):`,
          ...allUsers.map(u =>
            `   ${u.role === 'owner' ? '👑' : '👤'} ${u.displayName.padEnd(20)} @${u.username.padEnd(15)} ${u.role}`
          ),
        ].join('\n'));
        break;

      default:
        addLine('error', `Unknown command: "${command}". Type "help" for available commands.`);
    }
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCommand(input);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length > 0) {
        const newIdx = Math.min(historyIdx + 1, history.length - 1);
        setHistoryIdx(newIdx);
        setInput(history[newIdx]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIdx > 0) {
        const newIdx = historyIdx - 1;
        setHistoryIdx(newIdx);
        setInput(history[newIdx]);
      } else {
        setHistoryIdx(-1);
        setInput('');
      }
    }
  };

  const handleCopy = () => {
    const text = lines.map(l => l.text).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
            <TermIcon className="w-5 h-5 text-wa-green" />
            Terminal
          </h2>
          <p className="text-sm text-text-muted mt-1">Execute bot commands directly</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-2 glass text-text-secondary text-xs font-medium rounded-lg hover:text-text-primary transition-colors"
          >
            {copied ? <Check className="w-3 h-3 text-wa-green" /> : <Copy className="w-3 h-3" />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
          <button
            onClick={() => setLines([{ id: lineId.current++, type: 'system', text: '🟢 Terminal cleared.' }])}
            className="flex items-center gap-1.5 px-3 py-2 bg-accent-red/10 border border-accent-red/20 text-accent-red text-xs font-medium rounded-lg hover:bg-accent-red/20 transition-colors"
          >
            <Trash2 className="w-3 h-3" />
            Clear
          </button>
        </div>
      </div>

      <div className="glass rounded-2xl overflow-hidden" onClick={() => inputRef.current?.focus()}>
        {/* Title Bar */}
        <div className="bg-bg-input/80 px-4 py-2.5 border-b border-border flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-accent-red/70" />
            <div className="w-3 h-3 rounded-full bg-accent-orange/70" />
            <div className="w-3 h-3 rounded-full bg-wa-green/70" />
          </div>
          <span className="text-xs text-text-muted font-mono ml-2">edward-md@terminal ~ $</span>
        </div>

        {/* Terminal Content */}
        <div className="p-4 max-h-[500px] overflow-y-auto font-mono text-xs leading-relaxed bg-[#0a0e17]">
          {lines.map(line => (
            <div key={line.id} className={`whitespace-pre-wrap mb-0.5 ${
              line.type === 'input' ? 'text-wa-green' :
              line.type === 'error' ? 'text-accent-red' :
              line.type === 'system' ? 'text-accent-cyan' :
              'text-text-secondary'
            }`}>
              {line.text}
            </div>
          ))}
          <div ref={endRef} />
        </div>

        {/* Input */}
        <div className="bg-[#0a0e17] px-4 py-3 border-t border-border/50 flex items-center gap-2">
          <span className="text-wa-green font-mono text-xs">$</span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-text-primary font-mono text-xs outline-none placeholder:text-text-muted"
            placeholder="Type a command..."
            autoFocus
          />
          <button
            onClick={() => handleCommand(input)}
            className="text-text-muted hover:text-wa-green transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
