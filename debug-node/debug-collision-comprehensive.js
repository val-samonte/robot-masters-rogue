#!/usr/bin/env node

/**
 * Comprehensive Collision System Test Suite
 * Tests all aspects of the collision detection and position correction system
 */

import fs from 'fs'
import path from 'path'

// Base configuration template
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
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  ],
  actions: [
    {
      energy_cost: 0,
      cooldown: 0,
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      spawns: [0, 0, 0, 0],
      script: [15, 0, 64, 15, 1, 31, 32, 2, 0, 1, 16, 20, 2, 0, 1], // RUN action
    },
    {
      energy_cost: 0,
      cooldown: 0,
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      spawns: [0, 0, 0, 0],
      script: [15, 0, 64, 34, 0, 16, 64, 0, 0, 1], // TURN_AROUND action
    },
  ],
  conditions: [
    {
      energy_mul: 32,
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      script: [15, 0, 39, 15, 1, 41, 61, 2, 0, 1, 91, 2], // Wall collision condition
    },
    {
      energy_mul: 32,
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      script: [20, 0, 1, 91, 0], // Always condition
    },
  ],
  spawns: [],
  status_effects: [],
}

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

function createCharacter(id, position, size, direction, behaviors) {
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
    behaviors,
  }
}

function logCharacterState(frame, character, label = '') {
  const posX = character.position[0][0] / character.position[0][1]
  const posY = character.position[1][0] / character.position[1][1]
  const velX = character.velocity[0][0] / character.velocity[0][1]
  const velY = character.velocity[1][0] / character.velocity[1][1]

  console.log(`${label}Frame ${frame}:`)
  console.log(`  Position: (${posX.toFixed(1)}, ${posY.toFixed(1)})`)
  console.log(`  Velocity: (${velX.toFixed(1)}, ${velY.toFixed(1)})`)
  console.log(`  Direction: [${character.dir[0]}, ${character.dir[1]}]`)
  console.log(`  Collision: [${character.collision.join(', ')}]`)
}

