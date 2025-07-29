# Robot Masters WASM Wrapper Documentation

## Overview

The Robot Masters WASM Wrapper provides a JavaScript-compatible interface to the Robot Masters game engine written in Rust. It enables web applications and Node.js environments to run the game engine with full access to game state, configuration, and real-time simulation capabilities.

## Key Features

- **Complete Game Engine Access**: Full access to the Robot Masters game engine through a clean JavaScript API
- **Deterministic Simulation**: Frame-perfect deterministic game simulation at 60 FPS
- **JSON Configuration**: Human-readable JSON configuration for all game elements
- **Real-time State Access**: Efficient access to game state with automatic caching
- **Comprehensive Error Handling**: Detailed error information with recovery suggestions
- **TypeScript Support**: Full TypeScript definitions for type-safe development
- **Performance Optimized**: Optimized WASM binary with efficient memory management

## Quick Start

### Installation

```bash
# Install the WASM package (example - actual package name may vary)
npm install robot-masters-wasm
```

### Basic Usage

```javascript
import { GameWrapper } from 'robot-masters-wasm'

// Create game configuration
const config = {
  seed: 12345,
  tilemap: [
    // 15x16 tilemap array
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    // ... more rows
  ],
  characters: [
    {
      id: 1,
      group: 1,
      position: [5.0, 5.0],
      health: 100,
      energy: 50,
      armor: [0, 0, 0, 0, 0, 0, 0, 0, 0],
      energy_regen: 1,
      energy_regen_rate: 60,
      energy_charge: 2,
      energy_charge_rate: 30,
      behaviors: [],
    },
  ],
  actions: [],
  conditions: [],
  spawns: [],
  status_effects: [],
}

// Initialize and run the game
const wrapper = new GameWrapper(JSON.stringify(config))
wrapper.newGame()

// Game loop
function gameLoop() {
  if (!wrapper.isGameEnded()) {
    wrapper.stepFrame()

    // Get current state
    const characters = JSON.parse(wrapper.getCharactersJson())
    console.log(`Frame ${wrapper.getFrame()}: ${characters.length} characters`)
  }
}

setInterval(gameLoop, 1000 / 60) // 60 FPS
```

## Documentation Structure

### Core Documentation

- **[API Reference](API.md)** - Complete API documentation with all methods and parameters
- **[TypeScript Definitions](TypeScript.d.ts)** - Full TypeScript interface definitions
- **[Usage Examples](Examples.md)** - Comprehensive examples for common use cases
- **[Error Handling Guide](ErrorHandling.md)** - Error handling patterns and recovery strategies

### API Overview

The WASM wrapper provides a single main class `GameWrapper` with the following method categories:

#### Configuration Methods

- `constructor(configJson)` - Create wrapper with JSON configuration
- `getConfigJson()` - Get current configuration
- `validateConfig(configJson)` - Validate configuration without creating wrapper
- `isInitialized()` - Check if wrapper is initialized

#### Game Lifecycle Methods

- `newGame()` - Initialize new game from configuration
- `isGameInitialized()` - Check if game is ready
- `stepFrame()` - Advance game by one frame (1/60 second)
- `isGameEnded()` - Check if game has ended
- `getGameStatus()` - Get current game status

#### State Access Methods

- `getFrame()` - Get current frame number
- `getFrameInfoJson()` - Get detailed frame timing information
- `getStateJson()` - Get complete game state
- `getCharactersJson()` - Get character data
- `getSpawnsJson()` - Get spawn instance data
- `getStatusEffectsJson()` - Get status effect data

#### Error Handling Methods

- `getLastErrorDetails()` - Get detailed error information
- `isStable()` - Check system stability
- `attemptStabilization()` - Attempt error recovery
- `getHealthInfo()` - Get system health metrics

## Configuration Format

The game configuration is provided as a JSON object with the following structure:

```typescript
interface GameConfig {
  seed: number // Random seed for deterministic behavior
  tilemap: number[][] // 15x16 tilemap (0=empty, 1=block)
  characters: CharacterDefinition[]
  actions: ActionDefinition[]
  conditions: ConditionDefinition[]
  spawns: SpawnDefinition[]
  status_effects: StatusEffectDefinition[]
}
```

### Character Definition

```typescript
interface CharacterDefinition {
  id: number // Unique character ID
  group: number // Character group/team
  position: [number, number] // Starting position [x, y]
  health: number // Health points
  energy: number // Energy points
  armor: number[9] // Armor values for 9 elements
  energy_regen: number // Energy regeneration amount
  energy_regen_rate: number // Frames between energy regen
  energy_charge: number // Energy charge amount
  energy_charge_rate: number // Frames between energy charge
  behaviors: [number, number][] // [condition_id, action_id] pairs
}
```

