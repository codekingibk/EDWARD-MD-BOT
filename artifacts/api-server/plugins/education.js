const r = (arr) => arr[Math.floor(Math.random() * arr.length)];

const elements = {
  H: {name:'Hydrogen',mass:1.008,group:'Nonmetal'},He:{name:'Helium',mass:4.003,group:'Noble Gas'},
  Li:{name:'Lithium',mass:6.941,group:'Alkali Metal'},Be:{name:'Beryllium',mass:9.012,group:'Alkaline Earth'},
  B:{name:'Boron',mass:10.81,group:'Metalloid'},C:{name:'Carbon',mass:12.01,group:'Nonmetal'},
  N:{name:'Nitrogen',mass:14.01,group:'Nonmetal'},O:{name:'Oxygen',mass:16.00,group:'Nonmetal'},
  F:{name:'Fluorine',mass:19.00,group:'Halogen'},Ne:{name:'Neon',mass:20.18,group:'Noble Gas'},
  Na:{name:'Sodium',mass:22.99,group:'Alkali Metal'},Mg:{name:'Magnesium',mass:24.31,group:'Alkaline Earth'},
  Al:{name:'Aluminium',mass:26.98,group:'Post-Transition Metal'},Si:{name:'Silicon',mass:28.09,group:'Metalloid'},
  P:{name:'Phosphorus',mass:30.97,group:'Nonmetal'},S:{name:'Sulfur',mass:32.06,group:'Nonmetal'},
  Cl:{name:'Chlorine',mass:35.45,group:'Halogen'},Ar:{name:'Argon',mass:39.95,group:'Noble Gas'},
  K:{name:'Potassium',mass:39.10,group:'Alkali Metal'},Ca:{name:'Calcium',mass:40.08,group:'Alkaline Earth'},
  Fe:{name:'Iron',mass:55.85,group:'Transition Metal'},Cu:{name:'Copper',mass:63.55,group:'Transition Metal'},
  Zn:{name:'Zinc',mass:65.38,group:'Transition Metal'},Ag:{name:'Silver',mass:107.87,group:'Transition Metal'},
  Au:{name:'Gold',mass:196.97,group:'Transition Metal'},Hg:{name:'Mercury',mass:200.59,group:'Transition Metal'},
  Pb:{name:'Lead',mass:207.2,group:'Post-Transition Metal'},U:{name:'Uranium',mass:238.03,group:'Actinide'},
};

const mathFormulas = [
  { topic:'Area of Circle', formula:'A = πr²', note:'r = radius, π ≈ 3.14159' },
  { topic:'Pythagorean Theorem', formula:'a² + b² = c²', note:'c = hypotenuse of right triangle' },
  { topic:'Quadratic Formula', formula:'x = (-b ± √(b²-4ac)) / 2a', note:'For ax² + bx + c = 0' },
  { topic:'Distance Formula', formula:'d = √((x₂-x₁)² + (y₂-y₁)²)', note:'Distance between two points' },
  { topic:'Slope of a Line', formula:'m = (y₂-y₁)/(x₂-x₁)', note:'Rise over run' },
  { topic:'Compound Interest', formula:'A = P(1 + r/n)^(nt)', note:'P=principal, r=rate, n=compounds/yr, t=years' },
  { topic:'Volume of Sphere', formula:'V = (4/3)πr³', note:'r = radius' },
  { topic:'Surface Area of Sphere', formula:'SA = 4πr²', note:'r = radius' },
  { topic:"Euler's Formula", formula:'e^(iπ) + 1 = 0', note:'The most beautiful equation in math' },
  { topic:'Trigonometry Basics', formula:'sin²θ + cos²θ = 1', note:'Pythagorean identity' },
  { topic:'Speed Formula', formula:'Speed = Distance / Time', note:'v = d/t' },
  { topic:'Force (Newton\'s 2nd Law)', formula:'F = ma', note:'F=force, m=mass, a=acceleration' },
  { topic:'Kinetic Energy', formula:'KE = ½mv²', note:'m=mass, v=velocity' },
  { topic:'Ohm\'s Law', formula:'V = IR', note:'V=voltage, I=current, R=resistance' },
];

