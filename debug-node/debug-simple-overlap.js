import fs from 'fs'
import path from 'path'

// Very simple test - character overlapping right wall, no movement
const gameConfig = {
  seed: 12345,
  gravity: [0, 2], // No gravity to avoid complications
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
      script: [20, 0, 0, 91, 0], // ASSIGN_BYTE 0, 0, EXIT - always false
    },
  ],
  characters: [
    {
      id: 1,
      position: [
        [230, 1], // x=230, overlaps wall at x=240
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
      dir: [1, 1], // Neutral direction
      enmity: 0,
      target_id: null,
      target_type: 0,
      behaviors: [
        [0, 0], // Never trigger (condition always false)
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

    console.log('=== SIMPLE OVERLAP TEST ===')
    console.log('Character at x=230, width=16, right edge at x=246')
    console.log('Wall at x=240, so character overlaps by 6 pixels')
    console.log('No gravity, no behaviors - just position correction')
    console.log('Expected: character should be pushed LEFT to x=224')
    console.log('')

    const gameWrapper = new GameWrapper(JSON.stringify(gameConfig))
    gameWrapper.new_game()

    // Check initial state
    const before = JSON.parse(gameWrapper.get_characters_json())
    const char = before[0]
    const posX = char.position[0][0] / char.position[0][1]
    const posY = char.position[1][0] / char.position[1][1]

    console.log('BEFORE:')
    console.log(`  Position: (${posX}, ${posY})`)
    console.log(`  Right edge: ${posX + char.size[0]}`)
    console.log(`  Overlaps wall: ${posX + char.size[0] > 240 ? 'YES' : 'NO'}`)
    console.log('')

    // Step one frame
    gameWrapper.step_frame()

    const after = JSON.parse(gameWrapper.get_characters_json())
    const afterChar = after[0]
    const afterPosX = afterChar.position[0][0] / afterChar.position[0][1]
    const afterPosY = afterChar.position[1][0] / afterChar.position[1][1]

    console.log('AFTER:')
    console.log(`  Position: (${afterPosX}, ${afterPosY})`)
    console.log(`  Right edge: ${afterPosX + afterChar.size[0]}`)
    console.log(
      `  Overlaps wall: ${afterPosX + afterChar.size[0] > 240 ? 'YES' : 'NO'}`
    )

    const deltaX = afterPosX - posX
    console.log(`  Position change: ${deltaX} pixels`)

    if (deltaX < 0) {
      console.log('  ✅ MOVED LEFT - Correct!')
      if (afterPosX === 224) {
        console.log('  ✅ MOVED TO CORRECT POSITION (x=224)')
      } else {
        console.log(`  ⚠️  MOVED LEFT but to x=${afterPosX}, expected x=224`)
      }
    } else if (deltaX > 0) {
      console.log('  ❌ MOVED RIGHT - Wrong direction!')
    } else {
      console.log(
        '  ⚠️  NO MOVEMENT - Position correction may not have triggered'
      )
    }

    gameWrapper.free()
  } catch (error) {
    console.error('Error:', error)
  }
}

loadWasm()
