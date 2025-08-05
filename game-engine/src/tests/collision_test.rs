//! Tests for collision detection and wall constraints

use crate::entity::{
    ActionDefinition, Character, ConditionDefinition, SpawnDefinition, StatusEffectDefinition,
};
use crate::math::Fixed;
use crate::state::GameState;
use alloc::vec;
use alloc::vec::Vec;

#[test]
fn test_horizontal_wall_collision() {
    // Create a simple tilemap with walls on the sides
    let mut tilemap = [[0u8; 16]; 15];

    // Add walls on left and right edges
    for y in 0..15 {
        tilemap[y][0] = 1; // Left wall
        tilemap[y][15] = 1; // Right wall
    }

    // Create a character positioned near the left wall
    let mut character = Character::new(0, 0);
    character.core.pos = (Fixed::from_int(20), Fixed::from_int(32)); // Position close to left wall
    character.core.size = (16, 16); // 16x16 pixel character
    character.core.vel = (Fixed::from_int(-25), Fixed::ZERO); // Large velocity moving left towards wall

    let characters = vec![character];

    // Create empty definitions
    let action_definitions: Vec<ActionDefinition> = vec![];
    let condition_definitions: Vec<ConditionDefinition> = vec![];
    let spawn_definitions: Vec<SpawnDefinition> = vec![];
    let status_effect_definitions: Vec<StatusEffectDefinition> = vec![];

    // Create game state
    let mut game_state = GameState::new(
        12345,
        tilemap,
        characters,
        action_definitions,
        condition_definitions,
        spawn_definitions,
        status_effect_definitions,
    )
    .expect("Failed to create game state");

    // Advance one frame to apply collision detection
    game_state.advance_frame().expect("Failed to advance frame");

    // Character should have stopped moving left due to wall collision
    let character = &game_state.characters[0];

    // Velocity should be constrained (not the full -25 movement)
    assert!(
        character.core.vel.0.to_int() > -25,
        "Character should be stopped by wall collision"
    );

    // Left collision flag should be set
    assert!(
        character.core.collision.3,
        "Left collision flag should be set"
    );
}

#[test]
fn test_vertical_wall_collision() {
    // Create a simple tilemap with walls on top and bottom
    let mut tilemap = [[0u8; 16]; 15];

    // Add walls on top and bottom edges
    for x in 0..16 {
        tilemap[0][x] = 1; // Top wall
        tilemap[14][x] = 1; // Bottom wall
    }

    // Create a character positioned near the bottom wall
    let mut character = Character::new(0, 0);
    character.core.pos = (Fixed::from_int(128), Fixed::from_int(208)); // Position at tile (8, 13)
    character.core.size = (16, 16); // 16x16 pixel character
    character.core.vel = (Fixed::ZERO, Fixed::from_int(5)); // Moving down towards wall

    let characters = vec![character];

    // Create empty definitions
    let action_definitions: Vec<ActionDefinition> = vec![];
    let condition_definitions: Vec<ConditionDefinition> = vec![];
    let spawn_definitions: Vec<SpawnDefinition> = vec![];
    let status_effect_definitions: Vec<StatusEffectDefinition> = vec![];

    // Create game state
    let mut game_state = GameState::new(
        12345,
        tilemap,
        characters,
        action_definitions,
        condition_definitions,
        spawn_definitions,
        status_effect_definitions,
    )
    .expect("Failed to create game state");

    // Advance one frame to apply collision detection
    game_state.advance_frame().expect("Failed to advance frame");

    // Character should have stopped moving down due to wall collision
    let character = &game_state.characters[0];

    // Velocity should be constrained (not the full 5 movement)
    assert!(
        character.core.vel.1.to_int() < 5,
        "Character should be stopped by wall collision"
    );

    // Bottom collision flag should be set
    assert!(
        character.core.collision.2,
        "Bottom collision flag should be set"
    );
}

