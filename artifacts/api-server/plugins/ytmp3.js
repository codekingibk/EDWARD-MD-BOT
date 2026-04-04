import axios from 'axios';
import yts from 'yt-search';

const DL_API = 'https://api.qasimdev.dpdns.org/api/loaderto/download';
const API_KEY = 'xbps-install-Syu';

const wait = ms => new Promise(r => setTimeout(r, ms));

async function downloadYouTubeAudio(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const { data } = await axios.get(DL_API, {
        params: { apiKey: API_KEY, format: 'mp3', url },
        timeout: 90000
      });
      if (data?.data?.downloadUrl) return data.data;
      throw new Error('No download URL in response');
    } catch (err) {
      if (i === retries - 1) throw err;
      await wait(5000);
    }
  }
}

async function resolveUrl(input) {
  const ytPatterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /^[a-zA-Z0-9_-]{11}$/
  ];
  for (const pat of ytPatterns) {
    if (pat.test(input)) return input;
  }
  const { videos } = await yts(input);
  if (!videos?.length) throw new Error('No YouTube results found');
  return videos[0].url;
}

export default {
  command: 'ytmp3',
  aliases: ['ymp3', 'ytaudio', 'yta'],
  category: 'downloader',
  description: 'Download YouTube video as MP3 audio',
  usage: '.ytmp3 <YouTube URL or video title>',
  async handler(sock, message, args, context) {
    const { chatId } = context;
    const query = args.join(' ').trim();
    if (!query) {
      return sock.sendMessage(chatId, {
        text: '🎵 *YouTube MP3 Downloader*\n\nUsage: `.ytmp3 <YouTube URL or song name>`\n\nExamples:\n• `.ytmp3 https://youtube.com/watch?v=...`\n• `.ytmp3 Shape of You Ed Sheeran`'
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
          return sock.sendMessage(chatId, { text: '❌ No results found. Try with a YouTube URL.' }, { quoted: message });
        }
        videoInfo = videos[0];
        videoUrl = videoInfo.url;
        await sock.sendMessage(chatId, {
          text: `✅ Found: *${videoInfo.title}*\n⏱️ Duration: ${videoInfo.timestamp}\n👤 Channel: ${videoInfo.author.name}\n\n⏳ Downloading audio...`
        }, { quoted: message });
      } else {
        await sock.sendMessage(chatId, { text: '⏳ Downloading audio...' }, { quoted: message });
      }

      const songData = await downloadYouTubeAudio(videoUrl);

      let thumbnailBuffer;
      if (songData.thumbnail) {
        try {
          const img = await axios.get(songData.thumbnail, { responseType: 'arraybuffer', timeout: 15000 });
          thumbnailBuffer = Buffer.from(img.data);
        } catch {}
      }

      await sock.sendMessage(chatId, {
        audio: { url: songData.downloadUrl },
        mimetype: 'audio/mpeg',
        fileName: `${songData.title || 'audio'}.mp3`,
        contextInfo: thumbnailBuffer ? {
          externalAdReply: {
            title: songData.title || 'YouTube Audio',
            body: `Downloaded by EDWARD MD`,
            thumbnail: thumbnailBuffer,
            mediaType: 2,
            sourceUrl: videoUrl
          }
        } : undefined
      }, { quoted: message });

      await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });
    } catch (err) {
      console.error('[ytmp3] Error:', err.message);
      await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
      const msg = err.message?.includes('timed out') ? 'Download timed out. Try again.' :
                  err.message?.includes('429') ? 'Rate limited. Wait a minute and retry.' :
                  err.message?.includes('No results') ? err.message :
                  'Download failed. Check the URL and try again.';
      await sock.sendMessage(chatId, { text: `❌ *Error:* ${msg}` }, { quoted: message });
    }
  }
};
