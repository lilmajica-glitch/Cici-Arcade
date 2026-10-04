import { useState, useEffect } from 'react'
import { useGameInput } from './hooks/useGameInput'
import { useAudioLifecycle } from './hooks/useAudioLifecycle'
import { gameController } from './game/GameController'
import { FestivalGame } from './components/FestivalGame'
import { IntroScreen } from './components/IntroScreen'
import './styles/tokens.css'
import './styles/festival.css'

export default function AppWithIntro() {
  const [showIntro, setShowIntro] = useState(() => {
    // 检查是否是首次访问
    const hasSeenIntro = sessionStorage.getItem('hasSeenIntro')
    return hasSeenIntro !== 'true'
  })

  useGameInput()
  useAudioLifecycle()

  useEffect(() => {
    return () => gameController.dispose()
  }, [])

  const handleIntroComplete = () => {
    setShowIntro(false)
    sessionStorage.setItem('hasSeenIntro', 'true')
  }

  if (showIntro) {
    return <IntroScreen onComplete={handleIntroComplete} />
  }

  return <FestivalGame />
}
