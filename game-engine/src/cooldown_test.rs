//! Tests for action cooldown system

use crate::{
    behavior::{execute_character_behaviors, Action, Condition},
    constants::{AddressBytes, PropertyAddress},
    entity::Character,
    math::Fixed,
    state::GameState,
};

use alloc::vec;

// Helper functions for tests
fn create_test_character() -> Character {
    let mut character = Character::new(1, 0);
    character.energy = 100; // Ensure enough energy
    character.init_action_cooldowns(5); // Initialize cooldowns for 5 actions
    character
}

fn create_test_game_state() -> GameState {
    GameState::new(12345, [[0; 16]; 15], vec![], vec![]).unwrap()
}

#[test]
fn test_cooldown_operators() {
    let mut game_state = create_test_game_state();
    let mut character = create_test_character();

    // Set up action with cooldown
    let action = Action {
        energy_cost: 10,
        interval: 0,
        duration: 0,
        cooldown: 60, // 60 frame cooldown (1 second at 60 FPS)
        vars: [0; 8],
        fixed: [Fixed::ZERO; 4],
        args: [0; 8],
        spawns: [0; 4],
        // Script that reads cooldown value and stores it in vars[0]
        // Then writes current frame to last_used
        script: vec![
            AddressBytes::ReadActionCooldown as u8,
            0, // ReadActionCooldown var[0]
            AddressBytes::ReadProp as u8,
            1,
            PropertyAddress::GameFrame as u8, // ReadProp var[1] = game_state.frame
            AddressBytes::WriteActionLastUsed as u8,
            1, // WriteActionLastUsed var[1]
            AddressBytes::Exit as u8,
            1, // Exit with success
        ],
    };

    // Simple condition that always succeeds
    let condition = Condition {
        id: 0,
        energy_mul: Fixed::ONE,
        vars: [0; 8],
        fixed: [Fixed::ZERO; 4],
        args: [0; 8],
        spawns: [0; 4],
        script: vec![AddressBytes::Exit as u8, 1], // Exit with success
    };

    // Set up character with the test behavior
    character.behaviors = vec![(0, 0)];

    // Create action and condition arrays
    let actions = vec![action];
    let conditions = vec![condition];

    // Execute behavior - should succeed and update last_used
    let result =
        execute_character_behaviors(&mut game_state, &mut character, &conditions, &actions);
    assert!(result.is_ok());

    // Verify that last_used was updated to current frame
    assert_eq!(character.action_last_used[0], game_state.frame);

    // Advance game frame by less than cooldown
    game_state.frame += 30; // Half of cooldown period

    // Create a test action that checks if on cooldown
    let cooldown_check_action = Action {
        energy_cost: 10,
        interval: 0,
        duration: 0,
        cooldown: 60,
        vars: [0; 8],
        fixed: [Fixed::ZERO; 4],
        args: [0; 8],
        spawns: [0; 4],
        // Script that checks if action is on cooldown and stores result in vars[0]
        script: vec![
            AddressBytes::IsActionOnCooldown as u8,
            0, // IsActionOnCooldown var[0]
            AddressBytes::Exit as u8,
            1, // Exit with success
        ],
    };

    // Replace the action
    let actions = vec![cooldown_check_action];

    // Execute behavior again - should still be on cooldown
    let result =
        execute_character_behaviors(&mut game_state, &mut character, &conditions, &actions);

    // Action should be skipped due to cooldown
    assert!(result.is_ok());
    assert_eq!(result.unwrap().len(), 0); // No spawns created

    // Advance game frame beyond cooldown
    game_state.frame += 31; // Total 61 frames since last use

    // Execute behavior again - should no longer be on cooldown
    let result =
        execute_character_behaviors(&mut game_state, &mut character, &conditions, &actions);

    // Action should execute now
    assert!(result.is_ok());
}

