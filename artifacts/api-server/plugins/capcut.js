import axios from 'axios';

async function downloadCapCut(url) {
  const apis = [
    async () => {
      const { data } = await axios.get('https://api.maher-zubair.tech/download/capcut', {
        params: { url },
        timeout: 30000
      });
      if (data?.status && (data?.result?.download_url || data?.result?.video_url)) {
        return {
          video: data.result.download_url || data.result.video_url,
          title: data.result.title || 'CapCut Video',
          thumbnail: data.result.thumbnail || data.result.cover
        };
      }
      throw new Error('No video URL');
    },
    async () => {
      const { data } = await axios.get(`https://api-aswin-sparky.koyeb.app/api/downloader/capcut?url=${encodeURIComponent(url)}`, {
        timeout: 30000
      });
      if (data?.status && data?.data?.video_url) {
        return { video: data.data.video_url, title: data.data.title || 'CapCut Video', thumbnail: data.data.cover };
      }
      throw new Error('No video URL');
    },
    async () => {
      const { data } = await axios.get(`https://bk9.fun/download/capcut?url=${encodeURIComponent(url)}`, {
        timeout: 30000
      });
      if (data?.status && data?.BK9?.video) {
        return { video: data.BK9.video, title: data.BK9.title || 'CapCut Video', thumbnail: data.BK9.cover };
      }
      throw new Error('No video URL');
    }
  ];

  for (const apiFn of apis) {
    try {
      return await apiFn();
    } catch {}
  }
  throw new Error('All CapCut download APIs failed');
}

export default {
  command: 'capcut',
  aliases: ['cc', 'capcutdl'],
  category: 'downloader',
  description: 'Download CapCut project video without watermark',
  usage: '.capcut <CapCut URL>',
  async handler(sock, message, args, context) {
    const { chatId } = context;
    const url = args[0]?.trim();
    if (!url || !url.includes('capcut.com')) {
      return sock.sendMessage(chatId, {
        text: '🎬 *CapCut Downloader*\n\nUsage: `.capcut <CapCut URL>`\n\nExample:\n• `.capcut https://www.capcut.com/template-detail/...`\n\n_Downloads CapCut template videos without watermark_'
      }, { quoted: message });
    }

    try {
      await sock.sendMessage(chatId, { react: { text: '⏳', key: message.key } });
      await sock.sendMessage(chatId, { text: '⏳ Fetching CapCut video...' }, { quoted: message });

      const result = await downloadCapCut(url);

      let thumbBuffer;
      if (result.thumbnail) {
        try {
          const img = await axios.get(result.thumbnail, { responseType: 'arraybuffer', timeout: 10000 });
          thumbBuffer = Buffer.from(img.data);
        } catch {}
      }

      await sock.sendMessage(chatId, {
        video: { url: result.video },
        caption: `🎬 *${result.title}*\n\n📥 Downloaded by *EDWARD MD*\n_No watermark_`,
        mimetype: 'video/mp4'
      }, { quoted: message });

      await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });
    } catch (err) {
      console.error('[capcut] Error:', err.message);
      await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
      await sock.sendMessage(chatId, {
        text: `❌ *CapCut Download Failed*\n\nReason: ${err.message || 'Unknown error'}\n\nMake sure the CapCut link is valid and the template is public.`
      }, { quoted: message });
    }
  }
};
