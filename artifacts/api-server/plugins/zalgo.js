const UP = ['̍','̎','̄','̅','̿','̑','̆','̐','͒','͗','͑','̇','̈','̊','͂','̓','̈','͊','͋','͌','̃','̂','̌','͐','̀','́','̋','̏','̒','̓','̔','̽','̉','ͣ','ͤ','ͥ','ͦ','ͧ','ͨ','ͩ','ͪ','ͫ','ͬ','ͭ','ͮ','ͯ','̾','͛','͆','̚'];
const DOWN = ['̖','̗','̘','̙','̜','̝','̞','̟','̠','̤','̥','̦','̩','̪','̫','̬','̭','̮','̯','̰','̱','̲','̳','̹','̺','̻','̼','ͅ','͇','͈','͉','͍','͎','͓','͔','͕','͖','͙','͚','̣'];
const MID = ['̕','̛','̀','́','͘','̡','̢','̧','̨','̴','̵','̶','͜','͝','͞','͟','͠','͢','̸','̷','͡','҉'];

function zalgoify(text, intensity = 'medium') {
  const max = intensity === 'high' ? 8 : intensity === 'low' ? 2 : 4;
  return text.split('').map(c => {
    if (c === ' ') return c;
    const rand = (arr) => Array.from({ length: Math.floor(Math.random() * max) }, () => arr[Math.floor(Math.random() * arr.length)]).join('');
    return c + rand(UP) + rand(MID) + rand(DOWN);
  }).join('');
}

export default {
  command: 'zalgo',
  aliases: ['creepify', 'glitch'],
  category: 'fun',
  description: 'Create creepy glitchy Zalgo text',
  usage: '.zalgo <text> [low|medium|high]',
  async handler(sock, message, args, context) {
    const { chatId } = context;
    const levels = ['low', 'medium', 'high'];
    const level = levels.includes(args[args.length - 1]) ? args.pop() : 'medium';
    const input = args.join(' ').trim();
    if (!input) return sock.sendMessage(chatId, { text: '❌ Provide text.\nExample: .zalgo hello world high' }, { quoted: message });
    if (input.length > 50) return sock.sendMessage(chatId, { text: '❌ Keep it under 50 characters to avoid huge messages.' }, { quoted: message });
    const output = zalgoify(input, level);
    await sock.sendMessage(chatId, { text: `👁️ *Zalgo Text* (${level})\n\n${output}` }, { quoted: message });
  }
};
