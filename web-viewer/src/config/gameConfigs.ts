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
  tilemap: number[][] // 2D array format as expected by WASM wrapper
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
 * 2D array format: 15 rows x 16 columns
 */
const BASIC_TILEMAP = [
  // Row 0 - Top wall
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  // Rows 1-13 - Side walls with empty space
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
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  // Row 14 - Bottom wall
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
]

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
  move_speed: [2, 1] as [number, number], // 2.0 in fixed-point
  armor: [0, 0, 0, 0, 0, 0, 0, 0, 0],
  energy_regen: 1,
  energy_regen_rate: 60,
  energy_charge: 5,
  energy_charge_rate: 30,
  dir: [2, 2] as [number, number], // Facing right, normal downward gravity
  enmity: 0,
  target_id: null,
  target_type: 0,
}

const conditions = [
  {
    energy_mul: 32,
    args: [0, 0, 0, 0, 0, 0, 0, 0],
    script: [...CONDITION_SCRIPTS.ALWAYS],
  },
  {
    energy_mul: 32,
    args: [0, 0, 0, 0, 0, 0, 0, 0],
    script: [...CONDITION_SCRIPTS.IS_GROUNDED],
  },
  {
    energy_mul: 32,
    args: [0, 0, 0, 0, 0, 0, 0, 0],
    script: [...CONDITION_SCRIPTS.IS_WALL_LEANING],
  },
  {
    energy_mul: 32,
    args: [0, 0, 0, 0, 0, 0, 0, 0],
    script: [...CONDITION_SCRIPTS.ONLY_ONCE],
  },
]
const actions = [
  {
    energy_cost: 0,
    cooldown: 0,
    args: [0, 0, 0, 0, 0, 0, 0, 0],
    spawns: [0, 0, 0, 0],
    script: [...ACTION_SCRIPTS.RUN],
  },
  {
    energy_cost: 0,
    cooldown: 0, // No cooldown - allow immediate turn-around
    args: [0, 0, 0, 0, 0, 0, 0, 0],
    spawns: [0, 0, 0, 0],
    script: [...ACTION_SCRIPTS.TURN_AROUND],
  },
  {
    energy_cost: 10,
    cooldown: 30, // 30 frame cooldown for jump
    args: [0, 0, 0, 0, 0, 0, 0, 0],
    spawns: [0, 0, 0, 0],
    script: [...ACTION_SCRIPTS.JUMP],
  },
  {
    energy_cost: 10,
    cooldown: 30, // 30 frame cooldown for jump
    args: [0, 0, 0, 0, 0, 0, 0, 0],
    spawns: [0, 0, 0, 0],
    script: [...ACTION_SCRIPTS.INVERT_GRAVITY],
  },
]

const basicGameConfig = {
  seed: 12345,
  gravity: [32, 64] as [number, number],
  tilemap: BASIC_TILEMAP,
  actions,
  conditions,
  spawns: [],
  status_effects: [],
}

export const RUN_AROUND: GameConfig = {
  ...basicGameConfig,
  characters: [
    {
      ...BASIC_CHARACTER,
      behaviors: [
        [2, 1], // Wall leaning -> TURN_AROUND (highest priority)
        [0, 0], // Always -> RUN (lowest priority)
      ],
    },
  ],
}

export const RUN_AND_JUMP: GameConfig = {
  ...basicGameConfig,
  characters: [
    {
      ...BASIC_CHARACTER,
      behaviors: [
        [2, 1], // Wall leaning -> TURN_AROUND (highest priority)
        [1, 2], // Is grounded -> JUMP
        [0, 0], // Always -> RUN (lowest priority)
      ],
    },
  ],
}

export const INVERTED_RUN: GameConfig = {
  ...basicGameConfig,
  characters: [
    {
      ...BASIC_CHARACTER,
      behaviors: [
        [3, 3], // Only once -> INVERT GRAVITY
        [2, 1], // Wall leaning -> TURN_AROUND (highest priority)
        [0, 0], // Always -> RUN (lowest priority)
      ],
    },
  ],
}

export const INVERTED_RUN_AND_JUMP: GameConfig = {
  ...basicGameConfig,
  characters: [
    {
      ...BASIC_CHARACTER,
      behaviors: [
        [3, 3], // Only once -> INVERT GRAVITY
        [2, 1], // Wall leaning -> TURN_AROUND (highest priority)
        [1, 2], // Is grounded -> JUMP
        [0, 0], // Always -> RUN (lowest priority)
      ],
    },
  ],
}

/**
 * Available configuration presets
 */
export const GAME_CONFIGS = {
  RUN_AROUND: RUN_AROUND,
  RUN_AND_JUMP: RUN_AND_JUMP,
  INVERTED_RUN: INVERTED_RUN,
  INVERTED_RUN_AND_JUMP: INVERTED_RUN_AND_JUMP,
} as const

export type ConfigName =
  | 'RUN_AROUND'
  | 'RUN_AND_JUMP'
  | 'INVERTED_RUN'
  | 'INVERTED_RUN_AND_JUMP'

/**
 * Get a game configuration by name
 */
export function getGameConfig(configName: ConfigName): GameConfig {
  return GAME_CONFIGS[configName]
}
