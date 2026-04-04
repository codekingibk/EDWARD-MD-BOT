const MAPS = {
  smallcaps: 'aᵃbᵇcᶜdᵈeᵉfᶠgᵍhʰiⁱjʲkᵏlˡmᵐnⁿoᵒpᵖqqrʳsˢtᵗuᵘvᵛwʷxˣyʸzᶻ',
  bubble: '⓪①②③④⑤⑥⑦⑧⑨𝐚𝐛𝐜𝐝𝐞𝐟𝐠𝐡𝐢𝐣𝐤𝐥𝐦𝐧𝐨𝐩𝐪𝐫𝐬𝐭𝐮𝐯𝐰𝐱𝐲𝐳',
  cursive: '𝒶𝒷𝒸𝒹𝑒𝒻𝑔𝒽𝒾𝒿𝓀𝓁𝓂𝓃𝑜𝓅𝓆𝓇𝓈𝓉𝓊𝓋𝓌𝓍𝓎𝓏',
  bold: '𝗮𝗯𝗰𝗱𝗲𝗳𝗴𝗵𝗶𝗷𝗸𝗹𝗺𝗻𝗼𝗽𝗾𝗿𝘀𝘁𝘂𝘃𝘄𝘅𝘆𝘇',
  italic: '𝘢𝘣𝘤𝘥𝘦𝘧𝘨𝘩𝘪𝘫𝘬𝘭𝘮𝘯𝘰𝘱𝘲𝘳𝘴𝘵𝘶𝘷𝘸𝘹𝘺𝘻',
  mono: '𝚊𝚋𝚌𝚍𝚎𝚏𝚐𝚑𝚒𝚓𝚔𝚕𝚖𝚗𝚘𝚙𝚚𝚛𝚜𝚝𝚞𝚟𝚠𝚡𝚢𝚣',
  gothic: '𝔞𝔟𝔠𝔡𝔢𝔣𝔤𝔥𝔦𝔧𝔨𝔩𝔪𝔫𝔬𝔭𝔮𝔯𝔰𝔱𝔲𝔳𝔴𝔵𝔶𝔷',
  double: '𝕒𝕓𝕔𝕕𝕖𝕗𝕘𝕙𝕚𝕛𝕜𝕝𝕞𝕟𝕠𝕡𝕢𝕣𝕤𝕥𝕦𝕧𝕨𝕩𝕪𝕫',
  square: '🄰🄱🄲🄳🄴🄵🄶🄷🄸🄹🄺🄻🄼🄽🄾🄿🅀🅁🅂🅃🅄🅅🅆🅇🅈🅉',
};

function transformText(text, map) {
  const alpha = 'abcdefghijklmnopqrstuvwxyz';
  const chars = [...map];
  return [...text.toLowerCase()].map(c => {
    const i = alpha.indexOf(c);
    return i >= 0 && chars[i] ? chars[i] : c;
  }).join('');
}

function bubbleText(text) {
  const alpha = 'abcdefghijklmnopqrstuvwxyz';
  const bubbles = ['ⓐ','ⓑ','ⓒ','ⓓ','ⓔ','ⓕ','ⓖ','ⓗ','ⓘ','ⓙ','ⓚ','ⓛ','ⓜ','ⓝ','ⓞ','ⓟ','ⓠ','ⓡ','ⓢ','ⓣ','ⓤ','ⓥ','ⓦ','ⓧ','ⓨ','ⓩ'];
  const nums = ['⓪','①','②','③','④','⑤','⑥','⑦','⑧','⑨'];
  return [...text.toLowerCase()].map(c => {
    const i = alpha.indexOf(c);
    if (i >= 0) return bubbles[i];
    const n = '0123456789'.indexOf(c);
    if (n >= 0) return nums[n];
    return c;
  }).join('');
}

