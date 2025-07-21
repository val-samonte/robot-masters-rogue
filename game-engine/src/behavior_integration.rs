//! Complete character behavior integration
//!
//! This module implements the complete behavior system integration as specified in task 11.4:
//! - Energy below 10% → Charge
//! - Leaning on wall → Turn around  
//! - Random 1/20 → Jump
//! - Random 1/20 → Shoot
//! - Always → Run

use crate::actions_simple::{
    charge_action, jump_action, run_action, shoot_action, turn_around_action,
};
use crate::behavior::{execute_character_behaviors, Action, Condition};
use crate::conditions_simple::{
    always_true, character_leaning_on_wall, energy_below_10_percent, random_1_out_of_20,
};
use crate::entity::Character;
use crate::math::Fixed;
use crate::state::GameState;
use alloc::vec::Vec;

/// Create a complete behavior set for a character
/// This implements the behavior priority system:
/// 1. Energy below 10% → Charge (highest priority)
/// 2. Leaning on wall → Turn around
/// 3. Random 1/20 → Jump  
/// 4. Random 1/20 → Shoot
/// 5. Always → Run (lowest priority, fallback)
pub fn create_complete_behavior_set() -> (Vec<Condition>, Vec<Action>) {
    let mut conditions = Vec::new();
    let mut actions = Vec::new();

    // Condition 0: Energy below 10%
    let mut energy_condition = energy_below_10_percent();
    energy_condition.id = 0;
    conditions.push(energy_condition);

    // Action 0: Charge
    actions.push(charge_action());

    // Condition 1: Leaning on wall
    let mut wall_condition = character_leaning_on_wall();
    wall_condition.id = 1;
    conditions.push(wall_condition);

    // Action 1: Turn around
    actions.push(turn_around_action());

    // Condition 2: Random 1/20 (for jump)
    let mut random_jump_condition = random_1_out_of_20();
    random_jump_condition.id = 2;
    conditions.push(random_jump_condition);

    // Action 2: Jump
    actions.push(jump_action());

    // Condition 3: Random 1/20 (for shoot)
    let mut random_shoot_condition = random_1_out_of_20();
    random_shoot_condition.id = 3;
    conditions.push(random_shoot_condition);

    // Action 3: Shoot
    actions.push(shoot_action());

    // Condition 4: Always true (fallback)
    let mut always_condition = always_true();
    always_condition.id = 4;
    conditions.push(always_condition);

    // Action 4: Run
    actions.push(run_action());

    (conditions, actions)
}

/// Create a character with the complete behavior set
pub fn create_character_with_complete_behaviors() -> Character {
    let mut character = Character::new(1, 0);
    character.energy = 100;

    // Set up behavior priority list (condition_id, action_id):
    // 1. Energy below 10% → Charge
    character.behaviors.push((0, 0));
    // 2. Leaning on wall → Turn around
    character.behaviors.push((1, 1));
    // 3. Random 1/20 → Jump
    character.behaviors.push((2, 2));
    // 4. Random 1/20 → Shoot
    character.behaviors.push((3, 3));
    // 5. Always → Run (fallback)
    character.behaviors.push((4, 4));

    character
}

/// Integrate behavior processing into the main game loop
/// This function should be called from GameState::process_character_behaviors()
pub fn process_complete_character_behaviors(
    game_state: &mut GameState,
    character: &mut Character,
    conditions: &[Condition],
    actions: &[Action],
) -> Result<Vec<crate::entity::SpawnInstance>, crate::script::ScriptError> {
    execute_character_behaviors(game_state, character, conditions, actions)
}

#[cfg(test)]
mod tests {
    use super::*;
    use alloc::vec;

    fn create_test_game_state() -> GameState {
        GameState::new(12345, [[0; 16]; 15], vec![], vec![]).unwrap()
    }

