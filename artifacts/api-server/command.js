// EDWARD MD: cmd() compatibility shim (ES module)
// Plugins calling: const { cmd } = require('../command')
// work in Node.js 24 via require(esm) support.

const _pending = [];

export function cmd(meta, handler) {
  if (typeof meta !== 'object' || typeof handler !== 'function') return;
  _pending.push({ meta, handler });
}

export function drainRegistry() {
  return _pending.splice(0);
}

export const commands = _pending;
