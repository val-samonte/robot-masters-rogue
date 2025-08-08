#!/usr/bin/env node

// Debug script to test collision flags during running and direction changes
// This tests the critical scenario: run toward wall → hit wall → turn around → run away

import { GameWrapper } from '../wasm-wrapper/pkg/wasm_wrapper.js'

// Test configuration with character that can run and turn around
const gameConfig = {
  seed: 12345,
  gravity: [1, 1],
  tilemap: [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
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
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  ],
  characters: [
    {
      id: 0,
      group: 0,
      position: [
        [100, 1],
        [208, 1],
      ], // Start away from walls, on ground
      size: [16, 16],
      health: 100,
      health_cap: 100,
      energy: 100,
      energy_cap: 100,
      power: 10,
      weight: 5,
      jump_force: [5, 1],
      move_speed: [3, 1], // Fast movement speed
      armor: [0, 0, 0, 0, 0, 0, 0, 0, 0],
      energy_regen: 1,
      energy_regen_rate: 60,
      energy_charge: 2,
      energy_charge_rate: 30,
      dir: [2, 0], // Start facing right
      enmity: 0,
      target_id: null,
      target_type: 0,
      behaviors: [
        [0, 0], // Condition 0 → Action 0 (run behavior)
      ],
    },
  ],
  actions: [
    {
      energy_cost: 0,
      cooldown: 0,
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      spawns: [0, 0, 0, 0],
      // Script: Run right if not hitting right wall, run left if hitting right wall
      script: [
        // Read right collision flag
        15,
        0,
        39, // READ_PROP var[0] = CHARACTER_COLLISION_RIGHT

        // If right collision (var[0] == 1), set direction to left (0)
        50,
        0,
        1, // EQUAL var[0] == 1
        11,
        12, // GOTO 12 if equal (right collision detected)

        // No right collision - run right
        20,
        1,
        2, // ASSIGN_BYTE var[1] = 2 (right direction)
        11,
        15, // GOTO 15 (skip left direction)

        // Right collision detected - run left
        20,
        1,
        0, // ASSIGN_BYTE var[1] = 0 (left direction)

        // Set horizontal direction
        16,
        64,
        1, // WRITE_PROP ENTITY_DIR_HORIZONTAL = var[1]

        // Set horizontal velocity based on direction
        15,
        2,
        31, // READ_PROP var[2] = CHARACTER_MOVE_SPEED

        // If direction is left (0), negate velocity
        50,
        1,
        0, // EQUAL var[1] == 0 (left direction)
        11,
        25, // GOTO 25 if left

        // Right direction - positive velocity
        16,
        20,
        2, // WRITE_PROP CHARACTER_VEL_X = var[2]
        11,
        27, // GOTO end

        // Left direction - negative velocity
        34,
        2, // NEGATE var[2] (make velocity negative)
        16,
        20,
        2, // WRITE_PROP CHARACTER_VEL_X = var[2]

        0,
        1, // EXIT with success
      ],
    },
  ],
  conditions: [
    {
      energy_mul: 32, // 1.0 in Fixed-point (raw value)
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      script: [0, 1], // Always return true
    },
  ],
  spawns: [],
  status_effects: [],
}

