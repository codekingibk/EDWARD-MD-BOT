const { cmd } = require("../command");
const axios = require("axios");

// Country code → name mapping for display
const COUNTRY_NAMES = {
  us: 'United States', gb: 'United Kingdom', ca: 'Canada', au: 'Australia',
  ng: 'Nigeria', za: 'South Africa', in: 'India', br: 'Brazil', de: 'Germany',
  fr: 'France', ru: 'Russia', se: 'Sweden', nl: 'Netherlands', no: 'Norway',
  fi: 'Finland', dk: 'Denmark', pl: 'Poland', ua: 'Ukraine', it: 'Italy',
  es: 'Spain', pt: 'Portugal', ro: 'Romania', hu: 'Hungary', cz: 'Czechia',
};

async function fetchNumbers(cc) {
  // Try multiple free temp-number APIs in order
  const apis = [
    {
      url: `https://api.siputzx.my.id/api/tools/tempnumber?cc=${cc}`,
      parse: (d) => {
        const items = d?.data || d?.result || [];
        return items.map(n => n.number || n.phone || n).filter(Boolean);
      }
    },
    {
      url: `https://api.agcresi.my.id/api/tempnumber?cc=${cc}`,
      parse: (d) => {
        const items = d?.result || d?.data || [];
        return items.map(n => n.number || n.phone || n).filter(Boolean);
      }
    },
  ];

  for (const api of apis) {
    try {
      const { data } = await axios.get(api.url, { timeout: 8000, validateStatus: s => s === 200 });
      const numbers = api.parse(data);
      if (numbers.length > 0) return numbers;
    } catch (_) {}
  }
  return [];
}

cmd({
  pattern: "tempnum",
  alias: ["fakenum", "tempnumber"],
  desc: "Get list of temporary phone numbers",
  category: "tools",
  react: "📱",
  use: "<country-code>",
  filename: __filename
},
async (conn, mek, m, { from, args, reply }) => {
  try {
    if (!args || args.length < 1) {
      return reply(
        `❌ *Usage:* .tempnum <country-code>\n` +
        `Example: .tempnum us\n\n` +
        `*Available codes:* us, gb, ca, ng, in, br, ru, de, fr, se, nl\n\n` +
        `📦 After getting a number, use *.otpbox <number>* to check its OTPs`
      );
    }

    const cc = args[0].toLowerCase().replace(/[^a-z]/g, '');
    const countryName = COUNTRY_NAMES[cc] || cc.toUpperCase();
    reply(`⏳ Fetching numbers for *${countryName}*…`);

    const numbers = await fetchNumbers(cc);

    if (numbers.length === 0) {
      return reply(
        `⚠️ *No numbers available for ${countryName} right now.*\n\n` +
        `Try a different country code or use a free SMS service directly:\n` +
        `🌐 https://receive-smss.com\n` +
        `🌐 https://quackr.io/temporary-phone-numbers\n\n` +
        `Common codes: us, gb, ca, se, nl, fi, ru`
      );
    }

    const list = numbers.slice(0, 20).map((num, i) =>
      `${String(i + 1).padStart(2, ' ')}. ${num}`
    ).join('\n');

    await reply(
      `╭──「 📱 TEMP NUMBERS — ${countryName} 」\n` +
      `│ Found: ${numbers.length} number(s)\n` +
      `│\n` +
      `${list}\n\n` +
      `╰──「 📦 USE: .otpbox <number> to check OTPs 」`
    );

  } catch (err) {
    console.error("TempNum error:", err);
    reply(
      `⚠️ *Service unavailable right now.*\n\n` +
      `Try free SMS sites directly:\n` +
      `🌐 https://receive-smss.com\n` +
      `🌐 https://quackr.io/temporary-phone-numbers`
    );
  }
});

cmd({
  pattern: "templist",
  alias: ["tempnumberlist", "tempnlist", "listnumbers"],
  desc: "Show supported country codes for temp numbers",
  category: "tools",
  react: "🌍",
  filename: __filename,
  use: ".templist"
},
async (conn, m, store, { reply }) => {
  const list = Object.entries(COUNTRY_NAMES)
    .map(([code, name], i) => `*${i + 1}.* ${name} \`(${code})\``)
    .join('\n');
  await reply(`🌍 *Supported Country Codes*\n\n${list}\n\n_Usage: .tempnum <code>_`);
});

cmd({
  pattern: "otpbox",
  alias: ["checkotp", "getotp"],
  desc: "Check OTP messages for a temporary number",
  category: "tools",
  react: "🔑",
  use: "<full-number>",
  filename: __filename
},
async (conn, mek, m, { from, args, reply }) => {
  try {
    if (!args[0]) {
      return reply(`❌ *Usage:* .otpbox <full-number>\nExample: .otpbox +12015555555`);
    }

    const phoneNumber = args[0].trim();
    reply(`⏳ Checking OTP messages for *${phoneNumber}*…`);

    // Try multiple endpoints
    const apis = [
      `https://api.siputzx.my.id/api/tools/otpbox?number=${encodeURIComponent(phoneNumber)}`,
      `https://api.agcresi.my.id/api/otpbox?number=${encodeURIComponent(phoneNumber)}`,
    ];

    let messages = [];
    for (const url of apis) {
      try {
        const { data } = await axios.get(url, { timeout: 8000, validateStatus: s => s === 200 });
        const items = data?.result || data?.data || [];
        if (items.length) { messages = items; break; }
      } catch (_) {}
    }

    if (!messages.length) {
      return reply(
        `📭 *No OTP messages found for ${phoneNumber}*\n\n` +
        `Make sure you're using a valid temporary number.\n` +
        `Use *.tempnum <country>* to get available numbers.`
      );
    }

    const formatted = messages.map((msg, i) => {
      const otpMatch = (msg.content || msg.message || '').match(/\b\d{4,8}\b/g);
      const otpCode = otpMatch ? otpMatch[0] : 'Not found';
      return `┌ *From:* ${msg.from || 'Unknown'}
│ *Code:* ${otpCode}
│ *Time:* ${msg.time_wib || msg.timestamp || '—'}
└ *Message:* ${(msg.content || msg.message || '').substring(0, 60)}`;
    }).join('\n\n');

    await reply(
      `╭──「 🔑 OTP MESSAGES 」\n` +
      `│ Number: ${phoneNumber}\n` +
      `│ Messages: ${messages.length}\n` +
      `│\n` +
      `${formatted}\n` +
      `╰──「 Use .tempnum to get numbers 」`
    );

  } catch (err) {
    console.error("OTPBox error:", err);
    reply(`⚠️ Error checking OTP: ${err.message}`);
  }
});
