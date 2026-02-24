// ============================================================
// ContentIQ — Module 6: Multilingual Dubbing & Voice (ElevenLabs)
// ============================================================
import { callGemini, parseGeminiJSON, hasGeminiKey, elevenLabsTTS, hasElevenLabsKey, elevenLabsVoices } from '../services/api.js';
import { mockDubbing } from '../services/mockData.js';

export function renderDubbing() {
    return `
  <div class="page-enter">
    <div class="page-header">
      <h1>🌐 Multilingual Dubbing & Voice</h1>
      <p>Translate scripts and generate emotion-matched voice dubbing with ElevenLabs</p>
    </div>

    <div class="two-panel">
      <div>
        <div class="glass-card-static mb-lg">
          <div class="section-title"><span class="section-icon">📝</span> Input</div>
          <div class="form-group mb-lg">
            <label class="form-label">Original Transcript</label>
            <textarea class="form-textarea" id="dub-transcript" rows="6" placeholder="Paste your video transcript...">What if I told you there are 5 AI tools that replaced my entire virtual assistant? And they're all free. Let me show you Tool number one — Notion AI. This tool is an absolute game-changer for organizing your workflow. Drop a comment and smash subscribe!</textarea>
          </div>
          <div class="grid-2 mb-lg">
            <div class="form-group">
              <label class="form-label">Source Language</label>
              <select class="form-select" id="dub-source">
                <option value="English" selected>English</option>
                <option value="Spanish">Spanish</option>
                <option value="French">French</option>
                <option value="German">German</option>
                <option value="Japanese">Japanese</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Target Language</label>
              <select class="form-select" id="dub-target">
                <option value="Spanish" selected>🇪🇸 Spanish</option>
                <option value="French">🇫🇷 French</option>
                <option value="German">🇩🇪 German</option>
                <option value="Portuguese">🇧🇷 Portuguese</option>
                <option value="Japanese">🇯🇵 Japanese</option>
                <option value="Hindi">🇮🇳 Hindi</option>
                <option value="Arabic">🇸🇦 Arabic</option>
                <option value="Korean">🇰🇷 Korean</option>
                <option value="Mandarin">🇨🇳 Mandarin</option>
              </select>
            </div>
          </div>
          <div class="flex gap-md">
            <button class="btn btn-primary" id="dub-generate-btn">🌐 Translate & Dub</button>
            <button class="btn btn-secondary" id="dub-demo-btn">🎯 Demo</button>
          </div>
        </div>
      </div>

      <div>
        <div id="dub-loading" style="display:none;" class="glass-card-static">
          <div class="flex flex-col items-center justify-center gap-md" style="padding:60px;">
            <div class="spinner"></div>
            <div class="loading-text" id="dub-loading-text">Translating with emotional intent...</div>
            <div class="pulse-loader"><span></span><span></span><span></span></div>
          </div>
        </div>
        <div id="dub-results" style="display:none;"></div>
        <div id="dub-empty" class="glass-card-static">
          <div class="empty-state">
            <span class="empty-state-icon">🌐</span>
            <div class="empty-state-title">No Dubbing Generated</div>
            <div class="empty-state-text">Enter a transcript, pick a target language, and click Translate & Dub.</div>
          </div>
        </div>
      </div>
    </div>
  </div>`;
}

export function initDubbing() {
    const genBtn = document.getElementById('dub-generate-btn');
    const demoBtn = document.getElementById('dub-demo-btn');
    if (!genBtn) return;
    genBtn.addEventListener('click', generateDub);
    demoBtn.addEventListener('click', () => showDubResults(mockDubbing));
}

