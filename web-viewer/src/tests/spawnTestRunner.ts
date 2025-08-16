/**
 * Spawn Test Runner
 *
 * Executes spawn test configurations and validates results against expected outcomes.
 * Provides comprehensive testing framework for spawn system validation.
 */

import { GameWrapper } from 'wasm-wrapper'
import {
  SpawnTestConfiguration,
  SpawnTestResult,
  ValidationCriteria,
  spawnTestLoader,
} from './spawnTestConfigurations'
import { gameStateManager } from '../utils/gameStateManager'

/**
 * Test execution error for spawn tests
 */
export class SpawnTestExecutionError extends Error {
  constructor(
    public testName: string,
    public phase: 'SETUP' | 'EXECUTION' | 'VALIDATION' | 'CLEANUP',
    public details: string
  ) {
    super(`Spawn test ${testName} failed in ${phase}: ${details}`)
  }
}

/**
 * Spawn test runner that executes test configurations and validates results
 */
export class SpawnTestRunner {
  private currentTest: SpawnTestConfiguration | null = null
  private testResult: SpawnTestResult | null = null

  /**
   * Execute a single spawn test configuration
   */
  async executeTest(testName: string): Promise<SpawnTestResult> {
    const testConfig = spawnTestLoader.getConfiguration(testName)
    if (!testConfig) {
      throw new SpawnTestExecutionError(
        testName,
        'SETUP',
        `Test configuration '${testName}' not found`
      )
    }

    this.currentTest = testConfig
    this.testResult = {
      testName: testConfig.testName,
      passed: false,
      timestamp: new Date(),
      frameData: [],
      performanceMetrics: {
        averageFrameTime: 0,
        peakSpawnCount: 0,
      },
      validationResults: [],
      issues: [],
      warnings: [],
    }

    try {
      // Setup phase
      await this.setupTest(testConfig)

      // Execution phase
      await this.runTestFrames(testConfig)

      // Validation phase
      await this.validateResults(testConfig)

      // Cleanup phase
      await this.cleanupTest()

      return this.testResult
    } catch (error) {
      const phase = this.determineErrorPhase(error)
      throw new SpawnTestExecutionError(
        testName,
        phase,
        error instanceof Error ? error.message : String(error)
      )
    }
  }

  /**
   * Execute multiple test configurations
   */
  async executeTestSuite(testNames: string[]): Promise<SpawnTestResult[]> {
    const results: SpawnTestResult[] = []

    for (const testName of testNames) {
      try {
        const result = await this.executeTest(testName)
        results.push(result)
      } catch (error) {
        // Create a failed result for the test
        const failedResult: SpawnTestResult = {
          testName,
          passed: false,
          timestamp: new Date(),
          frameData: [],
          performanceMetrics: {
            averageFrameTime: 0,
            peakSpawnCount: 0,
          },
          validationResults: [],
          issues: [error instanceof Error ? error.message : String(error)],
          warnings: [],
        }
        results.push(failedResult)
      }
    }

    return results
  }

  /**
   * Execute all registered test configurations
   */
  async executeAllTests(): Promise<SpawnTestResult[]> {
    const allConfigs = spawnTestLoader.getAllConfigurations()
    const testNames = allConfigs.map((config) => config.testName)
    return this.executeTestSuite(testNames)
  }

  /**
   * Execute tests by category
   */
  async executeTestsByCategory(
    category: SpawnTestConfiguration['category']
  ): Promise<SpawnTestResult[]> {
    const configs = spawnTestLoader.getConfigurationsByCategory(category)
    const testNames = configs.map((config) => config.testName)
    return this.executeTestSuite(testNames)
  }

