#!/usr/bin/env node

// Test horizontal collision detection during movement
// This script tests if characters properly stop when hitting walls during movement

import init, { GameWrapper } from '../wasm-wrapper/pkg/wasm_wrapper.js'
import fs from 'fs'
import path from 'path'

// Test configuration with character that has a run behavior
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
      move_speed: [3, 1], // 3.0 speed (same as working script)
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
    },
  ],
  actions: [
    {
      // Run action - set velocity based on direction
      energy_cost: 0,
      cooldown: 0,
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      spawns: [0, 0, 0, 0],
      script: [
        // Copy from working debug-movement-with-velocity.js
        15,
        0,
        31, // READ_PROP var[0] = CHARACTER_MOVE_SPEED
        16,
        20,
        0, // WRITE_PROP CHARACTER_VEL_X = var[0]
        0,
        1, // EXIT success
      ],
    },
  ],
  conditions: [
    {
      // Always condition
      energy_mul: 32,
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      script: [0, 1], // Always return true (EXIT success)
    },
  ],
  spawns: [],
  status_effects: [],
}

async function testHorizontalCollision() {
  try {
    console.log('=== HORIZONTAL COLLISION DETECTION TEST ===')
    console.log('Initializing WASM module...')

    // Initialize WASM module
    const wasmPath = path.join(
      process.cwd(),
      '../wasm-wrapper/pkg/wasm_wrapper_bg.wasm'
    )
    const wasmBuffer = fs.readFileSync(wasmPath)
    await init(wasmBuffer)

    console.log('WASM initialized successfully')
    console.log('Testing character with run behavior moving right toward wall')
    console.log('Expected: Character should stop at x=224 (240 - 16 width)')
    console.log('')

    const gameWrapper = new GameWrapper(JSON.stringify(gameConfig))
    gameWrapper.new_game()

    console.log('Frame | Position | Velocity | Direction | Collision | Notes')
    console.log('------|----------|----------|-----------|-----------|------')

    for (let frame = 0; frame < 15; frame++) {
      const characters = JSON.parse(gameWrapper.get_characters_json())
      const char = characters[0]

      const pos_x = char.position[0][0] / 32 // Convert from Fixed to pixels
      const vel_x = char.velocity[0][0] / 32 // Convert from Fixed to pixels
      const dir_x = char.dir[0] // Direction (should be 2 for right)
      const collision_flags = char.collision

      let notes = ''
      if (pos_x >= 224) {
        notes += 'AT/PAST_WALL '
      }
      if (collision_flags[1]) {
        notes += 'RIGHT_COLLISION '
      }
      if (pos_x > 240) {
        notes += 'OUTSIDE_GAME_AREA '
      }
      if (vel_x === 0) {
        notes += 'STOPPED '
      }

      console.log(
        `${frame.toString().padStart(5)} | ${pos_x
          .toFixed(1)
          .padStart(8)} | ${vel_x.toFixed(1).padStart(8)} | ${dir_x
          .toString()
          .padStart(9)} | ${collision_flags[1]
          .toString()
          .padStart(9)} | ${notes}`
      )

      // Step to next frame
      if (frame < 14) {
        gameWrapper.step_frame()
      }
    }

    console.log('')
    console.log('=== ANALYSIS ===')

    const finalCharacters = JSON.parse(gameWrapper.get_characters_json())
    const finalChar = finalCharacters[0]
    const finalPos = finalChar.position[0][0] / 32
    const finalVel = finalChar.velocity[0][0] / 32
    const finalCollision = finalChar.collision[1] // Right collision

    console.log(`Final position: ${finalPos.toFixed(1)} (expected: ≤224)`)
    console.log(
      `Final velocity: ${finalVel.toFixed(1)} (expected: 0 when at wall)`
    )
    console.log(
      `Right collision flag: ${finalCollision} (expected: true when at wall)`
    )

    if (finalPos <= 224 && finalVel === 0 && finalCollision) {
      console.log('✅ SUCCESS: Character properly stopped at wall')
      console.log('✅ HORIZONTAL COLLISION DETECTION IS WORKING')
      return true
    } else if (finalPos > 240) {
      console.log(
        '❌ FAILURE: Character passed through wall (outside game area)'
      )
      console.log(
        '   This indicates horizontal collision detection is not working during movement'
      )
      return false
    } else if (finalVel !== 0 && finalPos >= 224) {
      console.log(
        '❌ FAILURE: Character still has velocity but should be stopped at wall'
      )
      return false
    } else if (!finalCollision && finalPos >= 224) {
      console.log('❌ FAILURE: Character at wall but collision flag not set')
      return false
    } else {
      console.log('⚠️  PARTIAL: Character behavior unclear')
      return false
    }
  } catch (error) {
    console.error('Error during test:', error)
    return false
  }
}

testHorizontalCollision().then((success) => {
  process.exit(success ? 0 : 1)
})
