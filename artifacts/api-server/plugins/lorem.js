const LOREM = 'Lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua Ut enim ad minim veniam quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur Excepteur sint occaecat cupidatat non proident sunt in culpa qui officia deserunt mollit anim id est laborum'.split(' ');

export default {
  command: 'lorem',
  aliases: ['loremipsum', 'placeholder'],
  category: 'tools',
  description: 'Generate Lorem Ipsum placeholder text',
  usage: '.lorem [word count]',
  async handler(sock, message, args, context) {
    const { chatId } = context;
    const count = Math.min(200, Math.max(10, parseInt(args[0]) || 50));
    const words = [];
    for (let i = 0; i < count; i++) words.push(LOREM[i % LOREM.length]);
    const text = words.join(' ').charAt(0).toUpperCase() + words.join(' ').slice(1) + '.';
    await sock.sendMessage(chatId, {
      text: `📝 *Lorem Ipsum* (${count} words)\n\n${text}`
    }, { quoted: message });
  }
};
