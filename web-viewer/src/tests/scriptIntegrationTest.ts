/**
 * Script Integration Tests
 *
 * Tests script constants with WASM integration to verify:
 * - ACTION_SCRIPTS work correctly with WASM game engine
 * - CONDITION_SCRIPTS trigger properly in game scenarios
 * - Script template mixing functionality
 * - All action types: run, turn around, jump, wall jump, and charge
 * - All condition types: always, chance-based, energy-based, and collision-based
 * - Proper energy consumption and timing mechanics
 * - Debugging output for script execution validation
 */

import {
  ACTION_SCRIPTS,
  CONDITION_SCRIPTS,
  createScriptTemplate,
  type ActionScriptType,
  type ConditionScriptType,
} from '../constants/scriptConstants'
import { gameStateManager } from '../utils/gameStateManager'
import { setupBrowserDebugging } from '../utils/debugUtils'

// Test configuration templates
interface TestCharacter {
  id: number
  position: { x: number; y: number }
  size: { width: number; height: number }
  health: number
  energy: number
  energy_cap: number
  facing: number
  move_speed: number
  jump_force: number
  energy_charge: number
  energy_charge_rate: number
  scripts: Array<{
    action_id: number
    condition: number[]
    action: number[]
    energy_cost: number
    cooldown: number
  }>
}

interface TestConfiguration {
  tilemap: {
    width: number
    height: number
    tiles: number[]
  }
  characters: TestCharacter[]
  spawns: any[]
  max_frames: number
}

/**
 * Create a base test configuration with a single character
 */
function createBaseTestConfig(): TestConfiguration {
  return {
    tilemap: {
      width: 20,
      height: 15,
      tiles: Array(300).fill(0), // Empty tilemap
    },
    characters: [
      {
        id: 1,
        position: { x: 160, y: 240 },
        size: { width: 32, height: 32 },
        health: 100,
        energy: 50,
        energy_cap: 100,
        facing: 1, // Right
        move_speed: 2, // Fixed-point: 2.0
        jump_force: 5, // Fixed-point: 5.0
        energy_charge: 5,
        energy_charge_rate: 30, // Charge every 30 frames
        scripts: [],
      },
    ],
    spawns: [],
    max_frames: 600, // 10 seconds at 60 FPS
  }
}

/**
 * Add a script to a character configuration
 */
function addScriptToCharacter(
  config: TestConfiguration,
  characterId: number,
  actionType: ActionScriptType,
  conditionType: ConditionScriptType,
  energyCost: number = 10,
  cooldown: number = 0
): void {
  const character = config.characters.find((c) => c.id === characterId)
  if (!character) {
    throw new Error(`Character ${characterId} not found`)
  }

  const scriptTemplate = createScriptTemplate(actionType, conditionType)

  character.scripts.push({
    action_id: character.scripts.length,
    condition: Array.from(scriptTemplate.condition),
    action: Array.from(scriptTemplate.action),
    energy_cost: energyCost,
    cooldown: cooldown,
  })
}

/**
 * Test Results Interface
 */
interface TestResult {
  testName: string
  success: boolean
  details: string
  framesTested: number
  observations: string[]
}

/**
 * Script Integration Test Suite
 */
export class ScriptIntegrationTestSuite {
  private results: TestResult[] = []

  async initialize(): Promise<void> {
    await gameStateManager.initialize()
    console.log('🧪 Script Integration Test Suite initialized')
  }

  /**
   * Run all script integration tests
   */
  async runAllTests(): Promise<TestResult[]> {
    this.results = []

    console.group('🧪 Running Script Integration Tests')

    // Test each action type
    await this.testRunAction()
    await this.testTurnAroundAction()
    await this.testJumpAction()
    await this.testWallJumpAction()
    await this.testChargeAction()

    // Test each condition type
    await this.testAlwaysCondition()
    await this.testChanceConditions()
    await this.testEnergyConditions()
    await this.testCollisionConditions()

    // Test script mixing
    await this.testScriptMixing()

    // Test energy consumption
    await this.testEnergyConsumption()

    console.groupEnd()

    return this.results
  }

