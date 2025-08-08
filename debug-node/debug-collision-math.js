#!/usr/bin/env node

// Debug script to understand the exact collision detection math
// This will help us see why position correction is being triggered

import { GameWrapper } from '../wasm-wrapper/pkg/wasm_wrapper.js'

// Test configuration with character exactly at ceiling
const gameConfig = {
  seed: 12345,
  gravity: [1, 1], // With gravity to trigger position correction
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

function analyzeCollisionMath() {
  console.log('=== Collision Detection Math Analysis ===\n')

  // Character at y=16 with height=16
  const charY = 16
  const charHeight = 16
  const tileSize = 16

  console.log('Character bounds:')
  console.log(`  Y position: ${charY}`)
  console.log(`  Height: ${charHeight}`)
  console.log(`  Top edge: ${charY}`)
  console.log(`  Bottom edge: ${charY + charHeight - 1} (last pixel occupied)`)
  console.log(
    `  Bottom edge + 1: ${charY + charHeight} (first pixel NOT occupied)`
  )

  console.log('\nTilemap layout:')
  console.log('  Row 0 (tiles y=0): pixels 0-15 (WALL)')
  console.log('  Row 1 (tiles y=1): pixels 16-31 (EMPTY)')
  console.log('  Row 2 (tiles y=2): pixels 32-47 (EMPTY)')

  console.log('\nCollision detection math:')
  console.log('  top_tile = floor(y / tile_size) = floor(16 / 16) = 1')
  console.log('  bottom_edge = y + height = 16 + 16 = 32')
  console.log(
    '  bottom_tile = floor((bottom_edge - 1) / tile_size) = floor(31 / 16) = 1'
  )
  console.log('  Tiles checked: y=1 (which is EMPTY)')
  console.log('  Expected collision: FALSE')

  console.log("\nBut what if there's a rounding issue with Fixed-point?")

  // Test actual collision detection
  const gameWrapper = new GameWrapper(JSON.stringify(gameConfig))
  gameWrapper.new_game()

  const beforeChars = JSON.parse(gameWrapper.get_characters_json())
  const beforeChar = beforeChars[0]

  console.log('\nActual values from game:')
  console.log(
    `  Raw position: [${beforeChar.position[0][0]}, ${beforeChar.position[1][0]}]`
  )
  console.log(`  Fixed-point Y: ${beforeChar.position[1][0]} (raw)`)
  console.log(
    `  Fixed-point Y / 32: ${beforeChar.position[1][0] / 32} (should be 16.0)`
  )
  console.log(`  Integer Y: ${Math.floor(beforeChar.position[1][0] / 32)}`)

  // Check if character is considered overlapping BEFORE any frame processing
  console.log('\nTesting collision detection at initial position...')

  gameWrapper.step_frame()

  const afterChars = JSON.parse(gameWrapper.get_characters_json())
  const afterChar = afterChars[0]

  const moved = beforeChar.position[1][0] !== afterChar.position[1][0]
  console.log(`\nPosition correction triggered: ${moved ? 'YES' : 'NO'}`)
  if (moved) {
    const deltaY = (afterChar.position[1][0] - beforeChar.position[1][0]) / 32
    console.log(`  Moved by: ${deltaY} pixels`)
    console.log(
      '  This means the character was considered "overlapping" with walls'
    )
  }

  gameWrapper.free()
}

// Run analysis
analyzeCollisionMath()

console.log('\n=== Collision Math Analysis Complete ===')
