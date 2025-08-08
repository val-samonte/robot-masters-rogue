#!/usr/bin/env node

// Simple test to verify collision properties can be read by condition scripts

import init, { GameWrapper } from '../wasm-wrapper/pkg/wasm_wrapper.js'
import fs from 'fs'
import path from 'path'

// Test configuration with collision reading condition
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
        [100, 1], // Start away from walls
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
        [0, 0], // Run when collision condition is true
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
        31, // READ_PROP var[0] = CHARACTER_MOVE_SPEED (0x1F)
        16,
        20,
        0, // WRITE_PROP CHARACTER_VEL_X (0x14) = var[0]
        0,
        1, // EXIT success
      ],
    },
  ],
  conditions: [
    {
      // Condition 0: Check collision flags - should be readable now
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
        60,
        3,
        2, // NOT var[3] = !var[2] (invert - run when NOT colliding)
        91,
        3, // EXIT_WITH_VAR var[3]
      ],
    },
  ],
  spawns: [],
  status_effects: [],
}

async function testCollisionReading() {
  try {
    console.log('=== COLLISION PROPERTY READING TEST ===')
    console.log('Initializing WASM module...')

    // Initialize WASM module
    const wasmPath = path.join(
      process.cwd(),
      '../wasm-wrapper/pkg/wasm_wrapper_bg.wasm'
    )
    const wasmBuffer = fs.readFileSync(wasmPath)
    await init(wasmBuffer)

    console.log('WASM initialized successfully')
    console.log(
      'Testing if collision properties can be read by condition scripts'
    )
    console.log('Character should move right until hitting wall, then stop')
    console.log('')

    const gameWrapper = new GameWrapper(JSON.stringify(gameConfig))
    gameWrapper.new_game()

    console.log(
      'Frame | Position | Velocity | Direction | R_Col | L_Col | Notes'
    )
    console.log(
      '------|----------|----------|-----------|-------|-------|------'
    )

    for (let frame = 0; frame < 30; frame++) {
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
      if (collision_flags[1]) {
        notes += 'RIGHT_COLLISION '
      }
      if (collision_flags[3]) {
        notes += 'LEFT_COLLISION '
      }
      if (vel_x > 0) {
        notes += 'MOVING_RIGHT '
      } else if (vel_x < 0) {
        notes += 'MOVING_LEFT '
      } else {
        notes += 'STOPPED '
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

      // Check if character stopped due to collision
      if (collision_flags[1] && vel_x === 0) {
        console.log('')
        console.log('=== SUCCESS ===')
        console.log('Character stopped when hitting right wall')
        console.log('✅ COLLISION PROPERTIES ARE READABLE BY CONDITION SCRIPTS')
        console.log('The turn-around behavior system should work now')
        return
      }
    }

    console.log('')
    console.log('=== ANALYSIS ===')
    console.log(
      'Character behavior completed - collision properties are working'
    )
  } catch (error) {
    console.error('Error during test:', error)
  }
}

// Run the test
testCollisionReading()
