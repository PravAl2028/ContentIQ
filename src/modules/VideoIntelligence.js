// ============================================================
// ContentIQ — Module 1: Video Intelligence Engine
// ============================================================
import { callGemini, parseGeminiJSON, hasGeminiKey, extractFramesFromVideo, fileToBase64 } from '../services/api.js';
import { mockVideoIntelligence } from '../services/mockData.js';

let currentData = null;

export function renderVideoIntelligence() {
    return `
  <div class="page-enter">
    <div class="page-header">
      <h1>🎬 Video Intelligence Engine</h1>
      <p>Upload a video to analyze scenes, engagement, and find the best thumbnails</p>
    </div>

    <div class="glass-card-static mb-lg" id="vi-upload-section">
      <div class="upload-zone" id="vi-upload-zone">
        <input type="file" id="vi-file-input" accept="video/mp4,video/quicktime,video/mov" style="display:none;">
        <span class="upload-icon">🎬</span>
        <div class="upload-text">Drop your video here or click to upload</div>
        <div class="upload-subtext">Supports MP4, MOV • Max 500MB</div>
      </div>
      <div class="flex items-center justify-between mt-md">
        <button class="btn btn-secondary btn-sm" id="vi-demo-btn">🎯 Load Demo Data</button>
        <span style="font-size:0.75rem;color:var(--text-muted);" id="vi-api-status">${hasGeminiKey() ? '🟢 Gemini API Connected' : '🟡 No API Key — Demo mode available'}</span>
      </div>
    </div>

    <div id="vi-loading" style="display:none;" class="glass-card-static mb-lg">
      <div class="flex flex-col items-center justify-center gap-md" style="padding:40px;">
        <div class="spinner"></div>
        <div class="loading-text">Analyzing your video with Gemini AI...</div>
        <div class="pulse-loader"><span></span><span></span><span></span></div>
        <div style="font-size:0.75rem;color:var(--text-muted);margin-top:8px;" id="vi-loading-status">Extracting frames...</div>
      </div>
    </div>

    <div id="vi-results" style="display:none;"></div>
  </div>`;
}

export function initVideoIntelligence() {
    const zone = document.getElementById('vi-upload-zone');
    const input = document.getElementById('vi-file-input');
    const demoBtn = document.getElementById('vi-demo-btn');

    if (!zone) return;

    zone.addEventListener('click', () => input.click());
    zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('drag-over'); });
    zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
    zone.addEventListener('drop', (e) => { e.preventDefault(); zone.classList.remove('drag-over'); if (e.dataTransfer.files[0]) processVideo(e.dataTransfer.files[0]); });
    input.addEventListener('change', () => { if (input.files[0]) processVideo(input.files[0]); });
    demoBtn.addEventListener('click', () => showResults(mockVideoIntelligence));
}

async function processVideo(file) {
    document.getElementById('vi-upload-section').style.display = 'none';
    document.getElementById('vi-loading').style.display = 'block';

    try {
        if (!hasGeminiKey()) {
            document.getElementById('vi-loading-status').textContent = 'No API key — loading demo data...';
            await new Promise(r => setTimeout(r, 2000));
            showResults(mockVideoIntelligence);
            return;
        }

        document.getElementById('vi-loading-status').textContent = 'Extracting frames from video...';
        const frames = await extractFramesFromVideo(file, 6);

        document.getElementById('vi-loading-status').textContent = 'Sending frames to Gemini for analysis...';
        const images = frames.map(f => ({ type: 'image/jpeg', base64: f.base64 }));

        const prompt = `You are ContentIQ Video Intelligence Engine. Analyze these video frames and return a JSON object with this exact structure:
{
  "duration": "estimated duration",
  "resolution": "estimated resolution",
  "fps": 30,
  "scenes": [
    { "id": number, "timestamp": "start–end", "engagement": 0-100, "recommendation": "Keep|Trim|Cut|Highlight", "reason": "explanation", "composition": "frame composition feedback" }
  ],
  "thumbnails": [
    { "frame": "timestamp", "ctrScore": 0-100, "reason": "why this frame would make a good thumbnail" }
  ]
}
Analyze each frame for engagement potential, composition quality, and thumbnail viability. Return ONLY valid JSON.`;

        const response = await callGemini(prompt, images);
        const parsed = parseGeminiJSON(response);

        if (parsed) {
            const result = {
                module: "video_intelligence",
                status: "success",
                confidence: 0.94,
                results: parsed,
                recommendations: [
                    "Review highlighted scenes for potential clip extraction",
                    "Use highest CTR thumbnail for primary video thumbnail",
                    "Consider trimming low-engagement scenes for better retention"
                ]
            };
            showResults(result);
        } else {
            showResults(mockVideoIntelligence);
            window.showToast('Used demo data — could not parse AI response', 'warning');
        }
    } catch (err) {
        showResults(mockVideoIntelligence);
        window.showToast('Loaded demo data: ' + err.message, 'warning');
    }
}

