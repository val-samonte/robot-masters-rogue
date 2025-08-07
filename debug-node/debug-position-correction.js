import fs from 'fs'
import path from 'path'

// Test position correction algorithm directly
const gameConfig = {
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
      script: [20, 0, 1, 91, 0], // ALWAYS condition - just return true
    },
  ],
  conditions: [
    {
      energy_mul: 32,
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      script: [20, 0, 1, 91, 0], // ALWAYS condition
    },
  ],
  characters: [
    {
      id: 1,
      position: [
        [230, 1], // Start close to right wall (240 - 16 = 224 is wall boundary)
        [208, 1], // Y position (13*16 = 208, just above ground)
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
      dir: [2, 0], // Moving right
      enmity: 0,
      target_id: null,
      target_type: 0,
      behaviors: [
        [0, 0], // Always do nothing - just test collision
      ],
    },
  ],
  spawns: [],
  status_effects: [],
}

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

    console.log('=== POSITION CORRECTION DEBUG TEST ===')
    console.log('Character at x=230 with width=16 overlaps wall at x=240')
    console.log('Expected: character should be pushed LEFT to x=224')
    console.log('Actual: character gets pushed to x=256 (wrong direction!)')
    console.log('')

    const gameWrapper = new GameWrapper(JSON.stringify(gameConfig))
    gameWrapper.new_game()

    // Get initial state
    const before = JSON.parse(gameWrapper.get_characters_json())
    const char = before[0]
    const posX = char.position[0][0] / char.position[0][1]
    const posY = char.position[1][0] / char.position[1][1]

    console.log('BEFORE position correction:')
    console.log(`  Position: (${posX}, ${posY})`)
    console.log(`  Character bounds: x=${posX} to x=${posX + char.size[0]}`)
    console.log(`  Right edge: ${posX + char.size[0]} (should be <= 240)`)
    console.log(`  Overlap: ${posX + char.size[0] - 240} pixels into wall`)
    console.log('')

    // Step one frame to trigger position correction
    gameWrapper.step_frame()

    const after = JSON.parse(gameWrapper.get_characters_json())
    const afterChar = after[0]
    const afterPosX = afterChar.position[0][0] / afterChar.position[0][1]
    const afterPosY = afterChar.position[1][0] / afterChar.position[1][1]

    console.log('AFTER position correction:')
    console.log(`  Position: (${afterPosX}, ${afterPosY})`)
    console.log(
      `  Character bounds: x=${afterPosX} to x=${afterPosX + afterChar.size[0]}`
    )
    console.log(`  Right edge: ${afterPosX + afterChar.size[0]}`)

    const deltaX = afterPosX - posX
    console.log(`  Position change: ${deltaX} pixels`)

    if (deltaX > 0) {
      console.log('  ❌ MOVED RIGHT - This is wrong! Should move LEFT')
    } else if (deltaX < 0) {
      console.log('  ✅ MOVED LEFT - This is correct direction')
    } else {
      console.log(
        '  ⚠️  NO MOVEMENT - Position correction may not have triggered'
      )
    }

    if (afterPosX + afterChar.size[0] <= 240) {
      console.log('  ✅ Character is now inside game boundaries')
    } else {
      console.log('  ❌ Character is still outside game boundaries!')
    }

    if (afterPosX >= 16) {
      console.log('  ✅ Character is not overlapping left wall')
    } else {
      console.log('  ❌ Character is now overlapping left wall!')
    }

    gameWrapper.free()
  } catch (error) {
    console.error('Error:', error)
  }
}

loadWasm()
