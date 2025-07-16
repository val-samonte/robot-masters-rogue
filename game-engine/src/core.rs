//! Core engine components and types
//!
//! This module provides core types and constants used throughout the engine.

/// Game timing constants
pub const FRAMES_PER_SECOND: u16 = 60;
pub const GAME_DURATION_SECONDS: u16 = 64;
pub const MAX_FRAMES: u16 = FRAMES_PER_SECOND * GAME_DURATION_SECONDS; // 3840

/// Screen dimensions
pub const SCREEN_WIDTH: u16 = 256;
pub const SCREEN_HEIGHT: u16 = 240;
pub const TILE_SIZE: u8 = 16;
pub const TILEMAP_WIDTH: usize = 16;
pub const TILEMAP_HEIGHT: usize = 15;

/// Entity limits
pub const MAX_CHARACTERS: usize = 8;
pub const MAX_SPAWNS: usize = 64;
pub const MAX_STATUS_EFFECTS: usize = 32;

/// Script execution limits
pub const MAX_SCRIPT_LENGTH: usize = 256;
pub const MAX_SCRIPT_VARIABLES: usize = 16;
pub const MAX_SCRIPT_STACK: usize = 32;
