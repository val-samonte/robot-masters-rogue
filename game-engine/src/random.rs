//! Deterministic seeded pseudo-random number generator
//!
//! This module provides a Linear Congruential Generator (LCG) implementation
//! that ensures reproducible sequences with the same seed values.

/// Deterministic pseudo-random number generator using Linear Congruential Generator
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct SeededRng {
    state: u16,
    initial_seed: u16,
}

impl SeededRng {
    /// LCG constants for good distribution with 16-bit arithmetic
    /// These constants are chosen to provide a full period of 65536
    const MULTIPLIER: u16 = 25173;
    const INCREMENT: u16 = 13849;

    /// Create a new seeded random number generator
    pub fn new(seed: u16) -> Self {
        Self {
            state: seed,
            initial_seed: seed,
        }
    }

    /// Generate the next random u16 value
    pub fn next_u16(&mut self) -> u16 {
        self.state = self
            .state
            .wrapping_mul(Self::MULTIPLIER)
            .wrapping_add(Self::INCREMENT);
        self.state
    }

    /// Generate a random u8 value
    pub fn next_u8(&mut self) -> u8 {
        (self.next_u16() >> 8) as u8
    }

    /// Generate a random value in the range [0, max)
    pub fn next_range(&mut self, max: u16) -> u16 {
        if max == 0 {
            return 0;
        }
        self.next_u16() % max
    }

    /// Generate a random boolean value
    pub fn next_bool(&mut self) -> bool {
        (self.next_u16() & 1) == 1
    }

    /// Reset the generator to its initial seed
    pub fn reset(&mut self) {
        self.state = self.initial_seed;
    }

    /// Get the current state (for debugging/testing)
    pub fn current_state(&self) -> u16 {
        self.state
    }

    /// Get the initial seed (for debugging/testing)
    pub fn initial_seed(&self) -> u16 {
        self.initial_seed
    }
}
