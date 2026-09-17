const fs = require('fs');
const s = fs.readFileSync('catalog.js', 'utf8');
let paren = 0, brace = 0, brack = 0, line = 1;
let inStr = null, esc = false, inLineComment = false, inBlockComment = false;

for (let i = 0; i < s.length; i++) {
  const c = s[i];
  if (c === '\n') { line++; inLineComment = false; }
  if (inLineComment) continue;
  if (inBlockComment) {
    if (c === '*' && s[i + 1] === '/') { inBlockComment = false; i++; }
    continue;
  }
  if (inStr) {
    if (esc) { esc = false; }
    else if (c === '\\') { esc = true; }
    else if (c === inStr) { inStr = null; }
    continue;
  }
  if (c === '/' && s[i + 1] === '/') { inLineComment = true; continue; }
  if (c === '/' && s[i + 1] === '*') { inBlockComment = true; i++; continue; }
  if (c === '"' || c === "'" || c === '`') { inStr = c; continue; }
  if (c === '(') paren++;
  if (c === ')') { paren--; if (paren < 0) { console.log('Extra ) at line', line); process.exit(); } }
  if (c === '{') brace++;
  if (c === '}') { brace--; if (brace < 0) { console.log('Extra } at line', line); process.exit(); } }
  if (c === '[') brack++;
  if (c === ']') { brack--; if (brack < 0) { console.log('Extra ] at line', line); process.exit(); } }
}
console.log('Final counts — unclosed ( :', paren, '| unclosed { :', brace, '| unclosed [ :', brack);