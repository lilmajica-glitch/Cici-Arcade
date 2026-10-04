import { useEffect, useLayoutEffect, useRef } from 'react'
import type { CSSProperties, RefObject } from 'react'
import {
  ArrowRight, Backspace, Bell, Disc, Flask, Guitar, Leaf, Lightning,
  Lightbulb, MusicNotes, PianoKeys, SpeakerHigh, SpeakerSlash, Star, Waveform,
} from '@phosphor-icons/react'
import { gameController } from '../game/GameController'
import { gameActions, useGameStore } from '../game/gameStore'
import { accuracyForGame } from '../game/GameEngine'
import { preferencesStore, usePreferences } from '../game/preferencesStore'
import { musicProgression } from '../audio/progression'
import { useMusicPulse } from '../hooks/useMusicPulse'
import { readStats } from '../utils/persistence'
import type { Question } from '../math/types'
import { MusicVolume } from './MusicVolume'

const asset = (name: string) => `/assets/festival/${name}.png`
const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0']
const instruments = [Disc, Bell, Waveform, MusicNotes, Guitar, PianoKeys]
const instrumentNames = ['鼓点', '铃声', '和声', '打击乐', '琶音', '主旋律']

function hintFor(question: Question) {
  const { left, right, operator } = question
  if (operator === '+') {
    const big = Math.max(left, right)
    const small = Math.min(left, right)
    const toTen = 10 - big
    if (big < 10 && small > toTen) return `先凑十：${big} + ${toTen}，再加 ${small - toTen}。`
    return `从 ${big} 开始，再往前数 ${small} 个。`
  }
  return `从 ${left} 开始，往回数 ${right} 个。`
}

function FestivalHeader() {
  const state = useGameStore((s) => s)
  const muted = usePreferences((s) => s.muted)
  const reduced = usePreferences((s) => s.reducedMotion)
  const displayedIndex = state.status === 'victory' ? 20 : Math.min(20, state.questionIndex + (state.phase === 'correct' ? 0 : 1))
  return <header className="festival-header">
    <a className="festival-wordmark" href="#" aria-label="Cici 小博士，回到首页" onClick={(event) => { event.preventDefault(); gameController.menu() }}>
      <span className="brand-flask"><Flask size={30} weight="duotone" /></span>
      <b>cici</b><strong>小博士</strong>
    </a>
    <div className="festival-progress" role="progressbar" aria-label="答题进度" aria-valuemin={0} aria-valuemax={20} aria-valuenow={state.questionIndex}>
      <span className="progress-caption">{state.status === 'menu' ? '20 道题，一场大冒险' : state.status === 'victory' ? '20 / 20 · 挑战完成' : `第 ${displayedIndex} / 20 题`}</span>
      <div className="progress-dots" aria-hidden="true">{Array.from({ length: 20 }, (_, i) => <i key={i} className={i < state.questionIndex ? 'done' : i === state.questionIndex ? 'current' : ''} />)}</div>
    </div>
    <div className="festival-preferences">
      <button type="button" className="setting-pill" aria-label={muted ? '开启声音' : '静音'} aria-pressed={muted} onClick={() => preferencesStore.setState({ muted: !muted })}>
        {muted ? <SpeakerSlash weight="bold" size={22} /> : <SpeakerHigh weight="bold" size={22} />}<span>{muted ? '声音已关' : '声音开启'}</span>
      </button>
      <button type="button" className="setting-pill" aria-label="减少动态效果" aria-pressed={reduced} onClick={() => preferencesStore.setState({ reducedMotion: !reduced })}>
        <Leaf weight={reduced ? 'fill' : 'bold'} size={22} /><span>减少动态</span>
      </button>
      <details className="volume-settings"><summary aria-label="音乐音量设置"><MusicNotes size={21} weight="bold" /></summary><div className="volume-popover"><MusicVolume /></div></details>
    </div>
  </header>
}

