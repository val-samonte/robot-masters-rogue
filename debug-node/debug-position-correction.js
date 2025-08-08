#!/usr/bin/env node

/**
 * Enhanced Position Correction Test
 * Tests position overlap correction with various scenarios and validates results
 */

import fs from 'fs'
import path from 'path'

async function loadWasm() {
  try {
    const wasmModule = await import('../wasm-wrapper/pkg/wasm_wrapper.js')
    const { GameWrapper } = wasmModule

    return GameWrapper
  } catch (error) {
    console.error('Failed to load WASM:', error)
    process.exit(1)
  }
}

// Base test configuration
const baseConfig = {
  seed: 12345,
  gravity: [0, 1], // No gravity for clearer testing
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
  characters: [], // Will be set per test
  actions: [
    {
      energy_cost: 0,
      cooldown: 0,
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      spawns: [0, 0, 0, 0],
      script: [20, 0, 1, 91, 0], // Always action (do nothing)
    },
  ],
  conditions: [
    {
      energy_mul: 32,
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      script: [20, 0, 1, 91, 0], // Always condition
    },
  ],
  spawns: [],
  status_effects: [],
}

function createCharacter(id, position, size, direction) {
  return {
    id,
    position,
    group: 1,
    size,
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
    dir: direction,
    enmity: 0,
    target_id: null,
    target_type: 0,
    behaviors: [[0, 0]], // Always do nothing action
  }
}

async function testPositionCorrection(GameWrapper) {
  console.log('=== POSITION CORRECTION ANALYSIS ===\n')

  const testCases = [
    {
      name: 'Character overlapping right wall',
      position: [
        [230, 1],
        [128, 1],
      ], // x=230, y=128 (middle), wall at x=240, char width=16 → overlaps by 6 pixels
      expectedCorrection: 'left',
      description: 'Should be pushed left to x=224 or less',
    },
    {
      name: 'Character overlapping left wall',
      position: [
        [10, 1],
        [128, 1],
      ], // x=10, y=128 (middle), wall at x=16 → overlaps by 6 pixels
      expectedCorrection: 'right',
      description: 'Should be pushed right to x=16 or more',
    },
    {
      name: 'Character overlapping ceiling',
      position: [
        [128, 1],
        [10, 1],
      ], // y=10, ceiling at y=16 → overlaps by 6 pixels
      expectedCorrection: 'down',
      description: 'Should be pushed down to y=16 or more',
    },
    {
      name: 'Character overlapping floor',
      position: [
        [128, 1],
        [200, 1],
      ], // x=128 (middle), y=200, floor at y=208, char height=16 → overlaps by 8 pixels
      expectedCorrection: 'up',
      description: 'Should be pushed up to y=192 or less',
    },
    {
      name: 'Character not overlapping',
      position: [
        [128, 1],
        [128, 1],
      ], // Center of room, no overlap
      expectedCorrection: 'none',
      description: 'Should not move',
    },
  ]

  for (const testCase of testCases) {
    console.log(`--- ${testCase.name} ---`)
    console.log(`Description: ${testCase.description}`)

    const config = JSON.parse(JSON.stringify(baseConfig))
    config.characters = [
      createCharacter(1, testCase.position, [16, 16], [1, 0]),
    ]

    const game = new GameWrapper(JSON.stringify(config))
    game.new_game()

    // Get initial position
    const initial = JSON.parse(game.get_characters_json())[0]
    const initialX = initial.position[0][0] / initial.position[0][1]
    const initialY = initial.position[1][0] / initial.position[1][1]

    console.log(
      `Initial position: (${initialX.toFixed(1)}, ${initialY.toFixed(1)})`
    )

    // Step one frame to trigger position correction
    game.step_frame()

    const corrected = JSON.parse(game.get_characters_json())[0]
    const correctedX = corrected.position[0][0] / corrected.position[0][1]
    const correctedY = corrected.position[1][0] / corrected.position[1][1]

    console.log(
      `After correction: (${correctedX.toFixed(1)}, ${correctedY.toFixed(1)})`
    )

    const deltaX = correctedX - initialX
    const deltaY = correctedY - initialY

    console.log(`Delta: (${deltaX.toFixed(1)}, ${deltaY.toFixed(1)})`)

    // Validate correction
    let correctionValid = false
    switch (testCase.expectedCorrection) {
      case 'left':
        correctionValid = deltaX < 0 && correctedX <= 224
        break
      case 'right':
        correctionValid = deltaX > 0 && correctedX >= 16
        break
      case 'down':
        correctionValid = deltaY > 0 && correctedY >= 16
        break
      case 'up':
        correctionValid = deltaY < 0 && correctedY + 16 <= 208
        break
      case 'none':
        correctionValid = Math.abs(deltaX) < 0.1 && Math.abs(deltaY) < 0.1
        break
    }

    if (correctionValid) {
      console.log(`✓ Position correction successful`)
    } else {
      console.log(`❌ Position correction failed or incorrect`)
    }

    // Check if position is within game boundaries
    const withinBounds =
      correctedX >= 0 &&
      correctedX + 16 <= 256 &&
      correctedY >= 0 &&
      correctedY + 16 <= 240

    if (withinBounds) {
      console.log(`✓ Position within game boundaries`)
    } else {
      console.log(`❌ Position outside game boundaries`)
    }

    console.log(`Collision flags: [${corrected.collision.join(', ')}]`)
    console.log('')

    game.free()
  }
}

