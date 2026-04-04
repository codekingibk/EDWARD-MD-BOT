const FACTS = [
  "Chuck Norris can divide by zero.",
  "Chuck Norris can slam a revolving door.",
  "Chuck Norris counted to infinity. Twice.",
  "When Chuck Norris enters a room, he doesn't turn the lights on. He turns the dark off.",
  "Chuck Norris's tears cure cancer. Too bad he has never cried.",
  "Chuck Norris can hear sign language.",
  "Death once had a near-Chuck-Norris experience.",
  "Chuck Norris can build a snowman out of rain.",
  "Time waits for no man. Unless that man is Chuck Norris.",
  "Chuck Norris once punched a man in the soul.",
  "Chuck Norris's keyboard has no escape key because nothing escapes Chuck Norris.",
  "Google searches Chuck Norris.",
  "Chuck Norris can strangle you with a cordless phone.",
  "Chuck Norris once kicked a horse in the chin. Its descendants are now called giraffes.",
  "Chuck Norris doesn't read books. He stares them down until he gets the information he wants.",
  "When Chuck Norris does pushups, he doesn't push himself up — he pushes the Earth down.",
  "Chuck Norris can win a game of Connect Four in only three moves.",
  "Chuck Norris can set ants on fire with a magnifying glass. At night.",
  "Chuck Norris doesn't need a parachute to skydive. He needs one to slow down.",
  "If Chuck Norris had a dollar for every time he killed someone, he'd have $0.75.",
];

export default {
  command: 'chuck',
  aliases: ['chucknorris', 'norris'],
  category: 'fun',
  description: 'Get a Chuck Norris fact',
  usage: '.chuck',
  async handler(sock, message, args, context) {
    const { chatId } = context;
    const fact = FACTS[Math.floor(Math.random() * FACTS.length)];
    await sock.sendMessage(chatId, {
      text: `💪 *Chuck Norris Fact*\n\n${fact}`
    }, { quoted: message });
  }
};
