import { Mixer } from './Mixer'
import type { AudioBus } from './Mixer'
import { FOCUS_SCORE } from './score'

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
  slideDuration?: number
  pan?: number
  detune?: number
  body?: number
}

export function seededNoise(seed: number) {
  let state = seed >>> 0
  return () => { state = (Math.imul(state, 1664525) + 1013904223) >>> 0; return state / 0x1_0000_0000 * 2 - 1 }
}

export class Synth {
  private noiseBuffer: AudioBuffer
  private sources = new Set<AudioScheduledSourceNode>()
  private musicSources = new Set<AudioScheduledSourceNode>()

  constructor(readonly context: BaseAudioContext, private mixer: Mixer) {
    this.noiseBuffer = context.createBuffer(1, Math.floor(context.sampleRate * 0.5), context.sampleRate)
    const data = this.noiseBuffer.getChannelData(0)
    const random = seededNoise(FOCUS_SCORE.seed)
    for (let i = 0; i < data.length; i++) data[i] = random()
  }

  get activeVoices() { return this.sources.size }

  tone(time: number, options: Tone) {
    const t = Math.max(time, this.context.currentTime)
    const source = this.context.createOscillator()
    source.type = options.type ?? 'sine'
    source.detune.value = options.detune ?? 0
    source.frequency.setValueAtTime(options.frequency, t)
    if (options.slideTo) source.frequency.exponentialRampToValueAtTime(options.slideTo, t + (options.slideDuration ?? options.duration * 0.7))
    const filter = this.context.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = options.cutoff ?? 7500
    filter.Q.value = 0.5
    const gain = this.envelope(t, options.duration, options.volume, options.attack ?? 0.006, options.body)
    const panner = this.context.createStereoPanner()
    panner.pan.value = options.pan ?? 0
    source.connect(filter)
    filter.connect(gain)
    gain.connect(panner)
    panner.connect(this.mixer.bus(options.bus))
    this.track(source, [filter, gain, panner], options.bus)
    source.start(t)
    source.stop(t + options.duration + 0.035)
  }

