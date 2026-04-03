const WEBSITE = process.env['BOT_WEBSITE'] || 'https://edward-md.replit.app';

export default {
    command: 'pair',
    aliases: ['paircode', 'session', 'getsession', 'sessionid'],
    category: 'general',
    description: 'Pair your WhatsApp number to EDWARD MD',
    usage: '.pair 2348012345678',
    async handler(sock, message, args, context) {
        const { chatId } = context;
        const forwardInfo = {
            forwardingScore: 1,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
                newsletterJid: '120363319098372999@newsletter',
                newsletterName: 'EDWARD MD',
                serverMessageId: -1
            }
        };

        const query = args.join('').trim();
        if (!query) {
            const guideText =
                `🤖 *EDWARD MD — PAIRING GUIDE*\n\n` +
                `To pair your WhatsApp number to *EDWARD MD*:\n\n` +
                `1️⃣ Visit our dashboard:\n` +
                `   👉 *${WEBSITE}*\n\n` +
                `2️⃣ Click *"Connect Bot"* on the dashboard\n\n` +
                `3️⃣ Enter your phone number with country code\n` +
                `   Example: *2348012345678*\n\n` +
                `4️⃣ Open WhatsApp → *Linked Devices*\n` +
                `   → *Link a Device* → *Phone number*\n\n` +
                `5️⃣ Enter the pairing code shown on the dashboard\n\n` +
                `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
                `Or provide your number directly:\n` +
                `   *.pair 2348012345678*\n` +
                `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
                `🚀 *Get your own FREE bot!*\n` +
                `👉 ${WEBSITE}`;

            return await sock.sendMessage(chatId, {
                text: guideText,
                contextInfo: forwardInfo,
            }, { quoted: message });
        }

        const number = query.replace(/[^0-9]/g, '');
        if (number.length < 10 || number.length > 15) {
            return await sock.sendMessage(chatId, {
                text: `❌ *Invalid Format*\nPlease provide the number with country code but without + or spaces.\n\nExample: *.pair 2348012345678*`,
                contextInfo: forwardInfo,
            }, { quoted: message });
        }

        await sock.sendMessage(chatId, {
            text: `⚡ *Requesting pairing code from EDWARD MD server...*`,
            contextInfo: forwardInfo,
        }, { quoted: message });

        try {
            // Call local API server to generate pairing code
            const apiBase = `http://localhost:${process.env['PORT'] || 8080}`;
            const response = await fetch(`${apiBase}/api/connect/code`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: number }),
                signal: AbortSignal.timeout(30000),
            });

            if (response.ok) {
                const successText =
                    `✅ *EDWARD MD PAIRING REQUEST SENT*\n\n` +
                    `📱 Number: *+${number}*\n\n` +
                    `*How to complete pairing:*\n` +
                    `1️⃣ Visit dashboard: *${WEBSITE}*\n` +
                    `2️⃣ Check the *Pairing Screen* for your code\n` +
                    `3️⃣ Open WhatsApp → *Linked Devices*\n` +
                    `4️⃣ Tap *Link a Device* → *Link with phone number*\n` +
                    `5️⃣ Enter the code shown on the dashboard\n\n` +
                    `⏱️ Code expires in ~60 seconds\n\n` +
                    `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
                    `🚀 *Get your own FREE EDWARD MD bot!*\n` +
                    `👉 ${WEBSITE}`;

                await sock.sendMessage(chatId, {
                    text: successText,
                    contextInfo: forwardInfo,
                }, { quoted: message });
            } else {
                throw new Error(`Server responded with ${response.status}`);
            }
        } catch (error) {
            const errorText =
                `✅ *EDWARD MD PAIRING INFO*\n\n` +
                `To pair *+${number}* with EDWARD MD:\n\n` +
                `1️⃣ Go to: *${WEBSITE}*\n` +
                `2️⃣ Enter your number: *${number}*\n` +
                `3️⃣ Get pairing code from the dashboard\n` +
                `4️⃣ Link in WhatsApp → *Linked Devices*\n\n` +
                `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
                `🚀 *Get your own FREE bot!*\n` +
                `👉 ${WEBSITE}`;

            await sock.sendMessage(chatId, {
                text: errorText,
                contextInfo: forwardInfo,
            }, { quoted: message });
        }
    }
};
