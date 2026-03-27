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

        const senderNum = (senderId || '').split('@')[0].split(':')[0];
        const userDisplay = senderNum ? `+${senderNum}` : 'User';

        const now = new Date();
        const lagosTime = now.toLocaleString('en-US', {
            timeZone: 'Africa/Lagos',
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
        });

        const registry = globalThis._pluginRegistry || [];

        const categories = {};
        for (const p of registry) {
            const cat = (p.category || 'general').toLowerCase();
            if (!categories[cat]) categories[cat] = new Set();
            categories[cat].add(p.command);
        }

        // Category display config: [emoji, label, description]
        const catConfig = {
            owner:      ['👑', 'OWNER COMMANDS',     'Owner Only'],
            admin:      ['🛡️', 'ADMIN COMMANDS',     'Group Management'],
            group:      ['👥', 'GROUP COMMANDS',      'Group Tools'],
            general:    ['🔧', 'GENERAL COMMANDS',    'Basic Utilities'],
            main:       ['🔧', 'GENERAL COMMANDS',    'Basic Utilities'],
            download:   ['📥', 'DOWNLOAD COMMANDS',   'Media Downloader'],
            downloader: ['📥', 'DOWNLOAD COMMANDS',   'Media Downloader'],
            ai:         ['🤖', 'AI & TOOLS',          'Smart Automation'],
            fun:        ['🎉', 'FUN COMMANDS',         'Entertainment'],
            games:      ['🎮', 'GAMES',               'Mini-Games'],
            media:      ['🎬', 'MEDIA',               'Media Tools'],
            sticker:    ['🖼️', 'STICKERS',           'Sticker Maker'],
            stickers:   ['🖼️', 'STICKERS',           'Sticker Maker'],
            tools:      ['🛠️', 'TOOLS',              'Useful Tools'],
            search:     ['🔍', 'SEARCH',              'Search Engines'],
            info:       ['ℹ️', 'INFO COMMANDS',       'Information'],
            news:       ['📰', 'NEWS',                'Latest News'],
            music:      ['🎵', 'MUSIC',               'Music Tools'],
            stalk:      ['🕵️', 'STALK',             'Profile Lookup'],
            utility:    ['🧮', 'UTILITY',             'Advanced Utilities'],
            anime:      ['🎌', 'ANIME',               'Anime & Manga'],
            convert:    ['🔄', 'CONVERTER',           'File Conversion'],
            converter:  ['🔄', 'CONVERTER',           'File Conversion'],
            img_edit:   ['🖌️', 'IMAGE EDIT',         'Image Manipulation'],
            wallpapers: ['🌄', 'WALLPAPERS',          'Wallpaper Gallery'],
            quotes:     ['💬', 'QUOTES',              'Quotes & Wisdom'],
            whatsapp:   ['💚', 'WHATSAPP',            'WA Utilities'],
            economy:    ['💰', 'ECONOMY',             'Coins & Rewards'],
            nsfw:       ['🔞', 'NSFW',                'Adult Content (Admin)'],
            other:      ['⚙️', 'OTHER',              'Miscellaneous'],
            misc:       ['⚙️', 'OTHER',              'Miscellaneous'],
            menu:       ['📋', 'MENU & NOTES',        'Help & Navigation'],
            image:      ['▸',  'IMAGE',               'Image Tools'],
        };

        const mergeMap = { main: 'general', download: 'downloader', stickers: 'sticker', convert: 'converter', misc: 'other' };
        const mergedCategories = {};
        for (const [cat, cmds] of Object.entries(categories)) {
            const key = mergeMap[cat] || cat;
            if (!mergedCategories[key]) mergedCategories[key] = new Set();
            for (const c of cmds) mergedCategories[key].add(c);
        }

        const ORDER = [
            'owner','admin','group','general','downloader','ai','fun',
            'games','media','sticker','img_edit','tools','search','info',
            'news','music','stalk','utility','anime','converter','wallpapers',
            'quotes','whatsapp','economy','nsfw','menu','other','image',
        ];

        const totalCmds = [...new Set(registry.map(p => p.command))].length;

        let text = '';

        // ── Header ────────────────────────────────────────────────
        text += `( 🍁 ) ───ⒺⒹⓌⒶⓇⒹ ⓂⒹ\n`;
        text += `─── REVOLUTIONARY AUTOMATION SYSTEM ───\n`;
        text += `Next-generation bot with speed, flexibility,\nand absolute security has awakened.\n`;
        text += `〢「 🅴🅳🆆🅰🆁🅳  🅼🅳 」\n`;
        text += `࿇ Bot    : ${botName}\n`;
        text += `࿇ Prefix : [ ${prefix} ]\n`;
        text += `࿇ User   : ${userDisplay}\n`;
        text += `࿇ Type   : ( Case─Plugins )\n`;
        text += `࿇ League : Africa/Lagos\n`;
        text += `࿇ Time   : ${lagosTime}\n`;
        text += `࿇ Cmds   : ${totalCmds} commands\n`;

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
            text += `┌─────────\n`;
            text += `├──── ▢ ( ${emoji} ) ${label} (${cmds.length})\n`;
            if (desc) text += `├── ▢ ${desc}\n`;
            for (const c of cmds) {
                text += `│── ${prefix}${c}\n`;
            }
            text += `└────\n`;
        }

        // ── Footer ────────────────────────────────────────────────
        text += `💡  Type ${prefix}help  for command info\n`;
        text += `📌  Owner & Admin commands require proper permission\n`;
        text += `🍁  ${botName}  🍁`;

        await sock.sendMessage(chatId, { text }, { quoted: message });
    }
};
