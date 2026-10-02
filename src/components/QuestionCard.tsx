import { useEffect, useRef } from 'react'
import { useGameStore } from '../game/gameStore'

export function QuestionCard() {
  const status = useGameStore((s) => s.status)
  const question = useGameStore((s) => s.currentQuestion)
  const input = useGameStore((s) => s.input)
  const phase = useGameStore((s) => s.phase)
  const index = useGameStore((s) => s.questionIndex)
  const card = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (status === 'playing' && phase === 'dispensing') card.current?.focus({ preventScroll: true })
  }, [status, phase])

  return <div ref={card} tabIndex={-1} className={`question-card ${status === 'playing' ? 'is-question card-enter' : 'is-message'}`}>
    {status === 'menu' ? <><span className="card-eyebrow">准备好你的超能力</span><strong>把答案变成攻击！</strong><span className="card-ornament" aria-hidden="true">✦</span></> : status === 'victory' ? <><span className="card-eyebrow">MISSION COMPLETE</span><strong>博士被打败啦！</strong><span className="card-ornament" aria-hidden="true">✦</span></> : question ? <>
      <span className="sr-only" aria-live="polite" aria-atomic="true">第 {phase === 'correct' ? index : index + 1} 题，{question.left} {question.operator === '+' ? '加' : '减'} {question.right} 等于多少？</span>
      <div className="equation" aria-hidden="true"><span>{question.left}</span><span className="equation-op">{question.operator === '+' ? '+' : '−'}</span><span>{question.right}</span><span className="equation-equals">=</span><span className={`answer-slot ${input ? 'has-answer' : ''}`}>{input || '?'}</span></div>
      <span className="sr-only" role="status">{input ? `你的答案：${input}` : '等待输入答案'}</span>
    </> : null}
  </div>
}
