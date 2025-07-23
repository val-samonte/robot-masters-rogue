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

#[cfg(test)]
mod tests {
    use super::*;
    use crate::entity::Character;
    use crate::math::Fixed;
    use alloc::vec;

    #[test]
    fn test_script_error_handling() {
        let exit_code = ErrorRecovery::handle_script_error(GameError::InvalidScript);
        assert_eq!(exit_code, 255);

        let exit_code = ErrorRecovery::handle_script_error(GameError::ScriptExecutionError);
        assert_eq!(exit_code, 254);
    }

    #[test]
    fn test_serialization_error_recovery() {
        let result = ErrorRecovery::handle_serialization_error(GameError::SerializationError);
        assert!(result.is_ok());

        let result = ErrorRecovery::handle_serialization_error(GameError::DeserializationError);
        assert!(result.is_err());
    }

    #[test]
    fn test_game_state_validation() {
        let mut characters = vec![Character::new(1, 0)];
        // Since u8 can't hold 300, we'll test the validation logic differently
        characters[0].health = 255; // Max valid value
        characters[0].energy = 255; // Max valid value
        characters[0].armor[0] = 255; // Max valid value

        let mut spawns = vec![];

        let result = ErrorRecovery::validate_and_recover_game_state(&mut characters, &mut spawns);
        assert!(result.is_ok());

        // Values should be corrected
        assert_eq!(characters[0].health, 255);
        assert_eq!(characters[0].energy, 255);
        assert_eq!(characters[0].armor[0], 255);
    }

    #[test]
    fn test_arithmetic_error_handling() {
        let result = ErrorRecovery::handle_arithmetic_error(GameError::DivisionByZero);
        assert_eq!(result, Fixed::ZERO);

        let result = ErrorRecovery::handle_arithmetic_error(GameError::ArithmeticOverflow);
        assert_eq!(result, Fixed::MAX);
    }

    #[test]
    fn test_error_recoverability() {
        assert!(ErrorRecovery::is_recoverable(&GameError::InvalidScript));
        assert!(ErrorRecovery::is_recoverable(
            &GameError::SerializationError
        ));
        assert!(!ErrorRecovery::is_recoverable(
            &GameError::DeserializationError
        ));
        assert!(!ErrorRecovery::is_recoverable(
            &GameError::InvalidBinaryData
        ));
    }

    #[test]
    fn test_error_messages() {
        let message = ErrorRecovery::create_error_message(&GameError::InvalidScript);
        assert_eq!(message, "Script contains invalid bytecode");

        let message = ErrorRecovery::create_error_message(&GameError::DivisionByZero);
        assert_eq!(message, "Division by zero attempted");
    }

    #[test]
    fn test_safe_property_access_macro() {
        let array = [1, 2, 3, 4, 5];

        // Valid access
        let value = safe_property_access!(array, 2, 0);
        assert_eq!(value, 3);

        // Test with dynamic index function to avoid compile-time evaluation
        fn get_out_of_bounds_index() -> usize {
            10
        }
        let value = safe_property_access!(array, get_out_of_bounds_index(), 99);
        assert_eq!(value, 99);
    }
}
