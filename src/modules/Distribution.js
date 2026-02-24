// ============================================================
// ContentIQ — Module 3: Multi-Platform Distribution Planner
// ============================================================
import { callGemini, parseGeminiJSON, hasGeminiKey } from '../services/api.js';
import { mockDistributionPlan } from '../services/mockData.js';

export function renderDistribution() {
    return `
  <div class="page-enter">
    <div class="page-header">
      <h1>📱 Multi-Platform Distribution Planner</h1>
      <p>Generate optimized content packages for YouTube, TikTok, and Instagram</p>
    </div>

    <div class="glass-card-static mb-lg">
      <div class="section-title"><span class="section-icon">📝</span> Video Metadata</div>
      <div class="grid-2 mb-lg">
        <div class="form-group">
          <label class="form-label">Video Title / Topic</label>
          <input type="text" class="form-input" id="dp-title" placeholder="e.g., 5 Free AI Tools" value="5 Free AI Tools That Replaced My Virtual Assistant">
        </div>
        <div class="form-group">
          <label class="form-label">Niche / Category</label>
          <input type="text" class="form-input" id="dp-niche" placeholder="e.g., Tech/Productivity" value="Tech/Productivity">
        </div>
      </div>
      <div class="form-group mb-lg">
        <label class="form-label">Description / Summary</label>
        <textarea class="form-textarea" id="dp-desc" rows="3" placeholder="Brief description of video content...">A walkthrough of 5 free AI tools that automate tasks previously handled by a virtual assistant.</textarea>
      </div>
      <div class="flex gap-md">
        <button class="btn btn-primary" id="dp-generate-btn">📱 Generate Distribution Plan</button>
        <button class="btn btn-secondary" id="dp-demo-btn">🎯 Demo</button>
      </div>
    </div>

    <div id="dp-loading" style="display:none;" class="glass-card-static mb-lg">
      <div class="flex flex-col items-center justify-center gap-md" style="padding:40px;">
        <div class="spinner"></div>
        <div class="loading-text">Crafting platform-optimized packages...</div>
        <div class="pulse-loader"><span></span><span></span><span></span></div>
      </div>
    </div>

    <div id="dp-results" style="display:none;"></div>
  </div>`;
}

export function initDistribution() {
    const genBtn = document.getElementById('dp-generate-btn');
    const demoBtn = document.getElementById('dp-demo-btn');
    if (!genBtn) return;
    genBtn.addEventListener('click', generatePlan);
    demoBtn.addEventListener('click', () => showPlanResults(mockDistributionPlan));
}

async function generatePlan() {
    const title = document.getElementById('dp-title').value.trim();
    const niche = document.getElementById('dp-niche').value.trim();
    const desc = document.getElementById('dp-desc').value.trim();

    if (!title) { window.showToast('Please enter a video title', 'warning'); return; }

    document.getElementById('dp-loading').style.display = 'block';
    document.getElementById('dp-results').style.display = 'none';

    try {
        if (!hasGeminiKey()) {
            await new Promise(r => setTimeout(r, 1500));
            showPlanResults(mockDistributionPlan);
            window.showToast('Demo data loaded', 'info');
            return;
        }

        const prompt = `Create a multi-platform distribution plan for a ${niche} video titled "${title}". Description: "${desc}".

Return JSON:
{
  "youtube": { "title": "SEO optimized title", "description": "full description with timestamps", "tags": ["tag1","tag2"] },
  "tiktok": { "clipRange": "best 30-60s range", "caption": "caption", "hashtags": ["#tag1"] },
  "instagram": { "caption": "caption", "hashtags": ["#tag1"] },
  "viralWindow": { "bestDay": "day", "bestTime": "time EST", "reason": "why" }
}
Return ONLY valid JSON.`;

        const response = await callGemini(prompt);
        const parsed = parseGeminiJSON(response);

        if (parsed) {
            showPlanResults({ module: "distribution_planner", status: "success", confidence: 0.89, results: parsed, recommendations: ["Post YouTube first then repurpose", "Cross-promote on all platforms within 2 hours"] });
        } else {
            showPlanResults(mockDistributionPlan);
        }
    } catch (err) {
        showPlanResults(mockDistributionPlan);
        window.showToast('Demo data loaded: ' + err.message, 'warning');
    }
}