  /**
   * Setup test environment
   */
  private async setupTest(testConfig: SpawnTestConfiguration): Promise<void> {
    // Validate test configuration
    const validation = spawnTestLoader.validateConfiguration(testConfig)
    if (!validation.valid) {
      throw new Error(
        `Invalid test configuration: ${validation.errors.join(', ')}`
      )
    }

    // Initialize game state manager if needed
    if (!gameStateManager.isInitialized()) {
      await gameStateManager.initialize()
    }

    // Convert test configuration to game configuration
    const gameConfig = spawnTestLoader.convertToGameConfig(testConfig)
    const configJson = JSON.stringify(gameConfig)

    // Load configuration into game state manager
    const loadResult = gameStateManager.loadConfiguration(configJson)
    if (!loadResult.success) {
      throw new Error(`Failed to load game configuration: ${loadResult.error}`)
    }

    console.log(`Spawn test '${testConfig.testName}' setup complete`)
  }

  /**
   * Run test frames and collect data
   */
  private async runTestFrames(
    testConfig: SpawnTestConfiguration
  ): Promise<void> {
    if (!this.testResult) {
      throw new Error('Test result not initialized')
    }

    const startTime = performance.now()
    let peakSpawnCount = 0

    // Run test for specified duration
    for (let frame = 0; frame <= testConfig.testDuration; frame++) {
      const frameStartTime = performance.now()

      // Step game frame
      const stepResult = gameStateManager.stepGameFrame()
      if (!stepResult.success) {
        this.testResult.issues.push(`Frame ${frame}: ${stepResult.error}`)
        continue
      }

      // Collect frame data if this is a validation point
      if (testConfig.validationPoints.includes(frame)) {
        const characters = gameStateManager.getCurrentCharacters()
        const spawns = gameStateManager.getCurrentSpawns()

        const frameData = {
          frame,
          spawnCount: spawns.length,
          spawnPositions: spawns.map(
            (spawn) => [spawn.position.x, spawn.position.y] as [number, number]
          ),
          spawnStates: spawns,
          characterStates: characters,
        }

        this.testResult.frameData.push(frameData)

        // Track peak spawn count
        peakSpawnCount = Math.max(peakSpawnCount, spawns.length)
      }

      const frameEndTime = performance.now()
      const frameTime = frameEndTime - frameStartTime

      // Log frame progress periodically
      if (frame % 30 === 0) {
        console.log(
          `Test frame ${frame}/${testConfig.testDuration}, spawns: ${
            gameStateManager.getCurrentSpawns().length
          }`
        )
      }
    }

    const endTime = performance.now()
    const totalTime = endTime - startTime

    // Update performance metrics
    this.testResult.performanceMetrics = {
      averageFrameTime: totalTime / testConfig.testDuration,
      peakSpawnCount,
    }

    console.log(
      `Test execution complete: ${
        testConfig.testDuration
      } frames in ${totalTime.toFixed(2)}ms`
    )
  }

  /**
   * Validate test results against expected outcomes
   */
  private async validateResults(
    testConfig: SpawnTestConfiguration
  ): Promise<void> {
    if (!this.testResult) {
      throw new Error('Test result not initialized')
    }

    let allValidationsPassed = true

    // Validate expected outcomes
    for (const expectedOutcome of testConfig.expectedOutcomes) {
      const frameData = this.testResult.frameData.find(
        (data) => data.frame === expectedOutcome.frame
      )

      if (!frameData) {
        this.testResult.issues.push(
          `No frame data found for validation point ${expectedOutcome.frame}`
        )
        allValidationsPassed = false
        continue
      }

      // Validate spawn count
      if (frameData.spawnCount !== expectedOutcome.expectedSpawnCount) {
        this.testResult.issues.push(
          `Frame ${expectedOutcome.frame}: Expected ${expectedOutcome.expectedSpawnCount} spawns, got ${frameData.spawnCount}`
        )
        allValidationsPassed = false
      }

      // Validate positions if specified
      if (expectedOutcome.expectedPositions) {
        if (
          frameData.spawnPositions.length !==
          expectedOutcome.expectedPositions.length
        ) {
          this.testResult.issues.push(
            `Frame ${expectedOutcome.frame}: Expected ${expectedOutcome.expectedPositions.length} spawn positions, got ${frameData.spawnPositions.length}`
          )
          allValidationsPassed = false
        }
      }
    }

    // Run validation criteria
    for (const criteria of testConfig.validationCriteria) {
      try {
        const passed = criteria.validator(this.testResult)

        this.testResult.validationResults.push({
          criteria,
          passed,
          details: passed ? 'Validation passed' : criteria.errorMessage,
        })

        if (!passed) {
          this.testResult.issues.push(criteria.errorMessage)
          allValidationsPassed = false
        }
      } catch (error) {
        const errorMessage = `Validation criteria '${
          criteria.description
        }' failed: ${error instanceof Error ? error.message : String(error)}`
        this.testResult.validationResults.push({
          criteria,
          passed: false,
          details: errorMessage,
        })
        this.testResult.issues.push(errorMessage)
        allValidationsPassed = false
      }
    }

    this.testResult.passed = allValidationsPassed

    console.log(
      `Test validation complete: ${allValidationsPassed ? 'PASSED' : 'FAILED'}`
    )
    if (!allValidationsPassed) {
      console.log('Issues found:', this.testResult.issues)
    }
  }

