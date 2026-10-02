import { Sequencer } from './Sequencer'
import { Synth } from './Synth'
import { Mixer } from './Mixer'
import { musicProgression } from './progression'
import { arrangeStep, playMusicEvents } from './arrangement'

export class MusicEngine {
  readonly sequencer: Sequencer
  private progression = musicProgression(0)
  private audibleStage = 1

  constructor(private context: BaseAudioContext, private synth: Synth, private mixer: Mixer) {
    this.sequencer = new Sequencer(context, (step, time, bpm) => {
      // Introduce layers on the next bar; answering never cuts across a phrase.
      if (step % 16 === 0) this.audibleStage = this.progression.stage
      playMusicEvents(this.synth, arrangeStep(step, time, bpm, this.audibleStage))
    })
  }

  start(reset = true) {
    if (reset) { this.audibleStage = 1; this.setProgress(0, 20) }
    this.mixer.setMusicAudible(true)
    this.sequencer.start(reset)
  }
  stop() {
    this.sequencer.stop()
    this.mixer.setMusicAudible(false)
  }
  setProgress(index: number, total: number) {
    this.progression = musicProgression(index, total)
    this.sequencer.setTargetBpm(this.progression.bpm)
  }
  accent() { this.synth.keys(this.context.currentTime + 0.008, 67, 0.055, 0.22) }
}
