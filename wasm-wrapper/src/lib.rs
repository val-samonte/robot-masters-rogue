use robot_masters_engine::{api::GameError, state::GameState};
use serde::{Deserialize, Serialize};
use wasm_bindgen::prelude::*;

mod types;
use types::{GameConfig, ValidationError};

// Use `wee_alloc` as the global allocator for optimized WASM memory usage
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

// Set up panic hook for better error reporting in development
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
