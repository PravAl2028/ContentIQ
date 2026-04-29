import { useState, useCallback } from 'react';
import { callGemini, parseGeminiJSON, hasGeminiKey } from '../services/api.js';
import { useToast } from '../context/ToastContext.jsx';

const renderMarkdown = (text) => {
    if (!text) return null;
    return text.split('\n').map((line, i) => {
        let isListItem = false;
        let processedLine = line;

        if (processedLine.trim().startsWith('* ')) {
            isListItem = true;
            processedLine = processedLine.trim().substring(2);
        } else if (processedLine.trim().startsWith('- ')) {
            isListItem = true;
            processedLine = processedLine.trim().substring(2);
        }

        const parts = processedLine.split(/(\*\*.*?\*\*)/g);

        const formattedElements = parts.map((part, index) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={index} style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{part.slice(2, -2)}</strong>;
            }
            return part;
        });

        if (isListItem) {
            return (
                <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '8px', marginLeft: '12px', lineHeight: 1.5 }}>
                    <span style={{ color: 'var(--purple-light)' }}>•</span>
                    <span>{formattedElements}</span>
                </div>
            );
        }

        return <div key={i} style={{ minHeight: '1.2em', marginBottom: '4px', lineHeight: 1.5 }}>{formattedElements}</div>;
    });
};

