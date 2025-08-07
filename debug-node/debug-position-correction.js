import fs from 'fs'
import path from 'path'

// Minimal test case to isolate position correction issues
const gameConfig = {
  seed: 12345,
  gravity: [0, 1], // No gravity to isolate position correction
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
      script: [0, 0], // EXIT - do nothing
    },
  ],
  conditions: [
    {
      energy_mul: 32,
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      script: [20, 0, 0, 91, 0], // Return false - never execute action
    },
  ],
  characters: [
    {
      id: 1,
      position: [
        [242, 1], // Start overlapping right wall by 2 pixels (242+16=258, wall at 240)
        [100, 1], // Middle of screen vertically
      ],
      group: 1,
      size: [16, 16], // Square character for simplicity
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
      dir: [1, 0], // Neutral direction
      enmity: 0,
      target_id: null,
      target_type: 0,
      behaviors: [
        [0, 0], // Never execute action
      ],
    },
  ],
  spawns: [],
  status_effects: [],
}

async function testPositionCorrection() {
  try {
    const wasmModule = await import('../wasm-wrapper/pkg/wasm_wrapper.js')
    const { default: init, GameWrapper } = wasmModule

    const wasmPath = path.join(
      process.cwd(),
      '../wasm-wrapper/pkg/wasm_wrapper_bg.wasm'
    )
    const wasmBuffer = fs.readFileSync(wasmPath)
    await init(wasmBuffer)

    console.log('=== POSITION CORRECTION ISOLATION TEST ===')
    console.log(
      'Testing position correction algorithm with minimal configuration'
    )
    console.log('- No gravity (gravity = 0)')
    console.log('- No behaviors (never execute actions)')
    console.log('- Character starts overlapping right wall by 2 pixels')
    console.log('- Expected: Character pushed left to x=224')
    console.log('')

    const gameWrapper = new GameWrapper(JSON.stringify(gameConfig))
    gameWrapper.new_game()

    const testCases = [
      {
        name: 'Right Wall Overlap',
        startX: 242,
        expectedX: 224,
        description: 'Character overlapping right wall by 2px',
      },
      {
        name: 'Left Wall Overlap',
        startX: 14,
        expectedX: 16,
        description: 'Character overlapping left wall by 2px',
      },
      {
        name: 'Exact Boundary',
        startX: 224,
        expectedX: 224,
        description: 'Character exactly at right wall boundary',
      },
      {
        name: 'No Overlap',
        startX: 100,
        expectedX: 100,
        description: 'Character in middle, no overlap',
      },
    ]

    for (const testCase of testCases) {
      console.log(`--- TEST CASE: ${testCase.name} ---`)
      console.log(`Description: ${testCase.description}`)

      // Reset game and set character position
      gameWrapper.new_game()

      // Get initial state
      const initial = JSON.parse(gameWrapper.get_characters_json())
      const char_initial = initial[0]
      const initialX = char_initial.position[0][0] / char_initial.position[0][1]

      console.log(`Initial position: x=${initialX.toFixed(1)}`)
      console.log(
        `Expected after correction: x=${testCase.expectedX.toFixed(1)}`
      )

      // Step one frame to trigger position correction
      gameWrapper.step_frame()

      const after = JSON.parse(gameWrapper.get_characters_json())
      const char_after = after[0]
      const afterX = char_after.position[0][0] / char_after.position[0][1]

      console.log(`Actual after correction: x=${afterX.toFixed(1)}`)

      const deltaX = afterX - initialX
      console.log(`Position change: ${deltaX.toFixed(1)} pixels`)

      // Analyze result
      if (Math.abs(afterX - testCase.expectedX) < 0.1) {
        console.log(`✅ PASS: Position correction worked correctly`)
      } else {
        console.log(`❌ FAIL: Position correction failed`)
        console.log(`   Expected: x=${testCase.expectedX.toFixed(1)}`)
        console.log(`   Actual: x=${afterX.toFixed(1)}`)
        console.log(
          `   Error: ${(afterX - testCase.expectedX).toFixed(1)} pixels`
        )
      }

      // Check for boundary violations
      if (afterX < 0 || afterX > 240) {
        console.log(
          `🚨 CRITICAL: Character outside game boundaries (0 ≤ x ≤ 240)`
        )
      }

      // Check collision flags
      const collisionFlags = char_after.collision
      console.log(
        `Collision flags: [${collisionFlags.join(
          ', '
        )}] (top, right, bottom, left)`
      )

      if (afterX + 16 > 240 && !collisionFlags[1]) {
        console.log(`🚨 BUG: Right collision flag not set despite wall overlap`)
      }

      if (afterX < 16 && !collisionFlags[3]) {
        console.log(`🚨 BUG: Left collision flag not set despite wall overlap`)
      }

      console.log('')
    }

    console.log('=== POSITION CORRECTION ALGORITHM ANALYSIS ===')
    console.log(
      'Based on test results, the position correction algorithm has these issues:'
    )
    console.log(
      '1. MAX_CORRECTION_DISTANCE = 32 is too large (allows 2-tile jumps)'
    )
    console.log(
      '2. Always tries left direction first, regardless of overlap direction'
    )
    console.log('3. No boundary checking (can push entities outside game area)')
    console.log(
      '4. Linear search is inefficient (tries every pixel from 1 to 32)'
    )
    console.log('')
    console.log('Recommended fixes:')
    console.log('1. Reduce MAX_CORRECTION_DISTANCE to 8 pixels (half a tile)')
    console.log('2. Determine push direction based on overlap location')
    console.log('3. Add boundary checks to prevent out-of-bounds positions')
    console.log('4. Use binary search or calculate exact correction distance')
  } catch (error) {
    console.error('Error:', error)
  }
}

testPositionCorrection()
