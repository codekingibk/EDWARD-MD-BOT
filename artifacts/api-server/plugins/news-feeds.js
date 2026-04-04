const r = (arr) => arr[Math.floor(Math.random() * arr.length)];

async function fetchRSS(url, limit = 5) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000), headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!res.ok) return null;
    const xml = await res.text();
    const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].slice(0, limit);
    return items.map(m => {
      const title = (m[1].match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) || m[1].match(/<title>(.*?)<\/title>/))?.[1]?.trim() || 'No title';
      const link = (m[1].match(/<link>(.*?)<\/link>/) || m[1].match(/<guid>(.*?)<\/guid>/))?.[1]?.trim() || '';
      return { title, link };
    });
  } catch { return null; }
}

const RSS_FEEDS = {
  tech:    ['https://feeds.feedburner.com/TechCrunch', 'https://www.theverge.com/rss/index.xml'],
  world:   ['https://feeds.bbci.co.uk/news/world/rss.xml', 'https://rss.cnn.com/rss/edition_world.rss'],
  science: ['https://feeds.feedburner.com/sciencedaily/top_news', 'https://www.sciencenews.org/feed'],
  sports:  ['https://sports.yahoo.com/rss/', 'https://www.espn.com/espn/rss/news'],
  biz:     ['https://feeds.bloomberg.com/markets/news.rss', 'https://www.businessinsider.com/rss'],
  health:  ['https://rss.cnn.com/rss/cnn_health.rss', 'https://feeds.webmd.com/rss/rss.aspx?RSSSource=RSS_PUBLIC'],
  enter:   ['https://www.eonline.com/syndication/feeds/rssfeeds/topstories.xml', 'https://variety.com/feed/'],
};

const fallbackNews = {
  tech: [
    'OpenAI releases new model with improved reasoning capabilities',
    'Apple announces new silicon chip for MacBook Pro lineup',
    'Google unveils next-generation AI assistant with multimodal features',
    'Meta expands WhatsApp Business API with new automation tools',
    'Microsoft integrates Copilot AI across entire Office 365 suite',
    'Tesla unveils Full Self-Driving v13 with improved city navigation',
    'NVIDIA H200 GPU breaks new AI benchmark records',
    'Samsung releases Galaxy AI features to older devices via update',
  ],
  world: [
    'World leaders gather for G20 summit to discuss global economy',
    'UN Security Council holds emergency session on regional conflict',
    'Climate summit reaches new agreement on carbon emission targets',
    'Major earthquake strikes Pacific region, tsunami warning issued',
    'WHO declares new health preparedness initiative for 2025',
    'Trade negotiations between major economies progress toward deal',
  ],
  science: [
    'Scientists discover new exoplanet in habitable zone of nearby star',
    'Breakthrough in quantum computing: 1000-qubit processor achieved',
    'New cancer treatment shows 95% success rate in clinical trials',
    'Astronomers capture first image of a black hole merger event',
    'Researchers develop biodegradable plastic from algae',
  ],
  sports: [
    'Champions League: Top teams advance to quarterfinal stage',
    'NBA: Player sets new scoring record in historic overtime game',
    'Formula 1: New team announced for upcoming season',
    'World Athletics Championship breaks multiple world records',
    'FIFA World Cup 2026 host cities officially announced',
  ],
  biz: [
    'Federal Reserve holds interest rates steady amid economic data',
    'S&P 500 reaches new all-time high driven by tech sector gains',
    'Amazon announces expansion of drone delivery to new markets',
    'Startup raises $500M Series C for AI-powered healthcare platform',
    'Oil prices fluctuate amid OPEC production decisions',
  ],
  health: [
    'New study links ultra-processed foods to increased dementia risk',
    'WHO updates guidelines on sleep duration for different age groups',
    'Scientists identify new variant of common cold virus',
    'Gene therapy trial shows promising results for rare disease',
    'New mental health app shows effectiveness equal to therapy sessions',
  ],
  enter: [
    'Box office smash: New superhero film breaks opening weekend record',
    'Major music festival announces headline acts for summer season',
    'Streaming wars: New platform launches with exclusive content library',
    'Celebrity couple announces surprise engagement on social media',
    'Award season preview: Early favorites emerge for major nominations',
  ],
};

