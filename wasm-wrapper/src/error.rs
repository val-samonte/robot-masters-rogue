//! Comprehensive error handling for WASM wrapper

use robot_masters_engine::api::GameError;
use serde::{Deserialize, Serialize};
use wasm_bindgen::prelude::*;

/// Comprehensive error information for JavaScript consumption
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct WasmError {
    /// Error category for programmatic handling
    pub error_type: ErrorType,
    /// Human-readable error message
    pub message: String,
    /// Additional context and debugging information
    pub context: Option<ErrorContext>,
    /// Error severity level
    pub severity: ErrorSeverity,
    /// Suggested recovery actions
    pub recovery_suggestions: Vec<String>,
    /// Timestamp when error occurred
    pub timestamp: u64,
}

/// Error categories for programmatic handling
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub enum ErrorType {
    // Configuration errors
    ConfigurationError,
    ValidationError,
    SerializationError,

    // Game engine errors
    GameEngineError,
    ScriptError,
    StateError,

    // Runtime errors
    InitializationError,
    ExecutionError,
    MemoryError,

    // System errors
    SystemError,
    UnknownError,
}

/// Error severity levels
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub enum ErrorSeverity {
    /// Informational - operation succeeded with warnings
    Info,
    /// Warning - operation succeeded but with issues
    Warning,
    /// Error - operation failed but system is stable
    Error,
    /// Critical - operation failed and system may be unstable
    Critical,
    /// Fatal - system is in an unrecoverable state
    Fatal,
}

/// Additional error context for debugging
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ErrorContext {
    /// Source location where error occurred
    pub source: Option<String>,
    /// Stack trace or call chain
    pub stack_trace: Option<Vec<String>>,
    /// Related data that caused the error
    pub data: Option<serde_json::Value>,
    /// Internal error code
    pub error_code: Option<u32>,
    /// Additional debugging information
    pub debug_info: Option<serde_json::Value>,
}

impl WasmError {
    /// Create a new error with minimal information
    pub fn new(error_type: ErrorType, message: String) -> Self {
        Self {
            error_type,
            message,
            context: None,
            severity: ErrorSeverity::Error,
            recovery_suggestions: Vec::new(),
            timestamp: js_sys::Date::now() as u64,
        }
    }

    /// Create an error with full context
    pub fn with_context(
        error_type: ErrorType,
        message: String,
        context: ErrorContext,
        severity: ErrorSeverity,
    ) -> Self {
        let mut error = Self::new(error_type, message);
        error.context = Some(context);
        error.severity = severity;
        error
    }

    /// Add recovery suggestions
    pub fn with_suggestions(mut self, suggestions: Vec<String>) -> Self {
        self.recovery_suggestions = suggestions;
        self
    }

    /// Convert to JsValue for JavaScript consumption
    pub fn to_js_value(&self) -> JsValue {
        match serde_json::to_string(self) {
            Ok(json) => JsValue::from_str(&json),
            Err(_) => {
                // Fallback error if serialization fails
                let fallback = r#"{"error_type":"SerializationError","message":"Failed to serialize error","context":null,"severity":"Critical","recovery_suggestions":[],"timestamp":0}"#;
                JsValue::from_str(fallback)
            }
        }
    }
}

