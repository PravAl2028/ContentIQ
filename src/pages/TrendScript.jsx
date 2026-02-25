import { useState, useCallback } from 'react';
import { callGemini, parseGeminiJSON, hasGeminiKey } from '../services/api.js';
import { mockTrendScript } from '../services/mockData.js';
import { useToast } from '../context/ToastContext.jsx';

export default function TrendScript() {
    const { showToast } = useToast();
    const [topic, setTopic] = useState('AI Tools for Productivity');
    const [tone, setTone] = useState('casual');
    const [length, setLength] = useState('medium');
    const [phase, setPhase] = useState('input'); // input | loading | results
    const [data, setData] = useState(null);

    const showScriptResults = useCallback((result) => {
        setData(result);
        setPhase('results');
    }, []);

    const generateScript = useCallback(async () => {
        if (!topic.trim()) { showToast('Please enter a topic', 'warning'); return; }

        setPhase('loading');

        try {
            if (!hasGeminiKey()) {
                await new Promise(r => setTimeout(r, 1500));
                showScriptResults(mockTrendScript);
                showToast('Demo data loaded — add Gemini API key for live generation', 'info');
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
                showScriptResults({
                    module: 'trend_to_script', status: 'success', confidence: 0.91, results: parsed,
                    recommendations: ['Use this hook format for maximum retention', 'Add on-screen text for each value point', 'Keep segments under 60s for repurposing']
                });
            } else {
                showScriptResults(mockTrendScript);
                showToast('Used demo data — could not parse response', 'warning');
            }
        } catch (err) {
            showScriptResults(mockTrendScript);
            showToast('Demo data loaded: ' + err.message, 'warning');
        }
    }, [topic, tone, length, showToast, showScriptResults]);

    const s = data ? (data.results.script || data.results) : null;

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
                            <select className="form-select" value={tone} onChange={e => setTone(e.target.value)}>
                                <option value="casual">🎤 Casual</option>
                                <option value="educational">📚 Educational</option>
                                <option value="storytelling">📖 Storytelling</option>
                                <option value="professional">💼 Professional</option>
                                <option value="humorous">😂 Humorous</option>
                            </select>
                        </div>
                        <div className="form-group mb-lg">
                            <label className="form-label">Target Length</label>
                            <select className="form-select" value={length} onChange={e => setLength(e.target.value)}>
                                <option value="short">Short (1–3 min)</option>
                                <option value="medium">Medium (5–8 min)</option>
                                <option value="long">Long (10–15 min)</option>
                            </select>
                        </div>
                        <div className="flex gap-md">
                            <button className="btn btn-primary" onClick={generateScript}>✨ Generate Script</button>
                            <button className="btn btn-secondary" onClick={() => showScriptResults(mockTrendScript)}>🎯 Demo</button>
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
                                <div className="section-title" style={{ marginBottom: 0 }}><span className="section-icon">📝</span> Generated Script</div>
                                <div className="confidence-bar">
                                    <span className="confidence-label">Confidence</span>
                                    <div className="progress-bar" style={{ width: 80 }}><div className="progress-fill" style={{ width: `${data.confidence * 100}%` }}></div></div>
                                    <span className="confidence-value">{Math.round(data.confidence * 100)}%</span>
                                </div>
                            </div>

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
