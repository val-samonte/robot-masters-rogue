# Implementation Plan

- [x] 1. Set up project structure and core interfaces

  - Create directory structure for models, services, repositories, and API components
  - Define interfaces that establish system boundaries
  - _Requirements: 1.1, 10.1_

- [x] 2. Implement fixed-point mathematics system
- [x] 2.1 Create Fixed-point number type with 5-bit precision

  - Write Fixed struct with i16 storage and 5-bit fractional precision
  - Implement core arithmetic operations (add, sub, mul, div)
  - Create unit tests for arithmetic operations and overflow handling
  - _Requirements: 2.1, 2.4_

- [x] 2.2 Implement precomputed trigonometry lookup tables

  - Create sin/cos tables with 1-degree precision using Fixed-point values
  - Implement atan2 lookup table for angle calculations
  - Write unit tests for trigonometric function accuracy
  - _Requirements: 2.2_

- [x] 3. Create deterministic seeded randomization system
- [x] 3.1 Implement seeded PRNG with u16 seed

  - Write deterministic pseudo-random number generator using linear congruential generator
  - Ensure reproducible sequences with same seed values
  - Create unit tests for deterministic behavior verification
  - _Requirements: 3.1, 3.2, 3.4_

- [x] 4. Implement tilemap system for game arena
- [x] 4.1 Create tilemap data structure and collision detection

  - Define 16x15 byte array structure for tilemap representation
  - Implement tile collision detection for empty and block tile types
  - Write collision detection functions for entity-tilemap interactions
  - Create unit tests for collision detection accuracy
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 5. Build entity system foundation
- [x] 5.1 Create base entity structures and Character implementation

  - Define EntityCore with id, group, position, velocity, size, and collision properties
  - Implement Character struct with health, energy, behaviors, and status effects
  - Create SpawnInstance struct for projectiles and temporary objects
  - Write unit tests for entity creation and property management
  - _Requirements: 5.1, 8.1_

- [x] 6. Implement bytecode scripting system
- [x] 6.1 Create scalable operator system with structured patterns

  - Define Operator enum with explicit byte values and grouped operation patterns
  - Implement simple byte-to-enum conversion for efficient operator lookup
  - Design generic operand patterns (3-operand arithmetic, 2-operand operations, property access)
  - Write unit tests for operator mapping and pattern consistency
  - _Requirements: 6.1, 6.3_

- [x] 6.2 Build script execution engine with generic operation handlers

  - Implement ScriptEngine with execution context (vars, fixed arrays, game references)
  - Create generic handler functions for arithmetic, conditional, and logical operations
  - Implement scalable property access system with read_property/write_property functions
  - Write unit tests for script execution and operation handler correctness
  - _Requirements: 6.1, 6.2, 6.4_

- [x] 7. Implement Character behavior system
- [x] 7.1 Create Condition and Action execution logic

  - Implement Condition struct with energy multiplier, args, and bytecode script
  - Create Action struct with energy cost, duration, args, and bytecode script
  - Build behavior execution flow (top-to-bottom until condition passes)
  - Write unit tests for behavior execution order and energy requirements
  - _Requirements: 5.2, 5.3, 5.4_

- [x] 8. Build Status effects system
- [x] 8.1 Implement Status effect definitions and instances

  - Create StatusEffect struct with duration, stack limits, and three script types
  - Implement StatusEffectInstance for active effects on characters
  - Build status effect application, tick, and removal logic
  - Write unit tests for status effect lifecycle and stacking behavior
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [x] 9. Create Spawn system for projectiles
- [x] 9.1 Implement Spawn definitions and instance management

  - Create Spawn struct with damage, health, duration, element, and behavior scripts
  - Build spawn creation, behavior execution, and collision handling
  - Implement despawn logic with despawn script execution
  - Write unit tests for spawn lifecycle and collision interactions
  - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [x] 10. Implement game state management and serialization
- [x] 10.1 Create GameState structure with efficient serialization

  - Define GameState with seed, frame, tilemap, status, and all entity collections
  - Implement compact binary serialization for Solana PDA storage
  - Create JSON serialization for debugging and web integration
  - Write unit tests for serialization round-trip consistency
  - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [-] 11. Build core game loop and frame processing with essential scripts
- [x] 11.1 Implement deterministic frame-based game loop

  - Create game_loop function that advances state by exactly one frame
  - Implement 3840-frame limit (60 FPS × 64 seconds) with automatic game end
  - Build frame processing pipeline: behaviors → physics → collisions → cleanup
  - Write unit tests for deterministic frame processing and game timing
  - _Requirements: 1.1, 1.2_

