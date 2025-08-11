/**
 * Test inverted gravity with character starting in middle of room - Task 23 debugging
 *
 * Test if horizontal movement works when character is not stuck at ceiling
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

// INVERTED_GRAVITY_CONFIG - character starts in MIDDLE of room
const INVERTED_GRAVITY_MIDDLE_CONFIG = {
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
    // Action 0: TURN_AROUND
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
        0, // NEGATE fixed[0]
        16,
        0x40,
        0, // WRITE_PROP ENTITY_DIR_HORIZONTAL = fixed[0]
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
    // Action 2: INVERT_GRAVITY
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
        1, // OR vars[2] = vars[0] | vars[1]
        91,
        2, // EXIT_WITH_VAR vars[2]
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
    // Condition 2: ONLY_ONCE
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
      ], // Start in MIDDLE of room (8, 8) - not at ceiling
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
        [2, 2], // ONLY_ONCE -> INVERT_GRAVITY (highest priority)
        [0, 0], // Wall leaning -> TURN_AROUND
        [1, 1], // Always -> RUN (lowest priority)
      ],
    },
  ],
  spawns: [],
  status_effects: [],
}

console.log('=== INVERTED GRAVITY TEST - MIDDLE START ===')
console.log(
  'Testing inverted gravity with character starting in middle of room'
)
console.log()

try {
  // Create game wrapper
  const gameWrapper = new GameWrapper(
    JSON.stringify(INVERTED_GRAVITY_MIDDLE_CONFIG)
  )
  gameWrapper.new_game()

  console.log('Initial state:')
  const initialState = JSON.parse(gameWrapper.get_characters_json())
  const initialChar = extractCharacterState(initialState[0])

  console.log(
    `  Position: (${initialChar.pos.x.toFixed(1)}, ${initialChar.pos.y.toFixed(
      1
    )}) - MIDDLE of room`
  )
  console.log(
    `  Velocity: (${initialChar.vel.x.toFixed(1)}, ${initialChar.vel.y.toFixed(
      1
    )})`
  )
  console.log(`  Direction: [${initialChar.dir[0]}, ${initialChar.dir[1]}]`)
  console.log(
    `  Collision: [${initialChar.collision.join(',')}] - should be all false`
  )
  console.log()

  // Test first 50 frames
  console.log('=== FRAME-BY-FRAME ANALYSIS ===')

  for (let frame = 1; frame <= 50; frame++) {
    const beforeState = JSON.parse(gameWrapper.get_characters_json())
    const beforeChar = extractCharacterState(beforeState[0])

    gameWrapper.step_frame()

    const afterState = JSON.parse(gameWrapper.get_characters_json())
    const afterChar = extractCharacterState(afterState[0])

    if (frame <= 10 || frame % 10 === 0) {
      // Log first 10 frames, then every 10th
      console.log(`Frame ${frame}:`)
      console.log(
        `  Before: pos=(${beforeChar.pos.x.toFixed(
          1
        )}, ${beforeChar.pos.y.toFixed(1)}), vel=(${beforeChar.vel.x.toFixed(
          1
        )}, ${beforeChar.vel.y.toFixed(1)}), dir=[${beforeChar.dir[0]}, ${
          beforeChar.dir[1]
        }], collision=[${beforeChar.collision.join(',')}]`
      )
      console.log(
        `  After:  pos=(${afterChar.pos.x.toFixed(
          1
        )}, ${afterChar.pos.y.toFixed(1)}), vel=(${afterChar.vel.x.toFixed(
          1
        )}, ${afterChar.vel.y.toFixed(1)}), dir=[${afterChar.dir[0]}, ${
          afterChar.dir[1]
        }], collision=[${afterChar.collision.join(',')}]`
      )

      // Check for gravity inversion
      if (beforeChar.dir[1] !== afterChar.dir[1]) {
        console.log(
          `  *** GRAVITY INVERTED: ${beforeChar.dir[1]} -> ${afterChar.dir[1]} ***`
        )
      }

      // Check for horizontal movement
      if (Math.abs(afterChar.vel.x) > 0) {
        console.log(
          `  ✅ Horizontal movement: velocity = ${afterChar.vel.x.toFixed(1)}`
        )
      } else {
        console.log(`  ❌ NO horizontal movement (should be running)`)
      }

      // Check for vertical movement
      if (Math.abs(afterChar.vel.y) > 0) {
        console.log(
          `  ↑ Vertical movement: velocity = ${afterChar.vel.y.toFixed(1)}`
        )
      }

      console.log()
    }
  }

  console.log('=== TEST SUMMARY ===')

  const finalState = JSON.parse(gameWrapper.get_characters_json())
  const finalChar = extractCharacterState(finalState[0])

  console.log(`Final state after 50 frames:`)
  console.log(
    `  Position: (${finalChar.pos.x.toFixed(1)}, ${finalChar.pos.y.toFixed(1)})`
  )
  console.log(
    `  Velocity: (${finalChar.vel.x.toFixed(1)}, ${finalChar.vel.y.toFixed(1)})`
  )
  console.log(`  Direction: [${finalChar.dir[0]}, ${finalChar.dir[1]}]`)
  console.log(`  Collision: [${finalChar.collision.join(',')}]`)

  // Validation checks
  let success = true

  if (finalChar.dir[1] !== 2) {
    console.log(
      `❌ FAIL: Gravity not inverted (expected dir[1] = 2, got ${finalChar.dir[1]})`
    )
    success = false
  } else {
    console.log(`✅ PASS: Gravity successfully inverted (dir[1] = 2)`)
  }

  if (Math.abs(finalChar.vel.x) === 0) {
    console.log(`❌ FAIL: No horizontal movement (velocity = 0)`)
    success = false
  } else {
    console.log(
      `✅ PASS: Character has horizontal movement (velocity = ${finalChar.vel.x.toFixed(
        1
      )})`
    )
  }

  if (finalChar.pos.y >= 128) {
    console.log(
      `❌ FAIL: Character not moving upward (still at Y = ${finalChar.pos.y.toFixed(
        1
      )})`
    )
    success = false
  } else {
    console.log(
      `✅ PASS: Character moved upward (Y = ${finalChar.pos.y.toFixed(1)})`
    )
  }

  if (success) {
    console.log()
    console.log(
      '🎉 ALL TESTS PASSED - INVERTED GRAVITY WITH HORIZONTAL MOVEMENT!'
    )
  } else {
    console.log()
    console.log('❌ SOME TESTS FAILED - HORIZONTAL MOVEMENT ISSUE PERSISTS')
  }
} catch (error) {
  console.error('Error during test:', error)
  console.error('Stack trace:', error.stack)
}
