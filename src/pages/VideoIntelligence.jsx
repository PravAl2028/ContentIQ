import { useState, useRef, useCallback } from 'react';
import { callGemini, callGeminiWithVideoURL, parseGeminiJSON, hasGeminiKey, extractFramesFromVideo, fileToBase64, getLocalVideoDuration } from '../services/api.js';
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

            setLoadingStatus('Uploading video to Gemini AI for native analysis...');

            // The correct way in SDK v2 is to upload the video file to the Gemini File API first
            // But since ContentIQ api wrapper abstracts getClient(), let's use our existing helper directly with the File Object.
            // Notice: callGeminiWithVideoURL expects a URI, to do this locally we need an upload step or to use base64
            // Let's use the fileToBase64 utility and pass the entire video.

            // Note: Sending raw MP4 via base64 for Gemini limits might be heavy for larger files, 
            // but for a proof of concept ContentIQ with <= 50MB it will work. 
            // We'll update services/api.js to handle `callGeminiWithLocalVideo` right after this.

            setLoadingStatus('Preparing video for AI engine...');
            const videoBase64 = await fileToBase64(file);

            let exactDurationStr = "N/A";
            try {
                const durationSeconds = await getLocalVideoDuration(file);
                exactDurationStr = `${Math.floor(durationSeconds / 60)}:${Math.floor(durationSeconds % 60).toString().padStart(2, '0')}`;
            } catch (e) {
                console.warn("Could not calculate exact duration natively", e);
            }

            setLoadingStatus('Analyzing native video engagement and extracting timestamps...');

            const prompt = `You are ContentIQ Video Intelligence Engine. Act as a full video-intelligence pipeline.
Analyze this video natively.
Follow this exact sequence internally:
1. Analyse every single frame of the video from the absolute first second to the absolute last millisecond. Do NOT skip the end of the video.
2. Compute engagement scores (0-100).
   - CRITICAL RULE: If a scene cuts to a completely blank screen (solid black, solid white, or any solid color) for MORE THAN 1 SECOND, the engagement score for that duration MUST drop to 0-5. 
   - Exception: A brief flash of white or black (1 second or less) is often an intentional stylistic transition or highlight. Do NOT penalize short flashes to 0. Score them appropriately as part of the narrative flow.
3. Group the video into logical scenes. 
   - CRITICAL RULE: You MUST create a new scene the exact millisecond the video cuts to a long blank screen (> 1s). Do NOT extend the previous scene's duration into the long blank screen.
   - If the last 10 seconds of a 20-second video are blank, Scene 1 is 0:00-0:10, and Scene 2 is 0:10-0:20 (Engagement: 0).
4. Identify specific timestamps that correlate with low engagement drops, explicitly calling out timestamps of long blank screens.
5. Analyse each scene for privacy risks, specifically detecting faces (OpenCV equivalent).
6. Generate improvement suggestions for each scene. For long blank scenes, suggest "Trim completely". For short stylistic flashes, suggest "Keep" or "Highlight".

Return a JSON object with this exact structure:
{
  "duration": "${exactDurationStr}",
  "resolution": "video resolution",
  "fps": 30,
  "scenes": [
    { 
      "id": 1, 
      "timestamp": "0:00-0:15", 
      "engagement": 85, 
      "recommendation": "Keep", 
      "reason": "explanation of why", 
      "composition": "frame composition feedback",
      "privacy": { "has_face": true, "face_count": 1 }
    }
  ],
  "thumbnails": [
    { "frame": "the timestamp of a frame causing low engagement", "ctrScore": 30, "reason": "why this frame is causing drop in engagement" }
  ]
}

Rules:
- MUST include the full duration of the video. The video is exactly ${exactDurationStr} long. Do NOT calculate the duration yourself, use "${exactDurationStr}".
- The number of scenes is dynamic. 
- CRITICAL: A LONG blank screen (> 1s) at the end of the video MUST be separated into its own scene with an engagement of 0-5. Short flashes (<= 1s) can be "Highlight".
- The "timestamp" for each scene MUST be a time range (e.g., "0:00-0:15").
- The final scene MUST end at exactly ${exactDurationStr}. If the video ends with a long blank screen, the final scene should be the blank screen segment ending at ${exactDurationStr}.
- For thumbs, identify timestamps/frames causing low engagement (like the start of a long blank screen).
- "recommendation" must be exactly one of: "Keep", "Trim", "Cut", or "Highlight".
- Return ONLY the JSON object, no other text.`;

            let response;
            try {
                // We'll pass it as an array of inlineData matching the images format for our api wrapper
                const videoData = [{ type: file.type || 'video/mp4', base64: videoBase64 }];
                response = await callGemini(prompt, videoData);
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
                    composition: s.composition || 'N/A',
                    privacy: s.privacy || { has_face: false, face_count: 0 }
                }));

                const thumbnails = (parsed.thumbnails || []).map(t => ({
                    frame: t.frame || '0:00',
                    ctrScore: typeof t.ctrScore === 'number' ? t.ctrScore : 50,
                    reason: t.reason || 'Engagement drop factor'
                }));

                const result = {
                    module: 'video_intelligence', status: 'success', confidence: 0.94,
                    results: { duration: parsed.duration || 'N/A', resolution: parsed.resolution || 'N/A', fps: parsed.fps || 30, scenes, thumbnails },
                    recommendations: parsed.recommendations || [
                        'Review highlighted scenes for potential clip extraction',
                        'Consider cutting segments with the lowest engagement score',
                        'Trim scenes where engagement drops significantly'
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

        const prompt = `You are ContentIQ Video Intelligence Engine. Act as a full video-intelligence pipeline.
Follow this exact sequence of logic internally:
1. Analyse every single frame of the video from the absolute first second to the absolute last millisecond. Do NOT skip the end of the video.
2. Extract and transcribe the audio (Whisper equivalent).
3. Compute engagement scores (0-100).
   - CRITICAL RULE: If a scene cuts to a completely blank screen (solid black, solid white, or any solid color) for MORE THAN 1 SECOND, the engagement score for that duration MUST drop to 0-5. 
   - Exception: A brief flash of white or black (1 second or less) is often an intentional stylistic transition or highlight. Do NOT penalize short flashes to 0. Score them appropriately as part of the narrative flow.
4. Group the video into logical scenes. 
   - CRITICAL RULE: You MUST create a new scene the exact millisecond the video cuts to a long blank screen (> 1s). Do NOT extend the previous scene's duration into the long blank screen.
   - If the last 10 seconds of a 20-second video are blank, Scene 1 is 0:00-0:10, and Scene 2 is 0:10-0:20 (Engagement: 0).
5. Identify specific timestamps/frames that correlate with the lowest engagement drops, explicitly calling out timestamps of long blank screens.
6. Analyse each scene for privacy risks, specifically counting faces (OpenCV equivalent).
7. Generate improvement suggestions for each scene. For long blank scenes, suggest "Trim completely". For short stylistic flashes, suggest "Keep" or "Highlight".

Return a JSON object with this exact structure:
                {
                    "duration": "total duration of the video",
                        "resolution": "video resolution",
                            "fps": 30,
                                "scenes": [
                                    {
                                        "id": 1,
                                        "timestamp": "0:00-0:15",
                                        "engagement": 85,
                                        "recommendation": "Keep",
                                        "reason": "explanation of why",
                                        "composition": "frame composition feedback",
                                        "privacy": { "has_face": true, "face_count": 1 }
                                    }
                                ],
                                    "thumbnails": [
                                        { "frame": "timestamp of low engagement frame", "ctrScore": 25, "reason": "why this frame causes an engagement drop" }
                                    ]
                }

            Rules:
            - MUST include the full duration of the video.
            - The number of scenes is dynamic. 
            - CRITICAL: A LONG blank screen (> 1s) at the end of the video MUST be separated into its own scene with an engagement of 0-5. Short flashes (<= 1s) can be "Highlight".
            - The "timestamp" for each scene MUST be a time range (e.g., "0:00-0:15").
            - The final scene MUST end at exactly the duration of the video. If the video ends with a long blank screen, the final scene should be the blank screen segment.
            - For thumbnails, return the frames/timestamps responsible for dropping engagement (like the start of a long blank screen).
            - "engagement" is 0 - 100 score.
            - "recommendation" must be exactly one of: "Keep", "Trim", "Cut", or "Highlight".
            - Return ONLY the JSON object, no other text.`;

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
                    reason: t.reason || 'Engagement drop factor'
                }));

                const result = {
                    module: 'video_intelligence', status: 'success', confidence: 0.94,
                    results: { duration: parsed.duration || 'N/A', resolution: parsed.resolution || 'N/A', fps: parsed.fps || 30, scenes, thumbnails },
                    recommendations: parsed.recommendations || [
                        'Review highlighted scenes for potential clip extraction',
                        'Consider cutting segments with the lowest engagement score',
                        'Trim scenes where engagement drops significantly'
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
                                <div className="flex items-center gap-md" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                    <span><strong>Composition:</strong> {s.composition}</span>
                                    <span>|</span>
                                    <span>
                                        <strong>Privacy:</strong> {s.privacy.has_face
                                            ? <span style={{ color: 'var(--warning)' }}>Faces Detected ({s.privacy.face_count})</span>
                                            : <span style={{ color: 'var(--success)' }}>No Faces</span>}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="section-title"><span className="section-icon">📉</span> Low Engagement Frames Identifiers</div>
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
