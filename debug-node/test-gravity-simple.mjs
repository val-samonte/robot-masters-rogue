import init, { GameWrapper } from './wasm_wrapper.js'

async function testGravitySimple() {
  console.log('Testing gravity direction fix (simple)...\n')

  try {
    // Initialize WASM with the .wasm file
    const fs = await import('fs')
    const wasmBytes = fs.readFileSync('./wasm_wrapper_bg.wasm')
    await init(wasmBytes)

    // Use the same configuration format as the working test
    const testConfig = {
      seed: 12345,
      tilemap: Array(15)
        .fill()
        .map(() => Array(16).fill(0)),
      characters: [
        {
          id: 0,
          group: 0,
          position: [
            [3200, 32],
            [3200, 32],
          ], // 100.0, 100.0 as Fixed-point
          size: [16, 16],
          health: 100,
          health_cap: 100,
          energy: 100,
          energy_cap: 100,
          power: 10,
          weight: 100,
          jump_force: [320, 32], // 10.0 as Fixed-point
          move_speed: [96, 32], // 3.0 as Fixed-point
          armor: [100, 100, 100, 100, 100, 100, 100, 100, 100],
          energy_regen: 1,
          energy_regen_rate: 60,
          energy_charge: 5,
          energy_charge_rate: 30,
          dir: [2, 0], // Right-facing, upward gravity (TESTING THE FIX)
          enmity: 0,
          target_id: null,
          target_type: 0,
          behaviors: [],
        },
      ],
      actions: [],
      conditions: [],
      spawns: [],
      status_effects: [],
    }

    const gameWrapper = new GameWrapper(JSON.stringify(testConfig))
    gameWrapper.new_game()

    console.log('Initial character state:')
    const initialChar = JSON.parse(gameWrapper.get_characters_json())[0]
    console.log(
      `Initial dir: [${initialChar.dir[0]}, ${initialChar.dir[1]}] (horizontal, vertical)`
    )
    console.log(
      `Initial velocity Y: ${
        initialChar.velocity[1][0] / initialChar.velocity[1][1]
      }`
    )

    console.log('\nRunning 5 frames to test gravity behavior...')

    // Run frames and track velocity changes
    for (let frame = 1; frame <= 5; frame++) {
      gameWrapper.step_frame()
      const chars = JSON.parse(gameWrapper.get_characters_json())
      const char = chars[0]

      // Convert Fixed-point to decimal for display
      const vel_y = char.velocity[1][0] / char.velocity[1][1]
      const pos_y = char.position[1][0] / char.position[1][1]
      console.log(
        `Frame ${frame}: vel_y=${vel_y.toFixed(3)}, pos_y=${pos_y.toFixed(1)}`
      )
    }

    const finalChar = JSON.parse(gameWrapper.get_characters_json())[0]

    console.log('\nTest Results:')
    const final_vel_y = finalChar.velocity[1][0] / finalChar.velocity[1][1]
    console.log(`Final velocity Y: ${final_vel_y.toFixed(3)}`)
    console.log(
      `Character dir.1: ${finalChar.dir[1]} (0=upward, 1=neutral, 2=downward)`
    )

    if (finalChar.dir[1] === 0 && final_vel_y < 0) {
      console.log(
        '✅ PASS: Upward gravity character has negative velocity (falling upward)'
      )
      console.log('🎉 Gravity direction fix is working correctly!')
    } else if (finalChar.dir[1] === 0 && final_vel_y >= 0) {
      console.log(
        '❌ FAIL: Upward gravity character should have negative velocity'
      )
      console.log('⚠️  The gravity direction logic still has issues.')
    } else {
      console.log('ℹ️  Character gravity direction changed during test')
    }

    // Test with downward gravity for comparison
    console.log('\n--- Testing downward gravity for comparison ---')

    const testConfig2 = {
      ...testConfig,
      characters: [
        {
          ...testConfig.characters[0],
          dir: [2, 2], // Right-facing, downward gravity (normal)
        },
      ],
    }

    const gameWrapper2 = new GameWrapper(JSON.stringify(testConfig2))
    gameWrapper2.new_game()

    // Run a few frames
    for (let frame = 1; frame <= 3; frame++) {
      gameWrapper2.step_frame()
    }

    const downwardChar = JSON.parse(gameWrapper2.get_characters_json())[0]
    const downward_vel_y =
      downwardChar.velocity[1][0] / downwardChar.velocity[1][1]

    console.log(
      `Downward gravity character (dir.1=2): vel_y=${downward_vel_y.toFixed(3)}`
    )

    if (downward_vel_y > 0) {
      console.log(
        '✅ PASS: Downward gravity character has positive velocity (falling downward)'
      )
    } else {
      console.log(
        '❌ FAIL: Downward gravity character should have positive velocity'
      )
    }
  } catch (error) {
    console.error('❌ Error testing gravity fix:', error)
  }
}

testGravitySimple().catch(console.error)
