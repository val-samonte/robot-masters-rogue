/**
 * Web Viewer Exact Configuration Test
 *
 * Tests with the exact configuration from the web viewer to reproduce the sinking bug
 */

import fs from 'fs'
import path from 'path'

// Exact configuration matching the web viewer
const webViewerConfig = {
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
      // TURN_AROUND script
      script: [
        15,
        0,
        0x40, // READ_PROP ENTITY_DIR_HORIZONTAL → fixed[0]
        34,
        0, // NEGATE fixed[0] (flip direction: 1→-1, -1→1)
        16,
        0x40,
        0,
        0, // WRITE_PROP ENTITY_DIR_HORIZONTAL = fixed[0]
        15,
        1,
        0x1f, // READ_PROP CHARACTER_MOVE_SPEED → fixed[1]
        32,
        2,
        0,
        1, // MUL fixed[2] = fixed[0] * fixed[1]
        16,
        0x14,
        2,
        0, // WRITE_PROP CHARACTER_VEL_X = fixed[2]
        0,
        1, // EXIT success
      ],
    },
    {
      energy_cost: 0,
      cooldown: 0,
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      spawns: [0, 0, 0, 0],
      // RUN script
      script: [15, 0, 0x40, 15, 1, 0x1f, 32, 2, 0, 1, 16, 0x14, 2, 0, 1], // RUN
    },
  ],
  conditions: [
    {
      energy_mul: 32,
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      // IS_WALL_LEANING condition
      script: [15, 0, 0x27, 15, 1, 0x29, 61, 2, 0, 1, 91, 2], // IS_WALL_LEANING
    },
    {
      energy_mul: 32,
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      // ALWAYS condition
      script: [20, 0, 1, 91, 0], // ALWAYS
    },
  ],
  characters: [
    {
      id: 1,
      position: [
        [5440, 32], // x = 5440/32 = 170
        [6160, 32], // y = 6160/32 = 192.5 (the problematic position)
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
      dir: [2, 0], // Facing right
      enmity: 0,
      target_id: null,
      target_type: 0,
      behaviors: [
        [0, 0], // IS_WALL_LEANING -> TURN_AROUND
        [1, 1], // ALWAYS -> RUN
      ],
    },
  ],
  spawns: [],
  status_effects: [],
}

