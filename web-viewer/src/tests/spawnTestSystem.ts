/**
 * Spawn Test System - Main Export
 *
 * Central export point for all spawn testing functionality.
 * Provides easy access to test configurations, runner, and utilities.
 */

// Core interfaces and types
export type {
  SpawnTestConfig,
  SpawnProperties,
  SpawnTestCharacterConfig,
  CharacterProperties,
  ExpectedOutcome,
  ValidationCriteria,
  SpawnTestConfiguration,
  SpawnTestResult,
} from './spawnTestConfigurations'

// Import types for internal use
import type { SpawnTestConfiguration } from './spawnTestConfigurations'

// Configuration loader and management
export {
  SpawnTestConfigurationLoader,
  spawnTestLoader,
  getAllSpawnTestConfigurations,
  getSpawnTestConfiguration,
  convertSpawnTestToGameConfig,

  // Basic test configurations
  BASIC_SPAWN_CREATION_TEST,
  MULTIPLE_SPAWN_CREATION_TEST,
  SPAWN_PHYSICS_TEST,
} from './spawnTestConfigurations'

// Test runner and execution
export {
  SpawnTestRunner,
  SpawnTestExecutionError,
  spawnTestRunner,
  runSpawnTest,
  runAllSpawnTests,
  runSpawnTestsByCategory,
} from './spawnTestRunner'

// Additional test samples (imports the samples to register them)
import './spawnTestSamples'

// Re-export specific sample tests for direct access
export {
  SPAWN_WALL_COLLISION_TEST,
  SPAWN_GROUND_COLLISION_TEST,
  SPAWN_LIFESPAN_TEST,
  SPAWN_CLEANUP_TEST,
  CHARACTER_SPAWN_INTERACTION_TEST,
  MULTIPLE_SPAWNS_PERFORMANCE_TEST,
} from './spawnTestSamples'

/**
 * Quick start function to run basic spawn tests
 */
export async function runBasicSpawnTests() {
  const { runSpawnTestsByCategory } = await import('./spawnTestRunner')
  return runSpawnTestsByCategory('BASIC')
}

/**
 * Quick start function to run all spawn tests
 */
export async function runCompleteSpawnTestSuite() {
  const { runAllSpawnTests } = await import('./spawnTestRunner')
  return runAllSpawnTests()
}

/**
 * Get test configuration summary for debugging
 */
export function getSpawnTestSummary() {
  const configs = spawnTestLoader.getAllConfigurations()

  const summary = {
    totalTests: configs.length,
    categories: {} as Record<string, number>,
    testNames: configs.map((c: SpawnTestConfiguration) => c.testName),
  }

  configs.forEach((config: SpawnTestConfiguration) => {
    summary.categories[config.category] =
      (summary.categories[config.category] || 0) + 1
  })

  return summary
}

/**
 * Validate all registered test configurations
 */
export function validateAllSpawnTestConfigurations() {
  const configs = spawnTestLoader.getAllConfigurations()
  const results: Array<{
    testName: string
    valid: boolean
    errors: string[]
  }> = []

  for (const config of configs) {
    const validation = spawnTestLoader.validateConfiguration(config)
    results.push({
      testName: config.testName,
      valid: validation.valid,
      errors: validation.errors,
    })
  }

  return results
}

// Validation functionality
export {
  validateSpawnTestSystem,
  runSpawnTestSystemValidation,
} from './spawnTestSystemValidation'

// Log system initialization
console.log('Spawn Test System initialized')
console.log('Available test configurations:', getSpawnTestSummary())
