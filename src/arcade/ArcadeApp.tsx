import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, ArrowsOut, GameController, Lightning, Sparkle } from '@phosphor-icons/react'
import { games } from './games'
import type { ArcadeGame } from './games'
import { RoundReport } from './RoundReport'
import { isGameSession, isLearningReport } from './session'
import type { AiSummary, GameSession } from './session'

function GameArtwork({ game }: { game: ArcadeGame }) {
  if (game.id === 'neon') {
    return <div className="game-art game-art-neon" aria-hidden="true">
      <img src="/assets/arcade/neon-preview.png" alt="" />
      <span className="art-caption">RUN FAST. THINK FASTER.</span>
    </div>
  }
  return <div className="game-art game-art-math" aria-hidden="true">
    <img className="art-stage" src="/assets/festival/laboratory-stage-clean.png" alt="" />
    <img className="art-machine" src="/assets/festival/tongue-machine.png" alt="" />
    <img className="art-doctor" src="/assets/festival/doctor-idle.png" alt="" />
    <span className="art-answer">7 + 8 = <b>?</b></span>
  </div>
}

function GameCards() {
  return <div className="game-grid">
    {games.map((game) => <a key={game.id} className={`game-card game-card-${game.id}`} href={game.path} aria-label={`开始游戏：${game.name}`}>
      <GameArtwork game={game} />
      <div className="game-card-copy">
        <p className="game-category"><Lightning size={14} weight="fill" />{game.category}</p>
        <h2>{game.name}</h2>
        <p className="game-subtitle">{game.subtitle}</p>
        <p className="game-description">{game.description}</p>
        <div className="game-card-bottom"><span>{game.detail}</span><span className="play-link">开始游戏 <ArrowRight size={18} weight="bold" /></span></div>
      </div>
    </a>)}
  </div>
}

function GamePage({ game }: { game: ArcadeGame }) {
  const frameContainer = useRef<HTMLDivElement>(null)
  const frame = useRef<HTMLIFrameElement>(null)
  const request = useRef<AbortController | null>(null)
  const lastRound = useRef('')
  const [session, setSession] = useState<GameSession | null>(null)
  const [report, setReport] = useState<AiSummary | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [loaded, setLoaded] = useState(false)
  const [fullscreenError, setFullscreenError] = useState('')

  const summarize = useCallback(async (round: GameSession) => {
    request.current?.abort()
    const controller = new AbortController()
    request.current = controller
    setBusy(true); setError(''); setReport(null)
    try {
      const response = await fetch('/api/ai/summary', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(round), signal: controller.signal,
      })
      const data = await response.json() as AiSummary & { error?: string }
      if (!response.ok) throw new Error(data.error || '学习总结暂时不可用，请再试一次。')
      if (!isLearningReport(data) || !['local', 'openai'].includes(data.source)) throw new Error('学习总结不完整，请再试一次。')
      if (!controller.signal.aborted) setReport(data)
    } catch (cause) {
      if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : '连接失败，请再试一次。')
    } finally { if (!controller.signal.aborted) setBusy(false) }
  }, [])

  useEffect(() => {
    function receive(event: MessageEvent) {
      if (event.origin !== window.location.origin || event.source !== frame.current?.contentWindow) return
      if (event.data?.type === 'ciciarcade:start' && event.data.gameId === game.id) {
        request.current?.abort()
        lastRound.current = ''
        setSession(null); setReport(null); setBusy(false); setError('')
      }
      if (event.data?.type === 'ciciarcade:end' && isGameSession(event.data.session)) {
        const round = event.data.session
        if (round.gameId !== game.id || round.sessionId === lastRound.current) return
        lastRound.current = round.sessionId
        setSession(round)
        void summarize(round)
      }
    }
    window.addEventListener('message', receive)
    return () => { window.removeEventListener('message', receive); request.current?.abort() }
  }, [game.id, summarize])

  async function fullscreen() {
    try {
      await frameContainer.current?.requestFullscreen()
      setFullscreenError('')
    } catch {
      setFullscreenError('当前浏览器无法进入全屏，可以继续在这里玩。')
    }
  }

  return <main id="main" className={`arcade-main play-page play-page-${game.id}`}>
    <div className="play-toolbar">
      <a className="back-link" href="/games"><ArrowLeft size={18} />游戏大厅</a>
      <h1>{game.name}<span>{game.subtitle}</span></h1>
      {document.fullscreenEnabled && <button className="fullscreen-button" type="button" onClick={() => void fullscreen()}><ArrowsOut size={18} /><span>全屏游戏</span></button>}
    </div>
    <div className="game-frame-container" ref={frameContainer}>
      {!loaded && <div className="game-loading" role="status">正在加载 {game.name}…</div>}
      <iframe ref={frame} className="game-frame" src={game.source} title={`${game.name}游戏`} allow="autoplay; fullscreen" allowFullScreen inert={Boolean(session)} aria-hidden={session ? true : undefined} onLoad={() => setLoaded(true)} />
      {session && <RoundReport key={session.sessionId} session={session} report={report} busy={busy} error={error}
        onRetry={() => void summarize(session)}
        onReplay={() => frame.current?.contentWindow?.postMessage({ type: 'ciciarcade:replay', gameId: game.id }, window.location.origin)} />}
    </div>
    <p className="game-controls">{game.controls}</p>
    {fullscreenError && <p role="status" className="fullscreen-error">{fullscreenError}</p>}
  </main>
}

