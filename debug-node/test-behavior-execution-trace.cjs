/**
 * Test behavior execution trace - Task 23 debugging
 *
 * Create a minimal test to trace behavior execution step by step
 */

const { GameWrapper } = require('../wasm-wrapper/pkg/wasm_wrapper.js')

// Helper function to extract character state from Fixed-point JSON
function extractCharacterState(char) {
  return {
    id: char.id,
    pos: {
      x: char.position[0][0] / char.position[0][1],
      y: char.position[1][0] / char.position[1][1],
    },
    vel: {
      x: char.velocity[0][0] / char.velocity[0][1],
      y: char.velocity[1][0] / char.velocity[1][1],
    },
    dir: char.dir,
    collision: char.collision,
    energy: char.energy,
    health: char.health,
  }
}

// BEHAVIOR TRACE CONFIG - test each behavior individually first
const BEHAVIOR_TRACE_CONFIGS = {
  // Test 1: Only ONLY_ONCE behavior
  ONLY_ONCE_ONLY: {
    seed: 12345,
    gravity: [32, 64],
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
      // Action 0: INVERT_GRAVITY
      {
        energy_cost: 0,
        cooldown: 0,
        args: [0, 0, 0, 0, 0, 0, 0, 0],
        spawns: [0, 0, 0, 0],
        script: [
          20,
          0,
          2, // ASSIGN_BYTE vars[0] = 2
          16,
          0x41,
          0, // WRITE_PROP ENTITY_DIR_VERTICAL = vars[0]
          0,
          1, // EXIT 1
        ],
      },
    ],
    conditions: [
      // Condition 0: ONLY_ONCE
      {
        energy_mul: 32,
        args: [0, 0, 0, 0, 0, 0, 0, 0],
        script: [
          20,
          1,
          1, // ASSIGN_BYTE vars[1] = 1
          50,
          2,
          0,
          1, // EQUAL vars[2] = (vars[0] == 1)
          60,
          3,
          2, // NOT vars[3] = !vars[2]
          20,
          0,
          1, // ASSIGN_BYTE vars[0] = 1 (mark as used)
          91,
          3, // EXIT_WITH_VAR vars[3]
        ],
      },
    ],
    characters: [
      {
        id: 1,
        position: [
          [128, 1],
          [128, 1],
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
          [0, 0], // ONLY_ONCE -> INVERT_GRAVITY (single behavior)
        ],
      },
    ],
    spawns: [],
    status_effects: [],
  },

  // Test 2: ONLY_ONCE + ALWAYS behaviors
  ONLY_ONCE_PLUS_ALWAYS: {
    seed: 12345,
    gravity: [32, 64],
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
      // Action 0: INVERT_GRAVITY
      {
        energy_cost: 0,
        cooldown: 0,
        args: [0, 0, 0, 0, 0, 0, 0, 0],
        spawns: [0, 0, 0, 0],
        script: [
          20,
          0,
          2, // ASSIGN_BYTE vars[0] = 2
          16,
          0x41,
          0, // WRITE_PROP ENTITY_DIR_VERTICAL = vars[0]
          0,
          1, // EXIT 1
        ],
      },
      // Action 1: RUN
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
          1, // EXIT 1
        ],
      },
    ],
    conditions: [
      // Condition 0: ONLY_ONCE
      {
        energy_mul: 32,
        args: [0, 0, 0, 0, 0, 0, 0, 0],
        script: [
          20,
          1,
          1, // ASSIGN_BYTE vars[1] = 1
          50,
          2,
          0,
          1, // EQUAL vars[2] = (vars[0] == 1)
          60,
          3,
          2, // NOT vars[3] = !vars[2]
          20,
          0,
          1, // ASSIGN_BYTE vars[0] = 1 (mark as used)
          91,
          3, // EXIT_WITH_VAR vars[3]
        ],
      },
      // Condition 1: ALWAYS
      {
        energy_mul: 32,
        args: [0, 0, 0, 0, 0, 0, 0, 0],
        script: [
          20,
          0,
          1, // ASSIGN_BYTE vars[0] = 1
          91,
          0, // EXIT_WITH_VAR vars[0]
        ],
      },
    ],
    characters: [
      {
        id: 1,
        position: [
          [128, 1],
          [128, 1],
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
          [0, 0], // ONLY_ONCE -> INVERT_GRAVITY (highest priority)
          [1, 1], // ALWAYS -> RUN (lowest priority)
        ],
      },
    ],
    spawns: [],
    status_effects: [],
  },
}

