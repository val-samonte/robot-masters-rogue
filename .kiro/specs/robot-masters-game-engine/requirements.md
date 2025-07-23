# Requirements Document

## Introduction

The Robot Masters Game Engine is a specialized no_std Rust library designed to power a Mega Man-inspired arena fighting game that runs both on Solana blockchain and as WebAssembly in browsers. The game operates on a single screen with a 256x240 pixel tilemap (16x16 per tile) and runs at exactly 60 FPS for 64 seconds per match (3840 frames total). The engine is deterministic and scriptable, with no direct player inputs - instead, characters are controlled by programmable behaviors defined through bytecode scripts executed by a custom virtual machine. The engine must handle game logic, state management, physics, collision detection, and mathematical operations without using floating-point arithmetic to comply with Solana's execution environment restrictions.

## Requirements

### Requirement 1

**User Story:** As a game developer, I want a frame-based game loop that runs at exactly 60 FPS for 64 seconds, so that matches have consistent timing and can be executed deterministically.

#### Acceptance Criteria

1. WHEN the game loop is called THEN it SHALL advance the game state by exactly one frame
2. WHEN 3840 frames have elapsed THEN the game SHALL end (60 FPS × 64 seconds)
3. WHEN the game loop is exposed THEN it SHALL be callable from both WASM and Solana environments
4. WHEN game state is requested THEN the engine SHALL provide both JSON and serialized byte representations

### Requirement 2

**User Story:** As a blockchain developer, I want fixed-point arithmetic with 5-bit precision, so that mathematical calculations are performant, deterministic, and storage-efficient for Solana.

#### Acceptance Criteria

1. WHEN performing mathematical operations THEN the engine SHALL use fixed-point arithmetic with exactly 5 bits of fractional precision (i16 with 5 fractional bits)
2. WHEN calculating trigonometric functions THEN the engine SHALL use precomputed lookup tables for sin, cos, and atan2 with 1-degree precision
3. WHEN serializing fixed-point numbers THEN they SHALL use 2 bytes (i16) for storage efficiency
4. WHEN overflow conditions occur THEN the engine SHALL handle them gracefully using saturating arithmetic and clamping to valid ranges
5. WHEN division by zero occurs THEN the engine SHALL return Fixed::MAX for positive dividends and Fixed::MIN for negative dividends

### Requirement 3

**User Story:** As a game developer, I want deterministic seeded randomization, so that game outcomes are reproducible and verifiable.

#### Acceptance Criteria

1. WHEN initializing the game THEN it SHALL accept a u16 seed parameter for the Linear Congruential Generator (LCG)
2. WHEN random values are needed THEN the engine SHALL use a deterministic LCG with constants (multiplier: 25173, increment: 13849) for full 65536 period
3. WHEN the game state is serialized THEN the current RNG state SHALL be preserved and restored
4. WHEN the same seed is used THEN identical game sequences SHALL be produced across all platforms
5. WHEN random functions are called THEN they SHALL provide u16, u8, range, and boolean generation methods
6. WHEN the RNG is reset THEN it SHALL return to the initial seed state

### Requirement 4

**User Story:** As a level designer, I want a tilemap system for the game arena, so that I can define the game environment layout.

#### Acceptance Criteria

1. WHEN initializing the game THEN it SHALL accept a 16x15 byte array representing the tilemap (240 bytes total)
2. WHEN processing tiles THEN the engine SHALL support Empty (0) and Block (1) tile types with out-of-bounds treated as Block
3. WHEN entities interact with tiles THEN the engine SHALL provide collision detection using CollisionRect structures
4. WHEN the tilemap is accessed THEN it SHALL use 256x240 pixel resolution with 16x16 pixel tiles (16 columns × 15 rows)
5. WHEN collision detection occurs THEN it SHALL check all tiles that an entity's bounding box overlaps
6. WHEN tiles are accessed THEN the engine SHALL provide both tile coordinate and pixel coordinate access methods

### Requirement 5

**User Story:** As a game designer, I want programmable Character entities with behavior-driven AI, so that players can create strategic automated fighters.

#### Acceptance Criteria

1. WHEN creating a Character THEN it SHALL have EntityCore (id, group, pos, vel, size, collision, facing, gravity_dir), health, energy, armor[8], energy regeneration properties, behaviors list, locked_action state, status_effects list, and action_last_used timestamps
2. WHEN processing Character behavior THEN it SHALL execute behaviors from top to bottom until one condition passes and action executes successfully
3. WHEN a behavior condition passes THEN it SHALL execute the associated action and restart from behavior index 0 for next frame
4. WHEN actions require energy THEN behaviors SHALL be skipped if insufficient energy is available or if action is on cooldown
5. WHEN actions are locked THEN normal behavior processing SHALL be bypassed until the locked action completes
6. WHEN characters are initialized THEN they SHALL have default armor values of 100 for all 8 elements and proper action cooldown tracking

