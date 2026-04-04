import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'economy.json');
const RPG_FILE = path.join(DATA_DIR, 'rpg.json');

if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });

function loadDB() { try { return existsSync(DB_FILE) ? JSON.parse(readFileSync(DB_FILE, 'utf8')) : {}; } catch { return {}; } }
function saveDB(db) { try { writeFileSync(DB_FILE, JSON.stringify(db, null, 2)); } catch {} }
function loadRPG() { try { return existsSync(RPG_FILE) ? JSON.parse(readFileSync(RPG_FILE, 'utf8')) : {}; } catch { return {}; } }
function saveRPG(db) { try { writeFileSync(RPG_FILE, JSON.stringify(db, null, 2)); } catch {} }

function getUser(db, jid) {
  if (!db[jid]) db[jid] = { coins: 500, totalEarned: 500, xp: 0, level: 1, inventory: {}, gems: 0 };
  return db[jid];
}

function getRPGUser(db, jid) {
  if (!db[jid]) db[jid] = {
    class: null, hp: 100, maxHp: 100, attack: 10, defense: 5, level: 1, xp: 0,
    equipment: { weapon: null, armor: null, shield: null },
    skills: [], guild: null, pet: null, wins: 0, losses: 0
  };
  return db[jid];
}

const r = (arr) => arr[Math.floor(Math.random() * arr.length)];
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const classes = {
  warrior:  { emoji: '⚔️', attack: 15, defense: 10, hp: 150, desc: 'High defense and strong attacks' },
  mage:     { emoji: '🧙', attack: 25, defense: 3,  hp: 80,  desc: 'Massive magic damage but fragile' },
  archer:   { emoji: '🏹', attack: 18, defense: 6,  hp: 100, desc: 'Fast and accurate ranged attacks' },
  healer:   { emoji: '💚', attack: 8,  defense: 8,  hp: 120, desc: 'Strong healing and support skills' },
  rogue:    { emoji: '🗡️', attack: 20, defense: 4,  hp: 90,  desc: 'Stealth and critical hit specialist' },
  paladin:  { emoji: '🛡️', attack: 12, defense: 15, hp: 140, desc: 'Holy warrior with great defense' },
};

const weapons = {
  iron_sword:   { name: '⚔️ Iron Sword',    atk: 5,  cost: 150,  desc: 'Basic attack weapon' },
  steel_sword:  { name: '🗡️ Steel Sword',   atk: 12, cost: 400,  desc: 'Better than iron' },
  fire_staff:   { name: '🔥 Fire Staff',    atk: 20, cost: 600,  desc: 'Burns enemies for extra damage' },
  magic_bow:    { name: '🏹 Magic Bow',     atk: 16, cost: 500,  desc: 'Rapid fire ranged weapon' },
  divine_blade: { name: '✨ Divine Blade',  atk: 28, cost: 1000, desc: 'A holy weapon of legend' },
};

const armors = {
  leather:    { name: '🧥 Leather Armor', def: 5,  cost: 150,  desc: 'Basic protection' },
  chainmail:  { name: '⛓️ Chainmail',     def: 10, cost: 350,  desc: 'Metal ring armor' },
  plate:      { name: '🛡️ Plate Armor',  def: 18, cost: 700,  desc: 'Heavy but protective' },
  mage_robe:  { name: '🧙 Mage Robe',    def: 3,  cost: 250,  desc: '+10 magic attack power' },
  dragon_mail:{ name: '🐉 Dragon Mail',  def: 25, cost: 1200, desc: 'Forged from dragon scales' },
};

const pets = [
  { name: '🐉 Dragon', bonus: 'fire breath (extra dmg)' },
  { name: '🐺 Wolf',   bonus: 'pack attack (combo hits)' },
  { name: '🦅 Eagle',  bonus: 'aerial view (dodge boost)' },
  { name: '🐱 Cat',    bonus: 'lucky paws (coin bonus)' },
  { name: '🐉 Phoenix',bonus: 'rebirth (revive once)' },
];

