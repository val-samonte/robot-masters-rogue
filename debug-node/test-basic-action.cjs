/**
 * Test basic action execution - Task 23 debugging
 *
 * Simple test to verify that ALWAYS condition + basic action works
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

// BASIC TEST - ALWAYS condition + SET_ENERGY action
const BASIC_TEST_CONFIG = {
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
    // Action 0: SET_ENERGY_TO_42
    {
      energy_cost: 0,
      cooldown: 0,
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      spawns: [0, 0, 0, 0],
      script: [
        20,
        0,
        42, // ASSIGN_BYTE vars[0] = 42
        16,
        0x1a,
        0, // WRITE_PROP CHARACTER_ENERGY = vars[0]
        0,
        1, // EXIT 1
      ],
    },
  ],
  conditions: [
    // Condition 0: ALWAYS
    {
      energy_mul: 32,
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      script: [
        20,
        0,
        1, // ASSIGN_BYTE vars[0] = 1
        91,
        0, // EXIT_WITH_VAR vars[0]
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
        [0, 0], // ALWAYS -> SET_ENERGY_TO_42 (single behavior)
      ],
    },
  ],
  spawns: [],
  status_effects: [],
}

console.log('=== BASIC ACTION EXECUTION TEST ===')
console.log('Testing if ALWAYS condition + SET_ENERGY action works')
console.log()

try {
  // Create game wrapper
  const gameWrapper = new GameWrapper(JSON.stringify(BASIC_TEST_CONFIG))
  gameWrapper.new_game()

  console.log('Initial state:')
  const initialState = JSON.parse(gameWrapper.get_characters_json())
  const initialChar = extractCharacterState(initialState[0])

  console.log(`  Energy: ${initialChar.energy} (should be 0 initially)`)
  console.log()

  // Test first 3 frames
  for (let frame = 1; frame <= 3; frame++) {
    const beforeState = JSON.parse(gameWrapper.get_characters_json())
    const beforeChar = extractCharacterState(beforeState[0])

    gameWrapper.step_frame()

    const afterState = JSON.parse(gameWrapper.get_characters_json())
    const afterChar = extractCharacterState(afterState[0])

    console.log(`Frame ${frame}:`)
    console.log(`  Before: energy=${beforeChar.energy}`)
    console.log(`  After:  energy=${afterChar.energy}`)

    // Analyze what happened
    if (afterChar.energy === 42) {
      console.log(`  ✅ Action executed: energy set to 42`)
    } else {
      console.log(`  ❌ Action NOT executed: energy unchanged`)
    }

    console.log()
  }

  console.log('=== ANALYSIS ===')

  const finalState = JSON.parse(gameWrapper.get_characters_json())
  const finalChar = extractCharacterState(finalState[0])

  console.log(`Final energy: ${finalChar.energy}`)

  if (finalChar.energy === 42) {
    console.log('✅ SUCCESS: Basic action execution is working!')
  } else {
    console.log('❌ FAILURE: Basic action execution is broken!')
  }
} catch (error) {
  console.error('Error during test:', error)
  console.error('Stack trace:', error.stack)
}
