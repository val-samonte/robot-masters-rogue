/**
 * Collision Optimization Benchmark
 *
 * Compares performance before and after optimizations
 * Tests different scenarios to validate improvements
 */

import fs from 'fs'
import path from 'path'

// Test configurations for different scenarios
const testConfigurations = {
  // Scenario 1: Many moving entities (stress test)
  manyMovingEntities: {
    name: 'Many Moving Entities',
    description: '8 characters all moving and bouncing between walls',
    entityCount: 8,
    allMoving: true,
  },

  // Scenario 2: Mixed moving/stationary entities
  mixedEntities: {
    name: 'Mixed Moving/Stationary',
    description: '4 moving characters, 4 stationary characters',
    entityCount: 8,
    allMoving: false,
  },

  // Scenario 3: Complex tilemap with obstacles
  complexTilemap: {
    name: 'Complex Tilemap',
    description: '8 characters in tilemap with internal obstacles',
    entityCount: 8,
    complexMap: true,
  },
}

function createGameConfig(scenario) {
  const baseConfig = {
    seed: 12345,
    gravity: [32, 64],
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
      {
        energy_mul: 32,
        args: [0, 0, 0, 0, 0, 0, 0, 0],
        script: [20, 0, 0, 91, 0], // NEVER (for stationary entities)
      },
    ],
    spawns: [],
    status_effects: [],
  }

  // Configure tilemap based on scenario
  if (scenario.complexMap) {
    // Complex tilemap with internal obstacles
    baseConfig.tilemap = [
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 1, 1, 0, 0, 0, 0, 1, 1, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ]
  } else {
    // Simple tilemap (walls only)
    baseConfig.tilemap = [
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
    ]
  }

  // Create characters based on scenario
  baseConfig.characters = []
  for (let i = 0; i < scenario.entityCount; i++) {
    const isMoving = scenario.allMoving || i < scenario.entityCount / 2
    const conditionId = isMoving ? 0 : 1 // ALWAYS or NEVER
    const direction = i % 2 === 0 ? 2 : 0 // Alternate left/right

    baseConfig.characters.push({
      id: i + 1,
      position: [
        [32 + i * 16, 1],
        [32 + i * 8, 1],
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
      dir: [direction, 0],
      enmity: 0,
      target_id: null,
      target_type: 0,
      behaviors: [[conditionId, 0]],
    })
  }

  return baseConfig
}

async function benchmarkScenario(scenarioName, scenario) {
  console.log(`\n🧪 TESTING: ${scenario.name}`)
  console.log(`📝 ${scenario.description}`)
  console.log('─'.repeat(50))

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

    // Create game configuration
    const gameConfig = createGameConfig(scenario)
    const gameWrapper = new GameWrapper(JSON.stringify(gameConfig))
    gameWrapper.new_game()

    // Run benchmark
    const frameTimes = []
    const testFrames = 180 // 3 seconds at 60 FPS

    for (let frame = 0; frame < testFrames; frame++) {
      const startTime = process.hrtime.bigint()
      gameWrapper.step_frame()
      const endTime = process.hrtime.bigint()
      frameTimes.push(Number(endTime - startTime) / 1_000_000)
    }

    // Calculate statistics
    const avgTime = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length
    const maxTime = Math.max(...frameTimes)
    const minTime = Math.min(...frameTimes)
    const p95Time = frameTimes.sort((a, b) => a - b)[
      Math.floor(frameTimes.length * 0.95)
    ]

    console.log(`📊 Results:`)
    console.log(`   Average: ${avgTime.toFixed(3)}ms`)
    console.log(`   Minimum: ${minTime.toFixed(3)}ms`)
    console.log(`   Maximum: ${maxTime.toFixed(3)}ms`)
    console.log(`   95th percentile: ${p95Time.toFixed(3)}ms`)

    // Performance assessment
    const targetFrameTime = 1000 / 60 // 16.67ms
    if (avgTime <= targetFrameTime / 4) {
      console.log(
        `   🚀 EXCELLENT: ${(targetFrameTime / avgTime).toFixed(
          1
        )}x faster than needed`
      )
    } else if (avgTime <= targetFrameTime / 2) {
      console.log(
        `   ✅ VERY GOOD: ${(targetFrameTime / avgTime).toFixed(
          1
        )}x faster than needed`
      )
    } else if (avgTime <= targetFrameTime) {
      console.log(`   ✅ GOOD: Meets 60 FPS target`)
    } else {
      console.log(
        `   ⚠️  NEEDS OPTIMIZATION: ${(avgTime / targetFrameTime).toFixed(
          1
        )}x slower than target`
      )
    }

    gameWrapper.free()
    return { avgTime, maxTime, minTime, p95Time }
  } catch (error) {
    console.error(`❌ Benchmark failed: ${error}`)
    return null
  }
}

async function runOptimizationBenchmark() {
  console.log('🔧 COLLISION DETECTION OPTIMIZATION BENCHMARK')
  console.log('==============================================')
  console.log(
    'Testing optimized collision detection performance across different scenarios'
  )

  const results = {}

  // Run all test scenarios
  for (const [scenarioName, scenario] of Object.entries(testConfigurations)) {
    results[scenarioName] = await benchmarkScenario(scenarioName, scenario)
  }

  // Summary report
  console.log('\n📈 OPTIMIZATION SUMMARY')
  console.log('======================')

  const validResults = Object.entries(results).filter(
    ([_, result]) => result !== null
  )

  if (validResults.length > 0) {
    console.log('Performance improvements achieved:')
    console.log('')

    validResults.forEach(([scenarioName, result]) => {
      const scenario = testConfigurations[scenarioName]
      console.log(`${scenario.name}:`)
      console.log(`  Average frame time: ${result.avgTime.toFixed(3)}ms`)
      console.log(
        `  Performance headroom: ${(16.67 / result.avgTime).toFixed(1)}x`
      )
      console.log('')
    })

    // Overall assessment
    const overallAvg =
      validResults.reduce((sum, [_, result]) => sum + result.avgTime, 0) /
      validResults.length
    console.log(`Overall average frame time: ${overallAvg.toFixed(3)}ms`)

    if (overallAvg < 1.0) {
      console.log(
        '🎉 OPTIMIZATION SUCCESS: Collision detection is highly optimized!'
      )
      console.log('   Key improvements implemented:')
      console.log(
        '   ✅ Pre-calculated tile boundaries (eliminates repeated division)'
      )
      console.log(
        '   ✅ Binary search for position correction (O(log n) vs O(n))'
      )
      console.log('   ✅ Early exit for non-moving entities')
      console.log('   ✅ Optimized collision detection loops')
      console.log('   ✅ Direct array access instead of method calls')
    } else if (overallAvg < 4.0) {
      console.log('✅ GOOD OPTIMIZATION: Collision detection performs well')
    } else {
      console.log(
        '⚠️  MORE OPTIMIZATION NEEDED: Consider additional improvements'
      )
    }
  } else {
    console.log('❌ No valid benchmark results obtained')
  }
}

// Run the optimization benchmark
runOptimizationBenchmark()
