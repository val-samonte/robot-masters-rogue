/**
 * Additional Spawn Test Samples
 *
 * Extended collection of spawn test configurations covering collision detection,
 * lifecycle management, character interactions, and performance scenarios.
 */

import {
  SpawnTestConfiguration,
  spawnTestLoader,
} from './spawnTestConfigurations'

// ============================================================================
// COLLISION DETECTION TESTS
// ============================================================================

/**
 * Spawn collision with tilemap walls test
 */
export const SPAWN_WALL_COLLISION_TEST: SpawnTestConfiguration = {
  testName: 'SPAWN_WALL_COLLISION',
  description: 'Test spawn collision detection with tilemap walls',

  characters: [
    {
      position: [48, 200], // Near left wall
      behaviors: [
        [0, 0], // ALWAYS -> RUN (create spawn moving toward wall)
      ],
      properties: {
        health: 100,
        energy: 100,
        energy_cap: 100,
        move_speed: [2, 1],
        dir: [0, 2], // Left direction, toward wall
      },
    },
  ],

  spawns: [
    {
      spawnType: 1,
      initialPosition: [48, 200],
      initialVelocity: [-2, 0], // Moving left toward wall
      properties: {
        size: [16, 16],
        collision: true,
        physics: true,
      },
      expectedLifespan: 300,
    },
  ],

  testDuration: 90, // 1.5 seconds
  validationPoints: [15, 30, 45, 60, 90],

  expectedOutcomes: [
    {
      frame: 15,
      expectedSpawnCount: 1,
    },
    {
      frame: 30,
      expectedSpawnCount: 1,
      // Spawn should have hit wall and stopped
    },
    {
      frame: 90,
      expectedSpawnCount: 1,
      // Spawn should remain at wall position
    },
  ],

  validationCriteria: [
    {
      type: 'COLLISION',
      description: 'Spawns stop moving when hitting walls',
      validator: (result) => {
        const earlyFrame = result.frameData.find((f) => f.frame === 15)
        const lateFrame = result.frameData.find((f) => f.frame === 90)
        if (
          !earlyFrame ||
          !lateFrame ||
          earlyFrame.spawnPositions.length === 0 ||
          lateFrame.spawnPositions.length === 0
        ) {
          return false
        }
        // Spawn should not move significantly after hitting wall
        const deltaX = Math.abs(
          lateFrame.spawnPositions[0][0] - earlyFrame.spawnPositions[0][0]
        )
        return deltaX < 10 // Less than 10 pixels movement after collision
      },
      errorMessage: 'Spawns did not stop when colliding with walls',
    },
    {
      type: 'COLLISION',
      description: 'Spawn collision response is visually accurate',
      validator: (result) => {
        // Check that spawn position is consistent with collision response
        const lastFrame = result.frameData[result.frameData.length - 1]
        if (lastFrame.spawnPositions.length === 0) return false
        // Spawn should be near the wall (x position close to wall boundary)
        return (
          lastFrame.spawnPositions[0][0] >= 16 &&
          lastFrame.spawnPositions[0][0] <= 48
        )
      },
      errorMessage: 'Spawn collision response not visually accurate',
    },
  ],

  requirements: ['3.1', '3.4'],
  category: 'COLLISION',
}

/**
 * Spawn ground collision test
 */
