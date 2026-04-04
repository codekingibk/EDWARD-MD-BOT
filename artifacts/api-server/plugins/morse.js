const MORSE = {
  A:'.-', B:'-...', C:'-.-.', D:'-..', E:'.', F:'..-.',
  G:'--.', H:'....', I:'..', J:'.---', K:'-.-', L:'.-..',
  M:'--', N:'-.', O:'---', P:'.--.', Q:'--.-', R:'.-.',
  S:'...', T:'-', U:'..-', V:'...-', W:'.--', X:'-..-',
  Y:'-.--', Z:'--..', '0':'-----', '1':'.----', '2':'..---',
  '3':'...--', '4':'....-', '5':'.....', '6':'-....', '7':'--...',
  '8':'---..', '9':'----.', '.':'.-.-.-', ',':'--..--',
  '?':'..--..', '!':'-.-.--', ' ':' '
};
const REVERSE = Object.fromEntries(Object.entries(MORSE).map(([k,v]) => [v,k]));

export default {
  command: 'morse',
  aliases: ['morsecode'],
  category: 'tools',
  description: 'Convert text to Morse code or decode Morse to text',
  usage: '.morse <text or morse code>',
  async handler(sock, message, args, context) {
    const { chatId } = context;
    const input = args.join(' ').trim();
    if (!input) return sock.sendMessage(chatId, { text: '❌ Provide text or morse code to convert.\nExample: .morse hello\nExample: .morse .... . .-.. .-.. ---' }, { quoted: message });
    const isMorse = /^[.\- \/]+$/.test(input);
    let output;
    if (isMorse) {
      output = input.split(' / ').map(word =>
        word.split(' ').map(code => REVERSE[code] || '?').join('')
      ).join(' ');
    } else {
      output = input.toUpperCase().split('').map(c => MORSE[c] || '?').join(' ');
    }
    await sock.sendMessage(chatId, {
      text: `📡 *Morse Code Converter*\n\n` +
        `*Input:* ${input}\n` +
        `*Output:* ${output}\n\n` +
        `_${isMorse ? 'Decoded from Morse' : 'Encoded to Morse'}_`
    }, { quoted: message });
  }
};
