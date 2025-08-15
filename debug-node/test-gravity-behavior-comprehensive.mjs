import init, { GameWrapper } from './wasm_wrapper.js'

/**
 * COMPREHENSIVE GRAVITY BEHAVIOR VERIFICATION SCRIPT
 *
 * This script implements Task 3 from the gravity-direction-fix spec:
 * - Tests upward gravity (dir.1=0) produces negative velocity changes
 * - Tests downward gravity (dir.1=2) produces positive velocity changes
 * - Tests neutral gravity (dir.1=1) produces no velocity changes
 * - Logs frame-by-frame velocity changes to verify correct physics
 *
 * Requirements tested: 1.1, 1.2, 1.3, 1.4, 1.5
 */

async function testGravityBehaviorComprehensive() {
  console.log('🧪 COMPREHENSIVE GRAVITY BEHAVIOR VERIFICATION')
  console.log('='.repeat(50))
  console.log('Testing Requirements 1.1-1.5 from gravity-direction-fix spec\n')

  try {
    // Initialize WASM with the .wasm file
    const fs = await import('fs')
    const wasmBytes = fs.readFileSync('./wasm_wrapper_bg.wasm')
    await init(wasmBytes)

    // Test configuration with three characters having different gravity directions
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
          dir: [2, 0], // Right-facing, UPWARD gravity (dir.1=0)
          enmity: 0,
          target_id: null,
          target_type: 0,
          behaviors: [],
        },
        {
          id: 1,
          group: 0,
          position: [
            [6400, 32],
            [3200, 32],
          ], // 200.0, 100.0 as Fixed-point
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
          dir: [2, 1], // Right-facing, NEUTRAL gravity (dir.1=1)
          enmity: 0,
          target_id: null,
          target_type: 0,
          behaviors: [],
        },
        {
          id: 2,
          group: 0,
          position: [
            [9600, 32],
            [3200, 32],
          ], // 300.0, 100.0 as Fixed-point
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
          dir: [2, 2], // Right-facing, DOWNWARD gravity (dir.1=2)
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

    console.log('📋 TEST SETUP:')
    console.log('Global gravity: 0.5 (positive = downward force)')
    console.log('Character configurations:')
    console.log(
      '  Character 0: dir.1=0 (UPWARD gravity) - Should fall upward (negative velocity)'
    )
    console.log(
      '  Character 1: dir.1=1 (NEUTRAL gravity) - Should have no gravity effect (zero velocity)'
    )
    console.log(
      '  Character 2: dir.1=2 (DOWNWARD gravity) - Should fall downward (positive velocity)'
    )
    console.log()

    // Initialize game
    const gameWrapper = new GameWrapper(JSON.stringify(testConfig))
    gameWrapper.new_game()

    // Display initial state
    console.log('🚀 INITIAL STATE:')
    const initialChars = JSON.parse(gameWrapper.get_characters_json())
    initialChars.forEach((char, i) => {
      const gravityType =
        char.dir[1] === 0
          ? 'UPWARD'
          : char.dir[1] === 1
          ? 'NEUTRAL'
          : 'DOWNWARD'
      const pos_x = char.position[0][0] / char.position[0][1]
      const pos_y = char.position[1][0] / char.position[1][1]
      const vel_x = char.velocity[0][0] / char.velocity[0][1]
      const vel_y = char.velocity[1][0] / char.velocity[1][1]
      console.log(
        `  Char ${i} (${gravityType}): pos=[${pos_x.toFixed(
          1
        )}, ${pos_y.toFixed(1)}], vel=[${vel_x.toFixed(1)}, ${vel_y.toFixed(
          1
        )}], dir=[${char.dir[0]}, ${char.dir[1]}]`
      )
    })
    console.log()

    // Track velocity changes frame by frame
    console.log('📊 FRAME-BY-FRAME VELOCITY ANALYSIS:')
    console.log(
      'Frame | Char 0 (UPWARD)  | Char 1 (NEUTRAL) | Char 2 (DOWNWARD)'
    )
    console.log(
      '------|------------------|------------------|------------------'
    )

    const velocityHistory = [[], [], []] // Track velocity history for each character
    const NUM_FRAMES = 15 // Test over 15 frames to see clear patterns

    for (let frame = 1; frame <= NUM_FRAMES; frame++) {
      gameWrapper.step_frame()
      const chars = JSON.parse(gameWrapper.get_characters_json())

      // Format frame data
      const frameData = chars.map((char, i) => {
        const vel_y = char.velocity[1][0] / char.velocity[1][1]
        velocityHistory[i].push(vel_y)
        return vel_y.toFixed(3).padStart(8)
      })

      console.log(
        `${frame.toString().padStart(5)} | ${frameData[0]}         | ${
          frameData[1]
        }          | ${frameData[2]}`
      )
    }

    console.log()

    // Analyze results
    console.log('🔍 DETAILED ANALYSIS:')
    const finalChars = JSON.parse(gameWrapper.get_characters_json())

    finalChars.forEach((char, i) => {
      const gravityType =
        char.dir[1] === 0
          ? 'UPWARD'
          : char.dir[1] === 1
          ? 'NEUTRAL'
          : 'DOWNWARD'
      const initialVel = velocityHistory[i][0]
      const finalVel = velocityHistory[i][velocityHistory[i].length - 1]
      const velocityChange = finalVel - initialVel
      const pos_y = char.position[1][0] / char.position[1][1]

      console.log(
        `\nCharacter ${i} (${gravityType} gravity, dir.1=${char.dir[1]}):`
      )
      console.log(`  Initial velocity Y: ${initialVel.toFixed(3)}`)
      console.log(`  Final velocity Y:   ${finalVel.toFixed(3)}`)
      console.log(`  Velocity change:    ${velocityChange.toFixed(3)}`)
      console.log(`  Final position Y:   ${pos_y.toFixed(1)}`)

      // Check if velocity is consistently changing in expected direction
      const velocityTrend = velocityHistory[i]
        .slice(1)
        .map((vel, idx) => vel - velocityHistory[i][idx])
      const avgChange =
        velocityTrend.reduce((sum, change) => sum + change, 0) /
        velocityTrend.length
      console.log(`  Avg velocity change per frame: ${avgChange.toFixed(4)}`)
    })

    console.log()

    // Requirement verification
    console.log('✅ REQUIREMENT VERIFICATION:')
    let testsPassed = 0
    let totalTests = 5

    // Requirement 1.1: WHEN a character has dir.1 = 0 (upward gravity) THEN the character SHALL fall upward (negative velocity)
    const upwardChar = finalChars[0]
    const upwardVel = upwardChar.velocity[1][0] / upwardChar.velocity[1][1]
    if (upwardChar.dir[1] === 0 && upwardVel < 0) {
      console.log(
        '✅ REQ 1.1 PASS: Upward gravity character (dir.1=0) has negative velocity'
      )
      testsPassed++
    } else {
      console.log(
        `❌ REQ 1.1 FAIL: Upward gravity character should have negative velocity, got: ${upwardVel.toFixed(
          3
        )}`
      )
    }

    // Requirement 1.2: WHEN a character has dir.1 = 1 (neutral gravity) THEN the character SHALL not be affected by gravity (zero velocity change)
    const neutralChar = finalChars[1]
    const neutralVelChange =
      velocityHistory[1][velocityHistory[1].length - 1] - velocityHistory[1][0]
    if (neutralChar.dir[1] === 1 && Math.abs(neutralVelChange) < 0.01) {
      console.log(
        '✅ REQ 1.2 PASS: Neutral gravity character (dir.1=1) has no velocity change'
      )
      testsPassed++
    } else {
      console.log(
        `❌ REQ 1.2 FAIL: Neutral gravity character should have zero velocity change, got: ${neutralVelChange.toFixed(
          3
        )}`
      )
    }

    // Requirement 1.3: WHEN a character has dir.1 = 2 (downward gravity) THEN the character SHALL fall downward (positive velocity)
    const downwardChar = finalChars[2]
    const downwardVel =
      downwardChar.velocity[1][0] / downwardChar.velocity[1][1]
    if (downwardChar.dir[1] === 2 && downwardVel > 0) {
      console.log(
        '✅ REQ 1.3 PASS: Downward gravity character (dir.1=2) has positive velocity'
      )
      testsPassed++
    } else {
      console.log(
        `❌ REQ 1.3 FAIL: Downward gravity character should have positive velocity, got: ${downwardVel.toFixed(
          3
        )}`
      )
    }

    // Requirement 1.4: WHEN the global gravity value is positive THEN downward gravity SHALL result in positive velocity change
    const downwardVelChange =
      velocityHistory[2][velocityHistory[2].length - 1] - velocityHistory[2][0]
    if (downwardVelChange > 0) {
      console.log(
        '✅ REQ 1.4 PASS: Positive global gravity produces positive velocity change for downward gravity'
      )
      testsPassed++
    } else {
      console.log(
        `❌ REQ 1.4 FAIL: Positive global gravity should produce positive velocity change for downward gravity, got: ${downwardVelChange.toFixed(
          3
        )}`
      )
    }

    // Requirement 1.5: WHEN the global gravity value is positive THEN upward gravity SHALL result in negative velocity change
    const upwardVelChange =
      velocityHistory[0][velocityHistory[0].length - 1] - velocityHistory[0][0]
    if (upwardVelChange < 0) {
      console.log(
        '✅ REQ 1.5 PASS: Positive global gravity produces negative velocity change for upward gravity'
      )
      testsPassed++
    } else {
      console.log(
        `❌ REQ 1.5 FAIL: Positive global gravity should produce negative velocity change for upward gravity, got: ${upwardVelChange.toFixed(
          3
        )}`
      )
    }

    console.log()

    // Final summary
    console.log('📈 PHYSICS VERIFICATION SUMMARY:')
    console.log(`Tests passed: ${testsPassed}/${totalTests}`)
    console.log()

    if (testsPassed === totalTests) {
      console.log('🎉 ALL GRAVITY BEHAVIOR TESTS PASSED!')
      console.log('✅ The gravity direction fix is working correctly')
      console.log('✅ All requirements (1.1-1.5) are satisfied')
      console.log('✅ Physics behave as expected for all gravity directions')
    } else {
      console.log('⚠️  SOME TESTS FAILED!')
      console.log('❌ The gravity direction logic may still have issues')
      console.log('❌ Review the get_gravity_multiplier() implementation')
    }

    console.log()
    console.log('📝 EXPECTED PHYSICS BEHAVIOR:')
    console.log(
      '- Upward gravity (dir.1=0): gravity_multiplier = -1, velocity becomes negative (falls up)'
    )
    console.log(
      '- Neutral gravity (dir.1=1): gravity_multiplier = 0, velocity unchanged (no gravity)'
    )
    console.log(
      '- Downward gravity (dir.1=2): gravity_multiplier = +1, velocity becomes positive (falls down)'
    )
    console.log(
      '- Formula: new_velocity = old_velocity + (global_gravity × gravity_multiplier)'
    )
  } catch (error) {
    console.error('❌ Error during comprehensive gravity behavior test:', error)
  }
}

testGravityBehaviorComprehensive().catch(console.error)
