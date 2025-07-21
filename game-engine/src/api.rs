//! Public API functions for the Robot Masters Game Engine
//!
//! This module provides the three core functions that external platforms
//! (WASM, Solana) use to interact with the game engine.

use crate::entity::{Character, SpawnDefinition};
use crate::state::GameState;
use alloc::string::String;
use alloc::vec::Vec;

/// Result type for game operations
pub type GameResult<T> = Result<T, GameError>;

/// Game engine errors
#[derive(Debug, Clone)]
pub enum GameError {
    InvalidScript,
    SerializationError,
    InvalidGameState,
    ScriptExecutionError,
}

impl From<&str> for GameError {
    fn from(_msg: &str) -> Self {
        // For debugging, we could store the message, but for now just return SerializationError
        GameError::SerializationError
    }
}

/// Initialize a new game instance
///
/// # Arguments
/// * `seed` - u16 seed for deterministic randomization
/// * `tilemap` - 16x15 byte array representing the game arena
/// * `characters` - Initial character definitions
/// * `spawn_definitions` - Projectile and temporary object definitions
pub fn new_game(
    seed: u16,
    tilemap: [[u8; 16]; 15],
    characters: Vec<Character>,
    spawn_definitions: Vec<SpawnDefinition>,
) -> GameResult<GameState> {
    GameState::new(seed, tilemap, characters, spawn_definitions)
}

/// Advance the game state by exactly one frame (1/60th second)
///
/// # Arguments
/// * `state` - Mutable reference to the current game state
pub fn game_loop(state: &mut GameState) -> GameResult<()> {
    state.advance_frame()
}

