// ============================================================
// ContentIQ — Module 5: Creator Voice Tracker
// ============================================================
import { callGemini, parseGeminiJSON, hasGeminiKey } from '../services/api.js';
import { mockVoiceTracker } from '../services/mockData.js';

export function renderVoiceTracker() {
    return `
  <div class="page-enter">
    <div class="page-header">
      <h1>🎤 Creator Voice Tracker</h1>
      <p>Build your voice profile and score new scripts for brand consistency</p>
    </div>

    <div class="two-panel">
      <div>
        <div class="glass-card-static mb-lg">
          <div class="section-title"><span class="section-icon">👤</span> Your Profile</div>
          <div class="form-group mb-lg">
            <label class="form-label">Creator Bio</label>
            <textarea class="form-textarea" id="vt-bio" rows="3" placeholder="Describe your brand voice, audience, and content style...">Tech content creator focused on AI tools and productivity hacks. Casual, energetic style aimed at 20-35 professionals. Known for honest, no-nonsense reviews.</textarea>
          </div>
          <div class="form-group mb-lg">
            <label class="form-label">Past Transcript (Reference)</label>
            <textarea class="form-textarea" id="vt-transcript" rows="4" placeholder="Paste a transcript from one of your best-performing videos...">Hey what's up everyone! So today I found something that's a total game-changer. Let me show you these five AI tools that literally replaced my virtual assistant. No cap, these are all free and here's the thing — they actually work.</textarea>
          </div>
        </div>
        <div class="glass-card-static">
          <div class="section-title"><span class="section-icon">📝</span> Script to Score</div>
          <div class="form-group mb-lg">
            <label class="form-label">New Script</label>
            <textarea class="form-textarea" id="vt-script" rows="5" placeholder="Paste the new script you want scored...">Hello viewers. Today we'll leverage these tools to do a deep-dive into AI productivity. In conclusion, these tools provide synergy for your workflow. Let's circle back on the key takeaways.</textarea>
          </div>
          <div class="flex gap-md">
            <button class="btn btn-primary" id="vt-score-btn">🎯 Score Script</button>
            <button class="btn btn-secondary" id="vt-demo-btn">Demo</button>
          </div>
        </div>
      </div>

      <div>
        <div id="vt-loading" style="display:none;" class="glass-card-static">
          <div class="flex flex-col items-center justify-center gap-md" style="padding:60px;">
            <div class="spinner"></div>
            <div class="loading-text">Analyzing brand voice consistency...</div>
            <div class="pulse-loader"><span></span><span></span><span></span></div>
          </div>
        </div>
        <div id="vt-results" style="display:none;"></div>
        <div id="vt-empty" class="glass-card-static">
          <div class="empty-state">
            <span class="empty-state-icon">🎤</span>
            <div class="empty-state-title">No Voice Analysis Yet</div>
            <div class="empty-state-text">Enter your profile and a script to score, then click Score Script.</div>
          </div>
        </div>
      </div>
    </div>
  </div>`;
}

export function initVoiceTracker() {
    const scoreBtn = document.getElementById('vt-score-btn');
    const demoBtn = document.getElementById('vt-demo-btn');
    if (!scoreBtn) return;
    scoreBtn.addEventListener('click', scoreScript);
    demoBtn.addEventListener('click', () => showVoiceResults(mockVoiceTracker));
}

async function scoreScript() {
    document.getElementById('vt-empty').style.display = 'none';
    document.getElementById('vt-results').style.display = 'none';
    document.getElementById('vt-loading').style.display = 'block';

    try {
        if (!hasGeminiKey()) {
            await new Promise(r => setTimeout(r, 1500));
            showVoiceResults(mockVoiceTracker);
            window.showToast('Demo data loaded', 'info');
            return;
        }

        const bio = document.getElementById('vt-bio').value;
        const transcript = document.getElementById('vt-transcript').value;
        const script = document.getElementById('vt-script').value;

        const prompt = `You are a brand voice analyzer. Given this creator profile and past transcript, score the new script for brand consistency.

Creator Bio: "${bio}"
Reference Transcript: "${transcript}"
New Script to Score: "${script}"

Return JSON:
{
  "voiceProfile": { "tone": "", "vocabulary": "", "energy": "", "signature_phrases": [], "avoids": [] },
  "scriptScore": 0-100,
  "flags": [{ "phrase": "off-brand phrase", "suggestion": "on-brand replacement", "reason": "why" }],
  "strengths": ["what matches the brand voice"]
}
Return ONLY valid JSON.`;

        const response = await callGemini(prompt);
        const parsed = parseGeminiJSON(response);
        if (parsed) {
            showVoiceResults({ module: "creator_voice_tracker", status: "success", confidence: 0.88, results: parsed, recommendations: ["Fix flagged phrases for better brand consistency"] });
        } else {
            showVoiceResults(mockVoiceTracker);
        }
    } catch (err) {
        showVoiceResults(mockVoiceTracker);
        window.showToast('Demo data loaded: ' + err.message, 'warning');
    }
}

