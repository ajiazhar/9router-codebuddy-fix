#!/usr/bin/env node

/**
 * 9Router CodeBuddy Fix Patch
 * Automatically patches 9router's CodeBuddy executor to include official IDE verification headers.
 * Resolves Error 11128 ("channel verification failed / request illegal").
 * 
 * Works on Linux (VPS), macOS, and Windows.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('=== 9Router CodeBuddy Fix Patcher ===\n');

// 1. Detect 9router installation path
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
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  } catch (e) {}

  // Fallbacks for Linux / macOS / Windows common locations
  const fallbacks = [
    '/usr/lib/node_modules/9router',
    '/usr/local/lib/node_modules/9router',
    path.join(process.env.HOME || '', '.nvm/versions/node', process.version, 'lib/node_modules/9router'),
    path.join(process.env.APPDATA || '', 'npm/node_modules/9router')
  ];

  for (const f of fallbacks) {
    if (fs.existsSync(f)) {
      return f;
    }
  }

  return null;
}

const ninerouterDir = get9RouterPath();
if (!ninerouterDir) {
  console.error('[!] Error: 9router installation not found.');
  console.error('    Please specify the path manually: node patch.js /path/to/9router');
  process.exit(1);
}

console.log(`[+] Found 9router at: ${ninerouterDir}`);

const chunksDir = path.join(ninerouterDir, 'app', '.next-cli-build', 'server', 'chunks');
if (!fs.existsSync(chunksDir)) {
  console.error(`[!] Error: Chunks directory not found at: ${chunksDir}`);
  process.exit(1);
}

// 2. Find target chunk file containing codebuddy-intl
console.log('[*] Scanning chunks for CodeBuddy executor...');
const chunkFiles = fs.readdirSync(chunksDir).filter(f => f.endsWith('.js') && !f.endsWith('.bak'));

let targetFile = null;
let fileContent = '';

for (const file of chunkFiles) {
  const filePath = path.join(chunksDir, file);
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    if (content.includes('super("codebuddy-intl")')) {
      targetFile = filePath;
      fileContent = content;
      break;
    }
  } catch (e) {}
}

if (!targetFile) {
  console.error('[!] Error: Could not find chunk containing CodeBuddy executor.');
  process.exit(1);
}

console.log(`[+] Found target chunk: ${path.basename(targetFile)}`);

// Check if already patched
if (fileContent.includes('X-Conversation-Request-ID') && fileContent.includes('x-codebuddy-request')) {
  console.log('[*] Chunk is already patched with CodeBuddy headers.');
  console.log('[+] No changes needed.');
  process.exit(0);
}

// 3. Backup original file
const backupFile = `${targetFile}.bak`;
if (!fs.existsSync(backupFile)) {
  fs.copyFileSync(targetFile, backupFile);
  console.log(`[+] Created backup: ${path.basename(backupFile)}`);
} else {
  console.log(`[*] Existing backup found: ${path.basename(backupFile)}`);
}

// 4. Inject buildHeaders method
const buildHeadersCode = `buildHeaders(a,b=!0,c,d,f){let h=super.buildHeaders(a,b,c,d,f);let u=()=>{try{if(globalThis.crypto?.randomUUID)return globalThis.crypto.randomUUID().replace(/-/g,"")}catch(e){}let s="";for(let i=0;i<32;i++)s+=Math.floor(Math.random()*16).toString(16);return s};let m=u(),t=u(),s=t.slice(0,16),p=t.slice(16,32);h["Accept"]="application/json, text/plain, */*";h["X-Requested-With"]="XMLHttpRequest";h["X-Request-ID"]=m;h["X-Conversation-ID"]=m;h["X-Conversation-Request-ID"]=m;h["X-Conversation-Message-ID"]=m;h["X-Request-Trace-Id"]=t;h["b3"]=t+"-"+s+"-1-"+p;h["X-B3-TraceId"]=t;h["X-B3-ParentSpanId"]=p;h["X-B3-SpanId"]=s;h["X-B3-Sampled"]="1";h["X-Agent-Intent"]="craft";h["X-Domain"]="www.codebuddy.ai";h["X-IDE-Type"]="VSCode";h["X-IDE-Name"]="VSCode";h["X-IDE-Version"]="1.139.0";h["X-Product-Version"]="4.12.0";h["X-Product"]="SaaS";h["X-Env-ID"]="production";h["User-Agent"]="VSCode/1.139.0 CodeBuddy/4.12.0";h["x-codebuddy-request"]="1";if(a?.apiKey)h["X-API-Key"]=a.apiKey;if(a?.accessToken)h["Authorization"]=\`Bearer \${a.accessToken}\`;return h}`;

