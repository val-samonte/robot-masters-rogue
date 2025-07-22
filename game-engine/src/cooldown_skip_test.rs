//! Tests for action cooldown skipping

use crate::{
    behavior::{execute_character_behaviors, Action, Condition},
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
fn test_behavior_skipping_on_cooldown() {
    let mut game_state = create_test_game_state();
    let mut character = create_test_character();

    // Set up an action with cooldown
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
            20, 0, 1, // AssignByte var[0] = 1 (spawn ID)
            84, 0, // Spawn var[0]
            0, 1, // Exit with success
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
        script: vec![0, 1], // Exit with success
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
    assert!(spawns.len() > 0); // At least one spawn created

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
    assert!(spawns.len() > 0); // At least one spawn created
}
