#!/usr/bin/env node

/**
 * 9Router CodeBuddy Fix Restore
 * Restores 9router to its original unpatched state from the .bak file.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('=== 9Router CodeBuddy Restore ===\n');

function get9RouterPath() {
  if (process.env.NINEROUTER_PATH && fs.existsSync(process.env.NINEROUTER_PATH)) {
    return process.env.NINEROUTER_PATH;
  }
  if (process.argv[2] && fs.existsSync(process.argv[2])) {
    return process.argv[2];
  }
  try {
    const globalRoot = execSync('npm root -g', { encoding: 'utf8' }).trim();
    const candidate = path.join(globalRoot, '9router');
    if (fs.existsSync(candidate)) return candidate;
  } catch (e) {}

  const fallbacks = [
    '/usr/lib/node_modules/9router',
    '/usr/local/lib/node_modules/9router',
    path.join(process.env.HOME || '', '.nvm/versions/node', process.version, 'lib/node_modules/9router'),
    path.join(process.env.APPDATA || '', 'npm/node_modules/9router')
  ];

  for (const f of fallbacks) {
    if (fs.existsSync(f)) return f;
  }
  return null;
}

const ninerouterDir = get9RouterPath();
if (!ninerouterDir) {
  console.error('[!] Error: 9router installation not found.');
  process.exit(1);
}

const chunksDir = path.join(ninerouterDir, 'app', '.next-cli-build', 'server', 'chunks');
if (!fs.existsSync(chunksDir)) {
  console.error(`[!] Error: Chunks directory not found at: ${chunksDir}`);
  process.exit(1);
}

const bakFiles = fs.readdirSync(chunksDir).filter(f => f.endsWith('.bak'));
if (bakFiles.length === 0) {
  console.log('[*] No .bak backup files found. 9router is already in its original state.');
  process.exit(0);
}

for (const bak of bakFiles) {
  const originalFile = path.join(chunksDir, bak.replace(/\.bak$/, ''));
  const backupFile = path.join(chunksDir, bak);
  fs.copyFileSync(backupFile, originalFile);
  fs.unlinkSync(backupFile);
  console.log(`[+] Restored: ${path.basename(originalFile)} from backup.`);
}

console.log('\n[✔] Restore completed successfully! Please restart 9router.');
