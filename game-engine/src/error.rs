//! Error handling utilities and recovery strategies

use crate::api::{GameError, GameResult};

/// Error recovery strategies for different types of failures
pub struct ErrorRecovery;

impl ErrorRecovery {
    /// Handle script execution errors gracefully
    /// Returns a safe default exit code when script execution fails
    pub fn handle_script_error(error: GameError) -> u8 {
        match error {
            GameError::InvalidScript => 255, // Exit with max value to indicate failure
            GameError::ScriptExecutionError => 254,
            GameError::InvalidOperator => 253,
            GameError::ScriptIndexOutOfBounds => 252,
            _ => 251, // Generic script error
        }
    }

    /// Handle serialization errors with recovery options
    pub fn handle_serialization_error(error: GameError) -> GameResult<()> {
        match error {
            GameError::SerializationError => {
                // Log error but continue execution
                // Note: In no_std environment, we can't use eprintln!
                // Error logging would be handled by the platform-specific wrapper
                Ok(())
            }
            GameError::DeserializationError => {
                // Cannot recover from deserialization errors
                Err(GameError::DeserializationError)
            }
            GameError::InvalidBinaryData => {
                // Cannot recover from corrupted data
                Err(GameError::InvalidBinaryData)
            }
            GameError::DataTooShort => {
                // Cannot recover from incomplete data
                Err(GameError::DataTooShort)
            }
            _ => Err(error),
        }
    }

    /// Validate game state integrity and attempt recovery
    pub fn validate_and_recover_game_state(
        characters: &mut alloc::vec::Vec<crate::entity::Character>,
        spawn_instances: &mut alloc::vec::Vec<crate::entity::SpawnInstance>,
    ) -> GameResult<()> {
        // Validate character data
        for character in characters.iter_mut() {
            // Health, energy, and armor values are u8, so they're already within valid bounds (0-255)
            // This validation is mainly for position bounds and other constraints

            // Validate position bounds (assuming 256x240 game area)
            let max_x = crate::math::Fixed::from_int(256);
            let max_y = crate::math::Fixed::from_int(240);
            let min_pos = crate::math::Fixed::from_int(-128); // Allow some off-screen movement

            if character.core.pos.0 > max_x {
                character.core.pos.0 = max_x;
            } else if character.core.pos.0 < min_pos {
                character.core.pos.0 = min_pos;
            }

            if character.core.pos.1 > max_y {
                character.core.pos.1 = max_y;
            } else if character.core.pos.1 < min_pos {
                character.core.pos.1 = min_pos;
            }
        }

        // Validate spawn instances
        spawn_instances.retain(|spawn| {
            // Remove spawns with invalid lifespans
            spawn.lifespan > 0 && spawn.lifespan <= 3840 // Max game duration
        });

        Ok(())
    }

    /// Handle arithmetic errors with safe fallbacks
    pub fn handle_arithmetic_error(error: GameError) -> crate::math::Fixed {
        match error {
            GameError::DivisionByZero => crate::math::Fixed::ZERO,
            GameError::ArithmeticOverflow => crate::math::Fixed::MAX,
            _ => crate::math::Fixed::ZERO,
        }
    }

    /// Handle out of bounds errors for array access
    pub fn handle_bounds_error<T: Default>(error: GameError) -> T {
        match error {
            GameError::OutOfBounds => T::default(),
            GameError::ScriptIndexOutOfBounds => T::default(),
            _ => T::default(),
        }
    }

    /// Handle definition lookup errors gracefully during runtime
    pub fn handle_definition_lookup_error(error: GameError) -> GameResult<()> {
        match error {
            // Runtime definition lookup errors are recoverable - log and continue
            GameError::ActionDefinitionNotFound => {
                // In a real implementation, this would log the error
                // For now, we just return Ok to continue execution
                Ok(())
            }
            GameError::ConditionDefinitionNotFound => Ok(()),
            GameError::StatusEffectDefinitionNotFound => Ok(()),
            GameError::SpawnDefinitionNotFound => Ok(()),

            // Instance lookup errors are also recoverable
            GameError::ActionInstanceNotFound => Ok(()),
            GameError::ConditionInstanceNotFound => Ok(()),
            GameError::StatusEffectInstanceNotFound => Ok(()),
            GameError::InvalidInstanceId => Ok(()),

            // Other errors should be propagated
            _ => Err(error),
        }
    }

