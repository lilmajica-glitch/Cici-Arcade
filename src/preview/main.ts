import { encodeWav, previewTiming, renderPreview } from '../audio/preview'
import { FOCUS_TRACK, MUSIC_TRACKS } from '../audio/tracks'
import type { MusicTrack } from '../audio/tracks'
import './preview.css'

const play = document.querySelector<HTMLButtonElement>('#play')!
const stop = document.querySelector<HTMLButtonElement>('#stop')!
const status = document.querySelector<HTMLParagraphElement>('#status')!
const progress = document.querySelector<HTMLProgressElement>('#progress')!
const clock = document.querySelector<HTMLOutputElement>('#clock')!
const volume = document.querySelector<HTMLInputElement>('#volume')!
const volumeValue = document.querySelector<HTMLOutputElement>('#volume-value')!
const download = document.querySelector<HTMLAnchorElement>('#download')!
const sections = [...document.querySelectorAll<HTMLLIElement>('.sections li')]
const picker = document.querySelector<HTMLSelectElement>('#track')!
let track: MusicTrack = FOCUS_TRACK
let timing = previewTiming(track)
let context: AudioContext | null = null
let gain: GainNode | null = null
let source: AudioBufferSourceNode | null = null
const renders = new Map<string, Promise<AudioBuffer>>()
let downloadUrl: string | null = null
let started = 0
let frame = 0
let session = 0

const formatTime = (seconds: number) => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`

function clearDownload() {
  if (downloadUrl) URL.revokeObjectURL(downloadUrl)
  downloadUrl = null
  download.removeAttribute('href'); download.hidden = true
}

function showTrack() {
  timing = previewTiming(track)
  document.body.dataset.track = track.id
  document.title = `${track.title} · Cici 音乐试听`
  document.querySelector('#title')!.textContent = track.title
  document.querySelector('.intro')!.textContent = track.description
  document.querySelector('#tempo')!.textContent = `${track.bpm} BPM`
  document.querySelector('#duration')!.textContent = `${timing.seconds} 秒试听`
  document.querySelector('.record-label span')!.textContent = String(track.bpm)
  const cover = document.querySelector('.cover-title')!
  cover.replaceChildren(document.createTextNode(track.cover[0]), document.createElement('br'), document.createTextNode(track.cover[1]))
  document.querySelector('.cover-index')!.textContent = `0${MUSIC_TRACKS.indexOf(track) + 1} / CICI ORIGINAL`
  progress.max = timing.seconds; progress.value = 0
  clock.value = `0:00 / ${formatTime(timing.seconds)}`
  sections.forEach((item) => item.classList.remove('current'))
  download.download = `cici-${track.id}-${track.bpm}bpm.wav`
  clearDownload()
}

function update() {
  if (!context || !source) return
  const elapsed = Math.min(timing.seconds, Math.max(0, context.currentTime - started))
  progress.value = elapsed
  clock.value = `${formatTime(elapsed)} / ${formatTime(timing.seconds)}`
  const section = Math.min(5, Math.floor(Math.max(0, elapsed - 0.06) / timing.sectionSeconds))
  sections.forEach((item, i) => item.classList.toggle('current', i === section))
  frame = requestAnimationFrame(update)
}

function finish(message = '已停止。随时可以重新试听。') {
  session++
  if (source) {
    source.onended = null
    try { source.stop() } catch { /* playback has already ended */ }
    source.disconnect(); source = null
  }
  cancelAnimationFrame(frame)
  document.body.classList.remove('is-playing')
  play.disabled = false; stop.disabled = true
  play.textContent = '▶ 播放试听'; status.textContent = message
}

play.addEventListener('click', async () => {
  const current = ++session
  const selectedTrack = track
  play.disabled = true; stop.disabled = false
  play.textContent = '准备声音…'; status.textContent = '正在准备这段原创音乐…'
  try {
    // Create/resume synchronously from the button gesture, before offline rendering.
    if (!context) {
      const AudioClass = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!AudioClass) throw new Error('浏览器不支持 Web Audio')
      context = new AudioClass({ latencyHint: 'interactive' })
      gain = context.createGain(); gain.gain.value = Number(volume.value) / 100
      gain.connect(context.destination)
    }
    const resumed = context.state === 'suspended' ? context.resume() : Promise.resolve()
    if (!renders.has(selectedTrack.id)) renders.set(selectedTrack.id, renderPreview(48000, selectedTrack).catch((error: unknown) => { renders.delete(selectedTrack.id); throw error }))
    await resumed
    const buffer = await renders.get(selectedTrack.id)!
    if (current !== session) return
    if (!downloadUrl) {
      downloadUrl = URL.createObjectURL(new Blob([encodeWav(buffer)], { type: 'audio/wav' }))
      download.href = downloadUrl; download.hidden = false
    }
    source = context.createBufferSource(); source.buffer = buffer; source.connect(gain!)
    source.onended = () => { progress.value = timing.seconds; clock.value = `${formatTime(timing.seconds)} / ${formatTime(timing.seconds)}`; finish('试听结束。可以再听一遍，或回到游戏试试。') }
    started = context.currentTime + 0.025; source.start(started)
    play.textContent = '正在播放'; status.textContent = `正在试听《${selectedTrack.title}》 · 六段配器逐渐展开`
    document.body.classList.add('is-playing'); update()
  } catch (error) { if (current === session) finish(`声音暂时未能启动：${String(error)}。可以再次点击播放。`) }
})

stop.addEventListener('click', () => finish())
picker.addEventListener('change', () => {
  finish('已切换配乐，点击播放试听。')
  track = MUSIC_TRACKS.find((item) => item.id === picker.value) ?? FOCUS_TRACK
  showTrack()
})
volume.addEventListener('input', () => {
  volumeValue.value = `${volume.value}%`
  if (gain && context) gain.gain.setTargetAtTime(Number(volume.value) / 100, context.currentTime, 0.02)
})
document.addEventListener('visibilitychange', () => { if (document.hidden && !stop.disabled) finish('已暂停试听。回来后点击播放即可。') })
window.addEventListener('pagehide', () => {
  finish()
  clearDownload()
  renders.clear()
  gain?.disconnect(); gain = null
  void context?.close(); context = null
})
showTrack()
