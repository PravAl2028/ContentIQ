import { useState, useRef, useCallback } from 'react';
import { callGemini, parseGeminiJSON, hasGeminiKey, fileToBase64 } from '../services/api.js';
import { mockThumbnailAnalysis } from '../services/mockData.js';
import { useToast } from '../context/ToastContext.jsx';

export default function Thumbnail() {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = useRef(null);

    const showThumbnailResults = useCallback((result) => {
        setData(result);
        setLoading(false);
    }, []);

    const analyzeImage = useCallback(async (file) => {
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
        setLoading(true);
        setData(null);

        try {
            if (!hasGeminiKey()) {
                await new Promise(r => setTimeout(r, 2000));
                showThumbnailResults(mockThumbnailAnalysis);
                showToast('Demo data loaded', 'info');
                return;
            }

            const base64 = await fileToBase64(file);

            const prompt = `Analyze this thumbnail image for YouTube CTR optimization. Return JSON:
{
  "ctrScore": 0-100,
  "contrast": { "score": 0-100, "note": "" },
  "colorPsychology": { "dominant": "#hex", "palette": ["#hex"], "mood": "", "note": "" },
  "textReadability": { "score": 0-100, "note": "" },
  "faceExpression": { "detected": true/false, "expression": "", "note": "" },
  "layout": { "score": 0-100, "improvements": [""] },
  "lutSuggestion": { "name": "", "description": "", "adjustments": { "saturation": "", "warmth": "", "contrast": "", "highlights": "", "shadows": "" } }
}
Return ONLY valid JSON.`;

            const response = await callGemini(prompt, [{ type: file.type, base64 }]);
            const parsed = parseGeminiJSON(response);

            if (parsed) {
                showThumbnailResults({ module: 'thumbnail_analyzer', status: 'success', confidence: 0.93, results: parsed, recommendations: ['Apply suggested LUT for improved engagement'] });
            } else {
                showThumbnailResults(mockThumbnailAnalysis);
            }
        } catch (err) {
            showThumbnailResults(mockThumbnailAnalysis);
            showToast('Demo data loaded: ' + err.message, 'warning');
        }
    }, [showToast, showThumbnailResults]);

    const r = data?.results;
    const ctrColor = r ? (r.ctrScore >= 80 ? 'var(--success)' : r.ctrScore >= 60 ? 'var(--warning)' : 'var(--danger)') : '';

    return (
        <div className="page-enter">
            <div className="page-header">
                <h1>🖼️ Thumbnail & Color Analyzer</h1>
                <p>Analyze contrast, color psychology, text readability, and get LUT suggestions</p>
            </div>

            <div className="glass-card-static mb-lg">
                <div
                    className={`upload-zone${dragOver ? ' drag-over' : ''}`}
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={(e) => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files[0]) analyzeImage(e.dataTransfer.files[0]); }}
                >
                    <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => { if (e.target.files[0]) analyzeImage(e.target.files[0]); }} />
                    <span className="upload-icon">🖼️</span>
                    <div className="upload-text">Drop a thumbnail image or click to upload</div>
                    <div className="upload-subtext">JPG, PNG, WebP supported</div>
                </div>
                <div className="flex items-center justify-between mt-md">
                    <button className="btn btn-secondary btn-sm" onClick={() => showThumbnailResults(mockThumbnailAnalysis)}>🎯 Load Demo Analysis</button>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{hasGeminiKey() ? '🟢 Gemini Connected' : '🟡 Demo mode'}</span>
                </div>
            </div>

            {loading && (
                <div className="glass-card-static mb-lg">
                    <div className="flex flex-col items-center justify-center gap-md" style={{ padding: 40 }}>
                        <div className="spinner"></div>
                        <div className="loading-text">Analyzing thumbnail...</div>
                        <div className="pulse-loader"><span></span><span></span><span></span></div>
                    </div>
                </div>
            )}

            {previewUrl && (
                <div className="mb-lg">
                    <div className="glass-card-static" style={{ textAlign: 'center' }}>
                        <img src={previewUrl} style={{ maxWidth: '100%', maxHeight: 300, borderRadius: 12 }} alt="Thumbnail preview" />
                    </div>
                </div>
            )}

            {data && r && (
                <>
                    <div className="grid-4 mb-lg">
                        <div className="glass-card stat-card" style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 4 }}>CTR Score</div>
                            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: ctrColor }}>{r.ctrScore}</div>
                        </div>
                        <div className="glass-card stat-card" style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 4 }}>Contrast</div>
                            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--purple-glow)' }}>{r.contrast.score}</div>
                        </div>
                        <div className="glass-card stat-card" style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 4 }}>Text Readability</div>
                            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--purple-glow)' }}>{r.textReadability.score}</div>
                        </div>
                        <div className="glass-card stat-card" style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 4 }}>Layout</div>
                            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--purple-glow)' }}>{r.layout.score}</div>
                        </div>
                    </div>

                    <div className="grid-2 mb-lg">
                        <div className="glass-card-static">
                            <div className="section-title"><span className="section-icon">🎨</span> Color Psychology</div>
                            <div className="color-palette mb-md">
                                {(r.colorPsychology.palette || []).map((c, i) => <div className="color-swatch" key={i} style={{ background: c }} title={c}></div>)}
                            </div>
                            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 4 }}><strong>Dominant:</strong> {r.colorPsychology.dominant}</div>
                            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 4 }}><strong>Mood:</strong> {r.colorPsychology.mood}</div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>{r.colorPsychology.note}</div>
                        </div>

                        <div className="glass-card-static">
                            <div className="section-title"><span className="section-icon">😀</span> Face Expression</div>
                            {r.faceExpression.detected ? (
                                <>
                                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--success)', marginBottom: 8 }}>✓ Face Detected</div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 4 }}><strong>Expression:</strong> {r.faceExpression.expression}</div>
                                    <div style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>{r.faceExpression.note}</div>
                                </>
                            ) : (
                                <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>No face detected in thumbnail</div>
                            )}
                            <div className="section-title mt-lg"><span className="section-icon">📐</span> Contrast</div>
                            <p style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>{r.contrast.note}</p>
                        </div>
                    </div>

                    <div className="glass-card-static mb-lg">
                        <div className="section-title"><span className="section-icon">🎬</span> LUT / Color Grading Suggestion</div>
                        <div className="flex items-center gap-lg">
                            <div>
                                <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--purple-glow)', marginBottom: 8 }}>{r.lutSuggestion.name}</div>
                                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 12 }}>{r.lutSuggestion.description}</p>
                                <div className="flex gap-md" style={{ flexWrap: 'wrap' }}>
                                    {Object.entries(r.lutSuggestion.adjustments).map(([k, v]) => (
                                        <span className="tag tag-purple" key={k}>{k}: {v}</span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="glass-card-static mb-lg">
                        <div className="section-title"><span className="section-icon">📐</span> Layout Improvements</div>
                        {(r.layout.improvements || []).map((imp, i) => (
                            <div className="flex items-center gap-md" key={i} style={{ padding: '6px 0' }}>
                                <span style={{ color: 'var(--purple-light)' }}>▸</span>
                                <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{imp}</span>
                            </div>
                        ))}
                    </div>

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
