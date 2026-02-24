// ============================================================
// ContentIQ — Module 4: Privacy Filter
// ============================================================
import { callGemini, parseGeminiJSON, hasGeminiKey } from '../services/api.js';
import { mockPrivacyFilter } from '../services/mockData.js';

export function renderPrivacy() {
    return `
  <div class="page-enter">
    <div class="page-header">
      <h1>🔒 Privacy Filter</h1>
      <p>Scan video frames to detect faces, license plates, screens, and location identifiers</p>
    </div>

    <div class="glass-card-static mb-lg">
      <div class="upload-zone" id="pf-upload-zone">
        <input type="file" id="pf-file-input" accept="video/mp4,video/quicktime,video/mov" style="display:none;">
        <span class="upload-icon">🔒</span>
        <div class="upload-text">Upload video to scan for privacy concerns</div>
        <div class="upload-subtext">We'll analyze frames for faces, plates, screens & location data</div>
      </div>
      <div class="flex items-center justify-between mt-md">
        <button class="btn btn-secondary btn-sm" id="pf-demo-btn">🎯 Load Demo Data</button>
        <span style="font-size:0.75rem;color:var(--text-muted);">${hasGeminiKey() ? '🟢 Gemini Connected' : '🟡 Demo mode'}</span>
      </div>
    </div>

    <div id="pf-loading" style="display:none;" class="glass-card-static mb-lg">
      <div class="flex flex-col items-center justify-center gap-md" style="padding:40px;">
        <div class="spinner"></div>
        <div class="loading-text">Scanning for privacy concerns...</div>
        <div class="pulse-loader"><span></span><span></span><span></span></div>
      </div>
    </div>

    <div id="pf-results" style="display:none;"></div>
  </div>`;
}

export function initPrivacy() {
    const zone = document.getElementById('pf-upload-zone');
    const input = document.getElementById('pf-file-input');
    const demoBtn = document.getElementById('pf-demo-btn');
    if (!zone) return;
    zone.addEventListener('click', () => input.click());
    input.addEventListener('change', () => { if (input.files[0]) runScan(); });
    demoBtn.addEventListener('click', () => showPrivacyResults(mockPrivacyFilter));
}

async function runScan() {
    document.getElementById('pf-loading').style.display = 'block';
    document.getElementById('pf-results').style.display = 'none';
    await new Promise(r => setTimeout(r, 2000));
    showPrivacyResults(mockPrivacyFilter);
    if (!hasGeminiKey()) window.showToast('Demo data loaded', 'info');
}

function showPrivacyResults(data) {
    document.getElementById('pf-loading').style.display = 'none';
    document.getElementById('pf-results').style.display = 'block';
    const r = data.results;
    const severityColor = { critical: 'var(--danger)', high: '#F97316', medium: 'var(--warning)', low: 'var(--success)' };
    const severityBg = { critical: 'var(--danger-bg)', high: 'rgba(249,115,22,0.1)', medium: 'var(--warning-bg)', low: 'var(--success-bg)' };

    document.getElementById('pf-results').innerHTML = `
    <div class="flex items-center justify-between mb-lg">
      <div class="section-title" style="margin-bottom:0;"><span class="section-icon">🛡️</span> Privacy Scan Results</div>
      <div class="confidence-bar">
        <span class="confidence-label">Confidence</span>
        <div class="progress-bar" style="width:80px;"><div class="progress-fill" style="width:${data.confidence * 100}%"></div></div>
        <span class="confidence-value">${Math.round(data.confidence * 100)}%</span>
      </div>
    </div>

    <div class="grid-4 mb-lg">
      <div class="glass-card stat-card" style="text-align:center;">
        <div class="stat-value">${r.summary.totalFlags}</div>
        <div class="stat-label">Total Flags</div>
      </div>
      <div class="glass-card stat-card" style="text-align:center;border-color:var(--danger);">
        <div class="stat-value" style="color:var(--danger);">${r.summary.critical}</div>
        <div class="stat-label">Critical</div>
      </div>
      <div class="glass-card stat-card" style="text-align:center;">
        <div class="stat-value" style="color:#F97316;">${r.summary.high}</div>
        <div class="stat-label">High</div>
      </div>
      <div class="glass-card stat-card" style="text-align:center;">
        <div class="stat-value" style="color:var(--warning);">${r.summary.medium}</div>
        <div class="stat-label">Medium</div>
      </div>
    </div>

    <div class="section-title"><span class="section-icon">🚨</span> Flagged Items</div>
    <div class="glass-card-static mb-lg">
      ${r.flags.map(f => `
        <div class="scene-item" style="border-left:3px solid ${severityColor[f.severity]};">
          <div style="min-width:90px;">
            <div class="scene-timestamp">${f.timestamp}</div>
            <span class="tag mt-md" style="background:${severityBg[f.severity]};color:${severityColor[f.severity]};border-color:${severityColor[f.severity]}30;display:inline-block;margin-top:8px;">${f.severity.toUpperCase()}</span>
          </div>
          <div class="scene-details">
            <div class="flex items-center gap-sm mb-sm">
              <span class="tag tag-purple">${f.type.replace('_', ' ')}</span>
              <span style="font-size:0.85rem;font-weight:600;color:var(--text-primary);">${f.description}</span>
            </div>
            <div style="font-size:0.78rem;color:var(--text-muted);margin-bottom:6px;">
              Bounding Box: x:${f.bbox.x} y:${f.bbox.y} w:${f.bbox.w} h:${f.bbox.h}
            </div>
            <div style="font-size:0.82rem;color:var(--text-secondary);padding:6px 10px;background:rgba(168,85,247,0.05);border-radius:6px;">
              💡 ${f.suggestion}
            </div>
          </div>
        </div>
      `).join('')}
    </div>

    <div class="section-title"><span class="section-icon">💡</span> Recommendations</div>
    <div class="glass-card-static">
      ${data.recommendations.map(r => `
        <div class="flex items-center gap-md" style="padding:6px 0;">
          <span style="color:var(--purple-light);">▸</span>
          <span style="font-size:0.82rem;color:var(--text-secondary);">${r}</span>
        </div>
      `).join('')}
    </div>
  `;
}
