#!/usr/bin/env node

/**
 * Debug script to test the new frame processing order and timing
 * Tests that collision flags are set correctly for behaviors to use
 */

import fs from 'fs'
import path from 'path'

// Test configuration with proper Fixed-point format
const gameConfig = {
  seed: 12345,
  gravity: [1, 2],
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
  actions: [
    {
      energy_cost: 0,
      cooldown: 0,
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      spawns: [0, 0, 0, 0],
      script: [20, 0, 1, 91, 0], // Simple script that does nothing
    },
  ],
  conditions: [
    {
      energy_mul: 32,
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      script: [20, 0, 1, 91, 0], // ALWAYS condition
    },
  ],
  characters: [
    {
      id: 1,
      position: [
        [220, 1], // Near right wall (240 - 16 = 224 is wall boundary)
        [192, 1], // Y position
      ],
      group: 1,
      size: [16, 16],
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
        [0, 0], // Always do nothing - just test collision
      ],
    },
  ],
  spawns: [],
  status_effects: [],
}

async function loadWasm() {
  try {
    const wasmModule = await import('../wasm-wrapper/pkg/wasm_wrapper.js')
    const { default: init, GameWrapper } = wasmModule

    const wasmPath = path.join(
      process.cwd(),
      'wasm-wrapper/pkg/wasm_wrapper_bg.wasm'
    )
    const wasmBuffer = fs.readFileSync(wasmPath)
    await init(wasmBuffer)

    console.log('=== FRAME PROCESSING ORDER TEST ===')
    console.log('Testing new frame processing order with improved timing')
    console.log('Character starts at x=220, should hit wall at x=240')
    console.log('Expected: Collision flags should be accurate for behaviors')
    console.log('')

    const gameWrapper = new GameWrapper(JSON.stringify(gameConfig))
    gameWrapper.new_game()

    // Test frame processing with manual velocity setting
    for (let frame = 0; frame < 8; frame++) {
      const before = JSON.parse(gameWrapper.get_characters_json())
      const char = before[0]

      const posX = char.position[0][0] / char.position[0][1]
      const posY = char.position[1][0] / char.position[1][1]
      const velX = char.velocity[0][0] / char.velocity[0][1]
      const velY = char.velocity[1][0] / char.velocity[1][1]

      console.log(`Frame ${frame} (BEFORE):`)
      console.log(`  Position: (${posX.toFixed(1)}, ${posY.toFixed(1)})`)
      console.log(`  Velocity: (${velX.toFixed(1)}, ${velY.toFixed(1)})`)
      console.log(`  Collision flags: [${char.collision.join(', ')}]`)
      console.log(
        `  Character bounds: x=${posX.toFixed(1)} to x=${(posX + 16).toFixed(
          1
        )}`
      )

      // Set rightward velocity for first few frames
      if (frame < 5) {
        gameWrapper.set_character_velocity(0, 2.0, 0.0)
      }

      // Step frame with new processing order
      gameWrapper.step_frame()

      const after = JSON.parse(gameWrapper.get_characters_json())
      const afterChar = after[0]

      const afterPosX = afterChar.position[0][0] / afterChar.position[0][1]
      const afterPosY = afterChar.position[1][0] / afterChar.position[1][1]
      const afterVelX = afterChar.velocity[0][0] / afterChar.velocity[0][1]
      const afterVelY = afterChar.velocity[1][0] / afterChar.velocity[1][1]

      console.log(`Frame ${frame} (AFTER):`)
      console.log(
        `  Position: (${afterPosX.toFixed(1)}, ${afterPosY.toFixed(1)})`
      )
      console.log(
        `  Velocity: (${afterVelX.toFixed(1)}, ${afterVelY.toFixed(1)})`
      )
      console.log(`  Collision flags: [${afterChar.collision.join(', ')}]`)

      // Check for position jumps (the bug we're trying to fix)
      const positionChange = Math.abs(afterPosX - posX)
      if (positionChange > 10) {
        console.log(
          `  ⚠️  Large position jump: ${positionChange.toFixed(1)} pixels`
        )
      } else {
        console.log(
          `  ✓ Normal position change: ${positionChange.toFixed(1)} pixels`
        )
      }

      // Check collision detection accuracy
      const rightEdge = afterPosX + 16
      if (rightEdge >= 240) {
        console.log(
          `  Character right edge at x=${rightEdge.toFixed(1)} (wall at x=240)`
        )
        if (afterChar.collision[1]) {
          console.log(`  ✓ Right collision detected correctly`)
        } else {
          console.log(`  ❌ Right collision NOT detected`)
        }
      }

      // Check if character stopped properly
      if (afterPosX <= 224 && Math.abs(afterVelX) < 0.1) {
        console.log(`  ✓ Character stopped at wall boundary`)
      }

      console.log('')
    }

    console.log('=== FRAME PROCESSING ORDER ANALYSIS ===')
    console.log('New processing order:')
    console.log('1. Process status effects')
    console.log('2. Correct position overlaps FIRST (before behaviors)')
    console.log('3. Execute character behaviors (see accurate collision flags)')
    console.log('4. Apply gravity to velocity')
    console.log(
      '5. Check collisions and constrain velocity (no position correction)'
    )
    console.log('6. Apply velocity to position')
    console.log(
      '7. Update collision flags for NEXT frame (after final position)'
    )
    console.log('')
    console.log('Key improvements:')
    console.log('- Position correction happens before behaviors execute')
    console.log('- Collision flags are updated after final position is set')
    console.log('- Behaviors see accurate collision state from previous frame')
    console.log('- No more position jumps from conflicting correction/movement')
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

loadWasm()
