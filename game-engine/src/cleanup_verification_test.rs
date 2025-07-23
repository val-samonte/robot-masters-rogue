//! Test to verify that code cleanup didn't break functionality

#[cfg(test)]
mod tests {
    use crate::api::{game_loop, game_state as get_game_state, new_game};
    use crate::test_utils::{create_test_character, create_test_game_state};
    use alloc::vec;

    #[test]
    fn test_cleanup_verification_basic_functionality() {
        // Test that basic game functionality still works after cleanup
        let seed = 12345;
        let tilemap = [[0u8; 16]; 15];
        let characters = vec![create_test_character()];
        let spawn_definitions = vec![];

        // Create new game
        let mut game_state = new_game(seed, tilemap, characters, spawn_definitions).unwrap();

        // Verify initial state
        assert_eq!(game_state.seed, seed);
        assert_eq!(game_state.frame, 0);
        assert_eq!(game_state.characters.len(), 1);

        // Run a few game loops
        for _ in 0..10 {
            game_loop(&mut game_state).unwrap();
        }

        // Verify game progressed
        assert_eq!(game_state.frame, 10);

        // Test serialization
        let (json_data, binary_data) = get_game_state(&game_state).unwrap();
        assert!(!json_data.is_empty());
        assert!(!binary_data.is_empty());

        // Verify JSON contains expected fields
        assert!(json_data.contains("\"seed\":12345"));
        assert!(json_data.contains("\"frame\":10"));
        assert!(json_data.contains("\"characters\""));
    }

    #[test]
    fn test_cleanup_verification_test_utilities() {
        // Test that our consolidated test utilities work correctly
        let character = create_test_character();
        assert_eq!(character.core.id, 1);
        assert_eq!(character.core.group, 0);
        assert_eq!(character.energy, 100);
        assert_eq!(character.health, 100);

        let game_state = create_test_game_state();
        assert_eq!(game_state.seed, 12345);
        assert_eq!(game_state.frame, 0);
        assert_eq!(game_state.characters.len(), 0);
    }
}
