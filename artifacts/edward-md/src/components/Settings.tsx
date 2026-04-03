import { useApp } from '../store';
import type { BotConfig } from '../store';
import { useState, useEffect, useRef } from 'react';
import {
  Settings as SettingsIcon, Bot, Hash, Phone, Globe, Eye, MessageSquare, Shield,
  Bell, Mic, PhoneOff, Link2, UserX, Sparkles, Save, RotateCcw, Lock, Palette,
  Radio, Heart, Send, Users, Crown, Key, Upload, Image, Volume2, Tv2, Copy,
  CheckCircle, AlertCircle, Loader2, Star, Zap, RefreshCw
} from 'lucide-react';

const API = import.meta.env.VITE_API_URL || '';

function ToggleSwitch({ enabled, onToggle, label, description, icon: Icon }: { enabled: boolean; onToggle: () => void; label: string; description: string; icon: any }) {
  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${enabled ? 'bg-wa-green/15 text-wa-green' : 'bg-bg-input text-text-muted'} transition-colors`}><Icon className="w-4 h-4" /></div>
        <div><p className="text-sm font-medium text-text-primary">{label}</p><p className="text-xs text-text-muted">{description}</p></div>
      </div>
      <button onClick={onToggle} className={`relative w-11 h-6 rounded-full transition-colors ${enabled ? 'bg-wa-green' : 'bg-bg-input border border-border'}`}>
        <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-all`} style={{ left: enabled ? '22px' : '2px' }} />
      </button>
    </div>
  );
}

function StatusMessage({ type, message }: { type: 'success' | 'error' | null; message: string }) {
  if (!type) return null;
  return (
    <div className={`flex items-center gap-2 mt-3 p-3 rounded-xl text-xs font-medium ${type === 'success' ? 'bg-wa-green/10 text-wa-green border border-wa-green/20' : 'bg-accent-red/10 text-accent-red border border-accent-red/20'}`}>
      {type === 'success' ? <CheckCircle className="w-3.5 h-3.5 shrink-0" /> : <AlertCircle className="w-3.5 h-3.5 shrink-0" />}
      {message}
    </div>
  );
}

interface PremiumInfo {
  serverTier: 'free' | 'premium';
  activeKey: string | null;
  totalKeys: number;
  usedKeys: number;
  unusedKeys: number;
}

