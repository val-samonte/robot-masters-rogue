//! Essential condition scripts for game loop testing
//!
//! This module provides pre-built condition scripts that can be used
//! for testing the game loop and character behaviors.

use crate::behavior::Condition;
use crate::constants::{AddressBytes, PropertyAddress};
use crate::math::Fixed;

use alloc::vec;

/// Create condition script: "Energy below 20%"
///
/// Script logic:
/// 1. Read character energy (property CharacterEnergy) into vars[0]
/// 2. Compare if energy < 20
/// 3. Exit with result (1 if true, 0 if false)
pub fn energy_below_20_percent() -> Condition {
    let script = vec![
        AddressBytes::ReadProp as u8,
        0,
        PropertyAddress::CharacterEnergy as u8, // ReadProp: Read energy into vars[0]
        AddressBytes::AssignByte as u8,
        1,
        20, // AssignByte: vars[1] = 20 (20% threshold)
        AddressBytes::LessThan as u8,
        2,
        0,
        1, // LessThan: vars[2] = (vars[0] < vars[1])
        AddressBytes::ExitWithVar as u8,
        2, // ExitWithVar: Exit with value from vars[2] (0 or 1)
    ];

    Condition {
        id: 0,
        energy_mul: Fixed::ONE,
        vars: [0; 8],
        fixed: [Fixed::ZERO; 4],
        args: [0; 8],
        spawns: [0; 4],
        script,
    }
}

/// Create condition script: "Energy below 10%"
///
/// Script logic:
/// 1. Read character energy (property CharacterEnergy) into vars[0]
/// 2. Compare if energy < 10
/// 3. Exit with result (1 if true, 0 if false)
pub fn energy_below_10_percent() -> Condition {
    let script = vec![
        AddressBytes::ReadProp as u8,
        0,
        PropertyAddress::CharacterEnergy as u8, // ReadProp: Read energy into vars[0]
        AddressBytes::AssignByte as u8,
        1,
        10, // AssignByte: vars[1] = 10 (10% threshold)
        AddressBytes::LessThan as u8,
        2,
        0,
        1, // LessThan: vars[2] = (vars[0] < vars[1])
        AddressBytes::ExitWithVar as u8,
        2, // ExitWithVar: Exit with value from vars[2] (0 or 1)
    ];

    Condition {
        id: 1,
        energy_mul: Fixed::ONE,
        vars: [0; 8],
        fixed: [Fixed::ZERO; 4],
        args: [0; 8],
        spawns: [0; 4],
        script,
    }
}

/// Create condition script: "Character on ground"
///
/// Script logic:
/// 1. Read bottom collision flag (property CharacterCollisionBottom) into vars[0]
/// 2. Exit with collision flag as result
pub fn character_on_ground() -> Condition {
    let script = vec![
        AddressBytes::ReadProp as u8,
        0,
        PropertyAddress::CharacterCollisionBottom as u8, // ReadProp: Read bottom collision into vars[0]
        AddressBytes::ExitWithVar as u8,
        0, // ExitWithVar: Exit with value from vars[0] (0 or 1)
    ];

    Condition {
        id: 2,
        energy_mul: Fixed::ONE,
        vars: [0; 8],
        fixed: [Fixed::ZERO; 4],
        args: [0; 8],
        spawns: [0; 4],
        script,
    }
}

/// Create condition script: "Character leaning on wall"
///
/// Script logic:
/// 1. Read left collision flag (property CharacterCollisionLeft) into vars[0]
/// 2. Read right collision flag (property CharacterCollisionRight) into vars[1]
/// 3. Check if either left OR right collision is true
/// 4. Exit with result
pub fn character_leaning_on_wall() -> Condition {
    let script = vec![
        AddressBytes::ReadProp as u8,
        0,
        PropertyAddress::CharacterCollisionLeft as u8, // ReadProp: Read left collision into vars[0]
        AddressBytes::ReadProp as u8,
        1,
        PropertyAddress::CharacterCollisionRight as u8, // ReadProp: Read right collision into vars[1]
        AddressBytes::Or as u8,
        2,
        0,
        1, // Or: vars[2] = (vars[0] OR vars[1])
        AddressBytes::ExitWithVar as u8,
        2, // ExitWithVar: Exit with value from vars[2] (0 or 1)
    ];

    Condition {
        id: 3,
        energy_mul: Fixed::ONE,
        vars: [0; 8],
        fixed: [Fixed::ZERO; 4],
        args: [0; 8],
        spawns: [0; 4],
        script,
    }
}

/// Create condition script: "Always true"
///
/// Script logic:
/// 1. Exit immediately with flag 1 (true)
pub fn always_true() -> Condition {
    let script = vec![
        AddressBytes::Exit as u8,
        1, // Exit with flag 1 (always true)
    ];

    Condition {
        id: 4,
        energy_mul: Fixed::ONE,
        vars: [0; 8],
        fixed: [Fixed::ZERO; 4],
        args: [0; 8],
        spawns: [0; 4],
        script,
    }
}