export default function Distribution() {
    const { showToast } = useToast();
    const [title, setTitle] = useState('5 Free AI Tools That Replaced My Virtual Assistant');
    const [niche, setNiche] = useState('Tech/Productivity');
    const [desc, setDesc] = useState('A walkthrough of 5 free AI tools that automate tasks previously handled by a virtual assistant.');
    const [sourceLinks, setSourceLinks] = useState('https://notion.so\nhttps://gamma.app');
    const [selectedPlatformsForSources, setSelectedPlatformsForSources] = useState(['youtube', 'shorts']);
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
                showToast('Please enter your Gemini API Key in Settings to generate a plan.', 'warning');
                setLoading(false);
                return;
            }

            const platformsWithSources = selectedPlatformsForSources || [];
            const sourcesText = sourceLinks ? `\n- Sources/Links to include: ${sourceLinks}` : "";

            const getSourceInstruction = (platform) => {
                if (sourceLinks && platformsWithSources.includes(platform)) {
                    return `\n   - CRITICAL REQUIREMENT: You MUST include the following sources/links naturally into the ${platform} content: "${sourceLinks}". Ensure they are clearly visible and clickable where supported.`;
                }
                return `\n   - Do NOT include any external links or sources in the ${platform} content.`;
            };

            const prompt = `You are an expert social media manager and digital marketing strategist. 
I have a video with the following details:
- Title: ${title}
- Category: ${niche}
- Description: ${desc}${sourcesText}

Generate a comprehensive social media distribution plan for this video.
Create highly engaging, platform-specific content for YouTube, YouTube Shorts, Instagram, X (Twitter), and Facebook.

Follow these rules for each platform:
1. YouTube: Analyze the provided video description thoroughly. Write a highly professional, engaging, and in-depth SEO-optimized video description. You must expand on the provided points to make them compelling, rather than just copying or summarizing them. Structure the description beautifully with an intriguing hook, clear paragraphs, and key takeaways (if applicable). Ensure absolutely NO important details or context from the original description are missed. if any dates are mentioned include it Include 5-8 relevant hashtags at the bottom.${getSourceInstruction('youtube')}
2. YouTube Shorts: Create a highly energetic, fast-paced, and punchy description optimized specifically for the Shorts feed. Focus on creating a strong hook in the first sentence to stop the scroll. Make it distinct from the main YouTube description by being quick and to the point. Include 3-5 trending hashtags.${getSourceInstruction('shorts')}
3. Instagram: Write a visually appealing and engaging caption tailored for Instagram Reels/Posts. Use relevant emojis, break up text with line spacing, and include a clear Call-To-Action (CTA) encouraging comments or saves. The tone should be highly social and interactive, distinct from the YouTube formats. Add 10-15 targeted hashtags at the bottom.${getSourceInstruction('instagram')}
4. X (Twitter): Write a concise, high-impact tweet that sparks curiosity or debate. It MUST be under 280 characters (including hashtags). Focus on a strong hook or an intriguing stat/quote from the video. Do not just summarize; make it snappy and shareable. Include 2-4 highly relevant hashtags.${getSourceInstruction('x')}
5. Facebook: Write a conversational, community-focused post tailored for Facebook audiences. It should be longer than a tweet but more casual than a YouTube description. Ask a question to encourage discussion in the comments and build a sense of community. Include 3-5 hashtags.${getSourceInstruction('facebook')}

Return ONLY valid JSON in the exact structure below. Do not include markdown formatting like \`\`\`json.
CRITICAL: All string values MUST have newlines properly escaped as \\n and double quotes escaped as \\".

{
  "youtube": {
    "content": "Full YouTube description here...",
    "hashtags": ["#tag1", "#tag2"]
  },
  "shorts": {
    "content": "Shorts description here...",
    "hashtags": ["#tag1", "#tag2"]
  },
  "instagram": {
    "content": "Instagram caption here...",
    "hashtags": ["#tag1", "#tag2"]
  },
  "x": {
    "content": "Tweet content here...",
    "hashtags": ["#tag1", "#tag2"]
  },
  "facebook": {
    "content": "Facebook post here...",
    "hashtags": ["#tag1", "#tag2"]
  }
}`;

            const response = await callGemini(prompt);
            const parsed = parseGeminiJSON(response);

            if (parsed) {
                showPlanResults({
                    module: 'distribution_planner', status: 'success', confidence: 0.94, results: parsed,
                    recommendations: ['Post YouTube first then repurpose to Shorts and Instagram', 'Cross-promote on all platforms within 2 hours of upload']
                });
            } else {
                throw new Error("Failed to parse AI response into the required JSON format.");
            }
        } catch (err) {
            setLoading(false);
            showToast('Generation failed: ' + err.message, 'error');
        }
    }, [title, niche, desc, sourceLinks, selectedPlatformsForSources, showToast, showPlanResults]);

    const r = data?.results;

    return (
        <div className="page-enter">
            <div className="page-header">
                <h1>📱 Multi-Platform Distribution Planner</h1>
                <p>Generate optimized content packages for YouTube, Shorts, Instagram, X, and Facebook</p>
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
                
                <div className="form-group mb-lg">
                    <label className="form-label">Sources / Links to Include</label>
                    <textarea className="form-textarea" rows="2" value={sourceLinks} onChange={e => setSourceLinks(e.target.value)} placeholder="e.g., https://example.com" />
                </div>
                
                <div className="form-group mb-xl">
                    <label className="form-label" style={{ marginBottom: 12 }}>Include Sources In:</label>
                    <div className="flex gap-md" style={{ flexWrap: 'wrap' }}>
                        {['youtube', 'shorts', 'instagram', 'x', 'facebook'].map(plat => (
                            <label key={plat} className="flex items-center gap-sm" style={{ cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '0.9rem', background: 'var(--glass-bg-active)', padding: '6px 12px', borderRadius: 'var(--radius-full)', border: selectedPlatformsForSources.includes(plat) ? '1px solid var(--purple-main)' : '1px solid transparent' }}>
                                <input 
                                    type="checkbox" 
                                    style={{ display: 'none' }}
                                    checked={selectedPlatformsForSources.includes(plat)}
                                    onChange={(e) => {
                                        if (e.target.checked) setSelectedPlatformsForSources(prev => [...prev, plat]);
                                        else setSelectedPlatformsForSources(prev => prev.filter(p => p !== plat));
                                    }}
                                />
                                {selectedPlatformsForSources.includes(plat) ? <span style={{ color: 'var(--lavender)' }}>✓</span> : <span style={{ opacity: 0.3 }}>+</span>}
                                {plat === 'x' ? 'X (Twitter)' : plat.charAt(0).toUpperCase() + plat.slice(1)}
                            </label>
                        ))}
                    </div>
                </div>

                <div className="flex gap-md">
                    <button className="btn btn-primary" onClick={generatePlan}>📱 Generate Distribution Plan</button>
                </div>
            </div>

            {loading && (
                <div className="glass-card-static mb-lg">
                    <div className="flex flex-col items-center justify-center gap-md" style={{ padding: 40 }}>
                        <div className="spinner"></div>
                        <div className="loading-text">Crafting 5 platform-optimized packages...</div>
                        <div className="pulse-loader"><span></span><span></span><span></span></div>
                    </div>
                </div>
            )}

            {data && r && (
                <>
                    <div className="flex items-center justify-between mb-lg">
                        <div className="section-title" style={{ marginBottom: 0 }}><span className="section-icon">📊</span> Distribution Plan</div>
                        <div className="confidence-bar">
                            <span className="confidence-label">AI Confidence</span>
                            <div className="progress-bar" style={{ width: 80 }}><div className="progress-fill" style={{ width: `${data.confidence * 100}%` }}></div></div>
                            <span className="confidence-value">{Math.round(data.confidence * 100)}%</span>
                        </div>
                    </div>

                    <div className="grid-1 gap-lg mb-lg">
                        {[
                            { key: 'youtube', name: 'YouTube', icon: '▶️', color: '#FF0000', badge: 'Primary' },
                            { key: 'shorts', name: 'YouTube Shorts', icon: '📱', color: '#FF0000' },
                            { key: 'instagram', name: 'Instagram', icon: '📸', color: '#E1306C' },
                            { key: 'x', name: 'X (Twitter)', icon: '🐦', color: '#1DA1F2' },
                            { key: 'facebook', name: 'Facebook', icon: '📘', color: '#1877F2' }
                        ].map(plat => {
                            if (!r[plat.key]) return null;
                            return (
                                <div key={plat.key} className="glass-card-static platform-card">
                                    <div className="platform-card-header" style={{ color: plat.color }}>
                                        <span style={{ fontSize: '1.2rem' }}>{plat.icon}</span> {plat.name}
                                        {plat.badge && <span className="tag tag-danger" style={{ marginLeft: 'auto' }}>{plat.badge}</span>}
                                    </div>
                                    <div className="platform-card-body">
                                        <div className="form-group mb-md">
                                            <label className="form-label">Content</label>
                                            <div style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', padding: '8px 0' }}>
                                                {renderMarkdown(r[plat.key].content)}
                                            </div>
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Hashtags</label>
                                            <div className="flex gap-sm" style={{ flexWrap: 'wrap' }}>
                                                {r[plat.key].hashtags?.map((t, i) => <span className="tag tag-purple" key={i}>{t}</span>)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="glass-card-static">
                        <div className="section-title"><span className="section-icon">💡</span> Strategic Recommendations</div>
                        {data.recommendations?.map((rec, i) => (
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