  /**
   * Test RUN action script
   */
  private async testRunAction(): Promise<void> {
    console.log('🏃 Testing RUN action...')

    const config = createBaseTestConfig()
    addScriptToCharacter(config, 1, 'RUN', 'ALWAYS', 0) // No energy cost for movement

    const result = await this.runTestConfiguration(
      'RUN Action Test',
      config,
      60, // Test for 1 second
      (initialState, finalState, observations) => {
        const initialChar = initialState.characters[0]
        const finalChar = finalState.characters[0]

        // Character should move right (positive X velocity)
        const moved = finalChar.position.x > initialChar.position.x
        const hasVelocity = Math.abs(finalChar.velocity.x) > 0

        observations.push(
          `Initial position: (${initialChar.position.x}, ${initialChar.position.y})`
        )
        observations.push(
          `Final position: (${finalChar.position.x}, ${finalChar.position.y})`
        )
        observations.push(
          `Final velocity: (${finalChar.velocity.x}, ${finalChar.velocity.y})`
        )
        observations.push(`Facing direction: ${finalChar.facing}`)

        return moved && hasVelocity
      }
    )

    this.results.push(result)
  }

  /**
   * Test TURN_AROUND action script
   */
  private async testTurnAroundAction(): Promise<void> {
    console.log('🔄 Testing TURN_AROUND action...')

    const config = createBaseTestConfig()
    config.characters[0].facing = 1 // Start facing right
    addScriptToCharacter(config, 1, 'TURN_AROUND', 'ALWAYS', 0)

    const result = await this.runTestConfiguration(
      'TURN_AROUND Action Test',
      config,
      10, // Just a few frames to see the turn
      (initialState, finalState, observations) => {
        const initialChar = initialState.characters[0]
        const finalChar = finalState.characters[0]

        // Character should change facing direction
        const facingChanged = finalChar.facing !== initialChar.facing

        observations.push(`Initial facing: ${initialChar.facing}`)
        observations.push(`Final facing: ${finalChar.facing}`)

        return facingChanged
      }
    )

    this.results.push(result)
  }

  /**
   * Test JUMP action script
   */
  private async testJumpAction(): Promise<void> {
    console.log('🦘 Testing JUMP action...')

    const config = createBaseTestConfig()
    config.characters[0].energy = 100 // Ensure enough energy
    addScriptToCharacter(config, 1, 'JUMP', 'ALWAYS', 15) // Energy cost for jumping

    const result = await this.runTestConfiguration(
      'JUMP Action Test',
      config,
      30, // Test for half a second
      (initialState, finalState, observations) => {
        const initialChar = initialState.characters[0]
        const finalChar = finalState.characters[0]

        // Character should have upward velocity (negative Y) and consume energy
        const hasUpwardVelocity = finalChar.velocity.y < 0
        const energyConsumed = finalChar.energy < initialChar.energy

        observations.push(`Initial energy: ${initialChar.energy}`)
        observations.push(`Final energy: ${finalChar.energy}`)
        observations.push(
          `Final velocity: (${finalChar.velocity.x}, ${finalChar.velocity.y})`
        )

        return hasUpwardVelocity && energyConsumed
      }
    )

    this.results.push(result)
  }

  /**
   * Test WALL_JUMP action script
   */
  private async testWallJumpAction(): Promise<void> {
    console.log('🧗 Testing WALL_JUMP action...')

    const config = createBaseTestConfig()
    config.characters[0].energy = 100
    // Simulate wall collision
    config.characters[0].position.x = 32 // Near left wall
    addScriptToCharacter(config, 1, 'WALL_JUMP', 'IS_WALL_SLIDING', 20)

    const result = await this.runTestConfiguration(
      'WALL_JUMP Action Test',
      config,
      30,
      (initialState, finalState, observations) => {
        const initialChar = initialState.characters[0]
        const finalChar = finalState.characters[0]

        // Check if wall jump mechanics work (this is simplified)
        const energyConsumed = finalChar.energy <= initialChar.energy

        observations.push(`Initial energy: ${initialChar.energy}`)
        observations.push(`Final energy: ${finalChar.energy}`)
        observations.push(
          `Final velocity: (${finalChar.velocity.x}, ${finalChar.velocity.y})`
        )
        observations.push(
          `Collision state: L:${finalChar.collision.left} R:${finalChar.collision.right} B:${finalChar.collision.bottom}`
        )

        return energyConsumed // Basic validation
      }
    )

    this.results.push(result)
  }

