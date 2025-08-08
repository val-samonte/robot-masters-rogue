import fs from 'fs'
import path from 'path'

// Force character right at wall boundary to test collision detection
const testConfig = {
  seed: 12345,
  gravity: [32, 64],
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
      script: [15, 0, 0x40, 34, 0, 16, 0x40, 0, 0, 1], // TURN_AROUND
    },
  ],
  conditions: [
    {
      energy_mul: 32,
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      script: [15, 0, 0x27, 15, 1, 0x29, 61, 2, 0, 1, 91, 2], // IS_WALL_LEANING
    },
  ],
  characters: [
    {
      id: 1,
      position: [
        [224, 1],
        [192, 1],
      ], // Right at the wall boundary (x=224, wall starts at x=240)
      group: 1,
      size: [16, 32], // Character is 16 pixels wide
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
      dir: [2, 0], // Facing right
      enmity: 0,
      target_id: null,
      target_type: 0,
      behaviors: [
        [0, 0], // IS_WALL_LEANING → TURN_AROUND
      ],
    },
  ],
  spawns: [],
  status_effects: [],
}

async function testForceWallCollision() {
  try {
    const wasmModule = await import('../wasm-wrapper/pkg/wasm_wrapper.js')
    const { default: init, GameWrapper } = wasmModule

    const wasmPath = path.join(
      process.cwd(),
      '../wasm-wrapper/pkg/wasm_wrapper_bg.wasm'
    )
    const wasmBuffer = fs.readFileSync(wasmPath)
    await init(wasmBuffer)

    console.log('=== Testing Forced Wall Collision ===')
    console.log('Character placed at x=224, size=16, so right edge at x=240')
    console.log('Wall tile at x=240 (15*16=240)')
    console.log('This should trigger right wall collision')
    console.log()

    const gameWrapper = new GameWrapper(JSON.stringify(testConfig))
    gameWrapper.new_game()

    for (let frame = 0; frame < 10; frame++) {
      const state = JSON.parse(gameWrapper.get_characters_json())
      const char = state[0]
      const posX = char.position[0][0] / char.position[0][1]
      const velX = char.velocity[0][0] / char.velocity[0][1]
      const dirValue = char.dir[0]
      const collision = char.collision

      console.log(
        `Frame ${frame}: pos=${posX.toFixed(1)}, vel=${velX.toFixed(
          1
        )}, dir=${dirValue}, collision=[${collision.join(', ')}]`
      )

      if (collision[1]) {
        // Right wall collision
        console.log(
          `  ✅ RIGHT wall collision detected! TURN_AROUND should execute`
        )
        console.log(
          `  → Direction should change from ${dirValue} to ${
            dirValue === 2 ? 0 : 2
          }`
        )
      } else if (collision[3]) {
        // Left wall collision
        console.log(
          `  ✅ LEFT wall collision detected! TURN_AROUND should execute`
        )
        console.log(
          `  → Direction should change from ${dirValue} to ${
            dirValue === 0 ? 2 : 0
          }`
        )
      } else {
        console.log(`  ❌ No wall collision detected`)
      }

      gameWrapper.step_frame()
    }

    console.log()
    console.log('--- Testing left wall collision ---')

    // Test left wall collision
    const leftConfig = JSON.parse(JSON.stringify(testConfig))
    leftConfig.characters[0].position = [
      [16, 1],
      [192, 1],
    ] // At left wall
    leftConfig.characters[0].dir = [0, 0] // Facing left

    const gameWrapper2 = new GameWrapper(JSON.stringify(leftConfig))
    gameWrapper2.new_game()

    for (let frame = 0; frame < 5; frame++) {
      const state = JSON.parse(gameWrapper2.get_characters_json())
      const char = state[0]
      const posX = char.position[0][0] / char.position[0][1]
      const dirValue = char.dir[0]
      const collision = char.collision

      console.log(
        `Frame ${frame}: pos=${posX.toFixed(
          1
        )}, dir=${dirValue}, collision=[${collision.join(', ')}]`
      )

      if (collision[3]) {
        // Left wall collision
        console.log(`  ✅ LEFT wall collision detected!`)
      }

      gameWrapper2.step_frame()
    }

    gameWrapper.free()
    gameWrapper2.free()
  } catch (error) {
    console.error('Error:', error)
  }
}

testForceWallCollision()
