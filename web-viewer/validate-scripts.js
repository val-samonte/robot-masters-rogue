#!/usr/bin/env node

/**
 * Script Validation Test
 *
 * Validates that script constants are properly formatted and contain expected bytecode
 */

import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Read and validate script constants
function validateScriptConstants() {
  console.log('🔧 Validating Script Constants...')

  try {
    // Read the script constants file
    const scriptConstantsPath = join(
      __dirname,
      'src/constants/scriptConstants.ts'
    )
    const scriptContent = readFileSync(scriptConstantsPath, 'utf8')

    // Basic validation checks
    const checks = [
      {
        name: 'ACTION_SCRIPTS export',
        test: () => scriptContent.includes('export const ACTION_SCRIPTS'),
        required: true,
      },
      {
        name: 'CONDITION_SCRIPTS export',
        test: () => scriptContent.includes('export const CONDITION_SCRIPTS'),
        required: true,
      },
      {
        name: 'RUN action script',
        test: () => scriptContent.includes('RUN: ['),
        required: true,
      },
      {
        name: 'TURN_AROUND action script',
        test: () => scriptContent.includes('TURN_AROUND: ['),
        required: true,
      },
      {
        name: 'JUMP action script',
        test: () => scriptContent.includes('JUMP: ['),
        required: true,
      },
      {
        name: 'WALL_JUMP action script',
        test: () => scriptContent.includes('WALL_JUMP: ['),
        required: true,
      },
      {
        name: 'CHARGE action script',
        test: () => scriptContent.includes('CHARGE: ['),
        required: true,
      },
      {
        name: 'ALWAYS condition script',
        test: () => scriptContent.includes('ALWAYS: ['),
        required: true,
      },
      {
        name: 'CHANCE_10 condition script',
        test: () => scriptContent.includes('CHANCE_10: ['),
        required: true,
      },
      {
        name: 'CHANCE_20 condition script',
        test: () => scriptContent.includes('CHANCE_20: ['),
        required: true,
      },
      {
        name: 'CHANCE_50 condition script',
        test: () => scriptContent.includes('CHANCE_50: ['),
        required: true,
      },
      {
        name: 'ENERGY_LOW_10 condition script',
        test: () => scriptContent.includes('ENERGY_LOW_10: ['),
        required: true,
      },
      {
        name: 'ENERGY_LOW_20 condition script',
        test: () => scriptContent.includes('ENERGY_LOW_20: ['),
        required: true,
      },
      {
        name: 'IS_GROUNDED condition script',
        test: () => scriptContent.includes('IS_GROUNDED: ['),
        required: true,
      },
      {
        name: 'IS_WALL_SLIDING condition script',
        test: () => scriptContent.includes('IS_WALL_SLIDING: ['),
        required: true,
      },
      {
        name: 'createScriptTemplate function',
        test: () =>
          scriptContent.includes('export function createScriptTemplate'),
        required: true,
      },
      {
        name: 'OperatorAddress constants',
        test: () => scriptContent.includes('const OperatorAddress'),
        required: true,
      },
      {
        name: 'PropertyAddress constants',
        test: () => scriptContent.includes('const PropertyAddress'),
        required: true,
      },
    ]

    let passed = 0
    let failed = 0

    checks.forEach((check) => {
      const result = check.test()
      if (result) {
        console.log(`  ✅ ${check.name}`)
        passed++
      } else {
        console.log(`  ❌ ${check.name}`)
        failed++
        if (check.required) {
          console.log(`     ^ This is a required check`)
        }
      }
    })

    console.log(
      `\n📊 Script Constants Validation: ${passed}/${checks.length} checks passed`
    )

    if (failed === 0) {
      console.log('✅ All script constants validation checks passed!')
      return true
    } else {
      console.log(`❌ ${failed} validation checks failed`)
      return false
    }
  } catch (error) {
    console.error('❌ Failed to validate script constants:', error.message)
    return false
  }
}