  private envelope(time: number, duration: number, volume: number, attack: number, body?: number) {
    const gain = this.context.createGain()
    gain.gain.setValueAtTime(0.0001, time)
    gain.gain.linearRampToValueAtTime(Math.max(0.0001, volume), time + attack)
    if (body) gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, volume * body), time + Math.max(attack + 0.01, duration * 0.7))
    gain.gain.exponentialRampToValueAtTime(0.0001, time + Math.max(duration, attack + 0.015))
    return gain
  }

  private noise(time: number, duration: number, volume: number, frequency: number, type: BiquadFilterType, bus: AudioBus, sweepTo?: number, attack = 0.003, pan = 0) {
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
    const panner = this.context.createStereoPanner()
    panner.pan.value = pan
    gain.connect(panner)
    panner.connect(this.mixer.bus(bus))
    this.track(source, [filter, gain, panner], bus)
    // Rotate through a seeded buffer without changing the rendered score between runs.
    source.start(t, (t * 0.137) % 0.4)
    source.stop(t + duration + 0.035)
    return source
  }

  private track(source: AudioScheduledSourceNode, nodes: AudioNode[], bus: AudioBus) {
    // Offline scheduling queues future events before time advances. The live cap
    // must not truncate that queue; the offline render has a bounded duration.
    const offline = typeof OfflineAudioContext !== 'undefined' && this.context instanceof OfflineAudioContext
    if (!offline && this.sources.size >= MAX_VOICES) {
      const oldest = this.sources.values().next().value
      if (oldest) { try { oldest.stop() } catch { /* already ended */ } this.sources.delete(oldest); this.musicSources.delete(oldest) }
    }
    this.sources.add(source)
    if (bus === 'music') this.musicSources.add(source)
    source.onended = () => {
      source.disconnect()
      nodes.forEach((node) => node.disconnect())
      this.sources.delete(source)
      this.musicSources.delete(source)
      source.onended = null
    }
  }

  kick(time: number, volume = 0.62) {
    this.tone(time, { frequency: 156, slideTo: 48, slideDuration: 0.045, duration: 0.27, volume, attack: 0.003, body: 0.04, bus: 'music', cutoff: 1200 })
    this.tone(time, { frequency: 760, slideTo: 145, duration: 0.022, volume: volume * 0.075, bus: 'music', cutoff: 1300 })
  }

  snare(time: number, velocity = 1) {
    this.noise(time, 0.125, 0.17 * velocity, 1650, 'bandpass', 'music', undefined, 0.004, 0.06)
    this.noise(time + 0.013, 0.065, 0.06 * velocity, 2300, 'bandpass', 'music')
    this.tone(time, { frequency: 184, type: 'triangle', slideTo: 125, duration: 0.095, volume: 0.08 * velocity, bus: 'music', cutoff: 1200 })
  }

  hat(time: number, offbeat = false, velocity = 1, pan = -0.12) {
    this.noise(time, offbeat ? 0.085 : 0.042, (offbeat ? 0.043 : 0.038) * velocity, 5100, 'bandpass', 'music', undefined, 0.003, pan)
  }

  bass(time: number, midi: number, duration = 0.24, velocity = 1) {
    this.tone(time, { frequency: midiHz(midi), type: 'triangle', duration, attack: 0.012, body: 0.16, volume: 0.25 * velocity, bus: 'music', cutoff: 650 })
    // An audible second harmonic carries the groove on small phone/tablet speakers.
    this.tone(time, { frequency: midiHz(midi + 12), duration: duration * 0.8, volume: 0.085 * velocity, bus: 'music', cutoff: 700 })
  }

  keys(time: number, midi: number, volume = 0.07, duration = 0.6, pan = 0) {
    const t = Math.max(time, this.context.currentTime)
    const frequency = midiHz(midi)
    const carrier = this.context.createOscillator()
    const modulator = this.context.createOscillator()
    const modulation = this.envelope(t, duration * 0.5, frequency * 0.8, 0.008)
    carrier.frequency.value = frequency
    modulator.frequency.value = frequency * 2
    modulator.connect(modulation)
    modulation.connect(carrier.frequency)
    const filter = this.context.createBiquadFilter()
    filter.type = 'lowpass'; filter.frequency.value = 2800; filter.Q.value = 0.4
    const gain = this.envelope(t, duration, volume, 0.008, 0.12)
    const panner = this.context.createStereoPanner()
    panner.pan.value = pan
    carrier.connect(filter); filter.connect(gain); gain.connect(panner)
    panner.connect(this.mixer.bus('music'))
    panner.connect(this.mixer.room)
    this.track(carrier, [filter, gain, panner], 'music')
    this.track(modulator, [modulation], 'music')
    carrier.start(t); modulator.start(t)
    carrier.stop(t + duration + 0.035); modulator.stop(t + duration + 0.035)
  }

  percussion(time: number, velocity = 1, pan = 0.2) {
    this.noise(time, 0.045, 0.024 * velocity, 3100, 'bandpass', 'music', undefined, 0.005, pan)
    this.tone(time, { frequency: 940, slideTo: 760, duration: 0.03, volume: 0.017 * velocity, bus: 'music', cutoff: 1700, pan })
  }

  pluck(time: number, midi: number, bus: AudioBus = 'music', volume = 0.12, duration = 0.3, pan = 0) {
    this.tone(time, { frequency: midiHz(midi), type: 'triangle', duration, volume, bus, cutoff: 3600, pan })
    this.tone(time, { frequency: midiHz(midi + 12), duration: duration * 0.55, volume: volume * 0.22, bus, pan })
  }

  /** Rounded wooden mallet: quiet third partial, no octave-up bell shimmer. */
  mallet(time: number, midi: number, volume = 0.07, duration = 0.6, pan = 0) {
    const frequency = midiHz(midi)
    this.tone(time, { frequency, duration, volume, attack: 0.01, body: 0.18, bus: 'music', cutoff: 2200, pan })
    this.tone(time, { frequency: frequency * 3, duration: duration * 0.36, volume: volume * 0.16, attack: 0.008, bus: 'music', cutoff: 2200, pan })
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

  stopMusic(time = this.context.currentTime) {
    for (const source of this.musicSources) { try { source.stop(time) } catch { /* already stopped */ } }
  }

  dispose() {
    for (const source of this.sources) { try { source.stop() } catch { /* already stopped */ } }
    this.sources.clear()
    this.musicSources.clear()
  }
}
