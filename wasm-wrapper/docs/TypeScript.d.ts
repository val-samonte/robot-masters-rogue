// TypeScript definitions for Robot Masters WASM Wrapper

declare module 'robot-masters-wasm' {
  /**
   * Main wrapper class for the Robot Masters game engine
   */
  export class GameWrapper {
    /**
     * Create a new GameWrapper instance with JSON configuration
     * @param configJson - Complete game configuration as JSON string
     * @throws Error if configuration is invalid or malformed
     */
    constructor(configJson: string)

    // Configuration methods

    /**
     * Get the current configuration as JSON string
     * @returns JSON string of current configuration
     * @throws Error if no configuration is available
     */
    getConfigJson(): string

    /**
     * Validate a JSON configuration string without creating a GameWrapper instance
     * @param configJson - JSON configuration to validate
     * @returns Success message if valid
     * @throws Error with validation details if invalid
     */
    static validateConfig(configJson: string): string

    /**
     * Check if the wrapper has been properly initialized with a configuration
     * @returns true if initialized, false otherwise
     */
    isInitialized(): boolean

    // Game lifecycle methods

    /**
     * Initialize a new game from the JSON configuration
     * This creates a new game state using the game engine's new_game API
     * @throws Error if configuration is invalid or game initialization fails
     */
    newGame(): void

    /**
     * Check if the game has been initialized and is ready for frame execution
     * @returns true if game is initialized, false otherwise
     */
    isGameInitialized(): boolean

    /**
     * Advance the game state by exactly one frame (1/60th second)
     * Maintains deterministic behavior across WASM boundary
     * @throws Error if game is not initialized or frame stepping fails
     */
    stepFrame(): void

    /**
     * Check if the game has ended (reached maximum frames or other end condition)
     * @returns true if game has ended, false otherwise
     */
    isGameEnded(): boolean

    /**
     * Get the current game status as a string
     * @returns One of: "not_initialized", "playing", "ended"
     */
    getGameStatus(): GameStatus

    // Frame and timing methods

    /**
     * Get the current frame number for timing synchronization
     * @returns Current frame number (0 if not initialized)
     */
    getFrame(): number

    /**
     * Get frame timing information as JSON string
     * Returns frame count, game status, and timing data for synchronization
     * @returns JSON string with frame timing data
     * @throws Error if game is not initialized
     */
    getFrameInfoJson(): string

    // State access methods

    /**
     * Get complete game state as JSON string
     * Returns all game state information including characters, spawns, status effects, and frame info
     * @returns JSON string with complete game state
     * @throws Error if game is not initialized
     */
    getStateJson(): string

    /**
     * Get characters data as JSON string
     * Returns detailed character information including position, health, energy, and status effects
     * @returns JSON array of character states as string
     * @throws Error if game is not initialized
     */
    getCharactersJson(): string

    /**
     * Get spawn instances data as JSON string
     * Returns all active spawn instances with their positions, properties, and remaining lifespan
     * @returns JSON array of spawn states as string
     * @throws Error if game is not initialized
     */
    getSpawnsJson(): string

    /**
     * Get status effect instances data as JSON string
     * Returns all active status effects with their remaining duration and stack information
     * @returns JSON array of status effect states as string
     * @throws Error if game is not initialized
     */
    getStatusEffectsJson(): string

    // Error handling and recovery methods

    /**
     * Get detailed error information for the last operation
     * This can be called after any method that returns an error
     * @returns JSON string with error details
     */
    getLastErrorDetails(): string

    /**
     * Check if the wrapper is in a stable state
     * @returns true if stable, false if there are stability issues
     */
    isStable(): boolean

    /**
     * Attempt to recover from errors and stabilize the wrapper
     * @returns Status message about stabilization attempt
     * @throws Error if stabilization fails
     */
    attemptStabilization(): string

    /**
     * Get system health information
     * @returns JSON string with health metrics
     */
    getHealthInfo(): string
  }

  // Type definitions for JSON data structures

  export type GameStatus = 'not_initialized' | 'playing' | 'ended'

  export interface GameConfig {
    seed: number
    tilemap: number[][] // 15x16 tilemap as nested arrays
    characters: CharacterDefinition[]
    actions: ActionDefinition[]
    conditions: ConditionDefinition[]
    spawns: SpawnDefinition[]
    status_effects: StatusEffectDefinition[]
  }

