const r = (arr) => arr[Math.floor(Math.random() * arr.length)];

function isPrime(n) {
  if (n < 2) return false;
  for (let i = 2; i <= Math.sqrt(n); i++) if (n % i === 0) return false;
  return true;
}

function fibonacci(n) {
  if (n <= 0) return [];
  if (n === 1) return [0];
  const seq = [0, 1];
  while (seq.length < n) seq.push(seq[seq.length - 1] + seq[seq.length - 2]);
  return seq;
}

function gcd(a, b) { return b === 0 ? a : gcd(b, a % b); }
function lcm(a, b) { return (a * b) / gcd(a, b); }

function factorial(n) {
  if (n < 0) return NaN;
  if (n === 0 || n === 1) return 1;
  if (n > 20) return Infinity;
  let result = 1;
  for (let i = 2; i <= n; i++) result *= i;
  return result;
}

function permutation(n, r) { return factorial(n) / factorial(n - r); }
function combination(n, r) { return factorial(n) / (factorial(r) * factorial(n - r)); }

function toRoman(num) {
  const vals = [1000,900,500,400,100,90,50,40,10,9,5,4,1];
  const syms = ['M','CM','D','CD','C','XC','L','XL','X','IX','V','IV','I'];
  let result = '';
  for (let i = 0; i < vals.length; i++) {
    while (num >= vals[i]) { result += syms[i]; num -= vals[i]; }
  }
  return result;
}

function fromRoman(str) {
  const map = { I:1,V:5,X:10,L:50,C:100,D:500,M:1000 };
  let result = 0;
  for (let i = 0; i < str.length; i++) {
    const cur = map[str[i]], next = map[str[i+1]];
    result += (cur < next) ? -cur : cur;
  }
  return result;
}

function padMatrix(m, w) { return m.map(r => r.map(v => String(v).padStart(w)).join(' ')).join('\n'); }

function multiplyMatrices(A, B) {
  const rows = A.length, cols = B[0].length, inner = B.length;
  return Array.from({length: rows}, (_, i) =>
    Array.from({length: cols}, (_, j) =>
      A[i].reduce((s, _, k) => s + A[i][k] * B[k][j], 0)
    )
  );
}

function statistics(nums) {
  const sorted = [...nums].sort((a,b) => a-b);
  const mean = nums.reduce((a,b) => a+b, 0) / nums.length;
  const median = sorted.length % 2 === 0
    ? (sorted[sorted.length/2-1] + sorted[sorted.length/2]) / 2
    : sorted[Math.floor(sorted.length/2)];
  const freq = {};
  nums.forEach(n => freq[n] = (freq[n]||0)+1);
  const maxFreq = Math.max(...Object.values(freq));
  const mode = Object.keys(freq).filter(k => freq[k] === maxFreq).join(', ');
  const variance = nums.reduce((s,n) => s + (n-mean)**2, 0) / nums.length;
  const stddev = Math.sqrt(variance);
  return { mean, median, mode, min: sorted[0], max: sorted[sorted.length-1], range: sorted[sorted.length-1] - sorted[0], stddev, variance };
}

