import init, { GameWrapper } from './wasm_wrapper.js'

async function testSpawnDefaultDirection() {
  console.log(
    'Testing spawn default direction (should have neutral gravity)...\n'
  )

  try {
    // Initialize WASM with the .wasm file
    const fs = await import('fs')
    const wasmBytes = fs.readFileSync('./wasm_wrapper_bg.wasm')
    await init(wasmBytes)

    // Create a spawn definition and test configuration
    const testConfig = {
      seed: 12345,
      tilemap: Array(15)
        .fill()
        .map(() => Array(16).fill(0)),
      characters: [
        {
          id: 0,
          group: 0,
          position: [
            [3200, 32],
            [3200, 32],
          ], // 100.0, 100.0 as Fixed-point
          size: [16, 16],
          health: 100,
          health_cap: 100,
          energy: 100,
          energy_cap: 100,
          power: 10,
          weight: 100,
          jump_force: [320, 32], // 10.0 as Fixed-point
          move_speed: [96, 32], // 3.0 as Fixed-point
          armor: [100, 100, 100, 100, 100, 100, 100, 100, 100],
          energy_regen: 1,
          energy_regen_rate: 60,
          energy_charge: 5,
          energy_charge_rate: 30,
          dir: [2, 2], // Right-facing, downward gravity
          enmity: 0,
          target_id: null,
          target_type: 0,
          behaviors: [],
        },
      ],
      actions: [
        {
          energy_cost: 0,
          cooldown: 0,
          args: [0, 0, 0, 0, 0, 0, 0, 0],
          spawns: [0, 0, 0, 0], // Spawn ID 0
          script: [
            // Simple spawn creation script
            91,
            0, // EXIT_WITH_VAR 0 (success)
          ],
        },
      ],
      conditions: [
        {
          energy_mul: [0, 32], // 0.0 as Fixed-point
          args: [0, 0, 0, 0, 0, 0, 0, 0],
          script: [
            91,
            1, // EXIT_WITH_VAR 1 (always true)
          ],
        },
      ],
      spawns: [
        {
          damage_base: 10,
          damage_range: 5,
          crit_chance: 10,
          crit_multiplier: 150,
          health_cap: 50,
          duration: 300, // 5 seconds at 60 FPS
          element: 0, // Punct
          chance: 100,
          size: [8, 8],
          args: [0, 0, 0, 0, 0, 0, 0, 0],
          spawns: [0, 0, 0, 0],
          behavior_script: [],
          collision_script: [],
          despawn_script: [],
        },
      ],
      status_effects: [],
    }

    const gameWrapper = new GameWrapper(JSON.stringify(testConfig))
    gameWrapper.new_game()

    // Add behavior to character to create spawn
    const character = JSON.parse(gameWrapper.get_characters_json())[0]
    character.behaviors = [[0, 0]] // condition 0, action 0

    // Update game with modified character
    gameWrapper.update_character(0, JSON.stringify(character))

    // Step one frame to trigger spawn creation
    gameWrapper.step_frame()

    // Check if spawn was created
    const spawns = JSON.parse(gameWrapper.get_spawns_json())

    if (spawns.length === 0) {
      console.log('⚠️  No spawn created, testing spawn creation manually...')

      // Manually create a spawn to test default direction
      gameWrapper.create_spawn(0, 0, [3200, 32], [3200, 32]) // spawn_id=0, owner_id=0, position

      const manualSpawns = JSON.parse(gameWrapper.get_spawns_json())
      if (manualSpawns.length > 0) {
        const spawn = manualSpawns[0]
        console.log('Manually created spawn direction:')
        console.log(`dir: [${spawn.dir[0]}, ${spawn.dir[1]}]`)
        console.log(`Expected: [*, 1] (any horizontal, neutral gravity)`)

        if (spawn.dir[1] === 1) {
          console.log('✅ PASS: Spawn has neutral gravity (dir.1 = 1)')
        } else {
          console.log('❌ FAIL: Spawn should have neutral gravity (dir.1 = 1)')
        }

        // Test that spawn is not affected by gravity
        console.log(
          '\nTesting spawn gravity behavior (should not be affected by gravity):'
        )

        const initialVel = spawn.velocity[1][0] / spawn.velocity[1][1]
        console.log(`Initial vel_y: ${initialVel.toFixed(3)}`)

        for (let frame = 1; frame <= 3; frame++) {
          gameWrapper.step_frame()
          const updatedSpawns = JSON.parse(gameWrapper.get_spawns_json())
          if (updatedSpawns.length > 0) {
            const updatedSpawn = updatedSpawns[0]
            const vel_y =
              updatedSpawn.velocity[1][0] / updatedSpawn.velocity[1][1]
            console.log(`Frame ${frame}: vel_y=${vel_y.toFixed(3)}`)
          }
        }

        const finalSpawns = JSON.parse(gameWrapper.get_spawns_json())
        if (finalSpawns.length > 0) {
          const finalSpawn = finalSpawns[0]
          const final_vel_y =
            finalSpawn.velocity[1][0] / finalSpawn.velocity[1][1]

          if (Math.abs(final_vel_y - initialVel) < 0.1) {
            console.log(
              '✅ PASS: Spawn velocity unchanged (not affected by gravity)'
            )
            console.log('🎉 Spawn neutral gravity is working correctly!')
          } else {
            console.log(
              '❌ FAIL: Spawn velocity should not change due to gravity'
            )
          }
        }
      } else {
        console.log('❌ FAIL: Could not create spawn for testing')
      }
    } else {
      const spawn = spawns[0]
      console.log('Spawn created with direction:')
      console.log(`dir: [${spawn.dir[0]}, ${spawn.dir[1]}]`)
      console.log(`Expected: [*, 1] (any horizontal, neutral gravity)`)

      if (spawn.dir[1] === 1) {
        console.log('✅ PASS: Spawn has neutral gravity (dir.1 = 1)')
        console.log('🎉 Spawn neutral gravity is working correctly!')
      } else {
        console.log('❌ FAIL: Spawn should have neutral gravity (dir.1 = 1)')
      }
    }
  } catch (error) {
    console.error('❌ Error testing spawn default direction:', error)
  }
}

testSpawnDefaultDirection().catch(console.error)
