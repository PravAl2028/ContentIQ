import { useState, useCallback } from 'react';
import { callGemini, parseGeminiJSON, hasGeminiKey, elevenLabsTTS, hasElevenLabsKey } from '../services/api.js';
import { mockDubbing } from '../services/mockData.js';
import { useToast } from '../context/ToastContext.jsx';

export default function Dubbing() {
    const { showToast } = useToast();
    const [transcriptText, setTranscriptText] = useState("What if I told you there are 5 AI tools that replaced my entire virtual assistant? And they're all free. Let me show you Tool number one — Notion AI. This tool is an absolute game-changer for organizing your workflow. Drop a comment and smash subscribe!");
    const [source, setSource] = useState('English');
    const [target, setTarget] = useState('Spanish');
    const [phase, setPhase] = useState('input');
    const [loadingText, setLoadingText] = useState('Translating with emotional intent...');
    const [data, setData] = useState(null);

    const showDubResults = useCallback((result) => {
        setData(result);
        setPhase('results');
    }, []);

    const generateDub = useCallback(async () => {
        if (!transcriptText.trim()) { showToast('Please enter a transcript', 'warning'); return; }
        setPhase('loading');

        try {
            if (!hasGeminiKey()) {
                await new Promise(r => setTimeout(r, 2000));
                showDubResults(mockDubbing);
                showToast('Demo data loaded', 'info');
                return;
            }

            setLoadingText('Translating with Gemini...');

            const prompt = `Translate this ${source} transcript to ${target}, preserving emotional intent. Split into segments.

Transcript: "${transcriptText}"

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
                const result = { module: 'multilingual_dubbing', status: 'success', confidence: 0.90, results: parsed, recommendations: ['Use ElevenLabs voice cloning for natural delivery', 'Adjust pacing for target language'] };

                if (hasElevenLabsKey()) {
                    setLoadingText('Generating voice with ElevenLabs...');
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
            showToast('Demo data loaded: ' + err.message, 'warning');
        }
    }, [transcriptText, source, target, showToast, showDubResults]);

    const r = data?.results;

    return (
        <div className="page-enter">
            <div className="page-header">
                <h1>🌐 Multilingual Dubbing & Voice</h1>
                <p>Translate scripts and generate emotion-matched voice dubbing with ElevenLabs</p>
            </div>

            <div className="two-panel">
                <div>
                    <div className="glass-card-static mb-lg">
                        <div className="section-title"><span className="section-icon">📝</span> Input</div>
                        <div className="form-group mb-lg">
                            <label className="form-label">Original Transcript</label>
                            <textarea className="form-textarea" rows="6" value={transcriptText} onChange={e => setTranscriptText(e.target.value)} placeholder="Paste your video transcript..." />
                        </div>
                        <div className="grid-2 mb-lg">
                            <div className="form-group">
                                <label className="form-label">Source Language</label>
                                <select className="form-select" value={source} onChange={e => setSource(e.target.value)}>
                                    <option value="English">English</option>
                                    <option value="Spanish">Spanish</option>
                                    <option value="French">French</option>
                                    <option value="German">German</option>
                                    <option value="Japanese">Japanese</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Target Language</label>
                                <select className="form-select" value={target} onChange={e => setTarget(e.target.value)}>
                                    <option value="Spanish">🇪🇸 Spanish</option>
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
                        <div className="flex gap-md">
                            <button className="btn btn-primary" onClick={generateDub}>🌐 Translate & Dub</button>
                            <button className="btn btn-secondary" onClick={() => showDubResults(mockDubbing)}>🎯 Demo</button>
                        </div>
                    </div>
                </div>

                <div>
                    {phase === 'loading' && (
                        <div className="glass-card-static">
                            <div className="flex flex-col items-center justify-center gap-md" style={{ padding: 60 }}>
                                <div className="spinner"></div>
                                <div className="loading-text">{loadingText}</div>
                                <div className="pulse-loader"><span></span><span></span><span></span></div>
                            </div>
                        </div>
                    )}

                    {phase === 'results' && r && (
                        <div className="glass-card-static mb-lg">
                            <div className="flex items-center justify-between mb-lg">
                                <div className="section-title" style={{ marginBottom: 0 }}><span className="section-icon">🌐</span> {r.sourceLanguage} → {r.targetLanguage}</div>
                                <div className="confidence-bar">
                                    <span className="confidence-label">Confidence</span>
                                    <div className="progress-bar" style={{ width: 80 }}><div className="progress-fill" style={{ width: `${data.confidence * 100}%` }}></div></div>
                                    <span className="confidence-value">{Math.round(data.confidence * 100)}%</span>
                                </div>
                            </div>

                            {data.audioPreview && (
                                <div className="audio-player mb-lg">
                                    <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' }}>🔊 Preview</span>
                                    <audio controls src={data.audioPreview} style={{ flex: 1, height: 32 }}></audio>
                                    <a href={data.audioPreview} download="dubbing_preview.mp3" className="download-btn">⬇ Download</a>
                                </div>
                            )}

                            <div className="section-title"><span className="section-icon">📜</span> Translated Segments</div>
                            {r.segments.map(s => (
                                <div className="script-block" key={s.id} style={{ borderLeft: '3px solid var(--purple-light)' }}>
                                    <div className="flex items-center justify-between mb-sm">
                                        <h3 style={{ marginBottom: 0 }}>Segment {s.id}</h3>
                                        <span className="tone-annotation">{s.tone}</span>
                                    </div>
                                    <div className="grid-2 gap-md">
                                        <div>
                                            <div className="form-label" style={{ marginBottom: 4 }}>Original</div>
                                            <p style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>{s.original}</p>
                                        </div>
                                        <div>
                                            <div className="form-label" style={{ marginBottom: 4 }}>Translated</div>
                                            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{s.translated}</p>
                                        </div>
                                    </div>
                                    <div style={{ marginTop: 8, padding: '6px 10px', background: 'rgba(96,165,250,0.06)', borderRadius: 6 }}>
                                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--info)' }}>🎬 Direction:</span>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginLeft: 6 }}>{s.direction}</span>
                                    </div>
                                </div>
                            ))}

                            <div className="section-title mt-lg"><span className="section-icon">🎛️</span> Voice Settings</div>
                            <div className="grid-3 gap-md">
                                <div className="glass-card" style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 4 }}>Stability</div>
                                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--purple-glow)' }}>{r.voiceSettings.stability}</div>
                                </div>
                                <div className="glass-card" style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 4 }}>Similarity</div>
                                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--purple-glow)' }}>{r.voiceSettings.similarity_boost}</div>
                                </div>
                                <div className="glass-card" style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 4 }}>Style</div>
                                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--purple-glow)' }}>{r.voiceSettings.style}</div>
                                </div>
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
                                <span className="empty-state-icon">🌐</span>
                                <div className="empty-state-title">No Dubbing Generated</div>
                                <div className="empty-state-text">Enter a transcript, pick a target language, and click Translate & Dub.</div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
