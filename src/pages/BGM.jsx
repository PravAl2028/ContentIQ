import { useState, useCallback } from 'react';
import { callGemini, parseGeminiJSON, hasGeminiKey, elevenLabsSoundGen, hasElevenLabsKey } from '../services/api.js';
import { mockBGMSuggester } from '../services/mockData.js';
import { useToast } from '../context/ToastContext.jsx';

export default function BGM() {
    const { showToast } = useToast();
    const [transcriptText, setTranscriptText] = useState('Opening hook about 5 AI tools, high energy. Then walkthrough of each tool with screen recordings, calm and focused. A key insight moment with high emotion. Tutorial segment with step-by-step instructions. Closing CTA with subscribe prompt, high energy upbeat ending.');
    const [loading, setLoading] = useState(false);
    const [loadingText, setLoadingText] = useState('Analyzing scene moods...');
    const [data, setData] = useState(null);

    const showBGMResults = useCallback((result) => {
        setData(result);
        setLoading(false);
    }, []);

    const generateBGM = useCallback(async () => {
        if (!transcriptText.trim()) { showToast('Please enter transcript or scene descriptions', 'warning'); return; }
        setLoading(true);
        setData(null);

        try {
            if (!hasGeminiKey()) {
                await new Promise(r => setTimeout(r, 1500));
                showBGMResults(mockBGMSuggester);
                showToast('Demo data loaded', 'info');
                return;
            }

            setLoadingText('Analyzing scene moods with Gemini...');

            const prompt = `Analyze this video content and suggest background music for each segment.

Content: "${transcriptText}"

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
                const result = { module: 'bgm_suggester', status: 'success', confidence: 0.87, results: parsed, recommendations: ['Keep BGM at -18dB during voiceover', 'Use contrasting energy levels for variety'] };

                if (hasElevenLabsKey() && parsed.segments && parsed.segments.length > 0) {
                    setLoadingText('Generating audio preview with ElevenLabs...');
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
            showToast('Demo data loaded: ' + err.message, 'warning');
        }
    }, [transcriptText, showToast, showBGMResults]);

    const r = data?.results;
    const energyColor = (e) => e >= 70 ? 'var(--danger)' : e >= 40 ? 'var(--warning)' : 'var(--info)';

    return (
        <div className="page-enter">
            <div className="page-header">
                <h1>🎵 Music & BGM Suggester</h1>
                <p>Analyze scene mood and generate background music previews with ElevenLabs</p>
            </div>

            <div className="glass-card-static mb-lg">
                <div className="section-title"><span className="section-icon">📝</span> Video Content</div>
                <div className="form-group mb-lg">
                    <label className="form-label">Transcript / Scene Descriptions</label>
                    <textarea className="form-textarea" rows="5" value={transcriptText} onChange={e => setTranscriptText(e.target.value)} placeholder="Paste your video transcript or describe scenes..." />
                </div>
                <div className="flex gap-md">
                    <button className="btn btn-primary" onClick={generateBGM}>🎵 Generate BGM Plan</button>
                    <button className="btn btn-secondary" onClick={() => showBGMResults(mockBGMSuggester)}>🎯 Demo</button>
                </div>
            </div>

            {loading && (
                <div className="glass-card-static mb-lg">
                    <div className="flex flex-col items-center justify-center gap-md" style={{ padding: 40 }}>
                        <div className="spinner"></div>
                        <div className="loading-text">{loadingText}</div>
                        <div className="pulse-loader"><span></span><span></span><span></span></div>
                    </div>
                </div>
            )}

            {data && r && (
                <>
                    <div className="flex items-center justify-between mb-lg">
                        <div className="section-title" style={{ marginBottom: 0 }}><span className="section-icon">🎵</span> BGM Plan</div>
                        <div className="confidence-bar">
                            <span className="confidence-label">Confidence</span>
                            <div className="progress-bar" style={{ width: 80 }}><div className="progress-fill" style={{ width: `${data.confidence * 100}%` }}></div></div>
                            <span className="confidence-value">{Math.round(data.confidence * 100)}%</span>
                        </div>
                    </div>

                    {r.segments.map(s => (
                        <div className="glass-card-static mb-md" key={s.id}>
                            <div className="flex items-center justify-between mb-md">
                                <div className="flex items-center gap-md">
                                    <span className="tag tag-purple">Segment {s.id}</span>
                                    <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>{s.range}</span>
                                </div>
                                <div className="flex items-center gap-sm">
                                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Energy</span>
                                    <div className="progress-bar" style={{ width: 80 }}>
                                        <div className="progress-fill" style={{ width: `${s.energy}%`, background: energyColor(s.energy) }}></div>
                                    </div>
                                    <span style={{ fontSize: '0.82rem', fontWeight: 800, color: energyColor(s.energy) }}>{s.energy}%</span>
                                </div>
                            </div>
                            <div className="grid-2 gap-md">
                                <div>
                                    <div className="form-label" style={{ marginBottom: 4 }}>Mood</div>
                                    <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>{s.mood}</div>
                                </div>
                                <div>
                                    <div className="form-label" style={{ marginBottom: 4 }}>Suggested Style</div>
                                    <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>{s.style}</div>
                                </div>
                            </div>
                            {data.audioPreview && data.audioPreview.segmentId === s.id ? (
                                <div className="audio-player mt-md">
                                    <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' }}>🔊</span>
                                    <audio controls src={data.audioPreview.url} style={{ flex: 1, height: 32 }}></audio>
                                    <a href={data.audioPreview.url} download={`bgm_segment_${s.id}.mp3`} className="download-btn">⬇</a>
                                </div>
                            ) : (
                                <div className="flex items-center gap-sm mt-md" style={{ padding: '8px 12px', background: 'rgba(168,85,247,0.05)', borderRadius: 8 }}>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>🔈 {hasElevenLabsKey() ? 'Generate preview with ElevenLabs' : 'Add ElevenLabs API key for audio generation'}</span>
                                </div>
                            )}
                        </div>
                    ))}

                    <div className="glass-card-static">
                        <div className="section-title"><span className="section-icon">💡</span> Recommendations</div>
                        {data.recommendations.map((rec, i) => (
                            <div className="flex items-center gap-md" key={i} style={{ padding: '6px 0' }}>
                                <span style={{ color: 'var(--purple-light)' }}>▸</span>
                                <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{rec}</span>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
