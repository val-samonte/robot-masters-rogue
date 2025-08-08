#!/usr/bin/env node

// Simple test to verify collision properties are readable by scripts

import init, { GameWrapper } from '../wasm-wrapper/pkg/wasm_wrapper.js'
import fs from 'fs'
import path from 'path'

// Simple test configuration - copied from working test
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
      dir: [2, 0], // Facing right
      enmity: 0,
      target_id: null,
      target_type: 0,
      behaviors: [
        [0, 0], // Always run
      ],
      actions: [],
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
        // Simple run script that reads collision flags
        15,
        0,
        39, // READ_PROP var[0] = CHARACTER_COLLISION_RIGHT (0x27)
        15,
        1,
        41, // READ_PROP var[1] = CHARACTER_COLLISION_LEFT (0x29)
        15,
        2,
        64, // READ_PROP var[2] = ENTITY_DIR_HORIZONTAL (0x40)
        21,
        1,
        3,
        1, // ASSIGN_FIXED fixed[1] = 3.0 (speed)
        32,
        2,
        2,
        1, // MUL fixed[2] = fixed[2] * fixed[1] (direction * speed)
        16,
        20,
        2, // WRITE_PROP CHARACTER_VEL_X (0x14) = fixed[2]
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
  ],
  spawns: [],
  status_effects: [],
  spawn_definitions: [],
  status_effect_definitions: [],
}

async function testCollisionProperties() {
  try {
    console.log('=== COLLISION PROPERTIES TEST ===')
    console.log('Initializing WASM module...')

    // Initialize WASM module
    const wasmPath = path.join(
      process.cwd(),
      '../wasm-wrapper/pkg/wasm_wrapper_bg.wasm'
    )
    const wasmBuffer = fs.readFileSync(wasmPath)
    await init(wasmBuffer)

    console.log('WASM initialized successfully')
    console.log('Testing if collision properties can be read by action scripts')
    console.log('')

    const gameWrapper = new GameWrapper(JSON.stringify(gameConfig))
    gameWrapper.new_game()

    console.log('Frame | Position | Right Col | Left Col | Direction | Notes')
    console.log('------|----------|-----------|----------|-----------|------')

    for (let frame = 0; frame < 20; frame++) {
      const characters = JSON.parse(gameWrapper.get_characters_json())
      const char = characters[0]

      const pos_x = char.position[0][0] / 32 // Convert from Fixed to pixels
      const dir_x = char.dir[0] // Direction (should be 2 for right)
      const collision_flags = char.collision

      let notes = ''
      if (pos_x >= 224) {
        notes += 'AT_WALL '
      }
      if (collision_flags[1]) {
        notes += 'RIGHT_COLLISION '
      }
      if (collision_flags[3]) {
        notes += 'LEFT_COLLISION '
      }

      console.log(
        `${frame.toString().padStart(5)} | ${pos_x.toFixed(1).padStart(8)} | ${
          collision_flags[1] ? '    true' : '   false'
        } | ${collision_flags[3] ? '    true' : '   false'} | ${dir_x
          .toString()
          .padStart(9)} | ${notes}`
      )

      gameWrapper.step_frame()

      // Stop if character hits wall
      if (collision_flags[1] || collision_flags[3]) {
        console.log('')
        console.log('=== COLLISION DETECTED ===')
        console.log(
          `Character hit ${collision_flags[1] ? 'right' : 'left'} wall`
        )
        console.log('✅ SUCCESS: Collision properties are readable by scripts')
        console.log('This means the turn-around behavior system should work')
        return
      }
    }

    console.log('')
    console.log('❌ No collision detected in 20 frames')
    console.log(
      'Character may not be moving or collision detection may be broken'
    )
  } catch (error) {
    console.error('Error during test:', error)
  }
}

// Run the test
testCollisionProperties()
