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
   * Turn around action - flips direction AND sets velocity to push away from wall
   * This prevents oscillation by immediately moving away from the wall
   */
  TURN_AROUND: [
    // Read current direction
    OperatorAddress.READ_PROP,
    0,
    PropertyAddress.ENTITY_DIR_HORIZONTAL, // Read current direction into fixed[0]
    // Negate direction (flip it)
    OperatorAddress.NEGATE,
    0, // Negate fixed[0] (flip direction)
    // Write new direction
    OperatorAddress.WRITE_PROP,
    PropertyAddress.ENTITY_DIR_HORIZONTAL,
    0, // Write fixed[0] back to direction
    // Read move speed
    OperatorAddress.READ_PROP,
    1,
    PropertyAddress.CHARACTER_MOVE_SPEED, // Read move speed into fixed[1]
    // Calculate velocity = new_direction * move_speed
    OperatorAddress.MUL,
    2,
    0,
    1, // fixed[2] = fixed[0] * fixed[1] (new direction * speed)
    // Write velocity to push away from wall
    OperatorAddress.WRITE_PROP,
    PropertyAddress.CHARACTER_VEL_X,
    2, // Write fixed[2] to velocity
    OperatorAddress.EXIT,
    1, // Exit with success
  ],

  /**
   * Run action - moves character using movespeed * horizontal_dir
   * Fixed implementation: Use direct velocity assignment based on direction
   */
  RUN: [
    // Read current horizontal direction
    OperatorAddress.READ_PROP,
    0,
    PropertyAddress.ENTITY_DIR_HORIZONTAL, // Read direction into fixed[0] (-1.0, 0.0, +1.0)
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
   * Jump action - FIXED for inverted gravity
   * Jumps away from the surface the character is grounded on
   * If gravity is upward (dir[1] = 2), jump downward (positive velocity)
   * If gravity is downward (dir[1] = 0), jump upward (negative velocity)
   */
  JUMP: [
    OperatorAddress.EXIT_IF_NO_ENERGY,
    10, // Exit if not enough energy for jump

    // Read gravity direction
    OperatorAddress.READ_PROP,
    0,
    PropertyAddress.ENTITY_DIR_VERTICAL, // fixed[0] = gravity direction (0=down, 2=up)

    // Read jump force
    OperatorAddress.READ_PROP,
    1,
    PropertyAddress.CHARACTER_JUMP_FORCE, // fixed[1] = jump force

    // Calculate jump direction based on gravity
    // If gravity is upward (2), jump downward (positive velocity)
    // If gravity is downward (0), jump upward (negative velocity)
    OperatorAddress.EQUAL,
    2,
    0,
    2, // fixed[2] = (gravity == 2) - true if upward gravity

    // Convert boolean to direction multiplier
    // upward_gravity ? +1 : -1
    OperatorAddress.MUL,
    3,
    2,
    1, // fixed[3] = upward_gravity * jump_force (positive if upward gravity)
    OperatorAddress.NEGATE,
    4,
    1, // fixed[4] = -jump_force
    OperatorAddress.NOT,
    5,
    2, // fixed[5] = !upward_gravity (downward gravity)
    OperatorAddress.MUL,
    6,
    5,
    4, // fixed[6] = downward_gravity * (-jump_force)
    OperatorAddress.ADD,
    7,
    3,
    6, // fixed[7] = final jump velocity

    // Write jump velocity
    OperatorAddress.WRITE_PROP,
    PropertyAddress.CHARACTER_VEL_Y,
    7, // Write calculated jump velocity

    // Apply energy cost
    OperatorAddress.APPLY_ENERGY_COST,
    OperatorAddress.EXIT,
    1, // Exit with success
  ],

  /**
   * Wall jump action - Task 22 implementation
   * Exact copy of TURN_AROUND + JUMP scripts combined
   * Requirements: Character must be wall leaning AND airborne
   * Action: Turn around and jump with full jump force (simplified)
   */
  WALL_JUMP: [
    // TURN AROUND: Exact copy of working TURN_AROUND script
    OperatorAddress.READ_PROP,
    0,
    PropertyAddress.ENTITY_DIR_HORIZONTAL, // Read current direction into fixed[0]
    OperatorAddress.NEGATE,
    0, // Negate fixed[0] (flip direction)
    OperatorAddress.WRITE_PROP,
    PropertyAddress.ENTITY_DIR_HORIZONTAL,
    0, // Write fixed[0] back to direction
    OperatorAddress.READ_PROP,
    1,
    PropertyAddress.CHARACTER_MOVE_SPEED, // Read move speed into fixed[1]
    OperatorAddress.MUL,
    2,
    0,
    1, // fixed[2] = new_direction * move_speed
    OperatorAddress.WRITE_PROP,
    PropertyAddress.CHARACTER_VEL_X,
    2, // Write horizontal velocity

    // JUMP: Exact copy of working JUMP script (without energy check)
    OperatorAddress.READ_PROP,
    3,
    PropertyAddress.CHARACTER_JUMP_FORCE, // Read jump force into fixed[3]
    OperatorAddress.NEGATE,
    3, // Negate jump force for upward movement
    OperatorAddress.WRITE_PROP,
    PropertyAddress.CHARACTER_VEL_Y,
    3, // Write negated jump force to velocity

    // Apply energy cost and exit
    OperatorAddress.APPLY_ENERGY_COST,
    OperatorAddress.EXIT,
    1, // Exit with success
  ],

  /**
   * Invert gravity action - Task 23 implementation (ULTRA SIMPLE)
   * Just sets gravity to upward (2) for testing
   */
  INVERT_GRAVITY: [
    // Ultra simple: just set to 2 (upward gravity)
    OperatorAddress.ASSIGN_BYTE,
    0,
    2, // vars[0] = 2
    OperatorAddress.WRITE_PROP,
    PropertyAddress.ENTITY_DIR_VERTICAL,
    0, // Write vars[0] to vertical direction
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

  /**
   * Is wall leaning and airborne condition - Task 22 implementation
   * Returns true when character is touching a wall (left OR right) AND not touching ground
   * This is the condition for wall jump behavior
   * Fixed: Use same pattern as IS_WALL_LEANING but add airborne check
   */
  IS_WALL_LEANING_AND_AIRBORNE: [
    // Check if touching right wall
    OperatorAddress.READ_PROP,
    0,
    PropertyAddress.CHARACTER_COLLISION_RIGHT, // vars[0] = right collision (0 or 1)

    // Check if touching left wall
    OperatorAddress.READ_PROP,
    1,
    PropertyAddress.CHARACTER_COLLISION_LEFT, // vars[1] = left collision (0 or 1)

    // Check if touching ground
    OperatorAddress.READ_PROP,
    2,
    PropertyAddress.CHARACTER_COLLISION_BOTTOM, // vars[2] = bottom collision (0 or 1)

    // Check if touching any wall (left OR right)
    OperatorAddress.OR,
    3,
    0,
    1, // vars[3] = right_collision OR left_collision

    // Check if airborne (NOT touching ground)
    OperatorAddress.NOT,
    4,
    2, // vars[4] = NOT bottom_collision

    // Final condition: touching wall AND airborne
    OperatorAddress.AND,
    5,
    3,
    4, // vars[5] = touching_wall AND airborne

    OperatorAddress.EXIT_WITH_VAR,
    5, // Exit with result (true if wall leaning and airborne)
  ],

  /**
   * Only once condition - Task 23 implementation
   * Returns true only on frame 1, false on all subsequent frames
   * Used to trigger one-time actions like gravity inversion
   */
  ONLY_ONCE: [
    // ONLY_ONCE using vars flag - returns true once, then false (exit 0) to allow other behaviors
    OperatorAddress.ASSIGN_BYTE,
    1,
    1, // vars[1] = 1
    OperatorAddress.EQUAL,
    2,
    0,
    1, // vars[2] = (vars[0] == 1) - true if already used
    OperatorAddress.NOT,
    3,
    2, // vars[3] = !vars[2] - true if NOT used yet
    OperatorAddress.ASSIGN_BYTE,
    0,
    1, // vars[0] = 1 (mark as used)
    OperatorAddress.EXIT_WITH_VAR,
    3, // Exit with vars[3] as exit code (1 first time, 0 after = false)
  ],

  /**
   * Is grounded condition - FIXED for inverted gravity
   * Checks appropriate collision based on gravity direction
   * If gravity is upward (dir[1] = 2), check top collision (ceiling = ground)
   * If gravity is downward (dir[1] = 0), check bottom collision (floor = ground)
   */
  IS_GROUNDED_GRAVITY_AWARE: [
    // Read vertical direction to determine gravity
    OperatorAddress.READ_PROP,
    0,
    PropertyAddress.ENTITY_DIR_VERTICAL, // vars[0] = gravity direction (0=down, 2=up)

    // Check if gravity is upward (dir[1] = 2)
    OperatorAddress.EQUAL,
    1,
    0,
    2, // vars[1] = (gravity == 2) - true if upward gravity

    // Read collision flags
    OperatorAddress.READ_PROP,
    2,
    PropertyAddress.CHARACTER_COLLISION_TOP, // vars[2] = top collision
    OperatorAddress.READ_PROP,
    3,
    PropertyAddress.CHARACTER_COLLISION_BOTTOM, // vars[3] = bottom collision

    // Calculate grounded state based on gravity direction
    // If upward gravity: grounded = top collision
    // If downward gravity: grounded = bottom collision
    OperatorAddress.MUL_BYTE,
    4,
    1,
    2, // vars[4] = upward_gravity * top_collision
    OperatorAddress.NOT,
    5,
    1, // vars[5] = !upward_gravity (downward gravity)
    OperatorAddress.MUL_BYTE,
    6,
    5,
    3, // vars[6] = downward_gravity * bottom_collision
    OperatorAddress.OR,
    7,
    4,
    6, // vars[7] = (upward_gravity * top_collision) | (downward_gravity * bottom_collision)

    OperatorAddress.EXIT_WITH_VAR,
    7, // Exit with grounded state
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