/// Get the current game state in both JSON and binary formats
///
/// # Arguments
/// * `state` - Reference to the current game state
///
/// # Returns
/// * Tuple of (JSON string, binary serialized bytes)
pub fn game_state(state: &GameState) -> GameResult<(String, Vec<u8>)> {
    let json = state.to_json()?;
    let binary = state.to_binary()?;
    Ok((json, binary))
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::entity::{Character, SpawnDefinition};
    use crate::math::Fixed;
    use alloc::vec;

    fn create_test_character() -> Character {
        let mut character = Character::new(1, 0);
        character.health = 100;
        character.energy = 50;
        character.armor = [100, 90, 110, 95, 80, 120, 85, 105]; // Different armor values
        character
    }

    fn create_test_spawn_definition() -> SpawnDefinition {
        SpawnDefinition {
            damage_base: 10,
            health_cap: 1,
            duration: 60,
            element: Some(crate::entity::Element::Blast),
            vars: [0; 8],
            fixed: [Fixed::ZERO; 4],
            args: [0; 8],
            spawns: [0; 4],
            behavior_script: vec![0, 1], // Simple exit script
            collision_script: vec![0, 1],
            despawn_script: vec![0, 1],
        }
    }

    #[test]
    fn test_new_game_creates_valid_state() {
        let seed = 12345;
        let tilemap = [[0u8; 16]; 15];
        let characters = vec![create_test_character()];
        let spawn_definitions = vec![create_test_spawn_definition()];

        let result = new_game(seed, tilemap, characters, spawn_definitions);
        assert!(result.is_ok());

        let game_state = result.unwrap();
        assert_eq!(game_state.seed, seed);
        assert_eq!(game_state.frame, 0);
        assert_eq!(game_state.characters.len(), 1);
        assert_eq!(game_state.spawn_lookup.len(), 1);
    }

    #[test]
    fn test_new_game_with_empty_entities() {
        let seed = 42;
        let tilemap = [[1u8; 16]; 15]; // All walls
        let characters = vec![];
        let spawn_definitions = vec![];

        let result = new_game(seed, tilemap, characters, spawn_definitions);
        assert!(result.is_ok());

        let game_state = result.unwrap();
        assert_eq!(game_state.seed, seed);
        assert_eq!(game_state.frame, 0);
        assert_eq!(game_state.characters.len(), 0);
        assert_eq!(game_state.spawn_lookup.len(), 0);
    }

    #[test]
    fn test_game_loop_advances_frame() {
        let seed = 12345;
        let tilemap = [[0u8; 16]; 15];
        let characters = vec![create_test_character()];
        let spawn_definitions = vec![];

        let mut game_state = new_game(seed, tilemap, characters, spawn_definitions).unwrap();

        assert_eq!(game_state.frame, 0);

        let result = game_loop(&mut game_state);
        assert!(result.is_ok());
        assert_eq!(game_state.frame, 1);

        // Advance multiple frames
        for expected_frame in 2..=10 {
            let result = game_loop(&mut game_state);
            assert!(result.is_ok());
            assert_eq!(game_state.frame, expected_frame);
        }
    }

    #[test]
    fn test_game_loop_deterministic_advancement() {
        let seed = 12345;
        let tilemap = [[0u8; 16]; 15];
        let characters = vec![create_test_character()];
        let spawn_definitions = vec![];

        let mut game1 = new_game(
            seed,
            tilemap.clone(),
            characters.clone(),
            spawn_definitions.clone(),
        )
        .unwrap();
        let mut game2 = new_game(seed, tilemap, characters, spawn_definitions).unwrap();

        // Advance both games by the same number of frames
        for _ in 0..50 {
            let result1 = game_loop(&mut game1);
            let result2 = game_loop(&mut game2);

            assert!(result1.is_ok());
            assert!(result2.is_ok());
            assert_eq!(game1.frame, game2.frame);
        }
    }

    #[test]
    fn test_game_loop_ends_after_max_frames() {
        let seed = 12345;
        let tilemap = [[0u8; 16]; 15];
        let characters = vec![create_test_character()];
        let spawn_definitions = vec![];

        let mut game_state = new_game(seed, tilemap, characters, spawn_definitions).unwrap();

        // Advance to max frames - 1 (frame 3839)
        game_state.frame = crate::core::MAX_FRAMES - 1;
        assert_eq!(game_state.status, crate::state::GameStatus::Playing);

        // This should process frame 3839 and increment to 3840, then end
        let result = game_loop(&mut game_state);
        assert!(result.is_ok());
        assert_eq!(game_state.frame, crate::core::MAX_FRAMES);
        assert_eq!(game_state.status, crate::state::GameStatus::Playing); // Still playing after processing frame 3839

        // Next call should immediately end the game without processing
        let result = game_loop(&mut game_state);
        assert!(result.is_ok());
        assert_eq!(game_state.status, crate::state::GameStatus::Ended);
        assert_eq!(game_state.frame, crate::core::MAX_FRAMES); // Frame should not increment
    }

    #[test]
    fn test_game_loop_no_op_when_ended() {
        let seed = 12345;
        let tilemap = [[0u8; 16]; 15];
        let characters = vec![create_test_character()];
        let spawn_definitions = vec![];

        let mut game_state = new_game(seed, tilemap, characters, spawn_definitions).unwrap();
        game_state.status = crate::state::GameStatus::Ended;
        let initial_frame = game_state.frame;

        let result = game_loop(&mut game_state);
        assert!(result.is_ok());
        assert_eq!(game_state.frame, initial_frame); // Frame should not advance
        assert_eq!(game_state.status, crate::state::GameStatus::Ended);
    }

    #[test]
    fn test_game_state_returns_json_and_binary() {
        let seed = 12345;
        let tilemap = [[0u8; 16]; 15];
        let characters = vec![create_test_character()];
        let spawn_definitions = vec![create_test_spawn_definition()];

        let game_state_instance = new_game(seed, tilemap, characters, spawn_definitions).unwrap();

        let result = game_state(&game_state_instance);
        assert!(result.is_ok());

        let (json, binary) = result.unwrap();

        // Verify JSON contains expected fields
        assert!(json.contains("\"seed\":12345"));
        assert!(json.contains("\"frame\":0"));
        assert!(json.contains("\"status\":\"Playing\""));
        assert!(json.contains("\"characters\":["));
        assert!(json.contains("\"tilemap\":["));

        // Verify binary data is not empty and starts with seed
        assert!(!binary.is_empty());
        let serialized_seed = u16::from_le_bytes([binary[0], binary[1]]);
        assert_eq!(serialized_seed, seed);
    }

    #[test]
    fn test_game_state_json_format_consistency() {
        let seed = 42;
        let tilemap = [[0u8; 16]; 15];
        let mut character = create_test_character();
        character.health = 75;
        character.energy = 25;
        let characters = vec![character];
        let spawn_definitions = vec![];

        let game_state_instance = new_game(seed, tilemap, characters, spawn_definitions).unwrap();

        let result = game_state(&game_state_instance);
        assert!(result.is_ok());

        let (json, _) = result.unwrap();

        // Verify specific character data in JSON
        assert!(json.contains("\"health\":75"));
        assert!(json.contains("\"energy\":25"));
        assert!(json.contains("\"id\":1"));
        assert!(json.contains("\"group\":0"));
    }

    #[test]
    fn test_complete_api_workflow() {
        let seed = 12345;
        let tilemap = [[0u8; 16]; 15];
        let characters = vec![create_test_character()];
        let spawn_definitions = vec![create_test_spawn_definition()];

        // Step 1: Create new game
        let mut game_state_instance =
            new_game(seed, tilemap, characters, spawn_definitions).unwrap();
        assert_eq!(game_state_instance.frame, 0);

        // Step 2: Get initial state
        let (initial_json, initial_binary) = game_state(&game_state_instance).unwrap();
        assert!(initial_json.contains("\"frame\":0"));

        // Step 3: Advance game by several frames
        for _ in 0..10 {
            game_loop(&mut game_state_instance).unwrap();
        }
        assert_eq!(game_state_instance.frame, 10);

        // Step 4: Get updated state
        let (updated_json, updated_binary) = game_state(&game_state_instance).unwrap();
        assert!(updated_json.contains("\"frame\":10"));

        // Step 5: Verify binary data changed
        assert_ne!(initial_binary, updated_binary);

        // Step 6: Verify frame in binary data
        let frame_from_binary = u16::from_le_bytes([updated_binary[2], updated_binary[3]]);
        assert_eq!(frame_from_binary, 10);
    }

    #[test]
    fn test_api_with_multiple_characters() {
        let seed = 12345;
        let tilemap = [[0u8; 16]; 15];

        let mut char1 = create_test_character();
        char1.core.id = 1;
        char1.health = 100;

        let mut char2 = create_test_character();
        char2.core.id = 2;
        char2.health = 80;

        let characters = vec![char1, char2];
        let spawn_definitions = vec![];

        let game_state_instance = new_game(seed, tilemap, characters, spawn_definitions).unwrap();
        assert_eq!(game_state_instance.characters.len(), 2);

        let (json, _) = game_state(&game_state_instance).unwrap();

        // Verify both characters are in JSON
        assert!(json.contains("\"id\":1"));
        assert!(json.contains("\"id\":2"));
        assert!(json.contains("\"health\":100"));
        assert!(json.contains("\"health\":80"));
    }

    #[test]
    fn test_api_error_handling() {
        // Test with valid inputs first
        let seed = 12345;
        let tilemap = [[0u8; 16]; 15];
        let characters = vec![create_test_character()];
        let spawn_definitions = vec![];

        let result = new_game(seed, tilemap, characters, spawn_definitions);
        assert!(result.is_ok());

        // All current API functions should succeed with valid inputs
        // Error handling is primarily in the underlying GameState methods
        // which are tested in the state module tests
    }

    #[test]
    fn test_api_frame_timing_compliance() {
        let seed = 12345;
        let tilemap = [[0u8; 16]; 15];
        let characters = vec![create_test_character()];
        let spawn_definitions = vec![];

        let mut game_state_instance =
            new_game(seed, tilemap, characters, spawn_definitions).unwrap();

        // Verify game runs for exactly 3840 frames (60 FPS × 64 seconds)
        // The game should process frames 0 through 3839, then end when trying to process frame 3840
        while game_state_instance.status == crate::state::GameStatus::Playing {
            let result = game_loop(&mut game_state_instance);
            assert!(result.is_ok());
        }

        // Game should be ended and frame should be MAX_FRAMES
        assert_eq!(game_state_instance.status, crate::state::GameStatus::Ended);
        assert_eq!(game_state_instance.frame, crate::core::MAX_FRAMES);

        // Verify no further advancement after game ends
        let final_frame = game_state_instance.frame;
        game_loop(&mut game_state_instance).unwrap();
        assert_eq!(game_state_instance.frame, final_frame);
    }

    #[test]
    fn test_api_serialization_round_trip() {
        let seed = 12345;
        let tilemap = [[1u8; 16]; 15]; // Non-zero tilemap
        let characters = vec![create_test_character()];
        let spawn_definitions = vec![create_test_spawn_definition()];

        let original_game = new_game(seed, tilemap, characters, spawn_definitions).unwrap();

        // Get binary representation
        let (_, binary_data) = game_state(&original_game).unwrap();

        // Recreate game state from binary data
        let restored_game = crate::state::GameState::from_binary(&binary_data).unwrap();

        // Verify key properties match
        assert_eq!(original_game.seed, restored_game.seed);
        assert_eq!(original_game.frame, restored_game.frame);
        assert_eq!(
            original_game.characters.len(),
            restored_game.characters.len()
        );

        if !original_game.characters.is_empty() && !restored_game.characters.is_empty() {
            assert_eq!(
                original_game.characters[0].health,
                restored_game.characters[0].health
            );
            assert_eq!(
                original_game.characters[0].energy,
                restored_game.characters[0].energy
            );
        }
    }

    #[test]
    fn test_actions_simple_import() {
        // Test that we can import and use functions from actions_simple
        let result = crate::actions_simple::test_function();
        assert_eq!(result, 42);

        // let action = crate::actions_simple::shoot_action_with_ammo();
        // assert_eq!(action.energy_cost, 5);
    }
}
