import fs from 'fs'
import path from 'path'

// Test with only one behavior that triggers both actions
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
      // Combined script: TURN_AROUND + RUN
      script: [
        // First: Turn around (flip direction)
        15,
        0,
        0x40, // READ_PROP ENTITY_DIR_HORIZONTAL → fixed[0]
        34,
        0, // NEGATE fixed[0] (flip direction)
        16,
        0x40,
        0,
        0, // WRITE_PROP ENTITY_DIR_HORIZONTAL = fixed[0]

        // Then: Run in new direction
        15,
        0,
        0x40, // READ_PROP ENTITY_DIR_HORIZONTAL → fixed[0] (now flipped)
        15,
        1,
        0x1f, // READ_PROP CHARACTER_MOVE_SPEED → fixed[1]
        32,
        2,
        0,
        1, // MUL fixed[2] = fixed[0] * fixed[1]
        16,
        0x14,
        2,
        0, // WRITE_PROP CHARACTER_VEL_X = fixed[2]

        0,
        1, // EXIT success
      ],
    },
    {
      energy_cost: 0,
      cooldown: 0,
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      spawns: [0, 0, 0, 0],
      script: [15, 0, 0x40, 15, 1, 0x1f, 32, 2, 0, 1, 16, 0x14, 2, 0, 1], // RUN (for non-wall movement)
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
      script: [15, 0, 0x27, 15, 1, 0x29, 61, 2, 0, 1, 35, 2, 91, 2], // NOT_WALL_LEANING (inverted)
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
        [0, 0], // IS_WALL_LEANING → TURN_AROUND_AND_RUN (combined action)
        [1, 1], // NOT_WALL_LEANING → RUN (normal movement)
      ],
    },
  ],
  spawns: [],
  status_effects: [],
}

async function testSingleBehavior() {
  try {
    const wasmModule = await import('../wasm-wrapper/pkg/wasm_wrapper.js')
    const { default: init, GameWrapper } = wasmModule

    const wasmPath = path.join(
      process.cwd(),
      '../wasm-wrapper/pkg/wasm_wrapper_bg.wasm'
    )
    const wasmBuffer = fs.readFileSync(wasmPath)
    await init(wasmBuffer)

    console.log('=== Testing Single Combined Action ===')
    console.log('Action 0: TURN_AROUND_AND_RUN (combined script)')
    console.log('Action 1: RUN (normal movement)')
    console.log('Condition 0: IS_WALL_LEANING → Action 0')
    console.log('Condition 1: NOT_WALL_LEANING → Action 1')
    console.log()

    const gameWrapper = new GameWrapper(JSON.stringify(testConfig))
    gameWrapper.new_game()

    for (let frame = 0; frame < 50; frame++) {
      const state = JSON.parse(gameWrapper.get_characters_json())
      const char = state[0]
      const posX = char.position[0][0] / char.position[0][1]
      const velX = char.velocity[0][0] / char.velocity[0][1]
      const dirValue = char.dir[0]
      const collision = char.collision

      if (
        frame % 5 === 0 ||
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
          console.log(`  → Wall collision! Should execute TURN_AROUND_AND_RUN`)
        } else {
          console.log(`  → No wall collision. Should execute RUN`)
        }
      }

      gameWrapper.step_frame()
    }

    gameWrapper.free()
  } catch (error) {
    console.error('Error:', error)
  }
}

testSingleBehavior()
