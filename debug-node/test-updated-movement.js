import fs from 'fs'
import path from 'path'

// Test updated movement actions with the web viewer configuration
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
    // Action 0: TURN_AROUND (working)
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
    // Action 1: RUN (updated)
    {
      energy_cost: 0,
      cooldown: 0,
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      spawns: [0, 0, 0, 0],
      script: [
        15,
        0,
        0x40, // READ_PROP fixed[0] = ENTITY_DIR_HORIZONTAL
        15,
        1,
        0x1f, // READ_PROP fixed[1] = CHARACTER_MOVE_SPEED
        32,
        2,
        0,
        1, // MUL fixed[2] = fixed[0] * fixed[1]
        16,
        0x14,
        2, // WRITE_PROP CHARACTER_VEL_X = fixed[2]
        0,
        1, // EXIT with success
      ],
    },
    // Action 2: JUMP (updated)
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
    // Action 3: WALL_JUMP (simplified)
    {
      energy_cost: 15,
      cooldown: 0,
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      spawns: [0, 0, 0, 0],
      script: [
        1,
        15, // EXIT_IF_NO_ENERGY 15
        // Check wall collision
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
        60,
        3,
        2, // NOT vars[3] = NOT vars[2]
        11,
        3,
        20, // GOTO if not touching wall, jump to exit
        // Apply upward velocity
        15,
        4,
        0x1e, // READ_PROP fixed[4] = CHARACTER_JUMP_FORCE
        34,
        4, // NEGATE fixed[4] (upward)
        16,
        0x15,
        4, // WRITE_PROP CHARACTER_VEL_Y = fixed[4]
        // Apply horizontal velocity away from wall
        21,
        5,
        32,
        32, // ASSIGN_FIXED fixed[5] = 1.0 (right direction)
        51,
        6,
        0,
        0, // NOT_EQUAL vars[6] = (right_collision != 0)
        // If right collision, go left
        21,
        7,
        -32,
        32, // ASSIGN_FIXED fixed[7] = -1.0 (left direction)
        32,
        8,
        7,
        6, // MUL fixed[8] = left_dir * right_collision_flag
        // If left collision, go right
        51,
        9,
        1,
        0, // NOT_EQUAL vars[9] = (left_collision != 0)
        32,
        10,
        5,
        9, // MUL fixed[10] = right_dir * left_collision_flag
        // Combine directions
        30,
        11,
        8,
        10, // ADD fixed[11] = final direction
        15,
        12,
        0x1f, // READ_PROP fixed[12] = CHARACTER_MOVE_SPEED
        32,
        13,
        11,
        12, // MUL fixed[13] = direction * speed
        16,
        0x14,
        13, // WRITE_PROP CHARACTER_VEL_X = fixed[13]
        82, // APPLY_ENERGY_COST
        0,
        1, // EXIT with success
      ],
    },
  ],
  conditions: [
    // Condition 0: IS_WALL_LEANING
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
    // Condition 1: ALWAYS
    {
      energy_mul: 32,
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      script: [20, 0, 1, 91, 0],
    },
    // Condition 2: IS_GROUNDED
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
        [192, 32],
      ], // Start at (1, 12) in pixels
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
        [0, 0], // IS_WALL_LEANING -> TURN_AROUND
        [1, 1], // ALWAYS -> RUN
      ],
    },
  ],
  spawns: [],
  status_effects: [],
}

