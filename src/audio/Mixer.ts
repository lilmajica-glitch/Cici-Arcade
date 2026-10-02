export type AudioBus = 'music' | 'sfx'

export class Mixer {
  readonly music: GainNode
  readonly sfx: GainNode
  readonly master: GainNode
  readonly room: GainNode
  private roomDelay: DelayNode
  private roomFilter: BiquadFilterNode
  private musicLevel = 0.62
  private musicAudible = true
  private duck: GainNode
  private compressor: DynamicsCompressorNode
  private limiter: DynamicsCompressorNode

  constructor(readonly context: BaseAudioContext) {
    this.music = context.createGain()
    this.sfx = context.createGain()
    this.master = context.createGain()
    this.duck = context.createGain()
    this.music.gain.value = this.musicLevel
    this.sfx.gain.value = 0.8
    this.master.gain.value = 0.65
    // One quiet, filtered reflection on keys only; percussion keeps its transients.
    this.room = context.createGain()
    this.room.gain.value = 0.13
    this.roomDelay = context.createDelay(0.3)
    this.roomDelay.delayTime.value = 0.115
    this.roomFilter = context.createBiquadFilter()
    this.roomFilter.type = 'lowpass'
    this.roomFilter.frequency.value = 1800
    this.room.connect(this.roomDelay)
    this.roomDelay.connect(this.roomFilter)
    this.roomFilter.connect(this.music)
    this.compressor = context.createDynamicsCompressor()
    Object.assign(this.compressor.threshold, { value: -15 })
    this.compressor.knee.value = 12
    this.compressor.ratio.value = 3
    this.compressor.attack.value = 0.004
    this.compressor.release.value = 0.16
    this.limiter = context.createDynamicsCompressor()
    this.limiter.threshold.value = -1.5
    this.limiter.knee.value = 0
    this.limiter.ratio.value = 20
    this.limiter.attack.value = 0.001
    this.limiter.release.value = 0.08
    this.music.connect(this.duck)
    this.duck.connect(this.master)
    this.sfx.connect(this.master)
    this.master.connect(this.compressor)
    this.compressor.connect(this.limiter)
    this.limiter.connect(context.destination)
  }

  bus(name: AudioBus): GainNode { return this[name] }

  setMuted(muted: boolean, immediate = false) {
    const time = this.context.currentTime
    const current = this.master.gain.value
    this.master.gain.cancelScheduledValues(time)
    this.master.gain.setValueAtTime(immediate ? (muted ? 0 : 0.65) : current, time)
    if (!immediate) this.master.gain.linearRampToValueAtTime(muted ? 0 : 0.65, time + 0.035)
  }

  setMusicAudible(audible: boolean) {
    this.musicAudible = audible
    const time = this.context.currentTime
    const current = this.music.gain.value
    this.music.gain.cancelScheduledValues(time)
    this.music.gain.setValueAtTime(current, time)
    this.music.gain.linearRampToValueAtTime(audible ? this.musicLevel : 0, time + 0.05)
  }

  setMusicVolume(level: number) {
    if (!Number.isFinite(level)) return
    this.musicLevel = Math.max(0, Math.min(1, level)) * 0.62
    this.setMusicAudible(this.musicAudible)
  }

  accent(time: number, depth = 0.7) {
    this.duck.gain.cancelScheduledValues(time)
    this.duck.gain.setValueAtTime(depth, time)
    this.duck.gain.setTargetAtTime(1, time + 0.025, 0.07)
  }

  dispose() {
    for (const node of [this.music, this.sfx, this.duck, this.master, this.compressor, this.limiter, this.room, this.roomDelay, this.roomFilter]) node.disconnect()
  }
}
