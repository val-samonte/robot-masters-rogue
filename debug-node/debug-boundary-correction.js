import fs from 'fs'
import path from 'path'

// Test boundary correction specifically
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
      size: [16, 16], // 16x16 character
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

    console.log('=== BOUNDARY CORRECTION TEST ===')
    console.log('Testing position correction with 16x16 character')
    console.log('Character at x=230, right edge at x=246')
    console.log('Wall at x=240, so character overlaps by 6 pixels')
    console.log('Expected: character should be pushed to x=224')
    console.log('')

    const gameWrapper = new GameWrapper(JSON.stringify(gameConfig))
    gameWrapper.new_game()

    // Test multiple frames to see what happens
    for (let frame = 0; frame < 5; frame++) {
      const chars = JSON.parse(gameWrapper.get_characters_json())
      const char = chars[0]
      const posX = char.position[0][0] / char.position[0][1]
      const posY = char.position[1][0] / char.position[1][1]
      const velX = char.velocity[0][0] / char.velocity[0][1]
      const velY = char.velocity[1][0] / char.velocity[1][1]
      const rightEdge = posX + char.size[0]

      console.log(`Frame ${frame}:`)
      console.log(`  Position: (${posX}, ${posY})`)
      console.log(`  Velocity: (${velX}, ${velY})`)
      console.log(`  Right edge: ${rightEdge}`)
      console.log(`  Within boundaries: ${rightEdge <= 240 ? '✅' : '❌'}`)

      if (rightEdge > 240) {
        console.log(
          `  ❌ Character extends ${rightEdge - 240} pixels outside boundary`
        )
      }

      console.log('')

      if (frame < 4) {
        gameWrapper.step_frame()
      }
    }

    gameWrapper.free()
  } catch (error) {
    console.error('Error:', error)
  }
}

loadWasm()
