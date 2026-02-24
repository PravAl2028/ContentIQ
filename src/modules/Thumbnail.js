// ============================================================
// ContentIQ — Module 7: Thumbnail & Color Analyzer
// ============================================================
import { callGemini, parseGeminiJSON, hasGeminiKey, fileToBase64 } from '../services/api.js';
import { mockThumbnailAnalysis } from '../services/mockData.js';

export function renderThumbnail() {
    return `
  <div class="page-enter">
    <div class="page-header">
      <h1>🖼️ Thumbnail & Color Analyzer</h1>
      <p>Analyze contrast, color psychology, text readability, and get LUT suggestions</p>
    </div>

    <div class="glass-card-static mb-lg">
      <div class="upload-zone" id="th-upload-zone">
        <input type="file" id="th-file-input" accept="image/*" style="display:none;">
        <span class="upload-icon">🖼️</span>
        <div class="upload-text">Drop a thumbnail image or click to upload</div>
        <div class="upload-subtext">JPG, PNG, WebP supported</div>
      </div>
      <div class="flex items-center justify-between mt-md">
        <button class="btn btn-secondary btn-sm" id="th-demo-btn">🎯 Load Demo Analysis</button>
        <span style="font-size:0.75rem;color:var(--text-muted);">${hasGeminiKey() ? '🟢 Gemini Connected' : '🟡 Demo mode'}</span>
      </div>
    </div>

    <div id="th-loading" style="display:none;" class="glass-card-static mb-lg">
      <div class="flex flex-col items-center justify-center gap-md" style="padding:40px;">
        <div class="spinner"></div>
        <div class="loading-text">Analyzing thumbnail...</div>
        <div class="pulse-loader"><span></span><span></span><span></span></div>
      </div>
    </div>

    <div id="th-preview" style="display:none;" class="mb-lg"></div>
    <div id="th-results" style="display:none;"></div>
  </div>`;
}

export function initThumbnail() {
    const zone = document.getElementById('th-upload-zone');
    const input = document.getElementById('th-file-input');
    const demoBtn = document.getElementById('th-demo-btn');
    if (!zone) return;
    zone.addEventListener('click', () => input.click());
    zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('drag-over'); });
    zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
    zone.addEventListener('drop', (e) => { e.preventDefault(); zone.classList.remove('drag-over'); if (e.dataTransfer.files[0]) analyzeImage(e.dataTransfer.files[0]); });
    input.addEventListener('change', () => { if (input.files[0]) analyzeImage(input.files[0]); });
    demoBtn.addEventListener('click', () => showThumbnailResults(mockThumbnailAnalysis));
}

async function analyzeImage(file) {
    // Show preview
    const previewEl = document.getElementById('th-preview');
    previewEl.style.display = 'block';
    const url = URL.createObjectURL(file);
    previewEl.innerHTML = `<div class="glass-card-static" style="text-align:center;"><img src="${url}" style="max-width:100%;max-height:300px;border-radius:12px;"></div>`;

    document.getElementById('th-loading').style.display = 'block';
    document.getElementById('th-results').style.display = 'none';

    try {
        if (!hasGeminiKey()) {
            await new Promise(r => setTimeout(r, 2000));
            showThumbnailResults(mockThumbnailAnalysis);
            window.showToast('Demo data loaded', 'info');
            return;
        }

        const base64 = await fileToBase64(file);

        const prompt = `Analyze this thumbnail image for YouTube CTR optimization. Return JSON:
{
  "ctrScore": 0-100,
  "contrast": { "score": 0-100, "note": "" },
  "colorPsychology": { "dominant": "#hex", "palette": ["#hex"], "mood": "", "note": "" },
  "textReadability": { "score": 0-100, "note": "" },
  "faceExpression": { "detected": true/false, "expression": "", "note": "" },
  "layout": { "score": 0-100, "improvements": [""] },
  "lutSuggestion": { "name": "", "description": "", "adjustments": { "saturation": "", "warmth": "", "contrast": "", "highlights": "", "shadows": "" } }
}
Return ONLY valid JSON.`;

        const response = await callGemini(prompt, [{ type: file.type, base64 }]);
        const parsed = parseGeminiJSON(response);

        if (parsed) {
            showThumbnailResults({ module: "thumbnail_analyzer", status: "success", confidence: 0.93, results: parsed, recommendations: ["Apply suggested LUT for improved engagement"] });
        } else {
            showThumbnailResults(mockThumbnailAnalysis);
        }
    } catch (err) {
        showThumbnailResults(mockThumbnailAnalysis);
        window.showToast('Demo data loaded: ' + err.message, 'warning');
    }
}

