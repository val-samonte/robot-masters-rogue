import fs from 'fs'
import path from 'path'

// Import the actual web viewer configuration
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

// Updated script constants
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
}

const testConfig = {
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
  ],
  characters: [
    {
      ...BASIC_CHARACTER,
      behaviors: [
        [0, 0], // Wall leaning -> TURN_AROUND
        [1, 1], // Always -> RUN
      ],
    },
  ],
  spawns: [],
  status_effects: [],
}

async function testWebViewerConfig() {
  try {
    const wasmModule = await import('../wasm-wrapper/pkg/wasm_wrapper.js')
    const { default: init, GameWrapper } = wasmModule

    const wasmPath = path.join(
      process.cwd(),
      '../wasm-wrapper/pkg/wasm_wrapper_bg.wasm'
    )
    const wasmBuffer = fs.readFileSync(wasmPath)
    await init(wasmBuffer)

    console.log('=== Testing Web Viewer Configuration ===')

    const gameWrapper = new GameWrapper(JSON.stringify(testConfig))
    gameWrapper.new_game()

    console.log('Testing movement and turn-around behavior:')
    let movementDetected = false
    let wallHit = false
    let turnDetected = false

    for (let frame = 0; frame < 100; frame++) {
      const state = JSON.parse(gameWrapper.get_characters_json())
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
          `Frame ${frame}: pos=${posX.toFixed(1)}, vel=${velX.toFixed(
            1
          )}, dir=${char.dir[0]}, collision=[${char.collision.join(', ')}]`
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
        console.log('🎉 All movement actions working correctly!')
        break
      }

      gameWrapper.step_frame()
    }

    if (!movementDetected) {
      console.log('❌ RUN action not working - no movement detected')
    }

    gameWrapper.free()
  } catch (error) {
    console.error('Error:', error)
  }
}

testWebViewerConfig()
