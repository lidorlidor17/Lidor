import { Canvas } from '@react-three/fiber'
import {
  OrbitControls,
  Grid,
  Environment,
  Sky,
} from '@react-three/drei'
import * as THREE from 'three'
import { BESSComponent } from '../../types'
import { BESSComponent3D } from './BESSComponent3D'

interface BESSScene3DProps {
  components: BESSComponent[]
  scale: number
  sunAngle?: number
  shadowsEnabled?: boolean
}

export interface BESSScene3DCanvasProps extends BESSScene3DProps {
  onResetView?: () => void
}

// ------------------------------------------------------------------
// Inner scene (rendered inside Canvas)
// ------------------------------------------------------------------
function BESSScene({
  components,
  scale,
  sunAngle = 45,
  shadowsEnabled = true,
}: BESSScene3DProps) {
  // Convert sun angle (0–180 degrees) to a directional light position
  const sunRad = (sunAngle * Math.PI) / 180
  const sunX = Math.cos(sunRad) * 30
  const sunY = Math.abs(Math.sin(sunRad)) * 30 + 5
  const sunZ = 10

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight
        position={[sunX, sunY, sunZ]}
        intensity={1.2}
        castShadow={shadowsEnabled}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={200}
        shadow-camera-left={-80}
        shadow-camera-right={80}
        shadow-camera-top={80}
        shadow-camera-bottom={-80}
      />
      <hemisphereLight
        color={new THREE.Color('#87ceeb')}
        groundColor={new THREE.Color('#4a7c40')}
        intensity={0.3}
      />

      {/* Sky */}
      <Sky
        distance={450000}
        sunPosition={[sunX, sunY, sunZ]}
        inclination={0.5}
        azimuth={0.25}
      />

      {/* Camera controls */}
      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.05}
        minDistance={5}
        maxDistance={300}
        maxPolarAngle={Math.PI / 2 - 0.05}
      />

      {/* Ground plane */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.01, 0]}
        receiveShadow={shadowsEnabled}
      >
        <planeGeometry args={[500, 500]} />
        <meshStandardMaterial color="#3d6b35" roughness={0.9} metalness={0} />
      </mesh>

      {/* Grid helper */}
      <Grid
        position={[0, 0, 0]}
        args={[200, 200]}
        cellSize={5}
        cellThickness={0.5}
        cellColor="#4a7c40"
        sectionSize={20}
        sectionThickness={1}
        sectionColor="#2d5a27"
        fadeDistance={150}
        fadeStrength={1}
        infiniteGrid
      />

      {/* Environment for reflections */}
      <Environment preset="park" />

      {/* BESS Components */}
      {components.map((component) => (
        <BESSComponent3D
          key={component.id}
          component={component}
          scale={scale}
          canvasWidth={1000}
          canvasHeight={800}
        />
      ))}

      {/* Empty site placeholder when no components */}
      {components.length === 0 && (
        <EmptySitePlaceholder />
      )}
    </>
  )
}

// Shown when the site has no components yet
function EmptySitePlaceholder() {
  return (
    <group>
      {/* Site boundary outline via thin box edges */}
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(60, 0.1, 40)]} />
        <lineBasicMaterial color="#facc15" linewidth={2} />
      </lineSegments>
      {/* Dashed boundary fence suggestion */}
      {[[-30, 0], [30, 0], [0, -20], [0, 20]].map(([x, z], i) => (
        <mesh key={i} position={[x as number, 1, z as number]}>
          <boxGeometry args={[0.2, 2, 0.2]} />
          <meshStandardMaterial color="#facc15" />
        </mesh>
      ))}
    </group>
  )
}

// ------------------------------------------------------------------
// Exported canvas wrapper
// ------------------------------------------------------------------
export function BESSScene3DCanvas({
  components,
  scale,
  sunAngle = 45,
  shadowsEnabled = true,
}: BESSScene3DCanvasProps) {
  return (
    <Canvas
      camera={{ position: [50, 50, 50], fov: 55 }}
      style={{ background: '#1a1d2e', width: '100%', height: '100%' }}
      shadows={shadowsEnabled}
    >
      <BESSScene
        components={components}
        scale={scale}
        sunAngle={sunAngle}
        shadowsEnabled={shadowsEnabled}
      />
    </Canvas>
  )
}
