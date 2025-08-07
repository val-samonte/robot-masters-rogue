import fs from 'fs'
import path from 'path'

// Script constants (copied from web-viewer)
const OperatorAddress = {
  EXIT: 0,
  EXIT_IF_NO_ENERGY: 1,
  EXIT_IF_COOLDOWN: 2,
  EXIT_IF_NOT_GROUNDED: 3,
  SKIP: 10,
  GOTO: 11,
  READ_PROP: 15,
  WRITE_PROP: 16,
  ASSIGN_BYTE: 20,
  ASSIGN_FIXED: 21,
  ASSIGN_RANDOM: 22,
  TO_BYTE: 23,
  TO_FIXED: 24,
  ADD: 30,
  SUB: 31,
  MUL: 32,
  DIV: 33,
  NEGATE: 34,
  ADD_BYTE: 40,
  SUB_BYTE: 41,
  MUL_BYTE: 42,
  DIV_BYTE: 43,
  MOD_BYTE: 44,
  WRAPPING_ADD: 45,
  EQUAL: 50,
  NOT_EQUAL: 51,
  LESS_THAN: 52,
  LESS_THAN_OR_EQUAL: 53,
  NOT: 60,
  OR: 61,
  AND: 62,
  MIN: 70,
  MAX: 71,
  LOCK_ACTION: 80,
  UNLOCK_ACTION: 81,
  APPLY_ENERGY_COST: 82,
  APPLY_DURATION: 83,
  SPAWN: 84,
  SPAWN_WITH_VARS: 85,
  LOG_VARIABLE: 90,
  EXIT_WITH_VAR: 91,
  READ_ARG: 96,
  READ_SPAWN: 97,
  WRITE_SPAWN: 98,
  READ_ACTION_COOLDOWN: 100,
  READ_ACTION_LAST_USED: 101,
  WRITE_ACTION_LAST_USED: 102,
  IS_ACTION_ON_COOLDOWN: 103,
  READ_CHARACTER_PROPERTY: 104,
  WRITE_CHARACTER_PROPERTY: 105,
  READ_SPAWN_PROPERTY: 106,
  WRITE_SPAWN_PROPERTY: 107,
}

const PropertyAddress = {
  GAME_SEED: 0x01,
  GAME_FRAME: 0x02,
  GAME_GRAVITY: 0x03,
  CHARACTER_ID: 0x10,
  CHARACTER_GROUP: 0x11,
  CHARACTER_POS_X: 0x12,
  CHARACTER_POS_Y: 0x13,
  CHARACTER_VEL_X: 0x14,
  CHARACTER_VEL_Y: 0x15,
  CHARACTER_SIZE_W: 0x16,
  CHARACTER_SIZE_H: 0x17,
  CHARACTER_HEALTH: 0x18,
  CHARACTER_HEALTH_CAP: 0x19,
  CHARACTER_ENERGY: 0x1a,
  CHARACTER_ENERGY_CAP: 0x1b,
  CHARACTER_POWER: 0x1c,
  CHARACTER_WEIGHT: 0x1d,
  CHARACTER_JUMP_FORCE: 0x1e,
  CHARACTER_MOVE_SPEED: 0x1f,
  CHARACTER_ENERGY_REGEN: 0x20,
  CHARACTER_ENERGY_REGEN_RATE: 0x21,
  CHARACTER_ENERGY_CHARGE: 0x22,
  CHARACTER_ENERGY_CHARGE_RATE: 0x23,
  CHARACTER_LOCKED_ACTION_ID: 0x24,
  CHARACTER_STATUS_EFFECT_COUNT: 0x25,
  CHARACTER_COLLISION_TOP: 0x26,
  CHARACTER_COLLISION_RIGHT: 0x27,
  CHARACTER_COLLISION_BOTTOM: 0x28,
  CHARACTER_COLLISION_LEFT: 0x29,
  ENTITY_DIR_HORIZONTAL: 0x40,
  ENTITY_DIR_VERTICAL: 0x41,
  ENTITY_ENMITY: 0x42,
  ENTITY_TARGET_ID: 0x43,
  ENTITY_TARGET_TYPE: 0x44,
}

