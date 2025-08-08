import fs from 'fs'
import path from 'path'

// Test JUMP action specifically
const testConfig = {
  seed: 12345,
  gravity: [32, 64], // 0.5 gravity for testing
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
    // Action 0: JUMP
    {
      energy_cost: 10,
      cooldown: 30,
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      spawns: [0, 0, 0, 0],
      script: [
        1,
        10, // EXIT_IF_NO_ENERGY 10
        15,
        0,
        0x1e, // READ_PROP fixed[0] = CHARACTER_JUMP_FORCE
        34,
        0, // NEGATE fixed[0] (upward velocity)
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
    // Condition 0: IS_GROUNDED
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
        [32, 1],
        [208, 1],
      ], // On ground
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
      dir: [2, 0],
      enmity: 0,
      target_id: null,
      target_type: 0,
      behaviors: [
        [0, 0], // IS_GROUNDED -> JUMP
      ],
    },
  ],
  spawns: [],
  status_effects: [],
}

async function testJumpAction() {
  try {
    const wasmModule = await import('../wasm-wrapper/pkg/wasm_wrapper.js')
    const { default: init, GameWrapper } = wasmModule

    const wasmPath = path.join(
      process.cwd(),
      '../wasm-wrapper/pkg/wasm_wrapper_bg.wasm'
    )
    const wasmBuffer = fs.readFileSync(wasmPath)
    await init(wasmBuffer)

    console.log('=== Testing JUMP Action ===')

    const gameWrapper = new GameWrapper(JSON.stringify(testConfig))
    gameWrapper.new_game()

    let jumpDetected = false
    let gravityDetected = false
    let landingDetected = false

    for (let frame = 0; frame < 50; frame++) {
      const state = JSON.parse(gameWrapper.get_characters_json())
      const char = state[0]
      const posY = char.position[1][0] / char.position[1][1]
      const velY = char.velocity[1][0] / char.velocity[1][1]

      console.log(
        `Frame ${frame}: posY=${posY.toFixed(1)}, velY=${velY.toFixed(
          1
        )}, energy=${char.energy}, grounded=${char.collision[2]}`
      )

      // Check for jump (upward velocity)
      if (velY < -1 && !jumpDetected) {
        console.log('✅ JUMP action working - upward velocity applied')
        jumpDetected = true
      }

      // Check for gravity effect (velocity becoming downward)
      if (velY > 0 && jumpDetected && !gravityDetected) {
        console.log('✅ Gravity working - velocity becoming downward')
        gravityDetected = true
      }

      // Check for landing (back on ground)
      if (gravityDetected && char.collision[2] && !landingDetected) {
        console.log('✅ Landing detected - character back on ground')
        landingDetected = true
        break
      }

      gameWrapper.step_frame()
    }

    if (jumpDetected && gravityDetected && landingDetected) {
      console.log('🎉 JUMP action working perfectly with gravity system!')
    } else if (jumpDetected && gravityDetected) {
      console.log(
        '✅ JUMP action and gravity working (may need more frames for landing)'
      )
    } else if (jumpDetected) {
      console.log('⚠️ JUMP action working but gravity may have issues')
    } else {
      console.log('❌ JUMP action not working')
    }

    gameWrapper.free()
  } catch (error) {
    console.error('Error:', error)
  }
}

testJumpAction()
