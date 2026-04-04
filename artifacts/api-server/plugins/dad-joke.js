const JOKES = [
  "Why don't scientists trust atoms? Because they make up everything!",
  "I'm reading a book about anti-gravity. It's impossible to put down.",
  "Did you hear about the mathematician who's afraid of negative numbers? He'll stop at nothing to avoid them.",
  "Why do cows wear bells? Because their horns don't work.",
  "What do you call cheese that isn't yours? Nacho cheese.",
  "Why couldn't the bicycle stand up by itself? It was two-tired.",
  "What do you call a factory that makes okay products? A satisfactory.",
  "I asked my dog what 2 minus 2 is. He said nothing.",
  "Why can't you give Elsa a balloon? Because she'll let it go.",
  "What time did the man go to the dentist? Tooth hurty.",
  "I used to hate facial hair but then it grew on me.",
  "Why did the scarecrow win an award? He was outstanding in his field.",
  "I'm on a seafood diet. I see food and I eat it.",
  "What do you call a sleeping dinosaur? A dino-snore!",
  "Why don't eggs tell jokes? They'd crack each other up.",
  "What do you call a fish without eyes? A fsh.",
  "I would tell you a joke about paper, but it's tearable.",
  "Why did the bicycle fall over? Because it was two-tired.",
  "What do you call a boomerang that doesn't come back? A stick.",
  "How do you organize a space party? You planet.",
];

export default {
  command: 'dadjoke',
  aliases: ['dad', 'badjoke', 'pun'],
  category: 'fun',
  description: 'Get a classic dad joke',
  usage: '.dadjoke',
  async handler(sock, message, args, context) {
    const { chatId } = context;
    const joke = JOKES[Math.floor(Math.random() * JOKES.length)];
    await sock.sendMessage(chatId, {
      text: `👨 *Dad Joke of the Day*\n\n${joke}\n\n_😂 I know, I know..._`
    }, { quoted: message });
  }
};
