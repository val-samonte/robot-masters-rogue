//! Public API functions for the Robot Masters Game Engine
//!
//! This module provides the three core functions that external platforms
//! (WASM, Solana) use to interact with the game engine.

use crate::entity::{
    ActionDefinition, Character, ConditionDefinition, SpawnDefinition, StatusEffectDefinition,
};
use crate::state::GameState;
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

    // Runtime definition lookup errors
    ActionDefinitionNotFound,
    ConditionDefinitionNotFound,
    StatusEffectDefinitionNotFound,
    SpawnDefinitionNotFound,

    // Instance management errors
    ActionInstanceNotFound,
    ConditionInstanceNotFound,
    StatusEffectInstanceNotFound,
    InvalidInstanceId,

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
            s if s.contains("character") => GameError::InvalidCharacterData,
            s if s.contains("spawn") => GameError::InvalidSpawnData,
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

/// Get the current game state for external serialization
///
/// # Arguments
/// * `state` - Reference to the current game state
///
/// # Returns
/// * Reference to the GameState for external wrappers to serialize
pub fn get_game_state(state: &GameState) -> &GameState {
    state
}

/// Get the current RNG seed for external serialization
///
/// # Arguments
/// * `state` - Reference to the current game state
///
/// # Returns
/// * The current RNG seed value
pub fn get_rng_seed(state: &GameState) -> u16 {
    state.get_rng_seed()
}

/// Validate all definition collections for basic integrity
fn validate_definitions(
    action_definitions: &[ActionDefinition],
    condition_definitions: &[ConditionDefinition],
    spawn_definitions: &[SpawnDefinition],
    status_effect_definitions: &[StatusEffectDefinition],
) -> GameResult<()> {
    // Validate action definitions
    for action in action_definitions.iter() {
        action.validate().map_err(|_| GameError::InvalidActionId)?;

        // Validate spawn references in action
        for &spawn_id in &action.spawns {
            if spawn_id != 0 && spawn_id as usize >= spawn_definitions.len() {
                return Err(GameError::InvalidSpawnId);
            }
        }
    }

    // Validate condition definitions
    for condition in condition_definitions.iter() {
        condition
            .validate()
            .map_err(|_| GameError::InvalidConditionId)?;
    }

    // Validate status effect definitions
    for status_effect in status_effect_definitions.iter() {
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
    action_definitions: &[ActionDefinition],
    _condition_definitions: &[ConditionDefinition],
    spawn_definitions: &[SpawnDefinition],
    status_effect_definitions: &[StatusEffectDefinition],
) -> GameResult<()> {
    // Check spawn definition circular references with depth-first search
    detect_spawn_circular_references(spawn_definitions)?;

    // Check action definition spawn references
    detect_action_spawn_circular_references(action_definitions, spawn_definitions)?;

    // Check status effect definition spawn references
    detect_status_effect_spawn_circular_references(status_effect_definitions, spawn_definitions)?;

    Ok(())
}

/// Detect circular references in spawn definitions using depth-first search
fn detect_spawn_circular_references(spawn_definitions: &[SpawnDefinition]) -> GameResult<()> {
    for (spawn_id, _) in spawn_definitions.iter().enumerate() {
        let mut visited = alloc::vec![false; spawn_definitions.len()];
        let mut recursion_stack = alloc::vec![false; spawn_definitions.len()];

        if detect_spawn_cycle_dfs(
            spawn_id,
            spawn_definitions,
            &mut visited,
            &mut recursion_stack,
        )? {
            return Err(GameError::CircularReference);
        }
    }
    Ok(())
}

/// Depth-first search to detect cycles in spawn references
fn detect_spawn_cycle_dfs(
    spawn_id: usize,
    spawn_definitions: &[SpawnDefinition],
    visited: &mut [bool],
    recursion_stack: &mut [bool],
) -> GameResult<bool> {
    if spawn_id >= spawn_definitions.len() {
        return Err(GameError::InvalidSpawnId);
    }

    visited[spawn_id] = true;
    recursion_stack[spawn_id] = true;

    let spawn_def = &spawn_definitions[spawn_id];
    for &referenced_spawn_id in &spawn_def.spawns {
        if referenced_spawn_id != 0 {
            let referenced_id = referenced_spawn_id as usize;

            // Validate referenced spawn ID exists
            if referenced_id >= spawn_definitions.len() {
                return Err(GameError::InvalidSpawnId);
            }

            // If not visited, recurse
            if !visited[referenced_id] {
                if detect_spawn_cycle_dfs(
                    referenced_id,
                    spawn_definitions,
                    visited,
                    recursion_stack,
                )? {
                    return Ok(true);
                }
            }
            // If visited and in recursion stack, we found a cycle
            else if recursion_stack[referenced_id] {
                return Ok(true);
            }
        }
    }

    recursion_stack[spawn_id] = false;
    Ok(false)
}

/// Detect circular references between actions and spawns
fn detect_action_spawn_circular_references(
    action_definitions: &[ActionDefinition],
    spawn_definitions: &[SpawnDefinition],
) -> GameResult<()> {
    for action_def in action_definitions {
        for &spawn_id in &action_def.spawns {
            if spawn_id != 0 {
                let spawn_idx = spawn_id as usize;
                if spawn_idx >= spawn_definitions.len() {
                    return Err(GameError::InvalidSpawnId);
                }

                // Check if this spawn creates a cycle back to actions
                // For now, we just validate the spawn ID exists
                // More complex cross-reference cycle detection could be added later
            }
        }
    }
    Ok(())
}

/// Detect circular references between status effects and spawns
fn detect_status_effect_spawn_circular_references(
    status_effect_definitions: &[StatusEffectDefinition],
    spawn_definitions: &[SpawnDefinition],
) -> GameResult<()> {
    for status_effect_def in status_effect_definitions {
        for &spawn_id in &status_effect_def.spawns {
            if spawn_id != 0 {
                let spawn_idx = spawn_id as usize;
                if spawn_idx >= spawn_definitions.len() {
                    return Err(GameError::InvalidSpawnId);
                }

                // Check if this spawn creates a cycle back to status effects
                // For now, we just validate the spawn ID exists
                // More complex cross-reference cycle detection could be added later
            }
        }
    }
    Ok(())
}