See the [API Reference](API.md) for complete configuration format details.

## Performance Considerations

### Caching

The wrapper includes intelligent caching for JSON serialization:

- State data is cached per frame to avoid redundant serialization
- Cache is automatically invalidated when game state changes
- Multiple calls to the same getter within a frame use cached results

### Memory Management

- Uses `wee_alloc` for optimized WASM memory usage
- Automatic cleanup of temporary allocations
- Efficient fixed-point arithmetic for game calculations

### Best Practices

- Call `stepFrame()` at consistent 60 FPS intervals for deterministic behavior
- Use specific getter methods (`getCharactersJson()`) instead of full state when possible
- Implement proper error handling to maintain system stability
- Monitor system health with `getHealthInfo()` for production applications

## Error Handling

The wrapper provides comprehensive error handling with:

- **Detailed Error Information**: Error type, message, context, and recovery suggestions
- **Automatic Recovery**: Built-in stabilization mechanisms for common error conditions
- **Health Monitoring**: System health metrics and stability checking
- **Graceful Degradation**: Ability to continue operation with reduced functionality

Example error handling:

```javascript
try {
  wrapper.stepFrame()
} catch (error) {
  console.error('Frame step failed:', error)

  if (!wrapper.isStable()) {
    const result = wrapper.attemptStabilization()
    console.log('Stabilization result:', result)
  }

  const health = JSON.parse(wrapper.getHealthInfo())
  console.log('System health:', health)
}
```

See the [Error Handling Guide](ErrorHandling.md) for comprehensive error handling patterns.

## Advanced Usage

### Replay System

Record and replay game sessions for debugging or analysis:

```javascript
const frames = []

// Recording
function recordFrame() {
  frames.push({
    frame: wrapper.getFrame(),
    state: wrapper.getStateJson(),
  })
}

// Replay
function replayFrame(frameData) {
  // Process recorded frame data
  console.log(`Replay frame ${frameData.frame}`)
}
```

### Performance Monitoring

Monitor game performance and system health:

```javascript
function monitorPerformance() {
  const health = JSON.parse(wrapper.getHealthInfo())
  const frameInfo = JSON.parse(wrapper.getFrameInfoJson())

  console.log({
    frame: frameInfo.frame,
    fps: frameInfo.fps,
    characters: health.character_count,
    spawns: health.spawn_count,
    stable: health.is_stable,
  })
}
```

### Testing Framework

Build automated tests for game logic:

```javascript
function testCharacterMovement() {
  const initialPos = JSON.parse(wrapper.getCharactersJson())[0].position

  // Step several frames
  for (let i = 0; i < 60; i++) {
    wrapper.stepFrame()
  }

  const finalPos = JSON.parse(wrapper.getCharactersJson())[0].position

  // Assert movement occurred
  assert(initialPos[0] !== finalPos[0] || initialPos[1] !== finalPos[1])
}
```

## Browser Compatibility

The WASM wrapper is compatible with:

- Modern browsers supporting WebAssembly
- Node.js environments with WASM support
- Electron applications
- React Native with WASM support

## Building from Source

If you need to build the WASM wrapper from source:

```bash
# Install dependencies
cargo install wasm-pack

# Build the WASM package
cd wasm-wrapper
wasm-pack build --target web --out-dir pkg

# The generated files will be in the pkg/ directory
```

## Troubleshooting

### Common Issues

**Configuration Validation Errors**

- Ensure tilemap is exactly 15x16
- Verify all ID references are valid
- Check that all required fields are present

**Memory Issues**

- Monitor system health with `getHealthInfo()`
- Use `attemptStabilization()` for recovery
- Consider reducing game complexity

**Performance Issues**

- Use specific getter methods instead of full state access
- Implement proper frame timing (60 FPS)
- Monitor cache status in health info

**Determinism Issues**

- Use consistent frame stepping intervals
- Ensure same configuration and seed across runs
- Avoid floating-point operations in game logic

### Getting Help

For issues and questions:

1. Check the [Error Handling Guide](ErrorHandling.md) for common error patterns
2. Review the [Examples](Examples.md) for usage patterns
3. Use `getHealthInfo()` and `getLastErrorDetails()` for debugging
4. Enable console error logging for detailed error information

## License

[License information would go here]

## Contributing

[Contributing guidelines would go here]
