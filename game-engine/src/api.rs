//! Public API functions for the Robot Masters Game Engine
//!
//! This module provides the three core functions that external platforms
//! (WASM, Solana) use to interact with the game engine.

use crate::entity::{
    ActionDefinition, Character, ConditionDefinition, SpawnDefinition, StatusEffectDefinition,
};
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

    // Definition validation errors
    InvalidActionId,
    InvalidConditionId,
    InvalidStatusEffectId,
    InvalidSpawnId,
    CircularReference,
    MissingDefinition,

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
/// * `action_definitions` - Action behavior definitions
/// * `condition_definitions` - Condition evaluation definitions
/// * `spawn_definitions` - Projectile and temporary object definitions
/// * `status_effect_definitions` - Status effect definitions
pub fn new_game(
    seed: u16,
    tilemap: [[u8; 16]; 15],
    characters: Vec<Character>,
    action_definitions: Vec<ActionDefinition>,
    condition_definitions: Vec<ConditionDefinition>,
    spawn_definitions: Vec<SpawnDefinition>,
    status_effect_definitions: Vec<StatusEffectDefinition>,
) -> GameResult<GameState> {
    // Validate all definitions first
    validate_definitions(
        &action_definitions,
        &condition_definitions,
        &spawn_definitions,
        &status_effect_definitions,
    )?;

    // Validate that all character behavior references exist
    validate_character_references(&characters, &action_definitions, &condition_definitions)?;

    // Detect circular references in definitions
    detect_circular_references(
        &action_definitions,
        &condition_definitions,
        &spawn_definitions,
        &status_effect_definitions,
    )?;

    GameState::new(
        seed,
        tilemap,
        characters,
        action_definitions,
        condition_definitions,
        spawn_definitions,
        status_effect_definitions,
    )
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

/// Validate all definition collections for basic integrity
fn validate_definitions(
    action_definitions: &[ActionDefinition],
    condition_definitions: &[ConditionDefinition],
    spawn_definitions: &[SpawnDefinition],
    status_effect_definitions: &[StatusEffectDefinition],
) -> GameResult<()> {
    // Validate action definitions
    for (_id, action) in action_definitions.iter().enumerate() {
        action.validate().map_err(|_| GameError::InvalidActionId)?;

        // Validate spawn references in action
        for &spawn_id in &action.spawns {
            if spawn_id != 0 && spawn_id as usize >= spawn_definitions.len() {
                return Err(GameError::InvalidSpawnId);
            }
        }
    }

    // Validate condition definitions
    for (_id, condition) in condition_definitions.iter().enumerate() {
        condition
            .validate()
            .map_err(|_| GameError::InvalidConditionId)?;
    }

    // Validate status effect definitions
    for (_id, status_effect) in status_effect_definitions.iter().enumerate() {
        status_effect
            .validate()
            .map_err(|_| GameError::InvalidStatusEffectId)?;

        // Validate spawn references in status effect
        for &spawn_id in &status_effect.spawns {
            if spawn_id != 0 && spawn_id as usize >= spawn_definitions.len() {
                return Err(GameError::InvalidSpawnId);
            }
        }
    }

    Ok(())
}

/// Validate that all character behavior references exist in the provided definitions
fn validate_character_references(
    characters: &[Character],
    action_definitions: &[ActionDefinition],
    condition_definitions: &[ConditionDefinition],
) -> GameResult<()> {
    for character in characters {
        for &(condition_id, action_id) in &character.behaviors {
            // Check condition ID exists
            if condition_id >= condition_definitions.len() {
                return Err(GameError::InvalidConditionId);
            }

            // Check action ID exists
            if action_id >= action_definitions.len() {
                return Err(GameError::InvalidActionId);
            }
        }
    }

    Ok(())
}

/// Detect circular references in definition dependencies
fn detect_circular_references(
    _action_definitions: &[ActionDefinition],
    _condition_definitions: &[ConditionDefinition],
    spawn_definitions: &[SpawnDefinition],
    _status_effect_definitions: &[StatusEffectDefinition],
) -> GameResult<()> {
    // For now, we implement a basic check for spawn references
    // More sophisticated circular reference detection can be added later

    // Check that spawn definitions don't reference invalid spawn IDs
    for (spawn_id, spawn_def) in spawn_definitions.iter().enumerate() {
        for &referenced_spawn_id in &spawn_def.spawns {
            if referenced_spawn_id != 0 {
                let referenced_id = referenced_spawn_id as usize;
                if referenced_id >= spawn_definitions.len() {
                    return Err(GameError::InvalidSpawnId);
                }

                // Basic circular reference check: spawn can't reference itself
                if referenced_id == spawn_id {
                    return Err(GameError::CircularReference);
                }
            }
        }
    }

    Ok(())
}
