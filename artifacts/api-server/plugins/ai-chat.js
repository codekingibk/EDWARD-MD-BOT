const { cmd } = require('../command');
const axios = require('axios');

const OPENAI_KEY = process.env.OPENAI_API_KEY || 'pk-pIWAlRroXTOAigkWdHcYvmlmgzEQXuoMWbVAaLAVZswSRbEB';
const OPENAI_BASE = process.env.OPENAI_BASE_URL || 'https://api.pawan.krd/cosmosrp/v1';

async function askAI(prompt, system = 'You are EDWARD MD, a helpful WhatsApp AI assistant. Be concise and helpful. Reply in English.') {
  try {
    const res = await axios.post(`${OPENAI_BASE}/chat/completions`, {
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: prompt }
      ],
      max_tokens: 1024,
      temperature: 0.7,
    }, {
      headers: { 'Authorization': `Bearer ${OPENAI_KEY}`, 'Content-Type': 'application/json' },
      timeout: 30000,
    });
    return res.data.choices?.[0]?.message?.content?.trim() || null;
  } catch (e) {
    console.error('askAI error:', e.response?.data || e.message);
    return null;
  }
}

cmd({
    pattern: "ai",
    alias: ["bot", "dj", "gpt", "gpt4", "bing", "ask"],
    desc: "Chat with EDWARD AI",
    category: "ai",
    react: "🤖",
    filename: __filename
},
async (conn, mek, m, { from, args, q, reply, react }) => {
    try {
        if (!q) return reply("🤖 *EDWARD AI*\n\nUsage: `.ai <your question>`\n\nExample: `.ai What is the meaning of life?`");
        await react("⏳");
        const answer = await askAI(q);
        if (!answer) { await react("❌"); return reply("AI did not respond. Please try again later."); }
        await reply(`🤖 *EDWARD AI*\n\n${answer}`);
        await react("✅");
    } catch (e) {
        console.error("Error in AI command:", e);
        await react("❌");
        reply(`❌ AI Error: ${e.message}`);
    }
});

cmd({
    pattern: "openai",
    alias: ["chatgpt", "gpt3", "open-gpt"],
    desc: "Chat with OpenAI GPT",
    category: "ai",
    react: "🧠",
    filename: __filename
},
async (conn, mek, m, { q, reply, react }) => {
    try {
        if (!q) return reply("🧠 *OpenAI GPT*\n\nUsage: `.openai <message>`");
        await react("⏳");
        const answer = await askAI(q, 'You are a helpful and knowledgeable AI assistant. Reply in clear English.');
        if (!answer) { await react("❌"); return reply("OpenAI failed to respond. Try again later."); }
        await reply(`🧠 *OpenAI Response:*\n\n${answer}`);
        await react("✅");
    } catch (e) {
        await react("❌");
        reply(`❌ Error: ${e.message}`);
    }
});

cmd({
    pattern: "deepseek",
    alias: ["deep", "seekai", "ds"],
    desc: "Chat with DeepSeek AI reasoning model",
    category: "ai",
    react: "🔍",
    filename: __filename
},
async (conn, mek, m, { q, reply, react }) => {
    try {
        if (!q) return reply("🔍 *DeepSeek AI*\n\nUsage: `.deepseek <question>`");
        await react("⏳");
        let answer = null;
        try {
            const { data } = await axios.get(`https://api.ryzendesu.vip/api/ai/deepseek?text=${encodeURIComponent(q)}`, { timeout: 12000 });
            answer = data?.answer;
        } catch {}
        if (!answer) answer = await askAI(q, 'You are a precise, analytical AI assistant focused on deep reasoning. Provide thorough, accurate answers in English.');
        if (!answer) { await react("❌"); return reply("DeepSeek AI did not respond. Try again."); }
        await reply(`🔍 *DeepSeek Response:*\n\n${answer}`);
        await react("✅");
    } catch (e) {
        await react("❌");
        reply(`❌ Error: ${e.message}`);
    }
});

cmd({
    pattern: "summarize",
    alias: ["tldr", "sum", "brief", "shorten"],
    desc: "Summarize text using AI",
    category: "ai",
    react: "📝",
    filename: __filename
},
async (conn, mek, m, { q, reply, react }) => {
    try {
        if (!q) return reply("📝 *Summarize*\n\nUsage: `.summarize <long text>`");
        await react("⏳");
        const answer = await askAI(`Summarize this text clearly and concisely in bullet points:\n\n${q}`, 'You are a text summarization expert. Provide clear, concise summaries.');
        if (!answer) { await react("❌"); return reply("Could not summarize. Try again."); }
        await reply(`📝 *Summary:*\n\n${answer}`);
        await react("✅");
    } catch (e) { await react("❌"); reply(`❌ Error: ${e.message}`); }
});

cmd({
    pattern: "rewrite",
    alias: ["rephrase", "paraphrase", "improve"],
    desc: "Rewrite text in a better style using AI",
    category: "ai",
    react: "✏️",
    filename: __filename
},
async (conn, mek, m, { q, reply, react }) => {
    try {
        if (!q) return reply("✏️ *Rewrite*\n\nUsage: `.rewrite <text>`");
        await react("⏳");
        const answer = await askAI(`Rewrite the following text in a clearer, more professional style while keeping the same meaning:\n\n${q}`, 'You are a professional writing assistant. Improve text clarity and style.');
        if (!answer) { await react("❌"); return reply("Could not rewrite. Try again."); }
        await reply(`✏️ *Rewritten:*\n\n${answer}`);
        await react("✅");
    } catch (e) { await react("❌"); reply(`❌ Error: ${e.message}`); }
});

