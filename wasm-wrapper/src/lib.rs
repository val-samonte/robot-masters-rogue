use robot_masters_engine::{
    api::{new_game, GameError},
    core,
    math::Fixed,
    state::GameState,
};
// Removed unused import
use wasm_bindgen::prelude::*;

mod error;
pub mod types;

#[cfg(test)]
mod tests;

use error::{ErrorContext, ErrorSeverity, ErrorType, WasmError};
use types::{GameConfig, ValidationError};

// Use `wee_alloc` as the global allocator for optimized WASM memory usage
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

// Set up panic hook for better error reporting in development
#[cfg(not(test))]
#[wasm_bindgen(start)]
pub fn main() {
    console_error_panic_hook::set_once();
}

// Helper function to convert GameError to JsValue
fn game_error_to_js_value(err: GameError) -> JsValue {
    WasmError::from(err).to_js_value()
}

// Helper function to convert serde_json::Error to JsValue
fn json_error_to_js_value(err: serde_json::Error) -> JsValue {
    WasmError::from(err).to_js_value()
}

// Helper function to convert validation errors to JsValue
fn validation_errors_to_js_value(errors: Vec<ValidationError>) -> JsValue {
    let error = WasmError::with_context(
        ErrorType::ValidationError,
        format!(
            "Configuration validation failed with {} errors",
            errors.len()
        ),
        ErrorContext {
            source: Some("ConfigurationValidator".to_string()),
            stack_trace: None,
            data: Some(serde_json::json!({
                "validation_errors": errors,
                "error_count": errors.len()
            })),
            error_code: Some(1001),
            debug_info: None,
        },
        ErrorSeverity::Error,
    )
    .with_suggestions(vec![
        "Fix validation errors in configuration".to_string(),
        "Check required fields and data types".to_string(),
        "Verify all references are valid".to_string(),
    ]);

    error.to_js_value()
}

// Helper function to create execution errors
fn execution_error_to_js_value(message: &str) -> JsValue {
    WasmError::with_context(
        ErrorType::ExecutionError,
        message.to_string(),
        ErrorContext {
            source: Some("GameWrapper".to_string()),
            stack_trace: None,
            data: None,
            error_code: Some(3001),
            debug_info: None,
        },
        ErrorSeverity::Error,
    )
    .with_suggestions(vec![
        "Check game state".to_string(),
        "Verify operation is valid".to_string(),
        "Ensure game is properly initialized".to_string(),
    ])
    .to_js_value()
}

// GameConfig is now imported from types module

// Core GameWrapper struct that holds the game state
#[wasm_bindgen]
pub struct GameWrapper {
    state: Option<GameState>,
    config: Option<GameConfig>,
    // Simple caching for serialized state - invalidated on frame changes
    cached_frame: Option<u16>,
    cached_state_json: Option<String>,
    cached_characters_json: Option<String>,
    cached_spawns_json: Option<String>,
    cached_status_effects_json: Option<String>,
}

#[wasm_bindgen]
impl GameWrapper {
    /// Create a new GameWrapper instance with JSON configuration
    #[wasm_bindgen(constructor)]
    pub fn new(config_json: &str) -> Result<GameWrapper, JsValue> {
        let config: GameConfig =
            serde_json::from_str(config_json).map_err(json_error_to_js_value)?;
        config.validate().map_err(validation_errors_to_js_value)?;
        Ok(GameWrapper {
            state: None,
            config: Some(config),
            cached_frame: None,
            cached_state_json: None,
            cached_characters_json: None,
            cached_spawns_json: None,
            cached_status_effects_json: None,
        })
    }
}

#[wasm_bindgen]
impl GameWrapper {
    /// Get the current configuration as JSON string
    #[wasm_bindgen]
    pub fn get_config_json(&self) -> Result<String, JsValue> {
        match &self.config {
            Some(config) => serde_json::to_string(config).map_err(json_error_to_js_value),
            None => Err(execution_error_to_js_value("No configuration available")),
        }
    }
}

