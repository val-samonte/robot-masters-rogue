/**
 * Test Runner for Script Integration Tests
 *
 * Provides a simple interface to run and validate script integration tests
 */

import { ScriptIntegrationTestSuite } from './scriptIntegrationTest'
import {
  TEST_CONFIGURATIONS,
  type TestConfigurationType,
} from './testConfigurations'
import { gameStateManager } from '../utils/gameStateManager'
import { setupBrowserDebugging } from '../utils/debugUtils'

/**
 * Quick test runner for individual script types
 */
export class QuickTestRunner {
  private testSuite: ScriptIntegrationTestSuite

  constructor() {
    this.testSuite = new ScriptIntegrationTestSuite()
  }

  async initialize(): Promise<void> {
    await this.testSuite.initialize()
    console.log('🧪 Quick Test Runner initialized')
  }

  /**
   * Test a specific configuration quickly
   */
  async testConfiguration(
    configName: TestConfigurationType,
    framesToTest: number = 120
  ): Promise<void> {
    console.group(`🧪 Testing ${configName}`)

    try {
      const config = TEST_CONFIGURATIONS[configName]
      const configJson = JSON.stringify(config)

      // Load configuration
      const loadResult = gameStateManager.loadConfiguration(configJson)
      if (!loadResult.success) {
        console.error('❌ Configuration load failed:', loadResult.error)
        return
      }

      console.log('✅ Configuration loaded successfully')

      // Get initial state
      const initialCharacters = gameStateManager.getCurrentCharacters()
      const initialFrame = gameStateManager.getCurrentFrame()

      if (initialCharacters.length === 0) {
        console.error('❌ No characters found in initial state')
        return
      }

      const initialChar = initialCharacters[0]
      console.log('📊 Initial state:', {
        frame: initialFrame,
        position: initialChar.position,
        energy: initialChar.energy,
        facing: initialChar.facing,
        velocity: initialChar.velocity,
      })

      // Step through frames
      console.log(`⏭️ Stepping ${framesToTest} frames...`)
      for (let i = 0; i < framesToTest; i++) {
        const stepResult = gameStateManager.stepGameFrame()
        if (!stepResult.success) {
          console.error(`❌ Frame step failed at frame ${i}:`, stepResult.error)
          return
        }

        // Log progress every second
        if (i % 60 === 0 && i > 0) {
          const currentFrame = gameStateManager.getCurrentFrame()
          console.log(`⏱️ Frame ${currentFrame} (${i}/${framesToTest})`)
        }
      }

      // Get final state
      const finalCharacters = gameStateManager.getCurrentCharacters()
      const finalFrame = gameStateManager.getCurrentFrame()

      if (finalCharacters.length === 0) {
        console.error('❌ No characters found in final state')
        return
      }

      const finalChar = finalCharacters[0]
      console.log('📊 Final state:', {
        frame: finalFrame,
        position: finalChar.position,
        energy: finalChar.energy,
        facing: finalChar.facing,
        velocity: finalChar.velocity,
      })

      // Analyze changes
      const positionChanged =
        initialChar.position.x !== finalChar.position.x ||
        initialChar.position.y !== finalChar.position.y
      const energyChanged = initialChar.energy !== finalChar.energy
      const facingChanged = initialChar.facing !== finalChar.facing
      const hasVelocity =
        finalChar.velocity.x !== 0 || finalChar.velocity.y !== 0

      console.log('📈 Analysis:', {
        positionChanged,
        energyChanged,
        facingChanged,
        hasVelocity,
        energyDelta: finalChar.energy - initialChar.energy,
        positionDelta: {
          x: finalChar.position.x - initialChar.position.x,
          y: finalChar.position.y - initialChar.position.y,
        },
      })

      console.log('✅ Test completed successfully')
    } catch (error) {
      console.error('❌ Test execution failed:', error)
    } finally {
      console.groupEnd()
    }
  }

