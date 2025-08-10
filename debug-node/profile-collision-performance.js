/**
 * Collision Detection Performance Profiler
 *
 * Tests collision detection performance with multiple entities
 * to identify bottlenecks and measure frame processing times.
 */

import fs from 'fs'
import path from 'path'

// Performance test configuration with 8 characters
const gameConfig = {
  seed: 12345,
  gravity: [32, 64], // 1.0 in Fixed-point
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
      script: [15, 0, 0x40, 15, 1, 0x1f, 32, 2, 0, 1, 16, 0x14, 2, 0, 1], // RUN
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
    // Character 1 - bouncing between walls
    {
      id: 1,
      position: [
        [32, 1],
        [32, 1],
      ],
      group: 1,
      size: [16, 16],
      health: 100,
      health_cap: 100,
      energy: 100,
      energy_cap: 100,
      power: 10,
      weight: 50,
      jump_force: [320, 64],
      move_speed: [128, 64],
      armor: [0, 0, 0, 0, 0, 0, 0, 0, 0],
      energy_regen: 1,
      energy_regen_rate: 60,
      energy_charge: 5,
      energy_charge_rate: 30,
      dir: [2, 0],
      enmity: 0,
      target_id: null,
      target_type: 0,
      behaviors: [[0, 0]],
    },
    // Character 2 - bouncing between walls (different position)
    {
      id: 2,
      position: [
        [48, 1],
        [48, 1],
      ],
      group: 1,
      size: [16, 16],
      health: 100,
      health_cap: 100,
      energy: 100,
      energy_cap: 100,
      power: 10,
      weight: 50,
      jump_force: [320, 64],
      move_speed: [128, 64],
      armor: [0, 0, 0, 0, 0, 0, 0, 0, 0],
      energy_regen: 1,
      energy_regen_rate: 60,
      energy_charge: 5,
      energy_charge_rate: 30,
      dir: [0, 0],
      enmity: 0,
      target_id: null,
      target_type: 0,
      behaviors: [[0, 0]],
    },
    // Character 3 - bouncing between walls
    {
      id: 3,
      position: [
        [64, 1],
        [64, 1],
      ],
      group: 1,
      size: [16, 16],
      health: 100,
      health_cap: 100,
      energy: 100,
      energy_cap: 100,
      power: 10,
      weight: 50,
      jump_force: [320, 64],
      move_speed: [128, 64],
      armor: [0, 0, 0, 0, 0, 0, 0, 0, 0],
      energy_regen: 1,
      energy_regen_rate: 60,
      energy_charge: 5,
      energy_charge_rate: 30,
      dir: [2, 0],
      enmity: 0,
      target_id: null,
      target_type: 0,
      behaviors: [[0, 0]],
    },
    // Character 4 - bouncing between walls
    {
      id: 4,
      position: [
        [80, 1],
        [80, 1],
      ],
      group: 1,
      size: [16, 16],
      health: 100,
      health_cap: 100,
      energy: 100,
      energy_cap: 100,
      power: 10,
      weight: 50,
      jump_force: [320, 64],
      move_speed: [128, 64],
      armor: [0, 0, 0, 0, 0, 0, 0, 0, 0],
      energy_regen: 1,
      energy_regen_rate: 60,
      energy_charge: 5,
      energy_charge_rate: 30,
      dir: [0, 0],
      enmity: 0,
      target_id: null,
      target_type: 0,
      behaviors: [[0, 0]],
    },
    // Character 5 - bouncing between walls
    {
      id: 5,
      position: [
        [96, 1],
        [96, 1],
      ],
      group: 1,
      size: [16, 16],
      health: 100,
      health_cap: 100,
      energy: 100,
      energy_cap: 100,
      power: 10,
      weight: 50,
      jump_force: [320, 64],
      move_speed: [128, 64],
      armor: [0, 0, 0, 0, 0, 0, 0, 0, 0],
      energy_regen: 1,
      energy_regen_rate: 60,
      energy_charge: 5,
      energy_charge_rate: 30,
      dir: [2, 0],
      enmity: 0,
      target_id: null,
      target_type: 0,
      behaviors: [[0, 0]],
    },
    // Character 6 - bouncing between walls
    {
      id: 6,
      position: [
        [112, 1],
        [112, 1],
      ],
      group: 1,
      size: [16, 16],
      health: 100,
      health_cap: 100,
      energy: 100,
      energy_cap: 100,
      power: 10,
      weight: 50,
      jump_force: [320, 64],
      move_speed: [128, 64],
      armor: [0, 0, 0, 0, 0, 0, 0, 0, 0],
      energy_regen: 1,
      energy_regen_rate: 60,
      energy_charge: 5,
      energy_charge_rate: 30,
      dir: [0, 0],
      enmity: 0,
      target_id: null,
      target_type: 0,
      behaviors: [[0, 0]],
    },
    // Character 7 - bouncing between walls
    {
      id: 7,
      position: [
        [128, 1],
        [128, 1],
      ],
      group: 1,
      size: [16, 16],
      health: 100,
      health_cap: 100,
      energy: 100,
      energy_cap: 100,
      power: 10,
      weight: 50,
      jump_force: [320, 64],
      move_speed: [128, 64],
      armor: [0, 0, 0, 0, 0, 0, 0, 0, 0],
      energy_regen: 1,
      energy_regen_rate: 60,
      energy_charge: 5,
      energy_charge_rate: 30,
      dir: [2, 0],
      enmity: 0,
      target_id: null,
      target_type: 0,
      behaviors: [[0, 0]],
    },
    // Character 8 - bouncing between walls
    {
      id: 8,
      position: [
        [144, 1],
        [144, 1],
      ],
      group: 1,
      size: [16, 16],
      health: 100,
      health_cap: 100,
      energy: 100,
      energy_cap: 100,
      power: 10,
      weight: 50,
      jump_force: [320, 64],
      move_speed: [128, 64],
      armor: [0, 0, 0, 0, 0, 0, 0, 0, 0],
      energy_regen: 1,
      energy_regen_rate: 60,
      energy_charge: 5,
      energy_charge_rate: 30,
      dir: [0, 0],
      enmity: 0,
      target_id: null,
      target_type: 0,
      behaviors: [[0, 0]],
    },
  ],
  spawns: [],
  status_effects: [],
}

