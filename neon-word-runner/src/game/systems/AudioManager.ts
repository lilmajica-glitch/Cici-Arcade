type MusicLayer = 'normal' | 'combo' | 'fever' | 'off';
type SoundName =
  | 'footstep' | 'jump' | 'vault' | 'slide' | 'dash'
  | 'correct' | 'wrong' | 'combo' | 'fever' | 'finish';

interface SoundShape {
  startHz: number;
  endHz: number;
  durationMs: number;
  wave: OscillatorType;
  level: number;
}

const SOUND_SHAPES: Record<SoundName, SoundShape> = {
  footstep: { startHz: 100, endHz: 74, durationMs: 55, wave: 'sine', level: 0.08 },
  jump: { startHz: 260, endHz: 430, durationMs: 150, wave: 'triangle', level: 0.2 },
  vault: { startHz: 320, endHz: 620, durationMs: 180, wave: 'triangle', level: 0.22 },
  slide: { startHz: 510, endHz: 250, durationMs: 190, wave: 'sawtooth', level: 0.12 },
  dash: { startHz: 180, endHz: 880, durationMs: 230, wave: 'sawtooth', level: 0.2 },
  correct: { startHz: 520, endHz: 880, durationMs: 210, wave: 'sine', level: 0.18 },
  wrong: { startHz: 220, endHz: 92, durationMs: 260, wave: 'triangle', level: 0.22 },
  combo: { startHz: 660, endHz: 990, durationMs: 260, wave: 'sine', level: 0.18 },
  fever: { startHz: 440, endHz: 1_320, durationMs: 480, wave: 'triangle', level: 0.22 },
  finish: { startHz: 392, endHz: 784, durationMs: 620, wave: 'sine', level: 0.2 },
};

const MUSIC_CHORDS: Record<Exclude<MusicLayer, 'off'>, readonly number[]> = {
  normal: [110, 164.81, 220],
  combo: [146.83, 220, 293.66],
  fever: [196, 293.66, 392],
};

