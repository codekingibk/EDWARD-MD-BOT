const reactionGifs = {
  hug:  ['https://media.giphy.com/media/3bqtLDeiDtwhq/giphy.gif','https://media.giphy.com/media/od5H3PmEG5EVq/giphy.gif','https://media.giphy.com/media/lrr9rHuoJOE0w/giphy.gif'],
  kiss: ['https://media.giphy.com/media/l2QDLujtcAvAr2gRa/giphy.gif','https://media.giphy.com/media/bGm9FuBCGg4SY/giphy.gif'],
  slap: ['https://media.giphy.com/media/uqSU9IEYEKAbS/giphy.gif','https://media.giphy.com/media/xUO4t2gkzaBXi/giphy.gif'],
  pat:  ['https://media.giphy.com/media/ARSp9T7wwxNcs/giphy.gif','https://media.giphy.com/media/5tmRHwTlHAA9WkX6Sg/giphy.gif'],
  bite: ['https://media.giphy.com/media/JIX9t2j0ZTN9S/giphy.gif','https://media.giphy.com/media/wr7oKMKEmmrry/giphy.gif'],
  poke: ['https://media.giphy.com/media/WvVzZ9mCyMjsc/giphy.gif'],
  dance:['https://media.giphy.com/media/l3V0sNZ0NGomeurCM/giphy.gif','https://media.giphy.com/media/13HBDT4QSTpveU/giphy.gif'],
  cry:  ['https://media.giphy.com/media/d2lcHJTG5Tscg/giphy.gif','https://media.giphy.com/media/HBfm5jN2BORU4/giphy.gif'],
  blush:['https://media.giphy.com/media/jJGSvXbHSxOpa/giphy.gif'],
  laugh:['https://media.giphy.com/media/TlK63EQERmiAVzMEgO4/giphy.gif','https://media.giphy.com/media/ZqlvCTNHpqrio/giphy.gif'],
  wave: ['https://media.giphy.com/media/l3q2Wl7bLxQAPWMla/giphy.gif'],
  shrug:['https://media.giphy.com/media/g0KNjNnLqklpEz11h9/giphy.gif'],
  facepalm:['https://media.giphy.com/media/XsUtdIeJ0MWMo/giphy.gif'],
  highfive:['https://media.giphy.com/media/WbT61gy0JUWOO/giphy.gif'],
};

const reactionMessages = {
  hug:      (sender, target) => target ? `🤗 *${sender}* gives ${target} a warm hug!` : `🤗 *${sender}* wants a hug!`,
  kiss:     (sender, target) => target ? `💋 *${sender}* kisses ${target}!` : `💋 *${sender}* blows a kiss!`,
  slap:     (sender, target) => target ? `👋 *${sender}* slaps ${target}!` : `👋 *${sender}* slaps the air!`,
  pat:      (sender, target) => target ? `🖐️ *${sender}* pats ${target}!` : `🖐️ *${sender}* is patting!`,
  bite:     (sender, target) => target ? `😤 *${sender}* bites ${target}!` : `😤 *${sender}* bites the air!`,
  poke:     (sender, target) => target ? `👉 *${sender}* pokes ${target}!` : `👉 *${sender}* pokes around!`,
  dance:    (sender, target) => target ? `💃 *${sender}* dances with ${target}!` : `💃 *${sender}* is dancing!`,
  cry:      (sender, target) => target ? `😢 *${sender}* cries because of ${target}!` : `😢 *${sender}* is crying...`,
  blush:    (sender, target) => target ? `😊 *${sender}* blushes at ${target}!` : `😊 *${sender}* is blushing!`,
  laugh:    (sender, target) => target ? `😂 *${sender}* laughs at ${target}!` : `😂 *${sender}* can't stop laughing!`,
  wave:     (sender, target) => target ? `👋 *${sender}* waves at ${target}!` : `👋 *${sender}* waves!`,
  shrug:    (sender, target) => `🤷 *${sender}* shrugs`,
  facepalm: (sender, target) => target ? `🤦 *${sender}* facepalms at ${target}` : `🤦 *${sender}* facepalms`,
  highfive: (sender, target) => target ? `🙌 *${sender}* high-fives ${target}!` : `🙌 *${sender}* wants a high five!`,
  cheer:    (sender, target) => target ? `🎉 *${sender}* cheers for ${target}!` : `🎉 *${sender}* is cheering!`,
  thumbsup: (sender, target) => target ? `👍 *${sender}* gives ${target} a thumbs up!` : `👍 Thumbs up!`,
  thumbsdown:(sender, target) => target ? `👎 *${sender}* gives ${target} a thumbs down!` : `👎 Thumbs down!`,
  ahug:     (sender, target) => target ? `💞 *${sender}* sends ${target} an anime hug!` : `💞 *${sender}* wants an anime hug!`,
};

