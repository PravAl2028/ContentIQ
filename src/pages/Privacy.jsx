import { useState, useRef, useCallback } from 'react';
import { hasGeminiKey } from '../services/api.js';
import { mockPrivacyFilter } from '../services/mockData.js';
import { useToast } from '../context/ToastContext.jsx';

export default function Privacy() {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState(null);
    const fileInputRef = useRef(null);

    const showPrivacyResults = useCallback((result) => {
        setData(result);
        setLoading(false);
    }, []);

    const runScan = useCallback(async () => {
        setLoading(true);
        setData(null);
        await new Promise(r => setTimeout(r, 2000));
        showPrivacyResults(mockPrivacyFilter);
        if (!hasGeminiKey()) showToast('Demo data loaded', 'info');
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
                    <input ref={fileInputRef} type="file" accept="video/mp4,video/quicktime,video/mov" style={{ display: 'none' }} onChange={(e) => { if (e.target.files[0]) runScan(); }} />
                    <span className="upload-icon">🔒</span>
                    <div className="upload-text">Upload video to scan for privacy concerns</div>
                    <div className="upload-subtext">We'll analyze frames for faces, plates, screens & location data</div>
                </div>
                <div className="flex items-center justify-between mt-md">
                    <button className="btn btn-secondary btn-sm" onClick={() => showPrivacyResults(mockPrivacyFilter)}>🎯 Load Demo Data</button>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{hasGeminiKey() ? '🟢 Gemini Connected' : '🟡 Demo mode'}</span>
                </div>
            </div>

            {loading && (
                <div className="glass-card-static mb-lg">
                    <div className="flex flex-col items-center justify-center gap-md" style={{ padding: 40 }}>
                        <div className="spinner"></div>
                        <div className="loading-text">Scanning for privacy concerns...</div>
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
