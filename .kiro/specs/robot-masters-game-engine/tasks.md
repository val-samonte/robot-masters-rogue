# Implementation Plan

- [x] 1. Set up project structure and core interfaces

  - Create directory structure for models, services, repositories, and API components
  - Define interfaces that establish system boundaries
  - _Requirements: 1.1, 10.1_

- [ ] 2. Implement fixed-point mathematics system
- [ ] 2.1 Create Fixed-point number type with 5-bit precision

  - Write Fixed struct with i16 storage and 5-bit fractional precision
  - Implement core arithmetic operations (add, sub, mul, div)
  - Create unit tests for arithmetic operations and overflow handling
  - _Requirements: 2.1, 2.4_

- [ ] 2.2 Implement precomputed trigonometry lookup tables

  - Create sin/cos tables with 1-degree precision using Fixed-point values
  - Implement atan2 lookup table for angle calculations
  - Write unit tests for trigonometric function accuracy
  - _Requirements: 2.2_

- [ ] 3. Create deterministic seeded randomization system
- [ ] 3.1 Implement seeded PRNG with u16 seed

  - Write deterministic pseudo-random number generator using linear congruential generator
  - Ensure reproducible sequences with same seed values
  - Create unit tests for deterministic behavior verification
  - _Requirements: 3.1, 3.2, 3.4_

- [ ] 4. Implement tilemap system for game arena
- [ ] 4.1 Create tilemap data structure and collision detection

  - Define 16x15 byte array structure for tilemap representation
  - Implement tile collision detection for empty and block tile types
  - Write collision detection functions for entity-tilemap interactions
  - Create unit tests for collision detection accuracy
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [ ] 5. Build entity system foundation
- [ ] 5.1 Create base entity structures and Character implementation

  - Define EntityCore with id, group, position, velocity, size, and collision properties
  - Implement Character struct with health, energy, behaviors, and status effects
  - Create SpawnInstance struct for projectiles and temporary objects
  - Write unit tests for entity creation and property management
  - _Requirements: 5.1, 8.1_

- [ ] 6. Implement bytecode scripting system
- [ ] 6.1 Create efficient operator mapping system

  - Define Operator enum with all bytecode operations
  - Implement efficient byte-to-enum mapping using lookup tables instead of match statements
  - Create ScriptValue enum for different data types in scripts
  - Write unit tests for operator mapping efficiency and correctness
  - _Requirements: 6.1, 6.3_

- [ ] 6.2 Build script execution engine

  - Implement ScriptEngine with execution context (variables, stack)
  - Create script interpreters for Conditions, Actions, and Spawn behaviors
  - Implement property access system with efficient byte-to-property mapping
  - Write unit tests for script execution and property access
  - _Requirements: 6.1, 6.2, 6.4_

- [ ] 7. Implement Character behavior system
- [ ] 7.1 Create Condition and Action execution logic

  - Implement Condition struct with energy multiplier, args, and bytecode script
  - Create Action struct with energy cost, duration, args, and bytecode script
  - Build behavior execution flow (top-to-bottom until condition passes)
  - Write unit tests for behavior execution order and energy requirements
  - _Requirements: 5.2, 5.3, 5.4_

- [ ] 8. Build Status effects system
- [ ] 8.1 Implement Status effect definitions and instances

  - Create StatusEffect struct with duration, stack limits, and three script types
  - Implement StatusEffectInstance for active effects on characters
  - Build status effect application, tick, and removal logic
  - Write unit tests for status effect lifecycle and stacking behavior
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [ ] 9. Create Spawn system for projectiles
- [ ] 9.1 Implement Spawn definitions and instance management

  - Create Spawn struct with damage, health, duration, element, and behavior scripts
  - Build spawn creation, behavior execution, and collision handling
  - Implement despawn logic with despawn script execution
  - Write unit tests for spawn lifecycle and collision interactions
  - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [ ] 10. Implement game state management and serialization
- [ ] 10.1 Create GameState structure with efficient serialization

  - Define GameState with seed, frame, tilemap, status, and all entity collections
  - Implement compact binary serialization for Solana PDA storage
  - Create JSON serialization for debugging and web integration
  - Write unit tests for serialization round-trip consistency
  - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [ ] 11. Build core game loop and frame processing
- [ ] 11.1 Implement deterministic frame-based game loop

  - Create game_loop function that advances state by exactly one frame
  - Implement 3840-frame limit (60 FPS × 64 seconds) with automatic game end
  - Build frame processing pipeline: behaviors → physics → collisions → cleanup
  - Write unit tests for deterministic frame processing and game timing
  - _Requirements: 1.1, 1.2_

- [ ] 12. Create public API functions
- [ ] 12.1 Implement new_game, game_loop, and game_state functions

  - Create new_game function accepting seed, tilemap, and entity definitions
  - Ensure game_loop advances state by one frame deterministically
  - Implement game_state function returning both JSON and binary representations
  - Write integration tests for complete API functionality
  - _Requirements: 1.3, 1.4, 10.2_

- [ ] 13. Add malleable logging system
- [ ] 13.1 Create platform-adaptive logging interface

  - Define Logger trait with log, debug, and error methods
  - Implement conditional compilation for different platform loggers
  - Create no-op logger for production builds
  - Write unit tests for logging functionality across platforms
  - _Requirements: 10.3_

- [ ] 14. Implement comprehensive error handling
- [ ] 14.1 Create GameError types and error propagation

  - Define GameError enum with InvalidScript, SerializationError, etc.
  - Implement Result types for all fallible operations
  - Add graceful error handling for script execution failures
  - Write unit tests for error handling and recovery scenarios
  - _Requirements: 6.4, 9.4_

- [ ] 15. Create integration tests and performance benchmarks
- [ ] 15.1 Build end-to-end game scenarios and performance tests
  - Create multi-frame game scenarios with complex character behaviors
  - Implement cross-platform determinism verification tests
  - Build performance benchmarks for frame processing and serialization
  - Write property-based tests for arithmetic and serialization consistency
  - _Requirements: 1.1, 2.4, 3.4, 9.2_
