const { GameWrapper } = require('../wasm-wrapper/pkg/wasm_wrapper.js')

// Test configuration with characters having different gravity directions
const testConfig = {
  characters: [
    {
      id: 0,
      group: 0,
      pos: [100, 100],
      vel: [0, 0],
      size: [16, 16],
      dir: [2, 0], // Right-facing, upward gravity
      health: 100,
      health_cap: 100,
      energy: 100,
      energy_cap: 100,
      power: 10,
      weight: 100,
      jump_force: 10,
      move_speed: 3,
      armor: [100, 100, 100, 100, 100, 100, 100, 100, 100],
      energy_regen: 1,
      energy_regen_rate: 60,
      energy_charge: 5,
      energy_charge_rate: 30,
      behaviors: [],
    },
    {
      id: 1,
      group: 0,
      pos: [200, 100],
      vel: [0, 0],
      size: [16, 16],
      dir: [2, 1], // Right-facing, neutral gravity
      health: 100,
      health_cap: 100,
      energy: 100,
      energy_cap: 100,
      power: 10,
      weight: 100,
      jump_force: 10,
      move_speed: 3,
      armor: [100, 100, 100, 100, 100, 100, 100, 100, 100],
      energy_regen: 1,
      energy_regen_rate: 60,
      energy_charge: 5,
      energy_charge_rate: 30,
      behaviors: [],
    },
    {
      id: 2,
      group: 0,
      pos: [300, 100],
      vel: [0, 0],
      size: [16, 16],
      dir: [2, 2], // Right-facing, downward gravity (default)
      health: 100,
      health_cap: 100,
      energy: 100,
      energy_cap: 100,
      power: 10,
      weight: 100,
      jump_force: 10,
      move_speed: 3,
      armor: [100, 100, 100, 100, 100, 100, 100, 100, 100],
      energy_regen: 1,
      energy_regen_rate: 60,
      energy_charge: 5,
      energy_charge_rate: 30,
      behaviors: [],
    },
  ],
  spawns: [],
  actions: [],
  conditions: [],
  status_effects: [],
  tilemap: {
    width: 20,
    height: 15,
    tiles: Array(300).fill(0),
  },
  gravity: 0.5, // Positive gravity (downward force)
}

console.log('Testing gravity direction fix...\n')

const gameWrapper = new GameWrapper(JSON.stringify(testConfig))
gameWrapper.new_game()

console.log('Initial state:')
const initialChars = JSON.parse(gameWrapper.get_characters_json())
initialChars.forEach((char, i) => {
  console.log(
    `Character ${i}: pos=[${char.pos[0]}, ${char.pos[1]}], vel=[${char.vel[0]}, ${char.vel[1]}], dir=[${char.dir[0]}, ${char.dir[1]}]`
  )
})

console.log('\nRunning 10 frames to test gravity behavior...\n')

// Run frames and track velocity changes
for (let frame = 1; frame <= 10; frame++) {
  gameWrapper.step_frame()
  const chars = JSON.parse(gameWrapper.get_characters_json())

  console.log(`Frame ${frame}:`)
  chars.forEach((char, i) => {
    const gravityType =
      char.dir[1] === 0 ? 'upward' : char.dir[1] === 1 ? 'neutral' : 'downward'
    console.log(
      `  Char ${i} (${gravityType}): pos=[${char.pos[0].toFixed(
        1
      )}, ${char.pos[1].toFixed(1)}], vel=[${char.vel[0].toFixed(
        1
      )}, ${char.vel[1].toFixed(1)}]`
    )
  })
}

console.log('\nExpected behavior:')
console.log(
  '- Character 0 (dir.1=0, upward gravity): Should have negative velocity (falling upward)'
)
console.log(
  '- Character 1 (dir.1=1, neutral gravity): Should have zero velocity (no gravity effect)'
)
console.log(
  '- Character 2 (dir.1=2, downward gravity): Should have positive velocity (falling downward)'
)

// Verify the fix
const finalChars = JSON.parse(gameWrapper.get_characters_json())
let testsPassed = 0
let totalTests = 3

console.log('\nTest Results:')

// Test upward gravity character
if (finalChars[0].vel[1] < 0) {
  console.log('✅ PASS: Upward gravity character has negative velocity')
  testsPassed++
} else {
  console.log(
    '❌ FAIL: Upward gravity character should have negative velocity, got:',
    finalChars[0].vel[1]
  )
}

// Test neutral gravity character
if (Math.abs(finalChars[1].vel[1]) < 0.1) {
  console.log('✅ PASS: Neutral gravity character has near-zero velocity')
  testsPassed++
} else {
  console.log(
    '❌ FAIL: Neutral gravity character should have zero velocity, got:',
    finalChars[1].vel[1]
  )
}

// Test downward gravity character
if (finalChars[2].vel[1] > 0) {
  console.log('✅ PASS: Downward gravity character has positive velocity')
  testsPassed++
} else {
  console.log(
    '❌ FAIL: Downward gravity character should have positive velocity, got:',
    finalChars[2].vel[1]
  )
}

console.log(`\nOverall: ${testsPassed}/${totalTests} tests passed`)

if (testsPassed === totalTests) {
  console.log(
    '🎉 All gravity direction tests PASSED! The fix is working correctly.'
  )
} else {
  console.log(
    '⚠️  Some tests failed. The gravity direction logic may still have issues.'
  )
}