/// Convert GameError to comprehensive WasmError
impl From<GameError> for WasmError {
    fn from(err: GameError) -> Self {
        let (message, suggestions, severity) = match err {
            GameError::InvalidScript => (
                "Invalid script provided - script contains invalid bytecode or structure"
                    .to_string(),
                vec![
                    "Check script syntax and structure".to_string(),
                    "Verify all operators are valid".to_string(),
                    "Ensure script length is within limits".to_string(),
                ],
                ErrorSeverity::Error,
            ),
            GameError::ScriptExecutionError => (
                "Script execution failed during runtime".to_string(),
                vec![
                    "Check script logic for infinite loops".to_string(),
                    "Verify variable indices are within bounds".to_string(),
                    "Ensure all required properties are accessible".to_string(),
                ],
                ErrorSeverity::Error,
            ),
            GameError::InvalidOperator => (
                "Invalid operator encountered in script".to_string(),
                vec![
                    "Use only supported script operators".to_string(),
                    "Check operator parameter counts".to_string(),
                    "Verify operator is appropriate for context".to_string(),
                ],
                ErrorSeverity::Error,
            ),
            GameError::ScriptIndexOutOfBounds => (
                "Script attempted to access invalid memory location".to_string(),
                vec![
                    "Check array and variable indices".to_string(),
                    "Ensure script doesn't exceed memory limits".to_string(),
                    "Verify script length calculations".to_string(),
                ],
                ErrorSeverity::Error,
            ),
            GameError::InvalidGameState => (
                "Game state is corrupted or invalid".to_string(),
                vec![
                    "Reinitialize the game".to_string(),
                    "Check for memory corruption".to_string(),
                    "Verify game configuration is valid".to_string(),
                ],
                ErrorSeverity::Critical,
            ),
            GameError::InvalidCharacterData => (
                "Character data is malformed or invalid".to_string(),
                vec![
                    "Check character configuration format".to_string(),
                    "Verify all required fields are present".to_string(),
                    "Ensure numeric values are within valid ranges".to_string(),
                ],
                ErrorSeverity::Error,
            ),
            GameError::InvalidSpawnData => (
                "Spawn data is malformed or invalid".to_string(),
                vec![
                    "Check spawn configuration format".to_string(),
                    "Verify spawn references are valid".to_string(),
                    "Ensure spawn parameters are within limits".to_string(),
                ],
                ErrorSeverity::Error,
            ),
            GameError::InvalidTilemap => (
                "Tilemap data is invalid or corrupted".to_string(),
                vec![
                    "Check tilemap dimensions (must be 15x16)".to_string(),
                    "Verify tile values are valid".to_string(),
                    "Ensure tilemap array structure is correct".to_string(),
                ],
                ErrorSeverity::Error,
            ),
            GameError::EntityNotFound => (
                "Referenced entity does not exist".to_string(),
                vec![
                    "Check entity ID references".to_string(),
                    "Verify entity was properly created".to_string(),
                    "Ensure entity hasn't been destroyed".to_string(),
                ],
                ErrorSeverity::Warning,
            ),
            GameError::InvalidEntityId => (
                "Entity ID is out of valid range".to_string(),
                vec![
                    "Use valid entity ID range".to_string(),
                    "Check for ID overflow or underflow".to_string(),
                    "Verify entity creation was successful".to_string(),
                ],
                ErrorSeverity::Error,
            ),
            GameError::InvalidPropertyAddress => (
                "Property address is not recognized".to_string(),
                vec![
                    "Use valid property addresses from constants".to_string(),
                    "Check property is available for entity type".to_string(),
                    "Verify property access permissions".to_string(),
                ],
                ErrorSeverity::Error,
            ),
            GameError::InvalidActionId => (
                "Action ID references non-existent action".to_string(),
                vec![
                    "Check action definition exists".to_string(),
                    "Verify action ID is within valid range".to_string(),
                    "Ensure action was properly registered".to_string(),
                ],
                ErrorSeverity::Error,
            ),
            GameError::InvalidConditionId => (
                "Condition ID references non-existent condition".to_string(),
                vec![
                    "Check condition definition exists".to_string(),
                    "Verify condition ID is within valid range".to_string(),
                    "Ensure condition was properly registered".to_string(),
                ],
                ErrorSeverity::Error,
            ),
            GameError::InvalidStatusEffectId => (
                "Status effect ID references non-existent effect".to_string(),
                vec![
                    "Check status effect definition exists".to_string(),
                    "Verify status effect ID is within valid range".to_string(),
                    "Ensure status effect was properly registered".to_string(),
                ],
                ErrorSeverity::Error,
            ),
            GameError::InvalidSpawnId => (
                "Spawn ID references non-existent spawn definition".to_string(),
                vec![
                    "Check spawn definition exists".to_string(),
                    "Verify spawn ID is within valid range".to_string(),
                    "Ensure spawn was properly registered".to_string(),
                ],
                ErrorSeverity::Error,
            ),
            GameError::CircularReference => (
                "Circular reference detected in game definitions".to_string(),
                vec![
                    "Remove circular dependencies in definitions".to_string(),
                    "Check spawn and action references".to_string(),
                    "Verify definition dependency graph is acyclic".to_string(),
                ],
                ErrorSeverity::Critical,
            ),
            GameError::MissingDefinition => (
                "Required definition is missing from configuration".to_string(),
                vec![
                    "Add missing definition to configuration".to_string(),
                    "Check all references have corresponding definitions".to_string(),
                    "Verify configuration completeness".to_string(),
                ],
                ErrorSeverity::Error,
            ),
            GameError::ActionDefinitionNotFound => (
                "Action definition not found in registry".to_string(),
                vec![
                    "Add action definition to configuration".to_string(),
                    "Check action ID references".to_string(),
                    "Verify action registration was successful".to_string(),
                ],
                ErrorSeverity::Error,
            ),
            GameError::ConditionDefinitionNotFound => (
                "Condition definition not found in registry".to_string(),
                vec![
                    "Add condition definition to configuration".to_string(),
                    "Check condition ID references".to_string(),
                    "Verify condition registration was successful".to_string(),
                ],
                ErrorSeverity::Error,
            ),
            GameError::StatusEffectDefinitionNotFound => (
                "Status effect definition not found in registry".to_string(),
                vec![
                    "Add status effect definition to configuration".to_string(),
                    "Check status effect ID references".to_string(),
                    "Verify status effect registration was successful".to_string(),
                ],
                ErrorSeverity::Error,
            ),
            GameError::SpawnDefinitionNotFound => (
                "Spawn definition not found in registry".to_string(),
                vec![
                    "Add spawn definition to configuration".to_string(),
                    "Check spawn ID references".to_string(),
                    "Verify spawn registration was successful".to_string(),
                ],
                ErrorSeverity::Error,
            ),
            GameError::ActionInstanceNotFound => (
                "Action instance not found in runtime state".to_string(),
                vec![
                    "Check action instance lifecycle".to_string(),
                    "Verify action was properly instantiated".to_string(),
                    "Ensure action instance wasn't prematurely destroyed".to_string(),
                ],
                ErrorSeverity::Warning,
            ),
            GameError::ConditionInstanceNotFound => (
                "Condition instance not found in runtime state".to_string(),
                vec![
                    "Check condition instance lifecycle".to_string(),
                    "Verify condition was properly instantiated".to_string(),
                    "Ensure condition instance wasn't prematurely destroyed".to_string(),
                ],
                ErrorSeverity::Warning,
            ),
            GameError::StatusEffectInstanceNotFound => (
                "Status effect instance not found in runtime state".to_string(),
                vec![
                    "Check status effect instance lifecycle".to_string(),
                    "Verify status effect was properly applied".to_string(),
                    "Ensure status effect instance wasn't prematurely removed".to_string(),
                ],
                ErrorSeverity::Warning,
            ),
            GameError::InvalidInstanceId => (
                "Instance ID is invalid or out of range".to_string(),
                vec![
                    "Use valid instance ID range".to_string(),
                    "Check instance creation was successful".to_string(),
                    "Verify instance lifecycle management".to_string(),
                ],
                ErrorSeverity::Error,
            ),
            GameError::DivisionByZero => (
                "Division by zero attempted in calculation".to_string(),
                vec![
                    "Check divisor values before division".to_string(),
                    "Add zero-check guards in scripts".to_string(),
                    "Use safe division operations".to_string(),
                ],
                ErrorSeverity::Error,
            ),
            GameError::ArithmeticOverflow => (
                "Arithmetic operation resulted in overflow".to_string(),
                vec![
                    "Use smaller numeric values".to_string(),
                    "Check calculation bounds".to_string(),
                    "Consider using saturating arithmetic".to_string(),
                ],
                ErrorSeverity::Error,
            ),
            GameError::OutOfBounds => (
                "Array or collection access was out of bounds".to_string(),
                vec![
                    "Check array indices before access".to_string(),
                    "Verify collection sizes".to_string(),
                    "Add bounds checking to scripts".to_string(),
                ],
                ErrorSeverity::Error,
            ),
            GameError::InvalidInput => (
                "Input data is invalid or malformed".to_string(),
                vec![
                    "Validate input data format".to_string(),
                    "Check input data types and ranges".to_string(),
                    "Ensure input meets expected schema".to_string(),
                ],
                ErrorSeverity::Error,
            ),
        };

        WasmError::with_context(
            ErrorType::GameEngineError,
            message,
            ErrorContext {
                source: Some("GameEngine".to_string()),
                stack_trace: None,
                data: Some(serde_json::json!({
                    "game_error": format!("{:?}", err)
                })),
                error_code: Some(err as u32),
                debug_info: None,
            },
            severity,
        )
        .with_suggestions(suggestions)
    }
}

