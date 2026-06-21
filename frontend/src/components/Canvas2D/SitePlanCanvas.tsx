import { useCallback, useEffect, useRef, useState } from 'react'
import { Stage, Layer, Rect, Line, Text, Group } from 'react-konva'
import type Konva from 'konva'
import { useSiteStore } from '../../store/siteStore'
import { componentsApi } from '../../api/client'
import type { BESSComponent, ComponentType } from '../../types'

const COMPONENT_COLORS: Record<ComponentType, string> = {
  battery_container: '#16a34a',
  pcs: '#3b82f6',
  transformer: '#f97316',
  control_room: '#6b7280',
  substation: '#ef4444',
  fence: '#94a3b8',
  road: '#4b5563',
  text_annotation: 'transparent',
  boundary: 'transparent',
  fire_suppression: '#ef4444',
  grounding_grid: '#eab308',
}

const COMPONENT_LABELS: Record<ComponentType, string> = {
  battery_container: 'BESS',
  pcs: 'PCS',
  transformer: 'TX',
  control_room: 'Control',
  substation: 'SUB',
  fence: 'Fence',
  road: 'Road',
  text_annotation: 'Text',
  boundary: 'Boundary',
  fire_suppression: 'Fire',
  grounding_grid: 'Ground',
}

const DEFAULT_SIZES: Record<ComponentType, { width: number; height: number }> = {
  battery_container: { width: 80, height: 40 },
  pcs: { width: 40, height: 30 },
  transformer: { width: 50, height: 50 },
  control_room: { width: 100, height: 60 },
  substation: { width: 80, height: 60 },
  fence: { width: 120, height: 80 },
  road: { width: 150, height: 30 },
  text_annotation: { width: 100, height: 30 },
  boundary: { width: 200, height: 150 },
  fire_suppression: { width: 40, height: 40 },
  grounding_grid: { width: 80, height: 80 },
}

interface GhostComponent {
  x: number
  y: number
  type: ComponentType
}

interface ComponentShapeProps {
  comp: BESSComponent
  isSelected: boolean
  onSelect: (id: string) => void
  onDragEnd: (id: string, x: number, y: number) => void
}

function ComponentShape({ comp, isSelected, onSelect, onDragEnd }: ComponentShapeProps) {
  const color = COMPONENT_COLORS[comp.component_type]
  const label = COMPONENT_LABELS[comp.component_type]
  const isDashed = comp.component_type === 'fence' || comp.component_type === 'boundary'
  const isTextOnly = comp.component_type === 'text_annotation'

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    onDragEnd(comp.id, e.target.x(), e.target.y())
  }

  if (isTextOnly) {
    return (
      <Group
        x={comp.x}
        y={comp.y}
        draggable
        onClick={() => onSelect(comp.id)}
        onDragEnd={handleDragEnd}
      >
        <Text
          text={comp.label || 'Text'}
          fontSize={14}
          fill="#f0c040"
          fontStyle="bold"
        />
      </Group>
    )
  }

  const subText = comp.component_type === 'battery_container' && comp.properties.capacity_kwh
    ? `${comp.properties.capacity_kwh}kWh`
    : comp.component_type === 'pcs' && comp.properties.power_kw
    ? `${comp.properties.power_kw}kW`
    : comp.component_type === 'transformer' && comp.properties.voltage_kv
    ? `${comp.properties.voltage_kv}kV`
    : ''

  return (
    <Group
      x={comp.x}
      y={comp.y}
      rotation={comp.rotation}
      draggable
      onClick={() => onSelect(comp.id)}
      onDragEnd={handleDragEnd}
    >
      <Rect
        width={comp.width}
        height={comp.height}
        fill={isDashed ? 'transparent' : color + '33'}
        stroke={isSelected ? '#60a5fa' : color}
        strokeWidth={isSelected ? 2.5 : 1.5}
        dash={isDashed ? [8, 4] : undefined}
        cornerRadius={2}
      />
      {isSelected && (
        <Rect
          x={-2}
          y={-2}
          width={comp.width + 4}
          height={comp.height + 4}
          fill="transparent"
          stroke="#60a5fa"
          strokeWidth={1}
          opacity={0.5}
          dash={[4, 4]}
        />
      )}
      <Text
        text={label}
        x={0}
        y={comp.height / 2 - (subText ? 12 : 7)}
        width={comp.width}
        align="center"
        fontSize={11}
        fontStyle="bold"
        fill={isDashed ? color : '#ffffff'}
      />
      {subText && (
        <Text
          text={subText}
          x={0}
          y={comp.height / 2 + 2}
          width={comp.width}
          align="center"
          fontSize={9}
          fill={isDashed ? color : '#d1fae5'}
        />
      )}
      {comp.label && comp.label !== label && (
        <Text
          text={comp.label}
          x={0}
          y={comp.height + 2}
          width={comp.width}
          align="center"
          fontSize={9}
          fill="#94a3b8"
        />
      )}
    </Group>
  )
}

