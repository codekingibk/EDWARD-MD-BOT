export default {
    command: 'tinyurl',
    aliases: ['shorten', 'tiny'],
    category: 'tools',
    description: 'Shorten a URL using TinyURL',
    usage: '.tiny <url>',
    async handler(sock, message, args, context) {
        const chatId = context.chatId || message.key.remoteJid;
        const query = args?.join(' ')?.trim();
        if (!query) {
            return await sock.sendMessage(chatId, { text: '*Please provide a URL to shorten.*\nExample: .tiny https://example.com' }, { quoted: message });
        }

        // Basic URL validation — prepend https:// if missing
        let url = query;
        if (!/^https?:\/\//i.test(url)) url = 'https://' + url;

        try {
            // Try TinyURL first
            const response = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`);
            const shortUrl = await response.text();

            if (shortUrl && shortUrl.startsWith('https://') && !shortUrl.toLowerCase().includes('error')) {
                const output = `✨ *YOUR SHORT URL*\n\n` +
                    `🔗 *Original Link:*\n${url}\n\n` +
                    `✂️ *Shortened URL:*\n${shortUrl}`;
                return await sock.sendMessage(chatId, { text: output }, { quoted: message });
            }

            // Fallback: is.gd
            const r2 = await fetch(`https://is.gd/create.php?format=simple&url=${encodeURIComponent(url)}`);
            const shortUrl2 = await r2.text();

            if (shortUrl2 && shortUrl2.startsWith('https://')) {
                const output = `✨ *YOUR SHORT URL*\n\n` +
                    `🔗 *Original Link:*\n${url}\n\n` +
                    `✂️ *Shortened URL:*\n${shortUrl2}`;
                return await sock.sendMessage(chatId, { text: output }, { quoted: message });
            }

            await sock.sendMessage(chatId, { text: '❌ Could not shorten this URL. Make sure the link is valid and accessible.' }, { quoted: message });
        } catch (err) {
            console.error('TinyURL plugin error:', err);
            await sock.sendMessage(chatId, { text: '❌ Failed to shorten URL. Please try again later.' }, { quoted: message });
        }
    }
};
