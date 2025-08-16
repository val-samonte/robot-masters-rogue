/**
 * Basic Spawn Creation Test - Task 2 Implementation
 *
 * Tests the basic spawn creation functionality by creating a simple test configuration
 * with one character that spawns a single entity and validates the spawn appears in game state.
 *
 * Requirements: 1.1, 1.2, 1.4
 */

import init, { GameWrapper } from '../wasm-wrapper/pkg/wasm_wrapper.js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Hardcoded constants for spawn creation
const OperatorAddress = {
  ASSIGN_BYTE: 20,
  EXIT_WITH_VAR: 4,
  SPAWN: 84,
  EXIT: 0,
}

// Test configuration with spawn creation action
const testConfig = {
  seed: 12345,
  gravity: [32, 64] as [number, number],
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
  conditions: [
    {
      energy_mul: 32,
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      script: [
        OperatorAddress.ASSIGN_BYTE,
        0,
        1, // ASSIGN_BYTE vars[0] = 1 (ALWAYS condition)
        OperatorAddress.EXIT_WITH_VAR,
        0, // EXIT_WITH_VAR vars[0]
      ],
    },
  ],
  actions: [
    {
      energy_cost: 0,
      cooldown: 30, // 0.5 second cooldown to prevent spam
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      spawns: [0, 0, 0, 0],
      script: [
        OperatorAddress.ASSIGN_BYTE,
        0,
        0, // ASSIGN_BYTE vars[0] = 0 (spawn ID 0)
        OperatorAddress.SPAWN,
        0, // SPAWN vars[0] (create spawn with ID 0)
        OperatorAddress.EXIT,
        1, // EXIT 1 (success)
      ],
    },
  ],
  characters: [
    {
      id: 1,
      position: [
        [160, 1],
        [200, 1],
      ] as [[number, number], [number, number]], // Center of screen, above ground
      group: 1,
      size: [16, 32] as [number, number],
      health: 100,
      health_cap: 100,
      energy: 100,
      energy_cap: 100,
      power: 10,
      weight: 5,
      jump_force: [160, 32] as [number, number],
      move_speed: [2, 1] as [number, number],
      armor: [0, 0, 0, 0, 0, 0, 0, 0, 0],
      energy_regen: 1,
      energy_regen_rate: 60,
      energy_charge: 5,
      energy_charge_rate: 30,
      dir: [2, 2] as [number, number], // Right, downward gravity
      enmity: 0,
      target_id: null,
      target_type: 0,
      behaviors: [
        [0, 0], // ALWAYS -> SPAWN action
      ],
    },
  ],
  spawns: [
    {
      id: 0,
      size: [16, 16],
      damage_base: 10,
      damage_range: 5,
      crit_chance: 0,
      crit_multiplier: 2,
      chance: 100,
      health_cap: 50,
      duration: 300, // 5 seconds at 60 FPS
      element: 0,
      args: [0, 0, 0, 0, 0, 0, 0, 0],
      spawns: [0, 0, 0, 0],
      behavior_script: [],
      collision_script: [],
      despawn_script: [],
    },
  ],
  status_effects: [],
}

