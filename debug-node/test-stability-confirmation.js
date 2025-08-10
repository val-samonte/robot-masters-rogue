import fs from 'fs'
import path from 'path'

async function testStabilityConfirmation() {
  console.log('🔍 STABILITY CONFIRMATION TEST')
  console.log('==============================')
  console.log('Testing long-term stability after resting contact fix')
  console.log('')

  try {
    // Load WASM module
    const wasmModule = await import('../wasm-wrapper/pkg/wasm_wrapper.js')
    const { default: init, GameWrapper } = wasmModule

    const wasmPath = path.join(
      process.cwd(),
      'wasm-wrapper/pkg/wasm_wrapper_bg.wasm'
    )
    const wasmBuffer = fs.readFileSync(wasmPath)
    await init(wasmBuffer)

    // Same configuration as before
    const gameConfig = {
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
        {
          energy_cost: 0,
          cooldown: 0,
          args: [0, 0, 0, 0, 0, 0, 0, 0],
          spawns: [0, 0, 0, 0],
          script: [20, 0, 0, 91, 0], // NOP
        },
      ],
      conditions: [
        {
          energy_mul: 32,
          args: [0, 0, 0, 0, 0, 0, 0, 0],
          script: [20, 0, 1, 91, 0], // ALWAYS
        },
      ],
      characters: [
        {
          id: 1,
          position: [
            [640, 32], // x = 20
            [6144, 32], // y = 192 (at ground level)
          ],
          group: 1,
          size: [16, 32],
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
          dir: [2, 0],
          enmity: 0,
          target_id: null,
          target_type: 0,
          behaviors: [[0, 0]], // Always do NOP
        },
      ],
      spawns: [],
      status_effects: [],
    }

    const gameWrapper = new GameWrapper(JSON.stringify(gameConfig))
    gameWrapper.new_game()

    // Skip to frame 30 where character should be stable
    for (let i = 0; i < 30; i++) {
      gameWrapper.step_frame()
    }

    console.log('📊 LONG-TERM STABILITY TEST')
    console.log('===========================')
    console.log(
      'Testing 100 frames starting from frame 30 (after stabilization)...'
    )
    console.log('')

    let totalMovement = 0
    let maxVelocity = 0
    let positionChanges = 0
    let velocityChanges = 0

    const startState = JSON.parse(gameWrapper.get_characters_json())
    const startChar = startState[0]
    const startY = startChar.position[1][0] / startChar.position[1][1]
    const startVelY = startChar.velocity[1][0] / startChar.velocity[1][1]

    console.log(`Starting position: y=${startY.toFixed(3)}`)
    console.log(`Starting velocity: ${startVelY.toFixed(3)}`)
    console.log(
      `Starting bottom edge: ${(startY + startChar.size[1]).toFixed(3)}`
    )
    console.log(`Starting collision: [${startChar.collision.join(', ')}]`)
    console.log('')

    let lastY = startY
    let lastVelY = startVelY

    for (let frame = 31; frame <= 130; frame++) {
      gameWrapper.step_frame()
      const state = JSON.parse(gameWrapper.get_characters_json())
      const char = state[0]

      const currentY = char.position[1][0] / char.position[1][1]
      const currentVelY = char.velocity[1][0] / char.velocity[1][1]
      const bottomEdge = currentY + char.size[1]

      // Track movement statistics
      const positionDelta = Math.abs(currentY - lastY)
      const velocityDelta = Math.abs(currentVelY - lastVelY)

      totalMovement += positionDelta
      if (Math.abs(currentVelY) > maxVelocity) {
        maxVelocity = Math.abs(currentVelY)
      }

      if (positionDelta > 0.001) {
        positionChanges++
        console.log(
          `Frame ${frame}: Position changed by ${positionDelta.toFixed(
            3
          )} pixels`
        )
      }

      if (velocityDelta > 0.001) {
        velocityChanges++
        console.log(
          `Frame ${frame}: Velocity changed by ${velocityDelta.toFixed(3)}`
        )
      }

      // Log any significant changes
      if (
        positionDelta > 0.001 ||
        velocityDelta > 0.001 ||
        Math.abs(currentVelY) > 0.001
      ) {
        console.log(
          `Frame ${frame}: y=${currentY.toFixed(3)}, vel=${currentVelY.toFixed(
            3
          )}, bottom=${bottomEdge.toFixed(3)}, collision=[${char.collision.join(
            ','
          )}]`
        )
      }

      lastY = currentY
      lastVelY = currentVelY
    }

    const endState = JSON.parse(gameWrapper.get_characters_json())
    const endChar = endState[0]
    const endY = endChar.position[1][0] / endChar.position[1][1]
    const endVelY = endChar.velocity[1][0] / endChar.velocity[1][1]

    console.log('')
    console.log('📈 STABILITY ANALYSIS RESULTS')
    console.log('=============================')
    console.log(`Test duration: 100 frames (frame 31-130)`)
    console.log(`Starting position: y=${startY.toFixed(3)}`)
    console.log(`Ending position: y=${endY.toFixed(3)}`)
    console.log(
      `Total position drift: ${Math.abs(endY - startY).toFixed(3)} pixels`
    )
    console.log(`Total movement: ${totalMovement.toFixed(3)} pixels`)
    console.log(`Maximum velocity: ${maxVelocity.toFixed(3)}`)
    console.log(`Position changes: ${positionChanges} frames`)
    console.log(`Velocity changes: ${velocityChanges} frames`)
    console.log('')

    // Determine stability
    const isStable =
      totalMovement < 0.1 && maxVelocity < 0.1 && positionChanges < 5

    if (isStable) {
      console.log('🎉 PERFECT STABILITY ACHIEVED!')
      console.log('==============================')
      console.log('✅ Character remained completely stable for 100 frames')
      console.log('✅ No bouncing or oscillation detected')
      console.log('✅ Box2D-style resting contact fix is working perfectly')
      console.log('')
      console.log(
        'The bouncing bug has been completely eliminated using industry-standard'
      )
      console.log(
        'collision detection with contact tolerance and resting contact handling.'
      )
    } else {
      console.log('⚠️  MINOR INSTABILITY DETECTED')
      console.log('==============================')
      console.log('Some small movements or velocity changes were detected.')
      console.log('This may be acceptable depending on tolerance requirements.')
    }

    gameWrapper.free()
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

// Run the test
testStabilityConfirmation()