async function testUpdatedMovement() {
  try {
    const wasmModule = await import('../wasm-wrapper/pkg/wasm_wrapper.js')
    const { default: init, GameWrapper } = wasmModule

    const wasmPath = path.join(
      process.cwd(),
      '../wasm-wrapper/pkg/wasm_wrapper_bg.wasm'
    )
    const wasmBuffer = fs.readFileSync(wasmPath)
    await init(wasmBuffer)

    console.log('=== Testing Updated Movement Actions ===')

    // Test 1: Basic movement and turn-around
    console.log('\n1. Testing RUN and TURN_AROUND:')
    const gameWrapper = new GameWrapper(JSON.stringify(testConfig))
    gameWrapper.new_game()

    let wallHit = false
    let turnedAround = false
    for (let frame = 0; frame < 50; frame++) {
      const state = JSON.parse(gameWrapper.get_characters_json())
      const char = state[0]
      const posX = char.position[0][0] / char.position[0][1]
      const velX = char.velocity[0][0] / char.velocity[0][1]

      if (
        frame % 10 === 0 ||
        Math.abs(velX) > 0.1 ||
        char.collision.some((c) => c)
      ) {
        console.log(
          `Frame ${frame}: pos=${posX.toFixed(1)}, vel=${velX.toFixed(
            1
          )}, dir=${char.dir[0]}, collision=[${char.collision.join(', ')}]`
        )
      }

      // Check for movement
      if (Math.abs(velX) > 0.1 && !wallHit) {
        console.log('✅ RUN action working - character moving')
      }

      // Check for wall collision
      if ((char.collision[1] || char.collision[3]) && !wallHit) {
        console.log('✅ Wall collision detected')
        wallHit = true
      }

      // Check for turn-around
      if (wallHit && char.dir[0] === 0 && !turnedAround) {
        console.log('✅ TURN_AROUND action working - direction changed to left')
        turnedAround = true
      }

      if (turnedAround && velX < -0.1) {
        console.log('✅ Character moving left after turn-around')
        break
      }

      gameWrapper.step_frame()
    }

    // Test 2: Jump action
    console.log('\n2. Testing JUMP action:')
    const jumpConfig = { ...testConfig }
    jumpConfig.characters[0].behaviors = [[2, 2]] // IS_GROUNDED -> JUMP
    const jumpWrapper = new GameWrapper(JSON.stringify(jumpConfig))
    jumpWrapper.new_game()

    let jumpDetected = false
    let gravityDetected = false
    for (let frame = 0; frame < 20; frame++) {
      const state = JSON.parse(jumpWrapper.get_characters_json())
      const char = state[0]
      const posY = char.position[1][0] / char.position[1][1]
      const velY = char.velocity[1][0] / char.velocity[1][1]
      console.log(
        `Frame ${frame}: posY=${posY.toFixed(1)}, velY=${velY.toFixed(
          1
        )}, energy=${char.energy}, grounded=${char.collision[2]}`
      )

      if (velY < -1 && !jumpDetected) {
        console.log('✅ JUMP action working - upward velocity applied')
        jumpDetected = true
      }

      if (velY > 0 && jumpDetected && !gravityDetected) {
        console.log('✅ Gravity working - velocity becoming downward')
        gravityDetected = true
        break
      }

      jumpWrapper.step_frame()
    }

    // Test 3: Wall jump
    console.log('\n3. Testing WALL_JUMP action:')
    const wallJumpConfig = { ...testConfig }
    wallJumpConfig.characters[0].position = [
      [208, 32],
      [192, 32],
    ] // Near right wall
    wallJumpConfig.characters[0].behaviors = [[0, 3]] // IS_WALL_LEANING -> WALL_JUMP
    const wallJumpWrapper = new GameWrapper(JSON.stringify(wallJumpConfig))
    wallJumpWrapper.new_game()

    for (let frame = 0; frame < 15; frame++) {
      const state = JSON.parse(wallJumpWrapper.get_characters_json())
      const char = state[0]
      const posX = char.position[0][0] / char.position[0][1]
      const posY = char.position[1][0] / char.position[1][1]
      const velX = char.velocity[0][0] / char.velocity[0][1]
      const velY = char.velocity[1][0] / char.velocity[1][1]
      console.log(
        `Frame ${frame}: pos=(${posX.toFixed(1)}, ${posY.toFixed(
          1
        )}), vel=(${velX.toFixed(1)}, ${velY.toFixed(
          1
        )}), collision=[${char.collision.join(', ')}], energy=${char.energy}`
      )

      if (Math.abs(velX) > 0.5 && velY < -1) {
        console.log('✅ WALL_JUMP action working - jumping away from wall')
        break
      }

      wallJumpWrapper.step_frame()
    }

    gameWrapper.free()
    jumpWrapper.free()
    wallJumpWrapper.free()

    console.log('\n=== Movement Actions Test Complete ===')
  } catch (error) {
    console.error('Error:', error)
  }
}

testUpdatedMovement()