export default function ArcadeApp() {
  const path = window.location.pathname.replace(/\/+$/, '') || '/'
  const game = games.find((entry) => entry.path === path)
  const home = path === '/'
  const lobby = path === '/games'

  useEffect(() => {
    document.title = game ? `${game.name} · CiciArcade` : lobby ? '游戏大厅 · CiciArcade' : home ? 'CiciArcade · 把练习玩成冒险' : '页面未找到 · CiciArcade'
  }, [game, home, lobby])

  return <div className="arcade-app">
    <a className="skip-link" href="#main">跳到主要内容</a>
    <header className="arcade-header">
      <a className="arcade-brand" href="/" aria-label="CiciArcade 首页"><span className="brand-controller"><GameController size={26} weight="duotone" /></span><b>Cici<span>Arcade</span></b></a>
      <nav aria-label="主导航"><a href="/" aria-current={home ? 'page' : undefined}>首页</a><a href="/games" aria-current={lobby || game ? 'page' : undefined}>游戏大厅 <ArrowRight size={16} /></a></nav>
    </header>

    {game ? <GamePage game={game} /> : home || lobby ? <main id="main" className="arcade-main">
      {home ? <section className="home-intro" aria-labelledby="home-title">
        <div><h1 id="home-title">把练习，<br /><span>玩成冒险。</span></h1><p>一个可以接入 AI 导师的开源教育游戏平台。</p><a className="lobby-link" href="/games">进入游戏大厅 <ArrowRight size={19} weight="bold" /></a></div>
        <div className="intro-note"><Sparkle size={44} weight="duotone" aria-hidden="true" /><p>玩一局。<br />懂一点。<br /><span>再来一局。</span></p><span>每次冒险，都有新的收获 ↓</span></div>
      </section> : <section className="lobby-intro"><h1>游戏大厅</h1><p>去实验室挑战口算，或在霓虹城市里闯过单词关。</p></section>}
      {home && <div className="games-heading"><h2>今天，玩点什么？</h2><span>两个世界，随你出发</span></div>}
      <GameCards />
      <section className="learn-next" aria-labelledby="learn-next-title"><div className="learn-next-title"><Sparkle size={28} weight="duotone" /><h2 id="learn-next-title">通关之后，还有下一步。</h2><p>成绩告诉你这一局玩得怎样，学习总结帮你找到下一局的方向。</p></div><div className="learn-next-steps"><div><span>PLAY</span><h3>选一个世界</h3><p>口算实验室，或霓虹单词跑酷。点开就玩。</p></div><div><span>LEARN</span><h3>带走你的收获</h3><p>结束后查看成绩、错题和学习建议。</p></div><div><span>REPLAY</span><h3>下一局，更有方向</h3><p>复习一个知识点，把新想法用到游戏里。</p></div></div></section>
    </main> : <main id="main" className="arcade-main missing-page"><h1>这个关卡还没开放。</h1><p>回到游戏大厅，选择一个游戏继续冒险。</p><a className="lobby-link" href="/games">返回游戏大厅 <ArrowRight size={19} /></a></main>}

    {!game && <footer className="arcade-footer"><span>CiciArcade</span><p>保持好奇，继续开玩。</p><span>开源教育游戏平台</span></footer>}
  </div>
}
