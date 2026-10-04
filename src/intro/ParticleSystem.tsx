import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Points, PointMaterial } from '@react-three/drei'
import * as THREE from 'three'

interface ParticleSystemProps {
  intensity: number
}

export const ParticleSystem: React.FC<ParticleSystemProps> = ({ intensity }) => {
  const particlesRef = useRef<THREE.Points>(null)

  // 生成粒子位置
  const particles = useMemo(() => {
    const count = 500
    const positions = new Float32Array(count * 3)

    for (let i = 0; i < count; i++) {
      const i3 = i * 3
      // 围绕鞋子和赛道的粒子云
      positions[i3] = (Math.random() - 0.5) * 6 // x
      positions[i3 + 1] = Math.random() * 3 - 0.5 // y
      positions[i3 + 2] = Math.random() * -10 // z
    }

    return positions
  }, [])

  useFrame(({ clock }) => {
    if (!particlesRef.current) return

    const positions = particlesRef.current.geometry.attributes.position.array as Float32Array

    for (let i = 0; i < positions.length; i += 3) {
      // 向后飘动，模拟速度感
      positions[i + 2] += intensity * 0.1

      // 重置超出范围的粒子
      if (positions[i + 2] > 2) {
        positions[i + 2] = -10
        positions[i] = (Math.random() - 0.5) * 6
        positions[i + 1] = Math.random() * 3 - 0.5
      }

      // 轻微上下波动
      positions[i + 1] += Math.sin(clock.elapsedTime + i) * 0.002
    }

    particlesRef.current.geometry.attributes.position.needsUpdate = true
  })

  return (
    <Points ref={particlesRef} positions={particles}>
      <PointMaterial
        transparent
        color="#a855f7"
        size={0.05}
        sizeAttenuation
        depthWrite={false}
        opacity={intensity * 0.6}
        blending={THREE.AdditiveBlending}
      />
    </Points>
  )
}
