import { useState, useEffect, useRef } from 'react';
import { useApp } from '../store';
import { QrCode, Phone, Smartphone, Wifi, RefreshCw, Copy, Check, AlertCircle, Bot, ChevronRight, Zap } from 'lucide-react';

export default function Pairing() {
  const { connectionMethod, setConnectionMethod, isConnected, setIsConnected, phoneNumber, setPhoneNumber, pairingCode, setPairingCode, addLog, botConfig, qrCode, setQrCode } = useApp();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [step, setStep] = useState<'choose' | 'connect'>('choose');
  const qrRef = useRef<HTMLDivElement>(null);

  const handleQRConnect = async () => {
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/connect/qr', { method: 'POST' });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || 'Failed to start QR'); }
      addLog('info', 'QR code request sent', 'Pairing');
      setStep('connect');
    } catch (e: any) {
      setError(e.message || 'Connection error');
      addLog('error', `QR connection failed: ${e.message}`, 'Pairing');
    } finally { setLoading(false); }
  };

  const handleCodeConnect = async () => {
    if (!phoneNumber) { setError('Please enter your phone number'); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/connect/code', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ phone: phoneNumber }) });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || 'Failed to get code'); }
      addLog('info', `Pairing code requested for ${phoneNumber}`, 'Pairing');
      setStep('connect');
    } catch (e: any) {
      setError(e.message || 'Connection error');
      addLog('error', `Code pairing failed: ${e.message}`, 'Pairing');
    } finally { setLoading(false); }
  };

  const handleSimulateConnect = () => {
    setIsConnected(true);
    addLog('success', 'WhatsApp session connected (simulated)', 'Pairing');
  };

  const copyCode = () => {
    navigator.clipboard.writeText(pairingCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-primary relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-wa-green/5 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-blue/5 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative z-10 w-full max-w-lg px-6 animate-slide-up">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-wa-green to-wa-dark-green mb-4 shadow-lg shadow-wa-green/20">
            <Bot className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary">Connect WhatsApp</h1>
          <p className="text-text-muted mt-2 text-sm">Link your WhatsApp account to {botConfig.botName}</p>
        </div>

        {step === 'choose' && (
          <div className="space-y-4">
            <div className="glass-strong rounded-2xl p-6">
              <h3 className="text-sm font-semibold text-text-primary mb-4 text-center">Choose Connection Method</h3>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => { setConnectionMethod('qr'); handleQRConnect(); }}
                  className={`flex flex-col items-center gap-3 p-5 rounded-xl border-2 transition-all ${connectionMethod === 'qr' ? 'border-wa-green/50 bg-wa-green/10' : 'border-border hover:border-wa-green/30 hover:bg-bg-card'}`}>
                  <QrCode className="w-10 h-10 text-wa-green" />
                  <div className="text-center">
                    <p className="text-sm font-semibold text-text-primary">QR Code</p>
                    <p className="text-[10px] text-text-muted mt-0.5">Scan with WhatsApp</p>
                  </div>
                </button>
                <button onClick={() => { setConnectionMethod('code'); }}
                  className={`flex flex-col items-center gap-3 p-5 rounded-xl border-2 transition-all ${connectionMethod === 'code' ? 'border-accent-blue/50 bg-accent-blue/10' : 'border-border hover:border-accent-blue/30 hover:bg-bg-card'}`}>
                  <Phone className="w-10 h-10 text-accent-blue" />
                  <div className="text-center">
                    <p className="text-sm font-semibold text-text-primary">Pairing Code</p>
                    <p className="text-[10px] text-text-muted mt-0.5">Enter phone number</p>
                  </div>
                </button>
              </div>

              {connectionMethod === 'code' && (
                <div className="mt-4 space-y-3 animate-fade-in">
                  <div>
                    <label className="text-xs font-medium text-text-secondary mb-1.5 block">WhatsApp Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                      <input type="tel" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} className="w-full bg-bg-input border border-border rounded-xl py-3 pl-10 pr-4 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-blue/50 focus:ring-1 focus:ring-accent-blue/20 transition-all" placeholder="+1234567890" />
                    </div>
                  </div>
                  <button onClick={handleCodeConnect} disabled={loading || !phoneNumber} className="w-full bg-gradient-to-r from-accent-blue to-accent-purple hover:opacity-90 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50">
                    {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Zap className="w-4 h-4" />Get Pairing Code<ChevronRight className="w-4 h-4" /></>}
                  </button>
                </div>
              )}

              {error && (
                <div className="mt-4 flex items-center gap-2 text-accent-red text-xs bg-accent-red/10 border border-accent-red/20 rounded-lg px-3 py-2.5 animate-fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0" />{error}
                </div>
              )}
            </div>

            <div className="glass rounded-2xl p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-accent-orange shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-text-primary">Backend Required</p>
                  <p className="text-[10px] text-text-muted mt-1">The actual WhatsApp connection needs the bot backend running. You can simulate the connection below for UI testing.</p>
                </div>
              </div>
              <button onClick={handleSimulateConnect} className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2 bg-wa-green/10 border border-wa-green/20 text-wa-green text-xs font-medium rounded-lg hover:bg-wa-green/20 transition-colors">
                <Wifi className="w-3.5 h-3.5" />Simulate WhatsApp Connected
              </button>
            </div>
          </div>
        )}

        {step === 'connect' && (
          <div className="glass-strong rounded-2xl p-6 animate-fade-in">
            {connectionMethod === 'qr' && (
              <div className="text-center">
                <h3 className="text-sm font-semibold text-text-primary mb-4">Scan QR Code</h3>
                <div ref={qrRef} className="w-48 h-48 mx-auto rounded-xl bg-white p-3 flex items-center justify-center">
                  {qrCode ? (
                    <img src={qrCode} alt="QR Code" className="w-full h-full" />
                  ) : (
                    <div className="text-center">
                      <QrCode className="w-24 h-24 text-bg-card mx-auto" />
                      <p className="text-[10px] text-bg-secondary mt-2">Waiting for QR...</p>
                    </div>
                  )}
                </div>
                <p className="text-xs text-text-muted mt-4">Open WhatsApp → Linked Devices → Link a Device</p>
                <div className="flex gap-2 mt-4">
                  <button onClick={() => setStep('choose')} className="flex-1 px-4 py-2 glass rounded-lg text-text-secondary text-xs hover:text-text-primary transition-colors">Back</button>
                  <button onClick={handleQRConnect} className="flex-1 flex items-center justify-center gap-1 px-4 py-2 bg-wa-green/10 border border-wa-green/20 text-wa-green text-xs rounded-lg hover:bg-wa-green/20 transition-colors">
                    <RefreshCw className="w-3 h-3" />Refresh QR
                  </button>
                </div>
              </div>
            )}

            {connectionMethod === 'code' && (
              <div className="text-center">
                <h3 className="text-sm font-semibold text-text-primary mb-4">Enter Pairing Code</h3>
                <Smartphone className="w-16 h-16 text-accent-blue mx-auto mb-4" />
                {pairingCode ? (
                  <>
                    <div className="bg-bg-input rounded-xl p-4 mb-4">
                      <p className="text-3xl font-mono font-bold tracking-[0.3em] text-text-primary">{pairingCode}</p>
                    </div>
                    <button onClick={copyCode} className="flex items-center gap-1.5 mx-auto px-4 py-2 bg-accent-blue/10 border border-accent-blue/20 text-accent-blue text-xs rounded-lg hover:bg-accent-blue/20 transition-colors">
                      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      {copied ? 'Copied!' : 'Copy Code'}
                    </button>
                  </>
                ) : (
                  <div className="bg-bg-input rounded-xl p-6 mb-4">
                    <div className="w-8 h-8 border-2 border-accent-blue/30 border-t-accent-blue rounded-full animate-spin mx-auto" />
                    <p className="text-xs text-text-muted mt-3">Waiting for pairing code...</p>
                  </div>
                )}
                <p className="text-xs text-text-muted mt-4">Open WhatsApp → Settings → Linked Devices → Link a Device → enter this code</p>
                <button onClick={() => setStep('choose')} className="mt-4 px-4 py-2 glass rounded-lg text-text-secondary text-xs hover:text-text-primary transition-colors">Back</button>
              </div>
            )}

            <div className="mt-4 pt-4 border-t border-border">
              <button onClick={handleSimulateConnect} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-wa-green/10 border border-wa-green/20 text-wa-green text-xs font-medium rounded-lg hover:bg-wa-green/20 transition-colors">
                <Wifi className="w-3.5 h-3.5" />Simulate Connected (Testing)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
