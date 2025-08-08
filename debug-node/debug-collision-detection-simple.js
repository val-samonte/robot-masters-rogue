#!/usr/bin/env node

/**
 * Simple Collision Detection Test
 * Tests if the basic collision detection is working
 */

import { GameWrapper } from '../wasm-wrapper/pkg/wasm_wrapper.js'

// Simple test configuration
const testConfig = {
  seed: 12345,
  gravity: [0, 1], // No gravity
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
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  ],
  characters: [
    {
      id: 1,
      position: [
        [230, 1],
        [128, 1],
      ], // Overlapping right wall
      group: 1,
      size: [16, 16],
      health: 100,
      health_cap: 100,
      energy: 100,
      energy_cap: 100,
      power: 10,
      weight: 5,
      jump_force: [160, 32],
      move_speed: [64, 32],
      armor: [0, 0, 0, 0, 0, 0, 0, 0, 0],
      energy_regen: 1,
      energy_regen_rate: 60,
      energy_charge: 5,
      energy_charge_rate: 30,
      dir: [1, 0], // Neutral
      enmity: 0,
      target_id: null,
      target_type: 0,
      behaviors: [], // No behaviors
    },
  ],
  actions: [],
  conditions: [],
  spawns: [],
  status_effects: [],
}

console.log('=== SIMPLE COLLISION DETECTION TEST ===\n')

const game = new GameWrapper(JSON.stringify(testConfig))
game.new_game()

// Get initial state
const initial = JSON.parse(game.get_characters_json())[0]
const initialX = initial.position[0][0] / initial.position[0][1]
const initialY = initial.position[1][0] / initial.position[1][1]

console.log('Initial state:')
console.log(`  Position: (${initialX.toFixed(1)}, ${initialY.toFixed(1)})`)
console.log(
  `  Character bounds: x=${initialX.toFixed(1)} to x=${(initialX + 16).toFixed(
    1
  )}`
)
console.log(`  Wall positions: left=16, right=240, top=16, bottom=208`)
console.log(`  Overlapping right wall: ${initialX + 16 > 240 ? 'YES' : 'NO'}`)
console.log(`  Collision flags: [${initial.collision.join(', ')}]`)

// Step one frame to trigger position correction
console.log('\nStepping one frame...')
game.step_frame()

const corrected = JSON.parse(game.get_characters_json())[0]
const correctedX = corrected.position[0][0] / corrected.position[0][1]
const correctedY = corrected.position[1][0] / corrected.position[1][1]

console.log('\nAfter one frame:')
console.log(`  Position: (${correctedX.toFixed(1)}, ${correctedY.toFixed(1)})`)
console.log(
  `  Character bounds: x=${correctedX.toFixed(1)} to x=${(
    correctedX + 16
  ).toFixed(1)}`
)
console.log(
  `  Position changed: ${
    Math.abs(correctedX - initialX) > 0.1 ||
    Math.abs(correctedY - initialY) > 0.1
      ? 'YES'
      : 'NO'
  }`
)
console.log(
  `  Delta: (${(correctedX - initialX).toFixed(1)}, ${(
    correctedY - initialY
  ).toFixed(1)})`
)
console.log(`  Collision flags: [${corrected.collision.join(', ')}]`)

// Analysis
console.log('\nAnalysis:')
if (initialX + 16 > 240) {
  console.log('✓ Character was initially overlapping right wall')
  if (correctedX < initialX && correctedX + 16 <= 240) {
    console.log(
      '✓ Position correction worked: character moved left to valid position'
    )
  } else if (correctedX === initialX) {
    console.log('❌ Position correction failed: character not moved')
  } else {
    console.log(
      '❌ Position correction incorrect: character moved to wrong position'
    )
  }
} else {
  console.log(
    '❌ Test setup error: character was not initially overlapping wall'
  )
}

// Check collision flags
if (corrected.collision[1]) {
  console.log('✓ Right collision flag correctly set')
} else {
  console.log(
    '❌ Right collision flag not set (should be true when near right wall)'
  )
}

game.free()
console.log('\n=== TEST COMPLETE ===')
