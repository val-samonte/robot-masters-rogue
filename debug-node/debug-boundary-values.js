#!/usr/bin/env node

// Debug script to check the exact boundary values being calculated

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
        [128, 1],
        [16, 1],
      ],
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

function debugBoundaryValues() {
  console.log('=== Boundary Values Debug ===\n')

  const gameWrapper = new GameWrapper(JSON.stringify(gameConfig))
  gameWrapper.new_game()
  gameWrapper.step_frame()

  const chars = JSON.parse(gameWrapper.get_characters_json())
  const char = chars[0]

  // Calculate the values as they would be in Rust
  const entityLeft = Math.floor(char.position[0][0] / 32)
  const entityRight = entityLeft + char.size[0]
  const entityTop = Math.floor(char.position[1][0] / 32)
  const entityBottom = entityTop + char.size[1]

  console.log('Character position and bounds:')
  console.log(
    `  Raw position: [${char.position[0][0]}, ${char.position[1][0]}]`
  )
  console.log(
    `  Pixel position: [${char.position[0][0] / 32}, ${
      char.position[1][0] / 32
    }]`
  )
  console.log(`  Integer position: [${entityLeft}, ${entityTop}]`)
  console.log(`  Size: [${char.size[0]}, ${char.size[1]}]`)
  console.log(
    `  Bounds: left=${entityLeft}, right=${entityRight}, top=${entityTop}, bottom=${entityBottom}`
  )

  console.log('\nWall boundaries:')
  const LEFT_WALL = 16
  const RIGHT_WALL = 240
  const TOP_WALL = 16
  const BOTTOM_WALL = 224
  const CORRECTION_TOLERANCE = 3

  console.log(
    `  LEFT_WALL: ${LEFT_WALL}, with tolerance: ${
      LEFT_WALL + CORRECTION_TOLERANCE
    }`
  )
  console.log(
    `  RIGHT_WALL: ${RIGHT_WALL}, with tolerance: ${
      RIGHT_WALL - CORRECTION_TOLERANCE
    }`
  )
  console.log(
    `  TOP_WALL: ${TOP_WALL}, with tolerance: ${
      TOP_WALL + CORRECTION_TOLERANCE
    }`
  )
  console.log(
    `  BOTTOM_WALL: ${BOTTOM_WALL}, with tolerance: ${
      BOTTOM_WALL - CORRECTION_TOLERANCE
    }`
  )

  console.log('\nBoundary checks:')
  console.log(
    `  Top collision: ${entityTop} <= ${TOP_WALL + CORRECTION_TOLERANCE} = ${
      entityTop <= TOP_WALL + CORRECTION_TOLERANCE
    }`
  )
  console.log(
    `  Right collision: ${entityRight} >= ${
      RIGHT_WALL - CORRECTION_TOLERANCE
    } = ${entityRight >= RIGHT_WALL - CORRECTION_TOLERANCE}`
  )
  console.log(
    `  Bottom collision: ${entityBottom} >= ${
      BOTTOM_WALL - CORRECTION_TOLERANCE
    } = ${entityBottom >= BOTTOM_WALL - CORRECTION_TOLERANCE}`
  )
  console.log(
    `  Left collision: ${entityLeft} <= ${LEFT_WALL + CORRECTION_TOLERANCE} = ${
      entityLeft <= LEFT_WALL + CORRECTION_TOLERANCE
    }`
  )

  console.log('\nActual collision flags from game:')
  console.log(`  [${char.collision.join(', ')}] (top, right, bottom, left)`)

  gameWrapper.free()
}

debugBoundaryValues()

console.log('\n=== Debug Complete ===')
