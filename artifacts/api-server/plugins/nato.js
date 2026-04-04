const NATO = {
  A:'Alpha', B:'Bravo', C:'Charlie', D:'Delta', E:'Echo', F:'Foxtrot',
  G:'Golf', H:'Hotel', I:'India', J:'Juliet', K:'Kilo', L:'Lima',
  M:'Mike', N:'November', O:'Oscar', P:'Papa', Q:'Quebec', R:'Romeo',
  S:'Sierra', T:'Tango', U:'Uniform', V:'Victor', W:'Whiskey', X:'X-ray',
  Y:'Yankee', Z:'Zulu', '0':'Zero', '1':'One', '2':'Two', '3':'Three',
  '4':'Four', '5':'Five', '6':'Six', '7':'Seven', '8':'Eight', '9':'Niner',
  ' ':'(space)',
};

export default {
  command: 'nato',
  aliases: ['phonetic', 'natoalphabet'],
  category: 'tools',
  description: 'Convert text to NATO phonetic alphabet',
  usage: '.nato <text>',
  async handler(sock, message, args, context) {
    const { chatId } = context;
    const input = args.join(' ').trim();
    if (!input) return sock.sendMessage(chatId, { text: '❌ Provide text to convert.\nExample: .nato hello world' }, { quoted: message });
    const result = input.toUpperCase().split('').map(c => NATO[c] || c).join(' - ');
    await sock.sendMessage(chatId, {
      text: `📻 *NATO Phonetic Alphabet*\n\n*Input:* ${input}\n\n*Output:*\n${result}`
    }, { quoted: message });
  }
};
