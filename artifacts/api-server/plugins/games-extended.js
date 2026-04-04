import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');
const GAMES_FILE = path.join(DATA_DIR, 'games.json');

if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });

function loadGames() { try { return existsSync(GAMES_FILE) ? JSON.parse(readFileSync(GAMES_FILE, 'utf8')) : {}; } catch { return {}; } }
function saveGames(db) { try { writeFileSync(GAMES_FILE, JSON.stringify(db, null, 2)); } catch {} }

const r = (arr) => arr[Math.floor(Math.random() * arr.length)];
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const WORDS_5 = ['CRANE','SPORT','BRAVE','FLAME','GHOST','PLANE','TIGER','CHESS','BLOOM','SHOUT','PRIZE','TRAIL','CHEST','DRINK','FROST','GRASP','HEART','IVORY','JUDGE','KNOCK','LIGHT','MONEY','NIGHT','OCEAN','PEACE','QUEEN','RIVER','STONE','TRACK','UNION','VIVID','WHEAT','EXCEL','YACHT','ZEBRA','ACUTE','BLEND','CHIPS','DRAMA','EAGER','FANCY','GRILL','HUNKY','INTRO','JOKER','KNIFE','LASER','MATCH','NAKED','ORBIT','PASTA','QUICK','RALLY','SWEEP','TEACH','UPSET','VINYL','WASTE','AXLES','BRACE','CHORD','DANCE','ELBOW','FLICK','GROAN','HANDS'];

const HANGMAN_WORDS = ['javascript','python','elephant','guitar','rainbow','diamond','thunder','butterfly','keyboard','adventure','challenge','mysterious','wonderful','revolution','algorithm','paradise','champion','discovery','knowledge','brilliant','fantastic','incredible','beautiful','chocolate','penguin','volcano','astronaut','treasure','universe','language','computer','internet','hospital','mountain','calendar','birthday','umbrella','sandwich','hospital','dolphin','elephant','giraffe','flamingo','kangaroo','peacock','crocodile','porcupine','hedgehog'];

const TRIVIA_QS = [
  { q: 'What is the capital of France?', a: 'Paris', opts: ['Paris','London','Berlin','Rome'] },
  { q: 'Which planet is closest to the Sun?', a: 'Mercury', opts: ['Venus','Mercury','Mars','Earth'] },
  { q: 'How many sides does a hexagon have?', a: '6', opts: ['5','6','7','8'] },
  { q: 'What is the chemical symbol for gold?', a: 'Au', opts: ['Go','Gd','Au','Ag'] },
  { q: 'Who painted the Mona Lisa?', a: 'Leonardo da Vinci', opts: ['Picasso','Da Vinci','Monet','Leonardo da Vinci'] },
  { q: 'What is the largest ocean on Earth?', a: 'Pacific Ocean', opts: ['Atlantic Ocean','Pacific Ocean','Indian Ocean','Arctic Ocean'] },
  { q: 'How many strings does a standard guitar have?', a: '6', opts: ['4','5','6','7'] },
  { q: 'What year did World War II end?', a: '1945', opts: ['1943','1944','1945','1946'] },
  { q: 'What is the fastest land animal?', a: 'Cheetah', opts: ['Lion','Cheetah','Horse','Leopard'] },
  { q: 'Which element has atomic number 1?', a: 'Hydrogen', opts: ['Helium','Hydrogen','Lithium','Carbon'] },
  { q: 'What is 7 × 8?', a: '56', opts: ['48','54','56','64'] },
  { q: 'Which country invented pizza?', a: 'Italy', opts: ['Greece','Italy','France','Spain'] },
  { q: 'How many bones are in the human body?', a: '206', opts: ['196','206','216','226'] },
  { q: 'What is the square root of 144?', a: '12', opts: ['11','12','13','14'] },
  { q: 'Which gas do plants absorb from the atmosphere?', a: 'Carbon Dioxide', opts: ['Oxygen','Nitrogen','Carbon Dioxide','Hydrogen'] },
];

const BLACKJACK_CARDS = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
const BLACKJACK_SUITS = ['♠','♥','♦','♣'];