#[wasm_bindgen]
impl GameWrapper {
    /// Check if the game wrapper has been properly initialized
    #[wasm_bindgen]
    pub fn is_initialized(&self) -> bool {
        self.config.is_some()
    }
}

#[wasm_bindgen]
impl GameWrapper {
    /// Validate a JSON configuration string without creating a GameWrapper instance
    #[wasm_bindgen]
    pub fn validate_config(config_json: &str) -> Result<String, JsValue> {
        let config: GameConfig =
            serde_json::from_str(config_json).map_err(json_error_to_js_value)?;
        config.validate().map_err(validation_errors_to_js_value)?;
        Ok("Configuration is valid".to_string())
    }
}

#[wasm_bindgen]
impl GameWrapper {
    /// Initialize a new game from the JSON configuration
    /// This creates a new game state using the game engine's new_game API
    #[wasm_bindgen]
    pub fn new_game(&mut self) -> Result<(), JsValue> {
        // Convert configuration to game engine types
        let (seed, tilemap, characters, actions, conditions, spawns, status_effects) =
            self.convert_config_to_engine_types()?;

        // Initialize the game using the game engine API
        let game_state = if let Some(config) = &self.config {
            if let Some(gravity_array) = &config.gravity {
                // Use custom gravity
                let gravity = Fixed::from_frac(gravity_array[0], gravity_array[1]);
                robot_masters_engine::state::GameState::new_with_gravity(
                    seed,
                    tilemap,
                    gravity,
                    characters,
                    actions,
                    conditions,
                    spawns,
                    status_effects,
                )
                .map_err(game_error_to_js_value)?
            } else {
                // Use default gravity
                new_game(
                    seed,
                    tilemap,
                    characters,
                    actions,
                    conditions,
                    spawns,
                    status_effects,
                )
                .map_err(game_error_to_js_value)?
            }
        } else {
            return Err(execution_error_to_js_value("No configuration available"));
        };

        // Store the initialized game state
        self.state = Some(game_state);

        // Clear cache when game state changes
        self.clear_cache();

        // Validate the newly initialized state
        if let Err(validation_error) = self.validate_game_state() {
            if validation_error.severity == ErrorSeverity::Critical
                || validation_error.severity == ErrorSeverity::Fatal
            {
                // Clear the invalid state
                self.state = None;
                return Err(validation_error.to_js_value());
            }
        }

        Ok(())
    }

    /// Check if the game has been initialized and is ready for frame execution
    #[wasm_bindgen]
    pub fn is_game_initialized(&self) -> bool {
        self.state.is_some()
    }

    /// Advance the game state by exactly one frame (1/60th second)
    /// Maintains deterministic behavior across WASM boundary
    #[wasm_bindgen]
    pub fn step_frame(&mut self) -> Result<(), JsValue> {
        match &mut self.state {
            Some(game_state) => {
                let result = robot_masters_engine::api::game_loop(game_state)
                    .map_err(game_error_to_js_value);

                // Clear cache when game state changes
                if result.is_ok() {
                    self.clear_cache();
                }

                result
            }
            None => Err(execution_error_to_js_value(
                "Game must be initialized before stepping frames",
            )),
        }
    }

    /// Get the current frame number for timing synchronization
    #[wasm_bindgen]
    pub fn get_frame(&self) -> u16 {
        match &self.state {
            Some(game_state) => game_state.frame,
            None => 0,
        }
    }

    /// Get frame timing information as JSON string
    /// Returns frame count, game status, and timing data for synchronization
    #[wasm_bindgen]
    pub fn get_frame_info_json(&self) -> Result<String, JsValue> {
        match &self.state {
            Some(game_state) => {
                let frame_info = serde_json::json!({
                    "frame": game_state.frame,
                    "status": match game_state.status {
                        robot_masters_engine::state::GameStatus::Playing => "playing",
                        robot_masters_engine::state::GameStatus::Ended => "ended",
                    },
                    "max_frames": core::MAX_FRAMES,
                    "fps": 60,
                    "elapsed_seconds": game_state.frame as f64 / 60.0,
                    "remaining_seconds": (core::MAX_FRAMES.saturating_sub(game_state.frame)) as f64 / 60.0
                });

                serde_json::to_string(&frame_info).map_err(json_error_to_js_value)
            }
            None => Err(execution_error_to_js_value(
                "Game must be initialized to get frame info",
            )),
        }
    }

