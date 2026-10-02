import { Mixer } from './Mixer'
import type { AudioBus } from './Mixer'

export const midiHz = (midi: number) => 440 * 2 ** ((midi - 69) / 12)
export const MAX_VOICES = 96

type Tone = {
  frequency: number
  duration: number
  volume: number
  bus: AudioBus
  type?: OscillatorType
  attack?: number
  cutoff?: number
  slideTo?: number
  pan?: number
  detune?: number
}

export class Synth {
  private noiseBuffer: AudioBuffer
  private sources = new Set<AudioScheduledSourceNode>()

  constructor(readonly context: BaseAudioContext, private mixer: Mixer) {
    this.noiseBuffer = context.createBuffer(1, Math.floor(context.sampleRate * 0.5), context.sampleRate)
    const data = this.noiseBuffer.getChannelData(0)
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
  }

  get activeVoices() { return this.sources.size }

  tone(time: number, options: Tone) {
    const t = Math.max(time, this.context.currentTime)
    const source = this.context.createOscillator()
    source.type = options.type ?? 'sine'
    source.detune.value = options.detune ?? 0
    source.frequency.setValueAtTime(options.frequency, t)
    if (options.slideTo) source.frequency.exponentialRampToValueAtTime(options.slideTo, t + options.duration * 0.7)
    const filter = this.context.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = options.cutoff ?? 7500
    filter.Q.value = 0.5
    const gain = this.envelope(t, options.duration, options.volume, options.attack ?? 0.006)
    const panner = this.context.createStereoPanner()
    panner.pan.value = options.pan ?? 0
    source.connect(filter)
    filter.connect(gain)
    gain.connect(panner)
    panner.connect(this.mixer.bus(options.bus))
    this.track(source, [filter, gain, panner])
    source.start(t)
    source.stop(t + options.duration + 0.035)
  }

  private envelope(time: number, duration: number, volume: number, attack: number) {
    const gain = this.context.createGain()
    gain.gain.setValueAtTime(0.0001, time)
    gain.gain.linearRampToValueAtTime(Math.max(0.0001, volume), time + attack)
    gain.gain.exponentialRampToValueAtTime(0.0001, time + Math.max(duration, attack + 0.015))
    return gain
  }

  private noise(time: number, duration: number, volume: number, frequency: number, type: BiquadFilterType, bus: AudioBus, sweepTo?: number, attack = 0.003) {
    const t = Math.max(time, this.context.currentTime)
    const source = this.context.createBufferSource()
    source.buffer = this.noiseBuffer
    source.loop = true
    const filter = this.context.createBiquadFilter()
    filter.type = type
    filter.Q.value = 0.7
    filter.frequency.setValueAtTime(frequency, t)
    if (sweepTo) filter.frequency.exponentialRampToValueAtTime(sweepTo, t + duration)
    const gain = this.envelope(t, duration, volume, attack)
    source.connect(filter)
    filter.connect(gain)
    gain.connect(this.mixer.bus(bus))
    this.track(source, [filter, gain])
    source.start(t)
    source.stop(t + duration + 0.035)
    return source
  }

  private track(source: AudioScheduledSourceNode, nodes: AudioNode[]) {
    if (this.sources.size >= MAX_VOICES) {
      const oldest = this.sources.values().next().value
      if (oldest) { try { oldest.stop() } catch { /* already ended */ } this.sources.delete(oldest) }
    }
    this.sources.add(source)
    source.onended = () => {
      source.disconnect()
      nodes.forEach((node) => node.disconnect())
      this.sources.delete(source)
      source.onended = null
    }
  }

  kick(time: number, volume = 0.52) {
    this.tone(time, { frequency: 148, slideTo: 43, duration: 0.29, volume, bus: 'music', cutoff: 1800 })
  }

  snare(time: number) {
    this.noise(time, 0.14, 0.15, 1850, 'bandpass', 'music')
    this.tone(time, { frequency: 176, type: 'triangle', slideTo: 110, duration: 0.08, volume: 0.055, bus: 'music', cutoff: 1400 })
  }

  hat(time: number, offbeat = false) {
    this.noise(time, offbeat ? 0.055 : 0.038, offbeat ? 0.044 : 0.028, 6500, 'highpass', 'music')
  }

  bass(time: number, midi: number, duration = 0.24) {
    this.tone(time, { frequency: midiHz(midi), type: 'triangle', duration, volume: 0.22, bus: 'music', cutoff: 600 })
    this.tone(time, { frequency: midiHz(midi) / 2, duration, volume: 0.085, bus: 'music', cutoff: 400 })
  }

  pluck(time: number, midi: number, bus: AudioBus = 'music', volume = 0.12, duration = 0.3, pan = 0) {
    this.tone(time, { frequency: midiHz(midi), type: 'triangle', duration, volume, bus, cutoff: 3600, pan })
    this.tone(time, { frequency: midiHz(midi + 12), duration: duration * 0.55, volume: volume * 0.22, bus, pan })
  }

  pad(time: number, notes: readonly number[], duration: number, bus: AudioBus = 'music') {
    for (const midi of notes) {
      for (const detune of [-5, 5]) this.tone(time, {
        frequency: midiHz(midi), type: 'triangle', duration, attack: 0.18,
        cutoff: 1500, volume: 0.025, bus, detune,
      })
    }
  }

  sparkle(time: number) {
    for (const [i, midi] of [79, 84, 88, 91].entries()) {
      this.pluck(time + i * 0.045, midi, 'sfx', 0.105, 0.45, i % 2 ? 0.3 : -0.3)
    }
  }

  impact(time: number, volume = 0.23) {
    this.tone(time, { frequency: 142, slideTo: 61, duration: 0.22, volume, bus: 'sfx', cutoff: 900 })
    this.noise(time, 0.11, volume * 0.3, 760, 'bandpass', 'sfx')
  }

  riser(time: number, duration = 1.2) {
    return this.noise(time, duration, 0.065, 350, 'bandpass', 'sfx', 3600, duration * 0.7)
  }

  swoosh(time: number) {
    this.noise(time, 0.19, 0.043, 470, 'bandpass', 'sfx', 2200, 0.07)
  }

  dispose() {
    for (const source of this.sources) { try { source.stop() } catch { /* already stopped */ } }
    this.sources.clear()
  }
}