export default [
  {
    command: 'prime', aliases: ['isprime','primecheck'],
    category: 'tools', description: 'Check if a number is prime', usage: '.prime <number>',
    async handler(sock, msg, args, ctx) {
      const n = parseInt(args[0]);
      if (isNaN(n)) return sock.sendMessage(ctx.chatId, { text: '❌ Usage: .prime <number>' }, { quoted: msg });
      const result = isPrime(n);
      const msg2 = result ? `✅ *${n} IS a prime number!*\n\nIt can only be divided by 1 and itself.` : `❌ *${n} is NOT prime.*\n${n < 2 ? '' : `Factors include: ${[...Array(Math.min(n,100)).keys()].slice(2).filter(i => n % i === 0).slice(0,5).join(', ')}`}`;
      await sock.sendMessage(ctx.chatId, { text: `🔢 *Prime Check*\n\n${msg2}` }, { quoted: msg });
    }
  },
  {
    command: 'fibonacci', aliases: ['fib','fibseq'],
    category: 'tools', description: 'Generate Fibonacci sequence', usage: '.fibonacci <count>',
    async handler(sock, msg, args, ctx) {
      const n = Math.min(parseInt(args[0]) || 10, 30);
      if (n < 1) return sock.sendMessage(ctx.chatId, { text: '❌ Usage: .fibonacci <count> (max 30)' }, { quoted: msg });
      const seq = fibonacci(n);
      await sock.sendMessage(ctx.chatId, { text: `🌀 *Fibonacci Sequence (${n} terms)*\n\n${seq.join(', ')}\n\nEach number = sum of the two before it!` }, { quoted: msg });
    }
  },
  {
    command: 'factorial', aliases: ['fact2','nfact'],
    category: 'tools', description: 'Calculate factorial of a number', usage: '.factorial <number>',
    async handler(sock, msg, args, ctx) {
      const n = parseInt(args[0]);
      if (isNaN(n) || n < 0 || n > 20) return sock.sendMessage(ctx.chatId, { text: '❌ Usage: .factorial <number 0-20>' }, { quoted: msg });
      await sock.sendMessage(ctx.chatId, { text: `🔢 *${n}! (Factorial)*\n\n${n}! = *${factorial(n).toLocaleString()}*` }, { quoted: msg });
    }
  },
  {
    command: 'gcd', aliases: ['hcf','greatestcommon'],
    category: 'tools', description: 'Find GCD/HCF of two numbers', usage: '.gcd <num1> <num2>',
    async handler(sock, msg, args, ctx) {
      const [a, b] = args.map(Number);
      if (isNaN(a) || isNaN(b)) return sock.sendMessage(ctx.chatId, { text: '❌ Usage: .gcd <num1> <num2>' }, { quoted: msg });
      await sock.sendMessage(ctx.chatId, { text: `🔢 *GCD / HCF*\n\nGCD(${a}, ${b}) = *${gcd(Math.abs(a), Math.abs(b))}*` }, { quoted: msg });
    }
  },
  {
    command: 'lcm', aliases: ['leastcommon'],
    category: 'tools', description: 'Find LCM of two numbers', usage: '.lcm <num1> <num2>',
    async handler(sock, msg, args, ctx) {
      const [a, b] = args.map(Number);
      if (isNaN(a) || isNaN(b)) return sock.sendMessage(ctx.chatId, { text: '❌ Usage: .lcm <num1> <num2>' }, { quoted: msg });
      await sock.sendMessage(ctx.chatId, { text: `🔢 *LCM*\n\nLCM(${a}, ${b}) = *${lcm(Math.abs(a), Math.abs(b))}*` }, { quoted: msg });
    }
  },
  {
    command: 'permutation', aliases: ['perm','npr'],
    category: 'tools', description: 'Calculate permutations nPr', usage: '.permutation <n> <r>',
    async handler(sock, msg, args, ctx) {
      const [n, rr] = args.map(Number);
      if (isNaN(n) || isNaN(rr) || rr > n || n < 0) return sock.sendMessage(ctx.chatId, { text: '❌ Usage: .permutation <n> <r> where r <= n' }, { quoted: msg });
      const result = permutation(n, rr);
      await sock.sendMessage(ctx.chatId, { text: `🔢 *Permutation (nPr)*\n\nP(${n}, ${rr}) = *${result.toLocaleString()}*\n\nFormula: n! / (n-r)! = ${n}! / ${n-rr}!` }, { quoted: msg });
    }
  },
  {
    command: 'combination', aliases: ['comb','ncr'],
    category: 'tools', description: 'Calculate combinations nCr', usage: '.combination <n> <r>',
    async handler(sock, msg, args, ctx) {
      const [n, rr] = args.map(Number);
      if (isNaN(n) || isNaN(rr) || rr > n || n < 0) return sock.sendMessage(ctx.chatId, { text: '❌ Usage: .combination <n> <r> where r <= n' }, { quoted: msg });
      const result = combination(n, rr);
      await sock.sendMessage(ctx.chatId, { text: `🔢 *Combination (nCr)*\n\nC(${n}, ${rr}) = *${result.toLocaleString()}*\n\nFormula: n! / (r! × (n-r)!)` }, { quoted: msg });
    }
  },
  {
    command: 'statistics', aliases: ['stats2','datastats'],
    category: 'tools', description: 'Statistical analysis of numbers', usage: '.statistics 1 2 3 4 5',
    async handler(sock, msg, args, ctx) {
      const nums = args.map(Number).filter(n => !isNaN(n));
      if (nums.length < 2) return sock.sendMessage(ctx.chatId, { text: '❌ Usage: .statistics <n1> <n2> <n3>...\nProvide at least 2 numbers.' }, { quoted: msg });
      const s = statistics(nums);
      await sock.sendMessage(ctx.chatId, {
        text: `📊 *Statistics*\n\nData: [${nums.join(', ')}]\n\n📈 Mean: *${s.mean.toFixed(2)}*\n📍 Median: *${s.median}*\n🔄 Mode: *${s.mode}*\n⬇️ Min: *${s.min}*\n⬆️ Max: *${s.max}*\n📏 Range: *${s.range}*\n📉 Std Dev: *${s.stddev.toFixed(2)}*\n📊 Variance: *${s.variance.toFixed(2)}*`
      }, { quoted: msg });
    }
  },
  {
    command: 'mean', aliases: ['average','avg'],
    category: 'tools', description: 'Calculate mean/average', usage: '.mean 1 2 3 4 5',
    async handler(sock, msg, args, ctx) {
      const nums = args.map(Number).filter(n => !isNaN(n));
      if (!nums.length) return sock.sendMessage(ctx.chatId, { text: '❌ Usage: .mean <n1> <n2> ...' }, { quoted: msg });
      const avg = nums.reduce((a,b) => a+b, 0) / nums.length;
      await sock.sendMessage(ctx.chatId, { text: `📊 Mean of [${nums.join(', ')}] = *${avg.toFixed(4)}*` }, { quoted: msg });
    }
  },
  {
    command: 'median', aliases: ['middlevalue'],
    category: 'tools', description: 'Find the median value', usage: '.median 1 2 3 4 5',
    async handler(sock, msg, args, ctx) {
      const nums = args.map(Number).filter(n => !isNaN(n)).sort((a,b) => a-b);
      if (!nums.length) return sock.sendMessage(ctx.chatId, { text: '❌ Usage: .median <n1> <n2> ...' }, { quoted: msg });
      const mid = Math.floor(nums.length / 2);
      const med = nums.length % 2 === 0 ? (nums[mid-1] + nums[mid]) / 2 : nums[mid];
      await sock.sendMessage(ctx.chatId, { text: `📊 Sorted: [${nums.join(', ')}]\n\nMedian = *${med}*` }, { quoted: msg });
    }
  },
  {
    command: 'stddev', aliases: ['standarddeviation','sd'],
    category: 'tools', description: 'Calculate standard deviation', usage: '.stddev 1 2 3 4 5',
    async handler(sock, msg, args, ctx) {
      const nums = args.map(Number).filter(n => !isNaN(n));
      if (nums.length < 2) return sock.sendMessage(ctx.chatId, { text: '❌ Usage: .stddev <n1> <n2> ...' }, { quoted: msg });
      const mean = nums.reduce((a,b) => a+b, 0) / nums.length;
      const variance = nums.reduce((s,n) => s + (n-mean)**2, 0) / nums.length;
      const sd = Math.sqrt(variance);
      await sock.sendMessage(ctx.chatId, { text: `📉 *Standard Deviation*\n\nData: [${nums.join(', ')}]\nMean: ${mean.toFixed(2)}\nVariance: ${variance.toFixed(2)}\n\n📉 Std Dev = *${sd.toFixed(4)}*` }, { quoted: msg });
    }
  },
  {
    command: 'probability', aliases: ['prob','chance'],
    category: 'tools', description: 'Calculate probability', usage: '.probability <favorable> <total>',
    async handler(sock, msg, args, ctx) {
      const [fav, total] = args.map(Number);
      if (isNaN(fav) || isNaN(total) || total <= 0) return sock.sendMessage(ctx.chatId, { text: '❌ Usage: .probability <favorable outcomes> <total outcomes>\nExample: .probability 3 6 (rolling a number > 3 on a die)' }, { quoted: msg });
      const p = fav / total;
      const pct = (p * 100).toFixed(2);
      const odds = `${fav}:${total - fav}`;
      await sock.sendMessage(ctx.chatId, {
        text: `🎲 *Probability*\n\nFavorable: ${fav} / Total: ${total}\n\n📊 P = *${p.toFixed(4)}* (${pct}%)\n🎯 Odds: *${odds}* in favor\n\n${p >= 0.75 ? '🟢 Very likely!' : p >= 0.5 ? '🟡 More likely than not' : p >= 0.25 ? '🟠 Less likely' : '🔴 Unlikely'}`
      }, { quoted: msg });
    }
  },
  {
    command: 'roman', aliases: ['toroman2','roman2','dec2rom'],
    category: 'tools', description: 'Convert to/from Roman numerals', usage: '.roman <number or roman>',
    async handler(sock, msg, args, ctx) {
      const input = args[0];
      if (!input) return sock.sendMessage(ctx.chatId, { text: '❌ Usage: .roman <number>\nExample: .roman 2024 or .roman MMXXIV' }, { quoted: msg });
      if (/^[IVXLCDM]+$/i.test(input)) {
        const num = fromRoman(input.toUpperCase());
        await sock.sendMessage(ctx.chatId, { text: `🔢 *Roman → Decimal*\n\n${input.toUpperCase()} = *${num}*` }, { quoted: msg });
      } else {
        const n = parseInt(input);
        if (isNaN(n) || n < 1 || n > 3999) return sock.sendMessage(ctx.chatId, { text: '❌ Enter a number between 1 and 3999' }, { quoted: msg });
        await sock.sendMessage(ctx.chatId, { text: `🔢 *Decimal → Roman*\n\n${n} = *${toRoman(n)}*` }, { quoted: msg });
      }
    }
  },
  {
    command: 'matrix', aliases: ['matmul','matrixmult'],
    category: 'tools', description: 'Multiply 2x2 matrices', usage: '.matrix a b c d × e f g h',
    async handler(sock, msg, args, ctx) {
      if (args.length < 9 || args[4] !== '×') {
        return sock.sendMessage(ctx.chatId, { text: '❌ Usage: .matrix <a> <b> <c> <d> × <e> <f> <g> <h>\nExample: .matrix 1 2 3 4 × 5 6 7 8\n\nThis multiplies two 2×2 matrices:\n[a b]   [e f]\n[c d] × [g h]' }, { quoted: msg });
      }
      const [a,b,c,d,,e,f,g,h] = args.map(Number);
      const A = [[a,b],[c,d]], B = [[e,f],[g,h]];
      const C = multiplyMatrices(A, B);
      await sock.sendMessage(ctx.chatId, {
        text: `🔢 *Matrix Multiplication*\n\nA = [${a} ${b}] × B = [${e} ${f}]\n    [${c} ${d}]       [${g} ${h}]\n\nResult C = A × B:\n[${C[0][0]} ${C[0][1]}]\n[${C[1][0]} ${C[1][1]}]`
      }, { quoted: msg });
    }
  },
  {
    command: 'numbase', aliases: ['baseconvert','numberbase'],
    category: 'tools', description: 'Convert numbers between bases', usage: '.numbase <number> <from base> <to base>',
    async handler(sock, msg, args, ctx) {
      const [num, fromBase, toBase] = args;
      if (!num || !fromBase || !toBase) return sock.sendMessage(ctx.chatId, { text: '❌ Usage: .numbase <number> <fromBase> <toBase>\nExample: .numbase FF 16 10' }, { quoted: msg });
      const from = parseInt(fromBase), to = parseInt(toBase);
      if (from < 2 || from > 36 || to < 2 || to > 36) return sock.sendMessage(ctx.chatId, { text: '❌ Base must be between 2 and 36' }, { quoted: msg });
      const decimal = parseInt(num, from);
      if (isNaN(decimal)) return sock.sendMessage(ctx.chatId, { text: `❌ "${num}" is not a valid base-${from} number!` }, { quoted: msg });
      const result = decimal.toString(to).toUpperCase();
      await sock.sendMessage(ctx.chatId, { text: `🔢 *Base Conversion*\n\n${num} (base ${from}) = *${result}* (base ${to})\nDecimal: ${decimal}` }, { quoted: msg });
    }
  },
  {
    command: 'timestamp', aliases: ['unixtime','epoch'],
    category: 'tools', description: 'Get current timestamp or convert', usage: '.timestamp [unix number]',
    async handler(sock, msg, args, ctx) {
      if (args[0]) {
        const ts = parseInt(args[0]);
        const date = new Date(ts * (args[0].length <= 10 ? 1000 : 1));
        return sock.sendMessage(ctx.chatId, { text: `⏰ *Timestamp Converter*\n\nUnix: ${args[0]}\n📅 Date: ${date.toUTCString()}\n🕐 Local: ${date.toLocaleString()}` }, { quoted: msg });
      }
      const now = Date.now();
      const date = new Date(now);
      await sock.sendMessage(ctx.chatId, {
        text: `⏰ *Current Timestamp*\n\n🕐 UTC: ${date.toUTCString()}\n📅 ISO: ${date.toISOString()}\n⚡ Unix: ${Math.floor(now/1000)}\n🔢 Milliseconds: ${now}`
      }, { quoted: msg });
    }
  },
  {
    command: 'countdown', aliases: ['timer','daysleft'],
    category: 'tools', description: 'Countdown to a date', usage: '.countdown <YYYY-MM-DD>',
    async handler(sock, msg, args, ctx) {
      const dateStr = args[0];
      if (!dateStr || !/\d{4}-\d{2}-\d{2}/.test(dateStr)) return sock.sendMessage(ctx.chatId, { text: '❌ Usage: .countdown <YYYY-MM-DD>\nExample: .countdown 2025-12-31' }, { quoted: msg });
      const target = new Date(dateStr);
      const now = new Date();
      const diff = target - now;
      if (isNaN(diff)) return sock.sendMessage(ctx.chatId, { text: '❌ Invalid date format! Use YYYY-MM-DD' }, { quoted: msg });
      if (diff < 0) return sock.sendMessage(ctx.chatId, { text: `📅 *${dateStr}* has already passed (${Math.abs(Math.floor(diff/86400000))} days ago).` }, { quoted: msg });
      const days = Math.floor(diff / 86400000);
      const hours = Math.floor((diff % 86400000) / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      await sock.sendMessage(ctx.chatId, { text: `⏳ *Countdown*\n\n📅 Target: *${dateStr}*\n\n🗓️ ${days} days\n⏰ ${hours} hours\n⏱️ ${mins} minutes\n\n_${days < 7 ? '🔥 Almost there!' : days < 30 ? '⚡ Getting close!' : '📅 Mark your calendar!'}_` }, { quoted: msg });
    }
  },
  {
    command: 'dayofweek', aliases: ['whatday','weekday'],
    category: 'tools', description: 'Find the day of week for a date', usage: '.dayofweek <YYYY-MM-DD>',
    async handler(sock, msg, args, ctx) {
      const dateStr = args[0] || new Date().toISOString().split('T')[0];
      const date = new Date(dateStr);
      if (isNaN(date)) return sock.sendMessage(ctx.chatId, { text: '❌ Usage: .dayofweek <YYYY-MM-DD>' }, { quoted: msg });
      const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
      const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
      await sock.sendMessage(ctx.chatId, {
        text: `📅 *Day of Week*\n\n${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}\n\n🗓️ *${days[date.getDay()]}*`
      }, { quoted: msg });
    }
  },
  {
    command: 'leapyear', aliases: ['isleap','leapcheck'],
    category: 'tools', description: 'Check if a year is a leap year', usage: '.leapyear <year>',
    async handler(sock, msg, args, ctx) {
      const year = parseInt(args[0]) || new Date().getFullYear();
      const isLeap = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
      await sock.sendMessage(ctx.chatId, {
        text: `📅 *Leap Year Check*\n\n${year} ${isLeap ? '✅ IS a leap year!' : '❌ is NOT a leap year.'}\n${isLeap ? 'February has 29 days that year! 🐸' : 'February has 28 days that year.'}`
      }, { quoted: msg });
    }
  },
  {
    command: 'regex', aliases: ['regextest','regexmatch'],
    category: 'tools', description: 'Test a regex pattern', usage: '.regex <pattern> | <text>',
    async handler(sock, msg, args, ctx) {
      const full = args.join(' ');
      const [pattern, text] = full.split('|').map(s => s.trim());
      if (!pattern || !text) return sock.sendMessage(ctx.chatId, { text: '❌ Usage: .regex <pattern> | <text>\nExample: .regex \\d+ | hello 123 world' }, { quoted: msg });
      try {
        const rx = new RegExp(pattern, 'g');
        const matches = [...text.matchAll(rx)].map(m => m[0]);
        await sock.sendMessage(ctx.chatId, {
          text: `🔍 *Regex Test*\n\nPattern: \`${pattern}\`\nText: "${text}"\n\n${matches.length > 0 ? `✅ *${matches.length} match(es):*\n${matches.join(', ')}` : '❌ *No matches found*'}`
        }, { quoted: msg });
      } catch (e) {
        await sock.sendMessage(ctx.chatId, { text: `❌ Invalid regex pattern: ${e.message}` }, { quoted: msg });
      }
    }
  },
  {
    command: 'htmlencode', aliases: ['htmlesc','encodehtml'],
    category: 'tools', description: 'HTML encode text', usage: '.htmlencode <text>',
    async handler(sock, msg, args, ctx) {
      const text = args.join(' ');
      if (!text) return sock.sendMessage(ctx.chatId, { text: '❌ Usage: .htmlencode <text>' }, { quoted: msg });
      const encoded = text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
      await sock.sendMessage(ctx.chatId, { text: `🔤 *HTML Encoded:*\n\n${encoded}` }, { quoted: msg });
    }
  },
  {
    command: 'htmldecode', aliases: ['htmlunescape','decodehtml'],
    category: 'tools', description: 'HTML decode text', usage: '.htmldecode <text>',
    async handler(sock, msg, args, ctx) {
      const text = args.join(' ');
      if (!text) return sock.sendMessage(ctx.chatId, { text: '❌ Usage: .htmldecode <text>' }, { quoted: msg });
      const decoded = text.replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'");
      await sock.sendMessage(ctx.chatId, { text: `🔤 *HTML Decoded:*\n\n${decoded}` }, { quoted: msg });
    }
  },
  {
    command: 'urlencode', aliases: ['encodeurl','urlescape'],
    category: 'tools', description: 'URL encode/decode text', usage: '.urlencode <text>',
    async handler(sock, msg, args, ctx) {
      const text = args.join(' ');
      if (!text) return sock.sendMessage(ctx.chatId, { text: '❌ Usage: .urlencode <text>' }, { quoted: msg });
      const encoded = encodeURIComponent(text);
      const decoded = (() => { try { return decodeURIComponent(text); } catch { return text; } })();
      await sock.sendMessage(ctx.chatId, { text: `🔗 *URL Encode/Decode*\n\n📤 Encoded: ${encoded}\n📥 Decoded: ${decoded}` }, { quoted: msg });
    }
  },
  {
    command: 'jsonescape', aliases: ['jsonformat','jsonval'],
    category: 'tools', description: 'Format and validate JSON', usage: '.jsonescape <json>',
    async handler(sock, msg, args, ctx) {
      const text = args.join(' ');
      if (!text) return sock.sendMessage(ctx.chatId, { text: '❌ Usage: .jsonescape <json string>' }, { quoted: msg });
      try {
        const parsed = JSON.parse(text);
        const formatted = JSON.stringify(parsed, null, 2);
        await sock.sendMessage(ctx.chatId, { text: `✅ *Valid JSON!*\n\n\`\`\`${formatted.slice(0, 800)}\`\`\`` }, { quoted: msg });
      } catch (e) {
        await sock.sendMessage(ctx.chatId, { text: `❌ *Invalid JSON!*\n\nError: ${e.message}` }, { quoted: msg });
      }
    }
  },
  {
    command: 'colorpick', aliases: ['colorhex','color2'],
    category: 'tools', description: 'Get color info from hex code', usage: '.colorpick #FF5733',
    async handler(sock, msg, args, ctx) {
      const hex = (args[0] || '').replace('#', '');
      if (!/^[0-9A-Fa-f]{6}$/.test(hex)) {
        const randHex = Math.floor(Math.random() * 0xFFFFFF).toString(16).padStart(6, '0').toUpperCase();
        return sock.sendMessage(ctx.chatId, { text: `❌ Usage: .colorpick <hex color>\nExample: .colorpick #FF5733\n\n🎨 Random color: #${randHex}` }, { quoted: msg });
      }
      const r = parseInt(hex.slice(0,2), 16);
      const g = parseInt(hex.slice(2,4), 16);
      const b = parseInt(hex.slice(4,6), 16);
      const brightness = Math.round((r * 299 + g * 587 + b * 114) / 1000);
      const isDark = brightness < 128;
      const complementHex = ((0xFFFFFF - parseInt(hex, 16)) >>> 0).toString(16).padStart(6, '0').toUpperCase();
      await sock.sendMessage(ctx.chatId, {
        text: `🎨 *Color Info*\n\nHex: #${hex.toUpperCase()}\nRGB: rgb(${r}, ${g}, ${b})\nBrightness: ${brightness}/255 (${isDark ? 'Dark' : 'Light'})\nComplement: #${complementHex}\n\n🔴 Red: ${r}\n🟢 Green: ${g}\n🔵 Blue: ${b}`
      }, { quoted: msg });
    }
  },
  {
    command: 'randcolor', aliases: ['randomcolor','hexcolor'],
    category: 'tools', description: 'Generate a random color', usage: '.randcolor',
    async handler(sock, msg, args, ctx) {
      const hex = Math.floor(Math.random() * 0xFFFFFF).toString(16).padStart(6, '0').toUpperCase();
      const r = parseInt(hex.slice(0,2), 16);
      const g = parseInt(hex.slice(2,4), 16);
      const b = parseInt(hex.slice(4,6), 16);
      await sock.sendMessage(ctx.chatId, { text: `🎨 *Random Color*\n\n🎨 Hex: #${hex}\n🌈 RGB: (${r}, ${g}, ${b})\n\n_Use this color in your next design!_` }, { quoted: msg });
    }
  },
  {
    command: 'randemoji', aliases: ['emojigen','randomemoji'],
    category: 'tools', description: 'Generate random emojis', usage: '.randemoji [count]',
    async handler(sock, msg, args, ctx) {
      const count = Math.min(parseInt(args[0]) || 5, 20);
      const emojis = ['😀','😂','🥰','😎','🤩','😏','🥳','😴','🤔','😤','🦁','🐯','🦊','🐼','🦅','🌺','🌊','⚡','🔥','🌈','🏆','💎','🚀','🎯','🎉','🍕','🍦','🌮','🍣','🧁','🎸','🎮','⚽','🏀','🎭','🌍','🌙','⭐','💫','🎪'];
      const selected = Array.from({length: count}, () => emojis[Math.floor(Math.random() * emojis.length)]);
      await sock.sendMessage(ctx.chatId, { text: `🎲 *Random Emojis*\n\n${selected.join(' ')}` }, { quoted: msg });
    }
  },
  {
    command: 'randname', aliases: ['namegen','randomname'],
    category: 'tools', description: 'Generate a random name', usage: '.randname [gender m/f]',
    async handler(sock, msg, args, ctx) {
      const maleFirst = ['James','Oliver','Liam','Noah','Elijah','Lucas','Mason','Ethan','Logan','Aiden','Mohammed','Carlos','Hiroshi','Emmanuel','Raj'];
      const femaleFirst = ['Emma','Sophia','Olivia','Ava','Isabella','Mia','Charlotte','Amelia','Harper','Evelyn','Fatima','Sofia','Yuki','Amara','Priya'];
      const last = ['Smith','Johnson','Williams','Brown','Jones','Garcia','Miller','Davis','Wilson','Taylor','Kumar','Chen','Kim','Santos','Müller'];
      const gen = (args[0] || '').toLowerCase();
      const first = gen === 'f' ? femaleFirst[Math.floor(Math.random()*femaleFirst.length)] : gen === 'm' ? maleFirst[Math.floor(Math.random()*maleFirst.length)] : r([...maleFirst,...femaleFirst]);
      const lastName = last[Math.floor(Math.random()*last.length)];
      await sock.sendMessage(ctx.chatId, { text: `👤 *Random Name*\n\n🏷️ *${first} ${lastName}*` }, { quoted: msg });
    }
  },
];
