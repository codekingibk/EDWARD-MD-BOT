import React from 'react';
import { X, Download } from 'lucide-react';

export default function ExecutionModal({ open, onClose, title, result }: { open: boolean; onClose: () => void; title: string; result: any }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-bg-card border border-border rounded-2xl p-5 w-full max-w-lg z-10 animate-slide-up shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-text-primary text-sm">{title}</h3>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors"><X className="w-4 h-4" /></button>
        </div>
        <div className="text-sm text-text-secondary max-h-80 overflow-auto bg-bg-input rounded-xl p-4">
          <pre className="whitespace-pre-wrap break-words text-xs font-mono">{JSON.stringify(result, null, 2)}</pre>
        </div>
        {result && result.url && (
          <div className="mt-4 pt-4 border-t border-border">
            <a href={result.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2 bg-wa-green/10 border border-wa-green/20 text-wa-green text-sm font-medium rounded-xl hover:bg-wa-green/20 transition-colors w-fit">
              <Download className="w-4 h-4" />Download
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