const dungeons = [
  { name: '🏚️ Abandoned Mine', level: 1,  reward: [100,250],   boss: 'Giant Spider' },
  { name: '🌲 Dark Forest',    level: 5,  reward: [200,450],   boss: 'Evil Tree Spirit' },
  { name: '🏔️ Ice Mountain',  level: 10, reward: [400,800],   boss: 'Frost Giant' },
  { name: '🌋 Volcano Lair',   level: 15, reward: [700,1400],  boss: 'Fire Dragon' },
  { name: '🕌 Ancient Temple', level: 20, reward: [1000,2000], boss: 'Undead Pharaoh' },
];

const monsters = [
  { name: 'Goblin', hp: 30, atk: 8, reward: [20,60] },
  { name: 'Orc Warrior', hp: 60, atk: 15, reward: [50,120] },
  { name: 'Dark Elf', hp: 80, atk: 20, reward: [80,180] },
  { name: 'Troll', hp: 100, atk: 25, reward: [100,250] },
  { name: 'Vampire', hp: 90, atk: 30, reward: [120,280] },
  { name: 'Dragon Whelp', hp: 120, atk: 35, reward: [150,350] },
];

export default [
  {
    command: 'rpgstart', aliases: ['startgame','newcharacter'],
    category: 'rpg', description: 'Start your RPG adventure', usage: '.rpgstart <class>',
    async handler(sock, msg, args, ctx) {
      const { chatId, senderId } = ctx;
      const rpg = loadRPG();
      if (rpg[senderId]?.class) {
        const u = rpg[senderId];
        return sock.sendMessage(chatId, { text: `⚔️ *Already Registered!*\n\nYou are a *${u.class.toUpperCase()}* (${classes[u.class]?.emoji})\nLevel: ${u.level} | HP: ${u.hp}/${u.maxHp}\nUse .rpgstats to see full stats.` }, { quoted: msg });
      }
      const chosen = args[0]?.toLowerCase();
      if (!chosen || !classes[chosen]) {
        const list = Object.entries(classes).map(([k, v]) => `${v.emoji} *${k}* — ${v.desc}`).join('\n');
        return sock.sendMessage(chatId, { text: `⚔️ *Choose Your Class!*\n\n${list}\n\nUsage: .rpgstart <class>` }, { quoted: msg });
      }
      const cls = classes[chosen];
      rpg[senderId] = { ...getRPGUser(rpg, senderId), class: chosen, hp: cls.hp, maxHp: cls.hp, attack: cls.attack, defense: cls.defense };
      saveRPG(rpg);
      await sock.sendMessage(chatId, {
        text: `⚔️ *Adventure Begins!*\n\n${cls.emoji} *${chosen.toUpperCase()}* selected!\n\n❤️ HP: ${cls.hp}\n⚔️ Attack: ${cls.attack}\n🛡️ Defense: ${cls.defense}\n\n*Available commands:*\n.attack, .defend, .dungeon, .rpgshop, .rpgstats, .pet, .forge`
      }, { quoted: msg });
    }
  },
  {
    command: 'rpgstats', aliases: ['charstats','rpgprofile'],
    category: 'rpg', description: 'View your RPG character stats', usage: '.rpgstats',
    async handler(sock, msg, args, ctx) {
      const { chatId, senderId } = ctx;
      const rpg = loadRPG();
      const u = rpg[senderId];
      if (!u?.class) return sock.sendMessage(chatId, { text: '❌ You haven\'t started your RPG journey yet!\nUse *.rpgstart <class>* to begin.' }, { quoted: msg });
      const cls = classes[u.class];
      const wpn = u.equipment?.weapon ? weapons[u.equipment.weapon]?.name : 'None';
      const arm = u.equipment?.armor ? armors[u.equipment.armor]?.name : 'None';
      await sock.sendMessage(chatId, {
        text: `${cls?.emoji || '⚔️'} *Character Stats*\n\n🎭 Class: *${u.class.toUpperCase()}*\n⭐ Level: *${u.level}* (${u.xp} XP)\n❤️ HP: *${u.hp}/${u.maxHp}*\n⚔️ Attack: *${u.attack}*\n🛡️ Defense: *${u.defense}*\n\n🔪 Weapon: ${wpn}\n🧥 Armor: ${arm}\n🐾 Pet: ${u.pet || 'None'}\n\n🏆 Wins: ${u.wins || 0} | Losses: ${u.losses || 0}`
      }, { quoted: msg });
    }
  },
  {
    command: 'attack', aliases: ['fight','battle'],
    category: 'rpg', description: 'Battle a random monster', usage: '.attack',
    async handler(sock, msg, args, ctx) {
      const { chatId, senderId } = ctx;
      const rpg = loadRPG();
      const u = rpg[senderId];
      if (!u?.class) return sock.sendMessage(chatId, { text: '❌ Start your adventure first with .rpgstart' }, { quoted: msg });
      if (u.hp <= 0) return sock.sendMessage(chatId, { text: '💀 You\'re defeated! Use .heal to recover HP before fighting.' }, { quoted: msg });
      const monster = { ...r(monsters) };
      const playerAtk = u.attack + rand(-3, 3);
      const monsterAtk = monster.atk + rand(-3, 3);
      const actualDef = u.defense;
      const actualDmgToPlayer = Math.max(1, monsterAtk - actualDef);
      const rounds = [];
      let playerHp = u.hp;
      let monsterHp = monster.hp;
      let round = 1;
      while (playerHp > 0 && monsterHp > 0 && round <= 5) {
        const pDmg = playerAtk + rand(-2, 5);
        monsterHp -= pDmg;
        if (monsterHp <= 0) { rounds.push(`Round ${round}: You deal *${pDmg} dmg* — Monster defeated! ✅`); break; }
        const mDmg = Math.max(1, actualDmgToPlayer + rand(-2, 3));
        playerHp -= mDmg;
        rounds.push(`Round ${round}: You deal *${pDmg}* dmg, Monster deals *${mDmg}* dmg`);
        round++;
      }
      const won = monsterHp <= 0;
      const [minR, maxR] = monster.reward;
      const reward = won ? rand(minR, maxR) : 0;
      const xpGained = won ? rand(15, 40) : 5;
      u.hp = Math.max(0, playerHp);
      u.xp += xpGained;
      if (won) { u.wins = (u.wins || 0) + 1; } else { u.losses = (u.losses || 0) + 1; }
      if (u.xp >= u.level * 100) { u.level++; u.xp = 0; u.maxHp += 10; u.attack += 2; u.defense += 1; u.hp = u.maxHp; }
      saveRPG(rpg);
      if (won) {
        const econ = loadDB();
        const eu = getUser(econ, senderId);
        eu.coins += reward;
        eu.totalEarned += reward;
        saveDB(econ);
      }
      await sock.sendMessage(chatId, {
        text: `⚔️ *Battle vs ${monster.name}*\n\n${rounds.join('\n')}\n\n${won ? `🏆 *VICTORY!*\n+${reward} coins\n+${xpGained} XP` : `💀 *DEFEAT!*\nYou fought bravely.\n+${xpGained} XP`}\n\n❤️ HP: ${u.hp}/${u.maxHp}`
      }, { quoted: msg });
    }
  },
  {
    command: 'heal', aliases: ['recover','rest'],
    category: 'rpg', description: 'Heal your HP (costs coins)', usage: '.heal',
    async handler(sock, msg, args, ctx) {
      const { chatId, senderId } = ctx;
      const rpg = loadRPG();
      const u = rpg[senderId];
      if (!u?.class) return sock.sendMessage(chatId, { text: '❌ Start your adventure with .rpgstart' }, { quoted: msg });
      if (u.hp >= u.maxHp) return sock.sendMessage(chatId, { text: `✅ You\'re already at full health! HP: ${u.hp}/${u.maxHp}` }, { quoted: msg });
      const cost = 50;
      const econ = loadDB();
      const eu = getUser(econ, senderId);
      if (eu.coins < cost) return sock.sendMessage(chatId, { text: `❌ Healing costs *${cost} coins* but you only have *${eu.coins}*!` }, { quoted: msg });
      const healed = Math.min(50, u.maxHp - u.hp);
      u.hp = Math.min(u.maxHp, u.hp + healed);
      eu.coins -= cost;
      saveRPG(rpg); saveDB(econ);
      await sock.sendMessage(chatId, { text: `💚 *Healed!*\n+${healed} HP restored\n❤️ HP: ${u.hp}/${u.maxHp}\n💰 Cost: ${cost} coins` }, { quoted: msg });
    }
  },
  {
    command: 'dungeon', aliases: ['dungeoncrawl','raid2'],
    category: 'rpg', description: 'Enter a dungeon for loot', usage: '.dungeon',
    async handler(sock, msg, args, ctx) {
      const { chatId, senderId } = ctx;
      const rpg = loadRPG();
      const u = rpg[senderId];
      if (!u?.class) return sock.sendMessage(chatId, { text: '❌ Start your adventure with .rpgstart' }, { quoted: msg });
      const avail = dungeons.filter(d => u.level >= d.level);
      const dungeon = avail[avail.length - 1] || dungeons[0];
      const success = Math.random() > (0.4 - Math.min(u.level * 0.02, 0.3));
      const [minR, maxR] = dungeon.reward;
      const reward = success ? rand(minR, maxR) : rand(10, 50);
      const xp = success ? rand(30, 80) : rand(5, 15);
      u.xp += xp;
      if (u.xp >= u.level * 100) { u.level++; u.xp = 0; u.maxHp += 15; u.attack += 3; u.defense += 2; u.hp = u.maxHp; }
      saveRPG(rpg);
      const econ = loadDB();
      const eu = getUser(econ, senderId);
      eu.coins += reward;
      eu.totalEarned += reward;
      saveDB(econ);
      await sock.sendMessage(chatId, {
        text: `${dungeon.name}\n\n${success ? `🏆 *Dungeon Cleared!*\nDefeated: *${dungeon.boss}*\n\n💰 +${reward} coins\n⭐ +${xp} XP` : `💀 *Dungeon Failed!*\n${dungeon.boss} was too powerful.\n\n💰 Salvage: +${reward} coins\n⭐ +${xp} XP`}\n\n⭐ Level: ${u.level} | ❤️ HP: ${u.hp}/${u.maxHp}`
      }, { quoted: msg });
    }
  },
  {
    command: 'rpgshop', aliases: ['equipshop','armory'],
    category: 'rpg', description: 'RPG equipment shop', usage: '.rpgshop [buy weapon/armor <item>]',
    async handler(sock, msg, args, ctx) {
      const { chatId, senderId } = ctx;
      if (args[0] === 'buy') {
        const type = args[1]?.toLowerCase();
        const itemKey = args.slice(2).join('_').toLowerCase();
        const shop = type === 'weapon' ? weapons : type === 'armor' ? armors : null;
        if (!shop) return sock.sendMessage(chatId, { text: '❌ Usage: .rpgshop buy weapon/armor <item>' }, { quoted: msg });
        const item = shop[itemKey];
        if (!item) return sock.sendMessage(chatId, { text: `❌ Item not found! Use .rpgshop to see available items.` }, { quoted: msg });
        const econ = loadDB();
        const eu = getUser(econ, senderId);
        if (eu.coins < item.cost) return sock.sendMessage(chatId, { text: `❌ Need *${item.cost} coins* but have *${eu.coins}*!` }, { quoted: msg });
        eu.coins -= item.cost;
        saveDB(econ);
        const rpg = loadRPG();
        const ru = getRPGUser(rpg, senderId);
        ru.equipment[type] = itemKey;
        if (type === 'weapon') ru.attack = (classes[ru.class]?.attack || 10) + item.atk;
        if (type === 'armor') ru.defense = (classes[ru.class]?.defense || 5) + item.def;
        saveRPG(rpg);
        return sock.sendMessage(chatId, { text: `🛒 *Equipped!*\n\n${item.name} purchased!\n${item.desc}\n\n💰 Cost: ${item.cost} coins` }, { quoted: msg });
      }
      const wpnList = Object.entries(weapons).map(([k,v]) => `${v.name} — +${v.atk} ATK | ${v.cost} coins\n   Buy: .rpgshop buy weapon ${k}`).join('\n');
      const armList = Object.entries(armors).map(([k,v]) => `${v.name} — +${v.def} DEF | ${v.cost} coins\n   Buy: .rpgshop buy armor ${k}`).join('\n');
      await sock.sendMessage(chatId, { text: `⚔️ *RPG Equipment Shop*\n\n🗡️ *Weapons:*\n${wpnList}\n\n🛡️ *Armors:*\n${armList}` }, { quoted: msg });
    }
  },
  {
    command: 'pet', aliases: ['mypet','adoptpet'],
    category: 'rpg', description: 'Get or view your pet', usage: '.pet',
    async handler(sock, msg, args, ctx) {
      const { chatId, senderId } = ctx;
      const rpg = loadRPG();
      const u = getRPGUser(rpg, senderId);
      if (u.pet) return sock.sendMessage(chatId, { text: `🐾 *Your Pet*\n\n${u.pet}\n\nYour companion is by your side!` }, { quoted: msg });
      const pet = r(pets);
      u.pet = `${pet.name} (${pet.bonus})`;
      saveRPG(rpg);
      await sock.sendMessage(chatId, { text: `🥚 *Egg Hatched!*\n\nYou found a *${pet.name}*!\nSpecial ability: ${pet.bonus}\n\nYour pet will assist you in battle!` }, { quoted: msg });
    }
  },
  {
    command: 'forge', aliases: ['craft2','smith'],
    category: 'rpg', description: 'Forge a weapon using gems', usage: '.forge <weapon_name>',
    async handler(sock, msg, args, ctx) {
      const { chatId, senderId } = ctx;
      const itemKey = args.join('_').toLowerCase();
      if (!itemKey) {
        const list = Object.entries(weapons).map(([k,v]) => `${v.name}: ${Math.floor(v.cost/30)} gems\nForge: .forge ${k}`).join('\n\n');
        return sock.sendMessage(chatId, { text: `🔨 *Forge*\n\nCreate weapons using your gems!\n\n${list}` }, { quoted: msg });
      }
      const item = weapons[itemKey];
      if (!item) return sock.sendMessage(chatId, { text: '❌ Item not found! Use .forge to see available weapons.' }, { quoted: msg });
      const gemCost = Math.floor(item.cost / 30);
      const econ = loadDB();
      const eu = getUser(econ, senderId);
      if ((eu.gems || 0) < gemCost) return sock.sendMessage(chatId, { text: `❌ Need *${gemCost} gems* but have *${eu.gems || 0}*!\nEarn gems by mining with .mine` }, { quoted: msg });
      eu.gems -= gemCost;
      saveDB(econ);
      const rpg = loadRPG();
      const ru = getRPGUser(rpg, senderId);
      ru.equipment.weapon = itemKey;
      ru.attack = (classes[ru.class]?.attack || 10) + item.atk;
      saveRPG(rpg);
      await sock.sendMessage(chatId, { text: `🔨 *Forged!*\n\n${item.name} created!\n⚔️ +${item.atk} Attack\n💎 Cost: ${gemCost} gems\n\n_Equipped automatically!_` }, { quoted: msg });
    }
  },
  {
    command: 'guild', aliases: ['myguild','joinguild'],
    category: 'rpg', description: 'Create or join a guild', usage: '.guild [create/join/info] <name>',
    async handler(sock, msg, args, ctx) {
      const { chatId, senderId } = ctx;
      const rpg = loadRPG();
      const u = getRPGUser(rpg, senderId);
      const action = args[0]?.toLowerCase();
      const name = args.slice(1).join(' ');
      if (action === 'create') {
        if (!name) return sock.sendMessage(chatId, { text: '❌ Usage: .guild create <guild name>' }, { quoted: msg });
        u.guild = name;
        saveRPG(rpg);
        return sock.sendMessage(chatId, { text: `⚜️ *Guild Created!*\n\nGuild "*${name}*" founded!\nYou are the Guild Master.\n\nShare your guild name for others to join with .guild join ${name}` }, { quoted: msg });
      }
      if (action === 'join') {
        if (!name) return sock.sendMessage(chatId, { text: '❌ Usage: .guild join <guild name>' }, { quoted: msg });
        u.guild = name;
        saveRPG(rpg);
        return sock.sendMessage(chatId, { text: `⚜️ *Joined Guild!*\n\nWelcome to "*${name}*"!\nFight together and grow strong!` }, { quoted: msg });
      }
      if (u.guild) return sock.sendMessage(chatId, { text: `⚜️ *Your Guild*\n\nGuild: *${u.guild}*\nLevel: ${u.level}\n\nCmds: .guild create/join <name>` }, { quoted: msg });
      await sock.sendMessage(chatId, { text: `⚜️ *Guild System*\n\nYou are not in a guild!\n\n.guild create <name> — Start a guild\n.guild join <name> — Join existing guild` }, { quoted: msg });
    }
  },
  {
    command: 'rpglevel', aliases: ['level','levelup'],
    category: 'rpg', description: 'View your RPG level progress', usage: '.rpglevel',
    async handler(sock, msg, args, ctx) {
      const { chatId, senderId } = ctx;
      const rpg = loadRPG();
      const u = getRPGUser(rpg, senderId);
      if (!u.class) return sock.sendMessage(chatId, { text: '❌ Start with .rpgstart <class>' }, { quoted: msg });
      const xpNeeded = u.level * 100;
      const progress = Math.floor((u.xp / xpNeeded) * 10);
      const bar = '█'.repeat(progress) + '░'.repeat(10 - progress);
      await sock.sendMessage(chatId, {
        text: `⭐ *Level Progress*\n\nLevel: *${u.level}*\nXP: *${u.xp}/${xpNeeded}*\n\n[${bar}] ${Math.floor(u.xp/xpNeeded*100)}%\n\nEarn XP by fighting monsters and exploring dungeons!`
      }, { quoted: msg });
    }
  },
  {
    command: 'rpgrank', aliases: ['ranklist','topheroes'],
    category: 'rpg', description: 'RPG leaderboard', usage: '.rpgrank',
    async handler(sock, msg, args, ctx) {
      const { chatId } = ctx;
      const rpg = loadRPG();
      const ranked = Object.entries(rpg)
        .filter(([,u]) => u.class)
        .sort(([,a],[,b]) => b.level - a.level || b.wins - a.wins)
        .slice(0, 10);
      if (!ranked.length) return sock.sendMessage(chatId, { text: '🏆 No RPG players yet! Use .rpgstart to begin.' }, { quoted: msg });
      const medals = ['🥇','🥈','🥉'];
      const list = ranked.map(([jid, u], i) => {
        const cls = classes[u.class];
        return `${medals[i] || `${i+1}.`} ${cls?.emoji || '⚔️'} Lv.${u.level} — +${jid.split('@')[0].slice(-4)} (${u.wins || 0}W/${u.losses || 0}L)`;
      }).join('\n');
      await sock.sendMessage(chatId, { text: `🏆 *RPG Leaderboard*\n\n${list}` }, { quoted: msg });
    }
  },
  {
    command: 'explore', aliases: ['adventure','quest2'],
    category: 'rpg', description: 'Explore for hidden loot', usage: '.explore',
    async handler(sock, msg, args, ctx) {
      const { chatId, senderId } = ctx;
      const rpg = loadRPG();
      const u = getRPGUser(rpg, senderId);
      const outcomes = [
        ['🗺️ Discovered a treasure map!', rand(100,300), 20],
        ['🪙 Found a hidden coin stash!', rand(50,200), 10],
        ['⚔️ Stumbled upon an abandoned weapon cache!', rand(80,200), 15],
        ['🌿 A healing herb restores your strength!', 0, 5],
        ['💀 Ambushed by bandits! You barely escaped.', rand(10,50), 5],
        ['🏛️ Ancient ruins! You loot some artifacts.', rand(120,400), 25],
        ['🌟 A mystical shrine boosts your XP!', 0, 50],
        ['🐍 A snake bite! Lucky escape...', rand(5,30), 3],
      ];
      const [desc, coins, xp] = r(outcomes);
      u.xp += xp;
      if (u.xp >= u.level * 100) { u.level++; u.xp = 0; }
      saveRPG(rpg);
      if (coins > 0) {
        const econ = loadDB();
        const eu = getUser(econ, senderId);
        eu.coins += coins;
        eu.totalEarned += coins;
        saveDB(econ);
      }
      await sock.sendMessage(chatId, {
        text: `🗺️ *Exploration*\n\n${desc}\n\n${coins > 0 ? `💰 +${coins} coins\n` : ''}⭐ +${xp} XP\n\nLevel: ${u.level}`
      }, { quoted: msg });
    }
  },
  {
    command: 'rpginv', aliases: ['rpgbag','equipment'],
    category: 'rpg', description: 'View your RPG equipment', usage: '.rpginv',
    async handler(sock, msg, args, ctx) {
      const { chatId, senderId } = ctx;
      const rpg = loadRPG();
      const u = getRPGUser(rpg, senderId);
      if (!u.class) return sock.sendMessage(chatId, { text: '❌ Start with .rpgstart <class>' }, { quoted: msg });
      const wpn = u.equipment?.weapon ? weapons[u.equipment.weapon]?.name : '🔹 None';
      const arm = u.equipment?.armor ? armors[u.equipment.armor]?.name : '🔹 None';
      await sock.sendMessage(chatId, {
        text: `🎒 *RPG Equipment*\n\n⚔️ Weapon: ${wpn}\n🛡️ Armor: ${arm}\n🐾 Pet: ${u.pet || 'None'}\n\n📊 Stats\n❤️ HP: ${u.hp}/${u.maxHp}\n⚔️ Attack: ${u.attack}\n🛡️ Defense: ${u.defense}\n\n_Upgrade at .rpgshop or forge with .forge_`
      }, { quoted: msg });
    }
  },
  {
    command: 'rpgbuy', aliases: ['rpgpurchase'],
    category: 'rpg', description: 'Buy RPG equipment', usage: '.rpgbuy weapon/armor <item>',
    async handler(sock, msg, args, ctx) {
      const { chatId } = ctx;
      await sock.sendMessage(chatId, { text: '🛒 Use *.rpgshop buy weapon/armor <item>* to purchase equipment!' }, { quoted: msg });
    }
  },
  {
    command: 'arena', aliases: ['pvparena','1v1'],
    category: 'rpg', description: 'Challenge someone to a PVP battle', usage: '.arena @user',
    async handler(sock, msg, args, ctx) {
      const { chatId, senderId } = ctx;
      const target = msg?.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
      const rpg = loadRPG();
      const attacker = getRPGUser(rpg, senderId);
      if (!attacker.class) return sock.sendMessage(chatId, { text: '❌ Start with .rpgstart <class>' }, { quoted: msg });
      if (!target) return sock.sendMessage(chatId, { text: '❌ Usage: .arena @user' }, { quoted: msg });
      const defender = getRPGUser(rpg, target);
      if (!defender.class) return sock.sendMessage(chatId, { text: `❌ @${target.split('@')[0].split(':')[0]} hasn't started their RPG journey yet!`, mentions: [target] }, { quoted: msg });
      const aWin = attacker.attack + rand(-5, 10) > defender.attack - defender.defense + rand(-5, 10);
      const winner = aWin ? senderId : target;
      const loser = aWin ? target : senderId;
      getRPGUser(rpg, winner).wins = (getRPGUser(rpg, winner).wins || 0) + 1;
      getRPGUser(rpg, loser).losses = (getRPGUser(rpg, loser).losses || 0) + 1;
      saveRPG(rpg);
      const reward = rand(50, 200);
      const econ = loadDB();
      const wu = getUser(econ, winner);
      wu.coins += reward;
      wu.totalEarned += reward;
      saveDB(econ);
      const wName = winner.split('@')[0].split(':')[0];
      const lName = loser.split('@')[0].split(':')[0];
      await sock.sendMessage(chatId, {
        text: `⚔️ *PVP Arena Battle!*\n\n@${wName} vs @${lName}\n\n🏆 *Winner: @${wName}*\n+${reward} coins earned!`,
        mentions: [senderId, target]
      }, { quoted: msg });
    }
  },
];