    /// Validate definition ID bounds and return safe fallback behavior
    pub fn validate_definition_id<T>(
        id: usize,
        collection: &[T],
        error_type: GameError,
    ) -> GameResult<usize> {
        if id < collection.len() {
            Ok(id)
        } else {
            Err(error_type)
        }
    }

    /// Safe definition access with error recovery
    pub fn safe_definition_access<T>(
        id: usize,
        collection: &[T],
        error_type: GameError,
    ) -> Option<&T> {
        if Self::validate_definition_id(id, collection, error_type).is_ok() {
            collection.get(id)
        } else {
            None
        }
    }

    /// Handle invalid ID references during runtime with comprehensive error reporting
    pub fn handle_invalid_id_reference(
        _id: usize,
        collection_name: &'static str,
        _collection_size: usize,
        _frame: u16,
    ) -> GameError {
        // In a production environment, this would log detailed error information
        // For now, we create appropriate error types based on collection name
        match collection_name {
            "action_definitions" => GameError::ActionDefinitionNotFound,
            "condition_definitions" => GameError::ConditionDefinitionNotFound,
            "status_effect_definitions" => GameError::StatusEffectDefinitionNotFound,
            "spawn_definitions" => GameError::SpawnDefinitionNotFound,
            "action_instances" => GameError::ActionInstanceNotFound,
            "condition_instances" => GameError::ConditionInstanceNotFound,
            "status_effect_instances" => GameError::StatusEffectInstanceNotFound,
            _ => GameError::InvalidEntityId,
        }
    }

    /// Comprehensive validation of game state integrity with error recovery
    pub fn validate_game_state_integrity(
        game_state: &crate::state::GameState,
    ) -> GameResult<alloc::vec::Vec<GameError>> {
        let mut errors = alloc::vec::Vec::new();

        // Validate definition references
        if let Err(error) = game_state.validate_definition_references() {
            errors.push(error);
        }

        // Validate circular references
        if let Err(error) = game_state.detect_runtime_circular_references() {
            errors.push(error);
        }

        // If we found errors but they're all recoverable, return them for logging
        // but don't fail the validation
        let all_recoverable = errors.iter().all(Self::is_recoverable);

        if all_recoverable {
            Ok(errors)
        } else {
            // Return the first non-recoverable error
            Err(errors
                .into_iter()
                .find(|e| !Self::is_recoverable(e))
                .unwrap_or(GameError::InvalidGameState))
        }
    }

