//! Tilemap system for game arena collision detection
//!
//! Provides a 16x15 tile grid representing the game arena with collision detection
//! for entity-tilemap interactions.

use crate::core::{TILEMAP_HEIGHT, TILEMAP_WIDTH, TILE_SIZE};
use crate::math::Fixed;

/// Tile types in the game arena
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TileType {
    Empty = 0,
    Block = 1,
}

impl From<u8> for TileType {
    fn from(value: u8) -> Self {
        match value {
            1 => TileType::Block,
            _ => TileType::Empty,
        }
    }
}

impl From<TileType> for u8 {
    fn from(tile_type: TileType) -> Self {
        tile_type as u8
    }
}

/// Tilemap structure representing the game arena
#[derive(Debug, Clone)]
pub struct Tilemap {
    /// 16x15 byte array representing tiles
    /// tiles[y][x] where y is row (0-14) and x is column (0-15)
    tiles: [[u8; TILEMAP_WIDTH]; TILEMAP_HEIGHT],
}

/// Rectangle representing an entity's bounding box for collision detection
#[derive(Debug, Clone, Copy)]
pub struct CollisionRect {
    pub x: Fixed,
    pub y: Fixed,
    pub width: u8,
    pub height: u8,
}

impl Tilemap {
    /// Create a new tilemap from a 16x15 byte array
    pub fn new(tiles: [[u8; TILEMAP_WIDTH]; TILEMAP_HEIGHT]) -> Self {
        Self { tiles }
    }

    /// Create an empty tilemap (all tiles are Empty)
    pub fn empty() -> Self {
        Self {
            tiles: [[0; TILEMAP_WIDTH]; TILEMAP_HEIGHT],
        }
    }

    /// Get the tile type at the specified tile coordinates
    pub fn get_tile(&self, tile_x: usize, tile_y: usize) -> TileType {
        if tile_x >= TILEMAP_WIDTH || tile_y >= TILEMAP_HEIGHT {
            return TileType::Block; // Treat out-of-bounds as solid
        }
        TileType::from(self.tiles[tile_y][tile_x])
    }

    /// Set the tile type at the specified tile coordinates
    pub fn set_tile(&mut self, tile_x: usize, tile_y: usize, tile_type: TileType) {
        if tile_x < TILEMAP_WIDTH && tile_y < TILEMAP_HEIGHT {
            self.tiles[tile_y][tile_x] = tile_type.into();
        }
    }

    /// Get the tile type at the specified pixel coordinates
    pub fn get_tile_at_pixel(&self, pixel_x: Fixed, pixel_y: Fixed) -> TileType {
        let tile_x = (pixel_x.to_int().max(0) as usize) / (TILE_SIZE as usize);
        let tile_y = (pixel_y.to_int().max(0) as usize) / (TILE_SIZE as usize);
        self.get_tile(tile_x, tile_y)
    }

    /// Check if there's a collision between an entity and the tilemap
    /// Returns true if the entity would collide with any solid tiles
    pub fn check_collision(&self, rect: CollisionRect) -> bool {
        // Calculate the tile bounds that the entity overlaps
        // Entity spans from rect.x to rect.x + rect.width (exclusive)
        let left_tile = (rect.x.to_int().max(0) as usize) / (TILE_SIZE as usize);
        let right_edge = rect.x.to_int() + rect.width as i32 - 1; // Last pixel the entity occupies
        let right_tile = (right_edge.max(0) as usize) / (TILE_SIZE as usize);
        let top_tile = (rect.y.to_int().max(0) as usize) / (TILE_SIZE as usize);
        let bottom_edge = rect.y.to_int() + rect.height as i32 - 1; // Last pixel the entity occupies
        let bottom_tile = (bottom_edge.max(0) as usize) / (TILE_SIZE as usize);

        // Check all tiles that the entity overlaps
        for tile_y in top_tile..=bottom_tile.min(TILEMAP_HEIGHT - 1) {
            for tile_x in left_tile..=right_tile.min(TILEMAP_WIDTH - 1) {
                if self.get_tile(tile_x, tile_y) == TileType::Block {
                    return true;
                }
            }
        }

        false
    }

