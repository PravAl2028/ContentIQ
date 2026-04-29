import { useState } from 'react';
import { hasGeminiKey, hasElevenLabsKey } from '../services/api.js';
import { useToast } from '../context/ToastContext.jsx';

export default function Settings() {
    const { showToast } = useToast();
    const [geminiKey, setGeminiKey] = useState(localStorage.getItem('GEMINI_API_KEY') || '');
    const [elevenLabsKey, setElevenLabsKey] = useState(localStorage.getItem('ELEVENLABS_API_KEY') || '');

    const handleSave = () => {
        if (geminiKey.trim()) localStorage.setItem('GEMINI_API_KEY', geminiKey.trim());
        else localStorage.removeItem('GEMINI_API_KEY');

        if (elevenLabsKey.trim()) localStorage.setItem('ELEVENLABS_API_KEY', elevenLabsKey.trim());
        else localStorage.removeItem('ELEVENLABS_API_KEY');

        showToast('API keys saved successfully!', 'success');
    };

    const geminiConnected = hasGeminiKey();
    const elevenConnected = hasElevenLabsKey();

    return (
        <div className="page-enter">
            <div className="page-header">
                <h1>⚙️ Settings</h1>
                <p>Configure API keys and preferences</p>
            </div>

            <div className="glass-card-static mb-lg" style={{ maxWidth: 600 }}>
                <div className="section-title"><span className="section-icon">🔑</span> API Configuration</div>

                <div className="settings-row">
                    <label>Gemini API Key</label>
                    <input type="password" className="form-input" value={geminiKey} onChange={e => setGeminiKey(e.target.value)} placeholder="Enter your Gemini API key..." />
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        Required for all AI analysis features. Get one at{' '}
                        <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--purple-light)' }}>AI Studio</a>
                    </span>
                </div>

                <div className="settings-row">
                    <label>ElevenLabs API Key</label>
                    <input type="password" className="form-input" value={elevenLabsKey} onChange={e => setElevenLabsKey(e.target.value)} placeholder="Enter your ElevenLabs API key..." />
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        Required for voice dubbing and BGM generation. Get one at{' '}
                        <a href="https://elevenlabs.io/app/settings/api-keys" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--purple-light)' }}>ElevenLabs</a>
                    </span>
                </div>

                <button className="btn btn-primary" onClick={handleSave}>💾 Save API Keys</button>
            </div>

            <div className="glass-card-static" style={{ maxWidth: 600 }}>
                <div className="section-title"><span className="section-icon">ℹ️</span> About ContentIQ</div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                    ContentIQ is an AI-Powered Content Intelligence Platform built for video creators.
                    It uses <strong>Gemini 1.5 Pro</strong> for analysis and generation, and <strong>ElevenLabs</strong>{' '}
                    for voice dubbing and music generation.
                </p>
                <div className="flex gap-md mt-md">
                    <span className="tag tag-purple">v1.0.0</span>
                    <span className={`tag ${geminiConnected ? 'tag-success' : 'tag-warning'}`}>
                        Gemini: {geminiConnected ? 'Connected' : 'Not Set'}
                    </span>
                    <span className={`tag ${elevenConnected ? 'tag-success' : 'tag-warning'}`}>
                        ElevenLabs: {elevenConnected ? 'Connected' : 'Not Set'}
                    </span>
                </div>
            </div>
        </div>
    );
}
