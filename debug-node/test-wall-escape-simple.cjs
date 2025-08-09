const { GameWrapper } = require('../wasm-wrapper/pkg/wasm_wrapper.js')

// Test configuration with correct format for turn-around behavior
const gameConfig = {
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
      dir: [2, 0],
      enmity: 0,
      target_id: null,
      target_type: 0,
      behaviors: [
        [0, 0],
        [1, 1],
      ],
    },
  ],
  actions: [
    {
      energy_cost: 0,
      cooldown: 0,
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      spawns: [0, 0, 0, 0],
      script: [15, 0, 21, 15, 1, 2, 1, 16, 1, 0, 0, 14, 22, 1, 13, 0],
    },
    {
      energy_cost: 0,
      cooldown: 0,
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      spawns: [0, 0, 0, 0],
      script: [15, 0, 21, 17, 1, 0, 0, 15, 2, 1, 15, 3, 0, 14, 21, 1, 13, 0],
    },
  ],
  conditions: [
    {
      energy_mul: 1,
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      script: [15, 0, 1, 13, 0],
    },
    {
      energy_mul: 1,
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      script: [15, 0, 25, 15, 1, 26, 16, 2, 0, 1, 12, 2],
    },
  ],
  spawns: [],
  status_effects: [],
}

console.log('=== Testing Wall Escape Fix ===\n')

try {
  const gameWrapper = new GameWrapper(JSON.stringify(gameConfig))
  gameWrapper.new_game()

  let directionChanges = 0
  let lastDirection = 2
  let wallEscapeSuccess = false

  // Run until character hits wall and test escape
  for (let frame = 0; frame < 110; frame++) {
    const before = JSON.parse(gameWrapper.get_characters_json())
    gameWrapper.step_frame()
    const after = JSON.parse(gameWrapper.get_characters_json())

    const char = after[0]
    const pos = char.position[0][0] / char.position[0][1] // Convert Fixed to float
    const vel = char.velocity[0][0] / char.velocity[0][1] // Convert Fixed to float
    const dir = char.dir[0]
    const collision = char.collision

    // Track direction changes
    if (dir !== lastDirection) {
      directionChanges++
      lastDirection = dir
      console.log(
        `🔄 Direction change #${directionChanges} at frame ${frame}: Now facing ${
          dir === 0 ? 'LEFT' : dir === 2 ? 'RIGHT' : 'UNKNOWN'
        }`
      )
    }

    // Focus on critical frames around wall collision
    if (frame >= 94 && frame <= 105) {
      console.log(
        `Frame ${frame}: pos=${pos.toFixed(1)}, vel=${vel.toFixed(
          1
        )}, dir=${dir}, collision=[${collision.join(', ')}]`
      )

      if (pos >= 224) {
        console.log(`  🔍 Character at wall boundary (pos=${pos.toFixed(1)})`)
        console.log(
          `  🔍 Right edge at: ${(pos + 16).toFixed(1)} (wall at 240.0)`
        )

        if (collision[1]) {
          // Right collision
          console.log(`  🚨 RIGHT COLLISION DETECTED`)
        }
        if (collision[2]) {
          // Bottom collision
          console.log(`  🚨 BOTTOM COLLISION DETECTED`)
        }

        if (vel === 0 && pos >= 224) {
          console.log(`  ❌ VELOCITY IS ZERO - Wall escape failed!`)
        } else if (vel !== 0) {
          console.log(`  ✅ Velocity preserved: ${vel.toFixed(1)}`)
        }
      }
    }

    // Test success: character should move away from wall after turning around
    if (frame > 97 && directionChanges >= 1) {
      if (vel !== 0 && ((dir === 0 && vel < 0) || (dir === 2 && vel > 0))) {
        console.log(`\n🎉 SUCCESS! Wall escape working at frame ${frame}!`)
        console.log(`   Character moving with velocity: ${vel.toFixed(1)}`)
        console.log(`   Direction: ${dir === 0 ? 'LEFT' : 'RIGHT'}`)
        console.log(`   Position: ${pos.toFixed(1)}`)
        wallEscapeSuccess = true
        break
      }
    }

    // Stop if stuck oscillating
    if (frame > 100 && pos >= 224 && vel === 0) {
      console.log(`\n❌ FAILED: Character stuck oscillating at wall`)
      break
    }
  }

  console.log(`\n=== SUMMARY ===`)
  console.log(`Direction changes: ${directionChanges}`)

  if (directionChanges > 0) {
    console.log(`✅ Turn-around mechanism is working`)
  } else {
    console.log(`❌ Turn-around mechanism failed`)
  }

  if (wallEscapeSuccess) {
    console.log(`✅ Wall escape system is working`)
    console.log(`🎉 TASK 17 SUCCESS: Turn-around velocity bug is FIXED!`)
  } else {
    console.log(`❌ Wall escape system failed`)
    console.log(`❌ TASK 17 FAILED: Turn-around velocity bug still exists`)
  }
} catch (error) {
  console.error('Error:', error)
}
