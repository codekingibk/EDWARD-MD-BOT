const axios = require('axios');
const { cmd } = require("../command");

cmd({
  pattern: "tiktoksearch",
  alias: ["tiktoks", "tiks"],
  desc: "Search for TikTok videos using a query.",
  react: '✅',
  category: 'tools',
  filename: __filename
}, async (conn, mek, m, {
  from,
  args,
  reply
}) => {
  if (!args[0]) {
    return reply("🌸 What do you want to search on TikTok?\n\n*Usage Example:*\n.tiktoksearch <query>");
  }

  const query = args.join(" ");
  await m.react('⌛');

  try {
    reply(`🔎 Searching TikTok for: *${query}*`);

    const response = await axios.get('https://www.tikwm.com/api/feed/search', {
      params: { keywords: query, count: 5, cursor: 0, web: 1, hd: 1 },
      headers: { 'User-Agent': 'Mozilla/5.0' },
      timeout: 20000
    });

    const videos = response.data?.data?.videos;
    if (!videos || videos.length === 0) {
      await m.react('❌');
      return reply("❌ No results found for your query. Please try a different keyword.");
    }

    for (const video of videos.slice(0, 5)) {
      const caption = `🎵 *TikTok Result*\n\n` +
        `*Title:* ${video.title || 'N/A'}\n` +
        `*Author:* ${video.author?.nickname || 'Unknown'}\n` +
        `*Duration:* ${video.duration || 'Unknown'}s\n` +
        `*Views:* ${video.play_count || 0}\n` +
        `*URL:* https://www.tiktok.com/@${video.author?.unique_id}/video/${video.id}`;

      const videoUrl = video.play || video.wmplay;
      if (videoUrl) {
        await conn.sendMessage(from, {
          video: { url: videoUrl },
          caption
        }, { quoted: mek });
      } else {
        reply(caption);
      }
    }

    await m.react('✅');
  } catch (error) {
    console.error("TikTokSearch error:", error.message);
    await m.react('❌');
    reply("❌ An error occurred while searching TikTok. Please try again later.");
  }
});