console.log('=== BEHAVIOR EXECUTION TRACE TEST ===')
console.log('Testing behavior execution step by step')
console.log()

// Test each configuration
for (const [configName, config] of Object.entries(BEHAVIOR_TRACE_CONFIGS)) {
  console.log(`--- Testing ${configName} ---`)

  try {
    const gameWrapper = new GameWrapper(JSON.stringify(config))
    gameWrapper.new_game()

    console.log('Initial state:')
    const initialState = JSON.parse(gameWrapper.get_characters_json())
    const initialChar = extractCharacterState(initialState[0])

    console.log(
      `  Position: (${initialChar.pos.x.toFixed(
        1
      )}, ${initialChar.pos.y.toFixed(1)})`
    )
    console.log(
      `  Velocity: (${initialChar.vel.x.toFixed(
        1
      )}, ${initialChar.vel.y.toFixed(1)})`
    )
    console.log(`  Direction: [${initialChar.dir[0]}, ${initialChar.dir[1]}]`)
    console.log(`  Behaviors: ${JSON.stringify(initialState[0].behaviors)}`)
    console.log()

    // Test first 10 frames
    for (let frame = 1; frame <= 10; frame++) {
      const beforeState = JSON.parse(gameWrapper.get_characters_json())
      const beforeChar = extractCharacterState(beforeState[0])

      gameWrapper.step_frame()

      const afterState = JSON.parse(gameWrapper.get_characters_json())
      const afterChar = extractCharacterState(afterState[0])

      console.log(`Frame ${frame}:`)
      console.log(
        `  Before: pos=(${beforeChar.pos.x.toFixed(
          1
        )}, ${beforeChar.pos.y.toFixed(1)}), vel=(${beforeChar.vel.x.toFixed(
          1
        )}, ${beforeChar.vel.y.toFixed(1)}), dir=[${beforeChar.dir[0]}, ${
          beforeChar.dir[1]
        }]`
      )
      console.log(
        `  After:  pos=(${afterChar.pos.x.toFixed(
          1
        )}, ${afterChar.pos.y.toFixed(1)}), vel=(${afterChar.vel.x.toFixed(
          1
        )}, ${afterChar.vel.y.toFixed(1)}), dir=[${afterChar.dir[0]}, ${
          afterChar.dir[1]
        }]`
      )

      // Check for changes
      if (beforeChar.dir[1] !== afterChar.dir[1]) {
        console.log(
          `  *** GRAVITY INVERTED: ${beforeChar.dir[1]} -> ${afterChar.dir[1]} (ONLY_ONCE executed)`
        )
      }

      if (Math.abs(afterChar.vel.x) > 0) {
        console.log(
          `  *** HORIZONTAL VELOCITY SET: ${afterChar.vel.x.toFixed(
            1
          )} (RUN executed)`
        )
      }

      if (
        frame >= 2 &&
        Math.abs(afterChar.vel.x) === 0 &&
        configName === 'ONLY_ONCE_PLUS_ALWAYS'
      ) {
        console.log(
          `  ❌ RUN action NOT executed (should have horizontal velocity)`
        )
      }

      console.log()
    }

    console.log(`${configName} test completed`)
    console.log()
  } catch (error) {
    console.error(`Error testing ${configName}:`, error.message)
    console.log()
  }
}

console.log('=== ANALYSIS ===')
console.log('Compare the two tests:')
console.log(
  '1. ONLY_ONCE_ONLY: Should invert gravity on frame 1, then do nothing'
)
console.log(
  '2. ONLY_ONCE_PLUS_ALWAYS: Should invert gravity on frame 1, then run horizontally from frame 2+'
)
console.log()
console.log(
  'If ONLY_ONCE_PLUS_ALWAYS does not show horizontal movement from frame 2+,'
)
console.log(
  'then there is a bug in the behavior execution system when multiple behaviors are present.'
)
