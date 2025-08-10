import fs from 'fs'
import path from 'path'

async function testRestingContactFix() {
  console.log('🔧 TESTING BOX2D-STYLE RESTING CONTACT FIX')
  console.log('==========================================')
  console.log('Testing the fix for bouncing at y=192/192.5')
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

    // Configuration that reproduces the exact bouncing scenario
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
          script: [20, 0, 0, 91, 0], // NOP - do nothing
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
            [640, 32], // x = 640/32 = 20
            [6144, 32], // y = 6144/32 = 192 (exact bouncing position)
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

    console.log('📊 INITIAL STATE ANALYSIS')
    console.log('=========================')

    const initialState = JSON.parse(gameWrapper.get_characters_json())
    const char = initialState[0]
    const pos_x = char.position[0][0] / char.position[0][1]
    const pos_y = char.position[1][0] / char.position[1][1]
    const vel_x = char.velocity[0][0] / char.velocity[0][1]
    const vel_y = char.velocity[1][0] / char.velocity[1][1]
    const bottom_edge = pos_y + char.size[1]

    console.log(`Position: (${pos_x}, ${pos_y})`)
    console.log(`Velocity: (${vel_x}, ${vel_y})`)
    console.log(`Size: ${char.size[0]}x${char.size[1]}`)
    console.log(`Bottom edge: y=${bottom_edge}`)
    console.log(`Ground level: y=224 (tile row 14)`)
    console.log(`Distance from ground: ${bottom_edge - 224} pixels`)
    console.log(`Collision flags: [${char.collision.join(', ')}]`)
    console.log('')

    if (Math.abs(bottom_edge - 224) < 0.01) {
      console.log('✅ Character is exactly at ground level - should be stable')
    } else if (bottom_edge > 224) {
      console.log(
        `❌ Character is ${(bottom_edge - 224).toFixed(
          3
        )} pixels below ground - overlapping`
      )
    } else {
      console.log(
        `⚠️  Character is ${(224 - bottom_edge).toFixed(
          3
        )} pixels above ground - should fall`
      )
    }
    console.log('')

    console.log('🔄 RESTING CONTACT FIX TEST')
    console.log('===========================')
    console.log(
      'Running 30 frames to test Box2D-style resting contact handling...'
    )
    console.log('')

    let bounceCount = 0
    let maxY = pos_y
    let minY = pos_y
    let stableFrames = 0
    let lastY = pos_y

    for (let frame = 1; frame <= 30; frame++) {
      const before = JSON.parse(gameWrapper.get_characters_json())
      gameWrapper.step_frame()
      const after = JSON.parse(gameWrapper.get_characters_json())

      const beforeChar = before[0]
      const afterChar = after[0]

      const before_y = beforeChar.position[1][0] / beforeChar.position[1][1]
      const after_y = afterChar.position[1][0] / afterChar.position[1][1]
      const before_vel_y = beforeChar.velocity[1][0] / beforeChar.velocity[1][1]
      const after_vel_y = afterChar.velocity[1][0] / afterChar.velocity[1][1]
      const after_bottom = after_y + afterChar.size[1]

      // Track position range
      if (after_y > maxY) maxY = after_y
      if (after_y < minY) minY = after_y

      // Count stable frames (no position change)
      if (Math.abs(after_y - lastY) < 0.001) {
        stableFrames++
      } else {
        stableFrames = 0
      }
      lastY = after_y

      // Detect velocity direction changes (bounces)
      if (
        frame > 1 &&
        ((before_vel_y <= 0 && after_vel_y > 0) ||
          (before_vel_y >= 0 && after_vel_y < 0))
      ) {
        bounceCount++
        console.log(`🏀 BOUNCE #${bounceCount} at frame ${frame}:`)
        console.log(
          `   Position: y=${before_y.toFixed(3)} → y=${after_y.toFixed(3)}`
        )
        console.log(
          `   Velocity: ${before_vel_y.toFixed(3)} → ${after_vel_y.toFixed(3)}`
        )
        console.log(`   Bottom edge: ${after_bottom.toFixed(3)} (ground=224)`)
        console.log(`   Collision: [${afterChar.collision.join(', ')}]`)
      }

      // Log significant changes or first few frames
      if (
        frame <= 10 ||
        Math.abs(after_y - before_y) > 0.01 ||
        Math.abs(after_vel_y - before_vel_y) > 0.01
      ) {
        console.log(
          `Frame ${frame}: y=${before_y.toFixed(3)}→${after_y.toFixed(
            3
          )}, vel=${before_vel_y.toFixed(3)}→${after_vel_y.toFixed(
            3
          )}, bottom=${after_bottom.toFixed(
            3
          )}, collision=[${afterChar.collision.join(',')}]`
        )
      }

      // Check if character has stabilized
      if (stableFrames >= 5 && Math.abs(after_vel_y) < 0.001) {
        console.log(
          `✅ Character stabilized at frame ${frame} after ${stableFrames} stable frames`
        )
        console.log(
          `   Final position: y=${after_y.toFixed(
            3
          )}, velocity: ${after_vel_y.toFixed(3)}`
        )
        console.log(
          `   Final bottom edge: ${after_bottom.toFixed(3)} (ground=224)`
        )
        break
      }
    }

    console.log('')
    console.log('📈 RESTING CONTACT FIX RESULTS')
    console.log('==============================')
    console.log(`Total bounces in test: ${bounceCount}`)
    console.log(`Position range: y=${minY.toFixed(3)} to y=${maxY.toFixed(3)}`)
    console.log(`Bounce amplitude: ${(maxY - minY).toFixed(3)} pixels`)
    console.log(`Stable frames at end: ${stableFrames}`)

    if (bounceCount === 0 && stableFrames >= 5) {
      console.log('')
      console.log('🎉 SUCCESS: RESTING CONTACT FIX WORKS!')
      console.log('=====================================')
      console.log('✅ No bouncing detected')
      console.log('✅ Character stabilized quickly')
      console.log('✅ Box2D-style resting contact handling is working')
      console.log('')
      console.log(
        'The bouncing bug has been fixed using industry-standard collision detection.'
      )
    } else if (bounceCount > 0) {
      console.log('')
      console.log('❌ BOUNCING STILL DETECTED')
      console.log('==========================')
      console.log('The resting contact fix needs further adjustment.')
      console.log('Consider adjusting CONTACT_TOLERANCE or LINEAR_SLOP values.')
    } else {
      console.log('')
      console.log('⚠️  CHARACTER NOT STABILIZED')
      console.log('============================')
      console.log('Character may still be falling or moving.')
      console.log('Need longer test or different initial conditions.')
    }

    gameWrapper.free()
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

// Run the test
testRestingContactFix()
