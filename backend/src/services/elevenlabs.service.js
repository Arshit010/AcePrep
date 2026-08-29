import crypto from "crypto";

const DEFAULT_VOICE_ID = "21m00Tcm4TlvDq8ikWAM"; // Rachel - Natural, professional English female voice
const DEFAULT_MODEL_ID = "eleven_flash_v2_5";

// In-memory audio cache to protect free-tier quota & eliminate repeat latency
const audioCache = new Map();
const MAX_CACHE_ENTRIES = 150;

function getCacheKey(text, voiceId, modelId) {
  const normalized = (text || "").trim().toLowerCase();
  return crypto.createHash("sha256").update(`${voiceId}:${modelId}:${normalized}`).digest("hex");
}

export async function synthesizeSpeech(text, options = {}) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey || !apiKey.trim()) {
    const err = new Error("ELEVENLABS_API_KEY is not configured");
    err.code = "ELEVENLABS_NOT_CONFIGURED";
    throw err;
  }

  const cleanText = (text || "").trim();
  if (!cleanText) {
    const err = new Error("Text is required for speech synthesis");
    err.code = "INVALID_TEXT";
    throw err;
  }

  const voiceId = options.voiceId || process.env.ELEVENLABS_VOICE_ID || DEFAULT_VOICE_ID;
  const modelId = options.modelId || process.env.ELEVENLABS_MODEL_ID || DEFAULT_MODEL_ID;

  // Check in-memory cache
  const cacheKey = getCacheKey(cleanText, voiceId, modelId);
  if (audioCache.has(cacheKey)) {
    return {
      audioBuffer: audioCache.get(cacheKey),
      contentType: "audio/mpeg",
      cached: true,
    };
  }

  const url = `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}?output_format=mp3_44100_128`;

  const requestBody = {
    text: cleanText,
    model_id: modelId,
    voice_settings: {
      stability: 0.5,
      similarity_boost: 0.75,
      style: 0.0,
      use_speaker_boost: true,
    },
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Accept": "audio/mpeg",
      "Content-Type": "application/json",
      "xi-api-key": apiKey.trim(),
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    let errorDetail = "";
    try {
      const errJson = await response.json();
      errorDetail = errJson?.detail?.message || errJson?.message || JSON.stringify(errJson);
    } catch (_) {
      errorDetail = await response.text().catch(() => `HTTP ${response.status}`);
    }

    const err = new Error(`ElevenLabs TTS API error (${response.status}): ${errorDetail}`);
    err.status = response.status;
    err.code = "ELEVENLABS_API_ERROR";
    throw err;
  }

  const arrayBuffer = await response.arrayBuffer();
  const audioBuffer = Buffer.from(arrayBuffer);

  // Evict oldest item if cache is full
  if (audioCache.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = audioCache.keys().next().value;
    audioCache.delete(oldestKey);
  }

  audioCache.set(cacheKey, audioBuffer);

  return {
    audioBuffer,
    contentType: "audio/mpeg",
    cached: false,
  };
}
