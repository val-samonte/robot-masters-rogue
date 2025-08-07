import fs from 'fs'
import path from 'path'

// Test maximum correction distance - character deeply overlapping
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
        [240, 1], // x=240, needs 16 pixels correction but max is 8
        [100, 1], // y=100, middle of screen
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

    console.log('=== MAX CORRECTION DISTANCE TEST ===')
    console.log('Character at x=232, right edge at x=248')
    console.log(
      'Overlaps wall by 11 pixels (more than MAX_CORRECTION_DISTANCE=8)'
    )
    console.log('Should be corrected to x=224 (8 pixels left)')
    console.log('')

    const gameWrapper = new GameWrapper(JSON.stringify(gameConfig))
    gameWrapper.new_game()

    // Check initial state
    const before = JSON.parse(gameWrapper.get_characters_json())
    const char = before[0]
    const posX = char.position[0][0] / char.position[0][1]

    console.log('BEFORE:')
    console.log(
      `  Position: (${posX}, ${char.position[1][0] / char.position[1][1]})`
    )
    console.log(`  Right edge: ${posX + char.size[0]}`)
    console.log(`  Overlap: ${posX + char.size[0] - 240} pixels`)
    console.log('')

    // Step one frame
    gameWrapper.step_frame()

    const after = JSON.parse(gameWrapper.get_characters_json())
    const afterChar = after[0]
    const afterPosX = afterChar.position[0][0] / afterChar.position[0][1]

    console.log('AFTER:')
    console.log(
      `  Position: (${afterPosX}, ${
        afterChar.position[1][0] / afterChar.position[1][1]
      })`
    )
    console.log(`  Right edge: ${afterPosX + afterChar.size[0]}`)

    const deltaX = afterPosX - posX
    console.log(`  Position change: ${deltaX} pixels`)

    if (Math.abs(deltaX) <= 8) {
      console.log('  ✅ CORRECTION WITHIN MAX DISTANCE (8 pixels)')
    } else {
      console.log('  ❌ CORRECTION EXCEEDS MAX DISTANCE!')
    }

    if (afterPosX + afterChar.size[0] <= 240) {
      console.log('  ✅ Character no longer overlaps wall')
    } else {
      console.log('  ❌ Character still overlaps wall')
    }

    if (afterPosX >= 16) {
      console.log('  ✅ Character within left boundary')
    } else {
      console.log('  ❌ Character pushed outside left boundary!')
    }

    gameWrapper.free()
  } catch (error) {
    console.error('Error:', error)
  }
}

loadWasm()