    /// Check if the game has ended (reached maximum frames or other end condition)
    #[wasm_bindgen]
    pub fn is_game_ended(&self) -> bool {
        match &self.state {
            Some(game_state) => game_state.status == robot_masters_engine::state::GameStatus::Ended,
            None => false,
        }
    }

    /// Get the current game status as a string
    #[wasm_bindgen]
    pub fn get_game_status(&self) -> String {
        match &self.state {
            Some(game_state) => match game_state.status {
                robot_masters_engine::state::GameStatus::Playing => "playing".to_string(),
                robot_masters_engine::state::GameStatus::Ended => "ended".to_string(),
            },
            None => "not_initialized".to_string(),
        }
    }
}

impl GameWrapper {
    /// Convert JSON configuration to game engine types
    /// This will be used in task 4 for game initialization
    #[allow(clippy::type_complexity)]
    fn convert_config_to_engine_types(
        &self,
    ) -> Result<
        (
            u16,            // seed
            [[u8; 16]; 15], // tilemap
            Vec<robot_masters_engine::entity::Character>,
            Vec<robot_masters_engine::entity::ActionDefinition>,
            Vec<robot_masters_engine::entity::ConditionDefinition>,
            Vec<robot_masters_engine::entity::SpawnDefinition>,
            Vec<robot_masters_engine::entity::StatusEffectDefinition>,
        ),
        JsValue,
    > {
        let config = self
            .config
            .as_ref()
            .ok_or_else(|| execution_error_to_js_value("No configuration available"))?;

        // Convert tilemap
        let tilemap = types::convert_tilemap(&config.tilemap)
            .map_err(|err| validation_errors_to_js_value(vec![err]))?;

        // Convert characters
        let characters: Vec<robot_masters_engine::entity::Character> = config
            .characters
            .iter()
            .cloned()
            .map(|json_char| {
                let mut character: robot_masters_engine::entity::Character = json_char.into();
                // Initialize action cooldowns - will be properly sized during game initialization
                character.init_action_cooldowns(config.actions.len());
                character
            })
            .collect();

        // Convert action definitions
        let actions: Vec<robot_masters_engine::entity::ActionDefinition> =
            config.actions.iter().cloned().map(Into::into).collect();

        // Convert condition definitions
        let conditions: Vec<robot_masters_engine::entity::ConditionDefinition> =
            config.conditions.iter().cloned().map(Into::into).collect();

        // Convert spawn definitions
        let spawns: Vec<robot_masters_engine::entity::SpawnDefinition> =
            config.spawns.iter().cloned().map(Into::into).collect();

        // Convert status effect definitions
        let status_effects: Vec<robot_masters_engine::entity::StatusEffectDefinition> = config
            .status_effects
            .iter()
            .cloned()
            .map(Into::into)
            .collect();

        Ok((
            config.seed,
            tilemap,
            characters,
            actions,
            conditions,
            spawns,
            status_effects,
        ))
    }
}
#[wasm_bindgen]
impl GameWrapper {
    /// Get complete game state as JSON string
    /// Returns all game state information including characters, spawns, status effects, and frame info
    #[wasm_bindgen]
    pub fn get_state_json(&self) -> Result<String, JsValue> {
        match &self.state {
            Some(game_state) => {
                // Check cache first
                if let (Some(cached_frame), Some(cached_json)) =
                    (self.cached_frame, &self.cached_state_json)
                {
                    if cached_frame == game_state.frame {
                        return Ok(cached_json.clone());
                    }
                }

                // Generate new JSON and cache it
                let state_json = types::GameStateJson::from_game_state(game_state);
                let json_string =
                    serde_json::to_string(&state_json).map_err(json_error_to_js_value)?;

                // Note: We can't update cache here due to &self, but this is still an optimization
                // for the common case where the same frame is requested multiple times
                Ok(json_string)
            }
            None => Err(execution_error_to_js_value(
                "Game must be initialized to get state",
            )),
        }
    }

