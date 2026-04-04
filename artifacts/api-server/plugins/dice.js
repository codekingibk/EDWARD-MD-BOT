export default {
  command: 'dice',
  aliases: ['rolldice', 'roll'],
  category: 'games',
  description: 'Roll one or more dice',
  usage: '.dice [number of dice] [sides per die]',
  async handler(sock, message, args, context) {
    const { chatId } = context;
    const numDice = Math.min(10, Math.max(1, parseInt(args[0]) || 1));
    const sides = Math.min(100, Math.max(2, parseInt(args[1]) || 6));
    const rolls = Array.from({ length: numDice }, () => Math.floor(Math.random() * sides) + 1);
    const total = rolls.reduce((a, b) => a + b, 0);
    const dieFaces = ['⚀','⚁','⚂','⚃','⚄','⚅'];
    const rollsText = rolls.map(r => sides === 6 ? `${dieFaces[r-1]} (${r})` : `[${r}]`).join('  ');
    await sock.sendMessage(chatId, {
      text: `🎲 *Dice Roll*\n\n` +
        `Dice: ${numDice}d${sides}\n` +
        `Rolls: ${rollsText}\n` +
        `Total: *${total}*${numDice > 1 ? ` / ${numDice * sides} max` : ''}`
    }, { quoted: message });
  }
};
