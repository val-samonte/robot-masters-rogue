# Design Document

## Overview

The Robot Masters Game Engine is architected as a pure, deterministic computation library that operates entirely in no_std Rust. The engine follows a data-driven design where game behavior is defined through bytecode scripts rather than hardcoded logic. The core architecture separates concerns into distinct modules: fixed-point mathematics, entity management, scripting engine, and serialization.

The engine operates on a tick-based system where each frame advances the game state deterministically. All randomness is seeded, all arithmetic uses fixed-point numbers, and all behavior is script-driven to ensure identical execution across different platforms.

The design incorporates lessons learned from the existing codebase, particularly around efficient bytecode operator mapping and property access patterns to ensure scalable script execution.

## Architecture

### Core Engine Structure

```
Game Engine (no_std)
├── Math Module (Fixed-point arithmetic, trigonometry tables)
├── Entity System (Characters, Spawns, Status Effects)
├── Script Engine (Bytecode interpreter)
├── Physics System (Collision detection, movement)
├── Game State (Serializable game world state)
└── Public API (new_game, game_loop, game_state functions)
```

### Data Flow

1. **Initialization**: Game receives seed, tilemap, entity definitions, and scripts
2. **Frame Processing**: Each game_loop() call processes one frame (1/60th second)
3. **Script Execution**: Bytecode scripts determine entity behaviors
4. **Physics Update**: Positions, velocities, and collisions are resolved
5. **State Management**: Game state is updated and can be serialized

### Platform Integration

The engine exposes three primary functions:

- `new_game()`: Initializes a new game instance with seed, tilemap, and entity definitions
- `game_loop()`: Advances game state by one frame
- `game_state()`: Returns current state as JSON or serialized bytes

Platform-specific projects (WASM bindings, Solana programs) consume these functions without the engine needing platform-specific code.

### Logging System

The engine includes a malleable logging system that adapts to different environments:

```rust
// Logging trait that can be implemented for different platforms
pub trait Logger {
    fn log(&self, message: &str);
    fn debug(&self, message: &str);
    fn error(&self, message: &str);
}

// Platform-specific implementations
#[cfg(target_arch = "wasm32")]
pub struct WasmLogger;

impl Logger for WasmLogger {
    fn log(&self, message: &str) {
        web_sys::console::log_1(&message.into());
    }
}

// For Solana (using msg! macro)
#[cfg(feature = "solana")]
pub struct SolanaLogger;

impl Logger for SolanaLogger {
    fn log(&self, message: &str) {
        msg!("{}", message);
    }
}
```

## Components and Interfaces

### Fixed-Point Mathematics

```rust
// 5-bit precision fixed-point number for optimal storage/performance balance
pub struct Fixed(i16);

impl Fixed {
    const FRACTIONAL_BITS: u32 = 5;
    const ONE: Fixed = Fixed(1 << 5); // 32

    // Core arithmetic operations
    pub fn add(self, other: Fixed) -> Fixed;
    pub fn mul(self, other: Fixed) -> Fixed;
    // ... other operations
}

// Precomputed trigonometry tables for performance
pub struct TrigTables {
    sin_table: [Fixed; 360],    // 1-degree precision
    cos_table: [Fixed; 360],
    atan2_table: [[u8; 256]; 256], // Returns angle in degrees
}
```

### Entity System

```rust
// Base entity properties shared by all game objects
pub struct EntityCore {
    pub id: u8,
    pub group: u8,
    pub pos: (Fixed, Fixed),
    pub vel: (Fixed, Fixed),
    pub size: (u8, u8),
    pub collision: (bool, bool, bool, bool), // top, right, bottom, left
}

// Programmable fighting characters
pub struct Character {
    pub core: EntityCore,
    pub health: u8,
    pub energy: u8,
    pub behaviors: Vec<(ConditionId, ActionId)>,
    pub locked_action: Option<ActionInstanceId>,
    pub status_effects: Vec<StatusEffectInstance>,
    // ... additional character-specific properties
}

// Projectiles and temporary objects
pub struct SpawnInstance {
    pub core: EntityCore,
    pub spawn_id: SpawnLookupId,
    pub owner_id: CharacterId,
    pub lifespan: u16,
    pub vars: [u8; 4], // Script variables
    // ... additional spawn properties
}
```

