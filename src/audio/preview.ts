import { arrangeStep, playMusicEvents } from './arrangement'
import { Mixer } from './Mixer'
import { musicProgression } from './progression'
import { FOCUS_TRACK } from './tracks'
import type { MusicTrack } from './tracks'
import { Synth } from './Synth'

export const PREVIEW_SECONDS = 54
export const PREVIEW_INDICES = [0, 4, 8, 12, 15, 17] as const
export const PREVIEW_SECTION_SECONDS = 4 * 4 * 60 / FOCUS_TRACK.bpm

export function previewTiming(track: MusicTrack = FOCUS_TRACK) {
  const sectionSeconds = 4 * 4 * 60 / track.bpm
  return { sectionSeconds, seconds: Math.ceil(0.06 + sectionSeconds * 6 + 0.6) }
}

export async function renderPreview(sampleRate = 48000, track: MusicTrack = FOCUS_TRACK) {
  const { seconds } = previewTiming(track)
  const context = new OfflineAudioContext(2, seconds * sampleRate, sampleRate)
  const mixer = new Mixer(context)
  const synth = new Synth(context, mixer)
  const duration = 60 / track.bpm / 4
  try {
    for (let step = 0; step < 24 * 16; step++) {
      const stage = musicProgression(PREVIEW_INDICES[Math.floor(step / 64)]).stage
      playMusicEvents(synth, arrangeStep(step, 0.06 + step * duration, track.bpm, stage, track))
    }
    mixer.master.gain.setValueAtTime(0, 0)
    mixer.master.gain.linearRampToValueAtTime(0.65, 0.35)
    mixer.master.gain.setValueAtTime(0.65, seconds - 1.3)
    mixer.master.gain.linearRampToValueAtTime(0, seconds - 0.08)
    return await context.startRendering()
  } finally { synth.dispose(); mixer.dispose() }
}

/** PCM16 stereo WAV; directly downloadable, with no encoder or audio dependency. */
export function encodeWav(buffer: Pick<AudioBuffer, 'numberOfChannels' | 'length' | 'sampleRate' | 'getChannelData'>): ArrayBuffer {
  const channels = buffer.numberOfChannels
  const bytes = buffer.length * channels * 2
  const data = new ArrayBuffer(44 + bytes)
  const view = new DataView(data)
  const write = (offset: number, value: string) => [...value].forEach((letter, i) => view.setUint8(offset + i, letter.charCodeAt(0)))
  write(0, 'RIFF'); view.setUint32(4, 36 + bytes, true); write(8, 'WAVE')
  write(12, 'fmt '); view.setUint32(16, 16, true); view.setUint16(20, 1, true)
  view.setUint16(22, channels, true); view.setUint32(24, buffer.sampleRate, true)
  view.setUint32(28, buffer.sampleRate * channels * 2, true)
  view.setUint16(32, channels * 2, true); view.setUint16(34, 16, true)
  write(36, 'data'); view.setUint32(40, bytes, true)
  const samples = Array.from({ length: channels }, (_, channel) => buffer.getChannelData(channel))
  let offset = 44
  for (let frame = 0; frame < buffer.length; frame++) {
    for (const channel of samples) {
      const sample = Math.max(-1, Math.min(1, channel[frame]))
      view.setInt16(offset, Math.round(sample * (sample < 0 ? 0x8000 : 0x7fff)), true)
      offset += 2
    }
  }
  return data
}
