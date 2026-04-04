import axios from 'axios';

async function downloadThreads(url) {
  const apis = [
    async () => {
      const { data } = await axios.get('https://api.maher-zubair.tech/download/threads', {
        params: { url },
        timeout: 30000
      });
      if (data?.status && data?.result) return data.result;
      throw new Error('No result');
    },
    async () => {
      const { data } = await axios.get(`https://api-aswin-sparky.koyeb.app/api/downloader/threads?url=${encodeURIComponent(url)}`, {
        timeout: 30000
      });
      if (data?.status && data?.data) return { video: data.data.video_url, image: data.data.image_url };
      throw new Error('No result');
    },
    async () => {
      const { data } = await axios.get(`https://bk9.fun/download/threads?url=${encodeURIComponent(url)}`, {
        timeout: 30000
      });
      if (data?.status && data?.BK9) return { video: data.BK9.video, image: data.BK9.image };
      throw new Error('No result');
    }
  ];
  for (const fn of apis) {
    try { return await fn(); } catch {}
  }
  throw new Error('All Threads download APIs failed');
}

async function downloadLikee(url) {
  const apis = [
    async () => {
      const { data } = await axios.get('https://api.maher-zubair.tech/download/likee', {
        params: { url },
        timeout: 30000
      });
      if (data?.status && data?.result) return data.result;
      throw new Error('No result');
    },
    async () => {
      const { data } = await axios.get(`https://api-aswin-sparky.koyeb.app/api/downloader/likee?url=${encodeURIComponent(url)}`, {
        timeout: 30000
      });
      if (data?.status && data?.data) return { video: data.data.video_url, title: data.data.title };
      throw new Error('No result');
    }
  ];
  for (const fn of apis) {
    try { return await fn(); } catch {}
  }
  throw new Error('All Likee download APIs failed');
}

export default [
  {
    command: 'threads',
    aliases: ['threadsdl', 'threadsdownload'],
    category: 'downloader',
    description: 'Download video from Threads (Meta)',
    usage: '.threads <Threads URL>',
    async handler(sock, message, args, context) {
      const { chatId } = context;
      const url = args[0]?.trim();
      if (!url || !url.includes('threads.net')) {
        return sock.sendMessage(chatId, {
          text: '🧵 *Threads Downloader*\n\nUsage: `.threads <Threads URL>`\n\nExample:\n• `.threads https://www.threads.net/@user/post/...`\n\n_Downloads videos and images from Threads posts_'
        }, { quoted: message });
      }
      try {
        await sock.sendMessage(chatId, { react: { text: '⏳', key: message.key } });
        await sock.sendMessage(chatId, { text: '⏳ Fetching Threads content...' }, { quoted: message });
        const result = await downloadThreads(url);
        if (result.video) {
          await sock.sendMessage(chatId, {
            video: { url: result.video },
            caption: `🧵 Downloaded from Threads\n\n📥 *EDWARD MD*`,
            mimetype: 'video/mp4'
          }, { quoted: message });
        } else if (result.image) {
          await sock.sendMessage(chatId, {
            image: { url: result.image },
            caption: `🧵 Downloaded from Threads\n\n📥 *EDWARD MD*`
          }, { quoted: message });
        } else {
          return sock.sendMessage(chatId, { text: '❌ No downloadable content found in that Threads post.' }, { quoted: message });
        }
        await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });
      } catch (err) {
        console.error('[threads] Error:', err.message);
        await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
        await sock.sendMessage(chatId, { text: `❌ Threads download failed: ${err.message}` }, { quoted: message });
      }
    }
  },
  {
    command: 'likee',
    aliases: ['likeedl', 'likeedownload'],
    category: 'downloader',
    description: 'Download video from Likee without watermark',
    usage: '.likee <Likee URL>',
    async handler(sock, message, args, context) {
      const { chatId } = context;
      const url = args[0]?.trim();
      if (!url || !url.includes('likee.video')) {
        return sock.sendMessage(chatId, {
          text: '🎬 *Likee Downloader*\n\nUsage: `.likee <Likee URL>`\n\nExample:\n• `.likee https://likee.video/@user/video/...`\n\n_Downloads Likee videos without watermark_'
        }, { quoted: message });
      }
      try {
        await sock.sendMessage(chatId, { react: { text: '⏳', key: message.key } });
        await sock.sendMessage(chatId, { text: '⏳ Fetching Likee video...' }, { quoted: message });
        const result = await downloadLikee(url);
        if (!result.video) {
          return sock.sendMessage(chatId, { text: '❌ No video found at that Likee URL.' }, { quoted: message });
        }
        await sock.sendMessage(chatId, {
          video: { url: result.video },
          caption: `🎬 *${result.title || 'Likee Video'}*\n\n📥 Downloaded by *EDWARD MD* (No watermark)`,
          mimetype: 'video/mp4'
        }, { quoted: message });
        await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });
      } catch (err) {
        console.error('[likee] Error:', err.message);
        await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
        await sock.sendMessage(chatId, { text: `❌ Likee download failed: ${err.message}` }, { quoted: message });
      }
    }
  }
];
