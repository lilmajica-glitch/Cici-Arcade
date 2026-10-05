import { useEffect } from 'react'
import { gameController } from './game/GameController'
import { useGameInput } from './hooks/useGameInput'
import { useAudioLifecycle } from './hooks/useAudioLifecycle'
import { FestivalGame } from './components/FestivalGame'
import { connectMathToArcade } from './game/arcadeBridge'
import './styles/tokens.css'
import './styles/festival.css'

export default function App() {
  useGameInput()
  useAudioLifecycle()
  useEffect(connectMathToArcade, [])
  useEffect(() => () => gameController.dispose(), [])
  return <FestivalGame />
}
