// ============================================================
// ContentIQ — Main Application Router
// ============================================================
import './style.css';
import { renderDashboard } from './modules/Dashboard.js';
import { renderVideoIntelligence, initVideoIntelligence } from './modules/VideoIntelligence.js';
import { renderTrendScript, initTrendScript } from './modules/TrendScript.js';
import { renderDistribution, initDistribution } from './modules/Distribution.js';
import { renderPrivacy, initPrivacy } from './modules/Privacy.js';
import { renderVoiceTracker, initVoiceTracker } from './modules/VoiceTracker.js';
import { renderDubbing, initDubbing } from './modules/Dubbing.js';
import { renderThumbnail, initThumbnail } from './modules/Thumbnail.js';
import { renderBGM, initBGM } from './modules/BGM.js';
import { hasGeminiKey, hasElevenLabsKey } from './services/api.js';

// --- Navigation Config ---
const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊', section: 'Overview' },
  { id: 'video-intelligence', label: 'Video Intelligence', icon: '🎬', section: 'Analysis', badge: 'AI' },
  { id: 'trend-script', label: 'Script Generator', icon: '✍️', section: 'Analysis' },
  { id: 'distribution', label: 'Distribution', icon: '📱', section: 'Distribution' },
  { id: 'privacy', label: 'Privacy Filter', icon: '🔒', section: 'Distribution' },
  { id: 'voice-tracker', label: 'Voice Tracker', icon: '🎤', section: 'Creator Tools' },
  { id: 'dubbing', label: 'Multilingual Dubbing', icon: '🌐', section: 'Creator Tools', badge: '11Labs' },
  { id: 'thumbnail', label: 'Thumbnail Analyzer', icon: '🖼️', section: 'Creator Tools' },
  { id: 'bgm', label: 'BGM Suggester', icon: '🎵', section: 'Creator Tools', badge: '11Labs' },
  { id: 'settings', label: 'Settings', icon: '⚙️', section: 'System' },
];

let currentRoute = 'dashboard';

// --- Build Sidebar Navigation ---
function buildSidebar() {
  const nav = document.getElementById('sidebar-nav');
  if (!nav) return;

  let html = '';
  let lastSection = '';

  for (const item of NAV_ITEMS) {
    if (item.section !== lastSection) {
      html += `<div class="nav-section-label">${item.section}</div>`;
      lastSection = item.section;
    }
    html += `
      <div class="nav-item ${item.id === currentRoute ? 'active' : ''}" data-route="${item.id}">
        <span class="nav-icon">${item.icon}</span>
        <span>${item.label}</span>
        ${item.badge ? `<span class="nav-badge">${item.badge}</span>` : ''}
      </div>`;
  }

  nav.innerHTML = html;

  // Bind click events
  nav.querySelectorAll('.nav-item').forEach(el => {
    el.addEventListener('click', () => {
      const route = el.dataset.route;
      navigateTo(route);
    });
  });
}

// --- Router ---
function navigateTo(route) {
  currentRoute = route;
  const main = document.getElementById('main-content');
  if (!main) return;

  // Update active nav
  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.route === route);
  });

  // Render page
  switch (route) {
    case 'dashboard':
      main.innerHTML = renderDashboard();
      break;
    case 'video-intelligence':
      main.innerHTML = renderVideoIntelligence();
      setTimeout(initVideoIntelligence, 0);
      break;
    case 'trend-script':
      main.innerHTML = renderTrendScript();
      setTimeout(initTrendScript, 0);
      break;
    case 'distribution':
      main.innerHTML = renderDistribution();
      setTimeout(initDistribution, 0);
      break;
    case 'privacy':
      main.innerHTML = renderPrivacy();
      setTimeout(initPrivacy, 0);
      break;
    case 'voice-tracker':
      main.innerHTML = renderVoiceTracker();
      setTimeout(initVoiceTracker, 0);
      break;
    case 'dubbing':
      main.innerHTML = renderDubbing();
      setTimeout(initDubbing, 0);
      break;
    case 'thumbnail':
      main.innerHTML = renderThumbnail();
      setTimeout(initThumbnail, 0);
      break;
    case 'bgm':
      main.innerHTML = renderBGM();
      setTimeout(initBGM, 0);
      break;
    case 'settings':
      main.innerHTML = renderSettings();
      setTimeout(initSettings, 0);
      break;
    default:
      main.innerHTML = renderDashboard();
  }

  // Scroll main to top
  main.scrollTop = 0;
}

// Make navigateTo global for dashboard cards
window.navigateTo = navigateTo;

