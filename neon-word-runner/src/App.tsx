import { useCallback, useEffect, useState } from 'react';
import { EventBus } from './game/EventBus';
import { PhaserGame } from './game/PhaserGame';
import { DEFAULT_RUN_OPTIONS, type RunOptions, type RunResult } from './types/game';

type Screen = 'home' | 'playing' | 'settings' | 'results';
const OPTIONS_KEY = 'neon-word-runner:options';
const ACTION_DEBUG = import.meta.env.DEV
  && new URLSearchParams(window.location.search).get('debug') === 'actions';

function loadOptions(): RunOptions {
  try {
    const stored = window.localStorage.getItem(OPTIONS_KEY);
    if (!stored) return { ...DEFAULT_RUN_OPTIONS };
    const parsed = JSON.parse(stored) as Partial<RunOptions>;
    return {
      questionDirection: parsed.questionDirection === 'en-zh' ? 'en-zh' : 'zh-en',
      soundVolume: Number.isFinite(parsed.soundVolume)
        ? Math.max(0, Math.min(1, parsed.soundVolume as number))
        : DEFAULT_RUN_OPTIONS.soundVolume,
      reducedMotion: parsed.reducedMotion === true,
    };
  } catch {
    return { ...DEFAULT_RUN_OPTIONS };
  }
}

function saveOptions(options: RunOptions): void {
  try {
    window.localStorage.setItem(OPTIONS_KEY, JSON.stringify(options));
  } catch {
    // Settings remain available in memory when storage is disabled.
  }
}

function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [ready, setReady] = useState(false);
  const [options, setOptions] = useState<RunOptions>(loadOptions);
  const [result, setResult] = useState<RunResult | null>(null);

  const handleReady = useCallback(() => setReady(true), []);

  useEffect(() => EventBus.on('game:end', (runResult) => {
    setResult(runResult);
    setScreen('results');
  }), []);

  const startRun = () => {
    setResult(null);
    setScreen('playing');
    EventBus.emit('game:start', options);
  };

  const updateOptions = (next: RunOptions) => {
    setOptions(next);
    saveOptions(next);
    EventBus.emit('settings:change', next);
  };

  return (
    <main className="game-shell">
      <PhaserGame onReady={handleReady} />

      {screen === 'home' && (
        <section className="screen screen-home" aria-labelledby="game-title">
          <div className="home-copy">
            <p className="eyebrow">NEON DREAM CITY · ENGLISH PARKOUR</p>
            <h1 id="game-title">NEON <span>WORD</span> RUNNER</h1>
            <p className="tagline">RUN FAST. THINK FASTER.</p>
            <div className="home-actions">
              <button className="button button-primary" disabled={!ready} onClick={startRun}>
                {ready ? 'START RUN' : 'LOADING CITY…'}
              </button>
              <button className="button button-quiet" onClick={() => setScreen('settings')}>
                SETTINGS
              </button>
            </div>
            <p className="controls-note">A / S / D · ← / ↓ / → · 1 / 2 / 3</p>
          </div>
          <div className="corner-mark" aria-hidden="true"><span>NW</span><i /></div>
        </section>
      )}

      {screen === 'playing' && (
        ACTION_DEBUG && (
          <div className="play-overlay" aria-live="polite">
            <span className="run-status"><i /> ACTION TEST · DEV</span>
            <span className="run-hint">V VAULT · S SLIDE · J JUMP · H STUMBLE</span>
          </div>
        )
      )}

      {screen === 'settings' && (
        <section className="screen screen-modal" aria-labelledby="settings-title">
          <div className="settings-panel">
            <p className="eyebrow">TUNE YOUR RUN</p>
            <h2 id="settings-title">SETTINGS</h2>
            <label className="setting-row">
              <span>Question direction</span>
              <select
                value={options.questionDirection}
                onChange={(event) => updateOptions({ ...options, questionDirection: event.target.value as RunOptions['questionDirection'] })}
              >
                <option value="zh-en">Chinese → English</option>
                <option value="en-zh">English → Chinese</option>
              </select>
            </label>
            <label className="setting-row setting-slider">
              <span>Sound volume <b>{Math.round(options.soundVolume * 100)}%</b></span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={options.soundVolume}
                onChange={(event) => updateOptions({ ...options, soundVolume: Number(event.target.value) })}
              />
            </label>
            <label className="setting-row setting-check">
              <span>Reduce motion</span>
              <input
                type="checkbox"
                checked={options.reducedMotion}
                onChange={(event) => updateOptions({ ...options, reducedMotion: event.target.checked })}
              />
            </label>
            <button className="button button-primary" onClick={() => setScreen('home')}>DONE</button>
          </div>
        </section>
      )}

      {screen === 'results' && result && (
        <section className="screen screen-modal" aria-labelledby="finish-title">
          <div className="settings-panel results-panel">
            <p className="eyebrow">ROUTE COMPLETE</p>
            <h2 id="finish-title">FINISH</h2>
            <div className="result-score"><span>SCORE</span><strong>{result.score.toLocaleString()}</strong></div>
            <div className="result-grid">
              <span>Accuracy <b>{result.accuracy}%</b></span>
              <span>Correct <b>{result.correct}</b></span>
              <span>Wrong <b>{result.wrong}</b></span>
              <span>Max Combo <b>{result.maxCombo}</b></span>
              <span>Words Reviewed <b>{result.wordsReviewed}</b></span>
              <span>Time <b>{Math.round(result.durationMs / 1000)}s</b></span>
            </div>
            <div className="home-actions">
              <button className="button button-primary" onClick={startRun}>RESTART</button>
              <button className="button button-quiet" onClick={() => setScreen('home')}>BACK TO MENU</button>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}

export default App;
