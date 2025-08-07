import fs from 'fs'
import path from 'path'

// Test minimal overlap cases
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

    console.log('=== MINIMAL OVERLAP TEST ===')
    console.log(
      'Testing characters with minimal overlap to verify position correction'
    )
    console.log('Wall boundary: x=240 (right edge of valid area)')
    console.log('')

    const testCases = [
      { x: 224, desc: 'x=224 (right edge at x=240 - exactly at boundary)' },
      { x: 225, desc: 'x=225 (right edge at x=241 - 1 pixel overlap)' },
      { x: 226, desc: 'x=226 (right edge at x=242 - 2 pixel overlap)' },
      { x: 230, desc: 'x=230 (right edge at x=246 - 6 pixel overlap)' },
    ]

    for (const testCase of testCases) {
      console.log(`Testing ${testCase.desc}:`)

      const config = createConfig(testCase.x)
      const gameWrapper = new GameWrapper(JSON.stringify(config))
      gameWrapper.new_game()

      // Get initial state
      const before = JSON.parse(gameWrapper.get_characters_json())
      const char = before[0]
      const posX = char.position[0][0] / char.position[0][1]
      const rightEdge = posX + char.size[0]
      const overlap = Math.max(0, rightEdge - 240)

      console.log(
        `  Before: x=${posX}, right edge=${rightEdge}, overlap=${overlap} pixels`
      )

      // Step one frame to see position correction
      gameWrapper.step_frame()

      const after = JSON.parse(gameWrapper.get_characters_json())
      const afterChar = after[0]
      const afterPosX = afterChar.position[0][0] / afterChar.position[0][1]
      const afterRightEdge = afterPosX + afterChar.size[0]

      console.log(`  After:  x=${afterPosX}, right edge=${afterRightEdge}`)

      const deltaX = afterPosX - posX
      if (deltaX !== 0) {
        console.log(`  Change: ${deltaX} pixels`)
      } else {
        console.log(`  Change: No movement`)
      }

      // Check if correction is appropriate
      if (overlap === 0) {
        if (deltaX === 0) {
          console.log(`  Result: ✅ CORRECT - No overlap, no correction needed`)
        } else {
          console.log(
            `  Result: ❌ ERROR - No overlap but position was corrected`
          )
        }
      } else {
        if (afterRightEdge <= 240) {
          console.log(
            `  Result: ✅ CORRECT - Overlap corrected, right edge now at ${afterRightEdge}`
          )
        } else {
          console.log(`  Result: ❌ ERROR - Overlap not fully corrected`)
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
