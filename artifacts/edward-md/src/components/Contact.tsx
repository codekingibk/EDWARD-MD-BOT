import { MessageCircle, Send, Mail, Phone, ExternalLink, Bot, Shield, Clock } from 'lucide-react';

export default function Contact() {
  return (
    <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
          <Mail className="w-5 h-5 text-wa-green" />Contact Admin
        </h2>
        <p className="text-sm text-text-muted mt-1">
          Need help with your bot, a premium key, or have questions? Reach out to the admin below.
        </p>
      </div>

      <div className="glass rounded-2xl p-6 border border-wa-green/10">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-wa-green to-wa-dark-green flex items-center justify-center">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="font-semibold text-text-primary">EDWARD MD Admin</p>
            <p className="text-xs text-text-muted">Bot owner & platform support</p>
          </div>
        </div>

        <div className="space-y-3">
          {/* WhatsApp */}
          <a
            href="https://wa.me/2347019706826"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 p-4 rounded-xl bg-[#25D366]/10 border border-[#25D366]/20 hover:bg-[#25D366]/20 transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-[#25D366] flex items-center justify-center shrink-0">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-text-primary">WhatsApp</p>
              <p className="text-xs text-text-muted mt-0.5">+234 701 970 6826</p>
            </div>
            <ExternalLink className="w-4 h-4 text-text-muted group-hover:text-[#25D366] transition-colors shrink-0" />
          </a>

          {/* Telegram */}
          <a
            href="https://t.me/IBUKUNHASBIGBALLS"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 p-4 rounded-xl bg-[#229ED9]/10 border border-[#229ED9]/20 hover:bg-[#229ED9]/20 transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-[#229ED9] flex items-center justify-center shrink-0">
              <Send className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-text-primary">Telegram</p>
              <p className="text-xs text-text-muted mt-0.5">@IBUKUNHASBIGBALLS</p>
            </div>
            <ExternalLink className="w-4 h-4 text-text-muted group-hover:text-[#229ED9] transition-colors shrink-0" />
          </a>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="glass rounded-xl p-4 border border-border">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-accent-orange" />
            <p className="text-sm font-semibold text-text-primary">Premium Keys</p>
          </div>
          <p className="text-xs text-text-muted">
            Contact the admin on WhatsApp or Telegram to purchase a premium key and unlock all bot features.
          </p>
        </div>

        <div className="glass rounded-xl p-4 border border-border">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-accent-blue" />
            <p className="text-sm font-semibold text-text-primary">Response Time</p>
          </div>
          <p className="text-xs text-text-muted">
            The admin typically responds within a few hours. WhatsApp is the fastest way to get support.
          </p>
        </div>
      </div>

      <div className="glass rounded-xl p-4 border border-border">
        <div className="flex items-start gap-3">
          <Phone className="w-4 h-4 text-wa-green mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-text-primary mb-1">What to include</p>
            <ul className="text-xs text-text-muted space-y-1 list-disc list-inside">
              <li>Your username or registered email</li>
              <li>A brief description of your issue or request</li>
              <li>Screenshots if reporting a bug</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
