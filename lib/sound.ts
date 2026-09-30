// Centralized SFX Manager for CSE Reviewer Gamified

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  return audioCtx;
}

// In-memory cache to prevent HTML5 Audio objects from being garbage-collected mid-playback
const audioCache = new Map<string, HTMLAudioElement>();

function getOrCreateAudio(src: string): HTMLAudioElement {
  let audio = audioCache.get(src);
  if (!audio) {
    audio = new Audio(src);
    audio.preload = "auto";
    audioCache.set(src, audio);
  }
  return audio;
}

// Preload common game SFX on browser startup
if (typeof window !== "undefined") {
  try {
    const preloads = ["/videos/correct.mp3", "/videos/wrong.mp3", "/videos/claimed_reward.webm"];
    preloads.forEach((src) => {
      const a = getOrCreateAudio(src);
      a.load();
    });
  } catch {
    // Ignore initial preload failures
  }

  // Global user-gesture unlock for AudioContext and HTML5 Audio
  const unlockAudio = () => {
    try {
      const ctx = getAudioContext();
      if (ctx && ctx.state === "suspended") {
        ctx.resume();
      }
    } catch {
      // Ignore
    }
    window.removeEventListener("pointerdown", unlockAudio);
    window.removeEventListener("keydown", unlockAudio);
  };

  window.addEventListener("pointerdown", unlockAudio, { once: true });
  window.addEventListener("keydown", unlockAudio, { once: true });
}

/**
 * Web Audio API synthesizer fallback in case browser policy or missing codec blocks audio files
 */
function playSynthFallback(type: "correct" | "wrong" | "reward") {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === "suspended") {
      ctx.resume();
    }

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === "correct") {
      // Upbeat cheerful arpeggio (C5 -> E5 -> G5)
      osc.type = "sine";
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.setValueAtTime(659.25, now + 0.08);
      osc.frequency.setValueAtTime(783.99, now + 0.16);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

      osc.start(now);
      osc.stop(now + 0.4);
    } else if (type === "wrong") {
      // Low gentle buzz
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.setValueAtTime(130, now + 0.1);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

      osc.start(now);
      osc.stop(now + 0.35);
    } else {
      // Reward fanfare
      osc.type = "triangle";
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.setValueAtTime(554.37, now + 0.1);
      osc.frequency.setValueAtTime(659.25, now + 0.2);
      osc.frequency.setValueAtTime(880, now + 0.3);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);

      osc.start(now);
      osc.stop(now + 0.6);
    }
  } catch (err) {
    console.warn("[SFX] Synth fallback error:", err);
  }
}

export function isSoundEnabled(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem("lesson_sfx_enabled") !== "false";
}

export function setSoundEnabledState(enabled: boolean): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("lesson_sfx_enabled", enabled ? "true" : "false");
}

/**
 * Universal SFX Player
 * Plays the specified audio file, cloning if already playing, and falls back to Web Audio synth if blocked.
 */
export function playSound(src: string, fallbackType?: "correct" | "wrong" | "reward"): void {
  if (typeof window === "undefined") return;

  if (!isSoundEnabled()) {
    console.log("[SFX] Sound is muted (lesson_sfx_enabled = false). Toggle 🔊 to enable.");
    return;
  }

  try {
    const primary = getOrCreateAudio(src);
    primary.volume = 1.0;

    // If already playing or ended, clone node or reset to allow rapid sound triggers
    let audioToPlay = primary;
    if (!primary.paused && primary.currentTime > 0) {
      audioToPlay = primary.cloneNode(true) as HTMLAudioElement;
      audioToPlay.volume = 1.0;
    } else {
      audioToPlay.currentTime = 0;
    }

    const promise = audioToPlay.play();
    if (promise !== undefined) {
      promise.catch((err) => {
        console.warn(`[SFX] HTML5 Audio play error for ${src}:`, err.message);
        // Fall back to synth if audio file couldn't play
        if (fallbackType) {
          playSynthFallback(fallbackType);
        } else if (src.includes("correct")) {
          playSynthFallback("correct");
        } else if (src.includes("wrong")) {
          playSynthFallback("wrong");
        } else if (src.includes("reward")) {
          playSynthFallback("reward");
        }
      });
    }
  } catch (err) {
    console.warn(`[SFX] Failed to instantiate audio for ${src}:`, err);
    if (fallbackType) {
      playSynthFallback(fallbackType);
    }
  }
}

export function playCorrectSound(): void {
  playSound("/videos/correct.mp3", "correct");
}

export function playWrongSound(): void {
  playSound("/videos/wrong.mp3", "wrong");
}

export function playRewardSound(): void {
  playSound("/videos/claimed_reward.webm", "reward");
}