const scienceFacts = [
  '🔬 A teaspoon of a neutron star would weigh about 10 million tons.',
  '⚡ Lightning strikes the Earth about 100 times per second.',
  '🌡️ Absolute zero (-273.15°C) is the coldest possible temperature.',
  '🧬 Human DNA is 98.7% identical to chimpanzee DNA.',
  '💧 Water expands by about 9% when it freezes.',
  '🌌 There are more stars in the universe than grains of sand on all Earth\'s beaches.',
  '🦋 Butterflies can see ultraviolet light that humans cannot.',
  '🐝 A bee must visit about 2 million flowers to make one pound of honey.',
  '🧠 The human brain generates about 23 watts of electricity.',
  '🌍 The Earth travels around the Sun at 67,000 mph.',
  '🔭 The Sun accounts for 99.86% of the Solar System\'s total mass.',
  '🩸 Your body produces 25 million new cells per second.',
];

const historyFacts = [
  '📜 The Great Wall of China is NOT visible from space with the naked eye.',
  '⚔️ The shortest war in history lasted 38-45 minutes (Anglo-Zanzibar War, 1896).',
  '📰 The New York Times has been published since 1851.',
  '👑 Cleopatra lived closer in time to the Moon landing than to the Great Pyramid\'s construction.',
  '🗽 The Statue of Liberty was a gift from France to the United States in 1886.',
  '🏰 Oxford University is older than the Aztec Empire.',
  '⚡ Benjamin Franklin\'s kite experiment proved lightning is electricity.',
  '🎯 Napoleon Bonaparte was not short — he was 5\'7", average for his time.',
  '🌊 Vikings never actually wore horned helmets in battle.',
  '📖 The printing press was invented by Johannes Gutenberg around 1440.',
];

const techFacts = [
  '💻 The first computer bug was an actual bug — a moth found in a Navy computer in 1947.',
  '🌐 The World Wide Web was invented by Tim Berners-Lee in 1989.',
  '📱 The first iPhone was released on June 29, 2007.',
  '🤖 The word "robot" comes from the Czech word "robota" meaning forced labor.',
  '🔒 The most common password is still "123456".',
  '📧 The first email was sent by Ray Tomlinson in 1971.',
  '🖥️ The first computer weighed 27 tons and took up an entire room.',
  '🌍 Google processes over 8.5 billion searches per day.',
  '💾 The first hard drive (1956) had 5MB storage and weighed over a ton.',
  '📲 There are more mobile phones than toothbrushes on Earth.',
];

const spaceFacts = [
  '🚀 It takes light 8 minutes to travel from the Sun to Earth.',
  '⭐ The Sun is so large that 1 million Earths could fit inside it.',
  '🌙 The Moon is slowly drifting away from Earth at 3.8 cm per year.',
  '🪐 Saturn could float in water because it is less dense than water.',
  '🔭 There are over 200 billion galaxies in the observable universe.',
  '🌌 The Milky Way galaxy is 100,000 light-years in diameter.',
  '❄️ Mars has the largest volcano in the Solar System: Olympus Mons.',
  '💫 A day on Venus is longer than its year.',
  '🌟 The nearest star to Earth (other than the Sun) is 4.24 light-years away.',
  '🪐 Jupiter has 95 known moons.',
];

