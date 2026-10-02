import { preferencesStore, usePreferences } from '../game/preferencesStore'

export function MusicVolume() {
  const volume = usePreferences((s) => s.musicVolume)
  return <label className="music-volume">音乐
    <input type="range" min="0" max="100" step="5" value={Math.round(volume * 100)} aria-label="背景音乐音量" aria-valuetext={volume === 0 ? '背景音乐关闭，保留答题音效' : `${Math.round(volume * 100)}%`} onChange={(event) => preferencesStore.setState({ musicVolume: Number(event.currentTarget.value) / 100 })} />
  </label>
}
