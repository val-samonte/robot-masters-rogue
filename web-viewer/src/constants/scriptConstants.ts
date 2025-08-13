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
   * Uses EXIT_IF_NOT_GROUNDED operator for additional safety (belt and suspenders approach)
   * The IS_GROUNDED condition should handle primary grounding check
   * Uses dir.1 as multiplier: jump_force * dir.1 for gravity-aware jumping
   * - dir.1 = -1 (downward gravity): jump upward (negative velocity)
   * - dir.1 = 0 (neutral gravity): no jump (zero velocity)
   * - dir.1 = 1 (upward gravity): jump downward (positive velocity)
   */
  JUMP: [
    // Check if grounded using gravity-aware operator (safety check)
    OperatorAddress.EXIT_IF_NOT_GROUNDED,
    0, // exit_flag = 0 (if not grounded, try next behavior)

    // Exit if not enough energy for jump
    OperatorAddress.EXIT_IF_NO_ENERGY,
    0, // exit_flag = 0 (if no energy, try next behavior)

    // Read gravity direction (stored as fixed)
    OperatorAddress.READ_PROP,
    0,
    PropertyAddress.ENTITY_DIR_VERTICAL,

    // Read jump force
    OperatorAddress.READ_PROP,
    1,
    PropertyAddress.CHARACTER_JUMP_FORCE, // fixed[1] = jump force

    // Calculate jump velocity: jump_force * dir.1
    // This automatically handles gravity direction:
    // - dir.1 = -1 (downward gravity): negative velocity (jump up)
    // - dir.1 = 1 (upward gravity): positive velocity (jump down)
    OperatorAddress.MUL,
    2,
    1,
    0, // fixed[2] = jump_force * gravity_direction

    // Write jump velocity
    OperatorAddress.WRITE_PROP,
    PropertyAddress.CHARACTER_VEL_Y,
    2, // Write calculated jump velocity

    // Apply energy cost
    OperatorAddress.APPLY_ENERGY_COST,
    OperatorAddress.EXIT,
    1, // Exit with success
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
   * Is grounded condition - GRAVITY-AWARE using EXIT_IF_NOT_GROUNDED operator
   * Uses the gravity-aware EXIT_IF_NOT_GROUNDED operator which should work in conditions
   * The game engine implements is_grounded() in both ConditionContext and ActionContext
   * Automatically checks appropriate collision based on gravity direction:
   * - dir[1] = 0 (downward gravity): checks bottom collision (floor)
   * - dir[1] = 2 (upward gravity): checks top collision (ceiling)
   * - dir[1] = 1 (neutral gravity): checks bottom collision (default)
   */
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
