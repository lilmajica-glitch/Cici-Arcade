import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Mesh } from 'three'
import * as THREE from 'three'

interface ShoeProps {
  appearProgress: number
  rotationProgress: number
  chargeProgress: number
  sprintProgress: number
}

export const Shoe: React.FC<ShoeProps> = ({
  rotationProgress,
  chargeProgress,
  sprintProgress,
}) => {
  const shoeRef = useRef<Mesh>(null)
  const glowRef = useRef<Mesh>(null)

  useFrame(() => {
    if (!shoeRef.current) return

    // 脚踝旋转动画
    const rotationAngle = Math.sin(rotationProgress * Math.PI * 2) * 0.3
    shoeRef.current.rotation.z = rotationAngle

    // 蓄力时轻微下压
    const chargeOffset = chargeProgress > 0 ? Math.sin(chargeProgress * Math.PI) * -0.05 : 0

    // 起跑时的位移
    const sprintOffset = sprintProgress > 0 ? sprintProgress * -5 : 0

    shoeRef.current.position.y = chargeOffset
    shoeRef.current.position.z = sprintOffset

    // 光晕脉冲
    if (glowRef.current) {
      const pulse = Math.sin(Date.now() * 0.003) * 0.2 + 0.8
      glowRef.current.scale.setScalar(1 + chargeProgress * pulse * 0.3)
    }
  })

  return (
    <group position={[0, 0, 0]}>
      {/* 主鞋体 */}
      <mesh ref={shoeRef} position={[0, 0, 0]} rotation={[-0.2, 0.3, 0]}>
        {/* 鞋底 */}
        <group>
          <mesh position={[0, -0.15, 0]}>
            <boxGeometry args={[0.4, 0.1, 0.8]} />
            <meshStandardMaterial
              color="#1a1a2e"
              metalness={0.9}
              roughness={0.3}
            />
          </mesh>

          {/* 鞋底霓虹线条 */}
          <mesh position={[0, -0.1, 0]}>
            <boxGeometry args={[0.35, 0.02, 0.75]} />
            <meshStandardMaterial
              color="#a855f7"
              emissive="#8b5cf6"
              emissiveIntensity={1 + chargeProgress}
              toneMapped={false}
            />
          </mesh>
        </group>

        {/* 鞋身 */}
        <group>
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[0.35, 0.3, 0.7]} />
            <meshStandardMaterial
              color="#16213e"
              metalness={0.7}
              roughness={0.4}
            />
          </mesh>

          {/* 鞋面霓虹条纹 */}
          <mesh position={[-0.15, 0.05, 0.1]}>
            <boxGeometry args={[0.05, 0.25, 0.5]} />
            <meshStandardMaterial
              color="#a855f7"
              emissive="#a855f7"
              emissiveIntensity={1.5}
              toneMapped={false}
            />
          </mesh>

          <mesh position={[0, 0.05, 0.1]}>
            <boxGeometry args={[0.05, 0.25, 0.5]} />
            <meshStandardMaterial
              color="#06b6d4"
              emissive="#06b6d4"
              emissiveIntensity={1}
              toneMapped={false}
            />
          </mesh>

          <mesh position={[0.15, 0.05, 0.1]}>
            <boxGeometry args={[0.05, 0.25, 0.5]} />
            <meshStandardMaterial
              color="#a855f7"
              emissive="#a855f7"
              emissiveIntensity={1.5}
              toneMapped={false}
            />
          </mesh>
        </group>

        {/* 鞋舌 */}
        <mesh position={[0, 0.2, 0.3]}>
          <boxGeometry args={[0.25, 0.15, 0.1]} />
          <meshStandardMaterial
            color="#0f172a"
            metalness={0.5}
            roughness={0.6}
          />
        </mesh>
      </mesh>

      {/* 发光光晕 */}
      <mesh ref={glowRef} position={[0, -0.15, 0]}>
        <sphereGeometry args={[0.6, 32, 32]} />
        <meshBasicMaterial
          color="#a855f7"
          transparent
          opacity={chargeProgress * 0.3}
          side={THREE.BackSide}
        />
      </mesh>

      {/* 地面霓虹线圈 (蓄力时出现) */}
      {chargeProgress > 0 && (
        <mesh position={[0, -0.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.8, 1, 64]} />
          <meshBasicMaterial
            color="#a855f7"
            transparent
            opacity={chargeProgress * 0.6}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
    </group>
  )
}