async function testBasicCollisionDetection(GameWrapper) {
  console.log('\n=== BASIC COLLISION DETECTION TESTS ===\n')

  // Test 1: Character moving right hits wall
  console.log('--- Test 1: Character moving right hits wall ---')
  const config1 = JSON.parse(JSON.stringify(baseConfig))
  config1.characters = [
    createCharacter(
      1,
      [
        [32, 1],
        [384, 1],
      ], // Start near left wall
      [16, 16],
      [2, 0], // Facing right
      [
        [0, 1],
        [1, 0],
      ] // Run when wall collision, turn around always
    ),
  ]

  const game1 = new GameWrapper(JSON.stringify(config1))
  game1.new_game()

  let hitWall = false
  for (let frame = 0; frame < 50; frame++) {
    const before = JSON.parse(game1.get_characters_json())[0]
    game1.step_frame()
    const after = JSON.parse(game1.get_characters_json())[0]

    if (after.collision[1] && !hitWall) {
      hitWall = true
      console.log(`✓ Hit right wall at frame ${frame}`)
      logCharacterState(frame, after, '  ')

      // Verify position is correct (should be at x=224, not beyond)
      const posX = after.position[0][0] / after.position[0][1]
      if (posX <= 224) {
        console.log(`✓ Position correct: x=${posX.toFixed(1)} (within bounds)`)
      } else {
        console.log(
          `❌ Position incorrect: x=${posX.toFixed(1)} (beyond wall at x=240)`
        )
      }
      break
    }
  }

  if (!hitWall) {
    console.log('❌ Character never hit wall')
  }

  game1.free()

  // Test 2: Character moving left hits wall
  console.log('\n--- Test 2: Character moving left hits wall ---')
  const config2 = JSON.parse(JSON.stringify(baseConfig))
  config2.characters = [
    createCharacter(
      1,
      [
        [200, 1],
        [384, 1],
      ], // Start near right wall
      [16, 16],
      [0, 0], // Facing left
      [
        [0, 1],
        [1, 0],
      ] // Run when wall collision, turn around always
    ),
  ]

  const game2 = new GameWrapper(JSON.stringify(config2))
  game2.new_game()

  hitWall = false
  for (let frame = 0; frame < 50; frame++) {
    const before = JSON.parse(game2.get_characters_json())[0]
    game2.step_frame()
    const after = JSON.parse(game2.get_characters_json())[0]

    if (after.collision[3] && !hitWall) {
      hitWall = true
      console.log(`✓ Hit left wall at frame ${frame}`)
      logCharacterState(frame, after, '  ')

      // Verify position is correct (should be at x=16, not beyond)
      const posX = after.position[0][0] / after.position[0][1]
      if (posX >= 16) {
        console.log(`✓ Position correct: x=${posX.toFixed(1)} (within bounds)`)
      } else {
        console.log(
          `❌ Position incorrect: x=${posX.toFixed(1)} (beyond wall at x=0)`
        )
      }
      break
    }
  }

  if (!hitWall) {
    console.log('❌ Character never hit wall')
  }

  game2.free()

  // Test 3: Character moving up hits ceiling
  console.log('\n--- Test 3: Character moving up hits ceiling ---')
  const config3 = JSON.parse(JSON.stringify(baseConfig))
  config3.characters = [
    createCharacter(
      1,
      [
        [128, 1],
        [32, 1],
      ], // Start near ceiling
      [16, 16],
      [1, 0], // Neutral facing
      [
        [0, 1],
        [1, 0],
      ] // Run when wall collision, turn around always
    ),
  ]
  // Give character upward velocity by modifying gravity
  config3.gravity = [-2, 1] // Upward gravity

  const game3 = new GameWrapper(JSON.stringify(config3))
  game3.new_game()

  hitWall = false
  for (let frame = 0; frame < 30; frame++) {
    const before = JSON.parse(game3.get_characters_json())[0]
    game3.step_frame()
    const after = JSON.parse(game3.get_characters_json())[0]

    if (after.collision[0] && !hitWall) {
      hitWall = true
      console.log(`✓ Hit ceiling at frame ${frame}`)
      logCharacterState(frame, after, '  ')

      // Verify position is correct (should be at y=16, not beyond)
      const posY = after.position[1][0] / after.position[1][1]
      if (posY >= 16) {
        console.log(`✓ Position correct: y=${posY.toFixed(1)} (within bounds)`)
      } else {
        console.log(
          `❌ Position incorrect: y=${posY.toFixed(1)} (beyond ceiling at y=0)`
        )
      }
      break
    }
  }

  if (!hitWall) {
    console.log('❌ Character never hit ceiling')
  }

  game3.free()
}

