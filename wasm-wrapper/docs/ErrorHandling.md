# Error Handling and Recovery Guide

## Overview

The WASM wrapper provides comprehensive error handling with detailed error information, recovery suggestions, and automatic stabilization mechanisms. This guide covers error types, handling patterns, and recovery strategies.

## Error Types

### Configuration Errors

**ConfigurationError**: Issues with game configuration structure or content

```javascript
try {
  const wrapper = new GameWrapper(invalidConfigJson)
} catch (error) {
  // Error contains validation details
  console.error('Configuration error:', error)
}
```

**ValidationError**: Specific validation failures in configuration data

```javascript
try {
  GameWrapper.validateConfig(configJson)
} catch (error) {
  // Parse validation errors
  const errorData = JSON.parse(error.message)
  if (errorData.validation_errors) {
    errorData.validation_errors.forEach((validationError) => {
      console.error(`Field: ${validationError.field}`)
      console.error(`Message: ${validationError.message}`)
      console.error(`Context: ${validationError.context}`)
    })
  }
}
```

**SerializationError**: JSON parsing or serialization failures

```javascript
try {
  const state = wrapper.getStateJson()
} catch (error) {
  console.error('Failed to serialize game state:', error)
  // Try alternative data access methods
  try {
    const characters = wrapper.getCharactersJson()
    console.log('Characters data still accessible')
  } catch (fallbackError) {
    console.error('Complete serialization failure')
  }
}
```

### Game Engine Errors

**GameEngineError**: Errors from the underlying game engine

```javascript
try {
  wrapper.stepFrame()
} catch (error) {
  console.error('Game engine error:', error)

  // Check if game state is still valid
  if (wrapper.isStable()) {
    console.log('Game state is stable, continuing')
  } else {
    console.log('Game state is unstable, attempting recovery')
    wrapper.attemptStabilization()
  }
}
```

**ScriptError**: Issues with game scripts or behaviors

```javascript
// Scripts can fail during game execution
try {
  wrapper.stepFrame()
} catch (error) {
  const errorDetails = wrapper.getLastErrorDetails()
  console.log('Script error details:', errorDetails)

  // Script errors are often recoverable
  if (wrapper.isStable()) {
    console.log('Continuing despite script error')
  }
}
```

**StateError**: Game state integrity issues

```javascript
try {
  wrapper.stepFrame()
} catch (error) {
  // State errors can be serious
  console.error('State error detected:', error)

  // Check system health
  const health = JSON.parse(wrapper.getHealthInfo())
  console.log('System health:', health)

  if (!health.is_stable) {
    console.log('Attempting state recovery')
    wrapper.attemptStabilization()
  }
}
```

### Runtime Errors

**InitializationError**: Issues during game or wrapper initialization

```javascript
try {
  wrapper.newGame()
} catch (error) {
  console.error('Initialization failed:', error)

  // Check configuration validity
  try {
    const configJson = wrapper.getConfigJson()
    GameWrapper.validateConfig(configJson)
    console.log('Configuration is valid, initialization issue is elsewhere')
  } catch (configError) {
    console.error('Configuration is invalid:', configError)
  }
}
```

**ExecutionError**: Runtime execution failures

```javascript
try {
  wrapper.stepFrame()
} catch (error) {
  console.error('Execution error:', error)

  // Execution errors often indicate temporary issues
  // Try again after a brief pause
  setTimeout(() => {
    try {
      wrapper.stepFrame()
      console.log('Execution recovered')
    } catch (retryError) {
      console.error('Execution still failing:', retryError)
    }
  }, 100)
}
```

**MemoryError**: Memory allocation or management issues

```javascript
try {
  wrapper.stepFrame()
} catch (error) {
  if (
    error.message.includes('memory') ||
    error.message.includes('allocation')
  ) {
    console.error('Memory error detected:', error)

    // Memory errors require immediate attention
    wrapper.attemptStabilization()

    // Consider reducing game complexity or restarting
    const health = JSON.parse(wrapper.getHealthInfo())
    if (!health.is_stable) {
      console.log('Memory issues persist, consider restarting game')
    }
  }
}
```

## Error Handling Patterns

### Basic Error Handling

