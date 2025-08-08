#!/usr/bin/env node

// Simplified test for running collision behavior
// Tests collision flag accuracy during movement toward and away from walls

import { GameWrapper } from '../wasm-wrapper/pkg/wasm_wrapper.js'

// Simple test configuration - character with basic movement
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
      move_speed: [2, 1],
      armor: [0, 0, 0, 0, 0, 0, 0, 0, 0],
      energy_regen: 1,
      energy_regen_rate: 60,
      energy_charge: 2,
      energy_charge_rate: 30,
      dir: [2, 0], // Start facing right
      enmity: 0,
      target_id: null,
      target_type: 0,
      behaviors: [],
    },
  ],
  actions: [],
  conditions: [],
  spawns: [],
  status_effects: [],
}

function testManualMovement() {
  console.log('=== Testing Manual Movement and Collision Flags ===\n')

  const gameWrapper = new GameWrapper(JSON.stringify(gameConfig))
  gameWrapper.new_game()

  console.log('Test 1: Character moving right toward wall\n')

  // Manually set velocity to move right
  let chars = JSON.parse(gameWrapper.get_characters_json())
  console.log(
    `Initial position: x=${
      chars[0].position[0][0] / 32
    }, collision_flags=[${chars[0].collision.join(',')}]`
  )

  // Simulate movement toward right wall by stepping frames
  for (let frame = 0; frame < 30; frame++) {
    const beforeChars = JSON.parse(gameWrapper.get_characters_json())
    const beforeChar = beforeChars[0]

    gameWrapper.step_frame()

    const afterChars = JSON.parse(gameWrapper.get_characters_json())
    const afterChar = afterChars[0]

    const posX = afterChar.position[0][0] / 32
    const velX = afterChar.velocity[0][0] / 32
    const rightCollision = afterChar.collision[1]
    const leftCollision = afterChar.collision[3]

    // Log significant events
    if (frame % 5 === 0 || rightCollision) {
      console.log(
        `Frame ${frame}: x=${posX.toFixed(1)}, vel_x=${velX.toFixed(
          2
        )}, right_collision=${rightCollision}, left_collision=${leftCollision}`
      )
    }

    // Check if we hit the right wall
    if (rightCollision) {
      console.log(`\n🎯 Frame ${frame}: RIGHT WALL COLLISION DETECTED!`)
      console.log(`  Position: x=${posX.toFixed(1)}`)
      console.log(
        `  Expected: Character should be near x=224 (right wall boundary)`
      )
      console.log(
        `  Collision flags: [${afterChar.collision.join(
          ','
        )}] (top,right,bottom,left)`
      )

      // Test if collision flag is accurate
      const expectedNearWall = posX >= 220 // Should be near right wall
      console.log(
        `  Near wall check: ${
          expectedNearWall ? '✅ PASS' : '❌ FAIL'
        } (x=${posX.toFixed(1)} >= 220)`
      )
      break
    }

    // Safety check
    if (frame > 25 && !rightCollision) {
      console.log('\n⚠️  Character should have hit right wall by now')
      break
    }
  }

  gameWrapper.free()
}

function testPositionNearWalls() {
  console.log('\n\n=== Testing Collision Flags at Various Wall Distances ===\n')

  const testPositions = [
    { name: 'Far from right wall', x: 100, expectedRight: false },
    { name: 'Approaching right wall', x: 200, expectedRight: false },
    { name: 'Near right wall', x: 220, expectedRight: false },
    { name: 'Very close to right wall', x: 230, expectedRight: true },
    { name: 'At right wall boundary', x: 224, expectedRight: true },
  ]

  for (const test of testPositions) {
    const config = JSON.parse(JSON.stringify(gameConfig))
    config.characters[0].position = [
      [test.x, 1],
      [208, 1],
    ]

    const gameWrapper = new GameWrapper(JSON.stringify(config))
    gameWrapper.new_game()
    gameWrapper.step_frame() // Process one frame to update collision flags

    const chars = JSON.parse(gameWrapper.get_characters_json())
    const char = chars[0]

    const actualX = char.position[0][0] / 32
    const rightCollision = char.collision[1]
    const rightEdge = actualX + char.size[0]

    console.log(`${test.name}:`)
    console.log(
      `  Set x=${test.x}, Actual x=${actualX.toFixed(
        1
      )}, Right edge=${rightEdge.toFixed(1)}`
    )
    console.log(
      `  Right collision: ${rightCollision} (expected: ${test.expectedRight})`
    )
    console.log(
      `  Result: ${
        rightCollision === test.expectedRight ? '✅ PASS' : '❌ FAIL'
      }`
    )
    console.log('')

    gameWrapper.free()
  }
}

function testDirectionChange() {
  console.log('\n=== Testing Direction Change Scenario ===\n')

  // Start character very close to right wall
  const config = JSON.parse(JSON.stringify(gameConfig))
  config.characters[0].position = [
    [230, 1],
    [208, 1],
  ] // Very close to right wall

  const gameWrapper = new GameWrapper(JSON.stringify(config))
  gameWrapper.new_game()

  console.log(
    'Scenario: Character starts near right wall, then we simulate turning left\n'
  )

  for (let frame = 0; frame < 10; frame++) {
    gameWrapper.step_frame()

    const chars = JSON.parse(gameWrapper.get_characters_json())
    const char = chars[0]

    const posX = char.position[0][0] / 32
    const rightCollision = char.collision[1]
    const leftCollision = char.collision[3]

    console.log(
      `Frame ${frame}: x=${posX.toFixed(
        1
      )}, right_collision=${rightCollision}, left_collision=${leftCollision}`
    )

    // Key test: When character moves away from right wall, right collision should become false
    if (frame > 3 && posX < 225 && !rightCollision) {
      console.log(
        `\n✅ SUCCESS: Character moved away from wall (x=${posX.toFixed(
          1
        )}) and right collision became false`
      )
      break
    }
  }

  gameWrapper.free()
}

// Run all tests
testManualMovement()
testPositionNearWalls()
testDirectionChange()

console.log('\n=== Collision Flag Movement Test Complete ===')
