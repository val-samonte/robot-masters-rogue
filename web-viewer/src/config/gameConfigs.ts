/**
 * Game Configuration Templates
 *
 * Predefined game configurations using script constants for easy testing and development.
 * These configurations demonstrate different character behaviors and game scenarios.
 */

import { ACTION_SCRIPTS, CONDITION_SCRIPTS } from '../constants/scriptConstants'

export interface GameConfig {
  seed: number
  gravity?: [number, number] // Optional gravity as [numerator, denominator], defaults to [1, 1] (downward)
  tilemap: number[][] // 2D array as expected by WASM wrapper
  actions: Array<{
    energy_cost: number
    cooldown: number
    args: number[]
    spawns: number[]
    script: number[]
  }>
  conditions: Array<{
    energy_mul: number
    args: number[]
    script: number[]
  }>
  characters: Array<{
    id: number
    position: [[number, number], [number, number]]
    group: number
    size: [number, number]
    health: number
    health_cap: number
    energy: number
    energy_cap: number
    power: number
    weight: number
    jump_force: [number, number]
    move_speed: [number, number]
    armor: number[]
    energy_regen: number
    energy_regen_rate: number
    energy_charge: number
    energy_charge_rate: number
    dir: [number, number]
    enmity: number
    target_id: number | null
    target_type: number
    behaviors: [number, number][]
  }>
  spawns: any[]
  status_effects: any[] // Add missing status_effects field
}

/**
 * Basic tilemap with walls around the edges and empty space in the middle
 */
const BASIC_TILEMAP = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], // Top wall
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], // Side walls with empty space
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], // Bottom wall
]

// Removed unused OPEN_TILEMAP

/**
 * Basic character template with standard properties
 */
const BASIC_CHARACTER = {
  id: 1,
  position: [
    [32, 1],
    [192, 1],
  ] as [[number, number], [number, number]], // Position (2, 12) in pixels - above ground
  group: 1,
  size: [16, 32] as [number, number],
  health: 100,
  health_cap: 100,
  energy: 100,
  energy_cap: 100,
  power: 10,
  weight: 5,
  jump_force: [160, 32] as [number, number], // 5.0 in fixed-point
  move_speed: [64, 32] as [number, number], // 2.0 in fixed-point
  armor: [0, 0, 0, 0, 0, 0, 0, 0, 0],
  energy_regen: 1,
  energy_regen_rate: 60,
  energy_charge: 5,
  energy_charge_rate: 30,
  dir: [2, 0] as [number, number], // Facing right (0=left, 1=neutral, 2=right)
  enmity: 0,
  target_id: null,
  target_type: 0,
}

// All other configurations removed - only COMBINATION_1 is needed

/**
 * Configuration for testing updated movement actions with fixed collision detection and gravity
 * Tests: RUN, JUMP, WALL_JUMP, TURN_AROUND actions with proper physics
 */
export const COMBINATION_1_CONFIG: GameConfig = {
  seed: 12345,
  gravity: [32, 64], // 0.5 gravity for testing
  tilemap: BASIC_TILEMAP,
  actions: [
    // Action 0: TURN_AROUND (working)
    {
      energy_cost: 0,
      cooldown: 0, // No cooldown - allow immediate turn-around
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      spawns: [0, 0, 0, 0],
      script: [...ACTION_SCRIPTS.TURN_AROUND],
    },
    // Action 1: RUN (updated)
    {
      energy_cost: 0,
      cooldown: 0,
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      spawns: [0, 0, 0, 0],
      script: [...ACTION_SCRIPTS.RUN],
    },
    // Action 2: JUMP (updated)
    {
      energy_cost: 10,
      cooldown: 30, // 30 frame cooldown for jump
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      spawns: [0, 0, 0, 0],
      script: [...ACTION_SCRIPTS.JUMP],
    },
    // Action 3: WALL_JUMP (updated)
    {
      energy_cost: 15,
      cooldown: 60, // 60 frame cooldown for wall jump
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      spawns: [0, 0, 0, 0],
      script: [...ACTION_SCRIPTS.WALL_JUMP],
    },
  ],
  conditions: [
    // Condition 0: Wall leaning (for TURN_AROUND and WALL_JUMP)
    {
      energy_mul: 32,
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      script: [...CONDITION_SCRIPTS.IS_WALL_LEANING],
    },
    // Condition 1: Always (for RUN)
    {
      energy_mul: 32,
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      script: [...CONDITION_SCRIPTS.ALWAYS],
    },
  ],
  characters: [
    {
      ...BASIC_CHARACTER,
      behaviors: [
        [0, 0], // Wall leaning -> TURN_AROUND (highest priority)
        [1, 1], // Always -> RUN (lowest priority)
      ],
    },
  ],
  spawns: [],
  status_effects: [],
}

/**
 * Available configuration presets - simplified to only COMBINATION_1
 */
export const GAME_CONFIGS = {
  COMBINATION_1: COMBINATION_1_CONFIG,
} as const

/**
 * Get the COMBINATION_1 configuration
 */
export function getGameConfig(configName: 'COMBINATION_1'): GameConfig {
  return COMBINATION_1_CONFIG
}
