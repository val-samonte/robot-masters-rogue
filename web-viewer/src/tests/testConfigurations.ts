/**
 * Test Configurations for Script Integration Testing
 *
 * Pre-built configurations that demonstrate each script type working correctly
 */

import {
  ACTION_SCRIPTS,
  CONDITION_SCRIPTS,
  createScriptTemplate,
  type ActionScriptType,
  type ConditionScriptType,
} from '../constants/scriptConstants'

// Base configuration template
const BASE_CONFIG = {
  tilemap: {
    width: 20,
    height: 15,
    tiles: Array(300).fill(0), // Empty tilemap for testing
  },
  spawns: [],
  max_frames: 1800, // 30 seconds at 60 FPS
}

/**
 * Configuration for testing RUN action with ALWAYS condition
 * Character should continuously move right
 */
export const RUN_ALWAYS_CONFIG = {
  ...BASE_CONFIG,
  characters: [
    {
      id: 1,
      position: { x: 160, y: 240 },
      size: { width: 32, height: 32 },
      health: 100,
      energy: 100,
      energy_cap: 100,
      facing: 1, // Right
      move_speed: 2, // Fixed-point: 2.0
      jump_force: 5,
      energy_charge: 5,
      energy_charge_rate: 30,
      scripts: [
        {
          action_id: 0,
          condition: Array.from(CONDITION_SCRIPTS.ALWAYS),
          action: Array.from(ACTION_SCRIPTS.RUN),
          energy_cost: 0,
          cooldown: 0,
        },
      ],
    },
  ],
}

/**
 * Configuration for testing TURN_AROUND action
 * Character should flip direction every few frames
 */
export const TURN_AROUND_CONFIG = {
  ...BASE_CONFIG,
  characters: [
    {
      id: 1,
      position: { x: 160, y: 240 },
      size: { width: 32, height: 32 },
      health: 100,
      energy: 100,
      energy_cap: 100,
      facing: 1, // Start facing right
      move_speed: 2,
      jump_force: 5,
      energy_charge: 5,
      energy_charge_rate: 30,
      scripts: [
        {
          action_id: 0,
          condition: Array.from(CONDITION_SCRIPTS.CHANCE_50), // 50% chance to turn
          action: Array.from(ACTION_SCRIPTS.TURN_AROUND),
          energy_cost: 0,
          cooldown: 30, // Turn at most once per 30 frames
        },
      ],
    },
  ],
}

/**
 * Configuration for testing JUMP action with IS_GROUNDED condition
 * Character should jump when touching the ground
 */
export const JUMP_GROUNDED_CONFIG = {
  ...BASE_CONFIG,
  characters: [
    {
      id: 1,
      position: { x: 160, y: 240 },
      size: { width: 32, height: 32 },
      health: 100,
      energy: 100,
      energy_cap: 100,
      facing: 1,
      move_speed: 2,
      jump_force: 5, // Fixed-point: 5.0
      energy_charge: 5,
      energy_charge_rate: 30,
      scripts: [
        {
          action_id: 0,
          condition: Array.from(CONDITION_SCRIPTS.IS_GROUNDED),
          action: Array.from(ACTION_SCRIPTS.JUMP),
          energy_cost: 15,
          cooldown: 60, // Jump at most once per second
        },
      ],
    },
  ],
}

/**
 * Configuration for testing WALL_JUMP action
 * Character should wall jump when sliding against walls
 */
export const WALL_JUMP_CONFIG = {
  ...BASE_CONFIG,
  characters: [
    {
      id: 1,
      position: { x: 32, y: 200 }, // Near left wall
      size: { width: 32, height: 32 },
      health: 100,
      energy: 100,
      energy_cap: 100,
      facing: 1,
      move_speed: 3,
      jump_force: 6,
      energy_charge: 5,
      energy_charge_rate: 30,
      scripts: [
        {
          action_id: 0,
          condition: Array.from(CONDITION_SCRIPTS.IS_WALL_SLIDING),
          action: Array.from(ACTION_SCRIPTS.WALL_JUMP),
          energy_cost: 20,
          cooldown: 30,
        },
      ],
    },
  ],
}

