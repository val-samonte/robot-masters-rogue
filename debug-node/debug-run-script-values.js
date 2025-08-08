import fs from 'fs'
import path from 'path'

// Debug the exact values in the RUN script
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
        [0, 0], // IS_WALL_LEANING -> TURN_AROUND
        [1, 1], // ALWAYS -> RUN
      ],
    },
  ],
  spawns: [],
  status_effects: [],
}

async function debugRunScript() {
  try {
    const wasmModule = await import('../wasm-wrapper/pkg/wasm_wrapper.js')
    const { default: init, GameWrapper } = wasmModule

    const wasmPath = path.join(
      process.cwd(),
      '../wasm-wrapper/pkg/wasm_wrapper_bg.wasm'
    )
    const wasmBuffer = fs.readFileSync(wasmPath)
    await init(wasmBuffer)

    console.log('=== Debugging RUN Script Values ===')
    console.log()

    const gameWrapper = new GameWrapper(JSON.stringify(testConfig))
    gameWrapper.new_game()

    // Test with character facing right (should work)
    console.log('--- Testing RIGHT movement (should work) ---')
    for (let frame = 0; frame < 5; frame++) {
      const state = JSON.parse(gameWrapper.get_characters_json())
      const char = state[0]
      const posX = char.position[0][0] / char.position[0][1]
      const velX = char.velocity[0][0] / char.velocity[0][1]
      const dirValue = char.dir[0]

      console.log(
        `Frame ${frame}: pos=${posX.toFixed(1)}, vel=${velX.toFixed(
          1
        )}, dir=${dirValue}`
      )

      // RUN script breakdown:
      // 15, 0, 0x40 - READ_PROP ENTITY_DIR_HORIZONTAL into fixed[0]
      // 15, 1, 0x1f - READ_PROP CHARACTER_MOVE_SPEED into fixed[1]
      // 32, 2, 0, 1 - MUL fixed[2] = fixed[0] * fixed[1]
      // 16, 0x14, 2, 0, 1 - WRITE_PROP CHARACTER_VEL_X from fixed[2]

      // Expected for RIGHT (dir=2):
      // fixed[0] = (2-1) = 1.0
      // fixed[1] = 2.0 (move_speed)
      // fixed[2] = 1.0 * 2.0 = 2.0
      // velX should be 2.0

      gameWrapper.step_frame()
    }

    console.log()
    console.log('--- Manually setting direction to LEFT ---')

    // Force character to face left
    const leftConfig = JSON.parse(JSON.stringify(testConfig))
    leftConfig.characters[0].dir = [0, 0] // Face left
    leftConfig.characters[0].position = [
      [100, 1],
      [192, 1],
    ] // Move away from wall

    const gameWrapper2 = new GameWrapper(JSON.stringify(leftConfig))
    gameWrapper2.new_game()

    console.log('--- Testing LEFT movement (currently broken) ---')
    for (let frame = 0; frame < 5; frame++) {
      const state = JSON.parse(gameWrapper2.get_characters_json())
      const char = state[0]
      const posX = char.position[0][0] / char.position[0][1]
      const velX = char.velocity[0][0] / char.velocity[0][1]
      const dirValue = char.dir[0]

      console.log(
        `Frame ${frame}: pos=${posX.toFixed(1)}, vel=${velX.toFixed(
          1
        )}, dir=${dirValue}`
      )

      // Expected for LEFT (dir=0):
      // fixed[0] = (0-1) = -1.0
      // fixed[1] = 2.0 (move_speed)
      // fixed[2] = -1.0 * 2.0 = -2.0
      // velX should be -2.0

      gameWrapper2.step_frame()
    }

    console.log()
    console.log('=== ANALYSIS ===')
    console.log(
      'RUN Script: [15, 0, 0x40, 15, 1, 0x1f, 32, 2, 0, 1, 16, 0x14, 2, 0, 1]'
    )
    console.log('Breakdown:')
    console.log(
      '  15, 0, 0x40     - READ_PROP ENTITY_DIR_HORIZONTAL(0x40) → fixed[0]'
    )
    console.log(
      '  15, 1, 0x1f     - READ_PROP CHARACTER_MOVE_SPEED(0x1f) → fixed[1]'
    )
    console.log('  32, 2, 0, 1     - MUL fixed[2] = fixed[0] * fixed[1]')
    console.log(
      '  16, 0x14, 2, 0, 1 - WRITE_PROP CHARACTER_VEL_X(0x14) = fixed[2]'
    )
    console.log()
    console.log('Expected values:')
    console.log(
      '  RIGHT (dir=2): fixed[0]=1.0, fixed[1]=2.0, fixed[2]=2.0, velX=2.0'
    )
    console.log(
      '  LEFT (dir=0):  fixed[0]=-1.0, fixed[1]=2.0, fixed[2]=-2.0, velX=-2.0'
    )
    console.log()
    console.log('If LEFT movement shows velX=0.0, then either:')
    console.log('  1. ENTITY_DIR_HORIZONTAL is returning 0.0 instead of -1.0')
    console.log('  2. The multiplication is not working correctly')
    console.log('  3. CHARACTER_VEL_X write is not working correctly')

    gameWrapper.free()
    gameWrapper2.free()
  } catch (error) {
    console.error('Error:', error)
  }
}

debugRunScript()
