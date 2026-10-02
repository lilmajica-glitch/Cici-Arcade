import { createStore } from 'zustand/vanilla'
import { useStore } from 'zustand'

type Preferences = {
  muted: boolean
  musicVolume: number
  reducedMotion: boolean
  audioStatus: 'idle' | 'ready' | 'unavailable'
}

export const preferencesStore = createStore<Preferences>()(() => ({
  muted: false,
  musicVolume: 0.75,
  reducedMotion: typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches,
  audioStatus: 'idle',
}))
export const usePreferences = <T,>(selector: (state: Preferences) => T): T => useStore(preferencesStore, selector)
