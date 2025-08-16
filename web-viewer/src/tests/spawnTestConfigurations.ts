/**
 * Spawn System Test Configurations
 *
 * Comprehensive test configurations for validating spawn system functionality
 * in the web viewer. These configurations test spawn creation, physics, collision,
 * lifecycle management, and performance.
 */

import { GameConfig } from '../config/gameConfigs'
import { ACTION_SCRIPTS, CONDITION_SCRIPTS } from '../constants/scriptConstants'

// ============================================================================
// SPAWN TEST CONFIGURATION INTERFACES
// ============================================================================

/**
 * Configuration for a single spawn entity in tests
 */
export interface SpawnTestConfig {
  spawnType: number // Spawn type identifier
  initialPosition: [number, number] // [x, y] position in pixels
  initialVelocity: [number, number] // [x, y] velocity in fixed-point
  properties: SpawnProperties
  expectedLifespan: number // Expected frames before cleanup
}

/**
 * Properties for spawn entities
 */
export interface SpawnProperties {
  size: [number, number] // [width, height] in pixels
  sprite?: number // Optional sprite identifier
  collision?: boolean // Whether spawn has collision detection
  physics?: boolean // Whether spawn is affected by physics
  [key: string]: any // Additional custom properties
}

/**
 * Character configuration for spawn tests
 */
export interface SpawnTestCharacterConfig {
  position: [number, number] // [x, y] position in pixels
  behaviors: Array<[number, number]> // [condition_id, action_id] pairs
  properties: CharacterProperties
}

/**
 * Character properties for spawn tests
 */
export interface CharacterProperties {
  health?: number
  energy?: number
  energy_cap?: number
  move_speed?: [number, number] // Fixed-point [numerator, denominator]
  jump_force?: [number, number] // Fixed-point [numerator, denominator]
  dir?: [number, number] // [horizontal, vertical] direction
  [key: string]: any // Additional properties
}

/**
 * Expected outcomes for validation
 */
export interface ExpectedOutcome {
  frame: number // Frame number to validate at
  expectedSpawnCount: number // Expected number of spawns
  expectedPositions?: Array<[number, number]> // Expected spawn positions
  expectedStates?: string[] // Expected spawn states
}

/**
 * Validation criteria for test results
 */
export interface ValidationCriteria {
  type: 'SPAWN_CREATION' | 'PHYSICS' | 'COLLISION' | 'LIFECYCLE' | 'PERFORMANCE'
  description: string
  validator: (testResult: SpawnTestResult) => boolean
  errorMessage: string
}

/**
 * Complete spawn test configuration
 */
export interface SpawnTestConfiguration {
  testName: string
  description: string

  // Test setup
  characters: SpawnTestCharacterConfig[]
  spawns: SpawnTestConfig[]

  // Test execution parameters
  testDuration: number // Total frames to run test
  validationPoints: number[] // Frames to validate at

  // Expected outcomes and validation
  expectedOutcomes: ExpectedOutcome[]
  validationCriteria: ValidationCriteria[]

  // Test metadata
  requirements: string[] // Requirements this test validates
  category:
    | 'BASIC'
    | 'PHYSICS'
    | 'COLLISION'
    | 'LIFECYCLE'
    | 'PERFORMANCE'
    | 'INTERACTION'
}

/**
 * Test execution result
 */
export interface SpawnTestResult {
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

// ============================================================================
// SPAWN TEST CONFIGURATION LOADER
// ============================================================================

/**
 * Manages loading and execution of spawn test configurations
 */
export class SpawnTestConfigurationLoader {
  private configurations: Map<string, SpawnTestConfiguration> = new Map()

  /**
   * Register a test configuration
   */
  registerConfiguration(config: SpawnTestConfiguration): void {
    this.configurations.set(config.testName, config)
  }

  /**
   * Get a test configuration by name
   */
  getConfiguration(testName: string): SpawnTestConfiguration | null {
    return this.configurations.get(testName) || null
  }

  /**
   * Get all registered configurations
   */
  getAllConfigurations(): SpawnTestConfiguration[] {
    return Array.from(this.configurations.values())
  }

