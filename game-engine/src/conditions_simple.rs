//! Essential condition scripts for game loop testing (simplified version)
//!
//! This module provides pre-built condition scripts that can be used
//! for testing the game loop and character behaviors.

use crate::behavior::Condition;
use crate::constants::{OperatorAddress, PropertyAddress};
use crate::math::Fixed;
use alloc::vec;

/// Create condition script: "Always true"
/// This is the simplest condition that always returns true
pub fn always_true() -> Condition {
    let script = vec![
        OperatorAddress::Exit.into(),
        1, // Exit with flag 1 (always true)
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

/// Create condition script: "Always false"
/// This is a simple condition that always returns false (for testing)
pub fn always_false() -> Condition {
    let script = vec![
        OperatorAddress::Exit.into(),
        0, // Exit with flag 0 (always false)
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
/// This reads the bottom collision flag and exits with 1 if true, 0 if false
pub fn character_on_ground() -> Condition {
    let script = vec![
        OperatorAddress::ReadProp.into(),
        0,
        PropertyAddress::CharacterCollisionBottom.into(), // ReadProp: Read bottom collision into vars[0]
        OperatorAddress::ExitWithVar.into(),
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
/// This checks if character is touching left or right wall
pub fn character_leaning_on_wall() -> Condition {
    let script = vec![
        OperatorAddress::ReadProp.into(),
        0,
        PropertyAddress::CharacterCollisionRight.into(), // ReadProp: Read right collision into vars[0]
        OperatorAddress::ReadProp.into(),
        1,
        PropertyAddress::CharacterCollisionLeft.into(), // ReadProp: Read left collision into vars[1]
        OperatorAddress::Or.into(),
        2,
        0,
        1, // Or: vars[2] = (vars[0] || vars[1])
        OperatorAddress::ExitWithVar.into(),
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

/// Create condition script: "Energy below 20%"
/// This checks if character energy is below 20% of maximum (assuming max 100)
pub fn energy_below_20_percent() -> Condition {
    let script = vec![
        OperatorAddress::ReadProp.into(),
        0,
        PropertyAddress::CharacterEnergy.into(), // ReadProp: Read energy into vars[0]
        OperatorAddress::AssignByte.into(),
        1,
        20, // AssignByte: vars[1] = 20 (20% threshold)
        OperatorAddress::LessThan.into(),
        2,
        0,
        1, // LessThan: vars[2] = (vars[0] < vars[1])
        OperatorAddress::ExitWithVar.into(),
        2, // ExitWithVar: Exit with value from vars[2] (0 or 1)
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

/// Create condition script: "Energy below 10%"
/// This checks if character energy is below 10% of maximum (assuming max 100)
pub fn energy_below_10_percent() -> Condition {
    let script = vec![
        OperatorAddress::ReadProp.into(),
        0,
        PropertyAddress::CharacterEnergy.into(), // ReadProp: Read energy into vars[0]
        OperatorAddress::AssignByte.into(),
        1,
        10, // AssignByte: vars[1] = 10 (10% threshold)
        OperatorAddress::LessThan.into(),
        2,
        0,
        1, // LessThan: vars[2] = (vars[0] < vars[1])
        OperatorAddress::ExitWithVar.into(),
        2, // ExitWithVar: Exit with value from vars[2] (0 or 1)
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

/// Create condition script: "Random 1 out of 20"
/// This uses seeded randomization to return true 1/20 of the time
pub fn random_1_out_of_20() -> Condition {
    let script = vec![
        OperatorAddress::AssignRandom.into(),
        0, // AssignRandom: vars[0] = random_u8()
        OperatorAddress::AssignByte.into(),
        1,
        20, // AssignByte: vars[1] = 20 (divisor)
        OperatorAddress::ModByte.into(),
        2,
        0,
        1, // ModByte: vars[2] = vars[0] % vars[1]
        OperatorAddress::AssignByte.into(),
        3,
        0, // AssignByte: vars[3] = 0 (comparison value)
        OperatorAddress::Equal.into(),
        4,
        2,
        3, // Equal: vars[4] = (vars[2] == vars[3])
        OperatorAddress::ExitWithVar.into(),
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

/// Create condition script: "Random 1 out of 10"
/// This uses seeded randomization to return true 1/10 of the time
pub fn random_1_out_of_10() -> Condition {
    let script = vec![
        OperatorAddress::AssignRandom.into(),
        0, // AssignRandom: vars[0] = random_u8()
        OperatorAddress::AssignByte.into(),
        1,
        10, // AssignByte: vars[1] = 10 (divisor)
        OperatorAddress::ModByte.into(),
        2,
        0,
        1, // ModByte: vars[2] = vars[0] % vars[1]
        OperatorAddress::AssignByte.into(),
        3,
        0, // AssignByte: vars[3] = 0 (comparison value)
        OperatorAddress::Equal.into(),
        4,
        2,
        3, // Equal: vars[4] = (vars[2] == vars[3])
        OperatorAddress::ExitWithVar.into(),
        4, // ExitWithVar: Exit with value from vars[4] (0 or 1)
    ];

    Condition {
        id: 7,
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
    fn test_always_true_condition() {
        let seed = 12345;
        let tilemap = [[0u8; 16]; 15];
        let mut game = GameState::new(seed, tilemap, vec![], vec![]).unwrap();

        let character = Character::new(1, 0);
        let condition = always_true();

        let result = condition.evaluate(&mut game, &character).unwrap();
        assert!(result, "Always true condition should always return true");
    }

    #[test]
    fn test_always_false_condition() {
        let seed = 12345;
        let tilemap = [[0u8; 16]; 15];
        let mut game = GameState::new(seed, tilemap, vec![], vec![]).unwrap();

        let character = Character::new(1, 0);
        let condition = always_false();

        let result = condition.evaluate(&mut game, &character).unwrap();
        assert!(!result, "Always false condition should always return false");
    }

    #[test]
    fn test_character_on_ground_basic() {
        let seed = 12345;
        let tilemap = [[0u8; 16]; 15];
        let mut game = GameState::new(seed, tilemap, vec![], vec![]).unwrap();

        let character = Character::new(1, 0);
        let condition = character_on_ground();

        // This test just verifies the condition doesn't crash
        let result = condition.evaluate(&mut game, &character);
        assert!(
            result.is_ok(),
            "Character on ground condition should not crash"
        );
    }
}
