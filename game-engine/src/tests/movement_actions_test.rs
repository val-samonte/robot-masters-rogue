//! Tests for updated movement actions

use crate::entity::{
    ActionDefinition, Character, ConditionDefinition, SpawnDefinition, StatusEffectDefinition,
};
use crate::math::Fixed;
use crate::state::GameState;
use alloc::vec;
use alloc::vec::Vec;

#[test]
fn test_run_action_with_facing_direction() {
    // Create a simple tilemap with floor
    let mut tilemap = [[0u8; 16]; 15];
    for x in 0..16 {
        tilemap[14][x] = 1; // Floor at bottom
    }

    // Create character facing right
    let mut character = Character::new(0, 0);
    character.core.pos = (Fixed::from_int(64), Fixed::from_int(192)); // On floor
    character.core.size = (16, 16);
    character.core.dir.0 = 1; // Facing right
    character.move_speed = Fixed::from_int(3);

    let characters = vec![character];

    // Create RUN action (simplified bytecode for testing)
    let run_action = ActionDefinition {
        energy_cost: 0,
        cooldown: 0,
        args: [0; 8],
        spawns: [0; 4],
        script: vec![
            10, 0, 31, // READ_PROP fixed[0] CHARACTER_MOVE_SPEED
            10, 1, 64, // READ_PROP var[1] ENTITY_DIR_HORIZONTAL
            50, 2, 1, 0, // EQUAL var[2] var[1] 0 (check if facing left)
            4, 3, 2, // SKIP 3 var[2] (if facing left, skip to negation)
            11, 20, 0, // WRITE_PROP CHARACTER_VEL_X fixed[0] (positive speed)
            0, 0, // EXIT
            34, 0, // NEGATE fixed[0] (make negative for left movement)
            11, 20, 0, // WRITE_PROP CHARACTER_VEL_X fixed[0] (negative speed)
            0, 0, // EXIT
        ],
    };

    let action_definitions = vec![run_action];
    let condition_definitions: Vec<ConditionDefinition> = vec![];
    let spawn_definitions: Vec<SpawnDefinition> = vec![];
    let status_effect_definitions: Vec<StatusEffectDefinition> = vec![];

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

    // Execute the run action manually
    let character_idx = 0;
    let action_id = 0;
    game_state
        .execute_action(character_idx, action_id)
        .expect("Failed to execute action");

    // Character should have positive velocity (moving right)
    let character = &game_state.characters[0];
    assert_eq!(
        character.core.vel.0.to_int(),
        3,
        "Character should move right with speed 3"
    );

    // Now test facing left
    game_state.characters[0].core.dir.0 = 0; // Face left
    game_state.characters[0].core.vel.0 = Fixed::ZERO; // Reset velocity

    game_state
        .execute_action(character_idx, action_id)
        .expect("Failed to execute action");

    // Character should have negative velocity (moving left)
    let character = &game_state.characters[0];
    assert_eq!(
        character.core.vel.0.to_int(),
        -3,
        "Character should move left with speed -3"
    );
}

#[test]
fn test_jump_action_only_when_grounded() {
    // Create a simple tilemap with floor
    let mut tilemap = [[0u8; 16]; 15];
    for x in 0..16 {
        tilemap[14][x] = 1; // Floor at bottom
    }

    // Create character on floor
    let mut character = Character::new(0, 0);
    character.core.pos = (Fixed::from_int(64), Fixed::from_int(192)); // On floor
    character.core.size = (16, 16);
    character.jump_force = Fixed::from_int(8);
    character.energy = 50;

    let characters = vec![character];

    // Create JUMP action (simplified bytecode for testing)
    let jump_action = ActionDefinition {
        energy_cost: 10,
        cooldown: 30,
        args: [0; 8],
        spawns: [0; 4],
        script: vec![
            10, 0, 40, // READ_PROP var[0] CHARACTER_COLLISION_BOTTOM
            4, 2, 0, // SKIP 2 var[0] (if grounded, continue)
            0, 5, // EXIT 5 (exit if not grounded)
            1, 10, // EXIT_IF_NO_ENERGY 10
            10, 2, 30, // READ_PROP fixed[2] CHARACTER_JUMP_FORCE
            34, 2, // NEGATE fixed[2]
            11, 21, 2,  // WRITE_PROP CHARACTER_VEL_Y fixed[2]
            82, // APPLY_ENERGY_COST
            0, 0, // EXIT
        ],
    };

    let action_definitions = vec![jump_action];
    let condition_definitions: Vec<ConditionDefinition> = vec![];
    let spawn_definitions: Vec<SpawnDefinition> = vec![];
    let status_effect_definitions: Vec<StatusEffectDefinition> = vec![];

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

    // Advance one frame to set collision flags
    game_state.advance_frame().expect("Failed to advance frame");

    // Character should be grounded (bottom collision = true)
    assert!(
        game_state.characters[0].core.collision.2,
        "Character should be grounded"
    );

    // Execute the jump action
    let character_idx = 0;
    let action_id = 0;
    game_state
        .execute_action(character_idx, action_id)
        .expect("Failed to execute action");

    // Character should have negative velocity (jumping up)
    let character = &game_state.characters[0];
    assert_eq!(
        character.core.vel.1.to_int(),
        -8,
        "Character should jump up with velocity -8"
    );
    assert_eq!(
        character.energy, 40,
        "Character should have consumed 10 energy"
    );

    // Now test when not grounded (in air)
    game_state.characters[0].core.pos.1 = Fixed::from_int(100); // Move up in air
    game_state.characters[0].core.vel.1 = Fixed::ZERO; // Reset velocity
    game_state.characters[0].energy = 50; // Reset energy

    // Advance frame to update collision flags
    game_state.advance_frame().expect("Failed to advance frame");

    // Character should not be grounded
    assert!(
        !game_state.characters[0].core.collision.2,
        "Character should not be grounded"
    );

    // Try to execute jump action - should fail
    game_state
        .execute_action(character_idx, action_id)
        .expect("Failed to execute action");

    // Character should not have jumped (velocity should remain 0 + gravity)
    let character = &game_state.characters[0];
    assert_ne!(
        character.core.vel.1.to_int(),
        -8,
        "Character should not jump when not grounded"
    );
    assert_eq!(
        character.energy, 50,
        "Character should not have consumed energy"
    );
}

