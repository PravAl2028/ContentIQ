import { NavLink, Routes, Route, Navigate } from 'react-router-dom';
import { hasGeminiKey, hasElevenLabsKey } from './services/api.js';
import { useState, useEffect } from 'react';

import Dashboard from './pages/Dashboard.jsx';
import VideoIntelligence from './pages/VideoIntelligence.jsx';
import TrendScript from './pages/TrendScript.jsx';
import Distribution from './pages/Distribution.jsx';
import Privacy from './pages/Privacy.jsx';
import VoiceTracker from './pages/VoiceTracker.jsx';
import Dubbing from './pages/Dubbing.jsx';
import Thumbnail from './pages/Thumbnail.jsx';
import BGM from './pages/BGM.jsx';
import Settings from './pages/Settings.jsx';

const NAV_ITEMS = [
    { id: 'dashboard', path: '/', label: 'Dashboard', icon: '📊', section: 'Overview' },
    { id: 'video-intelligence', path: '/video-intelligence', label: 'Video Intelligence', icon: '🎬', section: 'Analysis', badge: 'AI' },
    { id: 'trend-script', path: '/trend-script', label: 'Script Generator', icon: '✍️', section: 'Analysis' },
    { id: 'distribution', path: '/distribution', label: 'Distribution', icon: '📱', section: 'Distribution' },
    { id: 'privacy', path: '/privacy', label: 'Privacy Filter', icon: '🔒', section: 'Distribution' },
    { id: 'voice-tracker', path: '/voice-tracker', label: 'Voice Tracker', icon: '🎤', section: 'Creator Tools' },
    { id: 'dubbing', path: '/dubbing', label: 'Multilingual Dubbing', icon: '🌐', section: 'Creator Tools', badge: '11Labs' },
    { id: 'thumbnail', path: '/thumbnail', label: 'Thumbnail Analyzer', icon: '🖼️', section: 'Creator Tools' },
    { id: 'bgm', path: '/bgm', label: 'BGM Suggester', icon: '🎵', section: 'Creator Tools', badge: '11Labs' },
    { id: 'settings', path: '/settings', label: 'Settings', icon: '⚙️', section: 'System' },
];

function ApiStatusIndicator() {
    const [status, setStatus] = useState({ gemini: false, eleven: false });

    useEffect(() => {
        const check = () => setStatus({ gemini: hasGeminiKey(), eleven: hasElevenLabsKey() });
        check();
        // Re-check periodically (since keys are stored in localStorage)
        const interval = setInterval(check, 2000);
        return () => clearInterval(interval);
    }, []);

    const { gemini, eleven } = status;
    let dotClass = 'api-status-dot';
    let dotStyle = {};
    let text = 'API Keys Required';

    if (gemini && eleven) {
        dotClass = 'api-status-dot connected';
        text = 'All APIs Connected';
    } else if (gemini || eleven) {
        dotStyle = { background: 'var(--warning)', boxShadow: '0 0 8px var(--warning)' };
        text = gemini ? 'Gemini OK · No ElevenLabs' : 'ElevenLabs OK · No Gemini';
    }

    return (
        <div className="sidebar-footer-item glass-subtle">
            <div className={dotClass} style={dotStyle}></div>
            <span className="api-status-text">{text}</span>
        </div>
    );
}

export default function App() {
    // Build sections for nav
    let lastSection = '';
    const navElements = [];

    for (const item of NAV_ITEMS) {
        if (item.section !== lastSection) {
            navElements.push(
                <div key={`section-${item.section}`} className="nav-section-label">
                    {item.section}
                </div>
            );
            lastSection = item.section;
        }
        navElements.push(
            <NavLink
                key={item.id}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            >
                <span className="nav-icon">{item.icon}</span>
                <span>{item.label}</span>
                {item.badge && <span className="nav-badge">{item.badge}</span>}
            </NavLink>
        );
    }

    return (
        <div id="app">
            <aside className="sidebar">
                <div className="sidebar-brand">
                    <div className="brand-icon">
                        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                            <path d="M14 2L26 8V20L14 26L2 20V8L14 2Z" stroke="url(#brandGrad)" strokeWidth="2" fill="none" />
                            <circle cx="14" cy="14" r="5" fill="url(#brandGrad)" />
                            <defs>
                                <linearGradient id="brandGrad" x1="2" y1="2" x2="26" y2="26">
                                    <stop stopColor="#A855F7" />
                                    <stop offset="1" stopColor="#6B21A8" />
                                </linearGradient>
                            </defs>
                        </svg>
                    </div>
                    <span className="brand-name">ContentIQ</span>
                </div>
                <nav className="sidebar-nav">
                    {navElements}
                </nav>
                <div className="sidebar-footer">
                    <ApiStatusIndicator />
                </div>
            </aside>
            <main className="main-content">
                <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/video-intelligence" element={<VideoIntelligence />} />
                    <Route path="/trend-script" element={<TrendScript />} />
                    <Route path="/distribution" element={<Distribution />} />
                    <Route path="/privacy" element={<Privacy />} />
                    <Route path="/voice-tracker" element={<VoiceTracker />} />
                    <Route path="/dubbing" element={<Dubbing />} />
                    <Route path="/thumbnail" element={<Thumbnail />} />
                    <Route path="/bgm" element={<BGM />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </main>
        </div>
    );
}