function smallcapsText(text) {
  const map = {a:'ᴀ',b:'ʙ',c:'ᴄ',d:'ᴅ',e:'ᴇ',f:'ꜰ',g:'ɢ',h:'ʜ',i:'ɪ',j:'ᴊ',k:'ᴋ',l:'ʟ',m:'ᴍ',n:'ɴ',o:'ᴏ',p:'ᴘ',q:'Q',r:'ʀ',s:'ꜱ',t:'ᴛ',u:'ᴜ',v:'ᴠ',w:'ᴡ',x:'x',y:'ʏ',z:'ᴢ'};
  return [...text.toLowerCase()].map(c => map[c] || c).join('');
}

function zalgoText(text) {
  const zalgoUp = ['̍','̎','̄','̅','̿','̑','̆','̐','͒','͗','͑','̇','̈','̊','͂','̓','̈́','͊','͋','͌','̃','̂','̌','͐','̀','́','̋','̏','̒','̓','̔','̽','̉','ͣ','ͤ','ͥ','ͦ','ͧ','ͨ','ͩ','ͪ','ͫ','ͬ','ͭ','ͮ','ͯ','̾','͛','͆','̚'];
  return [...text].map(c => {
    if (c === ' ') return c;
    let r = c;
    const n = Math.floor(Math.random() * 4) + 1;
    for (let i = 0; i < n; i++) r += zalgoUp[Math.floor(Math.random() * zalgoUp.length)];
    return r;
  }).join('');
}

function piglatin(text) {
  return text.split(' ').map(w => {
    const vowels = 'aeiouAEIOU';
    if (!w.match(/[a-zA-Z]/)) return w;
    if (vowels.includes(w[0])) return w + 'yay';
    let i = 0;
    while (i < w.length && !vowels.includes(w[i])) i++;
    return w.slice(i) + w.slice(0, i) + 'ay';
  }).join(' ');
}

function mock(text) {
  return [...text].map((c, i) => i % 2 === 0 ? c.toUpperCase() : c.toLowerCase()).join('');
}

function uwuify(text) {
  return text
    .replace(/r/g, 'w').replace(/R/g, 'W')
    .replace(/l/g, 'w').replace(/L/g, 'W')
    .replace(/n([aeiou])/g, 'ny$1').replace(/N([aeiou])/gi, 'Ny$1')
    .replace(/ove/g, 'uv')
    .replace(/!/g, ' owo!').replace(/\?/g, ' uwu?')
    .replace(/th/g, 'd').replace(/Th/g, 'D');
}

function vaporwave(text) {
  const alpha = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const full  = 'ａｂｃｄｅｆｇｈｉｊｋｌｍｎｏｐｑｒｓｔｕｖｗｘｙｚＡＢＣＤＥＦＧＨＩＪＫＬＭＮＯＰＱＲＳＴＵＶＷＸＹＺ０１２３４５６７８９';
  return [...text].map(c => {
    const i = alpha.indexOf(c);
    return i >= 0 ? [...full][i] : c;
  }).join('');
}

function creepify(text) { return zalgoText(text); }

function strikethru(text) {
  return [...text].map(c => c + '\u0336').join('');
}

function camelCase(text) {
  return text.toLowerCase().split(/\s+/).map((w, i) => i === 0 ? w : w[0].toUpperCase() + w.slice(1)).join('');
}

function snakeCase(text) { return text.toLowerCase().replace(/\s+/g, '_'); }
function kebabCase(text) { return text.toLowerCase().replace(/\s+/g, '-'); }

function reverseWords(text) { return text.split(' ').reverse().join(' '); }

function repeatText(text, n) {
  const times = Math.min(parseInt(n) || 3, 10);
  return Array(times).fill(text).join('\n');
}

function countChars(text) {
  const letters = (text.match(/[a-zA-Z]/g) || []).length;
  const digits = (text.match(/\d/g) || []).length;
  const spaces = (text.match(/\s/g) || []).length;
  const words = text.trim().split(/\s+/).length;
  return { total: text.length, letters, digits, spaces, words };
}

