import { arrangeStep, playMusicEvents } from '../../src/audio/arrangement'
import { Mixer } from '../../src/audio/Mixer'
import { encodeWav, renderPreview } from '../../src/audio/preview'
import { FOCUS_SCORE } from '../../src/audio/score'
import { SFX } from '../../src/audio/SFX'
import { Synth } from '../../src/audio/Synth'

const button = document.querySelector<HTMLButtonElement>('#run')!
const output = document.querySelector<HTMLPreElement>('#result')!
const download = document.querySelector<HTMLAnchorElement>('#download')!

function measure(buffer: AudioBuffer, from = 0, to = buffer.duration) {
  let peak = 0, square = 0, count = 0, finite = true
  for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
    const data = buffer.getChannelData(channel)
    for (let sample = Math.floor(from * buffer.sampleRate); sample < Math.min(data.length, Math.floor(to * buffer.sampleRate)); sample++) {
      finite &&= Number.isFinite(data[sample])
      peak = Math.max(peak, Math.abs(data[sample])); square += data[sample] ** 2; count++
    }
  }
  const rms = Math.sqrt(square / Math.max(1, count))
  return { peak: +peak.toFixed(6), rms: +rms.toFixed(6), dbfs: rms > 0 ? +(20 * Math.log10(rms)).toFixed(2) : null, finite }
}

async function render(stage: number, sampleRate = 48000, mode: 'normal' | 'stress' | 'muted' | 'musicOff' = 'normal') {
  const songSeconds = 8 * 4 * 60 / FOCUS_SCORE.bpm
  const context = new OfflineAudioContext(2, Math.ceil((songSeconds + 2) * sampleRate), sampleRate)
  const mixer = new Mixer(context)
  mixer.setMusicVolume(mode === 'musicOff' ? 0 : mode === 'stress' ? 1 : 0.75)
  if (mode === 'muted') mixer.setMuted(true)
  const synth = new Synth(context, mixer)
  const sfx = new SFX(context, synth, mixer)
  try {
    for (let step = 0; step < 128; step++) {
      const time = 0.1 + step * 60 / FOCUS_SCORE.bpm / 4
      playMusicEvents(synth, arrangeStep(step, time, FOCUS_SCORE.bpm, stage))
    }
    if (mode === 'stress') for (const time of [4, 8, 12]) {
      synth.impact(time, 0.21)
      for (const note of [72, 76, 79]) synth.pluck(time, note, 'sfx', 0.17)
      for (const note of [79, 72]) synth.pluck(time + 0.04, note, 'sfx', 0.24)
    }
    if (mode === 'musicOff') sfx.number('8')
    const buffer = await context.startRendering()
    const windows = [measure(buffer, 1, 3), measure(buffer, 8, 10), measure(buffer, 14, 16)]
    const tail = measure(buffer, buffer.duration - 0.1).peak
    const levels = windows.map((window) => window.dbfs ?? -120)
    const spreadDb = +(Math.max(...levels) - Math.min(...levels)).toFixed(2)
    const metrics = measure(buffer)
    const pass = metrics.finite && metrics.peak < 0.95 && tail < 0.0001 && (mode === 'muted'
      ? metrics.peak < 0.00001
      : mode === 'musicOff' ? metrics.rms > 0.00001 && windows.every((window) => window.peak < 0.00001)
      : windows.every((window) => window.rms > 0.005) && spreadDb < 7)
    return { pass, sampleRate, seconds: +buffer.duration.toFixed(3), ...metrics, spreadDb, tail, windows }
  } finally { synth.dispose(); mixer.dispose() }
}

button.addEventListener('click', async () => {
  button.disabled = true; output.textContent = '正在真实渲染六阶段配乐…'
  try {
    const checks: Record<string, Awaited<ReturnType<typeof render>>> = {}
    for (let stage = 1; stage <= 6; stage++) {
      checks[`stage${stage}`] = await render(stage)
      output.textContent = `已渲染 ${stage}/6 阶段，继续检查混音与静音…`
    }
    checks.stage6at44100 = await render(6, 44100)
    checks.denseFeedback = await render(6, 48000, 'stress')
    checks.muted = await render(6, 48000, 'muted')
    checks.musicOffKeepsSfx = await render(6, 48000, 'musicOff')
    const preview = await renderPreview()
    const fileUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result))
      reader.onerror = () => reject(reader.error)
      reader.readAsDataURL(new Blob([encodeWav(preview)], { type: 'audio/wav' }))
    })
    download.href = fileUrl; download.hidden = false
    const sectionRms = Array.from({ length: 6 }, (_, i) => measure(preview, i * 8.888889 + 1, i * 8.888889 + 5).rms)
    const previewResult = { ...measure(preview), seconds: preview.duration, sectionRms, tail: measure(preview, preview.duration - 0.04).peak }
    const pass = Object.values(checks).every((check) => check.pass) && previewResult.peak < 0.95 && sectionRms.every((rms) => rms > 0.005) && previewResult.tail < 0.0001
    output.textContent = JSON.stringify({ pass, bpm: FOCUS_SCORE.bpm, checks, preview: previewResult }, null, 2)
  } catch (error) { output.textContent = `FAIL: ${String(error)}` }
  finally { button.disabled = false }
})
