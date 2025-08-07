import fs from 'fs'
import path from 'path'

// Script constants (copied from web-viewer)
const OperatorAddress = {
  EXIT: 0,
  READ_PROP: 15,
  WRITE_PROP: 16,
  ASSIGN_BYTE: 20,
  ASSIGN_FIXED: 21,
  MUL: 32,
  NEGATE: 34,
  OR: 61,
  EXIT_WITH_VAR: 91,
}

const PropertyAddress = {
  CHARACTER_VEL_X: 0x14,
  CHARACTER_MOVE_SPEED: 0x1f,
  CHARACTER_COLLISION_RIGHT: 0x27,
  CHARACTER_COLLISION_LEFT: 0x29,
  ENTITY_DIR_HORIZONTAL: 0x40,
}

// Game configuration - using the working web viewer format
const gameConfig = {
  seed: 12345,
  gravity: [0, 1], // Disable gravity to test horizontal movement
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
      // Action 0: RUN
      energy_cost: 0,
      cooldown: 0,
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      spawns: [0, 0, 0, 0],
      script: [
        OperatorAddress.READ_PROP,
        0,
        PropertyAddress.ENTITY_DIR_HORIZONTAL, // Read direction to fixed[0]
        OperatorAddress.READ_PROP,
        1,
        PropertyAddress.CHARACTER_MOVE_SPEED, // Read move_speed to fixed[1]
        OperatorAddress.MUL,
        2,
        0,
        1, // Multiply: fixed[2] = fixed[0] * fixed[1]
        OperatorAddress.WRITE_PROP,
        PropertyAddress.CHARACTER_VEL_X,
        2, // Write to velocity
        OperatorAddress.EXIT,
        1,
      ],
    },
    {
      // Action 1: TURN_AROUND
      energy_cost: 0,
      cooldown: 0,
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      spawns: [0, 0, 0, 0],
      script: [
        OperatorAddress.READ_PROP,
        0,
        PropertyAddress.ENTITY_DIR_HORIZONTAL, // Read direction to fixed[0]
        OperatorAddress.NEGATE,
        0, // Negate: fixed[0] = -fixed[0]
        OperatorAddress.WRITE_PROP,
        PropertyAddress.ENTITY_DIR_HORIZONTAL,
        0, // Write fixed[0] back to direction
        OperatorAddress.EXIT,
        1,
      ],
    },
  ],
  conditions: [
    {
      // Condition 0: IS_WALL_LEANING (simplified - just check if touching any wall)
      energy_mul: 32,
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      script: [
        OperatorAddress.READ_PROP,
        0,
        PropertyAddress.CHARACTER_COLLISION_RIGHT, // Read right collision
        OperatorAddress.READ_PROP,
        1,
        PropertyAddress.CHARACTER_COLLISION_LEFT, // Read left collision
        OperatorAddress.OR,
        2,
        0,
        1, // vars[2] = right_collision OR left_collision
        OperatorAddress.EXIT_WITH_VAR,
        2, // Exit with result (true if touching any wall)
      ],
    },
    {
      // Condition 1: ALWAYS
      energy_mul: 32,
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      script: [
        OperatorAddress.ASSIGN_BYTE,
        0,
        1,
        OperatorAddress.EXIT_WITH_VAR,
        0,
      ],
    },
  ],
  characters: [
    {
      id: 1,
      position: [
        [64, 1],
        [416, 1],
      ], // Start away from wall, on ground (416 = 13*32, ground level)
      group: 1,
      size: [16, 32],
      health: 100,
      health_cap: 100,
      energy: 100,
      energy_cap: 100,
      power: 10,
      weight: 5,
      jump_force: [160, 32],
      move_speed: [64, 32], // 2 pixels per frame
      armor: [0, 0, 0, 0, 0, 0, 0, 0, 0],
      energy_regen: 1,
      energy_regen_rate: 60,
      energy_charge: 5,
      energy_charge_rate: 30,
      dir: [2, 0], // Start facing right (2 = right in u8 storage, converts to +1.0 in Fixed)
      enmity: 0,
      target_id: null,
      target_type: 0,
      behaviors: [
        [0, 1], // IS_WALL_LEANING -> TURN_AROUND
        [1, 0], // ALWAYS -> RUN
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

    console.log('=== COLLISION TIMING ISSUE DEBUG ===')
    console.log('Testing the execution order hypothesis:')
    console.log('1. Behaviors execute (set velocity)')
    console.log('2. Collision detection constrains velocity')
    console.log('3. Position update applies constrained velocity')
    console.log('4. Collision flags updated AFTER position update')
    console.log('5. Next frame scripts see OLD collision state')

    const gameWrapper = new GameWrapper(JSON.stringify(gameConfig))
    gameWrapper.new_game()

    let hitWall = false
    let turnedAround = false
    let stuckFrames = 0

    for (let frame = 0; frame < 30; frame++) {
      const before = JSON.parse(gameWrapper.get_characters_json())
      gameWrapper.step_frame()
      const after = JSON.parse(gameWrapper.get_characters_json())

      const char = after[0]
      const prevChar = before[0]

      // Convert position and velocity to readable values
      const posX = char.position[0][0] / char.position[0][1]
      const velX = char.velocity[0][0] / char.velocity[0][1]
      const prevPosX = prevChar.position[0][0] / prevChar.position[0][1]
      const prevVelX = prevChar.velocity[0][0] / prevChar.velocity[0][1]

      console.log(`\nFrame ${frame}:`)
      const posY = char.position[1][0] / char.position[1][1]
      const velY = char.velocity[1][0] / char.velocity[1][1]
      const prevPosY = prevChar.position[1][0] / prevChar.position[1][1]
      const prevVelY = prevChar.velocity[1][0] / prevChar.velocity[1][1]

      console.log(
        `  Position: [${prevPosX.toFixed(1)}, ${prevPosY.toFixed(
          1
        )}] -> [${posX.toFixed(1)}, ${posY.toFixed(1)}]`
      )
      console.log(
        `  Velocity: [${prevVelX.toFixed(1)}, ${prevVelY.toFixed(
          1
        )}] -> [${velX.toFixed(1)}, ${velY.toFixed(1)}]`
      )
      console.log(
        `  Direction: [${prevChar.dir[0]}, ${prevChar.dir[1]}] -> [${char.dir[0]}, ${char.dir[1]}]`
      )
      console.log(`  On ground: ${char.collision[2] ? 'YES' : 'NO'}`)
      console.log(`  Collision: [${char.collision.join(', ')}]`)

      // Detect wall hit
      if (!hitWall && (char.collision[1] || char.collision[3])) {
        hitWall = true
        console.log(`  🔥 HIT WALL AT FRAME ${frame}!`)
      }

      // Detect turn around
      if (hitWall && !turnedAround && prevChar.dir[0] !== char.dir[0]) {
        turnedAround = true
        console.log(`  🔄 TURNED AROUND AT FRAME ${frame}!`)
        console.log(
          `     Direction changed from ${prevChar.dir[0]} to ${char.dir[0]}`
        )
      }

      // Detect stuck condition (velocity set but no position change)
      if (
        turnedAround &&
        Math.abs(velX) > 0.1 &&
        Math.abs(posX - prevPosX) < 0.1
      ) {
        stuckFrames++
        console.log(
          `  ⚠️  STUCK FRAME ${stuckFrames}: Velocity=${velX.toFixed(
            1
          )} but position change=${(posX - prevPosX).toFixed(1)}`
        )

        if (stuckFrames >= 3) {
          console.log(`\n🚨 CONFIRMED STUCK CONDITION!`)
          console.log(`Character has been stuck for ${stuckFrames} frames`)
          console.log(`This confirms the collision detection timing issue`)

          // Analyze the problem
          console.log(`\n=== PROBLEM ANALYSIS ===`)
          console.log(`Current position: ${posX.toFixed(1)}`)
          console.log(
            `Character bounds: x=${posX.toFixed(1)} to x=${(posX + 16).toFixed(
              1
            )}`
          )
          console.log(`Left wall at x=16, right wall at x=240`)

          if (posX <= 16) {
            console.log(
              `❌ CHARACTER IS OVERLAPPING LEFT WALL BY ${(16 - posX).toFixed(
                1
              )} pixels`
            )
          } else if (posX + 16 >= 240) {
            console.log(
              `❌ CHARACTER IS OVERLAPPING RIGHT WALL BY ${(
                posX +
                16 -
                240
              ).toFixed(1)} pixels`
            )
          }

          console.log(`\n=== SOLUTION NEEDED ===`)
          console.log(
            `The correct_position_overlap method should push character out of wall`
          )
          console.log(
            `But it seems to not be working properly, or the timing is wrong`
          )
          break
        }
      } else if (turnedAround && Math.abs(posX - prevPosX) > 0.5) {
        console.log(`  ✅ CHARACTER MOVING SUCCESSFULLY AFTER TURN AROUND`)
        break
      }
    }
  } catch (error) {
    console.error('Error:', error)
  }
}

loadWasm()
