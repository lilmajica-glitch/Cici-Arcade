import { useRef, useState } from 'react'
import { ArrowRight, CaretLeft, CaretRight, ChartBar, CheckCircle, Lightbulb, ListChecks } from '@phosphor-icons/react'
import { MotionLink } from './MotionLink'
import { gsap, ScrollTrigger, useGSAP } from './motion'
import type { KeyboardEvent } from 'react'

const steps = [
  { title: '本局成绩', icon: ChartBar, description: '看见这一局的表现，发现自己正在变好的地方。', heading: '让每一次进步，都看得见。', copy: '答对了多少、连击有多长、用了多久。一局结束，把自己的表现看清楚。' },
  { title: '错题回顾', icon: ListChecks, description: '回顾没答对的题，把卡住的地方重新想明白。', heading: '卡住的地方，也能变成收获。', copy: '回看题目和正确答案，理解解题思路。再碰到相似的问题，就多了一点把握。' },
  { title: '下一局建议', icon: Lightbulb, description: '带走一个练习方向，让下一次出发更有目标。', heading: '下一局，带着新想法出发。', copy: '学习总结会整理需要复习的知识点。选一个小目标，再去游戏里练一练。' },
]

export function LearningSection() {
  const [active, setActive] = useState(0)
  const [answerOpen, setAnswerOpen] = useState(false)
  const root = useRef<HTMLElement>(null)
  const tabs = useRef<(HTMLButtonElement | null)[]>([])
  useGSAP(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    gsap.fromTo('.learning-panel:not([hidden])', { y: 14, opacity: 0.65 }, { y: 0, opacity: 1, duration: 0.4, ease: 'power3.out', onComplete: () => ScrollTrigger.refresh() })
  }, { scope: root, dependencies: [active], revertOnUpdate: true })

  const select = (index: number) => { setActive(index); setAnswerOpen(false) }
  function onTabKey(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let next = index
    if (event.key === 'ArrowRight') next = (index + 1) % steps.length
    else if (event.key === 'ArrowLeft') next = (index + steps.length - 1) % steps.length
    else if (event.key === 'Home') next = 0
    else if (event.key === 'End') next = steps.length - 1
    else return
    event.preventDefault()
    select(next)
    tabs.current[next]?.focus()
  }

  return <section ref={root} id="learning" className="learning-section page-width" aria-labelledby="learning-title">
    <div className="learning-pin">
      <h2 id="learning-title">通关之后，<span className="inline-lesson-image" aria-hidden="true"><img src="/assets/arcade/neon-preview.png" alt="" loading="lazy" /></span><br /><span>还有下一步。</span></h2>
      <p>每一局都有收获。<br />把成绩看懂，把错题想通，<br />带着新的方向继续冒险。</p>
      <div className="learning-mascot" aria-hidden="true"><img src="/assets/arcade/cici-mascot.png" alt="" loading="lazy" width="300" height="300" /></div>
    </div>
    <div className="learning-content">
      <div className="learning-tabs" role="tablist" aria-label="学习回顾">
        {steps.map((step, index) => <button key={step.title} role="tab" id={'learning-tab-' + index} aria-controls={'learning-panel-' + index}
          aria-selected={active === index} tabIndex={active === index ? 0 : -1} ref={(element) => { tabs.current[index] = element }}
          className={'learning-tab' + (active === index ? ' tab-active' : '')} type="button" onClick={() => select(index)} onKeyDown={(event) => onTabKey(event, index)}>
          <span className={'learning-icon learning-icon-' + index}><step.icon size={27} weight="duotone" aria-hidden="true" /></span>
          <strong>{step.title}</strong><span className="learning-tab-description">{step.description}</span>
          {index < 2 && <ArrowRight className="learning-step-arrow" size={19} aria-hidden="true" />}
        </button>)}
      </div>
      <div className="learning-panels">
        {steps.map((step, index) => <div key={step.title} id={'learning-panel-' + index} className={'learning-panel panel-' + index}
          role="tabpanel" aria-labelledby={'learning-tab-' + index} hidden={active !== index} tabIndex={0}>
          <div className="learning-panel-copy"><span className="learning-panel-label">{step.title}</span><h3>{step.heading}</h3><p>{step.copy}</p>
            <MotionLink href="/games" variant="quiet">去玩一局</MotionLink>
          </div>
          <div className="learning-example">
            <span className="example-label">一道口算例子</span>
            <div className={'example-question' + (answerOpen ? ' example-solved' : '')}>7 <span>+</span> 8 <span>=</span> <strong>{answerOpen ? '15' : '?'}</strong></div>
            {answerOpen ? <p className="example-explanation"><CheckCircle size={18} weight="fill" aria-hidden="true" />7 加 3 凑成 10，再加剩下的 5。</p>
              : <p className="example-prompt">把一点新思路，带进下一局。</p>}
            <button type="button" className="example-toggle" aria-expanded={answerOpen} onClick={() => setAnswerOpen((open) => !open)}>{answerOpen ? '收起思路' : '看看思路'}<Lightbulb size={17} aria-hidden="true" /></button>
          </div>
        </div>)}
      </div>
      <div className="learning-carousel-controls">
        <span><b>{String(active + 1).padStart(2, '0')}</b> / 03<span className="carousel-hint">玩过，再懂一点。</span></span>
        <div><button type="button" className="round-control" aria-label="上一项学习回顾" onClick={() => select((active + 2) % 3)}><CaretLeft size={20} /></button>
          <button type="button" className="round-control" aria-label="下一项学习回顾" onClick={() => select((active + 1) % 3)}><CaretRight size={20} /></button></div>
      </div>
    </div>
  </section>
}