```javascript
function safeStepFrame(wrapper) {
  try {
    wrapper.stepFrame()
    return { success: true, error: null }
  } catch (error) {
    return {
      success: false,
      error: {
        message: error.message,
        details: wrapper.getLastErrorDetails(),
        health: wrapper.getHealthInfo(),
      },
    }
  }
}

// Usage
const result = safeStepFrame(wrapper)
if (!result.success) {
  console.error('Frame step failed:', result.error)

  // Decide on recovery strategy based on error
  if (wrapper.isStable()) {
    console.log('System stable, continuing')
  } else {
    console.log('System unstable, attempting recovery')
    wrapper.attemptStabilization()
  }
}
```

### Retry with Backoff

```javascript
class RetryHandler {
  constructor(maxRetries = 3, baseDelay = 100) {
    this.maxRetries = maxRetries
    this.baseDelay = baseDelay
  }

  async executeWithRetry(operation, context = '') {
    let lastError = null

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        return await operation()
      } catch (error) {
        lastError = error

        if (attempt === this.maxRetries) {
          console.error(
            `${context} failed after ${this.maxRetries + 1} attempts:`,
            error
          )
          throw error
        }

        const delay = this.baseDelay * Math.pow(2, attempt)
        console.warn(
          `${context} attempt ${attempt + 1} failed, retrying in ${delay}ms:`,
          error.message
        )

        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }

    throw lastError
  }
}

// Usage
const retryHandler = new RetryHandler(3, 50)

async function robustStepFrame(wrapper) {
  return await retryHandler.executeWithRetry(
    () => wrapper.stepFrame(),
    'Frame step'
  )
}
```

### Circuit Breaker Pattern

```javascript
class CircuitBreaker {
  constructor(threshold = 5, timeout = 5000) {
    this.threshold = threshold
    this.timeout = timeout
    this.failureCount = 0
    this.lastFailureTime = 0
    this.state = 'CLOSED' // CLOSED, OPEN, HALF_OPEN
  }

  async execute(operation) {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = 'HALF_OPEN'
        console.log('Circuit breaker: Attempting recovery')
      } else {
        throw new Error('Circuit breaker is OPEN')
      }
    }

    try {
      const result = await operation()

      if (this.state === 'HALF_OPEN') {
        this.state = 'CLOSED'
        this.failureCount = 0
        console.log('Circuit breaker: Recovery successful, circuit CLOSED')
      }

      return result
    } catch (error) {
      this.failureCount++
      this.lastFailureTime = Date.now()

      if (this.failureCount >= this.threshold) {
        this.state = 'OPEN'
        console.error('Circuit breaker: Threshold exceeded, circuit OPEN')
      }

      throw error
    }
  }

  getState() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      lastFailureTime: this.lastFailureTime,
    }
  }
}

// Usage
const circuitBreaker = new CircuitBreaker(3, 2000)

async function protectedStepFrame(wrapper) {
  return await circuitBreaker.execute(() => {
    wrapper.stepFrame()
    return wrapper.getFrame()
  })
}
```

## Recovery Strategies

### Automatic Stabilization

```javascript
class AutoStabilizer {
  constructor(wrapper) {
    this.wrapper = wrapper
    this.stabilizationAttempts = 0
    this.maxStabilizationAttempts = 3
    this.lastStabilization = 0
    this.stabilizationCooldown = 1000 // 1 second
  }

  async handleError(error) {
    console.error('Error detected:', error.message)

    // Get current system health
    const health = JSON.parse(this.wrapper.getHealthInfo())
    console.log('System health:', health)

    // Don't attempt stabilization too frequently
    const now = Date.now()
    if (now - this.lastStabilization < this.stabilizationCooldown) {
      console.log('Stabilization on cooldown')
      return false
    }

    // Check if stabilization is needed and possible
    if (
      !health.is_stable &&
      this.stabilizationAttempts < this.maxStabilizationAttempts
    ) {
      try {
        console.log(
          `Attempting stabilization (${this.stabilizationAttempts + 1}/${
            this.maxStabilizationAttempts
          })`
        )

        const result = this.wrapper.attemptStabilization()
        console.log('Stabilization result:', result)

        this.stabilizationAttempts++
        this.lastStabilization = now

        // Check if stabilization was successful
        const newHealth = JSON.parse(this.wrapper.getHealthInfo())
        if (newHealth.is_stable) {
          console.log('Stabilization successful')
          this.stabilizationAttempts = 0 // Reset on success
          return true
        } else {
          console.log('Stabilization incomplete')
          return false
        }
      } catch (stabilizationError) {
        console.error('Stabilization failed:', stabilizationError)
        this.stabilizationAttempts++
        return false
      }
    }

    if (this.stabilizationAttempts >= this.maxStabilizationAttempts) {
      console.error('Maximum stabilization attempts reached')
    }

    return false
  }

  reset() {
    this.stabilizationAttempts = 0
    this.lastStabilization = 0
  }
}
```

