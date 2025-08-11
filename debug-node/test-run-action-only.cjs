/**
 * Test RUN action in isolation - Task 23 debugging
 *
 * Simple test with only ALWAYS -> RUN behavior to see if RUN action works
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

// SIMPLE RUN TEST CONFIG - only ALWAYS -> RUN behavior
const RUN_TEST_CONFIG = {
  seed: 12345,
  gravity: [32, 64], // 0.5 gravity
  tilemap: [
    // Basic tilemap with walls around edges
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
    // Action 0: RUN (only action)
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
    // Condition 0: ALWAYS (only condition)
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
        [192, 1],
      ], // Start at (8, 12) in pixels - middle of room
      group: 1,
      size: [16, 32],
      health: 100,
      health_cap: 100,
      energy: 100,
      energy_cap: 100,
      power: 10,
      weight: 5,
      jump_force: [160, 32], // 5.0 fixed-point
      move_speed: [64, 32], // 2.0 fixed-point
      armor: [0, 0, 0, 0, 0, 0, 0, 0, 0],
      energy_regen: 1,
      energy_regen_rate: 60,
      energy_charge: 5,
      energy_charge_rate: 30,
      dir: [2, 0], // Facing right, normal downward gravity
      enmity: 0,
      target_id: null,
      target_type: 0,
      behaviors: [
        [0, 0], // ALWAYS -> RUN (only behavior)
      ],
    },
  ],
  spawns: [],
  status_effects: [],
}

console.log('=== RUN ACTION ISOLATION TEST ===')
console.log('Testing ALWAYS -> RUN behavior in isolation')
console.log()

try {
  // Create game wrapper
  const gameWrapper = new GameWrapper(JSON.stringify(RUN_TEST_CONFIG))
  gameWrapper.new_game()

  console.log('Initial state:')
  const initialState = JSON.parse(gameWrapper.get_characters_json())
  const initialChar = extractCharacterState(initialState[0])

  console.log(
    `  Position: (${initialChar.pos.x.toFixed(1)}, ${initialChar.pos.y.toFixed(
      1
    )})`
  )
  console.log(
    `  Velocity: (${initialChar.vel.x.toFixed(1)}, ${initialChar.vel.y.toFixed(
      1
    )})`
  )
  console.log(`  Direction: [${initialChar.dir[0]}, ${initialChar.dir[1]}]`)
  console.log(`  Move Speed: 2.0 (from config)`)
  console.log(
    `  Expected: RUN should set velocity to direction * move_speed = 2 * 2.0 = 2.0`
  )
  console.log()

  // Test first 20 frames
  console.log('=== FRAME-BY-FRAME ANALYSIS ===')

  for (let frame = 1; frame <= 20; frame++) {
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
      `  After:  pos=(${afterChar.pos.x.toFixed(1)}, ${afterChar.pos.y.toFixed(
        1
      )}), vel=(${afterChar.vel.x.toFixed(1)}, ${afterChar.vel.y.toFixed(
        1
      )}), dir=[${afterChar.dir[0]}, ${afterChar.dir[1]}]`
    )

    // Check for horizontal movement
    if (Math.abs(afterChar.vel.x) > 0) {
      console.log(
        `  ✅ RUN action working: horizontal velocity = ${afterChar.vel.x.toFixed(
          1
        )}`
      )
    } else {
      console.log(`  ❌ RUN action NOT working: horizontal velocity = 0`)
    }

    // Check for position change
    if (Math.abs(afterChar.pos.x - beforeChar.pos.x) > 0) {
      console.log(
        `  → Character moved horizontally: ${beforeChar.pos.x.toFixed(
          1
        )} -> ${afterChar.pos.x.toFixed(1)}`
      )
    }

    console.log()
  }

  console.log('=== TEST SUMMARY ===')

  const finalState = JSON.parse(gameWrapper.get_characters_json())
  const finalChar = extractCharacterState(finalState[0])

  console.log(`Final state after 20 frames:`)
  console.log(
    `  Position: (${finalChar.pos.x.toFixed(1)}, ${finalChar.pos.y.toFixed(1)})`
  )
  console.log(
    `  Velocity: (${finalChar.vel.x.toFixed(1)}, ${finalChar.vel.y.toFixed(1)})`
  )
  console.log(`  Direction: [${finalChar.dir[0]}, ${finalChar.dir[1]}]`)

  // Validation
  if (Math.abs(finalChar.vel.x) > 0) {
    console.log(
      `✅ PASS: RUN action is working (velocity = ${finalChar.vel.x.toFixed(
        1
      )})`
    )
  } else {
    console.log(`❌ FAIL: RUN action is NOT working (velocity = 0)`)
  }

  if (finalChar.pos.x !== 128) {
    console.log(
      `✅ PASS: Character moved horizontally (${128} -> ${finalChar.pos.x.toFixed(
        1
      )})`
    )
  } else {
    console.log(`❌ FAIL: Character did not move horizontally`)
  }
} catch (error) {
  console.error('Error during test:', error)
  console.error('Stack trace:', error.stack)
}