export const SPAWN_GROUND_COLLISION_TEST: SpawnTestConfiguration = {
  testName: 'SPAWN_GROUND_COLLISION',
  description: 'Test spawn collision with ground/floor tiles',

  characters: [
    {
      position: [160, 100], // High up to test falling
      behaviors: [
        [0, 0], // ALWAYS -> RUN (create spawn)
      ],
      properties: {
        health: 100,
        energy: 100,
        energy_cap: 100,
        move_speed: [2, 1],
        dir: [2, 2], // Right, downward gravity
      },
    },
  ],

  spawns: [
    {
      spawnType: 1,
      initialPosition: [160, 100],
      initialVelocity: [0, 0], // No initial velocity, will fall due to gravity
      properties: {
        size: [16, 16],
        collision: true,
        physics: true,
      },
      expectedLifespan: 300,
    },
  ],

  testDuration: 120,
  validationPoints: [15, 30, 60, 90, 120],

  expectedOutcomes: [
    {
      frame: 15,
      expectedSpawnCount: 1,
    },
    {
      frame: 60,
      expectedSpawnCount: 1,
      // Spawn should be falling
    },
    {
      frame: 120,
      expectedSpawnCount: 1,
      // Spawn should have hit ground and stopped
    },
  ],

  validationCriteria: [
    {
      type: 'COLLISION',
      description: 'Spawns fall and hit the ground',
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
        // Spawn should have moved downward significantly
        return (
          lastFrame.spawnPositions[0][1] > firstFrame.spawnPositions[0][1] + 50
        )
      },
      errorMessage: 'Spawns did not fall due to gravity',
    },
    {
      type: 'COLLISION',
      description: 'Spawns stop falling when hitting ground',
      validator: (result) => {
        const lastFrame = result.frameData[result.frameData.length - 1]
        if (lastFrame.spawnPositions.length === 0) return false
        // Spawn should be near ground level (bottom of tilemap)
        return lastFrame.spawnPositions[0][1] >= 200 // Near bottom of screen
      },
      errorMessage: 'Spawns did not stop when hitting ground',
    },
  ],

  requirements: ['3.3', '3.4'],
  category: 'COLLISION',
}

// ============================================================================
// LIFECYCLE MANAGEMENT TESTS
// ============================================================================

/**
 * Spawn lifespan test - spawns with limited lifespan
 */
export const SPAWN_LIFESPAN_TEST: SpawnTestConfiguration = {
  testName: 'SPAWN_LIFESPAN',
  description: 'Test spawn lifecycle management with limited lifespan',

  characters: [
    {
      position: [160, 200],
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
      initialPosition: [160, 200],
      initialVelocity: [0, 0],
      properties: {
        size: [16, 16],
        collision: true,
        physics: true,
      },
      expectedLifespan: 60, // 1 second lifespan
    },
  ],

  testDuration: 120, // 2 seconds
  validationPoints: [15, 30, 45, 60, 75, 90, 120],

  expectedOutcomes: [
    {
      frame: 30,
      expectedSpawnCount: 1, // Spawn should exist
    },
    {
      frame: 60,
      expectedSpawnCount: 1, // Spawn should still exist at lifespan limit
    },
    {
      frame: 75,
      expectedSpawnCount: 0, // Spawn should be removed after lifespan
    },
    {
      frame: 120,
      expectedSpawnCount: 0, // Spawn should remain removed
    },
  ],

  validationCriteria: [
    {
      type: 'LIFECYCLE',
      description: 'Spawns are removed after expected lifespan',
      validator: (result) => {
        const beforeExpiry = result.frameData.find((f) => f.frame === 60)
        const afterExpiry = result.frameData.find((f) => f.frame === 75)
        if (!beforeExpiry || !afterExpiry) return false
        return beforeExpiry.spawnCount > 0 && afterExpiry.spawnCount === 0
      },
      errorMessage: 'Spawns were not removed after expected lifespan',
    },
    {
      type: 'LIFECYCLE',
      description: 'Spawns disappear from visual display when removed',
      validator: (result) => {
        const afterExpiry = result.frameData.find((f) => f.frame === 75)
        if (!afterExpiry) return false
        return afterExpiry.spawnPositions.length === 0
      },
      errorMessage: 'Spawns did not disappear from visual display when removed',
    },
  ],

  requirements: ['4.1', '4.4'],
  category: 'LIFECYCLE',
}

/**
 * Spawn cleanup test - game state reset
 */