function DigitFlight({ root }: { root: RefObject<HTMLDivElement | null> }) {
  const eventId = useGameStore((s) => s.digitEventId)
  const sessionId = useGameStore((s) => s.sessionId)
  const digit = useGameStore((s) => s.lastDigit)
  const rejected = useGameStore((s) => s.digitResult === 'rejected')
  const reduced = usePreferences((s) => s.reducedMotion)
  const bubble = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    const element = bubble.current
    const parent = root.current
    if (!element || !parent || !digit || reduced) return
    const key = parent.querySelector(`[data-feed-key="${digit}"]`)
    const tongue = parent.querySelector('.tongue-landing')
    const mouth = parent.querySelector('.machine-mouth')
    if (!key || !tongue || !mouth) return
    const origin = parent.getBoundingClientRect()
    const point = (node: Element) => {
      const box = node.getBoundingClientRect()
      return { x: box.x + box.width / 2 - origin.x - 29, y: box.y + box.height / 2 - origin.y - 29 }
    }
    const start = point(key), landing = point(tongue), end = point(mouth)
    const position = (p: { x: number; y: number }, scale = 1) => `translate(${p.x}px, ${p.y}px) scale(${scale})`
    const animation = element.animate(rejected ? [
      { transform: position(start, 0.6), opacity: 0, offset: 0 },
      { transform: position(landing), opacity: 1, offset: 0.55 },
      { transform: position(start, 0.7), opacity: 0, offset: 1 },
    ] : [
      { transform: position(start, 0.6), opacity: 0, offset: 0 },
      { transform: position(landing), opacity: 1, offset: 0.45 },
      { transform: position(landing), opacity: 1, offset: 0.6 },
      { transform: position(end, 0.28), opacity: 0, offset: 1 },
    ], { duration: rejected ? 470 : 620, easing: 'cubic-bezier(.2,.65,.3,1)', fill: 'none' })
    return () => animation.cancel()
  }, [digit, eventId, sessionId, rejected, reduced, root])
  return <div className={`digit-flight ${rejected ? 'rejected' : ''}`} ref={bubble} aria-hidden="true"><img src={asset('answer-bubble')} alt="" /><b>{digit}</b></div>
}

function QuestionTicket() {
  const state = useGameStore((s) => s)
  const question = state.currentQuestion
  if (state.status === 'menu') return <div className="ticket-intro"><span>节奏庆典实验室</span><h1>疯狂博士大作战</h1><p>喂数字，破解失控机器！</p></div>
  if (state.status === 'victory') return <div className="ticket-intro victory-title"><span>机器反噬 · 挑战成功</span><h1>博士，认输啦！</h1><p>是你的答案拯救了实验室。</p></div>
  if (!question) return null
  const answerLength = String(question.answer).length
  const statusText = state.feedback === 'correct' ? '答对了！机器反噬！' : state.feedback === 'wrong' ? (state.input ? '这位再想想，前面的数字留好啦' : '这个数字不对，再试一次吧') : state.input ? '这位对啦！继续喂下一位' : '从左到右，把答案喂给舌头'
  return <>
    <span className="sr-only" aria-live="polite">{`第${Math.max(1, state.questionIndex + (state.phase === 'correct' ? 0 : 1))}题，${question.left}${question.operator === '+' ? '加' : '减'}${question.right}。已填${state.input || '空'}。${statusText}`}</span>
    <div className={`equation ${state.feedback === 'correct' ? 'equation-correct' : ''}`} aria-hidden="true" data-question={`${question.left}${question.operator}${question.right}`}>
      <span>{question.left}</span><span className="math-symbol">{question.operator === '-' ? '−' : '+'}</span><span>{question.right}</span><span className="math-symbol">=</span>
      <div className="answer-slots">{Array.from({ length: answerLength }, (_, i) => <span key={i} className={`answer-slot ${state.input[i] ? 'filled' : ''} ${i === state.input.length && state.feedback === 'wrong' ? 'slot-rejected' : ''}`}>
        {state.input[i] || <i className="slot-cursor" />}
      </span>)}</div>
    </div>
    <p className={`ticket-status ${state.feedback}`} role="status" key={state.eventId} hidden={state.hintVisible && state.feedback === 'none'}>{state.feedback === 'correct' && <Star weight="fill" />}<span>{state.feedback === 'correct' ? <><em className="correct-callout">答对了！</em><em className="backlash-callout">机器反噬！</em></> : statusText}</span>{state.feedback === 'correct' && <Lightning weight="fill" />}</p>
    {state.hintVisible && state.phase === 'answering' && state.feedback === 'none' && <p className="math-hint" role="status"><Lightbulb weight="fill" />{hintFor(question)}</p>}
  </>
}

