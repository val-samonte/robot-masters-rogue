import { useAtomValue } from 'jotai'
import { Stage, Container, Graphics, Text, PixiComponent } from '@pixi/react'
import { useCallback, useMemo, useEffect, useState } from 'react'
import { Graphics as PixiGraphics } from '@pixi/graphics'
import { charactersAtom, spawnsAtom, gameStateAtom } from '../atoms/gameState'
import { CharacterRenderData, SpawnRenderData } from '../atoms/gameState'

// Canvas configuration - Robot Masters game dimensions
const BASE_CANVAS_WIDTH = 256
const BASE_CANVAS_HEIGHT = 240
const TILE_SIZE = 16
const MIN_SCALE = 1.0
const MAX_SCALE = 4.0

// Colors
const BACKGROUND_COLOR = 0x2c3e50
const GRID_COLOR = 0x34495e
const CHARACTER_COLOR = 0x3498db
const SPAWN_COLOR = 0xe74c3c
const TEXT_COLOR = 0xffffff

// Custom Rectangle component using PixiComponent
interface RectangleProps {
  x?: number
  y?: number
  width: number
  height: number
  fill?: number
  stroke?: { color: number; width: number }
  alpha?: number
}

const Rectangle = PixiComponent<RectangleProps, PixiGraphics>('Rectangle', {
  create() {
    return new PixiGraphics()
  },
  applyProps(instance, _oldProps, newProps) {
    const { x = 0, y = 0, width, height, fill, stroke, alpha = 1 } = newProps

    instance.clear()
    instance.position.set(x, y)
    instance.alpha = alpha

    if (fill !== undefined) {
      instance.beginFill(fill)
      instance.drawRect(0, 0, width, height)
      instance.endFill()
    }

    if (stroke) {
      instance.lineStyle(stroke.width, stroke.color)
      instance.drawRect(0, 0, width, height)
    }
  },
})

interface TileBlockProps {
  x: number
  y: number
}

function TileBlock({ x, y }: TileBlockProps) {
  return (
    <Container x={x} y={y}>
      <Rectangle
        width={TILE_SIZE}
        height={TILE_SIZE}
        fill={0x8b4513} // Brown color for blocks
      />
      <Rectangle
        width={TILE_SIZE}
        height={TILE_SIZE}
        stroke={{ color: 0x654321, width: 1 }}
      />
    </Container>
  )
}

interface TilemapProps {
  width: number
  height: number
  tilemap?: number[][]
}

function Tilemap({ width, height, tilemap }: TilemapProps) {
  console.log('Tilemap render - tilemap data:', tilemap)

  const drawBackground = useCallback(
    (g: any) => {
      g.clear()
      // Draw background fill
      g.beginFill(0x1a1a1a, 0.8)
      g.drawRect(0, 0, width, height)
      g.endFill()
    },
    [width, height]
  )

  const drawGrid = useCallback(
    (g: any) => {
      g.clear()
      g.lineStyle(1, GRID_COLOR, 0.3)

      // Draw vertical lines
      for (let x = 0; x <= width; x += TILE_SIZE) {
        g.moveTo(x, 0)
        g.lineTo(x, height)
      }

      // Draw horizontal lines
      for (let y = 0; y <= height; y += TILE_SIZE) {
        g.moveTo(0, y)
        g.lineTo(width, y)
      }
    },
    [width, height]
  )

  return (
    <Container>
      {/* Background */}
      <Graphics draw={drawBackground} />

      {/* Tile blocks using declarative approach */}
      {tilemap &&
        tilemap.map((row, rowIndex) =>
          row.map((tileType, colIndex) => {
            if (tileType === 1) {
              return (
                <TileBlock
                  key={`tile-${rowIndex}-${colIndex}`}
                  x={colIndex * TILE_SIZE}
                  y={rowIndex * TILE_SIZE}
                />
              )
            }
            return null
          })
        )}

      {/* Grid overlay */}
      <Graphics draw={drawGrid} />
    </Container>
  )
}

interface CharacterBodyProps {
  width: number
  height: number
}

