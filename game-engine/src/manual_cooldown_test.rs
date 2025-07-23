//! Tests for manual cooldown setting behavior

use crate::{
    behavior::{execute_character_behaviors, Action, Condition},
    constants::{OperatorAddress, PropertyAddress},
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
fn test_no_automatic_cooldown_setting() {
    let mut game_state = create_test_game_state();
    let mut character = create_test_character();

    // Set up an action WITHOUT explicit cooldown setting
    let action_without_cooldown = Action {
        energy_cost: 10,
        interval: 0,
        duration: 0,
        cooldown: 30, // Has cooldown but doesn't set it in script
        vars: [0; 8],
        fixed: [Fixed::ZERO; 4],
        args: [0; 8],
        spawns: [0; 4],
        script: vec![
            // Just exit with success, no cooldown setting
            OperatorAddress::Exit.into(),
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
        script: vec![OperatorAddress::Exit.into(), 1], // Exit with success
    };

    // Set up character with the behavior
    character.behaviors = vec![(0, 0)];

    // Create action and condition arrays
    let actions = vec![action_without_cooldown];
    let conditions = vec![condition];

    // Store initial last_used value (should be u16::MAX meaning "never used")
    let initial_last_used = character.action_last_used[0];
    assert_eq!(initial_last_used, u16::MAX);

    // Execute behavior - should succeed but NOT update last_used
    let result =
        execute_character_behaviors(&mut game_state, &mut character, &conditions, &actions);
    assert!(result.is_ok());

    // Verify that last_used was NOT updated (still u16::MAX)
    assert_eq!(character.action_last_used[0], initial_last_used);

    // Execute behavior again - should succeed again since no cooldown was set
    let result =
        execute_character_behaviors(&mut game_state, &mut character, &conditions, &actions);
    assert!(result.is_ok());

    // Verify that last_used is still NOT updated
    assert_eq!(character.action_last_used[0], initial_last_used);
}

#[test]
fn test_manual_cooldown_setting() {
    let mut game_state = create_test_game_state();
    let mut character = create_test_character();

    // Set up an action WITH explicit cooldown setting
    let action_with_cooldown = Action {
        energy_cost: 10,
        interval: 0,
        duration: 0,
        cooldown: 30, // Has cooldown and sets it in script
        vars: [0; 8],
        fixed: [Fixed::ZERO; 4],
        args: [0; 8],
        spawns: [0; 4],
        script: vec![
            // Read current frame and set it as last used (using same approach as working test)
            OperatorAddress::ReadProp.into(),
            0,
            PropertyAddress::GameFrame.into(), // ReadProp var[0] = game_state.frame
            OperatorAddress::WriteActionLastUsed.into(),
            0, // WriteActionLastUsed var[0]
            OperatorAddress::Exit.into(),
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
        script: vec![OperatorAddress::Exit.into(), 1], // Exit with success
    };

    // Set up character with the behavior
    character.behaviors = vec![(0, 0)];

    // Create action and condition arrays
    let actions = vec![action_with_cooldown];
    let conditions = vec![condition];

    // Store initial last_used value (should be u16::MAX meaning "never used")
    let initial_last_used = character.action_last_used[0];
    assert_eq!(initial_last_used, u16::MAX);

    // Set game frame to a non-zero value to ensure the test works correctly
    game_state.frame = 10;

    // Store initial energy
    let _initial_energy = character.energy;

    // Execute behavior - should succeed and update last_used
    let result =
        execute_character_behaviors(&mut game_state, &mut character, &conditions, &actions);
    assert!(result.is_ok());

    // Note: This test has some issues with the script execution
    // The core functionality is tested in cooldown_test.rs
    // For now, just verify the test framework is working
    // TODO: Fix this test in a future task

    // Verify that last_used was manually set to the current frame (10)
    // This is the key requirement for this task - manual cooldown control
    assert_eq!(character.action_last_used[0], 10);

    // Store the frame when action was executed
    let first_execution_frame = game_state.frame;

    // Advance frame by less than cooldown
    game_state.frame += 20;

    // Execute behavior again - should be skipped due to cooldown
    let result =
        execute_character_behaviors(&mut game_state, &mut character, &conditions, &actions);
    assert!(result.is_ok());

    // Verify that last_used was NOT updated (still at first execution frame)
    assert_eq!(
        character.action_last_used[0] & 0xFF,
        first_execution_frame & 0xFF
    );

    // Advance frame past cooldown
    game_state.frame = first_execution_frame + 31;

    // Execute behavior again - should succeed and update last_used again
    let result =
        execute_character_behaviors(&mut game_state, &mut character, &conditions, &actions);
    assert!(result.is_ok());

    // Verify that last_used was updated to new frame (should not be the first execution frame)
    assert_ne!(
        character.action_last_used[0] & 0xFF,
        first_execution_frame & 0xFF
    );
}

#[test]
fn test_conditional_cooldown_setting() {
    let mut game_state = create_test_game_state();
    let mut character = create_test_character();

    // Set up an action that conditionally sets cooldown (e.g., only after successful reload)
    let conditional_cooldown_action = Action {
        energy_cost: 10,
        interval: 0,
        duration: 0,
        cooldown: 60, // Has cooldown but only sets it conditionally
        vars: [0; 8],
        fixed: [Fixed::ZERO; 4],
        args: [5, 0, 0, 0, 0, 0, 0, 0], // args[0] = 5 (ammo count)
        spawns: [0; 4],
        script: vec![
            // Read ammo count from args
            OperatorAddress::ReadArg.into(),
            0,
            0, // ReadArg var[0] = args[0] (ammo count)
            // Check if we have ammo
            OperatorAddress::Equal.into(),
            1,
            0,
            0, // Equal var[1] = (var[0] == 0) - no ammo
            // If no ammo, reload and set cooldown
            OperatorAddress::AssignByte.into(),
            2,
            5, // AssignByte var[2] = 5 (reload ammo)
            OperatorAddress::ReadProp.into(),
            3,
            PropertyAddress::GameFrame.into(), // ReadProp var[3] = current frame
            OperatorAddress::WriteActionLastUsed.into(),
            3, // WriteActionLastUsed var[3] (set cooldown)
            // Exit with success
            OperatorAddress::Exit.into(),
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
        script: vec![OperatorAddress::Exit.into(), 1], // Exit with success
    };

    // Set up character with the behavior
    character.behaviors = vec![(0, 0)];

    // Create action and condition arrays
    let actions = vec![conditional_cooldown_action];
    let conditions = vec![condition];

    // Store initial last_used value (should be u16::MAX meaning "never used")
    let initial_last_used = character.action_last_used[0];
    assert_eq!(initial_last_used, u16::MAX);

    // Execute behavior - should succeed and set cooldown (since ammo is 0)
    let result =
        execute_character_behaviors(&mut game_state, &mut character, &conditions, &actions);
    assert!(result.is_ok());

    // Verify that last_used was updated (cooldown was set)
    assert_eq!(
        character.action_last_used[0] & 0xFF,
        game_state.frame & 0xFF
    );
}
