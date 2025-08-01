/**
 * Script Constants Library
 *
 * Predefined script templates for common actions and conditions.
 * These constants provide easy-to-use bytecode arrays for testing different character behaviors.
 */

// Operator address constants from wasm-wrapper/tests/constants.ts
const OperatorAddress = {
  EXIT: 0,
  EXIT_IF_NO_ENERGY: 1,
  EXIT_IF_COOLDOWN: 2,
  SKIP: 3,
  GOTO: 4,
  READ_PROP: 10,
  WRITE_PROP: 11,
  ASSIGN_BYTE: 20,
  ASSIGN_FIXED: 21,
  ASSIGN_RANDOM: 22,
  TO_BYTE: 23,
  TO_FIXED: 24,
  ADD: 30,
  SUB: 31,
  MUL: 32,
  DIV: 33,
  NEGATE: 34,
  ADD_BYTE: 40,
  SUB_BYTE: 41,
  MUL_BYTE: 42,
  DIV_BYTE: 43,
  MOD_BYTE: 44,
  WRAPPING_ADD: 45,
  EQUAL: 50,
  NOT_EQUAL: 51,
  LESS_THAN: 52,
  LESS_THAN_OR_EQUAL: 53,
  NOT: 60,
  OR: 61,
  AND: 62,
  MIN: 70,
  MAX: 71,
  LOCK_ACTION: 80,
  UNLOCK_ACTION: 81,
  APPLY_ENERGY_COST: 82,
  APPLY_DURATION: 83,
  SPAWN: 84,
  SPAWN_WITH_VARS: 85,
  LOG_VARIABLE: 90,
  EXIT_WITH_VAR: 91,
  READ_ARG: 96,
  READ_SPAWN: 97,
  WRITE_SPAWN: 98,
  READ_ACTION_COOLDOWN: 100,
  READ_ACTION_LAST_USED: 101,
  WRITE_ACTION_LAST_USED: 102,
  IS_ACTION_ON_COOLDOWN: 103,
} as const

// Property address constants from wasm-wrapper/tests/constants.ts
const PropertyAddress = {
  GAME_SEED: 0x01,
  GAME_FRAME: 0x02,
  GAME_GRAVITY: 0x03,
  ACTION_DEF_ENERGY_COST: 0x04,
  ACTION_DEF_INTERVAL: 0x05,
  ACTION_DEF_DURATION: 0x06,
  ACTION_DEF_COOLDOWN: 0x07,
  ACTION_DEF_ARG0: 0x08,
  ACTION_DEF_ARG1: 0x09,
  ACTION_DEF_ARG2: 0x0a,
  ACTION_DEF_ARG3: 0x0b,
  ACTION_DEF_ARG4: 0x0c,
  ACTION_DEF_ARG5: 0x0d,
  ACTION_DEF_ARG6: 0x0e,
  ACTION_DEF_ARG7: 0x0f,
  CHARACTER_ID: 0x20,
  CHARACTER_GROUP: 0x21,
  CHARACTER_POS_X: 0x22,
  CHARACTER_POS_Y: 0x23,
  CHARACTER_VEL_X: 0x24,
  CHARACTER_VEL_Y: 0x25,
  CHARACTER_SIZE_W: 0x26,
  CHARACTER_SIZE_H: 0x27,
  CHARACTER_HEALTH: 0x28,
  CHARACTER_ENERGY: 0x29,
  CHARACTER_ENERGY_CAP: 0x2a,
  CHARACTER_ENERGY_REGEN: 0x2b,
  CHARACTER_ENERGY_REGEN_RATE: 0x2c,
  CHARACTER_ENERGY_CHARGE: 0x2d,
  CHARACTER_ENERGY_CHARGE_RATE: 0x2e,
  CHARACTER_LOCKED_ACTION_ID: 0x2f,
  CHARACTER_COLLISION_TOP: 0x30,
  CHARACTER_COLLISION_RIGHT: 0x31,
  CHARACTER_COLLISION_BOTTOM: 0x32,
  CHARACTER_COLLISION_LEFT: 0x33,
  CHARACTER_STATUS_EFFECT_COUNT: 0x34,
  ENTITY_FACING: 0x50,
  ENTITY_GRAVITY_DIR: 0x51,
  SPAWN_DAMAGE_BASE: 0x52,
  SPAWN_CORE_ID: 0x53,
  SPAWN_OWNER_ID: 0x54,
  SPAWN_POS_X: 0x55,
  SPAWN_POS_Y: 0x56,
  SPAWN_VEL_X: 0x57,
  SPAWN_VEL_Y: 0x58,
} as const

/**
 * Action script templates for common character behaviors
 */