#[test]
fn test_read_action_last_used() {
    let mut game_state = create_test_game_state();
    let mut character = create_test_character();

    // Set a specific last used timestamp
    character.action_last_used[0] = 42;

    // Action that reads the last used timestamp and then sets it to current frame
    let action = Action {
        energy_cost: 10,
        interval: 0,
        duration: 0,
        cooldown: 30,
        vars: [0; 8],
        fixed: [Fixed::ZERO; 4],
        args: [0; 8],
        spawns: [0; 4],
        script: vec![
            AddressBytes::ReadActionLastUsed as u8,
            0, // ReadActionLastUsed var[0]
            AddressBytes::ReadProp as u8,
            1,
            PropertyAddress::GameFrame as u8, // ReadProp: vars[1] = current_frame
            AddressBytes::WriteActionLastUsed as u8,
            1, // WriteActionLastUsed: set cooldown timestamp
            AddressBytes::Exit as u8,
            1, // Exit with success
        ],
    };

    // Simple condition that always succeeds
    let condition = Condition {
        id: 0,
        energy_mul: Fixed::ONE,
        vars: [0; 8],
        fixed: [Fixed::ZERO; 4],
        args: [0; 8],
        spawns: [0; 4],
        script: vec![AddressBytes::Exit as u8, 1], // Exit with success
    };

    // Set up character with the test behavior
    character.behaviors = vec![(0, 0)];

    // Create action and condition arrays
    let actions = vec![action];
    let conditions = vec![condition];

    // Execute behavior
    let result =
        execute_character_behaviors(&mut game_state, &mut character, &conditions, &actions);
    assert!(result.is_ok());

    // Verify that last_used was updated to current frame (set by WriteActionLastUsed in script)
    assert_eq!(character.action_last_used[0], game_state.frame);
}

#[test]
fn test_manual_cooldown_setting() {
    let mut game_state = create_test_game_state();
    let mut character = create_test_character();

    // Set game frame to a known value
    game_state.frame = 100;

    // Action that manually sets its last used timestamp to a specific value
    let action = Action {
        energy_cost: 10,
        interval: 0,
        duration: 0,
        cooldown: 30,
        vars: [0; 8],
        fixed: [Fixed::ZERO; 4],
        args: [0; 8],
        spawns: [0; 4],
        script: vec![
            AddressBytes::AssignByte as u8,
            0,
            50, // AssignByte var[0] = 50 (custom timestamp)
            AddressBytes::WriteActionLastUsed as u8,
            0, // WriteActionLastUsed var[0]
            AddressBytes::Exit as u8,
            1, // Exit with success
        ],
    };

    // Simple condition that always succeeds
    let condition = Condition {
        id: 0,
        energy_mul: Fixed::ONE,
        vars: [0; 8],
        fixed: [Fixed::ZERO; 4],
        args: [0; 8],
        spawns: [0; 4],
        script: vec![AddressBytes::Exit as u8, 1], // Exit with success
    };

    // Set up character with the test behavior
    character.behaviors = vec![(0, 0)];

    // Create action and condition arrays
    let actions = vec![action];
    let conditions = vec![condition];

    // Execute behavior
    let result =
        execute_character_behaviors(&mut game_state, &mut character, &conditions, &actions);
    assert!(result.is_ok());

    // Verify that last_used was set to our custom value (50) by the script
    assert_eq!(character.action_last_used[0], 50);

    // Create a new action that reads the last used timestamp
    let read_action = Action {
        energy_cost: 10,
        interval: 0,
        duration: 0,
        cooldown: 30,
        vars: [0; 8],
        fixed: [Fixed::ZERO; 4],
        args: [0; 8],
        spawns: [0; 4],
        script: vec![
            AddressBytes::ReadActionLastUsed as u8,
            0, // ReadActionLastUsed var[0]
            AddressBytes::Exit as u8,
            1, // Exit with success
        ],
    };

    // Replace the action
    let actions = vec![read_action];

    // Advance frame to avoid cooldown
    game_state.frame += 31;

    // Execute behavior
    let result =
        execute_character_behaviors(&mut game_state, &mut character, &conditions, &actions);
    assert!(result.is_ok());
}

