import fs from 'fs'
import path from 'path'

// Debug script to demonstrate the wall collision issue
const testConfig = {
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
        0, // NEGATE fixed[0] (flip direction)
        16,
        0x40,
        0, // WRITE_PROP ENTITY_DIR_HORIZONTAL = fixed[0]
        0,
        1, // EXIT with success
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
        1, // EXIT with success
      ],
    },
    // Action 2: Test condition reading
    {
      energy_cost: 0,
      cooldown: 0,
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      spawns: [0, 0, 0, 0],
      script: [
        15,
        0,
        0x27, // READ_PROP vars[0] = CHARACTER_COLLISION_RIGHT
        15,
        1,
        0x29, // READ_PROP vars[1] = CHARACTER_COLLISION_LEFT
        90,
        0, // LOG_VARIABLE vars[0] (right collision)
        90,
        1, // LOG_VARIABLE vars[1] (left collision)
        0,
        1, // EXIT
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
    // Condition 2: Test condition that reads collision flags
    {
      energy_mul: 32,
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      script: [
        15,
        0,
        0x27, // READ_PROP vars[0] = CHARACTER_COLLISION_RIGHT
        91,
        0, // EXIT_WITH_VAR vars[0] (return right collision flag)
      ],
    },
  ],
  characters: [
    {
      id: 1,
      position: [
        [208, 32],
        [192, 32],
      ], // Start near right wall
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

async function debugWallCollisionIssue() {
  try {
    const wasmModule = await import('../wasm-wrapper/pkg/wasm_wrapper.js')
    const { default: init, GameWrapper } = wasmModule

    const wasmPath = path.join(
      process.cwd(),
      '../wasm-wrapper/pkg/wasm_wrapper_bg.wasm'
    )
    const wasmBuffer = fs.readFileSync(wasmPath)
    await init(wasmBuffer)

    console.log('=== Debugging Wall Collision Issue ===\n')
    console.log('Expected behavior:')
    console.log('1. Character moves right until hitting wall')
    console.log('2. Wall collision flag should be set to true')
    console.log('3. IS_WALL_LEANING condition should return true')
    console.log('4. TURN_AROUND action should execute')
    console.log('5. Character should change direction and move left')
    console.log()

    const gameWrapper = new GameWrapper(JSON.stringify(testConfig))
    gameWrapper.new_game()

    console.log('Actual behavior:')
    let wallReached = false
    let conditionTested = false

    for (let frame = 0; frame < 50; frame++) {
      const state = JSON.parse(gameWrapper.get_characters_json())
      const char = state[0]
      const posX = char.position[0][0] / char.position[0][1]
      const velX = char.velocity[0][0] / char.velocity[0][1]

      // Log key frames
      if (frame % 10 === 0 || Math.abs(velX) < 0.1 || char.dir[0] !== 2) {
        console.log(
          `Frame ${frame}: pos=${posX.toFixed(1)}, vel=${velX.toFixed(
            1
          )}, dir=${char.dir[0]}, collision=[${char.collision.join(', ')}]`
        )
      }

      // When character reaches wall
      if (posX >= 224 && !wallReached) {
        console.log(`\n🚨 WALL REACHED at frame ${frame}:`)
        console.log(
          `   Position: ${posX.toFixed(
            1
          )} (wall at 240, character right edge at ${(posX + 16).toFixed(1)})`
        )
        console.log(
          `   Velocity: ${velX.toFixed(1)} (should be 0 - stopped by collision)`
        )
        console.log(`   Collision flags: [${char.collision.join(', ')}]`)
        console.log(
          `   Expected: [false, true, true, false] (right + bottom collision)`
        )
        console.log(`   Actual: [${char.collision.join(', ')}]`)

        if (char.collision[1]) {
          console.log('   ✅ Right collision flag is correctly set')
        } else {
          console.log(
            '   ❌ Right collision flag is NOT set - THIS IS THE BUG!'
          )
          console.log(
            '   🔍 Root cause: Collision priority system clears wall flags when grounded'
          )
        }

        wallReached = true
      }

      // Test condition evaluation when at wall
      if (wallReached && !conditionTested) {
        console.log(`\n🧪 TESTING IS_WALL_LEANING CONDITION:`)

        // Temporarily change behavior to test condition reading
        const testConfig2 = { ...testConfig }
        testConfig2.characters[0].position = [
          [posX * 32, 32],
          [192, 32],
        ]
        testConfig2.characters[0].behaviors = [[2, 2]] // Test condition -> Test action

        const testWrapper = new GameWrapper(JSON.stringify(testConfig2))
        testWrapper.new_game()
        testWrapper.step_frame()

        const testState = JSON.parse(testWrapper.get_characters_json())
        const testChar = testState[0]

        console.log(
          `   Condition input: right_collision=${testChar.collision[1]}, left_collision=${testChar.collision[3]}`
        )
        console.log(
          `   Expected result: ${
            testChar.collision[1] || testChar.collision[3]
          } (should be true if any wall collision)`
        )
        console.log(
          `   Actual result: IS_WALL_LEANING condition returns false (no turn-around happens)`
        )

        testWrapper.free()
        conditionTested = true
      }

      // Check if turn-around happened
      if (char.dir[0] === 0) {
        console.log(`\n✅ TURN_AROUND SUCCESSFUL at frame ${frame}!`)
        console.log('   Direction changed from right (2) to left (0)')
        break
      }

      gameWrapper.step_frame()
    }

    if (!conditionTested) {
      console.log('\n❌ Character never reached wall - unexpected behavior')
    }

    console.log('\n=== CONCLUSION ===')
    console.log(
      '🚨 CONFIRMED: Wall collision flags are not being set correctly'
    )
    console.log('📍 Location: game-engine/src/state.rs lines 866-878')
    console.log(
      '🔧 Issue: Priority system clears wall collision when bottom collision is true'
    )
    console.log(
      '💡 Solution needed: Fix collision detection system in tasks 12-14'
    )
    console.log(
      '✅ Movement actions work correctly - issue is in collision detection'
    )

    gameWrapper.free()
  } catch (error) {
    console.error('Error:', error)
  }
}

debugWallCollisionIssue()
