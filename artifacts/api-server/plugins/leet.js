const LEET = { a:'4', e:'3', g:'9', i:'1', o:'0', s:'5', t:'7', b:'8', l:'1' };

export default {
  command: 'leet',
  aliases: ['leetspeak', '1337'],
  category: 'fun',
  description: 'Convert text to l33tspeak',
  usage: '.leet <text>',
  async handler(sock, message, args, context) {
    const { chatId } = context;
    const input = args.join(' ').trim();
    if (!input) return sock.sendMessage(chatId, { text: '❌ Provide text.\nExample: .leet hello world' }, { quoted: message });
    const output = input.toLowerCase().split('').map(c => LEET[c] || c).join('');
    await sock.sendMessage(chatId, { text: `🖥️ *L33t Sp34k*\n\n${input}\n↓\n${output}` }, { quoted: message });
  }
};