  export interface CharacterDefinition {
    id: number
    group: number
    position: [number, number] // [x, y] position as floats
    health: number
    energy: number
    armor: [
      number,
      number,
      number,
      number,
      number,
      number,
      number,
      number,
      number
    ] // Armor values for all 9 elements
    energy_regen: number
    energy_regen_rate: number
    energy_charge: number
    energy_charge_rate: number
    behaviors: [number, number][] // [condition_id, action_id] pairs
  }

  export interface ActionDefinition {
    energy_cost: number
    interval: number
    duration: number
    cooldown: number
    args: [number, number, number, number, number, number, number, number]
    spawns: [number, number, number, number]
    script: number[]
  }

  export interface ConditionDefinition {
    energy_mul: number // Fixed-point value as float for JSON
    args: [number, number, number, number, number, number, number, number]
    script: number[]
  }

  export interface SpawnDefinition {
    damage_base: number
    health_cap: number
    duration: number
    element?: number // Element as number value (0-8)
    args: [number, number, number, number, number, number, number, number]
    spawns: [number, number, number, number]
    behavior_script: number[]
    collision_script: number[]
    despawn_script: number[]
  }

  export interface StatusEffectDefinition {
    duration: number
    stack_limit: number
    reset_on_stack: boolean
    args: [number, number, number, number, number, number, number, number]
    spawns: [number, number, number, number]
    on_script: number[]
    tick_script: number[]
    off_script: number[]
  }

  export interface FrameInfo {
    frame: number
    status: GameStatus
    max_frames: number
    fps: number
    elapsed_seconds: number
    remaining_seconds: number
  }

  export interface GameState {
    frame: number
    seed: number
    status: GameStatus
    characters: CharacterState[]
    spawns: SpawnState[]
    status_effects: StatusEffectState[]
    tilemap: number[][]
  }

  export interface CharacterState {
    id: number
    group: number
    position: [number, number] // [x, y] as JavaScript numbers
    velocity: [number, number] // [vx, vy] as JavaScript numbers
    health: number
    energy: number
    armor: [
      number,
      number,
      number,
      number,
      number,
      number,
      number,
      number,
      number
    ]
    energy_regen: number
    energy_regen_rate: number
    energy_charge: number
    energy_charge_rate: number
    facing: number
    gravity_dir: number
    size: [number, number]
    collision: [boolean, boolean, boolean, boolean] // [top, right, bottom, left]
    locked_action?: number
    status_effects: number[]
    behaviors: [number, number][] // [condition_id, action_id] pairs
  }

  export interface SpawnState {
    id: number
    spawn_id: number
    owner_id: number
    position: [number, number] // [x, y] as JavaScript numbers
    velocity: [number, number] // [vx, vy] as JavaScript numbers
    lifespan: number
    element?: number // Element as number value (0-8)
    facing: number
    gravity_dir: number
    size: [number, number]
    collision: [boolean, boolean, boolean, boolean] // [top, right, bottom, left]
    vars: [number, number, number, number]
    fixed: [number, number, number, number] // Fixed-point values converted to JavaScript numbers
  }

  export interface StatusEffectState {
    instance_id: number
    definition_id: number
    remaining_duration: number
    stack_count: number
    vars: [number, number, number, number]
    fixed: [number, number, number, number] // Fixed-point values converted to JavaScript numbers
  }

  export interface HealthInfo {
    is_initialized: boolean
    game_initialized: boolean
    is_stable: boolean
    frame: number
    character_count: number
    spawn_count: number
    status_effect_count: number
    cache_status: {
      has_cached_frame: boolean
      has_cached_state: boolean
      has_cached_characters: boolean
      has_cached_spawns: boolean
      has_cached_status_effects: boolean
    }
  }

  export interface WasmError {
    error_type: ErrorType
    message: string
    context?: ErrorContext
    severity: ErrorSeverity
    recovery_suggestions: string[]
    timestamp: number
  }

  export type ErrorType =
    | 'ConfigurationError'
    | 'ValidationError'
    | 'SerializationError'
    | 'GameEngineError'
    | 'ScriptError'
    | 'StateError'
    | 'InitializationError'
    | 'ExecutionError'
    | 'MemoryError'
    | 'SystemError'
    | 'UnknownError'

  export type ErrorSeverity =
    | 'Info'
    | 'Warning'
    | 'Error'
    | 'Critical'
    | 'Fatal'

  export interface ErrorContext {
    source?: string
    stack_trace?: string[]
    data?: any
    error_code?: number
    debug_info?: any
  }

  export interface ValidationError {
    field: string
    message: string
    context?: string
  }
}
