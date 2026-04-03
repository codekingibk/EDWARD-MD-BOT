const WEBSITE = process.env['BOT_WEBSITE'] || 'https://edward-md.replit.app';

export default {
    command: 'ping',
    aliases: ['p', 'pong'],
    category: 'general',
    description: 'Check bot response time',
    usage: '.ping',
    isPrefixless: true,
    async handler(sock, message, _args, context) {
        const start = Date.now();
        const chatId = message.key.remoteJid;
        const config = context?.config || {};
        const botName = config.botName || 'EDWARD MD';

        const forwardInfo = {
            forwardingScore: 1,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
                newsletterJid: '120363319098372999@newsletter',
                newsletterName: 'EDWARD MD',
                serverMessageId: -1
            }
        };

        const sent = await sock.sendMessage(chatId, {
            text: '⚡ Calculating response...',
            contextInfo: forwardInfo,
        }, { quoted: message });

        const latency = Date.now() - start;
        const speed = latency < 300 ? '🟢 Excellent' : latency < 700 ? '🟡 Good' : '🔴 Slow';

        const text =
            `╔══════════════════════╗\n` +
            `║  🏓  P O N G !       ║\n` +
            `╚══════════════════════╝\n\n` +
            `⚡ Latency  : *${latency}ms*\n` +
            `📶 Status   : ${speed}\n` +
            `🤖 Bot      : *${botName}*\n\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
            `🚀 *Get your own FREE bot!*\n` +
            `👉 ${WEBSITE}\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━━`;

        await sock.sendMessage(chatId, {
            text,
            edit: sent.key,
            contextInfo: forwardInfo,
        });
    }
};