  /**
   * Get configurations by category
   */
  getConfigurationsByCategory(
    category: SpawnTestConfiguration['category']
  ): SpawnTestConfiguration[] {
    return Array.from(this.configurations.values()).filter(
      (config) => config.category === category
    )
  }

  /**
   * Convert spawn test configuration to GameConfig format
   */
  convertToGameConfig(testConfig: SpawnTestConfiguration): GameConfig {
    // Base tilemap with walls for collision testing
    const tilemap = [
      // Top wall
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      // Side walls with empty space
      ...Array(13).fill([1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1]),
      // Bottom wall
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ]

    // Standard conditions and actions
    const conditions = [
      {
        energy_mul: 32,
        args: [0, 0, 0, 0, 0, 0, 0, 0],
        script: [...CONDITION_SCRIPTS.ALWAYS],
      },
      {
        energy_mul: 32,
        args: [0, 0, 0, 0, 0, 0, 0, 0],
        script: [...CONDITION_SCRIPTS.IS_GROUNDED],
      },
    ]

    const actions = [
      {
        energy_cost: 0,
        cooldown: 0,
        args: [0, 0, 0, 0, 0, 0, 0, 0],
        spawns: [0, 0, 0, 0], // Spawn configuration will be set based on test
        script: [
          20,
          0,
          0, // ASSIGN_BYTE vars[0] = 0 (spawn ID 0)
          84,
          0, // SPAWN vars[0] (create spawn with ID 0)
          0,
          1, // EXIT 1 (success)
        ], // Working spawn creation script
      },
    ]

    // Convert test characters to GameConfig format
    const characters = testConfig.characters.map((char, index) => ({
      id: index + 1,
      position: [
        [char.position[0], 1],
        [char.position[1], 1],
      ] as [[number, number], [number, number]],
      group: 1,
      size: [16, 32] as [number, number],
      health: char.properties.health || 100,
      health_cap: char.properties.health || 100,
      energy: char.properties.energy || 100,
      energy_cap: char.properties.energy_cap || 100,
      power: 10,
      weight: 5,
      jump_force: char.properties.jump_force || ([160, 32] as [number, number]),
      move_speed: char.properties.move_speed || ([2, 1] as [number, number]),
      armor: [0, 0, 0, 0, 0, 0, 0, 0, 0],
      energy_regen: 1,
      energy_regen_rate: 60,
      energy_charge: 5,
      energy_charge_rate: 30,
      dir: char.properties.dir || ([2, 2] as [number, number]),
      enmity: 0,
      target_id: null,
      target_type: 0,
      behaviors: char.behaviors,
    }))

    return {
      seed: 12345,
      gravity: [32, 64] as [number, number],
      tilemap,
      actions,
      conditions,
      characters,
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
      ], // Proper spawn definition for spawn creation
      status_effects: [],
    }
  }

