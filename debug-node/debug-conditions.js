import fs from 'fs'
import path from 'path'

// Test conditions to see if they're working
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
    // Action 0: Simple velocity set (bypass property reading)
    {
      energy_cost: 0,
      cooldown: 0,
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      spawns: [0, 0, 0, 0],
      script: [
        21,
        0,
        64,
        32, // ASSIGN_FIXED fixed[0] = 2.0
        16,
        0x14,
        0, // WRITE_PROP CHARACTER_VEL_X = fixed[0]
        0,
        1, // EXIT with success
      ],
    },
    // Action 1: Simple jump (bypass property reading)
    {
      energy_cost: 10,
      cooldown: 0,
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      spawns: [0, 0, 0, 0],
      script: [
        1,
        10, // EXIT_IF_NO_ENERGY 10
        21,
        0,
        -160,
        32, // ASSIGN_FIXED fixed[0] = -5.0 (upward)
        16,
        0x15,
        0, // WRITE_PROP CHARACTER_VEL_Y = fixed[0]
        82, // APPLY_ENERGY_COST
        0,
        1, // EXIT with success
      ],
    },
  ],
  conditions: [
    // Condition 0: ALWAYS
    {
      energy_mul: 32,
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      script: [20, 0, 1, 91, 0],
    },
    // Condition 1: IS_GROUNDED (test collision reading)
    {
      energy_mul: 32,
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      script: [15, 0, 0x28, 91, 0], // READ_PROP vars[0] = CHARACTER_COLLISION_BOTTOM
    },
  ],
  characters: [
    {
      id: 1,
      position: [
        [32, 32],
        [208, 32],
      ], // On ground (y=208 is just above bottom wall at y=224)
      group: 1,
      size: [16, 32],
      health: 100,
      health_cap: 100,
      energy: 100,
      energy_cap: 100,
      power: 10,
      weight: 5,
      jump_force: [160, 32], // 5.0 in fixed-point
      move_speed: [64, 32], // 2.0 in fixed-point
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
        [0, 0], // Always -> simple velocity set
      ],
    },
  ],
  spawns: [],
  status_effects: [],
}

async function testConditions() {
  try {
    const wasmModule = await import('../wasm-wrapper/pkg/wasm_wrapper.js')
    const { default: init, GameWrapper } = wasmModule

    const wasmPath = path.join(
      process.cwd(),
      '../wasm-wrapper/pkg/wasm_wrapper_bg.wasm'
    )
    const wasmBuffer = fs.readFileSync(wasmPath)
    await init(wasmBuffer)

    console.log('=== Testing Conditions and Simple Actions ===')

    // Test 1: Simple velocity set (bypass property reading)
    console.log('\n1. Testing simple velocity set:')
    const runWrapper = new GameWrapper(JSON.stringify(testConfig))
    runWrapper.new_game()

    for (let frame = 0; frame < 5; frame++) {
      const state = JSON.parse(runWrapper.get_characters_json())
      const char = state[0]
      const posX = char.position[0][0] / char.position[0][1]
      const velX = char.velocity[0][0] / char.velocity[0][1]
      console.log(
        `Frame ${frame}: pos=${posX.toFixed(1)}, vel=${velX.toFixed(
          1
        )}, collision=[${char.collision.join(', ')}]`
      )

      if (velX > 0) {
        console.log('✅ Simple velocity set working')
        break
      }

      runWrapper.step_frame()
    }

    // Test 2: IS_GROUNDED condition
    console.log('\n2. Testing IS_GROUNDED condition:')
    const groundConfig = { ...testConfig }
    groundConfig.characters[0].behaviors = [[1, 1]] // IS_GROUNDED -> simple jump
    const groundWrapper = new GameWrapper(JSON.stringify(groundConfig))
    groundWrapper.new_game()

    const initial = JSON.parse(groundWrapper.get_characters_json())
    console.log(`Initial collision: [${initial[0].collision.join(', ')}]`)
    console.log(
      `Bottom collision: ${initial[0].collision[2]} (should be 1 if grounded)`
    )

    for (let frame = 0; frame < 5; frame++) {
      const state = JSON.parse(groundWrapper.get_characters_json())
      const char = state[0]
      const velY = char.velocity[1][0] / char.velocity[1][1]
      console.log(
        `Frame ${frame}: velY=${velY.toFixed(1)}, energy=${
          char.energy
        }, collision=[${char.collision.join(', ')}]`
      )

      if (velY < -1) {
        console.log('✅ IS_GROUNDED condition and simple jump working')
        break
      }

      groundWrapper.step_frame()
    }

    runWrapper.free()
    groundWrapper.free()
  } catch (error) {
    console.error('Error:', error)
  }
}

testConditions()