function LaboratoryScene() {
  const state = useGameStore((s) => s)
  const backlash = state.phase === 'correct' || state.status === 'victory'
  const music = musicProgression(state.questionIndex)
  const scene = useRef<HTMLDivElement>(null)
  useMusicPulse(scene)
  const speech = state.status === 'victory' ? '停停停，我认输！' : backlash ? '我的机器怎么了？！' : state.feedback === 'wrong' ? '嘿嘿，再想一想！' : state.bossHp <= 30 ? '不准再喂它了！' : '这道题，你会吗？'
  return <section ref={scene} className={`festival-scene ${backlash ? 'is-backlash' : ''} ${state.phase === 'dispensing' && state.status === 'playing' ? 'is-dispensing' : ''}`} aria-label="疯狂博士的实验室" style={{ '--combo-power': Math.min(1.25, 0.9 + state.combo * 0.025) } as CSSProperties}>
    <img className="stage-backdrop" src={asset('laboratory-stage-clean')} alt="" />
    <img className="flask-band" src={asset('flask-band')} alt="" />
    <div className="villain" key={`${state.sessionId}-${state.questionIndex}-${backlash}`}>
      <p className="villain-speech">{speech}</p>
      <img className="villain-portrait" src={asset(backlash ? 'doctor-backlash' : 'doctor-idle')} alt={backlash ? '疯狂博士被自己的失控机器反噬，吓得目瞪口呆' : '紫发疯狂博士拉着操纵杆，露出得意的怪笑'} />
      <div className="villain-health" role="meter" aria-label="疯狂博士生命值" aria-valuemin={0} aria-valuemax={100} aria-valuenow={state.bossHp}>
        <strong>疯狂博士</strong><span className="hp-track"><i style={{ width: `${state.bossHp}%` }} /></span><b>{state.bossHp}<small> / 100</small></b>
      </div>
      {backlash && state.status === 'playing' && <span className="damage-number" aria-hidden="true">−5</span>}
    </div>
    <div className="machine-body"><img src={asset('tongue-machine')} alt="珊瑚色的大舌头出题机，螺旋灯亮着，张开大嘴" /><span className="machine-mouth" /></div>
    {state.phase === 'correct' && state.status === 'playing' && <span key={`answer-${state.sessionId}-${state.questionIndex}`} className="swallowed-answer" aria-hidden="true"><img src={asset('answer-bubble')} alt="" /><b>{state.input}</b></span>}
    {backlash && <img key={`burst-${state.sessionId}-${state.questionIndex}`} className="backlash-burst" src={asset('backlash-burst')} alt="" />}
    <div className="tongue-group">
      <img className="tongue-art" src={asset('tongue-board')} alt="" />
      <span className="tongue-landing" />
      <div className="tongue-ticket"><QuestionTicket /></div>
    </div>
    <div className="music-milestones" role="group" aria-label={`音乐进度：${music.label}，已点亮${music.stage}种乐器`}>
      {instruments.map((Instrument, i) => <span key={instrumentNames[i]} className={`music-milestone ${i < music.stage ? 'lit' : ''}`} title={`${instrumentNames[i]}${i < music.stage ? '已加入' : '等待加入'}`} style={{ '--instrument-index': i } as CSSProperties}>
        <Instrument weight="duotone" aria-hidden="true" /><span className="sr-only">{instrumentNames[i]}{i < music.stage ? '已加入' : '等待加入'}</span>
      </span>)}
    </div>
    <div className={`combo-badge ${state.combo >= 3 ? 'combo-active' : ''}`} aria-label={`当前连击${state.combo}`}><img src={asset('combo-badge')} alt="" /><span>连击</span><b>×{state.combo}</b></div>
  </section>
}