#[test]
fn test_wall_jump_action() {
    // Create a tilemap with walls on sides
    let mut tilemap = [[0u8; 16]; 15];
    for y in 0..15 {
        tilemap[y][0] = 1; // Left wall
        tilemap[y][15] = 1; // Right wall
    }
    for x in 0..16 {
        tilemap[14][x] = 1; // Floor
    }

    // Create character against left wall, not grounded
    let mut character = Character::new(0, 0);
    character.core.pos = (Fixed::from_int(16), Fixed::from_int(100)); // Against left wall, in air
    character.core.size = (16, 16);
    character.jump_force = Fixed::from_int(8);
    character.move_speed = Fixed::from_int(3);
    character.energy = 50;

    let characters = vec![character];

    // Create WALL_JUMP action (simplified bytecode for testing)
    let wall_jump_action = ActionDefinition {
        energy_cost: 15,
        cooldown: 60,
        args: [0; 8],
        spawns: [0; 4],
        script: vec![
            10, 0, 40, // READ_PROP var[0] CHARACTER_COLLISION_BOTTOM
            4, 2, 0, // SKIP 2 var[0] (if not grounded, continue)
            0, 20, // EXIT 20 (exit if grounded)
            10, 1, 39, // READ_PROP var[1] CHARACTER_COLLISION_LEFT
            10, 2, 38, // READ_PROP var[2] CHARACTER_COLLISION_RIGHT
            61, 3, 1, 2, // OR var[3] var[1] var[2]
            4, 2, 3, // SKIP 2 var[3] (if touching wall, continue)
            0, 21, // EXIT 21 (exit if not touching wall)
            1, 15, // EXIT_IF_NO_ENERGY 15
            10, 0, 30, // READ_PROP fixed[0] CHARACTER_JUMP_FORCE
            21, 1, 3, 4, // ASSIGN_FIXED fixed[1] 3/4 (0.75)
            32, 2, 0, 1, // MUL fixed[2] fixed[0] fixed[1]
            34, 2, // NEGATE fixed[2]
            11, 21, 2, // WRITE_PROP CHARACTER_VEL_Y fixed[2]
            10, 3, 31, // READ_PROP fixed[3] CHARACTER_MOVE_SPEED
            10, 4, 37, // READ_PROP var[4] CHARACTER_COLLISION_LEFT
            4, 4, 4, // SKIP 4 var[4] (if not touching left wall, jump left)
            11, 20, 3, // WRITE_PROP CHARACTER_VEL_X fixed[3] (positive velocity - jump right)
            4, 3, 0, // SKIP 3 0 (skip negative velocity section)
            34, 3, // NEGATE fixed[3]
            11, 20, 3,  // WRITE_PROP CHARACTER_VEL_X fixed[3] (negative velocity - jump left)
            82, // APPLY_ENERGY_COST
            0, 0, // EXIT
        ],
    };

    let action_definitions = vec![wall_jump_action];
    let condition_definitions: Vec<ConditionDefinition> = vec![];
    let spawn_definitions: Vec<SpawnDefinition> = vec![];
    let status_effect_definitions: Vec<StatusEffectDefinition> = vec![];

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

    // Advance one frame to set collision flags
    game_state.advance_frame().expect("Failed to advance frame");

    // Character should be touching left wall and not grounded
    assert!(
        game_state.characters[0].core.collision.3,
        "Character should be touching left wall"
    );
    assert!(
        !game_state.characters[0].core.collision.2,
        "Character should not be grounded"
    );

    // Execute the wall jump action
    let character_idx = 0;
    let action_id = 0;
    game_state
        .execute_action(character_idx, action_id)
        .expect("Failed to execute action");

    // Character should jump up and away from wall (positive X velocity)
    let character = &game_state.characters[0];
    assert_eq!(
        character.core.vel.1.to_int(),
        -6,
        "Character should jump up with 75% of jump force (-6)"
    );
    assert_eq!(
        character.core.vel.0.to_int(),
        3,
        "Character should jump away from left wall (positive velocity)"
    );
    assert_eq!(
        character.energy, 35,
        "Character should have consumed 15 energy"
    );
}