// --- Settings Page ---
function renderSettings() {
  return `
  <div class="page-enter">
    <div class="page-header">
      <h1>⚙️ Settings</h1>
      <p>Configure API keys and preferences</p>
    </div>

    <div class="glass-card-static mb-lg" style="max-width:600px;">
      <div class="section-title"><span class="section-icon">🔑</span> API Configuration</div>

      <div class="settings-row">
        <label>Gemini API Key</label>
        <input type="password" class="form-input" id="settings-gemini-key" placeholder="Enter your Gemini API key..." value="${localStorage.getItem('GEMINI_API_KEY') || ''}">
        <span style="font-size:0.72rem;color:var(--text-muted);">Required for all AI analysis features. Get one at <a href="https://aistudio.google.com/apikey" target="_blank" style="color:var(--purple-light);">AI Studio</a></span>
      </div>

      <div class="settings-row">
        <label>ElevenLabs API Key</label>
        <input type="password" class="form-input" id="settings-elevenlabs-key" placeholder="Enter your ElevenLabs API key..." value="${localStorage.getItem('ELEVENLABS_API_KEY') || ''}">
        <span style="font-size:0.72rem;color:var(--text-muted);">Required for voice dubbing and BGM generation. Get one at <a href="https://elevenlabs.io/app/settings/api-keys" target="_blank" style="color:var(--purple-light);">ElevenLabs</a></span>
      </div>

      <button class="btn btn-primary" id="settings-save-btn">💾 Save API Keys</button>
    </div>

    <div class="glass-card-static" style="max-width:600px;">
      <div class="section-title"><span class="section-icon">ℹ️</span> About ContentIQ</div>
      <p style="font-size:0.85rem;color:var(--text-secondary);line-height:1.7;">
        ContentIQ is an AI-Powered Content Intelligence Platform built for video creators.
        It uses <strong>Gemini 1.5 Pro</strong> for analysis and generation, and <strong>ElevenLabs</strong>
        for voice dubbing and music generation.
      </p>
      <div class="flex gap-md mt-md">
        <span class="tag tag-purple">v1.0.0</span>
        <span class="tag ${hasGeminiKey() ? 'tag-success' : 'tag-warning'}">Gemini: ${hasGeminiKey() ? 'Connected' : 'Not Set'}</span>
        <span class="tag ${hasElevenLabsKey() ? 'tag-success' : 'tag-warning'}">ElevenLabs: ${hasElevenLabsKey() ? 'Connected' : 'Not Set'}</span>
      </div>
    </div>
  </div>`;
}

function initSettings() {
  const saveBtn = document.getElementById('settings-save-btn');
  if (!saveBtn) return;

  saveBtn.addEventListener('click', () => {
    const geminiKey = document.getElementById('settings-gemini-key').value.trim();
    const elevenLabsKey = document.getElementById('settings-elevenlabs-key').value.trim();

    if (geminiKey) localStorage.setItem('GEMINI_API_KEY', geminiKey);
    else localStorage.removeItem('GEMINI_API_KEY');

    if (elevenLabsKey) localStorage.setItem('ELEVENLABS_API_KEY', elevenLabsKey);
    else localStorage.removeItem('ELEVENLABS_API_KEY');

    updateApiStatus();
    showToast('API keys saved successfully!', 'success');

    // Re-render settings to update status tags
    navigateTo('settings');
  });
}

// --- API Status Indicator ---
function updateApiStatus() {
  const dot = document.getElementById('apiStatusDot');
  const text = document.getElementById('apiStatusText');
  if (!dot || !text) return;

  const gemini = hasGeminiKey();
  const eleven = hasElevenLabsKey();

  if (gemini && eleven) {
    dot.className = 'api-status-dot connected';
    text.textContent = 'All APIs Connected';
  } else if (gemini || eleven) {
    dot.className = 'api-status-dot';
    dot.style.background = 'var(--warning)';
    dot.style.boxShadow = '0 0 8px var(--warning)';
    text.textContent = gemini ? 'Gemini OK · No ElevenLabs' : 'ElevenLabs OK · No Gemini';
  } else {
    dot.className = 'api-status-dot';
    text.textContent = 'API Keys Required';
  }
}

// --- Toast System ---
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || icons.info}</span>
    <span class="toast-message">${message}</span>
  `;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('toast-exit');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

window.showToast = showToast;

// --- Init ---
function init() {
  buildSidebar();
  navigateTo('dashboard');
  updateApiStatus();
}

document.addEventListener('DOMContentLoaded', init);
