import fs from 'fs'
import path from 'path'

// Test with combined TURN_AROUND_AND_RUN action
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
      script: [15, 0, 0x40, 15, 1, 0x1f, 32, 2, 0, 1, 16, 0x14, 2, 0, 1], // RUN (for normal movement)
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
      move_speed: [64, 32], // 2.0 in Fixed
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
        [0, 0], // IS_WALL_LEANING → TURN_AROUND_AND_RUN (priority 1)
        [1, 1], // ALWAYS → RUN (priority 2, only executes if no wall collision)
      ],
    },
  ],
  spawns: [],
  status_effects: [],
}

async function testCombinedAction() {
  try {
    const wasmModule = await import('../wasm-wrapper/pkg/wasm_wrapper.js')
    const { default: init, GameWrapper } = wasmModule

    const wasmPath = path.join(
      process.cwd(),
      '../wasm-wrapper/pkg/wasm_wrapper_bg.wasm'
    )
    const wasmBuffer = fs.readFileSync(wasmPath)
    await init(wasmBuffer)

    console.log('=== Testing Combined TURN_AROUND_AND_RUN Action ===')
    console.log(
      'Action 0: TURN_AROUND_AND_RUN (flips direction + sets velocity)'
    )
    console.log('Action 1: RUN (normal movement)')
    console.log('Expected behavior:')
    console.log('1. Character runs right until hitting wall')
    console.log('2. IS_WALL_LEANING triggers → TURN_AROUND_AND_RUN executes')
    console.log('3. Direction flips to left AND velocity set to -2.0')
    console.log('4. Character moves away from wall')
    console.log('5. No more wall collision → ALWAYS triggers → RUN executes')
    console.log('6. Character continues moving left until hitting left wall')
    console.log('7. Process repeats')
    console.log()

    const gameWrapper = new GameWrapper(JSON.stringify(testConfig))
    gameWrapper.new_game()

    let lastDirection = 2
    let directionChanges = 0
    let movementPhases = []
    let currentPhase = { direction: 2, startFrame: 0, startPos: 32 }

    for (let frame = 0; frame < 300; frame++) {
      const state = JSON.parse(gameWrapper.get_characters_json())
      const char = state[0]
      const posX = char.position[0][0] / char.position[0][1]
      const velX = char.velocity[0][0] / char.velocity[0][1]
      const dirValue = char.dir[0]
      const collision = char.collision

      // Track direction changes
      if (dirValue !== lastDirection) {
        directionChanges++

        // End current phase
        currentPhase.endFrame = frame - 1
        currentPhase.endPos = posX
        currentPhase.distance = Math.abs(
          currentPhase.endPos - currentPhase.startPos
        )
        movementPhases.push(currentPhase)

        // Start new phase
        const newDirection = dirValue === 0 ? 'LEFT' : 'RIGHT'
        console.log(
          `🔄 Direction change #${directionChanges} at frame ${frame}: Now facing ${newDirection}`
        )
        console.log(
          `   Previous phase: moved ${currentPhase.distance.toFixed(1)} pixels`
        )

        currentPhase = {
          direction: dirValue,
          startFrame: frame,
          startPos: posX,
        }

        lastDirection = dirValue
      }

      // Log key frames
      if (
        frame % 50 === 0 ||
        Math.abs(velX) < 0.1 ||
        collision[1] ||
        collision[3]
      ) {
        console.log(
          `Frame ${frame}: pos=${posX.toFixed(1)}, vel=${velX.toFixed(
            1
          )}, dir=${dirValue}, collision=[${collision.join(', ')}]`
        )

        if (collision[1] || collision[3]) {
          console.log(`  → Wall collision! TURN_AROUND_AND_RUN should execute`)
        }
        if (Math.abs(velX) < 0.1) {
          console.log(`  ⚠️ Zero velocity detected`)
        }
      }

      gameWrapper.step_frame()
    }

    // End final phase
    currentPhase.endFrame = 299
    currentPhase.endPos = posX
    currentPhase.distance = Math.abs(
      currentPhase.endPos - currentPhase.startPos
    )
    movementPhases.push(currentPhase)

    console.log()
    console.log(`=== RESULTS ===`)
    console.log(`Total direction changes: ${directionChanges}`)
    console.log(`Movement phases: ${movementPhases.length}`)

    movementPhases.forEach((phase, i) => {
      const direction = phase.direction === 0 ? 'LEFT' : 'RIGHT'
      const duration = (phase.endFrame || 299) - phase.startFrame + 1
      console.log(
        `Phase ${
          i + 1
        }: ${direction} for ${duration} frames, distance: ${phase.distance.toFixed(
          1
        )}`
      )
    })

    if (directionChanges >= 2 && movementPhases.some((p) => p.distance > 50)) {
      console.log(`✅ SUCCESS: Character is bouncing between walls!`)
    } else if (directionChanges >= 1) {
      console.log(
        `⚠️ PARTIAL: Character turned around but may not be moving properly`
      )
    } else {
      console.log(`❌ FAILED: No direction changes detected`)
    }

    gameWrapper.free()
  } catch (error) {
    console.error('Error:', error)
  }
}

testCombinedAction()
