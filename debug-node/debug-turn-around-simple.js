#!/usr/bin/env node

// Simple test for turning around from wall collision
// Tests if collision flags correctly update when moving away from walls

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
        [222, 1],
        [208, 1],
      ], // Start at wall
      size: [16, 16],
      health: 100,
      health_cap: 100,
      energy: 100,
      energy_cap: 100,
      power: 10,
      weight: 5,
      jump_force: [5, 1],
      move_speed: [3, 1],
      armor: [0, 0, 0, 0, 0, 0, 0, 0, 0],
      energy_regen: 1,
      energy_regen_rate: 60,
      energy_charge: 2,
      energy_charge_rate: 30,
      dir: [0, 0], // Facing left
      enmity: 0,
      target_id: null,
      target_type: 0,
      behaviors: [
        [0, 0], // Run left
      ],
    },
  ],
  actions: [
    {
      energy_cost: 0,
      cooldown: 0,
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      spawns: [0, 0, 0, 0],
      // Simple script: Set velocity to move left
      script: [
        15,
        0,
        31, // READ_PROP var[0] = CHARACTER_MOVE_SPEED (3.0)
        34,
        0, // NEGATE var[0] (make it negative for left movement)
        16,
        20,
        0, // WRITE_PROP CHARACTER_VEL_X = var[0] (set negative velocity)
        0,
        1, // EXIT success
      ],
    },
  ],
  conditions: [
    {
      energy_mul: 32,
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      script: [0, 1],
    },
  ],
  spawns: [],
  status_effects: [],
}

function testMovingAwayFromWall() {
  console.log('=== Testing Moving Away From Wall ===\n')

  const gameWrapper = new GameWrapper(JSON.stringify(gameConfig))
  gameWrapper.new_game()

  console.log('Character starting at right wall, moving left...\n')

  let leftWall = false

  for (let frame = 0; frame < 20; frame++) {
    gameWrapper.step_frame()

    const chars = JSON.parse(gameWrapper.get_characters_json())
    const char = chars[0]

    const posX = char.position[0][0] / 32
    const velX = char.velocity[0][0] / 32
    const rightCollision = char.collision[1]
    const leftCollision = char.collision[3]
    const rightEdge = posX + char.size[0]

    console.log(
      `Frame ${frame}: x=${posX.toFixed(1)}, right_edge=${rightEdge.toFixed(
        1
      )}, vel=${velX.toFixed(
        2
      )}, right_collision=${rightCollision}, left_collision=${leftCollision}`
    )

    // Key test: When character moves away from right wall, right collision should become false
    if (frame > 2 && !rightCollision && rightEdge < 237) {
      console.log(`\n✅ SUCCESS: Character moved away from right wall!`)
      console.log(`  Position: x=${posX.toFixed(1)}`)
      console.log(
        `  Right edge: ${rightEdge.toFixed(1)} (< 237, away from wall)`
      )
      console.log(`  Right collision: ${rightCollision} (correctly false)`)
      console.log(`  Velocity: ${velX.toFixed(2)} (moving left)`)
      console.log(
        '\n🎉 COLLISION FLAG CORRECTLY UPDATED WHEN MOVING AWAY FROM WALL!'
      )
      break
    }

    // Check if we hit the left wall
    if (leftCollision && !leftWall) {
      leftWall = true
      console.log(`\n🎯 HIT LEFT WALL at x=${posX.toFixed(1)}`)
      console.log(`  Left collision: ${leftCollision}`)
      console.log(`  Right collision: ${rightCollision} (should be false)`)

      if (!rightCollision) {
        console.log(
          `\n✅ SUCCESS: Right collision correctly false when at left wall!`
        )
      }
      break
    }
  }

  gameWrapper.free()
}

function testWallToWallMovement() {
  console.log('\n\n=== Testing Wall-to-Wall Movement ===\n')

  // Test character moving from right wall to left wall
  const gameWrapper = new GameWrapper(JSON.stringify(gameConfig))
  gameWrapper.new_game()

  console.log('Full journey: Right wall → Middle → Left wall\n')

  let phases = {
    atRightWall: false,
    inMiddle: false,
    atLeftWall: false,
  }

  for (let frame = 0; frame < 40; frame++) {
    gameWrapper.step_frame()

    const chars = JSON.parse(gameWrapper.get_characters_json())
    const char = chars[0]

    const posX = char.position[0][0] / 32
    const rightCollision = char.collision[1]
    const leftCollision = char.collision[3]

    // Detect phases
    if (frame < 3 && rightCollision && !phases.atRightWall) {
      phases.atRightWall = true
      console.log(
        `Frame ${frame}: 📍 AT RIGHT WALL - x=${posX.toFixed(
          1
        )}, right_collision=${rightCollision}`
      )
    }

    if (
      !rightCollision &&
      !leftCollision &&
      !phases.inMiddle &&
      phases.atRightWall
    ) {
      phases.inMiddle = true
      console.log(
        `Frame ${frame}: 📍 IN MIDDLE - x=${posX.toFixed(1)}, no collisions`
      )
    }

    if (leftCollision && !phases.atLeftWall && phases.inMiddle) {
      phases.atLeftWall = true
      console.log(
        `Frame ${frame}: 📍 AT LEFT WALL - x=${posX.toFixed(
          1
        )}, left_collision=${leftCollision}`
      )
      console.log(`  Right collision: ${rightCollision} (should be false)`)

      if (!rightCollision) {
        console.log(
          `\n✅ COMPLETE SUCCESS: Collision flags correctly updated throughout entire journey!`
        )
        console.log(`  ✓ Started with right collision at right wall`)
        console.log(`  ✓ No collisions in middle`)
        console.log(`  ✓ Left collision at left wall, no right collision`)
      }
      break
    }

    // Log every few frames
    if (frame % 5 === 0) {
      console.log(
        `Frame ${frame}: x=${posX.toFixed(1)}, collisions=[${char.collision
          .map((c) => (c ? '1' : '0'))
          .join(',')}]`
      )
    }
  }

  gameWrapper.free()
}

// Run comprehensive tests
testMovingAwayFromWall()
testWallToWallMovement()

console.log('\n=== Turn Around Test Complete ===')
