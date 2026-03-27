'use strict';

// ── EDWARD MD: cmd() compatibility shim ──────────────────────────────────────
// New-style plugins call:  const { cmd } = require('../command')
// This shim captures their registrations so our plugin loader can pick them up.

const _pending = [];

function cmd(meta, handler) {
  if (typeof meta !== 'object' || typeof handler !== 'function') return;
  _pending.push({ meta, handler });
}

/** Drain and return all commands registered since the last drain. */
function drainRegistry() {
  return _pending.splice(0);
}

module.exports = { cmd, commands: _pending, drainRegistry };
