import { useGameStore } from '../game/gameStore'
import { QuestionCard } from './QuestionCard'

export function QuestionMachine() {
  const phase = useGameStore((s) => s.phase)
  const question = useGameStore((s) => s.currentQuestion)
  const status = useGameStore((s) => s.status)
  const key = question ? `${question.left}${question.operator}${question.right}` : status
  return <div key={key} className={`question-machine ${status === 'playing' ? 'machine-dispense' : ''} ${phase === 'correct' ? 'machine-correct' : ''}`}>
    <svg className="machine-body" viewBox="0 0 360 195" aria-hidden="true">
      <g stroke="#8c514c" strokeWidth="3" strokeLinejoin="round">
        <path d="M42 135v44q0 11 13 11h20q10 0 10-11v-31m190 0v31q0 11 12 11h21q10 0 10-11v-44" fill="#b87062" />
        <path d="M12 63Q12 17 49 17h262q38 0 38 46v84q0 35-37 35H49q-37 0-37-35Z" fill="#d27966" />
        <rect x="12" y="8" width="336" height="166" rx="37" fill="#e98975" />
        <path d="M42 33q0-12 15-12h74" stroke="#f5b8a2" strokeWidth="7" fill="none" strokeLinecap="round" />
        <rect x="26" y="66" width="308" height="99" rx="19" fill="#654853" />
        <path d="M31 79q1-10 12-10h277" fill="none" stroke="#4f3844" strokeWidth="6" />
        <circle cx="121" cy="43" r="13" fill="#f2d48b" />
        <circle cx="239" cy="43" r="13" fill="#f2d48b" />
        <circle cx="123" cy="45" r="4" fill="#654853" stroke="none" />
        <circle cx="237" cy="45" r="4" fill="#654853" stroke="none" />
        <path d="M154 38h52" stroke="#f6b8a4" strokeWidth="4" strokeLinecap="round" />
        <g fill="#f2d48b" strokeWidth="2"><circle cx="30" cy="54" r="4" /><circle cx="329" cy="54" r="4" /><circle cx="30" cy="153" r="4" /><circle cx="329" cy="153" r="4" /></g>
      </g>
    </svg>
    <div className="tongue" aria-hidden="true"><span /><i /></div>
    <QuestionCard />
    <div className="machine-sticker" aria-hidden="true">BUBBLE-O-MATIC <span>✦</span></div>
  </div>
}