### Graceful Degradation

```javascript
class GracefulGameWrapper {
  constructor(configJson) {
    this.wrapper = new GameWrapper(configJson)
    this.wrapper.newGame()
    this.degradationLevel = 0
    this.maxDegradationLevel = 3
  }

  stepFrame() {
    try {
      this.wrapper.stepFrame()

      // Reset degradation on success
      if (this.degradationLevel > 0) {
        this.degradationLevel = Math.max(0, this.degradationLevel - 1)
        console.log(`Degradation level reduced to ${this.degradationLevel}`)
      }

      return true
    } catch (error) {
      console.error('Frame step failed:', error)

      // Increase degradation level
      this.degradationLevel = Math.min(
        this.maxDegradationLevel,
        this.degradationLevel + 1
      )
      console.log(`Degradation level increased to ${this.degradationLevel}`)

      return this.handleDegradedOperation()
    }
  }

  handleDegradedOperation() {
    switch (this.degradationLevel) {
      case 1:
        // Level 1: Skip frame but continue
        console.log('Degradation Level 1: Skipping frame')
        return true

      case 2:
        // Level 2: Attempt stabilization
        console.log('Degradation Level 2: Attempting stabilization')
        try {
          this.wrapper.attemptStabilization()
          return true
        } catch (stabilizationError) {
          console.error('Stabilization failed:', stabilizationError)
          return true // Continue anyway
        }

      case 3:
        // Level 3: Minimal operation mode
        console.log('Degradation Level 3: Minimal operation mode')
        try {
          // Only check if game is still alive
          const status = this.wrapper.getGameStatus()
          return status !== 'ended'
        } catch (statusError) {
          console.error('Cannot determine game status:', statusError)
          return false
        }

      default:
        // Maximum degradation reached
        console.error('Maximum degradation level reached, stopping')
        return false
    }
  }

  getState() {
    try {
      // Try to get full state
      if (this.degradationLevel === 0) {
        return {
          type: 'full',
          data: JSON.parse(this.wrapper.getStateJson()),
        }
      }

      // Try to get partial state
      if (this.degradationLevel <= 2) {
        return {
          type: 'partial',
          data: {
            frame: this.wrapper.getFrame(),
            status: this.wrapper.getGameStatus(),
            characters: JSON.parse(this.wrapper.getCharactersJson()),
          },
        }
      }

      // Minimal state only
      return {
        type: 'minimal',
        data: {
          frame: this.wrapper.getFrame(),
          status: this.wrapper.getGameStatus(),
        },
      }
    } catch (error) {
      console.error('Failed to get state:', error)
      return {
        type: 'error',
        data: { error: error.message },
      }
    }
  }
}
```

## Error Monitoring and Logging

### Comprehensive Error Logger

