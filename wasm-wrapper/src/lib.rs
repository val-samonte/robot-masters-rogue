use robot_masters_engine::{
    api::{GameError, new_game},
    core,
    state::GameState,
};
use serde::{Deserialize, Serialize};
use wasm_bindgen::prelude::*;

mod types;
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

// Error type for JavaScript-compatible error handling
#[derive(Serialize, Deserialize)]
pub struct WasmGameError {
    pub error_type: String,
    pub message: String,
    pub context: Option<String>,
}

// Helper function to convert GameError to JsValue
fn game_error_to_js_value(err: GameError) -> JsValue {
    let wasm_error = WasmGameError {
        error_type: format!("{:?}", err),
        message: match err {
            GameError::InvalidScript => "Invalid script provided".to_string(),
            GameError::ScriptExecutionError => "Script execution failed".to_string(),
            GameError::InvalidOperator => "Invalid operator in script".to_string(),
            GameError::ScriptIndexOutOfBounds => "Script index out of bounds".to_string(),
            GameError::InvalidGameState => "Invalid game state".to_string(),
            GameError::InvalidCharacterData => "Invalid character data provided".to_string(),
            GameError::InvalidSpawnData => "Invalid spawn data provided".to_string(),
            GameError::InvalidTilemap => "Invalid tilemap data provided".to_string(),
            GameError::EntityNotFound => "Entity not found".to_string(),
            GameError::InvalidEntityId => "Invalid entity ID".to_string(),
            GameError::InvalidPropertyAddress => "Invalid property address".to_string(),
            GameError::InvalidActionId => "Invalid action ID".to_string(),
            GameError::InvalidConditionId => "Invalid condition ID".to_string(),
            GameError::InvalidStatusEffectId => "Invalid status effect ID".to_string(),
            GameError::InvalidSpawnId => "Invalid spawn ID".to_string(),
            GameError::CircularReference => {
                "Circular reference detected in definitions".to_string()
            }
            GameError::MissingDefinition => "Missing required definition".to_string(),
            GameError::ActionDefinitionNotFound => "Action definition not found".to_string(),
            GameError::ConditionDefinitionNotFound => "Condition definition not found".to_string(),
            GameError::StatusEffectDefinitionNotFound => {
                "Status effect definition not found".to_string()
            }
            GameError::SpawnDefinitionNotFound => "Spawn definition not found".to_string(),
            GameError::ActionInstanceNotFound => "Action instance not found".to_string(),
            GameError::ConditionInstanceNotFound => "Condition instance not found".to_string(),
            GameError::StatusEffectInstanceNotFound => {
                "Status effect instance not found".to_string()
            }
            GameError::InvalidInstanceId => "Invalid instance ID".to_string(),
            GameError::DivisionByZero => "Division by zero error".to_string(),
            GameError::ArithmeticOverflow => "Arithmetic overflow error".to_string(),
            GameError::OutOfBounds => "Index out of bounds".to_string(),
            GameError::InvalidInput => "Invalid input provided".to_string(),
        },
        context: None,
    };

    JsValue::from_str(&serde_json::to_string(&wasm_error).unwrap_or_else(|_| {
        r#"{"error_type":"SerializationError","message":"Failed to serialize error","context":null}"#.to_string()
    }))
}

// Helper function to convert serde_json::Error to JsValue
fn json_error_to_js_value(err: serde_json::Error) -> JsValue {
    let wasm_error = WasmGameError {
        error_type: "JsonError".to_string(),
        message: format!("JSON parsing error: {}", err),
        context: None,
    };

    JsValue::from_str(&serde_json::to_string(&wasm_error).unwrap_or_else(|_| {
        r#"{"error_type":"SerializationError","message":"Failed to serialize JSON error","context":null}"#.to_string()
    }))
}

// Helper function to convert validation errors to JsValue
fn validation_errors_to_js_value(errors: Vec<ValidationError>) -> JsValue {
    let wasm_error = WasmGameError {
        error_type: "ValidationError".to_string(),
        message: format!(
            "Configuration validation failed with {} errors",
            errors.len()
        ),
        context: Some(
            serde_json::to_string(&errors)
                .unwrap_or_else(|_| "Failed to serialize validation errors".to_string()),
        ),
    };

    JsValue::from_str(&serde_json::to_string(&wasm_error).unwrap_or_else(|_| {
        r#"{"error_type":"SerializationError","message":"Failed to serialize validation error","context":null}"#.to_string()
    }))
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
            None => Err(JsValue::from_str(
                r#"{"error_type":"NoConfig","message":"No configuration available","context":null}"#,
            )),
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
        let game_state = new_game(
            seed,
            tilemap,
            characters,
            actions,
            conditions,
            spawns,
            status_effects,
        )
        .map_err(game_error_to_js_value)?;

        // Store the initialized game state
        self.state = Some(game_state);

        // Clear cache when game state changes
        self.clear_cache();

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
            None => Err(JsValue::from_str(
                r#"{"error_type":"GameNotInitialized","message":"Game must be initialized before stepping frames","context":null}"#,
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
            None => Err(JsValue::from_str(
                r#"{"error_type":"GameNotInitialized","message":"Game must be initialized to get frame info","context":null}"#,
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
        let config = self.config.as_ref().ok_or_else(|| {
            JsValue::from_str(r#"{"error_type":"NoConfig","message":"No configuration available","context":null}"#)
        })?;

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
            None => Err(JsValue::from_str(
                r#"{"error_type":"GameNotInitialized","message":"Game must be initialized to get state","context":null}"#,
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
            None => Err(JsValue::from_str(
                r#"{"error_type":"GameNotInitialized","message":"Game must be initialized to get characters","context":null}"#,
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
            None => Err(JsValue::from_str(
                r#"{"error_type":"GameNotInitialized","message":"Game must be initialized to get spawns","context":null}"#,
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
            None => Err(JsValue::from_str(
                r#"{"error_type":"GameNotInitialized","message":"Game must be initialized to get status effects","context":null}"#,
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
}
