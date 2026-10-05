import { useEffect, useRef, useState } from 'react'
import { ArrowRight, ArrowCounterClockwise, Sparkle, Trophy } from '@phosphor-icons/react'
import type { AiSummary, GameSession, TutorReply } from './session'

function Tutor({ session, connected }: { session: GameSession; connected: boolean }) {
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState<TutorReply | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const pending = useRef<AbortController | null>(null)
  useEffect(() => () => pending.current?.abort(), [])

  async function ask() {
    if (!question.trim() || busy) return
    const controller = new AbortController()
    pending.current = controller
    setBusy(true); setError(''); setAnswer(null)
    try {
      const response = await fetch('/api/ai/tutor', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session, question: question.trim() }), signal: controller.signal,
      })
      const reply = await response.json() as TutorReply & { error?: string }
      if (!response.ok) throw new Error(reply.error || '导师暂时无法回答，请再试一次。')
      if (typeof reply.answer !== 'string') throw new Error('导师回答不完整，请再试一次。')
      if (!controller.signal.aborted) setAnswer(reply)
    } catch (cause) {
      if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : '连接失败，请再试一次。')
    } finally { if (!controller.signal.aborted) setBusy(false) }
  }

  return <div className="tutor-box">
    <form onSubmit={(event) => { event.preventDefault(); void ask() }}>
      <label htmlFor="tutor-question">{connected ? '问问 AI 导师' : '问问学习助手'}</label>
      <p>{connected ? '从这一局的问题开始，一次弄懂一点。' : 'AI 导师连接前，学习助手提供本局的基础复习建议。'}</p>
      <div className="tutor-input-row">
        <input id="tutor-question" value={question} onChange={(event) => setQuestion(event.target.value)} maxLength={500} required placeholder="例如：这道错题应该怎么想？" />
        <button type="submit" disabled={busy || !question.trim()}>{busy ? '思考中…' : '提问'}<ArrowRight size={17} /></button>
      </div>
    </form>
    {busy && <p role="status">正在整理回答…</p>}
    {error && <p className="report-error" role="alert">{error}</p>}
    {answer && <div className="tutor-answer" role="status">{answer.notice && <p className="report-notice">{answer.notice}</p>}<p>{answer.answer}</p></div>}
  </div>
}

export function RoundReport({ session, report, busy, error, onRetry, onReplay }: {
  session: GameSession
  report: AiSummary | null
  busy: boolean
  error: string
  onRetry: () => void
  onReplay: () => void
}) {
  const heading = useRef<HTMLHeadingElement>(null)
  useEffect(() => { heading.current?.focus({ preventScroll: true }) }, [])
  const seconds = session.durationSeconds
  const duration = seconds < 60 ? `${seconds} 秒` : `${Math.floor(seconds / 60)} 分 ${seconds % 60} 秒`

  return <section className="round-report" aria-labelledby="round-title">
    <div className="round-sheet">
      <div className="round-heading"><span className="round-stamp"><Trophy size={28} weight="duotone" /></span><div><p className="round-eyebrow">{session.gameName} · 本局成绩</p><h2 id="round-title" ref={heading} tabIndex={-1}>挑战完成，收获带走。</h2></div><span className="round-ticket">GG!<small>GOOD GAME</small></span></div>
      <dl className="round-stats">
        <div><dt>本局得分</dt><dd>{session.score.toLocaleString()}</dd></div>
        <div><dt>{session.gameId === 'math' ? '首次答对率' : '答题正确率'}</dt><dd>{session.accuracy}<small>%</small></dd></div>
        <div><dt>完成答题</dt><dd>{session.answeredCount}<small>题</small></dd></div>
        <div><dt>游戏时长</dt><dd className="round-duration">{duration}</dd></div>
      </dl>
      {session.gameId === 'math' && <p className="score-note">口算挑战积分：每道首次答对 +100 分；答错后仍可以继续尝试。</p>}
      <div className="learning-heading"><h3><Sparkle weight="duotone" size={22} />{report?.source === 'local' ? '本局学习复盘' : 'AI 学习总结'}</h3><span>{busy ? '正在整理' : report?.source === 'openai' ? 'AI 导师' : report?.source === 'local' ? '基础复盘' : '等待连接'}</span></div>
      <div className="learning-content" aria-live="polite" aria-busy={busy}>
        {busy && <div className="report-loading"><span className="loading-dot" /><p>正在整理本局表现和下一局练习建议…</p></div>}
        {error && <div className="report-error" role="alert"><p>{error}</p><button type="button" onClick={onRetry}><ArrowCounterClockwise size={16} />重新生成总结</button></div>}
        {report && <>
          {report.notice && <p className="report-notice">{report.notice}</p>}
          <p className="performance-summary">{report.summary}</p>
          <div className="learning-columns">
            <div><h4>值得再练的知识点</h4>{report.weakPoints.length ? <ul className="knowledge-points">{report.weakPoints.map((point, index) => <li key={index}>{point}</li>)}</ul> : <p className="no-mistakes">{session.answeredCount ? '本局没有发现明显薄弱点，继续巩固。' : '先完成几道题，再来看看。'}</p>}</div>
            <div><h4>下一局，试试这样玩</h4><ol className="next-practice">{report.suggestions.map((suggestion, index) => <li key={index}>{suggestion}</li>)}</ol></div>
          </div>
        </>}
      </div>
      {session.wrongAnswers.length > 0 && <details className="wrong-review"><summary>回看错题记录 <span>{session.wrongAnswers.length} 次</span></summary><ul>{session.wrongAnswers.map((wrong, index) => <li key={index}><strong>{wrong.question}</strong><span>你的回答：{wrong.userAnswer}</span><span className="correct-answer">正确答案：{wrong.correctAnswer}</span></li>)}</ul></details>}
      {report && <Tutor session={session} connected={report.source === 'openai'} />}
      <div className="round-actions"><button type="button" className="replay-button" onClick={onReplay}>带着收获，再玩一局<ArrowRight size={20} weight="bold" /></button><a href="/games">换个游戏</a></div>
    </div>
  </section>
}