export default function Settings() {
  const { botConfig, updateConfig } = useApp();

  // Premium info
  const [premiumInfo, setPremiumInfo] = useState<PremiumInfo | null>(null);
  const [loadingPremium, setLoadingPremium] = useState(false);

  // Key activation
  const [activateKey, setActivateKey] = useState('');
  const [activating, setActivating] = useState(false);
  const [activateStatus, setActivateStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  // Admin key generation
  const [adminEmail, setAdminEmail] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [generateStatus, setGenerateStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [keyCopied, setKeyCopied] = useState(false);

  // Menu uploads
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const [imageStatus, setImageStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [audioStatus, setAudioStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchPremiumInfo(); }, []);

  async function fetchPremiumInfo() {
    setLoadingPremium(true);
    try {
      const r = await fetch(`${API}/api/premium/info`);
      const data = await r.json();
      setPremiumInfo(data);
      if (data.serverTier !== botConfig.serverTier) {
        updateConfig('serverTier', data.serverTier);
      }
    } catch {}
    setLoadingPremium(false);
  }

  async function handleActivate() {
    if (!activateKey.trim()) return;
    setActivating(true);
    setActivateStatus(null);
    try {
      const r = await fetch(`${API}/api/premium/activate`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: activateKey.trim() }),
      });
      const data = await r.json();
      if (data.ok) {
        setActivateStatus({ type: 'success', msg: data.message });
        updateConfig('serverTier', 'premium');
        setActivateKey('');
        fetchPremiumInfo();
      } else {
        setActivateStatus({ type: 'error', msg: data.error });
      }
    } catch { setActivateStatus({ type: 'error', msg: 'Network error' }); }
    setActivating(false);
  }

  async function handleGenerateKey() {
    if (!adminEmail.trim()) return;
    setGenerating(true);
    setGenerateStatus(null);
    setGeneratedKey(null);
    try {
      const r = await fetch(`${API}/api/premium/generate`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminEmail: adminEmail.trim() }),
      });
      const data = await r.json();
      if (data.ok) {
        setGeneratedKey(data.key);
        setGenerateStatus({ type: 'success', msg: 'Key generated successfully!' });
        fetchPremiumInfo();
      } else {
        setGenerateStatus({ type: 'error', msg: data.error });
      }
    } catch { setGenerateStatus({ type: 'error', msg: 'Network error' }); }
    setGenerating(false);
  }

  function copyKey() {
    if (generatedKey) {
      navigator.clipboard.writeText(generatedKey);
      setKeyCopied(true);
      setTimeout(() => setKeyCopied(false), 2000);
    }
  }

  async function handleFileUpload(file: File, field: 'menuImageUrl' | 'menuAudioUrl') {
    const isImage = field === 'menuImageUrl';
    if (isImage) { setUploadingImage(true); setImageStatus(null); }
    else { setUploadingAudio(true); setAudioStatus(null); }
    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => { const r = reader.result as string; resolve(r.split(',')[1]); };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const ext = file.name.split('.').pop() || '';
      const filename = `${field.replace('menu', '').replace('Url', '').toLowerCase()}-${Date.now()}.${ext}`;
      const r = await fetch(`${API}/api/upload`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename, data: base64, type: file.type }),
      });
      const data = await r.json();
      if (data.ok) {
        const fullUrl = `${API}${data.url}`;
        updateConfig(field, fullUrl);
        if (isImage) setImageStatus({ type: 'success', msg: `Image uploaded ✓` });
        else setAudioStatus({ type: 'success', msg: `Audio uploaded ✓` });
      } else {
        if (isImage) setImageStatus({ type: 'error', msg: data.error });
        else setAudioStatus({ type: 'error', msg: data.error });
      }
    } catch (e: any) {
      if (isImage) setImageStatus({ type: 'error', msg: 'Upload failed' });
      else setAudioStatus({ type: 'error', msg: 'Upload failed' });
    }
    if (isImage) setUploadingImage(false);
    else setUploadingAudio(false);
  }

  const isPremium = (premiumInfo?.serverTier || botConfig.serverTier) === 'premium';

  const toggles: { key: keyof BotConfig; label: string; description: string; icon: any }[] = [
    { key: 'publicMode', label: 'Public Mode', description: 'Allow anyone to use the bot', icon: Globe },
    { key: 'autoRead', label: 'Auto Read Messages', description: 'Automatically mark messages as read', icon: Eye },
    { key: 'autoTyping', label: 'Auto Typing Indicator', description: 'Show typing before sending response', icon: MessageSquare },
    { key: 'autoRecording', label: 'Auto Recording Indicator', description: 'Show recording before voice messages', icon: Mic },
    { key: 'alwaysOnline', label: 'Always Online', description: 'Keep bot online status always visible', icon: Radio },
    { key: 'antiCall', label: 'Anti-Call', description: 'Auto reject incoming calls', icon: PhoneOff },
    { key: 'antiSpam', label: 'Anti-Spam', description: 'Detect and prevent spam messages', icon: Shield },
    { key: 'antiLink', label: 'Anti-Link (Groups)', description: 'Delete messages containing links in groups', icon: Link2 },
    { key: 'antiDelete', label: 'Anti-Delete', description: 'Log messages that users delete', icon: UserX },
    { key: 'antiViewOnce', label: 'Anti-ViewOnce', description: 'Forward view-once messages to you', icon: Lock },
    { key: 'welcomeMessage', label: 'Welcome Message', description: 'Send welcome message to new members', icon: Heart },
    { key: 'goodbyeMessage', label: 'Goodbye Message', description: 'Send goodbye message when members leave', icon: Send },
    { key: 'autoReact', label: 'Auto React', description: 'React to messages with emojis', icon: Sparkles },
    { key: 'statusSeen', label: 'Auto View Status', description: 'Automatically view contact statuses', icon: Eye },
    { key: 'statusReply', label: 'Auto Status Reply', description: 'Reply to statuses automatically', icon: MessageSquare },
    { key: 'selfMode', label: 'Self Mode', description: 'Only owner can use the bot', icon: Users },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-xl font-bold text-text-primary flex items-center gap-2"><SettingsIcon className="w-5 h-5 text-wa-green" />Bot Settings</h2>
        <p className="text-sm text-text-muted mt-1">Configure your bot behavior and appearance</p>
      </div>

      {/* ── Server Plan Card ───────────────────────────────────── */}
      <div className={`glass rounded-2xl p-5 border ${isPremium ? 'border-accent-orange/30 bg-gradient-to-br from-accent-orange/5 to-accent-pink/5' : 'border-border'}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
            <Crown className={`w-4 h-4 ${isPremium ? 'text-accent-orange' : 'text-text-muted'}`} />Server Plan
          </h3>
          <button onClick={fetchPremiumInfo} disabled={loadingPremium} className="text-text-muted hover:text-text-primary transition-colors">
            <RefreshCw className={`w-3.5 h-3.5 ${loadingPremium ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="flex items-center gap-4 mb-4">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm ${isPremium ? 'bg-gradient-to-r from-accent-orange to-accent-pink text-white' : 'bg-bg-input text-text-muted border border-border'}`}>
            {isPremium ? <><Star className="w-4 h-4" />PREMIUM</> : <><Zap className="w-4 h-4" />FREE</>}
          </div>
          {premiumInfo && (
            <div className="text-xs text-text-muted space-y-0.5">
              {isPremium && premiumInfo.activeKey && <p>Active key: <span className="text-text-secondary font-mono">{premiumInfo.activeKey}</span></p>}
              <p>Keys generated: <span className="text-text-secondary">{premiumInfo.totalKeys}</span> &nbsp;·&nbsp; Used: <span className="text-text-secondary">{premiumInfo.usedKeys}</span></p>
            </div>
          )}
        </div>

        {!isPremium && (
          <div className="border-t border-border pt-4">
            <p className="text-xs font-medium text-text-secondary mb-2.5 flex items-center gap-1.5"><Key className="w-3.5 h-3.5" />Activate Premium Key</p>
            <div className="flex gap-2">
              <input
                value={activateKey}
                onChange={e => setActivateKey(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleActivate()}
                placeholder="EDWARD-XXXXXX-XXXXXX-XXXXXX"
                className="flex-1 bg-bg-input border border-border rounded-xl py-2 px-3 text-xs text-text-primary font-mono placeholder:text-text-muted focus:outline-none focus:border-wa-green/50 transition-all"
              />
              <button onClick={handleActivate} disabled={activating || !activateKey.trim()} className="px-4 py-2 bg-wa-green text-white text-xs font-semibold rounded-xl hover:bg-wa-green/90 disabled:opacity-50 transition-colors flex items-center gap-1.5">
                {activating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Key className="w-3.5 h-3.5" />}Activate
              </button>
            </div>
            {activateStatus && <StatusMessage type={activateStatus.type} message={activateStatus.msg} />}
          </div>
        )}

        {isPremium && (
          <div className="border-t border-accent-orange/20 pt-3">
            <p className="text-xs text-accent-orange/80 flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5" />Your server is running on Premium. Enjoy all features!</p>
          </div>
        )}
      </div>

      {/* ── Bot Identity ───────────────────────────────────────── */}
      <div className="glass rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2"><Palette className="w-4 h-4 text-accent-purple" />Bot Identity</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { key: 'botName', label: 'Bot Name', icon: Bot, type: 'text', placeholder: 'EDWARD MD' },
            { key: 'prefix', label: 'Command Prefix', icon: Hash, type: 'text', placeholder: '.', maxLength: 3 },
            { key: 'ownerNumber', label: 'Owner Number', icon: Phone, type: 'tel', placeholder: '+1234567890' },
          ].map(({ key, label, icon: Icon, type, placeholder, maxLength }) => (
            <div key={key}>
              <label className="text-xs font-medium text-text-secondary mb-1.5 block">{label}</label>
              <div className="relative">
                <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input type={type} value={(botConfig as any)[key] || ''} onChange={e => updateConfig(key as keyof BotConfig, e.target.value)} maxLength={maxLength} className="w-full bg-bg-input border border-border rounded-xl py-2.5 pl-10 pr-4 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-wa-green/50 focus:ring-1 focus:ring-wa-green/20 transition-all" placeholder={placeholder} />
              </div>
            </div>
          ))}
          <div>
            <label className="text-xs font-medium text-text-secondary mb-1.5 block">Language</label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <select value={botConfig.language} onChange={e => updateConfig('language', e.target.value)} className="w-full bg-bg-input border border-border rounded-xl py-2.5 pl-10 pr-4 text-sm text-text-primary focus:outline-none focus:border-wa-green/50 focus:ring-1 focus:ring-wa-green/20 transition-all appearance-none">
                <option value="en">English</option>
                <option value="es">Español</option>
                <option value="pt">Português</option>
                <option value="fr">Français</option>
                <option value="de">Deutsch</option>
                <option value="id">Bahasa Indonesia</option>
                <option value="ar">العربية</option>
                <option value="hi">हिन्दी</option>
                <option value="ja">日本語</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* ── Menu Customization ─────────────────────────────────── */}
      <div className="glass rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2"><Image className="w-4 h-4 text-accent-cyan" />Menu Customization</h3>
        <div className="space-y-5">

          {/* Image Upload */}
          <div>
            <label className="text-xs font-medium text-text-secondary mb-2 block flex items-center gap-1.5"><Image className="w-3.5 h-3.5" />Menu Image</label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Upload className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  type="text"
                  value={botConfig.menuImageUrl || ''}
                  onChange={e => updateConfig('menuImageUrl', e.target.value)}
                  placeholder="Paste URL or upload a file →"
                  className="w-full bg-bg-input border border-border rounded-xl py-2.5 pl-10 pr-4 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-wa-green/50 transition-all"
                />
              </div>
              <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFileUpload(f, 'menuImageUrl'); }} />
              <button onClick={() => imageInputRef.current?.click()} disabled={uploadingImage} className="px-4 py-2 bg-accent-cyan/10 border border-accent-cyan/20 text-accent-cyan text-xs font-medium rounded-xl hover:bg-accent-cyan/20 disabled:opacity-50 transition-colors flex items-center gap-1.5">
                {uploadingImage ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}Upload
              </button>
            </div>
            {botConfig.menuImageUrl && (
              <div className="mt-2 rounded-xl overflow-hidden border border-border w-24 h-16">
                <img src={botConfig.menuImageUrl} alt="Menu preview" className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              </div>
            )}
            {imageStatus && <StatusMessage type={imageStatus.type} message={imageStatus.msg} />}
          </div>

          {/* Audio Upload */}
          <div>
            <label className="text-xs font-medium text-text-secondary mb-2 block flex items-center gap-1.5"><Volume2 className="w-3.5 h-3.5" />Menu Audio (sent after menu)</label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Volume2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  type="text"
                  value={botConfig.menuAudioUrl || ''}
                  onChange={e => updateConfig('menuAudioUrl', e.target.value)}
                  placeholder="Paste audio URL or upload →"
                  className="w-full bg-bg-input border border-border rounded-xl py-2.5 pl-10 pr-4 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-wa-green/50 transition-all"
                />
              </div>
              <input ref={audioInputRef} type="file" accept="audio/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFileUpload(f, 'menuAudioUrl'); }} />
              <button onClick={() => audioInputRef.current?.click()} disabled={uploadingAudio} className="px-4 py-2 bg-accent-purple/10 border border-accent-purple/20 text-accent-purple text-xs font-medium rounded-xl hover:bg-accent-purple/20 disabled:opacity-50 transition-colors flex items-center gap-1.5">
                {uploadingAudio ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}Upload
              </button>
            </div>
            {botConfig.menuAudioUrl && (
              <p className="mt-1.5 text-xs text-text-muted truncate font-mono">{botConfig.menuAudioUrl}</p>
            )}
            {audioStatus && <StatusMessage type={audioStatus.type} message={audioStatus.msg} />}
          </div>

          {/* Channel Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-border">
            <div>
              <label className="text-xs font-medium text-text-secondary mb-1.5 block flex items-center gap-1.5"><Tv2 className="w-3.5 h-3.5" />Channel / Newsletter Name</label>
              <input
                type="text"
                value={botConfig.menuChannelName || ''}
                onChange={e => updateConfig('menuChannelName', e.target.value)}
                placeholder="e.g. EDWARD MD Official"
                className="w-full bg-bg-input border border-border rounded-xl py-2.5 px-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-wa-green/50 transition-all"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-text-secondary mb-1.5 block flex items-center gap-1.5"><Hash className="w-3.5 h-3.5" />Newsletter Channel ID</label>
              <input
                type="text"
                value={botConfig.menuNewsletterId || ''}
                onChange={e => updateConfig('menuNewsletterId', e.target.value)}
                placeholder="e.g. 120363xxxxxxxx@newsletter"
                className="w-full bg-bg-input border border-border rounded-xl py-2.5 px-3 text-sm text-text-primary placeholder:text-text-muted font-mono focus:outline-none focus:border-wa-green/50 transition-all"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Features & Behavior ─────────────────────────────────── */}
      <div className="glass rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-text-primary mb-2 flex items-center gap-2"><Bell className="w-4 h-4 text-accent-orange" />Features & Behavior</h3>
        <div className="divide-y divide-border">
          {toggles.map(t => <ToggleSwitch key={t.key} enabled={!!botConfig[t.key]} onToggle={() => updateConfig(t.key, !botConfig[t.key])} label={t.label} description={t.description} icon={t.icon} />)}
        </div>
      </div>

      {/* ── Admin Panel ─────────────────────────────────────────── */}
      <div className="glass rounded-2xl p-6 border border-accent-orange/20">
        <h3 className="text-sm font-semibold text-accent-orange mb-4 flex items-center gap-2"><Crown className="w-4 h-4" />Admin Panel — Premium Key Generator</h3>
        <p className="text-xs text-text-muted mb-4">Only the configured admin email can generate premium keys. Share generated keys with users to upgrade their servers.</p>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-text-secondary mb-1.5 block">Admin Email</label>
            <input
              type="email"
              value={adminEmail}
              onChange={e => setAdminEmail(e.target.value)}
              placeholder="gboyegaibk@gmail.com"
              className="w-full bg-bg-input border border-border rounded-xl py-2.5 px-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-orange/50 transition-all"
            />
          </div>
          <button
            onClick={handleGenerateKey}
            disabled={generating || !adminEmail.trim()}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-accent-orange to-accent-pink text-white text-xs font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 transition-all"
          >
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}Generate Premium Key
          </button>

          {generateStatus && <StatusMessage type={generateStatus.type} message={generateStatus.msg} />}

          {generatedKey && (
            <div className="mt-3 p-3 bg-bg-input border border-accent-orange/20 rounded-xl">
              <p className="text-xs text-text-muted mb-1.5">Generated key — share this with the user:</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-sm font-mono text-accent-orange font-bold tracking-wide">{generatedKey}</code>
                <button onClick={copyKey} className={`p-2 rounded-lg transition-colors ${keyCopied ? 'bg-wa-green/20 text-wa-green' : 'bg-bg-card hover:bg-border text-text-muted'}`}>
                  {keyCopied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Danger Zone ─────────────────────────────────────────── */}
      <div className="glass rounded-2xl p-6 border border-accent-red/20">
        <h3 className="text-sm font-semibold text-accent-red mb-4 flex items-center gap-2"><Shield className="w-4 h-4" />Danger Zone</h3>
        <div className="flex flex-wrap gap-3">
          <button className="flex items-center gap-1.5 px-4 py-2.5 bg-accent-orange/10 border border-accent-orange/20 text-accent-orange text-xs font-medium rounded-xl hover:bg-accent-orange/20 transition-colors"><RotateCcw className="w-3.5 h-3.5" />Restart Bot</button>
          <button className="flex items-center gap-1.5 px-4 py-2.5 bg-accent-red/10 border border-accent-red/20 text-accent-red text-xs font-medium rounded-xl hover:bg-accent-red/20 transition-colors"><Shield className="w-3.5 h-3.5" />Reset All Settings</button>
          <button className="flex items-center gap-1.5 px-4 py-2.5 bg-accent-red/10 border border-accent-red/20 text-accent-red text-xs font-medium rounded-xl hover:bg-accent-red/20 transition-colors"><UserX className="w-3.5 h-3.5" />Disconnect Session</button>
        </div>
      </div>

      <div className="glass rounded-xl px-4 py-3 flex items-center gap-2"><Save className="w-4 h-4 text-wa-green" /><span className="text-xs text-text-muted">Settings are auto-saved. Tier changes take effect immediately.</span></div>
    </div>
  );
}
