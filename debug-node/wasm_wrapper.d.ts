/* tslint:disable */
/* eslint-disable */
export function main(): void;
export class GameWrapper {
  free(): void;
  /**
   * Create a new GameWrapper instance with JSON configuration
   */
  constructor(config_json: string);
  /**
   * Get the current configuration as JSON string
   */
  get_config_json(): string;
  /**
   * Check if the game wrapper has been properly initialized
   */
  is_initialized(): boolean;
  /**
   * Validate a JSON configuration string without creating a GameWrapper instance
   */
  static validate_config(config_json: string): string;
  /**
   * Initialize a new game from the JSON configuration
   * This creates a new game state using the game engine's new_game API
   */
  new_game(): void;
  /**
   * Check if the game has been initialized and is ready for frame execution
   */
  is_game_initialized(): boolean;
  /**
   * Advance the game state by exactly one frame (1/60th second)
   * Maintains deterministic behavior across WASM boundary
   */
  step_frame(): void;
  /**
   * Get the current frame number for timing synchronization
   */
  get_frame(): number;
  /**
   * Get frame timing information as JSON string
   * Returns frame count, game status, and timing data for synchronization
   */
  get_frame_info_json(): string;
  /**
   * Check if the game has ended (reached maximum frames or other end condition)
   */
  is_game_ended(): boolean;
  /**
   * Get the current game status as a string
   */
  get_game_status(): string;
  /**
   * Get complete game state as JSON string
   * Returns all game state information including characters, spawns, status effects, and frame info
   */
  get_state_json(): string;
  /**
   * Get characters data as JSON string
   * Returns detailed character information including position, health, energy, and status effects
   */
  get_characters_json(): string;
  /**
   * Get spawn instances data as JSON string
   * Returns all active spawn instances with their positions, properties, and remaining lifespan
   */
  get_spawns_json(): string;
  /**
   * Get status effect instances data as JSON string
   * Returns all active status effects with their remaining duration and stack information
   */
  get_status_effects_json(): string;
  /**
   * Get detailed error information for the last operation
   * This can be called after any method that returns an error
   */
  get_last_error_details(): string;
  /**
   * Check if the wrapper is in a stable state
   */
  is_stable(): boolean;
  /**
   * Attempt to recover from errors and stabilize the wrapper
   */
  attempt_stabilization(): string;
  /**
   * Get system health information
   */
  get_health_info(): string;
}

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly main: () => void;
  readonly __wbg_gamewrapper_free: (a: number, b: number) => void;
  readonly gamewrapper_new: (a: number, b: number) => [number, number, number];
  readonly gamewrapper_get_config_json: (a: number) => [number, number, number, number];
  readonly gamewrapper_is_initialized: (a: number) => number;
  readonly gamewrapper_validate_config: (a: number, b: number) => [number, number, number, number];
  readonly gamewrapper_new_game: (a: number) => [number, number];
  readonly gamewrapper_is_game_initialized: (a: number) => number;
  readonly gamewrapper_step_frame: (a: number) => [number, number];
  readonly gamewrapper_get_frame: (a: number) => number;
  readonly gamewrapper_get_frame_info_json: (a: number) => [number, number, number, number];
  readonly gamewrapper_is_game_ended: (a: number) => number;
  readonly gamewrapper_get_game_status: (a: number) => [number, number];
  readonly gamewrapper_get_state_json: (a: number) => [number, number, number, number];
  readonly gamewrapper_get_characters_json: (a: number) => [number, number, number, number];
  readonly gamewrapper_get_spawns_json: (a: number) => [number, number, number, number];
  readonly gamewrapper_get_status_effects_json: (a: number) => [number, number, number, number];
  readonly gamewrapper_get_last_error_details: (a: number) => [number, number];
  readonly gamewrapper_is_stable: (a: number) => number;
  readonly gamewrapper_attempt_stabilization: (a: number) => [number, number, number, number];
  readonly gamewrapper_get_health_info: (a: number) => [number, number, number, number];
  readonly __wbindgen_free: (a: number, b: number, c: number) => void;
  readonly __wbindgen_malloc: (a: number, b: number) => number;
  readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
  readonly __wbindgen_export_3: WebAssembly.Table;
  readonly __externref_table_dealloc: (a: number) => void;
  readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;
/**
* Instantiates the given `module`, which can either be bytes or
* a precompiled `WebAssembly.Module`.
*
* @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
*
* @returns {InitOutput}
*/
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
*
* @returns {Promise<InitOutput>}
*/
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
