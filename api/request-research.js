// In production (Vercel): logs to function logs — view in Vercel dashboard
// In local dev: the Express _dev-server.js writes to research-requests.json

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

  console.log(`[RESEARCH REQUEST] ${new Date().toISOString()} — "${question.trim()}"`);
  res.json({ ok: true });
};
