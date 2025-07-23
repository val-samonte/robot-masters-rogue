# Robot Masters Game Engine

A deterministic, no_std Rust game engine designed for cross-platform compatibility, specifically targeting Solana blockchain and WebAssembly environments. This engine powers a Mega Man-inspired arena fighting game where characters are controlled by programmable AI behaviors rather than direct player input.

## Overview

The Robot Masters Game Engine is a pure computation library that operates entirely without the standard library (`no_std`) with only `alloc` dependency. The engine follows a data-driven design where all game behavior is defined through bytecode scripts executed by a custom virtual machine, ensuring deterministic execution across different platforms.

### Key Features

- **Deterministic Execution**: Identical game outcomes across all platforms using seeded randomization and fixed-point arithmetic
- **Cross-Platform**: Runs on Solana blockchain, WebAssembly, and native environments without platform-specific code
- **Scriptable AI**: Characters controlled by programmable behaviors using a custom bytecode virtual machine
- **Fixed-Point Math**: 5-bit precision arithmetic for optimal storage and performance without floating-point operations
- **Frame-Perfect Timing**: Exactly 60 FPS for 64 seconds (3840 frames total) per match
- **Efficient Serialization**: Compact binary format optimized for blockchain storage

## Architecture

### Game Loop

The engine operates on a tick-based system where each frame advances the game state through a structured pipeline:

1. **Status Effect Processing** - Execute tick scripts for all active status effects
2. **Character Behavior Execution** - Evaluate conditions and execute actions with cooldown checks
3. **Physics Updates** - Update positions, velocities, and handle collisions
4. **Entity Cleanup** - Remove expired spawns and validate game state

### Core Components

- **Entity System** - Characters, spawns, and status effects with shared EntityCore
- **Script Engine** - Bytecode interpreter with 90+ operators for game logic
- **Math Module** - 5-bit fixed-point arithmetic with trigonometry lookup tables
- **Physics System** - Collision detection with 16x15 tilemap (256x240 pixels)
- **Random System** - Deterministic Linear Congruential Generator
- **Error Recovery** - Graceful degradation system for robust execution

## Game Mechanics

### Characters

Programmable fighting entities with:

- Health, energy, and 8-element armor system
- Configurable energy regeneration (passive and active)
- Behavior-driven AI with condition/action pairs
- Action cooldown system for strategic timing
- Status effect support for temporary modifications

### Elements & Combat

8 elemental damage types with strategic interactions:

- **Punct** (0) - Piercing damage that penetrates multiple targets
- **Blast** (1) - Explosive area-of-effect damage
- **Force** (2) - Blunt impact damage with weight bonuses
- **Sever** (3) - Critical chance for amplified damage
- **Heat** (4) - Burning damage over time effects
- **Cryo** (5) - Slowing effects and frostbite damage
- **Jolt** (6) - Energy manipulation and electrical effects
- **Virus** (7) - Behavior alteration and system disruption

### Scripting System

The bytecode virtual machine supports:

- **90+ Operators** - Control flow, arithmetic, conditionals, game actions
- **Context-Specific Execution** - Different interpreters for characters, spawns, status effects
- **Property-Based Access** - Scalable game state interaction patterns
- **Args/Vars Separation** - Read-only parameters and working variables
- **Spawn Management** - Projectile and temporary object creation

## API

The engine exposes three primary functions:

```rust
// Initialize a new game instance
pub fn new_game(
    seed: u16,
    tilemap: [[u8; 16]; 15],
    characters: Vec<Character>,
    spawn_definitions: Vec<SpawnDefinition>,
) -> GameResult<GameState>

// Advance game state by exactly one frame
pub fn game_loop(state: &mut GameState) -> GameResult<()>

// Get current state in JSON and binary formats
pub fn game_state(state: &GameState) -> GameResult<(String, Vec<u8>)>
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

# Run tests
cargo test

# Build for WebAssembly
cargo build --target wasm32-unknown-unknown

# Build with release optimizations
cargo build --release
```

## Testing

The engine includes comprehensive test coverage with 275+ tests:

```bash
# Run all tests
cargo test

# Run specific test modules
cargo test cooldown
cargo test integration
cargo test error
```

## Platform Integration

This engine is designed to be consumed by platform-specific wrapper projects:

- **Solana Program** - Blockchain-based game execution
- **WebAssembly Module** - Browser-based game client
- **Native Application** - Desktop game runner

The engine maintains identical behavior across all platforms through deterministic algorithms and careful abstraction of platform-specific concerns.

## Error Handling

The engine includes a comprehensive error recovery system:

- **GameError Enum** - Structured error types for all failure modes
- **ErrorRecovery System** - Graceful degradation strategies
- **Validation** - State integrity checks and recovery options
- **Safe Fallbacks** - Arithmetic overflow and division-by-zero handling

## License

This project is part of the Robot Masters game development suite.
