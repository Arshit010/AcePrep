import api from "../services/api.js";

export const VOICE_TIERS = {
  PREMIUM: 3,  // Apple Premium/Enhanced/Siri, Google Natural, Microsoft Natural
  STANDARD: 2, // Clean standard system voices (Alex, Samantha standard, etc.)
  FALLBACK: 1, // Basic or generic voices
};

export function detectBrowser() {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return { isSafari: false, isChrome: false, isEdge: false, isFirefox: false, name: "unknown" };
  }

  const ua = navigator.userAgent || "";
  const isEdge = /edg/i.test(ua);
  const isChrome = /chrome|crios/i.test(ua) && !isEdge;
  const isSafari = (/safari/i.test(ua) && !isChrome && !isEdge) || (typeof window.safari !== "undefined");
  const isFirefox = /firefox|fxios/i.test(ua);

  let name = "other";
  if (isSafari) name = "safari";
  else if (isChrome) name = "chrome";
  else if (isEdge) name = "edge";
  else if (isFirefox) name = "firefox";

  return { isSafari, isChrome, isEdge, isFirefox, name };
}

const ROBOTIC_VOICE_NAMES = [
  "albert", "bad news", "bahh", "bells", "boing", "bubbles", "cellos",
  "deranged", "good news", "hysterical", "junior", "kathy", "organ",
  "princess", "ralph", "trinoids", "whisper", "wobble", "zarvox", "fred",
  "pipe organ", "sin-ji", "ting-ting", "xander", "yuri"
];

export function isDisallowedVoice(voice) {
  if (!voice) return true;
  const name = (voice.name || "").toLowerCase();
  return ROBOTIC_VOICE_NAMES.some((bad) => name.includes(bad));
}

const PREFERRED_VOICE_PATTERNS = [
  // Apple Premium / Enhanced / Siri voices (macOS / iOS Safari)
  { pattern: /ava.*(premium|enhanced)/i, score: 100, tier: VOICE_TIERS.PREMIUM },
  { pattern: /zoe.*(premium|enhanced)/i, score: 98, tier: VOICE_TIERS.PREMIUM },
  { pattern: /samantha.*(enhanced)/i, score: 96, tier: VOICE_TIERS.PREMIUM },
  { pattern: /siri/i, score: 95, tier: VOICE_TIERS.PREMIUM },
  { pattern: /serena.*(enhanced)/i, score: 94, tier: VOICE_TIERS.PREMIUM },
  { pattern: /allison.*(enhanced)/i, score: 93, tier: VOICE_TIERS.PREMIUM },
  { pattern: /susan.*(enhanced)/i, score: 92, tier: VOICE_TIERS.PREMIUM },
  { pattern: /daniel.*(enhanced)/i, score: 91, tier: VOICE_TIERS.PREMIUM },
  { pattern: /oliver.*(enhanced)/i, score: 90, tier: VOICE_TIERS.PREMIUM },
  { pattern: /tom.*(enhanced)/i, score: 89, tier: VOICE_TIERS.PREMIUM },
  { pattern: /kate.*(enhanced)/i, score: 88, tier: VOICE_TIERS.PREMIUM },
  { pattern: /nathan.*(enhanced)/i, score: 87, tier: VOICE_TIERS.PREMIUM },

  // Microsoft Natural Online voices (Edge)
  { pattern: /microsoft.*natural/i, score: 95, tier: VOICE_TIERS.PREMIUM },
  { pattern: /microsoft.*jenny/i, score: 94, tier: VOICE_TIERS.PREMIUM },
  { pattern: /microsoft.*guy/i, score: 93, tier: VOICE_TIERS.PREMIUM },
  { pattern: /microsoft.*aria/i, score: 92, tier: VOICE_TIERS.PREMIUM },

  // Google Neural / Studio / Natural voices (Chrome)
  { pattern: /google.*us.*english/i, score: 90, tier: VOICE_TIERS.PREMIUM },
  { pattern: /google.*uk.*english/i, score: 88, tier: VOICE_TIERS.PREMIUM },
  { pattern: /google.*english/i, score: 85, tier: VOICE_TIERS.PREMIUM },
  { pattern: /natural/i, score: 84, tier: VOICE_TIERS.PREMIUM },

  // Standard Apple clean voices (if enhanced voices are not downloaded)
  { pattern: /^samantha$/i, score: 80, tier: VOICE_TIERS.STANDARD },
  { pattern: /^ava$/i, score: 79, tier: VOICE_TIERS.STANDARD },
  { pattern: /^alex$/i, score: 78, tier: VOICE_TIERS.STANDARD },
  { pattern: /^karen$/i, score: 77, tier: VOICE_TIERS.STANDARD },
  { pattern: /^daniel$/i, score: 76, tier: VOICE_TIERS.STANDARD },
  { pattern: /^moira$/i, score: 75, tier: VOICE_TIERS.STANDARD },
  { pattern: /^tessa$/i, score: 74, tier: VOICE_TIERS.STANDARD },
  { pattern: /^victoria$/i, score: 73, tier: VOICE_TIERS.STANDARD },
  { pattern: /^fiona$/i, score: 72, tier: VOICE_TIERS.STANDARD },
];

