#![no_std]

//! Robot Masters Game Engine
//!
//! A no_std game engine designed for cross-platform compatibility,
//! specifically targeting Solana blockchain and WebAssembly environments.

extern crate alloc;

// Core modules
pub mod api;
pub mod constants;
pub mod core;
pub mod entity;
pub mod error;
pub mod math;
pub mod physics;
pub mod random;
pub mod script;
pub mod spawn;
pub mod state;
pub mod status;
pub mod tilemap;

// Re-export public API
pub use api::*;
#[cfg(test)]
mod tests {
    use crate::math::Fixed;

    #[test]
    fn test_fixed_arithmetic_traits() {
        let a = Fixed::from_int(5);
        let b = Fixed::from_int(3);

        // Test Add trait
        let sum = a + b;
        assert_eq!(sum.to_int(), 8);

        // Test Sub trait
        let diff = a - b;
        assert_eq!(diff.to_int(), 2);

        // Test Mul trait
        let product = a * b;
        assert_eq!(product.to_int(), 15);

        // Test Div trait
        let quotient = a / b;
        assert_eq!(quotient.to_int(), 1); // 5/3 = 1 (integer division)

        // Test Neg trait
        let negated = -a;
        assert_eq!(negated.to_int(), -5);
    }

    #[test]
    fn test_trait_equivalence_to_methods() {
        let a = Fixed::from_int(10);
        let b = Fixed::from_int(4);

        // Verify trait implementations delegate to existing methods
        assert_eq!(a + b, a.add(b));
        assert_eq!(a - b, a.sub(b));
        assert_eq!(a * b, a.mul(b));
        assert_eq!(a / b, a.div(b));
        assert_eq!(-a, a.neg());
    }
}
