export default {
  command: 'coinflip',
  aliases: ['flip', 'toss'],
  category: 'games',
  description: 'Flip a coin',
  usage: '.coinflip',
  async handler(sock, message, args, context) {
    const { chatId } = context;
    const sides = ['Heads 🪙', 'Tails 🔁'];
    const result = sides[Math.floor(Math.random() * 2)];
    await sock.sendMessage(chatId, {
      text: `🪙 *Coin Flip Result*\n\n*${result}*!\n\n_The coin has spoken._`
    }, { quoted: message });
  }
};
