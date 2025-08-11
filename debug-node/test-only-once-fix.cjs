/**
 * Test ONLY_ONCE condition fix - Task 23 debugging
 *
 * Simple test to verify that ONLY_ONCE condition now returns 1 then 0
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

// TEST CONFIG - ONLY_ONCE with a simple action that does nothing
const ONLY_ONCE_TEST_CONFIG = {
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
    // Action 0: SET_ENERGY_TO_50 (simple action to test execution)
    {
      energy_cost: 0,
      cooldown: 0,
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      spawns: [0, 0, 0, 0],
      script: [
        20,
        0,
        50, // ASSIGN_BYTE vars[0] = 50
        16,
        0x1a,
        0, // WRITE_PROP CHARACTER_ENERGY = vars[0]
        0,
        1, // EXIT 1
      ],
    },
    // Action 1: SET_ENERGY_TO_75 (different action to test second behavior)
    {
      energy_cost: 0,
      cooldown: 0,
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      spawns: [0, 0, 0, 0],
      script: [
        20,
        0,
        75, // ASSIGN_BYTE vars[0] = 75
        16,
        0x1a,
        0, // WRITE_PROP CHARACTER_ENERGY = vars[0]
        0,
        1, // EXIT 1
      ],
    },
  ],
  conditions: [
    // Condition 0: ONLY_ONCE
    {
      energy_mul: 32,
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      script: [
        20,
        1,
        1, // ASSIGN_BYTE vars[1] = 1
        50,
        2,
        0,
        1, // EQUAL vars[2] = (vars[0] == 1)
        60,
        3,
        2, // NOT vars[3] = !vars[2]
        20,
        0,
        1, // ASSIGN_BYTE vars[0] = 1 (mark as used)
        91,
        3, // EXIT_WITH_VAR vars[3]
      ],
    },
    // Condition 1: ALWAYS
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
      energy: 100, // Start with 100 energy
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
        [0, 0], // ONLY_ONCE -> SET_ENERGY_TO_50 (highest priority)
        [1, 1], // ALWAYS -> SET_ENERGY_TO_75 (lowest priority)
      ],
    },
  ],
  spawns: [],
  status_effects: [],
}

console.log('=== ONLY_ONCE CONDITION FIX TEST ===')
console.log('Testing if ONLY_ONCE condition now returns 1 then 0')
console.log()

try {
  // Create game wrapper
  const gameWrapper = new GameWrapper(JSON.stringify(ONLY_ONCE_TEST_CONFIG))
  gameWrapper.new_game()

  console.log('Initial state:')
  const initialState = JSON.parse(gameWrapper.get_characters_json())
  const initialChar = extractCharacterState(initialState[0])

  console.log(`  Energy: ${initialChar.energy} (should be 100 initially)`)
  console.log(
    `  Behaviors: [[0,0],[1,1]] - ONLY_ONCE->SET_ENERGY_TO_50, ALWAYS->SET_ENERGY_TO_75`
  )
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
    if (beforeChar.energy !== afterChar.energy) {
      if (afterChar.energy === 50) {
        console.log(
          `  ✅ ONLY_ONCE -> SET_ENERGY_TO_50 executed (condition returned 1)`
        )
      } else if (afterChar.energy === 75) {
        console.log(
          `  ✅ ALWAYS -> SET_ENERGY_TO_75 executed (ONLY_ONCE returned 0, ALWAYS returned 1)`
        )
      } else {
        console.log(
          `  ❓ Unexpected energy change: ${beforeChar.energy} -> ${afterChar.energy}`
        )
      }
    } else {
      console.log(`  ❌ No action executed (no energy change)`)
    }

    console.log()
  }

  console.log('=== ANALYSIS ===')

  const finalState = JSON.parse(gameWrapper.get_characters_json())
  const finalChar = extractCharacterState(finalState[0])

  console.log(`Final energy: ${finalChar.energy}`)

  if (finalChar.energy === 75) {
    console.log('🎉 SUCCESS: ONLY_ONCE condition fix is working!')
    console.log('✅ Frame 1: ONLY_ONCE returned 1 -> SET_ENERGY_TO_50 executed')
    console.log(
      '✅ Frame 2+: ONLY_ONCE returned 0, ALWAYS returned 1 -> SET_ENERGY_TO_75 executed'
    )
  } else if (finalChar.energy === 50) {
    console.log('❌ PARTIAL: ONLY_ONCE works but ALWAYS never executes')
    console.log('✅ Frame 1: ONLY_ONCE returned 1 -> SET_ENERGY_TO_50 executed')
    console.log('❌ Frame 2+: ONLY_ONCE still returning 1 (bug not fixed)')
  } else {
    console.log('❌ FAILURE: Unexpected behavior')
  }
} catch (error) {
  console.error('Error during test:', error)
  console.error('Stack trace:', error.stack)
}
