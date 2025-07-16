//! Game state management and serialization

use crate::api::GameResult;
use crate::entity::{Action, Character, Condition, SpawnDefinition, SpawnInstance, StatusEffect};
use crate::physics::Tilemap;
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

    // Random number generator state
    rng_state: u16,
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
            rng_state: seed,
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
        // Linear congruential generator for deterministic randomization (16-bit version)
        self.rng_state = self.rng_state.wrapping_mul(25173).wrapping_add(13849);
        self.rng_state
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
