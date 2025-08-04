/**
 * WASM-Compatible Test Configurations
 *
 * Test configurations that match the WASM wrapper's expected JSON format
 */

import {
  ACTION_SCRIPTS,
  CONDITION_SCRIPTS,
  type ActionScriptType,
  type ConditionScriptType,
} from '../constants/scriptConstants'

// Base configuration template for WASM wrapper
const BASE_WASM_CONFIG = {
  seed: 12345,
  tilemap: Array(15)
    .fill(null)
    .map(() => Array(16).fill(0)), // 15x16 empty tilemap
  spawns: [
    {
      damage_base: 10,
      damage_range: 5,
      crit_chance: 10,
      crit_multiplier: 150,
      health_cap: 1,
      duration: 300,
      element: null,
      chance: 100,
      size: [8, 8], // width: 8, height: 8
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      spawns: [0, 0, 0, 0],
      behavior_script: [],
      collision_script: [],
      despawn_script: [],
    },
  ],
  status_effects: [],
}

/**
 * Configuration for testing RUN action with ALWAYS condition
 */
export const RUN_ALWAYS_WASM_CONFIG = {
  ...BASE_WASM_CONFIG,
  // Create tilemap with 1s as borders
  tilemap: [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], // Top border
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], // Left/right borders
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
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], // Bottom border
  ],
  characters: [
    {
      id: 1,
      group: 1,
      position: [
        [16, 1], // x: 16 (fixed-point 16.0)
        [192, 1], // y: 192 (240-16-32, fixed-point 192.0)
      ],
      size: [16, 32], // width: 16, height: 32
      health: 100,
      health_cap: 100,
      energy: 100,
      energy_cap: 100,
      power: 10,
      weight: 5,
      jump_force: [160, 32], // Fixed-point 5.0
      move_speed: [64, 32], // Fixed-point 2.0
      armor: [0, 0, 0, 0, 0, 0, 0, 0, 0],
      energy_regen: 1,
      energy_regen_rate: 60,
      energy_charge: 5,
      energy_charge_rate: 30,
      dir: [1, 0], // Facing right, normal gravity
      enmity: 0,
      target_id: null,
      target_type: 0,
      behaviors: [[0, 0]], // condition_id: 0, action_id: 0
    },
  ],
  actions: [
    {
      energy_cost: 0,
      cooldown: 0,
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      spawns: [0, 0, 0, 0],
      script: Array.from(ACTION_SCRIPTS.RUN),
    },
  ],
  conditions: [
    {
      energy_mul: 32, // Fixed-point 1.0
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      script: Array.from(CONDITION_SCRIPTS.ALWAYS),
    },
  ],
}

/**
 * Configuration for testing JUMP action with IS_GROUNDED condition
 */
export const JUMP_GROUNDED_WASM_CONFIG = {
  ...BASE_WASM_CONFIG,
  characters: [
    {
      id: 1,
      group: 1,
      position: [
        [160, 32],
        [240, 32],
      ], // Fixed-point [5.0, 7.5]
      size: [16, 32], // width: 32, height: 32
      health: 100,
      health_cap: 100,
      energy: 100,
      energy_cap: 100,
      power: 10,
      weight: 5,
      jump_force: [160, 32], // Fixed-point 5.0
      move_speed: [64, 32], // Fixed-point 2.0
      armor: [0, 0, 0, 0, 0, 0, 0, 0, 0],
      energy_regen: 1,
      energy_regen_rate: 60,
      energy_charge: 5,
      energy_charge_rate: 30,
      dir: [1, 0], // Facing right, normal gravity
      enmity: 0,
      target_id: null,
      target_type: 0,
      behaviors: [[0, 0]], // condition_id: 0, action_id: 0
    },
  ],
  actions: [
    {
      energy_cost: 15,
      cooldown: 60,
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      spawns: [0, 0, 0, 0],
      script: Array.from(ACTION_SCRIPTS.JUMP),
    },
  ],
  conditions: [
    {
      energy_mul: 32, // Fixed-point 1.0
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      script: Array.from(CONDITION_SCRIPTS.IS_GROUNDED),
    },
  ],
}

/**
 * Configuration for testing TURN_AROUND action with CHANCE_50 condition
 */
