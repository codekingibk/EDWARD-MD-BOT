import crypto from 'crypto';

export default {
  command: 'uuid',
  aliases: ['generateid', 'uid'],
  category: 'tools',
  description: 'Generate random UUID(s)',
  usage: '.uuid [count]',
  async handler(sock, message, args, context) {
    const { chatId } = context;
    const count = Math.min(10, Math.max(1, parseInt(args[0]) || 1));
    const uuids = Array.from({ length: count }, () => crypto.randomUUID());
    await sock.sendMessage(chatId, {
      text: `🔑 *UUID Generator*\n\n${uuids.map((u, i) => `${i + 1}. \`${u}\``).join('\n')}`
    }, { quoted: message });
  }
};