### Script Engine

```rust
// Bytecode interpreter for game logic
pub struct ScriptEngine {
    // Execution context
    variables: [ScriptValue; 16], // Local variables for script execution
    stack: [ScriptValue; 32],     // Execution stack
}

// Script value types
pub enum ScriptValue {
    Byte(u8),
    Fixed(Fixed),
    Bool(bool),
}

// Bytecode operators (subset shown)
pub enum Operator {
    // Control flow
    Exit,
    Skip,
    Goto,

    // Arithmetic
    Add, Sub, Mul, Div,

    // Game actions
    LockAction,
    Spawn,
    ApplyDamage,

    // Conditionals
    Equal, LessThan,
    // ... full operator set
}
```

### Game State Management

```rust
pub struct GameState {
    pub seed: u16,
    pub frame: u16,
    pub tile_map: [[u8; 16]; 15], // 16x15 tiles
    pub status: GameStatus,
    pub characters: Vec<Character>,
    pub spawn_instances: Vec<SpawnInstance>,
    // Lookup tables for scripts and definitions
    pub action_lookup: Vec<Action>,
    pub condition_lookup: Vec<Condition>,
    pub spawn_lookup: Vec<Spawn>,
    pub status_effect_lookup: Vec<StatusEffect>,
}
```

## Data Models

### Behavior System

Characters execute behaviors in priority order. Each behavior consists of:

1. **Condition**: Bytecode script that returns true/false
2. **Action**: Bytecode script that executes game actions

```rust
pub struct Condition {
    pub energy_mul: Fixed,    // Energy requirement multiplier
    pub args: [u8; 4],       // Script arguments
    pub script: Vec<u8>,     // Bytecode
}

pub struct Action {
    pub energy_cost: u8,
    pub duration: u16,       // Frames this action locks the character
    pub args: [u8; 4],
    pub script: Vec<u8>,
}
```

### Status Effects

Temporary effects that modify character behavior:

```rust
pub struct StatusEffect {
    pub duration: u16,
    pub stack_limit: u8,
    pub reset_on_stack: bool,
    pub on_script: Vec<u8>,   // Runs when applied
    pub tick_script: Vec<u8>, // Runs every frame
    pub off_script: Vec<u8>,  // Runs when removed
}
```

### Spawn Definitions

Templates for projectiles and temporary objects:

```rust
pub struct Spawn {
    pub damage_base: u8,
    pub health_cap: u8,
    pub duration: u16,
    pub element: Option<Element>,
    pub behavior_script: Vec<u8>,
    pub collision_script: Vec<u8>,
    pub despawn_script: Vec<u8>,
}
```

## Error Handling

The engine uses Result types for all fallible operations:

```rust
pub enum GameError {
    InvalidScript,
    SerializationError,
    InvalidGameState,
    ScriptExecutionError,
}

pub type GameResult<T> = Result<T, GameError>;
```

Error handling strategy:

- Script errors are contained and logged, but don't crash the game
- Serialization errors are propagated to the caller
- Invalid game states are rejected during initialization
- Runtime errors use graceful degradation where possible

## Testing Strategy

### Unit Testing

- Fixed-point arithmetic operations
- Individual script operators
- Entity collision detection
- Serialization/deserialization

### Integration Testing

- Complete game loop execution
- Multi-frame game scenarios
- Script execution with complex behaviors
- Cross-platform determinism verification

### Property-Based Testing

- Serialization round-trip consistency
- Deterministic execution with same seeds
- Fixed-point arithmetic properties
- Script execution bounds checking

### Performance Testing

- Frame processing time benchmarks
- Memory usage profiling
- Serialization size optimization
- Script execution performance

The testing approach ensures the engine maintains deterministic behavior across platforms while meeting performance requirements for both Solana's compute constraints and browser execution.
