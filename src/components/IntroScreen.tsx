import { useState, useRef, useEffect } from 'react'
import './IntroScreen.css'

interface IntroScreenProps {
  onComplete: () => void
}

export const IntroScreen: React.FC<IntroScreenProps> = ({ onComplete }) => {
  const [canSkip, setCanSkip] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    // 允许在2秒后跳过
    const timer = setTimeout(() => setCanSkip(true), 2000)
    return () => clearTimeout(timer)
  }, [])

  const handleSkip = () => {
    if (canSkip) {
      onComplete()
    }
  }

  const handleVideoEnd = () => {
    onComplete()
  }

  const handleVideoError = () => {
    // 如果视频加载失败，直接跳到游戏
    console.warn('Intro video failed to load, skipping to game')
    onComplete()
  }

  return (
    <div className="intro-screen">
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        onEnded={handleVideoEnd}
        onError={handleVideoError}
        className="intro-video"
      >
        <source src="/intro.mp4" type="video/mp4" />
      </video>

      {/* 跳过按钮 */}
      {canSkip && (
        <button
          className="skip-button"
          onClick={handleSkip}
          aria-label="跳过开场动画"
        >
          跳过 ⏭
        </button>
      )}

      {/* 加载提示 */}
      <div className="intro-loading">
        <div className="loading-spinner"></div>
      </div>
    </div>
  )
}