function makeReaction(type) {
  return async (sock, msg, args, ctx) => {
    const { chatId, senderId } = ctx;
    const name = senderId.split('@')[0].split(':')[0];
    const mentioned = msg?.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
    const target = mentioned ? `@${mentioned.split('@')[0].split(':')[0]}` : null;
    const gifs = reactionGifs[type] || [];
    const gif = gifs[Math.floor(Math.random() * gifs.length)];
    const text = (reactionMessages[type] || ((s,t) => `${s} reacts!`))(name, target);
    await sock.sendMessage(chatId, { text }, { quoted: msg });
  };
}

const funFacts = [
  "A group of flamingos is called a flamboyance.",
  "Honey never spoils. Archaeologists found 3000-year-old honey in Egyptian tombs.",
  "Bananas are berries but strawberries aren't.",
  "A shrimp's heart is in its head.",
  "Cows have best friends and get stressed when separated.",
  "Octopuses have three hearts and blue blood.",
  "The unicorn is Scotland's national animal.",
  "A bolt of lightning contains enough energy to toast 100,000 slices of bread.",
  "The shortest war in history was between Britain and Zanzibar: 38 minutes.",
  "Cleopatra lived closer in time to the Moon landing than to the construction of the Great Pyramid.",
];

const pickupLines = [
  "Are you a Wi-Fi signal? Because I'm feeling a connection.",
  "Do you have a map? I keep getting lost in your eyes.",
  "Are you made of copper and tellurium? Because you're CuTe.",
  "Is your name Google? Because you have everything I've been searching for.",
  "Are you a time traveler? Because I can't imagine my future without you.",
  "Do you like Star Wars? Because Yoda one for me!",
  "Are you a magician? Because whenever I look at you, everyone else disappears.",
  "Can I follow you home? Cause my parents always told me to follow my dreams.",
  "I must be a snowflake, because I've fallen for you.",
];

const jokes = [
  "Why don't scientists trust atoms? Because they make up everything!",
  "Why did the scarecrow win an award? Because he was outstanding in his field!",
  "What do you call cheese that isn't yours? Nacho cheese!",
  "Why can't you give Elsa a balloon? Because she'll let it go!",
  "How do you make a tissue dance? Put a little boogie in it!",
  "I told my wife she was drawing her eyebrows too high. She looked surprised.",
  "Why did the bicycle fall over? Because it was two-tired!",
  "What do you call a fake noodle? An impasta!",
  "Why did the math book look so sad? Because it had too many problems.",
  "What do you call a lazy kangaroo? A pouch potato!",
];

const roasts = [
  "You're so slow, even a snail passed you and gave you a thumbs down.",
  "I'd agree with you, but then we'd both be wrong.",
  "You have the right to remain silent because whatever you say makes you sound dumb.",
  "If ignorance is bliss, you must be the happiest person alive.",
  "Your secrets are always safe with me. I never listen when you talk.",
  "I'd explain it to you, but I left my crayons at home.",
  "You're proof that evolution CAN go in reverse.",
  "If brains were taxed, you'd get a refund.",
  "Brains aren't everything. In fact in your case they're nothing.",
  "I don't know what makes you so dumb but it really works.",
];

const insults = [
  "You're as useless as the 'ueue' in 'queue'.",
  "The last time I saw something like you, I flushed it.",
  "I've been called worse things by better people.",
  "You're a 9.5 on the idiot scale — and the scale only goes to 10.",
  "I could eat alphabet soup and spit out smarter ideas than yours.",
];

const compliments = [
  "You're like a ray of sunshine on a cloudy day! ☀️",
  "You make the world a better place just by being in it! 💖",
  "Your smile could light up an entire city! 🌟",
  "You're one of a kind — and that's a rare gift! 🎁",
  "Everything you do makes the people around you feel special! 💝",
  "You have the warmest heart and the kindest soul! 🥰",
  "Your positivity is absolutely contagious! ✨",
  "The world is a much brighter place because you're in it! 🌈",
];

const dares = [
  "Send a voice note singing your favorite song for 30 seconds.",
  "Type with your eyes closed for the next 5 messages.",
  "Change your status to 'I love chicken nuggets' for 10 minutes.",
  "Tag someone and confess your weirdest habit.",
  "Send a heart emoji to the last 5 people in your contacts.",
  "Write a poem about a potato and share it in this chat.",
  "Do 10 push-ups right now and check back in when done.",
  "Send a voice message doing your best impression of a robot.",
];

const truths = [
  "What is your most embarrassing childhood memory?",
  "Have you ever lied to get out of trouble? What happened?",
  "What is the strangest dream you've ever had?",
  "What's the most embarrassing thing on your phone right now?",
  "Have you ever pretended to like a gift you hated?",
  "What is something you've never told anyone in this group?",
  "What's the most embarrassing thing you've ever done in public?",
  "If you could swap lives with anyone here, who would it be?",
];

