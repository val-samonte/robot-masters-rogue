import fs from 'fs'
import path from 'path'

// Test boundary positions to verify coordinate system
const createConfig = (x, y) => ({
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
        [y, 1],
      ],
      group: 1,
      size: [16, 16],
      health: 100,
      health_cap: 100,
      energy: 100,
      energy_cap: 100,
      power: 10,
      weight: 5,
      jump_force: [
        [160, 32],
        [32, 32],
      ],
      move_speed: [
        [64, 32],
        [32, 32],
      ],
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

    console.log('=== BOUNDARY POSITION TEST ===')
    console.log(
      'Testing different character positions to verify coordinate system'
    )
    console.log('Game boundaries: x=16 to x=240 (inside walls)')
    console.log('')

    const testPositions = [
      { x: 16, y: 208, desc: 'x=16 (exactly at left boundary)' },
      { x: 224, y: 208, desc: 'x=224 (exactly at right boundary)' },
      { x: 230, y: 208, desc: 'x=230 (overlapping right wall)' },
    ]

    for (const testPos of testPositions) {
      console.log(`Testing ${testPos.desc}:`)

      const config = createConfig(testPos.x, testPos.y)
      const gameWrapper = new GameWrapper(JSON.stringify(config))
      gameWrapper.new_game()

      // Get initial state
      const before = JSON.parse(gameWrapper.get_characters_json())
      const char = before[0]
      const posX = char.position[0][0] / char.position[0][1]

      console.log(
        `  Before: x=${posX}, bounds=${posX} to ${posX + char.size[0]}`
      )

      // Step one frame
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

      // Check if position is valid
      const rightEdge = afterPosX + afterChar.size[0]
      if (afterPosX >= 16 && rightEdge <= 240) {
        console.log(`  Status: ✅ Valid position (inside boundaries)`)
      } else {
        console.log(`  Status: ❌ Invalid position (outside boundaries)`)
      }

      console.log('')
      gameWrapper.free()
    }
  } catch (error) {
    console.error('Error:', error)
  }
}

loadWasm()
