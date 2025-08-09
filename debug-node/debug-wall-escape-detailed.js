import { GameWrapper } from '../wasm-wrapper/pkg/wasm_wrapper.js'

// Test configuration with turn-around behavior
const gameConfig = {
  seed: 12345,
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
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  ],
  characters: [
    {
      id: 0,
      pos: [32, 192],
      size: [16, 16],
      dir: [2, 0],
      vel: [0, 0],
      health: 100,
      health_cap: 100,
      energy: 100,
      energy_cap: 100,
      energy_regen: 1,
      energy_regen_rate: 60,
      energy_charge: 2,
      energy_charge_rate: 30,
      power: 10,
      weight: 1,
      jump_force: 5,
      move_speed: 2,
      armor_head: 0,
      armor_body: 0,
      armor_arms: 0,
      armor_legs: 0,
      behaviors: [
        {
          condition_id: 0,
          action_id: 0,
          cooldown: 0,
        },
        {
          condition_id: 1,
          action_id: 1,
          cooldown: 0,
        },
      ],
    },
  ],
  action_definitions: [
    {
      id: 0,
      script: [15, 0, 21, 15, 1, 2, 1, 16, 1, 0, 0, 14, 22, 1, 13, 0],
    },
    {
      id: 1,
      script: [15, 0, 21, 17, 1, 0, 0, 15, 2, 1, 15, 3, 0, 14, 21, 1, 13, 0],
    },
  ],
  condition_definitions: [
    {
      id: 0,
      script: [15, 0, 1, 13, 0],
    },
    {
      id: 1,
      script: [15, 0, 25, 15, 1, 26, 16, 2, 0, 1, 12, 2],
    },
  ],
  spawn_definitions: [],
  status_effect_definitions: [],
}

console.log('=== Detailed Wall Escape Debug ===\n')

try {
  const gameWrapper = new GameWrapper(JSON.stringify(gameConfig))
  gameWrapper.new_game()

  // Run until character hits wall
  for (let frame = 0; frame < 100; frame++) {
    const before = JSON.parse(gameWrapper.get_characters_json())
    gameWrapper.step_frame()
    const after = JSON.parse(gameWrapper.get_characters_json())

    const char = after[0]
    const pos = char.pos[0]
    const vel = char.vel[0]
    const dir = char.dir[0]
    const collision = char.collision

    // Focus on the critical frames around wall hit
    if (frame >= 94 && frame <= 105) {
      console.log(
        `Frame ${frame}: pos=${pos}, vel=${vel}, dir=${dir}, collision=[${collision.join(
          ', '
        )}]`
      )

      // Check if character is at wall boundary
      if (pos >= 224) {
        console.log(`  🔍 Character at wall boundary (pos=${pos})`)
        console.log(`  🔍 Right edge at: ${pos + 16} (wall at 240)`)
        console.log(`  🔍 Collision flags: [${collision.join(', ')}]`)

        if (collision[1]) {
          // Right collision
          console.log(`  🚨 RIGHT COLLISION DETECTED`)
        }
        if (collision[2]) {
          // Bottom collision
          console.log(`  🚨 BOTTOM COLLISION DETECTED`)
        }

        if (vel === 0) {
          console.log(`  ❌ VELOCITY IS ZERO - Wall escape failed!`)
        } else {
          console.log(`  ✅ Velocity preserved: ${vel}`)
        }
      }

      // Check for direction changes
      if (frame > 0) {
        const prevChar = JSON.parse(gameWrapper.get_characters_json())[0]
        if (before[0].dir[0] !== after[0].dir[0]) {
          console.log(
            `  🔄 Direction changed: ${before[0].dir[0]} → ${after[0].dir[0]}`
          )
        }
      }
    }

    // Stop after a few frames of oscillation
    if (frame > 96 && pos === 224 && vel === 0) {
      console.log(`\n❌ STUCK: Character oscillating at pos=224 with vel=0`)
      break
    }
  }
} catch (error) {
  console.error('Error:', error)
}
