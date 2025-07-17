#![no_std]

//! Robot Masters Game Engine
//!
//! A no_std game engine designed for cross-platform compatibility,
//! specifically targeting Solana blockchain and WebAssembly environments.

extern crate alloc;

// Core modules
pub mod api;
pub mod behavior;
pub mod core;
pub mod entity;
pub mod math;
pub mod physics;
pub mod random;
pub mod script;
pub mod state;
pub mod tilemap;

// Re-export public API
pub use api::*;
