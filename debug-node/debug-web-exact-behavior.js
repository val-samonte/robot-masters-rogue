import fs from 'fs'
import path from 'path'

// Test the EXACT same state as the web viewer shows
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
    // Action 0: TURN_AROUND - EXACT from web viewer
    {
      energy_cost: 0,
      cooldown: 0,
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      spawns: [0, 0, 0, 0],
      script: [
        15,
        0,
        0x40, // READ_PROP fixed[0] = ENTITY_DIR_HORIZONTAL
        34,
        0, // NEGATE fixed[0] (flip direction)
        16,
        0x40,
        0, // WRITE_PROP ENTITY_DIR_HORIZONTAL = fixed[0]
        0,
        1, // EXIT with success
      ],
    },
    // Action 1: RUN - EXACT from web viewer
    {
      energy_cost: 0,
      cooldown: 0,
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      spawns: [0, 0, 0, 0],
      script: [
        15,
        0,
        0x40, // READ_PROP fixed[0] = ENTITY_DIR_HORIZONTAL
        15,
        1,
        0x1f, // READ_PROP fixed[1] = CHARACTER_MOVE_SPEED
        32,
        2,
        0,
        1, // MUL fixed[2] = fixed[0] * fixed[1]
        16,
        0x14,
        2, // WRITE_PROP CHARACTER_VEL_X = fixed[2]
        0,
        1, // EXIT with success
      ],
    },
  ],
  conditions: [
    // Condition 0: IS_WALL_LEANING - EXACT from web viewer
    {
      energy_mul: 32,
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      script: [
        15,
        0,
        0x27, // READ_PROP vars[0] = CHARACTER_COLLISION_RIGHT
        15,
        1,
        0x29, // READ_PROP vars[1] = CHARACTER_COLLISION_LEFT
        61,
        2,
        0,
        1, // OR vars[2] = vars[0] OR vars[1]
        91,
        2, // EXIT_WITH_VAR vars[2]
      ],
    },
    // Condition 1: ALWAYS - EXACT from web viewer
    {
      energy_mul: 32,
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      script: [
        20,
        0,
        1, // ASSIGN_BYTE vars[0] = 1
        91,
        0, // EXIT_WITH_VAR vars[0]
      ],
    },
  ],
  characters: [
    {
      id: 1,
      // EXACT position from web viewer: 7168/32 = 224, 6160/32 = 192.5
      position: [
        [7168, 32],
        [6160, 32],
      ],
      group: 1,
      size: [16, 32],
      health: 100,
      health_cap: 100,
      energy: 104, // EXACT energy from web viewer
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
      dir: [2, 0], // EXACT direction from web viewer
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

async function debugWebExactBehavior() {
  try {
    const wasmModule = await import('../wasm-wrapper/pkg/wasm_wrapper.js')
    const { default: init, GameWrapper } = wasmModule

    const wasmPath = path.join(
      process.cwd(),
      '../wasm-wrapper/pkg/wasm_wrapper_bg.wasm'
    )
    const wasmBuffer = fs.readFileSync(wasmPath)
    await init(wasmBuffer)

    console.log('=== Debugging Web Viewer EXACT State ===')
    console.log('Starting with EXACT same state as web viewer:')
    console.log('Position: [7168,32],[6160,32] = (224.0, 192.5)')
    console.log('Velocity: [0,32],[0,32] = (0.0, 0.0)')
    console.log('Direction: [2,0] = facing right')
    console.log('Expected collision: [false,true,true,false]')
    console.log()

    const gameWrapper = new GameWrapper(JSON.stringify(testConfig))
    gameWrapper.new_game()

    console.log('Initial state after new_game():')
    const initial = JSON.parse(gameWrapper.get_characters_json())
    const char = initial[0]
    const posX = char.position[0][0] / char.position[0][1]
    const posY = char.position[1][0] / char.position[1][1]
    const velX = char.velocity[0][0] / char.velocity[0][1]
    const velY = char.velocity[1][0] / char.velocity[1][1]
    console.log(`Position: (${posX}, ${posY})`)
    console.log(`Velocity: (${velX}, ${velY})`)
    console.log(`Direction: [${char.dir[0]}, ${char.dir[1]}]`)
    console.log(`Collision: [${char.collision.join(', ')}]`)
    console.log(`Energy: ${char.energy}`)
    console.log()

    console.log('Testing behavior execution:')

    // Test condition evaluation manually
    console.log('1. Testing IS_WALL_LEANING condition:')
    console.log(`   Right collision: ${char.collision[1]} (should be true)`)
    console.log(`   Left collision: ${char.collision[3]} (should be false)`)
    console.log(
      `   OR result: ${char.collision[1] || char.collision[3]} (should be true)`
    )
    console.log(`   Expected: IS_WALL_LEANING should return true`)
    console.log()

    console.log('2. Testing ALWAYS condition:')
    console.log(`   Expected: ALWAYS should return true`)
    console.log()

    console.log('3. Behavior priority:')
    console.log(
      `   Behavior [0,0]: IS_WALL_LEANING -> TURN_AROUND (higher priority)`
    )
    console.log(`   Behavior [1,1]: ALWAYS -> RUN (lower priority)`)
    console.log(
      `   Expected: TURN_AROUND should execute because IS_WALL_LEANING is true`
    )
    console.log()

    // Step through frames to see what happens
    for (let frame = 0; frame < 10; frame++) {
      const before = JSON.parse(gameWrapper.get_characters_json())
      gameWrapper.step_frame()
      const after = JSON.parse(gameWrapper.get_characters_json())

      const beforeChar = before[0]
      const afterChar = after[0]

      const beforePosX = beforeChar.position[0][0] / beforeChar.position[0][1]
      const afterPosX = afterChar.position[0][0] / afterChar.position[0][1]
      const afterVelX = afterChar.velocity[0][0] / afterChar.velocity[0][1]

      console.log(`Frame ${frame + 1}:`)
      console.log(
        `  Before: pos=${beforePosX.toFixed(1)}, dir=${
          beforeChar.dir[0]
        }, collision=[${beforeChar.collision.join(', ')}]`
      )
      console.log(
        `  After:  pos=${afterPosX.toFixed(1)}, dir=${
          afterChar.dir[0]
        }, vel=${afterVelX.toFixed(1)}, collision=[${afterChar.collision.join(
          ', '
        )}]`
      )

      if (beforeChar.dir[0] !== afterChar.dir[0]) {
        console.log(
          `  🔄 DIRECTION CHANGED: ${beforeChar.dir[0]} -> ${afterChar.dir[0]}`
        )
        console.log(`  ✅ TURN_AROUND action executed successfully!`)
      }

      if (Math.abs(afterVelX) > 0.1) {
        console.log(`  🏃 MOVEMENT: velocity = ${afterVelX.toFixed(1)}`)
        if (afterChar.dir[0] === 0 && afterVelX < 0) {
          console.log(`  ✅ Moving left correctly after turn-around!`)
        }
      }

      if (afterChar.dir[0] === 0 && Math.abs(afterVelX) < 0.1) {
        console.log(
          `  ⚠️  Facing left but not moving - possible RUN action issue with negative direction`
        )
      }

      console.log()
    }

    gameWrapper.free()
  } catch (error) {
    console.error('Error:', error)
  }
}

debugWebExactBehavior()
