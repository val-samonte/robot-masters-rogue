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

/**
 * Empty tilemap with only ground at the bottom
 */
const OPEN_TILEMAP = [
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // Empty top
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], // Ground only
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
  move_speed: [64, 32] as [number, number], // 2.0 in fixed-point
  armor: [0, 0, 0, 0, 0, 0, 0, 0, 0],
  energy_regen: 1,
  energy_regen_rate: 60,
  energy_charge: 5,
  energy_charge_rate: 30,
  dir: [1, 0] as [number, number], // Facing right
  enmity: 0,
  target_id: null,
  target_type: 0,
}

/**
 * Configuration for testing basic movement (character runs right)
 */
export const MOVE_RIGHT_CONFIG: GameConfig = {
  seed: 12345,
  tilemap: BASIC_TILEMAP,
  actions: [
    {
      energy_cost: 0,
      cooldown: 0,
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      spawns: [0, 0, 0, 0],
      script: [...ACTION_SCRIPTS.RUN], // Use the RUN action script
    },
  ],
  conditions: [
    {
      energy_mul: 32, // 1.0 in fixed-point
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      script: [...CONDITION_SCRIPTS.ALWAYS], // Always trigger
    },
  ],
  characters: [
    {
      ...BASIC_CHARACTER,
      behaviors: [[0, 0]], // Condition 0 triggers Action 0
    },
  ],
  spawns: [],
  status_effects: [],
}

/**
 * Configuration for testing jumping behavior
 */
export const JUMP_CONFIG: GameConfig = {
  seed: 12345,
  gravity: [1, 1], // Default downward gravity
  tilemap: BASIC_TILEMAP,
  actions: [
    {
      energy_cost: 10,
      cooldown: 30,
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      spawns: [0, 0, 0, 0],
      script: [...ACTION_SCRIPTS.JUMP], // Use the JUMP action script
    },
  ],
  conditions: [
    {
      energy_mul: 32, // 1.0 in fixed-point
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      script: [...CONDITION_SCRIPTS.IS_GROUNDED], // Only jump when grounded
    },
  ],
  characters: [
    {
      ...BASIC_CHARACTER,
      behaviors: [[0, 0]], // Condition 0 triggers Action 0
    },
  ],
  spawns: [],
  status_effects: [],
}

/**
 * Configuration for testing wall jumping
 */
export const WALL_JUMP_CONFIG: GameConfig = {
  seed: 12345,
  tilemap: BASIC_TILEMAP,
  actions: [
    {
      energy_cost: 15,
      cooldown: 20,
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      spawns: [0, 0, 0, 0],
      script: [...ACTION_SCRIPTS.WALL_JUMP], // Use the WALL_JUMP action script
    },
  ],
  conditions: [
    {
      energy_mul: 32, // 1.0 in fixed-point
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      script: [...CONDITION_SCRIPTS.IS_WALL_SLIDING], // Only wall jump when wall sliding
    },
  ],
  characters: [
    {
      ...BASIC_CHARACTER,
      behaviors: [[0, 0]], // Condition 0 triggers Action 0
    },
  ],
  spawns: [],
  status_effects: [],
}

/**
 * Configuration for testing energy charging
 */
export const CHARGE_CONFIG: GameConfig = {
  seed: 12345,
  tilemap: BASIC_TILEMAP,
  actions: [
    {
      energy_cost: 0,
      cooldown: 0,
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      spawns: [0, 0, 0, 0],
      script: [...ACTION_SCRIPTS.CHARGE], // Use the CHARGE action script
    },
  ],
  conditions: [
    {
      energy_mul: 32, // 1.0 in fixed-point
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      script: [...CONDITION_SCRIPTS.ENERGY_LOW_20], // Charge when energy is low
    },
  ],
  characters: [
    {
      ...BASIC_CHARACTER,
      energy: 10, // Start with low energy
      behaviors: [[0, 0]], // Condition 0 triggers Action 0
    },
  ],
  spawns: [],
  status_effects: [],
}

