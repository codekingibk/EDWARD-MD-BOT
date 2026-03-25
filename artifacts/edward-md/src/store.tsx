import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { defaultPlugins, type Plugin } from './data/plugins';
import { io, type Socket } from 'socket.io-client';

async function safeJson(res: Response) {
  const text = await res.text();
  if (!text) return {} as any;
  try { return JSON.parse(text); } catch { return { ok: false, error: text.slice(0, 200) } as any; }
}

export interface UserAccount {
  id: string;
  username: string;
  email: string;
  password: string;
  displayName: string;
  role: 'owner' | 'admin' | 'moderator';
  avatar: string;
  createdAt: number;
  lastLogin: number;
  twoFactorEnabled: boolean;
  sessions: number;
}

function generateId() { return 'usr_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }

function hashPassword(pass: string): string {
  let hash = 0;
  for (let i = 0; i < pass.length; i++) { const c = pass.charCodeAt(i); hash = ((hash << 5) - hash) + c; hash |= 0; }
  return 'hashed_' + Math.abs(hash).toString(36) + '_' + btoa(pass).slice(0, 12);
}

function verifyPassword(pass: string, hashed: string): boolean { return hashPassword(pass) === hashed; }

function getStoredUsers(): UserAccount[] { try { const d = localStorage.getItem('edward-md-users'); return d ? JSON.parse(d) : []; } catch { return []; } }
function saveUsers(users: UserAccount[]) { localStorage.setItem('edward-md-users', JSON.stringify(users)); }
function getStoredSession(): { userId: string; token: string } | null { try { const d = localStorage.getItem('edward-md-session'); return d ? JSON.parse(d) : null; } catch { return null; } }
function saveSession(userId: string, token: string) { localStorage.setItem('edward-md-session', JSON.stringify({ userId, token })); }
function clearSession() { localStorage.removeItem('edward-md-session'); }

const avatarColors = [
  'from-wa-green to-accent-cyan', 'from-accent-blue to-accent-purple',
  'from-accent-pink to-accent-orange', 'from-accent-cyan to-wa-green',
  'from-accent-purple to-accent-pink', 'from-accent-orange to-accent-red',
];

export interface BotConfig {
  botName: string; prefix: string; ownerNumber: string; language: string;
  autoRead: boolean; autoTyping: boolean; autoRecording: boolean; publicMode: boolean;
  antiCall: boolean; antiSpam: boolean; antiLink: boolean; welcomeMessage: boolean;
  goodbyeMessage: boolean; antiDelete: boolean; antiViewOnce: boolean; autoReact: boolean;
  statusSeen: boolean; statusReply: boolean; selfMode: boolean; alwaysOnline: boolean;
}

export interface LogEntry {
  id: string; timestamp: number; level: 'info' | 'warn' | 'error' | 'success'; message: string; source?: string;
}

export interface BotStats {
  messagesReceived: number; messagesSent: number; commandsExecuted: number;
  activeGroups: number; activeUsers: number; uptime: number; startTime: number;
  avgResponseTime: number; memoryUsage: number; cpuUsage: number;
  totalPlugins: number; enabledPlugins: number; errorsToday: number; bandwidthUsed: number;
}

export interface NotificationItem {
  id: string; title: string; message: string; type: 'info' | 'success' | 'warning' | 'error'; timestamp: number; read: boolean;
}

type Page = 'login' | 'register' | 'pairing' | 'dashboard' | 'plugins' | 'settings' | 'logs' | 'terminal' | 'profile';

interface AppState {
  page: Page; setPage: (p: Page) => void;
  isAuthenticated: boolean; currentUser: UserAccount | null;
  login: (identifier: string, pass: string) => { ok: boolean; error?: string };
  register: (data: { username: string; email: string; password: string; displayName: string }) => { ok: boolean; error?: string };
  logout: () => void;
  updateProfile: (updates: Partial<UserAccount>) => void;
  changePassword: (oldPass: string, newPass: string) => { ok: boolean; error?: string };
  deleteAccount: () => void;
  allUsers: UserAccount[];
  isConnected: boolean; setIsConnected: (v: boolean) => void;
  connectionMethod: 'qr' | 'code' | null; setConnectionMethod: (v: 'qr' | 'code' | null) => void;
  qrCode: string; setQrCode: (v: string) => void;
  botConfig: BotConfig; updateConfig: (key: keyof BotConfig, value: any) => void;
  plugins: Plugin[]; togglePlugin: (id: string) => void; toggleAllPlugins: (category: string, enabled: boolean) => void;
  logs: LogEntry[]; addLog: (level: LogEntry['level'], message: string, source?: string) => void; clearLogs: () => void;
  stats: BotStats; sidebarOpen: boolean; setSidebarOpen: (v: boolean) => void;
  phoneNumber: string; setPhoneNumber: (v: string) => void;
  pairingCode: string; setPairingCode: (v: string) => void;
  notifications: NotificationItem[]; addNotification: (title: string, message: string, type: NotificationItem['type']) => void; dismissNotification: (id: string) => void;
}

const defaultConfig: BotConfig = {
  botName: 'EDWARD MD', prefix: '.', ownerNumber: '', language: 'en',
  autoRead: true, autoTyping: true, autoRecording: false, publicMode: true,
  antiCall: true, antiSpam: true, antiLink: false, welcomeMessage: true,
  goodbyeMessage: true, antiDelete: true, antiViewOnce: true, autoReact: false,
  statusSeen: true, statusReply: false, selfMode: false, alwaysOnline: true,
};

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [page, setPage] = useState<Page>('login');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [allUsers, setAllUsers] = useState<UserAccount[]>(getStoredUsers);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionMethod, setConnectionMethod] = useState<'qr' | 'code' | null>(null);
  const [qrCode, setQrCode] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [pairingCode, setPairingCode] = useState('');
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [botConfig, setBotConfig] = useState<BotConfig>(() => {
    const saved = localStorage.getItem('edward-md-config');
    return saved ? { ...defaultConfig, ...JSON.parse(saved) } : defaultConfig;
  });
  const [plugins, setPlugins] = useState<Plugin[]>(defaultPlugins);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const logIdRef = useRef(0);
  const socketRef = useRef<Socket | null>(null);

  const [stats, setStats] = useState<BotStats>({
    messagesReceived: 0, messagesSent: 0, commandsExecuted: 0,
    activeGroups: 0, activeUsers: 0, uptime: 0, startTime: Date.now(),
    avgResponseTime: 0, memoryUsage: 0, cpuUsage: 0,
    totalPlugins: defaultPlugins.length, enabledPlugins: defaultPlugins.filter(p => p.enabled).length,
    errorsToday: 0, bandwidthUsed: 0,
  });

  const addLog = useCallback((level: LogEntry['level'], message: string, source?: string) => {
    const entry: LogEntry = { id: `log-${++logIdRef.current}`, timestamp: Date.now(), level, message, source };
    setLogs(prev => [entry, ...prev].slice(0, 500));
  }, []);

  const clearLogs = useCallback(() => setLogs([]), []);

  const addNotification = useCallback((title: string, message: string, type: NotificationItem['type']) => {
    const n: NotificationItem = { id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, title, message, type, timestamp: Date.now(), read: false };
    setNotifications(prev => [n, ...prev].slice(0, 50));
  }, []);

  const dismissNotification = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  // Auto-restore session
  useEffect(() => {
    const session = getStoredSession();
    if (session) {
      const users = getStoredUsers();
      const user = users.find(u => u.id === session.userId);
      if (user) { setCurrentUser(user); setIsAuthenticated(true); setPage('pairing'); }
    }
  }, []);

  // Uptime ticker
  useEffect(() => {
    const iv = setInterval(() => {
      setStats(prev => ({
        ...prev, uptime: Date.now() - prev.startTime,
        enabledPlugins: plugins.filter(p => p.enabled).length,
        messagesReceived: isConnected ? prev.messagesReceived + Math.floor(Math.random() * 3) : prev.messagesReceived,
        messagesSent: isConnected ? prev.messagesSent + Math.floor(Math.random() * 2) : prev.messagesSent,
        commandsExecuted: isConnected ? prev.commandsExecuted + (Math.random() > 0.7 ? 1 : 0) : prev.commandsExecuted,
        activeGroups: isConnected ? Math.max(1, prev.activeGroups + (Math.random() > 0.9 ? (Math.random() > 0.5 ? 1 : -1) : 0)) : 0,
        activeUsers: isConnected ? Math.max(5, prev.activeUsers + (Math.random() > 0.8 ? (Math.random() > 0.5 ? 1 : -1) : 0)) : 0,
        cpuUsage: isConnected ? Math.min(95, Math.max(10, prev.cpuUsage + (Math.random() * 6 - 3))) : 5,
        memoryUsage: isConnected ? Math.min(90, Math.max(20, prev.memoryUsage + (Math.random() * 4 - 2))) : 15,
        avgResponseTime: isConnected ? Math.max(50, Math.min(500, prev.avgResponseTime + (Math.random() * 20 - 10))) : 0,
        bandwidthUsed: isConnected ? +(prev.bandwidthUsed + 0.001).toFixed(3) : prev.bandwidthUsed,
      }));
    }, 2000);
    return () => clearInterval(iv);
  }, [plugins, isConnected]);

  useEffect(() => { localStorage.setItem('edward-md-config', JSON.stringify(botConfig)); }, [botConfig]);
  useEffect(() => { saveUsers(allUsers); }, [allUsers]);

  // Socket.IO
  useEffect(() => {
    try {
      const socket = io({ path: '/socket.io', transports: ['websocket', 'polling'] });
      socketRef.current = socket;
      socket.on('connect', () => addLog('info', 'Connected to backend realtime', 'Socket'));
      socket.on('log', (entry: any) => addLog(entry.level, entry.message, entry.source));
      socket.on('logs', (arr: any[]) => arr.forEach(l => addLog(l.level, l.message, l.source)));
      socket.on('qr', (q: string) => { setQrCode(q); addLog('info', 'QR code received from WhatsApp', 'WhatsApp'); });
      socket.on('pairingCode', (code: string) => { setPairingCode(code); addLog('info', `Pairing code received: ${code}`, 'WhatsApp'); });
      socket.on('connected', () => { setIsConnected(true); setPage('dashboard'); addLog('success', 'WhatsApp connected!', 'WhatsApp'); addNotification('Connected!', 'Bot is now connected to WhatsApp', 'success'); });
      socket.on('disconnected', () => { setIsConnected(false); addLog('warn', 'WhatsApp disconnected', 'WhatsApp'); });
      socket.on('stats', (s: Partial<BotStats>) => setStats(prev => ({ ...prev, ...s })));
      return () => { socket.close(); };
    } catch { /* ignore */ }
  }, [addLog, addNotification]);

  const register = (data: { username: string; email: string; password: string; displayName: string }) => {
    const { username, email, password, displayName } = data;
    if (!username || !email || !password || !displayName) return { ok: false, error: 'All fields are required' };
    if (username.length < 3) return { ok: false, error: 'Username must be at least 3 characters' };
    if (!/^[a-zA-Z0-9_]+$/.test(username)) return { ok: false, error: 'Username: letters, numbers and underscores only' };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: 'Invalid email address' };
    if (password.length < 6) return { ok: false, error: 'Password must be at least 6 characters' };
    const users = getStoredUsers();
    if (users.find(u => u.username.toLowerCase() === username.toLowerCase())) return { ok: false, error: 'Username already taken' };
    if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) return { ok: false, error: 'Email already registered' };
    const newUser: UserAccount = {
      id: generateId(), username: username.toLowerCase(), email: email.toLowerCase(),
      password: hashPassword(password), displayName, role: users.length === 0 ? 'owner' : 'admin',
      avatar: avatarColors[Math.floor(Math.random() * avatarColors.length)],
      createdAt: Date.now(), lastLogin: Date.now(), twoFactorEnabled: false, sessions: 1,
    };
    const updated = [...users, newUser];
    saveUsers(updated); setAllUsers(updated); setCurrentUser(newUser); setIsAuthenticated(true);
    saveSession(newUser.id, 'token_' + Date.now()); setPage('pairing');
    addLog('success', `New user registered: ${newUser.displayName} (${newUser.role})`, 'Auth');
    addNotification('Welcome! 🎉', `Account created successfully. Welcome, ${newUser.displayName}!`, 'success');
    return { ok: true };
  };

  const login = (identifier: string, pass: string) => {
    if (!identifier || !pass) return { ok: false, error: 'Please enter your credentials' };
    const users = getStoredUsers();
    const user = users.find(u => u.username.toLowerCase() === identifier.toLowerCase() || u.email.toLowerCase() === identifier.toLowerCase());
    if (!user) return { ok: false, error: 'No account found with that username or email' };
    if (!verifyPassword(pass, user.password)) return { ok: false, error: 'Incorrect password' };
    const updated = { ...user, lastLogin: Date.now(), sessions: user.sessions + 1 };
    const updatedUsers = users.map(u => u.id === user.id ? updated : u);
    saveUsers(updatedUsers); setAllUsers(updatedUsers); setCurrentUser(updated); setIsAuthenticated(true);
    saveSession(updated.id, 'token_' + Date.now()); setPage('pairing');
    addLog('success', `${updated.displayName} logged in (${updated.role})`, 'Auth');
    addNotification('Welcome Back! 👋', `Logged in as ${updated.displayName}`, 'success');
    return { ok: true };
  };

  const logout = () => {
    if (currentUser) addLog('info', `${currentUser.displayName} logged out`, 'Auth');
    setIsAuthenticated(false); setCurrentUser(null); setIsConnected(false);
    setQrCode(''); setPairingCode(''); clearSession(); setPage('login');
  };

  const updateProfile = (updates: Partial<UserAccount>) => {
    if (!currentUser) return;
    const updated = { ...currentUser, ...updates };
    setCurrentUser(updated);
    const updatedUsers = allUsers.map(u => u.id === currentUser.id ? updated : u);
    setAllUsers(updatedUsers); saveUsers(updatedUsers);
    addLog('info', `Profile updated: ${Object.keys(updates).join(', ')}`, 'Auth');
  };

  const changePassword = (oldPass: string, newPass: string) => {
    if (!currentUser) return { ok: false, error: 'Not authenticated' };
    if (!verifyPassword(oldPass, currentUser.password)) return { ok: false, error: 'Current password is incorrect' };
    if (newPass.length < 6) return { ok: false, error: 'New password must be at least 6 characters' };
    const updated = { ...currentUser, password: hashPassword(newPass) };
    setCurrentUser(updated);
    const updatedUsers = allUsers.map(u => u.id === currentUser.id ? updated : u);
    setAllUsers(updatedUsers); saveUsers(updatedUsers);
    addLog('success', 'Password changed', 'Auth');
    addNotification('Password Changed', 'Your password has been updated', 'success');
    return { ok: true };
  };

  const deleteAccount = () => {
    if (!currentUser) return;
    const updatedUsers = allUsers.filter(u => u.id !== currentUser.id);
    setAllUsers(updatedUsers); saveUsers(updatedUsers);
    addLog('warn', `Account deleted: ${currentUser.displayName}`, 'Auth');
    logout();
  };

  const updateConfig = (key: keyof BotConfig, value: any) => {
    setBotConfig(prev => ({ ...prev, [key]: value }));
    addLog('info', `Config: ${key} = ${value}`, 'Settings');
    fetch('/api/config', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ [key]: value }) }).catch(() => {});
  };

  const togglePlugin = (id: string) => {
    setPlugins(prev => {
      const p = prev.find(x => x.id === id);
      const next = prev.map(x => x.id === id ? { ...x, enabled: !x.enabled } : x);
      fetch('/api/plugins/toggle', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id, enabled: p ? !p.enabled : true }) }).catch(() => {});
      return next;
    });
  };

  const toggleAllPlugins = (category: string, enabled: boolean) => {
    setPlugins(prev => prev.map(p => (category === 'all' || p.category === category) ? { ...p, enabled } : p));
    addLog('info', `${enabled ? 'Enabled' : 'Disabled'} all ${category} plugins`, 'PluginManager');
  };

  return (
    <AppContext.Provider value={{
      page, setPage, isAuthenticated, currentUser, login, register, logout,
      updateProfile, changePassword, deleteAccount, allUsers,
      isConnected, setIsConnected, connectionMethod, setConnectionMethod,
      qrCode, setQrCode,
      botConfig, updateConfig, plugins, togglePlugin, toggleAllPlugins,
      logs, addLog, clearLogs, stats, sidebarOpen, setSidebarOpen,
      phoneNumber, setPhoneNumber, pairingCode, setPairingCode,
      notifications, addNotification, dismissNotification,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be inside AppProvider');
  return ctx;
};
