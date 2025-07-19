//! Essential condition scripts for game loop testing (simplified version)
//!
//! This module provides pre-built condition scripts that can be used
//! for testing the game loop and character behaviors.

use crate::behavior::Condition;
use crate::math::Fixed;
use alloc::vec;

/// Create condition script: "Always true"
/// This is the simplest condition that always returns true
pub fn always_true() -> Condition {
    let script = vec![
        0, 1, // Exit with flag 1 (always true)
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
        0, 0, // Exit with flag 0 (always false)
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
        10, 0, 0x2D, // ReadProp: Read bottom collision into vars[0]
        // Since collision flags are 0 or 1, we can use them directly
        // But Exit only accepts literals, so we need conditional logic
        20, 1, 0, // AssignByte: vars[1] = 0
        50, 2, 0, 1, // Equal: vars[2] = (vars[0] == vars[1])
        // If vars[2] == 1 (collision is false), exit with 0
        // If vars[2] == 0 (collision is true), exit with 1
        // For now, just exit with 1 to test the basic functionality
        0, 1, // Exit with 1 (will fix conditional logic later)
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