const vocab = {
  'ubiquitous': 'Present, appearing, or found everywhere. Example: "Smartphones are now ubiquitous in modern society."',
  'ephemeral': 'Lasting for a very short time. Example: "The beauty of cherry blossoms is ephemeral."',
  'pragmatic': 'Dealing with things sensibly and realistically. Example: "We need a pragmatic approach to solve this."',
  'resilient': 'Able to withstand or recover quickly from difficult conditions. Example: "The resilient community rebuilt after the flood."',
  'ambiguous': 'Open to more than one interpretation. Example: "The instructions were ambiguous and confusing."',
  'tenacious': 'Holding firmly to something; not easily stopped. Example: "She was tenacious in her pursuit of excellence."',
  'eloquent': 'Fluent or persuasive in speaking or writing. Example: "His eloquent speech moved the entire audience."',
  'meticulous': 'Showing great attention to detail. Example: "The meticulous surgeon left nothing to chance."',
  'serendipity': 'The occurrence of fortunate events by accident. Example: "Meeting her was pure serendipity."',
  'paradox': 'A seemingly contradictory statement that may be true. Example: "It\'s a paradox that being too cautious can be risky."',
};

const animalFacts = {
  cat:       '🐱 Cats spend 70% of their lives sleeping. They also have a third eyelid!',
  dog:       '🐶 Dogs have a sense of smell 10,000–100,000 times more sensitive than humans.',
  elephant:  '🐘 Elephants are the only animals that can\'t jump. They also mourn their dead.',
  penguin:   '🐧 Penguins are monogamous and propose with a pebble as an engagement ring.',
  dolphin:   '🐬 Dolphins have names for each other and call out to specific individuals.',
  octopus:   '🐙 Octopuses have three hearts, blue blood, and can change color in milliseconds.',
  tiger:     '🐯 No two tigers have the same stripe pattern — like human fingerprints.',
  giraffe:   '🦒 Giraffes only need 5–30 minutes of sleep per day.',
  shark:     '🦈 Sharks are older than trees — they\'ve been around for over 450 million years.',
  wolf:      '🐺 Wolves can run up to 35 mph and travel 12 miles per day.',
};

const geography = {
  tallest_mountain: 'Mount Everest at 8,848.86m (29,032 ft) above sea level',
  deepest_ocean:    'Mariana Trench in the Pacific Ocean — 11,034m (36,201 ft) deep',
  largest_country:  'Russia, covering 17.1 million km² (11% of Earth\'s land area)',
  smallest_country: 'Vatican City at just 0.44 km²',
  longest_river:    'The Nile River at 6,650 km (4,130 miles)',
  largest_desert:   'Antarctica is technically the largest desert at 14 million km²',
  largest_ocean:    'Pacific Ocean, covering 165 million km²',
  highest_lake:     'Lake Titicaca in South America at 3,812m elevation',
};

const mathProblems = [
  { q: 'What is 15% of 200?', a: '30', steps: '200 × 0.15 = 30' },
  { q: 'What is the area of a circle with radius 7?', a: '≈153.94', steps: 'A = πr² = π × 49 ≈ 153.94' },
  { q: 'Solve: 3x + 7 = 22', a: 'x = 5', steps: '3x = 22 - 7 = 15, x = 5' },
  { q: 'What is √225?', a: '15', steps: '15 × 15 = 225' },
  { q: 'What is 2^10?', a: '1024', steps: '2×2×2×2×2×2×2×2×2×2 = 1024' },
  { q: 'If a car travels 120km in 2 hours, what is its speed?', a: '60 km/h', steps: 'Speed = Distance/Time = 120/2 = 60 km/h' },
  { q: 'What is 0.75 as a fraction?', a: '3/4', steps: '0.75 = 75/100 = 3/4' },
  { q: 'What is the perimeter of a square with side 9?', a: '36', steps: 'P = 4 × 9 = 36' },
];