/// Convert serde_json::Error to WasmError
impl From<serde_json::Error> for WasmError {
    fn from(err: serde_json::Error) -> Self {
        WasmError::with_context(
            ErrorType::SerializationError,
            format!("JSON serialization/deserialization failed: {}", err),
            ErrorContext {
                source: Some("serde_json".to_string()),
                stack_trace: None,
                data: None,
                error_code: None,
                debug_info: Some(serde_json::json!({
                    "serde_error": err.to_string(),
                    "line": err.line(),
                    "column": err.column(),
                })),
            },
            ErrorSeverity::Error,
        )
        .with_suggestions(vec![
            "Check JSON syntax and structure".to_string(),
            "Verify all required fields are present".to_string(),
            "Ensure data types match expected schema".to_string(),
        ])
    }
}

/// Error recovery utilities
pub struct ErrorRecovery;

impl ErrorRecovery {
    /// Attempt to recover from configuration errors
    pub fn recover_configuration_error(error: &WasmError) -> Option<String> {
        match error.error_type {
            ErrorType::ConfigurationError | ErrorType::ValidationError => {
                Some("Try reloading with a valid configuration".to_string())
            }
            ErrorType::SerializationError => Some("Check JSON format and try again".to_string()),
            _ => None,
        }
    }

    /// Check if error is recoverable
    pub fn is_recoverable(error: &WasmError) -> bool {
        match error.severity {
            ErrorSeverity::Info | ErrorSeverity::Warning | ErrorSeverity::Error => true,
            ErrorSeverity::Critical | ErrorSeverity::Fatal => false,
        }
    }

    /// Get suggested next action for error
    pub fn get_next_action(error: &WasmError) -> String {
        if !error.recovery_suggestions.is_empty() {
            error.recovery_suggestions[0].clone()
        } else {
            match error.error_type {
                ErrorType::ConfigurationError => "Fix configuration and retry".to_string(),
                ErrorType::GameEngineError => "Check game state and retry operation".to_string(),
                ErrorType::InitializationError => "Reinitialize the game".to_string(),
                _ => "Check error details and retry".to_string(),
            }
        }
    }
}
