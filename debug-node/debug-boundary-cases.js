import fs from 'fs'
import path from 'path'

// Test specific boundary cases mentioned in task 11.1
const createConfig = (x) => ({
  seed: 12345,
  gravity: [1, 2],
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
  actions: [
    {
      energy_cost: 0,
      cooldown: 0,
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      spawns: [0, 0, 0, 0],
      script: [20, 0, 1, 91, 0],
    },
  ],
  conditions: [
    {
      energy_mul: 32,
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      script: [20, 0, 1, 91, 0],
    },
  ],
  characters: [
    {
      id: 1,
      position: [
        [x, 1],
        [208, 1],
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
      dir: [2, 0],
      enmity: 0,
      target_id: null,
      target_type: 0,
      behaviors: [[0, 0]],
    },
  ],
  spawns: [],
  status_effects: [],
})

async function loadWasm() {
  try {
    const wasmModule = await import('../wasm-wrapper/pkg/wasm_wrapper.js')
    const { default: init, GameWrapper } = wasmModule

    const wasmPath = path.join(
      process.cwd(),
      '../wasm-wrapper/pkg/wasm_wrapper_bg.wasm'
    )
    const wasmBuffer = fs.readFileSync(wasmPath)
    await init(wasmBuffer)

    console.log('=== TASK 11.1 BOUNDARY CASES TEST ===')
    console.log('Testing specific cases mentioned in task 11.1')
    console.log('Expected behavior:')
    console.log(
      '- Character at x=224 (exactly at wall boundary) should not move'
    )
    console.log('- Character at x=225 should be pushed back to x=224')
    console.log(
      '- Character at x=239 should be able to move to x=240 but not x=241'
    )
    console.log('')

    const testCases = [
      {
        x: 224,
        desc: 'x=224 (exactly at wall boundary)',
        expected: 'should not move',
      },
      {
        x: 225,
        desc: 'x=225 (overlapping wall)',
        expected: 'should be pushed back to x=224',
      },
      {
        x: 239,
        desc: 'x=239 (near boundary)',
        expected: 'should be able to move to x=240',
      },
    ]

    for (const testCase of testCases) {
      console.log(`Testing ${testCase.desc} (${testCase.expected}):`)

      const config = createConfig(testCase.x)
      const gameWrapper = new GameWrapper(JSON.stringify(config))
      gameWrapper.new_game()

      // Get initial state
      const before = JSON.parse(gameWrapper.get_characters_json())
      const char = before[0]
      const posX = char.position[0][0] / char.position[0][1]

      console.log(
        `  Before: x=${posX}, bounds=${posX} to ${posX + char.size[0]}`
      )

      // Step one frame to see position correction
      gameWrapper.step_frame()

      const after = JSON.parse(gameWrapper.get_characters_json())
      const afterChar = after[0]
      const afterPosX = afterChar.position[0][0] / afterChar.position[0][1]

      console.log(
        `  After:  x=${afterPosX}, bounds=${afterPosX} to ${
          afterPosX + afterChar.size[0]
        }`
      )

      const deltaX = afterPosX - posX
      if (deltaX !== 0) {
        console.log(`  Change: ${deltaX} pixels`)
      } else {
        console.log(`  Change: No movement`)
      }

      // Evaluate result based on expected behavior
      if (testCase.x === 224) {
        if (deltaX === 0) {
          console.log(`  Result: ✅ PASS - Character did not move (correct)`)
        } else {
          console.log(`  Result: ❌ FAIL - Character moved when it shouldn't`)
        }
      } else if (testCase.x === 225) {
        if (afterPosX === 224) {
          console.log(
            `  Result: ✅ PASS - Character pushed back to x=224 (correct)`
          )
        } else {
          console.log(
            `  Result: ❌ FAIL - Character not pushed to correct position`
          )
        }
      } else if (testCase.x === 239) {
        if (afterPosX === 239) {
          console.log(
            `  Result: ✅ PASS - Character stayed at x=239 (can move to boundary)`
          )
        } else {
          console.log(
            `  Result: ❌ FAIL - Character position changed unexpectedly`
          )
        }
      }

      console.log('')
      gameWrapper.free()
    }
  } catch (error) {
    console.error('Error:', error)
  }
}

loadWasm()
