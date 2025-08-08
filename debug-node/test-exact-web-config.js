import fs from 'fs'
import path from 'path'

// EXACT copy of web viewer configuration
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
  CHARACTER_ARMOR_PUNCT: 0x2a,
  CHARACTER_ARMOR_BLAST: 0x2b,
  CHARACTER_ARMOR_FORCE: 0x2c,
  CHARACTER_ARMOR_SEVER: 0x2d,
  CHARACTER_ARMOR_HEAT: 0x2e,
  CHARACTER_ARMOR_CRYO: 0x2f,
  CHARACTER_ARMOR_JOLT: 0x30,
  CHARACTER_ARMOR_ACID: 0x31,
  CHARACTER_ARMOR_VIRUS: 0x32,
  ENTITY_DIR_HORIZONTAL: 0x40,
  ENTITY_DIR_VERTICAL: 0x41,
  ENTITY_ENMITY: 0x42,
  ENTITY_TARGET_ID: 0x43,
  ENTITY_TARGET_TYPE: 0x44,
  ACTION_DEF_ENERGY_COST: 0x80,
  ACTION_DEF_COOLDOWN: 0x81,
  ACTION_DEF_ARG0: 0x82,
  ACTION_DEF_ARG1: 0x83,
  ACTION_DEF_ARG2: 0x84,
  ACTION_DEF_ARG3: 0x85,
  ACTION_DEF_ARG4: 0x86,
  ACTION_DEF_ARG5: 0x87,
  ACTION_DEF_ARG6: 0x88,
  ACTION_DEF_ARG7: 0x89,
}

// EXACT scripts from web viewer
const ACTION_SCRIPTS = {
  TURN_AROUND: [
    OperatorAddress.READ_PROP,
    0,
    PropertyAddress.ENTITY_DIR_HORIZONTAL, // Read current direction into fixed[0] (as Fixed)
    OperatorAddress.NEGATE,
    0, // Negate fixed[0] (flip direction)
    OperatorAddress.WRITE_PROP,
    PropertyAddress.ENTITY_DIR_HORIZONTAL,
    0, // Write fixed[0] back to direction
    OperatorAddress.EXIT,
    1, // Exit with success
  ],

  RUN: [
    // Read current horizontal direction
    OperatorAddress.READ_PROP,
    0,
    PropertyAddress.ENTITY_DIR_HORIZONTAL, // Read direction into fixed[0] (-1.0, 0.0, +1.0)
    // Read move speed
    OperatorAddress.READ_PROP,
    1,
    PropertyAddress.CHARACTER_MOVE_SPEED, // Read move speed into fixed[1]
    // Multiply direction * move speed
    OperatorAddress.MUL,
    2,
    0,
    1, // fixed[2] = fixed[0] * fixed[1] (direction * speed)
    // Write result to velocity
    OperatorAddress.WRITE_PROP,
    PropertyAddress.CHARACTER_VEL_X,
    2, // Write fixed[2] to velocity
    OperatorAddress.EXIT,
    1, // Exit with success
  ],

  JUMP: [
    OperatorAddress.EXIT_IF_NO_ENERGY,
    10, // Exit if not enough energy for jump
    // Read jump force
    OperatorAddress.READ_PROP,
    0,
    PropertyAddress.CHARACTER_JUMP_FORCE, // Read jump force into fixed[0]
    // Apply negative jump force (upward velocity)
    OperatorAddress.NEGATE,
    0, // Negate jump force for upward movement
    // Write to vertical velocity
    OperatorAddress.WRITE_PROP,
    PropertyAddress.CHARACTER_VEL_Y,
    0, // Write negated jump force to velocity
    // Apply energy cost
    OperatorAddress.APPLY_ENERGY_COST,
    OperatorAddress.EXIT,
    1, // Exit with success
  ],

  WALL_JUMP: [
    OperatorAddress.EXIT_IF_NO_ENERGY,
    15, // Exit if not enough energy
    // Check if touching right wall
    OperatorAddress.READ_PROP,
    0,
    PropertyAddress.CHARACTER_COLLISION_RIGHT,
    // Check if touching left wall
    OperatorAddress.READ_PROP,
    1,
    PropertyAddress.CHARACTER_COLLISION_LEFT,
    // Must be touching at least one wall
    OperatorAddress.OR,
    2,
    0,
    1, // vars[2] = touching any wall
    // Exit if not touching wall
    OperatorAddress.NOT,
    3,
    2, // vars[3] = NOT touching wall
    // Skip if not touching wall (jump to exit)
    OperatorAddress.GOTO,
    3,
    20, // Jump to exit if not touching wall
    // Apply upward velocity (jump force)
    OperatorAddress.READ_PROP,
    4, // Use fixed[4] for jump force
    PropertyAddress.CHARACTER_JUMP_FORCE,
    OperatorAddress.NEGATE,
    4, // Negate for upward movement
    OperatorAddress.WRITE_PROP,
    PropertyAddress.CHARACTER_VEL_Y,
    4, // Apply upward velocity
    // Apply horizontal velocity away from wall
    OperatorAddress.READ_PROP,
    5,
    PropertyAddress.CHARACTER_MOVE_SPEED, // Get move speed
    // If touching right wall, go left (negative velocity)
    OperatorAddress.NOT_EQUAL,
    6,
    0,
    0, // vars[6] = (right_collision != 0)
    OperatorAddress.NEGATE,
    5, // Make speed negative for left movement
    // If touching left wall, keep positive velocity (right movement)
    // Apply the velocity
    OperatorAddress.WRITE_PROP,
    PropertyAddress.CHARACTER_VEL_X,
    5, // Apply horizontal velocity
    // Apply energy cost
    OperatorAddress.APPLY_ENERGY_COST,
    OperatorAddress.EXIT,
    1, // Exit with success
  ],
}