function showVoiceResults(data) {
    document.getElementById('vt-loading').style.display = 'none';
    document.getElementById('vt-empty').style.display = 'none';
    document.getElementById('vt-results').style.display = 'block';

    const r = data.results;
    const scoreColor = r.scriptScore >= 80 ? 'var(--success)' : r.scriptScore >= 60 ? 'var(--warning)' : 'var(--danger)';

    document.getElementById('vt-results').innerHTML = `
    <div class="glass-card-static mb-lg" style="text-align:center;">
      <div style="font-size:0.78rem;font-weight:600;color:var(--text-muted);text-transform:uppercase;margin-bottom:12px;">Brand Consistency Score</div>
      <div style="width:100px;height:100px;border-radius:50%;border:4px solid ${scoreColor};display:flex;align-items:center;justify-content:center;margin:0 auto 12px;">
        <span style="font-size:2rem;font-weight:900;color:${scoreColor};">${r.scriptScore}</span>
      </div>
      <div style="font-size:0.82rem;color:var(--text-tertiary);">${r.scriptScore >= 80 ? 'Great match!' : r.scriptScore >= 60 ? 'Needs some adjustments' : 'Significant mismatch'}</div>
    </div>

    <div class="glass-card-static mb-lg">
      <div class="section-title"><span class="section-icon">👤</span> Voice Profile</div>
      <div class="grid-2 gap-md">
        <div><span class="form-label">Tone</span><p style="font-size:0.85rem;color:var(--text-secondary);margin-top:4px;">${r.voiceProfile.tone}</p></div>
        <div><span class="form-label">Energy</span><p style="font-size:0.85rem;color:var(--text-secondary);margin-top:4px;">${r.voiceProfile.energy}</p></div>
      </div>
      <div class="mt-md"><span class="form-label">Vocabulary</span><p style="font-size:0.85rem;color:var(--text-secondary);margin-top:4px;">${r.voiceProfile.vocabulary}</p></div>
      <div class="mt-md"><span class="form-label">Signature Phrases</span>
        <div class="flex gap-sm mt-sm" style="flex-wrap:wrap;">${r.voiceProfile.signature_phrases.map(p => `<span class="tag tag-success">"${p}"</span>`).join('')}</div>
      </div>
      <div class="mt-md"><span class="form-label">Avoids</span>
        <div class="flex gap-sm mt-sm" style="flex-wrap:wrap;">${r.voiceProfile.avoids.map(p => `<span class="tag tag-danger">"${p}"</span>`).join('')}</div>
      </div>
    </div>

    ${r.flags.length > 0 ? `
    <div class="glass-card-static mb-lg">
      <div class="section-title"><span class="section-icon">⚠️</span> Off-Brand Flags</div>
      ${r.flags.map(f => `
        <div class="scene-item" style="border-left:3px solid var(--warning);">
          <div class="scene-details">
            <div class="flex items-center gap-md mb-sm">
              <span class="tag tag-danger">"${f.phrase}"</span>
              <span style="color:var(--text-muted);">→</span>
              <span class="tag tag-success">"${f.suggestion}"</span>
            </div>
            <p style="font-size:0.78rem;color:var(--text-tertiary);">${f.reason}</p>
          </div>
        </div>
      `).join('')}
    </div>` : ''}

    <div class="glass-card-static">
      <div class="section-title"><span class="section-icon">✅</span> Strengths</div>
      ${r.strengths.map(s => `
        <div class="flex items-center gap-md" style="padding:6px 0;">
          <span style="color:var(--success);">✓</span>
          <span style="font-size:0.82rem;color:var(--text-secondary);">${s}</span>
        </div>
      `).join('')}
    </div>
  `;
}