// Validate test configurations
function validateTestConfigurations() {
  console.log('\n🧪 Validating Test Configurations...')

  try {
    const testConfigPath = join(__dirname, 'src/tests/testConfigurations.ts')
    const testContent = readFileSync(testConfigPath, 'utf8')

    const configChecks = [
      {
        name: 'TEST_CONFIGURATIONS export',
        test: () => testContent.includes('export const TEST_CONFIGURATIONS'),
      },
      {
        name: 'RUN_ALWAYS_CONFIG',
        test: () => testContent.includes('RUN_ALWAYS_CONFIG'),
      },
      {
        name: 'JUMP_GROUNDED_CONFIG',
        test: () => testContent.includes('JUMP_GROUNDED_CONFIG'),
      },
      {
        name: 'MIXED_SCRIPTS_CONFIG',
        test: () => testContent.includes('MIXED_SCRIPTS_CONFIG'),
      },
      {
        name: 'ENERGY_CONSUMPTION_CONFIG',
        test: () => testContent.includes('ENERGY_CONSUMPTION_CONFIG'),
      },
      {
        name: 'createCustomTestConfig function',
        test: () =>
          testContent.includes('export function createCustomTestConfig'),
      },
    ]

    let passed = 0
    configChecks.forEach((check) => {
      const result = check.test()
      if (result) {
        console.log(`  ✅ ${check.name}`)
        passed++
      } else {
        console.log(`  ❌ ${check.name}`)
      }
    })

    console.log(
      `\n📊 Test Configurations Validation: ${passed}/${configChecks.length} checks passed`
    )
    return passed === configChecks.length
  } catch (error) {
    console.error('❌ Failed to validate test configurations:', error.message)
    return false
  }
}

// Validate test integration
function validateTestIntegration() {
  console.log('\n🔗 Validating Test Integration...')

  try {
    const testIntegrationPath = join(
      __dirname,
      'src/tests/scriptIntegrationTest.ts'
    )
    const integrationContent = readFileSync(testIntegrationPath, 'utf8')

    const integrationChecks = [
      {
        name: 'ScriptIntegrationTestSuite class',
        test: () =>
          integrationContent.includes(
            'export class ScriptIntegrationTestSuite'
          ),
      },
      {
        name: 'runAllTests method',
        test: () => integrationContent.includes('async runAllTests()'),
      },
      {
        name: 'testRunAction method',
        test: () => integrationContent.includes('testRunAction()'),
      },
      {
        name: 'testJumpAction method',
        test: () => integrationContent.includes('testJumpAction()'),
      },
      {
        name: 'testChargeAction method',
        test: () => integrationContent.includes('testChargeAction()'),
      },
      {
        name: 'testEnergyConsumption method',
        test: () => integrationContent.includes('testEnergyConsumption()'),
      },
      {
        name: 'setupScriptIntegrationTests export',
        test: () =>
          integrationContent.includes(
            'export const setupScriptIntegrationTests'
          ),
      },
    ]

    let passed = 0
    integrationChecks.forEach((check) => {
      const result = check.test()
      if (result) {
        console.log(`  ✅ ${check.name}`)
        passed++
      } else {
        console.log(`  ❌ ${check.name}`)
      }
    })

    console.log(
      `\n📊 Test Integration Validation: ${passed}/${integrationChecks.length} checks passed`
    )
    return passed === integrationChecks.length
  } catch (error) {
    console.error('❌ Failed to validate test integration:', error.message)
    return false
  }
}

// Main validation function
function main() {
  console.log('🧪 Script Integration Validation\n')

  const results = [
    validateScriptConstants(),
    validateTestConfigurations(),
    validateTestIntegration(),
  ]

  const allPassed = results.every((result) => result)

  console.log('\n' + '='.repeat(50))
  if (allPassed) {
    console.log(
      '🎉 All validations passed! Script integration is ready for testing.'
    )
    console.log('\nNext steps:')
    console.log('1. Run `npm run dev` to start the development server')
    console.log('2. Open the browser console')
    console.log(
      '3. Run `await runComprehensiveTests()` to test script integration'
    )
    process.exit(0)
  } else {
    console.log('❌ Some validations failed. Please fix the issues above.')
    process.exit(1)
  }
}

// Run validation
main()
