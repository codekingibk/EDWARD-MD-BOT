const WELCOME_MSGS = new Map();
const GOODBYE_MSGS = new Map();

export default [
  {
    command: 'setwelcome',
    aliases: ['welcomemsg', 'welcome'],
    category: 'group',
    description: 'Set a welcome message for new group members',
    usage: '.setwelcome <message> (use {name} for member name, {group} for group name)',
    async handler(sock, message, args, context) {
      const { chatId, isGroup, isAdmin } = context;
      if (!isGroup) return sock.sendMessage(chatId, { text: '❌ This command is for groups only.' }, { quoted: message });
      if (!isAdmin) return sock.sendMessage(chatId, { text: '❌ Only admins can set the welcome message.' }, { quoted: message });
      const msg = args.join(' ').trim();
      if (!msg) {
        const current = WELCOME_MSGS.get(chatId) || '_Not set_';
        return sock.sendMessage(chatId, {
          text: `👋 *Welcome Message*\n\nCurrent: ${current}\n\nTo set: .setwelcome Hello {name}, welcome to {group}!`
        }, { quoted: message });
      }
      WELCOME_MSGS.set(chatId, msg);
      await sock.sendMessage(chatId, {
        text: `✅ *Welcome message set!*\n\nPreview: ${msg.replace('{name}', 'NewMember').replace('{group}', 'This Group')}`
      }, { quoted: message });
    }
  },
  {
    command: 'setleave',
    aliases: ['goodbyemsg', 'goodbye'],
    category: 'group',
    description: 'Set a goodbye message for members who leave',
    usage: '.setleave <message> (use {name} for member name)',
    async handler(sock, message, args, context) {
      const { chatId, isGroup, isAdmin } = context;
      if (!isGroup) return sock.sendMessage(chatId, { text: '❌ This command is for groups only.' }, { quoted: message });
      if (!isAdmin) return sock.sendMessage(chatId, { text: '❌ Only admins can set the goodbye message.' }, { quoted: message });
      const msg = args.join(' ').trim();
      if (!msg) {
        const current = GOODBYE_MSGS.get(chatId) || '_Not set_';
        return sock.sendMessage(chatId, {
          text: `👋 *Goodbye Message*\n\nCurrent: ${current}\n\nTo set: .setleave Goodbye {name}, we'll miss you!`
        }, { quoted: message });
      }
      GOODBYE_MSGS.set(chatId, msg);
      await sock.sendMessage(chatId, {
        text: `✅ *Goodbye message set!*\n\nPreview: ${msg.replace('{name}', 'LeavingMember')}`
      }, { quoted: message });
    }
  }
];

export { WELCOME_MSGS, GOODBYE_MSGS };