  /**
   * Validate a test configuration
   */
  validateConfiguration(config: SpawnTestConfiguration): {
    valid: boolean
    errors: string[]
  } {
    const errors: string[] = []

    if (!config.testName || config.testName.trim() === '') {
      errors.push('Test name is required')
    }

    if (!config.description || config.description.trim() === '') {
      errors.push('Test description is required')
    }

    if (config.testDuration <= 0) {
      errors.push('Test duration must be positive')
    }

    if (config.characters.length === 0) {
      errors.push('At least one character is required')
    }

    if (config.validationPoints.length === 0) {
      errors.push('At least one validation point is required')
    }

    if (config.expectedOutcomes.length === 0) {
      errors.push('At least one expected outcome is required')
    }

    if (config.validationCriteria.length === 0) {
      errors.push('At least one validation criteria is required')
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }
}

// ============================================================================
// SAMPLE SPAWN TEST CONFIGURATIONS
// ============================================================================

/**
 * Basic spawn creation test - single character creates one spawn
 */
export const BASIC_SPAWN_CREATION_TEST: SpawnTestConfiguration = {
  testName: 'BASIC_SPAWN_CREATION',
  description: 'Test basic spawn creation functionality with single character',

  characters: [
    {
      position: [160, 200], // Center of screen, above ground
      behaviors: [
        [0, 0], // ALWAYS -> RUN (which should trigger spawn creation)
      ],
      properties: {
        health: 100,
        energy: 100,
        energy_cap: 100,
        move_speed: [2, 1], // 2.0 fixed-point
        dir: [2, 2], // Right, downward gravity
      },
    },
  ],

  spawns: [
    {
      spawnType: 1,
      initialPosition: [160, 200],
      initialVelocity: [0, 0],
      properties: {
        size: [16, 16],
        collision: true,
        physics: true,
      },
      expectedLifespan: 300, // 5 seconds at 60 FPS
    },
  ],

  testDuration: 120, // 2 seconds
  validationPoints: [1, 30, 60, 120], // Validate at multiple points

  expectedOutcomes: [
    {
      frame: 1,
      expectedSpawnCount: 0, // No spawns initially
    },
    {
      frame: 30,
      expectedSpawnCount: 1, // Spawn should be created by frame 30
      expectedPositions: [[160, 200]], // Near character position
    },
    {
      frame: 60,
      expectedSpawnCount: 1, // Spawn should still exist
    },
    {
      frame: 120,
      expectedSpawnCount: 1, // Spawn should still exist at test end
    },
  ],

  validationCriteria: [
    {
      type: 'SPAWN_CREATION',
      description: 'Spawn appears in game state JSON after creation',
      validator: (result) =>
        result.frameData.some((frame) => frame.spawnCount > 0),
      errorMessage: 'No spawns were created during the test',
    },
    {
      type: 'SPAWN_CREATION',
      description: 'Spawn appears visually in web viewer',
      validator: (result) =>
        result.frameData.some((frame) => frame.spawnPositions.length > 0),
      errorMessage: 'Spawns were not visible in the web viewer',
    },
  ],

  requirements: ['1.1', '1.2', '1.4'],
  category: 'BASIC',
}

/**
 * Multiple spawn creation test - character creates multiple spawns
 */
export const MULTIPLE_SPAWN_CREATION_TEST: SpawnTestConfiguration = {
  testName: 'MULTIPLE_SPAWN_CREATION',
  description: 'Test creation of multiple spawns by single character',

  characters: [
    {
      position: [160, 200],
      behaviors: [
        [0, 0], // ALWAYS -> RUN (continuous spawn creation)
      ],
      properties: {
        health: 100,
        energy: 100,
        energy_cap: 100,
        move_speed: [2, 1],
        dir: [2, 2],
      },
    },
  ],

  spawns: [
    {
      spawnType: 1,
      initialPosition: [160, 200],
      initialVelocity: [1, 0], // Moving right
      properties: {
        size: [16, 16],
        collision: true,
        physics: true,
      },
      expectedLifespan: 300,
    },
  ],

  testDuration: 180, // 3 seconds
  validationPoints: [30, 60, 90, 120, 150, 180],

  expectedOutcomes: [
    {
      frame: 30,
      expectedSpawnCount: 1,
    },
    {
      frame: 60,
      expectedSpawnCount: 2, // Second spawn created
    },
    {
      frame: 90,
      expectedSpawnCount: 3, // Third spawn created
    },
    {
      frame: 180,
      expectedSpawnCount: 3, // All spawns should still exist
    },
  ],

  validationCriteria: [
    {
      type: 'SPAWN_CREATION',
      description: 'Multiple spawns are created independently',
      validator: (result) => result.performanceMetrics.peakSpawnCount >= 3,
      errorMessage: 'Failed to create multiple independent spawns',
    },
    {
      type: 'SPAWN_CREATION',
      description: 'Each spawn renders without conflicts',
      validator: (result) =>
        result.frameData.every(
          (frame) => frame.spawnPositions.length === frame.spawnCount
        ),
      errorMessage: 'Spawn rendering conflicts detected',
    },
  ],

  requirements: ['1.1', '1.2', '1.3'],
  category: 'BASIC',
}

/**
 * Spawn physics validation test - spawns with initial velocity
 */
export const SPAWN_PHYSICS_TEST: SpawnTestConfiguration = {
  testName: 'SPAWN_PHYSICS',
  description: 'Test spawn physics and movement behavior',

  characters: [
    {
      position: [160, 150], // Higher up to see gravity effect
      behaviors: [
        [0, 0], // ALWAYS -> RUN (create spawn)
      ],
      properties: {
        health: 100,
        energy: 100,
        energy_cap: 100,
        move_speed: [2, 1],
        dir: [2, 2],
      },
    },
  ],

  spawns: [
    {
      spawnType: 1,
      initialPosition: [160, 150],
      initialVelocity: [2, -3], // Moving right and up initially
      properties: {
        size: [16, 16],
        collision: true,
        physics: true,
      },
      expectedLifespan: 300,
    },
  ],

  testDuration: 120,
  validationPoints: [1, 15, 30, 45, 60, 90, 120],

  expectedOutcomes: [
    {
      frame: 15,
      expectedSpawnCount: 1,
    },
    {
      frame: 30,
      expectedSpawnCount: 1,
      // Spawn should have moved right and started falling due to gravity
    },
    {
      frame: 60,
      expectedSpawnCount: 1,
      // Spawn should be further right and lower due to gravity
    },
  ],

  validationCriteria: [
    {
      type: 'PHYSICS',
      description: 'Spawns move visually with initial velocity',
      validator: (result) => {
        const firstFrame = result.frameData.find((f) => f.spawnCount > 0)
        const lastFrame = result.frameData[result.frameData.length - 1]
        if (
          !firstFrame ||
          !lastFrame ||
          firstFrame.spawnPositions.length === 0 ||
          lastFrame.spawnPositions.length === 0
        ) {
          return false
        }
        // Check if spawn moved horizontally (right)
        return lastFrame.spawnPositions[0][0] > firstFrame.spawnPositions[0][0]
      },
      errorMessage: 'Spawns did not move with initial velocity',
    },
    {
      type: 'PHYSICS',
      description: 'Spawns are affected by gravity',
      validator: (result) => {
        const firstFrame = result.frameData.find((f) => f.spawnCount > 0)
        const lastFrame = result.frameData[result.frameData.length - 1]
        if (
          !firstFrame ||
          !lastFrame ||
          firstFrame.spawnPositions.length === 0 ||
          lastFrame.spawnPositions.length === 0
        ) {
          return false
        }
        // Check if spawn moved downward due to gravity
        return lastFrame.spawnPositions[0][1] > firstFrame.spawnPositions[0][1]
      },
      errorMessage: 'Spawns were not affected by gravity',
    },
  ],

  requirements: ['2.1', '2.2', '2.4'],
  category: 'PHYSICS',
}

// ============================================================================
// CONFIGURATION REGISTRY
// ============================================================================

/**
 * Global spawn test configuration loader instance
 */
export const spawnTestLoader = new SpawnTestConfigurationLoader()

// Register all sample configurations
spawnTestLoader.registerConfiguration(BASIC_SPAWN_CREATION_TEST)
spawnTestLoader.registerConfiguration(MULTIPLE_SPAWN_CREATION_TEST)
spawnTestLoader.registerConfiguration(SPAWN_PHYSICS_TEST)

/**
 * Helper function to get all available test configurations
 */
export function getAllSpawnTestConfigurations(): SpawnTestConfiguration[] {
  return spawnTestLoader.getAllConfigurations()
}

/**
 * Helper function to get a specific test configuration
 */
export function getSpawnTestConfiguration(
  testName: string
): SpawnTestConfiguration | null {
  return spawnTestLoader.getConfiguration(testName)
}

/**
 * Helper function to convert a spawn test to a game configuration
 */
export function convertSpawnTestToGameConfig(
  testName: string
): GameConfig | null {
  const testConfig = spawnTestLoader.getConfiguration(testName)
  if (!testConfig) {
    return null
  }

  return spawnTestLoader.convertToGameConfig(testConfig)
}
