const AFFIRMATIONS = [
  "I am worthy of love, success, and happiness.",
  "Every day I am getting stronger and more resilient.",
  "I believe in my ability to solve problems and handle challenges.",
  "I am enough. I have enough. I do enough.",
  "My potential is limitless and I am capable of achieving great things.",
  "I attract positivity and good people into my life.",
  "I am brave, bold, and courageous.",
  "I deserve all good things that come my way.",
  "I am in charge of how I feel and today I choose happiness.",
  "My life is filled with abundance, joy, and purpose.",
  "I am growing and evolving every single day.",
  "I release all fear and embrace infinite possibilities.",
  "I am grateful for this moment and the opportunities it brings.",
  "I am confident, powerful, and full of energy.",
  "Success flows naturally to me because I work hard and stay focused.",
  "I am loved and I spread love wherever I go.",
  "My mindset is my superpower and I use it wisely.",
  "I am exactly where I need to be right now.",
  "I choose peace over worry, faith over fear.",
  "Today I will be better than I was yesterday.",
];

export default {
  command: 'affirmation',
  aliases: ['affirm', 'positivity', 'inspire'],
  category: 'fun',
  description: 'Get a daily positive affirmation',
  usage: '.affirmation',
  async handler(sock, message, args, context) {
    const { chatId } = context;
    const text = AFFIRMATIONS[Math.floor(Math.random() * AFFIRMATIONS.length)];
    await sock.sendMessage(chatId, {
      text: `🌟 *Daily Affirmation*\n\n✨ "${text}"\n\n_Believe it. Say it. Live it._`
    }, { quoted: message });
  }
};