export function scoreVoice(voice, lang = "en-US") {
  if (!voice) return { score: -1, tier: VOICE_TIERS.FALLBACK };
  if (isDisallowedVoice(voice)) return { score: -100, tier: VOICE_TIERS.FALLBACK };

  let score = 0;
  let tier = VOICE_TIERS.FALLBACK;
  const vLang = (voice.lang || "").toLowerCase().replace("_", "-");
  const targetLang = (lang || "en-US").toLowerCase().replace("_", "-");

  if (vLang === targetLang) {
    score += 50;
  } else if (vLang.startsWith(targetLang.slice(0, 2))) {
    score += 30;
  } else if (vLang.startsWith("en")) {
    score += 20;
  } else {
    return { score: -50, tier: VOICE_TIERS.FALLBACK };
  }

  const name = voice.name || "";
  for (const item of PREFERRED_VOICE_PATTERNS) {
    if (item.pattern.test(name)) {
      score += item.score;
      tier = item.tier;
      break;
    }
  }

  if (voice.localService) score += 5;
  if (voice.default) score += 2;

  if (/compact/i.test(name)) {
    score -= 25;
    tier = VOICE_TIERS.FALLBACK;
  }

  return { score, tier };
}

export function selectBestVoice(voices = [], lang = "en-US") {
  if (!Array.isArray(voices) || voices.length === 0) return null;

  const scored = voices
    .map((v) => {
      const { score, tier } = scoreVoice(v, lang);
      return { voice: v, score, tier };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

  if (scored.length > 0) {
    return scored[0].voice;
  }

  const safeFallback = voices.find((v) => {
    const l = (v.lang || "").toLowerCase();
    return l.startsWith("en") && !isDisallowedVoice(v);
  });

  return safeFallback || voices[0] || null;
}

export function getVoiceTier(voice, lang = "en-US") {
  if (!voice) return VOICE_TIERS.FALLBACK;
  return scoreVoice(voice, lang).tier;
}

export function getVoiceParameters(voice, browserInfo = detectBrowser()) {
  const { isSafari, isChrome } = browserInfo;
  const voiceName = (voice?.name || "").toLowerCase();

  if (isSafari) {
    if (voiceName.includes("enhanced") || voiceName.includes("premium") || voiceName.includes("siri")) {
      return { rate: 0.98, pitch: 1.0, volume: 1.0 };
    }
    if (voiceName.includes("alex")) {
      return { rate: 0.94, pitch: 1.0, volume: 1.0 };
    }
    return { rate: 0.95, pitch: 1.0, volume: 1.0 };
  }

  if (isChrome) {
    return { rate: 1.0, pitch: 1.0, volume: 1.0 };
  }

  return { rate: 0.98, pitch: 1.0, volume: 1.0 };
}

export function normalizeSpeechText(rawText) {
  if (!rawText || typeof rawText !== "string") return "";

  return rawText
    .replace(/```[\s\S]*?```/g, " [code example omitted] ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/[*_~#]/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^\s*[-•*]\s+/gm, "")
    .replace(/\.{2,}/g, ".")
    .replace(/\?{2,}/g, "?")
    .replace(/!{2,}/g, "!")
    .replace(/\bREST\s*APIs?\b/gi, (m) => /s$/i.test(m) ? "REST A P I's" : "REST A P I")
    .replace(/\bAPIs\b/g, "A P I's")
    .replace(/\bAPI\b/g, "A P I")
    .replace(/\bGraphQL\b/gi, "Graph Q L")
    .replace(/\bCI\/CD\b/g, "C I C D")
    .replace(/\bPostgreSQL\b/gi, "Postgres Sequel")
    .replace(/\bNoSQL\b/gi, "No Sequel")
    .replace(/\bSQL\b/g, "Sequel")
    .replace(/\bRESTful\b/gi, "RESTful")
    .replace(/\bUI\/UX\b/gi, "U I U X")
    .replace(/\bUI\b/g, "U I")
    .replace(/\bUX\b/g, "U X")
    .replace(/\bAI\b/g, "A I")
    .replace(/\bAWS\b/g, "A W S")
    .replace(/\bGCP\b/g, "G C P")
    .replace(/\bJSON\b/gi, "Jason")
    .replace(/\bJWTs?\b/gi, "J W T")
    .replace(/\bOAuth\b/gi, "O Auth")
    .replace(/\bK8s\b/gi, "Kubernetes")
    .replace(/\be\.?g\.?,?\s*/gi, "for example, ")
    .replace(/\bi\.?e\.?,?\s*/gi, "that is, ")
    .replace(/\betc\.\s*/gi, "etcetera ")
    .replace(/\bvs\.?\s+/gi, "versus ")
    .replace(/(\d+)\+\s*years?/gi, "$1 plus years")
    .replace(/(\d+)%/g, "$1 percent")
    .replace(/\s+/g, " ")
    .trim();
}

export function splitIntoSentenceChunks(text, maxChunkLength = 220) {
  const normalized = normalizeSpeechText(text);
  if (!normalized) return [];

  if (normalized.length <= maxChunkLength) {
    return [normalized];
  }

  const rawSentences = normalized.match(/[^.!?;\n]+[.!?;\n]+/g) || [normalized];
  const chunks = [];
  let currentChunk = "";

  for (let s of rawSentences) {
    s = s.trim();
    if (!s) continue;

    if (!currentChunk) {
      currentChunk = s;
    } else if ((currentChunk + " " + s).length <= maxChunkLength) {
      currentChunk += " " + s;
    } else {
      chunks.push(currentChunk);
      currentChunk = s;
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk);
  }

  return chunks.length > 0 ? chunks : [normalized];
}

export class SpeechOrchestrator {
  constructor() {
    this.currentSessionId = 0;
    this.activeAudio = null;
    this.abortController = null;
    this.isSpeaking = false;
    this.browserInfo = detectBrowser();
    this.audioCache = new Map();
  }

  cancel() {
    this.currentSessionId += 1;
    this.isSpeaking = false;

    // Abort in-flight neural TTS fetch
    if (this.abortController) {
      try {
        this.abortController.abort();
      } catch (_) {}
      this.abortController = null;
    }

    // Stop active HTML5 audio playback
    if (this.activeAudio) {
      try {
        this.activeAudio.pause();
        this.activeAudio.currentTime = 0;
      } catch (_) {}
      this.activeAudio = null;
    }

    // Stop native speech synthesis
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (_) {}
    }
  }

  async speak(text, { voice, onStart, onEnd, onError, onAutoplayBlocked, spokenKey } = {}) {
    if (!text || typeof window === "undefined") {
      return;
    }

    this.cancel();
    const sessionId = this.currentSessionId;
    const normalizedText = normalizeSpeechText(text);
    if (!normalizedText) return;

    this.abortController = new AbortController();

    // 1. Check client-side audio cache for instant replay (0 API usage)
    if (this.audioCache.has(normalizedText)) {
      const cachedUrl = this.audioCache.get(normalizedText);
      try {
        await this.playAudioUrl(cachedUrl, {
          sessionId,
          onStart,
          onEnd,
          onAutoplayBlocked,
          onError: () => {
            this.speakNative(text, { voice, onStart, onEnd, onError, onAutoplayBlocked, spokenKey, sessionId });
          },
        });
        return;
      } catch (err) {
        if (err?.name === "NotAllowedError" && typeof onAutoplayBlocked === "function") {
          onAutoplayBlocked(err);
          return;
        }
        this.audioCache.delete(normalizedText);
      }
    }

    // 2. Attempt ElevenLabs Neural TTS via backend proxy
    try {
      const response = await api.post(
        "/interviews/speak",
        { text: normalizedText },
        {
          responseType: "blob",
          signal: this.abortController.signal,
          timeout: 10000,
        }
      );

      if (sessionId !== this.currentSessionId) return;

      const blob = response.data;
      if (blob && blob.size > 0) {
        const audioUrl = URL.createObjectURL(blob);
        this.audioCache.set(normalizedText, audioUrl);

        if (import.meta.env?.DEV) {
          console.log(`[TTS Engine] Playing ElevenLabs neural speech (${blob.size} bytes)`);
        }

        await this.playAudioUrl(audioUrl, {
          sessionId,
          onStart,
          onEnd,
          onAutoplayBlocked,
          onError: () => {
            this.speakNative(text, { voice, onStart, onEnd, onError, onAutoplayBlocked, spokenKey, sessionId });
          },
        });
        return;
      }
    } catch (err) {
      if (sessionId !== this.currentSessionId) return;
      if (err.name === "CanceledError" || err.name === "AbortError" || err.code === "ERR_CANCELED") {
        return;
      }
      if (err?.name === "NotAllowedError" && typeof onAutoplayBlocked === "function") {
        onAutoplayBlocked(err);
        return;
      }
      if (import.meta.env?.DEV) {
        console.warn("[TTS Engine] Neural TTS unavailable or failed, falling back to native TTS:", err?.response?.data || err.message);
      }
    }

    // 3. Fallback: Browser-native TTS
    this.speakNative(text, { voice, onStart, onEnd, onError, onAutoplayBlocked, spokenKey, sessionId });
  }

  playAudioUrl(audioUrl, { sessionId, onStart, onEnd, onError, onAutoplayBlocked }) {
    return new Promise((resolve, reject) => {
      if (sessionId !== this.currentSessionId) {
        resolve();
        return;
      }

      const audio = new Audio(audioUrl);
      this.activeAudio = audio;

      audio.onplay = () => {
        if (sessionId !== this.currentSessionId) return;
        this.isSpeaking = true;
        if (typeof onStart === "function") onStart();
      };

      audio.onended = () => {
        if (sessionId !== this.currentSessionId) return;
        this.isSpeaking = false;
        this.activeAudio = null;
        if (typeof onEnd === "function") onEnd();
        resolve();
      };

      audio.onerror = (e) => {
        if (sessionId !== this.currentSessionId) return;
        this.isSpeaking = false;
        this.activeAudio = null;
        if (typeof onError === "function") onError(e);
        reject(e);
      };

      audio.play().catch((playErr) => {
        if (sessionId !== this.currentSessionId) return;
        this.isSpeaking = false;
        this.activeAudio = null;

        const isAutoplayBlocked =
          playErr.name === "NotAllowedError" ||
          (playErr.message && playErr.message.toLowerCase().includes("not allowed")) ||
          (playErr.message && playErr.message.toLowerCase().includes("user gesture"));

        if (isAutoplayBlocked && typeof onAutoplayBlocked === "function") {
          onAutoplayBlocked(playErr);
        } else if (typeof onError === "function") {
          onError(playErr);
        }
        reject(playErr);
      });
    });
  }

  speakNative(text, { voice, onStart, onEnd, onError, onAutoplayBlocked, spokenKey, sessionId } = {}) {
    if (!text || typeof window === "undefined" || !("speechSynthesis" in window)) {
      return;
    }

    const chunks = splitIntoSentenceChunks(text, 220);
    if (chunks.length === 0) return;

    const params = getVoiceParameters(voice, this.browserInfo);

    if (import.meta.env?.DEV) {
      console.log(`[TTS Engine Native Fallback] Browser: ${this.browserInfo.name}, Voice: "${voice?.name || "default"}" (${voice?.lang || "en-US"}), Rate: ${params.rate}, Chunks: ${chunks.length}`);
    }

    let chunkIndex = 0;
    let started = false;

    const autoplayWatchdog = window.setTimeout(() => {
      if (!started && sessionId === this.currentSessionId) {
        if (this.browserInfo.isSafari && typeof onAutoplayBlocked === "function") {
          onAutoplayBlocked(new Error("Safari blocked speech synthesis autoplay"));
        }
      }
    }, 600);

    const speakNextChunk = () => {
      if (sessionId && sessionId !== this.currentSessionId) {
        window.clearTimeout(autoplayWatchdog);
        return;
      }

      if (chunkIndex >= chunks.length) {
        window.clearTimeout(autoplayWatchdog);
        this.isSpeaking = false;
        if (typeof onEnd === "function") {
          onEnd();
        }
        return;
      }

      const chunkText = chunks[chunkIndex];
      chunkIndex += 1;

      const utterance = new SpeechSynthesisUtterance(chunkText);
      if (voice) {
        utterance.voice = voice;
        utterance.lang = voice.lang || "en-US";
      }
      utterance.rate = params.rate;
      utterance.pitch = params.pitch;
      utterance.volume = params.volume;

      utterance.onstart = () => {
        if (sessionId && sessionId !== this.currentSessionId) return;
        started = true;
        window.clearTimeout(autoplayWatchdog);
        this.isSpeaking = true;
        if (chunkIndex === 1 && typeof onStart === "function") {
          onStart();
        }
      };

      utterance.onend = () => {
        if (sessionId && sessionId !== this.currentSessionId) return;
        speakNextChunk();
      };

      utterance.onerror = (event) => {
        if (sessionId && sessionId !== this.currentSessionId) return;
        window.clearTimeout(autoplayWatchdog);

        if (spokenKey && event.error !== "interrupted" && event.error !== "canceled") {
          try {
            sessionStorage.removeItem(spokenKey);
          } catch (_) {}
        }

        if (event.error === "not-allowed" && typeof onAutoplayBlocked === "function") {
          this.isSpeaking = false;
          onAutoplayBlocked(event);
          return;
        }

        if (event.error === "interrupted" || event.error === "canceled") {
          this.isSpeaking = false;
          return;
        }

        if (import.meta.env?.DEV) {
          console.warn("[TTS Engine Native Fallback] Speech error:", event.error);
        }

        this.isSpeaking = false;
        if (typeof onError === "function") {
          onError(event);
        }
        if (typeof onEnd === "function") {
          onEnd();
        }
      };

      try {
        window.speechSynthesis.resume?.();
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        window.clearTimeout(autoplayWatchdog);
        this.isSpeaking = false;
        if (typeof onError === "function") onError(err);
      }
    };

    speakNextChunk();
  }
}
