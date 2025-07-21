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

- [x] 11.3 Create essential Action scripts for character behaviors

  - Implement "Run" action script that modifies velocity.x based on move speed
  - Implement "Jump" action script that sets velocity.y to jump force when on ground
  - Implement "Turn around" action script that reverses velocity.x when on ground
  - Implement "Wall jump" action script for wall-based jumping when not on ground
  - Implement locked action behavior where actions continue until condition expires
  - Write unit tests for movement action execution and physics integration
  - _Requirements: 6.2, 6.3, 5.1, 6.9, 6.10_

- [x] 11.4 Implement complete character behavior integration

  - Create behavior list combining conditions and actions: Energy below 10% → Charge, Leaning on wall → Turn around, Random 1/20 → Jump, Random 1/20 → Shoot, Always → Run
  - Test behavior priority and execution order (top to bottom until condition passes)
  - Integrate behavior processing into the main game loop
  - Write integration tests for complete character AI behavior within game loop
  - _Requirements: 5.2, 5.3, 6.1, 6.2_

- [x] 12. Create public API functions
- [x] 12.1 Implement new_game, game_loop, and game_state functions

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

- [x] 15. Enhance script system with ARGS and spawn ID support
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

- [x] 16. Create complex Action scripts for combat and energy management
- [x] 16.1 Implement Shoot Action script with spawn management

  - Create "Shoot" action script that spawns projectiles using spawn ID and ammo tracking
  - Implement fire rate limiting and ammo consumption logic
  - Use args array for configurable ammo capacity and spawns array for projectile management
  - Write unit tests for shooting mechanics and spawn creation
  - _Requirements: 6.2, 6.5, 6.8, 8.1_

- [x] 16.2 Implement Hurt Action as locked action script

  - Create "Hurt" locked action script with short jump and backward movement
  - Implement invulnerability frames and movement restriction during hurt state
  - Write unit tests for hurt state behavior and locked action mechanics
  - _Requirements: 6.2, 6.9, 6.10_

- [x] 16.3 Implement Charge Action for energy recovery

  - Create "Charge" locked action script that stops movement and recovers energy
  - Implement energy recovery rate based on character properties
  - Write unit tests for energy charging mechanics and movement restriction
  - _Requirements: 6.2, 6.9, 6.10, 5.1_

- [-] 17. Update Character properties for energy regeneration and simplified armor
- [x] 17.1 Replace ElementalImmunity with simplified armor array and add energy regeneration properties

  - Replace `elemental_immunity: ElementalImmunity` with `armor: [u8; 8]` in Character struct
  - Add `energy_regen: u8` property for passive energy recovery amount per rate
  - Add `energy_regen_rate: u8` property for tick interval for passive energy recovery
  - Add `energy_charge: u8` property for active energy recovery amount per rate during Charge action
  - Add `energy_charge_rate: u8` property for tick interval for active energy recovery during Charge action
  - Initialize new properties to 0 in Character::new() (values will be set during new_game/game initialization)
  - Update Character::get_armor() and Character::set_armor() methods to work with the new armor array
  - Write unit tests for new energy regeneration properties and simplified armor access
  - _Requirements: 11.2, 12.1, 12.2, 12.3, 12.4_

- [x] 17.2 Update script property access for new Character properties

  - Add property addresses 0x25-0x28 for energy regeneration properties in script interpreters
  - Ensure property addresses 0x40-0x47 work correctly for armor array access
  - Update all script interpreters (Condition, Action, Spawn, StatusEffect) to support new properties
  - Write unit tests for script property access to new Character properties
  - _Requirements: 12.5, 11.6_

- [x] 17.3 Create passive energy regeneration StatusEffect (depends on Task 8.1 completion)

  - Create "PassiveEnergyRegen" StatusEffect that reads character's energy_regen and energy_regen_rate properties
  - Implement tick_script that increments energy every energy_regen_rate ticks by energy_regen amount
  - Apply this StatusEffect to all characters during game initialization or as a permanent effect
  - Write unit tests for passive energy regeneration through StatusEffect system
  - _Requirements: 12.6, 7.1, 7.2_

- [x] 17.4 Update Charge Action to use energy_charge properties (depends on Task 16.3)

  - Modify existing Charge Action script to read energy_charge and energy_charge_rate from character properties
  - Implement energy recovery logic that uses these values instead of hardcoded rates
  - Ensure Charge Action overrides passive regeneration while active
  - Write unit tests for active energy charging mechanics
  - _Requirements: 12.7, 6.2, 6.9, 6.10_

- [ ] 18. Implement Action cooldown system for behavior timing control
- [ ] 18.1 Add cooldown fields to Action and Character structures

  - Add `cooldown: u16` field to Action struct for cooldown duration in frames (read-only, set only during new_game)
  - Add `action_last_used: Vec<u16>` field to Character struct to track when each action was last executed (stores game frame timestamp)
  - Initialize action_last_used vector with appropriate size based on number of actions in game
  - Update Character::new() to initialize action_last_used as empty vector (will be sized during game initialization)
  - Write unit tests for new cooldown field initialization and management
  - _Requirements: 5.1, 6.1_

