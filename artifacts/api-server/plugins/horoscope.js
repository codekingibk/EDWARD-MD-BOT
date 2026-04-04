const SIGNS = {
  aries: { emoji: '♈', dates: 'Mar 21 – Apr 19' },
  taurus: { emoji: '♉', dates: 'Apr 20 – May 20' },
  gemini: { emoji: '♊', dates: 'May 21 – Jun 20' },
  cancer: { emoji: '♋', dates: 'Jun 21 – Jul 22' },
  leo: { emoji: '♌', dates: 'Jul 23 – Aug 22' },
  virgo: { emoji: '♍', dates: 'Aug 23 – Sep 22' },
  libra: { emoji: '♎', dates: 'Sep 23 – Oct 22' },
  scorpio: { emoji: '♏', dates: 'Oct 23 – Nov 21' },
  sagittarius: { emoji: '♐', dates: 'Nov 22 – Dec 21' },
  capricorn: { emoji: '♑', dates: 'Dec 22 – Jan 19' },
  aquarius: { emoji: '♒', dates: 'Jan 20 – Feb 18' },
  pisces: { emoji: '♓', dates: 'Feb 19 – Mar 20' },
};

const HOROSCOPES = [
  "Today brings opportunities for growth. Trust your instincts and take calculated risks.",
  "Your communication skills are highlighted today. Speak your truth with confidence.",
  "Focus on your personal projects. Your creativity is at its peak right now.",
  "Relationships take center stage today. Nurture your connections with care and honesty.",
  "Financial matters require attention. Be mindful of your spending and long-term goals.",
  "A challenge you face today will become a blessing in disguise. Stay patient.",
  "Your leadership qualities shine today. Others look to you for guidance and inspiration.",
  "Self-care is essential today. Rest, recharge, and reconnect with what matters most.",
  "An unexpected opportunity may arrive. Keep your eyes open and your mind flexible.",
  "Your hard work is about to pay off. Keep pushing forward with determination.",
];

const LOVE = ['★★★★★','★★★★☆','★★★☆☆','★★☆☆☆','★☆☆☆☆'];
const MONEY = ['💰💰💰','💰💰💿','💰💿💿','💿💿💿'];
const HEALTH = ['💪 Excellent','🏃 Good','😊 Average','😴 Rest needed'];

export default {
  command: 'horoscope',
  aliases: ['astro', 'zodiac', 'star'],
  category: 'fun',
  description: 'Get your daily horoscope by zodiac sign',
  usage: '.horoscope <sign>',
  async handler(sock, message, args, context) {
    const { chatId } = context;
    const sign = (args[0] || '').toLowerCase();
    const allSigns = Object.keys(SIGNS).join(', ');
    if (!sign || !SIGNS[sign]) {
      return sock.sendMessage(chatId, {
        text: `♓ *Horoscope*\n\nProvide your zodiac sign!\nAvailable signs:\n${allSigns}\n\nExample: .horoscope leo`
      }, { quoted: message });
    }
    const { emoji, dates } = SIGNS[sign];
    const reading = HOROSCOPES[Math.floor(Math.random() * HOROSCOPES.length)];
    const love = LOVE[Math.floor(Math.random() * LOVE.length)];
    const money = MONEY[Math.floor(Math.random() * MONEY.length)];
    const health = HEALTH[Math.floor(Math.random() * HEALTH.length)];
    const lucky = Math.floor(Math.random() * 99) + 1;
    const colors = ['Red','Blue','Green','Gold','Purple','Silver','Orange','Pink'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    await sock.sendMessage(chatId, {
      text: `${emoji} *${sign.charAt(0).toUpperCase() + sign.slice(1)} Horoscope*\n` +
        `📅 ${dates}\n\n` +
        `📖 ${reading}\n\n` +
        `❤️ Love   : ${love}\n` +
        `${money} Money  : ${money}\n` +
        `💊 Health : ${health}\n` +
        `🍀 Lucky #: ${lucky}\n` +
        `🎨 Color  : ${color}`
    }, { quoted: message });
  }
};
