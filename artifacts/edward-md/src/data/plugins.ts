export interface Plugin {
  id: string;
  name: string;
  command: string;
  usage: string;
  description: string;
  category: string;
  enabled: boolean;
  cooldown: number;
  usageCount: number;
}

export interface PluginCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export const pluginCategories: PluginCategory[] = [
  { id: 'all', name: 'All Plugins', icon: 'Grid3X3', color: '#25D366' },
  { id: 'ai', name: 'AI & Chat', icon: 'Brain', color: '#8b5cf6' },
  { id: 'downloader', name: 'Downloader', icon: 'Download', color: '#3b82f6' },
  { id: 'fun', name: 'Fun & Games', icon: 'Gamepad2', color: '#f59e0b' },
  { id: 'group', name: 'Group Tools', icon: 'Users', color: '#25D366' },
  { id: 'media', name: 'Media', icon: 'Image', color: '#ec4899' },
  { id: 'sticker', name: 'Sticker', icon: 'Smile', color: '#06b6d4' },
  { id: 'tools', name: 'Utilities', icon: 'Wrench', color: '#f59e0b' },
  { id: 'owner', name: 'Owner Only', icon: 'Crown', color: '#f59e0b' },
  { id: 'nsfw', name: 'NSFW', icon: 'EyeOff', color: '#ef4444' },
  { id: 'anime', name: 'Anime', icon: 'Tv', color: '#8b5cf6' },
  { id: 'converter', name: 'Converter', icon: 'ArrowLeftRight', color: '#06b6d4' },
  { id: 'search', name: 'Search', icon: 'Search', color: '#3b82f6' },
  { id: 'economy', name: 'Economy', icon: 'Shield', color: '#25D366' },
];

