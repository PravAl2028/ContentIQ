import { useState, useCallback } from 'react';
import { callGemini, parseGeminiJSON, hasGeminiKey } from '../services/api.js';
import { mockTrendScriptBasic, mockTrendScriptStoryboard } from '../services/mockData.js';
import { useToast } from '../context/ToastContext.jsx';

export default function TrendScript() {
    const { showToast } = useToast();
    const [topic, setTopic] = useState('');
    const [tone, setTone] = useState('');
    const [length, setLength] = useState('');
    const [requirements, setRequirements] = useState('');
    const [mode, setMode] = useState('director'); // talking-points | director
    const [phase, setPhase] = useState('input'); // input | loading | results
    const [data, setData] = useState(null);

    const TONE_SUGGESTIONS = ['Casual', 'Educational', 'Storytelling', 'Professional', 'Humorous', 'Mysterious'];
    const LENGTH_SUGGESTIONS = ['Short (1-3 min)', 'Medium (5-8 min)', 'Long (10-15 min)'];

    const showScriptResults = useCallback((result) => {
        setData(result);
        setPhase('results');
    }, []);

    const generateScript = useCallback(async () => {
        if (!topic.trim()) { showToast('Please enter a topic', 'warning'); return; }
        if (!tone.trim()) { showToast('Please enter or select a tone', 'warning'); return; }
        if (!length.trim()) { showToast('Please enter or select a target length', 'warning'); return; }

        setPhase('loading');

        try {
            const demoMock = mode === 'director' ? mockTrendScriptStoryboard : mockTrendScriptBasic;

            if (!hasGeminiKey()) {
                await new Promise(r => setTimeout(r, 1500));
                showScriptResults(demoMock);
                showToast('Demo data loaded — add Gemini API key for live generation', 'info');
                return;
            }

            let prompt = "";
            const baseInstructions = `
Target Tone: ${tone}
Target Length: ${length}
${requirements.trim() ? `CRITICAL CUSTOM REQUIREMENTS:\n${requirements}\n(You MUST prioritize and strictly follow these requirements)` : ''}

CRITICAL RULES:
1. Act as a viral YouTube creator known for this tone. Break the fourth wall. Ask direct questions to the audience.
2. The dialogue MUST feel unscripted but structured, informative but casual, and curious but skeptical according to the selected tone.
3. Incorporate curiosity gaps ("but here's the weird part...", "wait for this", "you won't believe this").
4. Add small human reactions and spoken rhythm ("yeah, sounds crazy right?", "stay with me!!", "this part is wild").
5. STRONGLY AVOID documentary tone. Absolutely no overly polished, formal narration. Maximize watch time and comments.
6. Maintain a ratio of roughly 1 minute of video = 100 spoken words in the dialogue/script. Scale the word count linearly based on the estimated duration (e.g. 5 minutes = ~500 words). Adjust slightly based on information density.
`;

            if (mode === 'director') {
                prompt = `You are an AI Video Director structuring a complete production blueprint for a new video. Create a video storyboard about "${topic}".

${baseInstructions}

Return JSON:
{
  "topic": "${topic}",
  "tone": "${tone}",
  "stats": {
    "estimatedDuration": "estimated duration based on length e.g., 5 minutes",
    "wordCount": "estimated word count e.g., 750 words",
    "retention": "expected audience retention e.g., 85%",
    "hookStrength": "hook strength e.g., Strong",
    "pacing": "pacing e.g., Fast"
  },
  "scenes": [
    {
      "title": "Scene 1 – Hook (0:00–0:15)",
      "purpose": "Pattern interrupt",
      "dialogue": "Script text",
      "visual": "What to show",
      "editing": "Zoom in / fast cuts / bold subtitles"
    }
  ]
}
Make the storyboard act as an AI Video Director, and output multiple scenes structured as above. Return ONLY valid JSON.`;
            } else {
                prompt = `You are a viral video scriptwriter. Create a concise talking points outline about "${topic}". Instead of writing out a full word-for-word script, provide high-level bullet points that give the creator the "idea of what to speak about" for each segment.

${baseInstructions}
2. Because this is a talking points outline, keep the "point" text concise and brief rather than full prose.

Return JSON:
{
  "topic": "${topic}",
  "tone": "${tone}",
  "stats": {
    "estimatedDuration": "estimated duration based on length e.g., 5 minutes",
    "wordCount": "estimated word count e.g., 750 words",
    "retention": "expected audience retention e.g., 85%",
    "hookStrength": "hook strength e.g., Strong",
    "pacing": "pacing e.g., Fast"
  },
  "script": {
    "hook": "attention-grabbing opening line",
    "valuePoints": [
      { "point": "key point text", "broll": "B-roll suggestion for this segment" }
    ],
    "cta": "call-to-action text"
  }
}
Make the hook irresistible. Include 4-6 value points with specific B-roll prompts. CTA should feel natural. Return ONLY valid JSON.`;
            }

            const response = await callGemini(prompt);
            const parsed = parseGeminiJSON(response);

            if (parsed) {
                showScriptResults({
                    module: 'trend_to_script', status: 'success', confidence: 0.91, results: parsed,
                    recommendations: ['Use this hook format for maximum retention', 'Add on-screen text for each value point', 'Keep segments under 60s for repurposing']
                });
            } else {
                showScriptResults(demoMock);
                showToast('Used demo data — could not parse response', 'warning');
            }
        } catch (err) {
            showScriptResults(mode === 'director' ? mockTrendScriptStoryboard : mockTrendScriptBasic);
            showToast('Demo data loaded: ' + err.message, 'warning');
        }
    }, [topic, tone, length, mode, requirements, showToast, showScriptResults]);

    const s = data ? (data.results.script || data.results.scenes || data.results) : null;
    const stats = data?.results?.stats;

    return (
        <div className="page-enter">
            <div className="page-header">
                <h1>✍️ Trend-to-Script Generator</h1>
                <p>Generate structured video scripts from trending topics with B-roll prompts</p>
            </div>

            <div className="two-panel">
                <div>
                    <div className="glass-card-static">
                        <div className="section-title"><span className="section-icon">🎯</span> Input</div>
                        <div className="form-group mb-lg">
                            <label className="form-label">Topic / Niche</label>
                            <input type="text" className="form-input" value={topic} onChange={e => setTopic(e.target.value)} placeholder="e.g., AI Tools for Productivity" />
                        </div>
                        <div className="form-group mb-lg">
                            <label className="form-label">Tone</label>
                            <input type="text" className="form-input" value={tone} onChange={e => setTone(e.target.value)} placeholder="e.g., Casual, Direct, Urgent..." />
                            <div className="flex gap-sm mt-sm" style={{ flexWrap: 'wrap' }}>
                                {TONE_SUGGESTIONS.map(s => (
                                    <button key={s} className="tag tag-purple" style={{ background: 'transparent', cursor: 'pointer' }} onClick={() => setTone(s)}>{s}</button>
                                ))}
                            </div>
                        </div>
                        <div className="form-group mb-lg">
                            <label className="form-label">Target Length</label>
                            <input type="text" className="form-input" value={length} onChange={e => setLength(e.target.value)} placeholder="e.g., 3 minutes, 60 seconds..." />
                            <div className="flex gap-sm mt-sm" style={{ flexWrap: 'wrap' }}>
                                {LENGTH_SUGGESTIONS.map(s => (
                                    <button key={s} className="tag tag-info" style={{ background: 'transparent', cursor: 'pointer' }} onClick={() => setLength(s)}>{s}</button>
                                ))}
                            </div>
                        </div>
                        <div className="form-group mb-lg">
                            <label className="form-label">Custom Requirements (Optional)</label>
                            <textarea className="form-textarea" rows="2" value={requirements} onChange={e => setRequirements(e.target.value)} placeholder="e.g., Must mention my newsletter, use fast pacing, avoid jargon..." />
                        </div>
                        <div className="form-group mb-lg">
                            <label className="form-label">Generation Mode</label>
                            <select className="form-select" value={mode} onChange={e => setMode(e.target.value)}>
                                <option value="talking-points">📜 Outline Mode (Talking Points)</option>
                                <option value="director">🚀 Director Mode (Full Storyboard)</option>
                            </select>
                        </div>
                        <div className="flex gap-md">
                            <button className="btn btn-primary" onClick={generateScript}>✨ Generate Script</button>
                        </div>
                    </div>
                </div>
                <div>
                    {phase === 'loading' && (
                        <div className="glass-card-static">
                            <div className="flex flex-col items-center justify-center gap-md" style={{ padding: 60 }}>
                                <div className="spinner"></div>
                                <div className="loading-text">Generating your script...</div>
                                <div className="pulse-loader"><span></span><span></span><span></span></div>
                            </div>
                        </div>
                    )}

                    {phase === 'results' && data && s && (
                        <div className="glass-card-static">
                            <div className="flex items-center justify-between mb-lg">
                                <div className="section-title" style={{ marginBottom: 0 }}><span className="section-icon">📝</span> {mode === 'director' ? 'AI Video Director Blueprint' : 'Talking Points Outline'}</div>
                                <div className="confidence-bar">
                                    <span className="confidence-label">Confidence</span>
                                    <div className="progress-bar" style={{ width: 80 }}><div className="progress-fill" style={{ width: `${data.confidence * 100}%` }}></div></div>
                                    <span className="confidence-value">{Math.round(data.confidence * 100)}%</span>
                                </div>
                            </div>

                            {stats && (
                                <div className="glass-subtle flex gap-md mb-lg" style={{ padding: '16px', flexWrap: 'wrap', background: 'rgba(107, 33, 168, 0.08)' }}>
                                    <div style={{ flex: 1, minWidth: '120px' }}><div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Duration</div><div style={{ fontWeight: 600 }}>⏱️ {stats.estimatedDuration}</div></div>
                                    <div style={{ flex: 1, minWidth: '120px' }}><div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Word Count</div><div style={{ fontWeight: 600 }}>📝 {stats.wordCount}</div></div>
                                    <div style={{ flex: 1, minWidth: '120px' }}><div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Retention</div><div style={{ fontWeight: 600, color: 'var(--success)' }}>📈 {stats.retention}</div></div>
                                    <div style={{ flex: 1, minWidth: '120px' }}><div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Hook Strength</div><div style={{ fontWeight: 600, color: 'var(--danger)' }}>🧲 {stats.hookStrength}</div></div>
                                    <div style={{ flex: 1, minWidth: '120px' }}><div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Pacing</div><div style={{ fontWeight: 600 }}>⚡ {stats.pacing}</div></div>
                                </div>
                            )}

                            {mode === 'director' && Array.isArray(s) ? (
                                s.map((scene, i) => (
                                    <div className="script-block" key={i} style={{ borderLeft: `3px solid ${i === 0 ? 'var(--danger)' : 'var(--purple-light)'}`, marginBottom: '16px', padding: '16px', background: 'rgba(0,0,0,0.2)', borderRadius: '4px' }}>
                                        <h3 style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px', marginBottom: '12px', fontSize: '1.1rem' }}>🎬 {scene.title}</h3>
                                        <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '8px', marginBottom: '8px', fontSize: '0.85rem' }}>
                                            <div style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Purpose:</div>
                                            <div>{scene.purpose}</div>

                                            <div style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Dialogue:</div>
                                            <div style={{ color: 'var(--text-primary)', fontStyle: 'italic' }}>{scene.dialogue}</div>

                                            <div style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Visual:</div>
                                            <div style={{ color: 'var(--info)' }}>🎥 {scene.visual}</div>

                                            {scene.editing && (
                                                <>
                                                    <div style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Editing:</div>
                                                    <div style={{ color: 'var(--success)' }}>✂️ {scene.editing}</div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <>
                                    <div className="script-block" style={{ borderLeft: '3px solid var(--danger)' }}>
                                        <h3>🎣 Hook</h3>
                                        <p>{s.hook}</p>
                                    </div>

                                    {(s.valuePoints || []).map((vp, i) => (
                                        <div className="script-block" key={i} style={{ borderLeft: '3px solid var(--purple-light)' }}>
                                            <h3>💡 Point {i + 1}</h3>
                                            <p>{vp.point}</p>
                                            <div style={{ marginTop: 8, padding: '8px 12px', background: 'rgba(96,165,250,0.08)', borderRadius: 8, border: '1px solid rgba(96,165,250,0.15)' }}>
                                                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--info)', textTransform: 'uppercase' }}>🎥 B-Roll:</span>
                                                <span style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', marginLeft: 8 }}>{vp.broll}</span>
                                            </div>
                                        </div>
                                    ))}

                                    <div className="script-block" style={{ borderLeft: '3px solid var(--success)' }}>
                                        <h3>🎯 Call to Action</h3>
                                        <p>{s.cta}</p>
                                    </div>
                                </>
                            )}

                            <div className="section-title mt-lg"><span className="section-icon">💡</span> Recommendations</div>
                            {data.recommendations.map((rec, i) => (
                                <div className="flex items-center gap-md" key={i} style={{ padding: '6px 0' }}>
                                    <span style={{ color: 'var(--purple-light)' }}>▸</span>
                                    <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{rec}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {phase === 'input' && (
                        <div className="glass-card-static">
                            <div className="empty-state">
                                <span className="empty-state-icon">✍️</span>
                                <div className="empty-state-title">No Script Generated Yet</div>
                                <div className="empty-state-text">Enter a topic and tone, then click Generate to create a structured video script.</div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
