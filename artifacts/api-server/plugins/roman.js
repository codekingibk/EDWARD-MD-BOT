function toRoman(num) {
  const vals = [1000,900,500,400,100,90,50,40,10,9,5,4,1];
  const syms = ['M','CM','D','CD','C','XC','L','XL','X','IX','V','IV','I'];
  let result = '';
  for (let i = 0; i < vals.length; i++) {
    while (num >= vals[i]) { result += syms[i]; num -= vals[i]; }
  }
  return result;
}

function fromRoman(s) {
  const map = {I:1,V:5,X:10,L:50,C:100,D:500,M:1000};
  let result = 0;
  const arr = s.toUpperCase().split('');
  for (let i = 0; i < arr.length; i++) {
    const cur = map[arr[i]], next = map[arr[i+1]];
    if (!cur) return null;
    result += next > cur ? -cur : cur;
  }
  return result;
}

export default {
  command: 'roman',
  aliases: ['romannumeral', 'toroman'],
  category: 'tools',
  description: 'Convert numbers to Roman numerals or vice versa',
  usage: '.roman <number or roman numeral>',
  async handler(sock, message, args, context) {
    const { chatId } = context;
    const input = args.join('').trim();
    if (!input) return sock.sendMessage(chatId, { text: '❌ Provide a number or Roman numeral.\nExample: .roman 2024\nExample: .roman MMXXIV' }, { quoted: message });
    const num = parseInt(input);
    if (!isNaN(num)) {
      if (num < 1 || num > 3999) return sock.sendMessage(chatId, { text: '❌ Number must be between 1 and 3999.' }, { quoted: message });
      await sock.sendMessage(chatId, { text: `🏛️ *Roman Numerals*\n\n*${num}* → *${toRoman(num)}*` }, { quoted: message });
    } else {
      const result = fromRoman(input);
      if (!result) return sock.sendMessage(chatId, { text: '❌ Invalid Roman numeral.' }, { quoted: message });
      await sock.sendMessage(chatId, { text: `🏛️ *Roman Numerals*\n\n*${input.toUpperCase()}* → *${result}*` }, { quoted: message });
    }
  }
};