- [x] 11.2 Create essential Condition scripts for game loop testing

  - Implement "Energy below 20%" condition script using property access and comparison operators
  - Implement "Energy below 10%" condition script for critical energy states
  - Implement "Character on ground" condition script using collision detection
  - Implement "Character leaning on wall" condition script for wall detection
  - Implement "Always true" condition script that never fails
  - Implement "Random 1 out of 20" and "Random 1 out of 10" condition scripts using seeded randomization
  - Write unit tests to verify condition script accuracy and deterministic behavior
  - _Requirements: 6.1, 6.2, 5.4, 3.2, 4.3_

- [ ] 11.3 Create essential Action scripts for character behaviors

  - Implement "Run" action script that modifies velocity.x based on move speed
  - Implement "Jump" action script that sets velocity.y to jump force when on ground
  - Implement "Turn around" action script that reverses velocity.x when on ground
  - Implement "Wall jump" action script for wall-based jumping when not on ground
  - Implement locked action behavior where actions continue until condition expires
  - Write unit tests for movement action execution and physics integration
  - _Requirements: 6.2, 6.3, 5.1, 6.9, 6.10_

- [ ] 11.4 Implement complete character behavior integration

  - Create behavior list combining conditions and actions: Energy below 10% → Charge, Leaning on wall → Turn around, Random 1/20 → Jump, Random 1/20 → Shoot, Always → Run
  - Test behavior priority and execution order (top to bottom until condition passes)
  - Integrate behavior processing into the main game loop
  - Write integration tests for complete character AI behavior within game loop
  - _Requirements: 5.2, 5.3, 6.1, 6.2_

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

- [ ] 15. Enhance script system with ARGS and spawn ID support
- [x] 15.1 Update ScriptEngine with args and spawns arrays

  - Add `args: [u8; 8]` array for read-only script parameters
  - Add `spawns: [u8; 4]` array for spawn ID management
  - Ensure args remain read-only throughout script execution
  - Write unit tests for args and spawns array functionality
  - _Requirements: 6.1, 6.2_

- [x] 15.2 Implement new script operators for args and spawn access

  - Add `ReadArg` operator to copy values from args to vars array (read-only access)
  - Add `ReadSpawn` and `WriteSpawn` operators for spawn ID management
  - Add `ReadVar` and `WriteVar` operators for vars array access (if not already implemented)
  - Write unit tests for new operator functionality
  - _Requirements: 6.1, 6.3_

- [x] 15.3 Update entity structures with expanded property sets

  - Add `vars: [u8; 8]` property to Condition struct
  - Expand `args` from `[u8; 4]` to `[u8; 8]` in all entity types
  - Add `spawns: [u8; 4]` property to Character, Spawn, Action, Condition, StatusEffect
  - Implement property accessors for all new properties
  - Write unit tests for expanded entity properties
  - _Requirements: 5.1, 6.1, 7.1, 8.1_

- [x] 15.4 Update requirements and design documentation

  - Document the read-only nature of args in requirements
  - Update design document with args/vars separation of concerns
  - Document spawn ID management system in design
  - Add examples of reusable actions using args (like Shoot with ammo capacity)
  - _Requirements: 6.1, 6.2_

- [ ] 16. Create complex Action scripts for combat and energy management
- [ ] 16.1 Implement Shoot Action script with spawn management

  - Create "Shoot" action script that spawns projectiles using spawn ID and ammo tracking
  - Implement fire rate limiting and ammo consumption logic
  - Use args array for configurable ammo capacity and spawns array for projectile management
  - Write unit tests for shooting mechanics and spawn creation
  - _Requirements: 6.2, 6.5, 6.8, 8.1_

- [ ] 16.2 Implement Hurt Action as locked action script

  - Create "Hurt" locked action script with short jump and backward movement
  - Implement invulnerability frames and movement restriction during hurt state
  - Write unit tests for hurt state behavior and locked action mechanics
  - _Requirements: 6.2, 6.9, 6.10_

- [ ] 16.3 Implement Charge Action for energy recovery

  - Create "Charge" locked action script that stops movement and recovers energy
  - Implement energy recovery rate based on character properties
  - Write unit tests for energy charging mechanics and movement restriction
  - _Requirements: 6.2, 6.9, 6.10, 5.1_

- [ ] 20. Create integration tests and performance benchmarks
- [ ] 20.1 Build end-to-end game scenarios and performance tests
  - Create multi-frame game scenarios with complex character behaviors
  - Implement cross-platform determinism verification tests
  - Build performance benchmarks for frame processing and serialization
  - Write property-based tests for arithmetic and serialization consistency
  - _Requirements: 1.1, 2.4, 3.4, 9.2_
