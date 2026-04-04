import axios from 'axios';

async function downloadSoundCloud(url, retries = 3) {
  const apis = [
    async () => {
      const { data } = await axios.get('https://api.fabdl.com/soundcloud/get', {
        params: { url },
        timeout: 30000
      });
      if (data?.status && data?.result?.dl_link) return data.result;
      throw new Error('No download link');
    },
    async () => {
      const { data } = await axios.get(`https://api.maher-zubair.tech/download/soundcloud?url=${encodeURIComponent(url)}`, {
        timeout: 30000
      });
      if (data?.status && (data?.result?.dl_url || data?.result?.link)) {
        return { dl_link: data.result.dl_url || data.result.link, title: data.result.title, artist: data.result.artist, image: data.result.thumbnail };
      }
      throw new Error('No download link');
    },
    async () => {
      const { data } = await axios.get(`https://bk9.fun/download/soundcloud?url=${encodeURIComponent(url)}`, {
        timeout: 30000
      });
      if (data?.status && data?.BK9?.dl_link) return { dl_link: data.BK9.dl_link, title: data.BK9.title, artist: data.BK9.artist, image: data.BK9.image };
      throw new Error('No download link');
    }
  ];

  for (const apiFn of apis) {
    try {
      return await apiFn();
    } catch {}
  }
  throw new Error('All SoundCloud download APIs failed');
}

export default {
  command: 'soundcloud',
  aliases: ['sc', 'scloud'],
  category: 'downloader',
  description: 'Download audio from SoundCloud',
  usage: '.sc <SoundCloud URL or song name>',
  async handler(sock, message, args, context) {
    const { chatId } = context;
    const query = args.join(' ').trim();
    if (!query) {
      return sock.sendMessage(chatId, {
        text: '🎵 *SoundCloud Downloader*\n\nUsage:\n• `.sc <SoundCloud URL>`\n• `.sc <artist - song name>`\n\nExample:\n• `.sc https://soundcloud.com/artist/song`'
      }, { quoted: message });
    }

    try {
      await sock.sendMessage(chatId, { react: { text: '🔍', key: message.key } });

      let url = query;
      if (!query.includes('soundcloud.com')) {
        await sock.sendMessage(chatId, { text: '🔍 Searching SoundCloud...' }, { quoted: message });
        try {
          const { data } = await axios.get('https://api.fabdl.com/soundcloud/search', {
            params: { q: query, limit: 1 },
            timeout: 15000
          });
          const tracks = data?.result?.collection;
          if (!tracks?.length) throw new Error('No results');
          url = tracks[0].permalink_url;
          await sock.sendMessage(chatId, {
            text: `✅ Found: *${tracks[0].title}*\n👤 ${tracks[0].user?.username || 'Unknown'}\n\n⏳ Downloading...`
          }, { quoted: message });
        } catch {
          return sock.sendMessage(chatId, {
            text: '❌ No SoundCloud track found. Try using a direct SoundCloud URL.'
          }, { quoted: message });
        }
      } else {
        await sock.sendMessage(chatId, { text: '⏳ Downloading from SoundCloud...' }, { quoted: message });
      }

      const trackData = await downloadSoundCloud(url);

      let thumbBuffer;
      if (trackData.image || trackData.thumbnail) {
        try {
          const img = await axios.get(trackData.image || trackData.thumbnail, { responseType: 'arraybuffer', timeout: 10000 });
          thumbBuffer = Buffer.from(img.data);
        } catch {}
      }

      const title = trackData.title || 'SoundCloud Track';
      const artist = trackData.artist || trackData.user?.username || 'Unknown';

      await sock.sendMessage(chatId, {
        audio: { url: trackData.dl_link },
        mimetype: 'audio/mpeg',
        fileName: `${title}.mp3`,
        contextInfo: thumbBuffer ? {
          externalAdReply: {
            title,
            body: artist,
            thumbnail: thumbBuffer,
            mediaType: 2,
            sourceUrl: url
          }
        } : undefined
      }, { quoted: message });

      await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });
    } catch (err) {
      console.error('[soundcloud] Error:', err.message);
      await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
      await sock.sendMessage(chatId, {
        text: `❌ *SoundCloud Download Failed*\n\nReason: ${err.message || 'Unknown error'}\n\nMake sure the track is public and try again.`
      }, { quoted: message });
    }
  }
};
