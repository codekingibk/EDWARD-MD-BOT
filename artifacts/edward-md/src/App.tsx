import { AppProvider, useApp } from './store';
import Login from './components/Login';
import Pairing from './components/Pairing';
import DashboardHome from './components/DashboardHome';
import Plugins from './components/Plugins';
import Settings from './components/Settings';
import Logs from './components/Logs';
import TerminalPage from './components/Terminal';
import Profile from './components/Profile';
import {
  LayoutDashboard, Puzzle, Settings as SettingsIcon, ScrollText, Terminal,
  LogOut, Bot, Menu, ChevronLeft, Wifi, WifiOff, Bell,
  ExternalLink, Heart, UserCircle, X, Check
} from 'lucide-react';
import { useState } from 'react';

type Page = 'dashboard' | 'plugins' | 'settings' | 'logs' | 'terminal' | 'profile';

function NotificationPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { notifications, dismissNotification } = useApp();
  const unread = notifications.filter(n => !n.read);
  if (!open) return null;
  const typeIcons: Record<string, string> = { info: '💡', success: '✅', warning: '⚠️', error: '❌' };
  return (
    <>
      <div className="fixed inset-0 z-50" onClick={onClose} />
      <div className="absolute right-0 top-full mt-2 w-80 glass-strong rounded-2xl shadow-2xl z-50 overflow-hidden animate-slide-up">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <h3 className="text-sm font-semibold text-text-primary">Notifications ({unread.length})</h3>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary"><X className="w-4 h-4" /></button>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-8 text-center"><Bell className="w-8 h-8 text-text-muted mx-auto mb-2 opacity-50" /><p className="text-xs text-text-muted">No notifications yet</p></div>
          ) : (
            notifications.slice(0, 20).map(n => (
              <div key={n.id} className={`px-4 py-3 border-b border-border/50 ${!n.read ? 'bg-bg-card/50' : ''} hover:bg-bg-card/30 transition-colors`}>
                <div className="flex items-start gap-2.5">
                  <span className="text-sm mt-0.5">{typeIcons[n.type]}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-text-primary">{n.title}</p>
                    <p className="text-[10px] text-text-muted mt-0.5">{n.message}</p>
                    <p className="text-[10px] text-text-muted mt-1">{new Date(n.timestamp).toLocaleTimeString()}</p>
                  </div>
                  {!n.read && (
                    <button onClick={(e) => { e.stopPropagation(); dismissNotification(n.id); }} className="text-text-muted hover:text-wa-green transition-colors shrink-0">
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}

function Sidebar() {
  const { page, setPage, sidebarOpen, setSidebarOpen, botConfig, isConnected, logout, stats, currentUser } = useApp();
  const navItems: { id: Page; icon: any; label: string }[] = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'plugins', icon: Puzzle, label: 'Plugins' },
    { id: 'settings', icon: SettingsIcon, label: 'Settings' },
    { id: 'logs', icon: ScrollText, label: 'Logs' },
    { id: 'terminal', icon: Terminal, label: 'Terminal' },
    { id: 'profile', icon: UserCircle, label: 'Profile' },
  ];
  const formatUptime = (ms: number) => { const s = Math.floor(ms / 1000); const h = Math.floor(s / 3600); const m = Math.floor((s % 3600) / 60); return h > 0 ? `${h}h ${m}m` : `${m}m`; };

  return (
    <>
      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}
      <aside className={`fixed top-0 left-0 h-full z-50 flex flex-col bg-bg-secondary border-r border-border transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-0 lg:w-20'} overflow-hidden`}>
        <div className="p-4 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-wa-green to-wa-dark-green flex items-center justify-center shrink-0">
              <Bot className="w-5 h-5 text-white" />
            </div>
            {sidebarOpen && (
              <div className="animate-fade-in min-w-0">
                <h1 className="font-bold text-text-primary text-sm truncate">{botConfig.botName}</h1>
                <div className="flex items-center gap-1.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-wa-green' : 'bg-accent-red'} animate-pulse`} />
                  <span className="text-[10px] text-text-muted">{isConnected ? 'Connected' : 'Offline'}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {sidebarOpen && currentUser && (
          <div className="px-3 py-3 border-b border-border animate-fade-in">
            <button onClick={() => { setPage('profile'); if (window.innerWidth < 1024) setSidebarOpen(false); }} className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-bg-card transition-all">
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${currentUser.avatar} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                {currentUser.displayName.charAt(0).toUpperCase()}
              </div>
              <div className="text-left min-w-0">
                <p className="text-xs font-medium text-text-primary truncate">{currentUser.displayName}</p>
                <p className="text-[10px] text-text-muted">@{currentUser.username}</p>
              </div>
            </button>
          </div>
        )}

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map(item => {
            const isActive = page === item.id;
            return (
              <button key={item.id} onClick={() => { setPage(item.id); if (window.innerWidth < 1024) setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive ? 'bg-wa-green/15 text-wa-green' : 'text-text-secondary hover:text-text-primary hover:bg-bg-card'}`}
                title={!sidebarOpen ? item.label : undefined}>
                <item.icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-wa-green' : ''}`} />
                {sidebarOpen && <span className="animate-fade-in">{item.label}</span>}
                {sidebarOpen && item.id === 'logs' && <span className="ml-auto text-[10px] bg-wa-green/20 text-wa-green px-1.5 py-0.5 rounded-full">Live</span>}
              </button>
            );
          })}
        </nav>

        {sidebarOpen && (
          <div className="px-3 py-3 border-t border-border animate-fade-in">
            <div className="glass rounded-xl p-3 space-y-2">
              <div className="flex justify-between text-[10px]"><span className="text-text-muted">Uptime</span><span className="text-wa-green font-mono">{formatUptime(stats.uptime)}</span></div>
              <div className="flex justify-between text-[10px]"><span className="text-text-muted">Response</span><span className="text-accent-blue font-mono">{Math.round(stats.avgResponseTime)}ms</span></div>
              <div className="flex justify-between text-[10px]"><span className="text-text-muted">CPU</span><span className={`font-mono ${stats.cpuUsage > 80 ? 'text-accent-red' : 'text-wa-green'}`}>{Math.round(stats.cpuUsage)}%</span></div>
            </div>
          </div>
        )}

        <div className="p-3 border-t border-border shrink-0">
          <button onClick={logout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-accent-red hover:bg-accent-red/10 transition-all" title={!sidebarOpen ? 'Logout' : undefined}>
            <LogOut className="w-5 h-5 shrink-0" />
            {sidebarOpen && <span className="animate-fade-in">Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
}

function Header() {
  const { sidebarOpen, setSidebarOpen, isConnected, stats, currentUser, notifications } = useApp();
  const [showNotifs, setShowNotifs] = useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="sticky top-0 z-30 glass-strong border-b border-border px-4 lg:px-6 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-card transition-all">
            {sidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="hidden sm:flex items-center gap-2">
            {isConnected ? (
              <div className="flex items-center gap-1.5 bg-wa-green/10 border border-wa-green/20 text-wa-green px-2.5 py-1 rounded-lg text-xs font-medium"><Wifi className="w-3 h-3" />Connected</div>
            ) : (
              <div className="flex items-center gap-1.5 bg-accent-red/10 border border-accent-red/20 text-accent-red px-2.5 py-1 rounded-lg text-xs font-medium"><WifiOff className="w-3 h-3" />Disconnected</div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center gap-4 mr-4">
            <div className="text-right"><p className="text-[10px] text-text-muted">Messages</p><p className="text-xs font-semibold text-text-primary tabular-nums">{stats.messagesReceived.toLocaleString()}</p></div>
            <div className="w-px h-6 bg-border" />
            <div className="text-right"><p className="text-[10px] text-text-muted">Commands</p><p className="text-xs font-semibold text-text-primary tabular-nums">{stats.commandsExecuted.toLocaleString()}</p></div>
          </div>

          <div className="relative">
            <button onClick={() => setShowNotifs(!showNotifs)} className="relative p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-card transition-all">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && <div className="absolute top-1 right-1 min-w-[16px] h-4 bg-accent-red rounded-full flex items-center justify-center"><span className="text-[9px] text-white font-bold px-1">{unreadCount > 9 ? '9+' : unreadCount}</span></div>}
            </button>
            <NotificationPanel open={showNotifs} onClose={() => setShowNotifs(false)} />
          </div>

          {currentUser && (
            <div className="flex items-center gap-2 bg-bg-card border border-border rounded-xl px-3 py-1.5">
              <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${currentUser.avatar} flex items-center justify-center`}>
                <span className="text-white text-xs font-bold">{currentUser.displayName.charAt(0).toUpperCase()}</span>
              </div>
              <div className="hidden sm:block"><p className="text-xs font-medium text-text-primary">{currentUser.displayName}</p><p className="text-[10px] text-text-muted capitalize">{currentUser.role}</p></div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function DashboardLayout() {
  const { page, sidebarOpen } = useApp();
  return (
    <div className="min-h-screen bg-bg-primary">
      <Sidebar />
      <div className={`transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'}`}>
        <Header />
        <main className="p-4 lg:p-6 max-w-[1600px] mx-auto">
          {page === 'dashboard' && <DashboardHome />}
          {page === 'plugins' && <Plugins />}
          {page === 'settings' && <Settings />}
          {page === 'logs' && <Logs />}
          {page === 'terminal' && <TerminalPage />}
          {page === 'profile' && <Profile />}
        </main>
        <footer className="px-6 py-4 border-t border-border text-center">
          <p className="text-xs text-text-muted flex items-center justify-center gap-1.5">
            Made with <Heart className="w-3 h-3 text-accent-red" /> • EDWARD MD v3.0.0 • Powered by
            <a href="https://github.com/WhiskeySockets/Baileys" target="_blank" rel="noopener noreferrer" className="text-wa-green hover:underline inline-flex items-center gap-0.5">Baileys <ExternalLink className="w-2.5 h-2.5" /></a>
          </p>
        </footer>
      </div>
    </div>
  );
}

function AppContent() {
  const { isAuthenticated, isConnected, page } = useApp();
  if (!isAuthenticated || page === 'login' || page === 'register') return <Login />;
  if (!isConnected) return <Pairing />;
  return <DashboardLayout />;
}

export default function App() {
  return <AppProvider><AppContent /></AppProvider>;
}