async function generateDub() {
    const transcript = document.getElementById('dub-transcript').value.trim();
    const source = document.getElementById('dub-source').value;
    const target = document.getElementById('dub-target').value;

    if (!transcript) { window.showToast('Please enter a transcript', 'warning'); return; }

    document.getElementById('dub-empty').style.display = 'none';
    document.getElementById('dub-results').style.display = 'none';
    document.getElementById('dub-loading').style.display = 'block';

    try {
        if (!hasGeminiKey()) {
            await new Promise(r => setTimeout(r, 2000));
            showDubResults(mockDubbing);
            window.showToast('Demo data loaded', 'info');
            return;
        }

        document.getElementById('dub-loading-text').textContent = 'Translating with Gemini...';

        const prompt = `Translate this ${source} transcript to ${target}, preserving emotional intent. Split into segments.

Transcript: "${transcript}"

Return JSON:
{
  "sourceLanguage": "${source}",
  "targetLanguage": "${target}",
  "segments": [
    { "id": 1, "original": "original text", "translated": "translated text", "tone": "[emotion annotation]", "direction": "dubbing direction notes" }
  ],
  "voiceSettings": { "stability": 0.45, "similarity_boost": 0.8, "style": 0.7 }
}
Add tone annotations like [enthusiastic], [calm], [urgent], [dramatic pause] etc. Return ONLY valid JSON.`;

        const response = await callGemini(prompt);
        const parsed = parseGeminiJSON(response);

        if (parsed) {
            const result = { module: "multilingual_dubbing", status: "success", confidence: 0.90, results: parsed, recommendations: ["Use ElevenLabs voice cloning for natural delivery", "Adjust pacing for target language"] };

            if (hasElevenLabsKey()) {
                document.getElementById('dub-loading-text').textContent = 'Generating voice with ElevenLabs...';
                try {
                    const firstSegment = parsed.segments[0];
                    const audioUrl = await elevenLabsTTS(firstSegment.translated, '21m00Tcm4TlvDq8ikWAM', parsed.voiceSettings);
                    if (audioUrl) result.audioPreview = audioUrl;
                } catch (e) { /* no audio preview */ }
            }

            showDubResults(result);
        } else {
            showDubResults(mockDubbing);
        }
    } catch (err) {
        showDubResults(mockDubbing);
        window.showToast('Demo data loaded: ' + err.message, 'warning');
    }
}

function showDubResults(data) {
    document.getElementById('dub-loading').style.display = 'none';
    document.getElementById('dub-empty').style.display = 'none';
    document.getElementById('dub-results').style.display = 'block';

    const r = data.results;

    document.getElementById('dub-results').innerHTML = `
    <div class="glass-card-static mb-lg">
      <div class="flex items-center justify-between mb-lg">
        <div class="section-title" style="margin-bottom:0;"><span class="section-icon">🌐</span> ${r.sourceLanguage} → ${r.targetLanguage}</div>
        <div class="confidence-bar">
          <span class="confidence-label">Confidence</span>
          <div class="progress-bar" style="width:80px;"><div class="progress-fill" style="width:${data.confidence * 100}%"></div></div>
          <span class="confidence-value">${Math.round(data.confidence * 100)}%</span>
        </div>
      </div>

      ${data.audioPreview ? `
      <div class="audio-player mb-lg">
        <span style="font-size:0.78rem;font-weight:600;color:var(--text-secondary);">🔊 Preview</span>
        <audio controls src="${data.audioPreview}" style="flex:1;height:32px;"></audio>
        <a href="${data.audioPreview}" download="dubbing_preview.mp3" class="download-btn">⬇ Download</a>
      </div>` : ''}

      <div class="section-title"><span class="section-icon">📜</span> Translated Segments</div>
      ${r.segments.map(s => `
        <div class="script-block" style="border-left:3px solid var(--purple-light);">
          <div class="flex items-center justify-between mb-sm">
            <h3 style="margin-bottom:0;">Segment ${s.id}</h3>
            <span class="tone-annotation">${s.tone}</span>
          </div>
          <div class="grid-2 gap-md">
            <div>
              <div class="form-label" style="margin-bottom:4px;">Original</div>
              <p style="font-size:0.82rem;color:var(--text-tertiary);font-style:italic;">${s.original}</p>
            </div>
            <div>
              <div class="form-label" style="margin-bottom:4px;">Translated</div>
              <p style="font-size:0.82rem;color:var(--text-secondary);">${s.translated}</p>
            </div>
          </div>
          <div style="margin-top:8px;padding:6px 10px;background:rgba(96,165,250,0.06);border-radius:6px;">
            <span style="font-size:0.72rem;font-weight:700;color:var(--info);">🎬 Direction:</span>
            <span style="font-size:0.75rem;color:var(--text-tertiary);margin-left:6px;">${s.direction}</span>
          </div>
        </div>
      `).join('')}

      <div class="section-title mt-lg"><span class="section-icon">🎛️</span> Voice Settings</div>
      <div class="grid-3 gap-md">
        <div class="glass-card" style="text-align:center;">
          <div style="font-size:0.72rem;color:var(--text-muted);margin-bottom:4px;">Stability</div>
          <div style="font-size:1.1rem;font-weight:800;color:var(--purple-glow);">${r.voiceSettings.stability}</div>
        </div>
        <div class="glass-card" style="text-align:center;">
          <div style="font-size:0.72rem;color:var(--text-muted);margin-bottom:4px;">Similarity</div>
          <div style="font-size:1.1rem;font-weight:800;color:var(--purple-glow);">${r.voiceSettings.similarity_boost}</div>
        </div>
        <div class="glass-card" style="text-align:center;">
          <div style="font-size:0.72rem;color:var(--text-muted);margin-bottom:4px;">Style</div>
          <div style="font-size:1.1rem;font-weight:800;color:var(--purple-glow);">${r.voiceSettings.style}</div>
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
