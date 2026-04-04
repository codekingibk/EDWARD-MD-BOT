export default {
  command: 'rps',
  aliases: ['rockpaperscissors'],
  category: 'games',
  description: 'Play Rock Paper Scissors against the bot',
  usage: '.rps <rock|paper|scissors>',
  async handler(sock, message, args, context) {
    const { chatId } = context;
    const choices = ['rock', 'paper', 'scissors'];
    const emojis = { rock: '🪨', paper: '📄', scissors: '✂️' };
    const userChoice = (args[0] || '').toLowerCase();
    if (!choices.includes(userChoice)) {
      return sock.sendMessage(chatId, { text: `❌ Choose one: *rock*, *paper*, or *scissors*\n\nExample: .rps rock` }, { quoted: message });
    }
    const botChoice = choices[Math.floor(Math.random() * 3)];
    let result;
    if (userChoice === botChoice) result = "🤝 *It's a tie!*";
    else if (
      (userChoice === 'rock' && botChoice === 'scissors') ||
      (userChoice === 'paper' && botChoice === 'rock') ||
      (userChoice === 'scissors' && botChoice === 'paper')
    ) result = '🎉 *You win!*';
    else result = '🤖 *Bot wins!*';
    await sock.sendMessage(chatId, {
      text: `╔═══════════════╗\n` +
        `  🎮 ROCK PAPER SCISSORS\n` +
        `╚═══════════════╝\n\n` +
        `👤 You   : ${emojis[userChoice]} ${userChoice.toUpperCase()}\n` +
        `🤖 Bot   : ${emojis[botChoice]} ${botChoice.toUpperCase()}\n\n` +
        `${result}`
    }, { quoted: message });
  }
};
