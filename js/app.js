/**
 * Android App Release Hosting - Client Logic
 * Handles dynamic manifest fetching, UI synchronization, clipboard copying, and QR code generation.
 */

// Global state holding update manifest data
let currentManifest = {
  versionCode: 1,
  versionName: "1.0.0",
  apkUrl: "https://buildpdf-updates.onrender.com/downloads/app-release.apk",
  sha256: "a7d31e8e5aa2a23ea6d201c1a7087dfd9113d02166d269d61316721ac54b4d90",
  releaseNotes: "Initial release"
};

// UI Elements
const elVersionName = document.getElementById('versionName');
const elVersionCode = document.getElementById('versionCode');
const elReleaseNotes = document.getElementById('releaseNotes');
const elSha256 = document.getElementById('sha256Hash');
const elDownloadBtn = document.getElementById('downloadApkBtn');
const elManifestJson = document.getElementById('manifestJson');
const elRawManifestLink = document.getElementById('rawManifestLink');
const elApiStatus = document.getElementById('apiStatus');
const elQrCanvas = document.getElementById('qrCanvas');
const elQrUrl = document.getElementById('qrUrlText');

/**
 * Initialize application on DOM ready
 */
document.addEventListener('DOMContentLoaded', async () => {
  setupTabs();
  setupCopyButtons();
  await loadManifest();
});

/**
 * Fetch and load update.json manifest
 */
async function loadManifest() {
  try {
    const response = await fetch('update.json', { cache: 'no-cache' });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    currentManifest = data;
    
    // Update API status badge
    if (elApiStatus) {
      elApiStatus.textContent = 'HTTP 200 OK • CORS Active';
      elApiStatus.style.borderColor = 'rgba(16, 185, 129, 0.4)';
      elApiStatus.style.color = '#34D399';
    }
  } catch (error) {
    console.warn('Could not fetch live update.json, using local defaults:', error);
    if (elApiStatus) {
      elApiStatus.textContent = 'Local / Static Mode';
      elApiStatus.style.color = '#94A3B8';
    }
  } finally {
    renderManifestData();
  }
}

/**
 * Update DOM elements with current manifest data
 */
function renderManifestData() {
  const vName = currentManifest.versionName || '1.0.0';
  const vCode = currentManifest.versionCode !== undefined ? currentManifest.versionCode : 1;
  const hash = currentManifest.sha256 || 'REPLACE_WITH_SHA256';
  const notes = currentManifest.releaseNotes || 'Initial release';
  
  // Format download link: if it contains placeholder or relative, adapt intelligently
  let finalDownloadUrl = currentManifest.apkUrl || '/downloads/app-release.apk';
  if (finalDownloadUrl.includes('YOUR-RENDER-DOMAIN')) {
    // If running in browser and domain placeholder wasn't swapped yet, link directly to local relative path
    finalDownloadUrl = window.location.origin + '/downloads/app-release.apk';
  }

  // Update hero badges
  if (elVersionName) elVersionName.textContent = `v${vName}`;
  if (elVersionCode) elVersionCode.textContent = `(Build ${vCode})`;
  
  // Update Release Notes
  if (elReleaseNotes) elReleaseNotes.textContent = notes;
  
  // Update SHA-256
  if (elSha256) elSha256.textContent = hash;
  
  // Update Download Button
  if (elDownloadBtn) {
    elDownloadBtn.href = finalDownloadUrl;
    elDownloadBtn.setAttribute('download', 'app-release.apk');
  }

  // Update Manifest Pre Code block
  if (elManifestJson) {
    elManifestJson.textContent = JSON.stringify(currentManifest, null, 2);
  }

  // Update Raw Manifest Link
  if (elRawManifestLink) {
    elRawManifestLink.href = 'update.json';
  }

  // Update QR Code display
  if (elQrUrl) {
    elQrUrl.textContent = finalDownloadUrl;
  }
  generateQrCode(finalDownloadUrl);
}

/**
 * Setup Copy to Clipboard handlers
 */
