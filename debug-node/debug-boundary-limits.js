import fs from 'fs'
import path from 'path'

// Test boundary limits - character near left wall
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
        [14, 1], // x=14, overlaps left wall at x=0-15
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

    console.log('=== BOUNDARY LIMITS TEST ===')
    console.log('Character at x=14, overlaps left wall (x=0-15)')
    console.log('Should be pushed RIGHT to x=16 (minimum valid position)')
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
    console.log(`  Left edge: ${posX}`)
    console.log(`  Right edge: ${posX + char.size[0]}`)
    console.log(`  Overlaps left wall: ${posX < 16 ? 'YES' : 'NO'}`)
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
    console.log(`  Left edge: ${afterPosX}`)
    console.log(`  Right edge: ${afterPosX + afterChar.size[0]}`)
    console.log(`  Overlaps left wall: ${afterPosX < 16 ? 'YES' : 'NO'}`)

    const deltaX = afterPosX - posX
    console.log(`  Position change: ${deltaX} pixels`)

    if (deltaX > 0) {
      console.log('  ✅ MOVED RIGHT - Correct direction')
      if (afterPosX === 16) {
        console.log('  ✅ MOVED TO CORRECT POSITION (x=16)')
      } else {
        console.log(`  ⚠️  MOVED RIGHT but to x=${afterPosX}, expected x=16`)
      }
    } else if (deltaX < 0) {
      console.log('  ❌ MOVED LEFT - Wrong direction!')
    } else {
      console.log('  ⚠️  NO MOVEMENT')
    }

    // Check if character is within boundaries
    if (afterPosX >= 16 && afterPosX + afterChar.size[0] <= 240) {
      console.log('  ✅ Character is within game boundaries')
    } else {
      console.log('  ❌ Character is outside game boundaries!')
    }

    gameWrapper.free()
  } catch (error) {
    console.error('Error:', error)
  }
}

loadWasm()
