const ROASTS = [
  "You're like a cloud — when you disappear, it's a beautiful day.",
  "I'd roast you, but my mama told me not to burn trash.",
  "You're proof that even evolution can take a day off.",
  "If laughter is the best medicine, your face must be curing diseases.",
  "You're not stupid, you just have bad luck thinking.",
  "You're the reason shampoo bottles have instructions.",
  "I've met some pricks in my time, but you're a cactus.",
  "Your secrets are always safe with me. I never even listen when you tell me them.",
  "You're like a software update — nobody wants you but you keep appearing.",
  "You must have been born on a highway because that's where most accidents happen.",
  "You're like a parking ticket — nobody wants you and you ruin everyone's day.",
  "You have the right to remain silent because whatever you say will probably be stupid anyway.",
  "I would insult your intelligence, but I see that nature already did it.",
  "You're about as useful as the 'ueue' in 'queue'.",
  "I'd agree with you, but then we'd both be wrong.",
  "If you were any more inbred you'd be a sandwich.",
  "You're living proof that God has a sense of humor.",
  "You bring everyone so much joy when you leave the room.",
  "You're like a broken pencil... pointless.",
  "Please cancel my subscription to your issues.",
];

export default {
  command: 'roast',
  aliases: ['burnme', 'insultme'],
  category: 'fun',
  description: 'Get a funny roast (all in good fun!)',
  usage: '.roast [@mention]',
  async handler(sock, message, args, context) {
    const { chatId, senderId, message: msg } = context;
    const mentioned = msg?.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
    const target = mentioned
      ? `@${mentioned.split('@')[0].split(':')[0]}`
      : `@${senderId.split('@')[0].split(':')[0]}`;
    const roast = ROASTS[Math.floor(Math.random() * ROASTS.length)];
    await sock.sendMessage(chatId, {
      text: `🔥 *ROASTED!* 🔥\n\n${target}, ${roast.charAt(0).toLowerCase() + roast.slice(1)}\n\n_😂 Just kidding! All love!_`
    }, { quoted: message });
  }
};
