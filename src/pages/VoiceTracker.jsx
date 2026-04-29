import { useState, useCallback } from 'react';
import { callGemini, parseGeminiJSON, hasGeminiKey } from '../services/api.js';
import { mockVoiceTracker } from '../services/mockData.js';
import { useToast } from '../context/ToastContext.jsx';

export default function VoiceTracker() {
    const { showToast } = useToast();
    const [bio, setBio] = useState('Tech content creator focused on AI tools and productivity hacks. Casual, energetic style aimed at 20-35 professionals. Known for honest, no-nonsense reviews.');
    const [transcript, setTranscript] = useState("Hey what's up everyone! So today I found something that's a total game-changer. Let me show you these five AI tools that literally replaced my virtual assistant. No cap, these are all free and here's the thing — they actually work.");
    const [script, setScript] = useState("Hello viewers. Today we'll leverage these tools to do a deep-dive into AI productivity. In conclusion, these tools provide synergy for your workflow. Let's circle back on the key takeaways.");
    const [phase, setPhase] = useState('input'); // input | loading | results
    const [data, setData] = useState(null);

    const showVoiceResults = useCallback((result) => {
        setData(result);
        setPhase('results');
    }, []);

    const scoreScript = useCallback(async () => {
        setPhase('loading');
        try {
            if (!hasGeminiKey()) {
                await new Promise(r => setTimeout(r, 1500));
                showVoiceResults(mockVoiceTracker);
                showToast('Demo data loaded', 'info');
                return;
            }

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
                showVoiceResults({ module: 'creator_voice_tracker', status: 'success', confidence: 0.88, results: parsed, recommendations: ['Fix flagged phrases for better brand consistency'] });
            } else {
                showVoiceResults(mockVoiceTracker);
            }
        } catch (err) {
            showVoiceResults(mockVoiceTracker);
            showToast('Demo data loaded: ' + err.message, 'warning');
        }
    }, [bio, transcript, script, showToast, showVoiceResults]);

    const r = data?.results;
    const scoreColor = r ? (r.scriptScore >= 80 ? 'var(--success)' : r.scriptScore >= 60 ? 'var(--warning)' : 'var(--danger)') : '';

    return (
        <div className="page-enter">
            <div className="page-header">
                <h1>🎤 Creator Voice Tracker</h1>
                <p>Build your voice profile and score new scripts for brand consistency</p>
            </div>

            <div className="two-panel">
                <div>
                    <div className="glass-card-static mb-lg">
                        <div className="section-title"><span className="section-icon">👤</span> Your Profile</div>
                        <div className="form-group mb-lg">
                            <label className="form-label">Creator Bio</label>
                            <textarea className="form-textarea" rows="3" value={bio} onChange={e => setBio(e.target.value)} placeholder="Describe your brand voice, audience, and content style..." />
                        </div>
                        <div className="form-group mb-lg">
                            <label className="form-label">Past Transcript (Reference)</label>
                            <textarea className="form-textarea" rows="4" value={transcript} onChange={e => setTranscript(e.target.value)} placeholder="Paste a transcript from one of your best-performing videos..." />
                        </div>
                    </div>
                    <div className="glass-card-static">
                        <div className="section-title"><span className="section-icon">📝</span> Script to Score</div>
                        <div className="form-group mb-lg">
                            <label className="form-label">New Script</label>
                            <textarea className="form-textarea" rows="5" value={script} onChange={e => setScript(e.target.value)} placeholder="Paste the new script you want scored..." />
                        </div>
                        <div className="flex gap-md">
                            <button className="btn btn-primary" onClick={scoreScript}>🎯 Score Script</button>
                            <button className="btn btn-secondary" onClick={() => showVoiceResults(mockVoiceTracker)}>Demo</button>
                        </div>
                    </div>
                </div>

                <div>
                    {phase === 'loading' && (
                        <div className="glass-card-static">
                            <div className="flex flex-col items-center justify-center gap-md" style={{ padding: 60 }}>
                                <div className="spinner"></div>
                                <div className="loading-text">Analyzing brand voice consistency...</div>
                                <div className="pulse-loader"><span></span><span></span><span></span></div>
                            </div>
                        </div>
                    )}

                    {phase === 'results' && r && (
                        <>
                            <div className="glass-card-static mb-lg" style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 12 }}>Brand Consistency Score</div>
                                <div style={{ width: 100, height: 100, borderRadius: '50%', border: `4px solid ${scoreColor}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                                    <span style={{ fontSize: '2rem', fontWeight: 900, color: scoreColor }}>{r.scriptScore}</span>
                                </div>
                                <div style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)' }}>
                                    {r.scriptScore >= 80 ? 'Great match!' : r.scriptScore >= 60 ? 'Needs some adjustments' : 'Significant mismatch'}
                                </div>
                            </div>

                            <div className="glass-card-static mb-lg">
                                <div className="section-title"><span className="section-icon">👤</span> Voice Profile</div>
                                <div className="grid-2 gap-md">
                                    <div><span className="form-label">Tone</span><p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 4 }}>{r.voiceProfile.tone}</p></div>
                                    <div><span className="form-label">Energy</span><p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 4 }}>{r.voiceProfile.energy}</p></div>
                                </div>
                                <div className="mt-md"><span className="form-label">Vocabulary</span><p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 4 }}>{r.voiceProfile.vocabulary}</p></div>
                                <div className="mt-md"><span className="form-label">Signature Phrases</span>
                                    <div className="flex gap-sm mt-sm" style={{ flexWrap: 'wrap' }}>{r.voiceProfile.signature_phrases.map((p, i) => <span className="tag tag-success" key={i}>"{p}"</span>)}</div>
                                </div>
                                <div className="mt-md"><span className="form-label">Avoids</span>
                                    <div className="flex gap-sm mt-sm" style={{ flexWrap: 'wrap' }}>{r.voiceProfile.avoids.map((p, i) => <span className="tag tag-danger" key={i}>"{p}"</span>)}</div>
                                </div>
                            </div>

                            {r.flags.length > 0 && (
                                <div className="glass-card-static mb-lg">
                                    <div className="section-title"><span className="section-icon">⚠️</span> Off-Brand Flags</div>
                                    {r.flags.map((f, i) => (
                                        <div className="scene-item" key={i} style={{ borderLeft: '3px solid var(--warning)' }}>
                                            <div className="scene-details">
                                                <div className="flex items-center gap-md mb-sm">
                                                    <span className="tag tag-danger">"{f.phrase}"</span>
                                                    <span style={{ color: 'var(--text-muted)' }}>→</span>
                                                    <span className="tag tag-success">"{f.suggestion}"</span>
                                                </div>
                                                <p style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>{f.reason}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="glass-card-static">
                                <div className="section-title"><span className="section-icon">✅</span> Strengths</div>
                                {r.strengths.map((s, i) => (
                                    <div className="flex items-center gap-md" key={i} style={{ padding: '6px 0' }}>
                                        <span style={{ color: 'var(--success)' }}>✓</span>
                                        <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{s}</span>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}

                    {phase === 'input' && (
                        <div className="glass-card-static">
                            <div className="empty-state">
                                <span className="empty-state-icon">🎤</span>
                                <div className="empty-state-title">No Voice Analysis Yet</div>
                                <div className="empty-state-text">Enter your profile and a script to score, then click Score Script.</div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
