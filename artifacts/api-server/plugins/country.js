async function fetchCountry(name) {
  const res = await fetch(`https://restcountries.com/v3.1/name/${encodeURIComponent(name)}?fullText=false`);
  if (!res.ok) throw new Error('Country not found');
  const data = await res.json();
  return data[0];
}

export default {
  command: 'country',
  aliases: ['countryinfo', 'nation'],
  category: 'info',
  description: 'Get information about any country',
  usage: '.country <name>',
  async handler(sock, message, args, context) {
    const { chatId } = context;
    const query = args.join(' ').trim();
    if (!query) return sock.sendMessage(chatId, { text: '❌ Provide a country name.\nExample: .country Nigeria' }, { quoted: message });
    try {
      const c = await fetchCountry(query);
      const name = c.name?.common || query;
      const official = c.name?.official || name;
      const capital = c.capital?.[0] || 'N/A';
      const pop = c.population ? c.population.toLocaleString() : 'N/A';
      const area = c.area ? `${c.area.toLocaleString()} km²` : 'N/A';
      const region = `${c.region || ''} ${c.subregion ? '(' + c.subregion + ')' : ''}`.trim();
      const langs = c.languages ? Object.values(c.languages).join(', ') : 'N/A';
      const currency = c.currencies
        ? Object.values(c.currencies).map(cur => `${cur.name} (${cur.symbol || ''})`).join(', ')
        : 'N/A';
      const flag = c.flag || '';
      const tld = c.tld?.[0] || 'N/A';
      const calling = c.idd ? `${c.idd.root}${(c.idd.suffixes?.[0] || '')}` : 'N/A';
      await sock.sendMessage(chatId, {
        text: `${flag} *${name}*\n` +
          `Official: ${official}\n\n` +
          `🏙️ Capital   : ${capital}\n` +
          `👥 Population: ${pop}\n` +
          `📐 Area      : ${area}\n` +
          `🌍 Region    : ${region}\n` +
          `🗣️ Languages : ${langs}\n` +
          `💵 Currency  : ${currency}\n` +
          `📞 Calling   : ${calling}\n` +
          `🌐 TLD       : ${tld}`
      }, { quoted: message });
    } catch {
      await sock.sendMessage(chatId, { text: `❌ Country "*${query}*" not found. Check the spelling and try again.` }, { quoted: message });
    }
  }
};