### Requirement 6

**User Story:** As a game developer, I want a bytecode scripting system for Conditions and Actions, so that character behaviors can be programmed flexibly.

#### Acceptance Criteria

1. WHEN evaluating Conditions THEN the engine SHALL execute bytecode scripts using ScriptEngine with vars[8] and fixed[4] arrays to determine if actions are eligible
2. WHEN executing Actions THEN the engine SHALL run bytecode scripts for movement, jumping, shooting, spawning, and other behaviors with full game state access
3. WHEN processing scripts THEN the engine SHALL support 90+ operators including control flow, property access, arithmetic (fixed-point and byte), conditionals, logical operations, utility functions, and game actions
4. WHEN script execution fails THEN the engine SHALL handle errors gracefully using ErrorRecovery system without crashing the game
5. WHEN scripts are executed THEN they SHALL have access to read-only args[8] array for configuration parameters passed during entity definition
6. WHEN scripts need working variables THEN they SHALL use vars[8] array for byte values and fixed[4] array for fixed-point calculations
7. WHEN scripts access properties THEN they SHALL use ReadProp/WriteProp operators with property addresses for game state, character, spawn, and status effect data
8. WHEN scripts need spawn management THEN they SHALL use spawns[4] array for spawn ID storage and Spawn/SpawnWithVars operators
9. WHEN Actions are locked THEN they SHALL use LockAction/UnlockAction operators and bypass normal behavior processing
10. WHEN script operators are executed THEN they SHALL use OperatorAddress enum constants for consistent byte values across the system

### Requirement 7

**User Story:** As a game designer, I want Status effects that can modify character behavior, so that temporary effects like energy recharging and invulnerability can be implemented.

#### Acceptance Criteria

1. WHEN applying Status effects THEN they SHALL have StatusEffect definitions with duration, stack_limit, reset_on_stack flag, and bytecode scripts for on_script, tick_script, and off_script
2. WHEN Status effects are active THEN they SHALL execute tick_script every frame during status effect processing phase before character behaviors
3. WHEN Status effects expire THEN they SHALL be automatically removed when remaining_duration reaches 0 and run their off_script
4. WHEN Status effects stack THEN they SHALL respect stack_limit, increment stack_count, and optionally reset duration based on reset_on_stack flag
5. WHEN Status effects are applied THEN they SHALL create StatusEffectInstance with effect_id, remaining_duration, stack_count, and vars[4] for script variables
6. WHEN passive energy regeneration occurs THEN it SHALL be implemented as StatusEffect ID 0 applied to all characters during game initialization

### Requirement 8

**User Story:** As a game developer, I want Spawn entities for projectiles and other temporary objects, so that complex interactions and attacks can be implemented.

#### Acceptance Criteria

1. WHEN creating Spawns THEN they SHALL have SpawnDefinition with damage_base, health_cap, duration, element type, vars[8], fixed[4], args[8], spawns[4], and three bytecode scripts (behavior_script, collision_script, despawn_script)
2. WHEN Spawns are active THEN they SHALL execute behavior_script every frame for movement and interaction logic using SpawnBehaviorContext
3. WHEN Spawns collide with characters THEN they SHALL execute collision_script for damage calculation and status effect application
4. WHEN Spawns despawn THEN they SHALL execute despawn_script for effects like explosions and secondary spawn creation
5. WHEN Spawns are created THEN they SHALL carry exactly one Element type (or None) and have SpawnInstance with core EntityCore, spawn_id, owner_id, lifespan, element, and vars[4]
6. WHEN Spawns are instantiated THEN they SHALL be created from SpawnDefinition templates with optional variable initialization and automatic lifespan management

### Requirement 9

**User Story:** As a game designer, I want an elemental system with damage types and armor values, so that characters can have strategic strengths and weaknesses against different attack types.

#### Acceptance Criteria

1. WHEN defining elements THEN the system SHALL support 8 element types with explicit u8 values: Punct(0), Blast(1), Force(2), Sever(3), Heat(4), Cryo(5), Jolt(6), and Virus(7)
2. WHEN characters are created THEN they SHALL have armor values (0-255, baseline 100) stored as [u8; 8] array with indices corresponding to Element enum values
3. WHEN spawns are created THEN they SHALL carry exactly one Element type (or None) stored in the element field of SpawnInstance
4. WHEN collision occurs THEN the spawn's element value SHALL be compared against the character's corresponding armor value using get_armor() and set_armor() methods
5. WHEN characters are initialized THEN their armor values SHALL default to [100; 8] and be modifiable through property addresses 0x40-0x47
6. WHEN scripts need armor access THEN property addresses 0x40-0x47 SHALL provide read/write access to character armor values for all 8 elements
7. WHEN Element conversion is needed THEN from_u8() method SHALL safely convert u8 values to Element enum with bounds checking

