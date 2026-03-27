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
            owner:      ['👑', 'OWNER',             'Owner Only'],
            admin:      ['🛡️', 'ADMIN',             'Group Management'],
            group:      ['👥', 'GROUP',              'Group Tools'],
            general:    ['🔧', 'GENERAL',            'Basic Utilities'],
            main:       ['🔧', 'GENERAL',            'Basic Utilities'],
            download:   ['📥', 'DOWNLOAD',           'Media Downloader'],
            downloader: ['📥', 'DOWNLOAD',           'Media Downloader'],
            ai:         ['🤖', 'AI & TOOLS',         'Smart Automation'],
            fun:        ['🎉', 'FUN',                'Entertainment'],
            games:      ['🎮', 'GAMES',              'Mini-Games'],
            media:      ['🎬', 'MEDIA',              'Media Tools'],
            sticker:    ['🖼️', 'STICKERS',          'Sticker Maker'],
            stickers:   ['🖼️', 'STICKERS',          'Sticker Maker'],
            tools:      ['🛠️', 'TOOLS',             'Useful Tools'],
            search:     ['🔍', 'SEARCH',             'Search Engines'],
            info:       ['ℹ️', 'INFO',               'Information'],
            news:       ['📰', 'NEWS',               'Latest News'],
            music:      ['🎵', 'MUSIC',              'Music Tools'],
            stalk:      ['🕵️', 'STALK',             'Profile Lookup'],
            utility:    ['🧮', 'UTILITY',            'Advanced Utilities'],
            anime:      ['🎌', 'ANIME',              'Anime & Manga'],
            convert:    ['🔄', 'CONVERTER',          'File Conversion'],
            converter:  ['🔄', 'CONVERTER',          'File Conversion'],
            img_edit:   ['🖌️', 'IMAGE EDIT',        'Image Manipulation'],
            wallpapers: ['🌄', 'WALLPAPERS',         'Wallpaper Gallery'],
            quotes:     ['💬', 'QUOTES',             'Quotes & Wisdom'],
            whatsapp:   ['💚', 'WHATSAPP',           'WA Utilities'],
            economy:    ['💰', 'ECONOMY',            'Coins & Rewards'],
            nsfw:       ['🔞', 'NSFW',               'Adult Content (Admin)'],
            other:      ['⚙️', 'OTHER',             'Miscellaneous'],
            misc:       ['⚙️', 'MISC',              'Miscellaneous'],
            menu:       ['📋', 'MENU',               'Help & Navigation'],
        };

        // Merge duplicate categories (e.g. 'sticker' and 'stickers' → one section)
        const mergeMap = { main: 'general', download: 'downloader', stickers: 'sticker', convert: 'converter' };
        const mergedCategories = {};
        for (const [cat, cmds] of Object.entries(categories)) {
            const key = mergeMap[cat] || cat;
            if (!mergedCategories[key]) mergedCategories[key] = new Set();
            for (const c of cmds) mergedCategories[key].add(c);
        }

        // Preferred category order
        const ORDER = [
            'owner','admin','group','general','downloader','ai','fun',
            'games','media','sticker','img_edit','tools','search','info',
            'news','music','stalk','utility','anime','converter','wallpapers',
            'quotes','whatsapp','economy','nsfw','menu','other','misc',
        ];

        const totalCmds = [...new Set(registry.map(p => p.command))].length;

        let text = '';

        // ── Header ────────────────────────────────────────────────
        text += `( 🍁 ) ───ⒺⒹⓌⒶⓇⒹ ⓂⒹ\n`;
        text += `─── REVOLUTIONARY AUTOMATION SYSTEM ───\n`;
        text += `Next-generation bot with speed, flexibility,\nand absolute security has awakened.\n`;
        text += `〢「 🅴🅳🆆🅰🆁🅳  🅼🅳 」\n\n`;
        text += `࿇ *Bot*    : ${botName}\n`;
        text += `࿇ *Prefix* : [ ${prefix} ]\n`;
        text += `࿇ *User*   : ${userDisplay}\n`;
        text += `࿇ *Mode*   : Multi-Plugin\n`;
        text += `࿇ *Zone*   : Africa/Lagos\n`;
        text += `࿇ *Time*   : ${lagosTime}\n`;
        text += `࿇ *Cmds*   : ${totalCmds} commands\n`;
        text += `\n`;

        // ── Categories ────────────────────────────────────────────
        const allKeys = Object.keys(mergedCategories);
        const ordered = [
            ...ORDER.filter(k => allKeys.includes(k)),
            ...allKeys.filter(k => !ORDER.includes(k)).sort(),
        ];

        for (const cat of ordered) {
            const cmds = [...mergedCategories[cat]].sort();
            if (cmds.length === 0) continue;
            const [emoji, label, desc] = catConfig[cat] || ['▸', cat.toUpperCase(), ''];
            text += `╭──── ${emoji} *${label}* (${cmds.length})\n`;
            if (desc) text += `│  ▸ ${desc}\n`;
            // Group into rows of 3 for compactness
            for (let i = 0; i < cmds.length; i += 3) {
                const row = cmds.slice(i, i + 3).map(c => `${prefix}${c}`).join('   ');
                text += `│  ${row}\n`;
            }
            text += `╰────\n`;
        }

        // ── Footer ────────────────────────────────────────────────
        text += `\n╔══════════════════════╗\n`;
        text += `║  💡 ${prefix}help <cmd>  for info  ║\n`;
        text += `║  📌 Admin cmds need perms  ║\n`;
        text += `╚══════════════════════╝\n`;
        text += `🍁  *${botName}*  🍁`;

        await sock.sendMessage(chatId, { text }, { quoted: message });
    }
};
