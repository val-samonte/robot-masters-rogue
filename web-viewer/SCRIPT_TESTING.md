# Script Integration Testing Guide

This document explains how to test the script constants with WASM integration in the Robot Masters Web Viewer.

## Overview

Task 4 has been completed with comprehensive script integration testing that validates:

- ✅ ACTION_SCRIPTS work correctly with WASM game engine
- ✅ CONDITION_SCRIPTS trigger properly in game scenarios
- ✅ Script template mixing functionality
- ✅ All action types: run, turn around, jump, wall jump, and charge
- ✅ All condition types: always, chance-based, energy-based, and collision-based
- ✅ Proper energy consumption and timing mechanics
- ✅ Debugging output for script execution validation

## Files Created

### Core Implementation

- `src/tests/scriptIntegrationTest.ts` - Main test suite with comprehensive validation
- `src/tests/testConfigurations.ts` - Pre-built test configurations for each script type
- `src/tests/testRunner.ts` - Quick test runner for browser console usage
- `validate-scripts.js` - Node.js validation script to verify implementation
- `test-integration.js` - Browser integration test utilities

### Enhanced Components

- `src/components/DebugPanel.tsx` - Enhanced with script testing tab and controls

## How to Test

### 1. Validation (Pre-Testing)

First, validate that all script integration components are properly implemented:

```bash
cd web-viewer
node validate-scripts.js
```

This will verify:

- Script constants are properly defined
- Test configurations are available
- Integration test suite is complete

### 2. Development Server

Start the development server:

```bash
npm run dev
```

### 3. Browser Console Testing

Open the browser console and use these commands:

#### Quick Tests

```javascript
// Test all script integrations
await runComprehensiveTests()

// Test specific configuration
await testConfig('RUN_ALWAYS')
await testConfig('JUMP_GROUNDED')
await testConfig('MIXED_SCRIPTS')
```

#### Available Test Configurations

- `RUN_ALWAYS` - Character continuously moves right
- `TURN_AROUND` - Character randomly changes direction
- `JUMP_GROUNDED` - Character jumps when touching ground
- `WALL_JUMP` - Character wall jumps when sliding against walls
- `CHARGE_LOW_ENERGY` - Character charges when energy is low
- `MIXED_SCRIPTS` - Multiple scripts working together
- `ENERGY_CONSUMPTION` - High energy cost actions to test consumption
- `CHANCE_CONDITIONS` - Multiple characters with different chance conditions
- `COLLISION_CONDITIONS` - Tests collision-based script triggers

#### Advanced Testing

```javascript
// Access full test suite
const testSuite = window.scriptIntegrationTests
await testSuite.initialize()
const results = await testSuite.runAllTests()
testSuite.printResults()

// Access quick test runner
const runner = window.scriptTestRunner
await runner.validateAllActions()
await runner.validateAllConditions()
```

### 4. Debug Panel Testing

The enhanced Debug Panel includes a "Scripts" tab with:

- **Run All Script Tests** - Executes comprehensive test suite
- **Load Test Config** buttons - Quick load pre-built test configurations
- **Test Results** display - Shows pass/fail status for each test
- **Script Validation** - Step through frames and analyze character behavior

## Test Coverage

### Action Scripts Tested

1. **RUN** - Moves character based on facing direction and move speed

   - ✅ Velocity changes correctly
   - ✅ Direction affects movement
   - ✅ No energy consumption for basic movement

2. **TURN_AROUND** - Flips character facing direction

   - ✅ Facing direction changes from left to right or vice versa
   - ✅ No energy consumption
   - ✅ Works with chance-based conditions

3. **JUMP** - Applies upward velocity with energy cost

   - ✅ Negative Y velocity (upward movement)
   - ✅ Energy consumption validation
   - ✅ Energy requirement checking

4. **WALL_JUMP** - Jumps off walls with horizontal and vertical force

   - ✅ Wall collision detection
   - ✅ Combined horizontal and vertical movement
   - ✅ Higher energy cost validation

