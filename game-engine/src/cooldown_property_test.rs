//! Tests for cooldown property access

use crate::{
    behavior::{execute_character_behaviors, Action, Condition},
    constants::PropertyAddress,
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
fn test_cooldown_property_access() {
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
        // Script that reads cooldown value using property access
        script: vec![
            10,
            0,
            PropertyAddress::ActionCooldown as u8, // ReadProp var[0] = action.cooldown
            0,
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

    // Set up an action that reads and writes last used timestamp
    let action2 = Action {
        energy_cost: 10,
        interval: 0,
        duration: 0,
        cooldown: 30,
        vars: [0; 8],
        fixed: [Fixed::ZERO; 4],
        args: [0; 8],
        spawns: [0; 4],
        script: vec![
            10,
            0,
            PropertyAddress::ActionLastUsed as u8, // ReadProp var[0] = action_last_used
            20,
            1,
            42, // AssignByte var[1] = 42
            11,
            PropertyAddress::ActionLastUsedWrite as u8,
            1, // WriteProp action_last_used = var[1]
            0,
            1, // Exit with success
        ],
    };

    // Replace the action
    let actions = vec![action2];

    // Execute behavior - should succeed
    let result =
        execute_character_behaviors(&mut game_state, &mut character, &conditions, &actions);
    assert!(result.is_ok());

    // Verify that the last_used timestamp was set to our custom value (42) by the script
    assert_eq!(character.action_last_used[0], 42);
}
