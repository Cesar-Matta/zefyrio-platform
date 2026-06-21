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

  // 1. Remove dangerous opacity classes that cause "white on gray / invisible text"
  content = content.replace(/\bopacity-(30|40|50|60|70|80)\b/g, '');

  // 2. Fix the bright cyan bars in VerticalWindProfile (or anywhere else)
  content = content.replace(/bg-cyan-400/g, 'bg-[var(--color-system-blue)]');
  content = content.replace(/text-cyan-400/g, 'text-[var(--color-system-blue)]');

  // 3. Fix RAW METAR green text
  // Looking at the screenshot, the text "RAW METAR:" is green.
  // It might be text-[#00ff66] or text-green-500. Let's catch both.
  content = content.replace(/text-\[#00ff66\]/gi, 'text-[var(--color-system-green)]');
  content = content.replace(/text-green-500/g, 'text-[var(--color-system-green)]');
  content = content.replace(/text-green-400/g, 'text-[var(--color-system-green)]');

  // 4. Fix bottom nav icons
  // Usually they have text-white/50 or similar. We already removed opacity-50.
  // Make sure they use text-[var(--z-muted)] when inactive.
  
  // Clean up multiple spaces
  content = content.replace(/ className="([^"]*)"/g, (match, p1) => {
    const cleaned = p1.replace(/\s+/g, ' ').trim();
    return ` className="${cleaned}"`;
  });

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Polished contrast: ${filePath}`);
  }
}

console.log("Starting contrast fix pass...");
walkDir(path.join(process.cwd(), 'src'), processFile);
console.log("Done.");
