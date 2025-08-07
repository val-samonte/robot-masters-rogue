import fs from 'fs'
import path from 'path'

// Simplified test to focus on the execution order issue
const gameConfig = {
  seed: 12345,
  gravity: [0, 1], // Disable gravity to focus on horizontal movement
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
      script: [15, 0, 64, 15, 1, 31, 32, 2, 0, 1, 16, 20, 2, 0, 1], // RUN
    },
    {
      energy_cost: 0,
      cooldown: 0,
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      spawns: [0, 0, 0, 0],
      script: [15, 0, 64, 34, 0, 16, 64, 0, 0, 1], // TURN_AROUND
    },
  ],
  conditions: [
    {
      energy_mul: 32,
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      script: [15, 0, 39, 15, 1, 41, 61, 2, 0, 1, 91, 2], // IS_WALL_LEANING
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
        [224, 1],
        [200, 1],
      ], // Start close to right wall (240-16=224)
      group: 1,
      size: [16, 32],
      health: 100,
      health_cap: 100,
      energy: 100,
      energy_cap: 100,
      power: 10,
      weight: 5,
      jump_force: [160, 32],
      move_speed: [32, 32], // Slower movement (1 pixel per frame)
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
        [0, 1],
        [1, 0],
      ], // IS_WALL_LEANING -> TURN_AROUND, ALWAYS -> RUN
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

    console.log('=== EXECUTION ORDER TEST ===')
    console.log('Character starts at x=224, should hit right wall at x=240')
    console.log('Testing if character gets stuck after turning around')

    const gameWrapper = new GameWrapper(JSON.stringify(gameConfig))
    gameWrapper.new_game()

    let hitWall = false
    let turnedAround = false
    let stuckFrames = 0

    for (let frame = 0; frame < 50; frame++) {
      const before = JSON.parse(gameWrapper.get_characters_json())
      gameWrapper.step_frame()
      const after = JSON.parse(gameWrapper.get_characters_json())

      const char = after[0]
      const prevChar = before[0]

      const posX = char.position[0][0] / char.position[0][1]
      const velX = char.velocity[0][0] / char.velocity[0][1]
      const prevPosX = prevChar.position[0][0] / prevChar.position[0][1]

      console.log(`\nFrame ${frame}:`)
      console.log(
        `  Position: ${prevPosX.toFixed(1)} -> ${posX.toFixed(1)} (${
          posX - prevPosX > 0 ? '+' : ''
        }${(posX - prevPosX).toFixed(1)})`
      )
      console.log(`  Velocity: ${velX.toFixed(1)}`)
      console.log(`  Direction: [${char.dir[0]}, ${char.dir[1]}]`)
      console.log(`  Collision: [${char.collision.join(', ')}]`)
      console.log(
        `  Character bounds: x=${posX.toFixed(1)} to x=${(posX + 16).toFixed(
          1
        )}`
      )

      // Detect wall hit
      if (!hitWall && (char.collision[1] || char.collision[3])) {
        hitWall = true
        console.log(`  🔥 HIT WALL!`)
      }

      // Detect turn around
      if (hitWall && !turnedAround && prevChar.dir[0] !== char.dir[0]) {
        turnedAround = true
        console.log(`  🔄 TURNED AROUND!`)
      }

      // Detect stuck condition
      if (
        turnedAround &&
        Math.abs(velX) > 0.1 &&
        Math.abs(posX - prevPosX) < 0.1
      ) {
        stuckFrames++
        console.log(`  ⚠️  STUCK FRAME ${stuckFrames}!`)

        if (stuckFrames >= 3) {
          console.log(`\n🚨 CONFIRMED: CHARACTER IS STUCK!`)
          console.log(
            `The character has velocity but position is not changing.`
          )
          console.log(`This confirms the collision detection timing issue.`)

          // Check if overlapping
          if (posX <= 16) {
            console.log(
              `Character is overlapping LEFT wall by ${(16 - posX).toFixed(
                1
              )} pixels`
            )
          } else if (posX + 16 >= 240) {
            console.log(
              `Character is overlapping RIGHT wall by ${(
                posX +
                16 -
                240
              ).toFixed(1)} pixels`
            )
          }

          console.log(
            `\nThe fix needed is to update collision flags BEFORE behavior execution,`
          )
          console.log(
            `or ensure position correction happens before collision detection.`
          )
          break
        }
      } else if (turnedAround) {
        stuckFrames = 0 // Reset if moving
      }
    }
  } catch (error) {
    console.error('Error:', error)
  }
}

loadWasm()
