import { useCallback, useEffect, useRef, useState } from 'react'
import { Stage, Layer, Rect, Text, Group, Line } from 'react-konva'
import type Konva from 'konva'
import { useSiteStore } from '../../store/siteStore'
import { componentsApi } from '../../api/client'
import type { ComponentInstance, ComponentTypeDefinition } from '../../types'

const SELECTED_STROKE = '#1d4ed8'
const GRID_SIZE = 20
const GHOST_OPACITY = 0.4
// 1 pixel = 0.1 m  →  200px = 20m
const PIXELS_PER_METER = 10
const SCALE_BAR_METERS = 20

const TYPE_LABELS: Record<string, string> = {
  'battery-container': 'BESS',
  'pcs-inverter': 'PCS',
  'transformer': 'XFMR',
  'rmu': 'RMU',
  'electrical-panel': 'PANEL',
  'network-switch': 'SW',
  'ems-plc-dio-controller': 'EMS',
}

const TYPE_PRIMARY_FIELD: Record<string, string> = {
  'battery-container': 'capacityKWh',
  'pcs-inverter': 'ratedPowerKW',
  'transformer': 'ratedPowerKVA',
  'rmu': 'ratedVoltage',
  'electrical-panel': 'ratedCurrent',
  'network-switch': 'numberOfRJ45Ports',
}

interface Props {
  projectId: string
  width: number
  height: number
}

function ComponentShape({
  comp,
  typeDef,
  isSelected,
  onSelect,
  onDragEnd,
}: {
  comp: ComponentInstance
  typeDef: ComponentTypeDefinition | undefined
  isSelected: boolean
  onSelect: (id: string) => void
  onDragEnd: (id: string, x: number, y: number) => void
}) {
  const w = comp.width ?? typeDef?.default_width ?? 235
  const h = comp.height ?? typeDef?.default_height ?? 138
  const color = typeDef?.default_color ?? '#94a3b8'
  const label = TYPE_LABELS[comp.component_type_id] ?? comp.component_type_id.toUpperCase().slice(0, 4)
  const primaryKey = TYPE_PRIMARY_FIELD[comp.component_type_id]
  const primaryFv = primaryKey ? comp.field_values.find((fv) => fv.field_key === primaryKey) : null
  const caption = primaryFv ? `${primaryFv.value} ${primaryFv.unit}`.trim() : ''

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
        width={w} height={h}
        fill={color} opacity={0.22}
        stroke={isSelected ? SELECTED_STROKE : color}
        strokeWidth={isSelected ? 2.5 : 1.5}
        cornerRadius={4}
      />
      <Text
        text={label}
        x={0} y={h / 2 - 14} width={w}
        align="center" fontSize={14} fontStyle="bold" fill="#1c1917"
      />
      {caption ? (
        <Text text={caption} x={0} y={h / 2 + 2} width={w} align="center" fontSize={11} fill="#44403c" />
      ) : null}
      <Text text={comp.name} x={0} y={h + 4} width={w} align="center" fontSize={11} fill="#1c1917" />
    </Group>
  )
}

function GridLines({ width, height }: { width: number; height: number }) {
  const lines = []
  for (let x = 0; x < width; x += GRID_SIZE)
    lines.push(<Line key={`v${x}`} points={[x, 0, x, height]} stroke="#e2e8f0" strokeWidth={0.5} />)
  for (let y = 0; y < height; y += GRID_SIZE)
    lines.push(<Line key={`h${y}`} points={[0, y, width, y]} stroke="#e2e8f0" strokeWidth={0.5} />)
  return <>{lines}</>
}

function ScaleBar({ canvasHeight }: { canvasHeight: number }) {
  const barPx = SCALE_BAR_METERS * PIXELS_PER_METER
  const x = 20
  const y = canvasHeight - 28
  return (
    <Group x={x} y={y} listening={false}>
      <Rect x={0} y={-2} width={barPx + 4} height={18} fill="rgba(255,255,255,0.75)" cornerRadius={3} />
      <Line points={[2, 10, barPx + 2, 10]} stroke="#64748b" strokeWidth={2} />
      <Line points={[2, 5, 2, 15]} stroke="#64748b" strokeWidth={2} />
      <Line points={[barPx + 2, 5, barPx + 2, 15]} stroke="#64748b" strokeWidth={2} />
      <Text text={`${SCALE_BAR_METERS} m`} x={barPx / 2 - 10} y={0} fontSize={10} fill="#475569" />
    </Group>
  )
}

export function SitePlanCanvas({ projectId, width, height }: Props) {
  const { components, componentTypes, drawingMode, placingTypeId, selectedComponentId, showGrid,
    addComponent, updateComponent, setSelectedComponentId, stopPlacing } = useSiteStore()

  const [ghost, setGhost] = useState<{ x: number; y: number } | null>(null)
  const stageRef = useRef<Konva.Stage>(null)

  const placingType = componentTypes.find((ct) => ct.id === placingTypeId)
  const ghostW = placingType?.default_width ?? 235
  const ghostH = placingType?.default_height ?? 138
  const ghostColor = placingType?.default_color ?? '#94a3b8'

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') stopPlacing() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [stopPlacing])

  const handleMouseMove = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (drawingMode !== 'place_component') { setGhost(null); return }
      const pos = e.target.getStage()?.getPointerPosition()
      if (pos) setGhost({ x: pos.x - ghostW / 2, y: pos.y - ghostH / 2 })
    },
    [drawingMode, ghostW, ghostH]
  )

  const handleMouseLeave = useCallback(() => setGhost(null), [])

  const handleStageClick = useCallback(
    async (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (drawingMode !== 'place_component' || !placingTypeId) return
      if (e.target !== e.target.getStage()) return
      const pos = e.target.getStage()?.getPointerPosition()
      if (!pos) return

      const x = pos.x - ghostW / 2
      const y = pos.y - ghostH / 2
      const typeLabel = TYPE_LABELS[placingTypeId] ?? placingTypeId
      const count = components.filter((c) => c.component_type_id === placingTypeId).length + 1

      try {
        const resp = await componentsApi.add(projectId, {
          component_type_id: placingTypeId,
          name: `${typeLabel} ${count}`,
          x, y,
        })
        addComponent(resp.data)
      } catch (err) {
        console.error('Failed to place component', err)
      }
    },
    [drawingMode, placingTypeId, projectId, components, addComponent, ghostW, ghostH]
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
      width={width} height={height}
      style={{ cursor: isPlacing ? 'crosshair' : 'default', background: '#f8fafc' }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handleStageClick}
    >
      <Layer>
        {showGrid && <GridLines width={width} height={height} />}

        {components.map((comp) => (
          <ComponentShape
            key={comp.id}
            comp={comp}
            typeDef={componentTypes.find((ct) => ct.id === comp.component_type_id)}
            isSelected={comp.id === selectedComponentId}
            onSelect={setSelectedComponentId}
            onDragEnd={handleDragEnd}
          />
        ))}

        {isPlacing && ghost && (
          <Group x={ghost.x} y={ghost.y} listening={false}>
            <Rect
              width={ghostW} height={ghostH}
              fill={ghostColor} opacity={GHOST_OPACITY}
              stroke={ghostColor} strokeWidth={1.5}
              dash={[6, 4]} cornerRadius={4}
            />
            <Text
              text={TYPE_LABELS[placingTypeId ?? ''] ?? '?'}
              x={0} y={ghostH / 2 - 7} width={ghostW}
              align="center" fontSize={14} fontStyle="bold" fill="#1c1917"
            />
          </Group>
        )}

        <ScaleBar canvasHeight={height} />
      </Layer>
    </Stage>
  )
}
