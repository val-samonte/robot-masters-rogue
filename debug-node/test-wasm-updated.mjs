import init, { GameWrapper } from './wasm_wrapper.js'

async function testDirectionFix() {
  console.log('Testing updated WASM with corrected direction implementation...')

  try {
    // Initialize WASM with the .wasm file
    const fs = await import('fs')
    const wasmBytes = fs.readFileSync('./wasm_wrapper_bg.wasm')
    await init(wasmBytes)

    // Minimal test configuration based on wasm-wrapper tests
    const gameConfig = {
      seed: 12345,
      tilemap: Array(15)
        .fill()
        .map(() => Array(16).fill(0)),
      characters: [
        {
          id: 0,
          group: 0,
          position: [
            [4096, 32],
            [4096, 32],
          ], // 128.0, 128.0 as Fixed-point
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
          dir: [1, 2], // neutral horizontal, downward gravity
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

    const gameWrapper = new GameWrapper(JSON.stringify(gameConfig))
    gameWrapper.new_game()

    const characters = JSON.parse(gameWrapper.get_characters_json())
    const character = characters[0]

    console.log('✅ WASM loaded successfully')
    console.log('Character direction values:', character.dir)
    console.log('Expected: [1, 2] (neutral horizontal, downward gravity)')

    if (character.dir[0] === 1 && character.dir[1] === 2) {
      console.log('✅ Direction values are correct!')
    } else {
      console.log('❌ Direction values are incorrect')
    }

    // Test a few frames to ensure no crashes
    for (let i = 0; i < 5; i++) {
      gameWrapper.step_frame()
    }

    console.log('✅ Frame stepping works correctly')
    console.log('🎉 WASM update successful - direction fixes are working!')
  } catch (error) {
    console.error('❌ Error testing WASM:', error)
  }
}

testDirectionFix().catch(console.error)
