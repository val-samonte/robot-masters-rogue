#!/usr/bin/env node

/**
 * Enhanced Wall Hit Test - Complete Turn-Around Sequence
 * Tests the complete sequence: hit wall → collision flag set → turn around → move away
 */

import fs from 'fs'
import path from 'path'

// Use the exact same configuration as the working web viewer
const gameConfig = {
  seed: 12345,
  gravity: [1, 2],
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
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  ],
  actions: [
    {
      energy_cost: 0,
      cooldown: 0,
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      spawns: [0, 0, 0, 0],
      script: [15, 0, 64, 15, 1, 31, 32, 2, 0, 1, 16, 20, 2, 0, 1],
    },
    {
      energy_cost: 0,
      cooldown: 0,
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      spawns: [0, 0, 0, 0],
      script: [15, 0, 64, 34, 0, 16, 64, 0, 0, 1],
    },
  ],
  conditions: [
    {
      energy_mul: 32,
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      script: [15, 0, 39, 15, 1, 41, 61, 2, 0, 1, 91, 2],
    },
    {
      energy_mul: 32,
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      script: [20, 0, 1, 91, 0],
    },
  ],
  characters: [
    {
      id: 1,
      position: [
        [64, 1],
        [384, 1],
      ], // Start on ground (384 = 12*32, just above ground)
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
      behaviors: [
        [0, 1],
        [1, 0],
      ],
    },
  ],
  spawns: [],
  status_effects: [],
}

async function loadWasm() {
  try {
    const wasmModule = await import('../wasm-wrapper/pkg/wasm_wrapper.js')
    const { default: init, GameWrapper } = wasmModule

    const wasmPath = path.join(
      process.cwd(),
      '../wasm-wrapper/pkg/wasm_wrapper_bg.wasm'
    )
    const wasmBuffer = fs.readFileSync(wasmPath)
    await init(wasmBuffer)

    console.log(
      '=== ENHANCED WALL HIT TEST - COMPLETE TURN-AROUND SEQUENCE ==='
    )
    console.log(
      'Testing: hit wall → collision flag set → turn around → move away'
    )
    console.log('Expected: No stuck conditions, smooth turn-around behavior\n')

    const gameWrapper = new GameWrapper(JSON.stringify(gameConfig))
    gameWrapper.new_game()

    let hitWall = false
    let turnedAround = false
    let movedAwayFromWall = false
    let testComplete = false

    for (let frame = 0; frame < 150; frame++) {
      const before = JSON.parse(gameWrapper.get_characters_json())
      gameWrapper.step_frame()
      const after = JSON.parse(gameWrapper.get_characters_json())

      const char = after[0]
      const prevChar = before[0]

      const posX = char.position[0][0] / char.position[0][1]
      const posY = char.position[1][0] / char.position[1][1]
      const velX = char.velocity[0][0] / char.velocity[0][1]
      const velY = char.velocity[1][0] / char.velocity[1][1]

      // Only log significant events or every 10 frames
      const shouldLog =
        frame % 10 === 0 ||
        char.collision[1] ||
        char.collision[3] ||
        prevChar.dir[0] !== char.dir[0]

      if (shouldLog) {
        console.log(`\nFrame ${frame}:`)
        console.log(`  Position: (${posX.toFixed(1)}, ${posY.toFixed(1)})`)
        console.log(`  Velocity: (${velX.toFixed(1)}, ${velY.toFixed(1)})`)
        console.log(`  Direction: [${char.dir[0]}, ${char.dir[1]}]`)
        console.log(`  Collision: [${char.collision.join(', ')}]`)
      }

      // Detect wall hit
      if (!hitWall && (char.collision[1] || char.collision[3])) {
        hitWall = true
        console.log(`\n🔥 HIT WALL AT FRAME ${frame}!`)
        console.log(`  Right collision: ${char.collision[1]}`)
        console.log(`  Left collision: ${char.collision[3]}`)
        console.log(`  Position: (${posX.toFixed(1)}, ${posY.toFixed(1)})`)
      }

      // Detect turn around
      if (hitWall && !turnedAround && prevChar.dir[0] !== char.dir[0]) {
        turnedAround = true
        console.log(`\n🔄 TURNED AROUND AT FRAME ${frame}!`)
        console.log(
          `  Direction changed from ${prevChar.dir[0]} to ${char.dir[0]}`
        )
        console.log(`  Position: (${posX.toFixed(1)}, ${posY.toFixed(1)})`)
        console.log(`  Velocity: (${velX.toFixed(1)}, ${velY.toFixed(1)})`)
      }

      // Check for successful movement away from wall after turning around
      if (turnedAround && !movedAwayFromWall && Math.abs(velX) > 0.1) {
        const posChange = Math.abs(
          posX - prevChar.position[0][0] / prevChar.position[0][1]
        )

        if (posChange > 0.5) {
          movedAwayFromWall = true
          testComplete = true
          console.log(`\n✅ COMPLETE TURN-AROUND SEQUENCE SUCCESSFUL!`)
          console.log(`  Frame ${frame}: Character moving away from wall`)
          console.log(`  Position change: ${posChange.toFixed(1)} pixels`)
          console.log(`  Velocity: ${velX.toFixed(1)}`)
          console.log(`  Direction: ${char.dir[0]} (0=left, 2=right)`)
          console.log(`  Collision flags: [${char.collision.join(', ')}]`)
          break
        } else if (frame > 100) {
          // Check for stuck condition after sufficient time
          console.log(`\n❌ STUCK CONDITION DETECTED AT FRAME ${frame}!`)
          console.log(
            `  Velocity: ${velX.toFixed(
              1
            )} but position change: ${posChange.toFixed(1)}`
          )
          console.log(`  This indicates a collision system issue`)

          // Detailed analysis
          console.log(`\n  DETAILED ANALYSIS:`)
          console.log(
            `  Character bounds: x=${posX.toFixed(1)} to x=${(
              posX + 16
            ).toFixed(1)}`
          )
          console.log(`  Game boundaries: x=16 to x=240`)

          if (posX <= 16) {
            console.log(
              `  ❌ OVERLAPPING LEFT WALL BY ${(16 - posX).toFixed(1)} pixels`
            )
          } else if (posX + 16 >= 240) {
            console.log(
              `  ❌ OVERLAPPING RIGHT WALL BY ${(posX + 16 - 240).toFixed(
                1
              )} pixels`
            )
          } else {
            console.log(`  ✓ Position within bounds, but character not moving`)
            console.log(
              `  This suggests velocity constraint or other physics issue`
            )
          }

          testComplete = true
          break
        }
      }

      // Timeout check
      if (frame >= 149 && !testComplete) {
        console.log(`\n⚠️  TEST TIMEOUT AT FRAME ${frame}`)
        console.log(`  Hit wall: ${hitWall}`)
        console.log(`  Turned around: ${turnedAround}`)
        console.log(`  Moved away: ${movedAwayFromWall}`)

        if (hitWall && turnedAround && !movedAwayFromWall) {
          console.log(
            `  ❌ Character turned around but never moved away (stuck)`
          )
        } else if (hitWall && !turnedAround) {
          console.log(`  ❌ Character hit wall but never turned around`)
        } else if (!hitWall) {
          console.log(`  ❌ Character never hit wall`)
        }
      }
    }
  } catch (error) {
    console.error('Error:', error)
  }
}

loadWasm()
