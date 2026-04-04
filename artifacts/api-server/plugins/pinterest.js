import axios from 'axios';

async function downloadPinterest(url) {
  const apis = [
    async () => {
      const { data } = await axios.get('https://api.maher-zubair.tech/download/pinterest', {
        params: { url },
        timeout: 30000
      });
      if (data?.status && data?.result) return data.result;
      throw new Error('No result');
    },
    async () => {
      const { data } = await axios.get(`https://api-aswin-sparky.koyeb.app/api/downloader/pinterest?url=${encodeURIComponent(url)}`, {
        timeout: 30000
      });
      if (data?.status && data?.data) return { video: data.data.video_url, image: data.data.image_url, title: data.data.title };
      throw new Error('No result');
    },
    async () => {
      const { data } = await axios.get(`https://bk9.fun/download/pinterest?url=${encodeURIComponent(url)}`, {
        timeout: 30000
      });
      if (data?.status && data?.BK9) return { video: data.BK9.video, image: data.BK9.image, title: data.BK9.title };
      throw new Error('No result');
    }
  ];
  for (const fn of apis) {
    try { return await fn(); } catch {}
  }
  throw new Error('All Pinterest APIs failed. The pin may be private or unavailable.');
}

export default {
  command: 'pinterest',
  aliases: ['pin', 'pdl', 'pintdl'],
  category: 'downloader',
  description: 'Download image or video from Pinterest',
  usage: '.pinterest <Pinterest URL>',
  async handler(sock, message, args, context) {
    const { chatId } = context;
    const url = args[0]?.trim();
    if (!url || !url.includes('pinterest')) {
      return sock.sendMessage(chatId, {
        text: '📌 *Pinterest Downloader*\n\nUsage: `.pin <Pinterest URL>`\n\nExamples:\n• `.pin https://pinterest.com/pin/...`\n• `.pin https://pin.it/...`\n\n_Downloads images and videos from Pinterest without watermark_'
      }, { quoted: message });
    }

    try {
      await sock.sendMessage(chatId, { react: { text: '⏳', key: message.key } });
      await sock.sendMessage(chatId, { text: '⏳ Fetching Pinterest content...' }, { quoted: message });

      const result = await downloadPinterest(url);
      const title = result.title || 'Pinterest';

      if (result.video) {
        await sock.sendMessage(chatId, {
          video: { url: result.video },
          caption: `📌 *${title}*\n\n📥 Downloaded by *EDWARD MD*`,
          mimetype: 'video/mp4'
        }, { quoted: message });
      } else if (result.image) {
        await sock.sendMessage(chatId, {
          image: { url: result.image },
          caption: `📌 *${title}*\n\n📥 Downloaded by *EDWARD MD*`
        }, { quoted: message });
      } else {
        await sock.sendMessage(chatId, { text: '❌ No downloadable content found on that Pinterest pin.' }, { quoted: message });
        return;
      }

      await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });
    } catch (err) {
      console.error('[pinterest] Error:', err.message);
      await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
      await sock.sendMessage(chatId, {
        text: `❌ *Pinterest Download Failed*\n\n${err.message || 'Unknown error'}`
      }, { quoted: message });
    }
  }
};
