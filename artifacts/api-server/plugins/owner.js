export default {
    command: 'owner',
    aliases: ['creator'],
    category: 'info',
    description: 'Get the contact of the bot owner',
    usage: '.owner',
    async handler(sock, message, args, context) {
        const chatId = context.chatId || message.key.remoteJid;
        const config = context.config;
        try {
            const ownerNumber = (config.ownerNumber || '').replace(/[^0-9]/g, '');
            const ownerName = config.botOwner || 'Bot Owner';

            if (!ownerNumber) {
                return await sock.sendMessage(chatId, {
                    text: '⚠️ Owner number is not configured.'
                }, { quoted: message });
            }

            const vcard = [
                'BEGIN:VCARD',
                'VERSION:3.0',
                `FN:${ownerName}`,
                `TEL;type=CELL;type=VOICE;waid=${ownerNumber}:+${ownerNumber}`,
                'END:VCARD'
            ].join('\n');

            await sock.sendMessage(chatId, {
                contacts: {
                    displayName: ownerName,
                    contacts: [{ vcard }]
                },
            }, { quoted: message });
        }
        catch (error) {
            console.error('Owner Command Error:', error);
            await sock.sendMessage(chatId, {
                text: '❌ Failed to fetch owner contact.'
            }, { quoted: message });
        }
    }
};
