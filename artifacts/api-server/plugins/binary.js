export default {
  command: 'binary',
  aliases: ['bin2text', 'text2bin'],
  category: 'tools',
  description: 'Convert text to binary or binary to text',
  usage: '.binary <text or binary>',
  async handler(sock, message, args, context) {
    const { chatId } = context;
    const input = args.join(' ').trim();
    if (!input) return sock.sendMessage(chatId, { text: '❌ Provide text or binary.\nExample: .binary hello\nExample: .binary 01101000 01100101 01101100 01101100 01101111' }, { quoted: message });
    const isBinary = /^[01\s]+$/.test(input) && input.includes(' ');
    let output;
    if (isBinary) {
      output = input.trim().split(' ').map(b => String.fromCharCode(parseInt(b, 2))).join('');
      await sock.sendMessage(chatId, { text: `💻 *Binary to Text*\n\n*Binary:* ${input.slice(0, 100)}${input.length > 100 ? '...' : ''}\n*Text:* ${output}` }, { quoted: message });
    } else {
      output = input.split('').map(c => c.charCodeAt(0).toString(2).padStart(8, '0')).join(' ');
      if (output.length > 500) return sock.sendMessage(chatId, { text: '❌ Text too long to convert. Keep it under 60 characters.' }, { quoted: message });
      await sock.sendMessage(chatId, { text: `💻 *Text to Binary*\n\n*Text:* ${input}\n*Binary:* ${output}` }, { quoted: message });
    }
  }
};
