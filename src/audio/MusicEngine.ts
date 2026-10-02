import { Sequencer } from './Sequencer'
import { Synth } from './Synth'
import { Mixer } from './Mixer'
import { musicProgression } from './progression'
import { ARP_ORDER, CHORDS, LEAD_PHRASES } from './score'

export class MusicEngine {
  readonly sequencer: Sequencer
  private progression = musicProgression(0)
  private riserPlayed = false
  private riser: AudioBufferSourceNode | null = null

  constructor(private context: BaseAudioContext, private synth: Synth, private mixer: Mixer) {
    this.sequencer = new Sequencer(context, (step, time, bpm) => this.scheduleStep(step, time, bpm))
  }

  start(reset = true) {
    if (reset) { this.riserPlayed = false; this.setProgress(0, 20) }
    this.mixer.setMusicAudible(true)
    this.sequencer.start(reset)
  }
  stop() {
    this.sequencer.stop()
    this.mixer.setMusicAudible(false)
    if (this.riser) { try { this.riser.stop() } catch { /* already ended */ } this.riser = null }
  }
  setProgress(index: number, total: number) {
    this.progression = musicProgression(index, total)
    this.sequencer.setTargetBpm(this.progression.bpm)
    if (this.progression.finalQuestion && !this.riserPlayed) {
      this.riser = this.synth.riser(this.context.currentTime + 0.06)
      this.riserPlayed = true
    }
  }
  accent() { this.synth.pluck(this.context.currentTime + 0.008, 72, 'music', 0.095, 0.15) }

  private scheduleStep(step: number, time: number, bpm: number) {
    const local = step % 16
    const bar = Math.floor(step / 16) % 4
    const chord = CHORDS[bar]
    const duration = 60 / bpm / 4
    const stage = this.progression.stage
    if (local % 4 === 0) this.synth.kick(time)
    if (stage >= 2 && local % 2 === 0) this.synth.hat(time, local % 4 === 2)
    if (stage >= 3 && [0, 6, 8, 14].includes(local)) this.synth.bass(time, chord.bass + (local === 6 ? 12 : 0), duration * 1.7)
    if (stage >= 4) {
      if (local === 4 || local === 12) this.synth.snare(time)
      if (local === 0) this.synth.pad(time, chord.notes, duration * 14)
      if (local === 6 || local === 14) chord.notes.slice(0, 3).forEach((midi) => this.synth.pluck(time, midi, 'music', 0.042, 0.17))
    }
    if (stage >= 5 && local % 2 === 1) {
      const note = chord.notes[ARP_ORDER[Math.floor(local / 2)]] + 12
      this.synth.pluck(time, note, 'music', 0.055, duration * 0.8, local % 4 === 1 ? -0.22 : 0.22)
    }
    if (stage >= 6 && local % 2 === 0) {
      const midi = LEAD_PHRASES[bar][local / 2]
      if (midi !== null) this.synth.pluck(time, midi, 'music', 0.085, duration * 1.5)
    }
  }
}
