import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { defaultPlugins, type Plugin } from './data/plugins';
import { io, type Socket } from 'socket.io-client';

async function safeJson(res: Response) {
  const text = await res.text();
  if (!text) return {} as any;
  try {
    return JSON.parse(text);
  } catch {
    return { ok: false, error: text.slice(0, 200) } as any;
  }
}

/* ─── User System ─── */
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

function generateId() {
  return 'usr_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function hashPassword(pass: string): string {
  // Simple hash for demo — in production use bcrypt etc.
  let hash = 0;
  for (let i = 0; i < pass.length; i++) {
    const c = pass.charCodeAt(i);
    hash = ((hash << 5) - hash) + c;
    hash |= 0;
  }
  return 'hashed_' + Math.abs(hash).toString(36) + '_' + btoa(pass).slice(0, 12);
}

function verifyPassword(pass: string, hashed: string): boolean {
  return hashPassword(pass) === hashed;
}

function getStoredUsers(): UserAccount[] {
  try {
    const data = localStorage.getItem('edward-md-users');
    return data ? JSON.parse(data) : [];
  } catch { return []; }
}

function saveUsers(users: UserAccount[]) {
  localStorage.setItem('edward-md-users', JSON.stringify(users));
}

function getStoredSession(): { userId: string; token: string } | null {
  try {
    const data = localStorage.getItem('edward-md-session');
    return data ? JSON.parse(data) : null;
  } catch { return null; }
}

function saveSession(userId: string, token: string) {
  localStorage.setItem('edward-md-session', JSON.stringify({ userId, token }));
}

function clearSession() {
  localStorage.removeItem('edward-md-session');
}

const avatarColors = [
  'from-wa-green to-accent-cyan',
  'from-accent-blue to-accent-purple',
  'from-accent-pink to-accent-orange',
  'from-accent-cyan to-wa-green',
  'from-accent-purple to-accent-pink',
  'from-accent-orange to-accent-red',
];

/* ─── Bot Config ─── */
export interface BotConfig {
  botName: string;
  prefix: string;
  ownerNumber: string;
  language: string;
  autoRead: boolean;
  autoTyping: boolean;
  autoRecording: boolean;
  publicMode: boolean;
  antiCall: boolean;
  antiSpam: boolean;
  antiLink: boolean;
  welcomeMessage: boolean;
  goodbyeMessage: boolean;
  antiDelete: boolean;
  antiViewOnce: boolean;
  autoReact: boolean;
  statusSeen: boolean;
  statusReply: boolean;
  selfMode: boolean;
  alwaysOnline: boolean;
}

export interface LogEntry {
  id: string;
  timestamp: number;
  level: 'info' | 'warn' | 'error' | 'success';
  message: string;
  source?: string;
}

export interface BotStats {
  messagesReceived: number;
  messagesSent: number;
  commandsExecuted: number;
  activeGroups: number;
  activeUsers: number;
  uptime: number;
  startTime: number;
  avgResponseTime: number;
  memoryUsage: number;
  cpuUsage: number;
  totalPlugins: number;
  enabledPlugins: number;
  errorsToday: number;
  bandwidthUsed: number;
}

type Page = 'login' | 'register' | 'pairing' | 'dashboard' | 'plugins' | 'settings' | 'logs' | 'terminal' | 'profile';

interface AppState {
  page: Page;
  setPage: (p: Page) => void;
  isAuthenticated: boolean;
  currentUser: UserAccount | null;
  login: (identifier: string, pass: string) => { ok: boolean; error?: string };
  register: (data: { username: string; email: string; password: string; displayName: string }) => { ok: boolean; error?: string };
  logout: () => void;
  updateProfile: (updates: Partial<UserAccount>) => void;
  changePassword: (oldPass: string, newPass: string) => { ok: boolean; error?: string };
  deleteAccount: () => void;
  allUsers: UserAccount[];
  isConnected: boolean;
  setIsConnected: (v: boolean) => void;
  connectionMethod: 'qr' | 'code' | null;
  setConnectionMethod: (v: 'qr' | 'code' | null) => void;
  botConfig: BotConfig;
  updateConfig: (key: keyof BotConfig, value: any) => void;
  plugins: Plugin[];
  togglePlugin: (id: string) => void;
  toggleAllPlugins: (category: string, enabled: boolean) => void;
  logs: LogEntry[];
  addLog: (level: LogEntry['level'], message: string, source?: string) => void;
  clearLogs: () => void;
  stats: BotStats;
  sidebarOpen: boolean;
  setSidebarOpen: (v: boolean) => void;
  phoneNumber: string;
  setPhoneNumber: (v: string) => void;
  pairingCode: string;
  setPairingCode: (v: string) => void;
  notifications: NotificationItem[];
  addNotification: (title: string, message: string, type: 'info' | 'success' | 'warning' | 'error') => void;
  dismissNotification: (id: string) => void;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: number;
  read: boolean;
}

