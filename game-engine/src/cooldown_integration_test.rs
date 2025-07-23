//! Integration tests for cooldown-aware Action scripts

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
fn test_basic_cooldown() {
    let mut game_state = create_test_game_state();
    let mut character = create_test_character();

    // Set up an action with cooldown
    let action = Action {
        energy_cost: 10,
        interval: 0,
        duration: 0,
        cooldown: 30, // 0.5 second cooldown
        vars: [0; 8],
        fixed: [Fixed::ZERO; 4],
        args: [0; 8],
        spawns: [0; 4],
        script: vec![
            // Exit with success
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
        script: vec![0, 1], // Exit with success
    };

    // Set up character with the behavior
    character.behaviors = vec![(0, 0)];

    // Create action and condition arrays
    let actions = vec![action];
    let conditions = vec![condition];

    // Execute behavior - should succeed
    let result =
        execute_character_behaviors(&mut game_state, &mut character, &conditions, &actions);
    assert!(result.is_ok());

    // Store the current frame
    let first_frame = game_state.frame;

    // Verify that last_used was NOT automatically updated (manual cooldown only)
    assert_eq!(character.action_last_used[0], u16::MAX);

    // Advance frame by less than cooldown
    game_state.frame += 20;

    // Execute behavior again - should succeed since no cooldown was set
    let result =
        execute_character_behaviors(&mut game_state, &mut character, &conditions, &actions);
    assert!(result.is_ok());

    // Verify that last_used is still not updated (still u16::MAX)
    assert_eq!(character.action_last_used[0], u16::MAX);

    // Advance frame beyond cooldown
    game_state.frame = first_frame + 31; // Just past cooldown

    // Execute behavior again - should still succeed since no cooldown was ever set
    let result =
        execute_character_behaviors(&mut game_state, &mut character, &conditions, &actions);
    assert!(result.is_ok());

    // Verify that last_used is still not updated (still u16::MAX)
    assert_eq!(character.action_last_used[0], u16::MAX);
}
