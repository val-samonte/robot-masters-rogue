//! Common test utilities to reduce code duplication

#[cfg(test)]
use crate::{entity::Character, state::GameState};
#[cfg(test)]
use alloc::vec;

#[cfg(test)]
pub fn create_test_character() -> Character {
    let mut character = Character::new(1, 0);
    character.energy = 100; // Ensure enough energy for tests
    character.health = 100; // Ensure full health for tests
    character
}

#[cfg(test)]
pub fn create_test_game_state() -> GameState {
    GameState::new(12345, [[0; 16]; 15], vec![], vec![]).unwrap()
}