export const ACTION_SCRIPTS = {
  /**
   * Run action - moves character horizontally based on facing direction
   * Uses ACTION_DEF_ARG0 for run speed * facing direction
   */
  RUN: [
    OperatorAddress.READ_PROP,
    0,
    PropertyAddress.ENTITY_FACING, // Read facing direction (byte)
    OperatorAddress.READ_PROP,
    1,
    PropertyAddress.ACTION_DEF_ARG0, // Read run speed (byte)
    OperatorAddress.TO_FIXED,
    0,
    1, // Convert run speed byte to fixed-point[0]
    OperatorAddress.TO_FIXED,
    1,
    0, // Convert facing direction byte to fixed-point[1]
    OperatorAddress.MUL,
    2,
    0,
    1, // Multiply speed by facing direction -> fixed-point[2]
    OperatorAddress.WRITE_PROP,
    PropertyAddress.CHARACTER_VEL_X,
    2, // Write fixed-point result to velocity
    OperatorAddress.EXIT,
    0,
  ],

  /**
   * Turn around action - flips the character's facing direction
   * If facing right (1), turn left (0), and vice versa
   */
  TURN_AROUND: [
    OperatorAddress.READ_PROP,
    0,
    PropertyAddress.ENTITY_FACING,
    OperatorAddress.EQUAL,
    1,
    0,
    0,
    OperatorAddress.ASSIGN_BYTE,
    2,
    1,
    OperatorAddress.ASSIGN_BYTE,
    3,
    0,
    OperatorAddress.WRITE_PROP,
    PropertyAddress.ENTITY_FACING,
    1,
    OperatorAddress.EXIT,
    0,
  ],

  /**
   * Jump action - applies upward velocity if character has energy
   * Uses ACTION_DEF_ARG0 for jump force, applies energy cost
   */
  JUMP: [
    OperatorAddress.EXIT_IF_NO_ENERGY,
    0,
    OperatorAddress.READ_PROP,
    0,
    PropertyAddress.ACTION_DEF_ARG0, // Read jump force (byte)
    OperatorAddress.TO_FIXED,
    0,
    0, // Convert jump force byte to fixed-point[0]
    OperatorAddress.NEGATE,
    0, // Make it negative for upward velocity
    OperatorAddress.WRITE_PROP,
    PropertyAddress.CHARACTER_VEL_Y,
    0, // Write fixed-point result to velocity
    OperatorAddress.APPLY_ENERGY_COST,
    OperatorAddress.EXIT,
    0,
  ],

  /**
   * Wall jump action - jumps off walls when touching them
   * Uses ACTION_DEF_ARG0 for vertical jump force, ACTION_DEF_ARG1 for horizontal force
   */
  WALL_JUMP: [
    OperatorAddress.READ_PROP,
    0,
    PropertyAddress.CHARACTER_COLLISION_LEFT, // Check left wall collision
    OperatorAddress.READ_PROP,
    1,
    PropertyAddress.CHARACTER_COLLISION_RIGHT, // Check right wall collision
    OperatorAddress.OR,
    2,
    0,
    1, // Check if touching either wall
    OperatorAddress.EXIT_IF_NO_ENERGY,
    0,
    OperatorAddress.READ_PROP,
    3,
    PropertyAddress.ACTION_DEF_ARG0, // Read vertical jump force (byte)
    OperatorAddress.TO_FIXED,
    0,
    3, // Convert to fixed-point[0]
    OperatorAddress.NEGATE,
    0, // Make negative for upward velocity
    OperatorAddress.READ_PROP,
    4,
    PropertyAddress.ACTION_DEF_ARG1, // Read horizontal jump force (byte)
    OperatorAddress.TO_FIXED,
    1,
    4, // Convert to fixed-point[1]
    OperatorAddress.WRITE_PROP,
    PropertyAddress.CHARACTER_VEL_Y,
    0, // Write vertical velocity (fixed-point)
    OperatorAddress.WRITE_PROP,
    PropertyAddress.CHARACTER_VEL_X,
    1, // Write horizontal velocity (fixed-point)
    OperatorAddress.APPLY_ENERGY_COST,
    OperatorAddress.EXIT,
    0,
  ],

  /**
   * Charge action - recovers energy when below energy cap
   * Uses character's energy charge rate to restore energy
   */
  CHARGE: [
    OperatorAddress.READ_PROP,
    0,
    PropertyAddress.CHARACTER_ENERGY,
    OperatorAddress.READ_PROP,
    1,
    PropertyAddress.CHARACTER_ENERGY_CAP,
    OperatorAddress.LESS_THAN,
    2,
    0,
    1,
    OperatorAddress.READ_PROP,
    3,
    PropertyAddress.CHARACTER_ENERGY_CHARGE,
    OperatorAddress.ADD_BYTE,
    4,
    0,
    3,
    OperatorAddress.MIN,
    5,
    4,
    1,
    OperatorAddress.WRITE_PROP,
    PropertyAddress.CHARACTER_ENERGY,
    5,
    OperatorAddress.EXIT,
    0,
  ],
} as const

/**
 * Condition script templates for common behavior triggers
 */
