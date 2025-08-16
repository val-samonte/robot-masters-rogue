# Spawn System Testing

This directory contains a comprehensive testing framework for validating the spawn system functionality in the web viewer.

## Overview

The spawn test system provides:

- **Test Configuration System**: TypeScript interfaces and loader for defining spawn test scenarios
- **Test Runner**: Automated execution and validation of spawn tests
- **Sample Configurations**: Pre-built test cases covering all spawn system requirements
- **Validation Framework**: Automated checking of spawn behavior against expected outcomes

## Quick Start

### Running Basic Tests

```typescript
import { runBasicSpawnTests } from './spawnTestSystem'

// Run all basic spawn creation tests
const results = await runBasicSpawnTests()
console.log('Basic tests completed:', results.length, 'tests')
```

### Running All Tests

```typescript
import { runCompleteSpawnTestSuite } from './spawnTestSystem'

// Run complete test suite
const results = await runCompleteSpawnTestSuite()
console.log(
  'All tests completed:',
  results.filter((r) => r.passed).length,
  'passed'
)
```

### Running Specific Test

```typescript
import { runSpawnTest } from './spawnTestSystem'

// Run a specific test by name
const result = await runSpawnTest('BASIC_SPAWN_CREATION')
console.log('Test result:', result.passed ? 'PASSED' : 'FAILED')
```

## Test Categories

### BASIC Tests

- `BASIC_SPAWN_CREATION`: Single character creates one spawn
- `MULTIPLE_SPAWN_CREATION`: Character creates multiple spawns

### PHYSICS Tests

- `SPAWN_PHYSICS`: Spawns with initial velocity and gravity effects

### COLLISION Tests

- `SPAWN_WALL_COLLISION`: Spawn collision with tilemap walls
- `SPAWN_GROUND_COLLISION`: Spawn collision with ground/floor

### LIFECYCLE Tests

- `SPAWN_LIFESPAN`: Spawns with limited lifespan
- `SPAWN_CLEANUP`: Spawn cleanup on game state reset

### INTERACTION Tests

- `CHARACTER_SPAWN_INTERACTION`: Character-spawn interactions

### PERFORMANCE Tests

- `MULTIPLE_SPAWNS_PERFORMANCE`: Performance with many active spawns

## Creating Custom Tests

### Define Test Configuration

```typescript
import { SpawnTestConfiguration } from './spawnTestSystem'

const customTest: SpawnTestConfiguration = {
  testName: 'CUSTOM_SPAWN_TEST',
  description: 'Custom spawn test description',

  characters: [
    {
      position: [160, 200],
      behaviors: [[0, 0]], // ALWAYS -> RUN
      properties: {
        health: 100,
        energy: 100,
        move_speed: [2, 1],
      },
    },
  ],

  spawns: [
    {
      spawnType: 1,
      initialPosition: [160, 200],
      initialVelocity: [1, 0],
      properties: {
        size: [16, 16],
        collision: true,
        physics: true,
      },
      expectedLifespan: 300,
    },
  ],

  testDuration: 120,
  validationPoints: [30, 60, 120],

  expectedOutcomes: [
    {
      frame: 30,
      expectedSpawnCount: 1,
    },
  ],

  validationCriteria: [
    {
      type: 'SPAWN_CREATION',
      description: 'Spawn is created successfully',
      validator: (result) => result.frameData.some((f) => f.spawnCount > 0),
      errorMessage: 'No spawns were created',
    },
  ],

  requirements: ['1.1', '1.2'],
  category: 'BASIC',
}
```

### Register and Run Custom Test

```typescript
import { spawnTestLoader, runSpawnTest } from './spawnTestSystem'

// Register the custom test
spawnTestLoader.registerConfiguration(customTest)

// Run the custom test
const result = await runSpawnTest('CUSTOM_SPAWN_TEST')
```

## Test Results

Each test returns a `SpawnTestResult` object containing:

```typescript
interface SpawnTestResult {
  testName: string
  passed: boolean
  timestamp: Date

  // Frame-by-frame data
  frameData: Array<{
    frame: number
    spawnCount: number
    spawnPositions: Array<[number, number]>
    spawnStates: any[]
    characterStates: any[]
  }>

  // Performance metrics
  performanceMetrics: {
    averageFrameTime: number
    peakSpawnCount: number
    memoryUsage?: number
  }

  // Validation results
  validationResults: Array<{
    criteria: ValidationCriteria
    passed: boolean
    details: string
  }>

  // Issues and warnings
  issues: string[]
  warnings: string[]
}
```

## Validation Criteria Types

- **SPAWN_CREATION**: Tests spawn creation and visibility
- **PHYSICS**: Tests spawn movement and physics behavior
- **COLLISION**: Tests spawn collision detection
- **LIFECYCLE**: Tests spawn lifespan and cleanup
- **PERFORMANCE**: Tests system performance with spawns

## Integration with Web Viewer

The test system integrates with the existing web viewer infrastructure:

- Uses `gameStateManager` for game state management
- Leverages existing WASM wrapper for game engine communication
- Compatible with existing debug tools and utilities
- Follows established patterns from `testConfigurations.ts`

## Requirements Coverage

The test configurations validate all spawn system requirements:

- **Requirement 1**: Spawn creation and rendering (1.1, 1.2, 1.3, 1.4)
- **Requirement 2**: Spawn physics and movement (2.1, 2.2, 2.3, 2.4)
- **Requirement 3**: Spawn collision detection (3.1, 3.2, 3.3, 3.4)
- **Requirement 4**: Spawn lifecycle management (4.1, 4.2, 4.3, 4.4)
- **Requirement 5**: Different spawn configurations (5.1, 5.2, 5.3, 5.4)
- **Requirement 6**: Spawn-character interactions (6.1, 6.2, 6.3, 6.4)
- **Requirement 7**: Performance validation (7.1, 7.2, 7.3, 7.4)

## Debugging

### View Test Summary

```typescript
import { getSpawnTestSummary } from './spawnTestSystem'

console.log(getSpawnTestSummary())
// Output: { totalTests: 9, categories: { BASIC: 3, PHYSICS: 1, ... }, testNames: [...] }
```

### Validate Configurations

```typescript
import { validateAllSpawnTestConfigurations } from './spawnTestSystem'

const validation = validateAllSpawnTestConfigurations()
console.log('Configuration validation:', validation)
```

### Generate Test Report

```typescript
import { spawnTestRunner } from './spawnTestSystem'

const results = await runAllSpawnTests()
const report = spawnTestRunner.generateTestReport(results)
console.log(report)
```

## Files

- `spawnTestConfigurations.ts`: Core interfaces and basic test configurations
- `spawnTestRunner.ts`: Test execution and validation logic
- `spawnTestSamples.ts`: Additional test configurations for all scenarios
- `spawnTestSystem.ts`: Main export point and utilities
- `README.md`: This documentation file

## Usage in Web Viewer

The spawn test system can be integrated into the web viewer's debug panel or used standalone for development testing. It provides comprehensive validation of the spawn system's integration with the web viewer's rendering, physics, and interaction systems.
