import fs from 'fs'
import path from 'path'

// Test TURN_AROUND script that pushes character away from wall
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
      // TURN_AROUND_PUSH_AND_RUN script
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

        // Step 4: Push character away from wall by 2 pixels
        // Read current position
        15,
        1,
        0x12, // READ_PROP CHARACTER_POS_X → fixed[1]

        // Calculate push distance: new_direction * 2 pixels
        20,
        2,
        2, // ASSIGN fixed[2] = 2 (push distance)
        32,
        3,
        0,
        2, // MUL fixed[3] = fixed[0] * fixed[2] (direction * 2)

        // Add push to current position
        31,
        4,
        1,
        3, // ADD fixed[4] = fixed[1] + fixed[3] (new position)

        // Write new position
        16,
        0x12,
        4,
        0, // WRITE_PROP CHARACTER_POS_X = fixed[4]

        // Step 5: Read move speed
        15,
        5,
        0x1f, // READ_PROP CHARACTER_MOVE_SPEED → fixed[5]

        // Step 6: Calculate velocity (new_direction * move_speed)
        32,
        6,
        0,
        5, // MUL fixed[6] = fixed[0] * fixed[5]

        // Step 7: Set velocity
        16,
        0x14,
        6,
        0, // WRITE_PROP CHARACTER_VEL_X = fixed[6]

        // Step 8: Exit
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
        [0, 0], // IS_WALL_LEANING → TURN_AROUND_PUSH_AND_RUN
        [1, 1], // ALWAYS → RUN
      ],
    },
  ],
  spawns: [],
  status_effects: [],
}

async function testPushAwayFromWall() {
  try {
    const wasmModule = await import('../wasm-wrapper/pkg/wasm_wrapper.js')
    const { default: init, GameWrapper } = wasmModule

    const wasmPath = path.join(
      process.cwd(),
      '../wasm-wrapper/pkg/wasm_wrapper_bg.wasm'
    )
    const wasmBuffer = fs.readFileSync(wasmPath)
    await init(wasmBuffer)

    console.log('=== Testing TURN_AROUND with Wall Push ===')
    console.log(
      'Strategy: When hitting wall, turn around AND push character 2 pixels away'
    )
    console.log('Expected: Character bounces between walls continuously')
    console.log()

    const gameWrapper = new GameWrapper(JSON.stringify(testConfig))
    gameWrapper.new_game()

    let lastDirection = 2
    let directionChanges = 0
    let lastPos = 32

    for (let frame = 0; frame < 200; frame++) {
      const state = JSON.parse(gameWrapper.get_characters_json())
      const char = state[0]
      const posX = char.position[0][0] / char.position[0][1]
      const velX = char.velocity[0][0] / char.velocity[0][1]
      const dirValue = char.dir[0]
      const collision = char.collision

      // Track direction changes
      if (dirValue !== lastDirection) {
        directionChanges++
        const dirName = dirValue === 0 ? 'LEFT' : 'RIGHT'
        const posChange = posX - lastPos
        console.log(
          `🔄 Direction change #${directionChanges} at frame ${frame}: Now facing ${dirName}`
        )
        console.log(
          `   Position: ${lastPos.toFixed(1)} → ${posX.toFixed(
            1
          )} (change: ${posChange.toFixed(1)})`
        )
        console.log(`   Velocity: ${velX.toFixed(1)}`)
        lastDirection = dirValue
        lastPos = posX
      }

      // Log key frames
      if (
        frame % 25 === 0 ||
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
          console.log(
            `  → Wall collision! TURN_AROUND_PUSH_AND_RUN should execute`
          )
        }
        if (Math.abs(velX) < 0.1) {
          console.log(`  ⚠️ Zero velocity detected`)
        }
      }

      // Check for successful bouncing
      if (directionChanges >= 4) {
        console.log(`\n🎉 SUCCESS! Character is bouncing between walls!`)
        console.log(`   Direction changes: ${directionChanges}`)
        break
      }

      gameWrapper.step_frame()
    }

    console.log(`\n=== RESULTS ===`)
    console.log(`Total direction changes: ${directionChanges}`)
    if (directionChanges >= 4) {
      console.log(`✅ Turn-around behavior working with wall push!`)
    } else if (directionChanges >= 1) {
      console.log(
        `⚠️ Partial success - some direction changes but may be stuck`
      )
    } else {
      console.log(`❌ No direction changes - turn-around not working`)
    }

    gameWrapper.free()
  } catch (error) {
    console.error('Error:', error)
  }
}

testPushAwayFromWall()
