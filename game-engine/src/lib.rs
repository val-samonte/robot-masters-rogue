#![no_std]

//! Robot Masters Game Engine
//!
//! A no_std game engine designed for cross-platform compatibility,
//! specifically targeting Solana blockchain and WebAssembly environments.

extern crate alloc;

// Core modules
pub mod actions_simple;
pub mod api;
pub mod behavior;
pub mod behavior_integration;
#[cfg(test)]
mod cleanup_verification_test;
pub mod conditions;
pub mod conditions_simple;
pub mod constants;
#[cfg(test)]
mod constants_test;
#[cfg(test)]
mod cooldown_integration_test;
#[cfg(test)]
mod cooldown_property_test;
#[cfg(test)]
mod cooldown_simple_test;
#[cfg(test)]
mod cooldown_skip_test;
#[cfg(test)]
mod cooldown_test;
pub mod core;
pub mod entity;
pub mod error;
#[cfg(test)]
mod error_test;
#[cfg(test)]
mod integration_tests;
#[cfg(test)]
mod manual_cooldown_test;
pub mod math;
pub mod physics;
pub mod random;
pub mod script;
pub mod spawn;
pub mod state;
pub mod status;
#[cfg(test)]
mod test_task6;
#[cfg(test)]
pub mod test_utils;
pub mod tilemap;

// Re-export public API
pub use api::*;
