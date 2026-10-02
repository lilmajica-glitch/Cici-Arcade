import { Mixer } from './Mixer'
import { Synth } from './Synth'
import { MusicEngine } from './MusicEngine'
import { SFX } from './SFX'

export class AudioEngine {
  private context: AudioContext | null = null
  private mixer: Mixer | null = null
  private synth: Synth | null = null
  private music: MusicEngine | null = null
  private effects: SFX | null = null
  private muted = false
  private musicVolume = 0.75
  private shouldPlay = false

  /** This method is invoked synchronously in the start-button gesture. */
  async initialize(): Promise<boolean> {
    try {
      if (!this.context) {
        const AudioContextClass = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
        if (!AudioContextClass) return false
        this.context = new AudioContextClass({ latencyHint: 'interactive' })
        this.mixer = new Mixer(this.context)
        this.synth = new Synth(this.context, this.mixer)
        this.music = new MusicEngine(this.context, this.synth, this.mixer)
        this.effects = new SFX(this.context, this.synth, this.mixer)
        this.mixer.setMuted(this.muted, true)
        this.mixer.setMusicVolume(this.musicVolume)
      }
      if (this.context.state === 'suspended') await this.context.resume()
      return this.context.state === 'running'
    } catch { return false }
  }

  setMuted(muted: boolean) { this.muted = muted; this.mixer?.setMuted(muted) }
  setMusicVolume(level: number) { if (Number.isFinite(level)) { this.musicVolume = Math.max(0, Math.min(1, level)); this.mixer?.setMusicVolume(this.musicVolume) } }
  start() { this.shouldPlay = true; this.music?.start(); this.effects?.start() }
  stop() { this.shouldPlay = false; this.music?.stop() }
  progress(index: number, total: number) { this.music?.setProgress(index, total) }
  number(digit: string) { this.effects?.number(digit) }
  erase() { this.effects?.erase() }
  correct(combo: number) { this.effects?.correct(combo); this.music?.accent() }
  wrong() { this.effects?.wrong() }
  dispense() { this.effects?.dispense() }
  victory() { this.stop(); this.effects?.victory() }
  pulse() { return this.music?.sequencer.pulse() ?? 0 }

  async suspend() {
    this.music?.stop()
    try { if (this.context?.state === 'running') await this.context.suspend() } catch { /* best effort background pause */ }
  }

  async resume(): Promise<boolean> {
    if (!this.context) return false
    try {
      if (this.context.state === 'suspended') await this.context.resume()
      if (this.shouldPlay && this.context.state === 'running') this.music?.start(false)
      return this.context.state === 'running'
    } catch { return false }
  }

  async dispose() {
    this.stop()
    this.synth?.dispose()
    this.mixer?.dispose()
    try { await this.context?.close() } catch { /* already closed */ }
    this.context = null
    this.music = null
    this.synth = null
    this.mixer = null
    this.effects = null
  }
}

export const audioEngine = new AudioEngine()
if (import.meta.hot) import.meta.hot.dispose(() => { void audioEngine.dispose() })
