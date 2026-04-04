export default {
  command: 'temp',
  aliases: ['temperature', 'tempconvert', 'celsius', 'fahrenheit'],
  category: 'tools',
  description: 'Convert temperature between Celsius, Fahrenheit, and Kelvin',
  usage: '.temp <value> <C|F|K>',
  async handler(sock, message, args, context) {
    const { chatId } = context;
    const val = parseFloat(args[0]);
    const unit = (args[1] || '').toUpperCase().charAt(0);
    if (isNaN(val) || !['C', 'F', 'K'].includes(unit)) {
      return sock.sendMessage(chatId, {
        text: '🌡️ *Temperature Converter*\n\nUsage: .temp <value> <C|F|K>\n\nExamples:\n.temp 100 C → Celsius to Fahrenheit & Kelvin\n.temp 212 F → Fahrenheit to Celsius & Kelvin\n.temp 373 K → Kelvin to Celsius & Fahrenheit'
      }, { quoted: message });
    }
    let c, f, k;
    if (unit === 'C') { c = val; f = (val * 9/5) + 32; k = val + 273.15; }
    else if (unit === 'F') { c = (val - 32) * 5/9; f = val; k = c + 273.15; }
    else { k = val; c = val - 273.15; f = (c * 9/5) + 32; }
    await sock.sendMessage(chatId, {
      text: `🌡️ *Temperature Converter*\n\n` +
        `🔵 Celsius    : *${c.toFixed(2)}°C*\n` +
        `🔴 Fahrenheit : *${f.toFixed(2)}°F*\n` +
        `⚪ Kelvin     : *${k.toFixed(2)}K*`
    }, { quoted: message });
  }
};