async function testWebViewerExact() {
  console.log('🌐 WEB VIEWER EXACT CONFIGURATION TEST')
  console.log('======================================')
  console.log(
    'Testing with exact web viewer configuration to reproduce sinking bug'
  )
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
    const gameWrapper = new GameWrapper(JSON.stringify(webViewerConfig))
    gameWrapper.new_game()

    console.log('📊 INITIAL STATE (from web viewer bug report)')
    console.log('==============================================')

    const initialState = JSON.parse(gameWrapper.get_characters_json())
    const initialChar = initialState[0]
    const initialPosX = initialChar.position[0][0] / initialChar.position[0][1]
    const initialPosY = initialChar.position[1][0] / initialChar.position[1][1]
    const initialBottom = initialPosY + initialChar.size[1]

    console.log(`Position: (${initialPosX}, ${initialPosY})`)
    console.log(`Expected position: (170, 192.5)`)
    console.log(`Bottom edge: y=${initialBottom}`)
    console.log(`Ground level: y=224`)
    console.log(
      `Overlap: ${initialBottom > 224 ? 'YES' : 'NO'} (${(
        initialBottom - 224
      ).toFixed(1)} pixels)`
    )
    console.log(`Collision flags: [${initialChar.collision.join(', ')}]`)
    console.log(
      `Raw position values: x=[${initialChar.position[0][0]}, ${initialChar.position[0][1]}], y=[${initialChar.position[1][0]}, ${initialChar.position[1][1]}]`
    )
    console.log('')

    // Check if position matches expected values
    const positionMatches =
      Math.abs(initialPosX - 170) < 0.1 && Math.abs(initialPosY - 192.5) < 0.1
    if (!positionMatches) {
      console.log(
        '⚠️  Position does not match expected values - possible serialization issue'
      )
      console.log(`   Expected: (170, 192.5)`)
      console.log(`   Actual: (${initialPosX}, ${initialPosY})`)
      console.log('')
    }

    // Run simulation to see if sinking occurs
    console.log('🔄 RUNNING SIMULATION')
    console.log('====================')
    console.log('Simulating frames to observe character behavior...')
    console.log('')

    let foundSinking = false
    let maxSinking = 0

    for (let frame = 0; frame < 100; frame++) {
      const state = JSON.parse(gameWrapper.get_characters_json())
      const char = state[0]

      const posX = char.position[0][0] / char.position[0][1]
      const posY = char.position[1][0] / char.position[1][1]
      const velX = char.velocity[0][0] / char.velocity[0][1]
      const velY = char.velocity[1][0] / char.velocity[1][1]
      const bottom = posY + char.size[1]
      const sinkingAmount = bottom - 224

      // Track maximum sinking
      if (sinkingAmount > maxSinking) {
        maxSinking = sinkingAmount
      }

      // Log frames where character is sinking or has interesting behavior
      if (bottom > 224 || frame % 20 === 0 || Math.abs(velX) > 0.1) {
        console.log(
          `Frame ${frame}: pos=(${posX.toFixed(1)}, ${posY.toFixed(
            3
          )}), vel=(${velX.toFixed(1)}, ${velY.toFixed(
            2
          )}), bottom=${bottom.toFixed(3)}, collision=[${char.collision.join(
            ', '
          )}]`
        )

        if (bottom > 224 && !foundSinking) {
          foundSinking = true
          console.log(
            `   🚨 SINKING DETECTED: Character bottom at y=${bottom.toFixed(
              3
            )} > ground at y=224`
          )
          console.log(
            `   Raw position: [${char.position[1][0]}, ${char.position[1][1]}]`
          )
        }
      }

      gameWrapper.step_frame()
    }

    console.log('')
    console.log('📋 SINKING ANALYSIS')
    console.log('===================')

    if (foundSinking) {
      console.log(`❌ BUG CONFIRMED: Character sinking detected`)
      console.log(
        `   Maximum sinking: ${maxSinking.toFixed(3)} pixels below ground`
      )
      console.log(`   This reproduces the bug reported in the web viewer`)

      // Get final state for analysis
      const finalState = JSON.parse(gameWrapper.get_characters_json())
      const finalChar = finalState[0]
      const finalPosY = finalChar.position[1][0] / finalChar.position[1][1]
      const finalBottom = finalPosY + finalChar.size[1]

      console.log('')
      console.log('🔍 FINAL STATE ANALYSIS')
      console.log('=======================')
      console.log(`Final position: y=${finalPosY.toFixed(3)}`)
      console.log(`Final bottom: y=${finalBottom.toFixed(3)}`)
      console.log(`Still sinking: ${finalBottom > 224 ? 'YES' : 'NO'}`)
      console.log(`Collision flags: [${finalChar.collision.join(', ')}]`)

      if (finalChar.collision[2]) {
        console.log(
          'Bottom collision is detected - collision system knows about ground contact'
        )
      } else {
        console.log('Bottom collision NOT detected - collision system issue')
      }

      console.log('')
      console.log('🔧 DEBUGGING POSITION CORRECTION')
      console.log('================================')
      console.log(
        'The position correction system should have fixed this overlap'
      )
      console.log('Possible issues:')
      console.log('1. Position correction not being called')
      console.log('2. Position correction failing to find valid position')
      console.log('3. Boundary check rejecting the corrected position')
      console.log('4. Binary search not converging to correct solution')
    } else {
      console.log(`✅ No sinking detected in ${100} frames`)
      console.log(
        `   Maximum position: y=${(224 - maxSinking).toFixed(
          3
        )} (${maxSinking.toFixed(3)} pixels from ground)`
      )
      console.log(`   The collision system appears to be working correctly`)
    }

    gameWrapper.free()
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

// Run the web viewer exact test
testWebViewerExact()
