#!/usr/bin/env node

// Debug script to test collision flag detection accuracy
// This script tests if collision flags accurately represent entity collision state

import { GameWrapper } from '../wasm-wrapper/pkg/wasm_wrapper.js'

// Test configuration with character near walls
const gameConfig = {
  seed: 12345,
  gravity: [1, 1], // 1.0 in Fixed-point [numerator, denominator]
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
        [16, 1],
        [208, 1],
      ], // Left wall position (x=16, touching left wall)
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
      dir: [1, 0], // Neutral horizontal, downward vertical
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

function testCollisionFlags() {
  console.log('=== Testing Collision Flag Detection ===\n')

  // Test positions and expected collision flags
  const testCases = [
    {
      name: 'Character at left wall (x=16)',
      pos: [
        [16, 1],
        [208, 1],
      ],
      expected: { left: true, right: false, top: false, bottom: true },
      description: 'Should detect left wall collision and ground collision',
    },
    {
      name: 'Character at right wall (x=224)',
      pos: [
        [224, 1],
        [208, 1],
      ],
      expected: { left: false, right: true, top: false, bottom: true },
      description: 'Should detect right wall collision and ground collision',
    },
    {
      name: 'Character in middle (x=128)',
      pos: [
        [128, 1],
        [128, 1],
      ],
      expected: { left: false, right: false, top: false, bottom: false },
      description: 'Should detect no wall collisions',
    },
    {
      name: 'Character at ceiling (x=128, y=16)',
      pos: [
        [128, 1],
        [16, 1],
      ],
      expected: { left: false, right: false, top: true, bottom: false },
      description: 'Should detect ceiling collision',
    },
    {
      name: 'Character at ground (x=128, y=208)',
      pos: [
        [128, 1],
        [208, 1],
      ],
      expected: { left: false, right: false, top: false, bottom: true },
      description: 'Should detect ground collision',
    },
  ]

  for (const testCase of testCases) {
    console.log(`\n--- ${testCase.name} ---`)
    console.log(`Description: ${testCase.description}`)

    // Create game with character at test position
    const config = JSON.parse(JSON.stringify(gameConfig))
    config.characters[0].position = testCase.pos

    const gameWrapper = new GameWrapper(JSON.stringify(config))
    gameWrapper.new_game()

    // Step one frame to update collision flags
    gameWrapper.step_frame()

    const characters = JSON.parse(gameWrapper.get_characters_json())
    const character = characters[0]

    console.log(
      `Position: [${character.position[0][0]}, ${character.position[1][0]}]`
    )
    console.log(`Size: [${character.size[0]}, ${character.size[1]}]`)
    console.log(
      `Collision flags: [${character.collision.join(
        ', '
      )}] (top, right, bottom, left)`
    )

    // Check each direction
    const actual = {
      top: character.collision[0],
      right: character.collision[1],
      bottom: character.collision[2],
      left: character.collision[3],
    }

    let allCorrect = true
    for (const [direction, expected] of Object.entries(testCase.expected)) {
      const actualValue = actual[direction]
      const correct = actualValue === expected
      if (!correct) allCorrect = false

      console.log(
        `  ${direction}: ${actualValue} (expected ${expected}) ${
          correct ? '✓' : '✗'
        }`
      )
    }

    console.log(`Overall: ${allCorrect ? '✓ PASS' : '✗ FAIL'}`)

    gameWrapper.free()
  }
}

