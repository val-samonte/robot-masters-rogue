/**
 * Spawn Test System Validation
 *
 * Simple validation script to verify the spawn test configuration system
 * is working correctly and all components are properly integrated.
 */

import {
  spawnTestLoader,
  getAllSpawnTestConfigurations,
  getSpawnTestConfiguration,
  convertSpawnTestToGameConfig,
  validateAllSpawnTestConfigurations,
  getSpawnTestSummary,
} from './spawnTestSystem'

/**
 * Validate the spawn test configuration system
 */
export function validateSpawnTestSystem(): {
  success: boolean
  errors: string[]
} {
  const errors: string[] = []

  try {
    // Test 1: Check if configurations are loaded
    const allConfigs = getAllSpawnTestConfigurations()
    if (allConfigs.length === 0) {
      errors.push('No test configurations loaded')
    } else {
      console.log(`✓ Loaded ${allConfigs.length} test configurations`)
    }

    // Test 2: Check if basic configurations exist
    const basicTest = getSpawnTestConfiguration('BASIC_SPAWN_CREATION')
    if (!basicTest) {
      errors.push('BASIC_SPAWN_CREATION test configuration not found')
    } else {
      console.log('✓ BASIC_SPAWN_CREATION test configuration found')
    }

    // Test 3: Validate configuration structure
    const validationResults = validateAllSpawnTestConfigurations()
    const invalidConfigs = validationResults.filter((r) => !r.valid)
    if (invalidConfigs.length > 0) {
      errors.push(
        `Invalid configurations found: ${invalidConfigs
          .map((c) => c.testName)
          .join(', ')}`
      )
      invalidConfigs.forEach((config) => {
        console.error(`Invalid config ${config.testName}:`, config.errors)
      })
    } else {
      console.log('✓ All test configurations are valid')
    }

    // Test 4: Test game config conversion
    if (basicTest) {
      const gameConfig = convertSpawnTestToGameConfig('BASIC_SPAWN_CREATION')
      if (!gameConfig) {
        errors.push(
          'Failed to convert test configuration to game configuration'
        )
      } else if (!gameConfig.characters || gameConfig.characters.length === 0) {
        errors.push('Converted game configuration has no characters')
      } else {
        console.log(
          '✓ Test configuration successfully converted to game configuration'
        )
      }
    }

    // Test 5: Check test summary
    const summary = getSpawnTestSummary()
    if (summary.totalTests === 0) {
      errors.push('Test summary shows no tests available')
    } else {
      console.log(
        `✓ Test summary: ${summary.totalTests} tests across ${
          Object.keys(summary.categories).length
        } categories`
      )
      console.log('Categories:', summary.categories)
    }

    // Test 6: Check required test categories
    const requiredCategories = [
      'BASIC',
      'PHYSICS',
      'COLLISION',
      'LIFECYCLE',
      'INTERACTION',
      'PERFORMANCE',
    ]
    const availableCategories = Object.keys(summary.categories)
    const missingCategories = requiredCategories.filter(
      (cat) => !availableCategories.includes(cat)
    )
    if (missingCategories.length > 0) {
      errors.push(`Missing test categories: ${missingCategories.join(', ')}`)
    } else {
      console.log('✓ All required test categories are available')
    }

    // Test 7: Check specific test configurations
    const requiredTests = [
      'BASIC_SPAWN_CREATION',
      'MULTIPLE_SPAWN_CREATION',
      'SPAWN_PHYSICS',
      'SPAWN_WALL_COLLISION',
      'SPAWN_LIFESPAN',
      'CHARACTER_SPAWN_INTERACTION',
      'MULTIPLE_SPAWNS_PERFORMANCE',
    ]

    const missingTests = requiredTests.filter(
      (testName) => !getSpawnTestConfiguration(testName)
    )
    if (missingTests.length > 0) {
      errors.push(`Missing required tests: ${missingTests.join(', ')}`)
    } else {
      console.log('✓ All required test configurations are available')
    }

    // Test 8: Validate test configuration loader
    const loaderConfigs = spawnTestLoader.getAllConfigurations()
    if (loaderConfigs.length !== allConfigs.length) {
      errors.push(
        'Configuration loader and helper function return different counts'
      )
    } else {
      console.log('✓ Configuration loader is working correctly')
    }

    return {
      success: errors.length === 0,
      errors,
    }
  } catch (error) {
    errors.push(
      `Validation failed with error: ${
        error instanceof Error ? error.message : String(error)
      }`
    )
    return {
      success: false,
      errors,
    }
  }
}

/**
 * Run validation and log results
 */
export function runSpawnTestSystemValidation(): boolean {
  console.log('=== Spawn Test System Validation ===')

  const result = validateSpawnTestSystem()

  if (result.success) {
    console.log('✅ Spawn test system validation PASSED')
    console.log('All components are working correctly')
    return true
  } else {
    console.log('❌ Spawn test system validation FAILED')
    console.log('Errors found:')
    result.errors.forEach((error) => console.log(`  - ${error}`))
    return false
  }
}

// Auto-run validation when imported
if (typeof window !== 'undefined') {
  // Browser environment - run validation
  setTimeout(() => runSpawnTestSystemValidation(), 100)
} else {
  // Node.js environment - export for manual running
  console.log(
    'Spawn test system validation available - call runSpawnTestSystemValidation()'
  )
}