function cardValue(card) {
  if (['J','Q','K'].includes(card)) return 10;
  if (card === 'A') return 11;
  return parseInt(card);
}

function handValue(hand) {
  let total = hand.reduce((s, c) => s + cardValue(c[0]), 0);
  let aces = hand.filter(c => c[0] === 'A').length;
  while (total > 21 && aces > 0) { total -= 10; aces--; }
  return total;
}

function drawCard() {
  return BLACKJACK_CARDS[rand(0, BLACKJACK_CARDS.length - 1)] + BLACKJACK_SUITS[rand(0, 3)];
}

export default [
  {
    command: 'blackjack', aliases: ['bj','21'],
    category: 'games', description: 'Play blackjack', usage: '.blackjack [hit/stand] <bet>',
    async handler(sock, msg, args, ctx) {
      const { chatId, senderId } = ctx;
      const games = loadGames();
      const gameKey = `bj_${senderId}`;
      if (args[0] === 'hit' || args[0] === 'h') {
        const game = games[gameKey];
        if (!game) return sock.sendMessage(chatId, { text: '❌ No active game! Start with .blackjack <bet>' }, { quoted: msg });
        game.playerHand.push(drawCard());
        const pv = handValue(game.playerHand);
        if (pv > 21) {
          delete games[gameKey];
          saveGames(games);
          return sock.sendMessage(chatId, {
            text: `🃏 *Blackjack - BUST!*\n\nYour hand: ${game.playerHand.join(' ')} = ${pv}\n\n💸 You lose your bet!`
          }, { quoted: msg });
        }
        saveGames(games);
        return sock.sendMessage(chatId, { text: `🃏 *Blackjack*\n\nYour hand: ${game.playerHand.join(' ')} = ${pv}\n\nType .blackjack hit or .blackjack stand` }, { quoted: msg });
      }
      if (args[0] === 'stand' || args[0] === 's') {
        const game = games[gameKey];
        if (!game) return sock.sendMessage(chatId, { text: '❌ No active game! Start with .blackjack <bet>' }, { quoted: msg });
        while (handValue(game.dealerHand) < 17) game.dealerHand.push(drawCard());
        const pv = handValue(game.playerHand);
        const dv = handValue(game.dealerHand);
        delete games[gameKey];
        saveGames(games);
        const pWin = pv <= 21 && (dv > 21 || pv > dv);
        const push = pv === dv;
        return sock.sendMessage(chatId, {
          text: `🃏 *Blackjack - Result!*\n\nYour hand: ${game.playerHand.join(' ')} = ${pv}\nDealer: ${game.dealerHand.join(' ')} = ${dv}\n\n${pWin ? '🎉 *YOU WIN!*' : push ? '🤝 *PUSH! It\'s a tie!*' : '💸 *Dealer wins!*'}`
        }, { quoted: msg });
      }
      const bet = parseInt(args[0]) || 50;
      const playerHand = [drawCard(), drawCard()];
      const dealerHand = [drawCard(), drawCard()];
      games[gameKey] = { playerHand, dealerHand, bet };
      saveGames(games);
      const pv = handValue(playerHand);
      if (pv === 21) {
        delete games[gameKey]; saveGames(games);
        return sock.sendMessage(chatId, { text: `🃏 *Blackjack*\n\nYour hand: ${playerHand.join(' ')} = 21\nDealer: ${dealerHand[0]} 🂠\n\n🎰 *BLACKJACK! INSTANT WIN!*` }, { quoted: msg });
      }
      await sock.sendMessage(chatId, {
        text: `🃏 *Blackjack*\n\nYour hand: ${playerHand.join(' ')} = ${pv}\nDealer shows: ${dealerHand[0]} 🂠\n\nType:\n.blackjack hit — Draw card\n.blackjack stand — Hold`
      }, { quoted: msg });
    }
  },
  {
    command: 'wordle', aliases: ['wordguess','guessword'],
    category: 'games', description: 'Play Wordle (5-letter word game)', usage: '.wordle [guess/new] <word>',
    async handler(sock, msg, args, ctx) {
      const { chatId, senderId } = ctx;
      const games = loadGames();
      const gameKey = `wordle_${senderId}`;
      if (args[0]?.toLowerCase() === 'new' || args[0]?.toLowerCase() === 'start') {
        games[gameKey] = { word: r(WORDS_5), guesses: [], maxGuesses: 6 };
        saveGames(games);
        return sock.sendMessage(chatId, { text: `🟩 *Wordle Started!*\n\nGuess the 5-letter word!\n\nUsage: .wordle <guess>\nYou have 6 attempts.\n\n🟩 = Correct position\n🟨 = Wrong position\n⬛ = Not in word` }, { quoted: msg });
      }
      const game = games[gameKey];
      if (!game) return sock.sendMessage(chatId, { text: '❌ No active game! Start with .wordle new' }, { quoted: msg });
      const guess = (args[0] || '').toUpperCase();
      if (guess.length !== 5 || !/^[A-Z]+$/.test(guess)) return sock.sendMessage(chatId, { text: '❌ Please enter a valid 5-letter word!' }, { quoted: msg });
      const target = game.word;
      const result = [...guess].map((c, i) => {
        if (c === target[i]) return `🟩${c}`;
        if (target.includes(c)) return `🟨${c}`;
        return `⬛${c}`;
      });
      game.guesses.push({ guess, result });
      const display = game.guesses.map(g => g.result.map(r => r[0]).join('') + '  ' + g.result.map(r => r[1]).join('')).join('\n');
      const won = guess === target;
      const lost = game.guesses.length >= game.maxGuesses;
      if (won || lost) delete games[gameKey];
      saveGames(games);
      await sock.sendMessage(chatId, {
        text: `🟩 *Wordle*\n\n${display}\n\n${won ? `🎉 *Correct! The word was ${target}!*\nSolved in ${game.guesses.length} attempt${game.guesses.length > 1 ? 's' : ''}!` : lost ? `❌ *Game Over!*\nThe word was *${target}*` : `Attempts: ${game.guesses.length}/${game.maxGuesses}\nType .wordle <word> to guess!`}`
      }, { quoted: msg });
    }
  },
  {
    command: 'hangman', aliases: ['hang2','wordguess2'],
    category: 'games', description: 'Play hangman word game', usage: '.hangman [letter/new]',
    async handler(sock, msg, args, ctx) {
      const { chatId, senderId } = ctx;
      const games = loadGames();
      const gameKey = `hang_${senderId}`;
      const STAGES = ['😊','🙁','😬','😨','😰','😱','💀'];
      if (!games[gameKey] || args[0]?.toLowerCase() === 'new') {
        const word = r(HANGMAN_WORDS).toUpperCase();
        games[gameKey] = { word, guessed: [], wrong: 0 };
        saveGames(games);
        const display = [...word].map(c => '_ ').join('');
        return sock.sendMessage(chatId, { text: `🪤 *Hangman*\n\n${STAGES[0]}\n\nWord: ${display}\n(${word.length} letters)\n\nUsage: .hangman <letter>` }, { quoted: msg });
      }
      const game = games[gameKey];
      const letter = (args[0] || '').toUpperCase()[0];
      if (!letter || !/[A-Z]/.test(letter)) return sock.sendMessage(chatId, { text: '❌ Please guess a letter! Usage: .hangman <letter>' }, { quoted: msg });
      if (game.guessed.includes(letter)) return sock.sendMessage(chatId, { text: `🔄 You already guessed *${letter}*!` }, { quoted: msg });
      game.guessed.push(letter);
      if (!game.word.includes(letter)) game.wrong++;
      const display = [...game.word].map(c => game.guessed.includes(c) ? c : '_').join(' ');
      const wrong = game.guessed.filter(l => !game.word.includes(l));
      const won = !display.includes('_');
      const lost = game.wrong >= 6;
      if (won || lost) delete games[gameKey];
      saveGames(games);
      await sock.sendMessage(chatId, {
        text: `🪤 *Hangman* ${STAGES[Math.min(game.wrong, 6)]}\n\n${display}\n\nWrong guesses: ${wrong.join(', ') || 'none'} (${game.wrong}/6)\nGuessed: ${game.guessed.join(', ')}\n\n${won ? `🎉 *YOU WIN!* The word was *${game.word}*!` : lost ? `💀 *GAME OVER!* The word was *${game.word}*` : `Guess with .hangman <letter>`}`
      }, { quoted: msg });
    }
  },
  {
    command: 'connect4', aliases: ['c4','dropfour'],
    category: 'games', description: 'Play Connect 4 (self or vs bot)', usage: '.connect4 [1-7/new]',
    async handler(sock, msg, args, ctx) {
      const { chatId, senderId } = ctx;
      const games = loadGames();
      const gameKey = `c4_${senderId}`;
      const ROWS = 6, COLS = 7;
      const EMPTY = '⬜', P1 = '🔴', P2 = '🟡';
      function createBoard() { return Array.from({length: ROWS}, () => Array(COLS).fill(EMPTY)); }
      function dropPiece(board, col, piece) {
        for (let r = ROWS - 1; r >= 0; r--) {
          if (board[r][col] === EMPTY) { board[r][col] = piece; return r; }
        }
        return -1;
      }
      function checkWin(board, piece) {
        for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS - 3; c++) if ([0,1,2,3].every(i => board[r][c+i] === piece)) return true;
        for (let r = 0; r < ROWS - 3; r++) for (let c = 0; c < COLS; c++) if ([0,1,2,3].every(i => board[r+i][c] === piece)) return true;
        for (let r = 0; r < ROWS - 3; r++) for (let c = 0; c < COLS - 3; c++) if ([0,1,2,3].every(i => board[r+i][c+i] === piece)) return true;
        for (let r = 3; r < ROWS; r++) for (let c = 0; c < COLS - 3; c++) if ([0,1,2,3].every(i => board[r-i][c+i] === piece)) return true;
        return false;
      }
      function renderBoard(board) {
        return board.map(row => row.join('')).join('\n') + '\n1️⃣2️⃣3️⃣4️⃣5️⃣6️⃣7️⃣';
      }
      if (!games[gameKey] || args[0]?.toLowerCase() === 'new') {
        games[gameKey] = { board: createBoard(), turn: 'player' };
        saveGames(games);
        return sock.sendMessage(chatId, { text: `🔴🟡 *Connect 4*\n\n${renderBoard(games[gameKey].board)}\n\n🔴 Your turn! Pick column (1-7)\nUsage: .connect4 <column>` }, { quoted: msg });
      }
      const game = games[gameKey];
      const col = parseInt(args[0]) - 1;
      if (isNaN(col) || col < 0 || col >= COLS) return sock.sendMessage(chatId, { text: '❌ Pick a column from 1 to 7!' }, { quoted: msg });
      const pr = dropPiece(game.board, col, P1);
      if (pr < 0) return sock.sendMessage(chatId, { text: '❌ Column full! Pick another.' }, { quoted: msg });
      if (checkWin(game.board, P1)) {
        delete games[gameKey]; saveGames(games);
        return sock.sendMessage(chatId, { text: `🔴🟡 *Connect 4*\n\n${renderBoard(game.board)}\n\n🎉 *You win!* 🔴` }, { quoted: msg });
      }
      let aiCol = rand(0, COLS-1), tries = 0;
      while (dropPiece({...game, board: game.board.map(r=>[...r])}[0], aiCol, P2) < 0 && tries++ < 20) aiCol = rand(0, COLS-1);
      dropPiece(game.board, aiCol, P2);
      if (checkWin(game.board, P2)) {
        delete games[gameKey]; saveGames(games);
        return sock.sendMessage(chatId, { text: `🔴🟡 *Connect 4*\n\n${renderBoard(game.board)}\n\n🤖 *Bot wins!* 🟡` }, { quoted: msg });
      }
      saveGames(games);
      await sock.sendMessage(chatId, { text: `🔴🟡 *Connect 4*\n\n${renderBoard(game.board)}\n\n🔴 Your turn! Pick column (1-7)` }, { quoted: msg });
    }
  },
  {
    command: 'quiz', aliases: ['trivia2','quizme'],
    category: 'games', description: 'Answer a trivia question', usage: '.quiz',
    async handler(sock, msg, args, ctx) {
      const { chatId, senderId } = ctx;
      const games = loadGames();
      const gameKey = `quiz_${senderId}`;
      if (args[0] && games[gameKey]) {
        const game = games[gameKey];
        const answer = args.join(' ').trim();
        const correct = answer.toLowerCase() === game.answer.toLowerCase() || answer === game.opt;
        delete games[gameKey]; saveGames(games);
        return sock.sendMessage(chatId, {
          text: `🎯 *Quiz Answer*\n\n${correct ? `✅ *CORRECT!* +10 pts\n\nThe answer is *${game.answer}*` : `❌ *Wrong!*\nThe correct answer was *${game.answer}*`}`
        }, { quoted: msg });
      }
      const question = r(TRIVIA_QS);
      const opts = question.opts.map((o, i) => `${['A','B','C','D'][i]}. ${o}`).join('\n');
      games[gameKey] = { answer: question.a, opt: ['A','B','C','D'][question.opts.indexOf(question.a)] };
      saveGames(games);
      await sock.sendMessage(chatId, {
        text: `🎯 *Trivia Quiz*\n\n${question.q}\n\n${opts}\n\n_Reply with the letter or the answer!_`
      }, { quoted: msg });
    }
  },
  {
    command: 'typetest', aliases: ['speedtype','typingtest'],
    category: 'games', description: 'Test your typing speed', usage: '.typetest [start/done]',
    async handler(sock, msg, args, ctx) {
      const { chatId, senderId } = ctx;
      const games = loadGames();
      const gameKey = `type_${senderId}`;
      const sentences = [
        'The quick brown fox jumps over the lazy dog',
        'Pack my box with five dozen liquor jugs',
        'How vexingly quick daft zebras jump',
        'The five boxing wizards jump quickly',
        'Sphinx of black quartz judge my vow',
        'Technology drives human innovation forward',
        'Programming is the art of problem solving',
        'Every great developer started as a beginner',
      ];
      if (!games[gameKey]) {
        const sentence = r(sentences);
        games[gameKey] = { sentence, startTime: Date.now() };
        saveGames(games);
        return sock.sendMessage(chatId, {
          text: `⌨️ *Typing Speed Test*\n\nType this as fast as you can:\n\n*"${sentence}"*\n\nTimer started! Type the sentence now!`
        }, { quoted: msg });
      }
      const game = games[gameKey];
      const typed = args.join(' ').trim();
      const elapsed = (Date.now() - game.startTime) / 1000;
      delete games[gameKey]; saveGames(games);
      const wordCount = game.sentence.split(' ').length;
      const wpm = Math.round((wordCount / elapsed) * 60);
      const correct = typed.toLowerCase().trim() === game.sentence.toLowerCase();
      await sock.sendMessage(chatId, {
        text: `⌨️ *Typing Test Result*\n\n⏱️ Time: ${elapsed.toFixed(1)}s\n🚀 Speed: *${wpm} WPM*\n✅ Accuracy: ${correct ? '100%' : 'Check your typing!'}\n\n${wpm > 60 ? '🔥 Blazing fast!' : wpm > 40 ? '⚡ Pretty good!' : '📚 Keep practicing!'}`
      }, { quoted: msg });
    }
  },
  {
    command: 'memory', aliases: ['memorygame','match'],
    category: 'games', description: 'Memory match card game', usage: '.memory [new/pick <pos>]',
    async handler(sock, msg, args, ctx) {
      const { chatId, senderId } = ctx;
      const games = loadGames();
      const gameKey = `mem_${senderId}`;
      if (!games[gameKey] || args[0] === 'new') {
        const pairs = ['🍎','🍌','🍇','🍓','🍒','🍊','🥝','🍋'];
        const cards = [...pairs, ...pairs].sort(() => Math.random() - 0.5);
        games[gameKey] = { cards, revealed: [], matched: [], flipped: [] };
        saveGames(games);
        const grid = cards.map((_, i) => `${i+1}:❓`).join(' ');
        return sock.sendMessage(chatId, { text: `🃏 *Memory Match*\n\nFind the matching pairs!\n\n${grid}\n\nUsage: .memory pick <pos1> <pos2>\nExample: .memory pick 1 5` }, { quoted: msg });
      }
      const game = games[gameKey];
      if (args[0] === 'pick') {
        const p1 = parseInt(args[1]) - 1, p2 = parseInt(args[2]) - 1;
        if (isNaN(p1) || isNaN(p2) || p1 === p2) return sock.sendMessage(chatId, { text: '❌ Pick two different positions! Example: .memory pick 1 5' }, { quoted: msg });
        if (game.matched.includes(p1) || game.matched.includes(p2)) return sock.sendMessage(chatId, { text: '❌ That position is already matched!' }, { quoted: msg });
        const card1 = game.cards[p1], card2 = game.cards[p2];
        const match = card1 === card2;
        if (match) { game.matched.push(p1, p2); }
        const grid = game.cards.map((c, i) => `${i+1}:${game.matched.includes(i) ? c : '❓'}`).join(' ');
        const done = game.matched.length === game.cards.length;
        if (done) delete games[gameKey];
        saveGames(games);
        await sock.sendMessage(chatId, {
          text: `🃏 *Memory Match*\n\nCard ${p1+1}: ${card1} | Card ${p2+1}: ${card2}\n${match ? '✅ *Match found!*' : '❌ *Not a match!*'}\n\n${grid}\n\n${done ? '🎉 *You matched all pairs!*' : `Matched: ${game.matched.length/2}/${game.cards.length/2} pairs`}`
        }, { quoted: msg });
        return;
      }
      const grid = game.cards.map((c, i) => `${i+1}:${game.matched.includes(i) ? c : '❓'}`).join(' ');
      await sock.sendMessage(chatId, { text: `🃏 *Memory Match*\n\n${grid}\n\nMatched: ${game.matched.length/2}/${game.cards.length/2}\n\nUsage: .memory pick <pos1> <pos2>` }, { quoted: msg });
    }
  },
  {
    command: 'wheelfort', aliases: ['spinwheel','wheel'],
    category: 'games', description: 'Spin the wheel of fortune', usage: '.wheelfort [add option] or .wheelfort spin',
    async handler(sock, msg, args, ctx) {
      const { chatId, senderId } = ctx;
      const games = loadGames();
      const key = `wheel_${chatId}`;
      if (!games[key]) games[key] = { options: ['Win!','Lose!','Double!','Jackpot!','Skip','Bonus Round!'] };
      if (args[0] === 'add') {
        const opt = args.slice(1).join(' ');
        if (!opt) return sock.sendMessage(chatId, { text: '❌ Usage: .wheelfort add <option>' }, { quoted: msg });
        games[key].options.push(opt);
        saveGames(games);
        return sock.sendMessage(chatId, { text: `✅ Added "*${opt}*" to the wheel!` }, { quoted: msg });
      }
      if (args[0] === 'clear') {
        games[key] = { options: ['Win!','Lose!','Double!','Jackpot!','Skip','Bonus Round!'] };
        saveGames(games);
        return sock.sendMessage(chatId, { text: '🎡 Wheel reset to default options!' }, { quoted: msg });
      }
      const opts = games[key].options;
      const result = r(opts);
      const display = opts.map((o, i) => o === result ? `▶️ *${o}*` : `   ${o}`).join('\n');
      await sock.sendMessage(chatId, { text: `🎡 *Wheel of Fortune*\n\n${display}\n\n🎯 *Result: ${result}*\n\n_Add options: .wheelfort add <option>_` }, { quoted: msg });
    }
  },
  {
    command: 'numpuzz', aliases: ['numbergame','fifteenpuzzle'],
    category: 'games', description: 'Number puzzle game (2048-style)', usage: '.numpuzz',
    async handler(sock, msg, args, ctx) {
      const { chatId } = ctx;
      const grid = [[2,4,8,16],[32,64,128,256],[512,1024,2048,4096],[8192,16384,32768,0]];
      const shuffled = grid.flat().sort(() => Math.random() - 0.5);
      const display = [];
      for (let i = 0; i < 4; i++) {
        display.push(shuffled.slice(i*4, i*4+4).map(n => n ? String(n).padStart(5) : '    0').join('|'));
      }
      await sock.sendMessage(chatId, {
        text: `🔢 *Number Puzzle*\n\n\`\`\`${display.join('\n')}\`\`\`\n\nMerge matching numbers by sliding tiles!\nTarget: *2048*\n\n_This is a visual puzzle — play on mobile!_`
      }, { quoted: msg });
    }
  },
  {
    command: 'guesscele', aliases: ['guesscelebrity','celebguess'],
    category: 'games', description: 'Guess the celebrity from hints', usage: '.guesscele [answer]',
    async handler(sock, msg, args, ctx) {
      const { chatId, senderId } = ctx;
      const games = loadGames();
      const gameKey = `celeb_${senderId}`;
      const celebs = [
        { name: 'Elon Musk', hints: ['He owns a social media platform','He founded an electric car company','He wants to go to Mars','He is the richest person in the world'] },
        { name: 'Cristiano Ronaldo', hints: ['He is a famous footballer','He plays for Al-Nassr','He has 5 Ballon d\'Or awards','He is Portuguese'] },
        { name: 'Taylor Swift', hints: ['She is a pop star','She re-recorded her albums','She has a famous Eras Tour','She wrote songs about her exes'] },
        { name: 'Lionel Messi', hints: ['He is an Argentine footballer','He plays for Inter Miami','He won the 2022 World Cup','He has 8 Ballon d\'Or awards'] },
        { name: 'Oprah Winfrey', hints: ['She hosted a famous talk show','She is a billionaire','She started with nothing','She loves books and gives cars away'] },
      ];
      if (args.length > 0 && games[gameKey]) {
        const ans = args.join(' ').toLowerCase().trim();
        const celeb = games[gameKey];
        delete games[gameKey]; saveGames(games);
        if (ans === celeb.name.toLowerCase()) return sock.sendMessage(chatId, { text: `🎉 *Correct!*\nYes, it was *${celeb.name}*!` }, { quoted: msg });
        return sock.sendMessage(chatId, { text: `❌ *Wrong!*\nThe answer was *${celeb.name}*` }, { quoted: msg });
      }
      const celeb = r(celebs);
      games[gameKey] = { name: celeb.name };
      saveGames(games);
      const hints = celeb.hints.map((h, i) => `${i+1}. ${h}`).join('\n');
      await sock.sendMessage(chatId, { text: `🌟 *Guess the Celebrity!*\n\nHints:\n${hints}\n\n_Reply with .guesscele <name>_` }, { quoted: msg });
    }
  },
  {
    command: 'wordchain', aliases: ['wordlink','chainwords'],
    category: 'games', description: 'Word chain game', usage: '.wordchain [start/word]',
    async handler(sock, msg, args, ctx) {
      const { chatId, senderId } = ctx;
      const games = loadGames();
      const gameKey = `chain_${chatId}`;
      const starters = ['apple','eagle','elephant','tiger','rainbow','ocean','night','tornado','rose','lemon'];
      if (!games[gameKey] || args[0] === 'start') {
        const start = r(starters);
        games[gameKey] = { words: [start], lastLetter: start[start.length-1] };
        saveGames(games);
        return sock.sendMessage(chatId, { text: `🔗 *Word Chain*\n\nStarting word: *${start}*\n\nNext word must start with: *${start[start.length-1].toUpperCase()}*\n\nUsage: .wordchain <word>` }, { quoted: msg });
      }
      const game = games[gameKey];
      const word = args[0]?.toLowerCase().trim();
      if (!word || !/^[a-z]+$/.test(word)) return sock.sendMessage(chatId, { text: '❌ Please enter a valid word!' }, { quoted: msg });
      if (word[0] !== game.lastLetter) return sock.sendMessage(chatId, { text: `❌ Word must start with *${game.lastLetter.toUpperCase()}*!` }, { quoted: msg });
      if (game.words.includes(word)) return sock.sendMessage(chatId, { text: `❌ *${word}* already used! Try another word.` }, { quoted: msg });
      game.words.push(word);
      game.lastLetter = word[word.length - 1];
      saveGames(games);
      await sock.sendMessage(chatId, {
        text: `🔗 *Word Chain*\n\n✅ *${word}* accepted!\n\n📜 Chain (${game.words.length} words): ${game.words.join(' → ')}\n\nNext: starts with *${game.lastLetter.toUpperCase()}*`
      }, { quoted: msg });
    }
  },
];