export const TURN_AROUND_WASM_CONFIG = {
  ...BASE_WASM_CONFIG,
  characters: [
    {
      id: 1,
      group: 1,
      position: [
        [160, 32],
        [240, 32],
      ], // Fixed-point [5.0, 7.5]
      size: [16, 32], // width: 32, height: 32
      health: 100,
      health_cap: 100,
      energy: 100,
      energy_cap: 100,
      power: 10,
      weight: 5,
      jump_force: [160, 32], // Fixed-point 5.0
      move_speed: [64, 32], // Fixed-point 2.0
      armor: [0, 0, 0, 0, 0, 0, 0, 0, 0],
      energy_regen: 1,
      energy_regen_rate: 60,
      energy_charge: 5,
      energy_charge_rate: 30,
      dir: [1, 0], // Facing right, normal gravity
      enmity: 0,
      target_id: null,
      target_type: 0,
      behaviors: [[0, 0]], // condition_id: 0, action_id: 0
    },
  ],
  actions: [
    {
      energy_cost: 0,
      cooldown: 30,
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      spawns: [0, 0, 0, 0],
      script: Array.from(ACTION_SCRIPTS.TURN_AROUND),
    },
  ],
  conditions: [
    {
      energy_mul: 32, // Fixed-point 1.0
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      script: Array.from(CONDITION_SCRIPTS.CHANCE_50),
    },
  ],
}

/**
 * Configuration for testing CHARGE action with ENERGY_LOW_20 condition
 */
export const CHARGE_LOW_ENERGY_WASM_CONFIG = {
  ...BASE_WASM_CONFIG,
  characters: [
    {
      id: 1,
      group: 1,
      position: [
        [160, 32],
        [240, 32],
      ], // Fixed-point [5.0, 7.5]
      size: [16, 32], // width: 32, height: 32
      health: 100,
      health_cap: 100,
      energy: 15, // Start with low energy
      energy_cap: 100,
      power: 10,
      weight: 5,
      jump_force: [160, 32], // Fixed-point 5.0
      move_speed: [64, 32], // Fixed-point 2.0
      armor: [0, 0, 0, 0, 0, 0, 0, 0, 0],
      energy_regen: 1,
      energy_regen_rate: 60,
      energy_charge: 3,
      energy_charge_rate: 10,
      dir: [1, 0], // Facing right, normal gravity
      enmity: 0,
      target_id: null,
      target_type: 0,
      behaviors: [[0, 0]], // condition_id: 0, action_id: 0
    },
  ],
  actions: [
    {
      energy_cost: 0,
      cooldown: 0,
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      spawns: [0, 0, 0, 0],
      script: Array.from(ACTION_SCRIPTS.CHARGE),
    },
  ],
  conditions: [
    {
      energy_mul: 32, // Fixed-point 1.0
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      script: Array.from(CONDITION_SCRIPTS.ENERGY_LOW_20),
    },
  ],
}

/**
 * Configuration for testing WALL_JUMP action with IS_WALL_SLIDING condition
 */
export const WALL_JUMP_WASM_CONFIG = {
  ...BASE_WASM_CONFIG,
  characters: [
    {
      id: 1,
      group: 1,
      position: [
        [32, 32],
        [200, 32],
      ], // Fixed-point [1.0, 6.25] - near left wall
      size: [16, 32], // width: 32, height: 32
      health: 100,
      health_cap: 100,
      energy: 100,
      energy_cap: 100,
      power: 10,
      weight: 5,
      jump_force: [192, 32], // Fixed-point 6.0
      move_speed: [96, 32], // Fixed-point 3.0
      armor: [0, 0, 0, 0, 0, 0, 0, 0, 0],
      energy_regen: 1,
      energy_regen_rate: 60,
      energy_charge: 5,
      energy_charge_rate: 30,
      dir: [1, 0], // Facing right, normal gravity
      enmity: 0,
      target_id: null,
      target_type: 0,
      behaviors: [[0, 0]], // condition_id: 0, action_id: 0
    },
  ],
  actions: [
    {
      energy_cost: 20,
      cooldown: 30,
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      spawns: [0, 0, 0, 0],
      script: Array.from(ACTION_SCRIPTS.WALL_JUMP),
    },
  ],
  conditions: [
    {
      energy_mul: 32, // Fixed-point 1.0
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      script: Array.from(CONDITION_SCRIPTS.IS_WALL_SLIDING),
    },
  ],
}

/**
 * Configuration for testing multiple scripts working together
 */
