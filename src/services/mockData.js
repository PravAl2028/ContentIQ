// ============================================================
// ContentIQ — Mock / Demo Data for all modules
// ============================================================

export const mockVideoIntelligence = {
    module: "video_intelligence",
    status: "success",
    confidence: 0.94,
    results: {
        duration: "4:32",
        resolution: "1920x1080",
        fps: 30,
        scenes: [
            { id: 1, timestamp: "0:00–0:18", engagement: 92, recommendation: "Highlight", reason: "Strong hook with direct address. High retention opener.", composition: "Rule of thirds, eye-level, good lighting contrast" },
            { id: 2, timestamp: "0:18–0:52", engagement: 78, recommendation: "Keep", reason: "Solid value delivery with clear visual aids. Maintains attention.", composition: "Medium shot, screen share with face cam overlay" },
            { id: 3, timestamp: "0:52–1:35", engagement: 65, recommendation: "Trim", reason: "Lengthy explanation could be condensed. Engagement dip detected.", composition: "Static wide shot, minimal visual variety" },
            { id: 4, timestamp: "1:35–2:10", engagement: 88, recommendation: "Highlight", reason: "Key insight moment. High comment potential trigger.", composition: "Close-up, animated gestures, good energy" },
            { id: 5, timestamp: "2:10–3:05", engagement: 45, recommendation: "Cut", reason: "Repetitive content. Viewer drop-off zone identified.", composition: "Wide shot, low energy, flat lighting" },
            { id: 6, timestamp: "3:05–3:48", engagement: 82, recommendation: "Keep", reason: "Tutorial segment with clear steps. High save-rate predicted.", composition: "Screen recording with cursor highlights" },
            { id: 7, timestamp: "3:48–4:32", engagement: 90, recommendation: "Highlight", reason: "Strong CTA with social proof. Excellent close.", composition: "Eye-level close-up, warm lighting, direct address" }
        ],
        thumbnails: [
            { frame: "0:05", ctrScore: 87, reason: "Expressive face + text overlay potential" },
            { frame: "1:38", ctrScore: 92, reason: "Peak emotion moment, high contrast, rule of thirds" },
            { frame: "4:20", ctrScore: 78, reason: "Clean composition, brand-consistent backdrop" }
        ]
    },
    recommendations: [
        "Cut scene 5 (2:10–3:05) to improve pacing — saves 55s",
        "Trim scene 3 by 20s — tighten the explanation",
        "Use frame at 1:38 as primary thumbnail — highest CTR score",
        "Add B-roll during scene 3 to boost visual engagement"
    ]
};

export const mockTrendScript = {
    module: "trend_to_script",
    status: "success",
    confidence: 0.91,
    results: {
        topic: "AI Tools for Productivity",
        tone: "casual",
        script: {
            hook: "What if I told you there are 5 AI tools that replaced my entire virtual assistant — and they're all free?",
            valuePoints: [
                { point: "Tool #1: Notion AI for auto-organizing notes & tasks", broll: "Screen recording of Notion AI in action, auto-categorizing notes" },
                { point: "Tool #2: Gamma for instant presentations from bullet points", broll: "Side-by-side: bullet list → polished presentation in 10s" },
                { point: "Tool #3: Perplexity for research that actually cites sources", broll: "Split screen comparison with traditional Google search" },
                { point: "Tool #4: Descript for editing video by editing text", broll: "Demo of text-based video editing, removing filler words" },
                { point: "Tool #5: Zapier Central for automating everything between them", broll: "Animated flowchart showing tool connections" }
            ],
            cta: "Drop a comment with which tool blew your mind the most. And smash subscribe — I test a new AI tool every single week so you don't have to."
        }
    },
    recommendations: [
        "Open with a bold claim for maximum hook retention",
        "Use on-screen text overlays for each tool name",
        "Keep each tool segment under 45s for TikTok repurposing",
        "Add a mid-roll engagement prompt after Tool #3"
    ]
};

