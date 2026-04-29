import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, PenTool, Share2, Shield, Mic, Globe, Image as ImageIcon, Music, Play, Search, Box, ChevronRight, Activity, Zap } from 'lucide-react';

function ModuleCard({ icon, title, desc, route, color, delay, className = "" }) {
    const navigate = useNavigate();
    return (
        <motion.div
            className={`glass-card ${className}`}
            style={{ cursor: 'pointer' }}
            onClick={() => navigate(route)}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.5, ease: 'easeOut' }}
            whileHover={{ y: -5, scale: 1.02 }}
        >
            <div className="flex items-center gap-md mb-md">
                <div style={{
                    width: 44, height: 44, borderRadius: 12,
                    background: `${color}15`, display: 'flex',
                    alignItems: 'center', justifyContent: 'center', color: color
                }}>{icon}</div>
                <div style={{ fontWeight: 800, fontSize: '1.05rem', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>{title}</div>
            </div>
            <p style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem', lineHeight: 1.6 }}>{desc}</p>
        </motion.div>
    );
}

function FlowStep({ num, label, icon }) {
    return (
        <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: num * 0.1 + 0.5 }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}
        >
            <div style={{
                width: 48, height: 48, borderRadius: 14,
                background: 'var(--glass-bg-active)', border: '1px solid var(--glass-border-hover)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)'
            }}>{icon}</div>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-tertiary)' }}>{label}</span>
        </motion.div>
    );
}

function FlowArrow() {
    return <div style={{ color: 'var(--glass-border-hover)', marginTop: -20 }}><ChevronRight size={20} /></div>;
}

export default function Dashboard() {
    return (
        <div className="page-enter">
            <div className="page-header">
                <motion.h1 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>Welcome to ContentIQ</motion.h1>
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>AI-Powered Content Intelligence for Video Creators</motion.p>
            </div>

            <div className="grid-4 mb-xl">
                <div className="glass-card stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(168,85,247,0.15)', color: '#A855F7' }}><Box size={20} /></div>
                    <div className="stat-value">8</div>
                    <div className="stat-label">AI Modules</div>
                    <div className="stat-change up">▲ All Active</div>
                </div>
                <div className="glass-card stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(52,211,153,0.15)', color: '#34D399' }}><Zap size={20} /></div>
                    <div className="stat-value">Gemini</div>
                    <div className="stat-label">AI Engine</div>
                    <div className="stat-change up">1.5 Pro</div>
                </div>
                <div className="glass-card stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(96,165,250,0.15)', color: '#60A5FA' }}><Mic size={20} /></div>
                    <div className="stat-value">11Labs</div>
                    <div className="stat-label">Voice Engine</div>
                    <div className="stat-change up">Connected</div>
                </div>
                <div className="glass-card stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(251,191,36,0.15)', color: '#FBBF24' }}><Globe size={20} /></div>
                    <div className="stat-value">29+</div>
                    <div className="stat-label">Languages</div>
                    <div className="stat-change up">Dubbing Ready</div>
                </div>
            </div>

            <div className="section-title"><span className="section-icon"><Sparkles size={18} color="var(--purple-light)" /></span> Intelligence Modules</div>
            <div className="bento-grid mb-xl">
                <ModuleCard className="bento-span-2 bento-row-2" icon={<Sparkles size={24} />} title="Video Intelligence Engine" desc="Upload video → scene detection → engagement scoring → thumbnail selection. Deep dive into frame-by-frame CTR prediction and dynamic segment analysis using Gemini 1.5 Pro native multi-modal capabilities." route="/video-intelligence" color="#A855F7" delay={0.1} />
                <ModuleCard icon={<PenTool size={20} />} title="Trend-to-Script" desc="Trending topics → structured scripts with hooks & CTAs." route="/trend-script" color="#60A5FA" delay={0.2} />
                <ModuleCard icon={<Share2 size={20} />} title="Distribution" desc="Auto-generate optimized content for all platforms." route="/distribution" color="#34D399" delay={0.3} />
                <ModuleCard icon={<Shield size={20} />} title="Privacy Filter" desc="Detect faces, plates, and auto-blur sensitive data." route="/privacy" color="#F87171" delay={0.4} />
                <ModuleCard icon={<Mic size={20} />} title="Voice Tracker" desc="Build voice profiles & score scripts." route="/voice-tracker" color="#FBBF24" delay={0.5} />
                <ModuleCard className="bento-span-2" icon={<Globe size={20} />} title="Multilingual Dubbing" desc="Translate & dub with emotion-matched ElevenLabs voices, automatically synced." route="/dubbing" color="#C084FC" delay={0.6} />
                <ModuleCard icon={<ImageIcon size={20} />} title="Thumbnails" desc="Color psychology & CTR scoring." route="/thumbnail" color="#FB923C" delay={0.7} />
                <ModuleCard icon={<Music size={20} />} title="BGM Suggester" desc="Scene-based music generation." route="/bgm" color="#38BDF8" delay={0.8} />
            </div>

            <div className="section-title"><span className="section-icon"><Activity size={18} color="var(--purple-light)" /></span> Demo Flow</div>
            <div className="glass-card-static" style={{ padding: 'var(--space-xl)' }}>
                <div className="flex items-center gap-md" style={{ flexWrap: 'wrap', justifyContent: 'center' }}>
                    <FlowStep num={1} label="Upload Video" icon={<Play size={20} />} />
                    <FlowArrow />
                    <FlowStep num={2} label="Scene Analysis" icon={<Search size={20} />} />
                    <FlowArrow />
                    <FlowStep num={3} label="BGM Suggestions" icon={<Music size={20} />} />
                    <FlowArrow />
                    <FlowStep num={4} label="Script Gen" icon={<PenTool size={20} />} />
                    <FlowArrow />
                    <FlowStep num={5} label="Dubbing" icon={<Globe size={20} />} />
                    <FlowArrow />
                    <FlowStep num={6} label="Distribution" icon={<Share2 size={20} />} />
                    <FlowArrow />
                    <FlowStep num={7} label="Export" icon={<Box size={20} />} />
                </div>
            </div>
        </div>
    );
}
