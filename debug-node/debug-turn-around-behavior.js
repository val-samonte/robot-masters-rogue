#!/usr/bin/env node

// Debug script to test turn-around behavior system
// This script tests if collision flags are properly read by condition scripts

import init, { GameWrapper } from '../wasm-wrapper/pkg/wasm_wrapper.js'
import fs from 'fs'
import path from 'path'

// Test configuration with turn-around behavior
const gameConfig = {
  seed: 12345,
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
      pos: [200, 100], // Start near right wall
      vel: [0, 0],
      size: [16, 16],
      dir: [2, 0], // Facing right initially
      collision: [false, false, false, false],
      health: 100,
      health_cap: 100,
      energy: 100,
      energy_cap: 100,
      energy_regen: 1,
      energy_regen_rate: 60,
      power: 10,
      weight: 5,
      jump_force: [0, 1],
      move_speed: [2, 1],
      behaviors: [
        [0, 0],
        [1, 1],
      ], // Always run, turn around on collision
      status_effects: [],
      action_last_used: {},
    },
  ],
  action_definitions: [
    {
      id: 0,
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
        2,
        1, // ASSIGN_FIXED fixed[1] = 2.0 (speed)
        32,
        2,
        0,
        1, // MUL fixed[2] = fixed[0] * fixed[1] (direction * speed)
        16,
        20,
        2, // WRITE_PROP CHARACTER_VEL_X (0x14) = fixed[2]
        0,
        0, // EXIT 0
      ],
    },
    {
      id: 1,
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
        0, // EXIT 0
      ],
    },
  ],
  condition_definitions: [
    {
      id: 0,
      energy_mul: [0, 1],
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      script: [
        20,
        0,
        1, // ASSIGN_BYTE var[0] = 1 (always true)
        91,
        0, // EXIT_WITH_VAR var[0]
      ],
    },
    {
      id: 1,
      energy_mul: [0, 1],
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      script: [
        // Try to read collision flags - this should work now that they're implemented
        15,
        0,
        39, // READ_PROP var[0] = CHARACTER_COLLISION_RIGHT (0x27 = 39 decimal)
        15,
        1,
        41, // READ_PROP var[1] = CHARACTER_COLLISION_LEFT (0x29 = 41 decimal)
        61,
        2,
        0,
        1, // OR var[2] = var[0] || var[1] (right or left collision)
        91,
        2, // EXIT_WITH_VAR var[2]
      ],
    },
  ],
  spawn_definitions: [],
  status_effect_definitions: [],
}

async function testTurnAroundBehavior() {
  try {
    console.log('=== Turn-Around Behavior Debug ===')
    console.log('Testing collision property reading in condition scripts')
    console.log('Initializing WASM module...')

    // Initialize WASM module
    const wasmPath = path.join(
      process.cwd(),
      '../wasm-wrapper/pkg/wasm_wrapper_bg.wasm'
    )
    const wasmBuffer = fs.readFileSync(wasmPath)
    await init(wasmBuffer)
    console.log('WASM initialized successfully')
    console.log('')

    // Create game wrapper
    const gameWrapper = new GameWrapper(JSON.stringify(gameConfig))
    gameWrapper.new_game()

    console.log('Initial state:')
    const initialState = JSON.parse(gameWrapper.get_characters_json())
    console.log(
      `Character position: x=${initialState[0].pos[0]}, y=${initialState[0].pos[1]}`
    )
    console.log(
      `Character direction: ${initialState[0].dir[0]} (0=left, 1=neutral, 2=right)`
    )
    console.log(
      `Character velocity: x=${initialState[0].vel[0]}, y=${initialState[0].vel[1]}`
    )
    console.log(
      `Collision flags: [${initialState[0].collision.join(
        ', '
      )}] (top, right, bottom, left)`
    )

    // Run frames until character hits wall or changes direction
    let previousDir = initialState[0].dir[0]
    let previousPos = initialState[0].pos[0]

    for (let frame = 0; frame < 50; frame++) {
      gameWrapper.step_frame()

      const state = JSON.parse(gameWrapper.get_characters_json())
      const char = state[0]

      // Log significant changes
      if (
        char.dir[0] !== previousDir ||
        Math.abs(char.pos[0] - previousPos) > 5
      ) {
        console.log(`\nFrame ${frame + 1}:`)
        console.log(
          `  Position: x=${char.pos[0]}, y=${char.pos[1]} (change: ${
            char.pos[0] - previousPos
          })`
        )
        console.log(`  Direction: ${char.dir[0]} (was ${previousDir})`)
        console.log(`  Velocity: x=${char.vel[0]}, y=${char.vel[1]}`)
        console.log(`  Collision flags: [${char.collision.join(', ')}]`)

        if (char.dir[0] !== previousDir) {
          console.log(
            `  *** DIRECTION CHANGED: ${previousDir} → ${char.dir[0]} ***`
          )
          console.log(
            `  This indicates turn-around behavior ${
              char.dir[0] !== previousDir ? 'WORKED' : 'FAILED'
            }`
          )
        }

        previousDir = char.dir[0]
        previousPos = char.pos[0]
      }

      // Stop if character is stuck (no movement for several frames)
      if (Math.abs(char.vel[0]) < 0.1 && Math.abs(char.vel[1]) < 0.1) {
        console.log(`\nFrame ${frame + 1}: Character appears stuck`)
        console.log(`  Position: x=${char.pos[0]}, y=${char.pos[1]}`)
        console.log(`  Velocity: x=${char.vel[0]}, y=${char.vel[1]}`)
        console.log(`  Collision flags: [${char.collision.join(', ')}]`)
        break
      }
    }

    console.log('\n=== Analysis ===')
    const finalState = JSON.parse(gameWrapper.get_characters_json())
    const finalChar = finalState[0]

    console.log('Expected behavior:')
    console.log('1. Character starts at x=200, facing right (dir=2)')
    console.log('2. Character moves right with velocity')
    console.log(
      '3. Character hits right wall, collision flag [false, true, false, false] is set'
    )
    console.log(
      '4. Turn-around condition reads collision flag and returns true'
    )
    console.log(
      '5. Turn-around action changes direction from 2 (right) to 0 (left)'
    )
    console.log('6. Character moves left away from wall')

    console.log('\nActual behavior:')
    console.log(`Final position: x=${finalChar.pos[0]}, y=${finalChar.pos[1]}`)
    console.log(`Final direction: ${finalChar.dir[0]}`)
    console.log(`Final velocity: x=${finalChar.vel[0]}, y=${finalChar.vel[1]}`)
    console.log(`Final collision flags: [${finalChar.collision.join(', ')}]`)

    if (finalChar.dir[0] !== initialState[0].dir[0]) {
      console.log('✅ SUCCESS: Direction changed, turn-around behavior worked')
    } else {
      console.log(
        '❌ FAILURE: Direction did not change, turn-around behavior failed'
      )
      console.log(
        'This likely means collision properties are not readable by condition scripts'
      )
    }
  } catch (error) {
    console.error('Error during test:', error)
  }
}

// Run the test
testTurnAroundBehavior()
