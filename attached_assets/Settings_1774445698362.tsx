import { useApp } from '../store';
import type { BotConfig } from '../store';
import {
  Settings as SettingsIcon, Bot, Hash, Phone, Globe, Eye, MessageSquare, Shield,
  Bell, Mic, PhoneOff, Link2, UserX, Sparkles, Save, RotateCcw, Lock, Palette,
  Radio, Heart, Send, Users
} from 'lucide-react';

function ToggleSwitch({ enabled, onToggle, label, description, icon: Icon }: {
  enabled: boolean; onToggle: () => void; label: string; description: string; icon: any;
}) {
  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
          enabled ? 'bg-wa-green/15 text-wa-green' : 'bg-bg-input text-text-muted'
        } transition-colors`}>
          <Icon className="w-4 h-4" />
        </div>
        <div>
          <p className="text-sm font-medium text-text-primary">{label}</p>
          <p className="text-xs text-text-muted">{description}</p>
        </div>
      </div>
      <button
        onClick={onToggle}
        className={`relative w-11 h-6 rounded-full transition-colors ${
          enabled ? 'bg-wa-green' : 'bg-bg-input border border-border'
        }`}
      >
        <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-all ${
          enabled ? 'left-5.5' : 'left-0.5'
        }`} style={{ left: enabled ? '22px' : '2px' }} />
      </button>
    </div>
  );
}

export default function Settings() {
  const { botConfig, updateConfig } = useApp();

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
        <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
          <SettingsIcon className="w-5 h-5 text-wa-green" />
          Bot Settings
        </h2>
        <p className="text-sm text-text-muted mt-1">Configure your bot behavior and appearance</p>
      </div>

      {/* Bot Identity */}
      <div className="glass rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
          <Palette className="w-4 h-4 text-accent-purple" />
          Bot Identity
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-text-secondary mb-1.5 block">Bot Name</label>
            <div className="relative">
              <Bot className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                type="text"
                value={botConfig.botName}
                onChange={e => updateConfig('botName', e.target.value)}
                className="w-full bg-bg-input border border-border rounded-xl py-2.5 pl-10 pr-4 text-sm text-text-primary focus:outline-none focus:border-wa-green/50 focus:ring-1 focus:ring-wa-green/20 transition-all"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-text-secondary mb-1.5 block">Command Prefix</label>
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                type="text"
                value={botConfig.prefix}
                onChange={e => updateConfig('prefix', e.target.value)}
                className="w-full bg-bg-input border border-border rounded-xl py-2.5 pl-10 pr-4 text-sm text-text-primary focus:outline-none focus:border-wa-green/50 focus:ring-1 focus:ring-wa-green/20 transition-all"
                maxLength={3}
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-text-secondary mb-1.5 block">Owner Number</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                type="tel"
                value={botConfig.ownerNumber}
                onChange={e => updateConfig('ownerNumber', e.target.value)}
                className="w-full bg-bg-input border border-border rounded-xl py-2.5 pl-10 pr-4 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-wa-green/50 focus:ring-1 focus:ring-wa-green/20 transition-all"
                placeholder="+1234567890"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-text-secondary mb-1.5 block">Language</label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <select
                value={botConfig.language}
                onChange={e => updateConfig('language', e.target.value)}
                className="w-full bg-bg-input border border-border rounded-xl py-2.5 pl-10 pr-4 text-sm text-text-primary focus:outline-none focus:border-wa-green/50 focus:ring-1 focus:ring-wa-green/20 transition-all appearance-none"
              >
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

      {/* Feature Toggles */}
      <div className="glass rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-text-primary mb-2 flex items-center gap-2">
          <Bell className="w-4 h-4 text-accent-orange" />
          Features & Behavior
        </h3>
        <div className="divide-y divide-border">
          {toggles.map(t => (
            <ToggleSwitch
              key={t.key}
              enabled={!!botConfig[t.key]}
              onToggle={() => updateConfig(t.key, !botConfig[t.key])}
              label={t.label}
              description={t.description}
              icon={t.icon}
            />
          ))}
        </div>
      </div>

      {/* Danger Zone */}
      <div className="glass rounded-2xl p-6 border-accent-red/20">
        <h3 className="text-sm font-semibold text-accent-red mb-4 flex items-center gap-2">
          <Shield className="w-4 h-4" />
          Danger Zone
        </h3>
        <div className="flex flex-wrap gap-3">
          <button className="flex items-center gap-1.5 px-4 py-2.5 bg-accent-orange/10 border border-accent-orange/20 text-accent-orange text-xs font-medium rounded-xl hover:bg-accent-orange/20 transition-colors">
            <RotateCcw className="w-3.5 h-3.5" />
            Restart Bot
          </button>
          <button className="flex items-center gap-1.5 px-4 py-2.5 bg-accent-red/10 border border-accent-red/20 text-accent-red text-xs font-medium rounded-xl hover:bg-accent-red/20 transition-colors">
            <Shield className="w-3.5 h-3.5" />
            Reset All Settings
          </button>
          <button className="flex items-center gap-1.5 px-4 py-2.5 bg-accent-red/10 border border-accent-red/20 text-accent-red text-xs font-medium rounded-xl hover:bg-accent-red/20 transition-colors">
            <UserX className="w-3.5 h-3.5" />
            Disconnect Session
          </button>
        </div>
      </div>

      {/* Save Indicator */}
      <div className="glass rounded-xl px-4 py-3 flex items-center gap-2">
        <Save className="w-4 h-4 text-wa-green" />
        <span className="text-xs text-text-muted">Settings are auto-saved to local storage</span>
      </div>
    </div>
  );
}