function GhostShape({ ghost }: { ghost: GhostComponent }) {
  const color = COMPONENT_COLORS[ghost.type]
  const label = COMPONENT_LABELS[ghost.type]
  const size = DEFAULT_SIZES[ghost.type]
  const isDashed = ghost.type === 'fence' || ghost.type === 'boundary'

  return (
    <Group x={ghost.x - size.width / 2} y={ghost.y - size.height / 2} opacity={0.6}>
      <Rect
        width={size.width}
        height={size.height}
        fill={isDashed ? 'transparent' : color + '44'}
        stroke={color}
        strokeWidth={1.5}
        dash={[6, 3]}
        cornerRadius={2}
      />
      <Text
        text={label}
        x={0}
        y={size.height / 2 - 7}
        width={size.width}
        align="center"
        fontSize={11}
        fontStyle="bold"
        fill={isDashed ? color : '#ffffff'}
      />
    </Group>
  )
}

export function SitePlanCanvas() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [stageSize, setStageSize] = useState({ width: 800, height: 600 })
  const [ghost, setGhost] = useState<GhostComponent | null>(null)
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 })
  const [stageScale, setStageScale] = useState(1)

  const {
    components,
    drawingMode,
    selectedComponentType,
    selectedComponentId,
    showGrid,
    scale,
    activeSite,
    addComponent,
    updateComponent,
    setSelectedComponentId,
    setDrawingMode,
  } = useSiteStore()

  // Resize observer
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) {
        setStageSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        })
      }
    })
    observer.observe(el)
    setStageSize({ width: el.clientWidth, height: el.clientHeight })
    return () => observer.disconnect()
  }, [])

  const handleMouseMove = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (drawingMode !== 'place_component' || !selectedComponentType) return
    const stage = e.target.getStage()
    if (!stage) return
    const pos = stage.getPointerPosition()
    if (!pos) return
    // Convert to stage coordinates accounting for stage position/scale
    const x = (pos.x - stagePos.x) / stageScale
    const y = (pos.y - stagePos.y) / stageScale
    setGhost({ x, y, type: selectedComponentType })
  }, [drawingMode, selectedComponentType, stagePos, stageScale])

  const handleStageClick = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (drawingMode !== 'place_component' || !selectedComponentType || !activeSite) return
    const stage = e.target.getStage()
    if (!stage) return
    const pos = stage.getPointerPosition()
    if (!pos) return

    const x = (pos.x - stagePos.x) / stageScale
    const y = (pos.y - stagePos.y) / stageScale
    const size = DEFAULT_SIZES[selectedComponentType]

    const newComp: BESSComponent = {
      id: `comp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      site_id: activeSite.id,
      component_type: selectedComponentType,
      label: COMPONENT_LABELS[selectedComponentType],
      x: x - size.width / 2,
      y: y - size.height / 2,
      width: size.width,
      height: size.height,
      rotation: 0,
      properties: {},
    }

    addComponent(newComp)

    // POST to API (fire and forget - don't block UI)
    componentsApi.add(activeSite.id, newComp).catch((err) => {
      console.warn('Failed to save component to API:', err)
    })
  }, [drawingMode, selectedComponentType, activeSite, addComponent, stagePos, stageScale])

  const handleBackgroundClick = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    // Only deselect if clicking the background rect
    if (e.target === e.target.getStage() || e.target.name() === 'background') {
      if (drawingMode === 'select') {
        setSelectedComponentId(null)
      }
    }
  }, [drawingMode, setSelectedComponentId])

  const handleComponentSelect = useCallback((id: string) => {
    if (drawingMode === 'select') {
      setSelectedComponentId(id)
    }
  }, [drawingMode, setSelectedComponentId])

  const handleDragEnd = useCallback((id: string, x: number, y: number) => {
    updateComponent(id, { x, y })
    if (activeSite) {
      componentsApi.update(activeSite.id, id, { x, y }).catch(console.warn)
    }
  }, [updateComponent, activeSite])

  // Wheel zoom
  const handleWheel = useCallback((e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault()
    const scaleBy = 1.08
    const stage = e.target.getStage()
    if (!stage) return
    const oldScale = stageScale
    const pointer = stage.getPointerPosition()
    if (!pointer) return

    const mousePointTo = {
      x: (pointer.x - stagePos.x) / oldScale,
      y: (pointer.y - stagePos.y) / oldScale,
    }

    const newScale = e.evt.deltaY < 0
      ? Math.min(oldScale * scaleBy, 8)
      : Math.max(oldScale / scaleBy, 0.1)

    setStageScale(newScale)
    setStagePos({
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    })
  }, [stageScale, stagePos])

  // Grid lines
  const gridLines: React.ReactElement[] = []
  if (showGrid) {
    const gridSpacing = 20 // 20px = 20*scale meters
    const offsetX = stagePos.x % (gridSpacing * stageScale)
    const offsetY = stagePos.y % (gridSpacing * stageScale)
    const numCols = Math.ceil(stageSize.width / (gridSpacing * stageScale)) + 1
    const numRows = Math.ceil(stageSize.height / (gridSpacing * stageScale)) + 1

    for (let i = 0; i < numCols; i++) {
      gridLines.push(
        <Line
          key={`v-${i}`}
          points={[offsetX + i * gridSpacing * stageScale, 0, offsetX + i * gridSpacing * stageScale, stageSize.height]}
          stroke="#2a3050"
          strokeWidth={1}
          listening={false}
        />
      )
    }
    for (let j = 0; j < numRows; j++) {
      gridLines.push(
        <Line
          key={`h-${j}`}
          points={[0, offsetY + j * gridSpacing * stageScale, stageSize.width, offsetY + j * gridSpacing * stageScale]}
          stroke="#2a3050"
          strokeWidth={1}
          listening={false}
        />
      )
    }
  }

  // Scale bar: 100m = 100/scale pixels
  const scaleBarPx = 100 / scale
  const scaleBarX = 20
  const scaleBarY = stageSize.height - 40

  // Handle ESC to exit place mode
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setDrawingMode('select')
        setGhost(null)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [setDrawingMode])

  const cursor = drawingMode === 'place_component' ? 'crosshair' : 'default'

  return (
    <div
      ref={containerRef}
      style={{
        flex: 1,
        background: '#1e2130',
        overflow: 'hidden',
        position: 'relative',
        cursor,
      }}
    >
      <Stage
        width={stageSize.width}
        height={stageSize.height}
        x={stagePos.x}
        y={stagePos.y}
        scaleX={stageScale}
        scaleY={stageScale}
        onMouseMove={handleMouseMove}
        onClick={drawingMode === 'place_component' ? handleStageClick : handleBackgroundClick}
        onWheel={handleWheel}
        draggable={drawingMode === 'select' && selectedComponentId === null}
        onDragEnd={(e) => {
          setStagePos({ x: e.target.x(), y: e.target.y() })
        }}
      >
        {/* Grid layer - rendered in screen space, outside stage transform */}
        <Layer listening={false}>
          {showGrid && gridLines}
          {/* Background */}
          <Rect
            x={-stagePos.x / stageScale}
            y={-stagePos.y / stageScale}
            width={stageSize.width / stageScale}
            height={stageSize.height / stageScale}
            fill="transparent"
            name="background"
          />
        </Layer>

        {/* Components layer */}
        <Layer>
          {components.map((comp) => (
            <ComponentShape
              key={comp.id}
              comp={comp}
              isSelected={comp.id === selectedComponentId}
              onSelect={handleComponentSelect}
              onDragEnd={handleDragEnd}
            />
          ))}
          {ghost && <GhostShape ghost={ghost} />}
        </Layer>

        {/* UI Overlay layer - fixed to screen */}
        <Layer listening={false}>
          {/* Scale bar */}
          <Group
            x={scaleBarX - stagePos.x / stageScale}
            y={scaleBarY / stageScale - stagePos.y / stageScale}
          >
            <Rect x={0} y={0} width={scaleBarPx} height={4} fill="#f0c040" cornerRadius={2} />
            <Rect x={0} y={-2} width={2} height={8} fill="#f0c040" />
            <Rect x={scaleBarPx - 2} y={-2} width={2} height={8} fill="#f0c040" />
            <Text text="100m" x={scaleBarPx / 2 - 16} y={8} fontSize={10} fill="#f0c040" />
          </Group>

          {/* North Arrow */}
          <Group
            x={(stageSize.width - 40) / stageScale - stagePos.x / stageScale}
            y={40 / stageScale - stagePos.y / stageScale}
          >
            <Line
              points={[0, -20, 0, 0]}
              stroke="#f0c040"
              strokeWidth={2}
              lineCap="round"
            />
            <Line
              points={[-5, -10, 0, -20, 5, -10]}
              stroke="#f0c040"
              strokeWidth={2}
              fill="#f0c040"
              closed
            />
            <Text text="N" x={-5} y={2} fontSize={12} fontStyle="bold" fill="#f0c040" />
          </Group>

          {/* Drawing mode hint */}
          {drawingMode === 'place_component' && selectedComponentType && (
            <Group
              x={(stageSize.width / 2 - 120) / stageScale - stagePos.x / stageScale}
              y={10 / stageScale - stagePos.y / stageScale}
            >
              <Rect width={240} height={24} fill="#1a1d2e" cornerRadius={4} opacity={0.85} />
              <Text
                text={`לחץ למיקום ${COMPONENT_LABELS[selectedComponentType]} | ESC לביטול`}
                x={8}
                y={5}
                fontSize={11}
                fill="#f0c040"
                width={224}
                align="center"
              />
            </Group>
          )}
        </Layer>
      </Stage>
    </div>
  )
}
