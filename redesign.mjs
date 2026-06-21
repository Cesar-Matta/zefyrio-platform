import fs from 'fs';
import path from 'path';

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

function processFile(filePath) {
  if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // 1. Typography
  content = content.replace(/\bfont-mono\b/g, 'font-medium');
  content = content.replace(/\btracking-widest\b/g, 'tracking-tight');
  content = content.replace(/tracking-\[0\.[23]e?m\]/g, 'tracking-tight');
  
  // Demilitarize uppercase (only replace it when paired with other text utilities to avoid breaking JS logic)
  content = content.replace(/\buppercase\b/g, ''); 

  // 2. Neon Colors -> System Colors
  content = content.replace(/text-cyber-cyan/g, 'text-[var(--color-system-blue)]');
  content = content.replace(/bg-cyber-cyan/g, 'bg-[var(--color-system-blue)]');
  content = content.replace(/border-cyber-cyan/g, 'border-[var(--color-system-blue)]');
  
  // Case-insensitive hex replacements
  content = content.replace(/#00F0FF/gi, 'var(--color-system-blue)');
  content = content.replace(/#00FF66/gi, 'var(--color-system-green)');
  content = content.replace(/#FFB800/gi, 'var(--color-system-orange)');
  content = content.replace(/#FF0055/gi, 'var(--color-system-red)');
  content = content.replace(/#A8D08D/gi, 'var(--color-system-green)');
  content = content.replace(/#FF6B00/gi, 'var(--color-system-orange)');

  // 3. Backgrounds and Borders
  content = content.replace(/bg-\[#0b0d17\]/gi, 'bg-[var(--z-card)]');
  content = content.replace(/bg-\[#020617\]/gi, 'bg-[var(--z-surface)]');
  content = content.replace(/bg-\[#0a0a0a\]/gi, 'bg-[var(--z-surface)]');
  content = content.replace(/border-white\/10/g, 'border-[var(--z-border)]');
  content = content.replace(/border-white\/20/g, 'border-[var(--z-border)]');
  
  // Clean up multiple spaces left by replacing classes with empty strings
  content = content.replace(/ className="([^"]*)"/g, (match, p1) => {
    const cleaned = p1.replace(/\s+/g, ' ').trim();
    return ` className="${cleaned}"`;
  });

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated: ${filePath}`);
  }
}

console.log("Starting bulk redesign cleanup...");
walkDir(path.join(process.cwd(), 'src'), processFile);
console.log("Done.");
