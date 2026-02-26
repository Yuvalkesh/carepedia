const Anthropic = require('@anthropic-ai/sdk');
const { extractPageContent, SYSTEM_PROMPT_TEMPLATE } = require('./_extract');

// Extract once at cold-start
const PAGE_CONTENT = extractPageContent();
const SYSTEM_PROMPT = SYSTEM_PROMPT_TEMPLATE(PAGE_CONTENT);
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { question } = req.body;
  if (!question || typeof question !== 'string' || !question.trim()) {
    return res.status(400).json({ error: 'No question provided.' });
  }

  try {
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 400,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: question.trim() }],
    });

    res.json({ reply: message.content[0].text });
  } catch (err) {
    console.error('Claude API error:', err.status, err.message);
    res.status(500).json({ error: `AI error: ${err.status || ''} ${err.message || err}`.trim() });
  }
};
