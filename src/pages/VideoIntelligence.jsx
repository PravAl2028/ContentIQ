import { useState, useRef, useCallback } from 'react';
import { callGemini, callGeminiWithVideoURL, parseGeminiJSON, hasGeminiKey, extractFramesFromVideo } from '../services/api.js';
import { mockVideoIntelligence } from '../services/mockData.js';
import { useToast } from '../context/ToastContext.jsx';

function getEngagementColor(score) {
    if (score >= 80) return 'var(--success)';
    if (score >= 60) return 'var(--warning)';
    return 'var(--danger)';
}

export default function VideoIntelligence() {
    const { showToast } = useToast();
    const [phase, setPhase] = useState('upload'); // upload | loading | results
    const [loadingStatus, setLoadingStatus] = useState('Extracting frames...');
    const [data, setData] = useState(null);
    const fileInputRef = useRef(null);
    const [dragOver, setDragOver] = useState(false);
    const [videoUrl, setVideoUrl] = useState('');

    const showResults = useCallback((result) => {
        setData(result);
        setPhase('results');
    }, []);

    const processVideo = useCallback(async (file) => {
        setPhase('loading');
        try {
            if (!hasGeminiKey()) {
                setLoadingStatus('No API key — loading demo data...');
                await new Promise(r => setTimeout(r, 2000));
                showResults(mockVideoIntelligence);
                return;
            }

            setLoadingStatus('Extracting frames from video...');
            let frames;
            try {
                frames = await extractFramesFromVideo(file, 4);
            } catch (frameErr) {
                setLoadingStatus('Frame extraction failed — loading demo...');
                showToast('Frame extraction failed: ' + frameErr.message, 'error');
                await new Promise(r => setTimeout(r, 1500));
                showResults(mockVideoIntelligence);
                return;
            }

            if (!frames || frames.length === 0) {
                showToast('No frames extracted — loading demo data', 'warning');
                showResults(mockVideoIntelligence);
                return;
            }

            setLoadingStatus(`Sending ${frames.length} frames to Gemini AI...`);
            const images = frames.map(f => ({ type: 'image/jpeg', base64: f.base64 }));

            const prompt = `You are ContentIQ Video Intelligence Engine. Analyze these ${frames.length} video frames extracted at equal intervals and return a JSON object with this exact structure:
{
  "duration": "estimated total duration based on frame count and intervals",
  "resolution": "estimated resolution",
  "fps": 30,
  "scenes": [
    { "id": 1, "timestamp": "0:00-0:30", "engagement": 85, "recommendation": "Keep", "reason": "explanation of why", "composition": "frame composition feedback" }
  ],
  "thumbnails": [
    { "frame": "0:05", "ctrScore": 88, "reason": "why this frame would make a good thumbnail" }
  ]
}

Rules:
- Each frame represents a different scene/segment
- "engagement" is 0-100 score
- "recommendation" must be exactly one of: "Keep", "Trim", "Cut", or "Highlight"
- Provide 2-3 thumbnail suggestions from the best frames
- Return ONLY the JSON object, no other text`;

            let response;
            try {
                response = await callGemini(prompt, images);
            } catch (apiErr) {
                setLoadingStatus('API error — loading demo data...');
                showToast('Gemini API error: ' + apiErr.message, 'error');
                await new Promise(r => setTimeout(r, 1500));
                showResults(mockVideoIntelligence);
                return;
            }

            setLoadingStatus('Processing AI response...');
            const parsed = parseGeminiJSON(response);

            if (parsed) {
                const scenes = (parsed.scenes || []).map((s, idx) => ({
                    id: s.id || idx + 1,
                    timestamp: s.timestamp || `Scene ${idx + 1}`,
                    engagement: typeof s.engagement === 'number' ? s.engagement : 50,
                    recommendation: ['Keep', 'Trim', 'Cut', 'Highlight'].includes(s.recommendation) ? s.recommendation : 'Keep',
                    reason: s.reason || 'No analysis available',
                    composition: s.composition || 'N/A'
                }));

                const thumbnails = (parsed.thumbnails || []).map(t => ({
                    frame: t.frame || '0:00',
                    ctrScore: typeof t.ctrScore === 'number' ? t.ctrScore : 50,
                    reason: t.reason || 'Potential thumbnail candidate'
                }));

                const result = {
                    module: 'video_intelligence', status: 'success', confidence: 0.94,
                    results: { duration: parsed.duration || 'N/A', resolution: parsed.resolution || 'N/A', fps: parsed.fps || 30, scenes, thumbnails },
                    recommendations: parsed.recommendations || [
                        'Review highlighted scenes for potential clip extraction',
                        'Use highest CTR thumbnail for primary video thumbnail',
                        'Consider trimming low-engagement scenes for better retention'
                    ]
                };
                showResults(result);
                showToast('Video analysis complete!', 'success');
            } else {
                showResults(mockVideoIntelligence);
                showToast('Could not parse AI response — showing demo data', 'warning');
            }
        } catch (err) {
            setLoadingStatus('Error — loading demo data...');
            showResults(mockVideoIntelligence);
            showToast('Error: ' + err.message + ' — showing demo data', 'error');
        }
    }, [showToast, showResults]);

    const processVideoURL = useCallback(async () => {
        if (!videoUrl.trim()) { showToast('Please enter a video URL', 'warning'); return; }
        if (!hasGeminiKey()) { showToast('Gemini API key required for URL analysis — add it in Settings', 'warning'); return; }

        setPhase('loading');
        setLoadingStatus('Sending video URL to Gemini AI...');

        const prompt = `You are ContentIQ Video Intelligence Engine. Analyze this video and return a JSON object with this exact structure:
{
  "duration": "total duration of the video",
  "resolution": "video resolution",
  "fps": 30,
  "scenes": [
    { "id": 1, "timestamp": "0:00-0:30", "engagement": 85, "recommendation": "Keep", "reason": "explanation of why", "composition": "frame composition feedback" }
  ],
  "thumbnails": [
    { "frame": "0:05", "ctrScore": 88, "reason": "why this frame would make a good thumbnail" }
  ]
}

Rules:
- Break the video into logical scenes/segments (at least 4-8 scenes)
- "engagement" is 0-100 score based on visual interest, pacing, and content quality
- "recommendation" must be exactly one of: "Keep", "Trim", "Cut", or "Highlight"
- Provide 2-3 thumbnail suggestions from the best moments
- Return ONLY the JSON object, no other text`;

        try {
            const response = await callGeminiWithVideoURL(prompt, videoUrl.trim());

            setLoadingStatus('Processing AI response...');
            const parsed = parseGeminiJSON(response);

            if (parsed) {
                const scenes = (parsed.scenes || []).map((s, idx) => ({
                    id: s.id || idx + 1,
                    timestamp: s.timestamp || `Scene ${idx + 1}`,
                    engagement: typeof s.engagement === 'number' ? s.engagement : 50,
                    recommendation: ['Keep', 'Trim', 'Cut', 'Highlight'].includes(s.recommendation) ? s.recommendation : 'Keep',
                    reason: s.reason || 'No analysis available',
                    composition: s.composition || 'N/A'
                }));

                const thumbnails = (parsed.thumbnails || []).map(t => ({
                    frame: t.frame || '0:00',
                    ctrScore: typeof t.ctrScore === 'number' ? t.ctrScore : 50,
                    reason: t.reason || 'Potential thumbnail candidate'
                }));

                const result = {
                    module: 'video_intelligence', status: 'success', confidence: 0.94,
                    results: { duration: parsed.duration || 'N/A', resolution: parsed.resolution || 'N/A', fps: parsed.fps || 30, scenes, thumbnails },
                    recommendations: parsed.recommendations || [
                        'Review highlighted scenes for potential clip extraction',
                        'Use highest CTR thumbnail for primary video thumbnail',
                        'Consider trimming low-engagement scenes for better retention'
                    ]
                };
                showResults(result);
                showToast('Video analysis complete!', 'success');
            } else {
                showResults(mockVideoIntelligence);
                showToast('Could not parse AI response — showing demo data', 'warning');
            }
        } catch (err) {
            setLoadingStatus('Error — loading demo data...');
            showResults(mockVideoIntelligence);
            showToast('Error: ' + err.message + ' — showing demo data', 'error');
        }
    }, [videoUrl, showToast, showResults]);

    const handleDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        if (e.dataTransfer.files[0]) processVideo(e.dataTransfer.files[0]);
    };

    return (
        <div className="page-enter">
            <div className="page-header">
                <h1>🎬 Video Intelligence Engine</h1>
                <p>Upload a video or paste a link to analyze scenes, engagement, and find the best thumbnails</p>
            </div>

            {/* Upload Section */}
            {phase === 'upload' && (
                <div className="glass-card-static mb-lg">
                    <div
                        className={`upload-zone${dragOver ? ' drag-over' : ''}`}
                        onClick={() => fileInputRef.current?.click()}
                        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={handleDrop}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="video/mp4,video/quicktime,video/mov"
                            style={{ display: 'none' }}
                            onChange={(e) => { if (e.target.files[0]) processVideo(e.target.files[0]); }}
                        />
                        <span className="upload-icon">🎬</span>
                        <div className="upload-text">Drop your video here or click to upload</div>
                        <div className="upload-subtext">Supports MP4, MOV • Max 500MB</div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', margin: 'var(--space-lg) 0' }}>
                        <div style={{ flex: 1, height: 1, background: 'var(--glass-border)' }}></div>
                        <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>or paste a video link</span>
                        <div style={{ flex: 1, height: 1, background: 'var(--glass-border)' }}></div>
                    </div>

                    <div className="flex gap-md items-center">
                        <input
                            type="url"
                            className="form-input"
                            placeholder="Paste a YouTube or video URL..."
                            value={videoUrl}
                            onChange={(e) => setVideoUrl(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') processVideoURL(); }}
                            style={{ flex: 1 }}
                        />
                        <button className="btn btn-primary" onClick={processVideoURL} disabled={!videoUrl.trim()}>🔗 Analyze URL</button>
                    </div>

                    <div className="flex items-center justify-between mt-md">
                        <button className="btn btn-secondary btn-sm" onClick={() => showResults(mockVideoIntelligence)}>🎯 Load Demo Data</button>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {hasGeminiKey() ? '🟢 Gemini API Connected' : '🟡 No API Key — Demo mode available'}
                        </span>
                    </div>
                </div>
            )}

            {/* Loading */}
            {phase === 'loading' && (
                <div className="glass-card-static mb-lg">
                    <div className="flex flex-col items-center justify-center gap-md" style={{ padding: 40 }}>
                        <div className="spinner"></div>
                        <div className="loading-text">Analyzing your video with Gemini AI...</div>
                        <div className="pulse-loader"><span></span><span></span><span></span></div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 8 }}>{loadingStatus}</div>
                    </div>
                </div>
            )}

            {/* Results */}
            {phase === 'results' && data && <ResultsView data={data} onReset={() => setPhase('upload')} />}
        </div>
    );
}