function sortWords(text) {
  return text.split(/\s+/).sort().join(' ');
}

function reverseEach(text) {
  return text.split(' ').map(w => [...w].reverse().join('')).join(' ');
}

function rot13(text) {
  return text.replace(/[a-zA-Z]/g, c => {
    const base = c <= 'Z' ? 65 : 97;
    return String.fromCharCode(((c.charCodeAt(0) - base + 13) % 26) + base);
  });
}

function leet(text) {
  const map = {a:'4',e:'3',i:'1',o:'0',s:'5',t:'7',b:'8',g:'9',l:'1'};
  return [...text.toLowerCase()].map(c => map[c] || c).join('');
}

function nato(text) {
  const nato = {a:'Alpha',b:'Bravo',c:'Charlie',d:'Delta',e:'Echo',f:'Foxtrot',g:'Golf',h:'Hotel',i:'India',j:'Juliet',k:'Kilo',l:'Lima',m:'Mike',n:'November',o:'Oscar',p:'Papa',q:'Quebec',r:'Romeo',s:'Sierra',t:'Tango',u:'Uniform',v:'Victor',w:'Whiskey',x:'X-ray',y:'Yankee',z:'Zulu'};
  return [...text.toLowerCase()].map(c => nato[c] || (c === ' ' ? '/' : c.toUpperCase())).join(' ');
}

function wordScramble(text) {
  return text.split(' ').map(w => {
    if (w.length <= 3) return w;
    const mid = [...w.slice(1, -1)];
    for (let i = mid.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [mid[i], mid[j]] = [mid[j], mid[i]];
    }
    return w[0] + mid.join('') + w[w.length - 1];
  }).join(' ');
}

function palindrome(text) {
  const clean = text.replace(/[^a-z0-9]/gi, '').toLowerCase();
  return clean === [...clean].reverse().join('') ? `✅ "${text}" IS a palindrome!` : `❌ "${text}" is NOT a palindrome.`;
}

function titleCase(text) {
  return text.replace(/\w\S*/g, w => w[0].toUpperCase() + w.slice(1).toLowerCase());
}

function unique(text) {
  const words = text.split(/\s+/);
  return [...new Set(words)].join(' ');
}

function anagram(text) {
  const words = text.split(' ');
  if (words.length === 2) {
    const a = words[0].toLowerCase().split('').sort().join('');
    const b = words[1].toLowerCase().split('').sort().join('');
    return a === b ? `✅ "${words[0]}" and "${words[1]}" ARE anagrams!` : `❌ "${words[0]}" and "${words[1]}" are NOT anagrams.`;
  }
  return [...text].sort(() => Math.random() - 0.5).join('');
}

function shuffle(text) {
  const words = text.split(' ');
  for (let i = words.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [words[i], words[j]] = [words[j], words[i]];
  }
  return words.join(' ');
}

function expand(text) {
  return [...text].join(' ');
}

function upside_down(text) {
  const map = {a:'ɐ',b:'q',c:'ɔ',d:'p',e:'ǝ',f:'ɟ',g:'ƃ',h:'ɥ',i:'ᴉ',j:'ɾ',k:'ʞ',l:'l',m:'ɯ',n:'u',o:'o',p:'d',q:'b',r:'ɹ',s:'s',t:'ʇ',u:'n',v:'ʌ',w:'ʍ',x:'x',y:'ʎ',z:'z',' ':' '};
  return [...text.toLowerCase()].map(c => map[c] || c).reverse().join('');
}

const makeHandler = (fn, label) => async (sock, msg, args, ctx) => {
  const text = args.join(' ');
  if (!text) return sock.sendMessage(ctx.chatId, { text: `❌ Usage: .${ctx.command} <text>` }, { quoted: msg });
  await sock.sendMessage(ctx.chatId, { text: `${label}\n${fn(text)}` }, { quoted: msg });
};