function testRunningCollision() {
  console.log('=== Testing Running Collision Behavior ===\n')

  const gameWrapper = new GameWrapper(JSON.stringify(gameConfig))
  gameWrapper.new_game()

  console.log(
    'Scenario: Character runs right → hits wall → turns left → runs away from wall\n'
  )

  let hitWall = false
  let turnedAround = false

  for (let frame = 0; frame < 50; frame++) {
    const beforeChars = JSON.parse(gameWrapper.get_characters_json())
    const beforeChar = beforeChars[0]

    gameWrapper.step_frame()

    const afterChars = JSON.parse(gameWrapper.get_characters_json())
    const afterChar = afterChars[0]

    const posX = afterChar.position[0][0] / 32
    const velX = afterChar.velocity[0][0] / 32
    const direction = afterChar.dir[0] // 0=left, 1=neutral, 2=right
    const rightCollision = afterChar.collision[1]

    // Detect key events
    if (rightCollision && !hitWall) {
      hitWall = true
      console.log(`Frame ${frame}: HIT RIGHT WALL!`)
      console.log(`  Position: x=${posX.toFixed(1)}`)
      console.log(`  Right collision: ${rightCollision}`)
      console.log(
        `  Direction: ${direction} (${
          direction === 0 ? 'left' : direction === 2 ? 'right' : 'neutral'
        })`
      )
      console.log(`  Velocity: ${velX.toFixed(2)}`)
    }

    if (hitWall && direction === 0 && !turnedAround) {
      turnedAround = true
      console.log(`\nFrame ${frame}: TURNED AROUND!`)
      console.log(`  Position: x=${posX.toFixed(1)}`)
      console.log(`  Right collision: ${rightCollision}`)
      console.log(`  Direction: ${direction} (left)`)
      console.log(`  Velocity: ${velX.toFixed(2)}`)
    }

    // Check if character successfully moved away from wall
    if (turnedAround && !rightCollision) {
      console.log(`\nFrame ${frame}: SUCCESSFULLY MOVED AWAY FROM WALL!`)
      console.log(`  Position: x=${posX.toFixed(1)}`)
      console.log(`  Right collision: ${rightCollision} (should be false)`)
      console.log(`  Direction: ${direction} (left)`)
      console.log(`  Velocity: ${velX.toFixed(2)}`)
      console.log(
        '\n✅ SUCCESS: Character can get out of wall collision state when turning around'
      )
      break
    }

    // Log every few frames for debugging
    if (frame % 5 === 0 || hitWall || turnedAround) {
      console.log(
        `Frame ${frame}: x=${posX.toFixed(1)}, vel=${velX.toFixed(
          2
        )}, dir=${direction}, right_collision=${rightCollision}`
      )
    }

    // Safety check - if we're stuck for too long
    if (frame > 40 && hitWall && !turnedAround) {
      console.log('\n❌ FAILURE: Character stuck at wall, not turning around')
      break
    }

    if (frame > 45 && turnedAround && rightCollision) {
      console.log(
        '\n❌ FAILURE: Character turned around but still detecting wall collision'
      )
      break
    }
  }

  gameWrapper.free()
}

function testWallLeaning() {
  console.log('\n\n=== Testing Wall Leaning Behavior ===\n')

  // Test character starting very close to right wall
  const leanConfig = JSON.parse(JSON.stringify(gameConfig))
  leanConfig.characters[0].position = [
    [220, 1],
    [208, 1],
  ] // Very close to right wall
  leanConfig.characters[0].dir = [2, 0] // Facing right initially

  const gameWrapper = new GameWrapper(JSON.stringify(leanConfig))
  gameWrapper.new_game()

  console.log(
    'Scenario: Character starts near wall → leans against it → turns around → runs away\n'
  )

  for (let frame = 0; frame < 20; frame++) {
    gameWrapper.step_frame()

    const chars = JSON.parse(gameWrapper.get_characters_json())
    const char = chars[0]

    const posX = char.position[0][0] / 32
    const velX = char.velocity[0][0] / 32
    const direction = char.dir[0]
    const rightCollision = char.collision[1]
    const leftCollision = char.collision[3]

    console.log(
      `Frame ${frame}: x=${posX.toFixed(1)}, vel=${velX.toFixed(
        2
      )}, dir=${direction}, collisions=[${char.collision.join(',')}]`
    )

    // Check for successful direction change
    if (frame > 5 && direction === 0 && velX < 0) {
      console.log(
        `\n✅ SUCCESS: Character turned around and is moving left (away from right wall)`
      )
      console.log(`  Right collision: ${rightCollision}`)
      console.log(`  Left collision: ${leftCollision}`)
      break
    }
  }

  gameWrapper.free()
}

// Run comprehensive tests
testRunningCollision()
testWallLeaning()

console.log('\n=== Running Collision Test Complete ===')
