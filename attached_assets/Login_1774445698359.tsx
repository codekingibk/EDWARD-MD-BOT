import React, { useState } from 'react';
import { useApp } from '../store';
import {
  Shield, Lock, User, Eye, EyeOff, Zap, ChevronRight, AlertCircle,
  Mail, UserPlus, LogIn, Sparkles, CheckCircle2, AtSign, KeyRound
} from 'lucide-react';

export default function Login() {
  const { login, register, setPage, page } = useApp();
  const isRegisterPage = page === 'register';

  // Login state
  const [loginId, setLoginId] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [showLoginPass, setShowLoginPass] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Register state
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regDisplayName, setRegDisplayName] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPass, setRegConfirmPass] = useState('');
  const [showRegPass, setShowRegPass] = useState(false);
  const [regError, setRegError] = useState('');
  const [regLoading, setRegLoading] = useState(false);
  const [regSuccess, setRegSuccess] = useState(false);

  // Password strength
  const getPasswordStrength = (pass: string) => {
    let score = 0;
    if (pass.length >= 6) score++;
    if (pass.length >= 10) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    return score;
  };

  const strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Excellent'];
  const strengthColors = ['', 'bg-accent-red', 'bg-accent-orange', 'bg-accent-orange', 'bg-wa-green', 'bg-accent-cyan'];
  const passStrength = getPasswordStrength(regPassword);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);
    await new Promise(r => setTimeout(r, 1000));
    const result = login(loginId, loginPass);
    if (!result.ok) {
      setLoginError(result.error || 'Login failed');
    }
    setLoginLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');

    if (regPassword !== regConfirmPass) {
      setRegError('Passwords do not match');
      return;
    }

    setRegLoading(true);
    await new Promise(r => setTimeout(r, 1500));

    const result = register({
      username: regUsername,
      email: regEmail,
      password: regPassword,
      displayName: regDisplayName,
    });

    if (!result.ok) {
      setRegError(result.error || 'Registration failed');
      setRegLoading(false);
    } else {
      setRegSuccess(true);
      // The store handles navigation
    }
  };

  const switchToRegister = () => {
    setPage('register');
    setLoginError('');
  };

  const switchToLogin = () => {
    setPage('login');
    setRegError('');
    setRegSuccess(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-bg-primary">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-wa-green/5 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-blue/5 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent-purple/3 rounded-full blur-[150px]" />
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '60px 60px'
        }} />
        {/* Floating particles */}
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-wa-green/30 rounded-full animate-pulse"
            style={{
              left: `${15 + i * 15}%`,
              top: `${20 + (i % 3) * 25}%`,
              animationDelay: `${i * 0.5}s`,
              animationDuration: `${2 + i * 0.5}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 w-full max-w-md px-6 animate-slide-up">
        {/* Logo */}
        <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-2xl overflow-hidden mb-4 shadow-lg shadow-wa-green/20">
              <img src="https://019d1877-892a-752e-8f4b-3aac88da9cdf.arena.site/images/edward-logo.png" alt="EDWARD MD" className="w-full h-full object-cover" />
            </div>
          <h1 className="text-4xl font-black tracking-tight">
            <span className="gradient-text">EDWARD</span>
            <span className="text-text-secondary font-light"> MD</span>
          </h1>
          <p className="text-text-muted mt-2 text-sm">WhatsApp Multi-Device Bot Dashboard</p>
          <div className="flex items-center justify-center gap-2 mt-3">
            <div className="flex items-center gap-1 text-xs text-wa-green bg-wa-green/10 px-2 py-1 rounded-full">
              <Sparkles className="w-3 h-3" />
              v3.0.0
            </div>
            <div className="flex items-center gap-1 text-xs text-accent-blue bg-accent-blue/10 px-2 py-1 rounded-full">
              <Shield className="w-3 h-3" />
              Secure
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-bg-card rounded-xl p-1 mb-6 border border-border">
          <button
            onClick={switchToLogin}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
              !isRegisterPage
                ? 'bg-wa-green/15 text-wa-green border border-wa-green/30'
                : 'text-text-muted hover:text-text-secondary'
            }`}
          >
            <LogIn className="w-4 h-4" />
            Sign In
          </button>
          <button
            onClick={switchToRegister}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
              isRegisterPage
                ? 'bg-accent-blue/15 text-accent-blue border border-accent-blue/30'
                : 'text-text-muted hover:text-text-secondary'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            Sign Up
          </button>
        </div>

        {/* ─── LOGIN FORM ─── */}
        {!isRegisterPage && (
          <div className="glass-strong rounded-2xl p-8 animate-fade-in">
            <div className="flex items-center gap-2 mb-6">
              <Shield className="w-5 h-5 text-wa-green" />
              <h2 className="text-lg font-semibold text-text-primary">Welcome Back</h2>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="text-xs font-medium text-text-secondary mb-1.5 block">Username or Email</label>
                <div className="relative">
                  <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input
                    type="text"
                    value={loginId}
                    onChange={e => setLoginId(e.target.value)}
                    className="w-full bg-bg-input border border-border rounded-xl py-3 pl-10 pr-4 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-wa-green/50 focus:ring-1 focus:ring-wa-green/20 transition-all"
                    placeholder="Enter username or email"
                    autoComplete="username"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-text-secondary mb-1.5 block">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input
                    type={showLoginPass ? 'text' : 'password'}
                    value={loginPass}
                    onChange={e => setLoginPass(e.target.value)}
                    className="w-full bg-bg-input border border-border rounded-xl py-3 pl-10 pr-12 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-wa-green/50 focus:ring-1 focus:ring-wa-green/20 transition-all"
                    placeholder="Enter password"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPass(!showLoginPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
                  >
                    {showLoginPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {loginError && (
                <div className="flex items-center gap-2 text-accent-red text-xs bg-accent-red/10 border border-accent-red/20 rounded-lg px-3 py-2.5 animate-fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {loginError}
                </div>
              )}

              <button
                type="submit"
                disabled={loginLoading || !loginId || !loginPass}
                className="w-full bg-gradient-to-r from-wa-green to-wa-dark-green hover:from-wa-green/90 hover:to-wa-dark-green/90 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-wa-green/20 hover:shadow-wa-green/30"
              >
                {loginLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    Sign In
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-5 pt-5 border-t border-border text-center">
              <p className="text-text-muted text-xs">
                Don't have an account?{' '}
                <button onClick={switchToRegister} className="text-wa-green hover:underline font-medium">
                  Create one now
                </button>
              </p>
            </div>
          </div>
        )}

        {/* ─── REGISTER FORM ─── */}
        {isRegisterPage && !regSuccess && (
          <div className="glass-strong rounded-2xl p-8 animate-fade-in">
            <div className="flex items-center gap-2 mb-6">
              <UserPlus className="w-5 h-5 text-accent-blue" />
              <h2 className="text-lg font-semibold text-text-primary">Create Account</h2>
            </div>

            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-text-secondary mb-1.5 block">Display Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input
                    type="text"
                    value={regDisplayName}
                    onChange={e => setRegDisplayName(e.target.value)}
                    className="w-full bg-bg-input border border-border rounded-xl py-3 pl-10 pr-4 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-blue/50 focus:ring-1 focus:ring-accent-blue/20 transition-all"
                    placeholder="Your display name"
                    maxLength={30}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-text-secondary mb-1.5 block">Username</label>
                <div className="relative">
                  <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input
                    type="text"
                    value={regUsername}
                    onChange={e => setRegUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                    className="w-full bg-bg-input border border-border rounded-xl py-3 pl-10 pr-4 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-blue/50 focus:ring-1 focus:ring-accent-blue/20 transition-all"
                    placeholder="Choose a username"
                    maxLength={20}
                    autoComplete="username"
                  />
                </div>
                <p className="text-[10px] text-text-muted mt-1">Letters, numbers, and underscores only</p>
              </div>

              <div>
                <label className="text-xs font-medium text-text-secondary mb-1.5 block">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input
                    type="email"
                    value={regEmail}
                    onChange={e => setRegEmail(e.target.value)}
                    className="w-full bg-bg-input border border-border rounded-xl py-3 pl-10 pr-4 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-blue/50 focus:ring-1 focus:ring-accent-blue/20 transition-all"
                    placeholder="your@email.com"
                    autoComplete="email"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-text-secondary mb-1.5 block">Password</label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input
                    type={showRegPass ? 'text' : 'password'}
                    value={regPassword}
                    onChange={e => setRegPassword(e.target.value)}
                    className="w-full bg-bg-input border border-border rounded-xl py-3 pl-10 pr-12 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-blue/50 focus:ring-1 focus:ring-accent-blue/20 transition-all"
                    placeholder="Create a strong password"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPass(!showRegPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
                  >
                    {showRegPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {/* Password strength bar */}
                {regPassword && (
                  <div className="mt-2 animate-fade-in">
                    <div className="flex gap-1 mb-1">
                      {[1, 2, 3, 4, 5].map(i => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded-full transition-all ${
                            i <= passStrength ? strengthColors[passStrength] : 'bg-bg-input'
                          }`}
                        />
                      ))}
                    </div>
                    <p className={`text-[10px] ${passStrength >= 4 ? 'text-wa-green' : passStrength >= 2 ? 'text-accent-orange' : 'text-accent-red'}`}>
                      {strengthLabels[passStrength]}
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-medium text-text-secondary mb-1.5 block">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input
                    type={showRegPass ? 'text' : 'password'}
                    value={regConfirmPass}
                    onChange={e => setRegConfirmPass(e.target.value)}
                    className={`w-full bg-bg-input border rounded-xl py-3 pl-10 pr-10 text-sm text-text-primary placeholder:text-text-muted focus:outline-none transition-all ${
                      regConfirmPass && regConfirmPass !== regPassword
                        ? 'border-accent-red/50 focus:border-accent-red/50 focus:ring-1 focus:ring-accent-red/20'
                        : regConfirmPass && regConfirmPass === regPassword
                        ? 'border-wa-green/50 focus:border-wa-green/50 focus:ring-1 focus:ring-wa-green/20'
                        : 'border-border focus:border-accent-blue/50 focus:ring-1 focus:ring-accent-blue/20'
                    }`}
                    placeholder="Confirm your password"
                    autoComplete="new-password"
                  />
                  {regConfirmPass && regConfirmPass === regPassword && (
                    <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-wa-green" />
                  )}
                </div>
              </div>

              {regError && (
                <div className="flex items-center gap-2 text-accent-red text-xs bg-accent-red/10 border border-accent-red/20 rounded-lg px-3 py-2.5 animate-fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {regError}
                </div>
              )}

              <button
                type="submit"
                disabled={regLoading || !regUsername || !regEmail || !regPassword || !regConfirmPass || !regDisplayName}
                className="w-full bg-gradient-to-r from-accent-blue to-accent-purple hover:from-accent-blue/90 hover:to-accent-purple/90 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-accent-blue/20 hover:shadow-accent-blue/30"
              >
                {regLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    Create Account
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-5 pt-5 border-t border-border text-center">
              <p className="text-text-muted text-xs">
                Already have an account?{' '}
                <button onClick={switchToLogin} className="text-accent-blue hover:underline font-medium">
                  Sign in instead
                </button>
              </p>
            </div>
          </div>
        )}

        {/* ─── REGISTER SUCCESS ─── */}
        {isRegisterPage && regSuccess && (
          <div className="glass-strong rounded-2xl p-8 text-center animate-slide-up">
            <div className="w-16 h-16 rounded-full bg-wa-green/20 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-wa-green" />
            </div>
            <h2 className="text-xl font-bold text-text-primary mb-2">Account Created!</h2>
            <p className="text-text-secondary text-sm">Welcome to EDWARD MD. Redirecting to pairing...</p>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-text-muted text-xs">
            EDWARD MD v3.0.0 • Powered by Baileys
          </p>
          <p className="text-text-muted text-[10px] mt-1">
            🔒 End-to-end encrypted • Your data stays local
          </p>
        </div>
      </div>
    </div>
  );
}
