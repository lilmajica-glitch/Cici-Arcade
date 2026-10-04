import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion'
import { Canvas } from '@react-three/fiber'
import { PerspectiveCamera, Environment } from '@react-three/drei'
import { Shoe } from './Shoe'
import { NeonTrack } from './NeonTrack'
import { ParticleSystem } from './ParticleSystem'
import './intro.css'

export const IntroVideo: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  // 时间轴分段 (60fps)
  // 0-90: 鞋子出现 (1.5s)
  // 90-180: 脚踝旋转热身 (1.5s)
  // 180-240: 蓄力停顿 (1s)
  // 240-330: 爆发起跑 (1.5s)
  // 330-420: 显露赛道 (1.5s)
  // 420-480: 冲入光门 (1s)

  // 动画进度计算
  const appearProgress = interpolate(frame, [0, 90], [0, 1], { extrapolateRight: 'clamp' })
  const rotationProgress = interpolate(frame, [90, 180], [0, 1], { extrapolateRight: 'clamp' })
  const chargeProgress = interpolate(frame, [180, 240], [0, 1], { extrapolateRight: 'clamp' })
  const sprintProgress = spring({
    frame: frame - 240,
    fps,
    config: { damping: 200, stiffness: 100, mass: 0.5 },
  })
  const trackRevealProgress = interpolate(frame, [330, 420], [0, 1], { extrapolateRight: 'clamp' })
  const gateProgress = interpolate(frame, [420, 480], [0, 1], { extrapolateRight: 'clamp' })

  // 相机动画
  const cameraY = interpolate(
    frame,
    [0, 90, 240, 330, 420, 480],
    [0.3, 0.3, 0.3, 0.5, 1.2, 2.5],
    { extrapolateRight: 'clamp' }
  )

  const cameraZ = interpolate(
    frame,
    [0, 240, 330, 420, 480],
    [3, 3, 2, 1, 0.2],
    { extrapolateRight: 'clamp' }
  )

  // 光门强度
  const gateIntensity = interpolate(frame, [420, 460, 480], [0, 3, 10], { extrapolateRight: 'clamp' })

  // 粒子系统活跃度
  const particleIntensity = frame > 240 ? interpolate(frame, [240, 330], [0, 1], { extrapolateRight: 'clamp' }) : 0

  return (
    <AbsoluteFill style={{ backgroundColor: '#0a0014' }}>
      {/* 3D Canvas */}
      <Canvas>
        <PerspectiveCamera makeDefault position={[0, cameraY, cameraZ]} fov={50} />

        {/* 环境光 */}
        <ambientLight intensity={0.2} />
        <pointLight position={[0, 2, 2]} intensity={0.5} color="#8b5cf6" />

        {/* 地面光 */}
        <pointLight position={[0, -1, 0]} intensity={chargeProgress * 2} color="#a855f7" />

        {/* 主鞋子模型 */}
        <Shoe
          appearProgress={appearProgress}
          rotationProgress={rotationProgress}
          chargeProgress={chargeProgress}
          sprintProgress={sprintProgress}
        />

        {/* 霓虹赛道 */}
        {trackRevealProgress > 0 && (
          <NeonTrack revealProgress={trackRevealProgress} />
        )}

        {/* 粒子系统 */}
        {particleIntensity > 0 && (
          <ParticleSystem intensity={particleIntensity} />
        )}

        {/* 环境贴图 */}
        <Environment preset="night" />
      </Canvas>

      {/* 光门特效 (2D overlay) */}
      {gateProgress > 0 && (
        <div className="neon-gate" style={{ opacity: gateProgress }}>
          <div className="gate-glow" style={{
            boxShadow: `0 0 ${gateIntensity * 50}px ${gateIntensity * 20}px rgba(168, 85, 247, ${gateProgress})`,
            background: `radial-gradient(ellipse, rgba(168, 85, 247, ${gateProgress * 0.8}), transparent 70%)`
          }} />
        </div>
      )}

      {/* 底部反光效果 */}
      <div className="ground-reflection" style={{
        opacity: interpolate(frame, [0, 90], [0, 0.3], { extrapolateRight: 'clamp' })
      }} />

      {/* Vignette */}
      <div className="vignette" />
    </AbsoluteFill>
  )
}