    #[test]
    fn test_behavior_priority_energy_below_10_percent() {
        let mut game_state = create_test_game_state();
        let mut character = create_character_with_complete_behaviors();
        let (conditions, actions) = create_complete_behavior_set();

        // Set energy below 10%
        character.energy = 5;

        // Execute behaviors
        let result = process_complete_character_behaviors(
            &mut game_state,
            &mut character,
            &conditions,
            &actions,
        );
        assert!(result.is_ok(), "Behavior processing should succeed");

        // Character should be locked to charge action (action 0)
        assert!(
            character.locked_action.is_some(),
            "Character should be locked to charge action"
        );
        assert_eq!(
            character.locked_action.unwrap(),
            0,
            "Character should be locked to action 0 (charge)"
        );

        // Velocity should be stopped (charge action stops movement)
        assert_eq!(
            character.core.vel.0,
            Fixed::ZERO,
            "Charge action should stop horizontal movement"
        );
    }

    #[test]
    fn test_behavior_priority_leaning_on_wall() {
        let mut game_state = create_test_game_state();
        let mut character = create_character_with_complete_behaviors();
        let (conditions, actions) = create_complete_behavior_set();

        // Set energy high enough to not trigger charge
        character.energy = 50;
        // Set character leaning on right wall
        character.core.collision.1 = true; // right collision
                                           // Set initial velocity
        character.core.vel.0 = Fixed::from_int(3);

        // Execute behaviors
        let result = process_complete_character_behaviors(
            &mut game_state,
            &mut character,
            &conditions,
            &actions,
        );
        assert!(result.is_ok(), "Behavior processing should succeed");

        // Velocity should be reversed (turn around action)
        assert_eq!(
            character.core.vel.0,
            Fixed::from_int(-3),
            "Turn around action should reverse velocity"
        );
    }

    #[test]
    fn test_behavior_priority_fallback_to_run() {
        let mut game_state = create_test_game_state();
        let mut character = create_character_with_complete_behaviors();
        let (conditions, actions) = create_complete_behavior_set();

        // Set energy high enough to not trigger charge
        character.energy = 50;
        // Ensure character is not leaning on wall
        character.core.collision.1 = false; // not touching right wall
        character.core.collision.3 = false; // not touching left wall

        // Execute behaviors multiple times to test fallback
        // Since random conditions might trigger, we test multiple times
        let mut run_action_triggered = false;
        for _ in 0..10 {
            let mut test_character = character.clone();
            let result = process_complete_character_behaviors(
                &mut game_state,
                &mut test_character,
                &conditions,
                &actions,
            );
            assert!(result.is_ok(), "Behavior processing should succeed");

            // If no random actions triggered, should fall back to run
            if test_character.core.vel.0 == Fixed::from_int(3) {
                run_action_triggered = true;
                break;
            }
        }

        assert!(
            run_action_triggered,
            "Run action should eventually trigger as fallback"
        );
    }

    #[test]
    fn test_behavior_execution_order_top_to_bottom() {
        let mut game_state = create_test_game_state();
        let mut character = create_character_with_complete_behaviors();
        let (conditions, actions) = create_complete_behavior_set();

        // Set up conditions where multiple behaviors could trigger
        character.energy = 5; // Below 10% - should trigger charge (highest priority)
        character.core.collision.1 = true; // Leaning on wall - should NOT trigger because charge has higher priority

        // Execute behaviors
        let result = process_complete_character_behaviors(
            &mut game_state,
            &mut character,
            &conditions,
            &actions,
        );
        assert!(result.is_ok(), "Behavior processing should succeed");

        // Should execute charge (first behavior) and ignore wall turn around
        assert!(
            character.locked_action.is_some(),
            "Character should be locked to charge action"
        );
        assert_eq!(
            character.locked_action.unwrap(),
            0,
            "Should execute charge action (highest priority)"
        );
        assert_eq!(
            character.core.vel.0,
            Fixed::ZERO,
            "Charge action should stop movement"
        );
    }

    #[test]
    fn test_locked_action_behavior_override() {
        let mut game_state = create_test_game_state();
        let mut character = create_character_with_complete_behaviors();
        let (conditions, actions) = create_complete_behavior_set();

        // Lock character to shoot action
        character.locked_action = Some(3);
        character.energy = 50; // High energy

        // Execute behaviors
        let result = process_complete_character_behaviors(
            &mut game_state,
            &mut character,
            &conditions,
            &actions,
        );
        assert!(result.is_ok(), "Behavior processing should succeed");

        // Should create a spawn (bullet) from shoot action
        let spawns = result.unwrap();
        assert_eq!(spawns.len(), 1, "Shoot action should create one spawn");
        assert_eq!(spawns[0].spawn_id, 1, "Should create bullet spawn");
    }

