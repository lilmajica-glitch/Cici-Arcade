import { useEffect, useRef, useState } from 'react'
import { ArrowUpRight, CalendarDots, Check, CheckCircle, Flame, Sparkle, Target } from '@phosphor-icons/react'
import { currentStreak, dayKey, weekDays } from './activity'
import { useActivity } from './useActivity'
import { gsap, useGSAP } from './motion'
import type { WeeklyGoal } from './activity'

const labels = ['一', '二', '三', '四', '五', '六', '日']

export function DailyCheckIn() {
  const { activity, saved, checkIn, changeGoal } = useActivity()
  const [now, setNow] = useState(() => new Date())
  const root = useRef<HTMLElement>(null)
  const { contextSafe } = useGSAP({ scope: root })
  useEffect(() => {
    const update = () => setNow(new Date())
    const interval = window.setInterval(update, 60_000)
    document.addEventListener('visibilitychange', update)
    return () => { window.clearInterval(interval); document.removeEventListener('visibilitychange', update) }
  }, [])

  const today = dayKey(now)
  const week = weekDays(now)
  const checked = activity.checkIns.includes(today)
  const count = week.filter((key) => key <= today && activity.checkIns.includes(key)).length
  const streak = currentStreak(activity.checkIns, today)
  const total = activity.gameRounds.math + activity.gameRounds.neon
  const completedGoal = count >= activity.weeklyGoal
  const handleCheckIn = contextSafe(() => {
    checkIn()
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    gsap.fromTo('.checkin-button', { scale: 0.95 }, { scale: 1, duration: 0.5, ease: 'back.out(2.8)' })
    gsap.fromTo('.checkin-spark', { opacity: 1, scale: 0.2, x: 0, y: 0 },
      { opacity: 0, scale: 1, x: (index: number) => (index - 2.5) * 24,
        y: (index: number) => -34 - (index % 3) * 18, duration: 0.85, stagger: 0.035, ease: 'power2.out' })
  })

  return <section id="daily-checkin" ref={root} className="daily-section page-width" aria-labelledby="checkin-title" data-reveal>
    <div className="checkin-intro">
      <div className="checkin-kicker"><CalendarDots size={21} weight="duotone" aria-hidden="true" />每一天，都算数。</div>
      <h2 id="checkin-title">一点点坚持，<br /><span>会变成大进步。</span></h2>
      <p>来这里打个卡，或完成一局游戏。<br />给今天的好奇心，留一个记号。</p>
      <div className="activity-numbers">
        <div><Flame size={22} weight="duotone" aria-hidden="true" /><strong>{streak}</strong><span>天连续打卡</span></div>
        <div><PlayCount /><strong>{total}</strong><span>局已完成</span></div>
      </div>
    </div>
    <div className={'checkin-board' + (checked ? ' checkin-done' : '')}>
      <div className="checkin-board-heading">
        <div><span className="week-label">这周的学习足迹</span><p>{Number(week[0].slice(5, 7))} 月 {Number(week[0].slice(8))} 日 — {Number(week[6].slice(5, 7))} 月 {Number(week[6].slice(8))} 日</p></div>
        <span className={'checkin-status' + (checked ? ' is-checked' : '')}>{checked ? <CheckCircle size={16} weight="fill" /> : <Sparkle size={16} />} {checked ? '今天已打卡' : '今天等你来'}</span>
      </div>
      <div className="week-grid" role="list" aria-label="本周每日打卡记录">
        {week.map((key, index) => {
          const done = key <= today && activity.checkIns.includes(key)
          const isToday = key === today
          return <div key={key} role="listitem" className={'week-day' + (done ? ' day-checked' : '') + (isToday ? ' day-today' : '') + (key > today ? ' day-future' : '')}
            aria-label={key + (isToday ? ' 今天' : '') + (done ? ' 已打卡' : ' 未打卡')}>
            <span className="weekday">周{labels[index]}</span>
            <span className="day-circle">{done ? <Check size={22} weight="bold" aria-hidden="true" /> : <time dateTime={key}>{Number(key.slice(8))}</time>}</span>
            <span className="day-label">{isToday ? '今天' : done ? '已打卡' : ' '}</span>
          </div>
        })}
      </div>
      <div className="weekly-goal">
        <div><span><Target size={16} aria-hidden="true" />{completedGoal ? '本周目标已达成' : '本周小目标'}</span>
          <label className="goal-select">每周 <select aria-label="每周打卡目标" value={activity.weeklyGoal} onChange={(event) => changeGoal(Number(event.target.value) as WeeklyGoal)}>
            <option value={3}>3 天</option><option value={5}>5 天</option><option value={7}>7 天</option>
          </select></label>
        </div>
        <div className="goal-track" role="progressbar" aria-label="本周打卡目标进度" aria-valuemin={0} aria-valuemax={activity.weeklyGoal} aria-valuenow={Math.min(count, activity.weeklyGoal)}>
          <span style={{ width: Math.min(100, count / activity.weeklyGoal * 100) + '%' }} />
        </div>
        <p>{count} / {activity.weeklyGoal} 天<span>{completedGoal ? '保持你的节奏，继续探索。' : '不用赶进度，按自己的节奏来。'}</span></p>
      </div>
      <div className="checkin-bottom">
        <p className="checkin-note" role="status" aria-live="polite">{!saved ? '浏览器暂时无法保存，本次打卡会保留到页面关闭。' : checked ? '今天的努力已经记下来了。' : '玩完一局，也会自动为你打卡。'}</p>
        <button className="arcade-button button-blue checkin-button" type="button" disabled={checked} onClick={handleCheckIn}>
          <span>{checked ? '已打卡，明天见' : '今日打卡'}</span>{checked ? <CheckCircle size={20} weight="fill" /> : <ArrowUpRight size={20} weight="bold" />}
          <span className="checkin-sparks" aria-hidden="true">{Array.from({ length: 6 }, (_, index) => <Sparkle key={index} className="checkin-spark" size={14} weight="fill" />)}</span>
        </button>
      </div>
      <p className="device-note">打卡和游戏足迹记录在当前设备。</p>
    </div>
  </section>
}

function PlayCount() {
  return <ArrowUpRight size={22} weight="duotone" aria-hidden="true" />
}