function CharacterBody({ width, height }: CharacterBodyProps) {
  return (
    <Container>
      <Rectangle width={width} height={height} fill={CHARACTER_COLOR} />
      <Rectangle
        width={width}
        height={height}
        stroke={{ color: 0xffffff, width: 1 }}
      />
    </Container>
  )
}

interface HealthBarProps {
  width: number
  health: number
  maxHealth: number
  y: number
}

function HealthBar({ width, health, maxHealth, y }: HealthBarProps) {
  const healthBarHeight = 4
  const healthPercent = health / maxHealth
  const healthColor =
    healthPercent > 0.5 ? 0x2ecc71 : healthPercent > 0.25 ? 0xf39c12 : 0xe74c3c

  return (
    <Container y={y}>
      <Rectangle
        width={width}
        height={healthBarHeight}
        fill={0x000000}
        alpha={0.5}
      />
      <Rectangle
        width={width * healthPercent}
        height={healthBarHeight}
        fill={healthColor}
      />
    </Container>
  )
}

interface EnergyBarProps {
  width: number
  energy: number
  maxEnergy: number
  y: number
}

function EnergyBar({ width, energy, maxEnergy, y }: EnergyBarProps) {
  const energyBarHeight = 4
  const energyPercent = energy / maxEnergy

  return (
    <Container y={y}>
      <Rectangle
        width={width}
        height={energyBarHeight}
        fill={0x000000}
        alpha={0.5}
      />
      <Rectangle
        width={width * energyPercent}
        height={energyBarHeight}
        fill={0x9b59b6}
      />
    </Container>
  )
}

interface FacingIndicatorProps {
  facing: number
  width: number
  height: number
}

function FacingIndicator({ facing, width, height }: FacingIndicatorProps) {
  const drawIndicator = useCallback(
    (g: any) => {
      g.clear()
      const facingX = facing === 1 ? width - 2 : 2
      g.beginFill(0xffffff)
      g.drawCircle(facingX, height / 2, 2)
      g.endFill()
    },
    [facing, width, height]
  )

  return <Graphics draw={drawIndicator} />
}

interface CharacterEntityProps {
  character: CharacterRenderData
}

function CharacterEntity({ character }: CharacterEntityProps) {
  console.log(
    'Drawing character:',
    character.id,
    'at position:',
    character.position,
    'size:',
    character.size
  )

  return (
    <Container x={character.position.x} y={character.position.y}>
      <CharacterBody
        width={character.size.width}
        height={character.size.height}
      />
      <HealthBar
        width={character.size.width}
        health={character.health}
        maxHealth={100}
        y={-8}
      />
      <EnergyBar
        width={character.size.width}
        energy={character.energy}
        maxEnergy={100}
        y={-14}
      />
      <FacingIndicator
        facing={character.facing}
        width={character.size.width}
        height={character.size.height}
      />
      <Text
        text={`ID: ${character.id}`}
        style={
          {
            fontSize: 10,
            fill: TEXT_COLOR,
          } as any
        }
        x={0}
        y={character.size.height + 2}
      />
    </Container>
  )
}

interface SpawnBodyProps {
  width: number
  height: number
}

function SpawnBody({ width, height }: SpawnBodyProps) {
  return <Rectangle width={width} height={height} fill={SPAWN_COLOR} />
}

interface LifespanBarProps {
  width: number
  lifespanRemaining: number
  maxLifespan: number
}

function LifespanBar({
  width,
  lifespanRemaining,
  maxLifespan,
}: LifespanBarProps) {
  if (lifespanRemaining <= 0) return null

  const lifespanBarHeight = 2
  const lifespanPercent = Math.min(lifespanRemaining / maxLifespan, 1)

  return (
    <Container y={-6}>
      <Rectangle
        width={width}
        height={lifespanBarHeight}
        fill={0x000000}
        alpha={0.5}
      />
      <Rectangle
        width={width * lifespanPercent}
        height={lifespanBarHeight}
        fill={0xf1c40f}
      />
    </Container>
  )
}

interface SpawnEntityProps {
  spawn: SpawnRenderData
}