5. **CHARGE** - Recovers energy over time
   - ✅ Energy increases when below cap
   - ✅ Timing mechanics with charge rate
   - ✅ Energy cap enforcement

### Condition Scripts Tested

1. **ALWAYS** - Always triggers (100% chance)

   - ✅ Consistent script execution
   - ✅ Continuous character behavior

2. **CHANCE_10/20/50** - Random percentage triggers

   - ✅ Random number generation
   - ✅ Threshold-based triggering
   - ✅ Variable behavior patterns

3. **ENERGY_LOW_10/20** - Triggers when energy below threshold

   - ✅ Energy percentage calculations
   - ✅ Threshold comparison logic
   - ✅ Energy-based behavior switching

4. **IS_GROUNDED** - Triggers when touching ground

   - ✅ Bottom collision detection
   - ✅ Ground-based behavior activation

5. **IS_WALL_SLIDING** - Triggers when sliding against walls
   - ✅ Wall collision detection (left/right)
   - ✅ Not grounded condition
   - ✅ Combined collision logic

### Integration Features Tested

1. **Script Template Mixing**

   - ✅ Multiple scripts per character
   - ✅ Different action/condition combinations
   - ✅ Script priority and execution order

2. **Energy Consumption Mechanics**

   - ✅ Energy cost application
   - ✅ Energy requirement validation
   - ✅ Energy regeneration timing

3. **WASM Integration**
   - ✅ Configuration loading and validation
   - ✅ Game state updates and retrieval
   - ✅ Frame stepping and timing
   - ✅ Error handling and debugging

## Debugging Output

The test suite provides comprehensive debugging output:

### Console Logging

- Frame-by-frame execution details
- Character state changes (position, energy, facing, velocity)
- Script execution validation
- Error reporting with context

### Debug Panel Integration

- Real-time game state display
- Script execution validation
- Test result visualization
- Configuration loading status

### Browser Developer Tools

- Global debugging functions available
- WASM health monitoring
- Game state inspection utilities
- Performance monitoring

## Expected Test Results

When running the comprehensive tests, you should see:

```
🧪 Running Script Integration Tests
🏃 Testing RUN action...
✅ RUN Action Test - Character moved with correct velocity

🔄 Testing TURN_AROUND action...
✅ TURN_AROUND Action Test - Facing direction changed

🦘 Testing JUMP action...
✅ JUMP Action Test - Upward velocity and energy consumption

🧗 Testing WALL_JUMP action...
✅ WALL_JUMP Action Test - Wall jump mechanics validated

⚡ Testing CHARGE action...
✅ CHARGE Action Test - Energy increased over time

[... additional test results ...]

📊 Script Integration Test Results
✅ Passed: 12/12
❌ Failed: 0/12
```

## Troubleshooting

### Common Issues

1. **WASM not initialized**

   - Ensure the web viewer has fully loaded
   - Check browser console for WASM loading errors

2. **Configuration load failures**

   - Verify script constants are properly formatted
   - Check for syntax errors in test configurations

3. **Test execution failures**
   - Ensure game is properly initialized before testing
   - Check for frame stepping errors in console

### Debug Commands

```javascript
// Check WASM status
window.robotMastersDebug.getHealthInfo()

// Dump current game state
window.robotMastersDebug.dumpState()

// Enable verbose logging
window.robotMastersDebug.enableVerboseLogging()
```

## Validation Checklist

- [x] All 5 action scripts implemented and tested
- [x] All 8 condition scripts implemented and tested
- [x] Script template mixing functionality working
- [x] Energy consumption mechanics validated
- [x] WASM integration fully functional
- [x] Debugging output comprehensive and useful
- [x] Browser console integration complete
- [x] Debug panel enhanced with script testing
- [x] Test configurations cover all scenarios
- [x] Error handling robust and informative

## Next Steps

After validating script integration:

1. **Task 5**: Create configuration loader component
2. **Task 6**: Implement React PIXI game canvas
3. **Task 7**: Add game state visualization
4. **Task 8**: Create basic game controls

The script integration testing foundation is now complete and ready to support the remaining web viewer development tasks.
