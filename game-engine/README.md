# Robot Masters Game Engine

A deterministic, no_std Rust game engine designed for cross-platform compatibility, specifically targeting Solana blockchain and WebAssembly environments. This engine powers a Mega Man-inspired arena fighting game where characters are controlled by programmable AI behaviors rather than direct player input.

**✅ MAJOR UPDATE**: The engine now uses a **definition-based architecture** where Actions, Conditions, Spawns, and StatusEffects are defined once and referenced by ID, providing significant memory efficiency improvements and better code organization.

## Overview

The Robot Masters Game Engine is a pure computation library that operates entirely without the standard library (`no_std`) with only `alloc` dependency. The engine follows a data-driven design where all game behavior is defined through bytecode scripts executed by a custom virtual machine, ensuring deterministic execution across different platforms.

### Key Features

- **Definition-Based Architecture**: Actions, Conditions, Spawns, and StatusEffects defined once and referenced by ID for memory efficiency
- **Deterministic Execution**: Identical game outcomes across all platforms using seeded randomization and fixed-point arithmetic
- **Cross-Platform**: Runs on Solana blockchain, WebAssembly, and native environments without platform-specific code
- **Scriptable AI**: Characters controlled by programmable behaviors using a custom bytecode virtual machine
- **Fixed-Point Math**: 5-bit precision arithmetic for optimal storage and performance without floating-point operations
- **Frame-Perfect Timing**: Exactly 60 FPS for 64 seconds (3840 frames total) per match
- **External Serialization**: Public API provides complete game state access for external persistence handling

## Architecture

### Game Loop

The engine operates on a tick-based system where each frame advances the game state through a structured pipeline:

1. **Status Effect Processing** - Execute tick scripts for all active status effects
2. **Character Behavior Execution** - Evaluate conditions and execute actions with cooldown checks
3. **Physics Updates** - Update positions, velocities, and handle collisions
4. **Entity Cleanup** - Remove expired spawns and validate game state

### Core Components

- **Definition System** - Shared templates for Actions, Conditions, Spawns, and StatusEffects with ID-based references
- **Instance Management** - Runtime state tracking separate from static definitions
- **Entity System** - Characters, spawns, and status effects with shared EntityCore
- **Script Engine** - Bytecode interpreter with 90+ operators for game logic
- **Math Module** - 5-bit fixed-point arithmetic with trigonometry lookup tables
- **Physics System** - Collision detection with 16x15 tilemap (256x240 pixels)
- **Random System** - Deterministic Linear Congruential Generator
- **Error Recovery** - Graceful degradation system for robust execution

## Game Mechanics

### Characters

Programmable fighting entities with:

- Health, energy, and 9-element armor system (including new Acid element)
- Configurable energy regeneration (passive and active)
- **ID-based behaviors** - Store (ConditionId, ActionId) pairs instead of embedded objects
- Action cooldown system for strategic timing
- **StatusEffectInstanceId references** for memory-efficient status effect management

### Elements & Combat

9 elemental damage types with strategic interactions:

- **Punct** (0) - Piercing damage that penetrates multiple targets
- **Blast** (1) - Explosive area-of-effect damage
- **Force** (2) - Blunt impact damage with weight bonuses
- **Sever** (3) - Critical chance for amplified damage
- **Heat** (4) - Burning damage over time effects
- **Cryo** (5) - Slowing effects and frostbite damage
- **Jolt** (6) - Energy manipulation and electrical effects
- **Acid** (7) - Disables regenerative and supportive buffs
- **Virus** (8) - Behavior alteration and system disruption

### Scripting System

The bytecode virtual machine supports:

- **90+ Operators** - Control flow, arithmetic, conditionals, game actions
- **Context-Specific Execution** - Different interpreters for characters, spawns, status effects
- **Property-Based Access** - Scalable game state interaction patterns
- **Args/Vars Separation** - Read-only parameters and working variables
- **Spawn Management** - Projectile and temporary object creation

## API

The engine exposes a definition-based API with comprehensive validation:

```rust
// Initialize a new game instance with all definition collections
pub fn new_game(
    seed: u16,
    tilemap: [[u8; 16]; 15],
    characters: Vec<Character>,
    action_definitions: Vec<ActionDefinition>,
    condition_definitions: Vec<ConditionDefinition>,
    spawn_definitions: Vec<SpawnDefinition>,
    status_effect_definitions: Vec<StatusEffectDefinition>,
) -> GameResult<GameState>

// Advance game state by exactly one frame
pub fn game_loop(state: &mut GameState) -> GameResult<()>

// Get complete game state for external serialization
pub fn get_game_state(state: &GameState) -> &GameState

// Get RNG seed for external serialization
pub fn get_rng_seed(state: &GameState) -> u16
```

### Definition-Based Benefits

- **Memory Efficiency**: Definitions stored once, referenced by ID
- **Validation**: Comprehensive ID reference validation and circular dependency detection
- **Separation of Concerns**: Static definitions vs runtime instances
- **Reusability**: Multiple characters can share the same behavior definitions

### Creating Definition Collections

```rust
use robot_masters_engine::*;

// Create action definitions
let action_definitions = vec![
    ActionDefinition::new(10, 60, 30, 120, vec![/* bytecode */]),
    ActionDefinition::new(15, 30, 60, 180, vec![/* bytecode */]),
];

// Create condition definitions
let condition_definitions = vec![
    ConditionDefinition::new(Fixed::from_int(1), vec![/* bytecode */]),
    ConditionDefinition::new(Fixed::from_int(2), vec![/* bytecode */]),
];

// Create characters with ID-based behaviors
let mut character = Character::new(0, 0);
character.behaviors = vec![
    (0, 0), // ConditionId 0 -> ActionId 0
    (1, 1), // ConditionId 1 -> ActionId 1
];

// Initialize game with all definitions
let game_state = new_game(
    12345,
    tilemap,
    vec![character],
    action_definitions,
    condition_definitions,
    spawn_definitions,
    status_effect_definitions,
)?;
```

## Technical Specifications

- **Resolution**: 256x240 pixels (16x15 tiles at 16x16 pixels each)
- **Frame Rate**: Exactly 60 FPS
- **Match Duration**: 64 seconds (3840 frames)
- **Arithmetic**: 5-bit fixed-point (i16 with 5 fractional bits)
- **Random Number Generator**: Linear Congruential Generator with full 65536 period
- **Memory Model**: no_std with alloc for dynamic collections

## Building

```bash
# Build the library
cargo build

# Build for WebAssembly
cargo build --target wasm32-unknown-unknown

# Build with release optimizations
cargo build --release
```

## Development Philosophy

Following the project's development principles:

- **No Tests During Development**: Focus on core functionality first, tests added later
- **No Backward Compatibility**: Breaking changes allowed during active development
- **Definition-First Design**: All game components use shared definition templates

## Platform Integration

This engine is designed to be consumed by platform-specific wrapper projects:

- **Solana Program** - Blockchain-based game execution
- **WebAssembly Module** - Browser-based game client
- **Native Application** - Desktop game runner

The engine maintains identical behavior across all platforms through deterministic algorithms and careful abstraction of platform-specific concerns. External wrappers handle serialization using the `get_game_state()` and `get_rng_seed()` functions for complete state persistence.

## Error Handling

The engine includes a comprehensive error recovery system:

- **GameError Enum** - Structured error types for all failure modes
- **ErrorRecovery System** - Graceful degradation strategies
- **Validation** - State integrity checks and recovery options
- **Safe Fallbacks** - Arithmetic overflow and division-by-zero handling

## License

This project is part of the Robot Masters game development suite.