/// Create condition script: "Random 1 out of 20"
///
/// Script logic:
/// 1. Generate random number into vars[0]
/// 2. Calculate vars[0] % 20 into vars[1]
/// 3. Check if vars[1] == 0 (1 out of 20 chance)
/// 4. Exit with result
pub fn random_1_out_of_20() -> Condition {
    let script = vec![
        AddressBytes::AssignRandom as u8,
        0, // AssignRandom: Generate random into vars[0]
        AddressBytes::AssignByte as u8,
        1,
        20, // AssignByte: vars[1] = 20
        AddressBytes::ModByte as u8,
        2,
        0,
        1, // ModByte: vars[2] = vars[0] % vars[1]
        AddressBytes::AssignByte as u8,
        3,
        0, // AssignByte: vars[3] = 0
        AddressBytes::Equal as u8,
        4,
        2,
        3, // Equal: vars[4] = (vars[2] == vars[3])
        AddressBytes::ExitWithVar as u8,
        4, // ExitWithVar: Exit with value from vars[4] (0 or 1)
    ];

    Condition {
        id: 5,
        energy_mul: Fixed::ONE,
        vars: [0; 8],
        fixed: [Fixed::ZERO; 4],
        args: [0; 8],
        spawns: [0; 4],
        script,
    }
}