const nhie = [
  "Never have I ever eaten an entire pizza by myself.",
  "Never have I ever accidentally called a teacher 'Mom'.",
  "Never have I ever stayed up all night on my phone.",
  "Never have I ever forgotten someone's name mid-conversation.",
  "Never have I ever stalked someone's old photos.",
  "Never have I ever laughed at a joke I didn't understand.",
  "Never have I ever ignored a text on purpose.",
  "Never have I ever fallen asleep in class.",
];

const wyr = [
  "Would you rather always speak in rhymes or sing everything you say?",
  "Would you rather be able to fly or be invisible?",
  "Would you rather lose your phone or your wallet for a week?",
  "Would you rather know how you die or when you die?",
  "Would you rather have unlimited pizza or unlimited sushi for life?",
  "Would you rather be the funniest person in the room or the smartest?",
  "Would you rather go back in time or see the future?",
  "Would you rather fight 100 duck-sized horses or one horse-sized duck?",
];

const r = (arr) => arr[Math.floor(Math.random() * arr.length)];

export default [
  { command: 'hug', aliases: ['ahug'], category: 'fun', description: 'Send a hug', usage: '.hug @user', handler: makeReaction('hug') },
  { command: 'kiss', aliases: ['smooch'], category: 'fun', description: 'Send a kiss', usage: '.kiss @user', handler: makeReaction('kiss') },
  { command: 'slap', aliases: ['smack'], category: 'fun', description: 'Slap someone', usage: '.slap @user', handler: makeReaction('slap') },
  { command: 'pat', aliases: ['headpat'], category: 'fun', description: 'Pat someone', usage: '.pat @user', handler: makeReaction('pat') },
  { command: 'bite', aliases: ['nibble'], category: 'fun', description: 'Bite someone', usage: '.bite @user', handler: makeReaction('bite') },
  { command: 'poke', aliases: ['nudge'], category: 'fun', description: 'Poke someone', usage: '.poke @user', handler: makeReaction('poke') },
  { command: 'dance', aliases: ['groove'], category: 'fun', description: 'Dance with someone', usage: '.dance', handler: makeReaction('dance') },
  { command: 'cry', aliases: ['sob', 'tears'], category: 'fun', description: 'Cry emoji reaction', usage: '.cry', handler: makeReaction('cry') },
  { command: 'blush', aliases: ['shy'], category: 'fun', description: 'Blush reaction', usage: '.blush', handler: makeReaction('blush') },
  { command: 'laugh', aliases: ['lol'], category: 'fun', description: 'Laugh reaction', usage: '.laugh', handler: makeReaction('laugh') },
  { command: 'wave', aliases: ['hi'], category: 'fun', description: 'Wave at someone', usage: '.wave @user', handler: makeReaction('wave') },
  { command: 'shrug', aliases: ['idk'], category: 'fun', description: 'Shrug reaction', usage: '.shrug', handler: makeReaction('shrug') },
  { command: 'facepalm', aliases: ['fp'], category: 'fun', description: 'Facepalm reaction', usage: '.facepalm', handler: makeReaction('facepalm') },
  { command: 'highfive', aliases: ['hi5'], category: 'fun', description: 'High-five someone', usage: '.highfive @user', handler: makeReaction('highfive') },
  { command: 'cheer', aliases: ['celebrate'], category: 'fun', description: 'Cheer for someone', usage: '.cheer @user', handler: makeReaction('cheer') },
  { command: 'thumbsup', aliases: ['approve'], category: 'fun', description: 'Give thumbs up', usage: '.thumbsup @user', handler: makeReaction('thumbsup') },
  { command: 'thumbsdown', aliases: ['disapprove'], category: 'fun', description: 'Give thumbs down', usage: '.thumbsdown @user', handler: makeReaction('thumbsdown') },
  {
    command: 'pickup', aliases: ['flirty2','rizz','pickupline'],
    category: 'fun', description: 'Random pickup line', usage: '.pickup',
    async handler(sock, msg, args, ctx) {
      await sock.sendMessage(ctx.chatId, { text: `💕 *Pickup Line*\n\n"${r(pickupLines)}"` }, { quoted: msg });
    }
  },
  {
    command: 'roast', aliases: ['roastme2'],
    category: 'fun', description: 'Roast someone', usage: '.roast @user',
    async handler(sock, msg, args, ctx) {
      const mentioned = msg?.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
      const target = mentioned ? `@${mentioned.split('@')[0].split(':')[0]}` : 'you';
      await sock.sendMessage(ctx.chatId, {
        text: `🔥 *Roast for ${target}*\n\n"${r(roasts)}"`,
        mentions: mentioned ? [mentioned] : []
      }, { quoted: msg });
    }
  },
  {
    command: 'insult', aliases: ['diss'],
    category: 'fun', description: 'Insult someone', usage: '.insult @user',
    async handler(sock, msg, args, ctx) {
      const mentioned = msg?.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
      const target = mentioned ? `@${mentioned.split('@')[0].split(':')[0]}` : 'you';
      await sock.sendMessage(ctx.chatId, {
        text: `😈 *Insult for ${target}*\n\n"${r(insults)}"`,
        mentions: mentioned ? [mentioned] : []
      }, { quoted: msg });
    }
  },
  {
    command: 'compliment', aliases: ['praise2','flattery'],
    category: 'fun', description: 'Compliment someone', usage: '.compliment @user',
    async handler(sock, msg, args, ctx) {
      const mentioned = msg?.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
      const target = mentioned ? `@${mentioned.split('@')[0].split(':')[0]}` : 'you';
      await sock.sendMessage(ctx.chatId, {
        text: `💝 *Compliment for ${target}*\n\n"${r(compliments)}"`,
        mentions: mentioned ? [mentioned] : []
      }, { quoted: msg });
    }
  },
  {
    command: 'dare', aliases: ['senddare'],
    category: 'fun', description: 'Random dare challenge', usage: '.dare',
    async handler(sock, msg, args, ctx) {
      await sock.sendMessage(ctx.chatId, { text: `😈 *DARE*\n\n${r(dares)}` }, { quoted: msg });
    }
  },
  {
    command: 'truth', aliases: ['sendq'],
    category: 'fun', description: 'Random truth question', usage: '.truth',
    async handler(sock, msg, args, ctx) {
      await sock.sendMessage(ctx.chatId, { text: `🤔 *TRUTH*\n\n${r(truths)}` }, { quoted: msg });
    }
  },
  {
    command: 'nhie', aliases: ['neverhave'],
    category: 'fun', description: 'Never have I ever', usage: '.nhie',
    async handler(sock, msg, args, ctx) {
      await sock.sendMessage(ctx.chatId, { text: `🙋 *Never Have I Ever*\n\n${r(nhie)}\n\n_React with 👍 if you HAVE or 👎 if you HAVEN'T!_` }, { quoted: msg });
    }
  },
  {
    command: 'wyr', aliases: ['wouldyourather2'],
    category: 'fun', description: 'Would you rather question', usage: '.wyr',
    async handler(sock, msg, args, ctx) {
      await sock.sendMessage(ctx.chatId, { text: `🤔 *Would You Rather?*\n\n${r(wyr)}` }, { quoted: msg });
    }
  },
  {
    command: 'animalfact', aliases: ['catfact2','dogfact2','funfact2'],
    category: 'fun', description: 'Random animal/fun fact', usage: '.animalfact',
    async handler(sock, msg, args, ctx) {
      await sock.sendMessage(ctx.chatId, { text: `🐾 *Random Fact*\n\n${r(funFacts)}` }, { quoted: msg });
    }
  },
  {
    command: 'serenade', aliases: ['sing','lovesong'],
    category: 'fun', description: 'Serenade someone with a love note', usage: '.serenade @user',
    async handler(sock, msg, args, ctx) {
      const mentioned = msg?.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
      const target = mentioned ? `@${mentioned.split('@')[0].split(':')[0]}` : args.join(' ') || 'the world';
      const songs = [
        `🎵 *Roses are red,*\n*Violets are blue,*\n*${target}, nobody is quite like you.* 🌹`,
        `🎵 *If I were a star,*\n*I'd shine just for you,*\n*${target}, my love forever true.* ⭐`,
        `🎵 *The moon lights the sky,*\n*My heart calls your name,*\n*${target}, things will never be the same.* 🌙`,
      ];
      await sock.sendMessage(ctx.chatId, {
        text: r(songs),
        mentions: mentioned ? [mentioned] : []
      }, { quoted: msg });
    }
  },
  {
    command: 'mood', aliases: ['vibecheck','myvibes'],
    category: 'fun', description: 'Check your mood', usage: '.mood',
    async handler(sock, msg, args, ctx) {
      const moods = ['😊 Happy vibes only!','😔 Feeling a bit blue today...','😤 Absolutely FIRED UP!','🥱 Running on zero energy...','🤩 On top of the world!','😌 Chill and content.','😂 Can\'t stop laughing!','🥺 Soft mood activated.','😈 Chaotic energy today.','🫶 Full of love!'];
      const percentage = Math.floor(Math.random() * 40) + 60;
      await sock.sendMessage(ctx.chatId, { text: `🎭 *Mood Check*\n\n${r(moods)}\n\n_Vibe level: ${percentage}%_ ✨` }, { quoted: msg });
    }
  },
];
