#!/usr/bin/env node

// Test collision flags during actual movement with velocity
// This simulates the real scenario of a character running and hitting walls

import { GameWrapper } from '../wasm-wrapper/pkg/wasm_wrapper.js'

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
        [180, 1],
        [208, 1],
      ], // Start closer to right wall
      size: [16, 16],
      health: 100,
      health_cap: 100,
      energy: 100,
      energy_cap: 100,
      power: 10,
      weight: 5,
      jump_force: [5, 1],
      move_speed: [3, 1], // 3.0 speed
      armor: [0, 0, 0, 0, 0, 0, 0, 0, 0],
      energy_regen: 1,
      energy_regen_rate: 60,
      energy_charge: 2,
      energy_charge_rate: 30,
      dir: [2, 0], // Facing right
      enmity: 0,
      target_id: null,
      target_type: 0,
      behaviors: [
        [0, 0], // Always run right
      ],
    },
  ],
  actions: [
    {
      energy_cost: 0,
      cooldown: 0,
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      spawns: [0, 0, 0, 0],
      // Simple script: Set velocity to move right at move_speed
      script: [
        15,
        0,
        31, // READ_PROP var[0] = CHARACTER_MOVE_SPEED (3.0)
        16,
        20,
        0, // WRITE_PROP CHARACTER_VEL_X = var[0] (set horizontal velocity)
        0,
        1, // EXIT success
      ],
    },
  ],
  conditions: [
    {
      energy_mul: 32, // 1.0 in Fixed-point
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      script: [0, 1], // Always return true
    },
  ],
  spawns: [],
  status_effects: [],
}

function testMovementTowardWall() {
  console.log('=== Testing Movement Toward Wall ===\n')

  const gameWrapper = new GameWrapper(JSON.stringify(gameConfig))
  gameWrapper.new_game()

  console.log('Character running right toward wall...\n')

  let hitWall = false

  for (let frame = 0; frame < 20; frame++) {
    const beforeChars = JSON.parse(gameWrapper.get_characters_json())
    const beforeChar = beforeChars[0]

    gameWrapper.step_frame()

    const afterChars = JSON.parse(gameWrapper.get_characters_json())
    const afterChar = afterChars[0]

    const posX = afterChar.position[0][0] / 32
    const velX = afterChar.velocity[0][0] / 32
    const rightCollision = afterChar.collision[1]
    const rightEdge = posX + afterChar.size[0]

    console.log(
      `Frame ${frame}: x=${posX.toFixed(1)}, right_edge=${rightEdge.toFixed(
        1
      )}, vel_x=${velX.toFixed(2)}, right_collision=${rightCollision}`
    )

    // Detect when we hit the wall
    if (rightCollision && !hitWall) {
      hitWall = true
      console.log(`\n🎯 WALL HIT DETECTED!`)
      console.log(`  Position: x=${posX.toFixed(1)}`)
      console.log(`  Right edge: ${rightEdge.toFixed(1)}`)
      console.log(`  Velocity: ${velX.toFixed(2)}`)
      console.log(`  Right collision: ${rightCollision}`)

      // Verify collision flag accuracy
      const nearWall = rightEdge >= 237 // Should be near right wall (240 - tolerance)
      console.log(
        `  Collision accuracy: ${nearWall ? '✅ ACCURATE' : '❌ INACCURATE'}`
      )
    }

    // Check velocity constraint when hitting wall
    if (hitWall && Math.abs(velX) < 0.1) {
      console.log(`\n🛑 VELOCITY CONSTRAINED: Character stopped at wall`)
      console.log(`  Final position: x=${posX.toFixed(1)}`)
      console.log(`  Final velocity: ${velX.toFixed(2)}`)
      console.log(`  Right collision: ${rightCollision}`)
      break
    }
  }

  gameWrapper.free()
}

function testTurningAround() {
  console.log('\n\n=== Testing Turning Around From Wall ===\n')

  // Create config with character that turns around when hitting wall
  const turnConfig = JSON.parse(JSON.stringify(gameConfig))
  turnConfig.actions[0].script = [
    // Read right collision flag
    15,
    0,
    39, // READ_PROP var[0] = CHARACTER_COLLISION_RIGHT

    // If right collision, set velocity to move left
    50,
    0,
    1, // EQUAL var[0] == 1 (check if right collision)
    11,
    10, // GOTO 10 if right collision detected

    // No collision - move right
    15,
    1,
    31, // READ_PROP var[1] = CHARACTER_MOVE_SPEED
    16,
    20,
    1, // WRITE_PROP CHARACTER_VEL_X = var[1] (positive velocity)
    11,
    15, // GOTO end

    // Right collision detected - move left
    15,
    1,
    31, // READ_PROP var[1] = CHARACTER_MOVE_SPEED
    34,
    1, // NEGATE var[1] (make velocity negative)
    16,
    20,
    1, // WRITE_PROP CHARACTER_VEL_X = var[1] (negative velocity)

    0,
    1, // EXIT success
  ]

  const gameWrapper = new GameWrapper(JSON.stringify(turnConfig))
  gameWrapper.new_game()

  console.log('Character with wall-turning behavior...\n')

  let hitWall = false
  let turnedAround = false
  let movedAway = false

  for (let frame = 0; frame < 30; frame++) {
    gameWrapper.step_frame()

    const chars = JSON.parse(gameWrapper.get_characters_json())
    const char = chars[0]

    const posX = char.position[0][0] / 32
    const velX = char.velocity[0][0] / 32
    const rightCollision = char.collision[1]
    const leftCollision = char.collision[3]

    // Detect key events
    if (rightCollision && !hitWall) {
      hitWall = true
      console.log(
        `Frame ${frame}: 🎯 HIT WALL - x=${posX.toFixed(1)}, vel=${velX.toFixed(
          2
        )}`
      )
    }

    if (hitWall && velX < -0.1 && !turnedAround) {
      turnedAround = true
      console.log(
        `Frame ${frame}: 🔄 TURNED AROUND - x=${posX.toFixed(
          1
        )}, vel=${velX.toFixed(2)}`
      )
    }

    if (turnedAround && !rightCollision && !movedAway) {
      movedAway = true
      console.log(
        `Frame ${frame}: ✅ MOVED AWAY FROM WALL - x=${posX.toFixed(
          1
        )}, vel=${velX.toFixed(2)}`
      )
      console.log(`  Right collision: ${rightCollision} (should be false)`)
      console.log(`  Left collision: ${leftCollision}`)
      console.log(
        '\n🎉 SUCCESS: Character successfully got out of wall collision state!'
      )
      break
    }

    // Log every few frames
    if (frame % 3 === 0 || hitWall || turnedAround) {
      console.log(
        `Frame ${frame}: x=${posX.toFixed(1)}, vel=${velX.toFixed(
          2
        )}, collisions=[${char.collision
          .map((c) => (c ? '1' : '0'))
          .join(',')}]`
      )
    }
  }

  if (!movedAway) {
    console.log(
      '\n❌ FAILURE: Character did not successfully move away from wall'
    )
  }

  gameWrapper.free()
}

// Run comprehensive movement tests
testMovementTowardWall()
testTurningAround()

console.log('\n=== Movement and Collision Test Complete ===')
