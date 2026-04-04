import axios from 'axios';
import yts from 'yt-search';

const DL_API = 'https://api.qasimdev.dpdns.org/api/loaderto/download';
const API_KEY = 'xbps-install-Syu';

const wait = ms => new Promise(r => setTimeout(r, ms));

async function downloadYouTubeVideo(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const { data } = await axios.get(DL_API, {
        params: { apiKey: API_KEY, format: 'mp4', url },
        timeout: 120000
      });
      if (data?.data?.downloadUrl) return data.data;
      throw new Error('No download URL in response');
    } catch (err) {
      if (i === retries - 1) throw err;
      await wait(6000);
    }
  }
}

export default {
  command: 'ytmp4',
  aliases: ['ymp4', 'ytvideo', 'ytv', 'ydl'],
  category: 'downloader',
  description: 'Download YouTube video as MP4',
  usage: '.ytmp4 <YouTube URL or video title>',
  async handler(sock, message, args, context) {
    const { chatId } = context;
    const query = args.join(' ').trim();
    if (!query) {
      return sock.sendMessage(chatId, {
        text: '🎬 *YouTube MP4 Downloader*\n\nUsage: `.ytmp4 <YouTube URL or video title>`\n\nExamples:\n• `.ytmp4 https://youtube.com/watch?v=...`\n• `.ytmp4 Funny cat compilation`\n\n⚠️ _Only videos under ~10 minutes work reliably_'
      }, { quoted: message });
    }

    try {
      await sock.sendMessage(chatId, { react: { text: '🔍', key: message.key } });

      let videoUrl = query;
      let videoInfo = null;

      if (!query.includes('youtube.com') && !query.includes('youtu.be')) {
        await sock.sendMessage(chatId, { text: '🔍 Searching YouTube...' }, { quoted: message });
        const { videos } = await yts(query);
        if (!videos?.length) {
          return sock.sendMessage(chatId, { text: '❌ No results found. Try using a YouTube URL directly.' }, { quoted: message });
        }
        videoInfo = videos[0];
        videoUrl = videoInfo.url;
        await sock.sendMessage(chatId, {
          text: `✅ Found: *${videoInfo.title}*\n⏱️ Duration: ${videoInfo.timestamp}\n👤 Channel: ${videoInfo.author.name}\n\n⏳ Downloading video... (may take up to 60s)`
        }, { quoted: message });
      } else {
        await sock.sendMessage(chatId, { text: '⏳ Downloading video... (may take up to 60s)' }, { quoted: message });
      }

      const videoData = await downloadYouTubeVideo(videoUrl);

      let thumbnailBuffer;
      if (videoData.thumbnail) {
        try {
          const img = await axios.get(videoData.thumbnail, { responseType: 'arraybuffer', timeout: 15000 });
          thumbnailBuffer = Buffer.from(img.data);
        } catch {}
      }

      await sock.sendMessage(chatId, {
        video: { url: videoData.downloadUrl },
        caption: `🎬 *${videoData.title || 'YouTube Video'}*\n\n📥 Downloaded by *EDWARD MD*`,
        mimetype: 'video/mp4',
        fileName: `${videoData.title || 'video'}.mp4`,
        contextInfo: thumbnailBuffer ? {
          externalAdReply: {
            title: videoData.title || 'YouTube Video',
            body: 'Downloaded by EDWARD MD',
            thumbnail: thumbnailBuffer,
            mediaType: 1,
            sourceUrl: videoUrl
          }
        } : undefined
      }, { quoted: message });

      await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });
    } catch (err) {
      console.error('[ytmp4] Error:', err.message);
      await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
      const msg = err.message?.includes('timed out') ? 'Download timed out. Try a shorter video or different URL.' :
                  err.message?.includes('429') ? 'Rate limited. Wait a minute and retry.' :
                  err.message?.includes('No results') ? err.message :
                  'Download failed. Video may be too long or restricted.';
      await sock.sendMessage(chatId, { text: `❌ *Error:* ${msg}` }, { quoted: message });
    }
  }
};
