import axios from 'axios';

const OPENAI_URL = process.env.OPENAI_API_URL || 'https://api.openai.com/v1';
const OPENAI_KEY = process.env.OPENAI_API_KEY || '';

async function callAI(prompt, systemPrompt = 'You are a helpful AI assistant.') {
  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: prompt }
  ];

  const apis = [
    // Primary: Pollinations.ai (free, no key)
    async () => {
      const { data } = await axios.post('https://text.pollinations.ai/openai', {
        model: 'openai',
        messages,
        max_tokens: 700,
        temperature: 0.7
      }, { headers: { 'Content-Type': 'application/json' }, timeout: 30000 });
      const answer = data.choices?.[0]?.message?.content?.trim();
      if (answer) return answer;
      throw new Error('No result');
    },
    // Fallback: OpenAI-compatible key (Pawan)
    async () => {
      if (!OPENAI_KEY) throw new Error('No API key');
      const { data } = await axios.post(`${OPENAI_URL}/chat/completions`, {
        model: 'gpt-3.5-turbo',
        messages,
        max_tokens: 500,
        temperature: 0.7
      }, {
        headers: { 'Authorization': `Bearer ${OPENAI_KEY}`, 'Content-Type': 'application/json' },
        timeout: 30000
      });
      return data.choices[0].message.content;
    },
    // Fallback: Pawan v1
    async () => {
      const { data } = await axios.post('https://api.pawan.krd/v1/chat/completions', {
        model: 'pai-001',
        messages,
        max_tokens: 500,
        temperature: 0.7
      }, {
        headers: { 'Authorization': `Bearer pk-pIWAlRroXTOAigkWdHcYvmlmgzEQXuoMWbVAaLAVZswSRbEB`, 'Content-Type': 'application/json' },
        timeout: 25000
      });
      const answer = data.choices?.[0]?.message?.content?.trim();
      if (answer) return answer;
      throw new Error('No result');
    }
  ];
  for (const fn of apis) {
    try { return await fn(); } catch {}
  }
  throw new Error('All AI APIs unavailable. Try again later.');
}