```javascript
class ErrorLogger {
  constructor() {
    this.errors = []
    this.maxLogSize = 1000
    this.errorCounts = new Map()
  }

  logError(error, context = {}) {
    const errorEntry = {
      timestamp: new Date().toISOString(),
      message: error.message,
      stack: error.stack,
      context,
      id: this.generateErrorId(),
    }

    this.errors.push(errorEntry)

    // Track error frequency
    const errorKey = this.getErrorKey(error)
    this.errorCounts.set(errorKey, (this.errorCounts.get(errorKey) || 0) + 1)

    // Maintain log size
    if (this.errors.length > this.maxLogSize) {
      this.errors.shift()
    }

    // Log to console with context
    console.error(`[${errorEntry.id}] ${error.message}`, context)

    return errorEntry.id
  }

  generateErrorId() {
    return Math.random().toString(36).substr(2, 9)
  }

  getErrorKey(error) {
    // Create a key for error frequency tracking
    return `${error.constructor.name}:${error.message.substring(0, 50)}`
  }

  getErrorStats() {
    const now = Date.now()
    const oneHourAgo = now - 60 * 60 * 1000

    const recentErrors = this.errors.filter(
      (e) => new Date(e.timestamp).getTime() > oneHourAgo
    )

    return {
      totalErrors: this.errors.length,
      recentErrors: recentErrors.length,
      errorTypes: Array.from(this.errorCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10),
      mostRecentError: this.errors[this.errors.length - 1],
    }
  }

  exportLogs() {
    return {
      errors: this.errors,
      stats: this.getErrorStats(),
      exportedAt: new Date().toISOString(),
    }
  }
}

// Usage
const errorLogger = new ErrorLogger()

function monitoredStepFrame(wrapper) {
  try {
    wrapper.stepFrame()
  } catch (error) {
    const errorId = errorLogger.logError(error, {
      frame: wrapper.getFrame(),
      gameStatus: wrapper.getGameStatus(),
      isStable: wrapper.isStable(),
    })

    // Handle error based on frequency
    const stats = errorLogger.getErrorStats()
    const errorKey = errorLogger.getErrorKey(error)
    const frequency = errorLogger.errorCounts.get(errorKey) || 0

    if (frequency > 5) {
      console.warn(`Error ${errorId} has occurred ${frequency} times`)
      // Consider more aggressive recovery
    }
  }
}
```

## Best Practices

### 1. Always Check System Health

```javascript
function healthAwareOperation(wrapper, operation) {
  // Check health before operation
  const preHealth = JSON.parse(wrapper.getHealthInfo())
  if (!preHealth.is_stable) {
    console.warn('System unstable before operation')
    wrapper.attemptStabilization()
  }

  try {
    return operation()
  } catch (error) {
    // Check health after error
    const postHealth = JSON.parse(wrapper.getHealthInfo())
    console.error('Operation failed:', error)
    console.log('System health after error:', postHealth)

    if (!postHealth.is_stable) {
      wrapper.attemptStabilization()
    }

    throw error
  }
}
```

### 2. Implement Proper Cleanup

```javascript
class ManagedGameWrapper {
  constructor(configJson) {
    this.wrapper = new GameWrapper(configJson)
    this.isRunning = false
    this.cleanupHandlers = []
  }

  start() {
    try {
      this.wrapper.newGame()
      this.isRunning = true

      // Set up cleanup on process exit
      process.on('exit', () => this.cleanup())
      process.on('SIGINT', () => this.cleanup())
      process.on('uncaughtException', (error) => {
        console.error('Uncaught exception:', error)
        this.cleanup()
      })
    } catch (error) {
      console.error('Failed to start game:', error)
      this.cleanup()
      throw error
    }
  }

  addCleanupHandler(handler) {
    this.cleanupHandlers.push(handler)
  }

  cleanup() {
    if (!this.isRunning) return

    console.log('Cleaning up game wrapper...')
    this.isRunning = false

    // Run cleanup handlers
    this.cleanupHandlers.forEach((handler) => {
      try {
        handler()
      } catch (error) {
        console.error('Cleanup handler failed:', error)
      }
    })

    // Final health check
    try {
      const health = JSON.parse(this.wrapper.getHealthInfo())
      console.log('Final system health:', health)
    } catch (error) {
      console.error('Could not get final health status:', error)
    }
  }
}
```

### 3. Use Defensive Programming

```javascript
function safeGetGameData(wrapper) {
  const result = {
    frame: 0,
    characters: [],
    spawns: [],
    statusEffects: [],
    errors: [],
  }

  // Safely get frame number
  try {
    result.frame = wrapper.getFrame()
  } catch (error) {
    result.errors.push(`Frame access failed: ${error.message}`)
  }

  // Safely get characters
  try {
    result.characters = JSON.parse(wrapper.getCharactersJson())
  } catch (error) {
    result.errors.push(`Characters access failed: ${error.message}`)
  }

  // Safely get spawns
  try {
    result.spawns = JSON.parse(wrapper.getSpawnsJson())
  } catch (error) {
    result.errors.push(`Spawns access failed: ${error.message}`)
  }

  // Safely get status effects
  try {
    result.statusEffects = JSON.parse(wrapper.getStatusEffectsJson())
  } catch (error) {
    result.errors.push(`Status effects access failed: ${error.message}`)
  }

  return result
}
```

This comprehensive error handling guide provides the foundation for building robust applications with the WASM wrapper, ensuring graceful handling of various error conditions and maintaining system stability.
