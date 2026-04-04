const QUOTES = [
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "Life is what happens when you're busy making other plans.", author: "John Lennon" },
  { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
  { text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
  { text: "Everything you've ever wanted is on the other side of fear.", author: "George Addair" },
  { text: "Success is not how high you have climbed, but how you make a positive difference to the world.", author: "Roy T. Bennett" },
  { text: "When you have a dream, you've got to grab it and never let go.", author: "Carol Burnett" },
  { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { text: "You are never too old to set another goal or to dream a new dream.", author: "C.S. Lewis" },
  { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
  { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
  { text: "Keep your face always toward the sunshine, and shadows will fall behind you.", author: "Walt Whitman" },
  { text: "The best time to plant a tree was 20 years ago. The second best time is now.", author: "Chinese Proverb" },
  { text: "You miss 100% of the shots you don't take.", author: "Wayne Gretzky" },
  { text: "Hardships often prepare ordinary people for an extraordinary destiny.", author: "C.S. Lewis" },
];

export default {
  command: 'motivation',
  aliases: ['motivate', 'inspire', 'quote2'],
  category: 'fun',
  description: 'Get a motivational quote',
  usage: '.motivation',
  async handler(sock, message, args, context) {
    const { chatId } = context;
    const q = QUOTES[Math.floor(Math.random() * QUOTES.length)];
    await sock.sendMessage(chatId, {
      text: `💪 *Motivation of the Day*\n\n"${q.text}"\n\n— *${q.author}*`
    }, { quoted: message });
  }
};