#[test]
fn test_no_automatic_cooldown_setting() {
    let mut game_state = create_test_game_state();
    let mut character = create_test_character();

    // Set initial last_used timestamp
    character.action_last_used[0] = 50;

    // Action that does NOT set cooldown explicitly
    let action = Action {
        energy_cost: 10,
        interval: 0,
        duration: 0,
        cooldown: 30,
        vars: [0; 8],
        fixed: [Fixed::ZERO; 4],
        args: [0; 8],
        spawns: [0; 4],
        script: vec![
            AddressBytes::AssignByte as u8,
            0,
            1, // AssignByte var[0] = 1 (spawn ID)
            AddressBytes::Spawn as u8,
            0, // Spawn var[0]
            AddressBytes::Exit as u8,
            1, // Exit with success (NO WriteActionLastUsed call)
        ],
    };

    // Simple condition that always succeeds
    let condition = Condition {
        id: 0,
        energy_mul: Fixed::ONE,
        vars: [0; 8],
        fixed: [Fixed::ZERO; 4],
        args: [0; 8],
        spawns: [0; 4],
        script: vec![AddressBytes::Exit as u8, 1], // Exit with success
    };

    // Set up character with the behavior
    character.behaviors = vec![(0, 0)];

    // Create action and condition arrays
    let actions = vec![action];
    let conditions = vec![condition];

    // Execute behavior - should succeed but NOT update last_used
    let result =
        execute_character_behaviors(&mut game_state, &mut character, &conditions, &actions);
    assert!(result.is_ok());

    // Verify that last_used was NOT automatically updated (should still be 50)
    assert_eq!(character.action_last_used[0], 50);

    // Execute behavior again - should succeed again since no cooldown was set
    let result =
        execute_character_behaviors(&mut game_state, &mut character, &conditions, &actions);
    assert!(result.is_ok());

    // Verify that last_used is still unchanged
    assert_eq!(character.action_last_used[0], 50);
}

#[test]
fn test_behavior_skipping_on_cooldown() {
    let mut game_state = create_test_game_state();
    let mut character = create_test_character();

    // Set up an action with cooldown that explicitly sets its cooldown
    let action = Action {
        energy_cost: 10,
        interval: 0,
        duration: 0,
        cooldown: 60, // 1 second cooldown
        vars: [0; 8],
        fixed: [Fixed::ZERO; 4],
        args: [0; 8],
        spawns: [0; 4],
        script: vec![
            AddressBytes::AssignByte as u8,
            0,
            1, // AssignByte var[0] = 1 (spawn ID)
            AddressBytes::Spawn as u8,
            0, // Spawn var[0]
            AddressBytes::ReadProp as u8,
            1,
            PropertyAddress::GameFrame as u8, // ReadProp: vars[1] = current_frame
            AddressBytes::WriteActionLastUsed as u8,
            1, // WriteActionLastUsed: set cooldown timestamp
            AddressBytes::Exit as u8,
            1, // Exit with success
        ],
    };

    // Simple condition that always succeeds
    let condition = Condition {
        id: 0,
        energy_mul: Fixed::ONE,
        vars: [0; 8],
        fixed: [Fixed::ZERO; 4],
        args: [0; 8],
        spawns: [0; 4],
        script: vec![AddressBytes::Exit as u8, 1], // Exit with success
    };

    // Set up character with the behavior
    character.behaviors = vec![(0, 0)];

    // Create action and condition arrays
    let actions = vec![action];
    let conditions = vec![condition];

    // Execute behavior - should succeed and create a spawn
    let result =
        execute_character_behaviors(&mut game_state, &mut character, &conditions, &actions);
    assert!(result.is_ok());
    let spawns = result.unwrap();
    assert_eq!(spawns.len(), 1);
    assert_eq!(spawns[0].spawn_id, 1);

    // Store the current frame
    let first_frame = game_state.frame;

    // Advance frame by less than cooldown
    game_state.frame += 30; // Half of cooldown period

    // Execute behavior again - should be skipped due to cooldown
    let result =
        execute_character_behaviors(&mut game_state, &mut character, &conditions, &actions);
    assert!(result.is_ok());
    let spawns = result.unwrap();
    assert_eq!(spawns.len(), 0); // No spawns created - action was skipped

    // Advance frame beyond cooldown
    game_state.frame = first_frame + 61; // Just past cooldown

    // Execute behavior again - should succeed now that cooldown has passed
    let result =
        execute_character_behaviors(&mut game_state, &mut character, &conditions, &actions);
    assert!(result.is_ok());
    let spawns = result.unwrap();
    assert_eq!(spawns.len(), 1); // Action executed and created a spawn
    assert_eq!(spawns[0].spawn_id, 1);
}