async function testMinimalMovementDistance(GameWrapper) {
  console.log('=== MINIMAL MOVEMENT DISTANCE TEST ===\n')

  console.log(
    'Testing that position correction uses minimal movement distance...'
  )

  const config = JSON.parse(JSON.stringify(baseConfig))
  config.characters = [
    createCharacter(
      1,
      [
        [242, 1],
        [128, 1],
      ],
      [16, 16],
      [1, 0]
    ),
  ] // Overlaps wall by 18 pixels

  const game = new GameWrapper(JSON.stringify(config))
  game.new_game()

  const initial = JSON.parse(game.get_characters_json())[0]
  const initialX = initial.position[0][0] / initial.position[0][1]

  game.step_frame()

  const corrected = JSON.parse(game.get_characters_json())[0]
  const correctedX = corrected.position[0][0] / corrected.position[0][1]

  const movementDistance = Math.abs(correctedX - initialX)

  console.log(`Initial position: x=${initialX.toFixed(1)}`)
  console.log(`Corrected position: x=${correctedX.toFixed(1)}`)
  console.log(`Movement distance: ${movementDistance.toFixed(1)} pixels`)

  // The minimal correction should be to x=224 (wall at 240, char width 16)
  const expectedX = 224
  const expectedDistance = Math.abs(initialX - expectedX)

  console.log(`Expected position: x=${expectedX}`)
  console.log(`Expected distance: ${expectedDistance.toFixed(1)} pixels`)

  if (Math.abs(correctedX - expectedX) < 1.0) {
    console.log(`✓ Position correction used minimal movement distance`)
  } else {
    console.log(`❌ Position correction did not use minimal movement distance`)
  }

  game.free()
}

async function testBoundaryProtection(GameWrapper) {
  console.log('\n=== BOUNDARY PROTECTION TEST ===\n')

  console.log(
    'Testing that position correction never pushes characters outside game boundaries...'
  )

  const extremeCases = [
    {
      name: 'Far outside right',
      position: [
        [300, 1],
        [128, 1],
      ],
    },
    {
      name: 'Far outside left',
      position: [
        [-50, 1],
        [128, 1],
      ],
    },
    {
      name: 'Far outside top',
      position: [
        [128, 1],
        [-50, 1],
      ],
    },
    {
      name: 'Far outside bottom',
      position: [
        [128, 1],
        [300, 1],
      ],
    },
  ]

  for (const testCase of extremeCases) {
    console.log(`\n--- ${testCase.name} ---`)

    const config = JSON.parse(JSON.stringify(baseConfig))
    config.characters = [
      createCharacter(1, testCase.position, [16, 16], [1, 0]),
    ]

    const game = new GameWrapper(JSON.stringify(config))
    game.new_game()

    const initial = JSON.parse(game.get_characters_json())[0]
    const initialX = initial.position[0][0] / initial.position[0][1]
    const initialY = initial.position[1][0] / initial.position[1][1]

    game.step_frame()

    const corrected = JSON.parse(game.get_characters_json())[0]
    const correctedX = corrected.position[0][0] / corrected.position[0][1]
    const correctedY = corrected.position[1][0] / corrected.position[1][1]

    console.log(`Initial: (${initialX.toFixed(1)}, ${initialY.toFixed(1)})`)
    console.log(
      `Corrected: (${correctedX.toFixed(1)}, ${correctedY.toFixed(1)})`
    )

    // Check boundaries: 0 <= x <= 240, 0 <= y <= 208 (accounting for character size)
    const withinBounds =
      correctedX >= 0 &&
      correctedX + 16 <= 256 &&
      correctedY >= 0 &&
      correctedY + 16 <= 240

    if (withinBounds) {
      console.log(`✓ Character kept within game boundaries`)
    } else {
      console.log(`❌ Character pushed outside game boundaries`)
      console.log(
        `  Valid X range: 0 to ${256 - 16}, actual: ${correctedX.toFixed(1)}`
      )
      console.log(
        `  Valid Y range: 0 to ${240 - 16}, actual: ${correctedY.toFixed(1)}`
      )
    }

    game.free()
  }
}

async function runPositionCorrectionTests() {
  console.log('🔧 POSITION CORRECTION TEST SUITE')
  console.log('='.repeat(40))

  const GameWrapper = await loadWasm()

  try {
    await testPositionCorrection(GameWrapper)
    await testMinimalMovementDistance(GameWrapper)
    await testBoundaryProtection(GameWrapper)

    console.log('\n' + '='.repeat(40))
    console.log('✅ POSITION CORRECTION TESTS COMPLETE')
  } catch (error) {
    console.error('\n❌ Position correction tests failed:', error)
    process.exit(1)
  }
}

// Run the position correction test suite
runPositionCorrectionTests()
