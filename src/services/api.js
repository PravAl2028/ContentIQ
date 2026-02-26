// ============================================================
// ContentIQ — API Service Layer
// Google GenAI SDK + ElevenLabs integration with mock fallbacks
// ============================================================

import { GoogleGenAI } from '@google/genai';

const GEMINI_API_KEY = () => localStorage.getItem('GEMINI_API_KEY') || '';
const ELEVENLABS_API_KEY = () => localStorage.getItem('ELEVENLABS_API_KEY') || '';

const GEMINI_MODEL = 'gemini-2.5-flash-lite';
const ELEVENLABS_BASE = 'https://api.elevenlabs.io/v1';

// ------ Response Wrapper ------
function wrapResponse(module, results, confidence = 0.92, recommendations = []) {
  return { module, status: 'success', results, confidence, recommendations };
}

function errorResponse(module, message) {
  return { module, status: 'error', results: null, confidence: 0, recommendations: [], error: message };
}

// ------ Google GenAI Client ------
function getClient() {
  const key = GEMINI_API_KEY();
  if (!key) return null;
  return new GoogleGenAI({ apiKey: key });
}

// ------ Gemini API via GenAI SDK ------
export async function callGemini(prompt, images = []) {
  const client = getClient();
  if (!client) return null;

  const contents = [];

  // Add images as inline data
  for (const img of images) {
    contents.push({
      inlineData: { mimeType: img.type, data: img.base64 }
    });
  }

  // Add the text prompt
  contents.push(prompt);

  console.log('[ContentIQ] Calling Gemini with', images.length, 'images...');

  const response = await client.models.generateContent({
    model: GEMINI_MODEL,
    contents: contents,
    config: {
      temperature: 0.7,
      topP: 0.95,
      maxOutputTokens: 8192,
      responseMimeType: 'application/json'
    }
  });

  const text = response.text || '';
  console.log('[ContentIQ] Gemini response received:', text.substring(0, 300));
  return text;
}

export async function callGeminiWithVideoURL(prompt, videoUrl) {
  const client = getClient();
  if (!client) return null;

  console.log('[ContentIQ] Calling Gemini with video URL:', videoUrl);

  const response = await client.models.generateContent({
    model: GEMINI_MODEL,
    contents: [
      { fileData: { fileUri: videoUrl, mimeType: 'video/mp4' } },
      prompt
    ],
    config: {
      temperature: 0.7,
      topP: 0.95,
      maxOutputTokens: 8192,
      responseMimeType: 'application/json'
    }
  });

  const text = response.text || '';
  console.log('[ContentIQ] Gemini video response received:', text.substring(0, 300));
  return text;
}

export function parseGeminiJSON(text) {
  if (!text) return null;

  // Try direct parse first (when using responseMimeType: application/json)
  try {
    return JSON.parse(text);
  } catch (e) { /* not direct JSON, try extraction */ }

  // Try extracting from markdown code block
  try {
    const codeBlockMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
    if (codeBlockMatch) {
      return JSON.parse(codeBlockMatch[1].trim());
    }
  } catch (e) { /* continue */ }

  // Try finding first { ... } block
  try {
    const braceStart = text.indexOf('{');
    const braceEnd = text.lastIndexOf('}');
    if (braceStart !== -1 && braceEnd > braceStart) {
      return JSON.parse(text.substring(braceStart, braceEnd + 1));
    }
  } catch (e) { /* continue */ }

  // Try finding first [ ... ] block (array response)
  try {
    const bracketStart = text.indexOf('[');
    const bracketEnd = text.lastIndexOf(']');
    if (bracketStart !== -1 && bracketEnd > bracketStart) {
      return JSON.parse(text.substring(bracketStart, bracketEnd + 1));
    }
  } catch (e) { /* continue */ }

  console.error('[ContentIQ] Failed to parse Gemini JSON. Raw text:', text.substring(0, 500));
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

// Get accurate duration directly from file metadata
export function getLocalVideoDuration(file) {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';

    video.onloadedmetadata = () => {
      resolve(video.duration);
      URL.revokeObjectURL(video.src);
    };

    video.onerror = () => {
      reject(new Error('Could not read video metadata'));
      URL.revokeObjectURL(video.src);
    };

    video.src = URL.createObjectURL(file);
  });
}

export function extractFramesFromVideo(videoFile, count = 50) {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'auto';
    video.muted = true;
    video.playsInline = true;

    // Timeout after 60 seconds (giving more time for 50 frames)
    const timeout = setTimeout(() => {
      console.error('[ContentIQ] Frame extraction timed out');
      URL.revokeObjectURL(url);
      reject(new Error('Video frame extraction timed out. Try a smaller video.'));
    }, 60000);

    const url = URL.createObjectURL(videoFile);
    video.src = url;

    video.onerror = (e) => {
      clearTimeout(timeout);
      URL.revokeObjectURL(url);
      console.error('[ContentIQ] Video load error:', e);
      reject(new Error('Failed to load video. Ensure the file is a valid MP4/MOV.'));
    };

    video.onloadedmetadata = () => {
      const duration = video.duration;
      if (!duration || !isFinite(duration)) {
        clearTimeout(timeout);
        URL.revokeObjectURL(url);
        reject(new Error('Could not determine video duration.'));
        return;
      }

      console.log('[ContentIQ] Video loaded. Duration:', duration, 'Resolution:', video.videoWidth, 'x', video.videoHeight);

      const interval = duration / (count + 1);
      const frames = [];
      let i = 1;

      const canvas = document.createElement('canvas');
      const scale = Math.min(1, 512 / video.videoWidth);
      canvas.width = Math.round(video.videoWidth * scale);
      canvas.height = Math.round(video.videoHeight * scale);
      const ctx = canvas.getContext('2d', { willReadFrequently: true });

      let lastImageData = null;

      // Helper to compute difference between two ImageDatas (0.0 to 1.0)
      const getImageDifference = (img1, img2) => {
        if (!img1 || !img2) return 1.0;
        let diff = 0;
        const len = img1.data.length;
        for (let j = 0; j < len; j += 4) {
          diff += Math.abs(img1.data[j] - img2.data[j]) +
            Math.abs(img1.data[j + 1] - img2.data[j + 1]) +
            Math.abs(img1.data[j + 2] - img2.data[j + 2]);
        }
        return diff / (len * 0.75 * 255); // Normalize to 0-1
      };

      const capture = () => {
        if (i > count) {
          clearTimeout(timeout);
          URL.revokeObjectURL(url);
          console.log('[ContentIQ] Extracted', frames.length, 'distinct frames out of', count, 'sampled');
          resolve({ frames, duration });
          return;
        }
        video.currentTime = interval * i;
      };

      video.onseeked = () => {
        try {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const currentImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

          // Compare with previous frame; threshold of 0.05 means 5% average pixel difference
          const diff = lastImageData ? getImageDifference(lastImageData, currentImageData) : 1.0;

          if (diff > 0.05) {
            const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
            frames.push({
              time: video.currentTime,
              dataUrl: dataUrl,
              base64: dataUrl.split(',')[1]
            });
            lastImageData = currentImageData;
          }
        } catch (err) {
          console.warn('[ContentIQ] Failed to capture frame at', video.currentTime, err);
        }
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