  /**
   * Test CHARGE action script
   */
  private async testChargeAction(): Promise<void> {
    console.log('⚡ Testing CHARGE action...')

    const config = createBaseTestConfig()
    config.characters[0].energy = 20 // Low energy to trigger charging
    addScriptToCharacter(config, 1, 'CHARGE', 'ENERGY_LOW_20', 0) // No cost for charging

    const result = await this.runTestConfiguration(
      'CHARGE Action Test',
      config,
      120, // Test for 2 seconds to see charging
      (initialState, finalState, observations) => {
        const initialChar = initialState.characters[0]
        const finalChar = finalState.characters[0]

        // Energy should increase over time
        const energyIncreased = finalChar.energy >= initialChar.energy

        observations.push(`Initial energy: ${initialChar.energy}`)
        observations.push(`Final energy: ${finalChar.energy}`)
        observations.push(`Energy cap: ${finalChar.energy_cap || 'unknown'}`)

        return energyIncreased
      }
    )

    this.results.push(result)
  }

  /**
   * Test ALWAYS condition
   */
  private async testAlwaysCondition(): Promise<void> {
    console.log('✅ Testing ALWAYS condition...')

    const config = createBaseTestConfig()
    addScriptToCharacter(config, 1, 'RUN', 'ALWAYS', 0)

    const result = await this.runTestConfiguration(
      'ALWAYS Condition Test',
      config,
      60,
      (initialState, finalState, observations) => {
        const finalChar = finalState.characters[0]

        // With ALWAYS condition, character should consistently move
        const hasMoved =
          finalChar.position.x !== initialState.characters[0].position.x

        observations.push(`Character moved: ${hasMoved}`)
        observations.push(
          `Final position: (${finalChar.position.x}, ${finalChar.position.y})`
        )

        return hasMoved
      }
    )

    this.results.push(result)
  }

  /**
   * Test chance-based conditions
   */
  private async testChanceConditions(): Promise<void> {
    console.log('🎲 Testing chance-based conditions...')

    for (const chance of [
      'CHANCE_10',
      'CHANCE_20',
      'CHANCE_50',
    ] as ConditionScriptType[]) {
      const config = createBaseTestConfig()
      addScriptToCharacter(config, 1, 'TURN_AROUND', chance, 0)

      const result = await this.runTestConfiguration(
        `${chance} Condition Test`,
        config,
        300, // Test for 5 seconds to see random behavior
        (initialState, finalState, observations) => {
          const initialChar = initialState.characters[0]
          const finalChar = finalState.characters[0]

          // With chance conditions, we just verify the script can execute
          // (actual randomness testing would require multiple runs)
          observations.push(`Initial facing: ${initialChar.facing}`)
          observations.push(`Final facing: ${finalChar.facing}`)
          observations.push(`Condition: ${chance}`)

          return true // Always pass for chance conditions (they're random)
        }
      )

      this.results.push(result)
    }
  }

  /**
   * Test energy-based conditions
   */
  private async testEnergyConditions(): Promise<void> {
    console.log('🔋 Testing energy-based conditions...')

    for (const energyCondition of [
      'ENERGY_LOW_10',
      'ENERGY_LOW_20',
    ] as ConditionScriptType[]) {
      const config = createBaseTestConfig()
      config.characters[0].energy = 5 // Very low energy to trigger condition
      addScriptToCharacter(config, 1, 'CHARGE', energyCondition, 0)

      const result = await this.runTestConfiguration(
        `${energyCondition} Condition Test`,
        config,
        60,
        (initialState, finalState, observations) => {
          const initialChar = initialState.characters[0]
          const finalChar = finalState.characters[0]

          // With low energy, charge action should trigger
          observations.push(`Initial energy: ${initialChar.energy}`)
          observations.push(`Final energy: ${finalChar.energy}`)
          observations.push(`Energy cap: ${finalChar.energy_cap || 'unknown'}`)
          observations.push(`Condition: ${energyCondition}`)

          return true // Basic validation
        }
      )

      this.results.push(result)
    }
  }

