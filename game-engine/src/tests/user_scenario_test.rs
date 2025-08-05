//! Test the specific user scenario

use crate::entity::{
    ActionDefinition, Character, ConditionDefinition, SpawnDefinition, StatusEffectDefinition,
};
use crate::math::Fixed;
use crate::state::GameState;
use alloc::vec;
use alloc::vec::Vec;

#[test]
fn test_user_scenario_character_on_floor() {
    // Create the exact tilemap from user's config
    let tilemap = [
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ];

    // Create character with user's exact configuration
    let mut character = Character::new(1, 1);
    character.core.pos = (Fixed::from_int(32), Fixed::from_int(192)); // Position from user config
    character.core.size = (16, 32); // Size from user config
    character.core.vel = (Fixed::ZERO, Fixed::ZERO); // Start with no velocity

    let characters = vec![character];

    // Create empty definitions
    let action_definitions: Vec<ActionDefinition> = vec![];
    let condition_definitions: Vec<ConditionDefinition> = vec![];
    let spawn_definitions: Vec<SpawnDefinition> = vec![];
    let status_effect_definitions: Vec<StatusEffectDefinition> = vec![];

    // Create game state with gravity (like user's config)
    let mut game_state = GameState::new_with_gravity(
        12345,
        tilemap,
        Fixed::from_int(1), // Gravity from user config
        characters,
        action_definitions,
        condition_definitions,
        spawn_definitions,
        status_effect_definitions,
    )
    .expect("Failed to create game state");

    // Test multiple frames to ensure character stays on floor
    for frame in 0..20 {
        let initial_y = game_state.characters[0].core.pos.1.to_int();

        game_state.advance_frame().expect("Failed to advance frame");

        let character = &game_state.characters[0];
        let final_y = character.core.pos.1.to_int();

        // Character should not sink through the floor
        // Bottom wall is at tile row 14, which is y=224 (14 * 16)
        // Character is 32 pixels tall, so should rest at y=192 (224 - 32)
        assert_eq!(
            final_y, 192,
            "Character should rest on floor at y=192 on frame {}",
            frame
        );

        // Character should be standing on ground (bottom collision flag set)
        assert!(
            character.core.collision.2,
            "Character should have bottom collision (standing on ground) on frame {}",
            frame
        );

        // Character should not be sinking or moving vertically
        assert_eq!(
            character.core.vel.1.to_int(),
            0,
            "Character should have zero vertical velocity when on ground on frame {}",
            frame
        );
    }
}

#[test]
fn test_character_walking_on_floor() {
    // Create the exact tilemap from user's config
    let tilemap = [
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ];

    // Create character with user's exact configuration
    let mut character = Character::new(1, 1);
    character.core.pos = (Fixed::from_int(32), Fixed::from_int(192)); // Position from user config
    character.core.size = (16, 32); // Size from user config
    character.core.vel = (Fixed::from_int(2), Fixed::ZERO); // Moving right

    let characters = vec![character];

    // Create empty definitions
    let action_definitions: Vec<ActionDefinition> = vec![];
    let condition_definitions: Vec<ConditionDefinition> = vec![];
    let spawn_definitions: Vec<SpawnDefinition> = vec![];
    let status_effect_definitions: Vec<StatusEffectDefinition> = vec![];

    // Create game state with gravity
    let mut game_state = GameState::new_with_gravity(
        12345,
        tilemap,
        Fixed::from_int(1), // Gravity
        characters,
        action_definitions,
        condition_definitions,
        spawn_definitions,
        status_effect_definitions,
    )
    .expect("Failed to create game state");

    let initial_x = game_state.characters[0].core.pos.0.to_int();

    // Test multiple frames to ensure character walks right while staying on floor
    for frame in 0..10 {
        game_state.advance_frame().expect("Failed to advance frame");

        let character = &game_state.characters[0];
        let current_x = character.core.pos.0.to_int();
        let current_y = character.core.pos.1.to_int();

        // Character should move right
        assert!(
            current_x > initial_x,
            "Character should move right on frame {}",
            frame
        );

        // Character should stay on floor
        assert_eq!(
            current_y, 192,
            "Character should stay on floor at y=192 on frame {}",
            frame
        );

        // Character should be standing on ground
        assert!(
            character.core.collision.2,
            "Character should have bottom collision on frame {}",
            frame
        );
    }
}
