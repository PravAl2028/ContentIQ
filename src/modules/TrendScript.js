// ============================================================
// ContentIQ — Module 2: Trend-to-Script Generator
// ============================================================
import { callGemini, parseGeminiJSON, hasGeminiKey } from '../services/api.js';
import { mockTrendScript } from '../services/mockData.js';

export function renderTrendScript() {
    return `
  <div class="page-enter">
    <div class="page-header">
      <h1>✍️ Trend-to-Script Generator</h1>
      <p>Generate structured video scripts from trending topics with B-roll prompts</p>
    </div>

    <div class="two-panel">
      <div>
        <div class="glass-card-static">
          <div class="section-title"><span class="section-icon">🎯</span> Input</div>
          <div class="form-group mb-lg">
            <label class="form-label">Topic / Niche</label>
            <input type="text" class="form-input" id="ts-topic" placeholder="e.g., AI Tools for Productivity" value="AI Tools for Productivity">
          </div>
          <div class="form-group mb-lg">
            <label class="form-label">Tone</label>
            <select class="form-select" id="ts-tone">
              <option value="casual" selected>🎤 Casual</option>
              <option value="educational">📚 Educational</option>
              <option value="storytelling">📖 Storytelling</option>
              <option value="professional">💼 Professional</option>
              <option value="humorous">😂 Humorous</option>
            </select>
          </div>
          <div class="form-group mb-lg">
            <label class="form-label">Target Length</label>
            <select class="form-select" id="ts-length">
              <option value="short">Short (1–3 min)</option>
              <option value="medium" selected>Medium (5–8 min)</option>
              <option value="long">Long (10–15 min)</option>
            </select>
          </div>
          <div class="flex gap-md">
            <button class="btn btn-primary" id="ts-generate-btn">✨ Generate Script</button>
            <button class="btn btn-secondary" id="ts-demo-btn">🎯 Demo</button>
          </div>
        </div>
      </div>
      <div>
        <div id="ts-loading" style="display:none;" class="glass-card-static">
          <div class="flex flex-col items-center justify-center gap-md" style="padding:60px;">
            <div class="spinner"></div>
            <div class="loading-text">Generating your script...</div>
            <div class="pulse-loader"><span></span><span></span><span></span></div>
          </div>
        </div>
        <div id="ts-results"></div>
        <div id="ts-empty" class="glass-card-static">
          <div class="empty-state">
            <span class="empty-state-icon">✍️</span>
            <div class="empty-state-title">No Script Generated Yet</div>
            <div class="empty-state-text">Enter a topic and tone, then click Generate to create a structured video script.</div>
          </div>
        </div>
      </div>
    </div>
  </div>`;
}

export function initTrendScript() {
    const genBtn = document.getElementById('ts-generate-btn');
    const demoBtn = document.getElementById('ts-demo-btn');

    if (!genBtn) return;

    genBtn.addEventListener('click', generateScript);
    demoBtn.addEventListener('click', () => showScriptResults(mockTrendScript));
}

async function generateScript() {
    const topic = document.getElementById('ts-topic').value.trim();
    const tone = document.getElementById('ts-tone').value;
    const length = document.getElementById('ts-length').value;

    if (!topic) { window.showToast('Please enter a topic', 'warning'); return; }

    document.getElementById('ts-empty').style.display = 'none';
    document.getElementById('ts-results').style.display = 'none';
    document.getElementById('ts-loading').style.display = 'block';

    try {
        if (!hasGeminiKey()) {
            await new Promise(r => setTimeout(r, 1500));
            showScriptResults(mockTrendScript);
            window.showToast('Demo data loaded — add Gemini API key for live generation', 'info');
            return;
        }

        const prompt = `You are a viral video scriptwriter. Create a ${length}-length video script about "${topic}" in a ${tone} tone.

Return JSON:
{
  "topic": "${topic}",
  "tone": "${tone}",
  "script": {
    "hook": "attention-grabbing opening line",
    "valuePoints": [
      { "point": "key point text", "broll": "B-roll suggestion for this segment" }
    ],
    "cta": "call-to-action text"
  }
}
Make the hook irresistible. Include 4-6 value points with specific B-roll prompts. CTA should feel natural. Return ONLY valid JSON.`;

        const response = await callGemini(prompt);
        const parsed = parseGeminiJSON(response);

        if (parsed) {
            showScriptResults({ module: "trend_to_script", status: "success", confidence: 0.91, results: parsed, recommendations: ["Use this hook format for maximum retention", "Add on-screen text for each value point", "Keep segments under 60s for repurposing"] });
        } else {
            showScriptResults(mockTrendScript);
            window.showToast('Used demo data — could not parse response', 'warning');
        }
    } catch (err) {
        showScriptResults(mockTrendScript);
        window.showToast('Demo data loaded: ' + err.message, 'warning');
    }
}

function showScriptResults(data) {
    document.getElementById('ts-loading').style.display = 'none';
    document.getElementById('ts-empty').style.display = 'none';
    document.getElementById('ts-results').style.display = 'block';

    const s = data.results.script || data.results;

    document.getElementById('ts-results').innerHTML = `
    <div class="glass-card-static">
      <div class="flex items-center justify-between mb-lg">
        <div class="section-title" style="margin-bottom:0;"><span class="section-icon">📝</span> Generated Script</div>
        <div class="confidence-bar">
          <span class="confidence-label">Confidence</span>
          <div class="progress-bar" style="width:80px;"><div class="progress-fill" style="width:${data.confidence * 100}%"></div></div>
          <span class="confidence-value">${Math.round(data.confidence * 100)}%</span>
        </div>
      </div>

      <div class="script-block" style="border-left:3px solid var(--danger);">
        <h3>🎣 Hook</h3>
        <p>${s.hook}</p>
      </div>

      ${(s.valuePoints || []).map((vp, i) => `
        <div class="script-block" style="border-left:3px solid var(--purple-light);">
          <h3>💡 Point ${i + 1}</h3>
          <p>${vp.point}</p>
          <div style="margin-top:8px;padding:8px 12px;background:rgba(96,165,250,0.08);border-radius:8px;border:1px solid rgba(96,165,250,0.15);">
            <span style="font-size:0.72rem;font-weight:700;color:var(--info);text-transform:uppercase;">🎥 B-Roll:</span>
            <span style="font-size:0.78rem;color:var(--text-tertiary);margin-left:8px;">${vp.broll}</span>
          </div>
        </div>
      `).join('')}

      <div class="script-block" style="border-left:3px solid var(--success);">
        <h3>🎯 Call to Action</h3>
        <p>${s.cta}</p>
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
