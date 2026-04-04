function toVaporwave(text) {
  const normal = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 ';
  const vapor  = 'ａｂｃｄｅｆｇｈｉｊｋｌｍｎｏｐｑｒｓｔｕｖｗｘｙｚＡＢＣＤＥＦＧＨＩＪＫＬＭＮＯＰＱＲＳＴＵＶＷＸＹＺ０１２３４５６７８９　';
  return text.split('').map(c => {
    const i = normal.indexOf(c);
    return i >= 0 ? vapor[i] : c;
  }).join('');
}

export default {
  command: 'vaporwave',
  aliases: ['vapor', 'aesthetic', 'aesthetics'],
  category: 'fun',
  description: 'Convert text to ａｅｓｔｈｅｔｉｃ vaporwave style',
  usage: '.vaporwave <text>',
  async handler(sock, message, args, context) {
    const { chatId } = context;
    const input = args.join(' ').trim();
    if (!input) return sock.sendMessage(chatId, { text: '❌ Provide text.\nExample: .vaporwave hello world' }, { quoted: message });
    const output = toVaporwave(input);
    await sock.sendMessage(chatId, { text: `${output}\n\n🌊 ａｅｓｔｈｅｔｉｃ` }, { quoted: message });
  }
};
