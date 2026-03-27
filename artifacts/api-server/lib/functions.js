// EDWARD MD: utility shim for plugins that require('../lib/functions')
// Named ES module exports so require(esm) returns namespace properties directly.

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const getBuffer = async (url, options = {}) => {
  const { default: axios } = await import('axios');
  const res = await axios.get(url, { responseType: 'arraybuffer', ...options });
  return Buffer.from(res.data);
};

export const fetchJson = async (url, options = {}) => {
  const { default: axios } = await import('axios');
  const res = await axios.get(url, options);
  return res.data;
};

export const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

export const isUrl = (url) => {
  try { new URL(url); return true; } catch { return false; }
};

export const Json = (obj) => JSON.stringify(obj, null, 2);

export const h2k = (v) => {
  if (v >= 1000000) return (v / 1000000).toFixed(1) + 'M';
  if (v >= 1000) return (v / 1000).toFixed(1) + 'K';
  return String(v);
};

export const runtime = (seconds) => {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${d}d ${h}h ${m}m ${s}s`;
};

export const getGroupAdmins = (participants) => {
  const admins = [];
  for (const participant of participants) {
    if (participant.admin === 'admin' || participant.admin === 'superadmin') {
      admins.push(participant.id);
    }
  }
  return admins;
};
