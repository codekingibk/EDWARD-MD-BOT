export default {
  command: 'reverse',
  aliases: ['reversetext', 'rev'],
  category: 'tools',
  description: 'Reverse any text',
  usage: '.reverse <text>',
  async handler(sock, message, args, context) {
    const { chatId } = context;
    const input = args.join(' ').trim();
    if (!input) return sock.sendMessage(chatId, { text: '❌ Provide text.\nExample: .reverse hello world' }, { quoted: message });
    const output = [...input].reverse().join('');
    await sock.sendMessage(chatId, {
      text: `↩️ *Text Reverser*\n\n*Original:* ${input}\n*Reversed:* ${output}`
    }, { quoted: message });
  }
};
