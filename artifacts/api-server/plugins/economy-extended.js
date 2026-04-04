import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'economy.json');

if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });

function loadDB() { try { return existsSync(DB_FILE) ? JSON.parse(readFileSync(DB_FILE, 'utf8')) : {}; } catch { return {}; } }
function saveDB(db) { try { writeFileSync(DB_FILE, JSON.stringify(db, null, 2)); } catch {} }
function getUser(db, jid) {
  if (!db[jid]) db[jid] = { coins: 500, lastDaily: 0, totalEarned: 500, lastWork: 0, lastMine: 0, lastFish: 0, lastHunt: 0, lastWeekly: 0, lastMonthly: 0, streak: 0, lastStreak: 0, xp: 0, level: 1, inventory: {}, gems: 0, bank: 0, loan: 0 };
  const u = db[jid];
  if (!u.inventory) u.inventory = {};
  if (!u.gems) u.gems = 0;
  if (!u.bank) u.bank = 0;
  if (!u.loan) u.loan = 0;
  if (!u.streak) u.streak = 0;
  if (!u.lastWork) u.lastWork = 0;
  if (!u.lastMine) u.lastMine = 0;
  if (!u.lastFish) u.lastFish = 0;
  if (!u.lastHunt) u.lastHunt = 0;
  if (!u.lastWeekly) u.lastWeekly = 0;
  if (!u.lastMonthly) u.lastMonthly = 0;
  if (!u.xp) u.xp = 0;
  if (!u.level) u.level = 1;
  return u;
}

const COOLDOWNS = { work: 3600000, mine: 7200000, fish: 1800000, hunt: 5400000, weekly: 604800000, monthly: 2592000000 };
const r = (arr) => arr[Math.floor(Math.random() * arr.length)];
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

function cooldownMsg(label, ms) {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return h > 0 ? `${h}h ${m}m` : m > 0 ? `${m}m ${s}s` : `${s}s`;
}

const shopItems = {
  'fishing_rod': { name: '🎣 Fishing Rod', price: 200, desc: 'Increases fish rewards by 50%' },
  'pickaxe':     { name: '⛏️ Pickaxe',    price: 300, desc: 'Increases mine rewards by 50%' },
  'lucky_charm': { name: '🍀 Lucky Charm', price: 500, desc: 'Increases all rewards by 25%' },
  'shield':      { name: '🛡️ Shield',     price: 400, desc: 'Protects against robbery' },
  'sword':       { name: '⚔️ Sword',      price: 350, desc: 'Increases robbery success rate' },
  'coffee':      { name: '☕ Coffee',      price: 100, desc: 'Reduce work cooldown by 30min' },
  'map':         { name: '🗺️ Explorer Map',price: 250, desc: 'Reveals hidden loot spots' },
  'lockbox':     { name: '🔒 Lockbox',     price: 600, desc: 'Protects 50% of coins from raids' },
};