function testCollisionFlagAccuracyAfterMovement() {
  console.log('\n\n=== Testing Collision Flags After Movement ===\n')

  // Test character moving toward wall
  const config = JSON.parse(JSON.stringify(gameConfig))
  config.characters[0].position = [
    [200, 1],
    [208, 1],
  ] // Near right wall

  const gameWrapper = new GameWrapper(JSON.stringify(config))
  gameWrapper.new_game()

  // Set velocity to move right
  console.log('Character moving toward right wall...')

  for (let frame = 0; frame < 5; frame++) {
    const beforeChars = JSON.parse(gameWrapper.get_characters_json())
    const beforeChar = beforeChars[0]

    gameWrapper.step_frame()

    const afterChars = JSON.parse(gameWrapper.get_characters_json())
    const afterChar = afterChars[0]

    console.log(`\nFrame ${frame}:`)
    console.log(
      `  Before: pos=[${beforeChar.position[0][0]}, ${
        beforeChar.position[1][0]
      }], vel=[${beforeChar.velocity[0][0]}, ${
        beforeChar.velocity[1][0]
      }], collision=[${beforeChar.collision.join(', ')}]`
    )
    console.log(
      `  After:  pos=[${afterChar.position[0][0]}, ${
        afterChar.position[1][0]
      }], vel=[${afterChar.velocity[0][0]}, ${
        afterChar.velocity[1][0]
      }], collision=[${afterChar.collision.join(', ')}]`
    )

    // Check if collision flags make sense
    const rightEdge = afterChar.position[0][0] + afterChar.size[0] // Character right edge
    const rightWall = 240 // Right wall at x=240 (15 * 16)

    if (rightEdge >= rightWall) {
      console.log(
        `  Analysis: Character right edge (${rightEdge}) >= right wall (${rightWall})`
      )
      console.log(`  Expected: Right collision flag should be TRUE`)
      console.log(
        `  Actual: Right collision flag is ${
          afterChar.collision[1] ? 'TRUE' : 'FALSE'
        } ${afterChar.collision[1] ? '✓' : '✗'}`
      )
    } else {
      console.log(
        `  Analysis: Character right edge (${rightEdge}) < right wall (${rightWall})`
      )
      console.log(`  Expected: Right collision flag should be FALSE`)
      console.log(
        `  Actual: Right collision flag is ${
          afterChar.collision[1] ? 'TRUE' : 'FALSE'
        } ${afterChar.collision[1] ? '✓' : '✗'}`
      )
    }
  }

  gameWrapper.free()
}

function testCollisionFlagConsistency() {
  console.log('\n\n=== Testing Collision Flag Consistency ===\n')

  // Test that collision flags are consistent with actual collision detection
  const config = JSON.parse(JSON.stringify(gameConfig))

  const testPositions = [
    [
      [16, 1],
      [208, 1],
    ], // Left wall
    [
      [224, 1],
      [208, 1],
    ], // Right wall
    [
      [128, 1],
      [16, 1],
    ], // Ceiling
    [
      [128, 1],
      [208, 1],
    ], // Ground
    [
      [128, 1],
      [128, 1],
    ], // Middle
  ]

  for (const pos of testPositions) {
    config.characters[0].position = pos

    const gameWrapper = new GameWrapper(JSON.stringify(config))
    gameWrapper.new_game()
    gameWrapper.step_frame()

    const characters = JSON.parse(gameWrapper.get_characters_json())
    const character = characters[0]

    console.log(`\nPosition [${pos[0][0]}, ${pos[1][0]}]:`)
    console.log(
      `  Collision flags: [${character.collision.join(
        ', '
      )}] (top, right, bottom, left)`
    )

    // Calculate expected collision based on position
    const leftEdge = character.position[0][0]
    const rightEdge = character.position[0][0] + character.size[0]
    const topEdge = character.position[1][0]
    const bottomEdge = character.position[1][0] + character.size[1]

    const leftWall = 16
    const rightWall = 240
    const topWall = 16
    const bottomWall = 224

    const expectedTop = topEdge <= topWall
    const expectedRight = rightEdge >= rightWall
    const expectedBottom = bottomEdge >= bottomWall
    const expectedLeft = leftEdge <= leftWall

    console.log(
      `  Expected: top=${expectedTop}, right=${expectedRight}, bottom=${expectedBottom}, left=${expectedLeft}`
    )
    console.log(
      `  Actual:   top=${character.collision[0]}, right=${character.collision[1]}, bottom=${character.collision[2]}, left=${character.collision[3]}`
    )

    const matches = [
      character.collision[0] === expectedTop,
      character.collision[1] === expectedRight,
      character.collision[2] === expectedBottom,
      character.collision[3] === expectedLeft,
    ]

    console.log(
      `  Match: ${matches.map((m) => (m ? '✓' : '✗')).join(' ')} ${
        matches.every((m) => m) ? 'PASS' : 'FAIL'
      }`
    )

    gameWrapper.free()
  }
}

// Run all tests
testCollisionFlags()
testCollisionFlagAccuracyAfterMovement()
testCollisionFlagConsistency()

console.log('\n=== Collision Flag Detection Test Complete ===')