const CONDITION_SCRIPTS = {
  ALWAYS: [
    OperatorAddress.ASSIGN_BYTE,
    0,
    1, // Set var[0] = 1 (true)
    OperatorAddress.EXIT_WITH_VAR,
    0, // Exit with var[0] (true)
  ],

  IS_WALL_LEANING: [
    OperatorAddress.READ_PROP,
    0,
    PropertyAddress.CHARACTER_COLLISION_RIGHT, // Read right collision
    OperatorAddress.READ_PROP,
    1,
    PropertyAddress.CHARACTER_COLLISION_LEFT, // Read left collision
    OperatorAddress.OR,
    2,
    0,
    1, // vars[2] = right_collision OR left_collision
    OperatorAddress.EXIT_WITH_VAR,
    2, // Exit with result (true if touching any wall)
  ],
}

// EXACT tilemap from web viewer
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

// EXACT character from web viewer
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

// EXACT COMBINATION_1_CONFIG from web viewer
const COMBINATION_1_CONFIG = {
  seed: 12345,
  gravity: [32, 64], // 0.5 gravity for testing
  tilemap: BASIC_TILEMAP,
  actions: [
    // Action 0: TURN_AROUND (working)
    {
      energy_cost: 0,
      cooldown: 0, // No cooldown - allow immediate turn-around
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      spawns: [0, 0, 0, 0],
      script: [...ACTION_SCRIPTS.TURN_AROUND],
    },
    // Action 1: RUN (updated)
    {
      energy_cost: 0,
      cooldown: 0,
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      spawns: [0, 0, 0, 0],
      script: [...ACTION_SCRIPTS.RUN],
    },
    // Action 2: JUMP (updated)
    {
      energy_cost: 10,
      cooldown: 30, // 30 frame cooldown for jump
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      spawns: [0, 0, 0, 0],
      script: [...ACTION_SCRIPTS.JUMP],
    },
    // Action 3: WALL_JUMP (updated)
    {
      energy_cost: 15,
      cooldown: 60, // 60 frame cooldown for wall jump
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      spawns: [0, 0, 0, 0],
      script: [...ACTION_SCRIPTS.WALL_JUMP],
    },
  ],
  conditions: [
    // Condition 0: Wall leaning (for TURN_AROUND and WALL_JUMP)
    {
      energy_mul: 32,
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      script: [...CONDITION_SCRIPTS.IS_WALL_LEANING],
    },
    // Condition 1: Always (for RUN)
    {
      energy_mul: 32,
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      script: [...CONDITION_SCRIPTS.ALWAYS],
    },
    // Condition 2: Is grounded (for JUMP)
    {
      energy_mul: 32,
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      script: [
        15,
        0,
        0x28, // READ_PROP vars[0] = CHARACTER_COLLISION_BOTTOM
        91,
        0, // EXIT_WITH_VAR vars[0]
      ],
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

async function testExactWebConfig() {
  try {
    const wasmModule = await import('../wasm-wrapper/pkg/wasm_wrapper.js')
    const { default: init, GameWrapper } = wasmModule

    const wasmPath = path.join(
      process.cwd(),
      '../wasm-wrapper/pkg/wasm_wrapper_bg.wasm'
    )
    const wasmBuffer = fs.readFileSync(wasmPath)
    await init(wasmBuffer)

    console.log('=== Testing EXACT Web Viewer Configuration ===')
    console.log('This should match exactly what the web viewer shows')
    console.log()

    const gameWrapper = new GameWrapper(JSON.stringify(COMBINATION_1_CONFIG))
    gameWrapper.new_game()

    console.log('Initial state:')
    const initial = JSON.parse(gameWrapper.get_characters_json())
    const char = initial[0]
    const posX = char.position[0][0] / char.position[0][1]
    const posY = char.position[1][0] / char.position[1][1]
    const velX = char.velocity[0][0] / char.velocity[0][1]
    const velY = char.velocity[1][0] / char.velocity[1][1]
    console.log(`Position: (${posX}, ${posY})`)
    console.log(`Velocity: (${velX}, ${velY})`)
    console.log(`Direction: (${char.dir[0]}, ${char.dir[1]})`)
    console.log(`Collision: [${char.collision.join(', ')}]`)
    console.log(`Energy: ${char.energy}`)
    console.log()

    console.log('Running simulation:')
    let movementDetected = false
    let wallHit = false
    let turnDetected = false

    for (let frame = 0; frame < 300; frame++) {
      const state = JSON.parse(gameWrapper.get_characters_json())
      const char = state[0]
      const posX = char.position[0][0] / char.position[0][1]
      const velX = char.velocity[0][0] / char.velocity[0][1]

      // Log every 20 frames or when something interesting happens
      if (
        frame % 20 === 0 ||
        Math.abs(velX) > 0.1 ||
        char.collision.some((c) => c) ||
        char.dir[0] !== 2
      ) {
        console.log(
          `Frame ${frame}: pos=${posX.toFixed(1)}, vel=${velX.toFixed(
            1
          )}, dir=${char.dir[0]}, collision=[${char.collision.join(
            ', '
          )}], energy=${char.energy}`
        )
      }

      // Check for movement
      if (Math.abs(velX) > 0.1 && !movementDetected) {
        console.log('✅ RUN action working - character moving')
        movementDetected = true
      }

      // Check for wall collision
      if ((char.collision[1] || char.collision[3]) && !wallHit) {
        console.log('✅ Wall collision detected')
        wallHit = true
      }

      // Check for turn-around
      if (wallHit && char.dir[0] === 0 && !turnDetected) {
        console.log('✅ TURN_AROUND action working - direction changed')
        turnDetected = true
      }

      if (turnDetected && velX < -0.1) {
        console.log('✅ Character moving left after turn-around')
        console.log('🎉 Full behavior working correctly!')
        break
      }

      // Stop at wall if no movement for several frames
      if (posX >= 224 && Math.abs(velX) < 0.1) {
        console.log(`\n🚨 Character stopped at wall (pos=${posX.toFixed(1)})`)
        console.log(`   Collision flags: [${char.collision.join(', ')}]`)
        console.log(
          `   Expected wall collision but flags show: ${
            char.collision[1] ? 'RIGHT' : 'NO RIGHT'
          }, ${char.collision[3] ? 'LEFT' : 'NO LEFT'}`
        )

        if (!char.collision[1] && !char.collision[3]) {
          console.log(
            '   ❌ CONFIRMED: Wall collision flags not set - this is the bug!'
          )
          console.log(
            '   💡 IS_WALL_LEANING condition returns false, so TURN_AROUND never triggers'
          )
        }
        break
      }

      gameWrapper.step_frame()
    }

    if (!movementDetected) {
      console.log('❌ RUN action not working - character not moving')
    }

    gameWrapper.free()
  } catch (error) {
    console.error('Error:', error)
  }
}

testExactWebConfig()
