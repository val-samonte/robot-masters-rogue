import fs from 'fs'
import path from 'path'

// Focused test to see if character actually moves after turning around
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
      script: [15, 0, 0x40, 34, 0, 16, 0x40, 0, 0, 1], // TURN_AROUND
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

async function testFocusedBehavior() {
  try {
    const wasmModule = await import('../wasm-wrapper/pkg/wasm_wrapper.js')
    const { default: init, GameWrapper } = wasmModule

    const wasmPath = path.join(
      process.cwd(),
      '../wasm-wrapper/pkg/wasm_wrapper_bg.wasm'
    )
    const wasmBuffer = fs.readFileSync(wasmPath)
    await init(wasmBuffer)

    console.log('=== Focused Test: Does Character Move After Turn-Around? ===')
    console.log()

    const gameWrapper = new GameWrapper(JSON.stringify(testConfig))
    gameWrapper.new_game()

    let wallHitFrame = -1
    let firstTurnFrame = -1
    let leftMovementFrame = -1

    for (let frame = 0; frame < 150; frame++) {
      const state = JSON.parse(gameWrapper.get_characters_json())
      const char = state[0]
      const posX = char.position[0][0] / char.position[0][1]
      const velX = char.velocity[0][0] / char.velocity[0][1]

      // Detect wall hit
      if (posX >= 224 && char.collision[1] && wallHitFrame === -1) {
        wallHitFrame = frame
        console.log(
          `🔴 WALL HIT at frame ${frame}: pos=${posX.toFixed(
            1
          )}, collision=[${char.collision.join(', ')}]`
        )
      }

      // Detect first turn to left
      if (char.dir[0] === 0 && firstTurnFrame === -1) {
        firstTurnFrame = frame
        console.log(
          `🔄 FIRST TURN TO LEFT at frame ${frame}: dir=${char.dir[0]}`
        )
      }

      // Detect left movement
      if (velX < -0.1 && leftMovementFrame === -1) {
        leftMovementFrame = frame
        console.log(
          `⬅️ LEFT MOVEMENT DETECTED at frame ${frame}: vel=${velX.toFixed(1)}`
        )
      }

      // Log key events
      if (
        frame <= 5 ||
        (frame >= wallHitFrame - 2 && frame <= wallHitFrame + 10) ||
        frame % 30 === 0
      ) {
        console.log(
          `Frame ${frame}: pos=${posX.toFixed(1)}, vel=${velX.toFixed(
            1
          )}, dir=${char.dir[0]}, collision=[${char.collision.join(', ')}]`
        )
      }

      // Success condition: character moves left after turning
      if (leftMovementFrame !== -1 && posX < 220) {
        console.log(
          `\n🎉 SUCCESS! Character is moving left and away from wall!`
        )
        console.log(`   Wall hit: frame ${wallHitFrame}`)
        console.log(`   First turn: frame ${firstTurnFrame}`)
        console.log(`   Left movement: frame ${leftMovementFrame}`)
        console.log(
          `   Current position: ${posX.toFixed(
            1
          )} (moving away from wall at 224)`
        )
        break
      }

      gameWrapper.step_frame()
    }

    console.log(`\n=== RESULTS ===`)
    console.log(
      `Wall hit frame: ${wallHitFrame === -1 ? 'NOT DETECTED' : wallHitFrame}`
    )
    console.log(
      `First turn frame: ${
        firstTurnFrame === -1 ? 'NOT DETECTED' : firstTurnFrame
      }`
    )
    console.log(
      `Left movement frame: ${
        leftMovementFrame === -1 ? 'NOT DETECTED' : leftMovementFrame
      }`
    )

    if (
      wallHitFrame !== -1 &&
      firstTurnFrame !== -1 &&
      leftMovementFrame !== -1
    ) {
      console.log(`✅ FULL SUCCESS: Wall hit → Turn around → Move left`)
    } else if (wallHitFrame !== -1 && firstTurnFrame !== -1) {
      console.log(
        `⚠️ PARTIAL: Wall hit and turn detected, but no left movement`
      )
    } else if (wallHitFrame !== -1) {
      console.log(`⚠️ PARTIAL: Wall hit detected, but no turn-around`)
    } else {
      console.log(`❌ FAILURE: No wall hit detected`)
    }

    gameWrapper.free()
  } catch (error) {
    console.error('Error:', error)
  }
}

testFocusedBehavior()