/**
 * Configuration for testing CHARGE action with low energy condition
 * Character should charge when energy is low
 */
export const CHARGE_LOW_ENERGY_CONFIG = {
  ...BASE_CONFIG,
  characters: [
    {
      id: 1,
      position: { x: 160, y: 240 },
      size: { width: 32, height: 32 },
      health: 100,
      energy: 15, // Start with low energy
      energy_cap: 100,
      facing: 1,
      move_speed: 2,
      jump_force: 5,
      energy_charge: 3, // Charge 3 energy per activation
      energy_charge_rate: 10, // Check every 10 frames
      scripts: [
        {
          action_id: 0,
          condition: Array.from(CONDITION_SCRIPTS.ENERGY_LOW_20),
          action: Array.from(ACTION_SCRIPTS.CHARGE),
          energy_cost: 0, // Charging doesn't cost energy
          cooldown: 0,
        },
      ],
    },
  ],
}

/**
 * Configuration for testing multiple scripts working together
 * Character has multiple behaviors that can trigger
 */
export const MIXED_SCRIPTS_CONFIG = {
  ...BASE_CONFIG,
  characters: [
    {
      id: 1,
      position: { x: 160, y: 240 },
      size: { width: 32, height: 32 },
      health: 100,
      energy: 50,
      energy_cap: 100,
      facing: 1,
      move_speed: 2,
      jump_force: 5,
      energy_charge: 5,
      energy_charge_rate: 30,
      scripts: [
        {
          action_id: 0,
          condition: Array.from(CONDITION_SCRIPTS.ALWAYS),
          action: Array.from(ACTION_SCRIPTS.RUN),
          energy_cost: 1, // Small energy cost for running
          cooldown: 0,
        },
        {
          action_id: 1,
          condition: Array.from(CONDITION_SCRIPTS.IS_GROUNDED),
          action: Array.from(ACTION_SCRIPTS.JUMP),
          energy_cost: 15,
          cooldown: 120, // Jump every 2 seconds max
        },
        {
          action_id: 2,
          condition: Array.from(CONDITION_SCRIPTS.ENERGY_LOW_20),
          action: Array.from(ACTION_SCRIPTS.CHARGE),
          energy_cost: 0,
          cooldown: 0,
        },
        {
          action_id: 3,
          condition: Array.from(CONDITION_SCRIPTS.CHANCE_10),
          action: Array.from(ACTION_SCRIPTS.TURN_AROUND),
          energy_cost: 0,
          cooldown: 60, // Turn at most once per second
        },
      ],
    },
  ],
}

/**
 * Configuration for testing energy consumption mechanics
 * Character performs energy-intensive actions to test consumption
 */
export const ENERGY_CONSUMPTION_CONFIG = {
  ...BASE_CONFIG,
  max_frames: 600, // 10 seconds
  characters: [
    {
      id: 1,
      position: { x: 160, y: 240 },
      size: { width: 32, height: 32 },
      health: 100,
      energy: 100, // Start with full energy
      energy_cap: 100,
      facing: 1,
      move_speed: 2,
      jump_force: 5,
      energy_charge: 2, // Slow charging
      energy_charge_rate: 60, // Charge every second
      scripts: [
        {
          action_id: 0,
          condition: Array.from(CONDITION_SCRIPTS.ALWAYS),
          action: Array.from(ACTION_SCRIPTS.JUMP),
          energy_cost: 25, // High energy cost
          cooldown: 10, // Jump frequently to drain energy
        },
      ],
    },
  ],
}

/**
 * Configuration for testing chance-based conditions
 * Multiple characters with different chance conditions
 */
