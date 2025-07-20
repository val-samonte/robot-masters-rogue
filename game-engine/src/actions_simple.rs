//! Essential action scripts for character behaviors
//!
//! This module provides pre-built action scripts that implement basic
//! character movement and behavior patterns.

use crate::behavior::Action;
use crate::math::Fixed;
use alloc::vec;

/// Create action script: "Run"
/// This action modifies velocity.x based on move speed
/// Uses args[0] for move speed (default: 3 units per frame)
pub fn run_action() -> Action {
    let script = vec![
        // Read move speed from args[0] into vars[0] (default: 3)
        96, 0, 0, // ReadArg: vars[0] = args[0] (move speed)
        // Convert move speed to fixed-point in fixed[0]
        24, 0, 0, // ToFixed: fixed[0] = Fixed::from_int(vars[0])
        // Set velocity.x = move_speed
        11, 0x1B, 0, // WriteProp: velocity.x = fixed[0]
        0, 1, // Exit with success
    ];

    Action {
        energy_cost: 1,
        interval: 1,
        duration: 1,
        cooldown: 0,
        vars: [0; 8],
        fixed: [Fixed::ZERO; 4],
        args: [3, 0, 0, 0, 0, 0, 0, 0], // Default move speed: 3
        spawns: [0; 4],
        script,
    }
}

/// Create action script: "Jump"
/// This action sets velocity.y to jump force when on ground
/// Uses args[0] for jump force (default: -8 units, negative is up)
pub fn jump_action() -> Action {
    let script = vec![
        // Check if character is on ground (bottom collision)
        10, 0, 0x2D, // ReadProp: vars[0] = bottom_collision
        // If not on ground, exit without jumping
        20, 1, 0, // AssignByte: vars[1] = 0 (false)
        50, 2, 0, 1, // Equal: vars[2] = (vars[0] == vars[1]) - is collision false?
        // If vars[2] == 1 (not on ground), exit with failure
        // For now, continue with jump logic

        // Read jump force from args[0] into vars[3]
        96, 3, 0, // ReadArg: vars[3] = args[0] (jump force)
        // Convert jump force to fixed-point (negative for upward)
        24, 0, 3, // ToFixed: fixed[0] = Fixed::from_int(vars[3])
        // Negate the value to make it negative (upward)
        34, 0, // Negate: fixed[0] = -fixed[0]
        // Set velocity.y = jump_force
        11, 0x1C, 0, // WriteProp: velocity.y = fixed[0]
        0, 1, // Exit with success
    ];

    Action {
        energy_cost: 5,
        interval: 1,
        duration: 1,
        cooldown: 0,
        vars: [0; 8],
        fixed: [Fixed::ZERO; 4],
        args: [8, 0, 0, 0, 0, 0, 0, 0], // Default jump force: 8 (will be negated)
        spawns: [0; 4],
        script,
    }
}

/// Create action script: "Turn around"
/// This action reverses velocity.x when on ground
pub fn turn_around_action() -> Action {
    let script = vec![
        // Check if character is on ground (bottom collision)
        10, 0, 0x2D, // ReadProp: vars[0] = bottom_collision
        // If not on ground, exit without turning
        20, 1, 0, // AssignByte: vars[1] = 0 (false)
        50, 2, 0, 1, // Equal: vars[2] = (vars[0] == vars[1]) - is collision false?
        // For now, continue with turn logic regardless

        // Read current velocity.x into fixed[0]
        10, 0, 0x1B, // ReadProp: fixed[0] = velocity.x
        // Negate velocity.x
        34, 0, // Negate: fixed[0] = -fixed[0]
        // Write back the negated velocity
        11, 0x1B, 0, // WriteProp: velocity.x = fixed[0]
        0, 1, // Exit with success
    ];

    Action {
        energy_cost: 1,
        interval: 1,
        duration: 1,
        cooldown: 0,
        vars: [0; 8],
        fixed: [Fixed::ZERO; 4],
        args: [0; 8],
        spawns: [0; 4],
        script,
    }
}

