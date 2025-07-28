/**
 * Robot Masters Game Engine - Script Building Examples
 *
 * This file demonstrates how to use the constants and ScriptBuilder
 * to create game scripts in TypeScript/JavaScript.
 */

import {
  OperatorAddress,
  PropertyAddress,
  Element,
  ScriptBuilder,
} from './constants'

/**
 * Example 1: Simple action script that moves a character forward
 */
export function createMoveForwardScript(): number[] {
  const builder = new ScriptBuilder()

  return (
    builder
      // Exit if not enough energy (requires 10 energy)
      .exitIfNoEnergy(1)

      // Apply energy cost
      .applyEnergyCost()

      // Read current X velocity into variable 0
      .readProperty(0, PropertyAddress.CHARACTER_VEL_X)

      // Read facing direction into fixed variable 0
      .readProperty(0, PropertyAddress.ENTITY_FACING)

      // Set movement speed (2.0 in fixed-point)
      .assignFixed(1, 2, 1) // fixed[1] = 2.0

      // Multiply facing direction by speed: fixed[2] = fixed[0] * fixed[1]
      .mulFixed(2, 0, 1)

      // Write new velocity
      .writeProperty(PropertyAddress.CHARACTER_VEL_X, 2)

      // Apply duration to lock the action
      .applyDuration()

      .build()
  )
}

/**
 * Example 2: Condition script that checks if enemy is nearby
 */
export function createEnemyNearbyCondition(): number[] {
  const builder = new ScriptBuilder()

  return (
    builder
      // Read character position
      .readProperty(0, PropertyAddress.CHARACTER_POS_X) // fixed[0] = my X
      .readProperty(1, PropertyAddress.CHARACTER_POS_Y) // fixed[1] = my Y

      // TODO: In a real implementation, you'd need to iterate through enemies
      // For now, this is a simplified example that always returns true

      // Set result to true (1)
      .assignByte(0, 1) // var[0] = 1 (true)

      // Exit with the result
      .exit(0) // Exit with var[0] value

      .build()
  )
}

/**
 * Example 3: Spawn script for a projectile that moves in a straight line
 */
export function createProjectileScript(): number[] {
  const builder = new ScriptBuilder()

  return (
    builder
      // Read spawn arguments (direction and speed set by spawner)
      .addOperator(OperatorAddress.READ_ARG, 0, 0) // var[0] = direction (0=left, 1=right)
      .addOperator(OperatorAddress.READ_ARG, 1, 1) // var[1] = speed

      // Convert direction to facing value (-1 or 1)
      .assignFixed(0, -1, 1) // fixed[0] = -1.0 (left)
      .assignFixed(1, 1, 1) // fixed[1] = 1.0 (right)

      // TODO: Add conditional logic to choose direction based on var[0]
      // For simplicity, assume moving right

      // Convert speed from byte to fixed-point
      .addOperator(OperatorAddress.TO_FIXED, 2, 1) // fixed[2] = speed as fixed

      // Set velocity
      .writeProperty(PropertyAddress.SPAWN_VEL_X, 2)

      // Set Y velocity to 0
      .assignFixed(3, 0, 1) // fixed[3] = 0.0
      .writeProperty(PropertyAddress.SPAWN_VEL_Y, 3)

      .build()
  )
}

/**
 * Example 4: Status effect script that reduces character speed
 */
export function createSlowStatusEffect(): number[] {
  const builder = new ScriptBuilder()

  return (
    builder
      // Read current X velocity
      .readProperty(0, PropertyAddress.CHARACTER_VEL_X)

      // Multiply by 0.5 to slow down
      .assignFixed(1, 1, 2) // fixed[1] = 0.5
      .mulFixed(2, 0, 1) // fixed[2] = velocity * 0.5

      // Write back the reduced velocity
      .writeProperty(PropertyAddress.CHARACTER_VEL_X, 2)

      // Do the same for Y velocity
      .readProperty(0, PropertyAddress.CHARACTER_VEL_Y)
      .mulFixed(2, 0, 1) // fixed[2] = velocity * 0.5
      .writeProperty(PropertyAddress.CHARACTER_VEL_Y, 2)

      .build()
  )
}