async function profileCollisionPerformance() {
  console.log('🔍 COLLISION DETECTION PERFORMANCE PROFILER')
  console.log('============================================')
  console.log(`Testing with ${gameConfig.characters.length} characters`)
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

    // Initialize game
    const gameWrapper = new GameWrapper(JSON.stringify(gameConfig))
    gameWrapper.new_game()

    // Performance metrics
    const frameTimes = []
    const targetFrameTime = 1000 / 60 // 16.67ms for 60 FPS
    let totalFrames = 300 // Test 5 seconds at 60 FPS

    console.log(`Target frame time: ${targetFrameTime.toFixed(2)}ms (60 FPS)`)
    console.log(`Testing ${totalFrames} frames...`)
    console.log('')

    // Run performance test
    for (let frame = 0; frame < totalFrames; frame++) {
      const startTime = process.hrtime.bigint()

      gameWrapper.step_frame()

      const endTime = process.hrtime.bigint()
      const frameTimeMs = Number(endTime - startTime) / 1_000_000 // Convert to milliseconds
      frameTimes.push(frameTimeMs)

      // Log progress every 60 frames (1 second)
      if ((frame + 1) % 60 === 0) {
        const avgTime = frameTimes.slice(-60).reduce((a, b) => a + b, 0) / 60
        const maxTime = Math.max(...frameTimes.slice(-60))
        console.log(
          `Frame ${frame + 1}: Avg ${avgTime.toFixed(
            3
          )}ms, Max ${maxTime.toFixed(3)}ms`
        )
      }
    }

    // Calculate performance statistics
    const avgFrameTime =
      frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length
    const maxFrameTime = Math.max(...frameTimes)
    const minFrameTime = Math.min(...frameTimes)
    const framesOver16ms = frameTimes.filter((t) => t > targetFrameTime).length
    const framesOver33ms = frameTimes.filter((t) => t > 33.33).length // 30 FPS threshold

    console.log('')
    console.log('📊 PERFORMANCE RESULTS')
    console.log('=====================')
    console.log(`Average frame time: ${avgFrameTime.toFixed(3)}ms`)
    console.log(`Minimum frame time: ${minFrameTime.toFixed(3)}ms`)
    console.log(`Maximum frame time: ${maxFrameTime.toFixed(3)}ms`)
    console.log(
      `Frames over 16.67ms (60 FPS): ${framesOver16ms}/${totalFrames} (${(
        (framesOver16ms / totalFrames) *
        100
      ).toFixed(1)}%)`
    )
    console.log(
      `Frames over 33.33ms (30 FPS): ${framesOver33ms}/${totalFrames} (${(
        (framesOver33ms / totalFrames) *
        100
      ).toFixed(1)}%)`
    )

    // Performance assessment
    console.log('')
    console.log('🎯 PERFORMANCE ASSESSMENT')
    console.log('========================')
    if (
      avgFrameTime <= targetFrameTime &&
      framesOver16ms < totalFrames * 0.05
    ) {
      console.log('✅ EXCELLENT: Maintains 60 FPS consistently')
    } else if (avgFrameTime <= 33.33 && framesOver33ms < totalFrames * 0.05) {
      console.log(
        '⚠️  ACCEPTABLE: Maintains 30+ FPS, but may drop below 60 FPS'
      )
    } else {
      console.log(
        '❌ POOR: Frequently drops below 30 FPS - optimization needed'
      )
    }

    // Test with different entity counts
    console.log('')
    console.log('📈 SCALABILITY TEST')
    console.log('==================')

    const scalabilityResults = []
    for (let entityCount of [1, 2, 4, 8]) {
      if (entityCount <= gameConfig.characters.length) {
        // Create config with limited characters
        const testConfig = {
          ...gameConfig,
          characters: gameConfig.characters.slice(0, entityCount),
        }

        const testWrapper = new GameWrapper(JSON.stringify(testConfig))
        testWrapper.new_game()

        // Test 60 frames
        const testFrameTimes = []
        for (let i = 0; i < 60; i++) {
          const startTime = process.hrtime.bigint()
          testWrapper.step_frame()
          const endTime = process.hrtime.bigint()
          testFrameTimes.push(Number(endTime - startTime) / 1_000_000)
        }

        const avgTime =
          testFrameTimes.reduce((a, b) => a + b, 0) / testFrameTimes.length
        scalabilityResults.push({ entities: entityCount, avgTime })
        console.log(`${entityCount} entities: ${avgTime.toFixed(3)}ms avg`)

        testWrapper.free()
      }
    }

    // Calculate performance scaling
    if (scalabilityResults.length >= 2) {
      const scaling =
        scalabilityResults[scalabilityResults.length - 1].avgTime /
        scalabilityResults[0].avgTime
      console.log(
        `Performance scaling: ${scaling.toFixed(2)}x slower with ${
          scalabilityResults[scalabilityResults.length - 1].entities
        }x entities`
      )

      if (
        scaling > scalabilityResults[scalabilityResults.length - 1].entities
      ) {
        console.log('❌ Poor scaling - collision detection is O(n²) or worse')
      } else if (
        scaling >
        scalabilityResults[scalabilityResults.length - 1].entities * 0.5
      ) {
        console.log('⚠️  Suboptimal scaling - room for improvement')
      } else {
        console.log('✅ Good scaling - collision detection is well optimized')
      }
    }

    // Identify specific bottlenecks
    console.log('')
    console.log('🔧 BOTTLENECK ANALYSIS')
    console.log('======================')

    if (maxFrameTime > targetFrameTime * 3) {
      console.log(
        '❌ Severe frame time spikes detected - likely collision detection bottleneck'
      )
    }

    if (avgFrameTime > targetFrameTime) {
      console.log('⚠️  Average frame time exceeds 60 FPS target')
      console.log('   Potential optimizations needed:')
      console.log('   - Cache tile boundary calculations')
      console.log('   - Optimize collision detection loops')
      console.log('   - Use spatial partitioning for entity-entity collisions')
      console.log('   - Early exit for non-moving entities')
      console.log('   - Pre-calculate tile lookup tables')
    }

    gameWrapper.free()
  } catch (error) {
    console.error('❌ Performance test failed:', error)
  }
}

// Run the performance profiler
profileCollisionPerformance()
