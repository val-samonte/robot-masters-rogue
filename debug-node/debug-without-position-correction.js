#!/usr/bin/env node

// Debug script to test collision flags without position correction
// This will help us understand if position correction is the root cause

import { GameWrapper } from '../wasm-wrapper/pkg/wasm_wrapper.js'

// Test configuration with character exactly at ceiling
const gameConfig = {
  seed: 12345,
  gravity: [0, 1], // No gravity to avoid movement
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
        [128, 1],
        [16, 1],
      ], // Exactly at ceiling
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
      dir: [1, 0],
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

function testWithoutGravity() {
  console.log('=== Testing Collision Flags Without Gravity ===\n')

  const gameWrapper = new GameWrapper(JSON.stringify(gameConfig))
  gameWrapper.new_game()

  const beforeChars = JSON.parse(gameWrapper.get_characters_json())
  const beforeChar = beforeChars[0]

  console.log('Before frame (no gravity):')
  console.log(
    `  Position: [${beforeChar.position[0][0] / 32}, ${
      beforeChar.position[1][0] / 32
    }]`
  )
  console.log(`  Collision flags: [${beforeChar.collision.join(', ')}]`)

  gameWrapper.step_frame()

  const afterChars = JSON.parse(gameWrapper.get_characters_json())
  const afterChar = afterChars[0]

  console.log('\nAfter frame (no gravity):')
  console.log(
    `  Position: [${afterChar.position[0][0] / 32}, ${
      afterChar.position[1][0] / 32
    }]`
  )
  console.log(`  Collision flags: [${afterChar.collision.join(', ')}]`)

  const posChanged =
    beforeChar.position[0][0] !== afterChar.position[0][0] ||
    beforeChar.position[1][0] !== afterChar.position[1][0]

  console.log(`\nPosition changed: ${posChanged ? 'YES' : 'NO'}`)
  if (posChanged) {
    const deltaY = (afterChar.position[1][0] - beforeChar.position[1][0]) / 32
    console.log(`  Y Delta: ${deltaY} pixels`)
  }

  console.log(
    `Top collision detected: ${afterChar.collision[0] ? 'YES' : 'NO'}`
  )

  gameWrapper.free()
}

// Test the theory that position correction is the issue
testWithoutGravity()

console.log('\n=== Test Complete ===')
