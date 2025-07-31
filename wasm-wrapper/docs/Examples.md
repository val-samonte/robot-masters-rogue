# WASM Wrapper Usage Examples

## Basic Game Setup and Execution

### Simple Game Loop

```javascript
import { GameWrapper } from 'robot-masters-wasm'

// Basic game configuration
const gameConfig = {
  seed: 12345,
  tilemap: [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
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

// Initialize the game wrapper
const wrapper = new GameWrapper(JSON.stringify(gameConfig))

// Start a new game
wrapper.newGame()

// Basic game loop
function gameLoop() {
  if (wrapper.isGameInitialized() && !wrapper.isGameEnded()) {
    try {
      wrapper.stepFrame()

      // Get current game state
      const characters = JSON.parse(wrapper.getCharactersJson())
      console.log(
        `Frame ${wrapper.getFrame()}: Character at [${
          characters[0].position[0]
        }, ${characters[0].position[1]}]`
      )
    } catch (error) {
      console.error('Game loop error:', error)
    }
  } else if (wrapper.isGameEnded()) {
    console.log('Game finished!')
    clearInterval(gameInterval)
  }
}

// Run at 60 FPS
const gameInterval = setInterval(gameLoop, 1000 / 60)
```

### Configuration Validation

```javascript
// Validate configuration before creating wrapper
const configJson = JSON.stringify(gameConfig)

try {
  const validationResult = GameWrapper.validateConfig(configJson)
  console.log('Configuration is valid:', validationResult)

  const wrapper = new GameWrapper(configJson)
  console.log('Wrapper created successfully')
} catch (error) {
  console.error('Configuration validation failed:', error)

  // Parse error details if available
  try {
    const errorDetails = JSON.parse(error.message)
    if (errorDetails.validation_errors) {
      errorDetails.validation_errors.forEach((err) => {
        console.error(`Field ${err.field}: ${err.message}`)
      })
    }
  } catch (parseError) {
    console.error('Raw error:', error.message)
  }
}
```

## Advanced Usage Patterns

### Game State Monitoring

```javascript
class GameMonitor {
  constructor(wrapper) {
    this.wrapper = wrapper
    this.frameHistory = []
    this.maxHistorySize = 300 // 5 seconds at 60 FPS
  }

  update() {
    if (!this.wrapper.isGameInitialized()) return

    const frameInfo = JSON.parse(this.wrapper.getFrameInfoJson())
    const characters = JSON.parse(this.wrapper.getCharactersJson())
    const spawns = JSON.parse(this.wrapper.getSpawnsJson())
    const statusEffects = JSON.parse(this.wrapper.getStatusEffectsJson())

    const frameData = {
      frame: frameInfo.frame,
      timestamp: Date.now(),
      characterCount: characters.length,
      spawnCount: spawns.length,
      statusEffectCount: statusEffects.length,
      gameStatus: frameInfo.status,
    }

    this.frameHistory.push(frameData)

    // Keep history size manageable
    if (this.frameHistory.length > this.maxHistorySize) {
      this.frameHistory.shift()
    }

    // Log significant events
    if (spawns.length > 0) {
      console.log(`Frame ${frameInfo.frame}: ${spawns.length} active spawns`)
    }

    if (statusEffects.length > 0) {
      console.log(
        `Frame ${frameInfo.frame}: ${statusEffects.length} active status effects`
      )
    }
  }

  getAverageFrameRate() {
    if (this.frameHistory.length < 2) return 0

    const recent = this.frameHistory.slice(-60) // Last second
    const timeSpan = recent[recent.length - 1].timestamp - recent[0].timestamp
    return (recent.length - 1) / (timeSpan / 1000)
  }

  getHealthReport() {
    const health = JSON.parse(this.wrapper.getHealthInfo())
    return {
      ...health,
      averageFrameRate: this.getAverageFrameRate(),
      historySize: this.frameHistory.length,
    }
  }
}

// Usage
const monitor = new GameMonitor(wrapper)

function monitoredGameLoop() {
  if (wrapper.isGameInitialized() && !wrapper.isGameEnded()) {
    try {
      wrapper.stepFrame()
      monitor.update()

      // Print health report every 5 seconds
      if (wrapper.getFrame() % 300 === 0) {
        console.log('Health Report:', monitor.getHealthReport())
      }
    } catch (error) {
      console.error('Game loop error:', error)
    }
  }
}
```

### Error Handling and Recovery