async function runBasicSpawnCreationTest() {
  console.log('=== BASIC SPAWN CREATION TEST ===')
  console.log('Task 2: Implement basic spawn creation test')
  console.log('Requirements: 1.1, 1.2, 1.4')

  let gameWrapper: GameWrapper | undefined
  let testPassed = false
  const validationResults: string[] = []

  try {
    console.log('\n1. Loading WASM module...')
    const wasmBytes = readFileSync(
      join(__dirname, '../wasm-wrapper/pkg/wasm_wrapper_bg.wasm')
    )
    await init(wasmBytes)
    console.log('✅ WASM module initialized')

    console.log('\n2. Creating game wrapper with test configuration...')
    gameWrapper = new GameWrapper(JSON.stringify(testConfig))
    gameWrapper.new_game()
    console.log('✅ Game initialized successfully')

    console.log('\n3. Checking initial state...')
    const initialCharacters = JSON.parse(gameWrapper.get_characters_json())
    const initialSpawns = JSON.parse(gameWrapper.get_spawns_json())

    console.log(`   - Characters: ${initialCharacters.length}`)
    console.log(`   - Initial spawns: ${initialSpawns.length}`)
    console.log(
      `   - Character position: [${initialCharacters[0].position.x}, ${initialCharacters[0].position.y}]`
    )
    console.log(`   - Character energy: ${initialCharacters[0].energy}`)

    console.log('\n4. Running test scenario (120 frames)...')
    let spawnCreated = false
    let spawnCreationFrame = -1
    let createdSpawn: any = null

    for (let frame = 1; frame <= 120; frame++) {
      gameWrapper.step_frame()

      const characters = JSON.parse(gameWrapper.get_characters_json())
      const spawns = JSON.parse(gameWrapper.get_spawns_json())

      // Log progress every 30 frames
      if (frame % 30 === 0) {
        console.log(
          `   Frame ${frame}: ${spawns.length} spawns, character energy: ${characters[0].energy}`
        )
      }

      // Check for spawn creation
      if (!spawnCreated && spawns.length > initialSpawns.length) {
        spawnCreated = true
        spawnCreationFrame = frame
        createdSpawn = spawns[spawns.length - 1]
        console.log(`   ✅ SPAWN CREATED at frame ${frame}!`)
        console.log(
          `      - Position: [${createdSpawn.position?.x || 'undefined'}, ${
            createdSpawn.position?.y || 'undefined'
          }]`
        )
        console.log(
          `      - Health: ${createdSpawn.health}/${createdSpawn.health_cap}`
        )
        console.log(`      - Life span: ${createdSpawn.life_span}`)
        console.log(`      - Owner ID: ${createdSpawn.owner_id}`)
      }
    }

    console.log('\n5. Validation Results:')

    // Validation 1: Spawn appears in game state JSON after creation (Requirement 1.1, 1.2)
    const finalSpawns = JSON.parse(gameWrapper.get_spawns_json())
    if (finalSpawns.length > 0) {
      console.log('   ✅ Spawn appears in game state JSON')
      validationResults.push('✅ Spawn creation in game state: PASSED')
    } else {
      console.log('   ❌ No spawn found in game state JSON')
      validationResults.push('❌ Spawn creation in game state: FAILED')
    }

    // Validation 2: Spawn has correct initial properties (Requirement 1.2)
    if (createdSpawn) {
      const hasHealth = createdSpawn.health > 0
      const hasLifespan = createdSpawn.life_span > 0
      const hasOwner = createdSpawn.owner_id !== undefined

      if (hasHealth && hasLifespan && hasOwner) {
        console.log('   ✅ Spawn has correct initial properties')
        validationResults.push('✅ Spawn properties validation: PASSED')
      } else {
        console.log('   ❌ Spawn missing required properties')
        console.log(
          `      - Health: ${hasHealth ? '✅' : '❌'} (${createdSpawn.health})`
        )
        console.log(
          `      - Lifespan: ${hasLifespan ? '✅' : '❌'} (${
            createdSpawn.life_span
          })`
        )
        console.log(
          `      - Owner: ${hasOwner ? '✅' : '❌'} (${createdSpawn.owner_id})`
        )
        validationResults.push('❌ Spawn properties validation: FAILED')
      }
    } else {
      console.log('   ❌ No spawn created to validate properties')
      validationResults.push(
        '❌ Spawn properties validation: FAILED (no spawn)'
      )
    }

    // Validation 3: Spawn creation timing (Requirement 1.4)
    if (spawnCreated && spawnCreationFrame <= 30) {
      console.log(
        `   ✅ Spawn created within expected timeframe (frame ${spawnCreationFrame})`
      )
      validationResults.push('✅ Spawn creation timing: PASSED')
    } else if (spawnCreated) {
      console.log(
        `   ⚠️  Spawn created later than expected (frame ${spawnCreationFrame})`
      )
      validationResults.push('⚠️ Spawn creation timing: DELAYED')
    } else {
      console.log('   ❌ No spawn created during test duration')
      validationResults.push('❌ Spawn creation timing: FAILED')
    }

    // Overall test result
    const passedValidations = validationResults.filter((r) =>
      r.includes('✅')
    ).length
    const totalValidations = validationResults.length
    testPassed = passedValidations === totalValidations

    console.log('\n6. Test Summary:')
    console.log(
      `   - Validations passed: ${passedValidations}/${totalValidations}`
    )
    validationResults.forEach((result) => console.log(`   ${result}`))

    if (testPassed) {
      console.log('\n🎉 OVERALL RESULT: SUCCESS')
      console.log('   Basic spawn creation test completed successfully')
      console.log('   ✅ Requirements 1.1, 1.2, 1.4 validated')
    } else {
      console.log('\n❌ OVERALL RESULT: PARTIAL SUCCESS')
      console.log('   Some validations failed - see details above')
    }
  } catch (error) {
    console.error('\n❌ TEST EXECUTION FAILED:', error?.message || error)
    if (error?.stack) {
      console.error('Stack trace:', error.stack)
    }
    if (gameWrapper) {
      try {
        console.error(
          'Game wrapper error details:',
          gameWrapper.get_last_error_details()
        )
      } catch {}
    }
    validationResults.push('❌ Test execution: FAILED')
  }

  console.log('\n=== VISUAL INSPECTION CHECKLIST ===')
  console.log('For manual verification in web viewer:')
  console.log('□ 1. Load the same test configuration in web viewer')
  console.log('□ 2. Verify spawn appears visually on screen')
  console.log('□ 3. Check spawn renders without visual artifacts')
  console.log('□ 4. Confirm spawn appears near character position')
  console.log('□ 5. Observe spawn behavior (movement, physics)')
  console.log('□ 6. Verify spawn disappears after lifespan expires')

  console.log('\n=== TEST COMPLETE ===')
  return { passed: testPassed, validationResults }
}

// Run the test
runBasicSpawnCreationTest().catch(console.error)
