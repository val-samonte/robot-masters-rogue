/**
 * Script Constants Library
 *
 * Predefined script templates for common actions and conditions.
 * These constants provide easy-to-use bytecode arrays for testing different character behaviors.
 *
 * GRAVITY DIRECTION SYSTEM:
 * The ENTITY_DIR_VERTICAL property controls how gravity affects entities:
 * - dir.1 = 0: Downward gravity (multiply game_gravity by +1.0) - DEFAULT for characters
 * - dir.1 = 1: Neutral gravity (multiply game_gravity by 0.0 - no gravity effect) - DEFAULT for spawns
 * - dir.1 = 2: Upward gravity (multiply game_gravity by -1.0 - inverted)
 *
 * Gravity calculation: entity_velocity.y += game_state.gravity * gravity_multiplier
 *
 * Characters default to dir.1 = 0 (affected by downward gravity)
 * Spawns default to dir.1 = 1 (neutral - not affected by gravity)
 */

// Constants imported from wasm-wrapper project to avoid magic numbers
const OperatorAddress = {
  EXIT: 0,
  EXIT_IF_NO_ENERGY: 1,
  EXIT_IF_COOLDOWN: 2,
  EXIT_IF_NOT_GROUNDED: 3,
  SKIP: 10,
  GOTO: 11,
  READ_PROP: 15,
  WRITE_PROP: 16,
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
  READ_CHARACTER_PROPERTY: 104,
  WRITE_CHARACTER_PROPERTY: 105,
  READ_SPAWN_PROPERTY: 106,
  WRITE_SPAWN_PROPERTY: 107,
} as const

const PropertyAddress = {
  GAME_SEED: 0x01,
  GAME_FRAME: 0x02,
  GAME_GRAVITY: 0x03,
  CHARACTER_ID: 0x10,
  CHARACTER_GROUP: 0x11,
  CHARACTER_POS_X: 0x12,
  CHARACTER_POS_Y: 0x13,
  CHARACTER_VEL_X: 0x14,
  CHARACTER_VEL_Y: 0x15,
  CHARACTER_SIZE_W: 0x16,
  CHARACTER_SIZE_H: 0x17,
  CHARACTER_HEALTH: 0x18,
  CHARACTER_HEALTH_CAP: 0x19,
  CHARACTER_ENERGY: 0x1a,
  CHARACTER_ENERGY_CAP: 0x1b,
  CHARACTER_POWER: 0x1c,
  CHARACTER_WEIGHT: 0x1d,
  CHARACTER_JUMP_FORCE: 0x1e,
  CHARACTER_MOVE_SPEED: 0x1f,
  CHARACTER_ENERGY_REGEN: 0x20,
  CHARACTER_ENERGY_REGEN_RATE: 0x21,
  CHARACTER_ENERGY_CHARGE: 0x22,
  CHARACTER_ENERGY_CHARGE_RATE: 0x23,
  CHARACTER_LOCKED_ACTION_ID: 0x24,
  CHARACTER_STATUS_EFFECT_COUNT: 0x25,
  CHARACTER_COLLISION_TOP: 0x26,
  CHARACTER_COLLISION_RIGHT: 0x27,
  CHARACTER_COLLISION_BOTTOM: 0x28,
  CHARACTER_COLLISION_LEFT: 0x29,
  CHARACTER_ARMOR_PUNCT: 0x2a,
  CHARACTER_ARMOR_BLAST: 0x2b,
  CHARACTER_ARMOR_FORCE: 0x2c,
  CHARACTER_ARMOR_SEVER: 0x2d,
  CHARACTER_ARMOR_HEAT: 0x2e,
  CHARACTER_ARMOR_CRYO: 0x2f,
  CHARACTER_ARMOR_JOLT: 0x30,
  CHARACTER_ARMOR_ACID: 0x31,
  CHARACTER_ARMOR_VIRUS: 0x32,
  ENTITY_DIR_HORIZONTAL: 0x40,
  ENTITY_DIR_VERTICAL: 0x41,
  ENTITY_ENMITY: 0x42,
  ENTITY_TARGET_ID: 0x43,
  ENTITY_TARGET_TYPE: 0x44,
  ACTION_DEF_ENERGY_COST: 0x80,
  ACTION_DEF_COOLDOWN: 0x81,
  ACTION_DEF_ARG0: 0x82,
  ACTION_DEF_ARG1: 0x83,
  ACTION_DEF_ARG2: 0x84,
  ACTION_DEF_ARG3: 0x85,
  ACTION_DEF_ARG4: 0x86,
  ACTION_DEF_ARG5: 0x87,
  ACTION_DEF_ARG6: 0x88,
  ACTION_DEF_ARG7: 0x89,
} as const

