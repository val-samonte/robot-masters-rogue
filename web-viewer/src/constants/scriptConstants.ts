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

// Import constants from wasm-wrapper project to avoid magic numbers
import {
  OperatorAddress,
  PropertyAddress,
} from '../../../wasm-wrapper/tests/constants'

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
   * Jump action - GRAVITY-AWARE using EXIT_IF_NOT_GROUNDED
   * Fresh implementation from scratch for Task 26
   *
   * Logic:
   * 1. Check if grounded (exit if not)
   * 2. Check if enough energy (exit if not)
   * 3. Read gravity direction to determine jump direction
   * 4. Apply jump force in direction away from grounded surface
   * 5. Apply energy cost
   *
   * Gravity-aware jumping:
   * - Normal gravity (dir.1 = 0): Jump upward (negative velocity)
   * - Inverted gravity (dir.1 = 2): Jump downward (positive velocity)
   */
  JUMP: [
    // Exit if not grounded (gravity-aware check)
    OperatorAddress.EXIT_IF_NOT_GROUNDED,
    0, // exit_flag = 0 (if not grounded, try next behavior)

    // Exit if not enough energy
    OperatorAddress.EXIT_IF_NO_ENERGY,
    0, // exit_flag = 0 (if no energy, try next behavior)

    // Read gravity direction into fixed[0] (ENTITY_DIR uses fixed array)
    OperatorAddress.READ_PROP,
    0,
    PropertyAddress.ENTITY_DIR_VERTICAL, // fixed[0] = gravity direction

    // Read jump force into fixed[1]
    OperatorAddress.READ_PROP,
    1,
    PropertyAddress.CHARACTER_JUMP_FORCE, // fixed[1] = jump force

    // Calculate jump velocity: jump_force * gravity_direction * -1
    // As per entity_dir_script_access.md documentation
    OperatorAddress.MUL,
    1,
    1,
    0, // fixed[1] = jump_force * gravity_direction (reuse fixed[1])

    // Multiply by -1 (as required by documentation)
    OperatorAddress.NEGATE,
    1, // fixed[1] = -(jump_force * gravity_direction)

    // Write jump velocity to character
    OperatorAddress.WRITE_PROP,
    PropertyAddress.CHARACTER_VEL_Y,
    1, // Set vertical velocity to calculated jump velocity

    // Apply energy cost and exit
    OperatorAddress.APPLY_ENERGY_COST,
    OperatorAddress.EXIT,
    1, // exit_flag = 1 (action succeeded)
  ],

  /**
   * Wall jump action - GRAVITY-AWARE
   * FIXED: Proper EXIT operator compliance with correct exit_flag parameters
   * Requirements: Character must be wall leaning AND airborne
   * Action: Turn around and jump with gravity-aware trajectory
   * Combines horizontal movement (away from wall) with vertical movement (away from gravity)
   */
  WALL_JUMP: [
    // Exit if not enough energy for wall jump
    OperatorAddress.EXIT_IF_NO_ENERGY,
    0, // exit_flag = 0 (if no energy, try next behavior)

    // HORIZONTAL COMPONENT: Turn around and move away from wall
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

    // VERTICAL COMPONENT: Gravity-aware jump
    // Read gravity direction (stored as Fixed in script context)
    OperatorAddress.READ_PROP,
    3,
    PropertyAddress.ENTITY_DIR_VERTICAL, // fixed[3] = gravity direction as Fixed

    // Read jump force
    OperatorAddress.READ_PROP,
    4,
    PropertyAddress.CHARACTER_JUMP_FORCE, // fixed[4] = jump force

    // Calculate jump velocity: jump_force * dir.1
    // This automatically handles gravity direction:
    // - dir.1 = -1 (downward gravity): negative velocity (jump up)
    // - dir.1 = 1 (upward gravity): positive velocity (jump down)
    OperatorAddress.MUL,
    5,
    4,
    3, // fixed[5] = jump_force * gravity_direction

    // Write jump velocity
    OperatorAddress.WRITE_PROP,
    PropertyAddress.CHARACTER_VEL_Y,
    5, // Write calculated jump velocity

    // Apply energy cost and exit
    OperatorAddress.APPLY_ENERGY_COST,
    OperatorAddress.EXIT,
    1, // Exit with success
  ],

  /**
   * Invert gravity action - Task 23 implementation
   * Read current gravity direction, negate it, write it back
   * This flips between upward (-1.0) and downward (+1.0) gravity
   */
  INVERT_GRAVITY: [
    // Read current gravity direction
    OperatorAddress.READ_PROP,
    0,
    PropertyAddress.ENTITY_DIR_VERTICAL, // Read current gravity direction into fixed[0]
    // Negate direction (flip it)
    OperatorAddress.NEGATE,
    0, // Negate fixed[0] (flip gravity direction)
    // Write new direction back
    OperatorAddress.WRITE_PROP,
    PropertyAddress.ENTITY_DIR_VERTICAL,
    0, // Write fixed[0] back to gravity direction
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

  // IS_WALL_SLIDING: [
  //   OperatorAddress.READ_PROP,
  //   0,
  //   PropertyAddress.CHARACTER_COLLISION_RIGHT, // Read right collision
  //   OperatorAddress.READ_PROP,
  //   1,
  //   PropertyAddress.CHARACTER_COLLISION_LEFT, // Read left collision
  //   OperatorAddress.OR,
  //   2,
  //   0,
  //   1, // vars[2] = right_collision OR left_collision
  //   OperatorAddress.EXIT_WITH_VAR,
  //   2, // Exit with result (true if touching any wall)
  // ],

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

  IS_GROUNDED: [
    OperatorAddress.EXIT_IF_NOT_GROUNDED, // Use gravity-aware operator
    0, // exit_flag = 0 (if not grounded, proceed to next behavior)
    OperatorAddress.EXIT, // If grounded, exit with success
    1, // exit_flag = 1 (condition succeeds, execute action)
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