function showPlanResults(data) {
    document.getElementById('dp-loading').style.display = 'none';
    document.getElementById('dp-results').style.display = 'block';

    const r = data.results;

    document.getElementById('dp-results').innerHTML = `
    <div class="flex items-center justify-between mb-lg">
      <div class="section-title" style="margin-bottom:0;"><span class="section-icon">📊</span> Distribution Plan</div>
      <div class="confidence-bar">
        <span class="confidence-label">Confidence</span>
        <div class="progress-bar" style="width:80px;"><div class="progress-fill" style="width:${data.confidence * 100}%"></div></div>
        <span class="confidence-value">${Math.round(data.confidence * 100)}%</span>
      </div>
    </div>

    <!-- YouTube -->
    <div class="glass-card-static platform-card mb-lg">
      <div class="platform-card-header" style="color:#FF0000;">
        <span style="font-size:1.2rem;">▶️</span> YouTube
        <span class="tag tag-danger" style="margin-left:auto;">Primary</span>
      </div>
      <div class="platform-card-body">
        <div class="form-group mb-md">
          <label class="form-label">SEO Title</label>
          <div style="font-size:0.9rem;font-weight:600;color:var(--text-primary);padding:8px 0;">${r.youtube.title}</div>
        </div>
        <div class="form-group mb-md">
          <label class="form-label">Description</label>
          <div style="font-size:0.82rem;color:var(--text-secondary);white-space:pre-line;line-height:1.6;padding:8px 0;">${r.youtube.description}</div>
        </div>
        <div class="form-group">
          <label class="form-label">Tags</label>
          <div class="flex gap-sm" style="flex-wrap:wrap;">
            ${r.youtube.tags.map(t => `<span class="tag tag-purple">${t}</span>`).join('')}
          </div>
        </div>
      </div>
    </div>

    <div class="grid-2 mb-lg">
      <!-- TikTok -->
      <div class="glass-card-static platform-card">
        <div class="platform-card-header" style="color:#00F2EA;">
          <span style="font-size:1.2rem;">🎵</span> TikTok
        </div>
        <div class="platform-card-body">
          <div class="form-group mb-md">
            <label class="form-label">Best Clip</label>
            <span class="tag tag-info">${r.tiktok.clipRange}</span>
          </div>
          <div class="form-group mb-md">
            <label class="form-label">Caption</label>
            <p style="font-size:0.82rem;color:var(--text-secondary);">${r.tiktok.caption}</p>
          </div>
          <div class="flex gap-sm" style="flex-wrap:wrap;">
            ${r.tiktok.hashtags.map(h => `<span class="tag tag-info">${h}</span>`).join('')}
          </div>
        </div>
      </div>

      <!-- Instagram -->
      <div class="glass-card-static platform-card">
        <div class="platform-card-header" style="color:#E1306C;">
          <span style="font-size:1.2rem;">📸</span> Instagram
        </div>
        <div class="platform-card-body">
          <div class="form-group mb-md">
            <label class="form-label">Caption</label>
            <p style="font-size:0.82rem;color:var(--text-secondary);white-space:pre-line;">${r.instagram.caption}</p>
          </div>
          <div class="flex gap-sm" style="flex-wrap:wrap;">
            ${r.instagram.hashtags.map(h => `<span class="tag tag-purple">${h}</span>`).join('')}
          </div>
        </div>
      </div>
    </div>

    <!-- Viral Window -->
    <div class="glass-card-static">
      <div class="section-title"><span class="section-icon">🔥</span> Viral Window Detection</div>
      <div class="grid-3">
        <div class="glass-card" style="text-align:center;">
          <div style="font-size:1.8rem;margin-bottom:8px;">📅</div>
          <div style="font-size:1.1rem;font-weight:800;color:var(--text-primary);">${r.viralWindow.bestDay}</div>
          <div style="font-size:0.75rem;color:var(--text-muted);">Best Day</div>
        </div>
        <div class="glass-card" style="text-align:center;">
          <div style="font-size:1.8rem;margin-bottom:8px;">⏰</div>
          <div style="font-size:1.1rem;font-weight:800;color:var(--text-primary);">${r.viralWindow.bestTime}</div>
          <div style="font-size:0.75rem;color:var(--text-muted);">Best Time</div>
        </div>
        <div class="glass-card" style="text-align:center;">
          <div style="font-size:1.8rem;margin-bottom:8px;">📈</div>
          <div style="font-size:0.78rem;color:var(--text-secondary);">${r.viralWindow.reason}</div>
        </div>
      </div>

      <div class="section-title mt-lg"><span class="section-icon">💡</span> Recommendations</div>
      ${data.recommendations.map(r => `
        <div class="flex items-center gap-md" style="padding:6px 0;">
          <span style="color:var(--purple-light);">▸</span>
          <span style="font-size:0.82rem;color:var(--text-secondary);">${r}</span>
        </div>
      `).join('')}
    </div>
  `;
}