```javascript
class RobustGameWrapper {
  constructor(configJson) {
    this.configJson = configJson
    this.wrapper = null
    this.errorCount = 0
    this.maxErrors = 5
    this.lastStabilization = 0

    this.initialize()
  }

  initialize() {
    try {
      this.wrapper = new GameWrapper(this.configJson)
      this.wrapper.newGame()
      console.log('Game initialized successfully')
    } catch (error) {
      console.error('Initialization failed:', error)
      throw error
    }
  }

  stepFrame() {
    if (!this.wrapper) {
      throw new Error('Wrapper not initialized')
    }

    try {
      this.wrapper.stepFrame()
      this.errorCount = 0 // Reset error count on success
      return true
    } catch (error) {
      this.errorCount++
      console.error(
        `Frame step error (${this.errorCount}/${this.maxErrors}):`,
        error
      )

      // Get detailed error information
      const errorDetails = this.wrapper.getLastErrorDetails()
      console.log('Error details:', errorDetails)

      // Attempt recovery if not too many errors
      if (this.errorCount < this.maxErrors) {
        return this.attemptRecovery()
      } else {
        console.error('Too many errors, giving up')
        return false
      }
    }
  }

  attemptRecovery() {
    try {
      // Check if system is stable
      if (!this.wrapper.isStable()) {
        console.log('System unstable, attempting stabilization...')

        // Don't attempt stabilization too frequently
        const now = Date.now()
        if (now - this.lastStabilization > 1000) {
          const result = this.wrapper.attemptStabilization()
          console.log('Stabilization result:', result)
          this.lastStabilization = now
        }
      }

      // Check health after stabilization
      const health = JSON.parse(this.wrapper.getHealthInfo())
      console.log('System health after recovery:', health)

      return health.is_stable
    } catch (recoveryError) {
      console.error('Recovery failed:', recoveryError)
      return false
    }
  }

  getStatus() {
    if (!this.wrapper) return 'not_initialized'

    return {
      gameStatus: this.wrapper.getGameStatus(),
      frame: this.wrapper.getFrame(),
      isStable: this.wrapper.isStable(),
      errorCount: this.errorCount,
      health: JSON.parse(this.wrapper.getHealthInfo()),
    }
  }
}

// Usage with error handling
const robustWrapper = new RobustGameWrapper(JSON.stringify(gameConfig))

function robustGameLoop() {
  const success = robustWrapper.stepFrame()

  if (success) {
    // Process game state normally
    const status = robustWrapper.getStatus()
    if (status.frame % 60 === 0) {
      console.log('Game status:', status)
    }
  } else {
    console.log('Game loop failed, stopping')
    clearInterval(gameInterval)
  }
}
```

### Performance Optimization

```javascript
class OptimizedGameRenderer {
  constructor(wrapper) {
    this.wrapper = wrapper
    this.lastFrame = -1
    this.cachedState = null
    this.dirtyFlags = {
      characters: true,
      spawns: true,
      statusEffects: true,
    }
  }

  update() {
    const currentFrame = this.wrapper.getFrame()

    // Only update if frame has changed
    if (currentFrame !== this.lastFrame) {
      this.lastFrame = currentFrame
      this.markAllDirty()
    }
  }

  markAllDirty() {
    this.dirtyFlags.characters = true
    this.dirtyFlags.spawns = true
    this.dirtyFlags.statusEffects = true
  }

  getCharacters() {
    if (this.dirtyFlags.characters) {
      this.cachedState = this.cachedState || {}
      this.cachedState.characters = JSON.parse(this.wrapper.getCharactersJson())
      this.dirtyFlags.characters = false
    }
    return this.cachedState.characters
  }

  getSpawns() {
    if (this.dirtyFlags.spawns) {
      this.cachedState = this.cachedState || {}
      this.cachedState.spawns = JSON.parse(this.wrapper.getSpawnsJson())
      this.dirtyFlags.spawns = false
    }
    return this.cachedState.spawns
  }

  getStatusEffects() {
    if (this.dirtyFlags.statusEffects) {
      this.cachedState = this.cachedState || {}
      this.cachedState.statusEffects = JSON.parse(
        this.wrapper.getStatusEffectsJson()
      )
      this.dirtyFlags.statusEffects = false
    }
    return this.cachedState.statusEffects
  }

  render() {
    this.update()

    const characters = this.getCharacters()
    const spawns = this.getSpawns()
    const statusEffects = this.getStatusEffects()

    // Render only what's needed
    this.renderCharacters(characters)
    this.renderSpawns(spawns)
    this.renderStatusEffects(statusEffects)
  }

  renderCharacters(characters) {
    characters.forEach((char) => {
      // Render character at position
      console.log(
        `Render character ${char.id} at [${char.position[0]}, ${char.position[1]}]`
      )
    })
  }

  renderSpawns(spawns) {
    spawns.forEach((spawn) => {
      // Render spawn
      console.log(`Render spawn ${spawn.id} (${spawn.lifespan} frames left)`)
    })
  }

  renderStatusEffects(statusEffects) {
    statusEffects.forEach((effect) => {
      // Render status effect indicator
      console.log(
        `Status effect ${effect.instance_id}: ${effect.remaining_duration} frames`
      )
    })
  }
}
```

