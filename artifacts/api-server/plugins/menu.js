export default {
    command: 'menu',
    aliases: ['help', 'cmds', 'commands', 'start'],
    category: 'general',
    description: 'Show all available bot commands',
    usage: '.menu',
    isPrefixless: false,
    async handler(sock, message, args, context) {
        const { chatId, senderId, config } = context;
        const prefix = config?.prefix || '.';
        const botName = config?.botName || 'EDWARD MD';

        // Sender number (strip @s.whatsapp.net / device suffix)
        const senderNum = (senderId || '').split('@')[0].split(':')[0];
        const userDisplay = senderNum ? `+${senderNum}` : 'User';

        // Time in Africa/Lagos
        const now = new Date();
        const lagosTime = now.toLocaleString('en-US', {
            timeZone: 'Africa/Lagos',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });

        const registry = globalThis._pluginRegistry || [];

        // Build category → command list map
        const categories = {};
        for (const p of registry) {
            const cat = (p.category || 'general').toLowerCase();
            if (!categories[cat]) categories[cat] = new Set();
            categories[cat].add(p.command);
        }

        // Category display config: [emoji, label, description]
        const catConfig = {
            owner:      ['👑', 'OWNER COMMANDS',   'Owner Only'],
            admin:      ['🛡️', 'ADMIN COMMANDS',   'Group Management'],
            group:      ['👥', 'GROUP',             'Group Tools'],
            general:    ['🔧', 'GENERAL',           'Basic Utilities'],
            downloader: ['📥', 'DOWNLOAD',          'Media Downloader'],
            ai:         ['🤖', 'AI & TOOLS',        'Smart Automation'],
            fun:        ['🎉', 'FUN',               'Entertainment'],
            media:      ['🎬', 'MEDIA',             'Media Tools'],
            sticker:    ['🖼️', 'STICKERS',         'Sticker Tools'],
            tools:      ['🛠️', 'TOOLS',            'Useful Tools'],
            search:     ['🔍', 'SEARCH',            'Search Engines'],
            info:       ['ℹ️', 'INFO',              'Information'],
            music:      ['🎵', 'MUSIC',             'Music Tools'],
            stalk:      ['🕵️', 'STALK',            'Profile Lookup'],
            utility:    ['🧮', 'UTILITY',           'Advanced Utilities'],
            anime:      ['🎌', 'ANIME',             'Anime & Manga'],
            converter:  ['🔄', 'CONVERTER',        'File Conversion'],
            economy:    ['💰', 'ECONOMY',           'Coins & Rewards'],
            nsfw:       ['🔞', 'NSFW',              'Adult Content (Admin)'],
            misc:       ['⚙️', 'MISC',             'Miscellaneous'],
            menu:       ['📋', 'MENU & NOTES',      'Extra'],
        };

        // Preferred category order
        const ORDER = [
            'owner','admin','group','general','downloader','ai','fun',
            'media','sticker','tools','search','info','music','stalk',
            'utility','anime','converter','economy','nsfw','menu','misc',
        ];

        const totalCmds = registry.length;

        let text = '';

        // ── Header ────────────────────────────────────────────────
        text += `( 🍁 ) ───ⒺⒹⓌⒶⓇⒹ ⓂⒹ\n`;
        text += `─── REVOLUTIONARY AUTOMATION SYSTEM ───\n`;
        text += `Next-generation bot with speed, flexibility,\nand absolute security has awakened.\n`;
        text += `〢「 🅴🅳🆆🅰🆁🅳  🅼🅳 」\n\n`;
        text += `࿇ *Bot* : ${botName}\n`;
        text += `࿇ *Prefix* : ${prefix}\n`;
        text += `࿇ *User* : ${userDisplay}\n`;
        text += `࿇ *Type* : ( Case─Plugins )\n`;
        text += `࿇ *League* : Africa/Lagos\n`;
        text += `࿇ *Time* : ${lagosTime}\n`;
        text += `࿇ *Cmds* : ${totalCmds} total\n`;
        text += `\n`;

        // ── Categories ────────────────────────────────────────────
        const allKeys = Object.keys(categories);
        const ordered = [
            ...ORDER.filter(k => allKeys.includes(k)),
            ...allKeys.filter(k => !ORDER.includes(k)).sort(),
        ];

        for (const cat of ordered) {
            const cmds = [...categories[cat]].sort();
            if (cmds.length === 0) continue;
            const [emoji, label, desc] = catConfig[cat] || ['▸', cat.toUpperCase(), ''];
            text += `┌─────────\n`;
            text += `├──── ▢ ( ${emoji} ) ${label} (${cmds.length})\n`;
            if (desc) text += `├── ▢ ${desc}\n`;
            for (const cmd of cmds) {
                text += `│── ${prefix}${cmd}\n`;
            }
            text += `└────\n`;
        }

        // ── Footer ────────────────────────────────────────────────
        text += `\n💡  Type ${prefix}menu or ${prefix}<command> to view full list\n`;
        text += `📌  Owner & Admin commands require proper permission\n`;
        text += `🍁  ${botName}  🍁`;

        await sock.sendMessage(chatId, { text }, { quoted: message });
    }
};
