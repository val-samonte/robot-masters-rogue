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

/*
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
    // Condition 2: Is grounded (for JUMP) - FIXED: Use gravity-aware IS_GROUNDED
    {
      energy_mul: 32,
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      script: [...CONDITION_SCRIPTS.IS_GROUNDED],
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

export const ADVANCED_MOVEMENT_CONFIG: GameConfig = {
  seed: 12345,
  gravity: [32, 64], // 0.5 gravity for testing
  tilemap: BASIC_TILEMAP,
  actions: [
    // Action 0: TURN_AROUND
    {
      energy_cost: 0,
      cooldown: 0,
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      spawns: [0, 0, 0, 0],
      script: [...ACTION_SCRIPTS.TURN_AROUND],
    },
    // Action 1: RUN
    {
      energy_cost: 0,
      cooldown: 0,
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      spawns: [0, 0, 0, 0],
      script: [...ACTION_SCRIPTS.RUN],
    },
    // Action 2: JUMP
    {
      energy_cost: 10,
      cooldown: 120, // Longer cooldown for occasional jumping
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      spawns: [0, 0, 0, 0],
      script: [...ACTION_SCRIPTS.JUMP],
    },
    // Action 3: WALL_JUMP
    {
      energy_cost: 15,
      cooldown: 60,
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      spawns: [0, 0, 0, 0],
      script: [...ACTION_SCRIPTS.WALL_JUMP],
    },
  ],
  conditions: [
    // Condition 0: Wall leaning
    {
      energy_mul: 32,
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      script: [...CONDITION_SCRIPTS.IS_WALL_LEANING],
    },
    // Condition 1: Always
    {
      energy_mul: 32,
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      script: [...CONDITION_SCRIPTS.ALWAYS],
    },
    // Condition 2: Is grounded - FIXED: Use gravity-aware IS_GROUNDED
    {
      energy_mul: 32,
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      script: [...CONDITION_SCRIPTS.IS_GROUNDED],
    },
    // Condition 3: Wall leaning AND airborne (for wall jump) - Task 22 implementation
    {
      energy_mul: 32,
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      script: [...CONDITION_SCRIPTS.IS_WALL_LEANING_AND_AIRBORNE],
    },
  ],
  characters: [
    {
      ...BASIC_CHARACTER,
      behaviors: [
        [3, 3], // Wall leaning + not grounded -> WALL_JUMP (highest priority)
        [0, 0], // Wall leaning -> TURN_AROUND (high priority)
        [2, 2], // Grounded -> JUMP (medium priority)
        [1, 1], // Always -> RUN (lowest priority)
      ],
    },
  ],
  spawns: [],
  status_effects: [],
}


export const INVERTED_GRAVITY_CONFIG: GameConfig = {
  seed: 12345,
  gravity: [32, 64], // Same as ADVANCED_MOVEMENT
  tilemap: BASIC_TILEMAP,
  actions: [
    // Action 0: TURN_AROUND
    {
      energy_cost: 0,
      cooldown: 0,
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      spawns: [0, 0, 0, 0],
      script: [...ACTION_SCRIPTS.TURN_AROUND],
    },
    // Action 1: RUN
    {
      energy_cost: 0,
      cooldown: 0,
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      spawns: [0, 0, 0, 0],
      script: [...ACTION_SCRIPTS.RUN],
    },
    // Action 2: INVERT_GRAVITY - NEW for Task 23
    {
      energy_cost: 0,
      cooldown: 0,
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      spawns: [0, 0, 0, 0],
      script: [...ACTION_SCRIPTS.INVERT_GRAVITY],
    },
  ],
  conditions: [
    // Condition 0: Wall leaning
    {
      energy_mul: 32,
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      script: [...CONDITION_SCRIPTS.IS_WALL_LEANING],
    },
    // Condition 1: Always
    {
      energy_mul: 32,
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      script: [...CONDITION_SCRIPTS.ALWAYS],
    },
    // Condition 2: ONLY_ONCE - NEW for Task 23
    {
      energy_mul: 32,
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      script: [...CONDITION_SCRIPTS.ONLY_ONCE],
    },
  ],
  characters: [
    {
      ...BASIC_CHARACTER,
      behaviors: [
        [2, 2], // ONLY_ONCE -> INVERT_GRAVITY (highest priority, once at start)
        [0, 0], // Wall leaning -> TURN_AROUND (when hitting walls)
        [1, 1], // Always -> RUN (constant horizontal movement)
      ],
    },
  ],
  spawns: [],
  status_effects: [],
}

export const INVERTED_GRAVITY_WITH_JUMPING_CONFIG: GameConfig = {
  seed: 12345,
  gravity: [32, 64], // Same as INVERTED_GRAVITY_CONFIG
  tilemap: BASIC_TILEMAP,
  actions: [
    // Action 0: TURN_AROUND
    {
      energy_cost: 0,
      cooldown: 0,
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      spawns: [0, 0, 0, 0],
      script: [...ACTION_SCRIPTS.TURN_AROUND],
    },
    // Action 1: RUN
    {
      energy_cost: 0,
      cooldown: 0,
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      spawns: [0, 0, 0, 0],
      script: [...ACTION_SCRIPTS.RUN],
    },
    // Action 2: INVERT_GRAVITY
    {
      energy_cost: 0,
      cooldown: 0,
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      spawns: [0, 0, 0, 0],
      script: [...ACTION_SCRIPTS.INVERT_GRAVITY],
    },
    // Action 3: JUMP - NEW for Task 26
    {
      energy_cost: 10,
      cooldown: 30, // 30 frame cooldown for jump
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      spawns: [0, 0, 0, 0],
      script: [...ACTION_SCRIPTS.JUMP],
    },
    // Action 4: WALL_JUMP - NEW for Task 26
    {
      energy_cost: 15,
      cooldown: 60, // 60 frame cooldown for wall jump
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      spawns: [0, 0, 0, 0],
      script: [...ACTION_SCRIPTS.WALL_JUMP],
    },
  ],
  conditions: [
    // Condition 0: Wall leaning
    {
      energy_mul: 32,
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      script: [...CONDITION_SCRIPTS.IS_WALL_LEANING],
    },
    // Condition 1: Always
    {
      energy_mul: 32,
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      script: [...CONDITION_SCRIPTS.ALWAYS],
    },
    // Condition 2: ONLY_ONCE
    {
      energy_mul: 32,
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      script: [...CONDITION_SCRIPTS.ONLY_ONCE],
    },
    // Condition 3: IS_GROUNDED - NEW for Task 26
    {
      energy_mul: 32,
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      script: [...CONDITION_SCRIPTS.IS_GROUNDED],
    },
    // Condition 4: IS_WALL_LEANING_AND_AIRBORNE - NEW for Task 26
    {
      energy_mul: 32,
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      script: [...CONDITION_SCRIPTS.IS_WALL_LEANING_AND_AIRBORNE],
    },
  ],
  characters: [
    {
      ...BASIC_CHARACTER,
      behaviors: [
        [2, 2], // ONLY_ONCE -> INVERT_GRAVITY (highest priority, once at start)
        [0, 0], // Wall leaning -> TURN_AROUND (when hitting walls)
        [4, 4], // Wall leaning + airborne -> WALL_JUMP (gravity-aware wall jumping)
        [3, 3], // Grounded -> JUMP (gravity-aware ground jumping)
        [1, 1], // Always -> RUN (constant horizontal movement)
      ],
    },
  ],
  spawns: [],
  status_effects: [],
}
  */

/**
 * Available configuration presets
 */
export const GAME_CONFIGS = {
  RUN_AROUND: RUN_AROUND,
  RUN_AND_JUMP: RUN_AROUND,
  INVERTED_RUN: RUN_AROUND,
  INVERTED_RUN_AND_JUMP: RUN_AROUND,
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