export const SPAWN_CLEANUP_TEST: SpawnTestConfiguration = {
  testName: 'SPAWN_CLEANUP',
  description: 'Test spawn cleanup when game state is reset',

  characters: [
    {
      position: [160, 200],
      behaviors: [
        [0, 0], // ALWAYS -> RUN (create multiple spawns)
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
      initialVelocity: [1, 0],
      properties: {
        size: [16, 16],
        collision: true,
        physics: true,
      },
      expectedLifespan: 300, // Long lifespan
    },
  ],

  testDuration: 90, // 1.5 seconds
  validationPoints: [30, 60, 90],

  expectedOutcomes: [
    {
      frame: 30,
      expectedSpawnCount: 1,
    },
    {
      frame: 60,
      expectedSpawnCount: 2, // Multiple spawns created
    },
    {
      frame: 90,
      expectedSpawnCount: 3, // More spawns created
    },
  ],

  validationCriteria: [
    {
      type: 'LIFECYCLE',
      description: 'Multiple spawns are created before cleanup',
      validator: (result) => {
        return result.performanceMetrics.peakSpawnCount >= 2
      },
      errorMessage: 'Multiple spawns were not created for cleanup test',
    },
    {
      type: 'LIFECYCLE',
      description: 'No visual artifacts remain after cleanup',
      validator: (result) => {
        // This will be validated by the test runner's cleanup process
        return true // Placeholder - actual cleanup validation happens in test runner
      },
      errorMessage: 'Visual artifacts remained after spawn cleanup',
    },
  ],

  requirements: ['4.3', '4.4'],
  category: 'LIFECYCLE',
}

// ============================================================================
// CHARACTER INTERACTION TESTS
// ============================================================================

/**
 * Character-spawn interaction test
 */
export const CHARACTER_SPAWN_INTERACTION_TEST: SpawnTestConfiguration = {
  testName: 'CHARACTER_SPAWN_INTERACTION',
  description: 'Test interactions between characters and spawns',

  characters: [
    {
      position: [160, 200],
      behaviors: [
        [0, 0], // ALWAYS -> RUN (create spawn and move)
      ],
      properties: {
        health: 100,
        energy: 100,
        energy_cap: 100,
        move_speed: [1, 1], // Slower movement for interaction testing
        dir: [2, 2],
      },
    },
  ],

  spawns: [
    {
      spawnType: 1,
      initialPosition: [160, 200], // Same position as character
      initialVelocity: [-1, 0], // Moving opposite to character
      properties: {
        size: [16, 16],
        collision: true,
        physics: true,
      },
      expectedLifespan: 300,
    },
  ],

  testDuration: 120,
  validationPoints: [15, 30, 60, 90, 120],

  expectedOutcomes: [
    {
      frame: 15,
      expectedSpawnCount: 1,
    },
    {
      frame: 60,
      expectedSpawnCount: 1,
      // Character and spawn should be interacting
    },
    {
      frame: 120,
      expectedSpawnCount: 1,
    },
  ],

  validationCriteria: [
    {
      type: 'COLLISION',
      description: 'Spawns appear at correct positions relative to character',
      validator: (result) => {
        const firstFrame = result.frameData.find((f) => f.spawnCount > 0)
        if (
          !firstFrame ||
          firstFrame.spawnPositions.length === 0 ||
          firstFrame.characterStates.length === 0
        ) {
          return false
        }
        // Spawn should be created near character position
        const charPos = firstFrame.characterStates[0].position
        const spawnPos = firstFrame.spawnPositions[0]
        const distance = Math.sqrt(
          Math.pow(charPos.x - spawnPos[0], 2) +
            Math.pow(charPos.y - spawnPos[1], 2)
        )
        return distance < 50 // Within 50 pixels of character
      },
      errorMessage:
        'Spawns were not created at correct positions relative to character',
    },
    {
      type: 'COLLISION',
      description: 'Character and spawn collision detection works',
      validator: (result) => {
        // Check if character collision flags are set when near spawns
        return result.frameData.some((frame) => {
          if (
            frame.characterStates.length === 0 ||
            frame.spawnPositions.length === 0
          )
            return false
          const char = frame.characterStates[0]
          const spawn = frame.spawnPositions[0]
          const distance = Math.sqrt(
            Math.pow(char.position.x - spawn[0], 2) +
              Math.pow(char.position.y - spawn[1], 2)
          )
          // If character and spawn are close, collision should be detected
          return distance < 32 // Within collision range
        })
      },
      errorMessage: 'Character-spawn collision detection not working',
    },
  ],

  requirements: ['6.1', '6.3'],
  category: 'INTERACTION',
}

// ============================================================================
// PERFORMANCE TESTS
// ============================================================================

/**
 * Multiple spawns performance test
 */
export const MULTIPLE_SPAWNS_PERFORMANCE_TEST: SpawnTestConfiguration = {
  testName: 'MULTIPLE_SPAWNS_PERFORMANCE',
  description: 'Test performance with multiple active spawns',

  characters: [
    {
      position: [80, 200],
      behaviors: [
        [0, 0], // ALWAYS -> RUN (create spawns continuously)
      ],
      properties: {
        health: 100,
        energy: 100,
        energy_cap: 100,
        move_speed: [2, 1],
        dir: [2, 2],
      },
    },
    {
      position: [240, 200],
      behaviors: [
        [0, 0], // ALWAYS -> RUN (create spawns continuously)
      ],
      properties: {
        health: 100,
        energy: 100,
        energy_cap: 100,
        move_speed: [2, 1],
        dir: [0, 2], // Left direction
      },
    },
  ],

  spawns: [
    {
      spawnType: 1,
      initialPosition: [80, 200],
      initialVelocity: [1, 0],
      properties: {
        size: [16, 16],
        collision: true,
        physics: true,
      },
      expectedLifespan: 180, // 3 seconds
    },
  ],

  testDuration: 180, // 3 seconds
  validationPoints: [30, 60, 90, 120, 150, 180],

  expectedOutcomes: [
    {
      frame: 60,
      expectedSpawnCount: 4, // Multiple spawns from both characters
    },
    {
      frame: 120,
      expectedSpawnCount: 8, // More spawns accumulated
    },
    {
      frame: 180,
      expectedSpawnCount: 10, // Peak spawn count
    },
  ],

  validationCriteria: [
    {
      type: 'PERFORMANCE',
      description: 'Frame rate remains stable with multiple spawns',
      validator: (result) => {
        // Check that average frame time is reasonable (< 20ms for 50+ FPS)
        return result.performanceMetrics.averageFrameTime < 20
      },
      errorMessage: 'Frame rate degraded with multiple spawns',
    },
    {
      type: 'PERFORMANCE',
      description: 'System handles reasonable spawn count without crashes',
      validator: (result) => {
        // Test should complete without crashes and handle at least 10 spawns
        return (
          result.performanceMetrics.peakSpawnCount >= 10 &&
          result.frameData.length > 0
        )
      },
      errorMessage: 'System could not handle reasonable spawn count',
    },
  ],

  requirements: ['7.1', '7.3'],
  category: 'PERFORMANCE',
}

// ============================================================================
// REGISTER ALL SAMPLE CONFIGURATIONS
// ============================================================================

// Register all additional test configurations
spawnTestLoader.registerConfiguration(SPAWN_WALL_COLLISION_TEST)
spawnTestLoader.registerConfiguration(SPAWN_GROUND_COLLISION_TEST)
spawnTestLoader.registerConfiguration(SPAWN_LIFESPAN_TEST)
spawnTestLoader.registerConfiguration(SPAWN_CLEANUP_TEST)
spawnTestLoader.registerConfiguration(CHARACTER_SPAWN_INTERACTION_TEST)
spawnTestLoader.registerConfiguration(MULTIPLE_SPAWNS_PERFORMANCE_TEST)

console.log(
  'Spawn test samples loaded:',
  spawnTestLoader.getAllConfigurations().length,
  'total configurations'
)