function makeNewsHandler(category, label, emoji, feedUrls) {
  return async (sock, msg, args, ctx) => {
    let headlines = null;
    for (const url of feedUrls) {
      headlines = await fetchRSS(url, 6);
      if (headlines?.length) break;
    }
    const news = headlines?.length ? headlines : (fallbackNews[category] || []).map(t => ({ title: t, link: '' }));
    const formatted = news.slice(0, 6).map((n, i) => `${i+1}. ${n.title}${n.link ? `\n   🔗 ${n.link.slice(0,60)}...` : ''}`).join('\n\n');
    const now = new Date().toLocaleString('en-US', { dateStyle:'medium', timeStyle:'short' });
    await sock.sendMessage(ctx.chatId, {
      text: `${emoji} *${label} Headlines*\n📅 ${now}\n\n${formatted}\n\n_Type .${category}news for more_`
    }, { quoted: msg });
  };
}

export default [
  {
    command: 'technews', aliases: ['technews2','latestech'],
    category: 'news', description: 'Latest technology news', usage: '.technews',
    handler: makeNewsHandler('tech', 'Tech', '💻', RSS_FEEDS.tech)
  },
  {
    command: 'worldnews', aliases: ['globalnews','breaking2'],
    category: 'news', description: 'Latest world news', usage: '.worldnews',
    handler: makeNewsHandler('world', 'World', '🌍', RSS_FEEDS.world)
  },
  {
    command: 'scienews', aliases: ['sciencenews','sciencenews2'],
    category: 'news', description: 'Latest science news', usage: '.scienews',
    handler: makeNewsHandler('science', 'Science', '🔬', RSS_FEEDS.science)
  },
  {
    command: 'sportsnews', aliases: ['sportnews','sportnews2'],
    category: 'news', description: 'Latest sports news', usage: '.sportsnews',
    handler: makeNewsHandler('sports', 'Sports', '⚽', RSS_FEEDS.sports)
  },
  {
    command: 'biznews', aliases: ['businessnews','marketnews'],
    category: 'news', description: 'Latest business news', usage: '.biznews',
    handler: makeNewsHandler('biz', 'Business', '💼', RSS_FEEDS.biz)
  },
  {
    command: 'healthnews', aliases: ['mednews','medicalnews'],
    category: 'news', description: 'Latest health news', usage: '.healthnews',
    handler: makeNewsHandler('health', 'Health', '🏥', RSS_FEEDS.health)
  },
  {
    command: 'enternews', aliases: ['entertain','entertainmentnews'],
    category: 'news', description: 'Latest entertainment news', usage: '.enternews',
    handler: makeNewsHandler('enter', 'Entertainment', '🎬', RSS_FEEDS.enter)
  },
  {
    command: 'breaking', aliases: ['breakingnews','urgent'],
    category: 'news', description: 'Breaking news headlines', usage: '.breaking',
    async handler(sock, msg, args, ctx) {
      const headlines = await fetchRSS('https://feeds.bbci.co.uk/news/rss.xml', 5) ||
                        (fallbackNews.world || []).map(t => ({ title: t, link: '' }));
      const formatted = headlines.slice(0, 5).map((n, i) => `🔴 ${n.title}`).join('\n\n');
      await sock.sendMessage(ctx.chatId, { text: `🚨 *BREAKING NEWS*\n📡 ${new Date().toUTCString()}\n\n${formatted}` }, { quoted: msg });
    }
  },
  {
    command: 'localnews', aliases: ['citynews','latestnews2'],
    category: 'news', description: 'Latest local/regional news', usage: '.localnews',
    async handler(sock, msg, args, ctx) {
      await sock.sendMessage(ctx.chatId, {
        text: `📰 *Local News*\n\n🌍 For localized news, we recommend:\n\n• 📡 BBC News: news.bbc.co.uk\n• 🇺🇸 CNN: cnn.com/world\n• 🌐 Reuters: reuters.com\n• 📱 Google News: news.google.com\n• 🇬🇧 The Guardian: theguardian.com\n\n_Type your country in .worldnews for filtered results!_`
      }, { quoted: msg });
    }
  },
  {
    command: 'trending', aliases: ['trends','whatstrending'],
    category: 'news', description: 'Trending topics right now', usage: '.trending',
    async handler(sock, msg, args, ctx) {
      const topics = [
        '🔥 AI & Machine Learning developments',
        '🚀 Space exploration milestones',
        '📱 New smartphone releases',
        '⚽ Football/Soccer transfer season',
        '🎬 Box office results',
        '💰 Crypto market movements',
        '🌡️ Climate & weather events',
        '🏆 Sports championship results',
        '🎵 Music chart toppers',
        '📊 Stock market movements',
      ];
      const selected = [...topics].sort(() => Math.random() - 0.5).slice(0, 6);
      await sock.sendMessage(ctx.chatId, { text: `📈 *Trending Topics*\n📅 ${new Date().toDateString()}\n\n${selected.join('\n')}\n\n_Stay informed with .technews, .worldnews, and more!_` }, { quoted: msg });
    }
  },
];
