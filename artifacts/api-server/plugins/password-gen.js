export default {
  command: 'password',
  aliases: ['passgen', 'generatepassword', 'genpass'],
  category: 'tools',
  description: 'Generate a strong random password',
  usage: '.password [length]',
  async handler(sock, message, args, context) {
    const { chatId } = context;
    const length = Math.min(64, Math.max(8, parseInt(args[0]) || 16));
    const charset = {
      upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
      lower: 'abcdefghijklmnopqrstuvwxyz',
      digits: '0123456789',
      special: '!@#$%^&*()_+-=[]{}|;:,.<>?',
    };
    const all = Object.values(charset).join('');
    let pass = [
      charset.upper[Math.floor(Math.random() * charset.upper.length)],
      charset.lower[Math.floor(Math.random() * charset.lower.length)],
      charset.digits[Math.floor(Math.random() * charset.digits.length)],
      charset.special[Math.floor(Math.random() * charset.special.length)],
      ...Array.from({ length: length - 4 }, () => all[Math.floor(Math.random() * all.length)]),
    ];
    pass = pass.sort(() => Math.random() - 0.5).join('');
    const strength = length >= 20 ? '💪 Very Strong' : length >= 16 ? '🟢 Strong' : length >= 12 ? '🟡 Medium' : '🔴 Weak';
    await sock.sendMessage(chatId, {
      text: `🔐 *Password Generator*\n\n*Password:* \`${pass}\`\n*Length:* ${length} characters\n*Strength:* ${strength}\n\n_⚠️ Save this somewhere safe!_`
    }, { quoted: message });
  }
};
