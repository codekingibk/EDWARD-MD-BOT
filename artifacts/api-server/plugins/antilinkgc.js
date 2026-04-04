const ANTI_LINK_GROUPS = new Set();

export default {
  command: 'antilink',
  aliases: ['antilinkgc', 'nolinks'],
  category: 'group',
  description: 'Toggle anti-link protection in the group (deletes links from non-admins)',
  usage: '.antilink <on|off>',
  async handler(sock, message, args, context) {
    const { chatId, isGroup, isAdmin, isBotAdmin, prefix } = context;
    if (!isGroup) return sock.sendMessage(chatId, { text: '❌ This command is for groups only.' }, { quoted: message });
    if (!isAdmin) return sock.sendMessage(chatId, { text: '❌ Only group admins can use this command.' }, { quoted: message });
    if (!isBotAdmin) return sock.sendMessage(chatId, { text: '❌ I need to be an admin to enforce anti-link.' }, { quoted: message });

    const sub = (args[0] || '').toLowerCase();
    if (sub === 'on') {
      ANTI_LINK_GROUPS.add(chatId);
      await sock.sendMessage(chatId, {
        text: `🔒 *Anti-Link Enabled*\n\nLinks from non-admins will be deleted automatically.\nUse ${prefix}antilink off to disable.`
      }, { quoted: message });
    } else if (sub === 'off') {
      ANTI_LINK_GROUPS.delete(chatId);
      await sock.sendMessage(chatId, {
        text: `🔓 *Anti-Link Disabled*\n\nLinks are now allowed in this group.`
      }, { quoted: message });
    } else {
      const status = ANTI_LINK_GROUPS.has(chatId) ? '🟢 ON' : '🔴 OFF';
      await sock.sendMessage(chatId, {
        text: `🔗 *Anti-Link Status:* ${status}\n\nUse:\n${prefix}antilink on — Enable\n${prefix}antilink off — Disable`
      }, { quoted: message });
    }
  }
};

export { ANTI_LINK_GROUPS };
