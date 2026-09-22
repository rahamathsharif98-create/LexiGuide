// audioService: lightweight WebAudio-based sound effects + generative ambient music.
// We intentionally avoid bundling any copyrighted music/sfx files. All sounds here
// are synthesized at runtime with the Web Audio API. If Web Audio is unavailable,
// every method becomes a safe no-op so the game never crashes.

class AudioService {
  constructor() {
    this.ctx = null;
    this.enabledMusic = true;
    this.enabledSfx = true;
    this.musicNodes = null;
    this.available = false;
    this._initAttempted = false;
  }

  _ensureContext() {
    if (this._initAttempted) return this.available;
    this._initAttempted = true;
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return false;
      this.ctx = new Ctx();
      this.available = true;
    } catch {
      this.available = false;
    }
    return this.available;
  }

  resume() {
    if (this._ensureContext() && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  setMusicEnabled(v) {
    this.enabledMusic = v;
    if (!v) this.stopMusic();
  }

  setSfxEnabled(v) {
    this.enabledSfx = v;
  }

  _tone({ freq = 440, duration = 0.15, type = 'sine', gain = 0.15, freqEnd = null, delay = 0 }) {
    if (!this.enabledSfx || !this._ensureContext()) return;
    const t0 = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (freqEnd) osc.frequency.exponentialRampToValueAtTime(Math.max(freqEnd, 1), t0 + duration);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain, t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
    osc.connect(g).connect(this.ctx.destination);
    osc.start(t0);
    osc.stop(t0 + duration + 0.02);
  }

  playJump() {
    this._tone({ freq: 420, freqEnd: 720, duration: 0.18, type: 'triangle', gain: 0.12 });
  }

  playLand() {
    this._tone({ freq: 180, freqEnd: 90, duration: 0.12, type: 'sine', gain: 0.1 });
  }

  playCollectLetter() {
    this._tone({ freq: 660, freqEnd: 990, duration: 0.14, type: 'sine', gain: 0.15 });
    this._tone({ freq: 990, duration: 0.12, type: 'sine', gain: 0.1, delay: 0.08 });
  }

  playCorrect() {
    [660, 880, 1100].forEach((f, i) => this._tone({ freq: f, duration: 0.16, type: 'sine', gain: 0.14, delay: i * 0.08 }));
  }

  playIncorrect() {
    this._tone({ freq: 320, freqEnd: 220, duration: 0.25, type: 'sine', gain: 0.1 });
  }

  playPowerUp() {
    [440, 660, 880, 1200].forEach((f, i) => this._tone({ freq: f, duration: 0.1, type: 'square', gain: 0.08, delay: i * 0.05 }));
  }

  playHit() {
    this._tone({ freq: 140, freqEnd: 60, duration: 0.3, type: 'sawtooth', gain: 0.12 });
  }

  playCheckpoint() {
    [523, 659, 784, 1046].forEach((f, i) => this._tone({ freq: f, duration: 0.2, type: 'sine', gain: 0.13, delay: i * 0.1 }));
  }

  playAchievement() {
    [523, 659, 784, 1046, 1318].forEach((f, i) => this._tone({ freq: f, duration: 0.22, type: 'triangle', gain: 0.14, delay: i * 0.09 }));
  }

  playButton() {
    this._tone({ freq: 500, duration: 0.06, type: 'square', gain: 0.06 });
  }

  startMusic() {
    if (!this.enabledMusic || !this._ensureContext() || this.musicNodes) return;
    // Gentle generative ambient pad using detuned oscillators + slow LFO — original, non-copyrighted.
    const master = this.ctx.createGain();
    master.gain.value = 0.05;
    master.connect(this.ctx.destination);

    const notes = [220, 277.18, 329.63, 415.3]; // A3 C#4 E4 G#4 - airy pad
    const oscs = notes.map((freq, idx) => {
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const g = this.ctx.createGain();
      g.gain.value = 0.5 / notes.length;
      const lfo = this.ctx.createOscillator();
      lfo.frequency.value = 0.05 + idx * 0.01;
      const lfoGain = this.ctx.createGain();
      lfoGain.gain.value = 0.15;
      lfo.connect(lfoGain).connect(g.gain);
      osc.connect(g).connect(master);
      osc.start();
      lfo.start();
      return { osc, lfo, g };
    });

    this.musicNodes = { master, oscs };
  }

  stopMusic() {
    if (!this.musicNodes) return;
    try {
      this.musicNodes.oscs.forEach(({ osc, lfo }) => {
        osc.stop();
        lfo.stop();
      });
      this.musicNodes.master.disconnect();
    } catch {
      /* noop */
    }
    this.musicNodes = null;
  }
}

export const audioService = new AudioService();
export default audioService;
