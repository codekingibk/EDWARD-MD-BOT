const QUOTES = [
  { text: "The world isn't perfect, but it's there for us, doing the best it can... and that's what makes it so damn beautiful.", character: "Roy Mustang", anime: "Fullmetal Alchemist" },
  { text: "Hard work is worthless for those that don't believe in themselves.", character: "Naruto Uzumaki", anime: "Naruto" },
  { text: "People's lives don't end when they die. It ends when they lose faith.", character: "Itachi Uchiha", anime: "Naruto" },
  { text: "If you don't take risks, you can't create a future.", character: "Monkey D. Luffy", anime: "One Piece" },
  { text: "The only thing we're allowed to do is believe that we won't regret the choice we made.", character: "Levi Ackermann", anime: "Attack on Titan" },
  { text: "A person grows up when he's able to overcome hardships.", character: "Vegeta", anime: "Dragon Ball Z" },
  { text: "Whatever you lose, you'll find it again. But what you throw away you'll never get back.", character: "Kenshin Himura", anime: "Rurouni Kenshin" },
  { text: "I don't want to conquer anything. I just think the guy with the most freedom in this whole ocean is the Pirate King!", character: "Monkey D. Luffy", anime: "One Piece" },
  { text: "If you can't find a reason to fight, then you shouldn't be fighting.", character: "Akame", anime: "Akame ga Kill" },
  { text: "No matter how hard or impossible it is, never lose sight of your goal.", character: "Monkey D. Luffy", anime: "One Piece" },
  { text: "Power comes in response to a need, not a desire.", character: "Goku", anime: "Dragon Ball Z" },
  { text: "The world is not beautiful, therefore it is.", character: "Kino", anime: "Kino's Journey" },
  { text: "It's not about whether it's worth it. It's about what you want.", character: "Hachiman Hikigaya", anime: "My Teen Romantic Comedy SNAFU" },
  { text: "A place where someone still thinks about you is a place you can call home.", character: "Jiraiya", anime: "Naruto" },
  { text: "Don't give up! There's no shame in falling down. The true shame is to not stand up again.", character: "Shintaro Midorima", anime: "Kuroko's Basketball" },
];

export default {
  command: 'animequote',
  aliases: ['aq', 'animewisdom'],
  category: 'anime',
  description: 'Get a random anime quote',
  usage: '.animequote',
  async handler(sock, message, args, context) {
    const { chatId } = context;
    const q = QUOTES[Math.floor(Math.random() * QUOTES.length)];
    await sock.sendMessage(chatId, {
      text: `🎌 *Anime Quote*\n\n"${q.text}"\n\n— *${q.character}*\n📺 ${q.anime}`
    }, { quoted: message });
  }
};
