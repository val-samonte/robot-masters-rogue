//! Tests for status effect script execution functionality
//!
//! This test file validates that status effect scripts (on_script, tick_script, off_script)
//! execute properly and handle error conditions gracefully.

extern crate alloc;
use alloc::vec;

use crate::{
    constants::operator_address,
    entity::{Character, StatusEffectDefinition},
    state::GameState,
    status::{execute_status_effect_script, StatusEffectScriptType},
};

#[test]
fn test_status_effect_script_types_exist() {
    // Test that all script types are defined and can be used
    let _on_type = StatusEffectScriptType::On;
    let _tick_type = StatusEffectScriptType::Tick;
    let _off_type = StatusEffectScriptType::Off;

    // Test that they are different
    assert_ne!(_on_type, _tick_type);
    assert_ne!(_tick_type, _off_type);
    assert_ne!(_on_type, _off_type);
}

#[test]
fn test_execute_status_effect_script_handles_missing_entities() {
    // Test that the execute_status_effect_script function handles missing entities gracefully
    let tilemap = [[0u8; 16]; 15];
    let characters = vec![Character::new(0, 0)];
    let mut game_state = GameState::new(42, tilemap, characters, vec![], vec![], vec![], vec![])
        .expect("Failed to create game state");

    // Test with invalid character ID
    let result = execute_status_effect_script(
        &mut game_state,
        99, // Invalid character ID
        0,
        0,
        StatusEffectScriptType::On,
    );
    assert!(result.is_ok());
    assert_eq!(result.unwrap(), 0);

    // Test with invalid instance ID
    let result = execute_status_effect_script(
        &mut game_state,
        0,  // Valid character ID
        99, // Invalid instance ID
        0,
        StatusEffectScriptType::Tick,
    );
    assert!(result.is_ok());
    assert_eq!(result.unwrap(), 0);

    // Test with invalid definition ID
    let result = execute_status_effect_script(
        &mut game_state,
        0,
        0,  // Valid character and instance IDs
        99, // Invalid definition ID
        StatusEffectScriptType::Off,
    );
    assert!(result.is_ok());
    assert_eq!(result.unwrap(), 0);
}

#[test]
fn test_status_effect_definition_with_scripts() {
    // Test that status effect definitions can be created with different script types
    let status_def = StatusEffectDefinition::new(
        60,
        1,
        false,
        vec![operator_address::EXIT, 1], // on_script
        vec![operator_address::EXIT, 1], // tick_script
        vec![operator_address::EXIT, 1], // off_script
    );

    assert_eq!(status_def.duration, 60);
    assert_eq!(status_def.stack_limit, 1);
    assert_eq!(status_def.reset_on_stack, false);
    assert!(!status_def.on_script.is_empty());
    assert!(!status_def.tick_script.is_empty());
    assert!(!status_def.off_script.is_empty());
}

#[test]
fn test_status_effect_definition_with_empty_scripts() {
    // Test that status effects can be created with empty scripts
    let status_def = StatusEffectDefinition::new(
        60,
        1,
        false,
        vec![],
        vec![],
        vec![], // All empty scripts
    );

    assert!(status_def.on_script.is_empty());
    assert!(status_def.tick_script.is_empty());
    assert!(status_def.off_script.is_empty());
}
