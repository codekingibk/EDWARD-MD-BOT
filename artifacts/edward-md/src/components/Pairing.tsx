import { useState, useEffect, useRef } from 'react';
import { useApp } from '../store';
import {
  QrCode, Phone, Smartphone, Wifi, RefreshCw, Copy, Check,
  AlertCircle, Bot, ChevronRight, Zap, ArrowLeft, Clock,
  CheckCircle2, Circle
} from 'lucide-react';

export default function Pairing() {
  const {
    connectionMethod, setConnectionMethod,
    phoneNumber, setPhoneNumber,
    pairingCode, setPairingCode,
    qrCode, setQrCode,
    addLog, botConfig,
  } = useApp();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [step, setStep] = useState<'choose' | 'connect' | 'failed'>('choose');
  const [secondsLeft, setSecondsLeft] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Listen for session cleared event from backend
  useEffect(() => {
    const onSessionCleared = () => {
      if (step === 'connect') {
        setStep('failed');
        setError('Connection timed out or was rejected by WhatsApp. Click "Try Again" to start fresh.');
      }
    };
    // Re-use socket already in store — listen to Socket events via document events
    window.addEventListener('wa-session-cleared', onSessionCleared);
    return () => window.removeEventListener('wa-session-cleared', onSessionCleared);
  }, [step]);

  // Countdown timer for pairing code
  useEffect(() => {
    if (step === 'connect' && connectionMethod === 'code' && pairingCode) {
      setSecondsLeft(90);
      timerRef.current = setInterval(() => {
        setSecondsLeft(s => {
          if (s <= 1) {
            clearInterval(timerRef.current!);
            return 0;
          }
          return s - 1;
        });
      }, 1000);
      return () => clearInterval(timerRef.current!);
    }
  }, [pairingCode, step, connectionMethod]);

  const resetState = async () => {
    clearInterval(timerRef.current!);
    setLoading(true);
    setError('');
    setPairingCode('');
    setQrCode('');
    try {
      await fetch('/api/reset', { method: 'POST' });
    } catch {}
    setStep('choose');
    setConnectionMethod(null);
    setLoading(false);
  };

  const handleQRConnect = async () => {
    setLoading(true); setError(''); setQrCode('');
    try {
      const res = await fetch('/api/connect/qr', { method: 'POST' });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || 'Failed to start QR'); }
      addLog('info', 'QR code connection started', 'Pairing');
      setStep('connect');
    } catch (e: any) {
      setError(e.message || 'Connection error');
    } finally { setLoading(false); }
  };

  const handleCodeConnect = async () => {
    if (!phoneNumber) { setError('Please enter your phone number with country code'); return; }
    const clean = phoneNumber.replace(/[^0-9]/g, '');
    if (clean.length < 7) { setError('Enter a valid phone number including country code (e.g. 2347012345678)'); return; }
    setLoading(true); setError(''); setPairingCode('');
    try {
      const res = await fetch('/api/connect/code', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ phone: clean }),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || 'Failed to get code'); }
      addLog('info', `Pairing code requested for +${clean}`, 'Pairing');
      setStep('connect');
    } catch (e: any) {
      setError(e.message || 'Connection error');
    } finally { setLoading(false); }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(pairingCode.replace('-', ''));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const codeExpired = secondsLeft === 0 && pairingCode && step === 'connect' && connectionMethod === 'code';

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-primary relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-wa-green/5 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-blue/5 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative z-10 w-full max-w-lg px-4 py-8 animate-slide-up">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-wa-green to-wa-dark-green mb-4 shadow-lg shadow-wa-green/20">
            <Bot className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary">Connect WhatsApp</h1>
          <p className="text-text-muted mt-1 text-sm">Link your WhatsApp account to {botConfig.botName}</p>
        </div>

        {/* CHOOSE METHOD */}
        {step === 'choose' && (
          <div className="space-y-4">
            <div className="glass-strong rounded-2xl p-5">
              <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-4 text-center">Choose Connection Method</h3>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <button
                  onClick={() => { setConnectionMethod('qr'); handleQRConnect(); }}
                  disabled={loading}
                  className="flex flex-col items-center gap-3 p-5 rounded-xl border-2 border-border hover:border-wa-green/40 hover:bg-wa-green/5 transition-all disabled:opacity-50"
                >
                  <QrCode className="w-10 h-10 text-wa-green" />
                  <div className="text-center">
                    <p className="text-sm font-semibold text-text-primary">QR Code</p>
                    <p className="text-[10px] text-text-muted mt-0.5">Scan with camera</p>
                  </div>
                </button>
                <button
                  onClick={() => setConnectionMethod('code')}
                  disabled={loading}
                  className={`flex flex-col items-center gap-3 p-5 rounded-xl border-2 transition-all disabled:opacity-50 ${connectionMethod === 'code' ? 'border-accent-blue/50 bg-accent-blue/10' : 'border-border hover:border-accent-blue/40 hover:bg-accent-blue/5'}`}
                >
                  <Phone className="w-10 h-10 text-accent-blue" />
                  <div className="text-center">
                    <p className="text-sm font-semibold text-text-primary">Pairing Code</p>
                    <p className="text-[10px] text-text-muted mt-0.5">Use phone number</p>
                  </div>
                </button>
              </div>

              {connectionMethod === 'code' && (
                <div className="space-y-3 animate-fade-in border-t border-border pt-4">
                  <div>
                    <label className="text-xs font-medium text-text-secondary mb-1.5 block">
                      WhatsApp Number (with country code, no + or spaces)
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={e => setPhoneNumber(e.target.value)}
                        className="w-full bg-bg-input border border-border rounded-xl py-3 pl-10 pr-4 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-blue/50 focus:ring-1 focus:ring-accent-blue/20 transition-all"
                        placeholder="e.g. 2347012345678"
                      />
                    </div>
                    <p className="text-[10px] text-text-muted mt-1">Country code + number, digits only. Example: 234 (Nigeria) + 7012345678</p>
                  </div>
                  <button
                    onClick={handleCodeConnect}
                    disabled={loading || !phoneNumber}
                    className="w-full bg-gradient-to-r from-accent-blue to-accent-purple hover:opacity-90 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  >
                    {loading
                      ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      : <><Zap className="w-4 h-4" />Get Pairing Code<ChevronRight className="w-4 h-4" /></>}
                  </button>
                </div>
              )}

              {error && (
                <div className="mt-3 flex items-center gap-2 text-accent-red text-xs bg-accent-red/10 border border-accent-red/20 rounded-lg px-3 py-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />{error}
                </div>
              )}
            </div>

            <div className="glass rounded-2xl p-3.5 flex items-start gap-2.5">
              <Wifi className="w-4 h-4 text-wa-green shrink-0 mt-0.5" />
              <p className="text-[10px] text-text-muted leading-relaxed">
                EDWARD MD connects directly to WhatsApp via Baileys. Your session is stored locally on this server. No data is shared externally.
              </p>
            </div>
          </div>
        )}

        {/* CONNECT STEP */}
        {step === 'connect' && (
          <div className="space-y-3">
            {/* QR Code */}
            {connectionMethod === 'qr' && (
              <div className="glass-strong rounded-2xl p-5">
                <div className="text-center mb-4">
                  <h3 className="text-sm font-semibold text-text-primary">Scan QR Code</h3>
                  <p className="text-[10px] text-text-muted mt-1">QR refreshes every 20 seconds — scan quickly</p>
                </div>
                <div className="w-52 h-52 mx-auto rounded-xl bg-white p-2 flex items-center justify-center mb-4">
                  {qrCode
                    ? <img src={qrCode} alt="QR Code" className="w-full h-full object-contain" />
                    : (
                      <div className="text-center">
                        <div className="w-8 h-8 border-2 border-bg-card/50 border-t-bg-secondary rounded-full animate-spin mx-auto mb-2" />
                        <p className="text-[10px] text-bg-secondary">Generating QR...</p>
                      </div>
                    )}
                </div>

                {/* Steps */}
                <div className="space-y-2 mb-4">
                  {[
                    'Open WhatsApp on your phone',
                    'Tap ⋮ (menu) → Linked Devices',
                    'Tap "Link a Device"',
                    'Point camera at QR code above',
                  ].map((s, i) => (
                    <div key={i} className="flex items-center gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-wa-green/20 text-wa-green text-[10px] font-bold flex items-center justify-center shrink-0">{i + 1}</div>
                      <p className="text-xs text-text-secondary">{s}</p>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <button onClick={resetState} className="flex-1 flex items-center justify-center gap-1 px-3 py-2 glass rounded-lg text-text-secondary text-xs hover:text-text-primary transition-colors">
                    <ArrowLeft className="w-3 h-3" />Back
                  </button>
                  <button onClick={handleQRConnect} disabled={loading} className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-wa-green/10 border border-wa-green/20 text-wa-green text-xs rounded-lg hover:bg-wa-green/20 transition-colors disabled:opacity-50">
                    <RefreshCw className="w-3 h-3" />New QR
                  </button>
                </div>
              </div>
            )}

            {/* Pairing Code */}
            {connectionMethod === 'code' && (
              <div className="glass-strong rounded-2xl p-5">
                <div className="text-center mb-4">
                  <h3 className="text-sm font-semibold text-text-primary">Enter This Code in WhatsApp</h3>
                  {pairingCode && secondsLeft > 0 && (
                    <div className="flex items-center justify-center gap-1 mt-1">
                      <Clock className="w-3 h-3 text-accent-orange" />
                      <p className="text-[10px] text-accent-orange font-medium">Expires in {secondsLeft}s</p>
                    </div>
                  )}
                </div>

                {pairingCode ? (
                  codeExpired ? (
                    <div className="text-center mb-4">
                      <div className="bg-accent-red/10 border border-accent-red/20 rounded-xl p-4 mb-3">
                        <AlertCircle className="w-8 h-8 text-accent-red mx-auto mb-2" />
                        <p className="text-xs font-semibold text-accent-red">Code Expired</p>
                        <p className="text-[10px] text-text-muted mt-1">Pairing codes are valid for ~90 seconds</p>
                      </div>
                    </div>
                  ) : (
                    <div className="mb-4">
                      <div className="bg-bg-input rounded-xl p-4 text-center mb-3">
                        <p className="text-4xl font-mono font-bold tracking-[0.25em] text-text-primary select-all">{pairingCode}</p>
                      </div>
                      <button onClick={copyCode} className="w-full flex items-center justify-center gap-1.5 px-4 py-2 bg-accent-blue/10 border border-accent-blue/20 text-accent-blue text-xs rounded-lg hover:bg-accent-blue/20 transition-colors">
                        {copied ? <><Check className="w-3.5 h-3.5" />Copied!</> : <><Copy className="w-3.5 h-3.5" />Copy Code</>}
                      </button>
                    </div>
                  )
                ) : (
                  <div className="bg-bg-input rounded-xl p-6 mb-4 text-center">
                    <div className="w-8 h-8 border-2 border-accent-blue/30 border-t-accent-blue rounded-full animate-spin mx-auto mb-2" />
                    <p className="text-xs text-text-muted">Requesting code from WhatsApp...</p>
                    <p className="text-[10px] text-text-muted mt-1">This takes about 3 seconds</p>
                  </div>
                )}

                {/* Step-by-step instructions */}
                <div className="border border-border/50 rounded-xl p-3.5 mb-4">
                  <p className="text-[10px] font-semibold text-text-secondary uppercase tracking-wider mb-2.5">How to link — follow exactly:</p>
                  <div className="space-y-2">
                    {[
                      { text: 'Open WhatsApp on your phone', done: true },
                      { text: 'Tap ⋮ menu → Linked Devices', done: true },
                      { text: 'Tap "Link a Device"', done: true },
                      { text: 'Tap "Link with phone number" (NOT the camera)', done: true },
                      { text: 'Enter the 8-character code shown above', done: false },
                      { text: 'Tap "Link" — done!', done: false },
                    ].map((s, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <div className="w-4 h-4 rounded-full bg-bg-card border border-border flex items-center justify-center shrink-0 mt-0.5">
                          <span className="text-[8px] font-bold text-text-muted">{i + 1}</span>
                        </div>
                        <p className={`text-[11px] leading-relaxed ${i >= 4 ? 'text-text-primary font-medium' : 'text-text-secondary'}`}>{s.text}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button onClick={resetState} disabled={loading} className="flex-1 flex items-center justify-center gap-1 px-3 py-2 glass rounded-lg text-text-secondary text-xs hover:text-text-primary transition-colors disabled:opacity-50">
                    <ArrowLeft className="w-3 h-3" />Back
                  </button>
                  {(codeExpired || !pairingCode) && (
                    <button
                      onClick={async () => { await resetState(); setTimeout(() => { setConnectionMethod('code'); handleCodeConnect(); }, 100); }}
                      disabled={loading}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-accent-blue/10 border border-accent-blue/20 text-accent-blue text-xs rounded-lg hover:bg-accent-blue/20 transition-colors disabled:opacity-50"
                    >
                      <RefreshCw className="w-3 h-3" />Try Again
                    </button>
                  )}
                </div>
              </div>
            )}

            <div className="glass rounded-2xl p-3 text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <div className="w-1.5 h-1.5 bg-wa-green rounded-full animate-pulse" />
                <div className="w-1.5 h-1.5 bg-wa-green rounded-full animate-pulse" style={{ animationDelay: '0.3s' }} />
                <div className="w-1.5 h-1.5 bg-wa-green rounded-full animate-pulse" style={{ animationDelay: '0.6s' }} />
              </div>
              <p className="text-[10px] text-text-muted">Waiting for WhatsApp confirmation...</p>
            </div>
          </div>
        )}

        {/* FAILED STATE */}
        {step === 'failed' && (
          <div className="glass-strong rounded-2xl p-6 text-center">
            <AlertCircle className="w-12 h-12 text-accent-red mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-text-primary mb-2">Connection Failed</h3>
            <p className="text-xs text-text-muted mb-5">{error || 'The connection was rejected or timed out. The session has been cleared.'}</p>
            <button
              onClick={resetState}
              disabled={loading}
              className="w-full bg-gradient-to-r from-wa-green to-wa-dark-green text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-50"
            >
              {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><RefreshCw className="w-4 h-4" />Try Again</>}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
