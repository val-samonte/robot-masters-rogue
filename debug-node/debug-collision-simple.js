import fs from 'fs'
import path from 'path'

// Simple test to debug collision detection
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
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
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
      size: [16, 32],
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

    console.log('=== COLLISION DEBUG TEST ===')
    console.log('Character starts at x=230, should hit wall at x=240')
    console.log('Tilemap: walls at x=0 and x=240 (column 15 * 16 = 240)')

    const gameWrapper = new GameWrapper(JSON.stringify(gameConfig))
    gameWrapper.new_game()

    // Set a small rightward velocity manually
    for (let frame = 0; frame < 20; frame++) {
      const before = JSON.parse(gameWrapper.get_characters_json())

      // Manually set velocity to move right
      const char = before[0]
      const posX = char.position[0][0] / char.position[0][1]
      const posY = char.position[1][0] / char.position[1][1]

      const velX = char.velocity[0][0] / char.velocity[0][1]
      const velY = char.velocity[1][0] / char.velocity[1][1]

      console.log(`\nFrame ${frame}:`)
      console.log(`  Position: (${posX.toFixed(1)}, ${posY.toFixed(1)})`)
      console.log(`  Velocity: (${velX.toFixed(1)}, ${velY.toFixed(1)})`)
      console.log(
        `  Character bounds: x=${posX.toFixed(1)} to x=${(posX + 16).toFixed(
          1
        )}`
      )
      console.log(
        `  Wall at x=240, character right edge at x=${(posX + 16).toFixed(1)}`
      )
      console.log(`  Collision flags: [${char.collision.join(', ')}]`)

      if (posX + 16 >= 240) {
        console.log(`  ⚠️  CHARACTER SHOULD BE COLLIDING WITH RIGHT WALL!`)
        if (char.collision[1]) {
          console.log(`  ✅ Right collision detected correctly`)
        } else {
          console.log(`  ❌ Right collision NOT detected - BUG!`)
        }
      }

      gameWrapper.step_frame()
    }
  } catch (error) {
    console.error('Error:', error)
  }
}

loadWasm()
