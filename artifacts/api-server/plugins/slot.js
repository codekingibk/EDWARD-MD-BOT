export default {
  command: 'slot',
  aliases: ['slots', 'slotmachine'],
  category: 'games',
  description: 'Play the slot machine',
  usage: '.slot',
  async handler(sock, message, args, context) {
    const { chatId } = context;
    const symbols = ['🍒', '🍋', '🍊', '🍇', '🔔', '⭐', '💎', '7️⃣'];
    const s1 = symbols[Math.floor(Math.random() * symbols.length)];
    const s2 = symbols[Math.floor(Math.random() * symbols.length)];
    const s3 = symbols[Math.floor(Math.random() * symbols.length)];
    let result;
    if (s1 === s2 && s2 === s3) {
      if (s1 === '💎') result = '🎊 *JACKPOT! TRIPLE DIAMOND!* 🎊';
      else if (s1 === '7️⃣') result = '🎉 *LUCKY SEVENS! MEGA WIN!* 🎉';
      else result = `🎉 *TRIPLE ${s1}! YOU WIN!* 🎉`;
    } else if (s1 === s2 || s2 === s3 || s1 === s3) {
      result = '✨ *Nice pair! Small win!*';
    } else {
      result = '😅 *No match. Try again!*';
    }
    await sock.sendMessage(chatId, {
      text: `🎰 *SLOT MACHINE*\n\n` +
        `╔═══════════╗\n` +
        `  ${s1}  ${s2}  ${s3}  \n` +
        `╚═══════════╝\n\n` +
        `${result}`
    }, { quoted: message });
  }
};
