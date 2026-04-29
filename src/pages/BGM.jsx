import { useState, useCallback } from 'react';
import { callGemini, parseGeminiJSON, hasGeminiKey, elevenLabsSoundGen, hasElevenLabsKey } from '../services/api.js';
import { useToast } from '../context/ToastContext.jsx';

const ALLOWED_TONES = ['Dramatic', 'Sad', 'Love', 'Joyful', 'Epic', 'Suspenseful', 'Relaxing', 'Calm', 'Thoughtful', 'Confident', 'Uplifting', 'Energetic', 'Chill'];

const toneColors = {
    Dramatic: '#DC2626', Sad: '#6366F1', Love: '#EC4899', Joyful: '#F59E0B',
    Epic: '#EF4444', Suspenseful: '#7C3AED', Relaxing: '#10B981', Calm: '#06B6D4',
    Thoughtful: '#8B5CF6', Confident: '#F97316', Uplifting: '#22C55E', Energetic: '#EF4444', Chill: '#14B8A6'
};

const toneEmojis = {
    Dramatic: '🎭', Sad: '😢', Love: '💕', Joyful: '🎉', Epic: '⚔️', Suspenseful: '😰',
    Relaxing: '🌿', Calm: '☁️', Thoughtful: '🤔', Confident: '💪', Uplifting: '🌅', Energetic: '⚡', Chill: '🧊'
};

const energyLabel = { low: '🌊 Low', medium: '⚡ Medium', high: '🔥 High' };
const pacingLabel = { slow: '🐢 Slow', medium: '🚶 Medium', fast: '🏃 Fast' };