export const MIXED_SCRIPTS_WASM_CONFIG = {
  ...BASE_WASM_CONFIG,
  characters: [
    {
      id: 1,
      group: 1,
      position: [
        [160, 32],
        [240, 32],
      ], // Fixed-point [5.0, 7.5]
      size: [16, 32], // width: 32, height: 32
      health: 100,
      health_cap: 100,
      energy: 50,
      energy_cap: 100,
      power: 10,
      weight: 5,
      jump_force: [160, 32], // Fixed-point 5.0
      move_speed: [64, 32], // Fixed-point 2.0
      armor: [0, 0, 0, 0, 0, 0, 0, 0, 0],
      energy_regen: 1,
      energy_regen_rate: 60,
      energy_charge: 5,
      energy_charge_rate: 30,
      dir: [1, 0], // Facing right, normal gravity
      enmity: 0,
      target_id: null,
      target_type: 0,
      behaviors: [
        [0, 0], // ALWAYS -> RUN
        [1, 1], // IS_GROUNDED -> JUMP
        [2, 2], // ENERGY_LOW_20 -> CHARGE
        [3, 3], // CHANCE_10 -> TURN_AROUND
      ],
    },
  ],
  actions: [
    {
      energy_cost: 1,
      cooldown: 0,
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      spawns: [0, 0, 0, 0],
      script: Array.from(ACTION_SCRIPTS.RUN),
    },
    {
      energy_cost: 15,
      cooldown: 120,
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      spawns: [0, 0, 0, 0],
      script: Array.from(ACTION_SCRIPTS.JUMP),
    },
    {
      energy_cost: 0,
      cooldown: 0,
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      spawns: [0, 0, 0, 0],
      script: Array.from(ACTION_SCRIPTS.CHARGE),
    },
    {
      energy_cost: 0,
      cooldown: 60,
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      spawns: [0, 0, 0, 0],
      script: Array.from(ACTION_SCRIPTS.TURN_AROUND),
    },
  ],
  conditions: [
    {
      energy_mul: 32, // Fixed-point 1.0
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      script: Array.from(CONDITION_SCRIPTS.ALWAYS),
    },
    {
      energy_mul: 32, // Fixed-point 1.0
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      script: Array.from(CONDITION_SCRIPTS.IS_GROUNDED),
    },
    {
      energy_mul: 32, // Fixed-point 1.0
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      script: Array.from(CONDITION_SCRIPTS.ENERGY_LOW_20),
    },
    {
      energy_mul: 32, // Fixed-point 1.0
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      script: Array.from(CONDITION_SCRIPTS.CHANCE_10),
    },
  ],
}

/**
 * All WASM test configurations for easy access
 */
export const WASM_TEST_CONFIGURATIONS = {
  RUN_ALWAYS: RUN_ALWAYS_WASM_CONFIG,
  JUMP_GROUNDED: JUMP_GROUNDED_WASM_CONFIG,
  TURN_AROUND: TURN_AROUND_WASM_CONFIG,
  CHARGE_LOW_ENERGY: CHARGE_LOW_ENERGY_WASM_CONFIG,
  WALL_JUMP: WALL_JUMP_WASM_CONFIG,
  MIXED_SCRIPTS: MIXED_SCRIPTS_WASM_CONFIG,
} as const

export type WasmTestConfigurationType = keyof typeof WASM_TEST_CONFIGURATIONS

/**
 * Helper function to get a WASM test configuration by name
 */
export function getWasmTestConfiguration(name: WasmTestConfigurationType) {
  return WASM_TEST_CONFIGURATIONS[name]
}

/**
 * Helper function to create a custom WASM test configuration
 */
export function createCustomWasmTestConfig(
  scriptTemplates: Array<{
    action: ActionScriptType
    condition: ConditionScriptType
    energyCost?: number
    cooldown?: number
  }>
) {
  const actions = scriptTemplates.map((template) => ({
    energy_cost: template.energyCost || 10,
    cooldown: template.cooldown || 0,
    args: [0, 0, 0, 0, 0, 0, 0, 0],
    spawns: [0, 0, 0, 0],
    script: Array.from(ACTION_SCRIPTS[template.action]),
  }))

  const conditions = scriptTemplates.map((template) => ({
    energy_mul: 32, // Fixed-point 1.0
    args: [0, 0, 0, 0, 0, 0, 0, 0],
    script: Array.from(CONDITION_SCRIPTS[template.condition]),
  }))

  const behaviors = scriptTemplates.map((_, index) => [index, index])

  return {
    ...BASE_WASM_CONFIG,
    seed: Math.floor(Math.random() * 65536),
    characters: [
      {
        id: 1,
        group: 1,
        position: [
          [160, 32],
          [240, 32],
        ], // Fixed-point [5.0, 7.5]
        size: [16, 32], // width: 32, height: 32
        health: 100,
        health_cap: 100,
        energy: 100,
        energy_cap: 100,
        power: 10,
        weight: 5,
        jump_force: [160, 32], // Fixed-point 5.0
        move_speed: [64, 32], // Fixed-point 2.0
        armor: [0, 0, 0, 0, 0, 0, 0, 0, 0],
        energy_regen: 1,
        energy_regen_rate: 60,
        energy_charge: 5,
        energy_charge_rate: 30,
        dir: [1, 0], // Facing right, normal gravity
        enmity: 0,
        target_id: null,
        target_type: 0,
        behaviors,
      },
    ],
    actions,
    conditions,
  }
}
