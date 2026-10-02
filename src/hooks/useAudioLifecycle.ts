import { useEffect } from 'react'
import { audioEngine } from '../audio/AudioEngine'
import { preferencesStore } from '../game/preferencesStore'

export function useAudioLifecycle() {
  useEffect(() => {
    audioEngine.setMuted(preferencesStore.getState().muted)
    const unsubscribe = preferencesStore.subscribe((state, previous) => {
      if (state.muted !== previous.muted) audioEngine.setMuted(state.muted)
    })
    const onVisibility = () => {
      if (document.hidden) void audioEngine.suspend()
      else void audioEngine.resume().then((ready) => {
        if (!ready && preferencesStore.getState().audioStatus !== 'idle') preferencesStore.setState({ audioStatus: 'unavailable' })
      })
    }
    const onPageHide = () => { void audioEngine.suspend() }
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('pagehide', onPageHide)
    return () => {
      unsubscribe()
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('pagehide', onPageHide)
      audioEngine.stop()
    }
  }, [])
}
