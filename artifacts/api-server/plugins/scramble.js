const WORDS = [
  'apple','banana','mango','orange','grape','cherry','melon','lemon','peach','berry',
  'football','basketball','tennis','cricket','hockey','swimming','running','boxing','cycling','chess',
  'python','javascript','typescript','database','network','server','browser','website','framework','algorithm',
  'elephant','giraffe','dolphin','penguin','cheetah','leopard','flamingo','ostrich','gorilla','kangaroo',
  'guitar','piano','violin','trumpet','saxophone','keyboard','microphone','speaker','concert','melody',
  'mountain','river','forest','desert','island','volcano','glacier','canyon','ocean','waterfall',
];

const ACTIVE_GAMES = new Map();

export default {
  command: 'scramble',
  aliases: ['unscramble', 'wordscramble'],
  category: 'games',
  description: 'Unscramble the word to win!',
  usage: '.scramble',
  async handler(sock, message, args, context) {
    const { chatId, prefix } = context;
    if (ACTIVE_GAMES.has(chatId)) {
      const g = ACTIVE_GAMES.get(chatId);
      const guess = (args[0] || '').toLowerCase().trim();
      if (guess === g.word) {
        ACTIVE_GAMES.delete(chatId);
        return sock.sendMessage(chatId, {
          text: `✅ *Correct!* The word was *${g.word}*! Well done! 🎉`
        }, { quoted: message });
      } else if (args.length > 0) {
        return sock.sendMessage(chatId, {
          text: `❌ Not quite! Keep guessing. Scrambled: *${g.scrambled}*\nType ${prefix}scramble skip to reveal`
        }, { quoted: message });
      }
    }
    if ((args[0] || '').toLowerCase() === 'skip') {
      const g = ACTIVE_GAMES.get(chatId);
      if (g) {
        ACTIVE_GAMES.delete(chatId);
        return sock.sendMessage(chatId, { text: `🔓 The word was: *${g.word}*` }, { quoted: message });
      }
    }
    const word = WORDS[Math.floor(Math.random() * WORDS.length)];
    const scrambled = word.split('').sort(() => Math.random() - 0.5).join('');
    ACTIVE_GAMES.set(chatId, { word, scrambled });
    setTimeout(() => ACTIVE_GAMES.delete(chatId), 60000);
    await sock.sendMessage(chatId, {
      text: `🔤 *WORD SCRAMBLE*\n\nUnscramble this word:\n\n*${scrambled.toUpperCase()}*\n\n_Reply with your answer! (60 seconds)_\nType ${prefix}scramble skip to give up`
    }, { quoted: message });
  }
};
