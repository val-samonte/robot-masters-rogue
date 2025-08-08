#!/usr/bin/env node

// Test horizontal collision detection during movement
// This script tests if characters properly stop when hitting walls during movement

import { GameWrapper } from '../wasm-wrapper/pkg/wasm_wrapper.js'

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
      move_speed: [32, 1], // Fast movement to test collision
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
        // Read entity direction (ENTITY_DIR_HORIZONTAL = 64)
        15,
        0,
        64, // READ_PROP var[0] = ENTITY_DIR_HORIZONTAL
        // Assign move speed (32 pixels/frame)
        21,
        1,
        32,
        1, // ASSIGN_FIXED fixed[1] = 32.0
        // Multiply direction by speed
        32,
        2,
        0,
        1, // MUL fixed[2] = var[0] * fixed[1]
        // Write to velocity X (CHARACTER_VEL_X = 20)
        16,
        20,
        2, // WRITE_PROP CHARACTER_VEL_X = fixed[2]
        0,
        0, // EXIT
      ],
    },
  ],
  conditions: [
    {
      // Always condition
      energy_mul: 32,
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      script: [
        20,
        0,
        1, // ASSIGN_BYTE var[0] = 1
        0,
        0, // EXIT
      ],
    },
  ],
  spawns: [],
  status_effects: [],
}

function testHorizontalCollision() {
  console.log('=== HORIZONTAL COLLISION DETECTION TEST ===')
  console.log('Testing character with run behavior moving right toward wall')
  console.log('Expected: Character should stop at x=224 (240 - 16 width)')
  console.log('')

  const gameWrapper = new GameWrapper(JSON.stringify(gameConfig))
  gameWrapper.new_game()

  console.log('Frame | Position | Velocity | Collision | Notes')
  console.log('------|----------|----------|-----------|------')

  for (let frame = 0; frame < 15; frame++) {
    const characters = JSON.parse(gameWrapper.get_characters_json())
    const char = characters[0]

    const pos_x = char.position[0][0] / 32 // Convert from Fixed to pixels
    const vel_x = char.velocity[0][0] / 32 // Convert from Fixed to pixels
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
        .padStart(8)} | ${vel_x.toFixed(1).padStart(8)} | ${collision_flags[1]
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
  } else if (finalPos > 240) {
    console.log('❌ FAILURE: Character passed through wall (outside game area)')
    console.log(
      '   This indicates horizontal collision detection is not working during movement'
    )
  } else if (finalVel !== 0 && finalPos >= 224) {
    console.log(
      '❌ FAILURE: Character still has velocity but should be stopped at wall'
    )
  } else if (!finalCollision && finalPos >= 224) {
    console.log('❌ FAILURE: Character at wall but collision flag not set')
  } else {
    console.log('⚠️  PARTIAL: Character behavior unclear')
  }
}

testHorizontalCollision()