cmd({
    pattern: "codeai",
    alias: ["code", "program", "script", "codegen"],
    desc: "Generate code with AI",
    category: "ai",
    react: "💻",
    filename: __filename
},
async (conn, mek, m, { q, reply, react }) => {
    try {
        if (!q) return reply("💻 *Code AI*\n\nUsage: `.codeai <describe what you want>`\n\nExample: `.codeai Python function to reverse a string`");
        await react("⏳");
        const answer = await askAI(q, 'You are an expert programmer. Provide clean, well-commented code with a brief explanation. Always use appropriate code blocks.');
        if (!answer) { await react("❌"); return reply("Could not generate code. Try again."); }
        await reply(`💻 *Code AI:*\n\n${answer}`);
        await react("✅");
    } catch (e) { await react("❌"); reply(`❌ Error: ${e.message}`); }
});

cmd({
    pattern: "explain",
    alias: ["whatis", "whatisit", "xplain", "describe"],
    desc: "Explain any concept using AI",
    category: "ai",
    react: "🎓",
    filename: __filename
},
async (conn, mek, m, { q, reply, react }) => {
    try {
        if (!q) return reply("🎓 *Explain*\n\nUsage: `.explain <concept>`");
        await react("⏳");
        const answer = await askAI(`Explain "${q}" in simple terms that anyone can understand.`, 'You are a knowledgeable teacher who explains complex topics simply and engagingly.');
        if (!answer) { await react("❌"); return reply("Could not explain. Try again."); }
        await reply(`🎓 *Explanation of "${q}":*\n\n${answer}`);
        await react("✅");
    } catch (e) { await react("❌"); reply(`❌ Error: ${e.message}`); }
});

cmd({
    pattern: "poem",
    alias: ["poetry", "poetic", "verse2"],
    desc: "Generate a poem using AI",
    category: "ai",
    react: "🎭",
    filename: __filename
},
async (conn, mek, m, { q, reply, react }) => {
    try {
        if (!q) return reply("🎭 *Poem AI*\n\nUsage: `.poem <topic>`\n\nExample: `.poem the beauty of rain`");
        await react("⏳");
        const answer = await askAI(`Write a beautiful, original poem about: ${q}. At least 3 stanzas with good rhythm and rhyme.`, 'You are a talented poet. Write heartfelt, creative poems in English.');
        if (!answer) { await react("❌"); return reply("Could not write poem. Try again."); }
        await reply(`🎭 *Poem — "${q}":*\n\n${answer}`);
        await react("✅");
    } catch (e) { await react("❌"); reply(`❌ Error: ${e.message}`); }
});

cmd({
    pattern: "story",
    alias: ["storyai", "tale", "narrate"],
    desc: "Generate a short story using AI",
    category: "ai",
    react: "📖",
    filename: __filename
},
async (conn, mek, m, { q, reply, react }) => {
    try {
        if (!q) return reply("📖 *Story AI*\n\nUsage: `.story <theme or characters>`\n\nExample: `.story a brave knight and a dragon`");
        await react("⏳");
        const answer = await askAI(`Write a short, engaging story about: ${q}. Keep it under 300 words with a clear beginning, middle, and end.`, 'You are a creative storyteller. Write engaging, vivid short stories.');
        if (!answer) { await react("❌"); return reply("Could not generate story. Try again."); }
        await reply(`📖 *Story:*\n\n${answer}`);
        await react("✅");
    } catch (e) { await react("❌"); reply(`❌ Error: ${e.message}`); }
});

cmd({
    pattern: "roast",
    alias: ["airoast", "burn", "insultai"],
    desc: "Get an AI-generated roast",
    category: "fun",
    react: "🔥",
    filename: __filename
},
async (conn, mek, m, { q, reply, react }) => {
    try {
        const target = q || 'me';
        await react("⏳");
        const answer = await askAI(`Write a funny, creative roast for "${target}". Keep it playful and not mean-spirited.`, 'You are a stand-up comedian who writes funny, lighthearted roasts. Never be hateful or offensive.');
        if (!answer) { await react("❌"); return reply("Could not roast. Try again."); }
        await reply(`🔥 *Roast:*\n\n${answer}`);
        await react("✅");
    } catch (e) { await react("❌"); reply(`❌ Error: ${e.message}`); }
});

cmd({
    pattern: "compliment",
    alias: ["complimentai", "praise", "flatter"],
    desc: "Generate a heartfelt compliment with AI",
    category: "fun",
    react: "💝",
    filename: __filename
},
async (conn, mek, m, { q, reply, react }) => {
    try {
        const target = q || 'you';
        await react("⏳");
        const answer = await askAI(`Write a sweet, genuine compliment for "${target}". Make it heartfelt and specific.`, 'You are a kind, warm person who gives sincere and uplifting compliments.');
        if (!answer) { await react("❌"); return reply("Could not generate compliment. Try again."); }
        await reply(`💝 *Compliment:*\n\n${answer}`);
        await react("✅");
    } catch (e) { await react("❌"); reply(`❌ Error: ${e.message}`); }
});


      