export default [
  {
    command: 'work', aliases: ['grind','earn'],
    category: 'economy', description: 'Work to earn coins', usage: '.work',
    async handler(sock, msg, args, ctx) {
      const { chatId, senderId } = ctx;
      const db = loadDB();
      const user = getUser(db, senderId);
      const now = Date.now();
      const cd = COOLDOWNS.work - (now - user.lastWork);
      if (cd > 0) return sock.sendMessage(chatId, { text: `⏰ *Work Cooldown!*\nYou need to rest for *${cooldownMsg('', cd)}* before working again.` }, { quoted: msg });
      const jobs = [
        ['👨‍💻 Freelance Developer','coded a website and got paid',rand(150,350)],
        ['🚗 Uber Driver','drove 12 trips today',rand(80,200)],
        ['🍕 Pizza Delivery','delivered 20 orders',rand(60,150)],
        ['📝 Content Creator','went viral on social media',rand(200,500)],
        ['🎨 Artist','sold an NFT (lol)',rand(100,300)],
        ['📦 Warehouse Worker','packed 500 boxes',rand(70,180)],
        ['💼 Business Consultant','saved a company from bankruptcy',rand(250,600)],
        ['🎮 Game Tester','played games all day (the dream)',rand(100,250)],
        ['🌿 Gardener','planted a whole park',rand(60,160)],
        ['🔧 Mechanic','fixed 5 cars',rand(120,280)],
      ];
      const [job, action, earned] = r(jobs);
      const bonus = user.inventory['lucky_charm'] ? Math.floor(earned * 0.25) : 0;
      const total = earned + bonus;
      user.coins += total;
      user.totalEarned += total;
      user.xp += 10;
      user.lastWork = now;
      if (user.xp >= user.level * 100) { user.level++; user.xp = 0; }
      saveDB(db);
      await sock.sendMessage(chatId, {
        text: `💼 *${job}*\n\nYou ${action}!\n💰 Earned: *+${earned} coins*${bonus ? `\n🍀 Lucky bonus: *+${bonus} coins*` : ''}\n\n💵 Balance: *${user.coins.toLocaleString()} coins*\n⭐ XP: ${user.xp}/${user.level * 100} | Level ${user.level}`
      }, { quoted: msg });
    }
  },
  {
    command: 'mine', aliases: ['dig','mining'],
    category: 'economy', description: 'Mine for coins and gems', usage: '.mine',
    async handler(sock, msg, args, ctx) {
      const { chatId, senderId } = ctx;
      const db = loadDB();
      const user = getUser(db, senderId);
      const now = Date.now();
      const cd = COOLDOWNS.mine - (now - user.lastMine);
      if (cd > 0) return sock.sendMessage(chatId, { text: `⏰ *Mining Cooldown!*\nPick recovers in *${cooldownMsg('', cd)}*` }, { quoted: msg });
      const roll = Math.random();
      let result, earned = 0, gems = 0;
      if (roll > 0.95) { result = '💎 *DIAMOND!*'; earned = rand(400,800); gems = rand(2,5); }
      else if (roll > 0.80) { result = '🔮 *Ruby found!*'; earned = rand(200,400); gems = 1; }
      else if (roll > 0.60) { result = '✨ *Gold vein!*'; earned = rand(100,250); }
      else if (roll > 0.30) { result = '🪨 *Iron ore*'; earned = rand(50,120); }
      else { result = '💨 *Empty cave...*'; earned = rand(10,40); }
      const bonus = user.inventory['pickaxe'] ? Math.floor(earned * 0.5) : 0;
      earned += bonus;
      user.coins += earned;
      user.totalEarned += earned;
      user.gems = (user.gems || 0) + gems;
      user.xp += 15;
      user.lastMine = now;
      if (user.xp >= user.level * 100) { user.level++; user.xp = 0; }
      saveDB(db);
      await sock.sendMessage(chatId, {
        text: `⛏️ *Mining Results*\n\n${result}\n\n💰 Coins: *+${earned}*${gems ? `\n💎 Gems: *+${gems}*` : ''}${bonus ? `\n🪛 Tool bonus: *+${bonus}*` : ''}\n\n💵 Balance: *${user.coins.toLocaleString()}* | 💎 ${user.gems} gems`
      }, { quoted: msg });
    }
  },
  {
    command: 'fish', aliases: ['fishing','cast'],
    category: 'economy', description: 'Go fishing for coins', usage: '.fish',
    async handler(sock, msg, args, ctx) {
      const { chatId, senderId } = ctx;
      const db = loadDB();
      const user = getUser(db, senderId);
      const now = Date.now();
      const cd = COOLDOWNS.fish - (now - user.lastFish);
      if (cd > 0) return sock.sendMessage(chatId, { text: `⏰ *Fishing Cooldown!*\nLine resets in *${cooldownMsg('', cd)}*` }, { quoted: msg });
      const catches = [
        ['🦈 MEGA CATCH! You reeled in a shark!', rand(200,500)],
        ['🐠 Caught a beautiful tropical fish!', rand(80,200)],
        ['🐟 Regular catch — a nice tuna!', rand(40,120)],
        ['🦀 A crab got caught in your line!', rand(60,150)],
        ['🐙 An octopus! That\'s rare!', rand(120,300)],
        ['🥾 Just an old boot... 😅', rand(5,20)],
        ['🪴 Seaweed. Just seaweed.', rand(2,15)],
        ['💰 A treasure chest from the depths!', rand(300,600)],
      ];
      const [desc, base] = r(catches);
      const bonus = user.inventory['fishing_rod'] ? Math.floor(base * 0.5) : 0;
      const earned = base + bonus;
      user.coins += earned;
      user.totalEarned += earned;
      user.lastFish = now;
      user.xp += 8;
      saveDB(db);
      await sock.sendMessage(chatId, {
        text: `🎣 *Fishing Result*\n\n${desc}\n💰 Earned: *+${earned} coins*${bonus ? `\n🎣 Rod bonus: *+${bonus}*` : ''}\n\n💵 Balance: *${user.coins.toLocaleString()} coins*`
      }, { quoted: msg });
    }
  },
  {
    command: 'hunt', aliases: ['hunting','trap'],
    category: 'economy', description: 'Hunt animals for coins', usage: '.hunt',
    async handler(sock, msg, args, ctx) {
      const { chatId, senderId } = ctx;
      const db = loadDB();
      const user = getUser(db, senderId);
      const now = Date.now();
      const cd = COOLDOWNS.hunt - (now - user.lastHunt);
      if (cd > 0) return sock.sendMessage(chatId, { text: `⏰ *Hunting Cooldown!*\nBack in *${cooldownMsg('', cd)}*` }, { quoted: msg });
      const prey = [
        ['🦌 Caught a deer!', rand(100,250)],['🐗 Wild boar taken down!', rand(150,300)],
        ['🐇 A bunny? Cute.', rand(20,60)],['🦊 A cunning fox!', rand(80,200)],
        ['🐻 A BEAR! RUN... wait, you won?!', rand(300,700)],
        ['🍃 Nothing today... just leaves.', rand(5,25)],
        ['🦅 Eagle spotted! But it flew away.', rand(10,40)],
        ['🐆 A LEOPARD! Incredibly rare!', rand(500,900)],
      ];
      const [desc, earned] = r(prey);
      user.coins += earned;
      user.totalEarned += earned;
      user.lastHunt = now;
      user.xp += 12;
      saveDB(db);
      await sock.sendMessage(chatId, {
        text: `🏹 *Hunting Result*\n\n${desc}\n💰 Earned: *+${earned} coins*\n\n💵 Balance: *${user.coins.toLocaleString()} coins*`
      }, { quoted: msg });
    }
  },
  {
    command: 'shop', aliases: ['store','market'],
    category: 'economy', description: 'View the item shop', usage: '.shop [buy <item>]',
    async handler(sock, msg, args, ctx) {
      const { chatId, senderId } = ctx;
      if (args[0]?.toLowerCase() === 'buy') {
        const itemKey = args.slice(1).join('_').toLowerCase();
        const item = shopItems[itemKey];
        if (!item) {
          const keys = Object.keys(shopItems).join(', ');
          return sock.sendMessage(chatId, { text: `❌ Item not found! Available: ${keys}\n\nUsage: .shop buy <item_name>` }, { quoted: msg });
        }
        const db = loadDB();
        const user = getUser(db, senderId);
        if (user.coins < item.price) return sock.sendMessage(chatId, { text: `❌ Not enough coins! You need *${item.price}* coins but have *${user.coins}*.` }, { quoted: msg });
        user.coins -= item.price;
        user.inventory[itemKey] = (user.inventory[itemKey] || 0) + 1;
        saveDB(db);
        return sock.sendMessage(chatId, { text: `🛒 *Purchase Successful!*\n\n${item.name} bought for *${item.price} coins*!\n\n${item.desc}\n\n💵 Remaining: *${user.coins.toLocaleString()} coins*` }, { quoted: msg });
      }
      const list = Object.entries(shopItems).map(([key, item]) => `${item.name}\n   💰 ${item.price} coins — ${item.desc}\n   Buy: .shop buy ${key}`).join('\n\n');
      await sock.sendMessage(chatId, { text: `🛒 *Item Shop*\n\n${list}\n\n_Check your items with .inventory_` }, { quoted: msg });
    }
  },
  {
    command: 'inventory', aliases: ['inv','items','bag'],
    category: 'economy', description: 'View your inventory', usage: '.inventory',
    async handler(sock, msg, args, ctx) {
      const { chatId, senderId } = ctx;
      const db = loadDB();
      const user = getUser(db, senderId);
      const inv = user.inventory || {};
      if (Object.keys(inv).length === 0) return sock.sendMessage(chatId, { text: '🎒 *Inventory*\n\nYour bag is empty! Visit the .shop to buy items.' }, { quoted: msg });
      const list = Object.entries(inv).map(([key, qty]) => {
        const item = shopItems[key];
        return `${item ? item.name : `📦 ${key}`} × *${qty}*${item ? `\n   ${item.desc}` : ''}`;
      }).join('\n\n');
      await sock.sendMessage(chatId, { text: `🎒 *Your Inventory*\n\n${list}\n\n💎 Gems: *${user.gems || 0}*` }, { quoted: msg });
    }
  },
  {
    command: 'sell', aliases: ['sellitem'],
    category: 'economy', description: 'Sell an item from inventory', usage: '.sell <item>',
    async handler(sock, msg, args, ctx) {
      const { chatId, senderId } = ctx;
      const itemKey = args.join('_').toLowerCase();
      if (!itemKey) return sock.sendMessage(chatId, { text: '❌ Usage: .sell <item_name>' }, { quoted: msg });
      const db = loadDB();
      const user = getUser(db, senderId);
      if (!user.inventory[itemKey]) return sock.sendMessage(chatId, { text: `❌ You don\'t have ${itemKey} in your inventory!` }, { quoted: msg });
      const item = shopItems[itemKey];
      const sellPrice = item ? Math.floor(item.price * 0.6) : 50;
      user.inventory[itemKey]--;
      if (user.inventory[itemKey] <= 0) delete user.inventory[itemKey];
      user.coins += sellPrice;
      user.totalEarned += sellPrice;
      saveDB(db);
      await sock.sendMessage(chatId, { text: `💰 *Item Sold!*\n\n${item ? item.name : itemKey} → *+${sellPrice} coins*\n\n💵 Balance: *${user.coins.toLocaleString()} coins*` }, { quoted: msg });
    }
  },
  {
    command: 'bet', aliases: ['gamble2','wager'],
    category: 'economy', description: 'Bet coins on a coin flip', usage: '.bet <amount>',
    async handler(sock, msg, args, ctx) {
      const { chatId, senderId } = ctx;
      const amount = parseInt(args[0]);
      if (!amount || amount <= 0) return sock.sendMessage(chatId, { text: '❌ Usage: .bet <amount>\nExample: .bet 100' }, { quoted: msg });
      const db = loadDB();
      const user = getUser(db, senderId);
      if (user.coins < amount) return sock.sendMessage(chatId, { text: `❌ Not enough coins! You have *${user.coins}* coins.` }, { quoted: msg });
      if (amount > 5000) return sock.sendMessage(chatId, { text: '❌ Maximum bet is *5,000 coins* per round.' }, { quoted: msg });
      const win = Math.random() > 0.45;
      if (win) { user.coins += amount; user.totalEarned += amount; }
      else { user.coins -= amount; }
      saveDB(db);
      await sock.sendMessage(chatId, {
        text: `🎲 *Betting Results*\n\n${win ? `🎉 *YOU WIN!*\n+${amount} coins` : `💸 *YOU LOST!*\n-${amount} coins`}\n\n💵 New Balance: *${user.coins.toLocaleString()} coins*`
      }, { quoted: msg });
    }
  },
  {
    command: 'heist', aliases: ['rob2','steal2'],
    category: 'economy', description: 'Attempt a coin heist', usage: '.heist @user',
    async handler(sock, msg, args, ctx) {
      const { chatId, senderId } = ctx;
      const target = msg?.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
      if (!target) return sock.sendMessage(chatId, { text: '❌ Usage: .heist @user' }, { quoted: msg });
      if (target === senderId) return sock.sendMessage(chatId, { text: '❌ You cannot rob yourself!' }, { quoted: msg });
      const db = loadDB();
      const robber = getUser(db, senderId);
      const victim = getUser(db, target);
      const targetName = target.split('@')[0].split(':')[0];
      if (victim.inventory?.shield) return sock.sendMessage(chatId, { text: `🛡️ *Heist Failed!*\n\n@${targetName} had a Shield — your attack was blocked!`, mentions: [target] }, { quoted: msg });
      const success = Math.random() > (robber.inventory?.sword ? 0.3 : 0.5);
      if (!success) {
        const fine = Math.min(robber.coins, rand(50, 200));
        robber.coins -= fine;
        saveDB(db);
        return sock.sendMessage(chatId, { text: `👮 *Caught Red-Handed!*\n\nYour heist failed and you were fined *${fine} coins*!`, mentions: [target] }, { quoted: msg });
      }
      const stolen = Math.min(victim.coins, rand(50, Math.floor(victim.coins * 0.3) || 100));
      victim.coins -= stolen;
      robber.coins += stolen;
      robber.totalEarned += stolen;
      saveDB(db);
      await sock.sendMessage(chatId, { text: `🦹 *Heist Success!*\n\nStole *${stolen} coins* from @${targetName}!\n💵 Your balance: *${robber.coins.toLocaleString()} coins*`, mentions: [target] }, { quoted: msg });
    }
  },
  {
    command: 'weekly', aliases: ['weeklyreward'],
    category: 'economy', description: 'Claim your weekly reward', usage: '.weekly',
    async handler(sock, msg, args, ctx) {
      const { chatId, senderId } = ctx;
      const db = loadDB();
      const user = getUser(db, senderId);
      const now = Date.now();
      const cd = COOLDOWNS.weekly - (now - user.lastWeekly);
      if (cd > 0) return sock.sendMessage(chatId, { text: `⏰ Weekly reward available in *${cooldownMsg('', cd)}*` }, { quoted: msg });
      const reward = rand(500, 1000);
      user.coins += reward;
      user.totalEarned += reward;
      user.lastWeekly = now;
      saveDB(db);
      await sock.sendMessage(chatId, { text: `🗓️ *Weekly Reward!*\n\n🎁 +*${reward} coins* claimed!\n💵 Balance: *${user.coins.toLocaleString()} coins*\n\nSee you next week! 👋` }, { quoted: msg });
    }
  },
  {
    command: 'monthly', aliases: ['monthlyreward'],
    category: 'economy', description: 'Claim your monthly reward', usage: '.monthly',
    async handler(sock, msg, args, ctx) {
      const { chatId, senderId } = ctx;
      const db = loadDB();
      const user = getUser(db, senderId);
      const now = Date.now();
      const cd = COOLDOWNS.monthly - (now - user.lastMonthly);
      if (cd > 0) return sock.sendMessage(chatId, { text: `⏰ Monthly reward available in *${Math.ceil(cd / 86400000)} days*` }, { quoted: msg });
      const reward = rand(2000, 5000);
      user.coins += reward;
      user.totalEarned += reward;
      user.lastMonthly = now;
      saveDB(db);
      await sock.sendMessage(chatId, { text: `📅 *Monthly Reward!*\n\n🎁 +*${reward} coins* claimed!\n💵 Balance: *${user.coins.toLocaleString()} coins*\n\nSee you next month! 🎉` }, { quoted: msg });
    }
  },
  {
    command: 'streak', aliases: ['dailystreak'],
    category: 'economy', description: 'Check your daily streak', usage: '.streak',
    async handler(sock, msg, args, ctx) {
      const { chatId, senderId } = ctx;
      const db = loadDB();
      const user = getUser(db, senderId);
      const streak = user.streak || 0;
      await sock.sendMessage(chatId, {
        text: `🔥 *Daily Streak*\n\n${'🔥'.repeat(Math.min(streak, 10))} ×${streak}\n\nStreak: *${streak} days*\nBonus multiplier: *×${(1 + streak * 0.05).toFixed(2)}*\n\nKeep claiming your .daily to maintain your streak!`
      }, { quoted: msg });
    }
  },
  {
    command: 'richest', aliases: ['toprich','wealthy'],
    category: 'economy', description: 'Top 10 richest users', usage: '.richest',
    async handler(sock, msg, args, ctx) {
      const { chatId } = ctx;
      const db = loadDB();
      const sorted = Object.entries(db).sort(([,a],[,b]) => b.coins - a.coins).slice(0, 10);
      if (!sorted.length) return sock.sendMessage(chatId, { text: '💰 No economy data yet. Use .work to earn coins!' }, { quoted: msg });
      const medals = ['🥇','🥈','🥉'];
      const list = sorted.map(([jid, u], i) => `${medals[i] || `${i+1}.`} +${jid.split('@')[0].slice(-4)} — *${u.coins?.toLocaleString() || 0} coins*`).join('\n');
      await sock.sendMessage(chatId, { text: `💰 *Top 10 Richest Users*\n\n${list}` }, { quoted: msg });
    }
  },
  {
    command: 'poorest', aliases: ['broke','bankrupt'],
    category: 'economy', description: 'Top 10 poorest users', usage: '.poorest',
    async handler(sock, msg, args, ctx) {
      const { chatId } = ctx;
      const db = loadDB();
      const sorted = Object.entries(db).sort(([,a],[,b]) => a.coins - b.coins).slice(0, 10);
      if (!sorted.length) return sock.sendMessage(chatId, { text: '😢 No economy data yet.' }, { quoted: msg });
      const list = sorted.map(([jid, u], i) => `${i+1}. +${jid.split('@')[0].slice(-4)} — *${u.coins?.toLocaleString() || 0} coins*`).join('\n');
      await sock.sendMessage(chatId, { text: `😢 *Top 10 Poorest Users*\n\n${list}\n\n_Use .work to earn more coins!_` }, { quoted: msg });
    }
  },
  {
    command: 'bank', aliases: ['deposit','banking'],
    category: 'economy', description: 'Deposit coins to the bank', usage: '.bank deposit/withdraw/balance <amount>',
    async handler(sock, msg, args, ctx) {
      const { chatId, senderId } = ctx;
      const db = loadDB();
      const user = getUser(db, senderId);
      const action = args[0]?.toLowerCase();
      const amount = parseInt(args[1]);
      if (!action) return sock.sendMessage(chatId, { text: `🏦 *Bank Account*\n\n💵 Wallet: *${user.coins.toLocaleString()} coins*\n🏦 Bank: *${user.bank.toLocaleString()} coins*\n\nUsage:\n.bank deposit <amount>\n.bank withdraw <amount>` }, { quoted: msg });
      if (action === 'deposit') {
        if (!amount || amount <= 0 || user.coins < amount) return sock.sendMessage(chatId, { text: `❌ Invalid amount or insufficient coins! (Have: ${user.coins})` }, { quoted: msg });
        user.coins -= amount; user.bank += amount;
        saveDB(db);
        return sock.sendMessage(chatId, { text: `🏦 *Deposited!*\n+${amount} coins to bank\n\n💵 Wallet: ${user.coins.toLocaleString()}\n🏦 Bank: ${user.bank.toLocaleString()}` }, { quoted: msg });
      }
      if (action === 'withdraw') {
        if (!amount || amount <= 0 || user.bank < amount) return sock.sendMessage(chatId, { text: `❌ Invalid amount or insufficient bank balance! (Bank: ${user.bank})` }, { quoted: msg });
        user.bank -= amount; user.coins += amount;
        saveDB(db);
        return sock.sendMessage(chatId, { text: `🏦 *Withdrawn!*\n${amount} coins from bank\n\n💵 Wallet: ${user.coins.toLocaleString()}\n🏦 Bank: ${user.bank.toLocaleString()}` }, { quoted: msg });
      }
      await sock.sendMessage(chatId, { text: `🏦 Usage: .bank deposit/withdraw <amount>` }, { quoted: msg });
    }
  },
  {
    command: 'loan', aliases: ['borrow','getloan'],
    category: 'economy', description: 'Take a loan', usage: '.loan <amount>',
    async handler(sock, msg, args, ctx) {
      const { chatId, senderId } = ctx;
      const db = loadDB();
      const user = getUser(db, senderId);
      if (user.loan > 0) return sock.sendMessage(chatId, { text: `❌ You already have an outstanding loan of *${user.loan} coins*!\nUse *.payloan* to pay it back first.` }, { quoted: msg });
      const amount = parseInt(args[0]);
      if (!amount || amount < 100 || amount > 2000) return sock.sendMessage(chatId, { text: '❌ Loan amount must be between 100 and 2,000 coins.\nUsage: .loan <amount>' }, { quoted: msg });
      const interest = Math.floor(amount * 0.2);
      user.coins += amount;
      user.loan = amount + interest;
      saveDB(db);
      await sock.sendMessage(chatId, {
        text: `🏦 *Loan Approved!*\n\n💰 Received: *${amount} coins*\n📊 With 20% interest, you owe: *${user.loan} coins*\n\n💵 Balance: *${user.coins.toLocaleString()} coins*\n\n_Use .payloan to repay your debt._`
      }, { quoted: msg });
    }
  },
  {
    command: 'payloan', aliases: ['repay','payloan2'],
    category: 'economy', description: 'Pay back your loan', usage: '.payloan',
    async handler(sock, msg, args, ctx) {
      const { chatId, senderId } = ctx;
      const db = loadDB();
      const user = getUser(db, senderId);
      if (!user.loan || user.loan <= 0) return sock.sendMessage(chatId, { text: '✅ You have no outstanding loan! Use .loan <amount> to borrow.' }, { quoted: msg });
      if (user.coins < user.loan) return sock.sendMessage(chatId, { text: `❌ You need *${user.loan} coins* to repay but only have *${user.coins}*.\n\nEarn more with .work, .mine, or .fish!` }, { quoted: msg });
      user.coins -= user.loan;
      const paid = user.loan;
      user.loan = 0;
      saveDB(db);
      await sock.sendMessage(chatId, { text: `✅ *Loan Repaid!*\n\nPaid back *${paid} coins*.\n💵 Remaining balance: *${user.coins.toLocaleString()} coins*` }, { quoted: msg });
    }
  },
  {
    command: 'gems', aliases: ['crystals','gemcount'],
    category: 'economy', description: 'Check your gem count', usage: '.gems',
    async handler(sock, msg, args, ctx) {
      const { chatId, senderId } = ctx;
      const db = loadDB();
      const user = getUser(db, senderId);
      await sock.sendMessage(chatId, { text: `💎 *Gem Balance*\n\nYou have *${user.gems || 0} gems*!\n\nGems are earned from mining. They can be used in the RPG system!` }, { quoted: msg });
    }
  },
  {
    command: 'coinbet', aliases: ['coinflip2'],
    category: 'economy', description: 'Bet on a coin flip (heads/tails)', usage: '.coinbet <amount> <heads/tails>',
    async handler(sock, msg, args, ctx) {
      const { chatId, senderId } = ctx;
      const amount = parseInt(args[0]);
      const choice = args[1]?.toLowerCase();
      if (!amount || !['heads','tails'].includes(choice)) return sock.sendMessage(chatId, { text: '❌ Usage: .coinbet <amount> <heads/tails>' }, { quoted: msg });
      const db = loadDB();
      const user = getUser(db, senderId);
      if (user.coins < amount) return sock.sendMessage(chatId, { text: `❌ Not enough coins! Have: *${user.coins}*` }, { quoted: msg });
      const result = Math.random() > 0.5 ? 'heads' : 'tails';
      const win = result === choice;
      user.coins += win ? amount : -amount;
      if (win) user.totalEarned += amount;
      saveDB(db);
      await sock.sendMessage(chatId, {
        text: `🪙 *Coin Flip*\n\nYou chose: *${choice}*\nResult: *${result}* ${result === 'heads' ? '🪙' : '🔄'}\n\n${win ? `🎉 You WIN *${amount} coins*!` : `😭 You lost *${amount} coins*!`}\n\n💵 Balance: *${user.coins.toLocaleString()} coins*`
      }, { quoted: msg });
    }
  },
  {
    command: 'collect', aliases: ['gather','pickup2'],
    category: 'economy', description: 'Collect random coins', usage: '.collect',
    async handler(sock, msg, args, ctx) {
      const { chatId, senderId } = ctx;
      const db = loadDB();
      const user = getUser(db, senderId);
      const found = Math.floor(Math.random() * 50) + 5;
      user.coins += found;
      user.totalEarned += found;
      saveDB(db);
      const msgs = [`💰 You found *${found} coins* on the ground!`,`🪙 Someone dropped *${found} coins* — finders keepers!`,`🎁 A small gift of *${found} coins* from the universe!`,`🍀 Lucky! *${found} coins* appeared out of nowhere!`];
      await sock.sendMessage(chatId, { text: `${r(msgs)}\n💵 Balance: *${user.coins.toLocaleString()} coins*` }, { quoted: msg });
    }
  },
  {
    command: 'trade', aliases: ['exchange','swap'],
    category: 'economy', description: 'Trade gems for coins', usage: '.trade <gems> gems',
    async handler(sock, msg, args, ctx) {
      const { chatId, senderId } = ctx;
      const gems = parseInt(args[0]);
      if (!gems || gems <= 0) return sock.sendMessage(chatId, { text: '❌ Usage: .trade <amount> gems\nExample: .trade 5 gems (converts gems to coins at 50 each)' }, { quoted: msg });
      const db = loadDB();
      const user = getUser(db, senderId);
      if ((user.gems || 0) < gems) return sock.sendMessage(chatId, { text: `❌ You only have *${user.gems || 0} gems*!` }, { quoted: msg });
      const coins = gems * 50;
      user.gems -= gems;
      user.coins += coins;
      user.totalEarned += coins;
      saveDB(db);
      await sock.sendMessage(chatId, { text: `💱 *Trade Complete!*\n\n💎 ${gems} gems → 💰 *${coins} coins*\n\n💵 Balance: *${user.coins.toLocaleString()} coins*\n💎 Remaining gems: *${user.gems}*` }, { quoted: msg });
    }
  },
];
