function uwuify(text) {
  return text
    .replace(/r/g, 'w').replace(/R/g, 'W')
    .replace(/l/g, 'w').replace(/L/g, 'W')
    .replace(/n([aeiou])/g, 'ny$1').replace(/N([aeiou])/g, 'Ny$1')
    .replace(/ove/g, 'uv').replace(/OVE/g, 'UV')
    .replace(/th/g, 'd').replace(/TH/g, 'D')
    .replace(/!/g, '! OwO').replace(/\?/g, '? OwO');
}

export default {
  command: 'uwu',
  aliases: ['uwuify', 'owo'],
  category: 'fun',
  description: 'UwUify any text',
  usage: '.uwu <text>',
  async handler(sock, message, args, context) {
    const { chatId } = context;
    const input = args.join(' ').trim();
    if (!input) return sock.sendMessage(chatId, { text: '❌ Pwovide some text, nya~ OwO\nExample: .uwu hello there' }, { quoted: message });
    const output = uwuify(input);
    const suffixes = [' UwU', ' OwO', ' nyaa~', ' (≧ω≦)', ' :3'];
    const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
    await sock.sendMessage(chatId, { text: `${output}${suffix}` }, { quoted: message });
  }
};
