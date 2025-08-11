import { atom } from 'jotai'
import { GameWrapper } from 'wasm-wrapper'

// Types for game state data
export interface GameConfig {
  [key: string]: any
}

export interface GameStateData {
  frame: number
  status: string
  characters: CharacterRenderData[]
  spawns: SpawnRenderData[]
  status_effects: StatusEffect[]
  tilemap: number[][]
}

export interface CharacterRenderData {
  id: number
  position: { x: number; y: number }
  size: { width: number; height: number }
  health: number
  energy: number
  facing: number
  velocity: { x: number; y: number }
  collision: {
    top: boolean
    bottom: boolean
    left: boolean
    right: boolean
  }
}

export interface SpawnRenderData {
  id: number
  position: { x: number; y: number }
  size: { width: number; height: number }
  lifespan_remaining: number
  properties: { [key: string]: any }
}

export interface StatusEffect {
  id: number
  entity_id: number
  effect_type: string
  duration_remaining: number
  stack_count: number
}

export interface FrameInfo {
  frame: number
  status: string
  is_ended: boolean
}

// Core game state atoms
export const gameWrapperAtom = atom<GameWrapper | null>(null)
export const gameConfigAtom = atom<GameConfig | null>(null)
export const gameStateAtom = atom<GameStateData | null>(null)

// Entity rendering state (what Jotai is actually for)
export const charactersAtom = atom<CharacterRenderData[]>([])
export const spawnsAtom = atom<SpawnRenderData[]>([])

// Simple UI state
export const isPlayingAtom = atom<boolean>(false)
export const currentFrameAtom = atom<number>(0)
export const frameInfoAtom = atom<FrameInfo | null>(null)

// Error handling
export const gameErrorAtom = atom<string | null>(null)

// Derived atoms for easier state management
export const isGameInitializedAtom = atom((get) => {
  const wrapper = get(gameWrapperAtom)
  return wrapper ? wrapper.is_game_initialized() : false
})

export const isGameEndedAtom = atom((get) => {
  const wrapper = get(gameWrapperAtom)
  return wrapper ? wrapper.is_game_ended() : false
})
