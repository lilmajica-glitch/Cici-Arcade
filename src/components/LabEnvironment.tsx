import { memo } from 'react'

interface LabEnvironmentProps {
  stage: number
  chaosLevel: 'calm' | 'active' | 'festival'
}

const PeriodicTable = memo(function PeriodicTable() {
  return <svg className="periodic-table" viewBox="0 0 180 120" aria-hidden="true">
    <rect x="10" y="10" width="160" height="100" fill="#f6faef" stroke="#617767" strokeWidth="2" rx="4" />
    <text x="90" y="30" fontSize="11" fontWeight="700" fill="#283e38" textAnchor="middle">元素周期表</text>
    <g fill="#82bca4" opacity="0.6">
      <rect x="20" y="40" width="14" height="14" rx="2" />
      <rect x="38" y="40" width="14" height="14" rx="2" />
      <rect x="56" y="40" width="14" height="14" rx="2" />
      <rect x="74" y="40" width="14" height="14" rx="2" />
      <rect x="20" y="58" width="14" height="14" rx="2" />
      <rect x="38" y="58" width="14" height="14" rx="2" />
      <rect x="56" y="58" width="14" height="14" rx="2" />
      <rect x="74" y="58" width="14" height="14" rx="2" />
      <rect x="110" y="40" width="14" height="14" rx="2" />
      <rect x="128" y="40" width="14" height="14" rx="2" />
      <rect x="146" y="40" width="14" height="14" rx="2" />
    </g>
  </svg>
})

const Microscope = memo(function Microscope() {
  return <svg className="lab-microscope" viewBox="0 0 60 80" aria-hidden="true">
    <g stroke="#7A8B99" strokeWidth="2" fill="none">
      <circle cx="30" cy="20" r="8" fill="#38BDF8" opacity="0.3" />
      <path d="M30,28 L30,45" strokeWidth="3" />
      <ellipse cx="30" cy="50" rx="12" ry="6" fill="#7A8B99" />
      <path d="M18,50 L42,50 L40,70 L20,70 Z" fill="#8B7355" stroke="#617767" />
    </g>
  </svg>
})

const BunsenBurner = memo(function BunsenBurner({ lit }: { lit: boolean }) {
  return <svg className="bunsen-burner" viewBox="0 0 40 70" aria-hidden="true" data-lit={lit}>
    <defs>
      <radialGradient id="flame-gradient">
        <stop offset="0%" stopColor="#E9A568" />
        <stop offset="50%" stopColor="#f0cb68" />
        <stop offset="100%" stopColor="transparent" />
      </radialGradient>
    </defs>
    <path d="M15,50 L15,65 L25,65 L25,50" fill="#7A8B99" stroke="#617767" strokeWidth="1.5" />
    <ellipse cx="20" cy="50" rx="6" ry="3" fill="#283e38" />
    {lit && (
      <g className="flame">
        <ellipse cx="20" cy="42" rx="8" ry="12" fill="url(#flame-gradient)" opacity="0.8" />
        <ellipse cx="20" cy="38" rx="5" ry="8" fill="#38BDF8" opacity="0.6" />
      </g>
    )}
  </svg>
})

const TestTubeRack = memo(function TestTubeRack({ stage }: { stage: number }) {
  const tubes = [
    { color: '#ed9b87', height: 70 },
    { color: '#86bfb4', height: 55 },
    { color: '#b7a3d4', height: 80 },
    { color: '#efc26e', height: 65 }
  ]

  return <svg className="test-tube-rack" viewBox="0 0 100 90" aria-hidden="true">
    <path d="M10,60 L90,60 L85,70 L15,70 Z" fill="#8B7355" stroke="#617767" strokeWidth="2" />
    {tubes.map((tube, i) => (
      <g key={i} transform={`translate(${20 + i * 18}, 0)`}>
        <rect x="-3" y="30" width="6" height="30" rx="3" fill="none" stroke="#7A8B99" strokeWidth="1.5" />
        <rect
          x="-2.5"
          y={60 - tube.height * (stage / 6)}
          width="5"
          height={tube.height * (stage / 6)}
          fill={tube.color}
          opacity="0.7"
          rx="2"
        />
        {stage >= 3 && (
          <circle
            cx="0"
            cy={55 - tube.height * (stage / 6) + Math.random() * 10}
            r="1.5"
            fill="white"
            opacity="0.6"
            className="bubble-rise"
          />
        )}
      </g>
    ))}
  </svg>
})

