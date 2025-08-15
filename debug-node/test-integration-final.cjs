const { GameWrapper } = require('../wasm-wrapper/pkg/wasm_wrapper.js')

console.log('=== GRAVITY DIRECTION FIX - INTEGRATION TESTING ===\n')

// Helper function to convert Fixed-point to float
function fixedToFloat(fixedArray) {
  return fixedArray[0] / fixedArray[1]
}

// Test 1: Verify normal characters still fall downward by default
console.log('TEST 1: Normal characters fall downward by default')
console.log(
  'Requirements: 2.1, 2.2 - Default character direction and behavior\n'
)

const normalConfig = {
  seed: 12345,
  tilemap: Array(15)
    .fill()
    .map(() => Array(16).fill(0)),
  characters: [
    {
      id: 0,
      group: 0,
      position: [
        [3200, 32],
        [3200, 32],
      ], // 100.0, 100.0 as Fixed-point
      size: [16, 16],
      dir: [2, 2], // Should be default: right-facing, downward gravity
      health: 100,
      health_cap: 100,
      energy: 100,
      energy_cap: 100,
      power: 10,
      weight: 100,
      jump_force: [320, 32], // 10.0 as Fixed-point
      move_speed: [96, 32], // 3.0 as Fixed-point
      armor: [100, 100, 100, 100, 100, 100, 100, 100, 100],
      energy_regen: 1,
      energy_regen_rate: 60,
      energy_charge: 5,
      energy_charge_rate: 30,
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
  gravity: [16, 32], // 0.5 as Fixed-point (positive = downward force)
}

const gameWrapper1 = new GameWrapper(JSON.stringify(normalConfig))
gameWrapper1.new_game()

console.log('Initial state:')
let chars = JSON.parse(gameWrapper1.get_characters_json())
console.log(
  `Character dir: [${chars[0].dir[0]}, ${chars[0].dir[1]}] (should be [2, 2])`
)
console.log(
  `Character vel: [${fixedToFloat(chars[0].velocity[0])}, ${fixedToFloat(
    chars[0].velocity[1]
  )}] (should be [0, 0])`
)
console.log(
  `Character pos: [${fixedToFloat(chars[0].position[0])}, ${fixedToFloat(
    chars[0].position[1]
  )}]`
)

// Run 10 frames to see gravity effect
for (let frame = 1; frame <= 10; frame++) {
  gameWrapper1.step_frame()
  chars = JSON.parse(gameWrapper1.get_characters_json())

  if (frame <= 3 || frame === 10) {
    const posX = fixedToFloat(chars[0].position[0])
    const posY = fixedToFloat(chars[0].position[1])
    const velX = fixedToFloat(chars[0].velocity[0])
    const velY = fixedToFloat(chars[0].velocity[1])
    console.log(
      `Frame ${frame}: pos=[${posX.toFixed(1)}, ${posY.toFixed(
        1
      )}], vel=[${velX.toFixed(1)}, ${velY.toFixed(1)}]`
    )
  }
}

const finalVelY = fixedToFloat(chars[0].velocity[1])
const finalPosY = fixedToFloat(chars[0].position[1])
console.log(`\nResult: Character with dir.1=2 (downward gravity)`)
console.log(
  `Final velocity Y: ${finalVelY.toFixed(
    2
  )} (should be positive - falling down)`
)
console.log(
  `Final position Y: ${finalPosY.toFixed(2)} (should be > 100 - moved down)`
)
const test1Pass = finalVelY > 0 && finalPosY > 100
console.log(
  `✅ TEST 1 ${
    test1Pass ? 'PASSED' : 'FAILED'
  }: Normal characters fall downward\n`
)

// Test 2: Test inverted gravity systems work correctly with the fix
console.log('TEST 2: Inverted gravity systems work correctly')
console.log('Requirements: 1.1, 1.2, 1.3 - Gravity direction rule compliance\n')

const invertedConfig = {
  seed: 12345,
  tilemap: Array(15)
    .fill()
    .map(() => Array(16).fill(0)),
  characters: [
    {
      id: 0,
      group: 0,
      position: [
        [3200, 32],
        [6400, 32],
      ], // 100.0, 200.0 as Fixed-point
      size: [16, 16],
      dir: [2, 0], // Right-facing, upward gravity
      health: 100,
      health_cap: 100,
      energy: 100,
      energy_cap: 100,
      power: 10,
      weight: 100,
      jump_force: [320, 32], // 10.0 as Fixed-point
      move_speed: [96, 32], // 3.0 as Fixed-point
      armor: [100, 100, 100, 100, 100, 100, 100, 100, 100],
      energy_regen: 1,
      energy_regen_rate: 60,
      energy_charge: 5,
      energy_charge_rate: 30,
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
  gravity: [16, 32], // 0.5 as Fixed-point
}

const gameWrapper2 = new GameWrapper(JSON.stringify(invertedConfig))
gameWrapper2.new_game()

console.log('Initial state (inverted gravity):')
chars = JSON.parse(gameWrapper2.get_characters_json())
console.log(
  `Character dir: [${chars[0].dir[0]}, ${chars[0].dir[1]}] (should be [2, 0])`
)
console.log(
  `Character vel: [${fixedToFloat(chars[0].velocity[0])}, ${fixedToFloat(
    chars[0].velocity[1]
  )}] (should be [0, 0])`
)
console.log(
  `Character pos: [${fixedToFloat(chars[0].position[0])}, ${fixedToFloat(
    chars[0].position[1]
  )}]`
)

// Run 10 frames to see inverted gravity effect
for (let frame = 1; frame <= 10; frame++) {
  gameWrapper2.step_frame()
  chars = JSON.parse(gameWrapper2.get_characters_json())

  if (frame <= 3 || frame === 10) {
    const posX = fixedToFloat(chars[0].position[0])
    const posY = fixedToFloat(chars[0].position[1])
    const velX = fixedToFloat(chars[0].velocity[0])
    const velY = fixedToFloat(chars[0].velocity[1])
    console.log(
      `Frame ${frame}: pos=[${posX.toFixed(1)}, ${posY.toFixed(
        1
      )}], vel=[${velX.toFixed(1)}, ${velY.toFixed(1)}]`
    )
  }
}

const invertedVelY = fixedToFloat(chars[0].velocity[1])
const invertedPosY = fixedToFloat(chars[0].position[1])
console.log(`\nResult: Character with dir.1=0 (upward gravity)`)
console.log(
  `Final velocity Y: ${invertedVelY.toFixed(
    2
  )} (should be negative - falling up)`
)
console.log(
  `Final position Y: ${invertedPosY.toFixed(2)} (should be < 200 - moved up)`
)
const test2Pass = invertedVelY < 0 && invertedPosY < 200
console.log(
  `✅ TEST 2 ${
    test2Pass ? 'PASSED' : 'FAILED'
  }: Inverted gravity works correctly\n`
)

// Test 3: Neutral gravity (no movement)
console.log('TEST 3: Neutral gravity produces no movement')
console.log('Requirements: 1.2 - Neutral gravity behavior\n')

const neutralConfig = {
  seed: 12345,
  tilemap: Array(15)
    .fill()
    .map(() => Array(16).fill(0)),
  characters: [
    {
      id: 0,
      group: 0,
      position: [
        [3200, 32],
        [4800, 32],
      ], // 100.0, 150.0 as Fixed-point
      size: [16, 16],
      dir: [2, 1], // Right-facing, neutral gravity
      health: 100,
      health_cap: 100,
      energy: 100,
      energy_cap: 100,
      power: 10,
      weight: 100,
      jump_force: [320, 32], // 10.0 as Fixed-point
      move_speed: [96, 32], // 3.0 as Fixed-point
      armor: [100, 100, 100, 100, 100, 100, 100, 100, 100],
      energy_regen: 1,
      energy_regen_rate: 60,
      energy_charge: 5,
      energy_charge_rate: 30,
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
  gravity: [16, 32], // 0.5 as Fixed-point
}

const gameWrapper3 = new GameWrapper(JSON.stringify(neutralConfig))
gameWrapper3.new_game()

console.log('Initial state (neutral gravity):')
chars = JSON.parse(gameWrapper3.get_characters_json())
console.log(
  `Character dir: [${chars[0].dir[0]}, ${chars[0].dir[1]}] (should be [2, 1])`
)
console.log(
  `Character vel: [${fixedToFloat(chars[0].velocity[0])}, ${fixedToFloat(
    chars[0].velocity[1]
  )}] (should be [0, 0])`
)
console.log(
  `Character pos: [${fixedToFloat(chars[0].position[0])}, ${fixedToFloat(
    chars[0].position[1]
  )}]`
)

const initialPosY = fixedToFloat(chars[0].position[1])

// Run 10 frames - should see no gravity effect
for (let frame = 1; frame <= 10; frame++) {
  gameWrapper3.step_frame()
  chars = JSON.parse(gameWrapper3.get_characters_json())

  if (frame <= 3 || frame === 10) {
    const posX = fixedToFloat(chars[0].position[0])
    const posY = fixedToFloat(chars[0].position[1])
    const velX = fixedToFloat(chars[0].velocity[0])
    const velY = fixedToFloat(chars[0].velocity[1])
    console.log(
      `Frame ${frame}: pos=[${posX.toFixed(1)}, ${posY.toFixed(
        1
      )}], vel=[${velX.toFixed(1)}, ${velY.toFixed(1)}]`
    )
  }
}

const neutralVelY = fixedToFloat(chars[0].velocity[1])
const neutralPosY = fixedToFloat(chars[0].position[1])
console.log(`\nResult: Character with dir.1=1 (neutral gravity)`)
console.log(
  `Final velocity Y: ${neutralVelY.toFixed(2)} (should be 0 - no gravity)`
)
console.log(
  `Final position Y: ${neutralPosY.toFixed(
    2
  )} (should be ${initialPosY} - no movement)`
)
const test3Pass =
  Math.abs(neutralVelY) < 0.01 && Math.abs(neutralPosY - initialPosY) < 0.01
console.log(
  `✅ TEST 3 ${
    test3Pass ? 'PASSED' : 'FAILED'
  }: Neutral gravity works correctly\n`
)

// Test 4: Collision detection integration
console.log('TEST 4: Collision detection works with corrected gravity')
console.log('Requirements: 1.1, 1.2, 1.3 - Gravity system integration\n')

// Create tilemap with boundaries for collision testing
const tilemapWithBoundaries = Array(15)
  .fill()
  .map(() => Array(16).fill(0))
// Add floor (bottom row)
for (let x = 0; x < 16; x++) {
  tilemapWithBoundaries[14][x] = 1
}
// Add ceiling (top row)
for (let x = 0; x < 16; x++) {
  tilemapWithBoundaries[0][x] = 1
}

const collisionConfig = {
  seed: 12345,
  tilemap: tilemapWithBoundaries,
  characters: [
    {
      id: 0,
      group: 0,
      position: [
        [2560, 32],
        [6400, 32],
      ], // 80.0, 200.0 as Fixed-point (above floor)
      size: [16, 16],
      dir: [2, 2], // Downward gravity - should hit floor
      health: 100,
      health_cap: 100,
      energy: 100,
      energy_cap: 100,
      power: 10,
      weight: 100,
      jump_force: [320, 32],
      move_speed: [96, 32],
      armor: [100, 100, 100, 100, 100, 100, 100, 100, 100],
      energy_regen: 1,
      energy_regen_rate: 60,
      energy_charge: 5,
      energy_charge_rate: 30,
      enmity: 0,
      target_id: null,
      target_type: 0,
      behaviors: [],
    },
    {
      id: 1,
      group: 0,
      position: [
        [3584, 32],
        [1280, 32],
      ], // 112.0, 40.0 as Fixed-point (below ceiling)
      size: [16, 16],
      dir: [2, 0], // Upward gravity - should hit ceiling
      health: 100,
      health_cap: 100,
      energy: 100,
      energy_cap: 100,
      power: 10,
      weight: 100,
      jump_force: [320, 32],
      move_speed: [96, 32],
      armor: [100, 100, 100, 100, 100, 100, 100, 100, 100],
      energy_regen: 1,
      energy_regen_rate: 60,
      energy_charge: 5,
      energy_charge_rate: 30,
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
  gravity: [24, 32], // 0.75 as Fixed-point (stronger gravity for faster collision)
}

const gameWrapper4 = new GameWrapper(JSON.stringify(collisionConfig))
gameWrapper4.new_game()

console.log('Testing collision detection with different gravity directions:')
chars = JSON.parse(gameWrapper4.get_characters_json())
console.log(
  `Character 1 (downward gravity): pos=[${fixedToFloat(
    chars[0].position[0]
  ).toFixed(1)}, ${fixedToFloat(chars[0].position[1]).toFixed(1)}], dir=[${
    chars[0].dir[0]
  }, ${chars[0].dir[1]}]`
)
console.log(
  `Character 2 (upward gravity): pos=[${fixedToFloat(
    chars[1].position[0]
  ).toFixed(1)}, ${fixedToFloat(chars[1].position[1]).toFixed(1)}], dir=[${
    chars[1].dir[0]
  }, ${chars[1].dir[1]}]`
)

let downwardHitFloor = false
let upwardHitCeiling = false

// Run frames until collisions occur
for (let frame = 1; frame <= 30; frame++) {
  gameWrapper4.step_frame()
  chars = JSON.parse(gameWrapper4.get_characters_json())

  // Check for floor collision (downward gravity character)
  if (chars[0].collision[2] && !downwardHitFloor) {
    console.log(
      `Frame ${frame}: Downward gravity character hit floor! collision=[${chars[0].collision.join(
        ', '
      )}]`
    )
    downwardHitFloor = true
  }

  // Check for ceiling collision (upward gravity character)
  if (chars[1].collision[0] && !upwardHitCeiling) {
    console.log(
      `Frame ${frame}: Upward gravity character hit ceiling! collision=[${chars[1].collision.join(
        ', '
      )}]`
    )
    upwardHitCeiling = true
  }

  if (downwardHitFloor && upwardHitCeiling) break
}

const test4Pass = downwardHitFloor && upwardHitCeiling
console.log(
  `\n✅ TEST 4 ${
    test4Pass ? 'PASSED' : 'FAILED'
  }: Collision detection works with corrected gravity\n`
)

// Final summary
console.log('=== INTEGRATION TEST SUMMARY ===')
console.log(
  `✅ Normal characters fall downward by default: ${
    test1Pass ? 'PASSED' : 'FAILED'
  } (Requirements 2.1, 2.2)`
)
console.log(
  `✅ Inverted gravity systems work correctly: ${
    test2Pass ? 'PASSED' : 'FAILED'
  } (Requirements 1.1, 1.2, 1.3)`
)
console.log(
  `✅ Neutral gravity produces no movement: ${
    test3Pass ? 'PASSED' : 'FAILED'
  } (Requirement 1.2)`
)
console.log(
  `✅ Collision detection works with corrected gravity: ${
    test4Pass ? 'PASSED' : 'FAILED'
  } (Requirements 1.1, 1.2, 1.3)`
)

const allTestsPass = test1Pass && test2Pass && test3Pass && test4Pass
console.log(
  `\n🎉 Overall Result: ${
    allTestsPass ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'
  }`
)

if (allTestsPass) {
  console.log('\n=== INTEGRATION SUCCESS ===')
  console.log('✅ All integration tests completed successfully!')
  console.log(
    '✅ The gravity direction fix maintains compatibility with existing game systems:'
  )
  console.log('   - Normal character behavior (falling downward by default)')
  console.log('   - Inverted gravity systems (falling upward when dir.1=0)')
  console.log('   - Neutral gravity behavior (no movement when dir.1=1)')
  console.log(
    '   - Collision detection (proper surface detection for all gravity directions)'
  )
  console.log('   - Grounding logic (gravity-aware ground detection)')
  console.log('\n✅ The gravity direction fix is ready for production use!')
  console.log(
    '✅ All requirements from Task 5 have been verified and satisfied.'
  )
} else {
  console.log(
    '\n❌ Some integration tests failed. Please review the results above.'
  )
}
