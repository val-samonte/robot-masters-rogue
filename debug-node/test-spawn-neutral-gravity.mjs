import init, { GameWrapper } from './wasm_wrapper.js'

async function testSpawnNeutralGravity() {
  console.log('Testing spawn neutral gravity default...\n')

  try {
    // Initialize WASM with the .wasm file
    const fs = await import('fs')
    const wasmBytes = fs.readFileSync('./wasm_wrapper_bg.wasm')
    await init(wasmBytes)

    // Simple test configuration
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
          ],
          size: [16, 16],
          health: 100,
          health_cap: 100,
          energy: 100,
          energy_cap: 100,
          power: 10,
          weight: 100,
          jump_force: [320, 32],
          move_speed: [96, 32],
          armor: [100, 100, 100, 100, 100, 100, 100, 100, 100],
          energy_regen: 1,
          energy_regen_rate: 60,
          energy_charge: 5,
          energy_charge_rate: 30,
          dir: [2, 2],
          enmity: 0,
          target_id: null,
          target_type: 0,
          behaviors: [],
        },
      ],
      actions: [],
      conditions: [],
      spawns: [
        {
          damage_base: 10,
          damage_range: 5,
          crit_chance: 10,
          crit_multiplier: 150,
          health_cap: 50,
          duration: 300,
          element: 0,
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

    // Create a spawn manually to test its default direction
    console.log('Creating spawn to test default direction...')

    // Create spawn at position (100, 100)
    gameWrapper.create_spawn(0, 0, 3200, 3200) // spawn_id=0, owner_id=0, x=100.0, y=100.0 as Fixed

    const spawns = JSON.parse(gameWrapper.get_spawns_json())

    if (spawns.length === 0) {
      console.log('❌ FAIL: No spawn was created')
      return
    }

    const spawn = spawns[0]
    console.log('Spawn created with direction:')
    console.log(`dir: [${spawn.dir[0]}, ${spawn.dir[1]}]`)
    console.log(`Expected: [*, 1] (any horizontal, neutral gravity)`)

    if (spawn.dir[1] === 1) {
      console.log('✅ PASS: Spawn has neutral gravity (dir.1 = 1)')
    } else {
      console.log(
        `❌ FAIL: Spawn should have neutral gravity (dir.1 = 1), got ${spawn.dir[1]}`
      )
    }

    // Test that spawn is not affected by gravity over multiple frames
    console.log(
      '\nTesting spawn gravity behavior (should not be affected by gravity):'
    )

    const initialVel = spawn.velocity[1][0] / spawn.velocity[1][1]
    console.log(`Initial vel_y: ${initialVel.toFixed(3)}`)

    for (let frame = 1; frame <= 5; frame++) {
      gameWrapper.step_frame()
      const updatedSpawns = JSON.parse(gameWrapper.get_spawns_json())
      if (updatedSpawns.length > 0) {
        const updatedSpawn = updatedSpawns[0]
        const vel_y = updatedSpawn.velocity[1][0] / updatedSpawn.velocity[1][1]
        console.log(`Frame ${frame}: vel_y=${vel_y.toFixed(3)}`)
      } else {
        console.log(`Frame ${frame}: spawn despawned`)
        break
      }
    }

    const finalSpawns = JSON.parse(gameWrapper.get_spawns_json())
    if (finalSpawns.length > 0) {
      const finalSpawn = finalSpawns[0]
      const final_vel_y = finalSpawn.velocity[1][0] / finalSpawn.velocity[1][1]

      if (Math.abs(final_vel_y - initialVel) < 0.1) {
        console.log(
          '✅ PASS: Spawn velocity unchanged (not affected by gravity)'
        )
        console.log('🎉 Spawn neutral gravity is working correctly!')
      } else {
        console.log(
          `❌ FAIL: Spawn velocity changed from ${initialVel.toFixed(
            3
          )} to ${final_vel_y.toFixed(3)}`
        )
        console.log('Spawn should not be affected by gravity')
      }
    } else {
      console.log('⚠️  Spawn despawned before test completion')
    }
  } catch (error) {
    console.error('❌ Error testing spawn neutral gravity:', error)
  }
}

testSpawnNeutralGravity().catch(console.error)