    /// Create a safe error message for debugging (no_std compatible)
    pub fn create_error_message(error: &GameError) -> &'static str {
        match error {
            GameError::InvalidScript => "Script contains invalid bytecode",
            GameError::ScriptExecutionError => "Script execution failed",
            GameError::InvalidOperator => "Unknown script operator",
            GameError::ScriptIndexOutOfBounds => "Script index out of bounds",
            GameError::SerializationError => "Failed to serialize game state",
            GameError::DeserializationError => "Failed to deserialize game state",
            GameError::InvalidBinaryData => "Binary data is corrupted",
            GameError::DataTooShort => "Binary data is incomplete",
            GameError::InvalidGameState => "Game state is invalid",
            GameError::InvalidCharacterData => "Character data is corrupted",
            GameError::InvalidSpawnData => "Spawn data is corrupted",
            GameError::InvalidTilemap => "Tilemap data is invalid",
            GameError::EntityNotFound => "Entity not found",
            GameError::InvalidEntityId => "Entity ID is invalid",
            GameError::InvalidPropertyAddress => "Property address is invalid",
            GameError::InvalidActionId => "Action definition ID is invalid",
            GameError::InvalidConditionId => "Condition definition ID is invalid",
            GameError::InvalidStatusEffectId => "Status effect definition ID is invalid",
            GameError::InvalidSpawnId => "Spawn definition ID is invalid",
            GameError::CircularReference => "Circular reference detected in definitions",
            GameError::MissingDefinition => "Referenced definition not found",

            // Runtime definition lookup errors
            GameError::ActionDefinitionNotFound => "Action definition not found during runtime",
            GameError::ConditionDefinitionNotFound => {
                "Condition definition not found during runtime"
            }
            GameError::StatusEffectDefinitionNotFound => {
                "Status effect definition not found during runtime"
            }
            GameError::SpawnDefinitionNotFound => "Spawn definition not found during runtime",

            // Instance management errors
            GameError::ActionInstanceNotFound => "Action instance not found",
            GameError::ConditionInstanceNotFound => "Condition instance not found",
            GameError::StatusEffectInstanceNotFound => "Status effect instance not found",
            GameError::InvalidInstanceId => "Instance ID is invalid",
            GameError::DivisionByZero => "Division by zero attempted",
            GameError::ArithmeticOverflow => "Arithmetic overflow occurred",
            GameError::OutOfBounds => "Array index out of bounds",
            GameError::InvalidInput => "Invalid input provided",
        }
    }

    /// Check if an error is recoverable
    pub fn is_recoverable(error: &GameError) -> bool {
        match error {
            // Script errors are generally recoverable - we can skip the problematic script
            GameError::InvalidScript => true,
            GameError::ScriptExecutionError => true,
            GameError::InvalidOperator => true,
            GameError::ScriptIndexOutOfBounds => true,

            // Serialization errors may be recoverable depending on context
            GameError::SerializationError => true,

            // These errors are generally not recoverable
            GameError::DeserializationError => false,
            GameError::InvalidBinaryData => false,
            GameError::DataTooShort => false,

            // Game state errors may be recoverable with validation
            GameError::InvalidGameState => true,
            GameError::InvalidCharacterData => false,
            GameError::InvalidSpawnData => false,
            GameError::InvalidTilemap => false,

            // Entity errors are generally recoverable
            GameError::EntityNotFound => true,
            GameError::InvalidEntityId => true,
            GameError::InvalidPropertyAddress => true,

            // Definition validation errors are generally not recoverable during initialization
            GameError::InvalidActionId => false,
            GameError::InvalidConditionId => false,
            GameError::InvalidStatusEffectId => false,
            GameError::InvalidSpawnId => false,
            GameError::CircularReference => false,
            GameError::MissingDefinition => false,

            // Runtime definition lookup errors are recoverable - we can skip execution
            GameError::ActionDefinitionNotFound => true,
            GameError::ConditionDefinitionNotFound => true,
            GameError::StatusEffectDefinitionNotFound => true,
            GameError::SpawnDefinitionNotFound => true,

            // Instance management errors are generally recoverable
            GameError::ActionInstanceNotFound => true,
            GameError::ConditionInstanceNotFound => true,
            GameError::StatusEffectInstanceNotFound => true,
            GameError::InvalidInstanceId => true,

            // Math errors are recoverable with safe defaults
            GameError::DivisionByZero => true,
            GameError::ArithmeticOverflow => true,

            // Bounds errors are recoverable
            GameError::OutOfBounds => true,
            GameError::InvalidInput => true,
        }
    }
}

/// Macro for safe script execution with error recovery
#[macro_export]
macro_rules! safe_script_execute {
    ($script_engine:expr, $script:expr, $context:expr) => {
        match $script_engine.execute($script, $context) {
            Ok(exit_code) => exit_code,
            Err(script_error) => {
                let game_error = $crate::api::GameError::from(script_error);
                $crate::error::ErrorRecovery::handle_script_error(game_error)
            }
        }
    };
}

/// Macro for safe property access with bounds checking
#[macro_export]
macro_rules! safe_property_access {
    ($array:expr, $index:expr, $default:expr) => {{
        let arr = &$array;
        let idx = $index;
        if idx < arr.len() {
            arr[idx]
        } else {
            $default
        }
    }};
}

/// Macro for safe arithmetic operations
#[macro_export]
macro_rules! safe_arithmetic {
    ($operation:expr, $fallback:expr) => {
        match $operation {
            Ok(result) => result,
            Err(_) => $fallback,
        }
    };
}

/// Macro for safe definition lookups with error recovery
#[macro_export]
macro_rules! safe_definition_lookup {
    ($game_state:expr, $method:ident, $id:expr) => {
        match $game_state.$method($id) {
            Ok(definition) => Some(definition),
            Err(error) => {
                // Log error and continue execution
                let _ = $crate::error::ErrorRecovery::handle_definition_lookup_error(error);
                None
            }
        }
    };
}

/// Macro for safe definition access with bounds checking
#[macro_export]
macro_rules! safe_definition_access {
    ($collection:expr, $id:expr, $error_type:expr) => {
        $crate::error::ErrorRecovery::safe_definition_access($id, $collection, $error_type)
    };
}
