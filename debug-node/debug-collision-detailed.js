#!/usr/bin/env node

// Debug script to understand collision detection in detail
// This script analyzes the exact collision detection logic

import { GameWrapper } from '../wasm-wrapper/pkg/wasm_wrapper.js'

// Test configuration with character at ceiling
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
      ], // At ceiling
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

function analyzeCollisionDetection() {
  console.log('=== Detailed Collision Detection Analysis ===\n')

  const gameWrapper = new GameWrapper(JSON.stringify(gameConfig))
  gameWrapper.new_game()
  gameWrapper.step_frame()

  const characters = JSON.parse(gameWrapper.get_characters_json())
  const character = characters[0]

  console.log('Character at ceiling position:')
  console.log(
    `  Position (raw): [${character.position[0][0]}, ${character.position[1][0]}]`
  )
  console.log(
    `  Position (pixel): [${character.position[0][0] / 32}, ${
      character.position[1][0] / 32
    }]`
  )
  console.log(`  Size: [${character.size[0]}, ${character.size[1]}]`)
  console.log(
    `  Collision flags: [${character.collision.join(
      ', '
    )}] (top, right, bottom, left)`
  )

  // Calculate entity bounds
  const entityLeft = character.position[0][0] / 32
  const entityRight = entityLeft + character.size[0]
  const entityTop = character.position[1][0] / 32
  const entityBottom = entityTop + character.size[1]

  console.log('\nEntity bounds:')
  console.log(`  Left edge: ${entityLeft}`)
  console.log(`  Right edge: ${entityRight}`)
  console.log(`  Top edge: ${entityTop}`)
  console.log(`  Bottom edge: ${entityBottom}`)

  // Analyze tilemap
  console.log('\nTilemap analysis:')
  console.log('  Top wall: tiles at y=0 (pixels 0-15)')
  console.log('  Left wall: tiles at x=0 (pixels 0-15)')
  console.log('  Right wall: tiles at x=15 (pixels 240-255)')
  console.log('  Bottom wall: tiles at y=14 (pixels 224-239)')

  // Calculate probe positions (as they would be in the Rust code)
  console.log('\nProbe positions (as calculated in Rust):')
  console.log(
    `  Top probe: y=${entityTop - 1} (should check pixel ${entityTop - 1})`
  )
  console.log(
    `  Right probe: x=${entityRight} (should check pixel ${entityRight})`
  )
  console.log(
    `  Bottom probe: y=${entityBottom} (should check pixel ${entityBottom})`
  )
  console.log(
    `  Left probe: x=${entityLeft - 1} (should check pixel ${entityLeft - 1})`
  )

  // Expected collision results
  console.log('\nExpected collision results:')
  console.log(
    `  Top: ${
      entityTop <= 16 ? 'TRUE' : 'FALSE'
    } (entity top ${entityTop} <= wall bottom 16)`
  )
  console.log(
    `  Right: ${
      entityRight >= 240 ? 'TRUE' : 'FALSE'
    } (entity right ${entityRight} >= wall left 240)`
  )
  console.log(
    `  Bottom: ${
      entityBottom >= 224 ? 'TRUE' : 'FALSE'
    } (entity bottom ${entityBottom} >= wall top 224)`
  )
  console.log(
    `  Left: ${
      entityLeft <= 16 ? 'TRUE' : 'FALSE'
    } (entity left ${entityLeft} <= wall right 16)`
  )

  // Actual collision results
  console.log('\nActual collision results:')
  console.log(`  Top: ${character.collision[0] ? 'TRUE' : 'FALSE'}`)
  console.log(`  Right: ${character.collision[1] ? 'TRUE' : 'FALSE'}`)
  console.log(`  Bottom: ${character.collision[2] ? 'TRUE' : 'FALSE'}`)
  console.log(`  Left: ${character.collision[3] ? 'TRUE' : 'FALSE'}`)

  gameWrapper.free()
}

function testSpecificPositions() {
  console.log('\n\n=== Testing Specific Problematic Positions ===\n')

  const testCases = [
    {
      name: 'Character exactly at ceiling (y=16)',
      pos: [
        [128, 1],
        [16, 1],
      ],
      expectedTop: true,
      reason: 'Entity top at y=16, probe at y=15 should hit wall (y=0-15)',
    },
    {
      name: 'Character just below ceiling (y=17)',
      pos: [
        [128, 1],
        [17, 1],
      ],
      expectedTop: false,
      reason: 'Entity top at y=17, probe at y=16 should not hit wall',
    },
    {
      name: 'Character at left wall (x=16)',
      pos: [
        [16, 1],
        [128, 1],
      ],
      expectedLeft: true,
      reason: 'Entity left at x=16, probe at x=15 should hit wall (x=0-15)',
    },
    {
      name: 'Character just right of left wall (x=17)',
      pos: [
        [17, 1],
        [128, 1],
      ],
      expectedLeft: false,
      reason: 'Entity left at x=17, probe at x=16 should not hit wall',
    },
  ]

  for (const testCase of testCases) {
    console.log(`--- ${testCase.name} ---`)
    console.log(`Reason: ${testCase.reason}`)

    const config = JSON.parse(JSON.stringify(gameConfig))
    config.characters[0].position = testCase.pos

    const gameWrapper = new GameWrapper(JSON.stringify(config))
    gameWrapper.new_game()
    gameWrapper.step_frame()

    const characters = JSON.parse(gameWrapper.get_characters_json())
    const character = characters[0]

    const pixelX = character.position[0][0] / 32
    const pixelY = character.position[1][0] / 32

    console.log(`Position: [${pixelX}, ${pixelY}]`)
    console.log(
      `Collision flags: [${character.collision.join(
        ', '
      )}] (top, right, bottom, left)`
    )

    if (testCase.expectedTop !== undefined) {
      const actual = character.collision[0]
      console.log(
        `Top collision: ${actual ? 'TRUE' : 'FALSE'} (expected ${
          testCase.expectedTop ? 'TRUE' : 'FALSE'
        }) ${actual === testCase.expectedTop ? '✓' : '✗'}`
      )
    }

    if (testCase.expectedLeft !== undefined) {
      const actual = character.collision[3]
      console.log(
        `Left collision: ${actual ? 'TRUE' : 'FALSE'} (expected ${
          testCase.expectedLeft ? 'TRUE' : 'FALSE'
        }) ${actual === testCase.expectedLeft ? '✓' : '✗'}`
      )
    }

    console.log('')
    gameWrapper.free()
  }
}

// Run analysis
analyzeCollisionDetection()
testSpecificPositions()

console.log('=== Detailed Collision Analysis Complete ===')
