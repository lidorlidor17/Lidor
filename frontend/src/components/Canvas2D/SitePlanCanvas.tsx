import { useCallback, useEffect, useRef, useState } from 'react'
import { Stage, Layer, Rect, Text, Group, Line } from 'react-konva'
import type Konva from 'konva'
import { useSiteStore } from '../../store/siteStore'
import { componentsApi } from '../../api/client'
import type { ComponentInstance } from '../../types'

const BATTERY_COLOR = '#f97316'
const BATTERY_SELECTED_STROKE = '#1d4ed8'
const GRID_SIZE = 20
const GHOST_OPACITY = 0.45

interface Props {
  projectId: string
  width: number
  height: number
}

function BatteryShape({
  comp,
  isSelected,
  onSelect,
  onDragEnd,
}: {
  comp: ComponentInstance
  isSelected: boolean
  onSelect: (id: string) => void
  onDragEnd: (id: string, x: number, y: number) => void
}) {
  const w = comp.width ?? 235
  const h = comp.height ?? 138
  const capacityFv = comp.field_values.find((fv) => fv.field_key === 'capacityKWh')
  const caption = capacityFv ? `${capacityFv.value} kWh` : ''

  return (
    <Group
      x={comp.x}
      y={comp.y}
      draggable
      onClick={() => onSelect(comp.id)}
      onTap={() => onSelect(comp.id)}
      onDragEnd={(e: Konva.KonvaEventObject<DragEvent>) =>
        onDragEnd(comp.id, e.target.x(), e.target.y())
      }
    >
      <Rect
        width={w}
        height={h}
        fill={BATTERY_COLOR}
        opacity={0.25}
        stroke={isSelected ? BATTERY_SELECTED_STROKE : BATTERY_COLOR}
        strokeWidth={isSelected ? 2.5 : 1.5}
        cornerRadius={4}
      />
      <Text
        text="BESS"
        x={0}
        y={h / 2 - 14}
        width={w}
        align="center"
        fontSize={14}
        fontStyle="bold"
        fill="#1c1917"
      />
      {caption ? (
        <Text
          text={caption}
          x={0}
          y={h / 2 + 2}
          width={w}
          align="center"
          fontSize={11}
          fill="#44403c"
        />
      ) : null}
      <Text
        text={comp.name}
        x={0}
        y={h + 4}
        width={w}
        align="center"
        fontSize={11}
        fill="#1c1917"
      />
    </Group>
  )
}

function GridLines({ width, height }: { width: number; height: number }) {
  const vLines = []
  const hLines = []
  for (let x = 0; x < width; x += GRID_SIZE) {
    vLines.push(
      <Line key={`v${x}`} points={[x, 0, x, height]} stroke="#e2e8f0" strokeWidth={0.5} />
    )
  }
  for (let y = 0; y < height; y += GRID_SIZE) {
    hLines.push(
      <Line key={`h${y}`} points={[0, y, width, y]} stroke="#e2e8f0" strokeWidth={0.5} />
    )
  }
  return (
    <>
      {vLines}
      {hLines}
    </>
  )
}

export function SitePlanCanvas({ projectId, width, height }: Props) {
  const { components, drawingMode, placingTypeId, selectedComponentId, showGrid,
    addComponent, updateComponent, setSelectedComponentId, stopPlacing } = useSiteStore()

  const [ghost, setGhost] = useState<{ x: number; y: number } | null>(null)
  const stageRef = useRef<Konva.Stage>(null)

  // ESC cancels placement mode
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') stopPlacing()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [stopPlacing])

  const handleMouseMove = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (drawingMode !== 'place_component') {
        setGhost(null)
        return
      }
      const pos = e.target.getStage()?.getPointerPosition()
      if (pos) setGhost({ x: pos.x - (235 / 2), y: pos.y - (138 / 2) })
    },
    [drawingMode]
  )

  const handleMouseLeave = useCallback(() => setGhost(null), [])

  const handleStageClick = useCallback(
    async (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (drawingMode !== 'place_component' || !placingTypeId) return
      // Prevent clicks on existing shapes from triggering placement
      if (e.target !== e.target.getStage()) return

      const pos = e.target.getStage()?.getPointerPosition()
      if (!pos) return

      const x = pos.x - (235 / 2)
      const y = pos.y - (138 / 2)
      const count = components.length + 1

      try {
        const resp = await componentsApi.add(projectId, {
          component_type_id: placingTypeId,
          name: `Battery ${count}`,
          x,
          y,
        })
        addComponent(resp.data)
      } catch (err) {
        console.error('Failed to place component', err)
      }
    },
    [drawingMode, placingTypeId, projectId, components.length, addComponent]
  )

  const handleDragEnd = useCallback(
    async (id: string, x: number, y: number) => {
      updateComponent(id, { x, y })
      try {
        await componentsApi.updatePosition(projectId, id, x, y)
      } catch (err) {
        console.error('Failed to update position', err)
      }
    },
    [projectId, updateComponent]
  )

  const isPlacing = drawingMode === 'place_component'

  return (
    <Stage
      ref={stageRef}
      width={width}
      height={height}
      style={{ cursor: isPlacing ? 'crosshair' : 'default', background: '#f8fafc' }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handleStageClick}
    >
      <Layer>
        {showGrid && <GridLines width={width} height={height} />}

        {components.map((comp) => (
          <BatteryShape
            key={comp.id}
            comp={comp}
            isSelected={comp.id === selectedComponentId}
            onSelect={setSelectedComponentId}
            onDragEnd={handleDragEnd}
          />
        ))}

        {/* Ghost preview while placing */}
        {isPlacing && ghost && (
          <Group x={ghost.x} y={ghost.y} listening={false}>
            <Rect
              width={235}
              height={138}
              fill={BATTERY_COLOR}
              opacity={GHOST_OPACITY}
              stroke={BATTERY_COLOR}
              strokeWidth={1.5}
              dash={[6, 4]}
              cornerRadius={4}
            />
            <Text
              text="BESS"
              x={0}
              y={55}
              width={235}
              align="center"
              fontSize={14}
              fontStyle="bold"
              fill="#1c1917"
            />
          </Group>
        )}
      </Layer>
    </Stage>
  )
}
