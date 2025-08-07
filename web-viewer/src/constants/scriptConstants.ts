/**
 * Script Constants Library
 *
 * Predefined script templates for common actions and conditions.
 * These constants provide easy-to-use bytecode arrays for testing different character behaviors.
 *
 * DIRECTION SYSTEM (UPDATED):
 * Both horizontal and vertical directions use the 0,1,2 pattern for consistency:
 *
 * HORIZONTAL DIRECTION (ENTITY_DIR_HORIZONTAL):
 * - Game State: dir.0 = 0 (left), 1 (neutral), 2 (right)
 * - Script Access: Fixed values -1.0 (left), 0.0 (neutral), +1.0 (right)
 * - Conversion: script_value = game_state_value - 1, game_state_value = script_value + 1
 * - Usage: Multiply by move_speed for velocity calculation
 *
 * VERTICAL DIRECTION (ENTITY_DIR_VERTICAL):
 * - Game State: dir.1 = 0 (downward), 1 (neutral), 2 (upward)
 * - Script Access: Fixed values for gravity multiplier
 * - Usage: Multiply by game_gravity for gravity effect
 *
 * COLLISION PROPERTIES:
 * All collision properties are now properly implemented in both ConditionContext and ActionContext:
 * - CHARACTER_COLLISION_TOP, CHARACTER_COLLISION_RIGHT, CHARACTER_COLLISION_BOTTOM, CHARACTER_COLLISION_LEFT
 * - Return u8 values: 0 (not colliding), 1 (colliding)
 * - Accessible via READ_PROP in both conditions and actions
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
 * Action script templates - FRESH START
 */
