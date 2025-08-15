import init, { GameWrapper } from './wasm_wrapper.js'

/**
 * SIMPLE GRAVITY DIRECTIONS TEST
 *
 * Focused test for Task 3 requirements:
 * - Test upward gravity (dir.1=0) produces negative velocity changes
 * - Test downward gravity (dir.1=2) produces positive velocity changes
 * - Test neutral gravity (dir.1=1) produces no velocity changes
 */

async function testGravityDirections() {
  console.log('🧪 SIMPLE GRAVITY DIRECTIONS TEST')
  console.log('Testing each gravity direction individually...\n')

  try {
    // Initialize WASM
    const fs = await import('fs')
    const wasmBytes = fs.readFileSync('./wasm_wrapper_bg.wasm')
    await init(wasmBytes)

    // Test each gravity direction
    const gravityTests = [
      { dir: 0, name: 'UPWARD', expected: 'negative' },
      { dir: 1, name: 'NEUTRAL', expected: 'zero' },
      { dir: 2, name: 'DOWNWARD', expected: 'positive' },
    ]

    for (const test of gravityTests) {
      console.log(`🔍 Testing ${test.name} gravity (dir.1=${test.dir})`)

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
            ], // 100.0, 100.0
            size: [16, 16],
            health: 100,
            health_cap: 100,
            energy: 100,
            energy_cap: 100,
            power: 10,
            weight: 100,
            jump_force: [320, 32],
            move_speed: [96, 32],
            armor: [100, 100, 100, 100, 100, 100, 100, 100, 100],
            energy_regen: 1,
            energy_regen_rate: 60,
            energy_charge: 5,
            energy_charge_rate: 30,
            dir: [2, test.dir], // Test specific gravity direction
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

      // Get initial state
      const initialChar = JSON.parse(gameWrapper.get_characters_json())[0]
      const initialVel = initialChar.velocity[1][0] / initialChar.velocity[1][1]

      // Run 5 frames
      for (let frame = 1; frame <= 5; frame++) {
        gameWrapper.step_frame()
      }

      // Get final state
      const finalChar = JSON.parse(gameWrapper.get_characters_json())[0]
      const finalVel = finalChar.velocity[1][0] / finalChar.velocity[1][1]
      const velocityChange = finalVel - initialVel

      console.log(`  Initial velocity: ${initialVel.toFixed(3)}`)
      console.log(`  Final velocity:   ${finalVel.toFixed(3)}`)
      console.log(`  Velocity change:  ${velocityChange.toFixed(3)}`)

      // Verify expected behavior
      let passed = false
      if (test.dir === 0 && velocityChange < 0) {
        console.log(
          `  ✅ PASS: ${test.name} gravity produces negative velocity change`
        )
        passed = true
      } else if (test.dir === 1 && Math.abs(velocityChange) < 0.01) {
        console.log(
          `  ✅ PASS: ${test.name} gravity produces no velocity change`
        )
        passed = true
      } else if (test.dir === 2 && velocityChange > 0) {
        console.log(
          `  ✅ PASS: ${test.name} gravity produces positive velocity change`
        )
        passed = true
      } else {
        console.log(
          `  ❌ FAIL: ${test.name} gravity should produce ${test.expected} velocity change`
        )
      }

      console.log()
    }

    console.log('🎉 Gravity directions test complete!')
  } catch (error) {
    console.error('❌ Error during gravity directions test:', error)
  }
}

testGravityDirections().catch(console.error)
