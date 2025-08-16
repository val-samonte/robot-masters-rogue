// Import constants from wasm-wrapper project to avoid magic numbers
import {
  OperatorAddress,
  PropertyAddress,
} from '../../../wasm-wrapper/tests/constants'

export const ACTION_SCRIPTS = {
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

  WALL_JUMP: [],

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

export const CONDITION_SCRIPTS = {
  ALWAYS: [
    OperatorAddress.ASSIGN_BYTE,
    0,
    1, // Set var[0] = 1 (true)
    OperatorAddress.EXIT_WITH_VAR,
    0, // Exit with var[0] (true)
  ],
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
