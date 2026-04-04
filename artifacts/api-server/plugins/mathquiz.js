const ACTIVE = new Map();

function genQuestion() {
  const ops = ['+', '-', '*'];
  const op = ops[Math.floor(Math.random() * ops.length)];
  let a, b, answer;
  if (op === '+') { a = Math.floor(Math.random() * 100) + 1; b = Math.floor(Math.random() * 100) + 1; answer = a + b; }
  else if (op === '-') { a = Math.floor(Math.random() * 100) + 50; b = Math.floor(Math.random() * 50) + 1; answer = a - b; }
  else { a = Math.floor(Math.random() * 12) + 2; b = Math.floor(Math.random() * 12) + 2; answer = a * b; }
  return { question: `${a} ${op} ${b} = ?`, answer };
}

export default {
  command: 'mathquiz',
  aliases: ['mq', 'mathgame'],
  category: 'games',
  description: 'Solve math problems quickly to win!',
  usage: '.mathquiz',
  async handler(sock, message, args, context) {
    const { chatId, prefix } = context;

    if (ACTIVE.has(chatId)) {
      const g = ACTIVE.get(chatId);
      const ans = parseInt(args[0]);
      if (!isNaN(ans)) {
        if (ans === g.answer) {
          ACTIVE.delete(chatId);
          return sock.sendMessage(chatId, { text: `✅ *Correct!* ${g.question.replace('?', ans)}\n\nWell done! 🎉\nType ${prefix}mathquiz for another question.` }, { quoted: message });
        } else {
          return sock.sendMessage(chatId, { text: `❌ Wrong! The question is still:\n*${g.question}*\n\nTry again!` }, { quoted: message });
        }
      }
    }

    const { question, answer } = genQuestion();
    ACTIVE.set(chatId, { question, answer });
    setTimeout(() => {
      if (ACTIVE.has(chatId)) {
        ACTIVE.delete(chatId);
        sock.sendMessage(chatId, { text: `⏰ Time's up! The answer was *${answer}*.\nType ${prefix}mathquiz to try again!` }).catch(() => {});
      }
    }, 30000);

    await sock.sendMessage(chatId, {
      text: `🧮 *MATH QUIZ!*\n\nSolve this in 30 seconds:\n\n*${question}*\n\nReply with just the number!`
    }, { quoted: message });
  }
};
