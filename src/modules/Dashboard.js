// ============================================================
// ContentIQ — Dashboard Overview Module
// ============================================================

export function renderDashboard() {
    return `
  <div class="page-enter">
    <div class="page-header">
      <h1>Welcome to ContentIQ</h1>
      <p>AI-Powered Content Intelligence for Video Creators</p>
    </div>

    <div class="grid-4 mb-xl">
      <div class="glass-card stat-card">
        <div class="stat-icon" style="background:rgba(168,85,247,0.15);color:#A855F7;">🎬</div>
        <div class="stat-value">8</div>
        <div class="stat-label">AI Modules</div>
        <div class="stat-change up">▲ All Active</div>
      </div>
      <div class="glass-card stat-card">
        <div class="stat-icon" style="background:rgba(52,211,153,0.15);color:#34D399;">⚡</div>
        <div class="stat-value">Gemini</div>
        <div class="stat-label">AI Engine</div>
        <div class="stat-change up">1.5 Pro</div>
      </div>
      <div class="glass-card stat-card">
        <div class="stat-icon" style="background:rgba(96,165,250,0.15);color:#60A5FA;">🎙️</div>
        <div class="stat-value">11Labs</div>
        <div class="stat-label">Voice Engine</div>
        <div class="stat-change up">Connected</div>
      </div>
      <div class="glass-card stat-card">
        <div class="stat-icon" style="background:rgba(251,191,36,0.15);color:#FBBF24;">🌐</div>
        <div class="stat-value">29+</div>
        <div class="stat-label">Languages</div>
        <div class="stat-change up">Dubbing Ready</div>
      </div>
    </div>

    <div class="section-title"><span class="section-icon">🧠</span> Intelligence Modules</div>
    <div class="grid-2 mb-xl">
      ${dashboardModuleCard('🎬', 'Video Intelligence Engine', 'Upload video → scene detection → engagement scoring → thumbnail selection', 'video-intelligence', '#A855F7')}
      ${dashboardModuleCard('✍️', 'Trend-to-Script Generator', 'Trending topics → structured scripts with hooks, value points & CTAs', 'trend-script', '#60A5FA')}
      ${dashboardModuleCard('📱', 'Distribution Planner', 'Auto-generate optimized content for YouTube, TikTok & Instagram', 'distribution', '#34D399')}
      ${dashboardModuleCard('🔒', 'Privacy Filter', 'Detect faces, plates, screens & location data for auto-blur', 'privacy', '#F87171')}
      ${dashboardModuleCard('🎤', 'Creator Voice Tracker', 'Build voice profile & score scripts for brand consistency', 'voice-tracker', '#FBBF24')}
      ${dashboardModuleCard('🌐', 'Multilingual Dubbing', 'Translate & dub with emotion-matched ElevenLabs voices', 'dubbing', '#C084FC')}
      ${dashboardModuleCard('🖼️', 'Thumbnail Analyzer', 'Color psychology, CTR scoring & LUT suggestions', 'thumbnail', '#FB923C')}
      ${dashboardModuleCard('🎵', 'BGM Suggester', 'Scene-based music generation via ElevenLabs Sound API', 'bgm', '#38BDF8')}
    </div>

    <div class="section-title"><span class="section-icon">🚀</span> Demo Flow</div>
    <div class="glass-card-static">
      <div class="flex items-center gap-md" style="flex-wrap:wrap;">
        ${flowStep(1, 'Upload Video', '🎬')}
        ${flowArrow()}
        ${flowStep(2, 'Scene Analysis', '🔍')}
        ${flowArrow()}
        ${flowStep(3, 'BGM Suggestions', '🎵')}
        ${flowArrow()}
        ${flowStep(4, 'Script Gen', '✍️')}
        ${flowArrow()}
        ${flowStep(5, 'Dubbing', '🌐')}
        ${flowArrow()}
        ${flowStep(6, 'Distribution', '📱')}
        ${flowArrow()}
        ${flowStep(7, 'Export', '📦')}
      </div>
    </div>
  </div>`;
}

function dashboardModuleCard(icon, title, desc, route, color) {
    return `
  <div class="glass-card" style="cursor:pointer;" onclick="window.navigateTo('${route}')">
    <div class="flex items-center gap-md mb-md">
      <div style="width:40px;height:40px;border-radius:10px;background:${color}15;display:flex;align-items:center;justify-content:center;font-size:1.2rem;">${icon}</div>
      <div style="font-weight:700;font-size:0.95rem;">${title}</div>
    </div>
    <p style="color:var(--text-tertiary);font-size:0.82rem;line-height:1.5;">${desc}</p>
  </div>`;
}

function flowStep(num, label, icon) {
    return `<div style="display:flex;flex-direction:column;align-items:center;gap:6px;">
    <div style="width:44px;height:44px;border-radius:12px;background:var(--glass-bg-active);border:1px solid var(--glass-border);display:flex;align-items:center;justify-content:center;font-size:1.2rem;">${icon}</div>
    <span style="font-size:0.7rem;font-weight:600;color:var(--text-tertiary);">${label}</span>
  </div>`;
}

function flowArrow() {
    return `<div style="color:var(--text-muted);font-size:0.9rem;">→</div>`;
}
