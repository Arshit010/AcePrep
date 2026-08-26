import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import { VideoInterviewSkeleton } from "../components/Skeletons";

function selectDefaultVoice(voices = []) {
  return (
    voices.find((voice) => voice.default) ||
    voices.find((voice) => (voice.lang || "").toLowerCase().startsWith("en")) ||
    voices[0] ||
    null
  );
}

export default function VideoInterview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const recognitionRef = useRef(null);
  const speakTimerRef = useRef(null);
  const activeUtteranceRef = useRef(null);
  const thinkingSpeechTimerRef = useRef(null);
  const manualVoiceSelectionRef = useRef(false);
  const pendingSpeechRef = useRef(null);
  const speechPrimedRef = useRef(false);
  const lastSpeechRef = useRef(Date.now());
  const allowPageExitRef = useRef(false);
  const quittingRef = useRef(false);
  const interviewClosedRef = useRef(false);
  const integritySyncTimerRef = useRef(null);
  const integritySyncInFlightRef = useRef(false);
  const startupGuardUntilRef = useRef(Date.now() + 8000);
  const nextQuestionActionRef = useRef(null);

  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [micReady, setMicReady] = useState(false);
  const [current, setCurrent] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [isPendingFeedback, setIsPendingFeedback] = useState(false);
  const [voices, setVoices] = useState([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState("");
  const [integrityScore, setIntegrityScore] = useState(100);
  const [suspiciousEvents, setSuspiciousEvents] = useState([]);
  const [warningMessage, setWarningMessage] = useState("");
  const [finalTranscript, setFinalTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [recognitionSupported, setRecognitionSupported] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [recognitionStatus, setRecognitionStatus] = useState("Microphone answer mode ready.");
  const [answerSummary, setAnswerSummary] = useState("");
  const [answerReaction, setAnswerReaction] = useState("");
  const [quickFeedback, setQuickFeedback] = useState("");
  const [feedbackHighlights, setFeedbackHighlights] = useState([]);
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(0);
  const [showQuitPrompt, setShowQuitPrompt] = useState(false);
  const [quitting, setQuitting] = useState(false);
  const [voicePlaybackReady, setVoicePlaybackReady] = useState(false);
  const [voiceNotice, setVoiceNotice] = useState("Preparing interviewer voice...");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [screenShieldActive, setScreenShieldActive] = useState(false);

  const currentQuestion = interview?.questions?.[current] || "";
  const preferredGender = null; // use browser default voice; remove AI-specific voice styling
  const selectedVoice = useMemo(() => voices.find((voice) => voice.voiceURI === selectedVoiceURI) || null, [voices, selectedVoiceURI]);
  const fullTranscript = `${finalTranscript} ${interimTranscript}`.trim();
  const suspiciousActionsCount = suspiciousEvents.length;

  const getQuestionPrompt = (questionIndex = current) => {
    const nextQuestion = interview?.questions?.[questionIndex] || "";
    if (!nextQuestion) return "";

    if (questionIndex === 0) {
      return `Hello, I will be your interviewer today. We have ${interview.questions.length} questions on ${interview.topic}. Please answer clearly. First question, ${nextQuestion}`;
    }

    return `Next question, ${nextQuestion}`;
  };

  const persistIntegrityState = async ({
    nextIntegrityScore = integrityScore,
    nextSuspiciousEvents = suspiciousEvents,
    immediate = false
  } = {}) => {
    if (!interview || interviewClosedRef.current || quittingRef.current || integritySyncInFlightRef.current) {
      return;
    }

    integritySyncInFlightRef.current = true;

    try {
      await api.post("/interviews/save-integrity", {
        interviewId: id,
        integrityScore: nextIntegrityScore,
        suspiciousActionsCount: nextSuspiciousEvents.length,
        suspiciousEvents: nextSuspiciousEvents
      });
    } catch (error) {
      if (!immediate) {
        console.error("Integrity sync failed:", error?.response?.data || error.message);
      }
    } finally {
      integritySyncInFlightRef.current = false;
    }
  };

  const addSuspiciousEvent = (message, penalty = 6) => {
    if (Date.now() < startupGuardUntilRef.current) return;

    let nextIntegrityScore = integrityScore;
    setWarningMessage(message);
    setIntegrityScore((previous) => {
      nextIntegrityScore = Math.max(0, previous - penalty);
      return nextIntegrityScore;
    });
    setSuspiciousEvents((previous) => {
      const next = [...previous, `${new Date().toISOString()}: ${message}`].slice(-50);

      if (integritySyncTimerRef.current) {
        window.clearTimeout(integritySyncTimerRef.current);
      }

      integritySyncTimerRef.current = window.setTimeout(() => {
        persistIntegrityState({
          nextIntegrityScore,
          nextSuspiciousEvents: next
        });
      }, 300);

      return next;
    });
  };

  useEffect(() => {
    if (!warningMessage) return undefined;
    const timeout = window.setTimeout(() => setWarningMessage(""), 3500);
    return () => window.clearTimeout(timeout);
  }, [warningMessage]);

  useEffect(() => {
    if (integrityScore < 70) {
      const handleCheatingDetected = async () => {
        setWarningMessage("Integrity score limit reached. Ending interview session...");
        await persistIntegrityState({ immediate: true });
        allowPageExitRef.current = true;
        interviewClosedRef.current = true;
        stopMediaAndRecognition();
        if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
        setTimeout(() => {
          navigate("/dashboard", { replace: true });
        }, 800);
      };

      handleCheatingDetected();
    }
  }, [integrityScore, navigate]);

  // Avoid forcing fullscreen on load because the browser prompt can cause blur events,
  // stall startup, and make the interview feel broken on some machines.
  useEffect(() => {
    return () => {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    };
  }, []);

  useEffect(() => {
    const loadInterview = async () => {
      try {
        const { data } = await api.get(`/interviews/result/${id}`);
        if (data.type !== "video_topic") {
          allowPageExitRef.current = true;
          navigate("/dashboard", { replace: true });
          return;
        }
        if (data.status !== "in_progress" && data.status !== "generated") {
          allowPageExitRef.current = true;
          interviewClosedRef.current = true;
          if (data.status === "completed") {
            navigate(`/result/${id}`, { replace: true });
          } else {
            navigate("/dashboard", { replace: true });
          }
          return;
        }
        setInterview(data);
        setIntegrityScore(Number(data.integrityScore) || 100);
        setSuspiciousEvents(data.suspiciousEvents || []);
        setWarningMessage("");
        
        // Preserve timer state based on interview start time
        const totalDurationSeconds = (Number(data.durationMinutes) || 10) * 60;
        let remainingSeconds = totalDurationSeconds;
        if (data.createdAt) {
          const elapsedSeconds = Math.max(0, Math.floor((Date.now() - new Date(data.createdAt).getTime()) / 1000));
          remainingSeconds = Math.max(0, totalDurationSeconds - elapsedSeconds);
        }
        setTimeLeftSeconds(remainingSeconds);
        startupGuardUntilRef.current = Date.now() + 6000;

        const answeredCount = Array.isArray(data.answers) ? data.answers.length : 0;
        const totalQuestions = Array.isArray(data.questions) ? data.questions.length : 0;
        const nextIndex = Math.min(answeredCount, Math.max(0, totalQuestions - 1));
        setCurrent(nextIndex);

        // Restore draft answer if available in sessionStorage for this session and question
        const savedDraft = sessionStorage.getItem(`aceprep:video-interview:${id}:q:${nextIndex}:draft`);
        if (savedDraft) {
          setFinalTranscript(savedDraft);
        }

        setAnswerSummary("");
        setAnswerReaction("");
        setQuickFeedback("");
        setFeedbackHighlights([]);
      } catch (error) {
        console.error(error);
        setFetchError(error?.response?.data?.message || "Failed to load video interview session");
      } finally {
        setLoading(false);
      }
    };

    loadInterview();
  }, [id, navigate]);

  useEffect(() => {
    if (!id || loading) return;
    const draftKey = `aceprep:video-interview:${id}:q:${current}:draft`;
    if (finalTranscript) {
      sessionStorage.setItem(draftKey, finalTranscript);
    } else {
      sessionStorage.removeItem(draftKey);
    }
  }, [finalTranscript, id, current, loading]);

  const attachStreamToVideo = (stream, videoNode) => {
    if (!stream || !videoNode) return;

    if (videoNode.srcObject !== stream) {
      videoNode.srcObject = stream;
    }

    const playVideo = () => {
      if (typeof videoNode.play === "function") {
        videoNode.play().catch(() => {
          videoNode.muted = true;
          videoNode.play().catch(() => {});
        });
      }
    };

    if (videoNode.readyState >= 2) {
      playVideo();
    } else {
      videoNode.onloadedmetadata = playVideo;
      videoNode.oncanplay = playVideo;
    }
  };

  const setVideoRef = (node) => {
    videoRef.current = node;
    if (node && streamRef.current) {
      attachStreamToVideo(streamRef.current, node);
    }
  };

  useEffect(() => {
    let aborted = false;

    const setupMedia = async () => {
      try {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }

        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });

        // If the effect was cleaned up while getUserMedia was pending,
        // stop the stream immediately to prevent camera/mic from staying on.
        if (aborted) {
          mediaStream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = mediaStream;
        if (videoRef.current) {
          attachStreamToVideo(mediaStream, videoRef.current);
        }

        setCameraReady(mediaStream.getVideoTracks().some((track) => track.enabled));
        setMicReady(mediaStream.getAudioTracks().length > 0);
        setCameraError("");
        startupGuardUntilRef.current = Date.now() + 1500;

        mediaStream.getVideoTracks().forEach((track) => {
          track.onended = () => {
            setCameraReady(false);
            addSuspiciousEvent("Warning: Camera is turned off during the interview.", 12);
          };
          track.onmute = () => {
            setCameraReady(false);
            addSuspiciousEvent("Warning: Camera is turned off during the interview.", 12);
          };
          track.onunmute = () => setCameraReady(true);
        });
      } catch (error) {
        console.error(error);
        if (!aborted) {
          setCameraError("Enable camera and microphone permissions before starting the interview.");
          setCameraReady(false);
          setMicReady(false);
        }
      }
    };

    setupMedia();

    return () => {
      aborted = true;
      stopMediaAndRecognition();
    };
  }, []);

  // Re-attach stream to the video element whenever it becomes available
  useEffect(() => {
    if (cameraReady && videoRef.current && streamRef.current) {
      attachStreamToVideo(streamRef.current, videoRef.current);
    }
  }, [cameraReady, loading]);

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.hidden) {
        addSuspiciousEvent("Warning: Tab switching is not allowed during the interview.", 10);
      }
    };

    const onBlur = () => {
      addSuspiciousEvent("Warning: Tab switching is not allowed during the interview.", 10);
    };

    const onCopy = (event) => {
      event.preventDefault();
      addSuspiciousEvent("Warning: Copy and paste is not allowed during the interview.", 8);
    };

    const onPaste = (event) => {
      event.preventDefault();
      addSuspiciousEvent("Warning: Copy and paste is not allowed during the interview.", 8);
    };

    const onContextMenu = (event) => {
      event.preventDefault();
      addSuspiciousEvent("Warning: Right click is disabled during the interview.", 4);
    };

    const onKeyDown = (event) => {
      const key = (event.key || "").toLowerCase();
      const isPrintScreen = key === "printscreen";
      const isMacScreenshot =
        event.metaKey &&
        event.shiftKey &&
        (key === "3" || key === "4" || key === "5");
      const isSnippingShortcut =
        (event.ctrlKey || event.metaKey) &&
        event.shiftKey &&
        key === "s";

      if (isPrintScreen || isMacScreenshot || isSnippingShortcut) {
        event.preventDefault();
        setScreenShieldActive(true);
        addSuspiciousEvent("Warning: Screenshot shortcut detected during the interview.", 12);
        window.setTimeout(() => setScreenShieldActive(false), 1600);
      }
    };

    window.addEventListener("blur", onBlur);
    window.addEventListener("keydown", onKeyDown);
    document.addEventListener("visibilitychange", onVisibilityChange);
    document.addEventListener("copy", onCopy);
    document.addEventListener("paste", onPaste);
    document.addEventListener("contextmenu", onContextMenu);

    return () => {
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      document.removeEventListener("copy", onCopy);
      document.removeEventListener("paste", onPaste);
      document.removeEventListener("contextmenu", onContextMenu);
    };
  }, []);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setRecognitionSupported(false);
      setRecognitionStatus("Speech recognition is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      setIsListening(true);
      setRecognitionStatus("Listening to your verbal answer...");
      lastSpeechRef.current = Date.now();
      // NOTE: Do NOT cancel speechSynthesis here.
      // The AI interviewer voice must be allowed to finish speaking
      // even while the microphone is active.
    };

    recognition.onresult = (event) => {
      let finalChunk = "";
      let interimChunk = "";

      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const transcript = event.results[index][0]?.transcript || "";
        if (event.results[index].isFinal) {
          finalChunk += `${transcript} `;
        } else {
          interimChunk += transcript;
        }
      }

      if (finalChunk) {
        setFinalTranscript((previous) => `${previous} ${finalChunk}`.trim());
      }

      setInterimTranscript(interimChunk.trim());
      lastSpeechRef.current = Date.now();
    };

    recognition.onerror = (event) => {
      setRecognitionStatus(`Speech recognition error: ${event.error}`);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimTranscript("");
      setRecognitionStatus((previous) =>
        previous.startsWith("Speech recognition error")
          ? previous
          : "Microphone paused. Start again when you are ready."
      );
    };

    recognitionRef.current = recognition;
  }, []);

  useEffect(() => {
    if (!("speechSynthesis" in window)) return;

    const updateVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);

      if (!manualVoiceSelectionRef.current) {
        const defaultVoice = selectDefaultVoice(availableVoices);
        if (defaultVoice) setSelectedVoiceURI(defaultVoice.voiceURI);
      }
    };

    updateVoices();
    window.speechSynthesis.resume?.();
    window.speechSynthesis.onvoiceschanged = updateVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, [preferredGender]);

  useEffect(() => {
    if (!("speechSynthesis" in window)) {
      setVoiceNotice("This browser does not support interviewer voice playback.");
      return undefined;
    }

    const unlockVoice = () => {
      if (speechPrimedRef.current) {
        if (pendingSpeechRef.current) {
          const pending = pendingSpeechRef.current;
          pendingSpeechRef.current = null;
          speakText(pending.text, pending.options);
        }
        return;
      }

      if (pendingSpeechRef.current) {
        const pending = pendingSpeechRef.current;
        pendingSpeechRef.current = null;
        speechPrimedRef.current = true;
        setVoicePlaybackReady(true);
        setVoiceNotice("Interviewer voice ready.");
        speakText(pending.text, pending.options);
        return;
      }

      const primer = new SpeechSynthesisUtterance(" ");
      primer.volume = 0;
      primer.rate = 1;
      primer.pitch = 1;

      const markReady = () => {
        if (speechPrimedRef.current) return;
        speechPrimedRef.current = true;
        setVoicePlaybackReady(true);
        setVoiceNotice("Interviewer voice ready.");

        if (pendingSpeechRef.current) {
          const pending = pendingSpeechRef.current;
          pendingSpeechRef.current = null;
          window.setTimeout(() => {
            speakText(pending.text, pending.options);
          }, 80);
        }
      };

      primer.onstart = markReady;
      primer.onend = markReady;
      primer.onerror = () => {
        setVoiceNotice("If the voice stays silent, click Start Answer once to unlock browser audio.");
      };

      try {
        window.speechSynthesis.resume?.();
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(primer);
        window.setTimeout(() => {
          if (window.speechSynthesis.speaking || !window.speechSynthesis.paused) {
            markReady();
          }
        }, 180);
      } catch (_) {
        setVoiceNotice("If the voice stays silent, click Start Answer once to unlock browser audio.");
      }
    };

    window.addEventListener("pointerdown", unlockVoice, { passive: true });
    window.addEventListener("keydown", unlockVoice);

    // Auto-prime: attempt to unlock the voice engine immediately.
    // The user has already clicked "Start Interview" on the previous page,
    // which counts as a user gesture in most browsers, so speechSynthesis
    // should be allowed without an additional click.
    unlockVoice();

    return () => {
      window.removeEventListener("pointerdown", unlockVoice);
      window.removeEventListener("keydown", unlockVoice);
    };
  }, []);

  useEffect(() => {
    if (!interview) return undefined;

    const timer = window.setInterval(() => {
      setTimeLeftSeconds((previous) => {
        if (previous <= 1) {
          window.clearInterval(timer);
          return 0;
        }
        return previous - 1;
      });

      if (isListening && Date.now() - lastSpeechRef.current > 20000) {
        setRecognitionStatus("Please respond verbally so we can continue the interview.");
      }
    }, 1000);

    return () => window.clearInterval(timer);
  }, [interview, isListening]);

  useEffect(() => {
    if (timeLeftSeconds !== 0) return;
    if (!interview || submitting) return;
    setWarningMessage("Interview time is over.");
    setTimeout(() => {
      leaveInterviewScreen("/dashboard");
    }, 600);
  }, [timeLeftSeconds, interview, submitting, navigate]);

  useEffect(() => {
    window.history.pushState({ interviewGuard: id }, "", window.location.href);

    const handlePopState = () => {
      if (allowPageExitRef.current || interviewClosedRef.current) return;
      window.history.pushState({ interviewGuard: id }, "", window.location.href);
      setShowQuitPrompt(true);
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [id]);

  useEffect(() => {
    const handleUnload = () => stopMediaAndRecognition();
    window.addEventListener("pagehide", handleUnload);
    window.addEventListener("beforeunload", handleUnload);
    return () => {
      window.removeEventListener("pagehide", handleUnload);
      window.removeEventListener("beforeunload", handleUnload);
    };
  }, []);

  useEffect(() => {
    if (!interview || interviewClosedRef.current || quittingRef.current) return undefined;

    if (integritySyncTimerRef.current) {
      window.clearTimeout(integritySyncTimerRef.current);
    }

    integritySyncTimerRef.current = window.setTimeout(() => {
      persistIntegrityState();
    }, 1500);

    return () => {
      if (integritySyncTimerRef.current) {
        window.clearTimeout(integritySyncTimerRef.current);
      }
    };
  }, [interview, integrityScore, suspiciousEvents, id]);

  const speakText = (text, options = {}) => {
    if (!text || !("speechSynthesis" in window)) return;

    if (!speechPrimedRef.current) {
      pendingSpeechRef.current = { text, options };
      setVoiceNotice("Unlocking interviewer voice...");
      return;
    }

    const { interrupt = true, delayMs = 0, onEnd } = options;

    const voice = selectedVoice || selectDefaultVoice(voices);
    const cleanedText = text.replace(/\s+/g, " ").trim();
    const utterance = new SpeechSynthesisUtterance(cleanedText);

    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang;
    }

    // A slightly faster default helps the interviewer feel more natural and less hesitant.
    utterance.rate = 1.14;
    utterance.pitch = 0.99;
    utterance.volume = 1;

    if (speakTimerRef.current) {
      window.clearTimeout(speakTimerRef.current);
    }

    if (interrupt) {
      window.speechSynthesis.cancel();
    }

    // Chrome has a well-known bug where it silently pauses speechSynthesis
    // utterances after roughly 15 seconds. To work around this, we set up a
    // keep-alive interval that calls resume() while the utterance is active.
    let keepAliveInterval = null;

    const cleanUpKeepAlive = () => {
      if (keepAliveInterval) {
        window.clearInterval(keepAliveInterval);
        keepAliveInterval = null;
      }
    };

    utterance.onend = () => {
      cleanUpKeepAlive();
      setIsSpeaking(false);
      if (activeUtteranceRef.current === utterance) {
        activeUtteranceRef.current = null;
      }
      if (typeof onEnd === "function") {
        onEnd();
      }
    };

    utterance.onerror = (event) => {
      cleanUpKeepAlive();
      setIsSpeaking(false);
      if (activeUtteranceRef.current === utterance) {
        activeUtteranceRef.current = null;
      }

      // If speech fails before starting, remove spokenKey so it is not permanently blocked
      if (options.spokenKey && event.error !== "interrupted" && event.error !== "canceled") {
        try {
          sessionStorage.removeItem(options.spokenKey);
        } catch (_) {}
      }

      // Never trigger onEnd when speech is canceled or interrupted intentionally
      if (
        event.error === "interrupted" ||
        event.error === "canceled" ||
        event.error === "not-allowed"
      ) {
        return;
      }
      if (typeof onEnd === "function") {
        onEnd();
      }
    };

    speakTimerRef.current = window.setTimeout(() => {
      activeUtteranceRef.current = utterance;
      setIsSpeaking(true);

      // Always resume before speaking — Chrome can leave synthesis in a
      // paused state after cancel() or after the browser tab regains focus.
      window.speechSynthesis.resume?.();
      window.speechSynthesis.speak(utterance);

      // Chrome keep-alive: periodically call resume() to prevent the
      // ~15-second silent-pause bug from cutting off longer utterances.
      keepAliveInterval = window.setInterval(() => {
        if (!window.speechSynthesis.speaking) {
          cleanUpKeepAlive();
          return;
        }
        window.speechSynthesis.pause();
        window.speechSynthesis.resume();
      }, 10000);
    }, delayMs);
  };

  useEffect(() => {
    if (!interview?.questions?.length || !id) return;

    const spokenKey = `aceprep:video-interview:${id}:q:${current}:spoken`;
    const isAlreadySpoken = sessionStorage.getItem(spokenKey) === "true";

    if (isAlreadySpoken) {
      // Question prompt was already introduced prior to browser refresh/resume. Do NOT speak again.
      return;
    }

    sessionStorage.setItem(spokenKey, "true");

    const timer = window.setTimeout(() => {
      speakText(getQuestionPrompt(current), { spokenKey });
    }, current === 0 ? 40 : 20);

    return () => window.clearTimeout(timer);
  }, [interview, currentQuestion, selectedVoiceURI, current, id]);

  const stopMediaAndRecognition = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      try {
        videoRef.current.pause();
      } catch (_) {
        /* no-op */
      }
      videoRef.current.srcObject = null;
    }
    if (recognitionRef.current) {
      recognitionRef.current.onend = null;
      recognitionRef.current.stop();
      if (typeof recognitionRef.current.abort === "function") {
        recognitionRef.current.abort();
      }
    }
    if (speakTimerRef.current) {
      window.clearTimeout(speakTimerRef.current);
      speakTimerRef.current = null;
    }
    if (thinkingSpeechTimerRef.current) {
      window.clearTimeout(thinkingSpeechTimerRef.current);
      thinkingSpeechTimerRef.current = null;
    }
    activeUtteranceRef.current = null;
    pendingSpeechRef.current = null;
    window.speechSynthesis?.cancel();
    setIsListening(false);
    setCameraReady(false);
    setMicReady(false);
  };

  const clearSessionStorageData = () => {
    try {
      if (!id) return;
      Object.keys(sessionStorage).forEach((key) => {
        if (key.startsWith(`aceprep:video-interview:${id}:`)) {
          sessionStorage.removeItem(key);
        }
      });
    } catch (_) {}
  };

  const leaveInterviewScreen = (nextPath = "/dashboard") => {
    allowPageExitRef.current = true;
    interviewClosedRef.current = true;
    setShowQuitPrompt(false);
    clearSessionStorageData();
    stopMediaAndRecognition();
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    navigate(nextPath, { replace: true });
  };

  const confirmQuitInterview = async () => {
    if (quittingRef.current || !interview) return;

    quittingRef.current = true;
    setQuitting(true);

    try {
      try {
        await api.post("/interviews/abandon", {
          interviewId: id,
          integrityScore,
          suspiciousActionsCount,
          suspiciousEvents
        });
      } catch (error) {
        if (error?.response?.status !== 404) {
          throw error;
        }

        // Support older backend sessions that have not been restarted yet.
        await api.delete(`/interviews/${id}`);
      }

      leaveInterviewScreen("/dashboard");
    } catch (error) {
      console.error(error);
      setWarningMessage(error?.response?.data?.message || "Failed to quit interview");
      setShowQuitPrompt(false);
    } finally {
      quittingRef.current = false;
      setQuitting(false);
    }
  };

  const startListening = () => {
    if (pendingSpeechRef.current) {
      speechPrimedRef.current = true;
      setVoicePlaybackReady(true);
      setVoiceNotice("Interviewer voice unlocked.");
      const pending = pendingSpeechRef.current;
      pendingSpeechRef.current = null;
      speakText(pending.text, pending.options);
    }

    if (!recognitionRef.current || !recognitionSupported || isListening || submitting) return;
    recognitionRef.current.start();
  };

  const stopListening = () => {
    if (!recognitionRef.current || !isListening) return;
    recognitionRef.current.stop();
    setRecognitionStatus("Finalizing your spoken answer...");
  };

  const clearTranscript = () => {
    if (isListening) recognitionRef.current?.stop();
    setFinalTranscript("");
    setInterimTranscript("");
    if (id) {
      sessionStorage.removeItem(`aceprep:video-interview:${id}:q:${current}:draft`);
    }
    setRecognitionStatus("Transcript cleared. Start speaking when ready.");
  };

  async function submitAnswer(isAutoSubmit = false) {
    const transcript = fullTranscript.trim();
    if ((!transcript && !isAutoSubmit) || submitting) return;

    if (isListening) stopListening();
    setSubmitting(true);

    try {
      thinkingSpeechTimerRef.current = window.setTimeout(() => {
        speakText("One moment while I review that.", {
          interrupt: false
        });
      }, 220);

      const safeAnswer = transcript || "No verbal response detected (timeout).";
      const { data } = await api.post("/interviews/answer", {
        interviewId: id,
        questionIndex: current,
        answer: safeAnswer,
        integrity: {
          integrityScore,
          suspiciousActionsCount,
          suspiciousEvents
        }
      });

      if (thinkingSpeechTimerRef.current) {
        window.clearTimeout(thinkingSpeechTimerRef.current);
        thinkingSpeechTimerRef.current = null;
      }

      if (activeUtteranceRef.current) {
        window.speechSynthesis.cancel();
        activeUtteranceRef.current = null;
      }

      setAnswerSummary(data.answerSummary || "");
      setAnswerReaction(data.encouragement || "");
      setQuickFeedback(data.quickFeedback || "");
      setFeedbackHighlights(data.feedbackHighlights || []);
      setIntegrityScore(Number(data.integrityScore) || integrityScore);

      const spokenFeedbackParts = [
        data.encouragement,
        data.answerSummary || "",
        data.quickFeedback || ""
      ].filter(Boolean);

      if (data.completed) {
        const finishAction = () => leaveInterviewScreen(`/result/${id}`);
        nextQuestionActionRef.current = finishAction;
        setIsPendingFeedback(true);
        if (spokenFeedbackParts.length) {
          speakText(spokenFeedbackParts.join(" "), {
            onEnd: () => {
              if (nextQuestionActionRef.current === finishAction) {
                finishAction();
              }
            }
          });
        } else {
          setTimeout(finishAction, 40);
        }
        return;
      }

      const questionIndexSubmitted = current;
      const nextQuestionIndex = questionIndexSubmitted + 1;

      const moveToNextQuestion = () => {
        nextQuestionActionRef.current = null;
        setIsPendingFeedback(false);
        if (activeUtteranceRef.current) {
          window.speechSynthesis?.cancel();
          activeUtteranceRef.current = null;
        }
        setIsSpeaking(false);

        if (id) {
          sessionStorage.removeItem(`aceprep:video-interview:${id}:q:${questionIndexSubmitted}:draft`);
        }

        setCurrent(nextQuestionIndex);
        setFinalTranscript("");
        setInterimTranscript("");
        setAnswerSummary("");
        setAnswerReaction("");
        setQuickFeedback("");
        setFeedbackHighlights([]);
        setRecognitionStatus("Microphone answer mode ready.");
      };

      nextQuestionActionRef.current = moveToNextQuestion;
      setIsPendingFeedback(true);

      if (spokenFeedbackParts.length) {
        speakText(spokenFeedbackParts.join(" "), {
          onEnd: () => {
            if (nextQuestionActionRef.current === moveToNextQuestion) {
              moveToNextQuestion();
            }
          }
        });
      } else {
        window.setTimeout(() => {
          if (nextQuestionActionRef.current === moveToNextQuestion) {
            moveToNextQuestion();
          }
        }, 40);
      }
    } catch (error) {
      nextQuestionActionRef.current = null;
      setIsPendingFeedback(false);
      if (thinkingSpeechTimerRef.current) {
        window.clearTimeout(thinkingSpeechTimerRef.current);
        thinkingSpeechTimerRef.current = null;
      }
      console.error(error);
      setWarningMessage(error?.response?.data?.message || "Failed to submit answer");
    } finally {
      setSubmitting(false);
    }
  }

  const handleActionClick = () => {
    if (isPendingFeedback && nextQuestionActionRef.current) {
      const advance = nextQuestionActionRef.current;
      nextQuestionActionRef.current = null;
      setIsPendingFeedback(false);
      advance();
      return;
    }
    submitAnswer(false);
  };

  if (loading) {
    return <VideoInterviewSkeleton />;
  }

  if (fetchError) {
    return (
      <div className="video-interview-shell">
        <div className="active-question-card" style={{ textAlign: "center", padding: "3rem 1.5rem", maxWidth: "600px", margin: "4rem auto" }}>
          <span className="material-symbols-outlined" style={{ fontSize: "3.2rem", color: "#ef4444", marginBottom: "0.8rem" }}>error</span>
          <h2 style={{ marginBottom: "0.5rem", fontFamily: "'Syne', sans-serif" }}>Unable to Load Interview</h2>
          <p style={{ color: "var(--text-secondary)", marginBottom: "1.5rem" }}>{fetchError}</p>
          <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
            <button type="button" className="mic-control-btn ready" onClick={() => window.location.reload()}>
              Retry Initialization
            </button>
            <button type="button" className="room-quit-btn" onClick={() => navigate("/dashboard")}>
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!interview?.questions?.length) {
    return <h2 className="live-loading">Interview unavailable</h2>;
  }

  const replayCurrentQuestion = () => {
    if (!currentQuestion) return;
    speakText(currentQuestion);
  };

  return (
    <div className="video-interview-shell">
      {warningMessage && <div className="integrity-warning-banner">{warningMessage}</div>}

      {screenShieldActive && (
        <div className="live-overlay">
          <div className="quit-interview-modal screenshot-block-modal">
            <h3>Screenshot Blocked</h3>
            <p>Screenshot attempts are treated as cheating and recorded in the interview report.</p>
          </div>
        </div>
      )}

      {submitting && (
        <div className="live-overlay">
          <div className="live-spinner"></div>
          <p>Analyzing your verbal response...</p>
        </div>
      )}

      {showQuitPrompt && (
        <div className="live-overlay">
          <div className="quit-interview-modal">
            <h3>Quit Interview?</h3>
            <p>If you leave now, you cannot enter this same interview again.</p>
            <div className="quit-interview-actions">
              <button type="button" className="quit-interview-yes" onClick={confirmQuitInterview} disabled={quitting}>
                {quitting ? "Quitting..." : "YES"}
              </button>
              <button type="button" className="quit-interview-no" onClick={() => setShowQuitPrompt(false)} disabled={quitting}>
                NO
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Header Navigation Bar */}
      <header className="video-room-topbar">
        <div className="topbar-left">
          <div className="room-topic-badge">
            <span className="material-symbols-outlined">videocam</span>
            <span className="room-topic-name">{interview.topic}</span>
            <span className="room-difficulty-pill">{interview.difficulty}</span>
          </div>
        </div>

        <div className="topbar-center">
          <div className="room-progress-chip">
            Question <strong>{current + 1}</strong> of {interview.questions.length}
          </div>
        </div>

        <div className="topbar-right">
          <div className={`timer-pill ${timeLeftSeconds <= 60 ? "timer-critical" : timeLeftSeconds <= 180 ? "timer-warning" : ""}`}>
            <span className="material-symbols-outlined">timer</span>
            {Math.floor(timeLeftSeconds / 60)}:{String(timeLeftSeconds % 60).padStart(2, "0")}
          </div>

          <div className="integrity-pill-badge">
            <span className="material-symbols-outlined">shield</span>
            <span>Integrity: {integrityScore}</span>
          </div>

          <button
            type="button"
            className="room-quit-btn"
            onClick={() => setShowQuitPrompt(true)}
            disabled={submitting}
            title="Quit interview"
          >
            <span className="material-symbols-outlined">logout</span>
            Quit
          </button>
        </div>
      </header>

      {/* Main Studio Area */}
      <div className="video-room-main">
        {/* Left Column: Webcam & AI Status */}
        <aside className="video-left-studio">
          <div className="video-camera-card">
            <div className="camera-header-overlay">
              <span className="camera-live-dot">
                <span className="dot-pulse" />
                {cameraReady ? "Live" : "No Camera"}
              </span>
              <span className="camera-mic-status">
                <span className={`material-symbols-outlined ${isListening ? "active-icon" : "muted-icon"}`}>
                  {isListening ? "mic" : "mic_off"}
                </span>
              </span>
            </div>

            <div className="video-feed-box">
              <video
                ref={setVideoRef}
                autoPlay
                playsInline
                muted
                className="video-feed-element"
                style={{ display: cameraReady ? "block" : "none" }}
              />
              {!cameraReady && (
                <div className="video-feed-fallback">
                  <span className="material-symbols-outlined">videocam_off</span>
                  <p>{cameraError || "Camera & microphone permissions required."}</p>
                </div>
              )}
            </div>
          </div>

          {/* AI Speaker State Card */}
          {isSpeaking ? (
            <div className="ai-speaker-card active-speech">
              <div className="sound-wave-bars">
                <span /><span /><span /><span /><span />
              </div>
              <div className="ai-speaker-info">
                <strong>AI Interviewer is speaking</strong>
                <span>Listening to question prompt...</span>
              </div>
            </div>
          ) : (
            <div className="ai-speaker-card">
              <span className="material-symbols-outlined ai-agent-icon">smart_toy</span>
              <div className="ai-speaker-info">
                <strong>AI Agent Ready</strong>
                <span>{isListening ? "Listening to your answer..." : "Microphone paused."}</span>
              </div>
            </div>
          )}

          {/* Telemetry Summary */}
          <div className="studio-telemetry-box">
            <div className="telemetry-item">
              <span className="telemetry-label">Focus Areas</span>
              <div className="telemetry-topics">
                {(interview.topics || [interview.topic]).slice(0, 4).map((t) => (
                  <span key={t} className="telemetry-topic-tag">{t}</span>
                ))}
              </div>
            </div>
            <div className="telemetry-row">
              <div className="telemetry-col">
                <span className="telemetry-label">Duration</span>
                <strong>{interview.durationMinutes} min</strong>
              </div>
              <div className="telemetry-col">
                <span className="telemetry-label">Suspicious Events</span>
                <strong className={suspiciousActionsCount > 0 ? "warn-text" : "good-text"}>
                  {suspiciousActionsCount}
                </strong>
              </div>
            </div>
          </div>
        </aside>

        {/* Right Column: Question & Real-Time Verbal Studio */}
        <main className="video-right-studio">
          {/* Active Question Box */}
          <div className="active-question-card">
            <div className="question-card-top">
              <span className="question-seq-pill">Question {current + 1} of {interview.questions.length}</span>
              <button
                type="button"
                className="replay-question-btn"
                onClick={replayCurrentQuestion}
                disabled={isSpeaking || submitting}
                title="Hear the question spoken again"
              >
                <span className="material-symbols-outlined">volume_up</span>
                Replay Audio
              </button>
            </div>

            <h2 className="active-question-text">{currentQuestion}</h2>
            <p className="active-question-hint">
              Speak your response clearly into your microphone. Your answer is transcribed in real time.
            </p>
          </div>

          {/* Live Verbal Response Capture */}
          <div className="verbal-response-card">
            <div className="verbal-response-header">
              <div className="verbal-status-badge">
                <span className={`status-dot ${isListening ? "recording" : "paused"}`} />
                <span>{isListening ? "Recording Verbal Answer..." : "Microphone Paused"}</span>
              </div>
            </div>

            <div className="verbal-transcript-container">
              {!recognitionSupported ? (
                <div className="transcript-placeholder-msg">
                  Speech recognition is not supported in this browser. Please use Chrome for speech interviewing.
                </div>
              ) : fullTranscript ? (
                <div className="transcript-live-text">
                  {finalTranscript}
                  {interimTranscript && <span className="transcript-interim-text"> {interimTranscript}</span>}
                </div>
              ) : (
                <div className="transcript-placeholder-msg">
                  {isListening
                    ? "Listening... start speaking your answer now."
                    : "Microphone is paused. Click 'Start Speaking' below to capture your voice."}
                </div>
              )}
            </div>

            {/* Quick Feedback Flash Card */}
            {(answerReaction || answerSummary || quickFeedback || feedbackHighlights.length > 0) && (
              <div className="feedback-flash-card">
                {answerReaction && (
                  <p className="feedback-row">
                    <strong className="feedback-tag tag-reaction">Interviewer Reaction:</strong> {answerReaction}
                  </p>
                )}
                {answerSummary && (
                  <p className="feedback-row">
                    <strong className="feedback-tag tag-summary">Previous Answer Summary:</strong> {answerSummary}
                  </p>
                )}
                {quickFeedback && (
                  <p className="feedback-row">
                    <strong className="feedback-tag tag-feedback">Feedback:</strong> {quickFeedback}
                  </p>
                )}
                {feedbackHighlights.length > 0 && (
                  <div className="feedback-coaching-block">
                    <strong className="feedback-tag tag-coaching">On-the-spot Coaching:</strong>
                    <div className="coaching-items">
                      {feedbackHighlights.map((item, index) => (
                        <p key={`${item}-${index}`} className="coaching-bullet">
                          <span>{index + 1}.</span> {item}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Control Actions Bar */}
            <div className="verbal-action-bar">
              <div className="verbal-mic-controls">
                {isListening ? (
                  <button
                    type="button"
                    className="mic-control-btn recording"
                    onClick={stopListening}
                    disabled={submitting}
                  >
                    <span className="material-symbols-outlined">pause_circle</span>
                    Pause Mic
                  </button>
                ) : (
                  <button
                    type="button"
                    className="mic-control-btn ready"
                    onClick={startListening}
                    disabled={!recognitionSupported || submitting}
                  >
                    <span className="material-symbols-outlined">mic</span>
                    Start Speaking
                  </button>
                )}

                <button
                  type="button"
                  className="mic-sub-btn"
                  onClick={clearTranscript}
                  disabled={!fullTranscript || submitting}
                  title="Clear Transcript"
                >
                  <span className="material-symbols-outlined">backspace</span>
                  Clear
                </button>
              </div>

              <button
                type="button"
                className="submit-answer-btn"
                onClick={handleActionClick}
                disabled={(!fullTranscript && !isPendingFeedback) || submitting}
              >
                {submitting ? (
                  <>
                    <span className="material-symbols-outlined spinning">sync</span>
                    Analyzing Response...
                  </>
                ) : isPendingFeedback ? (
                  <>
                    Next Question
                    <span className="material-symbols-outlined">arrow_forward</span>
                  </>
                ) : current + 1 === interview.questions.length ? (
                  <>
                    Finish & View Report
                    <span className="material-symbols-outlined">arrow_forward</span>
                  </>
                ) : (
                  <>
                    Submit & Next Question
                    <span className="material-symbols-outlined">arrow_forward</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
