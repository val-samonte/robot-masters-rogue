import fs from 'fs'
import path from 'path'

// Test combined script in isolation (no wall collision)
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
  ],
  conditions: [
    {
      energy_mul: 32,
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      script: [20, 0, 1, 91, 0], // ALWAYS (trigger every frame)
    },
  ],
  characters: [
    {
      id: 1,
      position: [
        [100, 1],
        [192, 1],
      ], // Middle of room, no walls nearby
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
        [0, 0], // ALWAYS → TURN_AROUND_AND_RUN
      ],
    },
  ],
  spawns: [],
  status_effects: [],
}

async function testCombinedScriptIsolated() {
  try {
    const wasmModule = await import('../wasm-wrapper/pkg/wasm_wrapper.js')
    const { default: init, GameWrapper } = wasmModule

    const wasmPath = path.join(
      process.cwd(),
      '../wasm-wrapper/pkg/wasm_wrapper_bg.wasm'
    )
    const wasmBuffer = fs.readFileSync(wasmPath)
    await init(wasmBuffer)

    console.log('=== Testing Combined Script in Isolation ===')
    console.log('Character in middle of room, no wall collisions')
    console.log('ALWAYS condition → TURN_AROUND_AND_RUN action every frame')
    console.log(
      'Expected: Direction flips every frame AND velocity is set correctly'
    )
    console.log()

    const gameWrapper = new GameWrapper(JSON.stringify(testConfig))
    gameWrapper.new_game()

    for (let frame = 0; frame < 10; frame++) {
      const state = JSON.parse(gameWrapper.get_characters_json())
      const char = state[0]
      const posX = char.position[0][0] / char.position[0][1]
      const velX = char.velocity[0][0] / char.velocity[0][1]
      const dirValue = char.dir[0]
      const collision = char.collision

      console.log(
        `Frame ${frame}: pos=${posX.toFixed(1)}, vel=${velX.toFixed(
          1
        )}, dir=${dirValue}, collision=[${collision.join(', ')}]`
      )

      // Analyze what should happen
      if (dirValue === 2) {
        // Facing right
        console.log(`  → Facing RIGHT: script should set velocity to +2.0`)
        if (Math.abs(velX - 2.0) < 0.1) {
          console.log(`  ✅ Velocity correct`)
        } else {
          console.log(`  ❌ Velocity wrong! Expected +2.0, got ${velX}`)
        }
      } else if (dirValue === 0) {
        // Facing left
        console.log(`  → Facing LEFT: script should set velocity to -2.0`)
        if (Math.abs(velX + 2.0) < 0.1) {
          console.log(`  ✅ Velocity correct`)
        } else {
          console.log(`  ❌ Velocity wrong! Expected -2.0, got ${velX}`)
        }
      }

      gameWrapper.step_frame()
    }

    console.log()
    console.log('=== ANALYSIS ===')
    console.log('If velocity is always 0.0:')
    console.log('  → The WRITE_PROP CHARACTER_VEL_X operation is not working')
    console.log(
      '  → OR something is immediately overriding the velocity after it is set'
    )
    console.log('If velocity is correct:')
    console.log(
      '  → The script works, but something specific to wall collision breaks it'
    )

    gameWrapper.free()
  } catch (error) {
    console.error('Error:', error)
  }
}

testCombinedScriptIsolated()
