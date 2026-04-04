const TWISTERS = [
  "She sells seashells by the seashore. The shells she sells are surely seashells.",
  "How much wood would a woodchuck chuck if a woodchuck could chuck wood?",
  "Peter Piper picked a peck of pickled peppers. How many pickled peppers did Peter Piper pick?",
  "Red lorry, yellow lorry, red lorry, yellow lorry.",
  "I scream, you scream, we all scream for ice cream!",
  "Fuzzy Wuzzy was a bear. Fuzzy Wuzzy had no hair. Fuzzy Wuzzy wasn't very fuzzy, was he?",
  "Betty Botter bought some butter, but she said the butter's bitter.",
  "If a dog chews shoes, whose shoes does he choose?",
  "Black bug bit a big black bear. But where is the big black bear that the black bug bit?",
  "Six slick slim slippery snakes.",
  "Which wristwatch is a Swiss wristwatch?",
  "Toy boat, toy boat, toy boat.",
  "A proper copper coffee pot.",
  "A skunk sat on a stump and thunk the stump stunk, but the stump thunk the skunk stunk.",
  "How can a clam cram in a clean cream can?",
];

export default {
  command: 'twister',
  aliases: ['tonguetwister', 'tt'],
  category: 'fun',
  description: 'Get a tongue twister challenge',
  usage: '.twister',
  async handler(sock, message, args, context) {
    const { chatId } = context;
    const twister = TWISTERS[Math.floor(Math.random() * TWISTERS.length)];
    await sock.sendMessage(chatId, {
      text: `👅 *Tongue Twister Challenge!*\n\nSay this 3 times fast:\n\n_"${twister}"_\n\n😂 Good luck!`
    }, { quoted: message });
  }
};