async function testPositionOverlapCorrection(GameWrapper) {
  console.log('\n=== POSITION OVERLAP CORRECTION TESTS ===\n')

  // Test 1: Character starting overlapped with right wall
  console.log('--- Test 1: Character overlapped with right wall ---')
  const config1 = JSON.parse(JSON.stringify(baseConfig))
  config1.characters = [
    createCharacter(
      1,
      [
        [230, 1],
        [384, 1],
      ], // Start overlapping right wall (wall at x=240, char width=16)
      [16, 16],
      [1, 0], // Neutral facing
      [[1, 0]] // Always turn around (no movement)
    ),
  ]

  const game1 = new GameWrapper(JSON.stringify(config1))
  game1.new_game()

  const initial = JSON.parse(game1.get_characters_json())[0]
  const initialX = initial.position[0][0] / initial.position[0][1]
  console.log(`Initial position: x=${initialX.toFixed(1)} (overlapping wall)`)

  game1.step_frame()

  const corrected = JSON.parse(game1.get_characters_json())[0]
  const correctedX = corrected.position[0][0] / corrected.position[0][1]
  console.log(`After correction: x=${correctedX.toFixed(1)}`)

  if (correctedX < initialX && correctedX <= 224) {
    console.log(
      `✓ Position corrected: moved left by ${(initialX - correctedX).toFixed(
        1
      )} pixels`
    )
  } else if (correctedX === initialX) {
    console.log(`❌ No position correction applied`)
  } else {
    console.log(`❌ Position correction failed: moved to invalid position`)
  }

  game1.free()

  // Test 2: Character starting overlapped with left wall
  console.log('\n--- Test 2: Character overlapped with left wall ---')
  const config2 = JSON.parse(JSON.stringify(baseConfig))
  config2.characters = [
    createCharacter(
      1,
      [
        [10, 1],
        [384, 1],
      ], // Start overlapping left wall (wall at x=16)
      [16, 16],
      [1, 0], // Neutral facing
      [[1, 0]] // Always turn around (no movement)
    ),
  ]

  const game2 = new GameWrapper(JSON.stringify(config2))
  game2.new_game()

  const initial2 = JSON.parse(game2.get_characters_json())[0]
  const initialX2 = initial2.position[0][0] / initial2.position[0][1]
  console.log(`Initial position: x=${initialX2.toFixed(1)} (overlapping wall)`)

  game2.step_frame()

  const corrected2 = JSON.parse(game2.get_characters_json())[0]
  const correctedX2 = corrected2.position[0][0] / corrected2.position[0][1]
  console.log(`After correction: x=${correctedX2.toFixed(1)}`)

  if (correctedX2 > initialX2 && correctedX2 >= 16) {
    console.log(
      `✓ Position corrected: moved right by ${(correctedX2 - initialX2).toFixed(
        1
      )} pixels`
    )
  } else if (correctedX2 === initialX2) {
    console.log(`❌ No position correction applied`)
  } else {
    console.log(`❌ Position correction failed: moved to invalid position`)
  }

  game2.free()

  // Test 3: Verify correction never pushes outside boundaries
  console.log('\n--- Test 3: Correction boundary safety ---')
  const config3 = JSON.parse(JSON.stringify(baseConfig))
  config3.characters = [
    createCharacter(
      1,
      [
        [250, 1],
        [384, 1],
      ], // Start way outside right boundary
      [16, 16],
      [1, 0], // Neutral facing
      [[1, 0]] // Always turn around (no movement)
    ),
  ]

  const game3 = new GameWrapper(JSON.stringify(config3))
  game3.new_game()

  const initial3 = JSON.parse(game3.get_characters_json())[0]
  const initialX3 = initial3.position[0][0] / initial3.position[0][1]
  console.log(
    `Initial position: x=${initialX3.toFixed(1)} (way outside boundary)`
  )

  game3.step_frame()

  const corrected3 = JSON.parse(game3.get_characters_json())[0]
  const correctedX3 = corrected3.position[0][0] / corrected3.position[0][1]
  console.log(`After correction: x=${correctedX3.toFixed(1)}`)

  if (correctedX3 >= 0 && correctedX3 + 16 <= 256) {
    console.log(`✓ Position within boundaries: 0 <= x <= ${256 - 16}`)
  } else {
    console.log(`❌ Position outside boundaries`)
  }

  game3.free()
}