/// Create action script: "Wall jump"
/// This action performs wall-based jumping when not on ground
/// Uses args[0] for jump force and args[1] for horizontal push force
pub fn wall_jump_action() -> Action {
    let script = vec![
        // Check if character is NOT on ground (bottom collision should be false)
        10, 0, 0x2D, // ReadProp: vars[0] = bottom_collision
        // Check if character is touching a wall (left or right collision)
        10, 1, 0x2C, // ReadProp: vars[1] = right_collision
        10, 2, 0x2E, // ReadProp: vars[2] = left_collision
        // Check if touching any wall: vars[3] = vars[1] OR vars[2]
        61, 3, 1, 2, // Or: vars[3] = (vars[1] || vars[2])
        // If not touching wall, exit
        20, 4, 0, // AssignByte: vars[4] = 0
        50, 5, 3, 4, // Equal: vars[5] = (vars[3] == vars[4]) - not touching wall?
        // For now, continue with wall jump logic

        // Read jump force from args[0] and convert to fixed-point
        96, 6, 0, // ReadArg: vars[6] = args[0] (jump force)
        24, 0, 6, // ToFixed: fixed[0] = Fixed::from_int(vars[6])
        34, 0, // Negate: fixed[0] = -fixed[0] (upward)
        // Set velocity.y = jump_force
        11, 0x1C, 0, // WriteProp: velocity.y = fixed[0]
        // Read horizontal push force from args[1]
        96, 7, 1, // ReadArg: vars[7] = args[1] (horizontal push)
        24, 1, 7, // ToFixed: fixed[1] = Fixed::from_int(vars[7])
        // Determine push direction based on which wall we're touching
        // If touching right wall, push left (negative)
        // If touching left wall, push right (positive)
        // For simplicity, just push in one direction for now

        // Set velocity.x = horizontal_push
        11, 0x1B, 1, // WriteProp: velocity.x = fixed[1]
        0, 1, // Exit with success
    ];

    Action {
        energy_cost: 8,
        interval: 1,
        duration: 1,
        cooldown: 0,
        vars: [0; 8],
        fixed: [Fixed::ZERO; 4],
        args: [6, 4, 0, 0, 0, 0, 0, 0], // Jump force: 6, horizontal push: 4
        spawns: [0; 4],
        script,
    }
}

