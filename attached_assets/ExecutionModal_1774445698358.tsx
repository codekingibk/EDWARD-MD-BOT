import React from 'react';

export default function ExecutionModal({ open, onClose, title, result }: { open: boolean; onClose: () => void; title: string; result: any }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-bg-card rounded-xl p-4 w-full max-w-lg z-10">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">{title}</h3>
          <button onClick={onClose} className="text-text-muted">Close</button>
        </div>
        <div className="text-sm text-text-secondary max-h-80 overflow-auto">
          <pre className="whitespace-pre-wrap break-words">{JSON.stringify(result, null, 2)}</pre>
        </div>
        {result && result.url && (
          <div className="mt-3">
            <a href={result.url} target="_blank" rel="noreferrer" className="px-3 py-2 bg-wa-green/10 text-wa-green rounded-lg inline-block">Download</a>
          </div>
        )}
      </div>
    </div>
  );
}