## Common Scenarios

### Replay System

```javascript
class GameReplay {
  constructor(configJson) {
    this.configJson = configJson
    this.frames = []
    this.isRecording = false
    this.isReplaying = false
    this.replayIndex = 0
  }

  startRecording(wrapper) {
    this.wrapper = wrapper
    this.frames = []
    this.isRecording = true
    console.log('Started recording')
  }

  recordFrame() {
    if (!this.isRecording || !this.wrapper) return

    try {
      const frameData = {
        frame: this.wrapper.getFrame(),
        state: this.wrapper.getStateJson(),
        frameInfo: this.wrapper.getFrameInfoJson(),
      }
      this.frames.push(frameData)
    } catch (error) {
      console.error('Recording error:', error)
    }
  }

  stopRecording() {
    this.isRecording = false
    console.log(`Recording stopped. Captured ${this.frames.length} frames`)
  }

  startReplay() {
    this.isReplaying = true
    this.replayIndex = 0
    console.log('Started replay')
  }

  getReplayFrame() {
    if (!this.isReplaying || this.replayIndex >= this.frames.length) {
      return null
    }

    const frame = this.frames[this.replayIndex]
    this.replayIndex++
    return frame
  }

  stopReplay() {
    this.isReplaying = false
    this.replayIndex = 0
    console.log('Replay stopped')
  }

  saveReplay(filename) {
    const replayData = {
      config: this.configJson,
      frames: this.frames,
      metadata: {
        totalFrames: this.frames.length,
        duration: this.frames.length / 60,
        recordedAt: new Date().toISOString(),
      },
    }

    // In a real application, you would save this to a file
    console.log(`Replay saved: ${filename}`, replayData.metadata)
    return JSON.stringify(replayData)
  }

  loadReplay(replayJson) {
    const replayData = JSON.parse(replayJson)
    this.configJson = replayData.config
    this.frames = replayData.frames
    console.log('Replay loaded:', replayData.metadata)
  }
}
```

### Testing Framework

```javascript
class GameTester {
  constructor() {
    this.tests = []
    this.results = []
  }

  addTest(name, testFn) {
    this.tests.push({ name, testFn })
  }

  async runTests() {
    console.log(`Running ${this.tests.length} tests...`)

    for (const test of this.tests) {
      try {
        console.log(`Running: ${test.name}`)
        const startTime = Date.now()

        await test.testFn()

        const duration = Date.now() - startTime
        this.results.push({
          name: test.name,
          status: 'PASS',
          duration,
          error: null,
        })

        console.log(`✓ ${test.name} (${duration}ms)`)
      } catch (error) {
        this.results.push({
          name: test.name,
          status: 'FAIL',
          duration: Date.now() - startTime,
          error: error.message,
        })

        console.error(`✗ ${test.name}: ${error.message}`)
      }
    }

    this.printSummary()
  }

  printSummary() {
    const passed = this.results.filter((r) => r.status === 'PASS').length
    const failed = this.results.filter((r) => r.status === 'FAIL').length

    console.log(`\nTest Results: ${passed} passed, ${failed} failed`)

    if (failed > 0) {
      console.log('\nFailed tests:')
      this.results
        .filter((r) => r.status === 'FAIL')
        .forEach((r) => console.log(`  - ${r.name}: ${r.error}`))
    }
  }
}

// Example tests
const tester = new GameTester()

tester.addTest('Configuration validation', () => {
  const validConfig = JSON.stringify(gameConfig)
  const result = GameWrapper.validateConfig(validConfig)
  if (!result.includes('valid')) {
    throw new Error('Valid configuration was rejected')
  }
})

tester.addTest('Game initialization', () => {
  const wrapper = new GameWrapper(JSON.stringify(gameConfig))
  if (!wrapper.isInitialized()) {
    throw new Error('Wrapper not initialized')
  }

  wrapper.newGame()
  if (!wrapper.isGameInitialized()) {
    throw new Error('Game not initialized')
  }
})

tester.addTest('Frame stepping', () => {
  const wrapper = new GameWrapper(JSON.stringify(gameConfig))
  wrapper.newGame()

  const initialFrame = wrapper.getFrame()
  wrapper.stepFrame()
  const nextFrame = wrapper.getFrame()

  if (nextFrame !== initialFrame + 1) {
    throw new Error(
      `Frame did not increment correctly: ${initialFrame} -> ${nextFrame}`
    )
  }
})

// Run the tests
tester.runTests()
```

These examples demonstrate various usage patterns and scenarios for the WASM wrapper, from basic game loops to advanced features like error handling, performance optimization, replay systems, and testing frameworks.
