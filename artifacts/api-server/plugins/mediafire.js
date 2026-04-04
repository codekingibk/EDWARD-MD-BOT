import axios from 'axios';

async function downloadMediaFire(url) {
  const apis = [
    async () => {
      const { data } = await axios.get('https://api.maher-zubair.tech/download/mediafire', {
        params: { url },
        timeout: 30000
      });
      if (data?.status && data?.result) {
        return { link: data.result.dl_url || data.result.download_url, name: data.result.filename || data.result.name, size: data.result.size };
      }
      throw new Error('No download link');
    },
    async () => {
      const { data } = await axios.get(`https://api-aswin-sparky.koyeb.app/api/downloader/mediafire?url=${encodeURIComponent(url)}`, {
        timeout: 30000
      });
      if (data?.status && data?.data?.download_url) {
        return { link: data.data.download_url, name: data.data.filename || 'file', size: data.data.size };
      }
      throw new Error('No download link');
    },
    async () => {
      const { data } = await axios.get(`https://bk9.fun/download/mediafire?url=${encodeURIComponent(url)}`, {
        timeout: 30000
      });
      if (data?.status && data?.BK9?.dl_link) {
        return { link: data.BK9.dl_link, name: data.BK9.filename || 'file', size: data.BK9.size };
      }
      throw new Error('No download link');
    }
  ];

  for (const apiFn of apis) {
    try {
      return await apiFn();
    } catch {}
  }
  throw new Error('All MediaFire APIs failed. The file may be unavailable or private.');
}

export default {
  command: 'mediafire',
  aliases: ['mf', 'mfdl'],
  category: 'downloader',
  description: 'Download file from MediaFire',
  usage: '.mediafire <MediaFire URL>',
  async handler(sock, message, args, context) {
    const { chatId } = context;
    const url = args[0]?.trim();
    if (!url || !url.includes('mediafire.com')) {
      return sock.sendMessage(chatId, {
        text: '📂 *MediaFire Downloader*\n\nUsage: `.mediafire <MediaFire URL>`\n\nExample:\n• `.mediafire https://www.mediafire.com/file/...`\n\n_Generates a direct download link for any MediaFire file_'
      }, { quoted: message });
    }

    try {
      await sock.sendMessage(chatId, { react: { text: '⏳', key: message.key } });
      await sock.sendMessage(chatId, { text: '⏳ Fetching MediaFire download link...' }, { quoted: message });

      const result = await downloadMediaFire(url);

      const sizeText = result.size ? `\n📦 Size: ${result.size}` : '';
      await sock.sendMessage(chatId, {
        text: `📂 *MediaFire Download Ready*\n\n📄 File: *${result.name}*${sizeText}\n🔗 Link: ${result.link}\n\n_Click the link above to download your file_\n\n📥 Downloaded by *EDWARD MD*`
      }, { quoted: message });

      await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });
    } catch (err) {
      console.error('[mediafire] Error:', err.message);
      await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
      await sock.sendMessage(chatId, {
        text: `❌ *MediaFire Download Failed*\n\nReason: ${err.message || 'Unknown error'}\n\nMake sure the link is valid and the file is public.`
      }, { quoted: message });
    }
  }
};
