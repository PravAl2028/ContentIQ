// ============================================================
// ContentIQ — API Service Layer
// Gemini 1.5 Pro + ElevenLabs integration with mock fallbacks
// ============================================================

const GEMINI_API_KEY = () => localStorage.getItem('GEMINI_API_KEY') || '';
const ELEVENLABS_API_KEY = () => localStorage.getItem('ELEVENLABS_API_KEY') || '';

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent';
const ELEVENLABS_BASE = 'https://api.elevenlabs.io/v1';

// ------ Response Wrapper ------
function wrapResponse(module, results, confidence = 0.92, recommendations = []) {
  return { module, status: 'success', results, confidence, recommendations };
}

function errorResponse(module, message) {
  return { module, status: 'error', results: null, confidence: 0, recommendations: [], error: message };
}

// ------ Gemini API ------
export async function callGemini(prompt, images = []) {
  const key = GEMINI_API_KEY();
  if (!key) return null;

  const parts = [{ text: prompt }];
  for (const img of images) {
    parts.push({ inline_data: { mime_type: img.type, data: img.base64 } });
  }

  const res = await fetch(`${GEMINI_URL}?key=${key}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: { temperature: 0.7, topP: 0.95, maxOutputTokens: 8192 }
    })
  });

  if (!res.ok) throw new Error(`Gemini API error: ${res.status}`);
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

export function parseGeminiJSON(text) {
  try {
    const match = text.match(/```json\s*([\s\S]*?)```/) || text.match(/\{[\s\S]*\}/);
    if (match) {
      const jsonStr = match[1] || match[0];
      return JSON.parse(jsonStr);
    }
  } catch (e) { /* fall through */ }
  return null;
}

// ------ ElevenLabs API ------
export async function elevenLabsTTS(text, voiceId = '21m00Tcm4TlvDq8ikWAM', settings = {}) {
  const key = ELEVENLABS_API_KEY();
  if (!key) return null;

  const res = await fetch(`${ELEVENLABS_BASE}/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: { 'xi-api-key': key, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text,
      model_id: 'eleven_multilingual_v2',
      voice_settings: { stability: settings.stability || 0.5, similarity_boost: settings.similarity || 0.75, style: settings.style || 0.5 }
    })
  });

  if (!res.ok) throw new Error(`ElevenLabs TTS error: ${res.status}`);
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}

export async function elevenLabsSoundGen(prompt, duration = 5) {
  const key = ELEVENLABS_API_KEY();
  if (!key) return null;

  const res = await fetch(`${ELEVENLABS_BASE}/sound-generation`, {
    method: 'POST',
    headers: { 'xi-api-key': key, 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: prompt, duration_seconds: duration })
  });

  if (!res.ok) throw new Error(`ElevenLabs Sound Gen error: ${res.status}`);
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}

export async function elevenLabsVoices() {
  const key = ELEVENLABS_API_KEY();
  if (!key) return null;

  const res = await fetch(`${ELEVENLABS_BASE}/voices`, {
    headers: { 'xi-api-key': key }
  });

  if (!res.ok) throw new Error(`ElevenLabs Voices error: ${res.status}`);
  return (await res.json()).voices || [];
}

// ------ File Helpers ------
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function extractFramesFromVideo(videoFile, count = 6) {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'auto';
    video.muted = true;
    const url = URL.createObjectURL(videoFile);
    video.src = url;
    video.onloadedmetadata = () => {
      const duration = video.duration;
      const interval = duration / (count + 1);
      const frames = [];
      let i = 1;
      const capture = () => {
        if (i > count) {
          URL.revokeObjectURL(url);
          resolve(frames);
          return;
        }
        video.currentTime = interval * i;
      };
      video.onseeked = () => {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d').drawImage(video, 0, 0);
        frames.push({
          time: video.currentTime,
          dataUrl: canvas.toDataURL('image/jpeg', 0.8),
          base64: canvas.toDataURL('image/jpeg', 0.8).split(',')[1]
        });
        i++;
        capture();
      };
      capture();
    };
  });
}

// ------ Check API Status ------
export function hasGeminiKey() { return !!GEMINI_API_KEY(); }
export function hasElevenLabsKey() { return !!ELEVENLABS_API_KEY(); }

export { wrapResponse, errorResponse };
