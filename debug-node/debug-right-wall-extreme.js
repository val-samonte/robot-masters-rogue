#!/usr/bin/env node

/**
 * Debug Extreme Right Wall Overlap
 * Tests why character at x=242 isn't being corrected
 */

import { GameWrapper } from '../wasm-wrapper/pkg/wasm_wrapper.js'

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
        [242, 1],
        [128, 1],
      ], // x=242, should overlap right wall at x=240
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

console.log('=== EXTREME RIGHT WALL OVERLAP DEBUG ===\n')

const game = new GameWrapper(JSON.stringify(testConfig))
game.new_game()

const initial = JSON.parse(game.get_characters_json())[0]
const initialX = initial.position[0][0] / initial.position[0][1]

console.log('Wall analysis:')
console.log('  Right wall is at tile column 15 (x=240)')
console.log('  Playable area: x=16 to x=224 (right edge of character)')
console.log('')

console.log('Character analysis:')
console.log(`  Position: x=${initialX.toFixed(1)}`)
console.log(`  Size: 16x16 pixels`)
console.log(`  Left edge: x=${initialX.toFixed(1)}`)
console.log(`  Right edge: x=${(initialX + 16).toFixed(1)}`)
console.log(`  Right wall position: x=240`)
console.log(
  `  Overlapping wall: ${initialX + 16 > 240 ? 'YES' : 'NO'} (right edge ${(
    initialX + 16
  ).toFixed(1)} > 240)`
)
console.log(
  `  Overlap amount: ${Math.max(0, initialX + 16 - 240).toFixed(1)} pixels`
)
console.log(`  Collision flags: [${initial.collision.join(', ')}]`)

console.log('\nStepping one frame...')
game.step_frame()

const corrected = JSON.parse(game.get_characters_json())[0]
const correctedX = corrected.position[0][0] / corrected.position[0][1]

console.log('\nAfter correction:')
console.log(`  Position: x=${correctedX.toFixed(1)}`)
console.log(`  Right edge: x=${(correctedX + 16).toFixed(1)}`)
console.log(
  `  Position changed: ${Math.abs(correctedX - initialX) > 0.1 ? 'YES' : 'NO'}`
)
console.log(`  Delta: ${(correctedX - initialX).toFixed(1)}`)
console.log(`  Collision flags: [${corrected.collision.join(', ')}]`)

console.log('\nExpected behavior:')
if (initialX + 16 > 240) {
  const expectedX = 224 // 240 - 16
  console.log(`  Character should be pushed left to x=${expectedX} (240 - 16)`)
  if (Math.abs(correctedX - expectedX) < 1.0) {
    console.log('  ✓ Position correction worked')
  } else {
    console.log('  ❌ Position correction failed')
    console.log(`    Expected: x=${expectedX}`)
    console.log(`    Actual: x=${correctedX.toFixed(1)}`)

    // Check if the position is within the maximum correction distance
    const maxCorrectionDistance = 8
    const correctionNeeded = initialX - expectedX
    console.log(`    Correction needed: ${correctionNeeded.toFixed(1)} pixels`)
    console.log(`    Max correction distance: ${maxCorrectionDistance} pixels`)

    if (correctionNeeded > maxCorrectionDistance) {
      console.log('    ❌ Correction needed exceeds maximum distance')
      console.log('    This explains why position correction failed')
    }
  }
} else {
  console.log('  Character should not move (not overlapping)')
}

game.free()
console.log('\n=== EXTREME RIGHT WALL OVERLAP DEBUG COMPLETE ===')
