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
  dir: [1, 0] as [number, number], // Facing right
  enmity: 0,
  target_id: null,
  target_type: 0,
}

// All other configurations removed - only COMBINATION_1 is needed

/**
 * Configuration for testing combination behaviors with priority system
 * Priority (highest to lowest):
 * 1. If wall leaning and not on ground - WALL JUMP
 * 2. If on ground - JUMP
 * 3. If wall leaning but on ground - TURN AROUND
 * 4. Always - RUN
 */
export const COMBINATION_1_CONFIG: GameConfig = {
  seed: 12345,
  gravity: [3, 2], // Stronger gravity (1.5) for more realistic physics
  tilemap: BASIC_TILEMAP,
  actions: [
    // Action 0: WALL_JUMP (highest priority)
    {
      energy_cost: 7,
      cooldown: 20,
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      spawns: [0, 0, 0, 0],
      script: [...ACTION_SCRIPTS.WALL_JUMP],
    },
    // Action 1: JUMP (second priority)
    {
      energy_cost: 3,
      cooldown: 30,
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      spawns: [0, 0, 0, 0],
      script: [...ACTION_SCRIPTS.JUMP],
    },
    // Action 2: TURN_AROUND (third priority)
    {
      energy_cost: 0,
      cooldown: 10,
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      spawns: [0, 0, 0, 0],
      script: [...ACTION_SCRIPTS.TURN_AROUND],
    },
    // Action 3: RUN (lowest priority - always)
    {
      energy_cost: 0,
      cooldown: 0,
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      spawns: [0, 0, 0, 0],
      script: [...ACTION_SCRIPTS.RUN],
    },
  ],
  conditions: [
    // Condition 0: Wall leaning and NOT on ground (for WALL_JUMP)
    {
      energy_mul: 32,
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      script: [
        // Check if NOT grounded (bottom collision = 0)
        15,
        0,
        40, // READ_PROP var[0] CHARACTER_COLLISION_BOTTOM
        60,
        1,
        0, // NOT var[1] = !var[0] (true if not grounded)

        // Check if touching left or right wall
        15,
        2,
        41, // READ_PROP var[2] CHARACTER_COLLISION_LEFT
        15,
        3,
        39, // READ_PROP var[3] CHARACTER_COLLISION_RIGHT
        61,
        4,
        2,
        3, // OR var[4] = var[2] OR var[3] (touching any wall)

        // Wall jump condition: NOT grounded AND touching wall
        62,
        5,
        1,
        4, // AND var[5] = var[1] AND var[4] (not grounded AND wall)
        91,
        5, // EXIT_WITH_VAR var[5]
      ],
    },
    // Condition 1: On ground (for JUMP)
    {
      energy_mul: 32,
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      script: [
        // Check if grounded (bottom collision = 1)
        15,
        0,
        40, // READ_PROP var[0] CHARACTER_COLLISION_BOTTOM
        91,
        0, // EXIT_WITH_VAR var[0] (true if grounded)
      ],
    },
    // Condition 2: Wall leaning AND on ground (for TURN_AROUND)
    {
      energy_mul: 32,
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      script: [
        // Check if grounded
        15,
        0,
        40, // READ_PROP var[0] CHARACTER_COLLISION_BOTTOM

        // Check if touching left or right wall
        15,
        1,
        41, // READ_PROP var[1] CHARACTER_COLLISION_LEFT
        15,
        2,
        39, // READ_PROP var[2] CHARACTER_COLLISION_RIGHT
        61,
        3,
        1,
        2, // OR var[3] = var[1] OR var[2] (touching any wall)

        // Turn around condition: grounded AND touching wall
        62,
        4,
        0,
        3, // AND var[4] = var[0] AND var[3] (grounded AND wall)
        91,
        4, // EXIT_WITH_VAR var[4]
      ],
    },
    // Condition 3: Always (for RUN)
    {
      energy_mul: 32,
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      script: [...CONDITION_SCRIPTS.ALWAYS],
    },
  ],
  characters: [
    {
      ...BASIC_CHARACTER,
      jump_force: [240, 32], // Increased jump force for good visibility
      behaviors: [
        [0, 0], // Wall leaning + not grounded -> WALL_JUMP (highest priority)
        [1, 1], // Grounded -> JUMP (second priority)
        [2, 2], // Wall leaning + grounded -> TURN_AROUND (third priority)
        [3, 3], // Always -> RUN (lowest priority)
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