async function testTurnAroundBehavior(GameWrapper) {
  console.log('\n=== TURN-AROUND BEHAVIOR TESTS ===\n')

  console.log('--- Complete turn-around sequence test ---')
  const config = JSON.parse(JSON.stringify(baseConfig))
  config.characters = [
    createCharacter(
      1,
      [
        [32, 1],
        [384, 1],
      ], // Start near left wall
      [16, 16],
      [2, 0], // Facing right
      [
        [0, 1],
        [1, 0],
      ] // Run when wall collision, turn around always
    ),
  ]

  const game = new GameWrapper(JSON.stringify(config))
  game.new_game()

  let hitWall = false
  let turnedAround = false
  let movedAway = false

  for (let frame = 0; frame < 100; frame++) {
    const before = JSON.parse(game.get_characters_json())[0]
    game.step_frame()
    const after = JSON.parse(game.get_characters_json())[0]

    const posX = after.position[0][0] / after.position[0][1]
    const velX = after.velocity[0][0] / after.velocity[0][1]

    // Phase 1: Hit wall
    if (!hitWall && after.collision[1]) {
      hitWall = true
      console.log(`✓ Phase 1 - Hit wall at frame ${frame}`)
      logCharacterState(frame, after, '  ')
    }

    // Phase 2: Turn around
    if (hitWall && !turnedAround && before.dir[0] !== after.dir[0]) {
      turnedAround = true
      console.log(`✓ Phase 2 - Turned around at frame ${frame}`)
      console.log(
        `  Direction changed from ${before.dir[0]} to ${after.dir[0]}`
      )
      logCharacterState(frame, after, '  ')
    }

    // Phase 3: Move away from wall
    if (turnedAround && !movedAway) {
      const prevPosX = before.position[0][0] / before.position[0][1]
      const posChange = Math.abs(posX - prevPosX)

      if (posChange > 0.5 && Math.abs(velX) > 0.5) {
        movedAway = true
        console.log(`✓ Phase 3 - Moving away from wall at frame ${frame}`)
        console.log(`  Position change: ${posChange.toFixed(1)} pixels`)
        console.log(`  Velocity: ${velX.toFixed(1)}`)
        logCharacterState(frame, after, '  ')
        break
      }

      // Check for stuck condition
      if (frame > 50 && Math.abs(velX) > 0.1 && posChange < 0.1) {
        console.log(`❌ STUCK CONDITION DETECTED at frame ${frame}`)
        console.log(
          `  Velocity: ${velX.toFixed(
            1
          )} but position change: ${posChange.toFixed(1)}`
        )
        logCharacterState(frame, after, '  ')
        break
      }
    }
  }

  if (!hitWall) {
    console.log('❌ Never hit wall')
  } else if (!turnedAround) {
    console.log('❌ Hit wall but never turned around')
  } else if (!movedAway) {
    console.log('❌ Turned around but never moved away (stuck condition)')
  } else {
    console.log('✅ Complete turn-around sequence successful')
  }

  game.free()
}