export const CHANCE_CONDITIONS_CONFIG = {
  ...BASE_CONFIG,
  characters: [
    {
      id: 1,
      position: { x: 100, y: 240 },
      size: { width: 32, height: 32 },
      health: 100,
      energy: 100,
      energy_cap: 100,
      facing: 1,
      move_speed: 2,
      jump_force: 5,
      energy_charge: 5,
      energy_charge_rate: 30,
      scripts: [
        {
          action_id: 0,
          condition: Array.from(CONDITION_SCRIPTS.CHANCE_10),
          action: Array.from(ACTION_SCRIPTS.TURN_AROUND),
          energy_cost: 0,
          cooldown: 0,
        },
      ],
    },
    {
      id: 2,
      position: { x: 200, y: 240 },
      size: { width: 32, height: 32 },
      health: 100,
      energy: 100,
      energy_cap: 100,
      facing: 1,
      move_speed: 2,
      jump_force: 5,
      energy_charge: 5,
      energy_charge_rate: 30,
      scripts: [
        {
          action_id: 0,
          condition: Array.from(CONDITION_SCRIPTS.CHANCE_50),
          action: Array.from(ACTION_SCRIPTS.JUMP),
          energy_cost: 15,
          cooldown: 30,
        },
      ],
    },
  ],
}

/**
 * Configuration for testing collision-based conditions
 * Character positioned to test collision detection
 */
export const COLLISION_CONDITIONS_CONFIG = {
  ...BASE_CONFIG,
  tilemap: {
    width: 20,
    height: 15,
    // Add some walls for collision testing
    tiles: [
      ...Array(280).fill(0), // Empty space
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1, // Bottom wall
    ],
  },
  characters: [
    {
      id: 1,
      position: { x: 160, y: 200 }, // Above the ground
      size: { width: 32, height: 32 },
      health: 100,
      energy: 100,
      energy_cap: 100,
      facing: 1,
      move_speed: 2,
      jump_force: 5,
      energy_charge: 5,
      energy_charge_rate: 30,
      scripts: [
        {
          action_id: 0,
          condition: Array.from(CONDITION_SCRIPTS.IS_GROUNDED),
          action: Array.from(ACTION_SCRIPTS.RUN),
          energy_cost: 0,
          cooldown: 0,
        },
        {
          action_id: 1,
          condition: Array.from(CONDITION_SCRIPTS.IS_WALL_SLIDING),
          action: Array.from(ACTION_SCRIPTS.WALL_JUMP),
          energy_cost: 20,
          cooldown: 30,
        },
      ],
    },
  ],
}

/**
 * All test configurations for easy access
 */
export const TEST_CONFIGURATIONS = {
  RUN_ALWAYS: RUN_ALWAYS_CONFIG,
  TURN_AROUND: TURN_AROUND_CONFIG,
  JUMP_GROUNDED: JUMP_GROUNDED_CONFIG,
  WALL_JUMP: WALL_JUMP_CONFIG,
  CHARGE_LOW_ENERGY: CHARGE_LOW_ENERGY_CONFIG,
  MIXED_SCRIPTS: MIXED_SCRIPTS_CONFIG,
  ENERGY_CONSUMPTION: ENERGY_CONSUMPTION_CONFIG,
  CHANCE_CONDITIONS: CHANCE_CONDITIONS_CONFIG,
  COLLISION_CONDITIONS: COLLISION_CONDITIONS_CONFIG,
} as const

export type TestConfigurationType = keyof typeof TEST_CONFIGURATIONS

/**
 * Helper function to get a test configuration by name
 */
export function getTestConfiguration(name: TestConfigurationType) {
  return TEST_CONFIGURATIONS[name]
}

/**
 * Helper function to create a custom test configuration
 */
export function createCustomTestConfig(characterConfig: {
  position?: { x: number; y: number }
  energy?: number
  facing?: number
  scripts: Array<{
    action: ActionScriptType
    condition: ConditionScriptType
    energyCost?: number
    cooldown?: number
  }>
}) {
  const character = {
    id: 1,
    position: characterConfig.position || { x: 160, y: 240 },
    size: { width: 32, height: 32 },
    health: 100,
    energy: characterConfig.energy || 100,
    energy_cap: 100,
    facing: characterConfig.facing || 1,
    move_speed: 2,
    jump_force: 5,
    energy_charge: 5,
    energy_charge_rate: 30,
    scripts: characterConfig.scripts.map((script, index) => {
      const template = createScriptTemplate(script.action, script.condition)
      return {
        action_id: index,
        condition: Array.from(template.condition),
        action: Array.from(template.action),
        energy_cost: script.energyCost || 10,
        cooldown: script.cooldown || 0,
      }
    }),
  }

  return {
    ...BASE_CONFIG,
    characters: [character],
  }
}
