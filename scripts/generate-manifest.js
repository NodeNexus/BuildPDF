#!/usr/bin/env node

/**
 * Manifest Generator & SHA-256 Checksum Calculator
 * 
 * Usage:
 *   node scripts/generate-manifest.js
 *   node scripts/generate-manifest.js --versionCode 2 --versionName 1.1.0 --notes "Performance fixes"
 *   node scripts/generate-manifest.js --domain https://my-app.onrender.com
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT_DIR = path.resolve(__dirname, '..');
const MANIFEST_PATH = path.join(ROOT_DIR, 'update.json');
const DEFAULT_APK_PATH = path.join(ROOT_DIR, 'downloads', 'app-release.apk');

// Parse CLI arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const parsed = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].substring(2);
      const next = args[i + 1];
      if (next && !next.startsWith('--')) {
        parsed[key] = next;
        i++;
      } else {
        parsed[key] = true;
      }
    }
  }
  return parsed;
}

// Compute SHA-256 hash of a file
function computeSha256(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`APK file not found at: ${filePath}\nPlease place your APK in downloads/app-release.apk first.`);
  }
  const fileBuffer = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(fileBuffer).digest('hex');
}

// Get file size in human-readable format
function getFileSize(filePath) {
  if (!fs.existsSync(filePath)) return 'Unknown';
  const stats = fs.statSync(filePath);
  const bytes = stats.size;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function main() {
  console.log('\n======================================================');
  console.log('  Android Update Manifest & SHA-256 Hash Tool');
  console.log('======================================================\n');

  const args = parseArgs();
  const apkPath = args.apk ? path.resolve(ROOT_DIR, args.apk) : DEFAULT_APK_PATH;

  // Load existing manifest or use template
  let manifest = {
    versionCode: 1,
    versionName: "1.0.0",
    apkUrl: "https://YOUR-RENDER-DOMAIN/downloads/app-release.apk",
    sha256: "REPLACE_WITH_SHA256",
    releaseNotes: "Initial release"
  };

  if (fs.existsSync(MANIFEST_PATH)) {
    try {
      manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'));
    } catch (err) {
      console.warn('⚠️ Warning: Could not parse existing update.json, using defaults.');
    }
  }

  // Calculate SHA-256
  console.log(`🔍 Inspecting APK: ${path.relative(ROOT_DIR, apkPath)}`);
  let sha256;
  try {
    sha256 = computeSha256(apkPath);
    console.log(`📦 File Size:      ${getFileSize(apkPath)}`);
    console.log(`🔐 SHA-256 Hash:   ${sha256}`);
  } catch (err) {
    console.error(`❌ Error: ${err.message}`);
    process.exit(1);
  }

  // Update fields if provided via arguments
  if (args.versionCode) {
    manifest.versionCode = parseInt(args.versionCode, 10);
  }
  if (args.versionName) {
    manifest.versionName = String(args.versionName);
  }
  if (args.notes) {
    manifest.releaseNotes = String(args.notes);
  }
  if (args.domain) {
    const cleanDomain = args.domain.replace(/\/+$/, '');
    const apkFileName = path.basename(apkPath);
    manifest.apkUrl = `${cleanDomain}/downloads/${apkFileName}`;
  }

  manifest.sha256 = sha256;

  // Save updated manifest
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + '\n', 'utf-8');

  console.log('\n✅ update.json successfully updated!');
  console.log('------------------------------------------------------');
  console.log(JSON.stringify(manifest, null, 2));
  console.log('------------------------------------------------------\n');
  console.log('Next steps:');
  console.log('1. Review update.json');
  console.log('2. Commit and push to Git: git commit -am "Update release" && git push');
  console.log('3. Render will deploy automatically!\n');
}

main();