function SpawnEntity({ spawn }: SpawnEntityProps) {
  return (
    <Container x={spawn.position.x} y={spawn.position.y}>
      <SpawnBody width={spawn.size.width} height={spawn.size.height} />
      <LifespanBar
        width={spawn.size.width}
        lifespanRemaining={spawn.lifespan_remaining}
        maxLifespan={300}
      />
      <Text
        text={`S${spawn.id}`}
        style={
          {
            fontSize: 8,
            fill: TEXT_COLOR,
          } as any
        }
        x={0}
        y={spawn.size.height + 2}
      />
    </Container>
  )
}

interface GameCanvasProps {
  className?: string
}

export function GameCanvas({ className = '' }: GameCanvasProps) {
  const characters = useAtomValue(charactersAtom)
  const spawns = useAtomValue(spawnsAtom)
  const gameState = useAtomValue(gameStateAtom)

  // Debug logging
  useEffect(() => {
    console.log('GameCanvas render - Characters:', characters)
    console.log('GameCanvas render - Spawns:', spawns)
    console.log('GameCanvas render - GameState:', gameState)
  }, [characters, spawns, gameState])

  // Responsive canvas sizing
  const [containerSize, setContainerSize] = useState({
    width: BASE_CANVAS_WIDTH,
    height: BASE_CANVAS_HEIGHT,
  })

  useEffect(() => {
    const updateSize = () => {
      // For the small game resolution, we want to scale it up for visibility
      // Default to 2x scale, but allow responsive scaling
      const defaultScale = 2
      const maxWidth = Math.min(window.innerWidth - 200, BASE_CANVAS_WIDTH * 4)
      const maxHeight = Math.min(
        window.innerHeight - 300,
        BASE_CANVAS_HEIGHT * 4
      )

      // Calculate scale based on available space
      const scaleX = maxWidth / BASE_CANVAS_WIDTH
      const scaleY = maxHeight / BASE_CANVAS_HEIGHT
      const scale = Math.max(defaultScale, Math.min(scaleX, scaleY))

      const width = BASE_CANVAS_WIDTH * scale
      const height = BASE_CANVAS_HEIGHT * scale

      setContainerSize({ width: Math.floor(width), height: Math.floor(height) })
    }

    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [])

  // Calculate scaling based on container size
  const scale = useMemo(() => {
    const scaleX = containerSize.width / BASE_CANVAS_WIDTH
    const scaleY = containerSize.height / BASE_CANVAS_HEIGHT
    const calculatedScale = Math.min(scaleX, scaleY)
    return Math.max(MIN_SCALE, Math.min(MAX_SCALE, calculatedScale))
  }, [containerSize])

  const stageOptions = useMemo(
    () => ({
      width: containerSize.width,
      height: containerSize.height,
      options: {
        backgroundColor: BACKGROUND_COLOR,
        antialias: true,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
      },
    }),
    [containerSize]
  )

  if (!gameState) {
    return (
      <div
        className={`bg-gray-800 rounded-lg flex items-center justify-center ${className}`}
        style={{ width: containerSize.width, height: containerSize.height }}
      >
        <p className="text-white text-lg">No game loaded</p>
      </div>
    )
  }

  return (
    <div className={`bg-gray-800 rounded-lg overflow-hidden ${className}`}>
      <Stage {...stageOptions}>
        <Container scale={scale}>
          {/* Tilemap background */}
          <Tilemap
            width={BASE_CANVAS_WIDTH}
            height={BASE_CANVAS_HEIGHT}
            tilemap={gameState.tilemap}
          />

          {/* Render characters */}
          {characters.map((character) => (
            <CharacterEntity key={character.id} character={character} />
          ))}

          {/* Render spawns */}
          {spawns.map((spawn) => (
            <SpawnEntity key={spawn.id} spawn={spawn} />
          ))}

          {/* Game info overlay */}
          <Container x={10} y={10}>
            <Text
              text={`Frame: ${gameState.frame} | Status: ${gameState.status}`}
              style={
                {
                  fontSize: 14,
                  fill: TEXT_COLOR,
                  fontFamily: 'monospace',
                } as any
              }
            />
            <Text
              text={`Characters: ${characters.length} | Spawns: ${spawns.length}`}
              style={
                {
                  fontSize: 12,
                  fill: TEXT_COLOR,
                  fontFamily: 'monospace',
                } as any
              }
              y={20}
            />
          </Container>
        </Container>
      </Stage>
    </div>
  )
}
