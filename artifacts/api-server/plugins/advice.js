const ADVICE = [
  "Don't wait for opportunity. Create it.",
  "Small steps every day lead to big results over time.",
  "The best time to start was yesterday. The next best time is now.",
  "You don't have to be great to start, but you have to start to be great.",
  "Your only competition is who you were yesterday.",
  "Focus on progress, not perfection.",
  "Be the change you wish to see in the world.",
  "Success is not final, failure is not fatal: it is the courage to continue that counts.",
  "Work hard in silence. Let success make the noise.",
  "The secret of getting ahead is getting started.",
  "Dream big. Work hard. Stay humble.",
  "Your attitude determines your direction.",
  "Mistakes are proof that you are trying.",
  "Keep going. Everything you need will come to you at the right time.",
  "Don't let yesterday take up too much of today.",
  "You are capable of more than you know.",
  "Stop doubting yourself. Work hard and make it happen.",
  "If you believe in yourself, anything is possible.",
  "The harder you work, the luckier you get.",
  "Do what is right, not what is easy.",
];

export default {
  command: 'advice',
  aliases: ['tip', 'wisdom'],
  category: 'fun',
  description: 'Get a random piece of life advice',
  usage: '.advice',
  async handler(sock, message, args, context) {
    const { chatId } = context;
    const text = ADVICE[Math.floor(Math.random() * ADVICE.length)];
    await sock.sendMessage(chatId, {
      text: `💡 *Daily Advice*\n\n"${text}"\n\n_— EDWARD MD Wisdom_`
    }, { quoted: message });
  }
};
