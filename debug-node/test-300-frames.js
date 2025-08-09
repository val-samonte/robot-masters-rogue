import fs from 'fs'
import path from 'path'

// Test for 300 frames to see complete behavior
const testConfig = {
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
      // Combined TURN_AROUND_AND_RUN script
      script: [
        // Step 1: Read current direction
        15,
        0,
        0x40, // READ_PROP ENTITY_DIR_HORIZONTAL → fixed[0]

        // Step 2: Flip direction
        34,
        0, // NEGATE fixed[0] (flip direction: 1→-1, -1→1)

        // Step 3: Write new direction
        16,
        0x40,
        0,
        0, // WRITE_PROP ENTITY_DIR_HORIZONTAL = fixed[0]

        // Step 4: Read move speed
        15,
        1,
        0x1f, // READ_PROP CHARACTER_MOVE_SPEED → fixed[1]

        // Step 5: Calculate velocity (new_direction * move_speed)
        32,
        2,
        0,
        1, // MUL fixed[2] = fixed[0] * fixed[1]

        // Step 6: Set velocity
        16,
        0x14,
        2,
        0, // WRITE_PROP CHARACTER_VEL_X = fixed[2]

        // Step 7: Exit
        0,
        1, // EXIT success
      ],
    },
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
      script: [15, 0, 0x27, 15, 1, 0x29, 61, 2, 0, 1, 91, 2], // IS_WALL_LEANING
    },
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
        [32, 1],
        [192, 1],
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
      dir: [2, 0], // Start facing right
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

async function test300Frames() {
  try {
    const wasmModule = await import('../wasm-wrapper/pkg/wasm_wrapper.js')
    const { default: init, GameWrapper } = wasmModule

    const wasmPath = path.join(
      process.cwd(),
      '../wasm-wrapper/pkg/wasm_wrapper_bg.wasm'
    )
    const wasmBuffer = fs.readFileSync(wasmPath)
    await init(wasmBuffer)

    console.log('=== Testing 300 Frames - Complete Turn-Around Behavior ===')
    console.log()

    const gameWrapper = new GameWrapper(JSON.stringify(testConfig))
    gameWrapper.new_game()

    let directionChanges = 0
    let lastDirection = 2
    let movementPhases = []
    let currentPhase = { direction: 2, startFrame: 0, movement: false }

    for (let frame = 0; frame < 300; frame++) {
      const state = JSON.parse(gameWrapper.get_characters_json())
      const char = state[0]
      const posX = char.position[0][0] / char.position[0][1]
      const velX = char.velocity[0][0] / char.velocity[0][1]

      // Track direction changes
      if (char.dir[0] !== lastDirection) {
        directionChanges++
        const dirName =
          char.dir[0] === 0 ? 'LEFT' : char.dir[0] === 2 ? 'RIGHT' : 'NEUTRAL'
        console.log(
          `🔄 Direction change #${directionChanges} at frame ${frame}: Now facing ${dirName}`
        )

        // End current phase and start new one
        currentPhase.endFrame = frame - 1
        movementPhases.push({ ...currentPhase })
        currentPhase = {
          direction: char.dir[0],
          startFrame: frame,
          movement: false,
        }
        lastDirection = char.dir[0]
      }

      // Track movement in current phase
      if (Math.abs(velX) > 0.1) {
        currentPhase.movement = true
      }

      // Log key frames with detailed wall analysis
      if (
        frame % 50 === 0 ||
        Math.abs(velX) > 0.1 ||
        char.collision.some((c) => c) ||
        (frame >= 95 && frame <= 105)
      ) {
        console.log(
          `Frame ${frame}: pos=${posX.toFixed(1)}, vel=${velX.toFixed(
            1
          )}, dir=${char.dir[0]}, collision=[${char.collision.join(', ')}]`
        )

        // Add detailed analysis for wall collision frames
        if (frame >= 95 && frame <= 105) {
          console.log(
            `  🔍 Character right edge: ${(posX + 16).toFixed(
              1
            )} (wall at 240.0)`
          )
          console.log(
            `  🔍 Distance to wall: ${(240 - (posX + 16)).toFixed(1)} pixels`
          )

          if (char.collision[1]) {
            // Right collision
            console.log(`  🚨 RIGHT COLLISION ACTIVE`)
          }
          if (char.collision[2]) {
            // Bottom collision
            console.log(`  🚨 BOTTOM COLLISION ACTIVE`)
          }

          if (velX === 0 && posX >= 224) {
            console.log(
              `  ❌ VELOCITY ZERO AT WALL - Wall escape system failed!`
            )
          } else if (velX !== 0) {
            console.log(`  ✅ Velocity preserved: ${velX.toFixed(1)}`)
          }
        }
      }

      // Check for successful bouncing behavior
      if (directionChanges >= 4 && movementPhases.length >= 2) {
        const hasMovement = movementPhases.some((phase) => phase.movement)
        if (hasMovement) {
          console.log(
            `\n🎉 SUCCESS! Turn-around behavior working at frame ${frame}!`
          )
          console.log(`   Direction changes: ${directionChanges}`)
          console.log(
            `   Movement detected in phases: ${
              movementPhases.filter((p) => p.movement).length
            }`
          )
          break
        }
      }

      gameWrapper.step_frame()
    }

    // End current phase
    currentPhase.endFrame = 299
    movementPhases.push(currentPhase)

    console.log(`\n=== SUMMARY ===`)
    console.log(`Total direction changes: ${directionChanges}`)
    console.log(`Movement phases:`)
    movementPhases.forEach((phase, i) => {
      const dirName =
        phase.direction === 0
          ? 'LEFT'
          : phase.direction === 2
          ? 'RIGHT'
          : 'NEUTRAL'
      const duration = (phase.endFrame || 299) - phase.startFrame + 1
      console.log(
        `  Phase ${i + 1}: ${dirName} (frames ${phase.startFrame}-${
          phase.endFrame || 299
        }, ${duration}f) - Movement: ${phase.movement ? 'YES' : 'NO'}`
      )
    })

    if (directionChanges > 0) {
      console.log(
        `✅ Turn-around mechanism is working (${directionChanges} direction changes)`
      )
      if (movementPhases.some((p) => p.movement)) {
        console.log(`✅ Character movement is working`)
        console.log(`🎉 FULL SUCCESS: Character can turn around and move!`)
      } else {
        console.log(
          `⚠️ Turn-around works but character not moving after direction change`
        )
      }
    } else {
      console.log(`❌ No turn-around behavior detected`)
    }

    gameWrapper.free()
  } catch (error) {
    console.error('Error:', error)
  }
}

test300Frames()