function ResultsView({ data, onReset }) {
    const r = data.results;
    const scenes = r.scenes || [];
    const thumbs = r.thumbnails || [];

    return (
        <>
            <div className="flex items-center justify-between mb-lg">
                <div className="section-title" style={{ marginBottom: 0 }}><span className="section-icon">📊</span> Analysis Results</div>
                <div className="flex items-center gap-md">
                    <div className="confidence-bar">
                        <span className="confidence-label">Confidence</span>
                        <div className="progress-bar" style={{ width: 120 }}>
                            <div className="progress-fill" style={{ width: `${data.confidence * 100}%` }}></div>
                        </div>
                        <span className="confidence-value">{Math.round(data.confidence * 100)}%</span>
                    </div>
                    <button className="btn btn-secondary btn-sm" onClick={onReset}>↺ New Analysis</button>
                </div>
            </div>

            <div className="grid-3 mb-lg">
                <div className="glass-card stat-card">
                    <div className="stat-label">Duration</div>
                    <div className="stat-value">{r.duration || 'N/A'}</div>
                </div>
                <div className="glass-card stat-card">
                    <div className="stat-label">Resolution</div>
                    <div className="stat-value">{r.resolution || 'N/A'}</div>
                </div>
                <div className="glass-card stat-card">
                    <div className="stat-label">Scenes Detected</div>
                    <div className="stat-value">{scenes.length}</div>
                </div>
            </div>

            <div className="section-title"><span className="section-icon">🎬</span> Scene-by-Scene Analysis</div>
            <div className="glass-card-static mb-lg">
                <div className="scene-timeline">
                    {scenes.map(s => (
                        <div className="scene-item" key={s.id}>
                            <div style={{ minWidth: 100 }}>
                                <div className="scene-timestamp">{s.timestamp}</div>
                                <div style={{ marginTop: 8 }}>
                                    <span className={`scene-rec rec-${s.recommendation.toLowerCase()}`}>{s.recommendation}</span>
                                </div>
                            </div>
                            <div className="scene-details">
                                <div className="flex items-center justify-between mb-sm">
                                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>Scene {s.id}</span>
                                    <div className="flex items-center gap-sm">
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Engagement</span>
                                        <div className="progress-bar" style={{ width: 80 }}>
                                            <div className="progress-fill" style={{ width: `${s.engagement}%`, background: getEngagementColor(s.engagement) }}></div>
                                        </div>
                                        <span style={{ fontSize: '0.82rem', fontWeight: 800, color: getEngagementColor(s.engagement) }}>{s.engagement}%</span>
                                    </div>
                                </div>
                                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 6 }}>{s.reason}</p>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}><strong>Composition:</strong> {s.composition}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="section-title"><span className="section-icon">🖼️</span> Best Thumbnail Frames</div>
            <div className="glass-card-static mb-lg">
                <div className="grid-3">
                    {thumbs.map((t, i) => (
                        <div className="glass-card" key={i} style={{ textAlign: 'center' }}>
                            <div style={{ width: 64, height: 64, borderRadius: '50%', margin: '0 auto 12px', background: 'var(--glass-bg-active)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--purple-glow)' }}>{t.ctrScore}</span>
                            </div>
                            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Frame @ {t.frame}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{t.reason}</div>
                            <div className="tag tag-purple mt-md" style={{ margin: '8px auto 0' }}>CTR Score: {t.ctrScore}%</div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="section-title"><span className="section-icon">💡</span> Recommendations</div>
            <div className="glass-card-static">
                {data.recommendations.map((rec, i) => (
                    <div className="flex items-center gap-md" key={i} style={{ padding: '8px 0', borderBottom: '1px solid rgba(168,85,247,0.06)' }}>
                        <span style={{ color: 'var(--purple-light)' }}>▸</span>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{rec}</span>
                    </div>
                ))}
            </div>
        </>
    );
}