export class AudioManager {
  private context?: AudioContext;
  private master?: GainNode;
  private readonly buses = new Map<Exclude<MusicLayer, 'off'>, GainNode>();
  private readonly voices: OscillatorNode[] = [];
  private readonly pronunciations = new Map<string, HTMLAudioElement>();
  private volume = 0.7;
  private musicLayer: MusicLayer = 'off';

  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.master && this.context) this.master.gain.setTargetAtTime(this.volume, this.context.currentTime, 0.04);
    this.pronunciations.forEach((audio) => { audio.volume = this.volume * 0.78; });
  }

  resume(): void {
    if ('speechSynthesis' in window) window.speechSynthesis.resume();
    const context = this.getContext();
    if (!context) return;
    if (context.state === 'suspended') {
      void context.resume().then(() => {
        if (this.context !== context || context.state !== 'running') return;
        this.ensureMusic();
        this.applyMusicLayer();
      }).catch(() => undefined);
      return;
    }
    this.ensureMusic();
    this.applyMusicLayer();
  }

  suspend(): void {
    if ('speechSynthesis' in window) window.speechSynthesis.pause();
    this.pronunciations.forEach((audio) => audio.pause());
    if (this.context?.state === 'running') void this.context.suspend().catch(() => undefined);
  }

  setMusicLayer(layer: MusicLayer): void {
    this.musicLayer = layer;
    if (!this.context || this.context.state === 'suspended') return;
    this.ensureMusic();
    this.applyMusicLayer();
  }

  playSfx(name: SoundName): void {
    if (this.volume <= 0) return;
    const context = this.getContext();
    if (!context || context.state === 'suspended') return;
    const shape = SOUND_SHAPES[name];
    const now = context.currentTime;
    const oscillator = context.createOscillator();
    const envelope = context.createGain();
    oscillator.type = shape.wave;
    oscillator.frequency.setValueAtTime(shape.startHz, now);
    oscillator.frequency.exponentialRampToValueAtTime(shape.endHz, now + shape.durationMs / 1_000);
    envelope.gain.setValueAtTime(0.0001, now);
    envelope.gain.linearRampToValueAtTime(shape.level, now + 0.012);
    envelope.gain.exponentialRampToValueAtTime(0.0001, now + shape.durationMs / 1_000);
    oscillator.connect(envelope);
    envelope.connect(this.master!);
    oscillator.start(now);
    oscillator.stop(now + shape.durationMs / 1_000 + 0.025);
    oscillator.onended = () => {
      oscillator.disconnect();
      envelope.disconnect();
    };
  }

  speakWord(word: string): void {
    if (!word || this.volume <= 0) return;
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    const key = word.toLowerCase();
    let audio = this.pronunciations.get(key);
    if (!audio) {
      audio = new Audio(`${import.meta.env.BASE_URL}assets/speech/${encodeURIComponent(key)}.wav`);
      audio.preload = 'auto';
      this.pronunciations.set(key, audio);
    }
    audio.pause();
    audio.volume = this.volume * 0.78;
    try { audio.currentTime = 0; } catch { /* Metadata has not loaded yet. */ }
    let fallbackStarted = false;
    const fallback = (): void => {
      if (fallbackStarted) return;
      fallbackStarted = true;
      this.speakWithBrowserSynthesis(word);
    };
    audio.onerror = fallback;
    void audio.play().catch(fallback);
  }

  private speakWithBrowserSynthesis(word: string): void {
    if (!word || this.volume <= 0 || !('speechSynthesis' in window)) return;
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = 'en-US';
    utterance.rate = 0.82;
    utterance.volume = Math.max(0, Math.min(1, this.volume * 0.78));
    window.speechSynthesis.speak(utterance);
  }

  destroy(): void {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    this.pronunciations.forEach((audio) => {
      audio.pause();
      audio.onerror = null;
    });
    this.pronunciations.clear();
    this.voices.forEach((voice) => {
      try { voice.stop(); } catch { /* Already stopped. */ }
      voice.disconnect();
    });
    this.voices.length = 0;
    this.buses.clear();
    const context = this.context;
    this.context = undefined;
    this.master = undefined;
    if (context && context.state !== 'closed') void context.close().catch(() => undefined);
  }

  private getContext(): AudioContext | undefined {
    if (this.context) return this.context;
    const audioWindow = window as Window & { webkitAudioContext?: typeof AudioContext };
    const AudioContextConstructor = window.AudioContext ?? audioWindow.webkitAudioContext;
    if (!AudioContextConstructor) return undefined;
    this.context = new AudioContextConstructor();
    this.master = this.context.createGain();
    this.master.gain.value = this.volume;
    this.master.connect(this.context.destination);
    return this.context;
  }

  private ensureMusic(): void {
    if (!this.context || this.buses.size > 0) return;
    for (const layer of Object.keys(MUSIC_CHORDS) as Array<keyof typeof MUSIC_CHORDS>) {
      const bus = this.context.createGain();
      bus.gain.value = 0;
      bus.connect(this.master!);
      this.buses.set(layer, bus);
      MUSIC_CHORDS[layer].forEach((frequency, index) => {
        const oscillator = this.context!.createOscillator();
        const voiceGain = this.context!.createGain();
        oscillator.type = index === 1 ? 'triangle' : 'sine';
        oscillator.frequency.value = frequency;
        voiceGain.gain.value = index === 1 ? 0.36 : 0.52;
        oscillator.connect(voiceGain);
        voiceGain.connect(bus);
        oscillator.start();
        this.voices.push(oscillator);
      });
    }
  }

  private applyMusicLayer(): void {
    if (!this.context) return;
    const now = this.context.currentTime;
    const target = this.musicLayer;
    const gain = target === 'fever' ? 0.035 : target === 'combo' ? 0.025 : target === 'normal' ? 0.016 : 0;
    this.buses.forEach((bus, layer) => {
      bus.gain.setTargetAtTime(layer === target ? gain : 0, now, 0.45);
    });
  }
}
