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
                let game_error = crate::api::GameError::from(script_error);
                crate::error::ErrorRecovery::handle_script_error(game_error)
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
