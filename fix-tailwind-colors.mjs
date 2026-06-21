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

  // 1. Fix text-white to be dynamic based on theme (except in purely blue interactive buttons where white is always correct)
  // To avoid breaking buttons, we replace it in general layout containers.
  content = content.replace(/text-white\/([0-9]{2})/g, 'text-[var(--z-muted)]');
  content = content.replace(/text-white/g, 'text-[var(--z-text)]');
  
  // 2. Fix neon tailwind colors
  // Green/Emerald
  content = content.replace(/text-emerald-[456]00/g, 'text-[var(--color-system-green)]');
  content = content.replace(/bg-emerald-[456]00\/[0-9]+/g, 'bg-[var(--color-system-green)]/10');
  content = content.replace(/border-emerald-[456]00\/[0-9]+/g, 'border-[var(--color-system-green)]/20');
  
  // Amber/Yellow
  content = content.replace(/text-amber-[456]00/g, 'text-[var(--color-system-orange)]');
  content = content.replace(/bg-amber-[456]00\/[0-9]+/g, 'bg-[var(--color-system-orange)]/10');
  content = content.replace(/bg-amber-[456]00/g, 'bg-[var(--color-system-orange)]');
  
  // Red
  content = content.replace(/text-red-[456]00/g, 'text-[var(--color-system-red)]');
  content = content.replace(/bg-red-[456]00\/[0-9]+/g, 'bg-[var(--color-system-red)]/10');
  content = content.replace(/bg-red-[456]00/g, 'bg-[var(--color-system-red)]');
  content = content.replace(/border-red-[456]00\/[0-9]+/g, 'border-[var(--color-system-red)]/20');
  content = content.replace(/shadow-\[0_0_10px_rgba\(239,68,68,0\.5\)\]/g, ''); // Remove red glows

  // 3. Fix background opacities that break contrast in light mode
  content = content.replace(/bg-black\/[0-9]+/g, 'bg-[var(--z-card)]');
  content = content.replace(/bg-\[#111625\]\/40/g, 'bg-[var(--z-card)]');

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Polished: ${filePath}`);
  }
}

console.log("Starting tailwind color fix pass...");
walkDir(path.join(process.cwd(), 'src'), processFile);
console.log("Done.");
