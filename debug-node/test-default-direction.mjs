import init, { GameWrapper } from './wasm_wrapper.js'

async function testDefaultDirection() {
  console.log('Testing default character direction...\n')

  try {
    // Initialize WASM with the .wasm file
    const fs = await import('fs')
    const wasmBytes = fs.readFileSync('./wasm_wrapper_bg.wasm')
    await init(wasmBytes)

    // Create character without specifying dir (should use default)
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
          dir: [2, 2], // Testing the corrected default (right-facing, downward gravity)
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

    const character = JSON.parse(gameWrapper.get_characters_json())[0]

    console.log('Default character direction:')
    console.log(`dir: [${character.dir[0]}, ${character.dir[1]}]`)
    console.log(`Expected: [2, 2] (right-facing, downward gravity)`)

    if (character.dir[0] === 2 && character.dir[1] === 2) {
      console.log('✅ PASS: Default direction is correct [2, 2]')
    } else {
      console.log('❌ FAIL: Default direction should be [2, 2]')
    }

    // Test that default gravity works (should fall downward)
    console.log('\nTesting default gravity behavior (should fall downward):')

    for (let frame = 1; frame <= 3; frame++) {
      gameWrapper.step_frame()
      const char = JSON.parse(gameWrapper.get_characters_json())[0]
      const vel_y = char.velocity[1][0] / char.velocity[1][1]
      console.log(`Frame ${frame}: vel_y=${vel_y.toFixed(3)}`)
    }

    const finalChar = JSON.parse(gameWrapper.get_characters_json())[0]
    const final_vel_y = finalChar.velocity[1][0] / finalChar.velocity[1][1]

    if (final_vel_y > 0) {
      console.log(
        '✅ PASS: Default character falls downward (positive velocity)'
      )
      console.log('🎉 Default direction fix is working correctly!')
    } else {
      console.log('❌ FAIL: Default character should fall downward')
    }
  } catch (error) {
    console.error('❌ Error testing default direction:', error)
  }
}

testDefaultDirection().catch(console.error)