async function testEdgeCases(GameWrapper) {
  console.log('\n=== EDGE CASE TESTS ===\n')

  // Test 1: Character exactly at tile boundaries
  console.log('--- Test 1: Character at exact tile boundaries ---')
  const boundaryPositions = [
    {
      name: 'Left wall boundary',
      pos: [
        [16, 1],
        [384, 1],
      ],
      expectedCollision: [false, false, false, true],
    },
    {
      name: 'Right wall boundary',
      pos: [
        [224, 1],
        [384, 1],
      ],
      expectedCollision: [false, true, false, false],
    },
    {
      name: 'Top boundary',
      pos: [
        [128, 1],
        [16, 1],
      ],
      expectedCollision: [true, false, false, false],
    },
    {
      name: 'Bottom boundary',
      pos: [
        [128, 1],
        [208, 1],
      ],
      expectedCollision: [false, false, true, false],
    },
  ]

  for (const test of boundaryPositions) {
    console.log(`\n  Testing: ${test.name}`)
    const config = JSON.parse(JSON.stringify(baseConfig))
    config.characters = [
      createCharacter(
        1,
        test.pos,
        [16, 16],
        [1, 0], // Neutral facing
        [[1, 0]] // Always turn around (no movement)
      ),
    ]

    const game = new GameWrapper(JSON.stringify(config))
    game.new_game()
    game.step_frame()

    const char = JSON.parse(game.get_characters_json())[0]
    const posX = char.position[0][0] / char.position[0][1]
    const posY = char.position[1][0] / char.position[1][1]

    console.log(`    Position: (${posX.toFixed(1)}, ${posY.toFixed(1)})`)
    console.log(`    Collision: [${char.collision.join(', ')}]`)
    console.log(`    Expected:  [${test.expectedCollision.join(', ')}]`)

    const collisionMatch = char.collision.every(
      (flag, i) => flag === test.expectedCollision[i]
    )
    if (collisionMatch) {
      console.log(`    ✓ Collision flags correct`)
    } else {
      console.log(`    ❌ Collision flags incorrect`)
    }

    game.free()
  }

  // Test 2: Different character sizes
  console.log('\n--- Test 2: Different character sizes ---')
  const sizes = [
    { name: '8x8', size: [8, 8] },
    { name: '16x16', size: [16, 16] },
    { name: '16x32', size: [16, 32] },
    { name: '32x32', size: [32, 32] },
  ]

  for (const sizeTest of sizes) {
    console.log(`\n  Testing size: ${sizeTest.name}`)
    const config = JSON.parse(JSON.stringify(baseConfig))
    config.characters = [
      createCharacter(
        1,
        [
          [32, 1],
          [384, 1],
        ], // Start position
        sizeTest.size,
        [2, 0], // Facing right
        [
          [0, 1],
          [1, 0],
        ] // Run when wall collision, turn around always
      ),
    ]

    const game = new GameWrapper(JSON.stringify(config))
    game.new_game()

    // Run until wall hit or timeout
    let hitWall = false
    for (let frame = 0; frame < 50; frame++) {
      game.step_frame()
      const char = JSON.parse(game.get_characters_json())[0]

      if (char.collision[1]) {
        hitWall = true
        const posX = char.position[0][0] / char.position[0][1]
        const rightEdge = posX + sizeTest.size[0]

        console.log(`    Hit wall at frame ${frame}`)
        console.log(
          `    Position: x=${posX.toFixed(1)}, right edge: ${rightEdge.toFixed(
            1
          )}`
        )

        if (rightEdge <= 240) {
          console.log(
            `    ✓ Collision detection correct for size ${sizeTest.name}`
          )
        } else {
          console.log(
            `    ❌ Character extends beyond wall (${rightEdge.toFixed(
              1
            )} > 240)`
          )
        }
        break
      }
    }

    if (!hitWall) {
      console.log(`    ❌ Character never hit wall`)
    }

    game.free()
  }

  // Test 3: Multiple characters
  console.log('\n--- Test 3: Multiple characters collision ---')
  const config = JSON.parse(JSON.stringify(baseConfig))
  config.characters = [
    createCharacter(
      1,
      [
        [32, 1],
        [384, 1],
      ],
      [16, 16],
      [2, 0],
      [
        [0, 1],
        [1, 0],
      ]
    ),
    createCharacter(
      2,
      [
        [200, 1],
        [384, 1],
      ],
      [16, 16],
      [0, 0],
      [
        [0, 1],
        [1, 0],
      ]
    ),
    createCharacter(
      3,
      [
        [128, 1],
        [32, 1],
      ],
      [16, 16],
      [1, 0],
      [[1, 0]]
    ),
  ]

  const game = new GameWrapper(JSON.stringify(config))
  game.new_game()

  console.log('  Testing multiple characters simultaneously...')
  let wallHits = 0

  for (let frame = 0; frame < 50; frame++) {
    game.step_frame()
    const chars = JSON.parse(game.get_characters_json())

    for (let i = 0; i < chars.length; i++) {
      const char = chars[i]
      if (char.collision.some((flag) => flag)) {
        wallHits++
        const posX = char.position[0][0] / char.position[0][1]
        const posY = char.position[1][0] / char.position[1][1]
        console.log(
          `    Character ${i + 1} hit wall at frame ${frame}: (${posX.toFixed(
            1
          )}, ${posY.toFixed(1)})`
        )
      }
    }
  }

  if (wallHits > 0) {
    console.log(
      `  ✓ Multiple characters handled correctly (${wallHits} wall hits detected)`
    )
  } else {
    console.log(`  ❌ No wall hits detected for multiple characters`)
  }

  game.free()
}

async function runComprehensiveTests() {
  console.log('🚀 COMPREHENSIVE COLLISION SYSTEM TEST SUITE')
  console.log('='.repeat(50))

  const GameWrapper = await loadWasm()

  try {
    await testBasicCollisionDetection(GameWrapper)
    await testPositionOverlapCorrection(GameWrapper)
    await testTurnAroundBehavior(GameWrapper)
    await testEdgeCases(GameWrapper)

    console.log('\n' + '='.repeat(50))
    console.log('✅ COMPREHENSIVE COLLISION SYSTEM TESTS COMPLETE')
    console.log(
      '\nIf all tests passed, the collision system is working correctly.'
    )
    console.log('If any tests failed, those areas need further investigation.')
  } catch (error) {
    console.error('\n❌ Test suite failed with error:', error)
    process.exit(1)
  }
}

// Run the comprehensive test suite
runComprehensiveTests()