// Script definitions
const ACTION_SCRIPTS = {
  TURN_AROUND: [
    OperatorAddress.READ_PROP,
    0,
    PropertyAddress.ENTITY_DIR_HORIZONTAL,
    OperatorAddress.NEGATE,
    0,
    OperatorAddress.WRITE_PROP,
    PropertyAddress.ENTITY_DIR_HORIZONTAL,
    0,
    OperatorAddress.EXIT,
    1,
  ],
  RUN: [
    OperatorAddress.READ_PROP,
    0,
    PropertyAddress.ENTITY_DIR_HORIZONTAL,
    OperatorAddress.READ_PROP,
    1,
    PropertyAddress.CHARACTER_MOVE_SPEED,
    OperatorAddress.MUL,
    2,
    0,
    1,
    OperatorAddress.WRITE_PROP,
    PropertyAddress.CHARACTER_VEL_X,
    2,
    OperatorAddress.EXIT,
    1,
  ],
  JUMP: [
    OperatorAddress.EXIT_IF_NO_ENERGY,
    10,
    OperatorAddress.READ_PROP,
    0,
    PropertyAddress.CHARACTER_JUMP_FORCE,
    OperatorAddress.NEGATE,
    0,
    OperatorAddress.WRITE_PROP,
    PropertyAddress.CHARACTER_VEL_Y,
    0,
    OperatorAddress.APPLY_ENERGY_COST,
    OperatorAddress.EXIT,
    1,
  ],
}

const CONDITION_SCRIPTS = {
  ALWAYS: [OperatorAddress.ASSIGN_BYTE, 0, 1, OperatorAddress.EXIT_WITH_VAR, 0],
  IS_WALL_LEANING: [
    // Check if touching wall AND moving towards it
    OperatorAddress.READ_PROP,
    0,
    PropertyAddress.CHARACTER_COLLISION_RIGHT, // vars[0] = right collision
    OperatorAddress.READ_PROP,
    1,
    PropertyAddress.CHARACTER_COLLISION_LEFT, // vars[1] = left collision
    OperatorAddress.READ_PROP,
    0, // Reuse vars[0] for velocity
    PropertyAddress.CHARACTER_VEL_X, // fixed[0] = velocity

    // Check if moving right into right wall
    OperatorAddress.ASSIGN_FIXED,
    1,
    0,
    1, // fixed[1] = 0.0 (threshold)
    OperatorAddress.LESS_THAN_OR_EQUAL,
    2,
    1,
    0, // vars[2] = (0.0 <= velocity) ? 1 : 0 (moving right or stopped)
    OperatorAddress.AND,
    3,
    0,
    2, // vars[3] = right_collision AND moving_right

    // Check if moving left into left wall
    OperatorAddress.ASSIGN_FIXED,
    2,
    0,
    1, // fixed[2] = 0.0 (threshold)
    OperatorAddress.LESS_THAN,
    4,
    0,
    2, // vars[4] = (velocity < 0.0) ? 1 : 0 (moving left)
    OperatorAddress.AND,
    5,
    1,
    4, // vars[5] = left_collision AND moving_left

    // Return true if either condition is met
    OperatorAddress.OR,
    6,
    3,
    5, // vars[6] = (right_wall_hit OR left_wall_hit)
    OperatorAddress.EXIT_WITH_VAR,
    6,
  ],
}

// Game configuration
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
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  ],
  actions: [
    {
      energy_cost: 0,
      cooldown: 0, // Remove cooldown for testing
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      spawns: [0, 0, 0, 0],
      script: ACTION_SCRIPTS.TURN_AROUND,
    },
    {
      energy_cost: 0,
      cooldown: 0,
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      spawns: [0, 0, 0, 0],
      script: ACTION_SCRIPTS.RUN,
    },
  ],
  conditions: [
    {
      energy_mul: 32,
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      script: CONDITION_SCRIPTS.IS_WALL_LEANING,
    },
    {
      energy_mul: 32,
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      script: CONDITION_SCRIPTS.ALWAYS,
    },
  ],
  characters: [
    {
      id: 1,
      position: [
        [32, 1],
        [192, 1],
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
      dir: [2, 0],
      enmity: 0,
      target_id: null,
      target_type: 0,
      behaviors: [
        [0, 0], // Wall leaning -> TURN_AROUND
        [1, 1], // Always -> RUN
      ], // Test: character should turn around AND then run
    },
  ],
  spawns: [],
  status_effects: [],
}