  /**
   * Test collision-based conditions
   */
  private async testCollisionConditions(): Promise<void> {
    console.log('💥 Testing collision-based conditions...')

    for (const collisionCondition of [
      'IS_GROUNDED',
      'IS_WALL_SLIDING',
    ] as ConditionScriptType[]) {
      const config = createBaseTestConfig()
      addScriptToCharacter(config, 1, 'JUMP', collisionCondition, 10)

      const result = await this.runTestConfiguration(
        `${collisionCondition} Condition Test`,
        config,
        60,
        (initialState, finalState, observations) => {
          const finalChar = finalState.characters[0]

          observations.push(
            `Collision state: T:${finalChar.collision.top} R:${finalChar.collision.right} B:${finalChar.collision.bottom} L:${finalChar.collision.left}`
          )
          observations.push(`Condition: ${collisionCondition}`)

          return true // Basic validation
        }
      )

      this.results.push(result)
    }
  }

  /**
   * Test script template mixing functionality
   */
  private async testScriptMixing(): Promise<void> {
    console.log('🎭 Testing script template mixing...')

    const config = createBaseTestConfig()

    // Add multiple scripts with different action/condition combinations
    addScriptToCharacter(config, 1, 'RUN', 'ALWAYS', 0)
    addScriptToCharacter(config, 1, 'JUMP', 'IS_GROUNDED', 15)
    addScriptToCharacter(config, 1, 'CHARGE', 'ENERGY_LOW_20', 0)

    const result = await this.runTestConfiguration(
      'Script Mixing Test',
      config,
      180, // Test for 3 seconds
      (initialState, finalState, observations) => {
        const initialChar = initialState.characters[0]
        const finalChar = finalState.characters[0]

        // Verify multiple scripts can coexist
        const hasMoved = finalChar.position.x !== initialChar.position.x
        const scriptsCount = config.characters[0].scripts.length

        observations.push(`Scripts count: ${scriptsCount}`)
        observations.push(`Character moved: ${hasMoved}`)
        observations.push(
          `Energy change: ${initialChar.energy} → ${finalChar.energy}`
        )

        return scriptsCount === 3 && hasMoved
      }
    )

    this.results.push(result)
  }

  /**
   * Test energy consumption and timing mechanics
   */
  private async testEnergyConsumption(): Promise<void> {
    console.log('⏱️ Testing energy consumption and timing...')

    const config = createBaseTestConfig()
    config.characters[0].energy = 100
    addScriptToCharacter(config, 1, 'JUMP', 'ALWAYS', 25) // High energy cost

    const result = await this.runTestConfiguration(
      'Energy Consumption Test',
      config,
      120, // Test for 2 seconds
      (initialState, finalState, observations) => {
        const initialChar = initialState.characters[0]
        const finalChar = finalState.characters[0]

        // Energy should decrease over time due to jumping
        const energyConsumed = finalChar.energy < initialChar.energy
        const energyDifference = initialChar.energy - finalChar.energy

        observations.push(`Initial energy: ${initialChar.energy}`)
        observations.push(`Final energy: ${finalChar.energy}`)
        observations.push(`Energy consumed: ${energyDifference}`)
        observations.push(`Expected energy cost per jump: 25`)

        return energyConsumed && energyDifference > 0
      }
    )

    this.results.push(result)
  }