#[test]
fn test_no_collision_in_open_space() {
    // Create an empty tilemap (no walls)
    let tilemap = [[0u8; 16]; 15];

    // Create a character in the middle with some velocity
    let mut character = Character::new(0, 0);
    character.core.pos = (Fixed::from_int(128), Fixed::from_int(120)); // Middle of map
    character.core.size = (16, 16); // 16x16 pixel character
    character.core.vel = (Fixed::from_int(3), Fixed::from_int(2)); // Moving right and down

    let characters = vec![character];

    // Create empty definitions
    let action_definitions: Vec<ActionDefinition> = vec![];
    let condition_definitions: Vec<ConditionDefinition> = vec![];
    let spawn_definitions: Vec<SpawnDefinition> = vec![];
    let status_effect_definitions: Vec<StatusEffectDefinition> = vec![];

    // Create game state
    let mut game_state = GameState::new(
        12345,
        tilemap,
        characters,
        action_definitions,
        condition_definitions,
        spawn_definitions,
        status_effect_definitions,
    )
    .expect("Failed to create game state");

    // Store original velocity
    let original_vel_x = game_state.characters[0].core.vel.0;
    let _original_vel_y = game_state.characters[0].core.vel.1;

    // Advance one frame to apply collision detection
    game_state.advance_frame().expect("Failed to advance frame");

    // Character should maintain its velocity (no collision)
    let character = &game_state.characters[0];

    // Velocity should be unchanged (plus gravity effect on Y)
    assert_eq!(
        character.core.vel.0.to_int(),
        original_vel_x.to_int(),
        "Horizontal velocity should be unchanged"
    );

    // No collision flags should be set
    assert!(
        !character.core.collision.0,
        "Top collision flag should not be set"
    );
    assert!(
        !character.core.collision.1,
        "Right collision flag should not be set"
    );
    assert!(
        !character.core.collision.2,
        "Bottom collision flag should not be set"
    );
    assert!(
        !character.core.collision.3,
        "Left collision flag should not be set"
    );
}

#[test]
fn test_entity_cannot_pass_through_walls() {
    // Create a tilemap with a wall in the middle
    let mut tilemap = [[0u8; 16]; 15];

    // Add a vertical wall in the middle
    for y in 0..15 {
        tilemap[y][8] = 1; // Wall at column 8
    }

    // Create a character positioned just before the wall
    let mut character = Character::new(0, 0);
    character.core.pos = (Fixed::from_int(112), Fixed::from_int(64)); // Position at tile (7, 4) - just before wall
    character.core.size = (16, 16); // 16x16 pixel character
    character.core.vel = (Fixed::from_int(20), Fixed::ZERO); // Large velocity trying to pass through wall

    let characters = vec![character];

    // Create empty definitions
    let action_definitions: Vec<ActionDefinition> = vec![];
    let condition_definitions: Vec<ConditionDefinition> = vec![];
    let spawn_definitions: Vec<SpawnDefinition> = vec![];
    let status_effect_definitions: Vec<StatusEffectDefinition> = vec![];

    // Create game state
    let mut game_state = GameState::new(
        12345,
        tilemap,
        characters,
        action_definitions,
        condition_definitions,
        spawn_definitions,
        status_effect_definitions,
    )
    .expect("Failed to create game state");

    // Advance one frame to apply collision detection
    game_state.advance_frame().expect("Failed to advance frame");

    // Character should be stopped at the wall boundary
    let character = &game_state.characters[0];

    // Character should not have moved the full 20 pixels
    assert!(
        character.core.vel.0.to_int() < 20,
        "Character velocity should be constrained by wall"
    );

    // After position update, character should not be inside the wall
    // Wall is at x=128 (tile 8), character is 16 pixels wide, so max position should be 112
    let final_pos_x = character.core.pos.0.add(character.core.vel.0);
    assert!(
        final_pos_x.to_int() <= 112,
        "Character should not pass through wall boundary"
    );

    // Right collision flag should be set
    assert!(
        character.core.collision.1,
        "Right collision flag should be set"
    );
}