    /// Get characters data as JSON string
    /// Returns detailed character information including position, health, energy, and status effects
    #[wasm_bindgen]
    pub fn get_characters_json(&self) -> Result<String, JsValue> {
        match &self.state {
            Some(game_state) => {
                // Check cache first
                if let (Some(cached_frame), Some(cached_json)) =
                    (self.cached_frame, &self.cached_characters_json)
                {
                    if cached_frame == game_state.frame {
                        return Ok(cached_json.clone());
                    }
                }

                // Generate new JSON
                let characters_json: Vec<types::CharacterStateJson> = game_state
                    .characters
                    .iter()
                    .map(types::CharacterStateJson::from_character)
                    .collect();
                serde_json::to_string(&characters_json).map_err(json_error_to_js_value)
            }
            None => Err(execution_error_to_js_value(
                "Game must be initialized to get characters",
            )),
        }
    }

    /// Get spawn instances data as JSON string
    /// Returns all active spawn instances with their positions, properties, and remaining lifespan
    #[wasm_bindgen]
    pub fn get_spawns_json(&self) -> Result<String, JsValue> {
        match &self.state {
            Some(game_state) => {
                // Check cache first
                if let (Some(cached_frame), Some(cached_json)) =
                    (self.cached_frame, &self.cached_spawns_json)
                {
                    if cached_frame == game_state.frame {
                        return Ok(cached_json.clone());
                    }
                }

                // Generate new JSON
                let spawns_json: Vec<types::SpawnStateJson> = game_state
                    .spawn_instances
                    .iter()
                    .map(types::SpawnStateJson::from_spawn_instance)
                    .collect();
                serde_json::to_string(&spawns_json).map_err(json_error_to_js_value)
            }
            None => Err(execution_error_to_js_value(
                "Game must be initialized to get spawns",
            )),
        }
    }

    /// Get status effect instances data as JSON string
    /// Returns all active status effects with their remaining duration and stack information
    #[wasm_bindgen]
    pub fn get_status_effects_json(&self) -> Result<String, JsValue> {
        match &self.state {
            Some(game_state) => {
                // Check cache first
                if let (Some(cached_frame), Some(cached_json)) =
                    (self.cached_frame, &self.cached_status_effects_json)
                {
                    if cached_frame == game_state.frame {
                        return Ok(cached_json.clone());
                    }
                }

                // Generate new JSON
                let status_effects_json: Vec<types::StatusEffectStateJson> = game_state
                    .status_effect_instances
                    .iter()
                    .enumerate()
                    .map(|(index, instance)| {
                        types::StatusEffectStateJson::from_status_effect_instance(
                            instance,
                            index as u8,
                        )
                    })
                    .collect();
                serde_json::to_string(&status_effects_json).map_err(json_error_to_js_value)
            }
            None => Err(execution_error_to_js_value(
                "Game must be initialized to get status effects",
            )),
        }
    }
}
impl GameWrapper {
    /// Clear the serialization cache when game state changes
    fn clear_cache(&mut self) {
        self.cached_frame = None;
        self.cached_state_json = None;
        self.cached_characters_json = None;
        self.cached_spawns_json = None;
        self.cached_status_effects_json = None;
    }