/**
 * Configuration for testing random behavior
 */
export const RANDOM_CONFIG: GameConfig = {
  seed: 12345,
  tilemap: BASIC_TILEMAP,
  actions: [
    {
      energy_cost: 0,
      cooldown: 0,
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      spawns: [0, 0, 0, 0],
      script: [...ACTION_SCRIPTS.RUN], // Use the RUN action script
    },
    {
      energy_cost: 0,
      cooldown: 0,
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      spawns: [0, 0, 0, 0],
      script: [...ACTION_SCRIPTS.TURN_AROUND], // Use the TURN_AROUND action script
    },
  ],
  conditions: [
    {
      energy_mul: 32, // 1.0 in fixed-point
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      script: [...CONDITION_SCRIPTS.CHANCE_50], // 50% chance to run
    },
    {
      energy_mul: 32, // 1.0 in fixed-point
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      script: [...CONDITION_SCRIPTS.CHANCE_10], // 10% chance to turn around
    },
  ],
  characters: [
    {
      ...BASIC_CHARACTER,
      behaviors: [
        [0, 0], // 50% chance to run
        [1, 1], // 10% chance to turn around
      ],
    },
  ],
  spawns: [],
  status_effects: [],
}

/**
 * Configuration for testing low gravity jumping (moon-like gravity)
 */
export const LOW_GRAVITY_CONFIG: GameConfig = {
  seed: 12345,
  gravity: [1, 4], // Quarter gravity (0.25) - much lighter
  tilemap: BASIC_TILEMAP,
  actions: [
    {
      energy_cost: 10,
      cooldown: 15, // Faster cooldown for low gravity
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      spawns: [0, 0, 0, 0],
      script: [...ACTION_SCRIPTS.JUMP],
    },
  ],
  conditions: [
    {
      energy_mul: 0, // No energy multiplier
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      script: [...CONDITION_SCRIPTS.ALWAYS], // Always trigger
    },
  ],
  characters: [
    {
      ...BASIC_CHARACTER,
      behaviors: [[0, 0]], // Always jump
    },
  ],
  spawns: [],
  status_effects: [],
}

/**
 * Configuration for testing inverted gravity (upside-down world)
 */
export const INVERTED_GRAVITY_CONFIG: GameConfig = {
  seed: 12345,
  gravity: [-1, 1], // Inverted gravity (upward)
  tilemap: BASIC_TILEMAP,
  actions: [
    {
      energy_cost: 10,
      cooldown: 30,
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      spawns: [0, 0, 0, 0],
      script: [...ACTION_SCRIPTS.JUMP],
    },
  ],
  conditions: [
    {
      energy_mul: 0,
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      script: [...CONDITION_SCRIPTS.CHANCE_20], // 20% chance to jump
    },
  ],
  characters: [
    {
      ...BASIC_CHARACTER,
      dir: [1, 2], // Facing right, upward gravity direction
      behaviors: [[0, 0]], // 20% chance to jump
    },
  ],
  spawns: [],
  status_effects: [],
}

/**
 * Available configuration presets
 */
export const GAME_CONFIGS = {
  MOVE_RIGHT: MOVE_RIGHT_CONFIG,
  JUMP: JUMP_CONFIG,
  WALL_JUMP: WALL_JUMP_CONFIG,
  CHARGE: CHARGE_CONFIG,
  RANDOM: RANDOM_CONFIG,
  LOW_GRAVITY: LOW_GRAVITY_CONFIG,
  INVERTED_GRAVITY: INVERTED_GRAVITY_CONFIG,
} as const

export type GameConfigType = keyof typeof GAME_CONFIGS

/**
 * Get a game configuration by name
 */
export function getGameConfig(configName: GameConfigType): GameConfig {
  return GAME_CONFIGS[configName]
}

/**
 * List all available configuration names
 */
export function getAvailableConfigs(): GameConfigType[] {
  return Object.keys(GAME_CONFIGS) as GameConfigType[]
}
