//! Game state management and serialization

use crate::api::GameResult;
use crate::entity::{Action, Character, Condition, SpawnDefinition, SpawnInstance, StatusEffect};
use crate::physics::Tilemap;
use crate::random::SeededRng;
use crate::script::ScriptEngine;
use alloc::format;
use alloc::string::String;
use alloc::vec::Vec;

/// Current game status
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum GameStatus {
    Playing,
    Ended,
}

/// Complete game state
#[derive(Debug)]
pub struct GameState {
    pub seed: u16,
    pub frame: u16,
    pub tile_map: Tilemap,
    pub status: GameStatus,
    pub characters: Vec<Character>,
    pub spawn_instances: Vec<SpawnInstance>,

    // Lookup tables for scripts and definitions
    pub action_lookup: Vec<Action>,
    pub condition_lookup: Vec<Condition>,
    pub spawn_lookup: Vec<SpawnDefinition>,
    pub status_effect_lookup: Vec<StatusEffect>,

    // Script engine for bytecode execution
    script_engine: ScriptEngine,

    // Random number generator
    rng: SeededRng,
}

impl GameState {
    /// Create a new game instance
    pub fn new(
        seed: u16,
        tilemap: [[u8; 16]; 15],
        characters: Vec<Character>,
        spawn_definitions: Vec<SpawnDefinition>,
    ) -> GameResult<Self> {
        Ok(Self {
            seed,
            frame: 0,
            tile_map: Tilemap::new(tilemap),
            status: GameStatus::Playing,
            characters,
            spawn_instances: Vec::new(),
            action_lookup: Vec::new(),
            condition_lookup: Vec::new(),
            spawn_lookup: spawn_definitions,
            status_effect_lookup: Vec::new(),
            script_engine: ScriptEngine::new(),
            rng: SeededRng::new(seed),
        })
    }

    /// Advance the game state by one frame
    pub fn advance_frame(&mut self) -> GameResult<()> {
        if self.status != GameStatus::Playing {
            return Ok(());
        }

        // Check if game should end (3840 frames = 60 FPS × 64 seconds)
        if self.frame >= 3840 {
            self.status = GameStatus::Ended;
            return Ok(());
        }

        // Frame processing pipeline:
        // 1. Execute character behaviors
        self.process_character_behaviors()?;

        // 2. Update physics
        self.update_physics()?;

        // 3. Handle collisions
        self.process_collisions()?;

        // 4. Clean up expired entities
        self.cleanup_entities()?;

        self.frame += 1;
        Ok(())
    }

    /// Export game state as JSON string
    pub fn to_json(&self) -> GameResult<String> {
        // This will be implemented with proper serialization in later tasks
        Ok(format!(
            r#"{{"frame": {}, "status": "{:?}", "characters": {}, "spawns": {}}}"#,
            self.frame,
            self.status,
            self.characters.len(),
            self.spawn_instances.len()
        ))
    }

    /// Export game state as binary data
    pub fn to_binary(&self) -> GameResult<Vec<u8>> {
        // This will be implemented with proper serialization in later tasks
        let mut data = Vec::new();
        data.extend_from_slice(&self.seed.to_le_bytes());
        data.extend_from_slice(&self.frame.to_le_bytes());
        data.push(self.characters.len() as u8);
        data.push(self.spawn_instances.len() as u8);
        Ok(data)
    }

    /// Generate next random number using seeded PRNG
    pub fn next_random(&mut self) -> u16 {
        self.rng.next_u16()
    }

    /// Generate random number in range [0, max)
    pub fn next_random_range(&mut self, max: u16) -> u16 {
        self.rng.next_range(max)
    }

    /// Generate random boolean
    pub fn next_random_bool(&mut self) -> bool {
        self.rng.next_bool()
    }

    /// Generate random u8
    pub fn next_random_u8(&mut self) -> u8 {
        self.rng.next_u8()
    }

    /// Reset the random number generator to initial seed
    pub fn reset_rng(&mut self) {
        self.rng.reset();
    }

    // Private methods for frame processing (stubs for now)
    fn process_character_behaviors(&mut self) -> GameResult<()> {
        // Will be implemented in behavior system task
        Ok(())
    }

    fn update_physics(&mut self) -> GameResult<()> {
        // Will be implemented in physics task
        Ok(())
    }

    fn process_collisions(&mut self) -> GameResult<()> {
        // Will be implemented in collision task
        Ok(())
    }

    fn cleanup_entities(&mut self) -> GameResult<()> {
        // Remove expired spawn instances
        self.spawn_instances.retain(|spawn| spawn.lifespan > 0);
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use alloc::vec;

    #[test]
    fn test_deterministic_random_generation() {
        let seed = 12345;
        let tilemap = [[0u8; 16]; 15];

        let mut game1 = GameState::new(seed, tilemap, vec![], vec![]).unwrap();
        let mut game2 = GameState::new(seed, tilemap, vec![], vec![]).unwrap();

        // Generate several random values and ensure they match
        for _ in 0..50 {
            assert_eq!(game1.next_random(), game2.next_random());
            assert_eq!(game1.next_random_u8(), game2.next_random_u8());
            assert_eq!(game1.next_random_bool(), game2.next_random_bool());
            assert_eq!(game1.next_random_range(100), game2.next_random_range(100));
        }
    }

    #[test]
    fn test_different_seeds_produce_different_randoms() {
        let tilemap = [[0u8; 16]; 15];

        let mut game1 = GameState::new(12345, tilemap, vec![], vec![]).unwrap();
        let mut game2 = GameState::new(54321, tilemap, vec![], vec![]).unwrap();

        let mut differences = 0;
        for _ in 0..100 {
            if game1.next_random() != game2.next_random() {
                differences += 1;
            }
        }

        // Should have many differences
        assert!(differences > 80);
    }

    #[test]
    fn test_rng_reset_functionality() {
        let seed = 12345;
        let tilemap = [[0u8; 16]; 15];

        let mut game = GameState::new(seed, tilemap, vec![], vec![]).unwrap();

        // Generate some values
        let first_value = game.next_random();
        let second_value = game.next_random();

        // Reset and verify we get the same sequence
        game.reset_rng();
        assert_eq!(game.next_random(), first_value);
        assert_eq!(game.next_random(), second_value);
    }

    #[test]
    fn test_game_state_serialization_includes_seed() {
        let seed = 42;
        let tilemap = [[0u8; 16]; 15];

        let game = GameState::new(seed, tilemap, vec![], vec![]).unwrap();

        let binary_data = game.to_binary().unwrap();

        // First two bytes should be the seed in little-endian format
        let serialized_seed = u16::from_le_bytes([binary_data[0], binary_data[1]]);
        assert_eq!(serialized_seed, seed);
    }

    #[test]
    fn test_frame_advancement_maintains_rng_state() {
        let seed = 12345;
        let tilemap = [[0u8; 16]; 15];

        let mut game = GameState::new(seed, tilemap, vec![], vec![]).unwrap();

        // Generate a value before frame advancement
        let value_before = game.next_random();

        // Advance frame
        let _ = game.advance_frame();

        // Generate a value after frame advancement
        let value_after = game.next_random();

        // Values should be different (RNG state should continue)
        assert_ne!(value_before, value_after);
    }
}
