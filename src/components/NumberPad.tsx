import { useRef, useState } from 'react'
import { useGameStore } from '../game/gameStore'
import { gameController } from '../game/GameController'
import { Icon } from './Icon'

const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'erase', '0', 'submit']
const notes: Record<string, string> = { '1': 'DO', '2': 'RE', '3': 'MI', '4': 'SOL', '5': 'LA', '6': 'DO', '7': 'RE', '8': 'MI', '9': 'SOL', '0': 'LA' }

function PadButton({ value, locked, empty }: { value: string; locked: boolean; empty: boolean }) {
  const [pressed, setPressed] = useState(false)
  const [releaseId, setReleaseId] = useState(0)
  const pointerHandled = useRef(false)
  const isUtility = value === 'erase' || value === 'submit'
  const disabled = locked || (isUtility && empty)
  const label = value === 'erase' ? '删除一位' : value === 'submit' ? '确认，发射答案' : `数字 ${value}`
  const release = () => { setPressed(false); setReleaseId((id) => id + 1) }

  return <button type="button" disabled={disabled} aria-label={label} data-key={value}
    className={`pad-button pad-${value} ${pressed ? 'is-pressed' : ''}`}
    onPointerDown={(event) => {
      if (event.button !== 0 || disabled) return
      pointerHandled.current = true
      setPressed(true)
      event.currentTarget.setPointerCapture(event.pointerId)
      gameController.input(value)
    }}
    onPointerUp={release}
    onPointerCancel={() => { pointerHandled.current = false; release() }}
    onLostPointerCapture={() => setPressed(false)}
    onClick={(event) => {
      if (event.detail === 0 || !pointerHandled.current) gameController.input(value)
      pointerHandled.current = false
    }}>
    <span key={releaseId} className={`pad-face ${releaseId ? 'pad-release' : ''}`}>
      {value === 'erase' ? <Icon name="erase" size={25} /> : value === 'submit' ? <Icon name="check" size={29} /> : <b>{value}</b>}
      <small>{value === 'erase' ? '删除' : value === 'submit' ? '发射' : notes[value]}</small>
    </span>
  </button>
}

export function NumberPad() {
  const locked = useGameStore((s) => s.phase !== 'answering')
  const empty = useGameStore((s) => s.input === '')
  const correct = useGameStore((s) => s.feedback === 'correct')
  return <div className={`number-pad ${correct ? 'pad-correct' : ''}`} role="group" aria-label="彩色数字乐器键盘">
    {keys.map((key) => <PadButton key={key} value={key} locked={locked} empty={empty} />)}
  </div>
}
