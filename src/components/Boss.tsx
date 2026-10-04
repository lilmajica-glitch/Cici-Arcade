import { memo } from 'react'
import { useGameStore } from '../game/gameStore'
import { getLabIntensity } from '../game/labIntensitySystem'

/** Original vector character: lavender cloud hair, mint goggles, a very silly grin. */
const DoctorIllustration = memo(function DoctorIllustration({ hurt, defeated, worried, excited, encouraging }: { hurt: boolean; defeated: boolean; worried: boolean; excited: boolean; encouraging: boolean }) {
  return <svg className="doctor-svg" viewBox="0 0 320 226" role="img" aria-label={defeated ? '泡泡博士举手认输' : hurt ? '泡泡博士被答案击中，眼镜歪了' : excited ? '泡泡博士兴奋鼓励' : encouraging ? '泡泡博士温柔鼓励' : '戴薄荷色护目镜的可爱泡泡博士'}>
    <ellipse cx="160" cy="211" rx="109" ry="10" fill="#345344" opacity=".1" />
    <g stroke="#40394e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <g className={`doctor-arm doctor-arm-left ${excited ? 'arm-wave' : ''} ${encouraging ? 'arm-thumbs-up' : ''}`}>
        <path d="M104 155Q62 148 48 175l18 12 49-13" fill="#fffdf5" />
        <path d="M66 175q-9-15-15-5l-10-3q-10-1-9 7l-7 4q-9 8 4 15l25 4q13-1 15-11" fill="#b8a0d6" />
        <path d="m39 180 10 3m-6-10 11 5" fill="none" />
      </g>
      <g className={`doctor-arm doctor-arm-right ${excited ? 'arm-wave' : ''}`}>
        <path d="M214 157q42-9 57 20l-20 15-46-15" fill="#fffdf5" />
        <path d="M251 179q9-18 16-9l9-3q11-2 10 8l7 5q9 9-4 16l-26 3q-12-1-14-11" fill="#b8a0d6" />
        <path d="m270 181 10-3m-15-2 9-3" fill="none" />
      </g>
      <path d="M126 186 121 215h26l11-29m16 0 10 29h25l-12-29" fill="#59635b" />
      <path d="M122 207q-21 4-22 12h48v-10m36-1v11h48q-4-11-26-12" fill="#eac968" />
      <path d="M117 135q-20 25-20 67h128q-1-43-22-67Z" fill="#fffdf5" />
      <path d="m146 137-15 58h54l-11-58" fill="#e98975" />
      <path d="m129 136-13 24 20 1-5 13 28 28m31-66 13 24-21 1 6 13-28 28" fill="#fffdf5" />
      <path d="M203 176h-16v18h17" fill="#d3e8d8" />
      <path d="m196 173 1 14m-5-14 1 14" stroke="#e98975" />
      <circle cx="161" cy="183" r="2" fill="#59635b" />
      <path d="m158 146-15-10-3 17 18-4 6-1 15 6 2-17-18 9" fill="#f0cb68" />
      <circle cx="160" cy="147" r="4" fill="#f0cb68" />
      <g className={`doctor-head ${excited ? 'head-bounce' : ''}`}>
        <path d="M97 74q-26-27 4-36-10-32 23-27 16-30 38-10 27-25 44 4 38-3 31 26 34 13 9 34l-18 40H110Z" fill="#b5a0d5" />
        <path d="M109 30q14 14 27 6m29-20q0 15 14 19m32 0q-8 11-22 11" fill="none" stroke="#8f76b2" />
        <ellipse cx="106" cy="94" rx="15" ry="20" fill="#f4c3a2" />
        <ellipse cx="217" cy="94" rx="15" ry="20" fill="#f4c3a2" />
        <path d="M109 60q11-15 50-15t53 16v47q-4 42-51 42-46-1-53-39Z" fill="#f6cbae" />
        <path d="M131 123q30 19 61-1-4 24-30 24-26-2-31-23" fill={defeated ? '#fffdf5' : encouraging ? '#fffdf5' : '#694b58'} />
        {defeated ? <path d="M139 134q21 10 43-1" fill="none" /> : encouraging ? <path d="M145 130q15 6 32 0" fill="none" stroke="#694b58" strokeWidth="2" /> : <path d="m140 128 6 8 7-5 7 8 8-9 8 6 8-9" fill="#fffdf5" strokeWidth="2" />}
        <ellipse cx="126" cy="116" rx="10" ry="5" fill="#e98975" opacity=".6" stroke="none" />
        <ellipse cx="196" cy="116" rx="10" ry="5" fill="#e98975" opacity=".6" stroke="none" />
        <path d="M155 98q-8 12 3 14h10" fill="none" stroke="#c38e75" strokeWidth="2" />
        <g className={hurt ? 'doctor-goggles tilted' : 'doctor-goggles'}>
          <path d="M99 82h14m93 0h18m-69 5h16" stroke="#547e6b" strokeWidth="6" />
          <rect x="108" y="67" width="47" height="39" rx="13" fill="#d3eece" stroke="#547e6b" strokeWidth="5" />
          <rect x="171" y="67" width="47" height="39" rx="13" fill="#d3eece" stroke="#547e6b" strokeWidth="5" />
          <path d="m116 77 14-4m48 4 14-4" stroke="#fff" strokeWidth="3" />
          {hurt ? <><path d="m127 82 11 8-11 7m73-15-11 8 11 7" fill="none" /></> : defeated ? <><path d="M124 91q8-10 15 0m45 0q8-10 15 0" fill="none" /></> : excited ? <><ellipse cx="135" cy="87" rx="4" ry="7" fill="#40394e" stroke="none" /><ellipse cx="191" cy="87" rx="4" ry="7" fill="#40394e" stroke="none" /><circle cx="137" cy="84" r="1.5" fill="#fff" /></> : <><ellipse cx="135" cy="87" rx={worried ? 4 : 3.5} ry={worried ? 8 : 6} fill="#40394e" stroke="none" /><ellipse cx="191" cy="87" rx={worried ? 4 : 3.5} ry={worried ? 8 : 6} fill="#40394e" stroke="none" /></>}
        </g>
        <path d={worried ? 'm119 60 21-6m39 0 20 6' : excited ? 'm119 56 21 5m39 0 21-6' : 'm119 56 21 5m39 0 21-6'} fill="none" strokeWidth="4" />
        {worried && <path d="M236 83q16 17 0 20-14-2 0-20Z" fill="#a3c8e3" strokeWidth="2" />}
      </g>
    </g>
  </svg>
})