export const ACTION_SCRIPTS = {
  /**
   * Turn around action - flips the character's facing direction
   * Simple approach: negate the current direction
   */
  TURN_AROUND: [
    OperatorAddress.READ_PROP,
    0,
    PropertyAddress.ENTITY_DIR_HORIZONTAL, // Read current direction into fixed[0] (as Fixed)
    OperatorAddress.NEGATE,
    0, // Negate fixed[0] (flip direction)
    OperatorAddress.WRITE_PROP,
    PropertyAddress.ENTITY_DIR_HORIZONTAL,
    0, // Write fixed[0] back to direction
    OperatorAddress.EXIT,
    1, // Exit with success
  ],

  /**
   * Run action - moves character using movespeed * horizontal_dir
   * New system: direction is Fixed (-1.0=left, 0.0=neutral, +1.0=right)
   */
  RUN: [
    // Read current horizontal direction
    OperatorAddress.READ_PROP,
    0,
    PropertyAddress.ENTITY_DIR_HORIZONTAL, // Read direction into fixed[0]
    // Read move speed
    OperatorAddress.READ_PROP,
    1,
    PropertyAddress.CHARACTER_MOVE_SPEED, // Read move speed into fixed[1]
    // Multiply direction * move speed
    OperatorAddress.MUL,
    2,
    0,
    1, // fixed[2] = fixed[0] * fixed[1] (direction * speed)
    // Write result to velocity
    OperatorAddress.WRITE_PROP,
    PropertyAddress.CHARACTER_VEL_X,
    2, // Write fixed[2] to velocity
    OperatorAddress.EXIT,
    1, // Exit with success
  ],

  /**
   * Jump action - applies upward velocity using jump_force
   * Works with gravity system - gravity will pull character back down
   */
  JUMP: [
    OperatorAddress.EXIT_IF_NO_ENERGY,
    10, // Exit if not enough energy for jump
    // Read jump force
    OperatorAddress.READ_PROP,
    0,
    PropertyAddress.CHARACTER_JUMP_FORCE, // Read jump force into fixed[0]
    // Apply negative jump force (upward velocity)
    OperatorAddress.NEGATE,
    0, // Negate jump force for upward movement
    // Write to vertical velocity
    OperatorAddress.WRITE_PROP,
    PropertyAddress.CHARACTER_VEL_Y,
    0, // Write negated jump force to velocity
    // Apply energy cost
    OperatorAddress.APPLY_ENERGY_COST,
    OperatorAddress.EXIT,
    1, // Exit with success
  ],

  /**
   * Wall jump action - jumps away from wall with both vertical and horizontal velocity
   * Detects which wall is being touched and jumps in opposite direction
   */
  WALL_JUMP: [
    OperatorAddress.EXIT_IF_NO_ENERGY,
    15, // Exit if not enough energy
    // Check if touching right wall
    OperatorAddress.READ_PROP,
    0,
    PropertyAddress.CHARACTER_COLLISION_RIGHT,
    // Check if touching left wall
    OperatorAddress.READ_PROP,
    1,
    PropertyAddress.CHARACTER_COLLISION_LEFT,
    // Must be touching at least one wall
    OperatorAddress.OR,
    2,
    0,
    1, // vars[2] = touching any wall
    // Exit if not touching wall
    OperatorAddress.NOT,
    3,
    2, // vars[3] = NOT touching wall
    // Skip if not touching wall (jump to exit)
    OperatorAddress.GOTO,
    3,
    25, // Jump to exit if not touching wall
    // Apply upward velocity (jump force)
    OperatorAddress.READ_PROP,
    4, // Use fixed[4] for jump force
    PropertyAddress.CHARACTER_JUMP_FORCE,
    OperatorAddress.NEGATE,
    4, // Negate for upward movement
    OperatorAddress.WRITE_PROP,
    PropertyAddress.CHARACTER_VEL_Y,
    4, // Apply upward velocity
    // Determine horizontal direction (away from wall)
    // If touching right wall, go left (-1.0)
    // If touching left wall, go right (+1.0)
    OperatorAddress.ASSIGN_FIXED,
    5,
    -1,
    1, // fixed[5] = -1.0 (left direction)
    OperatorAddress.ASSIGN_FIXED,
    6,
    1,
    1, // fixed[6] = +1.0 (right direction)
    // Choose direction based on wall collision
    OperatorAddress.ASSIGN_FIXED,
    7,
    0,
    1, // fixed[7] = 0.0 (default)
    // If right collision, use left direction
    OperatorAddress.ASSIGN_FIXED,
    8,
    0,
    1, // fixed[8] = 0.0 for comparison
    OperatorAddress.NOT_EQUAL,
    9,
    0,
    8, // vars[9] = (right_collision != 0)
    OperatorAddress.MUL,
    10,
    5,
    9, // fixed[10] = left_dir * right_collision_flag
    // If left collision, use right direction
    OperatorAddress.NOT_EQUAL,
    11,
    1,
    8, // vars[11] = (left_collision != 0)
    OperatorAddress.MUL,
    12,
    6,
    11, // fixed[12] = right_dir * left_collision_flag
    // Combine directions
    OperatorAddress.ADD,
    13,
    10,
    12, // fixed[13] = final horizontal direction
    // Apply horizontal velocity (reduced speed for wall jump)
    OperatorAddress.READ_PROP,
    14,
    PropertyAddress.CHARACTER_MOVE_SPEED,
    OperatorAddress.MUL,
    15,
    13,
    14, // fixed[15] = direction * move_speed
    OperatorAddress.WRITE_PROP,
    PropertyAddress.CHARACTER_VEL_X,
    15, // Apply horizontal velocity
    // Apply energy cost
    OperatorAddress.APPLY_ENERGY_COST,
    OperatorAddress.EXIT,
    1, // Exit with success
  ],
} as const

/**
 * Condition script templates - FRESH START
 */
export const CONDITION_SCRIPTS = {
  /**
   * Always condition - always returns true
   */
  ALWAYS: [
    OperatorAddress.ASSIGN_BYTE,
    0,
    1, // Set var[0] = 1 (true)
    OperatorAddress.EXIT_WITH_VAR,
    0, // Exit with var[0] (true)
  ],

  /**
   * Is wall leaning condition - simplified to just check if touching any wall
   * This should trigger when character hits left or right walls
   */
  IS_WALL_LEANING: [
    OperatorAddress.READ_PROP,
    0,
    PropertyAddress.CHARACTER_COLLISION_RIGHT, // Read right collision
    OperatorAddress.READ_PROP,
    1,
    PropertyAddress.CHARACTER_COLLISION_LEFT, // Read left collision
    OperatorAddress.OR,
    2,
    0,
    1, // vars[2] = right_collision OR left_collision
    OperatorAddress.EXIT_WITH_VAR,
    2, // Exit with result (true if touching any wall)
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
