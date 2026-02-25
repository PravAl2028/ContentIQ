import { useNavigate } from 'react-router-dom';

function ModuleCard({ icon, title, desc, route, color }) {
    const navigate = useNavigate();
    return (
        <div className="glass-card" style={{ cursor: 'pointer' }} onClick={() => navigate(route)}>
            <div className="flex items-center gap-md mb-md">
                <div style={{
                    width: 40, height: 40, borderRadius: 10,
                    background: `${color}15`, display: 'flex',
                    alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem'
                }}>{icon}</div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{title}</div>
            </div>
            <p style={{ color: 'var(--text-tertiary)', fontSize: '0.82rem', lineHeight: 1.5 }}>{desc}</p>
        </div>
    );
}

function FlowStep({ num, label, icon }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: 'var(--glass-bg-active)', border: '1px solid var(--glass-border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem'
            }}>{icon}</div>
            <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-tertiary)' }}>{label}</span>
        </div>
    );
}

function FlowArrow() {
    return <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>→</div>;
}

export default function Dashboard() {
    return (
        <div className="page-enter">
            <div className="page-header">
                <h1>Welcome to ContentIQ</h1>
                <p>AI-Powered Content Intelligence for Video Creators</p>
            </div>

            <div className="grid-4 mb-xl">
                <div className="glass-card stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(168,85,247,0.15)', color: '#A855F7' }}>🎬</div>
                    <div className="stat-value">8</div>
                    <div className="stat-label">AI Modules</div>
                    <div className="stat-change up">▲ All Active</div>
                </div>
                <div className="glass-card stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(52,211,153,0.15)', color: '#34D399' }}>⚡</div>
                    <div className="stat-value">Gemini</div>
                    <div className="stat-label">AI Engine</div>
                    <div className="stat-change up">1.5 Pro</div>
                </div>
                <div className="glass-card stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(96,165,250,0.15)', color: '#60A5FA' }}>🎙️</div>
                    <div className="stat-value">11Labs</div>
                    <div className="stat-label">Voice Engine</div>
                    <div className="stat-change up">Connected</div>
                </div>
                <div className="glass-card stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(251,191,36,0.15)', color: '#FBBF24' }}>🌐</div>
                    <div className="stat-value">29+</div>
                    <div className="stat-label">Languages</div>
                    <div className="stat-change up">Dubbing Ready</div>
                </div>
            </div>

            <div className="section-title"><span className="section-icon">🧠</span> Intelligence Modules</div>
            <div className="grid-2 mb-xl">
                <ModuleCard icon="🎬" title="Video Intelligence Engine" desc="Upload video → scene detection → engagement scoring → thumbnail selection" route="/video-intelligence" color="#A855F7" />
                <ModuleCard icon="✍️" title="Trend-to-Script Generator" desc="Trending topics → structured scripts with hooks, value points & CTAs" route="/trend-script" color="#60A5FA" />
                <ModuleCard icon="📱" title="Distribution Planner" desc="Auto-generate optimized content for YouTube, TikTok & Instagram" route="/distribution" color="#34D399" />
                <ModuleCard icon="🔒" title="Privacy Filter" desc="Detect faces, plates, screens & location data for auto-blur" route="/privacy" color="#F87171" />
                <ModuleCard icon="🎤" title="Creator Voice Tracker" desc="Build voice profile & score scripts for brand consistency" route="/voice-tracker" color="#FBBF24" />
                <ModuleCard icon="🌐" title="Multilingual Dubbing" desc="Translate & dub with emotion-matched ElevenLabs voices" route="/dubbing" color="#C084FC" />
                <ModuleCard icon="🖼️" title="Thumbnail Analyzer" desc="Color psychology, CTR scoring & LUT suggestions" route="/thumbnail" color="#FB923C" />
                <ModuleCard icon="🎵" title="BGM Suggester" desc="Scene-based music generation via ElevenLabs Sound API" route="/bgm" color="#38BDF8" />
            </div>

            <div className="section-title"><span className="section-icon">🚀</span> Demo Flow</div>
            <div className="glass-card-static">
                <div className="flex items-center gap-md" style={{ flexWrap: 'wrap' }}>
                    <FlowStep num={1} label="Upload Video" icon="🎬" />
                    <FlowArrow />
                    <FlowStep num={2} label="Scene Analysis" icon="🔍" />
                    <FlowArrow />
                    <FlowStep num={3} label="BGM Suggestions" icon="🎵" />
                    <FlowArrow />
                    <FlowStep num={4} label="Script Gen" icon="✍️" />
                    <FlowArrow />
                    <FlowStep num={5} label="Dubbing" icon="🌐" />
                    <FlowArrow />
                    <FlowStep num={6} label="Distribution" icon="📱" />
                    <FlowArrow />
                    <FlowStep num={7} label="Export" icon="📦" />
                </div>
            </div>
        </div>
    );
}