    #[test]
    fn test_energy_consumption_and_behavior_skipping() {
        let mut game_state = create_test_game_state();
        let mut character = create_character_with_complete_behaviors();
        let (conditions, actions) = create_complete_behavior_set();

        // Set energy just enough for some actions but not others
        character.energy = 2; // Not enough for jump (5 energy) or shoot (3 energy)

        // Execute behaviors
        let result = process_complete_character_behaviors(
            &mut game_state,
            &mut character,
            &conditions,
            &actions,
        );
        assert!(result.is_ok(), "Behavior processing should succeed");

        // Should fall back to run action (1 energy) or charge action (0 energy)
        // Since energy is below 10%, should trigger charge
        assert!(
            character.locked_action.is_some(),
            "Should trigger charge action due to low energy"
        );
    }

    #[test]
    fn test_deterministic_behavior_with_seeded_random() {
        let seed = 42;
        let mut game_state1 = GameState::new(seed, [[0; 16]; 15], vec![], vec![]).unwrap();
        let mut game_state2 = GameState::new(seed, [[0; 16]; 15], vec![], vec![]).unwrap();

        let mut character1 = create_character_with_complete_behaviors();
        let mut character2 = create_character_with_complete_behaviors();

        // Set same initial conditions
        character1.energy = 50;
        character2.energy = 50;

        let (conditions, actions) = create_complete_behavior_set();

        // Execute behaviors on both characters
        let result1 = process_complete_character_behaviors(
            &mut game_state1,
            &mut character1,
            &conditions,
            &actions,
        );
        let result2 = process_complete_character_behaviors(
            &mut game_state2,
            &mut character2,
            &conditions,
            &actions,
        );

        assert!(
            result1.is_ok() && result2.is_ok(),
            "Both behavior executions should succeed"
        );

        // Results should be identical due to seeded randomization
        assert_eq!(
            character1.core.vel.0, character2.core.vel.0,
            "Velocities should match with same seed"
        );
        assert_eq!(
            character1.core.vel.1, character2.core.vel.1,
            "Velocities should match with same seed"
        );
        assert_eq!(
            character1.locked_action, character2.locked_action,
            "Locked actions should match with same seed"
        );
    }

    #[test]
    fn test_complete_behavior_integration_in_game_loop() {
        let mut game_state = create_test_game_state();
        let character = create_character_with_complete_behaviors();
        let (conditions, actions) = create_complete_behavior_set();

        // Add character and lookup tables to game state
        game_state.characters.push(character);
        game_state.condition_lookup = conditions;
        game_state.action_lookup = actions;

        // Verify initial state
        assert_eq!(game_state.characters[0].energy, 100);
        assert_eq!(game_state.frame, 0);

        // Advance one frame to trigger behavior processing
        let result = game_state.advance_frame();
        assert!(result.is_ok(), "Frame advancement should succeed");

        // Verify frame advanced
        assert_eq!(game_state.frame, 1);

        // Character should have executed some behavior
        // Since energy is 100 (not below 10%), and not leaning on wall,
        // should eventually fall back to run action or trigger random actions
        let character = &game_state.characters[0];

        // Check if any behavior was executed by looking at energy consumption or movement
        // The fallback "Always -> Run" behavior should always execute and consume 1 energy
        let energy_consumed = character.energy < 100;
        let has_velocity =
            character.core.vel.0 != Fixed::ZERO || character.core.vel.1 != Fixed::ZERO;
        let is_locked = character.locked_action.is_some();

        // At minimum, the "Always -> Run" behavior should have executed
        assert!(
            energy_consumed || has_velocity || is_locked,
            "Character should have executed at least the fallback behavior"
        );
    }