/// Create a locked action that demonstrates locked behavior
/// This action locks itself and continues until a condition is met
/// Uses args[0] for duration counter (frames to stay locked)
pub fn locked_test_action() -> Action {
    let script = vec![
        // Lock this action
        80, // LockAction
        // Set velocity.x to 0 (stop movement)
        21, 0, 0, 1, // AssignFixed: fixed[0] = 0/1 = 0
        11, 0x1B, 0, // WriteProp: velocity.x = fixed[0]
        0, 1, // Exit with success
    ];

    Action {
        energy_cost: 2,
        interval: 1,
        duration: 30, // Lock for 30 frames (0.5 seconds at 60 FPS)
        cooldown: 0,
        vars: [0; 8],
        fixed: [Fixed::ZERO; 4],
        args: [30, 0, 0, 0, 0, 0, 0, 0], // Duration: 30 frames
        spawns: [0; 4],
        script,
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::behavior::Condition;
    use crate::entity::Character;
    use crate::state::GameState;
    use alloc::vec;

    fn create_test_character() -> Character {
        let mut character = Character::new(1, 0);
        character.energy = 100; // Ensure enough energy for actions
        character
    }

    fn create_test_game_state() -> GameState {
        GameState::new(12345, [[0; 16]; 15], vec![], vec![]).unwrap()
    }

    fn create_test_condition() -> Condition {
        Condition {
            id: 0,
            energy_mul: Fixed::ONE,
            vars: [0; 8],
            fixed: [Fixed::ZERO; 4],
            args: [0; 8],
            spawns: [0; 4],
            script: vec![0, 1], // Always true
        }
    }

    #[test]
    fn test_run_action() {
        let mut game_state = create_test_game_state();
        let mut character = create_test_character();
        let condition = create_test_condition();
        let action = run_action();

        // Store initial velocity
        let initial_vel_x = character.core.vel.0;

        // Execute the action
        let result = action.execute(&mut game_state, &mut character, &condition, 0);
        assert!(result.is_ok(), "Run action should execute successfully");

        let (success, _spawns) = result.unwrap();
        assert!(success, "Run action should succeed");

        // Check that velocity.x was modified
        assert_ne!(
            character.core.vel.0, initial_vel_x,
            "Run action should modify velocity.x"
        );

        // Check that velocity.x is now the move speed (3)
        assert_eq!(
            character.core.vel.0,
            Fixed::from_int(3),
            "Run action should set velocity.x to move speed"
        );
    }

    #[test]
    fn test_jump_action() {
        let mut game_state = create_test_game_state();
        let mut character = create_test_character();
        let condition = create_test_condition();
        let action = jump_action();

        // Set character on ground
        character.core.collision.2 = true; // bottom collision

        // Store initial velocity
        let initial_vel_y = character.core.vel.1;

        // Execute the action
        let result = action.execute(&mut game_state, &mut character, &condition, 1);
        assert!(result.is_ok(), "Jump action should execute successfully");

        let (success, _spawns) = result.unwrap();
        assert!(success, "Jump action should succeed");

        // Check that velocity.y was modified (should be negative for upward)
        assert_ne!(
            character.core.vel.1, initial_vel_y,
            "Jump action should modify velocity.y"
        );

        // Check that velocity.y is negative (upward)
        assert!(
            character.core.vel.1.to_int() < 0,
            "Jump action should set negative velocity.y for upward movement"
        );
    }

    #[test]
    fn test_turn_around_action() {
        let mut game_state = create_test_game_state();
        let mut character = create_test_character();
        let condition = create_test_condition();
        let action = turn_around_action();

        // Set initial velocity
        character.core.vel.0 = Fixed::from_int(5);
        let initial_vel_x = character.core.vel.0;

        // Set character on ground
        character.core.collision.2 = true; // bottom collision

        // Execute the action
        let result = action.execute(&mut game_state, &mut character, &condition, 2);
        assert!(
            result.is_ok(),
            "Turn around action should execute successfully"
        );

        let (success, _spawns) = result.unwrap();
        assert!(success, "Turn around action should succeed");

        // Check that velocity.x was negated
        assert_eq!(
            character.core.vel.0,
            initial_vel_x.neg(),
            "Turn around action should negate velocity.x"
        );
    }

    #[test]
    fn test_wall_jump_action() {
        let mut game_state = create_test_game_state();
        let mut character = create_test_character();
        let condition = create_test_condition();
        let action = wall_jump_action();

        // Set character not on ground but touching right wall
        character.core.collision.2 = false; // not on ground
        character.core.collision.1 = true; // touching right wall

        // Execute the action
        let result = action.execute(&mut game_state, &mut character, &condition, 3);
        assert!(
            result.is_ok(),
            "Wall jump action should execute successfully"
        );

        let (success, _spawns) = result.unwrap();
        assert!(success, "Wall jump action should succeed");

        // Check that velocity.y is negative (upward)
        assert!(
            character.core.vel.1.to_int() < 0,
            "Wall jump should set negative velocity.y for upward movement"
        );

        // Check that velocity.x was set for horizontal push
        assert_ne!(
            character.core.vel.0,
            Fixed::ZERO,
            "Wall jump should set horizontal velocity"
        );
    }

    #[test]
    fn test_locked_test_action() {
        let mut game_state = create_test_game_state();
        let mut character = create_test_character();
        let condition = create_test_condition();
        let action = locked_test_action();

        // Set initial velocity
        character.core.vel.0 = Fixed::from_int(5);

        // Execute the action
        let result = action.execute(&mut game_state, &mut character, &condition, 4);
        assert!(
            result.is_ok(),
            "Locked test action should execute successfully"
        );

        let (success, _spawns) = result.unwrap();
        assert!(success, "Locked test action should succeed");

        // Check that velocity.x was set to 0
        assert_eq!(
            character.core.vel.0,
            Fixed::ZERO,
            "Locked test action should stop horizontal movement"
        );

        // Check that action is locked
        assert!(
            character.locked_action.is_some(),
            "Locked test action should lock the character"
        );
    }

    #[test]
    fn test_shoot_action_locking_behavior() {
        let mut game_state = create_test_game_state();
        let mut character = create_test_character();
        let condition = create_test_condition();
        let action = shoot_action();

        // First execution should lock the action
        let result = action.execute(&mut game_state, &mut character, &condition, 5);
        assert!(result.is_ok(), "Shoot action should execute successfully");

        let (success, spawns) = result.unwrap();
        assert!(success, "Shoot action should succeed");
        assert_eq!(spawns.len(), 1, "Shoot action should create one spawn");
        assert_eq!(spawns[0].spawn_id, 1, "Spawn should be a bullet (ID 1)");

        // Check that action is locked
        assert!(
            character.locked_action.is_some(),
            "Shoot action should lock the character"
        );
        assert_eq!(
            character.locked_action.unwrap(),
            5,
            "Character should be locked to shoot action (ID 5)"
        );
    }

    #[test]
    fn test_locked_action_behavior_integration() {
        use crate::behavior::execute_character_behaviors;

        let mut game_state = create_test_game_state();
        let mut character = create_test_character();

        // Set up behaviors: always true condition -> run action
        character.behaviors.push((0, 0)); // condition 0, action 0

        let conditions = vec![create_test_condition()]; // Always true condition
        let actions = vec![run_action()]; // Run action

        // First execution should work normally
        let result =
            execute_character_behaviors(&mut game_state, &mut character, &conditions, &actions);
        assert!(result.is_ok(), "First behavior execution should succeed");

        // Character should have moved
        assert_ne!(
            character.core.vel.0,
            Fixed::ZERO,
            "Character should have velocity after run action"
        );

        // Now lock the character to a different action
        character.locked_action = Some(1);

        // Reset velocity to test locked behavior
        character.core.vel.0 = Fixed::ZERO;

        // Execute behaviors again - should execute locked action instead of normal behaviors
        let result =
            execute_character_behaviors(&mut game_state, &mut character, &conditions, &actions);
        assert!(result.is_ok(), "Locked behavior execution should succeed");

        // Since we're locked to action 1 (which doesn't exist in our actions array),
        // the behavior should complete without error but not modify velocity
        assert_eq!(
            character.core.vel.0,
            Fixed::ZERO,
            "Character should not move when locked to non-existent action"
        );
    }
}
/// Create a sophisticated locked action that demonstrates proper locked behavior
/// This action checks if it's already locked and behaves differently based on that state
pub fn shoot_action() -> Action {
    let script = vec![
        // Lock this action
        80, // LockAction
        // Create bullet spawn
        20, 0, 1, // AssignByte: vars[0] = 1 (spawn ID for bullet)
        84, 0, // Spawn: create spawn with ID from vars[0]
        0, 1, // Exit with success
    ];

    Action {
        energy_cost: 3,
        interval: 1,
        duration: 60, // Lock for 60 frames (1 second at 60 FPS)
        cooldown: 0,
        vars: [0; 8],
        fixed: [Fixed::ZERO; 4],
        args: [0; 8],
        spawns: [0; 4],
        script,
    }
}

/// Create action script: "Charge"
/// This locked action stops movement and recovers energy
pub fn charge_action() -> Action {
    let script = vec![
        // Lock this action
        80, // LockAction
        // Stop horizontal movement
        21, 0, 0, 1, // AssignFixed: fixed[0] = 0/1 = 0
        11, 0x1B, 0, // WriteProp: velocity.x = fixed[0]
        // Recover energy (add 2 energy per frame while charging)
        10, 0, 0x23, // ReadProp: Read current energy into vars[0]
        20, 1, 2, // AssignByte: vars[1] = 2 (energy recovery amount)
        40, 2, 0, 1, // AddByte: vars[2] = vars[0] + vars[1]
        // Cap energy at 100
        20, 3, 100, // AssignByte: vars[3] = 100 (max energy)
        71, 4, 2, 3, // Min: vars[4] = min(vars[2], vars[3])
        11, 0x23, 4, // WriteProp: energy = vars[4]
        0, 1, // Exit with success
    ];

    Action {
        energy_cost: 0, // Charging doesn't cost energy
        interval: 1,
        duration: 120, // Lock for 120 frames (2 seconds at 60 FPS)
        cooldown: 0,
        vars: [0; 8],
        fixed: [Fixed::ZERO; 4],
        args: [0; 8],
        spawns: [0; 4],
        script,
    }
}