/**
 * Example 5: Complex action that spawns a projectile in the facing direction
 */
export function createFireProjectileScript(): number[] {
  const builder = new ScriptBuilder()

  return (
    builder
      // Check energy requirement
      .exitIfNoEnergy(1)

      // Check cooldown
      .exitIfCooldown(1)

      // Apply energy cost
      .applyEnergyCost()

      // Get character position for spawn location
      .readProperty(0, PropertyAddress.CHARACTER_POS_X)
      .readProperty(1, PropertyAddress.CHARACTER_POS_Y)

      // Get facing direction
      .readProperty(2, PropertyAddress.ENTITY_FACING)

      // Set spawn ID (assuming projectile is spawn definition 0)
      .assignByte(0, 0) // var[0] = spawn ID

      // Spawn the projectile with variables
      .addOperator(OperatorAddress.SPAWN_WITH_VARS, 0, 2, 10, 0, 0) // spawn with facing and speed=10

      // Apply duration to prevent immediate re-firing
      .applyDuration()

      .build()
  )
}

/**
 * Example 6: Test frame execution and timing functionality
 */
export function testFrameExecution() {
  // This would be used in a test environment to verify frame stepping
  console.log('Testing frame execution functionality...')

  // Example usage:
  // const wrapper = new GameWrapper(JSON.stringify(createExampleGameConfig()))
  // wrapper.new_game()
  //
  // console.log('Initial frame:', wrapper.get_frame()) // Should be 0
  // console.log('Game status:', wrapper.get_game_status()) // Should be "playing"
  // console.log('Frame info:', wrapper.get_frame_info_json())
  //
  // // Step a few frames
  // for (let i = 0; i < 10; i++) {
  //   wrapper.step_frame()
  //   console.log(`Frame ${i + 1}:`, wrapper.get_frame())
  // }
  //
  // console.log('Final frame info:', wrapper.get_frame_info_json())
  // console.log('Game ended:', wrapper.is_game_ended())
}

/**
 * Helper function to create a basic game configuration with example scripts
 */
export function createExampleGameConfig() {
  return {
    seed: 12345,
    tilemap: Array(15)
      .fill(null)
      .map(() => Array(16).fill(0)), // Empty arena
    characters: [
      {
        id: 1,
        group: 1,
        position: [5.0, 5.0],
        health: 100,
        energy: 100,
        armor: [100, 100, 100, 100, 100, 100, 100, 100, 100],
        energy_regen: 1,
        energy_regen_rate: 60,
        energy_charge: 5,
        energy_charge_rate: 10,
        behaviors: [[0, 0]], // Use condition 0 to trigger action 0
      },
    ],
    actions: [
      {
        energy_cost: 20,
        interval: 1,
        duration: 30,
        cooldown: 60,
        args: [0, 0, 0, 0, 0, 0, 0, 0],
        spawns: [0, 0, 0, 0],
        script: createFireProjectileScript(),
      },
    ],
    conditions: [
      {
        energy_mul: 1.0,
        args: [0, 0, 0, 0, 0, 0, 0, 0],
        script: createEnemyNearbyCondition(),
      },
    ],
    spawns: [
      {
        damage_base: 25,
        health_cap: 1,
        duration: 180, // 3 seconds at 60fps
        element: Element.PUNCT,
        args: [0, 0, 0, 0, 0, 0, 0, 0],
        spawns: [0, 0, 0, 0],
        behavior_script: createProjectileScript(),
        collision_script: [OperatorAddress.EXIT, 1], // Simple collision: just exit
        despawn_script: [OperatorAddress.EXIT, 0], // Simple despawn: just exit
      },
    ],
    status_effects: [
      {
        duration: 300, // 5 seconds
        stack_limit: 3,
        reset_on_stack: false,
        args: [0, 0, 0, 0, 0, 0, 0, 0],
        spawns: [0, 0, 0, 0],
        on_script: [OperatorAddress.EXIT, 0], // No on-apply effect
        tick_script: createSlowStatusEffect(), // Apply slow effect each frame
        off_script: [OperatorAddress.EXIT, 0], // No on-remove effect
      },
    ],
  }
}