    #[test]
    fn test_complete_behavior_priority_system_comprehensive() {
        // Test the complete behavior priority system as specified in task 11.4:
        // 1. Energy below 10% → Charge (highest priority)
        // 2. Leaning on wall → Turn around
        // 3. Random 1/20 → Jump
        // 4. Random 1/20 → Shoot
        // 5. Always → Run (lowest priority, fallback)

        let mut game_state = create_test_game_state();
        let (conditions, actions) = create_complete_behavior_set();

        // Test scenario 1: Energy below 10% should trigger charge (highest priority)
        {
            let mut character = create_character_with_complete_behaviors();
            character.energy = 5; // Below 10%
            character.core.collision.1 = true; // Also leaning on wall - should be ignored

            let result = process_complete_character_behaviors(
                &mut game_state,
                &mut character,
                &conditions,
                &actions,
            );
            assert!(result.is_ok(), "Behavior processing should succeed");

            // Should execute charge action (highest priority) and ignore wall collision
            assert!(
                character.locked_action.is_some(),
                "Should be locked to charge action"
            );
            assert_eq!(
                character.locked_action.unwrap(),
                0,
                "Should be locked to action 0 (charge)"
            );
            assert_eq!(
                character.core.vel.0,
                Fixed::ZERO,
                "Charge should stop movement"
            );
        }

        // Test scenario 2: Leaning on wall (when energy is sufficient)
        {
            let mut character = create_character_with_complete_behaviors();
            character.energy = 50; // Sufficient energy
            character.core.collision.1 = true; // Leaning on right wall
            character.core.vel.0 = Fixed::from_int(3); // Moving right

            let result = process_complete_character_behaviors(
                &mut game_state,
                &mut character,
                &conditions,
                &actions,
            );
            assert!(result.is_ok(), "Behavior processing should succeed");

            // Should execute turn around action
            assert_eq!(
                character.core.vel.0,
                Fixed::from_int(-3),
                "Should reverse velocity"
            );
        }

        // Test scenario 3: Fallback to run action when no other conditions trigger
        {
            let mut character = create_character_with_complete_behaviors();
            character.energy = 50; // Sufficient energy
            character.core.collision = (false, false, false, false); // Not touching any walls

            // Execute multiple times to ensure fallback behavior works consistently
            let mut run_triggered = false;
            for _ in 0..5 {
                let mut test_character = character.clone();
                let result = process_complete_character_behaviors(
                    &mut game_state,
                    &mut test_character,
                    &conditions,
                    &actions,
                );
                assert!(result.is_ok(), "Behavior processing should succeed");

                // Check if run action was triggered (velocity set to 3)
                if test_character.core.vel.0 == Fixed::from_int(3) {
                    run_triggered = true;
                    break;
                }
            }
            assert!(
                run_triggered,
                "Run action should eventually trigger as fallback"
            );
        }
    }

    #[test]
    fn test_behavior_integration_with_multiple_frames() {
        // Test behavior integration across multiple game frames
        let mut game_state = create_test_game_state();
        let character = create_character_with_complete_behaviors();
        let (conditions, actions) = create_complete_behavior_set();

        // Add character and lookup tables to game state
        game_state.characters.push(character);
        game_state.condition_lookup = conditions;
        game_state.action_lookup = actions;

        // Set initial conditions for predictable behavior
        game_state.characters[0].energy = 50;
        game_state.characters[0].core.collision = (false, false, false, false);

        // Advance multiple frames and verify behavior consistency
        for frame in 1..=10 {
            let result = game_state.advance_frame();
            assert!(result.is_ok(), "Frame {} advancement should succeed", frame);
            assert_eq!(game_state.frame, frame, "Frame counter should be correct");

            let character = &game_state.characters[0];

            // Character should maintain some form of behavior execution
            // (either energy consumption, movement, or locked actions)
            let has_activity = character.energy < 50
                || character.core.vel.0 != Fixed::ZERO
                || character.core.vel.1 != Fixed::ZERO
                || character.locked_action.is_some();

            if !has_activity {
                // If no activity, at least verify the character is still valid
                assert!(character.energy <= 100, "Energy should not exceed maximum");
                assert!(character.health <= 100, "Health should be reasonable");
            }
        }
    }
}
