const { cmd } = require("../command");

cmd({
  pattern: "post",
  alias: ["poststatus"],
  desc: "Post text to WhatsApp status",
  category: "owner",
  filename: __filename
}, async (conn, mek, m, { from, isOwner, q, reply }) => {
  if (!isOwner) return reply("*📛 Owner only command*");
  if (!q) return reply("Usage: .post <your status text>");

  try {
    await conn.sendMessage("status@broadcast", {
      text: q
    }, { statusJidList: [conn.user.id] });
    return reply("✅ Status posted successfully.");
  } catch (e) {
    return reply(`❌ Failed to post status: ${e.message}`);
  }
});