function showThumbnailResults(data) {
    document.getElementById('th-loading').style.display = 'none';
    document.getElementById('th-results').style.display = 'block';

    const r = data.results;
    const ctrColor = r.ctrScore >= 80 ? 'var(--success)' : r.ctrScore >= 60 ? 'var(--warning)' : 'var(--danger)';

    document.getElementById('th-results').innerHTML = `
    <div class="grid-4 mb-lg">
      <div class="glass-card stat-card" style="text-align:center;">
        <div style="font-size:0.72rem;color:var(--text-muted);margin-bottom:4px;">CTR Score</div>
        <div style="font-size:1.8rem;font-weight:900;color:${ctrColor};">${r.ctrScore}</div>
      </div>
      <div class="glass-card stat-card" style="text-align:center;">
        <div style="font-size:0.72rem;color:var(--text-muted);margin-bottom:4px;">Contrast</div>
        <div style="font-size:1.8rem;font-weight:900;color:var(--purple-glow);">${r.contrast.score}</div>
      </div>
      <div class="glass-card stat-card" style="text-align:center;">
        <div style="font-size:0.72rem;color:var(--text-muted);margin-bottom:4px;">Text Readability</div>
        <div style="font-size:1.8rem;font-weight:900;color:var(--purple-glow);">${r.textReadability.score}</div>
      </div>
      <div class="glass-card stat-card" style="text-align:center;">
        <div style="font-size:0.72rem;color:var(--text-muted);margin-bottom:4px;">Layout</div>
        <div style="font-size:1.8rem;font-weight:900;color:var(--purple-glow);">${r.layout.score}</div>
      </div>
    </div>

    <div class="grid-2 mb-lg">
      <div class="glass-card-static">
        <div class="section-title"><span class="section-icon">🎨</span> Color Psychology</div>
        <div class="color-palette mb-md">
          ${(r.colorPsychology.palette || []).map(c => `<div class="color-swatch" style="background:${c};" title="${c}"></div>`).join('')}
        </div>
        <div style="font-size:0.82rem;color:var(--text-secondary);margin-bottom:4px;"><strong>Dominant:</strong> ${r.colorPsychology.dominant}</div>
        <div style="font-size:0.82rem;color:var(--text-secondary);margin-bottom:4px;"><strong>Mood:</strong> ${r.colorPsychology.mood}</div>
        <div style="font-size:0.78rem;color:var(--text-tertiary);">${r.colorPsychology.note}</div>
      </div>

      <div class="glass-card-static">
        <div class="section-title"><span class="section-icon">😀</span> Face Expression</div>
        ${r.faceExpression.detected ?
            `<div style="font-size:0.9rem;font-weight:700;color:var(--success);margin-bottom:8px;">✓ Face Detected</div>
          <div style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:4px;"><strong>Expression:</strong> ${r.faceExpression.expression}</div>
          <div style="font-size:0.78rem;color:var(--text-tertiary);">${r.faceExpression.note}</div>` :
            `<div style="font-size:0.9rem;color:var(--text-muted);">No face detected in thumbnail</div>`
        }

        <div class="section-title mt-lg"><span class="section-icon">📐</span> Contrast</div>
        <p style="font-size:0.78rem;color:var(--text-tertiary);">${r.contrast.note}</p>
      </div>
    </div>

    <div class="glass-card-static mb-lg">
      <div class="section-title"><span class="section-icon">🎬</span> LUT / Color Grading Suggestion</div>
      <div class="flex items-center gap-lg">
        <div>
          <div style="font-size:1rem;font-weight:700;color:var(--purple-glow);margin-bottom:8px;">${r.lutSuggestion.name}</div>
          <p style="font-size:0.82rem;color:var(--text-secondary);margin-bottom:12px;">${r.lutSuggestion.description}</p>
          <div class="flex gap-md" style="flex-wrap:wrap;">
            ${Object.entries(r.lutSuggestion.adjustments).map(([k, v]) => `
              <span class="tag tag-purple">${k}: ${v}</span>
            `).join('')}
          </div>
        </div>
      </div>
    </div>

    <div class="glass-card-static mb-lg">
      <div class="section-title"><span class="section-icon">📐</span> Layout Improvements</div>
      ${(r.layout.improvements || []).map(imp => `
        <div class="flex items-center gap-md" style="padding:6px 0;">
          <span style="color:var(--purple-light);">▸</span>
          <span style="font-size:0.82rem;color:var(--text-secondary);">${imp}</span>
        </div>
      `).join('')}
    </div>

    <div class="glass-card-static">
      <div class="section-title"><span class="section-icon">💡</span> Recommendations</div>
      ${data.recommendations.map(r => `
        <div class="flex items-center gap-md" style="padding:6px 0;">
          <span style="color:var(--purple-light);">▸</span>
          <span style="font-size:0.82rem;color:var(--text-secondary);">${r}</span>
        </div>
      `).join('')}
    </div>
  `;
}
