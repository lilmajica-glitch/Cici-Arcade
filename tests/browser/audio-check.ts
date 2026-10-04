import { Mixer } from '../../src/audio/Mixer'
import { Synth } from '../../src/audio/Synth'
import { SFX } from '../../src/audio/SFX'

const output = document.querySelector<HTMLPreElement>('#result')!
const button = document.querySelector<HTMLButtonElement>('#run')!

function metrics(buffer: AudioBuffer) {
  let peak = 0, sum = 0, tail = 0
  for (let c = 0; c < buffer.numberOfChannels; c++) {
    const channel = buffer.getChannelData(c)
    for (let i = 0; i < channel.length; i++) {
      const n = Math.abs(channel[i])
      peak = Math.max(peak, n)
      sum += n * n
      if (i > channel.length - buffer.sampleRate * 0.1) tail = Math.max(tail, n)
    }
  }
  return { peak: +peak.toFixed(5), rms: +Math.sqrt(sum / (buffer.length * buffer.numberOfChannels)).toFixed(5), tail: +tail.toFixed(6) }
}

button.addEventListener('click', async () => {
  button.disabled = true
  output.textContent = '检查中…'
  try {
    const checks: Record<string, ReturnType<typeof metrics>> = {}
    const voices: [string, (synth: Synth, sfx: SFX, mixer: Mixer) => void][] = [
      ['kick', (s) => s.kick(0.05)], ['hat', (s) => s.hat(0.05)], ['snare', (s) => s.snare(0.05)],
      ['bass', (s) => s.bass(0.05, 48)], ['number', (_, f) => f.number('1')],
      ['correct', (_, f) => f.correct(10)], ['wrong', (_, f) => f.wrong()],
      ['pluck', (s) => s.pluck(0.05, 72)], ['pad', (s) => s.pad(0.05, [60, 64, 67], 0.9)],
      ['mallet', (s) => s.mallet(0.05, 67)],
      ['sparkle', (s) => s.sparkle(0.05)], ['impact', (s) => s.impact(0.05)],
      ['riser', (s) => s.riser(0.05)], ['swoosh', (s) => s.swoosh(0.05)], ['victory', (_, f) => f.victory()],
      ['fullMix', (s, f) => {
        s.kick(0.05); s.snare(0.05); s.hat(0.05); s.bass(0.05, 48, 0.4)
        s.pad(0.05, [60, 64, 67, 69], 0.9)
        for (const note of [72, 76, 79]) s.pluck(0.05, note, 'music', 0.085)
        s.riser(0.05); f.number('9'); f.correct(20)
      }],
      ['muted', (s, _, m) => { m.setMuted(true); s.kick(0.35); s.pluck(0.35, 72, 'sfx', 0.24) }],
    ]
    for (const [name, play] of voices) {
      const context = new OfflineAudioContext(2, 48_000 * 2, 48_000)
      const mixer = new Mixer(context)
      const synth = new Synth(context, mixer)
      play(synth, new SFX(context, synth, mixer), mixer)
      checks[name] = metrics(await context.startRendering())
      synth.dispose()
      mixer.dispose()
    }
    const context = new OfflineAudioContext(2, 48_000 * 2, 48_000)
    const mixer = new Mixer(context)
    const synth = new Synth(context, mixer)
    let lifecycle
    try {
      synth.keys(0.05, 60, 0.07, 1.4)
      synth.mallet(1.3, 69, 0.07, 0.3)
      synth.pluck(0.8, 72, 'sfx', 0.2, 0.2)
      synth.stopMusic(0.3)
      const buffer = await context.startRendering()
      const peak = (from: number, to: number) => {
        let value = 0
        for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
          const data = buffer.getChannelData(channel)
          for (let sample = Math.floor(from * buffer.sampleRate); sample < Math.floor(to * buffer.sampleRate); sample++) value = Math.max(value, Math.abs(data[sample]))
        }
        return value
      }
      lifecycle = { oldMusicStopped: peak(0.6, 0.75) < 0.00001, futureNotesCancelled: peak(1.35, 1.55) < 0.00001, sfxPreserved: peak(0.8, 0.95) > 0.005 }
    } finally { synth.dispose(); mixer.dispose() }
    const pass = Object.values(lifecycle).every(Boolean) && Object.entries(checks).every(([name, check]) => name === 'muted'
      ? check.peak < 0.00001
      : check.rms > 0.00001 && check.peak < 0.95 && check.tail < 0.0001)
    output.textContent = JSON.stringify({ pass, sampleRate: 48000, checks, lifecycle }, null, 2)
  } catch (error) {
    output.textContent = `FAIL: ${String(error)}`
  } finally { button.disabled = false }
})
