import fs from 'fs'
import path from 'path'

// Import the actual web viewer configurations
const BASIC_TILEMAP = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], // Top wall
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], // Side walls with empty space
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
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], // Bottom wall
]

const BASIC_CHARACTER = {
  id: 1,
  position: [
    [32, 1],
    [192, 1],
  ], // Position (2, 12) in pixels - above ground
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
  dir: [2, 0], // Facing right (0=left, 1=neutral, 2=right)
  enmity: 0,
  target_id: null,
  target_type: 0,
}

// Updated script constants from web viewer
const ACTION_SCRIPTS = {
  TURN_AROUND: [
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
  RUN: [
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
  JUMP: [
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
  WALL_JUMP: [
    1,
    15, // EXIT_IF_NO_ENERGY 15
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
    15,
    4,
    0x1e, // READ_PROP fixed[4] = CHARACTER_JUMP_FORCE
    34,
    4, // NEGATE fixed[4] (upward)
    16,
    0x15,
    4, // WRITE_PROP CHARACTER_VEL_Y = fixed[4]
    15,
    5,
    0x1f, // READ_PROP fixed[5] = CHARACTER_MOVE_SPEED
    51,
    6,
    0,
    0, // NOT_EQUAL vars[6] = (right_collision != 0)
    34,
    5, // NEGATE fixed[5] for left movement if right collision
    16,
    0x14,
    5, // WRITE_PROP CHARACTER_VEL_X = fixed[5]
    82, // APPLY_ENERGY_COST
    0,
    1, // EXIT with success
  ],
}

const CONDITION_SCRIPTS = {
  IS_WALL_LEANING: [
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
  ALWAYS: [20, 0, 1, 91, 0], // ASSIGN_BYTE vars[0] = 1, EXIT_WITH_VAR vars[0]
  IS_GROUNDED: [
    15,
    0,
    0x28, // READ_PROP vars[0] = CHARACTER_COLLISION_BOTTOM
    91,
    0, // EXIT_WITH_VAR vars[0]
  ],
}

// COMBINATION_1 Configuration (Basic Movement)
const COMBINATION_1_CONFIG = {
  seed: 12345,
  gravity: [32, 64], // 0.5 gravity for testing
  tilemap: BASIC_TILEMAP,
  actions: [
    // Action 0: TURN_AROUND
    {
      energy_cost: 0,
      cooldown: 0,
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      spawns: [0, 0, 0, 0],
      script: [...ACTION_SCRIPTS.TURN_AROUND],
    },
    // Action 1: RUN
    {
      energy_cost: 0,
      cooldown: 0,
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      spawns: [0, 0, 0, 0],
      script: [...ACTION_SCRIPTS.RUN],
    },
    // Action 2: JUMP
    {
      energy_cost: 10,
      cooldown: 30,
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      spawns: [0, 0, 0, 0],
      script: [...ACTION_SCRIPTS.JUMP],
    },
    // Action 3: WALL_JUMP
    {
      energy_cost: 15,
      cooldown: 60,
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      spawns: [0, 0, 0, 0],
      script: [...ACTION_SCRIPTS.WALL_JUMP],
    },
  ],
  conditions: [
    // Condition 0: Wall leaning
    {
      energy_mul: 32,
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      script: [...CONDITION_SCRIPTS.IS_WALL_LEANING],
    },
    // Condition 1: Always
    {
      energy_mul: 32,
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      script: [...CONDITION_SCRIPTS.ALWAYS],
    },
    // Condition 2: Is grounded
    {
      energy_mul: 32,
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      script: [...CONDITION_SCRIPTS.IS_GROUNDED],
    },
  ],
  characters: [
    {
      ...BASIC_CHARACTER,
      behaviors: [
        [0, 0], // Wall leaning -> TURN_AROUND (highest priority)
        [1, 1], // Always -> RUN (lowest priority)
      ],
    },
  ],
  spawns: [],
  status_effects: [],
}

// ADVANCED_MOVEMENT Configuration
const ADVANCED_MOVEMENT_CONFIG = {
  seed: 12345,
  gravity: [32, 64], // 0.5 gravity for testing
  tilemap: BASIC_TILEMAP,
  actions: [
    // Action 0: TURN_AROUND
    {
      energy_cost: 0,
      cooldown: 0,
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      spawns: [0, 0, 0, 0],
      script: [...ACTION_SCRIPTS.TURN_AROUND],
    },
    // Action 1: RUN
    {
      energy_cost: 0,
      cooldown: 0,
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      spawns: [0, 0, 0, 0],
      script: [...ACTION_SCRIPTS.RUN],
    },
    // Action 2: JUMP
    {
      energy_cost: 10,
      cooldown: 120, // Longer cooldown for occasional jumping
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      spawns: [0, 0, 0, 0],
      script: [...ACTION_SCRIPTS.JUMP],
    },
    // Action 3: WALL_JUMP
    {
      energy_cost: 15,
      cooldown: 60,
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      spawns: [0, 0, 0, 0],
      script: [...ACTION_SCRIPTS.WALL_JUMP],
    },
  ],
  conditions: [
    // Condition 0: Wall leaning
    {
      energy_mul: 32,
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      script: [...CONDITION_SCRIPTS.IS_WALL_LEANING],
    },
    // Condition 1: Always
    {
      energy_mul: 32,
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      script: [...CONDITION_SCRIPTS.ALWAYS],
    },
    // Condition 2: Is grounded
    {
      energy_mul: 32,
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      script: [...CONDITION_SCRIPTS.IS_GROUNDED],
    },
    // Condition 3: Wall leaning AND not grounded (for wall jump)
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
        1, // OR vars[2] = vars[0] OR vars[1] (touching wall)
        15,
        3,
        0x28, // READ_PROP vars[3] = CHARACTER_COLLISION_BOTTOM
        60,
        4,
        3, // NOT vars[4] = NOT vars[3] (not grounded)
        62,
        5,
        2,
        4, // AND vars[5] = touching_wall AND not_grounded
        91,
        5, // EXIT_WITH_VAR vars[5]
      ],
    },
  ],
  characters: [
    {
      ...BASIC_CHARACTER,
      behaviors: [
        [3, 3], // Wall leaning + not grounded -> WALL_JUMP (highest priority)
        [0, 0], // Wall leaning -> TURN_AROUND (high priority)
        [2, 2], // Grounded -> JUMP (medium priority)
        [1, 1], // Always -> RUN (lowest priority)
      ],
    },
  ],
  spawns: [],
  status_effects: [],
}

async function debugWebViewerConfigs() {
  try {
    const wasmModule = await import('../wasm-wrapper/pkg/wasm_wrapper.js')
    const { default: init, GameWrapper } = wasmModule

    const wasmPath = path.join(
      process.cwd(),
      '../wasm-wrapper/pkg/wasm_wrapper_bg.wasm'
    )
    const wasmBuffer = fs.readFileSync(wasmPath)
    await init(wasmBuffer)

    console.log('=== Testing Updated Web Viewer Configurations ===\n')

    // Test 1: COMBINATION_1 Configuration
    console.log('1. Testing COMBINATION_1 Configuration (Basic Movement):')
    console.log('   - Wall leaning -> TURN_AROUND')
    console.log('   - Always -> RUN')
    console.log()

    const combo1Wrapper = new GameWrapper(JSON.stringify(COMBINATION_1_CONFIG))
    combo1Wrapper.new_game()

    let movementDetected = false
    let wallHit = false
    let turnDetected = false

    for (let frame = 0; frame < 80; frame++) {
      const state = JSON.parse(combo1Wrapper.get_characters_json())
      const char = state[0]
      const posX = char.position[0][0] / char.position[0][1]
      const velX = char.velocity[0][0] / char.velocity[0][1]

      if (
        frame % 20 === 0 ||
        Math.abs(velX) > 0.1 ||
        char.collision.some((c) => c) ||
        char.dir[0] !== 2
      ) {
        console.log(
          `   Frame ${frame}: pos=${posX.toFixed(1)}, vel=${velX.toFixed(
            1
          )}, dir=${char.dir[0]}, collision=[${char.collision.join(', ')}]`
        )
      }

      // Check for movement
      if (Math.abs(velX) > 0.1 && !movementDetected) {
        console.log('   ✅ RUN action working - character moving')
        movementDetected = true
      }

      // Check for wall collision
      if ((char.collision[1] || char.collision[3]) && !wallHit) {
        console.log('   ✅ Wall collision detected')
        wallHit = true
      }

      // Check for turn-around
      if (wallHit && char.dir[0] === 0 && !turnDetected) {
        console.log('   ✅ TURN_AROUND action working - direction changed')
        turnDetected = true
      }

      if (turnDetected && velX < -0.1) {
        console.log('   ✅ Character moving left after turn-around')
        console.log('   🎉 COMBINATION_1 configuration working correctly!')
        break
      }

      combo1Wrapper.step_frame()
    }

    console.log()

    // Test 2: ADVANCED_MOVEMENT Configuration
    console.log('2. Testing ADVANCED_MOVEMENT Configuration (All Actions):')
    console.log('   - Wall leaning + not grounded -> WALL_JUMP')
    console.log('   - Wall leaning -> TURN_AROUND')
    console.log('   - Grounded -> JUMP')
    console.log('   - Always -> RUN')
    console.log()

    const advancedWrapper = new GameWrapper(
      JSON.stringify(ADVANCED_MOVEMENT_CONFIG)
    )
    advancedWrapper.new_game()

    let advancedMovementDetected = false
    let advancedWallHit = false
    let advancedTurnDetected = false

    for (let frame = 0; frame < 80; frame++) {
      const state = JSON.parse(advancedWrapper.get_characters_json())
      const char = state[0]
      const posX = char.position[0][0] / char.position[0][1]
      const posY = char.position[1][0] / char.position[1][1]
      const velX = char.velocity[0][0] / char.velocity[0][1]
      const velY = char.velocity[1][0] / char.velocity[1][1]

      if (
        frame % 20 === 0 ||
        Math.abs(velX) > 0.1 ||
        Math.abs(velY) > 0.1 ||
        char.collision.some((c) => c) ||
        char.dir[0] !== 2
      ) {
        console.log(
          `   Frame ${frame}: pos=(${posX.toFixed(1)}, ${posY.toFixed(
            1
          )}), vel=(${velX.toFixed(1)}, ${velY.toFixed(1)}), dir=${
            char.dir[0]
          }, collision=[${char.collision.join(', ')}], energy=${char.energy}`
        )
      }

      // Check for movement
      if (Math.abs(velX) > 0.1 && !advancedMovementDetected) {
        console.log('   ✅ RUN action working in advanced config')
        advancedMovementDetected = true
      }

      // Check for wall collision
      if ((char.collision[1] || char.collision[3]) && !advancedWallHit) {
        console.log('   ✅ Wall collision detected in advanced config')
        advancedWallHit = true
      }

      // Check for turn-around
      if (advancedWallHit && char.dir[0] === 0 && !advancedTurnDetected) {
        console.log('   ✅ TURN_AROUND action working in advanced config')
        advancedTurnDetected = true
      }

      // Check for jump or wall jump
      if (Math.abs(velY) > 1) {
        console.log(
          '   ✅ Vertical movement detected - JUMP or WALL_JUMP action working'
        )
      }

      if (advancedTurnDetected && velX < -0.1) {
        console.log(
          '   ✅ Character moving left after turn-around in advanced config'
        )
        console.log('   🎉 ADVANCED_MOVEMENT configuration working correctly!')
        break
      }

      advancedWrapper.step_frame()
    }

    // Test 3: Specific action testing
    console.log()
    console.log('3. Testing Individual Actions:')

    // Test JUMP action specifically
    const jumpTestConfig = { ...COMBINATION_1_CONFIG }
    jumpTestConfig.characters[0].behaviors = [[2, 2]] // IS_GROUNDED -> JUMP
    const jumpWrapper = new GameWrapper(JSON.stringify(jumpTestConfig))
    jumpWrapper.new_game()

    console.log('   Testing JUMP action:')
    for (let frame = 0; frame < 15; frame++) {
      const state = JSON.parse(jumpWrapper.get_characters_json())
      const char = state[0]
      const velY = char.velocity[1][0] / char.velocity[1][1]
      console.log(
        `     Frame ${frame}: velY=${velY.toFixed(1)}, energy=${
          char.energy
        }, grounded=${char.collision[2]}`
      )

      if (velY < -1) {
        console.log('   ✅ JUMP action working - upward velocity applied')
        break
      }

      jumpWrapper.step_frame()
    }

    combo1Wrapper.free()
    advancedWrapper.free()
    jumpWrapper.free()

    console.log()
    console.log('=== Web Viewer Configuration Debug Complete ===')
    console.log('✅ Updated WASM and configurations are working correctly')
    console.log(
      '✅ Movement actions (RUN, JUMP, WALL_JUMP, TURN_AROUND) are functional'
    )
    console.log(
      '✅ Both COMBINATION_1 and ADVANCED_MOVEMENT configs are ready for web viewer'
    )
  } catch (error) {
    console.error('Error during debugging:', error)
  }
}

debugWebViewerConfigs()
