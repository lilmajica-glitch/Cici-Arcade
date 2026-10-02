import { FOCUS_SCORE } from './score'

export type AudioClock = { readonly currentTime: number; readonly state?: string }
export type StepPlayer = (step: number, time: number, bpm: number) => void

export class Sequencer {
  bpm: number = FOCUS_SCORE.bpm
  targetBpm: number = FOCUS_SCORE.bpm
  private step = 0
  private nextTime = 0
  private lastTick = 0
  private timer: ReturnType<typeof setInterval> | null = null
  private beats: { time: number; duration: number }[] = []

  constructor(private clock: AudioClock, private play: StepPlayer) {}

  get running() { return this.timer !== null }

  setTargetBpm(bpm: number) { if (Number.isFinite(bpm)) this.targetBpm = Math.max(96, Math.min(116, bpm)) }

  start(reset = true) {
    this.stop()
    if (reset) { this.step = 0; this.bpm = FOCUS_SCORE.bpm; this.targetBpm = FOCUS_SCORE.bpm }
    this.nextTime = this.clock.currentTime + 0.04
    this.lastTick = this.clock.currentTime
    this.tick()
    this.timer = setInterval(() => this.tick(), 25)
  }

  stop() {
    if (this.timer !== null) clearInterval(this.timer)
    this.timer = null
    this.beats = []
  }

  tick() {
    if (this.clock.state === 'suspended' || this.clock.state === 'closed') return
    const now = this.clock.currentTime
    const dt = Math.min(0.1, Math.max(0, now - this.lastTick))
    this.bpm += (this.targetBpm - this.bpm) * (1 - Math.exp(-dt / 1.1))
    this.lastTick = now
    const duration = 60 / this.bpm / 4
    if (this.nextTime < now - 0.15) {
      this.step += Math.ceil((now - this.nextTime) / duration)
      this.nextTime = now + 0.04
    }
    let scheduled = 0
    while (this.nextTime < now + 0.1 && scheduled < 12) {
      this.play(this.step, this.nextTime, this.bpm)
      if (this.step % 4 === 0) {
        this.beats.push({ time: this.nextTime, duration: duration * 4 })
        if (this.beats.length > 8) this.beats.shift()
      }
      this.nextTime += duration
      this.step++
      scheduled++
    }
  }

  pulse() {
    const now = this.clock.currentTime
    const beat = [...this.beats].reverse().find((item) => item.time <= now)
    return beat ? Math.exp(-(now - beat.time) * 11) : 0
  }
}
