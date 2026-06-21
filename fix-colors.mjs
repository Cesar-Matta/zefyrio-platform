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

  // 1. REVERSE BLUE ABUSE
  // Turn incorrect system blue text into muted or normal text
  content = content.replace(/text-\[var\(--color-system-blue\)\]/g, 'text-[var(--z-muted)]');
  
  // Also fix inline style colors that were forced to system blue
  content = content.replace(/style={{ color: 'var\(--color-system-blue\)' }}/g, "style={{ color: 'var(--z-muted)' }}");

  // Remove border system-blue and orange (Apple relies on z-border or no border)
  content = content.replace(/border-\[var\(--color-system-blue\)\]/g, 'border-[var(--z-border)]');
  content = content.replace(/border: '0\.5px solid var\(--color-system-orange\)'/g, "border: '0.5px solid var(--z-border)'");
  
  // Fix background colors that were inappropriately changed to system blue
  content = content.replace(/bg-\[var\(--color-system-blue\)\]/g, 'bg-[var(--z-surface)]');

  // Fix some font-medium replacements that left trailing classes
  content = content.replace(/ font-medium opacity-80/g, ' text-[var(--z-muted)]');

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Polished: ${filePath}`);
  }
}

console.log("Starting Apple polish pass...");
walkDir(path.join(process.cwd(), 'src'), processFile);
console.log("Done.");