export function Boss() {
  const hp = useGameStore((s) => s.bossHp)
  const feedback = useGameStore((s) => s.feedback)
  const status = useGameStore((s) => s.status)
  const eventId = useGameStore((s) => s.eventId)
  const combo = useGameStore((s) => s.combo)
  const questionIndex = useGameStore((s) => s.questionIndex)
  const phase = useGameStore((s) => s.phase)

  const strongHit = combo >= 5
  const hurt = feedback === 'correct' && status === 'playing'
  const excited = combo >= 3 && status === 'playing' && !hurt
  const encouraging = feedback === 'wrong' && status === 'playing'
  const celebrating = questionIndex > 0 && questionIndex % 5 === 0 && phase === 'correct'

  const getSpeech = () => {
    if (status === 'victory') return '好吧，你才是小博士！'
    if (status === 'menu') return '嘿嘿，接住我的数学泡泡！'
    if (hurt) {
      const hurtMessages = ['哎呀！', '好痛！', '我的眼镜！']
      return hurtMessages[eventId % 3]
    }
    if (encouraging) return '别着急，再试一次！'
    if (celebrating) return '你真是数学天才！'
    if (excited) return '太棒了！继续保持！'
    if (hp <= 20) return '等等…让我想想！'
    return '下一道，来啦！'
  }

  const speech = getSpeech()
  const labIntensity = getLabIntensity(questionIndex, combo)
  const bubbleCount = labIntensity.bubbleCount

  return <div className={`boss-stage ${hp <= 20 ? 'boss-worried' : ''} ${excited ? 'boss-excited' : ''} ${encouraging ? 'boss-encouraging' : ''}`}>
    <div className="boss-speech">{speech}<span aria-hidden="true">✦</span></div>
    <div key={hurt ? `doctor-${eventId}` : 'idle'} className={`doctor ${hurt ? 'doctor-hit' : ''} ${strongHit ? 'hit-strong' : ''} ${status === 'victory' ? 'doctor-defeated' : ''} ${excited ? 'doctor-excited' : ''} ${encouraging ? 'doctor-encouraging' : ''}`}>
      <DoctorIllustration hurt={hurt} worried={hp <= 20} defeated={status === 'victory'} excited={excited} encouraging={encouraging} />
    </div>
    {hurt ? <div key={`damage-${eventId}`} className="damage-number" aria-hidden="true">−5<span>答案命中！</span></div> : null}

    {Array.from({ length: bubbleCount }, (_, i) => {
      const positions = [
        { left: '15%', top: '46px' },
        { right: '18%', top: '91px' },
        { left: '8%', top: '75px' },
        { right: '10%', top: '60px' },
        { left: '22%', top: '100px' },
        { right: '25%', top: '45px' },
        { left: '12%', top: '55px' },
        { right: '15%', top: '80px' }
      ]
      const pos = positions[i] || positions[0]
      const chemicalType = i % 3

      return (
        <span
          key={i}
          className="lab-bubble"
          style={{
            ...pos,
            animationDelay: `${i * 0.15}s`
          }}
          data-chemical={chemicalType}
          aria-hidden="true"
        >
          <span className="liquid" />
        </span>
      )
    })}
  </div>
}
