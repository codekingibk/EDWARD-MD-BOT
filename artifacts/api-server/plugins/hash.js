import crypto from 'crypto';

export default {
  command: 'hash',
  aliases: ['md5', 'sha256', 'checksum'],
  category: 'tools',
  description: 'Hash text using MD5, SHA1, or SHA256',
  usage: '.hash <text> [md5|sha1|sha256]',
  async handler(sock, message, args, context) {
    const { chatId } = context;
    const algorithm = ['md5', 'sha1', 'sha256'].includes((args[args.length - 1] || '').toLowerCase())
      ? args.pop().toLowerCase() : 'sha256';
    const input = args.join(' ').trim();
    if (!input) return sock.sendMessage(chatId, { text: '❌ Provide text to hash.\nExample: .hash hello world sha256' }, { quoted: message });
    const hashed = crypto.createHash(algorithm).update(input).digest('hex');
    await sock.sendMessage(chatId, {
      text: `🔐 *Text Hash*\n\n*Algorithm:* ${algorithm.toUpperCase()}\n*Input:* ${input}\n*Hash:* \`${hashed}\``
    }, { quoted: message });
  }
};
