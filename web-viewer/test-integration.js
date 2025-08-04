/**
 * Integration Test for Script Constants with WASM
 *
 * This file can be run in the browser console to test script integration
 * Run this after the web viewer has loaded
 */

// Test script to verify script constants work with WASM integration
async function testScriptIntegration() {
  console.group('🧪 Script Integration Test')

  try {
    // Check if test runner is available
    if (!window.scriptTestRunner) {
      console.error(
        '❌ Script test runner not available. Make sure the app has loaded.'
      )
      return
    }

    console.log('✅ Test runner available')

    // Test 1: RUN action with ALWAYS condition
    console.log('🏃 Testing RUN action...')
    await window.testConfig('RUN_ALWAYS')

    // Test 2: JUMP action with grounded condition
    console.log('🦘 Testing JUMP action...')
    await window.testConfig('JUMP_GROUNDED')

    // Test 3: Energy consumption
    console.log('⚡ Testing energy consumption...')
    await window.testConfig('ENERGY_CONSUMPTION')

    // Test 4: Script mixing
    console.log('🎭 Testing script mixing...')
    await window.testConfig('MIXED_SCRIPTS')

    console.log('✅ All integration tests completed')
  } catch (error) {
    console.error('❌ Integration test failed:', error)
  } finally {
    console.groupEnd()
  }
}

// Test individual script constants
async function testScriptConstants() {
  console.group('🔧 Script Constants Test')

  try {
    // Import script constants (this assumes they're available globally)
    const { ACTION_SCRIPTS, CONDITION_SCRIPTS } = await import(
      './src/constants/scriptConstants.js'
    )

    console.log('✅ Script constants imported')

    // Verify action scripts
    const actionTypes = Object.keys(ACTION_SCRIPTS)
    console.log(`📋 Action scripts available: ${actionTypes.join(', ')}`)

    actionTypes.forEach((action) => {
      const script = ACTION_SCRIPTS[action]
      console.log(`  • ${action}: ${script.length} bytes`)
    })

    // Verify condition scripts
    const conditionTypes = Object.keys(CONDITION_SCRIPTS)
    console.log(`📋 Condition scripts available: ${conditionTypes.join(', ')}`)

    conditionTypes.forEach((condition) => {
      const script = CONDITION_SCRIPTS[condition]
      console.log(`  • ${condition}: ${script.length} bytes`)
    })

    console.log('✅ Script constants validation completed')
  } catch (error) {
    console.error('❌ Script constants test failed:', error)
  } finally {
    console.groupEnd()
  }
}

// Comprehensive test suite
async function runComprehensiveTests() {
  console.group('🚀 Comprehensive Script Integration Tests')

  await testScriptConstants()
  await testScriptIntegration()

  // Run full test suite if available
  if (window.runScriptTests) {
    console.log('🧪 Running full test suite...')
    await window.runScriptTests()
  }

  console.log('🎉 All tests completed!')
  console.groupEnd()
}

// Make functions available globally
window.testScriptIntegration = testScriptIntegration
window.testScriptConstants = testScriptConstants
window.runComprehensiveTests = runComprehensiveTests

// Auto-run basic tests if this script is executed directly
if (typeof window !== 'undefined') {
  console.log('🧪 Script integration test utilities loaded')
  console.log('Available functions:')
  console.log('  • testScriptIntegration() - Test script integration with WASM')
  console.log('  • testScriptConstants() - Validate script constants')
  console.log('  • runComprehensiveTests() - Run all tests')
  console.log('')
  console.log('Quick start: await runComprehensiveTests()')
}
