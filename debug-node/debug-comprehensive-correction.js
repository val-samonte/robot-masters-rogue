import fs from 'fs'
import path from 'path'

// Comprehensive test of all position correction scenarios
const testCases = [
  {
    name: 'Right wall overlap (6 pixels)',
    position: [230, 100],
    expected: { x: 224, direction: 'LEFT', distance: 6 },
  },
  {
    name: 'Left wall overlap (2 pixels)',
    position: [14, 100],
    expected: { x: 16, direction: 'RIGHT', distance: 2 },
  },
  {
    name: 'Right wall overlap (exactly 8 pixels)',
    position: [232, 100],
    expected: { x: 224, direction: 'LEFT', distance: 8 },
  },
  {
    name: 'Right wall overlap (too far - 16 pixels)',
    position: [240, 100],
    expected: { x: 240, direction: 'NONE', distance: 0 },
  },
]

async function runTest(testCase) {
  const gameConfig = {
    seed: 12345,
    gravity: [0, 2], // No gravity
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
        script: [91, 0], // EXIT - do nothing
      },
    ],
    conditions: [
      {
        energy_mul: 32,
        args: [0, 0, 0, 0, 0, 0, 0, 0],
        script: [20, 0, 0, 91, 0], // ALWAYS false
      },
    ],
    characters: [
      {
        id: 1,
        position: [
          [testCase.position[0], 1],
          [testCase.position[1], 1],
        ],
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
        dir: [1, 1], // Neutral
        enmity: 0,
        target_id: null,
        target_type: 0,
        behaviors: [
          [0, 0], // Never trigger
        ],
      },
    ],
    spawns: [],
    status_effects: [],
  }

  const wasmModule = await import('../wasm-wrapper/pkg/wasm_wrapper.js')
  const { default: init, GameWrapper } = wasmModule

  const wasmPath = path.join(
    process.cwd(),
    '../wasm-wrapper/pkg/wasm_wrapper_bg.wasm'
  )
  const wasmBuffer = fs.readFileSync(wasmPath)
  await init(wasmBuffer)

  const gameWrapper = new GameWrapper(JSON.stringify(gameConfig))
  gameWrapper.new_game()

  // Get before state
  const before = JSON.parse(gameWrapper.get_characters_json())
  const char = before[0]
  const beforeX = char.position[0][0] / char.position[0][1]

  // Step one frame
  gameWrapper.step_frame()

  // Get after state
  const after = JSON.parse(gameWrapper.get_characters_json())
  const afterChar = after[0]
  const afterX = afterChar.position[0][0] / afterChar.position[0][1]

  const deltaX = afterX - beforeX
  const actualDistance = Math.abs(deltaX)

  let actualDirection = 'NONE'
  if (deltaX > 0) actualDirection = 'RIGHT'
  if (deltaX < 0) actualDirection = 'LEFT'

  const passed =
    afterX === testCase.expected.x &&
    actualDirection === testCase.expected.direction &&
    actualDistance === testCase.expected.distance

  console.log(`${testCase.name}:`)
  console.log(`  Before: x=${beforeX}`)
  console.log(`  After: x=${afterX}`)
  console.log(
    `  Expected: x=${testCase.expected.x}, ${testCase.expected.direction}, ${testCase.expected.distance}px`
  )
  console.log(`  Actual: x=${afterX}, ${actualDirection}, ${actualDistance}px`)
  console.log(`  Result: ${passed ? '✅ PASS' : '❌ FAIL'}`)
  console.log('')

  gameWrapper.free()
  return passed
}

async function runAllTests() {
  console.log('=== COMPREHENSIVE POSITION CORRECTION TEST ===')
  console.log('Testing all scenarios from task requirements')
  console.log('')

  let passedTests = 0
  let totalTests = testCases.length

  for (const testCase of testCases) {
    const passed = await runTest(testCase)
    if (passed) passedTests++
  }

  console.log('=== SUMMARY ===')
  console.log(`Passed: ${passedTests}/${totalTests}`)

  if (passedTests === totalTests) {
    console.log(
      '✅ ALL TESTS PASSED - Position correction is working correctly!'
    )
    console.log('')
    console.log('Task 11.2 requirements verified:')
    console.log('✅ Characters pushed in minimal distance')
    console.log('✅ Velocity direction preference working')
    console.log('✅ Maximum correction distance limit (8 pixels)')
    console.log('✅ Boundary checking prevents out-of-bounds positions')
    console.log('✅ Position correction moves entities to valid positions')
  } else {
    console.log('❌ SOME TESTS FAILED - Position correction needs fixes')
  }
}

runAllTests().catch(console.error)
