import { useState, useRef, useCallback } from 'react';
import { callGemini, parseGeminiJSON, hasGeminiKey, fileToBase64 } from '../services/api.js';
import { useToast } from '../context/ToastContext.jsx';

export default function Privacy() {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [loadingStatus, setLoadingStatus] = useState('Scanning for privacy concerns...');
    const [data, setData] = useState(null);
    const fileInputRef = useRef(null);

    const showPrivacyResults = useCallback((result) => {
        setData(result);
        setLoading(false);
    }, []);

    const runScan = useCallback(async (file) => {
        if (!file) return;

        if (!hasGeminiKey()) {
            showToast('Gemini API key required — add it in Settings', 'warning');
            return;
        }

        setLoading(true);
        setData(null);
        setLoadingStatus('Encoding video for analysis...');

        try {
            const videoBase64 = await fileToBase64(file);
            setLoadingStatus('Sending video to Gemini AI for privacy scan...');

            const prompt = `You are a Privacy Compliance Scanner. Analyze every single frame of this video thoroughly for privacy risks.

Detect ALL instances of:
1. **Faces**: Any visible human face (bystanders, minors, reflections in mirrors/screens). Note if it's a minor (child).
2. **License Plates**: Any readable vehicle registration plate.
3. **Screen Content**: Any visible computer/phone screen showing personal information (emails, messages, addresses, financial data).
4. **Location Identifiers**: Street signs, building addresses, GPS coordinates, distinctive landmarks that reveal a specific location.
5. **Documents**: Any visible documents, IDs, credit cards, or papers with personal info.
6. **Audio PII**: If any names, phone numbers, or addresses are spoken audibly.

For each detection, provide:
- The exact timestamp where it appears
- The type of privacy risk
- A description of what was detected
- A severity level (critical, high, medium, low)
- An approximate bounding box position (x, y, w, h) as pixel estimates relative to a 1920x1080 frame
- A specific suggestion for how to fix it

Severity guidelines:
- critical: Minors' faces, government IDs, financial data
- high: Bystander faces, license plates, personal messages
- medium: Screen content with partial info, location identifiers
- low: Distant/blurry faces, generic signage

Return ONLY valid JSON in this exact structure:
{
  "flags": [
    {
      "type": "face",
      "timestamp": "0:32",
      "description": "Bystander face visible in background",
      "severity": "high",
      "bbox": { "x": 420, "y": 180, "w": 90, "h": 110 },
      "suggestion": "Apply Gaussian blur to bounding box"
    }
  ],
  "summary": {
    "totalFlags": 5,
    "critical": 1,
    "high": 2,
    "medium": 2,
    "low": 0
  },
  "recommendations": [
    "Blur bystander face at 0:32",
    "Obscure license plate at 1:15"
  ]
}

Rules:
- If no privacy issues are found, return empty flags array and all summary counts as 0.
- summary counts MUST match the actual number of flags per severity.
- Return ONLY the JSON object, no markdown formatting.`;

            const videoData = [{ type: file.type || 'video/mp4', base64: videoBase64 }];
            setLoadingStatus('AI is analyzing frames for privacy risks...');
            const response = await callGemini(prompt, videoData);
            
            setLoadingStatus('Processing privacy scan results...');
            const parsed = parseGeminiJSON(response);

            if (parsed && parsed.flags) {
                // Recompute summary from actual flags to ensure accuracy
                const flags = parsed.flags;
                const summary = {
                    totalFlags: flags.length,
                    critical: flags.filter(f => f.severity === 'critical').length,
                    high: flags.filter(f => f.severity === 'high').length,
                    medium: flags.filter(f => f.severity === 'medium').length,
                    low: flags.filter(f => f.severity === 'low').length
                };

                showPrivacyResults({
                    module: 'privacy_filter',
                    status: 'success',
                    confidence: 0.95,
                    results: { flags, summary },
                    recommendations: parsed.recommendations || ['No specific recommendations']
                });
                showToast(`Privacy scan complete — ${flags.length} issue(s) found`, flags.length > 0 ? 'warning' : 'success');
            } else {
                throw new Error('Failed to parse AI privacy scan response.');
            }
        } catch (err) {
            setLoading(false);
            showToast('Privacy scan failed: ' + err.message, 'error');
        }
    }, [showToast, showPrivacyResults]);

    const severityColor = { critical: 'var(--danger)', high: '#F97316', medium: 'var(--warning)', low: 'var(--success)' };
    const severityBg = { critical: 'var(--danger-bg)', high: 'rgba(249,115,22,0.1)', medium: 'var(--warning-bg)', low: 'var(--success-bg)' };
    const r = data?.results;

    return (
        <div className="page-enter">
            <div className="page-header">
                <h1>🔒 Privacy Filter</h1>
                <p>Scan video frames to detect faces, license plates, screens, and location identifiers</p>
            </div>

            <div className="glass-card-static mb-lg">
                <div
                    className="upload-zone"
                    onClick={() => fileInputRef.current?.click()}
                >
                    <input ref={fileInputRef} type="file" accept="video/mp4,video/quicktime,video/mov" style={{ display: 'none' }} onChange={(e) => { if (e.target.files[0]) runScan(e.target.files[0]); }} />
                    <span className="upload-icon">🔒</span>
                    <div className="upload-text">Upload video to scan for privacy concerns</div>
                    <div className="upload-subtext">We'll analyze frames for faces, plates, screens & location data</div>
                </div>
                <div className="flex items-center justify-end mt-md">
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{hasGeminiKey() ? '🟢 Gemini Connected' : '🔴 API Key Required'}</span>
                </div>
            </div>

            {loading && (
                <div className="glass-card-static mb-lg">
                    <div className="flex flex-col items-center justify-center gap-md" style={{ padding: 40 }}>
                        <div className="spinner"></div>
                        <div className="loading-text">{loadingStatus}</div>
                        <div className="pulse-loader"><span></span><span></span><span></span></div>
                    </div>
                </div>
            )}

            {data && r && (
                <>
                    <div className="flex items-center justify-between mb-lg">
                        <div className="section-title" style={{ marginBottom: 0 }}><span className="section-icon">🛡️</span> Privacy Scan Results</div>
                        <div className="confidence-bar">
                            <span className="confidence-label">Confidence</span>
                            <div className="progress-bar" style={{ width: 80 }}><div className="progress-fill" style={{ width: `${data.confidence * 100}%` }}></div></div>
                            <span className="confidence-value">{Math.round(data.confidence * 100)}%</span>
                        </div>
                    </div>

                    <div className="grid-4 mb-lg">
                        <div className="glass-card stat-card" style={{ textAlign: 'center' }}>
                            <div className="stat-value">{r.summary.totalFlags}</div>
                            <div className="stat-label">Total Flags</div>
                        </div>
                        <div className="glass-card stat-card" style={{ textAlign: 'center', borderColor: 'var(--danger)' }}>
                            <div className="stat-value" style={{ color: 'var(--danger)' }}>{r.summary.critical}</div>
                            <div className="stat-label">Critical</div>
                        </div>
                        <div className="glass-card stat-card" style={{ textAlign: 'center' }}>
                            <div className="stat-value" style={{ color: '#F97316' }}>{r.summary.high}</div>
                            <div className="stat-label">High</div>
                        </div>
                        <div className="glass-card stat-card" style={{ textAlign: 'center' }}>
                            <div className="stat-value" style={{ color: 'var(--warning)' }}>{r.summary.medium}</div>
                            <div className="stat-label">Medium</div>
                        </div>
                    </div>

                    <div className="section-title"><span className="section-icon">🚨</span> Flagged Items</div>
                    <div className="glass-card-static mb-lg">
                        {r.flags.map((f, i) => (
                            <div className="scene-item" key={i} style={{ borderLeft: `3px solid ${severityColor[f.severity]}` }}>
                                <div style={{ minWidth: 90 }}>
                                    <div className="scene-timestamp">{f.timestamp}</div>
                                    <span className="tag mt-md" style={{ background: severityBg[f.severity], color: severityColor[f.severity], borderColor: `${severityColor[f.severity]}30`, display: 'inline-block', marginTop: 8 }}>
                                        {f.severity.toUpperCase()}
                                    </span>
                                </div>
                                <div className="scene-details">
                                    <div className="flex items-center gap-sm mb-sm">
                                        <span className="tag tag-purple">{f.type.replace('_', ' ')}</span>
                                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{f.description}</span>
                                    </div>
                                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 6 }}>
                                        Bounding Box: x:{f.bbox.x} y:{f.bbox.y} w:{f.bbox.w} h:{f.bbox.h}
                                    </div>
                                    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', padding: '6px 10px', background: 'rgba(168,85,247,0.05)', borderRadius: 6 }}>
                                        💡 {f.suggestion}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="section-title"><span className="section-icon">💡</span> Recommendations</div>
                    <div className="glass-card-static">
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
