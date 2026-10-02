export type AudioBus = 'music' | 'sfx'

export class Mixer {
  readonly music: GainNode
  readonly sfx: GainNode
  readonly master: GainNode
  private duck: GainNode
  private compressor: DynamicsCompressorNode
  private limiter: DynamicsCompressorNode

  constructor(readonly context: BaseAudioContext) {
    this.music = context.createGain()
    this.sfx = context.createGain()
    this.master = context.createGain()
    this.duck = context.createGain()
    this.music.gain.value = 0.68
    this.sfx.gain.value = 0.8
    this.master.gain.value = 0.65
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

  setMuted(muted: boolean) {
    const time = this.context.currentTime
    this.master.gain.cancelScheduledValues(time)
    this.master.gain.setTargetAtTime(muted ? 0 : 0.65, time, 0.018)
  }

  setMusicAudible(audible: boolean) {
    const time = this.context.currentTime
    this.music.gain.cancelScheduledValues(time)
    this.music.gain.setTargetAtTime(audible ? 0.68 : 0, time, 0.025)
  }

  accent(time: number, depth = 0.7) {
    this.duck.gain.cancelScheduledValues(time)
    this.duck.gain.setValueAtTime(depth, time)
    this.duck.gain.setTargetAtTime(1, time + 0.025, 0.07)
  }

  dispose() {
    for (const node of [this.music, this.sfx, this.duck, this.master, this.compressor, this.limiter]) node.disconnect()
  }
}
