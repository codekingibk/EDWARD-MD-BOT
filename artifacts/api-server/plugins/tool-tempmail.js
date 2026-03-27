const axios = require('axios');
const { cmd } = require('../command');

const BASE = 'https://www.1secmail.com/api/v1/';

cmd({
    pattern: "tempmail",
    alias: ["genmail"],
    desc: "Generate a new temporary email address",
    category: "utility",
    react: "📧",
    filename: __filename
},
async (conn, mek, m, { from, reply }) => {
    try {
        const { data } = await axios.get(`${BASE}?action=genRandomMailbox&count=1`, { timeout: 10000 });
        if (!Array.isArray(data) || !data[0]) return reply('❌ Failed to generate email. Try again.');

        const email = data[0];
        const [login, domain] = email.split('@');

        const message =
`📧 *TEMPORARY EMAIL GENERATED*

✉️ *Email Address:*
${email}

📥 *Check Inbox:*
.checkmail ${login} ${domain}

_Use .checkmail <login> <domain> to see your messages_
_Example: .checkmail ${login} ${domain}_`;

        await conn.sendMessage(from, { text: message }, { quoted: mek });

    } catch (e) {
        console.error('TempMail error:', e);
        reply(`❌ Error: ${e.message}`);
    }
});

cmd({
    pattern: "checkmail",
    alias: ["inbox", "tmail", "mailinbox"],
    desc: "Check your temporary email inbox",
    category: "utility",
    react: "📬",
    filename: __filename
},
async (conn, mek, m, { from, reply, args }) => {
    try {
        const login = args[0];
        const domain = args[1];
        if (!login || !domain) return reply('🔑 Usage: .checkmail <login> <domain>\nExample: .checkmail abc123 1secmail.com');

        const { data } = await axios.get(`${BASE}?action=getMessages&login=${encodeURIComponent(login)}&domain=${encodeURIComponent(domain)}`, { timeout: 10000 });

        if (!Array.isArray(data)) return reply('❌ Invalid response from mail server.');

        if (data.length === 0) return reply('📭 Your inbox is empty. Check back in a moment.');

        let messageList = `📬 *You have ${data.length} message(s)*\n\n`;
        for (let i = 0; i < Math.min(data.length, 5); i++) {
            const msg = data[i];
            const { data: full } = await axios.get(
                `${BASE}?action=readMessage&login=${encodeURIComponent(login)}&domain=${encodeURIComponent(domain)}&id=${msg.id}`,
                { timeout: 10000 }
            );
            const body = (full.textBody || full.htmlBody || '').replace(/<[^>]+>/g, '').trim().substring(0, 200);
            messageList +=
`━━━━━━━━━━━━━━━━━━
📌 *Message ${i + 1}*
👤 *From:* ${msg.from}
📝 *Subject:* ${msg.subject}
⏰ *Date:* ${msg.date}

📄 *Content:*
${body}${body.length === 200 ? '...' : ''}

`;
        }

        await reply(messageList);

    } catch (e) {
        console.error('CheckMail error:', e);
        reply(`❌ Error checking inbox: ${e.message}`);
    }
});
