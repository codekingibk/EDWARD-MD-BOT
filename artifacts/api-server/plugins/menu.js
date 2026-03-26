export default {
    command: 'menu',
    aliases: ['help', 'cmds', 'commands', 'start'],
    category: 'general',
    description: 'Show all available bot commands',
    usage: '.menu',
    isPrefixless: false,
    async handler(sock, message, args, context) {
        const { chatId, config } = context;
        const prefix = config?.prefix || '.';
        const botName = config?.botName || 'MEGA-MD';

        const registry = globalThis._pluginRegistry || [];
        const categories = {};

        for (const p of registry) {
            const cat = p.category || 'general';
            if (!categories[cat]) categories[cat] = [];
            if (!categories[cat].includes(p.command)) {
                categories[cat].push(p.command);
            }
        }

        const catEmojis = {
            general: '🔧', owner: '👑', group: '👥', fun: '🎉', media: '🎬',
            downloader: '📥', tools: '🛠️', search: '🔍', ai: '🤖', anime: '🎌',
            sticker: '🎭', converter: '🔄', nsfw: '🔞', economy: '💰',
            menu: '📋', misc: '⚙️'
        };

        const totalCmds = registry.length;
        let text = `╔═══════════════════╗\n`;
        text += `║  🤖 *${botName}*  ║\n`;
        text += `╚═══════════════════╝\n\n`;
        text += `📌 *Prefix:* \`${prefix}\`\n`;
        text += `📦 *Total Commands:* ${totalCmds}\n\n`;
        text += `━━━━━━━━━━━━━━━━━━━━\n\n`;

        const sortedCats = Object.entries(categories).sort((a, b) => a[0].localeCompare(b[0]));

        for (const [cat, cmds] of sortedCats) {
            const emoji = catEmojis[cat] || '▸';
            text += `${emoji} *${cat.toUpperCase()}* (${cmds.length})\n`;
            text += cmds.map(c => `  ∙ \`${prefix}${c}\``).join('\n');
            text += '\n\n';
        }

        text += `━━━━━━━━━━━━━━━━━━━━\n`;
        text += `💡 _Type \`${prefix}<command>\` to use_\n`;
        text += `📞 _Owner commands require permission_`;

        await sock.sendMessage(chatId, { text }, { quoted: message });
    }
};