/// Create condition script: "Random 1 out of 10"
///
/// Script logic:
/// 1. Generate random number into vars[0]
/// 2. Calculate vars[0] % 10 into vars[1]
/// 3. Check if vars[1] == 0 (1 out of 10 chance)
/// 4. Exit with result
pub fn random_1_out_of_10() -> Condition {
    let script = vec![
        AddressBytes::AssignRandom as u8,
        0, // AssignRandom: Generate random into vars[0]
        AddressBytes::AssignByte as u8,
        1,
        10, // AssignByte: vars[1] = 10
        AddressBytes::ModByte as u8,
        2,
        0,
        1, // ModByte: vars[2] = vars[0] % vars[1]
        AddressBytes::AssignByte as u8,
        3,
        0, // AssignByte: vars[3] = 0
        AddressBytes::Equal as u8,
        4,
        2,
        3, // Equal: vars[4] = (vars[2] == vars[3])
        AddressBytes::ExitWithVar as u8,
        4, // ExitWithVar: Exit with value from vars[4] (0 or 1)
    ];

    Condition {
        id: 6,
        energy_mul: Fixed::ONE,
        vars: [0; 8],
        fixed: [Fixed::ZERO; 4],
        args: [0; 8],
        spawns: [0; 4],
        script,
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::entity::Character;
    use crate::state::GameState;
    use alloc::vec;

    #[test]
    fn test_energy_below_20_percent_condition() {
        let seed = 12345;
        let tilemap = [[0u8; 16]; 15];
        let mut game = GameState::new(seed, tilemap, vec![], vec![]).unwrap();

        // Test with energy above 20%
        let mut character = Character::new(1, 0);
        character.energy = 50;

        let condition = energy_below_20_percent();
        let result = condition.evaluate(&mut game, &character).unwrap();
        assert!(!result, "Energy 50 should not be below 20");

        // Test with energy below 20%
        character.energy = 15;
        let result = condition.evaluate(&mut game, &character).unwrap();
        assert!(result, "Energy 15 should be below 20");

        // Test edge case: exactly 20
        character.energy = 20;
        let result = condition.evaluate(&mut game, &character).unwrap();
        assert!(!result, "Energy 20 should not be below 20");
    }

    #[test]
    fn test_energy_below_10_percent_condition() {
        let seed = 12345;
        let tilemap = [[0u8; 16]; 15];
        let mut game = GameState::new(seed, tilemap, vec![], vec![]).unwrap();

        // Test with energy above 10%
        let mut character = Character::new(1, 0);
        character.energy = 25;

        let condition = energy_below_10_percent();
        let result = condition.evaluate(&mut game, &character).unwrap();
        assert!(!result, "Energy 25 should not be below 10");

        // Test with energy below 10%
        character.energy = 5;
        let result = condition.evaluate(&mut game, &character).unwrap();
        assert!(result, "Energy 5 should be below 10");

        // Test edge case: exactly 10
        character.energy = 10;
        let result = condition.evaluate(&mut game, &character).unwrap();
        assert!(!result, "Energy 10 should not be below 10");
    }

    #[test]
    fn test_character_on_ground_condition() {
        let seed = 12345;
        let tilemap = [[0u8; 16]; 15];
        let mut game = GameState::new(seed, tilemap, vec![], vec![]).unwrap();

        // Test character not on ground
        let mut character = Character::new(1, 0);
        character.core.collision = (false, false, false, false); // No collisions

        let condition = character_on_ground();
        let result = condition.evaluate(&mut game, &character).unwrap();
        assert!(
            !result,
            "Character should not be on ground with no bottom collision"
        );

        // Test character on ground
        character.core.collision = (false, false, true, false); // Bottom collision
        let result = condition.evaluate(&mut game, &character).unwrap();
        assert!(
            result,
            "Character should be on ground with bottom collision"
        );
    }

    #[test]
    fn test_character_leaning_on_wall_condition() {
        let seed = 12345;
        let tilemap = [[0u8; 16]; 15];
        let mut game = GameState::new(seed, tilemap, vec![], vec![]).unwrap();

        // Test character not leaning on wall
        let mut character = Character::new(1, 0);
        character.core.collision = (false, false, false, false); // No collisions

        let condition = character_leaning_on_wall();
        let result = condition.evaluate(&mut game, &character).unwrap();
        assert!(
            !result,
            "Character should not be leaning on wall with no side collisions"
        );

        // Test character leaning on left wall
        character.core.collision = (false, false, false, true); // Left collision
        let result = condition.evaluate(&mut game, &character).unwrap();
        assert!(
            result,
            "Character should be leaning on wall with left collision"
        );

        // Test character leaning on right wall
        character.core.collision = (false, true, false, false); // Right collision
        let result = condition.evaluate(&mut game, &character).unwrap();
        assert!(
            result,
            "Character should be leaning on wall with right collision"
        );

        // Test character leaning on both walls
        character.core.collision = (false, true, false, true); // Both side collisions
        let result = condition.evaluate(&mut game, &character).unwrap();
        assert!(
            result,
            "Character should be leaning on wall with both side collisions"
        );
    }

    #[test]
    fn test_always_true_condition() {
        let seed = 12345;
        let tilemap = [[0u8; 16]; 15];
        let mut game = GameState::new(seed, tilemap, vec![], vec![]).unwrap();

        let character = Character::new(1, 0);
        let condition = always_true();

        // Should always return true regardless of character state
        let result = condition.evaluate(&mut game, &character).unwrap();
        assert!(result, "Always true condition should always return true");
    }

    #[test]
    fn test_random_conditions_deterministic() {
        let seed = 12345;
        let tilemap = [[0u8; 16]; 15];

        // Create two identical game states with same seed
        let mut game1 = GameState::new(seed, tilemap, vec![], vec![]).unwrap();
        let mut game2 = GameState::new(seed, tilemap, vec![], vec![]).unwrap();

        let character = Character::new(1, 0);
        let condition_1_20 = random_1_out_of_20();
        let condition_1_10 = random_1_out_of_10();

        // Test multiple evaluations to ensure deterministic behavior
        for _ in 0..50 {
            let result1_20_game1 = condition_1_20.evaluate(&mut game1, &character).unwrap();
            let result1_20_game2 = condition_1_20.evaluate(&mut game2, &character).unwrap();
            assert_eq!(
                result1_20_game1, result1_20_game2,
                "Random 1/20 should be deterministic"
            );

            let result1_10_game1 = condition_1_10.evaluate(&mut game1, &character).unwrap();
            let result1_10_game2 = condition_1_10.evaluate(&mut game2, &character).unwrap();
            assert_eq!(
                result1_10_game1, result1_10_game2,
                "Random 1/10 should be deterministic"
            );
        }
    }

    #[test]
    fn test_random_conditions_probability() {
        let seed = 12345;
        let tilemap = [[0u8; 16]; 15];
        let mut game = GameState::new(seed, tilemap, vec![], vec![]).unwrap();

        let character = Character::new(1, 0);
        let condition_1_20 = random_1_out_of_20();
        let condition_1_10 = random_1_out_of_10();

        // Test random 1/20 condition over many iterations
        let mut true_count_20 = 0;
        let iterations = 1000;

        for _ in 0..iterations {
            if condition_1_20.evaluate(&mut game, &character).unwrap() {
                true_count_20 += 1;
            }
        }

        // Should be approximately 1/20 = 5% (allow some variance)
        let percentage_20 = (true_count_20 as f32 / iterations as f32) * 100.0;
        assert!(
            percentage_20 >= 2.0 && percentage_20 <= 8.0,
            "Random 1/20 should be around 5%, got {}%",
            percentage_20
        );

        // Test random 1/10 condition over many iterations
        let mut true_count_10 = 0;

        for _ in 0..iterations {
            if condition_1_10.evaluate(&mut game, &character).unwrap() {
                true_count_10 += 1;
            }
        }

        // Should be approximately 1/10 = 10% (allow some variance)
        let percentage_10 = (true_count_10 as f32 / iterations as f32) * 100.0;
        assert!(
            percentage_10 >= 7.0 && percentage_10 <= 13.0,
            "Random 1/10 should be around 10%, got {}%",
            percentage_10
        );
    }
}