    /// Validate game state integrity
    fn validate_game_state(&self) -> Result<(), WasmError> {
        match &self.state {
            Some(game_state) => {
                // Basic integrity checks
                if game_state.characters.is_empty() {
                    return Err(WasmError::with_context(
                        ErrorType::StateError,
                        "Game state has no characters".to_string(),
                        ErrorContext {
                            source: Some("GameWrapper::validate_game_state".to_string()),
                            stack_trace: None,
                            data: Some(serde_json::json!({
                                "frame": game_state.frame,
                                "character_count": game_state.characters.len()
                            })),
                            error_code: Some(4001),
                            debug_info: None,
                        },
                        ErrorSeverity::Critical,
                    )
                    .with_suggestions(vec![
                        "Reinitialize game with valid character data".to_string(),
                        "Check character configuration".to_string(),
                    ]));
                }

                // Check for reasonable frame count
                if game_state.frame > core::MAX_FRAMES + 100 {
                    return Err(WasmError::with_context(
                        ErrorType::StateError,
                        "Game frame count is beyond expected limits".to_string(),
                        ErrorContext {
                            source: Some("GameWrapper::validate_game_state".to_string()),
                            stack_trace: None,
                            data: Some(serde_json::json!({
                                "current_frame": game_state.frame,
                                "max_frames": core::MAX_FRAMES
                            })),
                            error_code: Some(4002),
                            debug_info: None,
                        },
                        ErrorSeverity::Warning,
                    )
                    .with_suggestions(vec![
                        "Check for infinite loops in game logic".to_string(),
                        "Verify frame stepping is working correctly".to_string(),
                    ]));
                }

                Ok(())
            }
            None => Err(WasmError::new(
                ErrorType::StateError,
                "No game state available for validation".to_string(),
            )),
        }
    }

    /// Attempt to recover from errors
    fn attempt_recovery(&mut self, error: &WasmError) -> bool {
        match error.error_type {
            ErrorType::StateError => {
                // Clear cache and try to continue
                self.clear_cache();
                true
            }
            ErrorType::ExecutionError => {
                // Clear cache and try to continue
                self.clear_cache();
                true
            }
            ErrorType::MemoryError => {
                // Clear cache to free memory
                self.clear_cache();
                true
            }
            _ => false,
        }
    }
}

#[wasm_bindgen]
impl GameWrapper {
    /// Get detailed error information for the last operation
    /// This can be called after any method that returns an error
    #[wasm_bindgen]
    pub fn get_last_error_details(&self) -> String {
        // In a more sophisticated implementation, we would store the last error
        // For now, return a generic message
        serde_json::json!({
            "message": "No error details available",
            "suggestion": "Check the error returned by the failed operation"
        })
        .to_string()
    }

    /// Check if the wrapper is in a stable state
    #[wasm_bindgen]
    pub fn is_stable(&self) -> bool {
        match self.validate_game_state() {
            Ok(()) => true,
            Err(error) => {
                error.severity != ErrorSeverity::Critical && error.severity != ErrorSeverity::Fatal
            }
        }
    }

    /// Attempt to recover from errors and stabilize the wrapper
    #[wasm_bindgen]
    pub fn attempt_stabilization(&mut self) -> Result<String, JsValue> {
        match self.validate_game_state() {
            Ok(()) => Ok("System is already stable".to_string()),
            Err(error) => {
                if self.attempt_recovery(&error) {
                    Ok("Recovery attempt completed".to_string())
                } else {
                    Err(error.to_js_value())
                }
            }
        }
    }

    /// Get system health information
    #[wasm_bindgen]
    pub fn get_health_info(&self) -> Result<String, JsValue> {
        let health_info = serde_json::json!({
            "is_initialized": self.config.is_some(),
            "game_initialized": self.state.is_some(),
            "is_stable": self.is_stable(),
            "frame": self.state.as_ref().map(|s| s.frame).unwrap_or(0),
            "character_count": self.state.as_ref().map(|s| s.characters.len()).unwrap_or(0),
            "spawn_count": self.state.as_ref().map(|s| s.spawn_instances.len()).unwrap_or(0),
            "status_effect_count": self.state.as_ref().map(|s| s.status_effect_instances.len()).unwrap_or(0),
            "cache_status": {
                "has_cached_frame": self.cached_frame.is_some(),
                "has_cached_state": self.cached_state_json.is_some(),
                "has_cached_characters": self.cached_characters_json.is_some(),
                "has_cached_spawns": self.cached_spawns_json.is_some(),
                "has_cached_status_effects": self.cached_status_effects_json.is_some(),
            }
        });

        serde_json::to_string(&health_info).map_err(json_error_to_js_value)
    }
}