export const defaultPlugins: Plugin[] = [
  // AI
  { id: 'chatgpt', name: 'ChatGPT', command: 'gpt', usage: '.gpt <text>', description: 'Chat with ChatGPT AI', category: 'ai', enabled: true, cooldown: 5, usageCount: 4820 },
  { id: 'gemini', name: 'Gemini AI', command: 'gemini', usage: '.gemini <text>', description: 'Ask Google Gemini anything', category: 'ai', enabled: true, cooldown: 5, usageCount: 3120 },
  { id: 'claude', name: 'Claude AI', command: 'claude', usage: '.claude <text>', description: 'Chat with Anthropic Claude', category: 'ai', enabled: false, cooldown: 5, usageCount: 1450 },
  { id: 'imagine', name: 'AI Image', command: 'imagine', usage: '.imagine <prompt>', description: 'Generate AI images from text', category: 'ai', enabled: true, cooldown: 10, usageCount: 2890 },
  { id: 'bard', name: 'Bard AI', command: 'bard', usage: '.bard <text>', description: 'Chat with Google Bard', category: 'ai', enabled: false, cooldown: 5, usageCount: 890 },

  // Downloader
  { id: 'ytmp3', name: 'YouTube MP3', command: 'ytmp3', usage: '.ytmp3 <url>', description: 'Download YouTube audio as MP3', category: 'downloader', enabled: true, cooldown: 15, usageCount: 7650 },
  { id: 'ytmp4', name: 'YouTube MP4', command: 'ytmp4', usage: '.ytmp4 <url>', description: 'Download YouTube video as MP4', category: 'downloader', enabled: true, cooldown: 20, usageCount: 5430 },
  { id: 'tiktok', name: 'TikTok DL', command: 'tiktok', usage: '.tiktok <url>', description: 'Download TikTok video without watermark', category: 'downloader', enabled: true, cooldown: 10, usageCount: 9210 },
  { id: 'instagram', name: 'Instagram DL', command: 'igdl', usage: '.igdl <url>', description: 'Download Instagram photos/videos/reels', category: 'downloader', enabled: true, cooldown: 10, usageCount: 6340 },
  { id: 'twitter', name: 'Twitter DL', command: 'twitter', usage: '.twitter <url>', description: 'Download Twitter/X videos', category: 'downloader', enabled: true, cooldown: 10, usageCount: 3210 },
  { id: 'facebook', name: 'Facebook DL', command: 'fb', usage: '.fb <url>', description: 'Download Facebook videos', category: 'downloader', enabled: true, cooldown: 10, usageCount: 2140 },
  { id: 'spotify', name: 'Spotify DL', command: 'spotify', usage: '.spotify <url>', description: 'Download Spotify tracks', category: 'downloader', enabled: false, cooldown: 15, usageCount: 4560 },
  { id: 'mediafire', name: 'MediaFire DL', command: 'mediafire', usage: '.mediafire <url>', description: 'Download from MediaFire', category: 'downloader', enabled: true, cooldown: 10, usageCount: 1230 },

  // Fun
  { id: 'joke', name: 'Joke', command: 'joke', usage: '.joke', description: 'Get a random funny joke', category: 'fun', enabled: true, cooldown: 3, usageCount: 5670 },
  { id: 'meme', name: 'Meme Generator', command: 'meme', usage: '.meme', description: 'Get a random meme', category: 'fun', enabled: true, cooldown: 5, usageCount: 8920 },
  { id: 'truth', name: 'Truth', command: 'truth', usage: '.truth', description: 'Random truth question', category: 'fun', enabled: true, cooldown: 3, usageCount: 3450 },
  { id: 'dare', name: 'Dare', command: 'dare', usage: '.dare', description: 'Random dare challenge', category: 'fun', enabled: true, cooldown: 3, usageCount: 3120 },
  { id: 'quote', name: 'Quote', command: 'quote', usage: '.quote', description: 'Get an inspirational quote', category: 'fun', enabled: true, cooldown: 3, usageCount: 2340 },
  { id: 'fact', name: 'Fun Fact', command: 'fact', usage: '.fact', description: 'Get a random fun fact', category: 'fun', enabled: true, cooldown: 3, usageCount: 1980 },
  { id: 'riddle', name: 'Riddle', command: 'riddle', usage: '.riddle', description: 'Get a brain teaser riddle', category: 'fun', enabled: true, cooldown: 5, usageCount: 1560 },
  { id: 'ship', name: 'Ship', command: 'ship', usage: '.ship @user1 @user2', description: 'Ship two users together', category: 'fun', enabled: true, cooldown: 3, usageCount: 4230 },
  { id: '8ball', name: '8 Ball', command: '8ball', usage: '.8ball <question>', description: 'Ask the magic 8 ball', category: 'fun', enabled: true, cooldown: 3, usageCount: 3780 },

  // Group
  { id: 'kick', name: 'Kick Member', command: 'kick', usage: '.kick @user', description: 'Remove a member from the group', category: 'group', enabled: true, cooldown: 2, usageCount: 1230 },
  { id: 'promote', name: 'Promote', command: 'promote', usage: '.promote @user', description: 'Promote member to admin', category: 'group', enabled: true, cooldown: 2, usageCount: 870 },
  { id: 'demote', name: 'Demote', command: 'demote', usage: '.demote @user', description: 'Demote admin to member', category: 'group', enabled: true, cooldown: 2, usageCount: 650 },
  { id: 'tagall', name: 'Tag All', command: 'tagall', usage: '.tagall <msg>', description: 'Tag all group members', category: 'group', enabled: true, cooldown: 30, usageCount: 3450 },
  { id: 'mute', name: 'Mute Group', command: 'mute', usage: '.mute', description: 'Mute group (only admins can send)', category: 'group', enabled: true, cooldown: 5, usageCount: 780 },
  { id: 'unmute', name: 'Unmute Group', command: 'unmute', usage: '.unmute', description: 'Unmute group for all members', category: 'group', enabled: true, cooldown: 5, usageCount: 760 },
  { id: 'groupinfo', name: 'Group Info', command: 'groupinfo', usage: '.groupinfo', description: 'Show group information', category: 'group', enabled: true, cooldown: 5, usageCount: 2130 },
  { id: 'link', name: 'Group Link', command: 'link', usage: '.link', description: 'Get group invite link', category: 'group', enabled: true, cooldown: 5, usageCount: 1890 },
  { id: 'revoke', name: 'Revoke Link', command: 'revoke', usage: '.revoke', description: 'Revoke and reset group invite link', category: 'group', enabled: true, cooldown: 5, usageCount: 430 },

  // Media
  { id: 'blur', name: 'Blur Image', command: 'blur', usage: '.blur', description: 'Blur a replied image', category: 'media', enabled: true, cooldown: 5, usageCount: 1560 },
  { id: 'enhance', name: 'Enhance Image', command: 'enhance', usage: '.enhance', description: 'AI-enhance image quality', category: 'media', enabled: true, cooldown: 10, usageCount: 2340 },
  { id: 'waifu', name: 'Waifu', command: 'waifu', usage: '.waifu', description: 'Get random anime character image', category: 'media', enabled: true, cooldown: 5, usageCount: 4560 },
  { id: 'neko', name: 'Neko', command: 'neko', usage: '.neko', description: 'Get random neko image', category: 'media', enabled: true, cooldown: 5, usageCount: 3210 },
  { id: 'toimg', name: 'To Image', command: 'toimg', usage: '.toimg', description: 'Convert sticker to image', category: 'media', enabled: true, cooldown: 5, usageCount: 2890 },
  { id: 'caption', name: 'AI Caption', command: 'caption', usage: '.caption', description: 'Generate caption for image using AI', category: 'media', enabled: true, cooldown: 8, usageCount: 1780 },

  // Sticker
  { id: 'sticker', name: 'Make Sticker', command: 'sticker', usage: '.sticker', description: 'Convert image/video to sticker', category: 'sticker', enabled: true, cooldown: 5, usageCount: 12340 },
  { id: 'emojimix', name: 'Emoji Mix', command: 'emojimix', usage: '.emojimix 😀+😎', description: 'Mix two emojis together', category: 'sticker', enabled: true, cooldown: 5, usageCount: 6780 },
  { id: 'attp', name: 'Animated Text', command: 'attp', usage: '.attp <text>', description: 'Create animated text sticker', category: 'sticker', enabled: true, cooldown: 5, usageCount: 4560 },
  { id: 'ttp', name: 'Text to Sticker', command: 'ttp', usage: '.ttp <text>', description: 'Convert text to sticker', category: 'sticker', enabled: true, cooldown: 5, usageCount: 5670 },

  // Tools / Utilities
  { id: 'calculator', name: 'Calculator', command: 'calc', usage: '.calc <expr>', description: 'Perform mathematical calculations', category: 'tools', enabled: true, cooldown: 2, usageCount: 2340 },
  { id: 'translate', name: 'Translate', command: 'tr', usage: '.tr <lang> <text>', description: 'Translate text to any language', category: 'tools', enabled: true, cooldown: 3, usageCount: 3780 },
  { id: 'weather', name: 'Weather', command: 'weather', usage: '.weather <city>', description: 'Get current weather for any city', category: 'tools', enabled: true, cooldown: 5, usageCount: 2560 },
  { id: 'dictionary', name: 'Dictionary', command: 'dict', usage: '.dict <word>', description: 'Get word definition', category: 'tools', enabled: true, cooldown: 3, usageCount: 1890 },
  { id: 'shorten', name: 'URL Shortener', command: 'short', usage: '.short <url>', description: 'Shorten any URL', category: 'tools', enabled: true, cooldown: 3, usageCount: 1340 },
  { id: 'qr', name: 'QR Code', command: 'qr', usage: '.qr <text>', description: 'Generate QR code from text', category: 'tools', enabled: true, cooldown: 5, usageCount: 2130 },
  { id: 'tts', name: 'Text to Speech', command: 'tts', usage: '.tts <text>', description: 'Convert text to voice message', category: 'tools', enabled: true, cooldown: 5, usageCount: 3450 },
  { id: 'ocr', name: 'OCR', command: 'ocr', usage: '.ocr', description: 'Extract text from replied image', category: 'tools', enabled: true, cooldown: 5, usageCount: 1670 },

  // Owner
  { id: 'broadcast', name: 'Broadcast', command: 'bc', usage: '.bc <msg>', description: 'Broadcast message to all chats', category: 'owner', enabled: true, cooldown: 30, usageCount: 340 },
  { id: 'setpp', name: 'Set Bot PP', command: 'setpp', usage: '.setpp', description: 'Set bot profile picture', category: 'owner', enabled: true, cooldown: 10, usageCount: 120 },
  { id: 'getpp', name: 'Get PP', command: 'getpp', usage: '.getpp @user', description: 'Get user profile picture', category: 'owner', enabled: true, cooldown: 5, usageCount: 890 },
  { id: 'block', name: 'Block User', command: 'block', usage: '.block @user', description: 'Block a user from using bot', category: 'owner', enabled: true, cooldown: 5, usageCount: 230 },
  { id: 'unblock', name: 'Unblock User', command: 'unblock', usage: '.unblock @user', description: 'Unblock a previously blocked user', category: 'owner', enabled: true, cooldown: 5, usageCount: 180 },

  // Search
  { id: 'google', name: 'Google Search', command: 'google', usage: '.google <query>', description: 'Search the web via Google', category: 'search', enabled: true, cooldown: 5, usageCount: 3450 },
  { id: 'youtube', name: 'YouTube Search', command: 'yts', usage: '.yts <query>', description: 'Search YouTube videos', category: 'search', enabled: true, cooldown: 5, usageCount: 2340 },
  { id: 'wiki', name: 'Wikipedia', command: 'wiki', usage: '.wiki <query>', description: 'Search Wikipedia articles', category: 'search', enabled: true, cooldown: 5, usageCount: 1780 },
  { id: 'lyrics', name: 'Song Lyrics', command: 'lyrics', usage: '.lyrics <song>', description: 'Get lyrics for any song', category: 'search', enabled: true, cooldown: 5, usageCount: 2890 },
  { id: 'news', name: 'News', command: 'news', usage: '.news <topic>', description: 'Get latest news on any topic', category: 'search', enabled: true, cooldown: 10, usageCount: 1560 },

  // Anime
  { id: 'anime', name: 'Anime Search', command: 'anime', usage: '.anime <title>', description: 'Search anime information', category: 'anime', enabled: true, cooldown: 5, usageCount: 2340 },
  { id: 'manga', name: 'Manga Search', command: 'manga', usage: '.manga <title>', description: 'Search manga information', category: 'anime', enabled: true, cooldown: 5, usageCount: 1890 },
  { id: 'character', name: 'Anime Character', command: 'character', usage: '.character <name>', description: 'Get anime character info', category: 'anime', enabled: true, cooldown: 5, usageCount: 1560 },

  // Converter
  { id: 'mp4tomp3', name: 'MP4 to MP3', command: 'mp4tomp3', usage: '.mp4tomp3', description: 'Convert video to audio', category: 'converter', enabled: true, cooldown: 10, usageCount: 2130 },
  { id: 'webp2mp4', name: 'WebP to MP4', command: 'webp2mp4', usage: '.webp2mp4', description: 'Convert WebP animation to MP4', category: 'converter', enabled: true, cooldown: 10, usageCount: 1670 },
  { id: 'doc2pdf', name: 'Doc to PDF', command: 'doc2pdf', usage: '.doc2pdf', description: 'Convert document to PDF', category: 'converter', enabled: false, cooldown: 15, usageCount: 890 },

  // Economy
  { id: 'balance', name: 'Balance', command: 'bal', usage: '.bal', description: 'Check your coin balance', category: 'economy', enabled: true, cooldown: 5, usageCount: 3450 },
  { id: 'daily', name: 'Daily Reward', command: 'daily', usage: '.daily', description: 'Claim your daily reward', category: 'economy', enabled: true, cooldown: 86400, usageCount: 2780 },
  { id: 'leaderboard', name: 'Leaderboard', command: 'lb', usage: '.lb', description: 'Show top users by balance', category: 'economy', enabled: true, cooldown: 10, usageCount: 1890 },
  { id: 'transfer', name: 'Transfer', command: 'transfer', usage: '.transfer @user <amount>', description: 'Transfer coins to another user', category: 'economy', enabled: true, cooldown: 10, usageCount: 1230 },
];

export function getPluginsByCategory(plugins: Plugin[], category: string): Plugin[] {
  if (category === 'all') return plugins;
  return plugins.filter(p => p.category === category);
}

export function getTotalUsage(plugins: Plugin[]): number {
  return plugins.reduce((sum, p) => sum + p.usageCount, 0);
}
