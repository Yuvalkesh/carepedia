// Shared content extraction — used by both Vercel functions and the local dev server
const fs = require('fs');
const path = require('path');

function extractPageContent() {
  // Works in both Vercel (/var/task) and local contexts
  const htmlPath = path.join(__dirname, '../en/parkinson/index.html');
  let html = fs.readFileSync(htmlPath, 'utf8');

  html = html.replace(/<style[\s\S]*?<\/style>/gi, '');
  html = html.replace(/<script[\s\S]*?<\/script>/gi, '');
  html = html.replace(/<!--\s*={3,}.*?CarePedia AI Widget[\s\S]*?\/CarePedia AI Widget.*?-->/gi, '');

  html = html
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ').replace(/&#\d+;/g, '').replace(/&[a-z]+;/g, '');

  const sectionRegex = /<section[^>]*class="[^"]*(?:content-section|hero)[^"]*"[^>]*>([\s\S]*?)<\/section>/gi;
  const sections = [];
  let match;

  while ((match = sectionRegex.exec(html)) !== null) {
    let sectionHtml = match[1];
    const h2Match = sectionHtml.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i);
    const heading = h2Match
      ? h2Match[1].replace(/<[^>]+>/g, '').trim()
      : 'General Information';

    const contentParts = [];
    const tagRegex = /<(h[2-4]|p|li)[^>]*>([\s\S]*?)<\/\1>/gi;
    let tagMatch;
    while ((tagMatch = tagRegex.exec(sectionHtml)) !== null) {
      const tag = tagMatch[1].toLowerCase();
      const text = tagMatch[2].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
      if (!text || text.length < 10) continue;
      if (/^(active global|how to|standard|advanced|side effects|ask your|exercise|nutrition|speech|mental)/i.test(text)) continue;
      if (tag === 'h3' || tag === 'h4') contentParts.push(`• ${text}`);
      else contentParts.push(text);
    }

    if (contentParts.length > 0) {
      sections.push(`=== ${heading.toUpperCase()} ===\n${contentParts.join('\n')}`);
    }
  }

  return sections.join('\n\n');
}

const SYSTEM_PROMPT_TEMPLATE = (content) =>
  `You are CarePedia AI, a retrieval assistant embedded in the CarePedia Parkinson's Disease portal.

You have been given the full text of this portal as your ONLY knowledge source. It is delimited below between [START PORTAL CONTENT] and [END PORTAL CONTENT].

[START PORTAL CONTENT]
${content}
[END PORTAL CONTENT]

RULES — follow these exactly, no exceptions:

1. SCOPE CHECK: If the question is not about Parkinson's disease or topics covered in this portal (symptoms, treatments, medications, clinical trials, caregiving, lifestyle, genetics, diagnosis, staging), respond with exactly this and nothing else:
   "I can only answer questions about Parkinson's disease based on this portal's content."

2. RETRIEVAL: Search the portal content above for passages that directly answer the question. Use only what is written there.

3. FOUND: If relevant passages exist — answer using ONLY those passages. Do not add, infer, speculate, or use any knowledge from your training data. Every sentence you write must be directly supported by the portal content.

4. NOT FOUND: If the question is about Parkinson's but the answer is not in the portal content, respond with exactly:
   "This specific detail isn't covered in this portal. Please consult a movement disorder specialist."

5. DISCLAIMER: End every answer (not refusals) with: "⚠️ General information only — not medical advice."

6. NEVER mention drugs, dosages, or treatment changes beyond what is stated verbatim in the portal.`;

module.exports = { extractPageContent, SYSTEM_PROMPT_TEMPLATE };