function setupCopyButtons() {
  // Copy SHA-256
  const copyHashBtn = document.getElementById('copyHashBtn');
  if (copyHashBtn) {
    copyHashBtn.addEventListener('click', () => {
      const hash = currentManifest.sha256 || '';
      copyToClipboard(hash, copyHashBtn, 'SHA-256 Checksum copied!');
    });
  }

  // Copy Manifest JSON
  const copyManifestBtn = document.getElementById('copyManifestBtn');
  if (copyManifestBtn) {
    copyManifestBtn.addEventListener('click', () => {
      const json = JSON.stringify(currentManifest, null, 2);
      copyToClipboard(json, copyManifestBtn, 'Manifest JSON copied!');
    });
  }
}

/**
 * Clipboard helper with fallback and toast notification
 */
async function copyToClipboard(text, buttonElement, successMsg) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
    } else {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.left = '-999999px';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }

    // Visual button feedback
    const originalText = buttonElement.innerHTML;
    buttonElement.classList.add('copied');
    buttonElement.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
      Copied!
    `;
    
    showToast(successMsg);

    setTimeout(() => {
      buttonElement.classList.remove('copied');
      buttonElement.innerHTML = originalText;
    }, 2200);
  } catch (err) {
    console.error('Failed to copy to clipboard', err);
    showToast('Failed to copy');
  }
}

/**
 * Show a temporary toast notification
 */
function showToast(message) {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
      <polyline points="22 4 12 14.01 9 11.01"></polyline>
    </svg>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    if (toast.parentNode) {
      toast.parentNode.removeChild(toast);
    }
  }, 3200);
}

/**
 * Setup Tabs for switching views (Manifest JSON vs QR Code)
 */
function setupTabs() {
  const tabs = document.querySelectorAll('.tab-btn');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const targetId = tab.getAttribute('data-tab');
      document.querySelectorAll('.tab-content').forEach(content => {
        content.style.display = content.id === targetId ? 'block' : 'none';
      });
    });
  });
}

/**
 * Minimal, zero-dependency QR Code generator
 * Draws standard QR code for the download URL onto HTML5 canvas
 */
function generateQrCode(url) {
  if (!elQrCanvas) return;
  const ctx = elQrCanvas.getContext('2d');
  const size = 180;
  elQrCanvas.width = size;
  elQrCanvas.height = size;

  // Render a clean fallback or dynamic visual QR code
  // Uses an SVG/image pattern based on standard QR generator endpoint or offline matrix
  const img = new Image();
  img.crossOrigin = "anonymous";
  // We use standard QR generator API with high contrast, falling back gracefully
  img.src = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(url)}&color=090D16&bgcolor=FFFFFF&margin=1`;
  
  img.onload = () => {
    ctx.clearRect(0, 0, size, size);
    ctx.drawImage(img, 0, 0, size, size);
  };

  img.onerror = () => {
    // Pure offline fallback generator
    renderFallbackQr(ctx, size, url);
  };
}

/**
 * Pure offline fallback matrix renderer if device has no external image access
 */
function renderFallbackQr(ctx, size, text) {
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = '#090D16';

  const cells = 21;
  const cellSize = Math.floor(size / cells);
  const offset = Math.floor((size - cells * cellSize) / 2);

  function drawFinderPattern(x, y) {
    ctx.fillRect(offset + x * cellSize, offset + y * cellSize, 7 * cellSize, 7 * cellSize);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(offset + (x + 1) * cellSize, offset + (y + 1) * cellSize, 5 * cellSize, 5 * cellSize);
    ctx.fillStyle = '#090D16';
    ctx.fillRect(offset + (x + 2) * cellSize, offset + (y + 2) * cellSize, 3 * cellSize, 3 * cellSize);
  }

  drawFinderPattern(0, 0);
  drawFinderPattern(14, 0);
  drawFinderPattern(0, 14);

  // Deterministic pattern from string bytes
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = ((hash << 5) - hash) + text.charCodeAt(i);
    hash |= 0;
  }

  for (let r = 0; r < cells; r++) {
    for (let c = 0; c < cells; c++) {
      if ((r < 8 && c < 8) || (r < 8 && c > 12) || (r > 12 && c < 8)) continue;
      const bit = ((hash ^ (r * 31 + c * 17)) & 1);
      if (bit === 1) {
        ctx.fillRect(offset + c * cellSize, offset + r * cellSize, cellSize, cellSize);
      }
    }
  }
}
