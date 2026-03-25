import { useState } from 'react';
import { useApp } from '../store';
import { User, Mail, Shield, Calendar, Clock, Key, Save, Trash2, AlertCircle, CheckCircle2, Crown, Settings, Activity, Hash, LogIn } from 'lucide-react';

export default function Profile() {
  const { currentUser, updateProfile, changePassword, deleteAccount, allUsers } = useApp();
  const [displayName, setDisplayName] = useState(currentUser?.displayName || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [saved, setSaved] = useState(false);
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmNewPass, setConfirmNewPass] = useState('');
  const [showPassFields, setShowPassFields] = useState(false);
  const [passError, setPassError] = useState('');
  const [passSuccess, setPassSuccess] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  if (!currentUser) return null;

  const handleSaveProfile = () => { updateProfile({ displayName, email }); setSaved(true); setTimeout(() => setSaved(false), 2000); };

  const handleChangePassword = () => {
    setPassError(''); setPassSuccess(false);
    if (newPass !== confirmNewPass) { setPassError('New passwords do not match'); return; }
    const result = changePassword(oldPass, newPass);
    if (!result.ok) { setPassError(result.error || 'Failed to change password'); }
    else { setPassSuccess(true); setOldPass(''); setNewPass(''); setConfirmNewPass(''); setTimeout(() => { setPassSuccess(false); setShowPassFields(false); }, 2000); }
  };

  const roleColors = {
    owner: 'text-accent-orange bg-accent-orange/10 border-accent-orange/20',
    admin: 'text-accent-blue bg-accent-blue/10 border-accent-blue/20',
    moderator: 'text-accent-purple bg-accent-purple/10 border-accent-purple/20',
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div><h2 className="text-xl font-bold text-text-primary flex items-center gap-2"><User className="w-5 h-5 text-wa-green" />My Profile</h2><p className="text-sm text-text-muted mt-1">Manage your account settings and preferences</p></div>

      <div className="glass rounded-2xl p-6">
        <div className="flex items-start gap-5">
          <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${currentUser.avatar} flex items-center justify-center text-white text-2xl font-bold shadow-lg shrink-0`}>
            {currentUser.displayName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-lg font-bold text-text-primary">{currentUser.displayName}</h3>
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${roleColors[currentUser.role]} flex items-center gap-1`}><Crown className="w-2.5 h-2.5" />{currentUser.role.toUpperCase()}</span>
            </div>
            <p className="text-sm text-text-secondary mt-0.5">@{currentUser.username}</p>
            <p className="text-xs text-text-muted mt-1">{currentUser.email}</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
              {[
                { icon: Calendar, color: 'text-wa-green', label: 'Joined', value: new Date(currentUser.createdAt).toLocaleDateString() },
                { icon: Clock, color: 'text-accent-blue', label: 'Last Login', value: new Date(currentUser.lastLogin).toLocaleDateString() },
                { icon: LogIn, color: 'text-accent-purple', label: 'Sessions', value: currentUser.sessions.toString() },
                { icon: Shield, color: 'text-accent-cyan', label: '2FA', value: currentUser.twoFactorEnabled ? 'On' : 'Off' },
              ].map(({ icon: Icon, color, label, value }) => (
                <div key={label} className="bg-bg-input rounded-lg p-2.5 text-center"><Icon className={`w-3.5 h-3.5 ${color} mx-auto mb-1`} /><p className="text-[10px] text-text-muted">{label}</p><p className="text-xs font-medium text-text-primary">{value}</p></div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="glass rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2"><Settings className="w-4 h-4 text-accent-blue" />Edit Profile</h3>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-text-secondary mb-1.5 block">Display Name</label>
            <div className="relative"><User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" /><input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} className="w-full bg-bg-input border border-border rounded-xl py-2.5 pl-10 pr-4 text-sm text-text-primary focus:outline-none focus:border-wa-green/50 focus:ring-1 focus:ring-wa-green/20 transition-all" maxLength={30} /></div>
          </div>
          <div>
            <label className="text-xs font-medium text-text-secondary mb-1.5 block">Email</label>
            <div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" /><input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-bg-input border border-border rounded-xl py-2.5 pl-10 pr-4 text-sm text-text-primary focus:outline-none focus:border-wa-green/50 focus:ring-1 focus:ring-wa-green/20 transition-all" /></div>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-text-secondary">Username</label>
            <div className="flex items-center gap-1.5 bg-bg-input border border-border rounded-lg px-3 py-2 text-sm text-text-muted"><Hash className="w-3.5 h-3.5" />@{currentUser.username}</div>
            <span className="text-[10px] text-text-muted">(cannot be changed)</span>
          </div>
          <button onClick={handleSaveProfile} className="flex items-center gap-2 px-4 py-2.5 bg-wa-green/10 border border-wa-green/20 text-wa-green text-sm font-medium rounded-xl hover:bg-wa-green/20 transition-colors">
            {saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}{saved ? 'Saved!' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="glass rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2"><Key className="w-4 h-4 text-accent-orange" />Security</h3>
          <button onClick={() => setShowPassFields(!showPassFields)} className="text-xs text-accent-blue hover:underline">{showPassFields ? 'Cancel' : 'Change Password'}</button>
        </div>
        {showPassFields ? (
          <div className="space-y-3 animate-fade-in">
            {[{ val: oldPass, set: setOldPass, ph: 'Current password' }, { val: newPass, set: setNewPass, ph: 'New password (min 6 chars)' }, { val: confirmNewPass, set: setConfirmNewPass, ph: 'Confirm new password' }].map(({ val, set, ph }) => (
              <input key={ph} type="password" value={val} onChange={e => set(e.target.value)} className="w-full bg-bg-input border border-border rounded-xl py-2.5 px-4 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-orange/50 focus:ring-1 focus:ring-accent-orange/20 transition-all" placeholder={ph} />
            ))}
            {passError && <div className="flex items-center gap-2 text-accent-red text-xs bg-accent-red/10 border border-accent-red/20 rounded-lg px-3 py-2 animate-fade-in"><AlertCircle className="w-3.5 h-3.5 shrink-0" />{passError}</div>}
            {passSuccess && <div className="flex items-center gap-2 text-wa-green text-xs bg-wa-green/10 border border-wa-green/20 rounded-lg px-3 py-2 animate-fade-in"><CheckCircle2 className="w-3.5 h-3.5 shrink-0" />Password changed successfully!</div>}
            <button onClick={handleChangePassword} disabled={!oldPass || !newPass || !confirmNewPass} className="flex items-center gap-2 px-4 py-2.5 bg-accent-orange/10 border border-accent-orange/20 text-accent-orange text-sm font-medium rounded-xl hover:bg-accent-orange/20 transition-colors disabled:opacity-50"><Key className="w-4 h-4" />Update Password</button>
          </div>
        ) : (
          <div className="flex items-center gap-3 bg-bg-input rounded-xl p-3">
            <Shield className="w-5 h-5 text-wa-green" />
            <div><p className="text-xs font-medium text-text-primary">Password Protected</p><p className="text-[10px] text-text-muted">Last changed: {new Date(currentUser.createdAt).toLocaleDateString()}</p></div>
          </div>
        )}
      </div>

      {currentUser.role === 'owner' && allUsers.length > 1 && (
        <div className="glass rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2"><Activity className="w-4 h-4 text-accent-purple" />Registered Users ({allUsers.length})</h3>
          <div className="space-y-2">
            {allUsers.map(u => (
              <div key={u.id} className="flex items-center gap-3 bg-bg-input rounded-xl p-3">
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${u.avatar} flex items-center justify-center text-white text-xs font-bold`}>{u.displayName.charAt(0).toUpperCase()}</div>
                <div className="flex-1 min-w-0"><p className="text-xs font-medium text-text-primary">{u.displayName}</p><p className="text-[10px] text-text-muted">@{u.username} • {u.email}</p></div>
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${roleColors[u.role]}`}>{u.role}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="glass rounded-2xl p-6 border border-accent-red/20">
        <h3 className="text-sm font-semibold text-accent-red mb-4 flex items-center gap-2"><Trash2 className="w-4 h-4" />Danger Zone</h3>
        {!showDeleteConfirm ? (
          <button onClick={() => setShowDeleteConfirm(true)} className="flex items-center gap-2 px-4 py-2.5 bg-accent-red/10 border border-accent-red/20 text-accent-red text-sm font-medium rounded-xl hover:bg-accent-red/20 transition-colors"><Trash2 className="w-4 h-4" />Delete Account</button>
        ) : (
          <div className="space-y-3 animate-fade-in">
            <p className="text-xs text-text-muted">Type your username <span className="text-accent-red font-mono">{currentUser.username}</span> to confirm deletion:</p>
            <input type="text" value={deleteConfirmText} onChange={e => setDeleteConfirmText(e.target.value)} className="w-full bg-bg-input border border-accent-red/30 rounded-xl py-2.5 px-4 text-sm text-text-primary focus:outline-none focus:border-accent-red/50 transition-all" placeholder={currentUser.username} />
            <div className="flex gap-2">
              <button onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(''); }} className="px-4 py-2 glass text-text-secondary text-xs rounded-lg hover:text-text-primary">Cancel</button>
              <button onClick={() => { if (deleteConfirmText === currentUser.username) deleteAccount(); }} disabled={deleteConfirmText !== currentUser.username} className="flex items-center gap-1.5 px-4 py-2 bg-accent-red/10 border border-accent-red/20 text-accent-red text-xs rounded-lg disabled:opacity-50 hover:bg-accent-red/20"><Trash2 className="w-3 h-3" />Delete Forever</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
