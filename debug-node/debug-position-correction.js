#!/usr/bin/env node

// Debug script to understand position correction behavior
// This script checks if position correction is affecting collision detection

import { GameWrapper } from '../wasm-wrapper/pkg/wasm_wrapper.js'

// Test configuration with character exactly at ceiling
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

function testPositionCorrection() {
  console.log('=== Position Correction Analysis ===\n')

  const gameWrapper = new GameWrapper(JSON.stringify(gameConfig))
  gameWrapper.new_game()

  // Get initial position before any frame processing
  const initialChars = JSON.parse(gameWrapper.get_characters_json())
  const initialChar = initialChars[0]

  console.log('Initial position (before frame processing):')
  console.log(
    `  Raw position: [${initialChar.position[0][0]}, ${initialChar.position[1][0]}]`
  )
  console.log(
    `  Pixel position: [${initialChar.position[0][0] / 32}, ${
      initialChar.position[1][0] / 32
    }]`
  )
  console.log(`  Collision flags: [${initialChar.collision.join(', ')}]`)

  // Step one frame and see what happens
  gameWrapper.step_frame()

  const afterChars = JSON.parse(gameWrapper.get_characters_json())
  const afterChar = afterChars[0]

  console.log('\nAfter one frame:')
  console.log(
    `  Raw position: [${afterChar.position[0][0]}, ${afterChar.position[1][0]}]`
  )
  console.log(
    `  Pixel position: [${afterChar.position[0][0] / 32}, ${
      afterChar.position[1][0] / 32
    }]`
  )
  console.log(`  Collision flags: [${afterChar.collision.join(', ')}]`)

  // Check if position changed
  const posChanged =
    initialChar.position[0][0] !== afterChar.position[0][0] ||
    initialChar.position[1][0] !== afterChar.position[1][0]

  console.log(`\nPosition changed: ${posChanged ? 'YES' : 'NO'}`)
  if (posChanged) {
    const deltaX = (afterChar.position[0][0] - initialChar.position[0][0]) / 32
    const deltaY = (afterChar.position[1][0] - initialChar.position[1][0]) / 32
    console.log(`  Delta: [${deltaX}, ${deltaY}] pixels`)
    console.log('  This suggests position correction moved the character')
  }

  gameWrapper.free()
}

function testVariousPositions() {
  console.log('\n\n=== Testing Various Ceiling Positions ===\n')

  const testCases = [
    {
      name: 'y=15 (inside wall)',
      pos: [
        [128, 1],
        [15, 1],
      ],
    },
    {
      name: 'y=16 (at wall boundary)',
      pos: [
        [128, 1],
        [16, 1],
      ],
    },
    {
      name: 'y=17 (just outside wall)',
      pos: [
        [128, 1],
        [17, 1],
      ],
    },
    {
      name: 'y=18 (clearly outside wall)',
      pos: [
        [128, 1],
        [18, 1],
      ],
    },
  ]

  for (const testCase of testCases) {
    console.log(`--- ${testCase.name} ---`)

    const config = JSON.parse(JSON.stringify(gameConfig))
    config.characters[0].position = testCase.pos

    const gameWrapper = new GameWrapper(JSON.stringify(config))
    gameWrapper.new_game()

    const beforeChars = JSON.parse(gameWrapper.get_characters_json())
    const beforeChar = beforeChars[0]

    gameWrapper.step_frame()

    const afterChars = JSON.parse(gameWrapper.get_characters_json())
    const afterChar = afterChars[0]

    const beforeY = beforeChar.position[1][0] / 32
    const afterY = afterChar.position[1][0] / 32
    const deltaY = afterY - beforeY

    console.log(`  Before: y=${beforeY}, After: y=${afterY}, Delta: ${deltaY}`)
    console.log(`  Top collision: ${afterChar.collision[0] ? 'TRUE' : 'FALSE'}`)
    console.log(`  Position corrected: ${deltaY !== 0 ? 'YES' : 'NO'}`)
    console.log('')

    gameWrapper.free()
  }
}

// Run tests
testPositionCorrection()
testVariousPositions()

console.log('=== Position Correction Analysis Complete ===')
