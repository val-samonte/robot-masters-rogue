# Design Document

## Overview

The WASM wrapper will be a separate Rust project that depends on the game engine library and provides JavaScript bindings through wasm-bindgen. Unlike the core game engine which is no_std, this wrapper can use the full standard library and external crates to simplify development. The wrapper will handle JSON serialization, provide ergonomic JavaScript APIs, and manage the bridge between web technologies and the deterministic game engine.

## Architecture

### Project Structure

```
wasm-wrapper/
├── Cargo.toml              # Dependencies including serde, wasm-bindgen, etc.
├── src/
│   ├── lib.rs              # Main WASM exports and initialization
│   ├── game_state.rs       # Game state management and serialization
│   ├── bindings.rs         # JavaScript binding utilities
│   ├── error.rs            # Error handling and conversion
│   └── types.rs            # TypeScript-compatible type definitions
├── pkg/                    # Generated WASM output
├── www/                    # Development web interface
├── build.sh                # Build automation script
└── README.md
```

### Technology Stack

- **wasm-bindgen**: Primary WASM-JS binding framework
- **serde**: JSON serialization/deserialization
- **serde_json**: JSON handling utilities
- **js-sys**: JavaScript standard library bindings
- **web-sys**: Web API bindings
- **wasm-bindgen-futures**: Async support if needed
- **console_error_panic_hook**: Better error reporting
- **wee_alloc**: Optimized WASM allocator

## Components and Interfaces

### Core WASM Module (lib.rs)

```rust
use wasm_bindgen::prelude::*;
use robot_masters_engine::*;

#[wasm_bindgen]
pub struct GameWrapper {
    state: GameState,
    // Additional wrapper state
}

#[wasm_bindgen]
impl GameWrapper {
    #[wasm_bindgen(constructor)]
    pub fn new(config_json: &str) -> Result<GameWrapper, JsValue>;

    #[wasm_bindgen]
    pub fn step_frame(&mut self) -> Result<(), JsValue>;

    #[wasm_bindgen]
    pub fn get_state_json(&self) -> String;

    #[wasm_bindgen]
    pub fn get_characters_json(&self) -> String;

    #[wasm_bindgen]
    pub fn get_spawns_json(&self) -> String;
}
```

### Game State Management (game_state.rs)

- **State Serialization**: Convert game engine structs to JSON using serde
- **State Queries**: Provide filtered views of game state for different UI needs
- **State Validation**: Ensure game state integrity across WASM boundary
- **Performance Optimization**: Cache serialized data when possible

### JavaScript Bindings (bindings.rs)

- **Type Conversions**: Handle Rust ↔ JavaScript type conversions
- **Error Mapping**: Convert game engine errors to JavaScript exceptions
- **Memory Management**: Handle WASM memory allocation/deallocation
- **Async Support**: Provide Promise-based APIs where beneficial

### Error Handling (error.rs)

```rust
use wasm_bindgen::JsValue;
use serde::{Serialize, Deserialize};

#[derive(Serialize, Deserialize)]
pub struct GameError {
    pub error_type: String,
    pub message: String,
    pub context: Option<serde_json::Value>,
}

impl From<robot_masters_engine::GameError> for JsValue {
    fn from(err: robot_masters_engine::GameError) -> Self {
        // Convert engine errors to JavaScript-friendly format
    }
}
```

## Data Models

### Configuration Input

```typescript
interface GameConfig {
  seed: number
  tilemap: number[][]
  characters: CharacterDefinition[]
  actions: ActionDefinition[]
  conditions: ConditionDefinition[]
  spawns: SpawnDefinition[]
  statusEffects: StatusEffectDefinition[]
}

interface CharacterDefinition {
  id: number
  group: number
  position: [number, number]
  health: number
  energy: number
  armor: number[]
  behaviors: [number, number][] // [condition_id, action_id] pairs
}
```

### State Output

```typescript
interface GameState {
  frame: number
  seed: number
  characters: Character[]
  spawns: Spawn[]
  statusEffects: StatusEffectInstance[]
}

interface Character {
  id: number
  position: [number, number]
  velocity: [number, number]
  health: number
  energy: number
  armor: number[]
  activeStatusEffects: number[]
}
```

## Error Handling

### Error Categories

1. **Initialization Errors**: Invalid configuration, missing definitions
2. **Runtime Errors**: Script execution failures, state corruption
3. **Serialization Errors**: JSON parsing/generation failures
4. **Memory Errors**: WASM allocation failures

### Error Recovery Strategy

- **Graceful Degradation**: Continue game execution when possible
- **Detailed Logging**: Provide comprehensive error context
- **JavaScript Integration**: Convert all errors to JavaScript exceptions
- **Development Support**: Include stack traces and debugging information

## Testing Strategy

### Unit Testing

- Test individual wrapper components with mock game states
- Validate JSON serialization/deserialization accuracy
- Test error handling and conversion logic

### Integration Testing

- Test complete game initialization and execution cycles
- Validate JavaScript ↔ WASM data flow
- Test performance with realistic game scenarios

### Browser Testing

- Test in multiple browser environments
- Validate memory usage and performance
- Test with different JavaScript frameworks

## Build and Deployment

### Development Workflow

```bash
# Install dependencies
npm install

# Build WASM module
wasm-pack build --target web --out-dir pkg

# Start development server
npm run serve

# Run tests
wasm-pack test --headless --firefox
```

### Production Build

```bash
# Optimized build
wasm-pack build --target web --release --out-dir pkg

# Generate TypeScript definitions
wasm-pack build --target bundler --typescript
```

### Package Distribution

- **NPM Package**: Distribute as npm package for easy integration
- **CDN Distribution**: Provide CDN links for direct browser usage
- **TypeScript Support**: Include complete type definitions
- **Documentation**: Comprehensive API documentation with examples

## Performance Considerations

### Memory Management

- **Efficient Serialization**: Minimize JSON generation overhead
- **Memory Pooling**: Reuse allocated objects where possible
- **Garbage Collection**: Minimize JavaScript GC pressure
- **WASM Optimization**: Use optimized allocators and build settings

### Frame Rate Optimization

- **Minimal Allocations**: Avoid allocations in hot paths
- **Batch Operations**: Group multiple operations when possible
- **Lazy Evaluation**: Defer expensive operations until needed
- **Caching**: Cache frequently accessed data

## Security Considerations

### Input Validation

- **JSON Schema Validation**: Validate all input against schemas
- **Bounds Checking**: Ensure all numeric inputs are within valid ranges
- **Script Validation**: Validate bytecode before execution
- **Memory Safety**: Prevent buffer overflows and memory corruption

### Sandboxing

- **WASM Isolation**: Leverage WASM's natural sandboxing
- **Limited APIs**: Only expose necessary functionality
- **Error Boundaries**: Contain errors within WASM module
- **Resource Limits**: Implement reasonable resource constraints
