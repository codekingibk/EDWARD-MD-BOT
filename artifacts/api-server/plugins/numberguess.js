const GAMES = new Map();

export default {
  command: 'guess',
  aliases: ['numberguess', 'guessnum'],
  category: 'games',
  description: 'Guess the number between 1 and 100',
  usage: '.guess [number]',
  async handler(sock, message, args, context) {
    const { chatId, prefix } = context;
    const num = parseInt(args[0]);

    if (!GAMES.has(chatId) || isNaN(num)) {
      const target = Math.floor(Math.random() * 100) + 1;
      GAMES.set(chatId, { target, attempts: 0, max: 7 });
      setTimeout(() => GAMES.delete(chatId), 300000);
      return sock.sendMessage(chatId, {
        text: `🎯 *NUMBER GUESS GAME*\n\nI'm thinking of a number between 1 and 100!\nYou have *7 attempts* to guess it.\n\nType ${prefix}guess <number> to play!`
      }, { quoted: message });
    }

    const g = GAMES.get(chatId);
    if (isNaN(num) || num < 1 || num > 100) {
      return sock.sendMessage(chatId, { text: `❌ Enter a number between 1 and 100!` }, { quoted: message });
    }

    g.attempts++;
    const remaining = g.max - g.attempts;

    if (num === g.target) {
      GAMES.delete(chatId);
      return sock.sendMessage(chatId, {
        text: `🎉 *CORRECT!* The number was *${g.target}*!\nYou got it in *${g.attempts}* attempt${g.attempts !== 1 ? 's' : ''}!`
      }, { quoted: message });
    }

    if (g.attempts >= g.max) {
      GAMES.delete(chatId);
      return sock.sendMessage(chatId, {
        text: `😔 *Game Over!* The number was *${g.target}*.\nBetter luck next time! Type ${prefix}guess to play again.`
      }, { quoted: message });
    }

    const hint = num < g.target ? '📈 Too low!' : '📉 Too high!';
    await sock.sendMessage(chatId, {
      text: `${hint}\n\nAttempts: ${g.attempts}/${g.max} (${remaining} left)\nKeep guessing!`
    }, { quoted: message });
  }
};
