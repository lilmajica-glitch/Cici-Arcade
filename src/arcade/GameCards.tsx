import { useState } from 'react'
import { ArrowUpRight, Lightning, Play } from '@phosphor-icons/react'
import { games } from './games'
import { useActivity } from './useActivity'
import type { ArcadeGame } from './games'
import type { GameId } from './session'

function GameArtwork({ game }: { game: ArcadeGame }) {
  if (game.id === 'neon') {
    return <div className="game-art game-art-neon" aria-hidden="true">
      <img src="/assets/arcade/neon-preview.png" alt="" width="1400" height="700" loading="lazy" />
      <span className="art-caption">RUN FAST. THINK FASTER.</span>
    </div>
  }
  return <div className="game-art game-art-math" aria-hidden="true">
    <img className="art-stage" src="/assets/festival/laboratory-stage-clean.png" alt="" loading="lazy" />
    <img className="art-machine" src="/assets/festival/tongue-machine.png" alt="" loading="lazy" />
    <img className="art-doctor" src="/assets/festival/doctor-idle.png" alt="" loading="lazy" />
    <span className="art-answer">7 + 8 = <b>?</b></span>
  </div>
}

export function GameCards() {
  const [active, setActive] = useState<GameId | null>(null)
  const { activity } = useActivity()
  return <div className={'arcade-game-grid' + (active ? ' game-active-' + active : '')} onPointerLeave={() => setActive(null)}>
    {games.map((game) => <a key={game.id} className={'arcade-game-card arcade-game-' + game.id} href={game.path}
      aria-label={'开始游戏：' + game.name} onPointerEnter={(event) => { if (event.pointerType === 'mouse') setActive(game.id) }}
      onFocus={() => setActive(game.id)} onBlur={() => setActive(null)}>
      <div className="game-media">
        <GameArtwork game={game} />
        <div className="art-play"><Play size={26} weight="fill" /></div>
        {activity.lastGame === game.id && <span className="recent-game">最近玩过</span>}
      </div>
      <div className="game-copy">
        <div className="game-copy-main">
          <p className="game-type"><Lightning size={13} weight="fill" aria-hidden="true" />{game.category}</p>
          <h3>{game.name}</h3>
          <p className="game-copy-subtitle">{game.subtitle}</p>
          <p className="game-meta">{game.id === 'math' ? '20 道加减法 · 不限时' : '12 道单词题 · 85 秒一局'}</p>
        </div>
        <span className="game-launch"><span>{activity.gameRounds[game.id] > 0 ? '再来一局' : '开始游戏'}</span><ArrowUpRight size={21} weight="bold" aria-hidden="true" /></span>
      </div>
      <div className="game-extra"><span>{game.description}</span><span>{activity.gameRounds[game.id] > 0 ? '已完成 ' + activity.gameRounds[game.id] + ' 局' : '点开就玩'}</span></div>
    </a>)}
  </div>
}
