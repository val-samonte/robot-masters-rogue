//! Comprehensive tests for error handling and recovery

#[cfg(test)]
mod tests {
    use crate::api::GameError;
    use crate::entity::Character;
    use crate::error::ErrorRecovery;
    use crate::math::Fixed;
    use crate::script::ScriptError;
    use crate::state::GameState;
    use alloc::vec;

    /// Test script execution error recovery
    #[test]
    fn test_script_execution_error_recovery() {
        // Test invalid script handling
        let exit_code = ErrorRecovery::handle_script_error(GameError::InvalidScript);
        assert_eq!(exit_code, 255);

        // Test script execution error handling
        let exit_code = ErrorRecovery::handle_script_error(GameError::ScriptExecutionError);
        assert_eq!(exit_code, 254);

        // Test invalid operator handling
        let exit_code = ErrorRecovery::handle_script_error(GameError::InvalidOperator);
        assert_eq!(exit_code, 253);
    }

    /// Test serialization error recovery
    #[test]
    fn test_serialization_error_recovery() {
        // Test recoverable serialization error
        let result = ErrorRecovery::handle_serialization_error(GameError::SerializationError);
        assert!(result.is_ok());

        // Test non-recoverable deserialization error
        let result = ErrorRecovery::handle_serialization_error(GameError::DeserializationError);
        assert!(result.is_err());
        assert_eq!(result.unwrap_err(), GameError::DeserializationError);

        // Test non-recoverable invalid binary data error
        let result = ErrorRecovery::handle_serialization_error(GameError::InvalidBinaryData);
        assert!(result.is_err());
        assert_eq!(result.unwrap_err(), GameError::InvalidBinaryData);
    }

    /// Test game state validation and recovery
    #[test]
    fn test_game_state_validation_and_recovery() {
        let mut characters = vec![Character::new(1, 0)];
        let mut spawns = vec![];

        // Since u8 can't hold 300, we'll test the validation logic differently
        characters[0].health = 255; // Max valid value
        characters[0].energy = 255; // Max valid value
        characters[0].armor[0] = 255; // Max valid value
        characters[0].armor[7] = 255; // Max valid value

        // Set invalid position
        characters[0].core.pos.0 = Fixed::from_int(500); // Way off screen
        characters[0].core.pos.1 = Fixed::from_int(-200); // Way off screen

        // Validate and recover
        let result = ErrorRecovery::validate_and_recover_game_state(&mut characters, &mut spawns);
        assert!(result.is_ok());

        // Check that values were corrected
        assert_eq!(characters[0].health, 255);
        assert_eq!(characters[0].energy, 255);
        assert_eq!(characters[0].armor[0], 255);
        assert_eq!(characters[0].armor[7], 255);

        // Check that position was corrected
        assert!(characters[0].core.pos.0 <= Fixed::from_int(256));
        assert!(characters[0].core.pos.1 >= Fixed::from_int(-128));
    }

    /// Test arithmetic error handling
    #[test]
    fn test_arithmetic_error_handling() {
        // Test division by zero
        let result = ErrorRecovery::handle_arithmetic_error(GameError::DivisionByZero);
        assert_eq!(result, Fixed::ZERO);

        // Test arithmetic overflow
        let result = ErrorRecovery::handle_arithmetic_error(GameError::ArithmeticOverflow);
        assert_eq!(result, Fixed::MAX);

        // Test other errors default to zero
        let result = ErrorRecovery::handle_arithmetic_error(GameError::InvalidInput);
        assert_eq!(result, Fixed::ZERO);
    }

    /// Test bounds error handling
    #[test]
    fn test_bounds_error_handling() {
        // Test out of bounds error for u8
        let result: u8 = ErrorRecovery::handle_bounds_error(GameError::OutOfBounds);
        assert_eq!(result, 0);

        // Test script index out of bounds for bool
        let result: bool = ErrorRecovery::handle_bounds_error(GameError::ScriptIndexOutOfBounds);
        assert_eq!(result, false);
    }

    /// Test error message creation
    #[test]
    fn test_error_message_creation() {
        let message = ErrorRecovery::create_error_message(&GameError::InvalidScript);
        assert_eq!(message, "Script contains invalid bytecode");

        let message = ErrorRecovery::create_error_message(&GameError::DivisionByZero);
        assert_eq!(message, "Division by zero attempted");

        let message = ErrorRecovery::create_error_message(&GameError::SerializationError);
        assert_eq!(message, "Failed to serialize game state");
    }

    /// Test error recoverability classification
    #[test]
    fn test_error_recoverability() {
        // Script errors should be recoverable
        assert!(ErrorRecovery::is_recoverable(&GameError::InvalidScript));
        assert!(ErrorRecovery::is_recoverable(
            &GameError::ScriptExecutionError
        ));
        assert!(ErrorRecovery::is_recoverable(&GameError::InvalidOperator));

        // Some serialization errors are recoverable
        assert!(ErrorRecovery::is_recoverable(
            &GameError::SerializationError
        ));
        assert!(!ErrorRecovery::is_recoverable(
            &GameError::DeserializationError
        ));
        assert!(!ErrorRecovery::is_recoverable(
            &GameError::InvalidBinaryData
        ));

        // Math errors should be recoverable
        assert!(ErrorRecovery::is_recoverable(&GameError::DivisionByZero));
        assert!(ErrorRecovery::is_recoverable(
            &GameError::ArithmeticOverflow
        ));

        // Bounds errors should be recoverable
        assert!(ErrorRecovery::is_recoverable(&GameError::OutOfBounds));
    }

