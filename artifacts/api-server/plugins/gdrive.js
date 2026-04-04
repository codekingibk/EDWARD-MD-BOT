import axios from 'axios';

function extractGDriveId(url) {
  const patterns = [
    /\/file\/d\/([a-zA-Z0-9_-]+)/,
    /id=([a-zA-Z0-9_-]+)/,
    /\/open\?id=([a-zA-Z0-9_-]+)/
  ];
  for (const pat of patterns) {
    const match = url.match(pat);
    if (match) return match[1];
  }
  return null;
}

async function getGDriveInfo(fileId) {
  const apis = [
    async () => {
      const { data } = await axios.get('https://api.maher-zubair.tech/download/gdrive', {
        params: { id: fileId },
        timeout: 30000
      });
      if (data?.status && data?.result) return data.result;
      throw new Error('No result');
    },
    async () => {
      const { data } = await axios.get(`https://api-aswin-sparky.koyeb.app/api/downloader/gdrive?id=${fileId}`, {
        timeout: 30000
      });
      if (data?.status && data?.data) return { dl_url: data.data.download_url, name: data.data.name, size: data.data.size };
      throw new Error('No result');
    }
  ];
  for (const fn of apis) {
    try { return await fn(); } catch {}
  }
  const directUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
  return { dl_url: directUrl, name: 'Google Drive File', size: 'Unknown' };
}

export default {
  command: 'gdrive',
  aliases: ['gdl', 'googledrive', 'gdowned'],
  category: 'downloader',
  description: 'Download file from Google Drive',
  usage: '.gdrive <Google Drive URL>',
  async handler(sock, message, args, context) {
    const { chatId } = context;
    const url = args[0]?.trim();
    if (!url || !url.includes('drive.google.com')) {
      return sock.sendMessage(chatId, {
        text: '📂 *Google Drive Downloader*\n\nUsage: `.gdrive <Google Drive URL>`\n\nExample:\n• `.gdrive https://drive.google.com/file/d/...`\n\n_File must be shared publicly or with "anyone with link"_'
      }, { quoted: message });
    }

    try {
      await sock.sendMessage(chatId, { react: { text: '⏳', key: message.key } });

      const fileId = extractGDriveId(url);
      if (!fileId) {
        return sock.sendMessage(chatId, { text: '❌ Could not extract file ID from that Google Drive URL.' }, { quoted: message });
      }

      await sock.sendMessage(chatId, { text: '⏳ Fetching Google Drive file info...' }, { quoted: message });
      const result = await getGDriveInfo(fileId);

      const dlUrl = result.dl_url || result.download_url;
      const name = result.name || result.filename || 'Google Drive File';
      const size = result.size || 'Unknown';

      await sock.sendMessage(chatId, {
        text: `📂 *Google Drive Download*\n\n📄 File: *${name}*\n📦 Size: ${size}\n🔗 Link: ${dlUrl}\n\n_Click the link above to download_\n\n📥 _EDWARD MD_`
      }, { quoted: message });

      await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });
    } catch (err) {
      console.error('[gdrive] Error:', err.message);
      await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
      await sock.sendMessage(chatId, {
        text: `❌ *Google Drive Download Failed*\n\n${err.message || 'Unknown error'}\n\nMake sure the file is shared publicly.`
      }, { quoted: message });
    }
  }
};
