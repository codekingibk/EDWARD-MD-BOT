import axios from 'axios';

async function searchSpotify(query) {
  const { data } = await axios.get(`https://api.fabdl.com/spotify/search`, {
    params: { q: query, type: 'track', limit: 5 },
    timeout: 15000
  });
  return data?.result?.tracks?.items || [];
}

async function getSpotifyTrack(url) {
  const { data } = await axios.get(`https://api.fabdl.com/spotify/get`, {
    params: { url },
    timeout: 20000
  });
  return data;
}

async function downloadSpotify(taskId) {
  const { data } = await axios.get(`https://api.fabdl.com/spotify/download-link`, {
    params: { id: taskId },
    timeout: 60000
  });
  return data;
}

export default [
  {
    command: 'spotify',
    aliases: ['sp', 'spotifydl'],
    category: 'downloader',
    description: 'Download a Spotify track',
    usage: '.spotify <Spotify URL or song name>',
    async handler(sock, message, args, context) {
      const { chatId } = context;
      const query = args.join(' ').trim();
      if (!query) {
        return sock.sendMessage(chatId, {
          text: '🎵 *Spotify Downloader*\n\nUsage:\n• `.spotify <Spotify track URL>`\n• `.spotify <song name>`\n\nExample:\n• `.spotify Blinding Lights The Weeknd`\n• `.spotify https://open.spotify.com/track/...`'
        }, { quoted: message });
      }

      try {
        await sock.sendMessage(chatId, { react: { text: '🔍', key: message.key } });

        let trackInfo = null;
        let dlUrl = null;

        if (query.includes('spotify.com/track/')) {
          await sock.sendMessage(chatId, { text: '⏳ Fetching Spotify track info...' }, { quoted: message });
          try {
            const info = await getSpotifyTrack(query);
            if (info?.result) {
              trackInfo = info.result;
              const dl = await downloadSpotify(info.result.id);
              dlUrl = dl?.dl_link;
            }
          } catch {}
        }

        if (!dlUrl) {
          await sock.sendMessage(chatId, { text: '🔍 Searching Spotify...' }, { quoted: message });
          const searchQ = query.includes('spotify.com') ? 'track' : query;
          try {
            const { data } = await axios.get('https://api.maher-zubair.tech/download/spotify-search', {
              params: { q: searchQ },
              timeout: 20000
            });
            if (data?.status && data?.result) {
              trackInfo = data.result;
              dlUrl = data.result.dl_url || data.result.download_url;
            }
          } catch {}
        }

        if (!dlUrl) {
          try {
            const { data } = await axios.get(`https://bk9.fun/download/spotify?url=${encodeURIComponent(query.includes('spotify.com') ? query : `spotify:search:${query}`)}`, {
              timeout: 30000
            });
            if (data?.status) {
              dlUrl = data?.BK9?.dl_link || data?.dl_link;
              trackInfo = trackInfo || { name: data?.BK9?.name || query, artists: [{ name: 'Unknown' }], duration_ms: 0 };
            }
          } catch {}
        }

        if (!dlUrl) {
          await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
          return sock.sendMessage(chatId, {
            text: `❌ Could not find or download this Spotify track.\n\nTip: Try searching by song name:\n*.spotify Shape of You Ed Sheeran*`
          }, { quoted: message });
        }

        const name = trackInfo?.name || query;
        const artist = trackInfo?.artists?.[0]?.name || trackInfo?.artist || 'Unknown Artist';
        const duration = trackInfo?.duration_ms ? Math.floor(trackInfo.duration_ms / 60000) + ':' + String(Math.floor((trackInfo.duration_ms % 60000) / 1000)).padStart(2, '0') : '';
        const thumb = trackInfo?.album?.images?.[0]?.url || trackInfo?.image || null;

        let thumbBuffer;
        if (thumb) {
          try {
            const img = await axios.get(thumb, { responseType: 'arraybuffer', timeout: 10000 });
            thumbBuffer = Buffer.from(img.data);
          } catch {}
        }

        await sock.sendMessage(chatId, {
          audio: { url: dlUrl },
          mimetype: 'audio/mpeg',
          fileName: `${name} - ${artist}.mp3`,
          contextInfo: thumbBuffer ? {
            externalAdReply: {
              title: name,
              body: `${artist}${duration ? ` • ${duration}` : ''}`,
              thumbnail: thumbBuffer,
              mediaType: 2,
              sourceUrl: 'https://open.spotify.com'
            }
          } : undefined
        }, { quoted: message });

        await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });
      } catch (err) {
        console.error('[spotify] Error:', err.message);
        await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
        await sock.sendMessage(chatId, {
          text: `❌ *Spotify Download Failed*\n\nReason: ${err.message || 'Unknown error'}\n\nTry: *.spotify <song name artist>*`
        }, { quoted: message });
      }
    }
  },
  {
    command: 'spotifysrch',
    aliases: ['spsearch', 'spfind'],
    category: 'music',
    description: 'Search for a Spotify track',
    usage: '.spotifysrch <song name>',
    async handler(sock, message, args, context) {
      const { chatId } = context;
      const query = args.join(' ').trim();
      if (!query) {
        return sock.sendMessage(chatId, {
          text: '🔍 Usage: `.spotifysrch <song name>`'
        }, { quoted: message });
      }

      try {
        await sock.sendMessage(chatId, { react: { text: '🔍', key: message.key } });
        const { data } = await axios.get('https://saavn.dev/api/search/songs', {
          params: { query, page: 1, limit: 5 },
          timeout: 15000
        });

        const results = data?.data?.results || [];
        if (!results.length) {
          return sock.sendMessage(chatId, { text: '❌ No tracks found for that search.' }, { quoted: message });
        }

        let text = `🎵 *Spotify Search Results*\n\n`;
        for (let i = 0; i < Math.min(results.length, 5); i++) {
          const t = results[i];
          const name = t.name;
          const artist = t.artists?.primary?.map(a => a.name).join(', ') || 'Unknown';
          const album = t.album?.name || '';
          const dur = t.duration ? Math.floor(t.duration / 60) + ':' + String(t.duration % 60).padStart(2, '0') : '';
          text += `*${i+1}. ${name}*\n👤 ${artist}${album ? `\n💿 ${album}` : ''}${dur ? `\n⏱️ ${dur}` : ''}\n\n`;
        }
        text += `_Use .spotify <song name> to download_`;

        const thumbUrl = results[0]?.image?.[1]?.url || results[0]?.image?.[0]?.url;
        if (thumbUrl) {
          await sock.sendMessage(chatId, { image: { url: thumbUrl }, caption: text }, { quoted: message });
        } else {
          await sock.sendMessage(chatId, { text }, { quoted: message });
        }
        await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });
      } catch (err) {
        console.error('[spotifysrch] Error:', err.message);
        await sock.sendMessage(chatId, { text: '❌ Search failed. Try again later.' }, { quoted: message });
      }
    }
  }
];
