import { useState } from 'react'
import { ThreeEvent } from '@react-three/fiber'
import { Text as Text3D } from '@react-three/drei'
import * as THREE from 'three'
import { BESSComponent } from '../../types'
import {
  canvasTo3D,
  getComponent3DDimensions,
  getComponentColor,
} from '../../utils/bess3DHelpers'

interface BESSComponent3DProps {
  component: BESSComponent
  scale: number
  canvasWidth?: number
  canvasHeight?: number
}

/** Roof ridge for control_room — a simple triangular prism above the box. */
function ControlRoomRoof({
  w,
  d,
  baseY,
}: {
  w: number
  d: number
  baseY: number
}) {
  const ridgeHeight = 1.2
  // Build a simple triangular prism using BufferGeometry
  const shape = new THREE.Shape()
  shape.moveTo(-w / 2, 0)
  shape.lineTo(w / 2, 0)
  shape.lineTo(0, ridgeHeight)
  shape.closePath()

  const extrudeSettings: THREE.ExtrudeGeometryOptions = {
    depth: d,
    bevelEnabled: false,
  }

  return (
    <mesh
      position={[0, baseY, d / 2]}
      rotation={[Math.PI / 2, 0, 0]}
      castShadow
    >
      <extrudeGeometry args={[shape, extrudeSettings]} />
      <meshStandardMaterial color="#374151" />
    </mesh>
  )
}

export function BESSComponent3D({
  component,
  scale,
  canvasWidth = 1000,
  canvasHeight = 800,
}: BESSComponent3DProps) {
  const [hovered, setHovered] = useState(false)

  const dims = getComponent3DDimensions(component.component_type)
  const baseColor = getComponentColor(component.component_type)

  // Position: use the centre of the 2D canvas rect → 3D world position
  const cx = component.x + component.width / 2
  const cy = component.y + component.height / 2
  const [worldX, , worldZ] = canvasTo3D(cx, cy, canvasWidth, canvasHeight, scale)

  // The box sits on the ground (y = 0), so position its centre at h/2
  const posY = dims.h / 2

  // Scale the width/depth by the 2D component's pixel size and scale factor so
  // the 3D footprint matches the 2D layout.  Heights stay physically correct.
  const footprintW = component.width * scale
  const footprintD = component.height * scale

  // For road and fence: use footprint from canvas, but respect minimum dims
  const isFlat =
    component.component_type === 'road' ||
    component.component_type === 'grounding_grid'
  const isFence = component.component_type === 'fence'

  const boxW = isFlat || isFence ? footprintW : Math.max(footprintW, dims.w)
  const boxD = isFlat || isFence ? footprintD : Math.max(footprintD, dims.d)
  const boxH = dims.h

  const isControlRoom = component.component_type === 'control_room'

  const handlePointerOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    setHovered(true)
  }
  const handlePointerOut = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    setHovered(false)
  }

  const rotation = component.rotation
    ? ([0, (-component.rotation * Math.PI) / 180, 0] as [number, number, number])
    : ([0, 0, 0] as [number, number, number])

  const labelY = boxH + 0.8
  const displayName =
    component.label.length > 18
      ? component.label.slice(0, 16) + '…'
      : component.label

  return (
    <group position={[worldX, 0, worldZ]} rotation={rotation}>
      {/* Main box */}
      <mesh
        position={[0, posY, 0]}
        castShadow
        receiveShadow
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <boxGeometry args={[boxW, boxH, boxD]} />
        <meshStandardMaterial
          color={hovered ? '#facc15' : baseColor}
          roughness={0.6}
          metalness={component.component_type === 'transformer' ? 0.4 : 0.1}
          emissive={hovered ? '#7a6000' : '#000000'}
          emissiveIntensity={hovered ? 0.3 : 0}
        />
      </mesh>

      {/* Control room gets a roof */}
      {isControlRoom && (
        <ControlRoomRoof w={boxW} d={boxD} baseY={boxH} />
      )}

      {/* Floating label */}
      <Text3D
        position={[0, labelY, 0]}
        fontSize={0.8}
        color={hovered ? '#facc15' : '#ffffff'}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.05}
        outlineColor="#000000"
        renderOrder={1}
      >
        {displayName}
      </Text3D>
    </group>
  )
}
