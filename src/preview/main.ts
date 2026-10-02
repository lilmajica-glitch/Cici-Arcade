import { encodeWav, PREVIEW_SECTION_SECONDS, PREVIEW_SECONDS, renderPreview } from '../audio/preview'
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
let context: AudioContext | null = null
let gain: GainNode | null = null
let source: AudioBufferSourceNode | null = null
let rendered: Promise<AudioBuffer> | null = null
let downloadReady = false
let started = 0
let frame = 0
let session = 0

function wavUrl(buffer: AudioBuffer): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(new Blob([encodeWav(buffer)], { type: 'audio/wav' }))
  })
}

function update() {
  if (!context || !source) return
  const elapsed = Math.min(PREVIEW_SECONDS, Math.max(0, context.currentTime - started))
  progress.value = elapsed
  clock.value = `0:${String(Math.floor(elapsed)).padStart(2, '0')} / 0:54`
  const section = Math.min(5, Math.floor(elapsed / PREVIEW_SECTION_SECONDS))
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
    rendered ??= renderPreview().catch((error: unknown) => { rendered = null; throw error })
    const buffer = await rendered
    if (current !== session) return
    if (!downloadReady) {
      const url = await wavUrl(buffer)
      if (current !== session) return
      download.href = url; download.hidden = false; downloadReady = true
    }
    await resumed
    if (current !== session) return
    source = context.createBufferSource(); source.buffer = buffer; source.connect(gain!)
    source.onended = () => { progress.value = PREVIEW_SECONDS; clock.value = '0:54 / 0:54'; finish('试听结束。可以再听一遍，或回到游戏试试。') }
    started = context.currentTime + 0.025; source.start(started)
    play.textContent = '正在播放'; status.textContent = '正在试听 · 六段配器逐渐展开'
    document.body.classList.add('is-playing'); update()
  } catch (error) { if (current === session) finish(`声音暂时未能启动：${String(error)}。可以再次点击播放。`) }
})

stop.addEventListener('click', () => finish())
volume.addEventListener('input', () => {
  volumeValue.value = `${volume.value}%`
  if (gain && context) gain.gain.setTargetAtTime(Number(volume.value) / 100, context.currentTime, 0.02)
})
document.addEventListener('visibilitychange', () => { if (document.hidden && !stop.disabled) finish('已暂停试听。回来后点击播放即可。') })
window.addEventListener('pagehide', () => {
  finish()
  download.removeAttribute('href'); download.hidden = true; downloadReady = false
  gain?.disconnect(); gain = null
  void context?.close(); context = null
})
