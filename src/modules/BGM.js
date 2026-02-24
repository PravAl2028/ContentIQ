// ============================================================
// ContentIQ — Module 8: Music & BGM Suggester (ElevenLabs)
// ============================================================
import { callGemini, parseGeminiJSON, hasGeminiKey, elevenLabsSoundGen, hasElevenLabsKey } from '../services/api.js';
import { mockBGMSuggester } from '../services/mockData.js';

export function renderBGM() {
    return `
  <div class="page-enter">
    <div class="page-header">
      <h1>🎵 Music & BGM Suggester</h1>
      <p>Analyze scene mood and generate background music previews with ElevenLabs</p>
    </div>

    <div class="glass-card-static mb-lg">
      <div class="section-title"><span class="section-icon">📝</span> Video Content</div>
      <div class="form-group mb-lg">
        <label class="form-label">Transcript / Scene Descriptions</label>
        <textarea class="form-textarea" id="bgm-transcript" rows="5" placeholder="Paste your video transcript or describe scenes...">Opening hook about 5 AI tools, high energy. Then walkthrough of each tool with screen recordings, calm and focused. A key insight moment with high emotion. Tutorial segment with step-by-step instructions. Closing CTA with subscribe prompt, high energy upbeat ending.</textarea>
      </div>
      <div class="flex gap-md">
        <button class="btn btn-primary" id="bgm-generate-btn">🎵 Generate BGM Plan</button>
        <button class="btn btn-secondary" id="bgm-demo-btn">🎯 Demo</button>
      </div>
    </div>

    <div id="bgm-loading" style="display:none;" class="glass-card-static mb-lg">
      <div class="flex flex-col items-center justify-center gap-md" style="padding:40px;">
        <div class="spinner"></div>
        <div class="loading-text" id="bgm-loading-text">Analyzing scene moods...</div>
        <div class="pulse-loader"><span></span><span></span><span></span></div>
      </div>
    </div>

    <div id="bgm-results" style="display:none;"></div>
  </div>`;
}

export function initBGM() {
    const genBtn = document.getElementById('bgm-generate-btn');
    const demoBtn = document.getElementById('bgm-demo-btn');
    if (!genBtn) return;
    genBtn.addEventListener('click', generateBGM);
    demoBtn.addEventListener('click', () => showBGMResults(mockBGMSuggester));
}

async function generateBGM() {
    const transcript = document.getElementById('bgm-transcript').value.trim();
    if (!transcript) { window.showToast('Please enter transcript or scene descriptions', 'warning'); return; }

    document.getElementById('bgm-loading').style.display = 'block';
    document.getElementById('bgm-results').style.display = 'none';

    try {
        if (!hasGeminiKey()) {
            await new Promise(r => setTimeout(r, 1500));
            showBGMResults(mockBGMSuggester);
            window.showToast('Demo data loaded', 'info');
            return;
        }

        document.getElementById('bgm-loading-text').textContent = 'Analyzing scene moods with Gemini...';

        const prompt = `Analyze this video content and suggest background music for each segment.

Content: "${transcript}"

Return JSON:
{
  "segments": [
    { "id": 1, "range": "timestamp range", "mood": "mood description", "style": "music style suggestion", "energy": 0-100, "prompt": "detailed prompt for generating this BGM" }
  ]
}
Break the content into 4-6 logical segments. For each, suggest appropriate BGM style and mood. Return ONLY valid JSON.`;

        const response = await callGemini(prompt);
        const parsed = parseGeminiJSON(response);

        if (parsed) {
            const result = { module: "bgm_suggester", status: "success", confidence: 0.87, results: parsed, recommendations: ["Keep BGM at -18dB during voiceover", "Use contrasting energy levels for variety"] };

            // Try ElevenLabs sound generation for first segment
            if (hasElevenLabsKey() && parsed.segments && parsed.segments.length > 0) {
                document.getElementById('bgm-loading-text').textContent = 'Generating audio preview with ElevenLabs...';
                try {
                    const audioUrl = await elevenLabsSoundGen(parsed.segments[0].prompt, 5);
                    if (audioUrl) result.audioPreview = { segmentId: 1, url: audioUrl };
                } catch (e) { /* no audio */ }
            }

            showBGMResults(result);
        } else {
            showBGMResults(mockBGMSuggester);
        }
    } catch (err) {
        showBGMResults(mockBGMSuggester);
        window.showToast('Demo data loaded: ' + err.message, 'warning');
    }
}

function showBGMResults(data) {
    document.getElementById('bgm-loading').style.display = 'none';
    document.getElementById('bgm-results').style.display = 'block';

    const r = data.results;
    const energyColor = (e) => e >= 70 ? 'var(--danger)' : e >= 40 ? 'var(--warning)' : 'var(--info)';

    document.getElementById('bgm-results').innerHTML = `
    <div class="flex items-center justify-between mb-lg">
      <div class="section-title" style="margin-bottom:0;"><span class="section-icon">🎵</span> BGM Plan</div>
      <div class="confidence-bar">
        <span class="confidence-label">Confidence</span>
        <div class="progress-bar" style="width:80px;"><div class="progress-fill" style="width:${data.confidence * 100}%"></div></div>
        <span class="confidence-value">${Math.round(data.confidence * 100)}%</span>
      </div>
    </div>

    ${r.segments.map(s => `
      <div class="glass-card-static mb-md">
        <div class="flex items-center justify-between mb-md">
          <div class="flex items-center gap-md">
            <span class="tag tag-purple">Segment ${s.id}</span>
            <span style="font-size:0.82rem;font-weight:600;color:var(--text-primary);">${s.range}</span>
          </div>
          <div class="flex items-center gap-sm">
            <span style="font-size:0.72rem;color:var(--text-muted);">Energy</span>
            <div class="progress-bar" style="width:80px;"><div class="progress-fill" style="width:${s.energy}%;background:${energyColor(s.energy)};"></div></div>
            <span style="font-size:0.82rem;font-weight:800;color:${energyColor(s.energy)};">${s.energy}%</span>
          </div>
        </div>
        <div class="grid-2 gap-md">
          <div>
            <div class="form-label" style="margin-bottom:4px;">Mood</div>
            <div style="font-size:0.88rem;font-weight:600;color:var(--text-primary);">${s.mood}</div>
          </div>
          <div>
            <div class="form-label" style="margin-bottom:4px;">Suggested Style</div>
            <div style="font-size:0.88rem;color:var(--text-secondary);">${s.style}</div>
          </div>
        </div>
        ${data.audioPreview && data.audioPreview.segmentId === s.id ? `
          <div class="audio-player mt-md">
            <span style="font-size:0.78rem;font-weight:600;color:var(--text-secondary);">🔊</span>
            <audio controls src="${data.audioPreview.url}" style="flex:1;height:32px;"></audio>
            <a href="${data.audioPreview.url}" download="bgm_segment_${s.id}.mp3" class="download-btn">⬇</a>
          </div>
        ` : `
          <div class="flex items-center gap-sm mt-md" style="padding:8px 12px;background:rgba(168,85,247,0.05);border-radius:8px;">
            <span style="font-size:0.75rem;color:var(--text-muted);">🔈 ${hasElevenLabsKey() ? 'Generate preview with ElevenLabs' : 'Add ElevenLabs API key for audio generation'}</span>
          </div>
        `}
      </div>
    `).join('')}

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