    /// Check collision for horizontal movement
    /// Returns the maximum distance the entity can move horizontally without collision
    pub fn check_horizontal_movement(&self, rect: CollisionRect, delta_x: Fixed) -> Fixed {
        if delta_x.is_zero() {
            return delta_x;
        }

        // Use pixel-by-pixel movement for accurate collision detection
        let step_size = Fixed::ONE; // 1 pixel steps for simplicity
        let mut current_delta = Fixed::ZERO;
        let direction = if delta_x.is_positive() {
            step_size
        } else {
            step_size.neg()
        };

        while current_delta.abs().raw() < delta_x.abs().raw() {
            let next_delta = current_delta.add(direction);

            // Don't overshoot the target
            let test_delta = if delta_x.is_positive() {
                if next_delta.raw() > delta_x.raw() {
                    delta_x
                } else {
                    next_delta
                }
            } else if next_delta.raw() < delta_x.raw() {
                delta_x
            } else {
                next_delta
            };

            let test_rect = CollisionRect {
                x: rect.x.add(test_delta),
                y: rect.y,
                width: rect.width,
                height: rect.height,
            };

            if self.check_collision(test_rect) {
                return current_delta;
            }

            current_delta = test_delta;

            // If we've reached the target, break
            if current_delta.raw() == delta_x.raw() {
                break;
            }
        }

        current_delta
    }

    /// Check collision for vertical movement
    /// Returns the maximum distance the entity can move vertically without collision
    pub fn check_vertical_movement(&self, rect: CollisionRect, delta_y: Fixed) -> Fixed {
        if delta_y.is_zero() {
            return delta_y;
        }

        // Use pixel-by-pixel movement for accurate collision detection
        let step_size = Fixed::ONE; // 1 pixel steps for simplicity
        let mut current_delta = Fixed::ZERO;
        let direction = if delta_y.is_positive() {
            step_size
        } else {
            step_size.neg()
        };

        while current_delta.abs().raw() < delta_y.abs().raw() {
            let next_delta = current_delta.add(direction);

            // Don't overshoot the target
            let test_delta = if delta_y.is_positive() {
                if next_delta.raw() > delta_y.raw() {
                    delta_y
                } else {
                    next_delta
                }
            } else if next_delta.raw() < delta_y.raw() {
                delta_y
            } else {
                next_delta
            };

            let test_rect = CollisionRect {
                x: rect.x,
                y: rect.y.add(test_delta),
                width: rect.width,
                height: rect.height,
            };

            if self.check_collision(test_rect) {
                return current_delta;
            }

            current_delta = test_delta;

            // If we've reached the target, break
            if current_delta.raw() == delta_y.raw() {
                break;
            }
        }

        current_delta
    }

    /// Check if an entity is standing on solid ground
    pub fn is_on_ground(&self, rect: CollisionRect) -> bool {
        let ground_check_rect = CollisionRect {
            x: rect.x,
            y: rect.y.add(Fixed::from_int(rect.height as i16)), // Check at the bottom edge of the entity
            width: rect.width,
            height: 1, // Check just 1 pixel high
        };

        self.check_collision(ground_check_rect)
    }

    /// Get the raw tile data as a reference
    pub fn get_raw_tiles(&self) -> &[[u8; TILEMAP_WIDTH]; TILEMAP_HEIGHT] {
        &self.tiles
    }

    /// Get the raw tile data as a mutable reference
    pub fn get_raw_tiles_mut(&mut self) -> &mut [[u8; TILEMAP_WIDTH]; TILEMAP_HEIGHT] {
        &mut self.tiles
    }
}

impl CollisionRect {
    /// Create a new collision rectangle
    pub fn new(x: Fixed, y: Fixed, width: u8, height: u8) -> Self {
        Self {
            x,
            y,
            width,
            height,
        }
    }

    /// Create a collision rectangle from entity position and size
    pub fn from_entity(pos: (Fixed, Fixed), size: (u8, u8)) -> Self {
        Self {
            x: pos.0,
            y: pos.1,
            width: size.0,
            height: size.1,
        }
    }

    /// Get the right edge of the rectangle
    pub fn right(&self) -> Fixed {
        self.x.add(Fixed::from_int(self.width as i16))
    }

    /// Get the bottom edge of the rectangle
    pub fn bottom(&self) -> Fixed {
        self.y.add(Fixed::from_int(self.height as i16))
    }

    /// Check if this rectangle overlaps with another rectangle
    pub fn overlaps(&self, other: &CollisionRect) -> bool {
        self.x.raw() < other.right().raw()
            && self.right().raw() > other.x.raw()
            && self.y.raw() < other.bottom().raw()
            && self.bottom().raw() > other.y.raw()
    }
}