const Beaker = memo(function Beaker({ stage, side }: { stage: number; side: 'left' | 'right' }) {
  const liquidHeight = 30 + (stage * 5)
  const color = side === 'left' ? '#38BDF8' : '#6EE7B7'

  return <svg className={`lab-beaker beaker-${side}`} viewBox="0 0 50 70" aria-hidden="true" data-active={stage >= 1}>
    <defs>
      <clipPath id={`beaker-clip-${side}`}>
        <path d="M10,10 L10,55 Q10,60 15,60 L35,60 Q40,60 40,55 L40,10 Z" />
      </clipPath>
    </defs>
    <path d="M10,10 L10,55 Q10,60 15,60 L35,60 Q40,60 40,55 L40,10 Z"
      fill="var(--lab-glass)"
      stroke="#7A8B99"
      strokeWidth="2"
    />
    <rect
      x="10"
      y={60 - liquidHeight}
      width="30"
      height={liquidHeight}
      fill={color}
      opacity="0.6"
      clipPath={`url(#beaker-clip-${side})`}
    />
    {stage >= 3 && Array.from({ length: 3 }, (_, i) => (
      <circle
        key={i}
        cx={15 + i * 7}
        cy={55 - liquidHeight + 5 + i * 3}
        r="2"
        fill="white"
        opacity="0.5"
        className="bubble-rise"
        style={{ animationDelay: `${i * 0.3}s` }}
      />
    ))}
    <line x1="12" y1="20" x2="38" y2="20" stroke="#7A8B99" strokeWidth="1" opacity="0.3" />
    <line x1="12" y1="35" x2="38" y2="35" stroke="#7A8B99" strokeWidth="1" opacity="0.3" />
  </svg>
})

const SafetyPoster = memo(function SafetyPoster() {
  return <svg className="safety-poster" viewBox="0 0 100 120" aria-hidden="true">
    <rect x="5" y="5" width="90" height="110" fill="#fffdf2" stroke="#617767" strokeWidth="2" rx="3" />
    <text x="50" y="25" fontSize="10" fontWeight="800" fill="#283e38" textAnchor="middle">实验室安全</text>
    <g transform="translate(20, 40)">
      <circle cx="15" cy="15" r="12" fill="none" stroke="#e98975" strokeWidth="3" />
      <path d="M15,8 L15,16 M15,20 L15,22" stroke="#e98975" strokeWidth="3" strokeLinecap="round" />
    </g>
    <g transform="translate(50, 40)">
      <circle cx="15" cy="15" r="12" fill="#82bca4" stroke="#49745b" strokeWidth="2" />
      <path d="M10,15 L13,18 L20,11" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    </g>
  </svg>
})

export function LabEnvironment({ stage, chaosLevel }: LabEnvironmentProps) {
  return (
    <div className="lab-environment" data-lab-stage={stage} data-chaos={chaosLevel}>
      <div className="lab-wall-decor">
        <PeriodicTable />
        <SafetyPoster />
      </div>

      <div className="lab-equipment-left">
        <Microscope />
        <Beaker stage={stage} side="left" />
      </div>

      <div className="lab-equipment-right">
        <TestTubeRack stage={stage} />
        <Beaker stage={stage} side="right" />
      </div>

      <div className="lab-bench-equipment">
        <BunsenBurner lit={stage >= 3} />
      </div>
    </div>
  )
}
