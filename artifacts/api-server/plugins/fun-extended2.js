import { readFileSync, writeFileSync, existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_FILE = path.join(__dirname, '..', 'data', 'economy.json');
function loadDB() { try { return existsSync(DB_FILE) ? JSON.parse(readFileSync(DB_FILE, 'utf8')) : {}; } catch { return {}; } }
function saveDB(db) { try { writeFileSync(DB_FILE, JSON.stringify(db, null, 2)); } catch {} }
function getUser(db, jid) {
  if (!db[jid]) db[jid] = { coins: 0, lastDaily: 0, totalEarned: 0, lastWork: 0, lastMine: 0, lastFish: 0, lastHunt: 0, xp: 0, level: 1, bio: '', inventory: {} };
  if (!db[jid].xp) db[jid].xp = 0;
  if (!db[jid].level) db[jid].level = 1;
  if (!db[jid].inventory) db[jid].inventory = {};
  return db[jid];
}

const r = (arr) => arr[Math.floor(Math.random() * arr.length)];

const iqResults = [
  [0,69,'🤦 *Below Average* — You may need some more brainstorming.'],
  [70,89,'📚 *Average* — You\'re doing just fine!'],
  [90,109,'🧠 *Above Average* — Pretty sharp!'],
  [110,129,'💡 *Bright* — Your brain is firing on all cylinders!'],
  [130,149,'🔬 *Gifted* — You\'re in the top 2% of people!'],
  [150,200,'🚀 *Genius Level* — Einstein would be proud!'],
];

const hackerLines = [
  'Bypassing firewall...','Injecting payload...','Decrypting RSA-4096...','Accessing mainframe...','Deploying trojan horse...','Brute-forcing password...','Spoofing MAC address...','Routing through TOR...','Cloning session token...','Escalating privileges...','Extracting database dumps...','Overriding admin credentials...','Disabling antivirus...','Opening backdoor shell...','Exfiltrating data...',
];

const horoscopeData = {
  aries: '♈ *Aries (Mar 21 – Apr 19)*\nToday brings fiery energy your way. A bold decision leads to unexpected rewards. Trust your instincts.',
  taurus: '♉ *Taurus (Apr 20 – May 20)*\nPractical thinking wins today. Financial opportunities knock — be ready to answer. Comfort and stability are your allies.',
  gemini: '♊ *Gemini (May 21 – Jun 20)*\nCommunication flows freely today. Express your ideas boldly. A conversation opens exciting new doors.',
  cancer: '♋ *Cancer (Jun 21 – Jul 22)*\nEmotions run deep today. Nurture your relationships. A loving gesture brings joy to everyone around you.',
  leo: '♌ *Leo (Jul 23 – Aug 22)*\nAll eyes are on you! Your charisma is magnetic. Step into the spotlight — today is your day to shine.',
  virgo: '♍ *Virgo (Aug 23 – Sep 22)*\nPay attention to details. An organized approach unlocks success today. Health and wellness are highlighted.',
  libra: '♎ *Libra (Sep 23 – Oct 22)*\nBalance is key. Fairness guides your decisions. Romantic energy is in the air — embrace beauty and harmony.',
  scorpio: '♏ *Scorpio (Oct 23 – Nov 21)*\nDeep intuition guides you. A mystery unravels in your favor. Transformation brings unexpected power.',
  sagittarius: '♐ *Sagittarius (Nov 22 – Dec 21)*\nAdventure calls! Expand your horizons. A journey — physical or mental — brings profound insight.',
  capricorn: '♑ *Capricorn (Dec 22 – Jan 19)*\nDiscipline pays off. Hard work is rewarded handsomely. Career achievements are within your reach.',
  aquarius: '♒ *Aquarius (Jan 20 – Feb 18)*\nInnovate and inspire. Your unique perspective changes everything. Community and friendship bring fulfillment.',
  pisces: '♓ *Pisces (Feb 19 – Mar 20)*\nIntuition is your superpower today. Creative energy flows. Dreams carry important messages — listen closely.',
};

const zodiacSigns = [
  {name:'capricorn',start:[12,22],end:[1,19]},{name:'aquarius',start:[1,20],end:[2,18]},{name:'pisces',start:[2,19],end:[3,20]},
  {name:'aries',start:[3,21],end:[4,19]},{name:'taurus',start:[4,20],end:[5,20]},{name:'gemini',start:[5,21],end:[6,20]},
  {name:'cancer',start:[6,21],end:[7,22]},{name:'leo',start:[7,23],end:[8,22]},{name:'virgo',start:[8,23],end:[9,22]},
  {name:'libra',start:[9,23],end:[10,22]},{name:'scorpio',start:[10,23],end:[11,21]},{name:'sagittarius',start:[11,22],end:[12,21]},
];

function getZodiac(day, month) {
  for (const s of zodiacSigns) {
    const [sm, sd] = s.start; const [em, ed] = s.end;
    if ((month === sm && day >= sd) || (month === em && day <= ed)) return s.name;
  }
  return 'aries';
}

const ships = [
  ['🔥 SOULMATES!', 99],['💞 Perfect Match!', 90],['💕 Great Pair!', 80],['😊 Good Together!', 70],
  ['🙃 It\'s Complicated', 55],['😬 Not the best match...', 35],['💔 Opposites, but who knows?', 20],['😅 RUN!', 5],
];

export default [
  {
    command: 'iq', aliases: ['braintest'],
    category: 'fun', description: 'Check your IQ score', usage: '.iq',
    async handler(sock, msg, args, ctx) {
      const iqScore = Math.floor(Math.random() * 120) + 70;
      const result = iqResults.find(([min, max]) => iqScore >= min && iqScore <= max);
      await sock.sendMessage(ctx.chatId, {
        text: `🧠 *IQ Test Results*\n\n📊 Your IQ: *${iqScore}*\n\n${result ? result[2] : '🤔 Off the charts!'}\n\n_Results are for fun only!_`
      }, { quoted: msg });
    }
  },
  {
    command: 'aura', aliases: ['aurascore'],
    category: 'fun', description: 'Check your aura level', usage: '.aura',
    async handler(sock, msg, args, ctx) {
      const auras = ['🔴 Passionate Red — Bold and unstoppable!','🟠 Energetic Orange — Creative and driven!','🟡 Bright Yellow — Joyful and optimistic!','🟢 Calming Green — Balanced and peaceful!','🔵 Deep Blue — Wise and intuitive!','🟣 Mysterious Purple — Magical and spiritual!','🩷 Pure Pink — Loving and compassionate!','⚡ Electric White — Pure cosmic energy!','🖤 Dark Aura — Complex and powerful!','✨ Golden Aura — Divine and radiant!'];
      const pct = Math.floor(Math.random() * 40) + 60;
      await sock.sendMessage(ctx.chatId, { text: `✨ *Aura Reading*\n\n${r(auras)}\n\n_Intensity: ${pct}%_` }, { quoted: msg });
    }
  },
  {
    command: 'lovecalc', aliases: ['lovemeter','ship2'],
    category: 'fun', description: 'Calculate love percentage between two people', usage: '.lovecalc <name1> and <name2>',
    async handler(sock, msg, args, ctx) {
      const text = args.join(' ');
      const parts = text.split(/\s+and\s+/i);
      const a = parts[0]?.trim() || 'Person A';
      const b = parts[1]?.trim() || 'Person B';
      const hash = ([...a+b].reduce((s,c) => s + c.charCodeAt(0), 0) % 100);
      const pct = Math.max(5, Math.min(99, hash));
      const [label] = ships.find(([,threshold]) => pct >= threshold) || ships[ships.length - 1];
      const bar = '█'.repeat(Math.floor(pct / 10)) + '░'.repeat(10 - Math.floor(pct / 10));
      await sock.sendMessage(ctx.chatId, {
        text: `💘 *Love Calculator*\n\n*${a}* ❤️ *${b}*\n\n[${bar}] *${pct}%*\n\n${label}`
      }, { quoted: msg });
    }
  },
  {
    command: 'horoscope', aliases: ['zodiac2','stars'],
    category: 'fun', description: 'Get your horoscope', usage: '.horoscope <sign>',
    async handler(sock, msg, args, ctx) {
      const sign = args[0]?.toLowerCase();
      if (!sign) {
        const signs = Object.keys(horoscopeData).join(', ');
        return sock.sendMessage(ctx.chatId, { text: `♈ *Horoscope*\n\nUsage: .horoscope <sign>\n\nSigns: ${signs}` }, { quoted: msg });
      }
      const horo = horoscopeData[sign];
      if (!horo) return sock.sendMessage(ctx.chatId, { text: `❌ Unknown sign "${sign}". Try: aries, taurus, gemini, cancer, leo, virgo, libra, scorpio, sagittarius, capricorn, aquarius, pisces` }, { quoted: msg });
      const lucks = ['Spending time with loved ones 💕','Taking calculated risks 🎯','Creative projects 🎨','Physical exercise 🏃','Meditation and rest 🧘','Learning something new 📚','Making new connections 🤝'];
      const nums = Array.from({length: 3}, () => Math.floor(Math.random() * 9) + 1).join(', ');
      await sock.sendMessage(ctx.chatId, {
        text: `${horo}\n\n🍀 *Lucky Activity:* ${r(lucks)}\n🔢 *Lucky Numbers:* ${nums}\n📅 _${new Date().toDateString()}_`
      }, { quoted: msg });
    }
  },
  {
    command: 'hack2', aliases: ['fakehacker'],
    category: 'fun', description: 'Fake hacking animation', usage: '.hack2 @user',
    async handler(sock, msg, args, ctx) {
      const mentioned = msg?.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
      const target = mentioned ? `@${mentioned.split('@')[0].split(':')[0]}` : args.join(' ') || 'Target';
      const steps = hackerLines.slice(0, 8);
      const phone = `+${Math.floor(Math.random() * 9e11 + 1e11)}`;
      const ip = Array.from({length:4}, () => Math.floor(Math.random()*255)).join('.');
      await sock.sendMessage(ctx.chatId, {
        text: `💻 *HACKING: ${target}*\n\n` +
          steps.map((s, i) => `[${i < 6 ? '✅' : '⏳'}] ${s}`).join('\n') +
          `\n\n📍 IP: \`${ip}\`\n📱 Phone: \`${phone}\`\n\n_✅ Hack complete! (Just kidding 😄)_`,
        mentions: mentioned ? [mentioned] : []
      }, { quoted: msg });
    }
  },
  {
    command: 'couples', aliases: ['coupleship'],
    category: 'fun', description: 'Ship two people together', usage: '.couples @user1 @user2',
    async handler(sock, msg, args, ctx) {
      const mentions = msg?.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
      const [a, b] = mentions.length >= 2
        ? [mentions[0], mentions[1]]
        : [ctx.senderId, mentions[0] || ctx.senderId];
      const nameA = a.split('@')[0].split(':')[0];
      const nameB = b.split('@')[0].split(':')[0];
      const pct = Math.max(5, Math.min(99, ([...nameA+nameB].reduce((s,c) => s + c.charCodeAt(0), 0) % 95) + 5));
      const [label] = ships.find(([,t]) => pct >= t) || ships[ships.length-1];
      await sock.sendMessage(ctx.chatId, {
        text: `💑 *Couple Ship*\n\n@${nameA} + @${nameB}\n\n💕 Compatibility: *${pct}%*\n${label}`,
        mentions: [a, b]
      }, { quoted: msg });
    }
  },
  {
    command: 'simp', aliases: ['simpscore'],
    category: 'fun', description: 'Simp score meter', usage: '.simp',
    async handler(sock, msg, args, ctx) {
      const pct = Math.floor(Math.random() * 100) + 1;
      const levels = [[90,'😭 MAX SIMP LEVEL — You need help immediately.'],[70,'😅 Pretty simpy ngl...'],[50,'🙃 You\'re on the edge of simpdom.'],[30,'😌 Moderate simp. Keep it together!'],[0,'😎 Not a simp at all. Respect.']];
      const [,label] = levels.find(([t]) => pct >= t) || levels[levels.length-1];
      await sock.sendMessage(ctx.chatId, { text: `💘 *Simp Meter*\n\n${'💗'.repeat(Math.ceil(pct/10))}${'🖤'.repeat(10-Math.ceil(pct/10))}\n\nScore: *${pct}/100*\n${label}` }, { quoted: msg });
    }
  },
  {
    command: 'karma', aliases: ['karmascore'],
    category: 'fun', description: 'Check your karma level', usage: '.karma',
    async handler(sock, msg, args, ctx) {
      const { senderId } = ctx;
      const db = loadDB();
      const user = getUser(db, senderId);
      if (!user.karma) user.karma = Math.floor(Math.random() * 200) - 100;
      const k = user.karma;
      const label = k > 100 ? '😇 *Saint-level karma!* The universe loves you.' : k > 0 ? '😊 *Positive karma!* Good things are coming your way.' : k > -50 ? '😬 *Mixed karma.* Balance your actions.' : '😈 *Negative karma!* Time to make amends.';
      await sock.sendMessage(ctx.chatId, { text: `☯️ *Karma Check*\n\nKarma Points: *${k >= 0 ? '+' : ''}${k}*\n\n${label}` }, { quoted: msg });
    }
  },
  {
    command: 'liedetect', aliases: ['polygraph'],
    category: 'fun', description: 'Lie detector test', usage: '.liedetect <statement>',
    async handler(sock, msg, args, ctx) {
      const statement = args.join(' ');
      if (!statement) return sock.sendMessage(ctx.chatId, { text: '❌ Usage: .liedetect <statement>' }, { quoted: msg });
      const results = ['✅ *TRUTH!* — The polygraph shows no deception detected.','❌ *LIE!* — Elevated stress levels detected. You\'re fibbing!','🤔 *INCONCLUSIVE* — The results are mixed. Hmm...','😅 *MOSTLY TRUE* — A little white lie in there perhaps?','🔴 *ABSOLUTE LIE!* — Off the charts fabrication!'];
      await sock.sendMessage(ctx.chatId, { text: `🔍 *Lie Detector Test*\n\nStatement: _"${statement}"_\n\n📊 Analyzing...\n\n${r(results)}` }, { quoted: msg });
    }
  },
  {
    command: 'superpower', aliases: ['power','mypower'],
    category: 'fun', description: 'Discover your superpower', usage: '.superpower',
    async handler(sock, msg, args, ctx) {
      const powers = [
        '⚡ *Electrokinesis* — You control lightning and electricity!',
        '🔥 *Pyrokinesis* — Flames obey your command!',
        '🌊 *Hydrokinesis* — Water bends to your will!',
        '💨 *Aerokinesis* — You command the winds!',
        '🧊 *Cryokinesis* — You can freeze anything instantly!',
        '🧠 *Telepathy* — You can read and influence minds!',
        '⏰ *Time Manipulation* — You control the flow of time!',
        '🛡️ *Invulnerability* — Nothing can hurt you!',
        '🌱 *Phytokinesis* — You control all plant life!',
        '👻 *Intangibility* — You can phase through solid objects!',
        '🌀 *Dimensional Travel* — You can jump between realities!',
        '💫 *Gravity Manipulation* — You control gravity itself!',
      ];
      await sock.sendMessage(ctx.chatId, { text: `🦸 *Your Superpower*\n\n${r(powers)}\n\n_Use it wisely!_` }, { quoted: msg });
    }
  },
  {
    command: 'villain', aliases: ['myrole'],
    category: 'fun', description: 'What villain are you?', usage: '.villain',
    async handler(sock, msg, args, ctx) {
      const villains = [
        '🦅 *The Mastermind* — Cold, calculating, always 10 steps ahead.',
        '🔥 *The Destroyer* — Unstoppable force of pure chaos!',
        '🧪 *The Mad Scientist* — Brilliant but dangerously unstable.',
        '🐍 *The Manipulator* — Charm and deception are your weapons.',
        '💀 *The Warlord* — Power through fear and strength.',
        '🌑 *The Shadow* — Silent, unseen, deadly.',
        '🎭 *The Trickster* — Chaos and laughter are your tools.',
        '💰 *The Overlord* — Control through money and power.',
      ];
      await sock.sendMessage(ctx.chatId, { text: `😈 *Your Villain Role*\n\n${r(villains)}\n\n_Every hero needs a worthy opponent!_` }, { quoted: msg });
    }
  },
  {
    command: 'genshin', aliases: ['genshinchar'],
    category: 'fun', description: 'Get your Genshin character', usage: '.genshin',
    async handler(sock, msg, args, ctx) {
      const chars = ['Hu Tao 🌸 (Pyro)','Raiden Shogun ⚡ (Electro)','Zhongli 🪨 (Geo)','Venti 💨 (Anemo)','Ganyu ❄️ (Cryo)','Xiao 💚 (Anemo)','Kazuha 🍁 (Anemo)','Ayaka ❄️ (Cryo)','Nahida 🌿 (Dendro)','Neuvillette 🌊 (Hydro)','Arlecchino 🔥 (Pyro)','Furina 💧 (Hydro)'];
      await sock.sendMessage(ctx.chatId, { text: `🎮 *Your Genshin Character*\n\n✨ You are: *${r(chars)}*!\n\n_Go conquer Teyvat!_` }, { quoted: msg });
    }
  },
  {
    command: 'medicine', aliases: ['med2','symptom'],
    category: 'fun', description: 'Fake AI doctor diagnosis', usage: '.medicine <symptom>',
    async handler(sock, msg, args, ctx) {
      const symptom = args.join(' ') || 'unknown symptoms';
      const diagnoses = [
        'Acute procrastination syndrome — Rx: Get off your phone.',
        'Chronic overthinking disorder — Rx: Take a deep breath and relax.',
        'Severe FOMO (Fear of Missing Out) — Rx: Log off social media for 24 hours.',
        'Terminal laziness — Rx: 20-minute walk outside, stat!',
        'Mild hunger — Rx: Eat something! Seriously.',
        'Advanced phone addiction — Rx: Put the phone down.',
        'Existential crisis stage 3 — Rx: Talk to a friend. You\'ve got this.',
      ];
      await sock.sendMessage(ctx.chatId, { text: `🩺 *AI Doctor Diagnosis*\n\n🤒 Symptom: _${symptom}_\n\n📋 Diagnosis: ${r(diagnoses)}\n\n⚠️ _This is for entertainment only! See a real doctor for medical advice._` }, { quoted: msg });
    }
  },
  {
    command: 'fortune', aliases: ['fortunecookie'],
    category: 'fun', description: 'Get a fortune cookie message', usage: '.fortune',
    async handler(sock, msg, args, ctx) {
      const fortunes = [
        'A beautiful, smart, and loving person will be coming into your life.',
        'A dream you have will come true this week.',
        'Action speaks louder than words but not nearly as often.',
        'All the effort you are putting in will pay off soon.',
        'An unexpected encounter will prove very valuable to you.',
        'Do not be afraid to take a chance — the results may surprise you.',
        'Every day is a new beginning. Take a deep breath and start again.',
        'Good things come to those who act, not just those who wait.',
        'Help others and fortune will smile upon you.',
        'Your hard work is about to bear fruit.',
      ];
      const lucky = Array.from({length: 6}, () => Math.floor(Math.random() * 49) + 1).sort((a,b)=>a-b).join(', ');
      await sock.sendMessage(ctx.chatId, { text: `🥠 *Fortune Cookie*\n\n_"${r(fortunes)}"_\n\n🍀 Lucky numbers: ${lucky}` }, { quoted: msg });
    }
  },
];
