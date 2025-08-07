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
  EQUAL: 50,
  NOT: 60,
  OR: 61,
  AND: 62,
  EXIT_WITH_VAR: 91,
}

const PropertyAddress = {
  CHARACTER_VEL_X: 0x14,
  CHARACTER_MOVE_SPEED: 0x1f,
  CHARACTER_COLLISION_RIGHT: 0x27,
  CHARACTER_COLLISION_LEFT: 0x29,
  ENTITY_DIR_HORIZONTAL: 0x40,
}

// Game configuration - simplified to focus on the issue
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
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  ],
  actions: [
    {
      // RUN action
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
      // TURN_AROUND action
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
      // IS_WALL_LEANING condition - simplified
      energy_mul: 32,
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      script: [
        OperatorAddress.READ_PROP,
        0,
        PropertyAddress.ENTITY_DIR_HORIZONTAL, // Read direction to fixed[0]
        OperatorAddress.READ_PROP,
        1,
        PropertyAddress.CHARACTER_COLLISION_RIGHT, // Read right collision to vars[1]
        OperatorAddress.READ_PROP,
        2,
        PropertyAddress.CHARACTER_COLLISION_LEFT, // Read left collision to vars[2]
        OperatorAddress.ASSIGN_FIXED,
        3,
        1,
        1, // fixed[3] = 1.0 (facing right)
        OperatorAddress.ASSIGN_FIXED,
        4,
        255,
        1, // fixed[4] = -1.0 (facing left, using 255 as -1 in u8)
        OperatorAddress.EQUAL,
        5,
        0,
        3, // vars[5] = (dir == 1) ? 1 : 0
        OperatorAddress.EQUAL,
        6,
        0,
        4, // vars[6] = (dir == -1) ? 1 : 0
        OperatorAddress.AND,
        7,
        5,
        1, // vars[7] = facing_right && right_collision
        OperatorAddress.AND,
        8,
        6,
        2, // vars[8] = facing_left && left_collision
        OperatorAddress.OR,
        9,
        7,
        8, // vars[9] = wall_leaning_right || wall_leaning_left
        OperatorAddress.EXIT_WITH_VAR,
        9, // Return result
      ],
    },
    {
      // ALWAYS condition
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
        [32, 1],
        [384, 1],
      ], // Start close to left wall, on ground
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

    console.log('=== DEBUGGING STUCK CHARACTER ISSUE ===')
    console.log(
      'Character starts at x=32, facing right, should move right until hitting wall'
    )
    console.log(
      'Then turn around and move left, but gets stuck after turning around'
    )

    const gameWrapper = new GameWrapper(JSON.stringify(gameConfig))
    gameWrapper.new_game()

    let hitWall = false
    let turnedAround = false

    for (let frame = 0; frame < 50; frame++) {
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
      console.log(
        `  Position: ${prevPosX} -> ${posX} (${posX - prevPosX > 0 ? '+' : ''}${
          posX - prevPosX
        })`
      )
      console.log(`  Velocity: ${prevVelX} -> ${velX}`)
      console.log(
        `  Direction: [${prevChar.dir[0]}, ${prevChar.dir[1]}] -> [${char.dir[0]}, ${char.dir[1]}]`
      )
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
      }

      // Detect stuck condition
      if (turnedAround && velX !== 0 && Math.abs(posX - prevPosX) < 0.1) {
        console.log(`  ⚠️  STUCK DETECTED AT FRAME ${frame}!`)
        console.log(`     Velocity is ${velX} but position barely changed`)
        console.log(
          `     This suggests collision detection is preventing movement`
        )

        // Check if character is overlapping with wall
        console.log(`     Character bounds: x=${posX} to x=${posX + 16}`)
        console.log(`     Left wall at x=16, right wall at x=240`)

        if (posX <= 16) {
          console.log(`     CHARACTER IS OVERLAPPING LEFT WALL!`)
        } else if (posX + 16 >= 240) {
          console.log(`     CHARACTER IS OVERLAPPING RIGHT WALL!`)
        }

        break
      }

      // Stop if character moves successfully after turning around
      if (turnedAround && Math.abs(posX - prevPosX) > 1) {
        console.log(`  ✅ CHARACTER MOVING SUCCESSFULLY AFTER TURN AROUND`)
        break
      }
    }

    console.log('\n=== ANALYSIS ===')
    console.log('The issue is likely in the execution order:')
    console.log('1. Behavior scripts execute (set velocity)')
    console.log('2. Collision detection constrains velocity')
    console.log('3. Position is updated with constrained velocity')
    console.log('4. Collision flags are updated AFTER position update')
    console.log(
      '5. Next frame, scripts see collision flags from PREVIOUS frame'
    )
    console.log('')
    console.log('If character overlaps wall by 1px, collision detection will')
    console.log('always constrain movement, causing permanent stuck state.')
  } catch (error) {
    console.error('Error:', error)
  }
}

loadWasm()
