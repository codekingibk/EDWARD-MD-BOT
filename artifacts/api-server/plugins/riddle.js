const RIDDLES = [
  { q: "I have cities but no houses. I have mountains but no trees. I have water but no fish. I have roads but no cars. What am I?", a: "map" },
  { q: "The more you take, the more you leave behind. What am I?", a: "footsteps" },
  { q: "I speak without a mouth and hear without ears. I have no body, but I come alive with the wind. What am I?", a: "echo" },
  { q: "I'm light as a feather, yet the strongest person can't hold me for more than a few minutes. What am I?", a: "breath" },
  { q: "What has hands but can't clap?", a: "clock" },
  { q: "What has one eye but can't see?", a: "needle" },
  { q: "What gets wetter as it dries?", a: "towel" },
  { q: "I have keys but no locks. I have space but no room. You can enter but can't go inside. What am I?", a: "keyboard" },
  { q: "What runs but never walks, has a mouth but never talks, has a head but never weeps, has a bed but never sleeps?", a: "river" },
  { q: "The more of this there is, the less you see. What is it?", a: "darkness" },
  { q: "What comes once in a minute, twice in a moment, but never in a thousand years?", a: "letter m" },
  { q: "I go around the world but stay in a corner. What am I?", a: "stamp" },
  { q: "What has many teeth but can't bite?", a: "comb" },
  { q: "What has a neck but no head?", a: "bottle" },
  { q: "What tastes better than it smells?", a: "tongue" },
  { q: "What can you catch but not throw?", a: "cold" },
  { q: "I have branches but no fruit, trunk, or leaves. What am I?", a: "bank" },
  { q: "What is full of holes but still holds water?", a: "sponge" },
  { q: "What gets bigger when more is taken away?", a: "hole" },
  { q: "I'm tall when I'm young and short when I'm old. What am I?", a: "candle" },
];

const ACTIVE = new Map();

export default {
  command: 'riddle',
  aliases: ['brainteaser', 'puzzle'],
  category: 'fun',
  description: 'Get a brain teaser riddle to solve',
  usage: '.riddle',
  async handler(sock, message, args, context) {
    const { chatId, prefix } = context;
    if (ACTIVE.has(chatId)) {
      const g = ACTIVE.get(chatId);
      const guess = (args.join(' ') || '').toLowerCase().trim().replace(/[^a-z ]/g, '');
      if (guess && (guess === g.a || guess.includes(g.a) || g.a.includes(guess))) {
        ACTIVE.delete(chatId);
        return sock.sendMessage(chatId, {
          text: `🧠 *Brilliant!* You got it! The answer is: *${g.a}* 🎉`
        }, { quoted: message });
      } else if (args.length > 0) {
        if ((args[0] || '').toLowerCase() === 'answer') {
          ACTIVE.delete(chatId);
          return sock.sendMessage(chatId, { text: `💡 The answer is: *${g.a}*` }, { quoted: message });
        }
        return sock.sendMessage(chatId, { text: `❌ Not quite! Keep thinking...\n\n_Type ${prefix}riddle answer to reveal_` }, { quoted: message });
      }
    }
    const riddle = RIDDLES[Math.floor(Math.random() * RIDDLES.length)];
    ACTIVE.set(chatId, riddle);
    setTimeout(() => ACTIVE.delete(chatId), 120000);
    await sock.sendMessage(chatId, {
      text: `🧩 *RIDDLE TIME!*\n\n${riddle.q}\n\n_Think carefully and reply with your answer!_\nType ${prefix}riddle answer to give up`
    }, { quoted: message });
  }
};