export default function BGM() {
    const { showToast } = useToast();
    const [transcriptText, setTranscriptText] = useState('Opening hook about 5 AI tools, high energy. Then walkthrough of each tool with screen recordings, calm and focused. A key insight moment with high emotion. Tutorial segment with step-by-step instructions. Closing CTA with subscribe prompt, high energy upbeat ending.');
    const [loading, setLoading] = useState(false);
    const [loadingText, setLoadingText] = useState('Analyzing scene moods...');
    const [suggestions, setSuggestions] = useState(null);

    const generateBGM = useCallback(async () => {
        if (!transcriptText.trim()) { showToast('Please enter transcript or scene descriptions', 'warning'); return; }

        if (!hasGeminiKey()) {
            showToast('Gemini API key required — add it in Settings', 'warning');
            return;
        }

        setLoading(true);
        setSuggestions(null);
        setLoadingText('Analyzing content mood with Gemini AI...');

        try {
            const prompt = `You are an AI tone classifier used in a Background Music Suggestion system.

Your job is to analyze user content (text, transcript, audio description, or video description) and select the most appropriate background music tones.

You must behave strictly as a classifier.

DO NOT generate explanations.
DO NOT generate commentary.
DO NOT invent new tone names.
DO NOT return anything outside the required JSON format.

You MUST choose tones only from the list below.

Allowed tones:

Dramatic
Sad
Love
Joyful
Epic
Suspenseful
Relaxing
Calm
Thoughtful
Confident
Uplifting
Energetic
Chill

Classification Rules:

• Dramatic → emotional tension, conflicts, serious scenes
• Sad → loss, rejection, heartbreak, grief
• Love → romance, affection, emotional bonding
• Joyful → celebration, happiness, fun moments
• Epic → heroic, powerful, victory or adventure scenes
• Suspenseful → mystery, tension, thriller or danger
• Relaxing → peaceful environments, nature, slow moments
• Calm → neutral conversations, quiet scenes
• Thoughtful → reflective moments, thinking, narration
• Confident → leadership, success, determination
• Uplifting → motivation, inspiration, progress
• Energetic → action, sports, excitement, fast activity
• Chill → casual, everyday moments, neutral vibe

Energy rules:

low → Calm, Relaxing, Sad, Chill
medium → Thoughtful, Love, Joyful, Confident
high → Energetic, Epic, Dramatic, Suspenseful, Uplifting

Pacing rules:

slow → emotional or reflective scenes
medium → dialogue or storytelling
fast → action, tension, excitement

IMPORTANT: You must return MULTIPLE suggestions (3-5 different BGM options) that would work well for this content. Each suggestion should have a DIFFERENT tone to give the user variety.

Return ONLY a JSON array in this exact format:

[
  {
    "tone": "",
    "confidence": 0.0,
    "energy_level": "low | medium | high",
    "pacing": "slow | medium | fast",
    "music_keywords": ["", "", ""],
    "music_prompt": ""
  }
]

music_prompt must be a short phrase suitable for generating background music.

CONTENT TO ANALYZE:
${transcriptText}`;

            const response = await callGemini(prompt);
            setLoadingText('Processing AI classifications...');
            const parsed = parseGeminiJSON(response);

            if (parsed) {
                // Handle both array and single object responses
                const items = Array.isArray(parsed) ? parsed : [parsed];

                // Validate all tones
                const validated = items.map(item => ({
                    ...item,
                    tone: ALLOWED_TONES.includes(item.tone) ? item.tone : 'Chill'
                }));

                setSuggestions(validated);
                setLoading(false);
                showToast(`Generated ${validated.length} BGM suggestion(s)`, 'success');
            } else {
                throw new Error('Failed to parse AI BGM classification response.');
            }
        } catch (err) {
            setLoading(false);
            showToast('BGM analysis failed: ' + err.message, 'error');
        }
    }, [transcriptText, showToast]);

    return (
        <div className="page-enter">
            <div className="page-header">
                <h1>🎵 Music & BGM Suggester</h1>
                <p>AI-powered background music tone classifier and style recommender</p>
            </div>

            <div className="glass-card-static mb-lg">
                <div className="section-title"><span className="section-icon">📝</span> Video Content</div>
                <div className="form-group mb-lg">
                    <label className="form-label">Transcript / Scene Descriptions</label>
                    <textarea className="form-textarea" rows="5" value={transcriptText} onChange={e => setTranscriptText(e.target.value)} placeholder="Paste your video transcript or describe scenes..." />
                </div>
                <div className="flex gap-md items-center">
                    <button className="btn btn-primary" onClick={generateBGM}>🎵 Analyze & Suggest BGM</button>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{hasGeminiKey() ? '🟢 Gemini Connected' : '🔴 API Key Required'}</span>
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

            {suggestions && suggestions.length > 0 && (
                <>
                    <div className="flex items-center justify-between mb-lg">
                        <div className="section-title" style={{ marginBottom: 0 }}><span className="section-icon">🎶</span> BGM Suggestions</div>
                        <span className="tag tag-purple" style={{ fontSize: '0.82rem' }}>{suggestions.length} Options</span>
                    </div>

                    {suggestions.map((s, idx) => {
                        const color = toneColors[s.tone] || 'var(--purple-main)';
                        const emoji = toneEmojis[s.tone] || '🎵';
                        return (
                            <div className="glass-card-static mb-lg" key={idx} style={{ borderLeft: `3px solid ${color}` }}>
                                {/* Header row: Tone + Confidence */}
                                <div className="flex items-center justify-between mb-md">
                                    <div className="flex items-center gap-md">
                                        <span style={{ fontSize: '1.6rem' }}>{emoji}</span>
                                        <div>
                                            <div style={{ fontSize: '1.2rem', fontWeight: 800, color }}>{s.tone}</div>
                                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Suggestion {idx + 1}</div>
                                        </div>
                                    </div>
                                    <div className="confidence-bar">
                                        <span className="confidence-label">Confidence</span>
                                        <div className="progress-bar" style={{ width: 80 }}>
                                            <div className="progress-fill" style={{ width: `${(s.confidence || 0) * 100}%` }}></div>
                                        </div>
                                        <span className="confidence-value">{Math.round((s.confidence || 0) * 100)}%</span>
                                    </div>
                                </div>

                                {/* Energy / Pacing row */}
                                <div className="grid-3 mb-md" style={{ gap: '12px' }}>
                                    <div className="glass-card" style={{ textAlign: 'center', padding: '10px 8px' }}>
                                        <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                                            {energyLabel[s.energy_level] || s.energy_level}
                                        </div>
                                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Energy</div>
                                    </div>
                                    <div className="glass-card" style={{ textAlign: 'center', padding: '10px 8px' }}>
                                        <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                                            {pacingLabel[s.pacing] || s.pacing}
                                        </div>
                                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Pacing</div>
                                    </div>
                                    <div className="glass-card" style={{ textAlign: 'center', padding: '10px 8px' }}>
                                        <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', lineHeight: 1.3 }}>
                                            {s.music_prompt || 'N/A'}
                                        </div>
                                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 2 }}>Music Prompt</div>
                                    </div>
                                </div>

                                {/* Keywords */}
                                <div className="flex gap-sm" style={{ flexWrap: 'wrap' }}>
                                    {(s.music_keywords || []).map((kw, i) => (
                                        <span className="tag tag-purple" key={i} style={{ fontSize: '0.82rem', padding: '4px 12px' }}>{kw}</span>
                                    ))}
                                </div>
                            </div>
                        );
                    })}

                    {/* Tone Palette */}
                    <div className="glass-card-static">
                        <div className="section-title"><span className="section-icon">🎨</span> Tone Palette</div>
                        <div className="flex gap-sm" style={{ flexWrap: 'wrap' }}>
                            {ALLOWED_TONES.map(tone => {
                                const isUsed = suggestions.some(s => s.tone === tone);
                                const color = toneColors[tone] || 'var(--purple-main)';
                                return (
                                    <span key={tone} style={{
                                        fontSize: '0.78rem', padding: '4px 12px', borderRadius: 'var(--radius-full)',
                                        background: isUsed ? color : 'var(--glass-bg)',
                                        color: isUsed ? '#fff' : 'var(--text-muted)',
                                        border: isUsed ? `1px solid ${color}` : '1px solid var(--glass-border)',
                                        fontWeight: isUsed ? 700 : 400,
                                        transition: 'all 0.2s'
                                    }}>
                                        {tone}
                                    </span>
                                );
                            })}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
