const axios = require('axios');
const { cmd } = require('../command');

const GML = 'https://api.guerrillamail.com/ajax.php';

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
        const { data } = await axios.get(`${GML}?f=get_email_address`, { timeout: 10000 });
        if (!data || !data.email_addr) return reply('❌ Failed to generate email. Try again.');

        const email = data.email_addr;
        const sid = data.sid_token;

        const message =
`📧 *TEMPORARY EMAIL GENERATED*

✉️ *Email Address:*
${email}

📥 *Check Inbox:*
.checkmail ${sid}

_Use .checkmail <session> to see your messages_
_Session token: ${sid}_`;

        await conn.sendMessage(from, { text: message }, { quoted: mek });

    } catch (e) {
        console.error('TempMail error:', e);
        reply(`❌ Error generating email: ${e.message}`);
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
        const sid = args[0];
        if (!sid) return reply('🔑 Usage: .checkmail <session-token>\nGet a session token from .tempmail first.');

        const { data } = await axios.get(
            `${GML}?f=get_email_list&offset=0&seq=0&sid_token=${encodeURIComponent(sid)}`,
            { timeout: 10000 }
        );

        if (!data || !data.list) return reply('❌ Invalid session or no response from mail server.');

        if (!data.list.length) return reply('📭 Your inbox is empty. Wait a moment and check again.');

        let messageList = `📬 *You have ${data.list.length} message(s)*\n\n`;
        for (let i = 0; i < Math.min(data.list.length, 5); i++) {
            const msg = data.list[i];
            const body = (msg.mail_excerpt || '').trim().substring(0, 200);
            messageList +=
`━━━━━━━━━━━━━━━━━━
📌 *Message ${i + 1}*
👤 *From:* ${msg.mail_from}
📝 *Subject:* ${msg.mail_subject}
⏰ *Date:* ${new Date(Number(msg.mail_timestamp) * 1000).toLocaleString()}

📄 *Preview:*
${body}${body.length === 200 ? '...' : ''}

`;
        }

        await reply(messageList);

    } catch (e) {
        console.error('CheckMail error:', e);
        reply(`❌ Error checking inbox: ${e.message}`);
    }
});
