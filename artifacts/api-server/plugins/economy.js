import { readFileSync, writeFileSync, existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_FILE = path.join(__dirname, '..', 'data', 'economy.json');

function loadDB() {
  try { return existsSync(DB_FILE) ? JSON.parse(readFileSync(DB_FILE, 'utf-8')) : {}; }
  catch { return {}; }
}

function saveDB(db) {
  try { writeFileSync(DB_FILE, JSON.stringify(db, null, 2)); } catch {}
}

function getUser(db, jid) {
  if (!db[jid]) db[jid] = { coins: 0, lastDaily: 0, totalEarned: 0 };
  return db[jid];
}

const DAILY_REWARD = 100;
const DAILY_COOLDOWN = 24 * 60 * 60 * 1000;

const economyHandlers = {
  async balance(sock, message, args, context) {
    const { chatId, senderId } = context;
    const db = loadDB();
    const user = getUser(db, senderId);
    await sock.sendMessage(chatId, {
      text: `💰 *Your Balance*\n\n` +
        `💵 Coins: *${user.coins.toLocaleString()}*\n` +
        `📈 Total earned: *${user.totalEarned.toLocaleString()}*\n` +
        `🆔 ID: ${senderId.split('@')[0].split(':')[0]}`
    }, { quoted: message });
  },

  async daily(sock, message, args, context) {
    const { chatId, senderId } = context;
    const db = loadDB();
    const user = getUser(db, senderId);
    const now = Date.now();
    const diff = now - (user.lastDaily || 0);
    if (diff < DAILY_COOLDOWN) {
      const remaining = DAILY_COOLDOWN - diff;
      const h = Math.floor(remaining / 3600000);
      const m = Math.floor((remaining % 3600000) / 60000);
      return sock.sendMessage(chatId, {
        text: `⏰ *Daily already claimed!*\nCome back in *${h}h ${m}m*`
      }, { quoted: message });
    }
    user.coins += DAILY_REWARD;
    user.totalEarned += DAILY_REWARD;
    user.lastDaily = now;
    saveDB(db);
    await sock.sendMessage(chatId, {
      text: `🎁 *Daily Reward Claimed!*\n\n+*${DAILY_REWARD} coins* added!\n💰 New balance: *${user.coins.toLocaleString()} coins*\n\nCome back in 24 hours for more!`
    }, { quoted: message });
  },

  async transfer(sock, message, args, context) {
    const { chatId, senderId, isGroup, message: msg } = context;
    const db = loadDB();
    const sender = getUser(db, senderId);
    const mentioned = msg?.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]
      || Object.keys(context).find(k => k.includes('@s.whatsapp'));
    const amount = parseInt(args[args.length - 1]);
    if (!mentioned || isNaN(amount) || amount <= 0) {
      return sock.sendMessage(chatId, { text: `❌ Usage: .transfer @user <amount>\nExample: .transfer @user 50` }, { quoted: message });
    }
    if (mentioned === senderId) return sock.sendMessage(chatId, { text: '❌ You cannot transfer to yourself!' }, { quoted: message });
    if (sender.coins < amount) return sock.sendMessage(chatId, { text: `❌ Insufficient coins! You have *${sender.coins}* coins.` }, { quoted: message });
    const receiver = getUser(db, mentioned);
    sender.coins -= amount;
    receiver.coins += amount;
    receiver.totalEarned += amount;
    saveDB(db);
    await sock.sendMessage(chatId, {
      text: `💸 *Transfer Successful!*\n\n` +
        `Sent: *${amount} coins*\n` +
        `To: @${mentioned.split('@')[0].split(':')[0]}\n` +
        `Your balance: *${sender.coins} coins*`
    }, { quoted: message });
  },

  async leaderboard(sock, message, args, context) {
    const { chatId } = context;
    const db = loadDB();
    const sorted = Object.entries(db)
      .sort(([,a], [,b]) => b.coins - a.coins)
      .slice(0, 10);
    if (sorted.length === 0) return sock.sendMessage(chatId, { text: '📊 No economy data yet. Use .daily to get started!' }, { quoted: message });
    const medals = ['🥇','🥈','🥉'];
    const list = sorted.map(([jid, data], i) => {
      const num = jid.split('@')[0].split(':')[0];
      return `${medals[i] || `${i+1}.`} +${num.slice(-4)} — *${data.coins.toLocaleString()} coins*`;
    }).join('\n');
    await sock.sendMessage(chatId, {
      text: `🏆 *Top 10 Richest Users*\n\n${list}\n\n_Use .daily to earn coins!_`
    }, { quoted: message });
  },
};

export default [
  {
    command: 'balance',
    aliases: ['bal', 'coins', 'wallet'],
    category: 'economy',
    description: 'Check your coin balance',
    usage: '.balance',
    handler: economyHandlers.balance,
  },
  {
    command: 'daily',
    aliases: ['dailyreward', 'claim'],
    category: 'economy',
    description: 'Claim your daily coins reward',
    usage: '.daily',
    handler: economyHandlers.daily,
  },
  {
    command: 'transfer',
    aliases: ['pay', 'send'],
    category: 'economy',
    description: 'Transfer coins to another user',
    usage: '.transfer @user <amount>',
    handler: economyHandlers.transfer,
  },
  {
    command: 'leaderboard',
    aliases: ['lb', 'topcoins', 'rich'],
    category: 'economy',
    description: 'View the richest users leaderboard',
    usage: '.leaderboard',
    handler: economyHandlers.leaderboard,
  },
];
