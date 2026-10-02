import { Synth } from './Synth'
import { Mixer } from './Mixer'

export const NUMBER_NOTES: Readonly<Record<string, number>> = {
  '1': 60, '2': 62, '3': 64, '4': 67, '5': 69,
  '6': 72, '7': 74, '8': 76, '9': 79, '0': 81,
}

export class SFX {
  constructor(private context: BaseAudioContext, private synth: Synth, private mixer: Mixer) {}

  number(digit: string) {
    const midi = NUMBER_NOTES[digit]
    if (midi !== undefined) this.synth.pluck(this.context.currentTime + 0.004, midi, 'sfx', 0.24, 0.24)
  }

  erase() {
    this.synth.tone(this.context.currentTime, { frequency: 420, slideTo: 290, duration: 0.1, volume: 0.08, bus: 'sfx' })
  }

  correct(combo: number) {
    const time = this.context.currentTime + 0.004
    this.mixer.accent(time)
    this.synth.impact(time, 0.14 + Math.min(combo, 10) * 0.007)
    for (const [i, midi] of [72, 76, 79].entries()) {
      this.synth.pluck(time + i * 0.045, midi, 'sfx', 0.14 + Math.min(combo, 10) * 0.003, 0.34, i === 1 ? -0.15 : 0.15)
    }
  }

  wrong() {
    this.synth.tone(this.context.currentTime + 0.004, { frequency: 195, slideTo: 148, duration: 0.2, volume: 0.12, bus: 'sfx', cutoff: 750 })
  }

  start() {
    [60, 64, 67, 72].forEach((midi, i) => this.synth.pluck(this.context.currentTime + i * 0.07, midi, 'sfx', 0.14))
  }

  dispense() { this.synth.swoosh(this.context.currentTime + 0.008) }
  victory() {
    const time = this.context.currentTime + 0.01
    this.synth.impact(time, 0.32)
    this.synth.pad(time + 0.04, [60, 64, 67, 72], 1.2, 'sfx')
    ;[67, 72, 76, 79, 84].forEach((midi, i) => this.synth.pluck(time + 0.08 + i * 0.09, midi, 'sfx', 0.17, i === 4 ? 0.65 : 0.35))
    this.synth.sparkle(time + 0.35)
  }
}