function FeedPad() {
  const state = useGameStore((s) => s)
  const locked = state.phase !== 'answering'
  return <div className="festival-pad" role="group" aria-label="数字喂食键盘">
    <div className="feed-digits">{digits.map((digit) => <button key={digit} className={`feed-key key-${digit} ${digit === state.lastDigit ? state.digitResult === 'rejected' ? 'key-rejected' : 'key-accepted' : ''}`} type="button" disabled={locked} data-feed-key={digit} aria-label={`数字 ${digit}`} onClick={() => gameController.feed(digit)}><b>{digit}</b></button>)}</div>
    <div className="feed-utilities">
      <button type="button" disabled={locked || !state.input} aria-label="删除一位" onClick={() => gameController.input('erase')}><Backspace size={29} weight="bold" /><span>删除</span></button>
      <button type="button" disabled={locked} aria-label="提示" aria-pressed={state.hintVisible} onClick={gameActions.hint}><Lightbulb size={29} weight={state.hintVisible ? 'fill' : 'duotone'} /><span>提示</span></button>
    </div>
  </div>
}

function GameMenu() {
  const stats = readStats()
  return <section className="festival-menu" aria-label="开始挑战">
    <button className="start-challenge" type="button" onClick={() => gameController.start()}>开始挑战 <ArrowRight size={26} weight="bold" /></button>
    <p>20 以内加减法<span>·</span>不计时<span>·</span>答错可以再试</p>
    <div className="menu-tip"><Lightbulb size={19} weight="duotone" /><span>点数字，也可以用键盘。两位数先喂十位，再喂个位。</span></div>
    <div className="menu-bottom">{stats.gamesPlayed > 0 && <span>最佳连击 ×{stats.bestCombo}</span>}<a href="/music-preview.html" target="_blank" rel="noreferrer">试听实验室音乐 <MusicNotes size={16} /></a></div>
  </section>
}

function GameVictory() {
  const state = useGameStore((s) => s)
  const firstButton = useRef<HTMLButtonElement>(null)
  useEffect(() => { firstButton.current?.focus({ preventScroll: true }) }, [])
  return <section className="festival-victory" aria-labelledby="victory-heading">
    <h2 id="victory-heading">你的每一个答案，都让机器倒戈！</h2>
    <div className="victory-stats"><div><b>20</b><span>道题完成</span></div><div><b>×{state.maxCombo}</b><span>最高连击</span></div><div><b>{accuracyForGame(state)}<small>%</small></b><span>首次答对</span></div></div>
    <div className="victory-actions"><button ref={firstButton} type="button" className="start-challenge" onClick={() => gameController.start()}>再战一局 <ArrowRight size={23} weight="bold" /></button><button type="button" className="menu-return" onClick={() => gameController.menu()}>回到首页</button></div>
  </section>
}

export function FestivalGame() {
  const root = useRef<HTMLDivElement>(null)
  const status = useGameStore((s) => s.status)
  const reduced = usePreferences((s) => s.reducedMotion)
  const audioStatus = usePreferences((s) => s.audioStatus)
  return <div ref={root} className={`festival-app ${reduced ? 'reduced-motion' : ''} view-${status}`} data-audio-state={audioStatus}>
    <FestivalHeader />
    <main className="festival-playground">
      <LaboratoryScene />
      <div className="festival-controls">{status === 'menu' ? <GameMenu /> : status === 'victory' ? <GameVictory /> : <FeedPad />}</div>
    </main>
    <footer className="festival-footer"><Star weight="fill" size={15} /><span>{status === 'menu' ? '每一个答案，都有超能力' : status === 'victory' ? '实验室恢复欢乐，音乐继续！' : '喂入数字，答对反击'}</span><Star weight="fill" size={15} />{audioStatus === 'unavailable' && <small role="status">声音暂时无法启动，可以继续答题</small>}</footer>
    <DigitFlight root={root} />
  </div>
}