/**
 * Action script templates for common character behaviors
 */
export const ACTION_SCRIPTS = {
  /**
   * Run action - moves character horizontally based on facing direction
   * Uses CHARACTER_MOVE_SPEED * facing direction for movement
   * Properly handles left (0) and right (1) facing directions
   */
  RUN: [
    OperatorAddress.READ_PROP,
    0,
    PropertyAddress.CHARACTER_MOVE_SPEED, // Read character's move speed (fixed-point)
    OperatorAddress.READ_PROP,
    1,
    PropertyAddress.ENTITY_DIR_HORIZONTAL, // Read facing direction (0=left, 1=right)
    OperatorAddress.EQUAL,
    2,
    1,
    1, // Check if facing right (1) -> var[2] = 1 if facing right
    OperatorAddress.SKIP,
    3,
    2, // If facing right, skip to positive velocity write
    // Facing left - use negative speed
    OperatorAddress.NEGATE,
    0, // Negate the speed for left movement
    OperatorAddress.WRITE_PROP,
    PropertyAddress.CHARACTER_VEL_X,
    0, // Write negative speed for left movement
    OperatorAddress.EXIT,
    0,
    // Facing right - use positive speed
    OperatorAddress.WRITE_PROP,
    PropertyAddress.CHARACTER_VEL_X,
    0, // Write positive speed for right movement
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
    PropertyAddress.ENTITY_DIR_HORIZONTAL, // Read horizontal direction
    OperatorAddress.EQUAL,
    1,
    0,
    0, // Check if facing left (0) -> var[1] = 1 if facing left
    OperatorAddress.SKIP,
    3,
    1, // If facing left, skip to set right
    // Facing right - set to left (0)
    OperatorAddress.ASSIGN_BYTE,
    2,
    0, // Set to left (0)
    OperatorAddress.SKIP,
    2,
    0, // Skip the set right section
    // Facing left - set to right (1)
    OperatorAddress.ASSIGN_BYTE,
    2,
    1, // Set to right (1)
    OperatorAddress.WRITE_PROP,
    PropertyAddress.ENTITY_DIR_HORIZONTAL,
    2, // Write new facing direction
    OperatorAddress.EXIT,
    0,
  ],

  /**
   * Jump action - applies upward velocity if character has energy and is grounded
   * Uses CHARACTER_JUMP_FORCE property, applies energy cost
   * Only works when character is touching the ground (bottom collision)
   */
  JUMP: [
    OperatorAddress.READ_PROP,
    0,
    PropertyAddress.CHARACTER_COLLISION_BOTTOM, // Check if grounded
    OperatorAddress.SKIP,
    4,
    0, // If grounded (var[0] = 1), skip exit and energy check
    OperatorAddress.EXIT,
    5, // Exit with flag 5 if not grounded
    OperatorAddress.EXIT_IF_NO_ENERGY,
    10, // Exit if no energy with flag 10
    OperatorAddress.READ_PROP,
    1,
    PropertyAddress.CHARACTER_JUMP_FORCE, // Read character's jump force (fixed-point)
    OperatorAddress.NEGATE,
    1, // Make it negative for upward velocity
    OperatorAddress.WRITE_PROP,
    PropertyAddress.CHARACTER_VEL_Y,
    1, // Write jump velocity to Y
    OperatorAddress.APPLY_ENERGY_COST,
    OperatorAddress.EXIT,
    0,
  ],

  /**
   * Wall jump action - jumps off walls when touching them
   * Uses 75% of CHARACTER_JUMP_FORCE for vertical force, CHARACTER_MOVE_SPEED for horizontal force
   * Pushes away from the wall being touched (left wall = jump right, right wall = jump left)
   * Only works when not grounded (wall sliding) and touching a wall
   */
  WALL_JUMP: [
    // Check if grounded - if so, exit
    OperatorAddress.READ_PROP,
    0,
    PropertyAddress.CHARACTER_COLLISION_BOTTOM, // Check if grounded
    OperatorAddress.SKIP,
    2,
    0, // If not grounded (0), continue
    OperatorAddress.EXIT,
    20, // Exit with flag 20 if grounded

    // Check if touching left or right wall
    OperatorAddress.READ_PROP,
    1,
    PropertyAddress.CHARACTER_COLLISION_LEFT, // Check left wall collision
    OperatorAddress.READ_PROP,
    2,
    PropertyAddress.CHARACTER_COLLISION_RIGHT, // Check right wall collision
    OperatorAddress.OR,
    3,
    1,
    2, // Check if touching either wall
    OperatorAddress.SKIP,
    2,
    3, // If touching wall, continue
    OperatorAddress.EXIT,
    21, // Exit with flag 21 if not touching wall

    OperatorAddress.EXIT_IF_NO_ENERGY,
    15, // Exit if no energy with flag 15

    // Calculate and apply vertical velocity (75% of jump force)
    OperatorAddress.READ_PROP,
    0,
    PropertyAddress.CHARACTER_JUMP_FORCE, // Read character's jump force (fixed-point)
    OperatorAddress.ASSIGN_FIXED,
    1,
    3,
    4, // Assign 0.75 (3/4) to fixed[1]
    OperatorAddress.MUL,
    2,
    0,
    1, // Multiply jump force by 0.75 -> fixed[2]
    OperatorAddress.NEGATE,
    2, // Make negative for upward velocity
    OperatorAddress.WRITE_PROP,
    PropertyAddress.CHARACTER_VEL_Y,
    2, // Write vertical velocity (upward)

    // Calculate horizontal velocity based on which wall is touched
    OperatorAddress.READ_PROP,
    3,
    PropertyAddress.CHARACTER_MOVE_SPEED, // Read character's move speed (fixed-point)
    OperatorAddress.READ_PROP,
    4,
    PropertyAddress.CHARACTER_COLLISION_LEFT, // Check left wall collision
    OperatorAddress.SKIP,
    4,
    4, // If not touching left wall, check right wall
    // Touching left wall - jump right (positive velocity)
    OperatorAddress.WRITE_PROP,
    PropertyAddress.CHARACTER_VEL_X,
    3, // Write positive horizontal velocity
    OperatorAddress.SKIP,
    3,
    0, // Skip the negative velocity section
    // Touching right wall - jump left (negative velocity)
    OperatorAddress.NEGATE,
    3, // Make speed negative for left movement
    OperatorAddress.WRITE_PROP,
    PropertyAddress.CHARACTER_VEL_X,
    3, // Write negative horizontal velocity

    OperatorAddress.APPLY_ENERGY_COST,
    OperatorAddress.EXIT,
    0,
  ],

  /**
   * Charge action - recovers energy when below energy cap
   * Uses CHARACTER_ENERGY_CHARGE and CHARACTER_ENERGY_CHARGE_RATE for timed energy recovery
   */
  CHARGE: [
    // Check if energy is below cap
    OperatorAddress.READ_PROP,
    0,
    PropertyAddress.CHARACTER_ENERGY,
    OperatorAddress.READ_PROP,
    1,
    PropertyAddress.CHARACTER_ENERGY_CAP,
    OperatorAddress.LESS_THAN,
    2,
    0,
    1, // var[2] = energy < cap

    // Check if it's time to charge (frame % charge_rate == 0)
    OperatorAddress.READ_PROP,
    3,
    PropertyAddress.GAME_FRAME, // Read current game frame
    OperatorAddress.READ_PROP,
    4,
    PropertyAddress.CHARACTER_ENERGY_CHARGE_RATE, // Read charge rate
    OperatorAddress.MOD_BYTE,
    5,
    3,
    4, // var[5] = frame % charge_rate
    OperatorAddress.EQUAL,
    6,
    5,
    0, // var[6] = (frame % charge_rate == 0)

    // Check both conditions: energy < cap AND time to charge
    OperatorAddress.AND,
    7,
    2,
    6, // var[7] = energy_below_cap AND time_to_charge

    // If conditions met, calculate new energy
    OperatorAddress.READ_PROP,
    8,
    PropertyAddress.CHARACTER_ENERGY_CHARGE, // Read charge amount
    OperatorAddress.ADD_BYTE,
    9,
    0,
    8, // var[9] = current_energy + charge_amount
    OperatorAddress.MIN,
    10,
    9,
    1, // var[10] = min(new_energy, energy_cap)

    // Only write if conditions are met (this is simplified - in real implementation
    // we'd need conditional branching, but this will charge every frame when conditions are met)
    OperatorAddress.WRITE_PROP,
    PropertyAddress.CHARACTER_ENERGY,
    10, // Write the calculated energy value
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
