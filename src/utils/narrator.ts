// Narrator and Voiceover Manager for "До рассвета"
// Supports both recorded audio files (mp3/wav) and browser-native SpeechSynthesis for instant testing.

class NarratorManager {
  private currentAudio: HTMLAudioElement | null = null;
  private isSpeakingSpeech: boolean = false;
  private listeners: Set<(speaking: boolean) => void> = new Set();
  private autoNarrate: boolean = true;

  constructor() {
    try {
      const saved = localStorage.getItem('do_rassveta_autonarrate');
      if (saved !== null) {
        this.autoNarrate = saved === 'true';
      }
    } catch {}
  }

  public isAutoNarrateEnabled(): boolean {
    return this.autoNarrate;
  }

  public setAutoNarrate(enabled: boolean) {
    this.autoNarrate = enabled;
    try {
      localStorage.setItem('do_rassveta_autonarrate', enabled ? 'true' : 'false');
    } catch {}
  }

  public subscribe(cb: (speaking: boolean) => void) {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private notify(speaking: boolean) {
    this.listeners.forEach((cb) => cb(speaking));
  }

  // Play pre-recorded voiceover audio file OR fallback to Text-To-Speech
  public speak(text: string, voiceoverUrl?: string) {
    this.stop();

    if (voiceoverUrl) {
      // 1. Pre-recorded professional voice acting file
      this.currentAudio = new Audio(voiceoverUrl);
      this.currentAudio.onplay = () => this.notify(true);
      this.currentAudio.onended = () => {
        this.notify(false);
        this.currentAudio = null;
      };
      this.currentAudio.onerror = () => {
        // Fallback to speech synthesis if file is missing
        this.speakWithSpeechSynthesis(text);
      };
      this.currentAudio.play().catch(() => {
        this.speakWithSpeechSynthesis(text);
      });
    } else {
      // 2. Browser native text-to-speech fallback
      this.speakWithSpeechSynthesis(text);
    }
  }

  private speakWithSpeechSynthesis(text: string) {
    if (!('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ru-RU';
    utterance.rate = 0.95; // Slightly slower, cinematic cadence
    utterance.pitch = 0.9; // Lower, dramatic tone

    // Try finding a good Russian voice (e.g. Yuri, Milena, Google русский)
    const voices = window.speechSynthesis.getVoices();
    const ruVoice = voices.find((v) => v.lang.startsWith('ru') && !v.name.includes('Compact')) ||
                    voices.find((v) => v.lang.startsWith('ru'));
    if (ruVoice) {
      utterance.voice = ruVoice;
    }

    utterance.onstart = () => {
      this.isSpeakingSpeech = true;
      this.notify(true);
    };

    utterance.onend = () => {
      this.isSpeakingSpeech = false;
      this.notify(false);
    };

    utterance.onerror = () => {
      this.isSpeakingSpeech = false;
      this.notify(false);
    };

    window.speechSynthesis.speak(utterance);
  }

  public stop() {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.isSpeakingSpeech = false;
    this.notify(false);
  }

  public isBusy(): boolean {
    return this.isSpeakingSpeech || (this.currentAudio !== null && !this.currentAudio.paused);
  }
}

export const narrator = new NarratorManager();
