import fs from 'fs'
import path from 'path'

// Test complete turn-around behavior with the fixed collision system
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

async function testCompleteTurnaround() {
  try {
    const wasmModule = await import('../wasm-wrapper/pkg/wasm_wrapper.js')
    const { default: init, GameWrapper } = wasmModule

    const wasmPath = path.join(
      process.cwd(),
      '../wasm-wrapper/pkg/wasm_wrapper_bg.wasm'
    )
    const wasmBuffer = fs.readFileSync(wasmPath)
    await init(wasmBuffer)

    console.log('=== Testing Complete Turn-Around Behavior ===')
    console.log(
      'Expected: Character runs right → hits wall → turns around → runs left → hits wall → turns around → repeats'
    )
    console.log()

    const gameWrapper = new GameWrapper(JSON.stringify(testConfig))
    gameWrapper.new_game()

    let rightWallHits = 0
    let leftWallHits = 0
    let turnarounds = 0

    for (let frame = 0; frame < 200; frame++) {
      const state = JSON.parse(gameWrapper.get_characters_json())
      const char = state[0]
      const posX = char.position[0][0] / char.position[0][1]
      const velX = char.velocity[0][0] / char.velocity[0][1]

      // Log key events
      if (
        frame % 50 === 0 ||
        Math.abs(velX) < 0.1 ||
        (frame > 0 && char.dir[0] !== state.prevDir)
      ) {
        console.log(
          `Frame ${frame}: pos=${posX.toFixed(1)}, vel=${velX.toFixed(
            1
          )}, dir=${char.dir[0]}, collision=[${char.collision.join(', ')}]`
        )
      }

      // Detect wall hits and direction changes
      if (posX >= 224 && char.collision[1] && char.dir[0] === 2) {
        rightWallHits++
        console.log(`🔴 RIGHT WALL HIT #${rightWallHits} at frame ${frame}`)
      }

      if (posX <= 16 && char.collision[3] && char.dir[0] === 0) {
        leftWallHits++
        console.log(`🔵 LEFT WALL HIT #${leftWallHits} at frame ${frame}`)
      }

      // Detect direction changes (turnarounds)
      if (frame > 0) {
        const prevState = JSON.parse(gameWrapper.get_characters_json())
        if (char.dir[0] !== prevState[0]?.dir[0]) {
          turnarounds++
          const direction = char.dir[0] === 0 ? 'LEFT' : 'RIGHT'
          console.log(
            `🔄 TURN-AROUND #${turnarounds} at frame ${frame}: Now facing ${direction}`
          )
        }
      }

      // Success criteria: multiple successful turnarounds
      if (turnarounds >= 4) {
        console.log(`\n🎉 SUCCESS! Complete turn-around behavior working!`)
        console.log(`   - Right wall hits: ${rightWallHits}`)
        console.log(`   - Left wall hits: ${leftWallHits}`)
        console.log(`   - Total turnarounds: ${turnarounds}`)
        console.log(`   - Character bouncing between walls correctly!`)
        break
      }

      gameWrapper.step_frame()
    }

    if (turnarounds < 4) {
      console.log(`\n⚠️ Partial success: ${turnarounds} turnarounds detected`)
      console.log(`   - Right wall hits: ${rightWallHits}`)
      console.log(`   - Left wall hits: ${leftWallHits}`)
      if (turnarounds > 0) {
        console.log(
          `   - Turn-around behavior is working but may need more time`
        )
      }
    }

    gameWrapper.free()
  } catch (error) {
    console.error('Error:', error)
  }
}

testCompleteTurnaround()