export const mockDistributionPlan = {
    module: "distribution_planner",
    status: "success",
    confidence: 0.89,
    results: {
        youtube: {
            title: "5 FREE AI Tools That Replaced My $2000/mo Virtual Assistant",
            description: "Discover the 5 AI tools I use daily to automate my entire workflow — from note-taking to video editing. All completely free.\n\n⏰ Timestamps:\n0:00 Intro\n0:18 Tool #1: Notion AI\n1:02 Tool #2: Gamma\n1:45 Tool #3: Perplexity\n2:30 Tool #4: Descript\n3:15 Tool #5: Zapier Central\n3:50 Final Thoughts\n\n🔗 Links mentioned in the video...",
            tags: ["AI tools", "productivity", "free AI", "virtual assistant replacement", "notion ai", "AI workflow", "tech tools 2025", "AI automation"]
        },
        tiktok: {
            clipRange: "0:00–0:58",
            caption: "5 AI tools that replaced my virtual assistant for FREE 🤯 #5 will blow your mind",
            hashtags: ["#AItools", "#productivityhack", "#freeAI", "#techtools", "#AIautomation", "#workhacks", "#notionai"]
        },
        instagram: {
            caption: "I fired my virtual assistant and hired these 5 AI tools instead 🤖✨\n\nAll free. All game-changing.\n\nSave this for later 📌",
            hashtags: ["#AItools", "#productivitytips", "#techlife", "#worksmarter", "#AI2025", "#freetools", "#automation", "#contentcreator"]
        },
        viralWindow: {
            bestDay: "Tuesday",
            bestTime: "10:00 AM EST",
            reason: "Peak engagement for tech/productivity content among 25–34 demographic. 23% higher average CTR vs. other days."
        }
    },
    recommendations: [
        "Post YouTube first, then repurpose clips to TikTok within 2 hours",
        "Use Instagram Reels from the same TikTok clip for cross-platform reach",
        "Schedule tweets threaded with each tool to drive traffic to YouTube",
        "Tuesday 10AM EST has 23% higher CTR for this niche"
    ]
};

export const mockPrivacyFilter = {
    module: "privacy_filter",
    status: "success",
    confidence: 0.96,
    results: {
        flags: [
            { type: "face", timestamp: "0:32", description: "Bystander face visible in background", severity: "high", bbox: { x: 420, y: 180, w: 90, h: 110 }, suggestion: "Apply Gaussian blur to bounding box" },
            { type: "license_plate", timestamp: "1:15", description: "Vehicle license plate readable", severity: "high", bbox: { x: 610, y: 320, w: 140, h: 45 }, suggestion: "Pixelate or black-bar the plate region" },
            { type: "screen_content", timestamp: "2:03", description: "Email inbox visible with personal info", severity: "medium", bbox: { x: 100, y: 80, w: 800, h: 500 }, suggestion: "Blur screen area or crop to relevant section only" },
            { type: "location_identifier", timestamp: "3:22", description: "Street sign revealing specific address", severity: "medium", bbox: { x: 340, y: 60, w: 200, h: 50 }, suggestion: "Blur the signage area" },
            { type: "face", timestamp: "3:45", description: "Child's face in park scene background", severity: "critical", bbox: { x: 580, y: 250, w: 70, h: 85 }, suggestion: "Must blur — minors require consent" }
        ],
        summary: {
            totalFlags: 5,
            critical: 1,
            high: 2,
            medium: 2,
            low: 0
        }
    },
    recommendations: [
        "Critical: Blur child's face at 3:45 — legal requirement in most jurisdictions",
        "High priority: Obscure license plate at 1:15",
        "Consider blurring all bystander faces for maximum privacy compliance",
        "Use picture-in-picture for screen recordings to control visible area"
    ]
};

export const mockVoiceTracker = {
    module: "creator_voice_tracker",
    status: "success",
    confidence: 0.88,
    results: {
        voiceProfile: {
            tone: "Conversational & Energetic",
            vocabulary: "Tech-savvy with casual slang, avoids jargon",
            energy: "High-energy opener, methodical middle, enthusiastic close",
            signature_phrases: ["game-changer", "let me show you", "here's the thing", "no cap"],
            avoids: ["synergy", "leverage", "circle back", "deep dive"]
        },
        scriptScore: 78,
        flags: [
            { phrase: "leverage these tools", suggestion: "try out these tools", reason: "Too corporate — doesn't match casual brand voice" },
            { phrase: "Let's deep-dive into", suggestion: "Let me show you", reason: "Overused and off-brand; signature phrase available" },
            { phrase: "In conclusion", suggestion: "So here's the deal", reason: "Too academic; brand voice is conversational" }
        ],
        strengths: [
            "Effective use of 'game-changer' in Tool #2 segment",
            "Energy level matches brand profile throughout hook",
            "Good balance of humor and information delivery"
        ]
    },
    recommendations: [
        "Replace 3 off-brand phrases for +8% brand consistency",
        "Consider adding more signature phrases in the middle section",
        "Hook matches brand energy — keep this structure",
        "Reduce formal transitions for more natural flow"
    ]
};