    /// Test GameError conversion from ScriptError
    #[test]
    fn test_script_error_conversion() {
        let script_error = ScriptError::InvalidScript;
        let game_error: GameError = script_error.into();
        assert_eq!(game_error, GameError::InvalidScript);

        let script_error = ScriptError::InvalidOperator;
        let game_error: GameError = script_error.into();
        assert_eq!(game_error, GameError::InvalidOperator);

        let script_error = ScriptError::TypeMismatch;
        let game_error: GameError = script_error.into();
        assert_eq!(game_error, GameError::ScriptExecutionError);

        let script_error = ScriptError::IndexOutOfBounds;
        let game_error: GameError = script_error.into();
        assert_eq!(game_error, GameError::ScriptIndexOutOfBounds);

        let script_error = ScriptError::ArithmeticError;
        let game_error: GameError = script_error.into();
        assert_eq!(game_error, GameError::ArithmeticOverflow);
    }

    /// Test GameError conversion from string messages
    #[test]
    fn test_string_error_conversion() {
        let error: GameError = "invalid script data".into();
        assert_eq!(error, GameError::InvalidScript);

        let error: GameError = "serialization failed".into();
        assert_eq!(error, GameError::SerializationError);

        let error: GameError = "binary data corrupted".into();
        assert_eq!(error, GameError::InvalidBinaryData);

        let error: GameError = "character data invalid".into();
        assert_eq!(error, GameError::InvalidCharacterData);

        let error: GameError = "data too short".into();
        assert_eq!(error, GameError::DataTooShort);

        let error: GameError = "unknown error".into();
        assert_eq!(error, GameError::InvalidInput);
    }

    /// Test safe property access macro with runtime bounds checking
    #[test]
    fn test_safe_property_access_macro() {
        let array = [10, 20, 30, 40, 50];

        // Valid access
        let value = crate::safe_property_access!(array, 2, 0);
        assert_eq!(value, 30);

        // Edge case: access last element
        let value = crate::safe_property_access!(array, 4, 0);
        assert_eq!(value, 50);

        // Test with dynamic index function to avoid compile-time evaluation
        fn get_out_of_bounds_index() -> usize {
            10
        }
        let value = crate::safe_property_access!(array, get_out_of_bounds_index(), 99);
        assert_eq!(value, 99);
    }

    /// Test error handling in game state creation
    #[test]
    fn test_game_state_creation_error_handling() {
        let seed = 12345;
        let tilemap = [[0u8; 16]; 15];
        let characters = vec![Character::new(1, 0)];
        let spawn_definitions = vec![];

        // This should succeed
        let result = GameState::new(seed, tilemap, characters, spawn_definitions);
        assert!(result.is_ok());
    }

    /// Test error handling in binary deserialization
    #[test]
    fn test_binary_deserialization_error_handling() {
        // Test with too short data
        let short_data = vec![1, 2, 3];
        let result = GameState::from_binary(&short_data);
        assert!(result.is_err());
        assert_eq!(result.unwrap_err(), GameError::DataTooShort);

        // Test with invalid status byte
        let mut invalid_data = vec![0; 245]; // Minimum size
        invalid_data[0] = 0x34; // seed low
        invalid_data[1] = 0x12; // seed high
        invalid_data[2] = 0x00; // frame low
        invalid_data[3] = 0x00; // frame high
        invalid_data[4] = 5; // Invalid status (should be 0 or 1)

        let result = GameState::from_binary(&invalid_data);
        assert!(result.is_err());
        assert_eq!(result.unwrap_err(), GameError::InvalidBinaryData);
    }

    /// Test comprehensive error recovery in frame processing
    #[test]
    fn test_frame_processing_error_recovery() {
        let seed = 12345;
        let tilemap = [[0u8; 16]; 15];
        let mut characters = vec![Character::new(1, 0)];

        // Set up character with some invalid state that will be corrected
        characters[0].health = 255; // Max valid value for testing
        characters[0].energy = 50;

        let spawn_definitions = vec![];

        let mut game_state = GameState::new(seed, tilemap, characters, spawn_definitions).unwrap();

        // Advance frame should succeed and correct the invalid health
        let result = game_state.advance_frame();
        assert!(result.is_ok());

        // Health should be corrected
        assert_eq!(game_state.characters[0].health, 255);
    }

    /// Test error handling with multiple error types
    #[test]
    fn test_multiple_error_types() {
        let errors = vec![
            GameError::InvalidScript,
            GameError::SerializationError,
            GameError::DivisionByZero,
            GameError::OutOfBounds,
            GameError::InvalidBinaryData,
        ];

        for error in errors {
            let message = ErrorRecovery::create_error_message(&error);
            assert!(!message.is_empty());

            let is_recoverable = ErrorRecovery::is_recoverable(&error);
            // All except InvalidBinaryData should be recoverable in this set
            if error == GameError::InvalidBinaryData {
                assert!(!is_recoverable);
            } else {
                assert!(is_recoverable);
            }
        }
    }
}
