import fs from 'fs'
import path from 'path'

// Test to debug direction system
const testConfig = {
  seed: 12345,
  gravity: [32, 32],
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
    // Action 0: Test direction reading and velocity setting
    {
      energy_cost: 0,
      cooldown: 0,
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      spawns: [0, 0, 0, 0],
      script: [
        // Read direction
        15,
        0,
        0x40, // READ_PROP fixed[0] = ENTITY_DIR_HORIZONTAL
        90,
        0, // LOG_VARIABLE fixed[0] (direction)

        // Read move speed
        15,
        1,
        0x1f, // READ_PROP fixed[1] = CHARACTER_MOVE_SPEED
        90,
        1, // LOG_VARIABLE fixed[1] (move speed)

        // Multiply
        32,
        2,
        0,
        1, // MUL fixed[2] = fixed[0] * fixed[1]
        90,
        2, // LOG_VARIABLE fixed[2] (result)

        // Set velocity directly to test
        21,
        3,
        64,
        32, // ASSIGN_FIXED fixed[3] = 2.0 (direct velocity)
        16,
        0x14,
        3, // WRITE_PROP CHARACTER_VEL_X = fixed[3]

        0,
        1, // EXIT with success
      ],
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
        [32, 32],
        [192, 32],
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
      move_speed: [64, 32], // 2.0 in fixed-point
      armor: [0, 0, 0, 0, 0, 0, 0, 0, 0],
      energy_regen: 1,
      energy_regen_rate: 60,
      energy_charge: 5,
      energy_charge_rate: 30,
      dir: [2, 0], // Facing right (should be +1.0 in script)
      enmity: 0,
      target_id: null,
      target_type: 0,
      behaviors: [
        [0, 0], // Always -> test action
      ],
    },
  ],
  spawns: [],
  status_effects: [],
}

async function testDirection() {
  try {
    const wasmModule = await import('../wasm-wrapper/pkg/wasm_wrapper.js')
    const { default: init, GameWrapper } = wasmModule

    const wasmPath = path.join(
      process.cwd(),
      '../wasm-wrapper/pkg/wasm_wrapper_bg.wasm'
    )
    const wasmBuffer = fs.readFileSync(wasmPath)
    await init(wasmBuffer)

    console.log('=== Testing Direction System ===')
    const gameWrapper = new GameWrapper(JSON.stringify(testConfig))
    gameWrapper.new_game()

    console.log('Initial state:')
    const initial = JSON.parse(gameWrapper.get_characters_json())
    const char = initial[0]
    console.log(`Direction: ${char.dir[0]} (should be 2 for right)`)
    console.log(
      `Move speed: ${char.move_speed[0]}/${char.move_speed[1]} = ${
        char.move_speed[0] / char.move_speed[1]
      }`
    )

    console.log('\nAfter step:')
    gameWrapper.step_frame()
    const after = JSON.parse(gameWrapper.get_characters_json())
    const char2 = after[0]
    const velX = char2.velocity[0][0] / char2.velocity[0][1]
    console.log(
      `Velocity: ${char2.velocity[0][0]}/${char2.velocity[0][1]} = ${velX}`
    )
    console.log(
      `Position: ${char2.position[0][0]}/${char2.position[0][1]} = ${
        char2.position[0][0] / char2.position[0][1]
      }`
    )

    if (velX > 0) {
      console.log('✅ Velocity set correctly')
    } else {
      console.log('❌ Velocity not set - direction system issue')
    }

    gameWrapper.free()
  } catch (error) {
    console.error('Error:', error)
  }
}

testDirection()
