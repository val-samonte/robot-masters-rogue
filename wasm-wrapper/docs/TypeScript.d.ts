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
    characters: CharacterDefinitionJson[]
    actions: ActionDefinitionJson[]
    conditions: ConditionDefinition[]
    spawns: SpawnDefinitionJson[]
    status_effects: StatusEffectDefinitionJson[]
  }

  /**
   * Character definition with enhanced properties for combat and movement
   */
  export interface CharacterDefinitionJson {
    id: number
    group: number
    /** Position as [[x_numerator, x_denominator], [y_numerator, y_denominator]] for deterministic Fixed-point values */
    position: [[number, number], [number, number]]
    /** Current health (u16 type, 0-65535) */
    health: number
    /** Maximum health capacity (u16 type, 0-65535) */
    health_cap: number
    /** Current energy (u8 type, 0-255) */
    energy: number
    /** Maximum energy capacity (u8 type, 0-255) */
    energy_cap: number
    /** Power stat affecting damage output (u8 type, 0-255) */
    power: number
    /** Weight affecting movement and physics (u8 type, 0-255) */
    weight: number
    /** Jump force as [numerator, denominator] for deterministic Fixed-point value */
    jump_force: [number, number]
    /** Movement speed as [numerator, denominator] for deterministic Fixed-point value */
    move_speed: [number, number]
    /** Armor values for all 9 elements */
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
    /** Direction as [x_dir, y_dir] replacing facing and gravity_dir */
    dir: [number, number]
    /** Enmity level for AI targeting (u8 type, 0-255) */
    enmity: number
    /** Optional target entity ID */
    target_id?: number
    /** Target type: 1=Character, 2=Spawn */
    target_type: number
    /** Behavior pairs as [condition_id, action_id] */
    behaviors: [number, number][]
  }

  /**
   * Action definition with simplified structure (interval and duration removed)
   */
  export interface ActionDefinitionJson {
    /** Energy cost to perform this action */
    energy_cost: number
    /** Cooldown period in frames before action can be used again */
    cooldown: number
    /** Action arguments array */
    args: [number, number, number, number, number, number, number, number]
    /** Spawn IDs that this action can create */
    spawns: [number, number, number, number]
    /** Script bytecode for action execution */
    script: number[]
  }

  export interface ConditionDefinition {
    energy_mul: number // Fixed-point value as float for JSON
    args: [number, number, number, number, number, number, number, number]
    script: number[]
  }

  /**
   * Spawn definition with enhanced combat properties
   */
  export interface SpawnDefinitionJson {
    /** Base damage value (u16 type, 0-65535) */
    damage_base: number
    /** Damage range for random variation (u16 type, 0-65535) */
    damage_range: number
    /** Critical hit chance percentage (u8 type, 0-100) */
    crit_chance: number
    /** Critical hit damage multiplier (u8 type, 1-100) */
    crit_multiplier: number
    /** Maximum health for this spawn type */
    health_cap: number
    /** Duration in frames before automatic despawn */
    duration: number
    /** Element type as number value (0-8) */
    element?: number
    /** Application chance percentage (u8 type, 0-100) */
    chance: number
    /** Spawn arguments array */
    args: [number, number, number, number, number, number, number, number]
    /** Nested spawn IDs that this spawn can create */
    spawns: [number, number, number, number]
    /** Script for spawn behavior logic */
    behavior_script: number[]
    /** Script for collision handling */
    collision_script: number[]
    /** Script for despawn cleanup */
    despawn_script: number[]
  }

  /**
   * Status effect definition with application chance
   */
  export interface StatusEffectDefinitionJson {
    /** Duration in frames for this status effect */
    duration: number
    /** Maximum number of stacks allowed */
    stack_limit: number
    /** Whether to reset duration when stacking */
    reset_on_stack: boolean
    /** Application chance percentage (u8 type, 0-100) */
    chance: number
    /** Status effect arguments array */
    args: [number, number, number, number, number, number, number, number]
    /** Spawn IDs that this status effect can create */
    spawns: [number, number, number, number]
    /** Script executed when status effect is applied */
    on_script: number[]
    /** Script executed each frame while active */
    tick_script: number[]
    /** Script executed when status effect expires */
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
    characters: CharacterStateJson[]
    spawns: SpawnStateJson[]
    status_effects: StatusEffectStateJson[]
    tilemap: number[][]
  }

  /**
   * Character state with comprehensive properties and Fixed-point representation
   */
  export interface CharacterStateJson {
    id: number
    group: number
    /** Position as [[x_numerator, x_denominator], [y_numerator, y_denominator]] for deterministic Fixed-point values */
    position: [[number, number], [number, number]]
    /** Velocity as [[vx_numerator, vx_denominator], [vy_numerator, vy_denominator]] for deterministic Fixed-point values */
    velocity: [[number, number], [number, number]]
    /** Current health (u16 type, 0-65535) */
    health: number
    /** Maximum health capacity (u16 type, 0-65535) */
    health_cap: number
    /** Current energy (u8 type, 0-255) */
    energy: number
    /** Maximum energy capacity (u8 type, 0-255) */
    energy_cap: number
    /** Power stat affecting damage output (u8 type, 0-255) */
    power: number
    /** Weight affecting movement and physics (u8 type, 0-255) */
    weight: number
    /** Jump force as [numerator, denominator] for deterministic Fixed-point value */
    jump_force: [number, number]
    /** Movement speed as [numerator, denominator] for deterministic Fixed-point value */
    move_speed: [number, number]
    /** Armor values for all 9 elements */
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
    /** Direction as [x_dir, y_dir] replacing facing and gravity_dir */
    dir: [number, number]
    /** Enmity level for AI targeting (u8 type, 0-255) */
    enmity: number
    /** Optional target entity ID */
    target_id?: number
    /** Target type: 1=Character, 2=Spawn */
    target_type: number
    /** Entity size as [width, height] */
    size: [number, number]
    /** Collision flags as [top, right, bottom, left] */
    collision: [boolean, boolean, boolean, boolean]
    /** Currently locked action ID if any */
    locked_action?: number
    /** Active status effect instance IDs */
    status_effects: number[]
    /** Behavior pairs as [condition_id, action_id] */
    behaviors: [number, number][]
  }

  /**
   * Spawn state with comprehensive properties and Fixed-point representation
   */
  export interface SpawnStateJson {
    id: number
    spawn_id: number
    /** Owner entity ID (supports both Character and Spawn entities) */
    owner_id: number
    /** Owner type: 1=Character, 2=Spawn */
    owner_type: number
    /** Position as [[x_numerator, x_denominator], [y_numerator, y_denominator]] for deterministic Fixed-point values */
    position: [[number, number], [number, number]]
    /** Velocity as [[vx_numerator, vx_denominator], [vy_numerator, vy_denominator]] for deterministic Fixed-point values */
    velocity: [[number, number], [number, number]]
    /** Current health (u16 type, 0-65535) */
    health: number
    /** Maximum health capacity (u16 type, 0-65535) */
    health_cap: number
    /** Rotation as [numerator, denominator] for deterministic Fixed-point value */
    rotation: [number, number]
    /** Remaining lifespan in frames (renamed from lifespan) */
    life_span: number
    /** Element type as number value (0-8) */
    element?: number
    /** Direction as [x_dir, y_dir] replacing facing and gravity_dir */
    dir: [number, number]
    /** Enmity level for AI targeting (u8 type, 0-255) */
    enmity: number
    /** Optional target entity ID */
    target_id?: number
    /** Target type: 1=Character, 2=Spawn */
    target_type: number
    /** Entity size as [width, height] */
    size: [number, number]
    /** Collision flags as [top, right, bottom, left] */
    collision: [boolean, boolean, boolean, boolean]
    /** Runtime variables array (renamed from vars) */
    runtime_vars: [number, number, number, number]
    /** Runtime Fixed-point values as [[num1, den1], [num2, den2], [num3, den3], [num4, den4]] (renamed from fixed) */
    runtime_fixed: [
      [number, number],
      [number, number],
      [number, number],
      [number, number]
    ]
  }

  /**
   * Status effect state with renamed fields and Fixed-point representation
   */
  export interface StatusEffectStateJson {
    instance_id: number
    definition_id: number
    /** Remaining duration in frames (renamed from remaining_duration) */
    life_span: number
    stack_count: number
    /** Runtime variables array (renamed from vars) */
    runtime_vars: [number, number, number, number]
    /** Runtime Fixed-point values as [[num1, den1], [num2, den2], [num3, den3], [num4, den4]] (renamed from fixed) */
    runtime_fixed: [
      [number, number],
      [number, number],
      [number, number],
      [number, number]
    ]
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

  // Type aliases for backward compatibility (deprecated - use Json suffixed versions)
  /** @deprecated Use CharacterDefinitionJson instead */
  export type CharacterDefinition = CharacterDefinitionJson
  /** @deprecated Use ActionDefinitionJson instead */
  export type ActionDefinition = ActionDefinitionJson
  /** @deprecated Use SpawnDefinitionJson instead */
  export type SpawnDefinition = SpawnDefinitionJson
  /** @deprecated Use StatusEffectDefinitionJson instead */
  export type StatusEffectDefinition = StatusEffectDefinitionJson
  /** @deprecated Use CharacterStateJson instead */
  export type CharacterState = CharacterStateJson
  /** @deprecated Use SpawnStateJson instead */
  export type SpawnState = SpawnStateJson
  /** @deprecated Use StatusEffectStateJson instead */
  export type StatusEffectState = StatusEffectStateJson

  /**
   * Fixed-point value representation
   * All Fixed-point values in the game engine are represented as [numerator, denominator] pairs
   * to maintain deterministic behavior across different platforms and JavaScript environments.
   *
   * Example: The value 1.5 would be represented as [3, 2] (3/2 = 1.5)
   * Example: The value 0.25 would be represented as [1, 4] (1/4 = 0.25)
   *
   * This ensures exact mathematical precision and prevents floating-point rounding errors
   * that could cause desynchronization in multiplayer or replay systems.
   */
  export type FixedPointPair = [number, number] // [numerator, denominator]

  /**
   * 2D Fixed-point position/velocity representation
   * Each axis is represented as a [numerator, denominator] pair for deterministic calculations
   */
  export type FixedPoint2D = [[number, number], [number, number]] // [[x_num, x_den], [y_num, y_den]]
}
