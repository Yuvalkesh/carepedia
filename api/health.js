const fs = require('fs');
const path = require('path');

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const htmlPath = path.join(__dirname, '../en/parkinson/index.html');
  const fileExists = fs.existsSync(htmlPath);
  const keySet = !!process.env.ANTHROPIC_API_KEY;
  const keyPrefix = process.env.ANTHROPIC_API_KEY
    ? process.env.ANTHROPIC_API_KEY.slice(0, 14) + '...'
    : 'NOT SET';

  res.json({ ok: fileExists && keySet, fileExists, keySet, keyPrefix, cwd: process.cwd(), __dirname });
};