const defaultConfig: BotConfig = {
  botName: 'EDWARD MD',
  prefix: '.',
  ownerNumber: '',
  language: 'en',
  autoRead: true,
  autoTyping: true,
  autoRecording: false,
  publicMode: true,
  antiCall: true,
  antiSpam: true,
  antiLink: false,
  welcomeMessage: true,
  goodbyeMessage: true,
  antiDelete: true,
  antiViewOnce: true,
  autoReact: false,
  statusSeen: true,
  statusReply: false,
  selfMode: false,
  alwaysOnline: true,
};

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [page, setPage] = useState<Page>('login');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [allUsers, setAllUsers] = useState<UserAccount[]>(getStoredUsers);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionMethod, setConnectionMethod] = useState<'qr' | 'code' | null>(null);
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
    messagesReceived: 0,
    messagesSent: 0,
    commandsExecuted: 0,
    activeGroups: 0,
    activeUsers: 0,
    uptime: 0,
    startTime: Date.now(),
    avgResponseTime: 0,
    memoryUsage: 0,
    cpuUsage: 0,
    totalPlugins: defaultPlugins.length,
    enabledPlugins: defaultPlugins.filter(p => p.enabled).length,
    errorsToday: 0,
    bandwidthUsed: 0,
  });

  const addLog = useCallback((level: LogEntry['level'], message: string, source?: string) => {
    const entry: LogEntry = {
      id: `log-${++logIdRef.current}`,
      timestamp: Date.now(),
      level,
      message,
      source,
    };
    setLogs(prev => [entry, ...prev].slice(0, 500));
  }, []);

  const clearLogs = useCallback(() => setLogs([]), []);

  const addNotification = useCallback((title: string, message: string, type: NotificationItem['type']) => {
    const n: NotificationItem = {
      id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title,
      message,
      type,
      timestamp: Date.now(),
      read: false,
    };
    setNotifications(prev => [n, ...prev].slice(0, 50));
  }, []);

  const dismissNotification = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  // Auto-restore session on mount
  useEffect(() => {
    const session = getStoredSession();
    if (session) {
      const users = getStoredUsers();
      const user = users.find(u => u.id === session.userId);
      if (user) {
        setCurrentUser(user);
        setIsAuthenticated(true);
        setPage('pairing');
      }
    }
  }, []);

  useEffect(() => {
    const iv = setInterval(() => {
      setStats(prev => ({
        ...prev,
        uptime: Date.now() - prev.startTime,
        enabledPlugins: plugins.filter(p => p.enabled).length,
      }));
    }, 2000);
    return () => clearInterval(iv);
  }, [plugins]);

  useEffect(() => {
    localStorage.setItem('edward-md-config', JSON.stringify(botConfig));
  }, [botConfig]);

  useEffect(() => {
    localStorage.setItem('edward-md-plugins', JSON.stringify(plugins.map(p => ({ id: p.id, enabled: p.enabled }))));
  }, [plugins]);

  useEffect(() => {
    saveUsers(allUsers);
  }, [allUsers]);

  /* ─── Auth Methods ─── */
  const register = (data: { username: string; email: string; password: string; displayName: string }) => {
    const { username, email, password, displayName } = data;

    // Validations
    if (!username || !email || !password || !displayName) {
      return { ok: false, error: 'All fields are required' };
    }
    if (username.length < 3) {
      return { ok: false, error: 'Username must be at least 3 characters' };
    }
    if (username.length > 20) {
      return { ok: false, error: 'Username must be 20 characters or less' };
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return { ok: false, error: 'Username can only contain letters, numbers, and underscores' };
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { ok: false, error: 'Please enter a valid email address' };
    }
    if (password.length < 6) {
      return { ok: false, error: 'Password must be at least 6 characters' };
    }
    if (password.length > 50) {
      return { ok: false, error: 'Password must be 50 characters or less' };
    }

    const users = getStoredUsers();
    if (users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
      return { ok: false, error: 'Username already taken' };
    }
    if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
      return { ok: false, error: 'Email already registered' };
    }

    const newUser: UserAccount = {
      id: generateId(),
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      password: hashPassword(password),
      displayName,
      role: users.length === 0 ? 'owner' : 'admin',
      avatar: avatarColors[Math.floor(Math.random() * avatarColors.length)],
      createdAt: Date.now(),
      lastLogin: Date.now(),
      twoFactorEnabled: false,
      sessions: 1,
    };

    const updatedUsers = [...users, newUser];
    saveUsers(updatedUsers);
    setAllUsers(updatedUsers);
    setCurrentUser(newUser);
    setIsAuthenticated(true);
    saveSession(newUser.id, 'token_' + Date.now());
    setPage('pairing');
    addLog('success', `New user registered: ${newUser.displayName} (${newUser.role})`, 'Auth');
    addNotification('Welcome! 🎉', `Account created successfully. Welcome to EDWARD MD, ${newUser.displayName}!`, 'success');
    return { ok: true };
  };

  const login = (identifier: string, pass: string) => {
    if (!identifier || !pass) {
      return { ok: false, error: 'Please enter your credentials' };
    }

    const users = getStoredUsers();
    const user = users.find(
      u => u.username.toLowerCase() === identifier.toLowerCase() ||
           u.email.toLowerCase() === identifier.toLowerCase()
    );

    if (!user) {
      return { ok: false, error: 'No account found with that username or email' };
    }

    if (!verifyPassword(pass, user.password)) {
      return { ok: false, error: 'Incorrect password' };
    }

    // Update last login
    const updatedUser = { ...user, lastLogin: Date.now(), sessions: user.sessions + 1 };
    const updatedUsers = users.map(u => u.id === user.id ? updatedUser : u);
    saveUsers(updatedUsers);
    setAllUsers(updatedUsers);
    setCurrentUser(updatedUser);
    setIsAuthenticated(true);
    saveSession(updatedUser.id, 'token_' + Date.now());
    setPage('pairing');
    addLog('success', `${updatedUser.displayName} logged in (${updatedUser.role})`, 'Auth');
    addNotification('Welcome Back! 👋', `Logged in as ${updatedUser.displayName}`, 'success');
    return { ok: true };
  };

  const logout = () => {
    if (currentUser) {
      addLog('info', `${currentUser.displayName} logged out`, 'Auth');
    }
    setIsAuthenticated(false);
    setCurrentUser(null);
    setIsConnected(false);
    clearSession();
    setPage('login');
  };

  const updateProfile = (updates: Partial<UserAccount>) => {
    if (!currentUser) return;
    const updated = { ...currentUser, ...updates };
    setCurrentUser(updated);
    const updatedUsers = allUsers.map(u => u.id === currentUser.id ? updated : u);
    setAllUsers(updatedUsers);
    saveUsers(updatedUsers);
    addLog('info', `Profile updated: ${Object.keys(updates).join(', ')}`, 'Auth');
  };

  const changePassword = (oldPass: string, newPass: string) => {
    if (!currentUser) return { ok: false, error: 'Not authenticated' };
    if (!verifyPassword(oldPass, currentUser.password)) {
      return { ok: false, error: 'Current password is incorrect' };
    }
    if (newPass.length < 6) {
      return { ok: false, error: 'New password must be at least 6 characters' };
    }
    const updated = { ...currentUser, password: hashPassword(newPass) };
    setCurrentUser(updated);
    const updatedUsers = allUsers.map(u => u.id === currentUser.id ? updated : u);
    setAllUsers(updatedUsers);
    saveUsers(updatedUsers);
    addLog('success', 'Password changed successfully', 'Auth');
    addNotification('Password Changed', 'Your password has been updated', 'success');
    return { ok: true };
  };

  const deleteAccount = () => {
    if (!currentUser) return;
    const updatedUsers = allUsers.filter(u => u.id !== currentUser.id);
    setAllUsers(updatedUsers);
    saveUsers(updatedUsers);
    addLog('warn', `Account deleted: ${currentUser.displayName}`, 'Auth');
    logout();
  };

  const updateConfig = (key: keyof BotConfig, value: any) => {
    setBotConfig(prev => ({ ...prev, [key]: value }));
    addLog('info', `Config updated: ${key} = ${value}`, 'Settings');
  };

  const togglePlugin = (id: string) => {
    setPlugins(prev => {
      const p = prev.find(x => x.id === id);
      const next = prev.map(x => x.id === id ? { ...x, enabled: !x.enabled } : x);
      // optimistic update and notify backend
      fetch('/api/plugins/toggle', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id, enabled: p ? !p.enabled : true })
      }).catch(() => {});
      return next;
    });
  };

  const toggleAllPlugins = (category: string, enabled: boolean) => {
    setPlugins(prev => prev.map(p =>
      (category === 'all' || p.category === category) ? { ...p, enabled } : p
    ));
    fetch('/api/plugins/toggleAll', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ category, enabled })
    }).catch(() => {});
    addLog('info', `${enabled ? 'Enabled' : 'Disabled'} all ${category} plugins`, 'PluginManager');
  };

  // Fetch plugins from backend on mount (vendors)
  useEffect(() => {
    fetch('/api/plugins')
      .then(r => safeJson(r))
      .then((data: Plugin[]) => {
        if (!Array.isArray(data)) return;
        // merge with defaults so UI fields are present
        const merged = defaultPlugins.map(dp => {
          const svc = data.find(d => d.id === dp.id) || data.find(d => d.command === dp.command);
          return svc ? { ...dp, ...svc } : dp;
        });
        // add any extra plugins from backend
        data.forEach(d => { if (!merged.find(m => m.id === d.id)) merged.push(d); });
        setPlugins(merged);
      }).catch(() => { /* ignore, keep defaults */ });
  }, []);

  // Subscribe to server-sent logs
  useEffect(() => {
    // connect to Socket.IO for QR, connection events and logs
    try {
      const socket = io();
      socketRef.current = socket;
      socket.on('connect', () => addLog('info', 'Connected to backend realtime', 'Socket'));
      socket.on('logs', (arr: any[]) => arr.forEach(l => addLog(l.level, l.message, l.source)));
      socket.on('log', (entry: any) => addLog(entry.level, entry.message, entry.source));
      socket.on('qr', (q: string) => addLog('info', 'Received QR from WhatsApp', 'WhatsApp'));
      socket.on('connection', (st: any) => addLog('info', `WhatsApp connection: ${st}`, 'WhatsApp'));
      return () => { socket.close(); };
    } catch { /* ignore */ }
  }, [addLog]);

  const executePlugin = useCallback(async (id: string, args: string[] = [], user?: { id: string }) => {
    try {
      const res = await fetch('/api/execute', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id, args, user })
      });
      const data = await safeJson(res);
      if (!res.ok) {
        const err = data?.error || `HTTP ${res.status}`;
        addLog('error', `Plugin ${id} failed: ${err}`, 'PluginExec');
        return { ok: false, error: err };
      }
      if (!data.ok) {
        addLog('error', `Plugin ${id} failed: ${data.error}`, 'PluginExec');
        return { ok: false, error: data.error };
      }
      addLog('success', `Plugin ${id} executed`, 'PluginExec');
      return { ok: true, output: data.output || data };
    } catch (e:any) {
      addLog('error', `Plugin ${id} execution error: ${e.message}`, 'PluginExec');
      return { ok: false, error: e.message };
    }
  }, [addLog]);

  // expose executePlugin globally for quick access from components (initialized after declaration)
  useEffect(() => { (window as any).executePlugin = executePlugin; return () => { delete (window as any).executePlugin; } }, [executePlugin]);

  return (
    <AppContext.Provider value={{
      page, setPage, isAuthenticated, currentUser, login, register, logout,
      updateProfile, changePassword, deleteAccount, allUsers,
      isConnected, setIsConnected, connectionMethod, setConnectionMethod,
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
