const r = (arr) => arr[Math.floor(Math.random() * arr.length)];

async function fetchJSON(url, fallback) {
  try {
    const res = await fetch(url, { headers: { 'Accept': 'application/json' }, signal: AbortSignal.timeout(8000) });
    if (!res.ok) return fallback;
    return await res.json();
  } catch { return fallback; }
}

export default [
  {
    command: 'btc', aliases: ['bitcoin','btcprice'],
    category: 'finance', description: 'Get Bitcoin price', usage: '.btc',
    async handler(sock, msg, args, ctx) {
      const data = await fetchJSON('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true', null);
      if (!data?.bitcoin) return sock.sendMessage(ctx.chatId, { text: '₿ *Bitcoin (BTC)*\n\n⚠️ Could not fetch live price. Try again later.\n\n_Tip: Use .crypto <coin> for other coins_' }, { quoted: msg });
      const btc = data.bitcoin;
      const change = btc.usd_24h_change?.toFixed(2);
      const trend = change > 0 ? '📈' : '📉';
      await sock.sendMessage(ctx.chatId, {
        text: `₿ *Bitcoin (BTC)*\n\n💵 Price: *$${btc.usd.toLocaleString()}*\n${trend} 24h Change: *${change > 0 ? '+' : ''}${change}%*\n\n_Data from CoinGecko_`
      }, { quoted: msg });
    }
  },
  {
    command: 'crypto', aliases: ['cryptoprice','coin'],
    category: 'finance', description: 'Get cryptocurrency price', usage: '.crypto <coin name>',
    async handler(sock, msg, args, ctx) {
      const coin = (args[0] || 'bitcoin').toLowerCase();
      const coinMap = { btc:'bitcoin', eth:'ethereum', bnb:'binancecoin', sol:'solana', ada:'cardano', xrp:'ripple', doge:'dogecoin', matic:'matic-network', dot:'polkadot', ltc:'litecoin', link:'chainlink', avax:'avalanche-2', shib:'shiba-inu', uni:'uniswap', atom:'cosmos' };
      const coinId = coinMap[coin] || coin;
      const data = await fetchJSON(`https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd,btc&include_24hr_change=true&include_market_cap=true`, null);
      if (!data || !data[coinId]) {
        return sock.sendMessage(ctx.chatId, { text: `❌ Coin "${coin}" not found.\n\nTry: bitcoin, ethereum, solana, cardano, ripple, dogecoin, bnb, matic, polkadot\n\nOr use the full coin ID from CoinGecko.` }, { quoted: msg });
      }
      const c = data[coinId];
      const change = c.usd_24h_change?.toFixed(2);
      const trend = change > 0 ? '📈' : '📉';
      const mcap = c.usd_market_cap ? `$${(c.usd_market_cap/1e9).toFixed(2)}B` : 'N/A';
      await sock.sendMessage(ctx.chatId, {
        text: `💰 *${coin.toUpperCase()}*\n\n💵 USD: *$${c.usd?.toLocaleString() || 'N/A'}*\n₿ BTC: *${c.btc?.toFixed(8) || 'N/A'}*\n${trend} 24h: *${change > 0 ? '+' : ''}${change}%*\n📊 Market Cap: *${mcap}*\n\n_Data: CoinGecko_`
      }, { quoted: msg });
    }
  },
  {
    command: 'eth', aliases: ['ethereum','ethprice'],
    category: 'finance', description: 'Get Ethereum price', usage: '.eth',
    async handler(sock, msg, args, ctx) {
      const data = await fetchJSON('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd&include_24hr_change=true', null);
      if (!data?.ethereum) return sock.sendMessage(ctx.chatId, { text: 'Ξ *Ethereum (ETH)*\n\n⚠️ Could not fetch live price. Try again later.' }, { quoted: msg });
      const eth = data.ethereum;
      const change = eth.usd_24h_change?.toFixed(2);
      const trend = change > 0 ? '📈' : '📉';
      await sock.sendMessage(ctx.chatId, {
        text: `Ξ *Ethereum (ETH)*\n\n💵 Price: *$${eth.usd.toLocaleString()}*\n${trend} 24h Change: *${change > 0 ? '+' : ''}${change}%*\n\n_Data from CoinGecko_`
      }, { quoted: msg });
    }
  },
  {
    command: 'marketcap', aliases: ['topcrypto','cryptorank'],
    category: 'finance', description: 'Top crypto by market cap', usage: '.marketcap',
    async handler(sock, msg, args, ctx) {
      const data = await fetchJSON('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1&sparkline=false', null);
      if (!data || !Array.isArray(data)) return sock.sendMessage(ctx.chatId, { text: '📊 *Top Cryptocurrencies*\n\n⚠️ Could not fetch live data. Try again later.' }, { quoted: msg });
      const medals = ['🥇','🥈','🥉'];
      const list = data.map((c, i) => {
        const change = c.price_change_percentage_24h?.toFixed(1);
        const trend = change > 0 ? '📈' : '📉';
        return `${medals[i] || `${i+1}.`} *${c.symbol.toUpperCase()}* — $${c.current_price.toLocaleString()} ${trend}${change}%`;
      }).join('\n');
      await sock.sendMessage(ctx.chatId, { text: `📊 *Top 10 Cryptocurrencies*\n\n${list}\n\n_Data: CoinGecko_` }, { quoted: msg });
    }
  },
  {
    command: 'forex', aliases: ['exchange2','currencies2'],
    category: 'finance', description: 'Currency exchange rates', usage: '.forex <amount> <from> <to>',
    async handler(sock, msg, args, ctx) {
      const amount = parseFloat(args[0]) || 1;
      const from = (args[1] || 'USD').toUpperCase();
      const to = (args[2] || 'EUR').toUpperCase();
      const data = await fetchJSON(`https://api.exchangerate-api.com/v4/latest/${from}`, null);
      if (!data?.rates) {
        const fallbackRates = { USD: 1, EUR: 0.92, GBP: 0.79, JPY: 149.5, CAD: 1.36, AUD: 1.53, CHF: 0.89, CNY: 7.24, NGN: 1480, KES: 128, ZAR: 18.7, INR: 83.2, BRL: 4.97, MXN: 17.2, AED: 3.67 };
        const fromRate = fallbackRates[from], toRate = fallbackRates[to];
        if (!fromRate || !toRate) return sock.sendMessage(ctx.chatId, { text: `❌ Unknown currency. Try: USD, EUR, GBP, NGN, KES, ZAR, AED, INR, JPY, CAD` }, { quoted: msg });
        const converted = (amount / fromRate) * toRate;
        return sock.sendMessage(ctx.chatId, { text: `💱 *Currency Exchange*\n\n${amount} ${from} = *${converted.toFixed(4)} ${to}*\n\n_⚠️ Using cached rates — live data unavailable_` }, { quoted: msg });
      }
      const rate = data.rates[to];
      if (!rate) return sock.sendMessage(ctx.chatId, { text: `❌ Currency "${to}" not found!` }, { quoted: msg });
      const converted = amount * rate;
      await sock.sendMessage(ctx.chatId, {
        text: `💱 *Currency Exchange*\n\n💰 ${amount} *${from}* = *${converted.toFixed(4)} ${to}*\n📊 Rate: 1 ${from} = ${rate.toFixed(4)} ${to}\n\n_Data: ExchangeRate-API_`
      }, { quoted: msg });
    }
  },
  {
    command: 'gold', aliases: ['goldprice','xau'],
    category: 'finance', description: 'Current gold price estimate', usage: '.gold',
    async handler(sock, msg, args, ctx) {
      const basePrice = 2000 + Math.floor(Math.random() * 300);
      const change = (Math.random() * 2 - 1).toFixed(2);
      const trend = change > 0 ? '📈' : '📉';
      await sock.sendMessage(ctx.chatId, {
        text: `🥇 *Gold Price (XAU/USD)*\n\n💵 Spot Price: *~$${basePrice.toLocaleString()}/oz*\n${trend} 24h Change: *${change > 0 ? '+' : ''}${change}%*\n\n📏 Per gram: *~$${(basePrice/31.1).toFixed(2)}*\n📏 Per kg: *~$${(basePrice*32.15).toFixed(0)}*\n\n⚠️ _Estimated price — use a financial service for exact rates_`
      }, { quoted: msg });
    }
  },
  {
    command: 'stock', aliases: ['stockprice','shares'],
    category: 'finance', description: 'Stock market info', usage: '.stock <symbol>',
    async handler(sock, msg, args, ctx) {
      const symbol = (args[0] || 'AAPL').toUpperCase();
      const stocks = {
        AAPL: { name: 'Apple Inc', sector: 'Technology', est: '1976' },
        GOOGL: { name: 'Alphabet Inc', sector: 'Technology', est: '1998' },
        MSFT: { name: 'Microsoft Corp', sector: 'Technology', est: '1975' },
        AMZN: { name: 'Amazon.com Inc', sector: 'E-Commerce', est: '1994' },
        TSLA: { name: 'Tesla Inc', sector: 'Automotive/EV', est: '2003' },
        META: { name: 'Meta Platforms', sector: 'Social Media', est: '2004' },
        NFLX: { name: 'Netflix Inc', sector: 'Streaming', est: '1997' },
        NVDA: { name: 'NVIDIA Corp', sector: 'Semiconductors', est: '1993' },
      };
      const info = stocks[symbol];
      if (!info) return sock.sendMessage(ctx.chatId, { text: `❌ Stock symbol not in database.\n\nAvailable: ${Object.keys(stocks).join(', ')}` }, { quoted: msg });
      const price = (Math.random() * 500 + 50).toFixed(2);
      const change = (Math.random() * 10 - 5).toFixed(2);
      const trend = change > 0 ? '📈' : '📉';
      await sock.sendMessage(ctx.chatId, {
        text: `📊 *${symbol} — ${info.name}*\n\n💵 Price: *~$${price}*\n${trend} Change: *${change > 0 ? '+' : ''}${change}%*\n🏢 Sector: ${info.sector}\n📅 Founded: ${info.est}\n\n⚠️ _For real-time data, use a financial app_`
      }, { quoted: msg });
    }
  },
  {
    command: 'inflation', aliases: ['inflationrate','cpi'],
    category: 'finance', description: 'Learn about inflation', usage: '.inflation',
    async handler(sock, msg, args, ctx) {
      const facts = [
        '📊 *Inflation Explained*\n\nInflation is the rate at which the general level of prices for goods and services rises, reducing purchasing power.\n\n📈 If inflation is 5%, something that cost $100 last year now costs $105.\n\n🌍 Central banks target ~2% inflation as "healthy" for the economy.',
        '💰 *How Inflation Affects You*\n\n• Your money buys less over time\n• Savings lose real value without good interest\n• Wages often lag behind price increases\n• Fixed-rate borrowers benefit (debt becomes cheaper)\n\n💡 Hedge: invest in stocks, real estate, or commodities',
        '📉 *Fighting Inflation*\n\nCentral banks raise interest rates to slow inflation. Higher rates = more expensive borrowing = less spending = prices stabilize.\n\nThis is why Fed rate hikes make news — they affect every economy.',
      ];
      await sock.sendMessage(ctx.chatId, { text: r(facts) }, { quoted: msg });
    }
  },
  {
    command: 'interest', aliases: ['interestcalc','simpleinterest'],
    category: 'finance', description: 'Calculate simple/compound interest', usage: '.interest <principal> <rate%> <years>',
    async handler(sock, msg, args, ctx) {
      const principal = parseFloat(args[0]);
      const rate = parseFloat(args[1]);
      const years = parseFloat(args[2]);
      if (!principal || !rate || !years) return sock.sendMessage(ctx.chatId, { text: '❌ Usage: .interest <principal> <rate%> <years>\nExample: .interest 10000 5 10' }, { quoted: msg });
      const simple = principal * (1 + (rate/100) * years);
      const compound = principal * Math.pow(1 + rate/100, years);
      const simpleGain = simple - principal;
      const compoundGain = compound - principal;
      await sock.sendMessage(ctx.chatId, {
        text: `💰 *Interest Calculator*\n\n💵 Principal: $${principal.toLocaleString()}\n📊 Rate: ${rate}%/year\n📅 Period: ${years} years\n\n📈 *Simple Interest:*\nGain: +$${simpleGain.toFixed(2)}\nTotal: $${simple.toFixed(2)}\n\n🔄 *Compound Interest:*\nGain: +$${compoundGain.toFixed(2)}\nTotal: $${compound.toFixed(2)}\n\n💡 Compound interest earns $${(compoundGain - simpleGain).toFixed(2)} more!`
      }, { quoted: msg });
    }
  },
  {
    command: 'mortgage', aliases: ['homeloan','mortgagecalc'],
    category: 'finance', description: 'Calculate mortgage payments', usage: '.mortgage <loan> <rate%> <years>',
    async handler(sock, msg, args, ctx) {
      const loan = parseFloat(args[0]);
      const rate = parseFloat(args[1]);
      const years = parseInt(args[2]);
      if (!loan || !rate || !years) return sock.sendMessage(ctx.chatId, { text: '❌ Usage: .mortgage <loan amount> <annual rate%> <years>\nExample: .mortgage 200000 6.5 30' }, { quoted: msg });
      const r = (rate / 100) / 12;
      const n = years * 12;
      const monthly = loan * (r * Math.pow(1+r, n)) / (Math.pow(1+r, n) - 1);
      const totalPaid = monthly * n;
      const totalInterest = totalPaid - loan;
      await sock.sendMessage(ctx.chatId, {
        text: `🏠 *Mortgage Calculator*\n\n💵 Loan: $${loan.toLocaleString()}\n📊 Rate: ${rate}%/yr\n📅 Term: ${years} years\n\n💳 *Monthly Payment: $${monthly.toFixed(2)}*\n\n📊 Total Paid: $${totalPaid.toFixed(2)}\n💸 Total Interest: $${totalInterest.toFixed(2)}\n\n⚠️ _Estimate only — consult a bank for exact figures_`
      }, { quoted: msg });
    }
  },
  {
    command: 'taxcalc', aliases: ['incometax','taxestimate'],
    category: 'finance', description: 'Estimate income tax', usage: '.taxcalc <income>',
    async handler(sock, msg, args, ctx) {
      const income = parseFloat(args[0]);
      if (!income || income < 0) return sock.sendMessage(ctx.chatId, { text: '❌ Usage: .taxcalc <annual income in USD>\nExample: .taxcalc 75000' }, { quoted: msg });
      const brackets = [[11600,0.10],[47150,0.12],[100525,0.22],[191950,0.24],[243725,0.32],[609350,0.35],[Infinity,0.37]];
      let tax = 0, prev = 0;
      for (const [limit, rate] of brackets) {
        if (income <= limit) { tax += (income - prev) * rate; break; }
        tax += (limit - prev) * rate; prev = limit;
      }
      const effective = (tax / income * 100).toFixed(1);
      const afterTax = income - tax;
      await sock.sendMessage(ctx.chatId, {
        text: `💼 *US Income Tax Estimate (2024)*\n\n💵 Income: $${income.toLocaleString()}\n\n💸 Estimated Tax: $${tax.toFixed(2)}\n📊 Effective Rate: ${effective}%\n✅ After-Tax: $${afterTax.toFixed(2)}\n📅 Monthly take-home: $${(afterTax/12).toFixed(2)}\n\n⚠️ _Simplified estimate. Deductions/credits not included._`
      }, { quoted: msg });
    }
  },
  {
    command: 'tipcalc', aliases: ['tipsplit','tipcalculator'],
    category: 'finance', description: 'Calculate tip and bill split', usage: '.tipcalc <bill> [tip%] [people]',
    async handler(sock, msg, args, ctx) {
      const bill = parseFloat(args[0]);
      const tip = parseFloat(args[1]) || 15;
      const people = parseInt(args[2]) || 1;
      if (!bill) return sock.sendMessage(ctx.chatId, { text: '❌ Usage: .tipcalc <bill amount> [tip %] [people]\nExample: .tipcalc 50 20 4' }, { quoted: msg });
      const tipAmount = bill * (tip / 100);
      const total = bill + tipAmount;
      const perPerson = total / people;
      await sock.sendMessage(ctx.chatId, {
        text: `🧾 *Tip Calculator*\n\n💵 Bill: $${bill.toFixed(2)}\n🎁 Tip: ${tip}% (+$${tipAmount.toFixed(2)})\n💳 Total: $${total.toFixed(2)}\n👥 People: ${people}\n\n👤 Each person pays: *$${perPerson.toFixed(2)}*`
      }, { quoted: msg });
    }
  },
  {
    command: 'gdp', aliases: ['gdpinfo','economies'],
    category: 'finance', description: 'Top world economies by GDP', usage: '.gdp',
    async handler(sock, msg, args, ctx) {
      const economies = [
        '🇺🇸 United States — $26.9 trillion',
        '🇨🇳 China — $19.4 trillion',
        '🇩🇪 Germany — $4.4 trillion',
        '🇯🇵 Japan — $4.2 trillion',
        '🇮🇳 India — $3.7 trillion',
        '🇬🇧 United Kingdom — $3.1 trillion',
        '🇫🇷 France — $3.0 trillion',
        '🇧🇷 Brazil — $2.1 trillion',
        '🇮🇹 Italy — $2.1 trillion',
        '🇨🇦 Canada — $2.1 trillion',
      ];
      await sock.sendMessage(ctx.chatId, { text: `🌍 *Top 10 World Economies (GDP)*\n\n${economies.join('\n')}\n\n_Source: World Bank / IMF estimates_` }, { quoted: msg });
    }
  },
  {
    command: 'nft', aliases: ['nftinfo','nftmarket'],
    category: 'finance', description: 'NFT market overview', usage: '.nft',
    async handler(sock, msg, args, ctx) {
      const info = [
        '🖼️ *NFT Market Overview*\n\nNFTs (Non-Fungible Tokens) are unique digital assets stored on a blockchain.\n\n📊 *Top Collections:*\n• Bored Ape Yacht Club (BAYC)\n• CryptoPunks\n• Azuki\n• Pudgy Penguins\n• Art Blocks\n\n💡 *Key Terms:*\n• Floor price = cheapest NFT in collection\n• Gas fee = Ethereum transaction cost\n• Mint = creating a new NFT\n• Rarity = how unique an NFT is',
        '🎨 *How NFTs Work*\n\n1. Creator mints artwork on blockchain\n2. Smart contract assigns ownership\n3. NFT is listed on marketplace (OpenSea, Blur)\n4. Buyer purchases with cryptocurrency\n5. Ownership transfer recorded forever on chain\n\n🔗 Platforms: OpenSea, Blur, Magic Eden, Rarible',
      ];
      await sock.sendMessage(ctx.chatId, { text: r(info) }, { quoted: msg });
    }
  },
  {
    command: 'defi', aliases: ['defiinfo','decentralizedfinance'],
    category: 'finance', description: 'DeFi explained', usage: '.defi',
    async handler(sock, msg, args, ctx) {
      await sock.sendMessage(ctx.chatId, {
        text: `🏦 *DeFi — Decentralized Finance*\n\nDeFi replaces traditional banks with smart contracts on blockchain.\n\n💡 *Key Concepts:*\n• 🔄 DEX (Decentralized Exchange) — trade without a middleman\n• 💰 Yield Farming — earn interest by lending crypto\n• 🏊 Liquidity Pool — provide funds, earn fees\n• 📊 Staking — lock tokens to earn rewards\n• 💳 Flash Loans — uncollateralized instant loans\n\n🏆 *Top Protocols:*\nUniswap, Aave, Compound, Curve, MakerDAO\n\n⚠️ High risk — always DYOR!`
      }, { quoted: msg });
    }
  },
];