- [ ] 18.2 Implement cooldown script operators for reading and writing cooldown state

  - Add `ReadActionCooldown` operator (0x92) to read Action cooldown value into vars array
  - Add `ReadActionLastUsed` operator (0x93) to read when action was last used from character state
  - Add `WriteActionLastUsed` operator (0x94) to update when action was last used (typically set to current game frame)
  - Add `IsActionOnCooldown` operator (0x95) to check if action is currently on cooldown (compares current frame vs last used + cooldown)
  - Update script engine to handle new cooldown operators
  - Write unit tests for cooldown operator functionality
  - _Requirements: 6.1, 6.3_

- [ ] 18.3 Update behavior evaluation to skip actions on cooldown

  - Modify execute_character_behaviors function to check action cooldown before evaluating conditions
  - Skip behavior evaluation if action is currently on cooldown (current_frame < last_used + cooldown)
  - Ensure cooldown check happens before energy requirement check for optimal performance
  - Update action execution to automatically set last_used timestamp when action succeeds
  - Write unit tests for cooldown-based behavior skipping and timing accuracy
  - _Requirements: 5.2, 5.4, 6.1_

- [ ] 18.4 Update script property access for cooldown management

  - Add property address 0x48 for reading Action cooldown value in script contexts
  - Add property address 0x49 for reading current action's last used timestamp
  - Add property address 0x4A for writing current action's last used timestamp
  - Update all script interpreters to support cooldown property access
  - Write unit tests for script-based cooldown property access and manipulation
  - _Requirements: 6.1, 6.2_

- [ ] 18.5 Create cooldown-aware Action scripts and integration tests

  - Update existing Action scripts to use cooldown operators where appropriate
  - Create test Action scripts that demonstrate cooldown functionality (e.g., rapid-fire vs slow attacks)
  - Implement integration tests that verify cooldown timing across multiple frames
  - Test cooldown behavior with locked actions and status effects
  - Write unit tests for complete cooldown system integration with game loop
  - _Requirements: 6.2, 6.4, 1.1_

- [ ] 18.6 Remove automatic cooldown setting from behavior execution

  - Remove automatic `action_last_used[action_id] = game_state.frame` assignment from `execute_character_behaviors` function in behavior.rs
  - Ensure cooldown setting becomes manual and script-controlled only through `WriteActionLastUsed` operator
  - Update existing Action scripts to explicitly set their cooldown using `WriteActionLastUsed` when appropriate
  - Modify Shoot Action example to demonstrate conditional cooldown setting (e.g., only set cooldown after successful reload)
  - Write unit tests to verify that actions without explicit cooldown setting do not automatically update last_used timestamp
  - _Requirements: 6.1, 6.2, 5.2_

- [ ] 19. Implement facing direction and gravity direction properties for entities
- [ ] 19.1 Add facing direction property to EntityCore with automatic Fixed conversion

  - Add `facing: u8` field to EntityCore struct (0 for left, 1 for right)
  - Implement property access methods that automatically convert to Fixed values when reading (0 → -1.0, 1 → 1.0)
  - Implement property write methods that automatically convert from Fixed values when writing (-1.0 → 0, 1.0 → 1)
  - Update EntityCore::new() to initialize facing to 1 (right) by default
  - Write unit tests for facing direction property access and conversion logic
  - _Requirements: 5.1_

- [ ] 19.2 Add gravity direction property to EntityCore with automatic Fixed conversion

  - Add `gravity_dir: u8` field to EntityCore struct (0 for upward, 1 for downward)
  - Implement property access methods that automatically convert to Fixed values when reading (0 → -1.0, 1 → 1.0)
  - Implement property write methods that automatically convert from Fixed values when writing (-1.0 → 0, 1.0 → 1)
  - Update EntityCore::new() to initialize gravity_dir to 1 (downward) by default
  - Write unit tests for gravity direction property access and conversion logic
  - _Requirements: 5.1_

- [ ] 19.3 Update script property access for facing and gravity direction

  - Add property address 0x4B for reading/writing facing direction (automatically converts u8 ↔ Fixed)
  - Add property address 0x4C for reading/writing gravity direction (automatically converts u8 ↔ Fixed)
  - Update all script interpreters (Condition, Action, Spawn, StatusEffect) to support new direction properties
  - Ensure property access handles the automatic conversion between u8 storage and Fixed script values
  - Write unit tests for script-based direction property access and conversion
  - _Requirements: 6.1, 6.2_

- [ ] 19.4 Update entity serialization and initialization for direction properties

  - Update GameState serialization to include facing and gravity direction fields
  - Ensure new_game function can initialize entities with custom facing and gravity directions
  - Update JSON serialization to include direction properties for debugging
  - Write unit tests for direction property serialization and deserialization
  - _Requirements: 9.1, 9.2, 1.3_

- [ ] 20. Create integration tests and performance benchmarks
- [ ] 20.1 Build end-to-end game scenarios and performance tests
  - Create multi-frame game scenarios with complex character behaviors
  - Implement cross-platform determinism verification tests
  - Build performance benchmarks for frame processing and serialization
  - Write property-based tests for arithmetic and serialization consistency
  - _Requirements: 1.1, 2.4, 3.4, 9.2_
