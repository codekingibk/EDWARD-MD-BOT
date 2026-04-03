import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');
const WEBSITE = process.env['BOT_WEBSITE'] || 'https://edward-md.replit.app';

function resolveMenuMedia(url) {
    if (!url) return null;
    if (url.startsWith('/api/uploads/')) {
        const filename = url.replace('/api/uploads/', '');
        const filepath = path.join(UPLOADS_DIR, filename);
        if (existsSync(filepath)) return { type: 'file', buffer: readFileSync(filepath) };
        return null;
    }
    if (/^https?:\/\//.test(url)) return { type: 'url', url };
    return null;
}

function buildMenuText(prefix, botName, tierBadge, userDisplay, lagosTime, totalCmds, mergedCategories, ordered, catConfig, config, serverStats) {
    let text = '';
    text += `( 🍁 ) ───ⒺⒹⓌⒶⓇⒹ ⓂⒹ\n`;
    text += `─── REVOLUTIONARY AUTOMATION SYSTEM ───\n`;
    text += `Next-generation bot with speed, flexibility,\nand absolute security has awakened.\n`;
    text += `〢「 🅴🅳🆆🅰🆁🅳  🅼🅳 」\n`;
    text += `࿇ Bot    : ${botName}\n`;
    text += `࿇ Server : ${tierBadge}\n`;
    text += `࿇ Prefix : [ ${prefix} ]\n`;
    text += `࿇ User   : ${userDisplay}\n`;
    text += `࿇ Type   : ( Case─Plugins )\n`;
    text += `࿇ League : Africa/Lagos\n`;
    text += `࿇ Time   : ${lagosTime}\n`;
    text += `࿇ Cmds   : ${totalCmds} commands\n`;

    if (serverStats) {
        const { userCount, maxUsers, usedMB, maxMB, tier } = serverStats;
        const spaceLeft = maxMB - usedMB;
        const tierIcon = tier === 'premium' ? '👑' : '🆓';
        text += `${tierIcon} Server : ${userCount}/${maxUsers} users | ${spaceLeft}MB free\n`;
    }

    for (const cat of ordered) {
        const cmds = [...mergedCategories[cat]].sort();
        if (cmds.length === 0) continue;
        const [emoji, label, desc] = catConfig[cat] || ['▸', cat.toUpperCase(), ''];
        text += `┌─────────\n`;
        text += `├──── ▢ ( ${emoji} ) ${label} (${cmds.length})\n`;
        if (desc) text += `├── ▢ ${desc}\n`;
        for (const c of cmds) text += `│── ${prefix}${c}\n`;
        text += `└────\n`;
    }

    text += `💡  Type ${prefix}help  for command info\n`;
    text += `📌  Owner & Admin commands require proper permission\n`;
    if (config?.menuChannelName) text += `📢  Channel : ${config.menuChannelName}\n`;
    if (config?.menuNewsletterId) text += `🔗  Newsletter : ${config.menuNewsletterId}\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `🚀 *Get your own FREE bot!*\n`;
    text += `👉 ${WEBSITE}\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `🍁  ${botName}  🍁`;
    return text;
}

async function fetchServerStats() {
    try {
        const helpers = globalThis._dbHelpers;
        if (!helpers || !helpers.isDbConnected()) return null;
        const [server, userCount] = await Promise.all([
            helpers.getServerInfo('main'),
            helpers.getUserCount('main'),
        ]);
        if (!server) return null;
        return {
            userCount,
            maxUsers: server.maxUsers,
            usedMB: server.usedStorageMB,
            maxMB: server.maxStorageMB,
            tier: server.tier,
        };
    } catch {
        return null;
    }
}

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
        const serverTier = String(config?.serverTier || 'free').toUpperCase();
        const tierBadge = serverTier === 'PREMIUM' ? '👑 PREMIUM' : '🆓 FREE';
        const menuType = config?.menuType || 'image';

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
        const allKeys = Object.keys(mergedCategories);
        const ordered = [
            ...ORDER.filter(k => allKeys.includes(k)),
            ...allKeys.filter(k => !ORDER.includes(k)).sort(),
        ];

        const serverStats = await fetchServerStats();
        const text = buildMenuText(prefix, botName, tierBadge, userDisplay, lagosTime, totalCmds, mergedCategories, ordered, catConfig, config, serverStats);

        const advertFooter = `🚀 Get your own FREE bot → ${WEBSITE}`;

        // ── Button / List Menu ─────────────────────────────────
        if (menuType === 'buttons') {
            try {
                const sections = [];
                for (const cat of ordered) {
                    const cmds = [...mergedCategories[cat]].sort();
                    if (cmds.length === 0) continue;
                    const [emoji, label] = catConfig[cat] || ['▸', cat.toUpperCase()];
                    const rows = cmds.slice(0, 10).map(c => ({
                        title: `${prefix}${c}`,
                        rowId: `cmd_${c}`,
                        description: `${emoji} ${label}`,
                    }));
                    if (rows.length > 0) sections.push({ title: `${emoji} ${label}`, rows });
                }

                const listTitle = `🍁 ${botName}`;
                const listBody = `${tierBadge}  |  ${prefix} prefix  |  ${totalCmds} commands\n\n${advertFooter}`;

                if (sections.length > 0) {
                    await sock.sendMessage(chatId, {
                        text: listBody,
                        title: listTitle,
                        buttonText: '📋 Browse Commands',
                        footer: `${botName} • Africa/Lagos`,
                        sections: sections.slice(0, 10),
                        listType: 1,
                    }, { quoted: message });
                } else {
                    await sock.sendMessage(chatId, { text }, { quoted: message });
                }
            } catch {
                // Fallback to image/text if list message is unsupported
                await sock.sendMessage(chatId, { text }, { quoted: message });
            }

            const audioMedia = resolveMenuMedia(config?.menuAudioUrl);
            if (audioMedia) {
                try {
                    const audioField = audioMedia.type === 'file'
                        ? { audio: audioMedia.buffer, mimetype: 'audio/mpeg' }
                        : { audio: { url: audioMedia.url }, mimetype: 'audio/mpeg' };
                    await sock.sendMessage(chatId, { ...audioField, ptt: false }, { quoted: message });
                } catch {}
            }
            return;
        }

        // ── Image Menu ─────────────────────────────────────────
        if (menuType === 'image' || menuType === undefined || menuType === null) {
            const imageMedia = resolveMenuMedia(config?.menuImageUrl);
            if (imageMedia) {
                try {
                    const imageField = imageMedia.type === 'file'
                        ? { image: imageMedia.buffer }
                        : { image: { url: imageMedia.url } };
                    await sock.sendMessage(chatId, { ...imageField, caption: text }, { quoted: message });
                } catch {
                    await sock.sendMessage(chatId, { text }, { quoted: message });
                }
            } else {
                await sock.sendMessage(chatId, { text }, { quoted: message });
            }

            const audioMedia = resolveMenuMedia(config?.menuAudioUrl);
            if (audioMedia) {
                try {
                    const audioField = audioMedia.type === 'file'
                        ? { audio: audioMedia.buffer, mimetype: 'audio/mpeg' }
                        : { audio: { url: audioMedia.url }, mimetype: 'audio/mpeg' };
                    await sock.sendMessage(chatId, { ...audioField, ptt: false }, { quoted: message });
                } catch {}
            }
            return;
        }

        // ── Text Menu (default fallback) ───────────────────────
        await sock.sendMessage(chatId, { text }, { quoted: message });

        const audioMedia = resolveMenuMedia(config?.menuAudioUrl);
        if (audioMedia) {
            try {
                const audioField = audioMedia.type === 'file'
                    ? { audio: audioMedia.buffer, mimetype: 'audio/mpeg' }
                    : { audio: { url: audioMedia.url }, mimetype: 'audio/mpeg' };
                await sock.sendMessage(chatId, { ...audioField, ptt: false }, { quoted: message });
            } catch {}
        }
    }
};
