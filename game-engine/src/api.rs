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
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum GameError {
    // Script-related errors
    InvalidScript,
    ScriptExecutionError,
    InvalidOperator,
    ScriptIndexOutOfBounds,

    // Serialization errors
    SerializationError,
    DeserializationError,
    InvalidBinaryData,
    DataTooShort,

    // Game state errors
    InvalidGameState,
    InvalidCharacterData,
    InvalidSpawnData,
    InvalidTilemap,

    // Entity errors
    EntityNotFound,
    InvalidEntityId,
    InvalidPropertyAddress,

    // Math errors
    DivisionByZero,
    ArithmeticOverflow,

    // General errors
    OutOfBounds,
    InvalidInput,
}

impl From<&str> for GameError {
    fn from(msg: &str) -> Self {
        match msg {
            s if s.contains("script") => GameError::InvalidScript,
            s if s.contains("serializ") => GameError::SerializationError,
            s if s.contains("binary") => GameError::InvalidBinaryData,
            s if s.contains("character") => GameError::InvalidCharacterData,
            s if s.contains("spawn") => GameError::InvalidSpawnData,
            s if s.contains("short") => GameError::DataTooShort,
            _ => GameError::InvalidInput,
        }
    }
}

impl From<crate::script::ScriptError> for GameError {
    fn from(err: crate::script::ScriptError) -> Self {
        match err {
            crate::script::ScriptError::InvalidScript => GameError::InvalidScript,
            crate::script::ScriptError::InvalidOperator => GameError::InvalidOperator,
            crate::script::ScriptError::TypeMismatch => GameError::ScriptExecutionError,
            crate::script::ScriptError::IndexOutOfBounds => GameError::ScriptIndexOutOfBounds,
            crate::script::ScriptError::ArithmeticError => GameError::ArithmeticOverflow,
        }
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