async function loadWasm() {
  try {
    // Load the JS wrapper
    const wasmModule = await import('../wasm-wrapper/pkg/wasm_wrapper.js')
    const { default: init, GameWrapper } = wasmModule

    // Initialize WASM with explicit path
    const wasmPath = path.join(
      process.cwd(),
      '../wasm-wrapper/pkg/wasm_wrapper_bg.wasm'
    )
    const wasmBuffer = fs.readFileSync(wasmPath)
    await init(wasmBuffer)

    console.log('WASM loaded successfully')

    // Create game wrapper with config
    console.log('Initializing game with config...')
    console.log('Character behaviors:', gameConfig.characters[0].behaviors)
    console.log('Character dir:', gameConfig.characters[0].dir)

    const gameWrapper = new GameWrapper(JSON.stringify(gameConfig))

    // Initialize the game
    gameWrapper.new_game()

    console.log('Game initialized successfully')

    // Debug: character turns around but doesn't move
    for (let frame = 0; frame < 100; frame++) {
      // Process frame
      gameWrapper.step_frame()

      // Get state after frame
      const stateAfter = JSON.parse(gameWrapper.get_characters_json())

      // Only log every 10 frames to reduce output, unless there's a collision change
      if (
        frame % 10 === 0 ||
        stateAfter[0].collision[1] ||
        stateAfter[0].collision[3]
      ) {
        console.log(`\n=== FRAME ${frame} ===`)
        console.log(
          'Position:',
          `${stateAfter[0].position[0][0]}/32 = ${
            stateAfter[0].position[0][0] / 32
          } pixels`
        )
        console.log(
          'Velocity:',
          `${stateAfter[0].velocity[0][0]}/32 = ${
            stateAfter[0].velocity[0][0] / 32
          }`
        )
        console.log('Direction:', stateAfter[0].dir)
        console.log('Collision:', stateAfter[0].collision)
      }

      // Check if character hit wall
      if (stateAfter[0].collision[1] || stateAfter[0].collision[3]) {
        console.log('CHARACTER HIT WALL!')
        console.log('Right collision:', stateAfter[0].collision[1])
        console.log('Left collision:', stateAfter[0].collision[3])

        // Let's run more frames to see if TURN_AROUND executes AND character moves in opposite direction
        console.log(
          '\n=== RUNNING 20 MORE FRAMES TO TEST TURN_AROUND AND MOVEMENT ==='
        )
        for (let extraFrame = 0; extraFrame < 20; extraFrame++) {
          console.log(`\nExtra Frame ${extraFrame}:`)
          const beforeExtra = JSON.parse(gameWrapper.get_characters_json())
          gameWrapper.step_frame()
          const afterExtra = JSON.parse(gameWrapper.get_characters_json())

          console.log('Before:', {
            dir: beforeExtra[0].dir,
            position: `${beforeExtra[0].position[0][0]}/32 = ${
              beforeExtra[0].position[0][0] / 32
            } pixels`,
            velocity: `${beforeExtra[0].velocity[0][0]}/32 = ${
              beforeExtra[0].velocity[0][0] / 32
            }`,
            collision: beforeExtra[0].collision,
          })
          console.log('After:', {
            dir: afterExtra[0].dir,
            position: `${afterExtra[0].position[0][0]}/32 = ${
              afterExtra[0].position[0][0] / 32
            } pixels`,
            velocity: `${afterExtra[0].velocity[0][0]}/32 = ${
              afterExtra[0].velocity[0][0] / 32
            }`,
            collision: afterExtra[0].collision,
          })

          // Check if direction changed (TURN_AROUND executed)
          if (beforeExtra[0].dir[0] !== afterExtra[0].dir[0]) {
            console.log('🎉 DIRECTION CHANGED! TURN_AROUND WORKED!')
          }

          // Check if character is moving in opposite direction
          const velX =
            afterExtra[0].velocity[0][0] / afterExtra[0].velocity[0][1]
          if (velX < 0) {
            console.log('✅ CHARACTER IS NOW MOVING LEFT!')
          } else if (velX > 0) {
            console.log('❌ CHARACTER IS STILL MOVING RIGHT!')
          } else {
            console.log('⚠️ CHARACTER IS NOT MOVING HORIZONTALLY')
          }
        }
        break // Stop after testing
      }
    }
  } catch (error) {
    console.error('Error:', error)
  }
}

loadWasm()