export default [
  {
    command: 'chatgpt',
    aliases: ['gpt', 'gpt4'],
    category: 'ai',
    description: 'Chat with ChatGPT AI',
    usage: '.chatgpt <your message>',
    async handler(sock, message, args, context) {
      const { chatId } = context;
      const query = args.join(' ').trim();
      if (!query) {
        return sock.sendMessage(chatId, { text: '🤖 Usage: `.chatgpt <your message>`\n\nExample: `.chatgpt What is the capital of Nigeria?`' }, { quoted: message });
      }
      try {
        await sock.sendMessage(chatId, { react: { text: '🤖', key: message.key } });
        const reply = await callAI(query);
        await sock.sendMessage(chatId, { text: `🤖 *ChatGPT*\n\n${reply}` }, { quoted: message });
      } catch (err) {
        await sock.sendMessage(chatId, { text: `❌ AI unavailable: ${err.message}` }, { quoted: message });
      }
    }
  },
  {
    command: 'gemini',
    aliases: ['google-ai', 'bard'],
    category: 'ai',
    description: 'Chat with Google Gemini AI',
    usage: '.gemini <your message>',
    async handler(sock, message, args, context) {
      const { chatId } = context;
      const query = args.join(' ').trim();
      if (!query) {
        return sock.sendMessage(chatId, { text: '✨ Usage: `.gemini <your message>`\n\nExample: `.gemini Explain quantum physics simply`' }, { quoted: message });
      }
      try {
        await sock.sendMessage(chatId, { react: { text: '✨', key: message.key } });
        const apis = [
          async () => {
            const key = process.env.GEMINI_API_KEY;
            if (!key) throw new Error('No key');
            const { data } = await axios.post(
              `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${key}`,
              { contents: [{ parts: [{ text: query }] }] },
              { timeout: 30000 }
            );
            return data.candidates?.[0]?.content?.parts?.[0]?.text;
          },
          async () => {
            const { data } = await axios.get('https://api.maher-zubair.tech/ai/gemini', {
              params: { query },
              timeout: 30000
            });
            if (data?.status && data?.result) return data.result;
            throw new Error('No result');
          },
          async () => callAI(query, 'You are Google Gemini AI, a helpful and creative assistant.')
        ];
        let reply = null;
        for (const fn of apis) {
          try { reply = await fn(); if (reply) break; } catch {}
        }
        if (!reply) throw new Error('All Gemini APIs failed');
        await sock.sendMessage(chatId, { text: `✨ *Gemini AI*\n\n${reply}` }, { quoted: message });
      } catch (err) {
        await sock.sendMessage(chatId, { text: `❌ Gemini AI unavailable: ${err.message}` }, { quoted: message });
      }
    }
  },
  {
    command: 'claude',
    aliases: ['anthropic', 'claude-ai'],
    category: 'ai',
    description: 'Chat with Claude AI (Anthropic)',
    usage: '.claude <your message>',
    async handler(sock, message, args, context) {
      const { chatId } = context;
      const query = args.join(' ').trim();
      if (!query) {
        return sock.sendMessage(chatId, { text: '🧠 Usage: `.claude <your message>`' }, { quoted: message });
      }
      try {
        await sock.sendMessage(chatId, { react: { text: '🧠', key: message.key } });
        const reply = await callAI(query, 'You are Claude, an AI assistant by Anthropic. Be helpful, harmless, and honest.');
        await sock.sendMessage(chatId, { text: `🧠 *Claude AI*\n\n${reply}` }, { quoted: message });
      } catch (err) {
        await sock.sendMessage(chatId, { text: `❌ Claude AI unavailable: ${err.message}` }, { quoted: message });
      }
    }
  },
  {
    command: 'ai-sum',
    aliases: ['aisum', 'summarize-ai', 'tldr'],
    category: 'ai',
    description: 'AI-powered text summarization',
    usage: '.ai-sum <long text>',
    async handler(sock, message, args, context) {
      const { chatId } = context;
      const text = args.join(' ').trim();
      if (!text || text.length < 50) {
        return sock.sendMessage(chatId, { text: '📝 Usage: `.ai-sum <long text to summarize>`\n\nOr reply to a long message with `.ai-sum`' }, { quoted: message });
      }
      try {
        await sock.sendMessage(chatId, { react: { text: '📝', key: message.key } });
        const reply = await callAI(`Summarize the following text in 3-5 bullet points:\n\n${text}`, 'You are an expert summarizer. Create concise, clear summaries.');
        await sock.sendMessage(chatId, { text: `📝 *AI Summary*\n\n${reply}` }, { quoted: message });
      } catch (err) {
        await sock.sendMessage(chatId, { text: `❌ AI summarization failed: ${err.message}` }, { quoted: message });
      }
    }
  },
  {
    command: 'ai-rewrite',
    aliases: ['airewrite', 'rephrase', 'paraphrase'],
    category: 'ai',
    description: 'AI-powered text rewriting',
    usage: '.ai-rewrite <text>',
    async handler(sock, message, args, context) {
      const { chatId } = context;
      const text = args.join(' ').trim();
      if (!text) {
        return sock.sendMessage(chatId, { text: '✏️ Usage: `.ai-rewrite <text to rephrase>`' }, { quoted: message });
      }
      try {
        await sock.sendMessage(chatId, { react: { text: '✏️', key: message.key } });
        const reply = await callAI(`Rewrite and improve the following text. Make it clearer and more professional:\n\n${text}`, 'You are a professional editor. Rewrite text to be clearer and more impactful.');
        await sock.sendMessage(chatId, { text: `✏️ *AI Rewrite*\n\n${reply}` }, { quoted: message });
      } catch (err) {
        await sock.sendMessage(chatId, { text: `❌ AI rewrite failed: ${err.message}` }, { quoted: message });
      }
    }
  },
  {
    command: 'ai-roast',
    aliases: ['roastai', 'airoast2'],
    category: 'ai',
    description: 'AI-generated roast',
    usage: '.ai-roast <name or topic>',
    async handler(sock, message, args, context) {
      const { chatId } = context;
      const target = args.join(' ').trim() || 'the person reading this';
      try {
        await sock.sendMessage(chatId, { react: { text: '🔥', key: message.key } });
        const reply = await callAI(`Write a funny, creative roast about "${target}". Keep it playful and not too mean.`, 'You are a comedian. Write funny, creative roasts that are playful, not hurtful.');
        await sock.sendMessage(chatId, { text: `🔥 *AI Roast*\n\n${reply}\n\n_Just for fun! No hate here_ 😂` }, { quoted: message });
      } catch (err) {
        await sock.sendMessage(chatId, { text: `❌ AI roast failed: ${err.message}` }, { quoted: message });
      }
    }
  },
  {
    command: 'ai-story',
    aliases: ['aistory', 'shortstory', 'generate-story'],
    category: 'ai',
    description: 'Generate an AI story',
    usage: '.ai-story <story prompt>',
    async handler(sock, message, args, context) {
      const { chatId } = context;
      const prompt = args.join(' ').trim() || 'a hero in a magical world';
      try {
        await sock.sendMessage(chatId, { react: { text: '📖', key: message.key } });
        const reply = await callAI(`Write a short creative story (200-300 words) about: ${prompt}`, 'You are a creative storyteller. Write engaging, imaginative short stories.');
        await sock.sendMessage(chatId, { text: `📖 *AI Story*\n\n${reply}` }, { quoted: message });
      } catch (err) {
        await sock.sendMessage(chatId, { text: `❌ Story generation failed: ${err.message}` }, { quoted: message });
      }
    }
  },
  {
    command: 'ai-poem',
    aliases: ['aipoem', 'generate-poem', 'poetry'],
    category: 'ai',
    description: 'Generate an AI poem',
    usage: '.ai-poem <topic>',
    async handler(sock, message, args, context) {
      const { chatId } = context;
      const topic = args.join(' ').trim() || 'life';
      try {
        await sock.sendMessage(chatId, { react: { text: '🎭', key: message.key } });
        const reply = await callAI(`Write a beautiful, creative poem about: ${topic}`, 'You are a talented poet. Write evocative, beautiful poems with rhythm and imagery.');
        await sock.sendMessage(chatId, { text: `🎭 *AI Poem*\n\n${reply}` }, { quoted: message });
      } catch (err) {
        await sock.sendMessage(chatId, { text: `❌ Poem generation failed: ${err.message}` }, { quoted: message });
      }
    }
  },
  {
    command: 'ai-code',
    aliases: ['aicode', 'codegen', 'generate-code'],
    category: 'ai',
    description: 'Generate code using AI',
    usage: '.ai-code <describe what you need>',
    async handler(sock, message, args, context) {
      const { chatId } = context;
      const request = args.join(' ').trim();
      if (!request) {
        return sock.sendMessage(chatId, { text: '💻 Usage: `.ai-code <describe what code you need>`\n\nExample: `.ai-code Python function to reverse a string`' }, { quoted: message });
      }
      try {
        await sock.sendMessage(chatId, { react: { text: '💻', key: message.key } });
        const reply = await callAI(`Write code for the following request: ${request}\n\nInclude brief comments explaining the code.`, 'You are an expert programmer. Write clean, efficient, well-commented code. Format code blocks properly.');
        await sock.sendMessage(chatId, { text: `💻 *AI Code*\n\n${reply}` }, { quoted: message });
      } catch (err) {
        await sock.sendMessage(chatId, { text: `❌ Code generation failed: ${err.message}` }, { quoted: message });
      }
    }
  },
  {
    command: 'ai-caption',
    aliases: ['aicaption', 'caption-gen', 'generate-caption'],
    category: 'ai',
    description: 'Generate captions for social media using AI',
    usage: '.ai-caption <describe your photo/post>',
    async handler(sock, message, args, context) {
      const { chatId } = context;
      const description = args.join(' ').trim() || 'a beautiful photo';
      try {
        await sock.sendMessage(chatId, { react: { text: '📸', key: message.key } });
        const reply = await callAI(`Generate 3 creative social media captions for: ${description}\n\nInclude relevant emojis and hashtags for each.`, 'You are a social media expert. Generate engaging, viral-worthy captions with relevant hashtags.');
        await sock.sendMessage(chatId, { text: `📸 *AI Captions*\n\n${reply}` }, { quoted: message });
      } catch (err) {
        await sock.sendMessage(chatId, { text: `❌ Caption generation failed: ${err.message}` }, { quoted: message });
      }
    }
  },
  {
    command: 'ai-essay',
    aliases: ['aiessay', 'write-essay', 'essaygen'],
    category: 'ai',
    description: 'Write an essay on any topic using AI',
    usage: '.ai-essay <topic>',
    async handler(sock, message, args, context) {
      const { chatId } = context;
      const topic = args.join(' ').trim();
      if (!topic) {
        return sock.sendMessage(chatId, { text: '📄 Usage: `.ai-essay <topic>`\n\nExample: `.ai-essay The impact of social media on youth`' }, { quoted: message });
      }
      try {
        await sock.sendMessage(chatId, { react: { text: '📄', key: message.key } });
        const reply = await callAI(`Write a well-structured essay (400-500 words) on the topic: "${topic}"\n\nInclude: introduction, 2-3 body paragraphs, and conclusion.`, 'You are an academic writer. Write well-structured, informative essays.');
        await sock.sendMessage(chatId, { text: `📄 *AI Essay*\n\n_Topic: ${topic}_\n\n${reply}` }, { quoted: message });
      } catch (err) {
        await sock.sendMessage(chatId, { text: `❌ Essay generation failed: ${err.message}` }, { quoted: message });
      }
    }
  },
  {
    command: 'ai-reply',
    aliases: ['aireply', 'smartreply', 'reply-gen'],
    category: 'ai',
    description: 'Generate a smart reply to a message',
    usage: '.ai-reply <message to reply to>',
    async handler(sock, message, args, context) {
      const { chatId } = context;
      const msgToReply = args.join(' ').trim();
      if (!msgToReply) {
        return sock.sendMessage(chatId, { text: '💬 Usage: `.ai-reply <message>`\n\nExample: `.ai-reply "Hey, are you free tonight?"`' }, { quoted: message });
      }
      try {
        await sock.sendMessage(chatId, { react: { text: '💬', key: message.key } });
        const reply = await callAI(`Generate 3 different smart, natural replies to this message: "${msgToReply}"\n\nLabel them: Formal, Casual, and Funny.`, 'You are a communication expert. Generate natural, context-appropriate replies.');
        await sock.sendMessage(chatId, { text: `💬 *Smart Replies*\n\n_In response to: "${msgToReply}"_\n\n${reply}` }, { quoted: message });
      } catch (err) {
        await sock.sendMessage(chatId, { text: `❌ Reply generation failed: ${err.message}` }, { quoted: message });
      }
    }
  },
  {
    command: 'ai-explain',
    aliases: ['aiexplain', 'explain-ai', 'eli5'],
    category: 'ai',
    description: 'Get AI to explain any concept simply',
    usage: '.ai-explain <concept>',
    async handler(sock, message, args, context) {
      const { chatId } = context;
      const concept = args.join(' ').trim();
      if (!concept) {
        return sock.sendMessage(chatId, { text: '🔍 Usage: `.ai-explain <concept>`\n\nExample: `.ai-explain quantum entanglement`' }, { quoted: message });
      }
      try {
        await sock.sendMessage(chatId, { react: { text: '🔍', key: message.key } });
        const reply = await callAI(`Explain "${concept}" in simple terms that a 12-year-old could understand. Use analogies and examples.`, 'You are a great teacher who explains complex topics simply and clearly.');
        await sock.sendMessage(chatId, { text: `🔍 *AI Explanation*\n\n_${concept}:_\n\n${reply}` }, { quoted: message });
      } catch (err) {
        await sock.sendMessage(chatId, { text: `❌ Explanation failed: ${err.message}` }, { quoted: message });
      }
    }
  }
];