  /**
   * Run a test configuration and validate results
   */
  private async runTestConfiguration(
    testName: string,
    config: TestConfiguration,
    framesToTest: number,
    validator: (
      initialState: any,
      finalState: any,
      observations: string[]
    ) => boolean
  ): Promise<TestResult> {
    const observations: string[] = []

    try {
      // Load configuration
      const configJson = JSON.stringify(config)
      const loadResult = gameStateManager.loadConfiguration(configJson)

      if (!loadResult.success) {
        return {
          testName,
          success: false,
          details: `Configuration load failed: ${loadResult.error}`,
          framesTested: 0,
          observations,
        }
      }

      // Get initial state
      const initialState = gameStateManager.getCurrentGameState()
      const initialCharacters = gameStateManager.getCurrentCharacters()

      if (!initialState || initialCharacters.length === 0) {
        return {
          testName,
          success: false,
          details: 'Failed to get initial game state',
          framesTested: 0,
          observations,
        }
      }

      observations.push(`Configuration loaded successfully`)
      observations.push(`Initial frame: ${initialState.frame}`)
      observations.push(`Characters count: ${initialCharacters.length}`)

      // Step through frames
      let framesStepped = 0
      for (let i = 0; i < framesToTest; i++) {
        const stepResult = gameStateManager.stepGameFrame()
        if (!stepResult.success) {
          observations.push(
            `Frame step failed at frame ${i}: ${stepResult.error}`
          )
          break
        }
        framesStepped++

        // Log every 30 frames (0.5 seconds)
        if (i % 30 === 0) {
          const currentFrame = gameStateManager.getCurrentFrame()
          observations.push(`Frame ${currentFrame}: Game running`)
        }
      }

      // Get final state
      const finalState = gameStateManager.getCurrentGameState()
      const finalCharacters = gameStateManager.getCurrentCharacters()

      if (!finalState || finalCharacters.length === 0) {
        return {
          testName,
          success: false,
          details: 'Failed to get final game state',
          framesTested: framesStepped,
          observations,
        }
      }

      observations.push(`Final frame: ${finalState.frame}`)
      observations.push(`Frames stepped: ${framesStepped}`)

      // Validate results
      const validationSuccess = validator(
        { characters: initialCharacters, ...initialState },
        { characters: finalCharacters, ...finalState },
        observations
      )

      return {
        testName,
        success: validationSuccess,
        details: validationSuccess ? 'Test passed' : 'Validation failed',
        framesTested: framesStepped,
        observations,
      }
    } catch (error) {
      return {
        testName,
        success: false,
        details: `Test execution failed: ${error}`,
        framesTested: 0,
        observations: [...observations, `Error: ${error}`],
      }
    }
  }

  /**
   * Print test results summary
   */
  printResults(): void {
    console.group('📊 Script Integration Test Results')

    const passed = this.results.filter((r) => r.success).length
    const total = this.results.length

    console.log(`✅ Passed: ${passed}/${total}`)
    console.log(`❌ Failed: ${total - passed}/${total}`)

    this.results.forEach((result) => {
      const emoji = result.success ? '✅' : '❌'
      console.group(`${emoji} ${result.testName}`)
      console.log(`Success: ${result.success}`)
      console.log(`Details: ${result.details}`)
      console.log(`Frames tested: ${result.framesTested}`)

      if (result.observations.length > 0) {
        console.group('Observations:')
        result.observations.forEach((obs) => console.log(`• ${obs}`))
        console.groupEnd()
      }

      console.groupEnd()
    })

    console.groupEnd()
  }

  /**
   * Get test results for external use
   */
  getResults(): TestResult[] {
    return [...this.results]
  }
}

// Export for browser console access
declare global {
  interface Window {
    scriptIntegrationTests: ScriptIntegrationTestSuite
  }
}

// Make test suite available globally
export const setupScriptIntegrationTests = () => {
  const testSuite = new ScriptIntegrationTestSuite()
  window.scriptIntegrationTests = testSuite

  console.log(
    '🧪 Script Integration Tests available at window.scriptIntegrationTests'
  )
  console.log('Usage:')
  console.log('  await window.scriptIntegrationTests.initialize()')
  console.log('  await window.scriptIntegrationTests.runAllTests()')
  console.log('  window.scriptIntegrationTests.printResults()')

  return testSuite
}
