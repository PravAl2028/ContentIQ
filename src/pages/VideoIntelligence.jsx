import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, Link as LinkIcon, Film, Play, Clock, ZoomIn, Shield, Activity, Target, Scissors, CheckCircle, Info, RefreshCcw, Video } from 'lucide-react';
import { callGemini, callGeminiWithVideoURL, parseGeminiJSON, hasGeminiKey, fileToBase64, getLocalVideoDuration } from '../services/api.js';
import { mockVideoIntelligence } from '../services/mockData.js';
import { useToast } from '../context/ToastContext.jsx';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';

function getEngagementColor(score) {
    if (score >= 80) return 'var(--success)';
    if (score >= 60) return 'var(--warning)';
    return 'var(--danger)';
}

function CircularProgress({ percentage, label }) {
    const radius = 35;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <div style={{ position: 'relative', width: 90, height: 90, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="90" height="90" style={{ transform: 'rotate(-90deg)' }}>
                    <circle cx="45" cy="45" r={radius} stroke="var(--glass-bg-active)" strokeWidth="6" fill="transparent" />
                    <motion.circle
                        initial={{ strokeDashoffset: circumference }}
                        animate={{ strokeDashoffset: offset }}
                        transition={{ duration: 1.5, ease: 'easeOut' }}
                        cx="45" cy="45" r={radius}
                        stroke="url(#progressGradient)" strokeWidth="6" fill="transparent"
                        strokeDasharray={circumference} strokeLinecap="round"
                    />
                    <defs>
                        <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor={getEngagementColor(percentage)} />
                            <stop offset="100%" stopColor="var(--lavender)" />
                        </linearGradient>
                    </defs>
                </svg>
                <div style={{ position: 'absolute', fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>{percentage}%</div>
            </div>
            {label && <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>}
        </div>
    );
}

const TimelineTrimmer = ({ duration, trims, setTrims, activeTrimId, setActiveTrimId, videoRef }) => {
    const trackRef = useRef(null);
    const [draggingHandle, setDraggingHandle] = useState(null);

    const handlePointerDown = (e, handleType) => {
        e.stopPropagation();
        e.preventDefault();
        setDraggingHandle(handleType);
    };

    const playheadRef = useRef(null);
    const playheadLabelRef = useRef(null);

    useEffect(() => {
        let animationFrameId;

        const loop = () => {
            if (videoRef.current && playheadRef.current && playheadLabelRef.current && duration > 0) {
                const ct = videoRef.current.currentTime;
                const pct = (ct / duration) * 100;
                playheadRef.current.style.left = `${pct}%`;
                playheadLabelRef.current.innerText = `${ct.toFixed(1)}s`;
            }
            animationFrameId = requestAnimationFrame(loop);
        };

        animationFrameId = requestAnimationFrame(loop);

        return () => {
            cancelAnimationFrame(animationFrameId);
        };
    }, [videoRef, duration]);

    useEffect(() => {
        const handlePointerMove = (e) => {
            if (!draggingHandle || !trackRef.current) return;
            const rect = trackRef.current.getBoundingClientRect();
            let pos = (e.clientX - rect.left) / rect.width;
            pos = Math.max(0, Math.min(1, pos));
            const newTime = pos * duration;

            if (draggingHandle === 'scrub') {
                // Inverted: Trims are now the deleted parts.
                // Playhead can ONLY exist outside of trims (in the gaps).
                const sorted = [...trims].sort((a, b) => a.start - b.start);
                let inTrim = false;

                for (let i = 0; i < sorted.length; i++) {
                    if (newTime >= sorted[i].start && newTime <= sorted[i].end) {
                        inTrim = true;
                        break;
                    }
                }

                if (inTrim) {
                    // Snap out of the trim to the nearest valid "saved" gap edge
                    let minDist = Infinity;
                    let nearestValidTime = newTime;
                    sorted.forEach(t => {
                        if (Math.abs(newTime - t.start) < minDist) { minDist = Math.abs(newTime - t.start); nearestValidTime = t.start - 0.01; }
                        if (Math.abs(newTime - t.end) < minDist) { minDist = Math.abs(newTime - t.end); nearestValidTime = t.end + 0.01; }
                    });
                    if (videoRef.current) videoRef.current.currentTime = Math.max(0, Math.min(duration, nearestValidTime));
                } else {
                    if (videoRef.current) videoRef.current.currentTime = newTime;
                }
                return;
            }

            if (!activeTrimId) return;

            setTrims(prev => {
                const sorted = [...prev].sort((a, b) => a.start - b.start);
                const idx = sorted.findIndex(t => t.id === activeTrimId);
                const minBound = idx > 0 ? sorted[idx - 1].end : 0;
                const maxBound = idx < sorted.length - 1 ? sorted[idx + 1].start : duration;

                return prev.map(t => {
                    if (t.id === activeTrimId) {
                        if (draggingHandle === 'start') {
                            return { ...t, start: Math.max(minBound, Math.min(newTime, t.end - 0.1)) };
                        } else {
                            return { ...t, end: Math.max(t.start + 0.1, Math.min(newTime, maxBound)) };
                        }
                    }
                    return t;
                });
            });

            if (videoRef.current) {
                videoRef.current.currentTime = newTime;
            }
        };

        const handlePointerUp = () => {
            setDraggingHandle(null);
            document.body.classList.remove('is-dragging-global');
        };

        if (draggingHandle) {
            document.body.classList.add('is-dragging-global');
            window.addEventListener('pointermove', handlePointerMove);
            window.addEventListener('pointerup', handlePointerUp);
        } else {
            document.body.classList.remove('is-dragging-global');
        }

        return () => {
            document.body.classList.remove('is-dragging-global');
            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('pointerup', handlePointerUp);
        };
    }, [draggingHandle, activeTrimId, duration, setTrims, videoRef]);

    return (
        <div style={{ position: 'relative', width: '100%', height: 75, marginTop: 'var(--space-md)', userSelect: 'none' }}>

            {/* Timestamp Timeline Container (Above the trimmer) */}
            <div
                style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 24, borderBottom: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}
                onPointerDown={(e) => {
                    handlePointerDown(e, 'scrub');
                    document.body.classList.add('is-dragging-global');
                    const rect = trackRef.current.getBoundingClientRect();
                    let pos = (e.clientX - rect.left) / rect.width;
                    pos = Math.max(0, Math.min(1, pos));
                    const newTime = pos * duration;
                    const sorted = [...trims].sort((a, b) => a.start - b.start);
                    let inTrim = false;
                    for (let i = 0; i < sorted.length; i++) {
                        if (newTime >= sorted[i].start && newTime <= sorted[i].end) {
                            inTrim = true; break;
                        }
                    }
                    if (inTrim) {
                        let minDist = Infinity;
                        let nearestValidTime = newTime;
                        sorted.forEach(t => {
                            if (Math.abs(newTime - t.start) < minDist) { minDist = Math.abs(newTime - t.start); nearestValidTime = t.start - 0.01; }
                            if (Math.abs(newTime - t.end) < minDist) { minDist = Math.abs(newTime - t.end); nearestValidTime = t.end + 0.01; }
                        });
                        if (videoRef.current) videoRef.current.currentTime = Math.max(0, Math.min(duration, nearestValidTime));
                    } else {
                        if (videoRef.current) videoRef.current.currentTime = newTime;
                    }
                }}
            >
                {/* Playhead Indicator attached to top line */}
                <div
                    ref={playheadRef}
                    style={{
                        position: 'absolute',
                        left: `0%`, /* Controlled by requestAnimationFrame now */
                        top: -5,
                        bottom: -45, /* spans down through the trimmer */
                        width: 2,
                        background: '#fff',
                        boxShadow: '0 0 8px #fff',
                        transform: 'translateX(-50%)',
                        zIndex: 20,
                        pointerEvents: 'none',
                        willChange: 'left'
                    }}
                >
                    <div
                        ref={playheadLabelRef}
                        style={{ position: 'absolute', top: -20, left: '50%', transform: 'translateX(-50%)', background: 'var(--bg-primary)', padding: '2px 4px', fontSize: '10px', borderRadius: 4, border: '1px solid var(--lavender)', color: 'var(--text-primary)', willChange: 'contents' }}>
                        0.0s
                    </div>
                </div>
            </div>

            <div
                ref={trackRef}
                style={{ position: 'absolute', top: 40, left: 0, right: 0, height: 12, background: 'rgba(52, 211, 153, 0.4)', borderRadius: 6, border: '1px solid rgba(52, 211, 153, 0.8)' }}
            >
                {trims.map(trim => {
                    const isActive = trim.id === activeTrimId;
                    const leftPct = (trim.start / duration) * 100;
                    const rightPct = (trim.end / duration) * 100;
                    const widthPct = rightPct - leftPct;

                    return (
                        <div key={trim.id}>
                            <div
                                style={{
                                    position: 'absolute',
                                    left: `${leftPct}%`,
                                    width: `${widthPct}%`,
                                    height: '100%',
                                    background: isActive ? 'rgba(233, 213, 255, 0.2)' : 'rgba(248, 113, 113, 0.8)',
                                    borderRadius: 0,
                                    cursor: isActive ? 'default' : 'pointer',
                                    border: isActive ? '1px solid var(--lavender)' : '1px solid rgba(248, 113, 113, 1)',
                                    transition: 'background 0.2s',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    overflow: 'hidden'
                                }}
                                onClick={(e) => {
                                    if (!isActive) {
                                        e.stopPropagation();
                                        setActiveTrimId(trim.id);
                                    }
                                }}
                            >
                                {/* Diagonal hash pattern for "deleted" meaning */}
                                {!isActive && (
                                    <div style={{
                                        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.3,
                                        background: 'repeating-linear-gradient(45deg, transparent, transparent 4px, #000 4px, #000 8px)'
                                    }}></div>
                                )}
                            </div>

                            {isActive && (
                                <>
                                    <div
                                        style={{
                                            position: 'absolute', left: `${leftPct}%`, top: -10, bottom: -10, width: 20, transform: 'translateX(-50%)',
                                            cursor: 'ew-resize', display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 10
                                        }}
                                        onPointerDown={(e) => handlePointerDown(e, 'start')}
                                    >
                                        <div style={{ width: 4, height: 32, background: 'var(--lavender)', borderRadius: 2, boxShadow: '0 0 10px var(--lavender)' }} />
                                        <div style={{ position: 'absolute', top: 38, fontSize: '0.65rem', color: 'var(--lavender)', fontFamily: 'monospace', background: 'var(--bg-primary)', padding: '2px 6px', borderRadius: 4, border: '1px solid var(--glass-border)' }}>
                                            {trim.start.toFixed(1)}s
                                        </div>
                                    </div>
                                    <div
                                        style={{
                                            position: 'absolute', left: `${rightPct}%`, top: -10, bottom: -10, width: 20, transform: 'translateX(-50%)',
                                            cursor: 'ew-resize', display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 10
                                        }}
                                        onPointerDown={(e) => handlePointerDown(e, 'end')}
                                    >
                                        <div style={{ width: 4, height: 32, background: 'var(--lavender)', borderRadius: 2, boxShadow: '0 0 10px var(--lavender)' }} />
                                        <div style={{ position: 'absolute', top: 38, fontSize: '0.65rem', color: 'var(--lavender)', fontFamily: 'monospace', background: 'var(--bg-primary)', padding: '2px 6px', borderRadius: 4, border: '1px solid var(--glass-border)' }}>
                                            {trim.end.toFixed(1)}s
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default function VideoIntelligence() {
    const { showToast } = useToast();
    const [phase, setPhase] = useState('upload'); // upload | loading | results
    const [loadingStatus, setLoadingStatus] = useState('Extracting frames...');
    const [data, setData] = useState(null);
    const fileInputRef = useRef(null);
    const [dragOver, setDragOver] = useState(false);
    const [videoUrl, setVideoUrl] = useState('');
    const [playingVideoSource, setPlayingVideoSource] = useState(null);

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
            const videoBase64 = await fileToBase64(file);
            setPlayingVideoSource(URL.createObjectURL(file));

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
   - CRITICAL RULE: If a scene cuts to a completely blank screen (white screen, black screen, or any solid color screen) for MORE THAN 1 SECOND, the engagement score MUST drop to 0-5. A 12-second white screen MUST have a 0 engagement score.
   - Exception: A brief flash of white or black (1 second or less) is often an intentional stylistic transition or highlight. Do NOT penalize short flashes to 0. Score them appropriately.
3. Group the video into logical scenes. 
   - CRITICAL RULE: You MUST create a new scene the exact millisecond the video cuts to a long blank screen (white screen, black screen, etc. > 1s). Do NOT extend the previous scene's duration into the long blank screen.
   - If the last 10 seconds of a 20-second video are a blank white screen, Scene 1 is 0:00-0:10, and Scene 2 is 0:10-0:20 (Engagement: 0).
4. Identify specific timestamps that correlate with low engagement drops, explicitly calling out timestamps of long blank/white screens.
5. Analyse each scene for privacy risks, specifically detecting faces.
6. Generate improvement suggestions for each scene. For long blank screens (e.g., a 12-second white screen), you MUST suggest "Trim" or "Cut". For short stylistic flashes, suggest "Keep" or "Highlight".
   - CRITICAL RULE: If the engagement score is low (< 60) or if the scene is a long blank/white screen, you MUST NOT suggest "Keep". You MUST suggest "Trim", "Cut", or "Replace", and the "reason" field MUST provide a suitable, specific way to improve the scene based on the actual video content (e.g., "Trim the 12-second white screen as it kills engagement", "Replace static shot with dynamic B-roll").

Return a JSON object with this exact structure:
{
  "duration": "${exactDurationStr}",
  "resolution": "1080p",
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
    { "frame": "the timestamp", "ctrScore": 30, "reason": "why this frame affects engagement" }
  ],
  "recommended_deletions": [
    { "start": 12.5, "end": 15.0, "reason": "12.5s to 15.0s is a static blank screen" }
  ]
}

Rules:
- MUST include the full duration of the video. The video is exactly ${exactDurationStr} long. Do NOT calculate the duration yourself, use "${exactDurationStr}".
- The number of scenes is dynamic. 
- CRITICAL: A LONG blank screen (> 1s) at the end of the video MUST be separated into its own scene with an engagement of 0-5. Short flashes (<= 1s) can be "Highlight".
- The "timestamp" for each scene MUST be a time range (e.g., "0:00-0:15").
- The final scene MUST end at exactly ${exactDurationStr}. If the video ends with a long blank screen, the final scene should be the blank screen segment ending at ${exactDurationStr}.
- "recommendation" must be exactly one of: "Keep", "Trim", "Cut", "Highlight", or "Replace".
- Return ONLY the JSON object, no other text.`;

            let response;
            try {
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
                    recommendation: ['Keep', 'Trim', 'Cut', 'Highlight', 'Replace'].includes(s.recommendation) ? s.recommendation : 'Keep',
                    reason: s.reason || 'No analysis available',
                    composition: s.composition || 'N/A',
                    privacy: s.privacy || { has_face: false, face_count: 0 }
                }));

                const thumbnails = (parsed.thumbnails || []).map(t => ({
                    frame: t.frame || '0:00',
                    ctrScore: typeof t.ctrScore === 'number' ? t.ctrScore : 50,
                    reason: t.reason || 'Engagement drop factor'
                }));

                const recommended_deletions = (parsed.recommended_deletions || []).map(d => ({
                    start: typeof d.start === 'number' ? d.start : 0,
                    end: typeof d.end === 'number' ? d.end : 0,
                    reason: d.reason || 'Low engagement section'
                }));

                const result = {
                    module: 'video_intelligence', status: 'success', confidence: 0.94,
                    results: { duration: parsed.duration || 'N/A', resolution: parsed.resolution || 'N/A', fps: parsed.fps || 30, scenes, thumbnails },
                    recommendations: parsed.recommendations || [
                        'Review highlighted scenes for potential clip extraction',
                        'Consider cutting segments with the lowest engagement score',
                        'Trim scenes where engagement drops significantly'
                    ],
                    recommended_deletions
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
        setPlayingVideoSource(videoUrl.trim());

        const prompt = `You are ContentIQ Video Intelligence Engine. Act as a full video-intelligence pipeline.
Follow this exact sequence of logic internally:
1. Analyse every single frame of the video from the absolute first second to the absolute last millisecond. Do NOT skip the end of the video.
2. Extract and transcribe the audio (Whisper equivalent).
3. Compute engagement scores (0-100).
   - CRITICAL RULE: If a scene cuts to a completely blank screen (solid black, solid white, or any solid color) for MORE THAN 1 SECOND, the engagement score for that duration MUST drop to 0-5. A 12-second white screen MUST have a 0 engagement score.
   - Exception: A brief flash of white or black (1 second or less) is often an intentional stylistic transition or highlight. Do NOT penalize short flashes to 0. Score them appropriately as part of the narrative flow.
4. Group the video into logical scenes. 
   - CRITICAL RULE: You MUST create a new scene the exact millisecond the video cuts to a long blank screen (white screen, black screen, etc. > 1s). Do NOT extend the previous scene's duration into the long blank screen.
   - If the last 10 seconds of a 20-second video are a blank white screen, Scene 1 is 0:00-0:10, and Scene 2 is 0:10-0:20 (Engagement: 0).
5. Identify specific timestamps/frames that correlate with the lowest engagement drops, explicitly calling out timestamps of long blank/white screens.
6. Analyse each scene for privacy risks, specifically counting faces (OpenCV equivalent).
7. Generate improvement suggestions for each scene. For long blank screens (e.g., a 12-second white screen), you MUST suggest "Trim" or "Cut". For short stylistic flashes, suggest "Keep" or "Highlight".
   - CRITICAL RULE: If the engagement score is low (< 60) or if the scene is a long blank/white screen, you MUST NOT suggest "Keep". You MUST suggest "Trim", "Cut", or "Replace", and the "reason" field MUST provide a suitable, specific way to improve the scene based on the actual video content (e.g., "Trim the 12-second white screen as it kills engagement", "Replace static shot with dynamic B-roll").

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
  ],
  "recommended_deletions": [
    { "start": 12.5, "end": 15.0, "reason": "12.5s to 15.0s is a static blank screen" }
  ]
}

Rules:
- MUST include the full duration of the video.
- The number of scenes is dynamic. 
- CRITICAL: A LONG blank screen (> 1s) at the end of the video MUST be separated into its own scene with an engagement of 0-5. Short flashes (<= 1s) can be "Highlight".
- The "timestamp" for each scene MUST be a time range (e.g., "0:00-0:15").
- The final scene MUST end at exactly the duration of the video. If the video ends with a long blank screen, the final scene should be the blank screen segment.
- For thumbnails, return the frames/timestamps responsible for dropping engagement.
- "engagement" is 0 - 100 score.
- "recommendation" must be exactly one of: "Keep", "Trim", "Cut", "Highlight", or "Replace".
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
                    recommendation: ['Keep', 'Trim', 'Cut', 'Highlight', 'Replace'].includes(s.recommendation) ? s.recommendation : 'Keep',
                    reason: s.reason || 'No analysis available',
                    composition: s.composition || 'N/A',
                    privacy: s.privacy || { has_face: false, face_count: 0 }
                }));

                const thumbnails = (parsed.thumbnails || []).map(t => ({
                    frame: t.frame || '0:00',
                    ctrScore: typeof t.ctrScore === 'number' ? t.ctrScore : 50,
                    reason: t.reason || 'Engagement drop factor'
                }));

                const recommended_deletions = (parsed.recommended_deletions || []).map(d => ({
                    start: typeof d.start === 'number' ? d.start : 0,
                    end: typeof d.end === 'number' ? d.end : 0,
                    reason: d.reason || 'Low engagement section'
                }));

                const result = {
                    module: 'video_intelligence', status: 'success', confidence: 0.94,
                    results: { duration: parsed.duration || 'N/A', resolution: parsed.resolution || 'N/A', fps: parsed.fps || 30, scenes, thumbnails },
                    recommendations: parsed.recommendations || [
                        'Review highlighted scenes for potential clip extraction',
                        'Consider cutting segments with the lowest engagement score',
                        'Trim scenes where engagement drops significantly'
                    ],
                    recommended_deletions
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
                <motion.h1 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-sm" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Film size={32} color="var(--purple-light)" /> Video Intelligence Engine
                </motion.h1>
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
                    Upload a video or paste a link to analyze scenes, engagement, and find the best thumbnails
                </motion.p>
            </div>

            <AnimatePresence mode="wait">
                {/* Upload Section */}
                {phase === 'upload' && (
                    <motion.div
                        key="upload"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98, filter: 'blur(10px)' }}
                        className="glass-card-static mb-lg"
                        style={{ padding: 'var(--space-2xl)' }}
                    >
                        <motion.div
                            animate={{
                                boxShadow: dragOver ? '0 0 40px rgba(168, 85, 247, 0.4)' : '0 0 15px rgba(168, 85, 247, 0.05)',
                                borderColor: dragOver ? 'var(--purple-glow)' : 'var(--glass-border)'
                            }}
                            transition={{ duration: 1, repeat: Infinity, repeatType: 'reverse' }}
                            style={{
                                border: '1px dashed var(--glass-border)',
                                borderRadius: 'var(--radius-xl)',
                                padding: '60px 20px',
                                textAlign: 'center',
                                cursor: 'pointer',
                                background: dragOver ? 'rgba(107, 33, 168, 0.1)' : 'rgba(107, 33, 168, 0.02)',
                                position: 'relative',
                                overflow: 'hidden'
                            }}
                            className="upload-zone"
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
                            <motion.div
                                animate={{ y: [0, -5, 0] }}
                                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                                style={{ marginBottom: 'var(--space-md)' }}
                            >
                                <UploadCloud size={64} color="var(--purple-light)" style={{ margin: '0 auto', opacity: 0.8 }} />
                            </motion.div>
                            <div style={{ color: 'var(--text-primary)', fontSize: '1.1rem', fontWeight: 600, marginBottom: 'var(--space-xs)' }}>
                                Drop your video here or click to upload
                            </div>
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                Supports MP4, MOV • Max 500MB
                            </div>
                        </motion.div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', margin: 'var(--space-xl) 0' }}>
                            <div style={{ flex: 1, height: 1, background: 'var(--glass-border)' }}></div>
                            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>or paste a video link</span>
                            <div style={{ flex: 1, height: 1, background: 'var(--glass-border)' }}></div>
                        </div>

                        <div className="flex gap-md items-center">
                            <div style={{ position: 'relative', flex: 1 }}>
                                <LinkIcon size={18} color="var(--text-muted)" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)' }} />
                                <input
                                    type="url"
                                    className="form-input"
                                    placeholder="Paste a YouTube or video URL..."
                                    value={videoUrl}
                                    onChange={(e) => setVideoUrl(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') processVideoURL(); }}
                                    style={{ width: '100%', paddingLeft: 44, height: 48 }}
                                />
                            </div>
                            <button className="btn btn-primary btn-lg" onClick={processVideoURL} disabled={!videoUrl.trim()}>
                                Analyze URL
                            </button>
                        </div>

                        <div className="flex items-center justify-between mt-xl p-md" style={{ background: 'var(--glass-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--glass-border)' }}>
                            <div className="flex items-center gap-sm">
                                <Info size={16} color="var(--text-tertiary)" />
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                                    {hasGeminiKey() ? '🟢 Gemini API Connected internally' : '🟡 No API Key — Demo mode available'}
                                </span>
                            </div>
                            <button className="btn btn-ghost btn-sm" onClick={() => showResults(mockVideoIntelligence)}>
                                Load Demo Data
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* Loading State */}
                {phase === 'loading' && (
                    <motion.div
                        key="loading"
                        initial={{ opacity: 0, filter: 'blur(10px)' }}
                        animate={{ opacity: 1, filter: 'blur(0px)' }}
                        exit={{ opacity: 0 }}
                        className="glass-card-static mb-lg flex flex-col items-center justify-center p-xl"
                        style={{ minHeight: 400 }}
                    >
                        <div style={{ position: 'relative', width: 120, height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <motion.div
                                animate={{
                                    rotateX: [0, 180, 180, 0],
                                    rotateY: [0, 0, 180, 180],
                                    borderColor: ['var(--purple-deep)', 'var(--lavender)', 'var(--purple-glow)', 'var(--purple-deep)']
                                }}
                                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                                style={{
                                    position: 'absolute',
                                    width: '100%', height: '100%',
                                    border: '2px solid var(--purple-glow)',
                                    borderRadius: '30%'
                                }}
                            />
                            <motion.div
                                animate={{
                                    rotateX: [180, 180, 0, 0],
                                    rotateY: [180, 0, 0, 180],
                                    borderColor: ['var(--lavender)', 'var(--purple-glow)', 'var(--purple-deep)', 'var(--lavender)']
                                }}
                                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                                style={{
                                    position: 'absolute',
                                    width: '70%', height: '70%',
                                    border: '2px solid var(--lavender)',
                                    borderRadius: '50%'
                                }}
                            />
                            <Activity color="var(--lavender)" size={32} />
                        </div>
                        <motion.div
                            animate={{ opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                            className="mt-xl"
                            style={{ fontSize: '1.25rem', fontWeight: 700, background: 'linear-gradient(90deg, var(--lavender), var(--purple-glow))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '0.05em' }}
                        >
                            Processing Video Layer...
                        </motion.div>
                        <div className="mt-sm" style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem', fontWeight: 500 }}>
                            {loadingStatus}
                        </div>
                    </motion.div>
                )}

                {/* Results State */}
                {phase === 'results' && data && (
                    <motion.div
                        key="results"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ staggerChildren: 0.1 }}
                    >
                        <ResultsView data={data} videoSource={playingVideoSource} onReset={() => {
                            setPhase('upload');
                            setPlayingVideoSource(null);
                        }} />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function ResultsView({ data, videoSource, onReset }) {
    const r = data.results;
    const scenes = r.scenes || [];
    const thumbs = r.thumbnails || [];
    const { showToast } = useToast();

    // Multi-Segment Trimming State
    const videoRef = useRef(null);
    const [duration, setDuration] = useState(0);
    const [trims, setTrims] = useState([]);
    const [activeTrimId, setActiveTrimId] = useState(null);
    const [isTrimming, setIsTrimming] = useState(false);
    const [isPreviewing, setIsPreviewing] = useState(false);
    const previewRef = useRef(null);

    // FFmpeg state for export
    const ffmpegRef = useRef(new FFmpeg());
    const [isFfmpegLoaded, setIsFfmpegLoaded] = useState(false);

    useEffect(() => {
        const loadFFmpeg = async () => {
            try {
                await ffmpegRef.current.load();
                ffmpegRef.current.on('log', ({ message }) => console.log(message));
                setIsFfmpegLoaded(true);
            } catch (err) {
                console.error("FFmpeg failed to load:", err);
            }
        };
        loadFFmpeg();
    }, []);

    // Compute overall engagement avg
    const avgEngagement = Math.round(scenes.reduce((acc, val) => acc + val.engagement, 0) / (scenes.length || 1));

    const handleVideoLoaded = () => {
        if (videoRef.current && duration === 0) {
            setDuration(videoRef.current.duration);
            // Default to empty array (0 deletions)
            setTrims([]);
            setActiveTrimId(null);
        }
    };

    const addTrimSegment = () => {
        const sorted = [...trims].sort((a, b) => a.start - b.start);
        let start = 0;
        let end = 0;
        let found = false;

        // Calculate 20% of video duration, with a minimum of 1 second for safety
        const defaultLen = duration > 0 ? Math.max(1, duration * 0.2) : 2;

        if (sorted.length === 0) {
            // First trim created on an empty timeline
            start = 0;
            end = Math.min(defaultLen, duration);
            found = true;
        } else if (sorted[0].start >= defaultLen) {
            // Fit in a gap before the first trim
            start = 0;
            end = Math.min(defaultLen, sorted[0].start);
            found = true;
        }

        if (!found) {
            // Fit in a gap between existing trims
            for (let i = 0; i < sorted.length - 1; i++) {
                const gap = sorted[i + 1].start - sorted[i].end;
                // Only place it if the gap is at least 1 second wide
                if (gap >= 1) {
                    start = sorted[i].end;
                    end = start + Math.min(defaultLen, gap);
                    found = true;
                    break;
                }
            }
        }

        if (!found && sorted.length > 0) {
            // Fit in a gap at the end
            const lastEnd = sorted[sorted.length - 1].end;
            if (duration - lastEnd >= 1) {
                start = lastEnd;
                end = Math.min(duration, start + defaultLen);
                found = true;
            }
        }

        if (found) {
            const newId = Date.now();
            setTrims([...trims, { id: newId, start, end }]);
            setActiveTrimId(newId);
        } else {
            showToast("No space on timeline for a new segment.", "warning");
        }
    };

    const removeTrimSegment = (id) => {
        const newTrims = trims.filter(t => t.id !== id);
        setTrims(newTrims);
        if (activeTrimId === id) setActiveTrimId(newTrims.length ? newTrims[0].id : null);
    };

    const previewTrims = () => {
        if (!videoRef.current || trims.length === 0) return;
        setIsPreviewing(true);
        videoRef.current.play();
    };

    const stopPreview = () => {
        setIsPreviewing(false);
        if (videoRef.current) videoRef.current.pause();
    };

    // Inverted Gapless Playback: Skips OVER the trims
    const handleTimeUpdate = () => {
        if (!videoRef.current || trims.length === 0) return;
        const current = videoRef.current.currentTime;

        if (!activeTrimId) {
            const sortedTrims = [...trims].sort((a, b) => a.start - b.start);

            for (let i = 0; i < sortedTrims.length; i++) {
                // If the playhead steps into a trimmed (deleted) section...
                if (current >= sortedTrims[i].start && current < sortedTrims[i].end) {
                    // Instantly visually snap it to the end of the trim (the start of the next valid gap)
                    videoRef.current.currentTime = sortedTrims[i].end;
                    break;
                }
            }
        }
    };

    const handleTrimAndSave = async () => {
        if (!videoRef.current || trims.length === 0) return;
        if (!isFfmpegLoaded) {
            showToast("FFmpeg is still loading in the background. Please wait a moment.", "warning");
            return;
        }

        setIsTrimming(true);
        const sortedTrims = [...trims].sort((a, b) => a.start - b.start);

        // Calculate the "saved" gaps by inverting the trims
        const savedSegments = [];
        let currentPos = 0;

        for (let i = 0; i < sortedTrims.length; i++) {
            if (currentPos < sortedTrims[i].start) {
                savedSegments.push({ start: currentPos, end: sortedTrims[i].start });
            }
            currentPos = sortedTrims[i].end; // Move past the trim
        }

        // Add final gap if the last trim didn't end at the very end of the video
        if (currentPos < duration) {
            savedSegments.push({ start: currentPos, end: duration });
        }

        if (savedSegments.length === 0) {
            showToast("Error: You trimmed the entire video!", "error");
            setIsTrimming(false);
            return;
        }

        try {
            showToast("Processing video offline with FFmpeg.wasm... this may take a moment.", "info");
            const ffmpeg = ffmpegRef.current;

            // Read input file into ffmpeg memory
            const fileData = await fetchFile(videoSource);
            await ffmpeg.writeFile('input.mp4', fileData);

            let filterComplex = '';
            let concatTokens = '';

            for (let i = 0; i < savedSegments.length; i++) {
                const seg = savedSegments[i];
                filterComplex += `[0:v]trim=start=${seg.start}:end=${seg.end},setpts=PTS-STARTPTS[v${i}]; `;
                filterComplex += `[0:a]atrim=start=${seg.start}:end=${seg.end},asetpts=PTS-STARTPTS[a${i}]; `;
                concatTokens += `[v${i}][a${i}]`;
            }

            filterComplex += `${concatTokens}concat=n=${savedSegments.length}:v=1:a=1[outv][outa]`;

            // Execute FFmpeg
            await ffmpeg.exec([
                '-i', 'input.mp4',
                '-filter_complex', filterComplex,
                '-map', '[outv]',
                '-map', '[outa]',
                '-c:v', 'libx264',
                '-preset', 'ultrafast',
                '-c:a', 'aac',
                'output.mp4'
            ]);

            const outData = await ffmpeg.readFile('output.mp4');
            const blob = new Blob([outData.buffer], { type: 'video/mp4' });

            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `contentiq-trimmed-${Date.now()}.mp4`;
            a.click();
            URL.revokeObjectURL(url);
            showToast("Trimmed video exported successfully!", "success");

            // Clean up FFmpeg filesystem
            await ffmpeg.deleteFile('input.mp4');
            await ffmpeg.deleteFile('output.mp4');
        } catch (e) {
            showToast("Failed to process video: " + e.message, "error");
            console.error(e);
        } finally {
            setIsTrimming(false);
        }
    };

    return (
        <>
            <div className="flex items-center justify-between mb-lg" style={{ background: 'var(--glass-bg)', padding: 'var(--space-lg)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--glass-border)' }}>
                <div className="flex items-center gap-md">
                    <Activity size={28} color="var(--success)" />
                    <div>
                        <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Intelligence Report</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>Confidence Score: {Math.round(data.confidence * 100)}%</div>
                    </div>
                </div>
                <div className="flex items-center gap-lg">
                    <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
                        <div className="glass-subtle flex flex-col items-center justify-center" style={{ padding: '8px 16px', minWidth: 100 }}>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Duration</span>
                            <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{r.duration || 'N/A'}</span>
                        </div>
                        <div className="glass-subtle flex flex-col items-center justify-center" style={{ padding: '8px 16px', minWidth: 100 }}>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Resolution</span>
                            <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{r.resolution || 'N/A'}</span>
                        </div>
                    </div>
                    <button className="btn btn-secondary" onClick={onReset}><RefreshCcw size={16} /> New Analysis</button>
                </div>
            </div>

            <div className="bento-grid mb-xl" style={{ gridTemplateRows: 'auto' }}>
                <div className="bento-span-2 glass-card-static" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ padding: 'var(--space-md) var(--space-lg)', borderBottom: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Video size={16} color="var(--purple-light)" />
                        <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Media Player</span>
                    </div>
                    {/* Real sleek video player */}
                    <div style={{ flex: 1, background: '#000', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                        {videoSource ? (
                            <video
                                ref={videoRef}
                                src={videoSource}
                                controls
                                crossOrigin="anonymous"
                                onLoadedMetadata={handleVideoLoaded}
                                onTimeUpdate={handleTimeUpdate}
                                style={{ width: '100%', flex: 1, objectFit: 'contain', maxHeight: 400, outline: 'none' }}
                            />
                        ) : (
                            <div style={{ flex: 1, minHeight: 240, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <motion.div whileHover={{ scale: 1.1 }} style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.2)' }}>
                                    <Play size={28} color="#fff" style={{ marginLeft: 4 }} />
                                </motion.div>
                            </div>
                        )}

                        {/* Trim Controls Overlay Below Video */}
                        <div style={{ padding: '16px 24px', background: 'var(--bg-secondary)', borderTop: '1px solid var(--glass-border)' }}>
                            <div className="flex items-center justify-between mb-sm cursor-default" style={{ gap: 'var(--space-md)' }}>
                                <div className="flex items-center gap-sm">
                                    <Scissors size={16} color="var(--purple-light)" />
                                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Multi-Segment Trimming</span>
                                </div>

                                {videoSource && (
                                    <div className="flex gap-sm">
                                        <button
                                            className="btn btn-secondary btn-sm"
                                            onClick={isPreviewing ? stopPreview : previewTrims}
                                            disabled={isTrimming || duration === 0}
                                            style={{ height: 32, padding: '0 16px', background: isPreviewing ? 'rgba(255,255,255,0.1)' : 'transparent' }}
                                        >
                                            {isPreviewing ? 'Stop Preview' : 'Preview Trims'}
                                        </button>
                                        <button
                                            className="btn btn-primary btn-sm"
                                            onClick={handleTrimAndSave}
                                            disabled={isTrimming || !duration}
                                            style={{ height: 32, padding: '0 16px', background: isTrimming ? 'var(--warning)' : 'var(--success)' }}
                                        >
                                            {isTrimming ? <Activity size={16} className="spin" /> : <Scissors size={16} />}
                                            {isTrimming ? 'Recording...' : 'Export Combined'}
                                        </button>
                                    </div>
                                )}
                            </div>

                            {videoSource && duration > 0 && (
                                <div style={{ marginTop: 'var(--space-md)' }}>
                                    <TimelineTrimmer
                                        duration={duration}
                                        trims={trims}
                                        setTrims={setTrims}
                                        activeTrimId={activeTrimId}
                                        setActiveTrimId={setActiveTrimId}
                                        videoRef={videoRef}
                                    />

                                    <div className="flex items-center justify-between mt-sm" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 16 }}>
                                        {activeTrimId ? (
                                            <div className="flex gap-sm">
                                                <button
                                                    className="btn btn-primary btn-sm"
                                                    onClick={() => setActiveTrimId(null)}
                                                    style={{ height: 32, padding: '0 16px', background: 'var(--purple-deep)' }}
                                                >
                                                    Save Change
                                                </button>
                                                <button
                                                    className="btn btn-ghost btn-sm"
                                                    onClick={() => removeTrimSegment(activeTrimId)}
                                                    style={{ height: 32, padding: '0 16px', color: 'var(--success)' }}
                                                >
                                                    Restore Section
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex gap-sm">
                                                <button
                                                    className="btn btn-ghost btn-sm"
                                                    onClick={addTrimSegment}
                                                    style={{ border: '1px dashed var(--danger)', padding: '0 16px', height: 32, color: 'var(--danger)' }}
                                                >
                                                    + Mark Section for Deletion
                                                </button>
                                                {trims.length > 0 && (
                                                    <button
                                                        className="btn btn-ghost btn-sm"
                                                        onClick={() => {
                                                            setTrims([]);
                                                            setActiveTrimId(null);
                                                            showToast("All deletions reversed.", "info");
                                                        }}
                                                        style={{ height: 32, padding: '0 16px', color: 'var(--text-tertiary)' }}
                                                    >
                                                        Undo All
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                                            {trims.length} Deletion(s) Marked
                                        </div>
                                    </div>
                                </div>
                            )}


                        </div>
                    </div>
                </div>

                <div className="glass-card flex flex-col items-center justify-center">
                    <CircularProgress percentage={avgEngagement} label="Avg Engagement" />
                    <div style={{ marginTop: 'var(--space-md)', fontSize: '0.8rem', color: 'var(--text-tertiary)', textAlign: 'center', maxWidth: '80%' }}>
                        Overall viewer retention prediction based on scene composition.
                    </div>
                </div>

                <div className="glass-card flex flex-col justify-center gap-lg">
                    {/* Deletions Section */}
                    <div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 'var(--space-md)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Target size={18} color="var(--danger)" /> Recommended AI Deletions
                        </div>
                        {data.recommended_deletions?.length > 0 ? (
                            data.recommended_deletions.map((del, i) => (
                                <div key={i} className="flex items-start gap-sm mb-sm" style={{ background: 'var(--glass-bg-active)', padding: '10px 12px', borderRadius: 'var(--radius-md)', cursor: 'pointer', borderLeft: '2px solid var(--danger)' }}
                                    onClick={() => {
                                        const newId = Date.now();
                                        setTrims(prev => [...prev, { id: newId, start: del.start, end: del.end }]);
                                        setActiveTrimId(newId);
                                        if (videoRef.current) videoRef.current.currentTime = del.start;
                                    }}
                                >
                                    <CheckCircle size={14} color="var(--danger)" style={{ marginTop: 2, flexShrink: 0 }} />
                                    <div>
                                        <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 600, lineHeight: 1.4, marginBottom: 4 }}>
                                            {del.start.toFixed(1)}s - {del.end.toFixed(1)}s
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{del.reason}</div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', fontStyle: 'italic', padding: '10px 12px', background: 'var(--glass-bg-active)', borderRadius: 'var(--radius-md)' }}>No poor engagement sections detected.</div>
                        )}
                    </div>

                    {/* Improvements & Highlights Section */}
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 'var(--space-lg)' }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 'var(--space-md)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Target size={18} color="var(--success)" /> Highlights & Improvements
                        </div>
                        {data.recommendations?.length > 0 ? (
                            data.recommendations.map((rec, i) => (
                                <div key={i} className="flex items-start gap-sm mb-sm" style={{ background: 'var(--glass-bg-active)', padding: '10px 12px', borderRadius: 'var(--radius-md)' }}>
                                    <CheckCircle size={14} color="var(--success)" style={{ marginTop: 2, flexShrink: 0 }} />
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-primary)', lineHeight: 1.4 }}>{rec}</span>
                                </div>
                            ))
                        ) : (
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', fontStyle: 'italic', padding: '10px 12px', background: 'var(--glass-bg-active)', borderRadius: 'var(--radius-md)' }}>No explicit highlights available.</div>
                        )}
                    </div>
                </div>
            </div >

            <div className="section-title"><span className="section-icon"><Clock size={18} color="var(--purple-light)" /></span> Scene-by-Scene Timeline</div>
            <div className="glass-card-static mb-xl" style={{ padding: 0, overflow: 'hidden' }}>
                <div className="scene-timeline" style={{ padding: 'var(--space-lg)', position: 'relative' }}>
                    {/* Vertical line connecting scenes */}
                    <div style={{ position: 'absolute', left: 45, top: 40, bottom: 40, width: 2, background: 'var(--glass-border)' }}></div>

                    {scenes.map((s, i) => (
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                            key={s.id}
                            style={{ display: 'flex', gap: 'var(--space-xl)', marginBottom: i === scenes.length - 1 ? 0 : 'var(--space-xl)', position: 'relative', zIndex: 1 }}
                        >
                            {/* Marker */}
                            <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--bg-secondary)', border: `2px solid ${getEngagementColor(s.engagement)}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: `0 0 15px ${getEngagementColor(s.engagement)}40` }}>
                                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: getEngagementColor(s.engagement) }}>{s.engagement}</span>
                            </div>

                            <div className="glass-subtle" style={{ flex: 1, padding: 'var(--space-lg)', borderRadius: 'var(--radius-lg)', background: 'var(--glass-bg)' }}>
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-md mb-md">
                                    <div className="flex items-center gap-md">
                                        <div style={{ fontSize: '0.9rem', fontWeight: 700, fontFamily: 'monospace', color: 'var(--lavender)', background: 'var(--glass-bg-active)', padding: '4px 10px', borderRadius: 4 }}>
                                            {s.timestamp}
                                        </div>
                                        {/* Styled Pill */}
                                        <span style={{
                                            fontSize: '0.75rem', fontWeight: 700, padding: '4px 12px', borderRadius: 'var(--radius-full)', textTransform: 'uppercase', letterSpacing: '0.05em',
                                            background: (s.recommendation === 'Highlight' || s.recommendation === 'Replace') ? 'rgba(251,191,36,0.15)' : (s.recommendation === 'Trim' || s.recommendation === 'Cut') ? 'rgba(248,113,113,0.15)' : 'rgba(52,211,153,0.15)',
                                            color: (s.recommendation === 'Highlight' || s.recommendation === 'Replace') ? 'var(--warning)' : (s.recommendation === 'Trim' || s.recommendation === 'Cut') ? 'var(--danger)' : 'var(--success)',
                                            border: `1px solid ${(s.recommendation === 'Highlight' || s.recommendation === 'Replace') ? 'rgba(251,191,36,0.3)' : (s.recommendation === 'Trim' || s.recommendation === 'Cut') ? 'rgba(248,113,113,0.3)' : 'rgba(52,211,153,0.3)'}`
                                        }}>
                                            {s.recommendation}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-sm">
                                        {s.privacy?.has_face ? <Shield size={16} color="var(--warning)" /> : <Shield size={16} color="var(--success)" />}
                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>{s.privacy?.has_face ? 'Faces Detected' : 'Privacy Clear'}</span>
                                    </div>
                                </div>
                                <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 'var(--space-md)' }}>
                                    {s.reason}
                                </p>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', borderTop: '1px solid var(--glass-border)', paddingTop: 'var(--space-sm)', display: 'flex', alignItems: 'center' }}>
                                    <span style={{ color: 'var(--purple-light)', marginRight: 6 }}>↳</span> {s.composition}
                                </div>
                            </div>
                        </motion.div>
                    ))
                    }
                </div >
            </div >

            {
                thumbs.length > 0 && (
                    <>
                        <div className="section-title"><span className="section-icon"><ZoomIn size={18} color="var(--purple-light)" /></span> Thumbnail Analysis (Engagement Drops)</div>
                        <div className="grid-3 mb-xl">
                            {thumbs.map((t, i) => (
                                <motion.div whileHover={{ y: -5 }} className="glass-card" key={i} style={{ textAlign: 'center', padding: 'var(--space-xl) var(--space-lg)' }}>
                                    <div style={{ width: 72, height: 72, borderRadius: '50%', margin: '0 auto var(--space-md)', background: 'var(--glass-bg-active)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--glass-border-hover)' }}>
                                        <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--danger)' }}>{t.ctrScore}%</span>
                                    </div>
                                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'monospace', marginBottom: 'var(--space-xs)' }}>Frame @ {t.frame}</div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', lineHeight: 1.5 }}>{t.reason}</div>
                                </motion.div>
                            ))}
                        </div>
                    </>
                )
            }
        </>
    );
}