let patchedContent = fileContent;

// Patch codebuddy-intl
const intlTarget = 'class e extends d.L{constructor(){super("codebuddy-intl")}';
if (patchedContent.includes(intlTarget)) {
  patchedContent = patchedContent.replace(intlTarget, `${intlTarget}${buildHeadersCode}`);
  console.log('[+] Injected verification headers for codebuddy-intl.');
} else {
  console.warn('[-] Warning: Target signature for codebuddy-intl not found directly. Attempting regex...');
  const intlRegex = /class\s+([A-Za-z0-9_]+)\s+extends\s+([A-Za-z0-9_$.]+)\{constructor\(\)\{super\("codebuddy-intl"\)\}/;
  if (intlRegex.test(patchedContent)) {
    patchedContent = patchedContent.replace(intlRegex, (match) => `${match}${buildHeadersCode}`);
    console.log('[+] Injected headers for codebuddy-intl via regex.');
  } else {
    console.error('[!] Failed to patch codebuddy-intl');
  }
}

// Patch codebuddy-cn
const cnTarget = 'class e extends d.L{constructor(){super("codebuddy-cn")}';
if (patchedContent.includes(cnTarget)) {
  patchedContent = patchedContent.replace(cnTarget, `${cnTarget}${buildHeadersCode}`);
  console.log('[+] Injected verification headers for codebuddy-cn.');
} else {
  const cnRegex = /class\s+([A-Za-z0-9_]+)\s+extends\s+([A-Za-z0-9_$.]+)\{constructor\(\)\{super\("codebuddy-cn"\)\}/;
  if (cnRegex.test(patchedContent)) {
    patchedContent = patchedContent.replace(cnRegex, (match) => `${match}${buildHeadersCode}`);
    console.log('[+] Injected headers for codebuddy-cn via regex.');
  }
}

// 5. Write patched content
fs.writeFileSync(targetFile, patchedContent, 'utf8');

// 6. Verify syntax
try {
  execSync(`node -c "${targetFile}"`);
  console.log('[+] Syntax verification passed.');
} catch (e) {
  console.error('[!] Syntax verification failed! Restoring backup...');
  fs.copyFileSync(backupFile, targetFile);
  process.exit(1);
}

// 7. Clear SQLite model locks if db exists
function clearDatabaseLocks() {
  const dbPaths = [
    path.join(process.env.HOME || '', '.9router', 'db', 'data.sqlite'),
    path.join(process.env.APPDATA || '', '9router', 'db', 'data.sqlite')
  ];

  for (const dbPath of dbPaths) {
    if (fs.existsSync(dbPath)) {
      try {
        // Run sqlite3 if available
        execSync(`sqlite3 "${dbPath}" "UPDATE providerConnections SET data = json_set(data, '$.modelLocks', json('{}')) WHERE provider LIKE 'codebuddy%';"`, { stdio: 'ignore' });
        console.log(`[+] Cleared modelLocks in database: ${dbPath}`);
      } catch (e) {
        // Ignore if sqlite3 cli not installed
      }
    }
  }
}

clearDatabaseLocks();

console.log('\n[✔] Patch applied successfully!');
console.log('[*] IMPORTANT: Please restart 9router for changes to take effect:');
console.log('    - If running via PM2:      pm2 restart 9router');
console.log('    - If running via systemd:  sudo systemctl restart 9router');
console.log('    - If running manually:     Stop and re-run "9router"');
