import { useEffect } from 'react'
import { gameController } from './game/GameController'
import { useGameInput } from './hooks/useGameInput'
import { useAudioLifecycle } from './hooks/useAudioLifecycle'
import { FestivalGame } from './components/FestivalGame'
import './styles/tokens.css'
import './styles/festival.css'

export default function App() {
  useGameInput()
  useAudioLifecycle()
  useEffect(() => () => gameController.dispose(), [])
  return <FestivalGame />
}