export default [
  { command: 'smallcaps', aliases: ['sc'], category: 'text', description: 'Convert text to small caps', usage: '.smallcaps <text>', handler: makeHandler(smallcapsText, '🔡 *Small Caps:*') },
  { command: 'bubble', aliases: ['bubbletext'], category: 'text', description: 'Convert text to bubble letters', usage: '.bubble <text>', handler: makeHandler(bubbleText, '🫧 *Bubble Text:*') },
  { command: 'cursive', aliases: ['script'], category: 'text', description: 'Convert text to cursive', usage: '.cursive <text>', handler: makeHandler(t => transformText(t, MAPS.cursive), '📝 *Cursive:*') },
  { command: 'bold2', aliases: ['mathbold'], category: 'text', description: 'Bold math font', usage: '.bold2 <text>', handler: makeHandler(t => transformText(t, MAPS.bold), '**Bold:**') },
  { command: 'italic2', aliases: ['mathitalic'], category: 'text', description: 'Italic math font', usage: '.italic2 <text>', handler: makeHandler(t => transformText(t, MAPS.italic), '✍️ *Italic:*') },
  { command: 'mono', aliases: ['monospace'], category: 'text', description: 'Convert to monospace font', usage: '.mono <text>', handler: makeHandler(t => transformText(t, MAPS.mono), '💻 *Monospace:*') },
  { command: 'gothic', aliases: ['fraktur'], category: 'text', description: 'Convert to gothic font', usage: '.gothic <text>', handler: makeHandler(t => transformText(t, MAPS.gothic), '🏰 *Gothic:*') },
  { command: 'double', aliases: ['doublestruck'], category: 'text', description: 'Double-struck text', usage: '.double <text>', handler: makeHandler(t => transformText(t, MAPS.double), '𝔻 *Double Struck:*') },
  { command: 'spack', aliases: ['space'], category: 'text', description: 'Spaced-out text', usage: '.spack <text>', handler: makeHandler(expand, '🅢 *Spaced:*') },
  { command: 'vaporwave', aliases: ['vapor'], category: 'text', description: 'Convert to vaporwave text', usage: '.vaporwave <text>', handler: makeHandler(vaporwave, '🌊 *Vaporwave:*') },
  { command: 'zalgo', aliases: ['creepify'], category: 'text', description: 'Zalgo corrupted text', usage: '.zalgo <text>', handler: makeHandler(zalgoText, '👁️ *Zalgo:*') },
  { command: 'piglatin', alias: ['pig'], category: 'text', description: 'Convert to Pig Latin', usage: '.piglatin <text>', handler: makeHandler(piglatin, '🐷 *Pig Latin:*') },
  { command: 'mock', aliases: ['spongebob'], category: 'text', description: 'Mock/spongebob text', usage: '.mock <text>', handler: makeHandler(mock, '🧽 *MoCkInG:*') },
  { command: 'uwuify', aliases: ['uwu2'], category: 'text', description: 'UwUify text', usage: '.uwuify <text>', handler: makeHandler(uwuify, '🐱 *UwU:*') },
  { command: 'strike2', aliases: ['strikethrough'], category: 'text', description: 'Strikethrough text', usage: '.strike2 <text>', handler: makeHandler(strikethru, '~~Strikethrough:~~') },
  { command: 'camel', aliases: ['camelcase'], category: 'text', description: 'camelCase text', usage: '.camel <text>', handler: makeHandler(camelCase, '🐪 *camelCase:*') },
  { command: 'snake', aliases: ['snakecase'], category: 'text', description: 'snake_case text', usage: '.snake <text>', handler: makeHandler(snakeCase, '🐍 *snake_case:*') },
  { command: 'titlecase', aliases: ['title'], category: 'text', description: 'Title Case text', usage: '.titlecase <text>', handler: makeHandler(titleCase, '📰 *Title Case:*') },
  { command: 'rot13', aliases: ['rot'], category: 'text', description: 'ROT13 encode/decode', usage: '.rot13 <text>', handler: makeHandler(rot13, '🔄 *ROT13:*') },
  { command: 'leet', aliases: ['l33t', 'leetspeak2'], category: 'text', description: '1337 leet speak', usage: '.leet <text>', handler: makeHandler(leet, '💻 *L33T:*') },
  { command: 'nato', aliases: ['phonetic2'], category: 'text', description: 'NATO phonetic alphabet', usage: '.nato <text>', handler: makeHandler(nato, '✈️ *NATO Alphabet:*') },
  { command: 'palindrome', aliases: ['ispalindrome'], category: 'text', description: 'Check if text is palindrome', usage: '.palindrome <text>', handler: makeHandler(palindrome, '') },
  { command: 'anagram', aliases: ['isanagram'], category: 'text', description: 'Check/make anagram', usage: '.anagram word1 word2', handler: makeHandler(anagram, '🔀 *Anagram:*') },
  { command: 'shuffle', aliases: ['shufflewords'], category: 'text', description: 'Shuffle words randomly', usage: '.shuffle <text>', handler: makeHandler(shuffle, '🔀 *Shuffled:*') },
  { command: 'sortwords', aliases: ['wordsort'], category: 'text', description: 'Sort words alphabetically', usage: '.sortwords <text>', handler: makeHandler(sortWords, '🔤 *Sorted:*') },
  { command: 'unique', aliases: ['dedupe'], category: 'text', description: 'Remove duplicate words', usage: '.unique <text>', handler: makeHandler(unique, '✨ *Unique Words:*') },
  { command: 'countchars', aliases: ['charcount'], category: 'text', description: 'Count characters/words', usage: '.countchars <text>',
    async handler(sock, msg, args, ctx) {
      const text = args.join(' ');
      if (!text) return sock.sendMessage(ctx.chatId, { text: '❌ Usage: .countchars <text>' }, { quoted: msg });
      const s = countChars(text);
      await sock.sendMessage(ctx.chatId, {
        text: `📊 *Text Statistics*\n\n📝 Total: ${s.total}\n🔤 Letters: ${s.letters}\n🔢 Digits: ${s.digits}\n🔵 Spaces: ${s.spaces}\n📖 Words: ${s.words}`
      }, { quoted: msg });
    }
  },
  { command: 'upside', aliases: ['flip2'], category: 'text', description: 'Flip text upside down', usage: '.upside <text>', handler: makeHandler(upside_down, '🙃 *Upside Down:*') },
  { command: 'abbrev', aliases: ['acronym'], category: 'text', description: 'Make acronym from phrase', usage: '.abbrev <phrase>',
    async handler(sock, msg, args, ctx) {
      const text = args.join(' ');
      if (!text) return sock.sendMessage(ctx.chatId, { text: '❌ Usage: .abbrev <phrase>' }, { quoted: msg });
      const acr = text.split(/\s+/).map(w => w[0]?.toUpperCase() || '').join('');
      await sock.sendMessage(ctx.chatId, { text: `🔤 *Acronym:* ${acr}` }, { quoted: msg });
    }
  },
  { command: 'wordcount', aliases: ['wcount'], category: 'text', description: 'Count words in text', usage: '.wordcount <text>',
    async handler(sock, msg, args, ctx) {
      const text = args.join(' ');
      if (!text) return sock.sendMessage(ctx.chatId, { text: '❌ Usage: .wordcount <text>' }, { quoted: msg });
      const words = text.trim().split(/\s+/).length;
      const chars = text.length;
      const sentences = (text.match(/[.!?]+/g) || []).length || 1;
      await sock.sendMessage(ctx.chatId, {
        text: `📝 *Word Count*\n\n📖 Words: ${words}\n🔤 Characters: ${chars}\n📄 Sentences: ~${sentences}`
      }, { quoted: msg });
    }
  },
];