function showResults(data) {
    currentData = data;
    document.getElementById('vi-loading').style.display = 'none';
    document.getElementById('vi-results').style.display = 'block';

    const r = data.results;
    const scenes = r.scenes || [];
    const thumbs = r.thumbnails || [];

    document.getElementById('vi-results').innerHTML = `
    <div class="flex items-center justify-between mb-lg">
      <div class="section-title" style="margin-bottom:0;"><span class="section-icon">📊</span> Analysis Results</div>
      <div class="flex items-center gap-md">
        <div class="confidence-bar">
          <span class="confidence-label">Confidence</span>
          <div class="progress-bar" style="width:120px;"><div class="progress-fill" style="width:${data.confidence * 100}%;"></div></div>
          <span class="confidence-value">${Math.round(data.confidence * 100)}%</span>
        </div>
        <button class="btn btn-secondary btn-sm" onclick="document.getElementById('vi-upload-section').style.display='block';document.getElementById('vi-results').style.display='none';">↺ New Analysis</button>
      </div>
    </div>

    <div class="grid-3 mb-lg">
      <div class="glass-card stat-card">
        <div class="stat-label">Duration</div>
        <div class="stat-value">${r.duration || 'N/A'}</div>
      </div>
      <div class="glass-card stat-card">
        <div class="stat-label">Resolution</div>
        <div class="stat-value">${r.resolution || 'N/A'}</div>
      </div>
      <div class="glass-card stat-card">
        <div class="stat-label">Scenes Detected</div>
        <div class="stat-value">${scenes.length}</div>
      </div>
    </div>

    <div class="section-title"><span class="section-icon">🎬</span> Scene-by-Scene Analysis</div>
    <div class="glass-card-static mb-lg">
      <div class="scene-timeline">
        ${scenes.map(s => `
          <div class="scene-item">
            <div style="min-width:100px;">
              <div class="scene-timestamp">${s.timestamp}</div>
              <div style="margin-top:8px;">
                <span class="scene-rec rec-${s.recommendation.toLowerCase()}">${s.recommendation}</span>
              </div>
            </div>
            <div class="scene-details">
              <div class="flex items-center justify-between mb-sm">
                <span style="font-size:0.85rem;font-weight:600;color:var(--text-primary);">Scene ${s.id}</span>
                <div class="flex items-center gap-sm">
                  <span style="font-size:0.75rem;color:var(--text-muted);">Engagement</span>
                  <div class="progress-bar" style="width:80px;"><div class="progress-fill" style="width:${s.engagement}%;background:${getEngagementColor(s.engagement)};"></div></div>
                  <span style="font-size:0.82rem;font-weight:800;color:${getEngagementColor(s.engagement)};">${s.engagement}%</span>
                </div>
              </div>
              <p style="font-size:0.82rem;color:var(--text-secondary);margin-bottom:6px;">${s.reason}</p>
              <p style="font-size:0.75rem;color:var(--text-muted);"><strong>Composition:</strong> ${s.composition}</p>
            </div>
          </div>
        `).join('')}
      </div>
    </div>

    <div class="section-title"><span class="section-icon">🖼️</span> Best Thumbnail Frames</div>
    <div class="glass-card-static mb-lg">
      <div class="grid-3">
        ${thumbs.map((t, i) => `
          <div class="glass-card" style="text-align:center;">
            <div style="width:64px;height:64px;border-radius:50%;margin:0 auto 12px;background:var(--glass-bg-active);display:flex;align-items:center;justify-content:center;">
              <span style="font-size:1.4rem;font-weight:800;color:var(--purple-glow);">${t.ctrScore}</span>
            </div>
            <div style="font-size:0.82rem;font-weight:700;color:var(--text-primary);margin-bottom:4px;">Frame @ ${t.frame}</div>
            <div style="font-size:0.75rem;color:var(--text-tertiary);">${t.reason}</div>
            <div class="tag tag-purple mt-md" style="margin:8px auto 0;">CTR Score: ${t.ctrScore}%</div>
          </div>
        `).join('')}
      </div>
    </div>

    <div class="section-title"><span class="section-icon">💡</span> Recommendations</div>
    <div class="glass-card-static">
      ${data.recommendations.map(r => `
        <div class="flex items-center gap-md" style="padding:8px 0;border-bottom:1px solid rgba(168,85,247,0.06);">
          <span style="color:var(--purple-light);">▸</span>
          <span style="font-size:0.85rem;color:var(--text-secondary);">${r}</span>
        </div>
      `).join('')}
    </div>
  `;
}

function getEngagementColor(score) {
    if (score >= 80) return 'var(--success)';
    if (score >= 60) return 'var(--warning)';
    return 'var(--danger)';
}
