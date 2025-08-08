import fs from 'fs'
import path from 'path'

// Test simple actions with correct Fixed-point values
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
    // Action 0: Simple velocity set
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
    // Action 1: Simple jump
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
        160,
        32, // ASSIGN_FIXED fixed[0] = 5.0
        34,
        0, // NEGATE fixed[0] to make it upward (-5.0)
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
    // Condition 1: IS_GROUNDED
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
      ], // On ground
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
      dir: [2, 0],
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

async function testSimpleActions() {
  try {
    const wasmModule = await import('../wasm-wrapper/pkg/wasm_wrapper.js')
    const { default: init, GameWrapper } = wasmModule

    const wasmPath = path.join(
      process.cwd(),
      '../wasm-wrapper/pkg/wasm_wrapper_bg.wasm'
    )
    const wasmBuffer = fs.readFileSync(wasmPath)
    await init(wasmBuffer)

    console.log('=== Testing Simple Actions ===')

    // Test 1: Simple velocity set
    console.log('\n1. Testing simple velocity set:')
    const runWrapper = new GameWrapper(JSON.stringify(testConfig))
    runWrapper.new_game()

    for (let frame = 0; frame < 5; frame++) {
      const state = JSON.parse(runWrapper.get_characters_json())
      const char = state[0]
      const posX = char.position[0][0] / char.position[0][1]
      const velX = char.velocity[0][0] / char.velocity[0][1]
      console.log(
        `Frame ${frame}: pos=${posX.toFixed(1)}, vel=${velX.toFixed(1)}`
      )

      if (velX > 0) {
        console.log('✅ Simple velocity set working')
        break
      }

      runWrapper.step_frame()
    }

    // Test 2: Simple jump
    console.log('\n2. Testing simple jump:')
    const jumpConfig = { ...testConfig }
    jumpConfig.characters[0].behaviors = [[1, 1]] // IS_GROUNDED -> simple jump
    const jumpWrapper = new GameWrapper(JSON.stringify(jumpConfig))
    jumpWrapper.new_game()

    for (let frame = 0; frame < 10; frame++) {
      const state = JSON.parse(jumpWrapper.get_characters_json())
      const char = state[0]
      const velY = char.velocity[1][0] / char.velocity[1][1]
      console.log(
        `Frame ${frame}: velY=${velY.toFixed(1)}, energy=${
          char.energy
        }, collision=[${char.collision.join(', ')}]`
      )

      if (velY < -1) {
        console.log('✅ Simple jump working')
        break
      }

      jumpWrapper.step_frame()
    }

    runWrapper.free()
    jumpWrapper.free()
  } catch (error) {
    console.error('Error:', error)
  }
}

testSimpleActions()
