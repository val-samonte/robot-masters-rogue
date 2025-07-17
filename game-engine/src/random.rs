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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_deterministic_sequence() {
        let mut rng1 = SeededRng::new(12345);
        let mut rng2 = SeededRng::new(12345);

        // Generate several values and ensure they match
        for _ in 0..100 {
            assert_eq!(rng1.next_u16(), rng2.next_u16());
        }
    }

    #[test]
    fn test_different_seeds_produce_different_sequences() {
        let mut rng1 = SeededRng::new(12345);
        let mut rng2 = SeededRng::new(54321);

        let mut differences = 0;
        for _ in 0..100 {
            if rng1.next_u16() != rng2.next_u16() {
                differences += 1;
            }
        }

        // Should have many differences (not a strict requirement but good indicator)
        assert!(differences > 80);
    }

    #[test]
    fn test_reset_functionality() {
        let mut rng = SeededRng::new(12345);

        // Generate some values
        let first_value = rng.next_u16();
        let second_value = rng.next_u16();

        // Reset and verify we get the same sequence
        rng.reset();
        assert_eq!(rng.next_u16(), first_value);
        assert_eq!(rng.next_u16(), second_value);
    }

    #[test]
    fn test_range_generation() {
        let mut rng = SeededRng::new(12345);

        // Test range generation
        for _ in 0..100 {
            let value = rng.next_range(10);
            assert!(value < 10);
        }

        // Test edge case
        assert_eq!(rng.next_range(0), 0);
        assert_eq!(rng.next_range(1), 0);
    }

    #[test]
    fn test_u8_generation() {
        let mut rng = SeededRng::new(12345);

        // Generate several u8 values and ensure they're valid
        for _ in 0..100 {
            let _value = rng.next_u8(); // Should not panic
        }
    }

    #[test]
    fn test_bool_generation() {
        let mut rng = SeededRng::new(12345);

        let mut true_count = 0;
        let mut false_count = 0;

        for _ in 0..1000 {
            if rng.next_bool() {
                true_count += 1;
            } else {
                false_count += 1;
            }
        }

        // Should have a reasonable distribution (not too strict)
        assert!(true_count > 300);
        assert!(false_count > 300);
    }

    #[test]
    fn test_full_period_coverage() {
        let mut rng = SeededRng::new(1);
        let mut seen_values = alloc::collections::BTreeSet::new();

        // Test a smaller subset to verify we don't get immediate cycles
        for _ in 0..1000 {
            let value = rng.next_u16();
            seen_values.insert(value);
        }

        // Should see many unique values (not a full period test due to performance)
        assert!(seen_values.len() > 900);
    }

    #[test]
    fn test_reproducible_with_same_seed() {
        let seed = 42;
        let mut rng1 = SeededRng::new(seed);
        let mut rng2 = SeededRng::new(seed);

        // Generate a sequence with first RNG
        let mut sequence1 = alloc::vec::Vec::new();
        for _ in 0..50 {
            sequence1.push(rng1.next_u16());
        }

        // Generate the same sequence with second RNG
        let mut sequence2 = alloc::vec::Vec::new();
        for _ in 0..50 {
            sequence2.push(rng2.next_u16());
        }

        assert_eq!(sequence1, sequence2);
    }

    #[test]
    fn test_state_tracking() {
        let seed = 12345;
        let mut rng = SeededRng::new(seed);

        assert_eq!(rng.initial_seed(), seed);
        assert_eq!(rng.current_state(), seed);

        rng.next_u16();
        assert_ne!(rng.current_state(), seed);
        assert_eq!(rng.initial_seed(), seed);
    }
}
