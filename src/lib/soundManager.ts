import { Howl } from 'howler';

// Web Audio API fallback sound synthesizer for instant crisp sound effects without external file loading delays
class SoundEffectsManager {
  private audioCtx: AudioContext | null = null;
  private bgMusic: Howl | null = null;
  private isMuted: boolean = false;

  private getAudioContext(): AudioContext | null {
    if (!this.audioCtx && typeof window !== 'undefined') {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  public initBgMusic(src: string = '/Neon Sprint.mp3') {
    if (this.bgMusic) return;

    try {
      this.bgMusic = new Howl({
        src: [src],
        loop: true,
        volume: 0.15, // Low background level (~-12dB) so speech TTS is crystal clear
        html5: true,
        autoplay: false,
      });
    } catch (e) {
      console.warn('Howler bg music initialization fallback:', e);
    }
  }

  public playBgMusic() {
    if (this.isMuted) return;
    if (!this.bgMusic) {
      this.initBgMusic();
    }
    if (this.bgMusic && !this.bgMusic.playing()) {
      this.bgMusic.play();
    }
  }

  public stopBgMusic() {
    if (this.bgMusic && this.bgMusic.playing()) {
      this.bgMusic.pause();
    }
  }

  public setMute(muted: boolean) {
    this.isMuted = muted;
    if (this.bgMusic) {
      this.bgMusic.volume(muted ? 0 : 0.15);
    }
  }

  public playCorrectGate() {
    if (this.isMuted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    // Happy 2-tone major arpeggio chime (E5 -> G#5 -> B5)
    const now = ctx.currentTime;
    [659.25, 830.61, 987.77].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.08);

      gain.gain.setValueAtTime(0.3, now + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + i * 0.08);
      osc.stop(now + i * 0.08 + 0.3);
    });
  }

  public playWrongGate() {
    if (this.isMuted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    // Sawtooth stumble crash buzz
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.35);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.35);
  }

  public playCoin() {
    if (this.isMuted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    // High golden coin ping (B5 -> E6)
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(987.77, now);
    osc.frequency.setValueAtTime(1318.51, now + 0.06);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.18);
  }

  public playSwipe() {
    if (this.isMuted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    // Fast filtered noise / woosh sweep
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.1);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.linearRampToValueAtTime(0.001, now + 0.1);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.1);
  }

  public playJump() {
    if (this.isMuted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    // Pitch upward sweep jump (200Hz -> 550Hz)
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(580, now + 0.22);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.22);
  }

  public speakWord(word: string) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(word);
      u.lang = 'en-US';
      u.rate = 0.85;
      u.volume = this.isMuted ? 0 : 1.0;
      window.speechSynthesis.speak(u);
    } catch (e) {
      console.warn('TTS speech error:', e);
    }
  }
}

export const soundManager = new SoundEffectsManager();