  /**
   * Run a quick validation of all action scripts
   */
  async validateAllActions(): Promise<void> {
    console.group('🎯 Validating All Action Scripts')

    const actionConfigs: TestConfigurationType[] = [
      'RUN_ALWAYS',
      'TURN_AROUND',
      'JUMP_GROUNDED',
      'WALL_JUMP',
      'CHARGE_LOW_ENERGY',
    ]

    for (const config of actionConfigs) {
      await this.testConfiguration(config, 60) // Test each for 1 second
      await new Promise((resolve) => setTimeout(resolve, 100)) // Small delay between tests
    }

    console.groupEnd()
  }

  /**
   * Run a quick validation of all condition scripts
   */
  async validateAllConditions(): Promise<void> {
    console.group('🎲 Validating All Condition Scripts')

    const conditionConfigs: TestConfigurationType[] = [
      'CHANCE_CONDITIONS',
      'ENERGY_CONSUMPTION',
      'COLLISION_CONDITIONS',
    ]

    for (const config of conditionConfigs) {
      await this.testConfiguration(config, 120) // Test each for 2 seconds
      await new Promise((resolve) => setTimeout(resolve, 100))
    }

    console.groupEnd()
  }

  /**
   * Test script mixing functionality
   */
  async validateScriptMixing(): Promise<void> {
    console.group('🎭 Validating Script Mixing')

    await this.testConfiguration('MIXED_SCRIPTS', 180) // Test for 3 seconds

    console.groupEnd()
  }

  /**
   * Test energy consumption mechanics
   */
  async validateEnergyMechanics(): Promise<void> {
    console.group('⚡ Validating Energy Mechanics')

    await this.testConfiguration('ENERGY_CONSUMPTION', 300) // Test for 5 seconds

    console.groupEnd()
  }

  /**
   * Run all quick validations
   */
  async runAllValidations(): Promise<void> {
    console.group('🧪 Running All Script Validations')

    await this.validateAllActions()
    await this.validateAllConditions()
    await this.validateScriptMixing()
    await this.validateEnergyMechanics()

    console.log('✅ All validations completed')
    console.groupEnd()
  }
}

/**
 * Browser console integration
 */
declare global {
  interface Window {
    scriptTestRunner: QuickTestRunner
    runScriptTests: () => Promise<void>
    testConfig: (configName: TestConfigurationType) => Promise<void>
  }
}

/**
 * Setup browser console integration
 */
export const setupScriptTestRunner = async (): Promise<QuickTestRunner> => {
  const testRunner = new QuickTestRunner()
  await testRunner.initialize()

  // Make available globally
  window.scriptTestRunner = testRunner

  // Convenience functions
  window.runScriptTests = async () => {
    await testRunner.runAllValidations()
  }

  window.testConfig = async (configName: TestConfigurationType) => {
    await testRunner.testConfiguration(configName)
  }

  console.group('🧪 Script Test Runner Available')
  console.log('Use these functions in the browser console:')
  console.log('• await runScriptTests() - Run all script validations')
  console.log('• await testConfig("RUN_ALWAYS") - Test specific configuration')
  console.log('• window.scriptTestRunner - Access full test runner')
  console.log('')
  console.log('Available test configurations:')
  Object.keys(TEST_CONFIGURATIONS).forEach((name) => {
    console.log(`  • ${name}`)
  })
  console.groupEnd()

  return testRunner
}

/**
 * Automated test execution for development
 */
export const runAutomatedTests = async (): Promise<void> => {
  console.log('🤖 Running automated script integration tests...')

  try {
    const testRunner = new QuickTestRunner()
    await testRunner.initialize()

    // Setup browser debugging
    const wrapper = gameStateManager.getWrapper()
    setupBrowserDebugging(wrapper)

    // Run all validations
    await testRunner.runAllValidations()

    console.log('✅ Automated tests completed successfully')
  } catch (error) {
    console.error('❌ Automated tests failed:', error)
  }
}
