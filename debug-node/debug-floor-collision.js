#!/usr/bin/env node

/**
 * Debug Floor Collision Detection
 * Tests why floor collision isn't being detected properly
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
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], // Floor at y=208 (tile row 13 * 16)
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  ],
  characters: [
    {
      id: 1,
      position: [
        [128, 1],
        [200, 1],
      ], // y=200, should overlap floor at y=208
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

console.log('=== FLOOR COLLISION DEBUG ===\n')

const game = new GameWrapper(JSON.stringify(testConfig))
game.new_game()

const initial = JSON.parse(game.get_characters_json())[0]
const initialY = initial.position[1][0] / initial.position[1][1]

console.log('Tilemap analysis:')
console.log('  Tilemap is 16x15 tiles, each tile is 16x16 pixels')
console.log('  Floor tiles are at row 13 (y=208) and row 14 (y=224)')
console.log('  Playable area: y=16 to y=192 (bottom edge of character)')
console.log('')

console.log('Character analysis:')
console.log(`  Position: y=${initialY.toFixed(1)}`)
console.log(`  Size: 16x16 pixels`)
console.log(`  Top edge: y=${initialY.toFixed(1)}`)
console.log(`  Bottom edge: y=${(initialY + 16).toFixed(1)}`)
console.log(`  Floor position: y=208`)
console.log(
  `  Overlapping floor: ${initialY + 16 > 208 ? 'YES' : 'NO'} (bottom edge ${(
    initialY + 16
  ).toFixed(1)} > 208)`
)
console.log(`  Collision flags: [${initial.collision.join(', ')}]`)

console.log('\nStepping one frame...')
game.step_frame()

const corrected = JSON.parse(game.get_characters_json())[0]
const correctedY = corrected.position[1][0] / corrected.position[1][1]

console.log('\nAfter correction:')
console.log(`  Position: y=${correctedY.toFixed(1)}`)
console.log(`  Bottom edge: y=${(correctedY + 16).toFixed(1)}`)
console.log(
  `  Position changed: ${Math.abs(correctedY - initialY) > 0.1 ? 'YES' : 'NO'}`
)
console.log(`  Delta: ${(correctedY - initialY).toFixed(1)}`)
console.log(`  Collision flags: [${corrected.collision.join(', ')}]`)

console.log('\nExpected behavior:')
if (initialY + 16 > 208) {
  console.log('  Character should be pushed up to y=192 (208 - 16)')
  if (correctedY <= 192) {
    console.log('  ✓ Position correction worked')
  } else {
    console.log('  ❌ Position correction failed')
  }
} else {
  console.log('  Character should not move (not overlapping)')
  if (Math.abs(correctedY - initialY) < 0.1) {
    console.log('  ✓ No correction applied (correct)')
  } else {
    console.log('  ❌ Unexpected correction applied')
  }
}

game.free()
console.log('\n=== FLOOR COLLISION DEBUG COMPLETE ===')
