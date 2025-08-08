#!/usr/bin/env node

// Test turn-around behavior system
// This script tests if collision flags can be read by condition scripts to trigger turn-around

import init, { GameWrapper } from '../wasm-wrapper/pkg/wasm_wrapper.js'
import fs from 'fs'
import path from 'path'

// Test configuration with turn-around behavior
const gameConfig = {
  seed: 12345,
  gravity: [1, 1],
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
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  ],
  characters: [
    {
      id: 0,
      group: 0,
      position: [
        [200, 1], // Start near right wall
        [208, 1], // On ground
      ],
      size: [16, 16],
      health: 100,
      health_cap: 100,
      energy: 100,
      energy_cap: 100,
      power: 10,
      weight: 5,
      jump_force: [5, 1],
      move_speed: [3, 1], // 3.0 speed
      armor: [0, 0, 0, 0, 0, 0, 0, 0, 0],
      energy_regen: 1,
      energy_regen_rate: 60,
      energy_charge: 2,
      energy_charge_rate: 30,
      dir: [2, 0], // Facing right initially
      enmity: 0,
      target_id: null,
      target_type: 0,
      behaviors: [
        [0, 0], // Always run
        [1, 1], // Turn around on collision
      ],
    },
  ],
  actions: [
    {
      // Action 0: Run action - set velocity based on direction
      energy_cost: 0,
      cooldown: 0,
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      spawns: [0, 0, 0, 0],
      script: [
        15,
        0,
        64, // READ_PROP var[0] = ENTITY_DIR_HORIZONTAL (0x40)
        21,
        1,
        3,
        1, // ASSIGN_FIXED fixed[1] = 3.0 (speed)
        32,
        2,
        0,
        1, // MUL fixed[2] = fixed[0] * fixed[1] (direction * speed)
        16,
        20,
        2, // WRITE_PROP CHARACTER_VEL_X (0x14) = fixed[2]
        0,
        1, // EXIT success
      ],
    },
    {
      // Action 1: Turn around action - flip direction
      energy_cost: 0,
      cooldown: 0, // No cooldown for immediate response
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      spawns: [0, 0, 0, 0],
      script: [
        15,
        0,
        64, // READ_PROP var[0] = ENTITY_DIR_HORIZONTAL (0x40)
        50,
        1,
        0,
        0, // EQUAL var[1] = (var[0] == 0) ? 1 : 0  (check if facing left)
        20,
        2,
        2, // ASSIGN_BYTE var[2] = 2 (right direction)
        20,
        3,
        0, // ASSIGN_BYTE var[3] = 0 (left direction)
        42,
        4,
        1,
        2, // MUL_BYTE var[4] = var[1] * var[2]  (0 or 2)
        60,
        5,
        1, // NOT var[5] = !var[1]  (1 or 0)
        42,
        6,
        5,
        3, // MUL_BYTE var[6] = var[5] * var[3]  (0 or 0)
        40,
        7,
        4,
        6, // ADD_BYTE var[7] = var[4] + var[6]  (final direction)
        23,
        0,
        7, // TO_BYTE var[0] = var[7]
        24,
        1,
        0, // TO_FIXED fixed[1] = var[0]
        16,
        64,
        1, // WRITE_PROP ENTITY_DIR_HORIZONTAL (0x40) = fixed[1]
        0,
        1, // EXIT success
      ],
    },
  ],
  conditions: [
    {
      // Condition 0: Always condition
      energy_mul: 32,
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      script: [0, 1], // Always return true (EXIT success)
    },
    {
      // Condition 1: Turn around condition - check for collision
      energy_mul: 32,
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      script: [
        15,
        0,
        39, // READ_PROP var[0] = CHARACTER_COLLISION_RIGHT (0x27)
        15,
        1,
        41, // READ_PROP var[1] = CHARACTER_COLLISION_LEFT (0x29)
        61,
        2,
        0,
        1, // OR var[2] = var[0] || var[1] (right or left collision)
        91,
        2, // EXIT_WITH_VAR var[2]
      ],
    },
  ],
  spawns: [],
  status_effects: [],
}

async function testTurnAroundBehavior() {
  try {
    console.log('=== TURN-AROUND BEHAVIOR TEST ===')
    console.log('Initializing WASM module...')

    // Initialize WASM module
    const wasmPath = path.join(
      process.cwd(),
      '../wasm-wrapper/pkg/wasm_wrapper_bg.wasm'
    )
    const wasmBuffer = fs.readFileSync(wasmPath)
    await init(wasmBuffer)

    console.log('WASM initialized successfully')
    console.log('Testing turn-around behavior when character hits walls')
    console.log(
      'Expected: Character should change direction when hitting walls'
    )
    console.log('')

    const gameWrapper = new GameWrapper(JSON.stringify(gameConfig))
    gameWrapper.new_game()

    console.log(
      'Frame | Position | Velocity | Direction | R_Col | L_Col | Notes'
    )
    console.log(
      '------|----------|----------|-----------|-------|-------|------'
    )

    let previousDir = 2 // Start facing right
    let directionChanges = 0

    for (let frame = 0; frame < 50; frame++) {
      const characters = JSON.parse(gameWrapper.get_characters_json())
      const char = characters[0]

      const pos_x = char.position[0][0] / 32 // Convert from Fixed to pixels
      const vel_x = char.velocity[0][0] / 32 // Convert from Fixed to pixels
      const dir_x = char.dir[0] // Direction
      const collision_flags = char.collision

      let notes = ''
      if (pos_x >= 224) {
        notes += 'AT_RIGHT_WALL '
      }
      if (pos_x <= 16) {
        notes += 'AT_LEFT_WALL '
      }
      if (collision_flags[1]) {
        notes += 'RIGHT_COLLISION '
      }
      if (collision_flags[3]) {
        notes += 'LEFT_COLLISION '
      }
      if (dir_x !== previousDir) {
        notes += `DIR_CHANGED(${previousDir}→${dir_x}) `
        directionChanges++
        previousDir = dir_x
      }

      console.log(
        `${frame.toString().padStart(5)} | ${pos_x
          .toFixed(1)
          .padStart(8)} | ${vel_x.toFixed(1).padStart(8)} | ${dir_x
          .toString()
          .padStart(9)} | ${collision_flags[1] ? ' true' : 'false'} | ${
          collision_flags[3] ? ' true' : 'false'
        } | ${notes}`
      )

      gameWrapper.step_frame()

      // Stop if we've seen multiple direction changes (successful turn-around)
      if (directionChanges >= 2) {
        console.log('')
        console.log('=== SUCCESS ===')
        console.log(
          `Character successfully turned around ${directionChanges} times`
        )
        console.log('✅ TURN-AROUND BEHAVIOR IS WORKING')
        console.log(
          'Collision properties are properly readable by condition scripts'
        )
        return
      }
    }

    console.log('')
    console.log('=== ANALYSIS ===')
    if (directionChanges > 0) {
      console.log(
        `✅ PARTIAL SUCCESS: Character changed direction ${directionChanges} time(s)`
      )
      console.log(
        'Turn-around behavior is working but may need more frames to see full cycle'
      )
    } else {
      console.log('❌ FAILURE: Character never changed direction')
      console.log(
        'Turn-around behavior is not working - collision properties may not be readable'
      )
    }
  } catch (error) {
    console.error('Error during test:', error)
  }
}

// Run the test
testTurnAroundBehavior()
