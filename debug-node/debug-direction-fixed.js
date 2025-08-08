import fs from 'fs'
import path from 'path'

// Test direction system according to documentation
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
    // Action 0: RUN according to documentation
    {
      energy_cost: 0,
      cooldown: 0,
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      spawns: [0, 0, 0, 0],
      script: [
        // Read current direction (should be +1.0 for right)
        15,
        0,
        0x40, // READ_PROP fixed[0] = ENTITY_DIR_HORIZONTAL

        // Read move speed (should be 2.0)
        15,
        1,
        0x1f, // READ_PROP fixed[1] = CHARACTER_MOVE_SPEED

        // Multiply direction * speed (should be +1.0 * 2.0 = +2.0)
        32,
        2,
        0,
        1, // MUL fixed[2] = fixed[0] * fixed[1]

        // Write to velocity
        16,
        0x14,
        2, // WRITE_PROP CHARACTER_VEL_X = fixed[2]

        0,
        1, // EXIT with success
      ],
    },
    // Action 1: JUMP according to documentation
    {
      energy_cost: 10,
      cooldown: 0,
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
    // Action 2: TURN_AROUND according to documentation
    {
      energy_cost: 0,
      cooldown: 0,
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      spawns: [0, 0, 0, 0],
      script: [
        15,
        0,
        0x40, // READ_PROP fixed[0] = ENTITY_DIR_HORIZONTAL
        34,
        0, // NEGATE fixed[0] (flip direction)
        16,
        0x40,
        0, // WRITE_PROP ENTITY_DIR_HORIZONTAL = fixed[0]
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
    // Condition 2: IS_WALL_LEANING
    {
      energy_mul: 32,
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      script: [
        15,
        0,
        0x27, // READ_PROP vars[0] = CHARACTER_COLLISION_RIGHT
        15,
        1,
        0x29, // READ_PROP vars[1] = CHARACTER_COLLISION_LEFT
        61,
        2,
        0,
        1, // OR vars[2] = vars[0] OR vars[1]
        91,
        2, // EXIT_WITH_VAR vars[2]
      ],
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
      jump_force: [160, 32], // 5.0 in fixed-point
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
        [0, 0], // Always -> RUN
      ],
    },
  ],
  spawns: [],
  status_effects: [],
}

async function testMovementFixed() {
  try {
    const wasmModule = await import('../wasm-wrapper/pkg/wasm_wrapper.js')
    const { default: init, GameWrapper } = wasmModule

    const wasmPath = path.join(
      process.cwd(),
      '../wasm-wrapper/pkg/wasm_wrapper_bg.wasm'
    )
    const wasmBuffer = fs.readFileSync(wasmPath)
    await init(wasmBuffer)

    console.log('=== Testing Movement Actions (Fixed) ===')

    // Test 1: RUN action
    console.log('\n1. Testing RUN action:')
    const runWrapper = new GameWrapper(JSON.stringify(testConfig))
    runWrapper.new_game()

    for (let frame = 0; frame < 5; frame++) {
      const state = JSON.parse(runWrapper.get_characters_json())
      const char = state[0]
      const posX = char.position[0][0] / char.position[0][1]
      const velX = char.velocity[0][0] / char.velocity[0][1]
      console.log(
        `Frame ${frame}: pos=${posX.toFixed(1)}, vel=${velX.toFixed(1)}, dir=${
          char.dir[0]
        }`
      )

      if (velX > 0) {
        console.log('✅ RUN action working - character moving right')
        break
      }

      runWrapper.step_frame()
    }

    // Test 2: JUMP action
    console.log('\n2. Testing JUMP action:')
    const jumpConfig = { ...testConfig }
    jumpConfig.characters[0].behaviors = [[1, 1]] // IS_GROUNDED -> JUMP
    const jumpWrapper = new GameWrapper(JSON.stringify(jumpConfig))
    jumpWrapper.new_game()

    let jumpDetected = false
    for (let frame = 0; frame < 10; frame++) {
      const state = JSON.parse(jumpWrapper.get_characters_json())
      const char = state[0]
      const posY = char.position[1][0] / char.position[1][1]
      const velY = char.velocity[1][0] / char.velocity[1][1]
      console.log(
        `Frame ${frame}: posY=${posY.toFixed(1)}, velY=${velY.toFixed(
          1
        )}, energy=${char.energy}`
      )

      if (velY < -1 && !jumpDetected) {
        console.log('✅ JUMP action working - upward velocity applied')
        jumpDetected = true
      }
      if (velY > 0 && jumpDetected) {
        console.log('✅ Gravity working - velocity becoming downward')
        break
      }

      jumpWrapper.step_frame()
    }

    // Test 3: TURN_AROUND action
    console.log('\n3. Testing TURN_AROUND action:')
    const turnConfig = { ...testConfig }
    turnConfig.characters[0].behaviors = [[0, 2]] // Always -> TURN_AROUND
    const turnWrapper = new GameWrapper(JSON.stringify(turnConfig))
    turnWrapper.new_game()

    const before = JSON.parse(turnWrapper.get_characters_json())
    console.log(`Before turn: dir=${before[0].dir[0]}`)

    turnWrapper.step_frame()

    const after = JSON.parse(turnWrapper.get_characters_json())
    console.log(`After turn: dir=${after[0].dir[0]}`)

    if (before[0].dir[0] !== after[0].dir[0]) {
      console.log('✅ TURN_AROUND action working - direction changed')
    } else {
      console.log('❌ TURN_AROUND action not working')
    }

    runWrapper.free()
    jumpWrapper.free()
    turnWrapper.free()
  } catch (error) {
    console.error('Error:', error)
  }
}

testMovementFixed()
