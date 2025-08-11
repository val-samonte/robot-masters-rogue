/**
 * Debug condition instance reuse - Task 23 debugging
 *
 * Test to see if condition instances are being reused correctly
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

// SIMPLE TEST - condition that increments a counter each time it's called
const COUNTER_TEST_CONFIG = {
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
    // Action 0: SET_ENERGY_TO_COUNTER (sets energy to the counter value)
    {
      energy_cost: 0,
      cooldown: 0,
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      spawns: [0, 0, 0, 0],
      script: [
        16,
        0x1a,
        0, // WRITE_PROP CHARACTER_ENERGY = vars[0] (counter value)
        0,
        1, // EXIT 1
      ],
    },
  ],
  conditions: [
    // Condition 0: COUNTER - increments vars[0] each time, always returns true
    {
      energy_mul: 32,
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      script: [
        40,
        0,
        0,
        1, // ADD_BYTE vars[0] = vars[0] + 1 (increment counter)
        20,
        1,
        1, // ASSIGN_BYTE vars[1] = 1 (always return true)
        91,
        1, // EXIT_WITH_VAR vars[1]
      ],
    },
  ],
  characters: [
    {
      id: 1,
      position: [
        [128, 1],
        [128, 1],
      ],
      group: 1,
      size: [16, 32],
      health: 100,
      health_cap: 100,
      energy: 0, // Start with 0 energy
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
      dir: [2, 0],
      enmity: 0,
      target_id: null,
      target_type: 0,
      behaviors: [
        [0, 0], // COUNTER -> SET_ENERGY_TO_COUNTER (single behavior)
      ],
    },
  ],
  spawns: [],
  status_effects: [],
}

console.log('=== CONDITION INSTANCE DEBUG TEST ===')
console.log('Testing if condition instances maintain state between frames')
console.log(
  'Counter condition should increment vars[0] each frame and set energy to that value'
)
console.log()

try {
  // Create game wrapper
  const gameWrapper = new GameWrapper(JSON.stringify(COUNTER_TEST_CONFIG))
  gameWrapper.new_game()

  console.log('Initial state:')
  const initialState = JSON.parse(gameWrapper.get_characters_json())
  const initialChar = extractCharacterState(initialState[0])

  console.log(`  Energy: ${initialChar.energy} (should be 0 initially)`)
  console.log()

  // Test first 10 frames
  for (let frame = 1; frame <= 10; frame++) {
    const beforeState = JSON.parse(gameWrapper.get_characters_json())
    const beforeChar = extractCharacterState(beforeState[0])

    gameWrapper.step_frame()

    const afterState = JSON.parse(gameWrapper.get_characters_json())
    const afterChar = extractCharacterState(afterState[0])

    console.log(`Frame ${frame}:`)
    console.log(`  Before: energy=${beforeChar.energy}`)
    console.log(`  After:  energy=${afterChar.energy}`)

    // Analyze what happened
    if (afterChar.energy === frame) {
      console.log(
        `  ✅ Counter working: energy = ${afterChar.energy} (expected ${frame})`
      )
    } else {
      console.log(
        `  ❌ Counter broken: energy = ${afterChar.energy} (expected ${frame})`
      )
    }

    console.log()
  }

  console.log('=== ANALYSIS ===')

  const finalState = JSON.parse(gameWrapper.get_characters_json())
  const finalChar = extractCharacterState(finalState[0])

  console.log(`Final energy: ${finalChar.energy}`)

  if (finalChar.energy === 10) {
    console.log(
      '🎉 SUCCESS: Condition instances are maintaining state correctly!'
    )
    console.log('✅ Counter incremented from 1 to 10 across frames')
    console.log('✅ Condition instance reuse is working')
  } else if (finalChar.energy === 1) {
    console.log('❌ FAILURE: Condition instances are NOT maintaining state')
    console.log('❌ Counter resets to 1 every frame (new instances created)')
    console.log('❌ Condition instance reuse is broken')
  } else {
    console.log(`❓ UNEXPECTED: Final energy is ${finalChar.energy}`)
  }
} catch (error) {
  console.error('Error during test:', error)
  console.error('Stack trace:', error.stack)
}