export default [
  {
    command: 'formula', aliases: ['mathformula','equations'],
    category: 'education', description: 'Get a math/science formula', usage: '.formula',
    async handler(sock, msg, args, ctx) {
      const topic = args.join(' ').toLowerCase();
      const f = topic ? mathFormulas.find(m => m.topic.toLowerCase().includes(topic)) : r(mathFormulas);
      if (!f) return sock.sendMessage(ctx.chatId, { text: `❌ Formula not found. Type .formula to get a random one.` }, { quoted: msg });
      await sock.sendMessage(ctx.chatId, { text: `📐 *${f.topic}*\n\n🔢 Formula: \`${f.formula}\`\n\n📝 Note: ${f.note}` }, { quoted: msg });
    }
  },
  {
    command: 'elements', aliases: ['element2','periodic2'],
    category: 'education', description: 'Look up a periodic element', usage: '.elements <symbol or name>',
    async handler(sock, msg, args, ctx) {
      if (!args[0]) {
        const sample = Object.entries(elements).slice(0, 5).map(([k,v]) => `${k} — ${v.name}`).join('\n');
        return sock.sendMessage(ctx.chatId, { text: `⚗️ Usage: .elements <symbol>\n\nExamples:\n${sample}` }, { quoted: msg });
      }
      const query = args[0];
      const key = Object.keys(elements).find(k => k.toLowerCase() === query.toLowerCase());
      const byName = !key && Object.entries(elements).find(([,v]) => v.name.toLowerCase().includes(query.toLowerCase()));
      const el = key ? [key, elements[key]] : byName;
      if (!el) return sock.sendMessage(ctx.chatId, { text: `❌ Element "${query}" not found!` }, { quoted: msg });
      const [symbol, data] = el;
      await sock.sendMessage(ctx.chatId, { text: `⚗️ *${data.name}*\n\n🔤 Symbol: *${symbol}*\n⚖️ Atomic Mass: *${data.mass}*\n🏷️ Group: *${data.group}*` }, { quoted: msg });
    }
  },
  {
    command: 'sciencefact', aliases: ['scifact','physfact'],
    category: 'education', description: 'Random science fact', usage: '.sciencefact',
    async handler(sock, msg, args, ctx) {
      await sock.sendMessage(ctx.chatId, { text: `🔬 *Science Fact*\n\n${r(scienceFacts)}` }, { quoted: msg });
    }
  },
  {
    command: 'historyfact', aliases: ['history2','hisfact'],
    category: 'education', description: 'Random history fact', usage: '.historyfact',
    async handler(sock, msg, args, ctx) {
      await sock.sendMessage(ctx.chatId, { text: `📜 *History Fact*\n\n${r(historyFacts)}` }, { quoted: msg });
    }
  },
  {
    command: 'techfact', aliases: ['codingtip2','techtip'],
    category: 'education', description: 'Random technology fact', usage: '.techfact',
    async handler(sock, msg, args, ctx) {
      await sock.sendMessage(ctx.chatId, { text: `💻 *Tech Fact*\n\n${r(techFacts)}` }, { quoted: msg });
    }
  },
  {
    command: 'spacefact', aliases: ['astronomy','universe'],
    category: 'education', description: 'Random space/astronomy fact', usage: '.spacefact',
    async handler(sock, msg, args, ctx) {
      await sock.sendMessage(ctx.chatId, { text: `🚀 *Space Fact*\n\n${r(spaceFacts)}` }, { quoted: msg });
    }
  },
  {
    command: 'vocab', aliases: ['vocabulary','wordofday'],
    category: 'education', description: 'Learn a new vocabulary word', usage: '.vocab [word]',
    async handler(sock, msg, args, ctx) {
      const query = args.join(' ').toLowerCase();
      const word = query && vocab[query] ? query : r(Object.keys(vocab));
      await sock.sendMessage(ctx.chatId, { text: `📚 *Vocabulary*\n\n📖 *${word.charAt(0).toUpperCase() + word.slice(1)}*\n\n${vocab[word]}` }, { quoted: msg });
    }
  },
  {
    command: 'mathfact', aliases: ['funmath','numfact'],
    category: 'education', description: 'Random fun math fact', usage: '.mathfact',
    async handler(sock, msg, args, ctx) {
      const facts = [
        '🔢 0.999... (repeating) is mathematically equal to 1.',
        '🔢 There are as many even numbers as there are whole numbers — both are infinite.',
        '🔢 A "googol" is 10^100. A googolplex is 10^googol.',
        '🔢 The number π has been calculated to over 100 trillion digits.',
        '🔢 In a group of 23 people, there\'s a 50% chance two share a birthday.',
        '🔢 7 is considered the most "random" number by most humans when asked to pick a number 1-10.',
        '🔢 The sum of angles in any triangle always equals 180°.',
        '🔢 1 is the only positive number that is neither prime nor composite.',
        '🔢 All odd numbers have the letter "e" in their name in English.',
        '🔢 The number 1729 is the smallest number expressible as a sum of two cubes in two different ways.',
      ];
      await sock.sendMessage(ctx.chatId, { text: `🔢 *Math Fact*\n\n${r(facts)}` }, { quoted: msg });
    }
  },
  {
    command: 'quickmath', aliases: ['mathproblem','solveit'],
    category: 'education', description: 'Solve a quick math problem', usage: '.quickmath',
    async handler(sock, msg, args, ctx) {
      const { chatId, senderId } = ctx;
      const prob = r(mathProblems);
      if (args.length > 0) {
        const ans = args.join(' ').trim().toLowerCase();
        const correct = ans.includes(prob.a.toLowerCase().replace('≈','').replace('x =','').trim()) || prob.a.toLowerCase().includes(ans.split('=').pop().trim());
        return sock.sendMessage(chatId, { text: `📐 *Math Check*\n\nQuestion: ${prob.q}\nYour answer: ${ans}\n\n${correct ? '✅ Correct!' : `❌ Incorrect!\n\n📝 Solution:\n${prob.steps}\n✅ Answer: ${prob.a}`}` }, { quoted: msg });
      }
      await sock.sendMessage(chatId, { text: `📐 *Quick Math*\n\n❓ ${prob.q}\n\n_Reply with .quickmath <answer> or solve it yourself!_\n\nHint: ${prob.steps.split('=')[0]}= ?` }, { quoted: msg });
    }
  },
  {
    command: 'geofact', aliases: ['geography','geofacts'],
    category: 'education', description: 'Geography facts and records', usage: '.geofact [topic]',
    async handler(sock, msg, args, ctx) {
      const query = args.join(' ').toLowerCase().replace(/\s+/g,'_');
      const info = geography[query];
      if (info) return sock.sendMessage(ctx.chatId, { text: `🌍 *${args.join(' ')}*\n\n${info}` }, { quoted: msg });
      const list = Object.entries(geography).map(([k,v]) => `• *${k.replace(/_/g,' ')}*: ${v}`).join('\n\n');
      await sock.sendMessage(ctx.chatId, { text: `🌍 *Geography Facts*\n\n${list}` }, { quoted: msg });
    }
  },
  {
    command: 'animalfact2', aliases: ['wildlifefact','zoofact'],
    category: 'education', description: 'Interesting animal facts', usage: '.animalfact2 [animal]',
    async handler(sock, msg, args, ctx) {
      const query = args[0]?.toLowerCase();
      const fact = animalFacts[query] || r(Object.values(animalFacts));
      await sock.sendMessage(ctx.chatId, { text: `🐾 *Animal Fact*\n\n${fact}` }, { quoted: msg });
    }
  },
  {
    command: 'spelling', aliases: ['spellcheck','checkspell'],
    category: 'education', description: 'Check spelling of a word', usage: '.spelling <word>',
    async handler(sock, msg, args, ctx) {
      const word = args[0];
      if (!word) return sock.sendMessage(ctx.chatId, { text: '❌ Usage: .spelling <word>' }, { quoted: msg });
      const common = { recieve:'receive',seperate:'separate',occured:'occurred',recomend:'recommend',accomodate:'accommodate',definately:'definitely',perseverence:'perseverance',acomplish:'accomplish',dissapear:'disappear',embarass:'embarrass',existance:'existence',grammer:'grammar',ignorence:'ignorance',occurance:'occurrence',relavant:'relevant',responsibilty:'responsibility',sucessful:'successful',suprised:'surprised',wierd:'weird',concious:'conscious' };
      const lower = word.toLowerCase();
      const correction = common[lower];
      if (correction) return sock.sendMessage(ctx.chatId, { text: `❌ *"${word}"* is misspelled!\n\n✅ Correct spelling: *"${correction}"*\n\nTip: Double-check your spelling before sending!` }, { quoted: msg });
      await sock.sendMessage(ctx.chatId, { text: `✅ *"${word}"* looks correctly spelled!\n\n_For comprehensive spell checking, use a dictionary tool._` }, { quoted: msg });
    }
  },
  {
    command: 'grammar', aliases: ['grammarcheck','gramcheck'],
    category: 'education', description: 'Basic grammar tips', usage: '.grammar <rule>',
    async handler(sock, msg, args, ctx) {
      const tips = [
        '📝 *Their vs There vs They\'re*\n• Their = possessive (their car)\n• There = location (over there)\n• They\'re = they are (they\'re coming)',
        '📝 *Your vs You\'re*\n• Your = possessive (your book)\n• You\'re = you are (you\'re amazing)',
        '📝 *Its vs It\'s*\n• Its = possessive (the cat and its tail)\n• It\'s = it is (it\'s raining)',
        '📝 *Affect vs Effect*\n• Affect = verb (the weather affects my mood)\n• Effect = noun (the effect was immediate)',
        '📝 *Who vs Whom*\n• Who = subject (Who called?)\n• Whom = object (Whom did you call?)',
        '📝 *Less vs Fewer*\n• Fewer = countable nouns (fewer apples)\n• Less = uncountable nouns (less water)',
        '📝 *Apostrophes*\n• Possessive: John\'s book\n• Contraction: don\'t, it\'s, they\'re\n• NEVER for plurals: "apples" not "apple\'s"',
      ];
      await sock.sendMessage(ctx.chatId, { text: `📚 *Grammar Tip*\n\n${r(tips)}\n\n_Type .grammar again for another tip!_` }, { quoted: msg });
    }
  },
  {
    command: 'iupac', aliases: ['chemname','chemical2'],
    category: 'education', description: 'Common chemical compound names', usage: '.iupac <compound>',
    async handler(sock, msg, args, ctx) {
      const compounds = {
        'water': { formula:'H₂O', iupac:'Dihydrogen monoxide', type:'Covalent' },
        'salt':  { formula:'NaCl', iupac:'Sodium chloride', type:'Ionic' },
        'sugar': { formula:'C₁₂H₂₂O₁₁', iupac:'Sucrose', type:'Covalent' },
        'baking soda': { formula:'NaHCO₃', iupac:'Sodium bicarbonate', type:'Ionic' },
        'vinegar': { formula:'CH₃COOH', iupac:'Acetic acid', type:'Covalent' },
        'bleach':  { formula:'NaClO', iupac:'Sodium hypochlorite', type:'Ionic' },
        'alcohol': { formula:'C₂H₅OH', iupac:'Ethanol', type:'Covalent' },
        'rust':    { formula:'Fe₂O₃', iupac:'Iron(III) oxide', type:'Ionic' },
        'ammonia': { formula:'NH₃', iupac:'Azane', type:'Covalent' },
        'aspirin': { formula:'C₉H₈O₄', iupac:'Acetylsalicylic acid', type:'Covalent' },
      };
      const query = args.join(' ').toLowerCase();
      const compound = compounds[query] || r(Object.entries(compounds).map(([k,v]) => ({...v, name:k})));
      const name = compound.name || query;
      await sock.sendMessage(ctx.chatId, { text: `⚗️ *Chemical Compound*\n\n🏷️ Common name: *${name}*\n🔬 IUPAC name: *${compound.iupac}*\n🧪 Formula: *${compound.formula}*\n🔗 Bond type: *${compound.type}*` }, { quoted: msg });
    }
  },
  {
    command: 'sigfig', aliases: ['significantfigures','rounding'],
    category: 'education', description: 'Learn about significant figures', usage: '.sigfig <number>',
    async handler(sock, msg, args, ctx) {
      const num = args[0];
      if (!num) return sock.sendMessage(ctx.chatId, { text: '❌ Usage: .sigfig <number>\n\nSignificant figures are digits that carry meaning contributing to its precision.\n\nRules:\n• All non-zero digits are significant\n• Zeros between non-zeros are significant\n• Trailing zeros after decimal ARE significant\n• Leading zeros are NOT significant' }, { quoted: msg });
      const digits = num.replace(/[^0-9]/g,'');
      const sigCount = [...num.replace(/^0+\.?0*/, '')].filter(c => c !== '.').length;
      await sock.sendMessage(ctx.chatId, { text: `🔢 *Significant Figures*\n\nNumber: *${num}*\n📊 Significant figures: *~${Math.max(1, sigCount)}*\n\n_Use scientific notation for exact sig fig control: e.g., 2.30 × 10³_` }, { quoted: msg });
    }
  },
  {
    command: 'todayhistory', aliases: ['onthisday','historyday'],
    category: 'education', description: 'What happened on this day in history', usage: '.todayhistory',
    async handler(sock, msg, args, ctx) {
      const events = [
        '1969: Neil Armstrong becomes the first human to walk on the Moon.',
        '1989: The Berlin Wall falls, reunifying Germany.',
        '1955: Albert Einstein passes away at age 76.',
        '1912: The RMS Titanic sinks in the North Atlantic.',
        '1945: VE Day — Victory in Europe Day declared.',
        '1992: The World Wide Web is opened to the public.',
        '1962: John Glenn becomes the first American to orbit Earth.',
        '1876: Alexander Graham Bell patents the telephone.',
        '1905: Einstein publishes his Theory of Special Relativity.',
        '1953: Watson and Crick discover the double-helix structure of DNA.',
        '1957: Sputnik 1 — the first artificial satellite — is launched.',
        '1969: The ARPANET (predecessor of the Internet) goes live.',
      ];
      const today = new Date();
      await sock.sendMessage(ctx.chatId, { text: `📅 *On This Day in History*\n\n_${today.toDateString()}_\n\n🏛️ ${r(events)}\n\n_History is full of amazing moments!_` }, { quoted: msg });
    }
  },
  {
    command: 'expand', aliases: ['expandword','verbose'],
    category: 'education', description: 'Expand abbreviations/acronyms', usage: '.expand <abbreviation>',
    async handler(sock, msg, args, ctx) {
      const abbrevs = {
        ai:'Artificial Intelligence', ml:'Machine Learning', dl:'Deep Learning', iot:'Internet of Things',
        api:'Application Programming Interface', url:'Uniform Resource Locator', html:'HyperText Markup Language',
        css:'Cascading Style Sheets', sql:'Structured Query Language', json:'JavaScript Object Notation',
        gps:'Global Positioning System', vpn:'Virtual Private Network', faq:'Frequently Asked Questions',
        asap:'As Soon As Possible', diy:'Do It Yourself', lol:'Laugh Out Loud', btw:'By The Way',
        fyi:'For Your Information', tl:'Too Long', dr:'Didn\'t Read', imho:'In My Humble Opinion',
        smh:'Shaking My Head', tbh:'To Be Honest', imo:'In My Opinion', ngl:'Not Gonna Lie',
        nasa:'National Aeronautics and Space Administration', who:'World Health Organization',
        un:'United Nations', ceo:'Chief Executive Officer', cto:'Chief Technology Officer',
      };
      const query = args.join(' ').toLowerCase();
      const expanded = abbrevs[query];
      if (!expanded) return sock.sendMessage(ctx.chatId, { text: `❌ Abbreviation "${args.join(' ')}" not in database.\n\nKnown abbreviations: ${Object.keys(abbrevs).slice(0,10).join(', ')}...` }, { quoted: msg });
      await sock.sendMessage(ctx.chatId, { text: `📖 *${args.join(' ').toUpperCase()}*\n\n✅ Full form: *${expanded}*` }, { quoted: msg });
    }
  },
];
