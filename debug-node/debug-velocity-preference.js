import fs from 'fs'
import path from 'path'

// Test velocity-based direction preference
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
      script: [20, 0, 1, 91, 0], // ALWAYS true
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
      dir: [2, 1], // Moving right
      velocity: [
        [2, 1], // X velocity = 2.0 (moving right)
        [0, 1], // Y velocity = 0.0
      ],
      enmity: 0,
      target_id: null,
      target_type: 0,
      behaviors: [
        [0, 0], // Always set rightward velocity
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

    console.log('=== VELOCITY PREFERENCE TEST ===')
    console.log('Character at x=230, trying to move RIGHT')
    console.log('Should be pushed LEFT (opposite to velocity direction)')
    console.log('')

    const gameWrapper = new GameWrapper(JSON.stringify(gameConfig))
    gameWrapper.new_game()

    // Check initial state
    const before = JSON.parse(gameWrapper.get_characters_json())
    const char = before[0]
    const posX = char.position[0][0] / char.position[0][1]
    const velX = char.velocity[0][0] / char.velocity[0][1]

    console.log('BEFORE:')
    console.log(
      `  Position: (${posX}, ${char.position[1][0] / char.position[1][1]})`
    )
    console.log(
      `  Velocity: (${velX}, ${char.velocity[1][0] / char.velocity[1][1]})`
    )
    console.log(`  Right edge: ${posX + char.size[0]}`)
    console.log('')

    // Step one frame
    gameWrapper.step_frame()

    const after = JSON.parse(gameWrapper.get_characters_json())
    const afterChar = after[0]
    const afterPosX = afterChar.position[0][0] / afterChar.position[0][1]
    const afterVelX = afterChar.velocity[0][0] / afterChar.velocity[0][1]

    console.log('AFTER:')
    console.log(
      `  Position: (${afterPosX}, ${
        afterChar.position[1][0] / afterChar.position[1][1]
      })`
    )
    console.log(
      `  Velocity: (${afterVelX}, ${
        afterChar.velocity[1][0] / afterChar.velocity[1][1]
      })`
    )
    console.log(`  Right edge: ${afterPosX + afterChar.size[0]}`)

    const deltaX = afterPosX - posX
    console.log(`  Position change: ${deltaX} pixels`)

    if (deltaX < 0) {
      console.log('  ✅ MOVED LEFT - Correct direction (opposite to velocity)')
    } else if (deltaX > 0) {
      console.log('  ❌ MOVED RIGHT - Wrong! Should move opposite to velocity')
    } else {
      console.log('  ⚠️  NO MOVEMENT')
    }

    gameWrapper.free()
  } catch (error) {
    console.error('Error:', error)
  }
}

loadWasm()
