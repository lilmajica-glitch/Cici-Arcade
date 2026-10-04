interface NeonTrackProps {
  revealProgress: number
}

export const NeonTrack: React.FC<NeonTrackProps> = ({ revealProgress }) => {
  return (
    <group position={[0, -0.3, -5]}>
      {/* 三条赛道 */}
      {[-1.5, 0, 1.5].map((x, i) => (
        <group key={i} position={[x, 0, 0]}>
          {/* 赛道地面 */}
          <mesh position={[0, 0, -10 * revealProgress]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[1, 20]} />
            <meshStandardMaterial
              color="#0f172a"
              metalness={0.8}
              roughness={0.2}
              transparent
              opacity={revealProgress * 0.8}
            />
          </mesh>

          {/* 赛道边缘霓虹线 */}
          <mesh position={[-0.52, 0.01, -10 * revealProgress]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.04, 20]} />
            <meshBasicMaterial
              color="#a855f7"
              transparent
              opacity={revealProgress}
              toneMapped={false}
            />
          </mesh>

          <mesh position={[0.52, 0.01, -10 * revealProgress]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.04, 20]} />
            <meshBasicMaterial
              color="#a855f7"
              transparent
              opacity={revealProgress}
              toneMapped={false}
            />
          </mesh>

          {/* 中央霓虹线 */}
          {i === 1 && (
            <mesh position={[0, 0.02, -10 * revealProgress]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[0.1, 20]} />
              <meshBasicMaterial
                color="#06b6d4"
                transparent
                opacity={revealProgress * 0.8}
                toneMapped={false}
              />
            </mesh>
          )}
        </group>
      ))}

      {/* 远处未来城市剪影 */}
      {revealProgress > 0.5 && (
        <group position={[0, 0, -20]}>
          {/* 左侧建筑 */}
          <mesh position={[-3, 2, 0]}>
            <boxGeometry args={[1, 4, 1]} />
            <meshBasicMaterial
              color="#1a0b2e"
              transparent
              opacity={(revealProgress - 0.5) * 2 * 0.6}
            />
          </mesh>

          {/* 右侧建筑 */}
          <mesh position={[3, 3, 0]}>
            <boxGeometry args={[1.5, 6, 1]} />
            <meshBasicMaterial
              color="#1a0b2e"
              transparent
              opacity={(revealProgress - 0.5) * 2 * 0.6}
            />
          </mesh>

          {/* 中央高楼 */}
          <mesh position={[0, 4, -2]}>
            <boxGeometry args={[2, 8, 1]} />
            <meshBasicMaterial
              color="#1a0b2e"
              transparent
              opacity={(revealProgress - 0.5) * 2 * 0.5}
            />
          </mesh>

          {/* 建筑霓虹点缀 */}
          <pointLight position={[-3, 3, 1]} intensity={revealProgress * 2} color="#a855f7" />
          <pointLight position={[3, 4, 1]} intensity={revealProgress * 2} color="#06b6d4" />
          <pointLight position={[0, 6, 0]} intensity={revealProgress * 1.5} color="#a855f7" />
        </group>
      )}

      {/* 前方光门框架 */}
      {revealProgress > 0.7 && (
        <group position={[0, 2, -15]}>
          <mesh position={[-2.5, 0, 0]}>
            <boxGeometry args={[0.2, 5, 0.2]} />
            <meshBasicMaterial
              color="#a855f7"
              toneMapped={false}
            />
          </mesh>

          <mesh position={[2.5, 0, 0]}>
            <boxGeometry args={[0.2, 5, 0.2]} />
            <meshBasicMaterial
              color="#a855f7"
              toneMapped={false}
            />
          </mesh>

          <mesh position={[0, 2.5, 0]}>
            <boxGeometry args={[5.2, 0.2, 0.2]} />
            <meshBasicMaterial
              color="#a855f7"
              toneMapped={false}
            />
          </mesh>
        </group>
      )}
    </group>
  )
}
