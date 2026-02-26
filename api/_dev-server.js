// Local development server only — NOT deployed to Vercel (underscore prefix is ignored)
// Run: ANTHROPIC_API_KEY=sk-ant-... node _dev-server.js
const express = require('express');
const cors = require('cors');
const Anthropic = require('@anthropic-ai/sdk');
const fs = require('fs');
const path = require('path');
const { extractPageContent, SYSTEM_PROMPT_TEMPLATE } = require('./_extract');

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const PAGE_CONTENT = extractPageContent();
const SYSTEM_PROMPT = SYSTEM_PROMPT_TEMPLATE(PAGE_CONTENT);
console.log(`✓ Loaded ${PAGE_CONTENT.length.toLocaleString()} chars of portal content`);

const REQUESTS_FILE = path.join(__dirname, 'research-requests.json');
function loadRequests() {
  try { return JSON.parse(fs.readFileSync(REQUESTS_FILE, 'utf8')); }
  catch { return []; }
}

app.post('/ask', async (req, res) => {
  const { question } = req.body;
  if (!question?.trim()) return res.status(400).json({ error: 'No question provided.' });
  try {
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 400,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: question.trim() }],
    });
    res.json({ reply: message.content[0].text });
  } catch (err) {
    res.status(500).json({ error: 'AI error — please try again.' });
  }
});

app.post('/request-research', (req, res) => {
  const { question } = req.body;
  if (!question?.trim()) return res.status(400).json({ error: 'No question provided.' });
  const requests = loadRequests();
  requests.push({ id: Date.now(), question: question.trim(), requestedAt: new Date().toISOString(), status: 'pending' });
  fs.writeFileSync(REQUESTS_FILE, JSON.stringify(requests, null, 2));
  console.log(`📥 Research request: "${question.trim()}"`);
  res.json({ ok: true });
});

app.get('/research-requests', (_, res) => res.json(loadRequests()));
app.get('/health', (_, res) => res.json({ ok: true, chars: PAGE_CONTENT.length }));
app.get('/content-preview', (_, res) => res.type('text').send(PAGE_CONTENT.slice(0, 3000) + '\n\n[...truncated]'));

app.listen(3001, () => console.log('CarePedia AI dev server → http://localhost:3001'));
