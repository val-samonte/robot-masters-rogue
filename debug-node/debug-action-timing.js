import fs from 'fs'
import path from 'path'

// Test with TURN_AROUND having a 1-frame cooldown to separate the actions
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
      cooldown: 1, // 1-frame cooldown to prevent rapid oscillation
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
        [0, 0], // IS_WALL_LEANING → TURN_AROUND (with cooldown)
        [1, 1], // ALWAYS → RUN (no cooldown)
      ],
    },
  ],
  spawns: [],
  status_effects: [],
}

async function testActionTiming() {
  try {
    const wasmModule = await import('../wasm-wrapper/pkg/wasm_wrapper.js')
    const { default: init, GameWrapper } = wasmModule

    const wasmPath = path.join(
      process.cwd(),
      '../wasm-wrapper/pkg/wasm_wrapper_bg.wasm'
    )
    const wasmBuffer = fs.readFileSync(wasmPath)
    await init(wasmBuffer)

    console.log('=== Testing Action Timing with Cooldown ===')
    console.log('TURN_AROUND: cooldown=1 (prevents rapid oscillation)')
    console.log('RUN: cooldown=0 (executes every frame)')
    console.log('Expected behavior:')
    console.log('1. Character runs right until hitting wall')
    console.log('2. TURN_AROUND executes once, flips direction to left')
    console.log('3. TURN_AROUND goes on cooldown for 1 frame')
    console.log('4. RUN continues executing, now moves character left')
    console.log('5. Character moves away from wall')
    console.log()

    const gameWrapper = new GameWrapper(JSON.stringify(testConfig))
    gameWrapper.new_game()

    let lastDirection = 2
    let directionChanges = 0

    for (let frame = 0; frame < 150; frame++) {
      const state = JSON.parse(gameWrapper.get_characters_json())
      const char = state[0]
      const posX = char.position[0][0] / char.position[0][1]
      const velX = char.velocity[0][0] / char.velocity[0][1]
      const dirValue = char.dir[0]
      const collision = char.collision

      // Track direction changes
      if (dirValue !== lastDirection) {
        directionChanges++
        console.log(
          `🔄 Direction change #${directionChanges} at frame ${frame}: ${lastDirection} → ${dirValue}`
        )
        lastDirection = dirValue
      }

      // Log key frames
      if (
        frame % 25 === 0 ||
        Math.abs(velX) < 0.1 ||
        collision[1] ||
        collision[3] ||
        dirValue !== lastDirection
      ) {
        console.log(
          `Frame ${frame}: pos=${posX.toFixed(1)}, vel=${velX.toFixed(
            1
          )}, dir=${dirValue}, collision=[${collision.join(', ')}]`
        )

        if (collision[1] || collision[3]) {
          console.log(
            `  → Wall collision! TURN_AROUND should execute (if not on cooldown)`
          )
        }
        if (Math.abs(velX) < 0.1) {
          console.log(`  ⚠️ Zero velocity - character stuck!`)
        }
      }

      gameWrapper.step_frame()
    }

    console.log()
    console.log(`=== RESULTS ===`)
    console.log(`Total direction changes: ${directionChanges}`)
    if (directionChanges >= 2) {
      console.log(`✅ Character is turning around and moving!`)
    } else if (directionChanges === 1) {
      console.log(`⚠️ Character turned around once but may be stuck`)
    } else {
      console.log(`❌ No direction changes - turn-around not working`)
    }

    gameWrapper.free()
  } catch (error) {
    console.error('Error:', error)
  }
}

testActionTiming()