### Requirement 10

**User Story:** As a game designer, I want configurable energy regeneration systems for characters, so that different characters can have unique energy recovery patterns both passively and actively.

#### Acceptance Criteria

1. WHEN characters are created THEN they SHALL have energy_regen property (u8) defining passive energy recovery amount per rate interval
2. WHEN characters are created THEN they SHALL have energy_regen_rate property (u8) defining tick interval for passive energy recovery timing
3. WHEN characters are created THEN they SHALL have energy_charge property (u8) defining active energy recovery amount per rate during Charge action
4. WHEN characters are created THEN they SHALL have energy_charge_rate property (u8) defining tick interval for active energy recovery during Charge action
5. WHEN scripts need energy regen access THEN property addresses 0x25-0x28 SHALL provide read/write access to energy_regen, energy_regen_rate, energy_charge, and energy_charge_rate
6. WHEN passive energy regeneration occurs THEN it SHALL be implemented through StatusEffect ID 0 (create_passive_energy_regen_status_effect) applied to all characters during game initialization
7. WHEN Charge action is active THEN energy recovery SHALL use energy_charge and energy_charge_rate values through Action script implementation with property access

### Requirement 11

**User Story:** As a game designer, I want Action cooldown systems for behavior timing control, so that actions cannot be executed too frequently and strategic timing becomes important.

#### Acceptance Criteria

1. WHEN Actions are defined THEN they SHALL have a cooldown property (u16) specifying cooldown duration in frames (read-only after initialization)
2. WHEN Characters are created THEN they SHALL track when each action was last executed using action_last_used Vec<u16> with frame timestamps
3. WHEN behavior evaluation occurs THEN actions SHALL be skipped if current_frame < (last_used + cooldown)
4. WHEN actions are successfully executed THEN their last used timestamp SHALL be updated to the current game frame
5. WHEN scripts need cooldown access THEN operators ReadActionCooldown(92), ReadActionLastUsed(93), WriteActionLastUsed(94), and IsActionOnCooldown(95) SHALL provide access to cooldown state
6. WHEN cooldown calculations occur THEN they SHALL use deterministic frame-based timing with u16::MAX representing "never used"
7. WHEN actions have zero cooldown THEN they SHALL be executable every frame (backwards compatibility)
8. WHEN characters are initialized THEN action_last_used SHALL be sized using init_action_cooldowns() method

### Requirement 12

**User Story:** As a blockchain developer, I want efficient serialization of the complete game state, so that it can be stored in Solana PDAs with minimal cost.

#### Acceptance Criteria

1. WHEN serializing game state THEN it SHALL produce compact binary representations using to_binary() with header (seed, frame, status), tilemap (240 bytes), character data, spawn data, and lookup table sizes
2. WHEN deserializing game state THEN it SHALL validate data integrity using from_binary() and restore exact game state with proper error handling for DataTooShort, InvalidBinaryData, and InvalidCharacterData
3. WHEN storing on Solana THEN the serialized state SHALL use minimal bytes with Fixed-point as i16 (2 bytes), positions as Fixed pairs, and efficient entity packing
4. WHEN serialization fails THEN the engine SHALL provide clear GameError types with recovery strategies through ErrorRecovery system
5. WHEN JSON serialization is needed THEN to_json() SHALL provide human-readable format with all game state including characters, spawns, tilemap, and status
6. WHEN binary format is used THEN it SHALL include proper versioning and validation for cross-platform compatibility

### Requirement 13

**User Story:** As a platform integrator, I want a pure game engine library with no platform-specific dependencies, so that it can be consumed by separate WASM and Solana projects without conflicts.

#### Acceptance Criteria

1. WHEN compiling the game engine THEN it SHALL be no_std compatible with only alloc dependency and no WASM-specific dependencies or bindings
2. WHEN used as a library THEN it SHALL expose exactly three pure Rust functions: new_game(), game_loop(), and game_state() that can be called by other projects
3. WHEN integrated into different platforms THEN the engine SHALL maintain identical behavior across all environments using deterministic algorithms
4. WHEN platform-specific bindings are needed THEN they SHALL be implemented in separate wrapper projects that consume this engine through the public API
5. WHEN error handling is needed THEN the engine SHALL use GameError enum with ErrorRecovery system for graceful degradation without platform dependencies
6. WHEN testing is performed THEN the engine SHALL include comprehensive test utilities in test_utils module for consistent testing across platforms