export const CONDITION_SCRIPTS = {
  /**
   * Always condition - always returns true
   * Simple condition that always triggers
   */
  ALWAYS: [OperatorAddress.ASSIGN_BYTE, 0, 1, OperatorAddress.EXIT_WITH_VAR, 0],

  /**
   * 10% chance condition - randomly triggers 10% of the time
   * Uses random number generation with threshold of 25 (out of 255)
   */
  CHANCE_10: [
    OperatorAddress.ASSIGN_RANDOM,
    0,
    OperatorAddress.ASSIGN_BYTE,
    1,
    25, // ~10% of 255
    OperatorAddress.LESS_THAN,
    2,
    0,
    1,
    OperatorAddress.EXIT_WITH_VAR,
    2,
  ],

  /**
   * 20% chance condition - randomly triggers 20% of the time
   * Uses random number generation with threshold of 51 (out of 255)
   */
  CHANCE_20: [
    OperatorAddress.ASSIGN_RANDOM,
    0,
    OperatorAddress.ASSIGN_BYTE,
    1,
    51, // ~20% of 255
    OperatorAddress.LESS_THAN,
    2,
    0,
    1,
    OperatorAddress.EXIT_WITH_VAR,
    2,
  ],

  /**
   * 50% chance condition - randomly triggers 50% of the time
   * Uses random number generation with threshold of 128 (out of 255)
   */
  CHANCE_50: [
    OperatorAddress.ASSIGN_RANDOM,
    0,
    OperatorAddress.ASSIGN_BYTE,
    1,
    128, // 50% of 255
    OperatorAddress.LESS_THAN,
    2,
    0,
    1,
    OperatorAddress.EXIT_WITH_VAR,
    2,
  ],

  /**
   * Energy low 10% condition - triggers when energy is below 10% of cap
   * Compares current energy to 10% of energy cap
   */
  ENERGY_LOW_10: [
    OperatorAddress.READ_PROP,
    0,
    PropertyAddress.CHARACTER_ENERGY,
    OperatorAddress.READ_PROP,
    1,
    PropertyAddress.CHARACTER_ENERGY_CAP,
    OperatorAddress.DIV_BYTE,
    2,
    1,
    10, // Divide cap by 10 for 10% threshold
    OperatorAddress.LESS_THAN,
    3,
    0,
    2,
    OperatorAddress.EXIT_WITH_VAR,
    3,
  ],

  /**
   * Energy low 20% condition - triggers when energy is below 20% of cap
   * Compares current energy to 20% of energy cap
   */
  ENERGY_LOW_20: [
    OperatorAddress.READ_PROP,
    0,
    PropertyAddress.CHARACTER_ENERGY,
    OperatorAddress.READ_PROP,
    1,
    PropertyAddress.CHARACTER_ENERGY_CAP,
    OperatorAddress.DIV_BYTE,
    2,
    1,
    5, // Divide cap by 5 for 20% threshold
    OperatorAddress.LESS_THAN,
    3,
    0,
    2,
    OperatorAddress.EXIT_WITH_VAR,
    3,
  ],

  /**
   * Is grounded condition - triggers when character is touching the ground
   * Checks bottom collision flag
   */
  IS_GROUNDED: [
    OperatorAddress.READ_PROP,
    0,
    PropertyAddress.CHARACTER_COLLISION_BOTTOM,
    OperatorAddress.EXIT_WITH_VAR,
    0,
  ],

  /**
   * Is wall sliding condition - triggers when character is sliding against a wall
   * Checks if not grounded AND touching left or right wall
   */
  IS_WALL_SLIDING: [
    OperatorAddress.READ_PROP,
    0,
    PropertyAddress.CHARACTER_COLLISION_BOTTOM,
    OperatorAddress.NOT,
    1,
    0, // Not grounded
    OperatorAddress.READ_PROP,
    2,
    PropertyAddress.CHARACTER_COLLISION_LEFT,
    OperatorAddress.READ_PROP,
    3,
    PropertyAddress.CHARACTER_COLLISION_RIGHT,
    OperatorAddress.OR,
    4,
    2,
    3, // Touching left OR right wall
    OperatorAddress.AND,
    5,
    1,
    4, // Not grounded AND touching wall
    OperatorAddress.EXIT_WITH_VAR,
    5,
  ],
} as const

/**
 * Type definitions for script constants
 */
export type ActionScriptType = keyof typeof ACTION_SCRIPTS
export type ConditionScriptType = keyof typeof CONDITION_SCRIPTS

/**
 * Helper function to get action script bytecode
 */
export function getActionScript(action: ActionScriptType): readonly number[] {
  return ACTION_SCRIPTS[action]
}

/**
 * Helper function to get condition script bytecode
 */
export function getConditionScript(
  condition: ConditionScriptType
): readonly number[] {
  return CONDITION_SCRIPTS[condition]
}

/**
 * Helper function to create a script template with mixed actions and conditions
 */
export function createScriptTemplate(
  action: ActionScriptType,
  condition: ConditionScriptType
): {
  action: readonly number[]
  condition: readonly number[]
} {
  return {
    action: getActionScript(action),
    condition: getConditionScript(condition),
  }
}
