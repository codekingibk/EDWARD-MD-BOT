const axios = require("axios");
const FormData = require('form-data');
const fs = require('fs');
const os = require('os');
const path = require("path");
const { cmd } = require("../command");

async function uploadToCatbox(buffer, extension) {
  const form = new FormData();
  form.append('fileToUpload', buffer, { filename: `image${extension}`, contentType: extension === '.png' ? 'image/png' : 'image/jpeg' });
  form.append('reqtype', 'fileupload');
  const res = await axios.post("https://catbox.moe/user/api.php", form, {
    headers: form.getHeaders(), timeout: 30000
  });
  if (!res.data || !res.data.startsWith('http')) throw new Error('Catbox upload failed');
  return res.data.trim();
}

async function removeBg(imageUrl) {
  const apis = [
    // Agatz.xyz rembg
    async () => {
      const { data } = await axios.get(`https://api.agatz.xyz/api/rembg?url=${encodeURIComponent(imageUrl)}`, {
        responseType: 'arraybuffer', timeout: 60000
      });
      if (data && data.byteLength > 1000) return Buffer.from(data);
      throw new Error('No data from agatz');
    },
    // Ryzendesu rmbg
    async () => {
      const { data } = await axios.get('https://api.ryzendesu.vip/api/tools/rmbg', {
        params: { url: imageUrl }, responseType: 'arraybuffer', timeout: 60000
      });
      if (data && data.byteLength > 1000) return Buffer.from(data);
      throw new Error('No data from ryzendesu');
    },
    // Pawan rmbg
    async () => {
      const { data } = await axios.get(`https://api.pawan.krd/removebg?url=${encodeURIComponent(imageUrl)}`, {
        responseType: 'arraybuffer', timeout: 60000
      });
      if (data && data.byteLength > 1000) return Buffer.from(data);
      throw new Error('No data from pawan');
    },
    // BK9 rmbg
    async () => {
      const { data } = await axios.get(`https://bk9.fun/api/removebg?url=${encodeURIComponent(imageUrl)}`, {
        responseType: 'arraybuffer', timeout: 60000
      });
      if (data && data.byteLength > 1000) return Buffer.from(data);
      throw new Error('No data from bk9');
    }
  ];

  for (const fn of apis) {
    try { return await fn(); } catch (e) { console.error('[rmbg] api error:', e.message); }
  }
  throw new Error('All remove-background APIs failed. Please try again later.');
}

cmd({
  pattern: "rmbg",
  alias: ["removebg"],
  react: '📸',
  desc: "Remove background from an image",
  category: "img_edit",
  use: ".rmbg [reply to image]",
  filename: __filename
}, async (conn, message, m, { reply }) => {
  try {
    const quotedMsg = message.quoted ? message.quoted : message;
    const mimeType = (quotedMsg.msg || quotedMsg).mimetype || '';

    if (!mimeType || !mimeType.startsWith('image/')) {
      return reply("📸 Please *reply to an image* to remove its background.\n\nSupports: JPEG, PNG");
    }

    await conn.sendMessage(m.chat, { react: { text: '⏳', key: message.key } });
    reply("⏳ Removing background, please wait...");

    const mediaBuffer = await quotedMsg.download();
    let extension = '.jpg';
    if (mimeType.includes('png')) extension = '.png';

    const imageUrl = await uploadToCatbox(mediaBuffer, extension);
    const resultBuffer = await removeBg(imageUrl);

    await conn.sendMessage(m.chat, {
      image: resultBuffer,
      caption: `✅ Background removed!\n\n> *EDWARD MD*`
    }, { quoted: message });

    await conn.sendMessage(m.chat, { react: { text: '✅', key: message.key } });
  } catch (error) {
    console.error("Rmbg Error:", error.message);
    await conn.sendMessage(m.chat, { react: { text: '❌', key: message.key } });
    reply(`❌ Failed to remove background: ${error.message}`);
  }
});
