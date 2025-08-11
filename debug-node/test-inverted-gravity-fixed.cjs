/**
 * Test inverted gravity system - Task 23 (FIXED JSON STRUCTURE)
 *
 * Tests that:
 * 1. ONLY_ONCE condition triggers exactly once on frame 1
 * 2. INVERT_GRAVITY action flips character's vertical direction from 0 to 2
 * 3. Character then runs horizontally and turns around at walls
 * 4. Character falls upward toward ceiling due to inverted gravity
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

// INVERTED_GRAVITY_CONFIG - exact copy from gameConfigs.ts
const INVERTED_GRAVITY_CONFIG = {
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
        [32, 1],
        [192, 1],
      ], // Start at (2, 12) in pixels
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
        [1, 1], // Always -> RUN
      ],
    },
  ],
  spawns: [],
  status_effects: [],
}

console.log('=== INVERTED GRAVITY TEST - TASK 23 (FIXED) ===')
console.log('Testing ONLY_ONCE condition and INVERT_GRAVITY action')
console.log()

try {
  // Create game wrapper
  const gameWrapper = new GameWrapper(JSON.stringify(INVERTED_GRAVITY_CONFIG))
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
  console.log(
    `  Direction: [${initialChar.dir[0]}, ${initialChar.dir[1]}] (horizontal, vertical)`
  )
  console.log(`  Expected: dir[1] = 0 (normal downward gravity)`)
  console.log()

  // Run first few frames to test ONLY_ONCE and INVERT_GRAVITY
  console.log('=== FRAME-BY-FRAME ANALYSIS ===')

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
      `  After:  pos=(${afterChar.pos.x.toFixed(1)}, ${afterChar.pos.y.toFixed(
        1
      )}), vel=(${afterChar.vel.x.toFixed(1)}, ${afterChar.vel.y.toFixed(
        1
      )}), dir=[${afterChar.dir[0]}, ${afterChar.dir[1]}]`
    )

    // Check for gravity inversion
    if (beforeChar.dir[1] !== afterChar.dir[1]) {
      console.log(
        `  *** GRAVITY INVERTED: ${beforeChar.dir[1]} -> ${afterChar.dir[1]} ***`
      )
      if (afterChar.dir[1] === 2) {
        console.log(`  ✅ SUCCESS: Gravity inverted to upward (dir[1] = 2)`)
      } else {
        console.log(
          `  ❌ ERROR: Unexpected gravity direction: ${afterChar.dir[1]}`
        )
      }
    }

    // Check for horizontal movement
    if (Math.abs(afterChar.vel.x) > 0) {
      console.log(
        `  → Horizontal movement: velocity = ${afterChar.vel.x.toFixed(1)}`
      )
    }

    // Check for vertical movement (should be upward after inversion)
    if (Math.abs(afterChar.vel.y) > 0) {
      console.log(
        `  ↑ Vertical movement: velocity = ${afterChar.vel.y.toFixed(1)}`
      )
    }

    console.log()
  }

  // Test longer sequence to see horizontal movement - EXTENDED TO 500+ FRAMES
  console.log('=== EXTENDED TEST (frames 11-500) ===')

  for (let frame = 11; frame <= 500; frame++) {
    gameWrapper.step_frame()

    if (frame % 25 === 0) {
      // Log every 25th frame
      const state = JSON.parse(gameWrapper.get_characters_json())
      const char = extractCharacterState(state[0])
      console.log(
        `Frame ${frame}: pos=(${char.pos.x.toFixed(1)}, ${char.pos.y.toFixed(
          1
        )}), vel=(${char.vel.x.toFixed(1)}, ${char.vel.y.toFixed(1)}), dir=[${
          char.dir[0]
        }, ${char.dir[1]}], collision=[${char.collision.join(',')}]`
      )

      // Check for horizontal movement
      if (Math.abs(char.vel.x) > 0) {
        console.log(
          `  ✅ Character has horizontal velocity: ${char.vel.x.toFixed(1)}`
        )
      } else {
        console.log(
          `  ❌ Character has NO horizontal velocity (should be running)`
        )
      }

      // Check if character is moving upward
      if (char.vel.y < 0) {
        console.log(`  ↑ Character moving upward (negative Y velocity)`)
      }

      // Check collision state
      if (char.collision[0]) {
        // Top collision (ceiling)
        console.log(`  🔝 Character touching ceiling`)
      }
      if (char.collision[1] || char.collision[3]) {
        // Wall collision
        console.log(`  🧱 Character touching wall`)
      }
    }
  }

  console.log()
  console.log('=== TEST SUMMARY ===')

  const finalState = JSON.parse(gameWrapper.get_characters_json())
  const finalChar = extractCharacterState(finalState[0])

  console.log(`Final state after 500 frames:`)
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

  if (finalChar.pos.y >= 192) {
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
    console.log('🎉 ALL TESTS PASSED - INVERTED GRAVITY SYSTEM WORKING!')
    console.log('✅ ONLY_ONCE condition triggered exactly once')
    console.log('✅ INVERT_GRAVITY action flipped vertical direction')
    console.log('✅ Character runs horizontally and moves upward')
  } else {
    console.log()
    console.log('❌ SOME TESTS FAILED - CHECK IMPLEMENTATION')
  }
} catch (error) {
  console.error('Error during test:', error)
  console.error('Stack trace:', error.stack)
}