  /**
   * Cleanup test environment
   */
  private async cleanupTest(): Promise<void> {
    // Reset game state for next test
    try {
      gameStateManager.cleanup()
    } catch (error) {
      console.warn('Error during test cleanup:', error)
    }

    this.currentTest = null
  }

  /**
   * Determine which phase an error occurred in
   */
  private determineErrorPhase(
    error: any
  ): 'SETUP' | 'EXECUTION' | 'VALIDATION' | 'CLEANUP' {
    const errorMessage = error instanceof Error ? error.message : String(error)

    if (
      errorMessage.includes('configuration') ||
      errorMessage.includes('setup')
    ) {
      return 'SETUP'
    } else if (
      errorMessage.includes('validation') ||
      errorMessage.includes('criteria')
    ) {
      return 'VALIDATION'
    } else if (errorMessage.includes('cleanup')) {
      return 'CLEANUP'
    } else {
      return 'EXECUTION'
    }
  }

  /**
   * Generate a comprehensive test report
   */
  generateTestReport(results: SpawnTestResult[]): string {
    const totalTests = results.length
    const passedTests = results.filter((r) => r.passed).length
    const failedTests = totalTests - passedTests

    let report = `\n=== SPAWN SYSTEM TEST REPORT ===\n`
    report += `Total Tests: ${totalTests}\n`
    report += `Passed: ${passedTests}\n`
    report += `Failed: ${failedTests}\n`
    report += `Success Rate: ${((passedTests / totalTests) * 100).toFixed(
      1
    )}%\n\n`

    // Individual test results
    for (const result of results) {
      report += `--- ${result.testName} ---\n`
      report += `Status: ${result.passed ? 'PASSED' : 'FAILED'}\n`
      report += `Duration: ${
        result.frameData.length > 0
          ? `${Math.max(...result.frameData.map((f) => f.frame))} frames`
          : 'N/A'
      }\n`
      report += `Peak Spawns: ${result.performanceMetrics.peakSpawnCount}\n`
      report += `Avg Frame Time: ${result.performanceMetrics.averageFrameTime.toFixed(
        2
      )}ms\n`

      if (result.issues.length > 0) {
        report += `Issues:\n`
        result.issues.forEach((issue) => (report += `  - ${issue}\n`))
      }

      if (result.warnings.length > 0) {
        report += `Warnings:\n`
        result.warnings.forEach((warning) => (report += `  - ${warning}\n`))
      }

      report += '\n'
    }

    return report
  }
}

/**
 * Global spawn test runner instance
 */
export const spawnTestRunner = new SpawnTestRunner()

/**
 * Convenience function to run a single spawn test
 */
export async function runSpawnTest(testName: string): Promise<SpawnTestResult> {
  return spawnTestRunner.executeTest(testName)
}

/**
 * Convenience function to run all spawn tests
 */
export async function runAllSpawnTests(): Promise<SpawnTestResult[]> {
  return spawnTestRunner.executeAllTests()
}

/**
 * Convenience function to run spawn tests by category
 */
export async function runSpawnTestsByCategory(
  category: SpawnTestConfiguration['category']
): Promise<SpawnTestResult[]> {
  return spawnTestRunner.executeTestsByCategory(category)
}
