import { useState, useCallback } from 'react';
import { callGemini, parseGeminiJSON, hasGeminiKey } from '../services/api.js';
import { mockDistributionPlan } from '../services/mockData.js';
import { useToast } from '../context/ToastContext.jsx';

export default function Distribution() {
    const { showToast } = useToast();
    const [title, setTitle] = useState('5 Free AI Tools That Replaced My Virtual Assistant');
    const [niche, setNiche] = useState('Tech/Productivity');
    const [desc, setDesc] = useState('A walkthrough of 5 free AI tools that automate tasks previously handled by a virtual assistant.');
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState(null);

    const showPlanResults = useCallback((result) => {
        setData(result);
        setLoading(false);
    }, []);

    const generatePlan = useCallback(async () => {
        if (!title.trim()) { showToast('Please enter a video title', 'warning'); return; }
        setLoading(true);
        setData(null);

        try {
            if (!hasGeminiKey()) {
                await new Promise(r => setTimeout(r, 1500));
                showPlanResults(mockDistributionPlan);
                showToast('Demo data loaded', 'info');
                return;
            }

            const prompt = `Create a multi-platform distribution plan for a ${niche} video titled "${title}". Description: "${desc}".

Return JSON:
{
  "youtube": { "title": "SEO optimized title", "description": "full description with timestamps", "tags": ["tag1","tag2"] },
  "tiktok": { "clipRange": "best 30-60s range", "caption": "caption", "hashtags": ["#tag1"] },
  "instagram": { "caption": "caption", "hashtags": ["#tag1"] },
  "viralWindow": { "bestDay": "day", "bestTime": "time EST", "reason": "why" }
}
Return ONLY valid JSON.`;

            const response = await callGemini(prompt);
            const parsed = parseGeminiJSON(response);

            if (parsed) {
                showPlanResults({
                    module: 'distribution_planner', status: 'success', confidence: 0.89, results: parsed,
                    recommendations: ['Post YouTube first then repurpose', 'Cross-promote on all platforms within 2 hours']
                });
            } else {
                showPlanResults(mockDistributionPlan);
            }
        } catch (err) {
            showPlanResults(mockDistributionPlan);
            showToast('Demo data loaded: ' + err.message, 'warning');
        }
    }, [title, niche, desc, showToast, showPlanResults]);

    const r = data?.results;

    return (
        <div className="page-enter">
            <div className="page-header">
                <h1>📱 Multi-Platform Distribution Planner</h1>
                <p>Generate optimized content packages for YouTube, TikTok, and Instagram</p>
            </div>

            <div className="glass-card-static mb-lg">
                <div className="section-title"><span className="section-icon">📝</span> Video Metadata</div>
                <div className="grid-2 mb-lg">
                    <div className="form-group">
                        <label className="form-label">Video Title / Topic</label>
                        <input type="text" className="form-input" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g., 5 Free AI Tools" />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Niche / Category</label>
                        <input type="text" className="form-input" value={niche} onChange={e => setNiche(e.target.value)} placeholder="e.g., Tech/Productivity" />
                    </div>
                </div>
                <div className="form-group mb-lg">
                    <label className="form-label">Description / Summary</label>
                    <textarea className="form-textarea" rows="3" value={desc} onChange={e => setDesc(e.target.value)} placeholder="Brief description of video content..." />
                </div>
                <div className="flex gap-md">
                    <button className="btn btn-primary" onClick={generatePlan}>📱 Generate Distribution Plan</button>
                    <button className="btn btn-secondary" onClick={() => showPlanResults(mockDistributionPlan)}>🎯 Demo</button>
                </div>
            </div>

            {loading && (
                <div className="glass-card-static mb-lg">
                    <div className="flex flex-col items-center justify-center gap-md" style={{ padding: 40 }}>
                        <div className="spinner"></div>
                        <div className="loading-text">Crafting platform-optimized packages...</div>
                        <div className="pulse-loader"><span></span><span></span><span></span></div>
                    </div>
                </div>
            )}

            {data && r && (
                <>
                    <div className="flex items-center justify-between mb-lg">
                        <div className="section-title" style={{ marginBottom: 0 }}><span className="section-icon">📊</span> Distribution Plan</div>
                        <div className="confidence-bar">
                            <span className="confidence-label">Confidence</span>
                            <div className="progress-bar" style={{ width: 80 }}><div className="progress-fill" style={{ width: `${data.confidence * 100}%` }}></div></div>
                            <span className="confidence-value">{Math.round(data.confidence * 100)}%</span>
                        </div>
                    </div>

                    {/* YouTube */}
                    <div className="glass-card-static platform-card mb-lg">
                        <div className="platform-card-header" style={{ color: '#FF0000' }}>
                            <span style={{ fontSize: '1.2rem' }}>▶️</span> YouTube
                            <span className="tag tag-danger" style={{ marginLeft: 'auto' }}>Primary</span>
                        </div>
                        <div className="platform-card-body">
                            <div className="form-group mb-md">
                                <label className="form-label">SEO Title</label>
                                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', padding: '8px 0' }}>{r.youtube.title}</div>
                            </div>
                            <div className="form-group mb-md">
                                <label className="form-label">Description</label>
                                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', whiteSpace: 'pre-line', lineHeight: 1.6, padding: '8px 0' }}>{r.youtube.description}</div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Tags</label>
                                <div className="flex gap-sm" style={{ flexWrap: 'wrap' }}>
                                    {r.youtube.tags.map((t, i) => <span className="tag tag-purple" key={i}>{t}</span>)}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid-2 mb-lg">
                        {/* TikTok */}
                        <div className="glass-card-static platform-card">
                            <div className="platform-card-header" style={{ color: '#00F2EA' }}>
                                <span style={{ fontSize: '1.2rem' }}>🎵</span> TikTok
                            </div>
                            <div className="platform-card-body">
                                <div className="form-group mb-md">
                                    <label className="form-label">Best Clip</label>
                                    <span className="tag tag-info">{r.tiktok.clipRange}</span>
                                </div>
                                <div className="form-group mb-md">
                                    <label className="form-label">Caption</label>
                                    <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{r.tiktok.caption}</p>
                                </div>
                                <div className="flex gap-sm" style={{ flexWrap: 'wrap' }}>
                                    {r.tiktok.hashtags.map((h, i) => <span className="tag tag-info" key={i}>{h}</span>)}
                                </div>
                            </div>
                        </div>

                        {/* Instagram */}
                        <div className="glass-card-static platform-card">
                            <div className="platform-card-header" style={{ color: '#E1306C' }}>
                                <span style={{ fontSize: '1.2rem' }}>📸</span> Instagram
                            </div>
                            <div className="platform-card-body">
                                <div className="form-group mb-md">
                                    <label className="form-label">Caption</label>
                                    <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', whiteSpace: 'pre-line' }}>{r.instagram.caption}</p>
                                </div>
                                <div className="flex gap-sm" style={{ flexWrap: 'wrap' }}>
                                    {r.instagram.hashtags.map((h, i) => <span className="tag tag-purple" key={i}>{h}</span>)}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Viral Window */}
                    <div className="glass-card-static">
                        <div className="section-title"><span className="section-icon">🔥</span> Viral Window Detection</div>
                        <div className="grid-3">
                            <div className="glass-card" style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '1.8rem', marginBottom: 8 }}>📅</div>
                                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>{r.viralWindow.bestDay}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Best Day</div>
                            </div>
                            <div className="glass-card" style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '1.8rem', marginBottom: 8 }}>⏰</div>
                                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>{r.viralWindow.bestTime}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Best Time</div>
                            </div>
                            <div className="glass-card" style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '1.8rem', marginBottom: 8 }}>📈</div>
                                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{r.viralWindow.reason}</div>
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
                </>
            )}
        </div>
    );
}
