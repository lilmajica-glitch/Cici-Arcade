import { useRef } from 'react'
import { ArrowDown, ArrowUpRight } from '@phosphor-icons/react'
import { DailyCheckIn } from './DailyCheckIn'
import { GameCards } from './GameCards'
import { LearningSection } from './LearningSection'
import { MotionLink } from './MotionLink'
import { useHomeMotion } from './useHomeMotion'

export function HomePage() {
  const root = useRef<HTMLElement>(null)
  useHomeMotion(root)
  return <main id="main" ref={root} className="home-page">
    <div className="reading-progress" aria-hidden="true" />
    <section className="home-hero" aria-labelledby="home-title">
      <img className="hero-backdrop" src="/assets/arcade/hero-cobalt.png" alt="" width="1662" height="946" fetchPriority="high" />
      <div className="hero-copy page-width">
        <h1 id="home-title" className="max-w-6xl">把练习，<br /><span>玩成冒险。</span></h1>
        <p>玩一局。懂一点。再来一局。</p>
        <div className="hero-actions">
          <MotionLink href="#games" variant="white">进入游戏大厅</MotionLink>
          <MotionLink href="#learning" variant="quiet">了解学习方式</MotionLink>
        </div>
      </div>
      <div className="hero-mascot" aria-hidden="true"><div className="mascot-entrance"><div className="mascot-scroll"><div className="mascot-reactor"><div className="mascot-float">
        <img src="/assets/arcade/cici-mascot.png" alt="" width="1254" height="1254" fetchPriority="high" />
      </div></div></div></div></div>
      <a className="hero-scroll-cue" href="#games"><span>好奇心，往下走。</span><ArrowDown size={17} aria-hidden="true" /></a>
    </section>
    <section id="games" className="games-section page-width" aria-labelledby="games-title">
      <div className="section-heading"><h2 id="games-title">今天，玩点什么？</h2><a href="/games">两个世界，随你出发 <ArrowUpRight size={18} aria-hidden="true" /></a></div>
      <GameCards />
    </section>
    <LearningSection />
    <DailyCheckIn />
    <section className="closing-section page-width" data-reveal>
      <p>下一次出发，会多一点不一样。</p>
      <h2>带上好奇心，<br /><span>我们游戏里见。</span></h2>
      <MotionLink href="/games" diagonal>进入游戏大厅</MotionLink>
    </section>
  </main>
}
