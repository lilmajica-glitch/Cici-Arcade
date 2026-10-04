import { Sequencer } from './Sequencer'
import { Synth } from './Synth'
import { Mixer } from './Mixer'
import { musicProgression } from './progression'
import { arrangeStep, playMusicEvents } from './arrangement'
import { FOCUS_TRACK } from './tracks'
import type { MusicTrack } from './tracks'

export class MusicEngine {
  readonly sequencer: Sequencer
  private progression = musicProgression(0)
  private audibleStage = 1
  private track: MusicTrack = FOCUS_TRACK

  constructor(private context: BaseAudioContext, private synth: Synth, private mixer: Mixer) {
    this.sequencer = new Sequencer(context, (step, time, bpm) => {
      // Introduce layers on the next bar; answering never cuts across a phrase.
      if (step % 16 === 0) this.audibleStage = this.progression.stage
      playMusicEvents(this.synth, arrangeStep(step, time, bpm, this.audibleStage, this.track))
    })
  }

  start(reset = true, track: MusicTrack = this.track) {
    if (reset) { this.synth.stopMusic(); this.track = track; this.audibleStage = 1; this.setProgress(0, 20) }
    this.mixer.setMusicAudible(true)
    this.sequencer.start(reset, this.track.bpm)
  }
  stop() {
    this.sequencer.stop()
    this.mixer.setMusicAudible(false)
    this.synth.stopMusic(this.context.currentTime + 0.055)
  }
  setProgress(index: number, total: number) {
    this.progression = musicProgression(index, total, this.track)
    this.sequencer.setTargetBpm(this.progression.bpm)
  }
  accent() {
    const playNote = this.track.timbre === 'mallet' ? this.synth.mallet.bind(this.synth) : this.synth.keys.bind(this.synth)
    playNote(this.context.currentTime + 0.008, 67, 0.055, 0.22)
  }
}