export const mockDubbing = {
    module: "multilingual_dubbing",
    status: "success",
    confidence: 0.90,
    results: {
        sourceLanguage: "English",
        targetLanguage: "Spanish",
        segments: [
            { id: 1, original: "What if I told you there are 5 AI tools that replaced my entire virtual assistant?", translated: "¿Y si te dijera que hay 5 herramientas de IA que reemplazaron a mi asistente virtual por completo?", tone: "[enthusiastic]", direction: "Match high energy of original. Rising intonation on 'por completo'." },
            { id: 2, original: "And they're all free.", translated: "Y todas son completamente gratis.", tone: "[dramatic pause]", direction: "Pause before 'gratis' for emphasis. Lower pitch for impact." },
            { id: 3, original: "Let me show you Tool number one — Notion AI.", translated: "Déjame mostrarte la herramienta número uno — Notion AI.", tone: "[casual, warm]", direction: "Conversational pacing. Keep brand name pronunciation in English." },
            { id: 4, original: "This tool is an absolute game-changer for organizing your workflow.", translated: "Esta herramienta es un cambio total para organizar tu flujo de trabajo.", tone: "[enthusiastic]", direction: "Emphasize 'cambio total'. Gesture-synced delivery." },
            { id: 5, original: "Drop a comment and smash subscribe!", translated: "¡Déjame un comentario y suscríbete!", tone: "[urgent, energetic]", direction: "Fast-paced, high energy. Classic CTA delivery style." }
        ],
        voiceSettings: { stability: 0.45, similarity_boost: 0.8, style: 0.7 }
    },
    recommendations: [
        "Use ElevenLabs voice cloning for creator's voice in target language",
        "Maintain English pronunciation for brand names",
        "Adjust pacing +10% for Spanish — naturally longer sentences",
        "Review emotional tone markers before final render"
    ]
};

export const mockThumbnailAnalysis = {
    module: "thumbnail_analyzer",
    status: "success",
    confidence: 0.93,
    results: {
        ctrScore: 76,
        contrast: { score: 82, note: "Good foreground-background separation. Text is readable." },
        colorPsychology: {
            dominant: "#FF6B35",
            palette: ["#FF6B35", "#1A1A2E", "#EAEAEA", "#FFD700"],
            mood: "Energetic & Attention-Grabbing",
            note: "Orange triggers urgency and excitement. Good for tech/productivity niche."
        },
        textReadability: { score: 71, note: "Text is visible but could benefit from a drop shadow or contrasting outline. Font size is appropriate." },
        faceExpression: { detected: true, expression: "Surprise / Excitement", note: "Exaggerated expression increases CTR by ~15%. Well-positioned in left third." },
        layout: {
            score: 80,
            improvements: [
                "Move text block slightly right to avoid face overlap",
                "Add a subtle vignette to draw eye to center",
                "Consider a contrasting border (2px white) for YouTube dark mode"
            ]
        },
        lutSuggestion: {
            name: "Vibrant Pop",
            description: "Increase saturation +15%, warmth +5%, contrast +10%. Adds punch while keeping natural skin tones.",
            adjustments: { saturation: "+15%", warmth: "+5%", contrast: "+10%", highlights: "+8%", shadows: "-5%" }
        }
    },
    recommendations: [
        "Add drop shadow to title text for +12% readability boost",
        "Apply 'Vibrant Pop' LUT for more eye-catching thumbnail",
        "Keep the surprised expression — it correlates with higher CTR",
        "Test with and without border for dark mode optimization"
    ]
};

export const mockBGMSuggester = {
    module: "bgm_suggester",
    status: "success",
    confidence: 0.87,
    results: {
        segments: [
            { id: 1, range: "0:00–0:18", mood: "Exciting & Intriguing", style: "Upbeat electronic with rising synth", energy: 85, prompt: "Upbeat electronic intro with rising synth build, energetic and mysterious" },
            { id: 2, range: "0:18–1:35", mood: "Focused & Informative", style: "Calm lo-fi beats with soft piano", energy: 55, prompt: "Calm lo-fi hip hop beat with soft piano melody, subtle and focused" },
            { id: 3, range: "1:35–2:10", mood: "Inspiring & Powerful", style: "Cinematic orchestral swell", energy: 78, prompt: "Cinematic orchestral swell with strings and light percussion, inspiring" },
            { id: 4, range: "2:10–3:05", mood: "Contemplative & Calm", style: "Ambient pad with gentle arpeggios", energy: 35, prompt: "Ambient pad with gentle arpeggios, reflective and calm atmosphere" },
            { id: 5, range: "3:05–3:48", mood: "Methodical & Clear", style: "Minimal tech beats with clicks", energy: 50, prompt: "Minimal tech beat with soft clicks and digital textures, tutorial style" },
            { id: 6, range: "3:48–4:32", mood: "Energetic & Positive", style: "Upbeat pop-electronic finale", energy: 90, prompt: "Upbeat pop electronic with claps and positive energy, celebration feel" }
        ]
    },
    recommendations: [
        "Keep BGM at -18dB during voiceover segments",
        "Increase energy during transitions between tools",
        "Use the ambient segment during Tool #4 demo for contrast",
        "Fade out on final CTA to let voice carry the close"
    ]
};
