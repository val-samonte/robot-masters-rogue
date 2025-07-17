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
            } else {
                if next_delta.raw() < delta_x.raw() {
                    delta_x
                } else {
                    next_delta
                }
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
            } else {
                if next_delta.raw() < delta_y.raw() {
                    delta_y
                } else {
                    next_delta
                }
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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_tile_type_conversion() {
        assert_eq!(TileType::from(0), TileType::Empty);
        assert_eq!(TileType::from(1), TileType::Block);
        assert_eq!(TileType::from(255), TileType::Empty); // Invalid values default to Empty

        assert_eq!(u8::from(TileType::Empty), 0);
        assert_eq!(u8::from(TileType::Block), 1);
    }

    #[test]
    fn test_tilemap_creation() {
        let tiles = [[0; TILEMAP_WIDTH]; TILEMAP_HEIGHT];
        let tilemap = Tilemap::new(tiles);

        // All tiles should be empty
        for y in 0..TILEMAP_HEIGHT {
            for x in 0..TILEMAP_WIDTH {
                assert_eq!(tilemap.get_tile(x, y), TileType::Empty);
            }
        }
    }

    #[test]
    fn test_empty_tilemap() {
        let tilemap = Tilemap::empty();

        // All tiles should be empty
        for y in 0..TILEMAP_HEIGHT {
            for x in 0..TILEMAP_WIDTH {
                assert_eq!(tilemap.get_tile(x, y), TileType::Empty);
            }
        }
    }

    #[test]
    fn test_get_set_tile() {
        let mut tilemap = Tilemap::empty();

        // Set some tiles to block
        tilemap.set_tile(0, 0, TileType::Block);
        tilemap.set_tile(5, 7, TileType::Block);
        tilemap.set_tile(15, 14, TileType::Block);

        // Verify they were set correctly
        assert_eq!(tilemap.get_tile(0, 0), TileType::Block);
        assert_eq!(tilemap.get_tile(5, 7), TileType::Block);
        assert_eq!(tilemap.get_tile(15, 14), TileType::Block);

        // Verify other tiles are still empty
        assert_eq!(tilemap.get_tile(1, 0), TileType::Empty);
        assert_eq!(tilemap.get_tile(0, 1), TileType::Empty);
    }

    #[test]
    fn test_out_of_bounds_access() {
        let tilemap = Tilemap::empty();

        // Out of bounds should return Block (solid)
        assert_eq!(tilemap.get_tile(TILEMAP_WIDTH, 0), TileType::Block);
        assert_eq!(tilemap.get_tile(0, TILEMAP_HEIGHT), TileType::Block);
        assert_eq!(tilemap.get_tile(100, 100), TileType::Block);

        // Setting out of bounds should not panic
        let mut tilemap = Tilemap::empty();
        tilemap.set_tile(TILEMAP_WIDTH, 0, TileType::Block); // Should not panic
        tilemap.set_tile(0, TILEMAP_HEIGHT, TileType::Block); // Should not panic
    }

    #[test]
    fn test_get_tile_at_pixel() {
        let mut tilemap = Tilemap::empty();

        // Set tile at (1, 1) to block
        tilemap.set_tile(1, 1, TileType::Block);

        // Test pixel coordinates within that tile (16-31, 16-31)
        assert_eq!(
            tilemap.get_tile_at_pixel(Fixed::from_int(16), Fixed::from_int(16)),
            TileType::Block
        );
        assert_eq!(
            tilemap.get_tile_at_pixel(Fixed::from_int(31), Fixed::from_int(31)),
            TileType::Block
        );
        assert_eq!(
            tilemap.get_tile_at_pixel(Fixed::from_int(20), Fixed::from_int(25)),
            TileType::Block
        );

        // Test pixel coordinates in adjacent tiles
        assert_eq!(
            tilemap.get_tile_at_pixel(Fixed::from_int(15), Fixed::from_int(16)),
            TileType::Empty
        );
        assert_eq!(
            tilemap.get_tile_at_pixel(Fixed::from_int(32), Fixed::from_int(16)),
            TileType::Empty
        );
        assert_eq!(
            tilemap.get_tile_at_pixel(Fixed::from_int(16), Fixed::from_int(15)),
            TileType::Empty
        );
        assert_eq!(
            tilemap.get_tile_at_pixel(Fixed::from_int(16), Fixed::from_int(32)),
            TileType::Empty
        );
    }

    #[test]
    fn test_collision_rect_creation() {
        let rect = CollisionRect::new(Fixed::from_int(10), Fixed::from_int(20), 16, 24);
        assert_eq!(rect.x, Fixed::from_int(10));
        assert_eq!(rect.y, Fixed::from_int(20));
        assert_eq!(rect.width, 16);
        assert_eq!(rect.height, 24);

        let rect2 = CollisionRect::from_entity((Fixed::from_int(5), Fixed::from_int(15)), (32, 32));
        assert_eq!(rect2.x, Fixed::from_int(5));
        assert_eq!(rect2.y, Fixed::from_int(15));
        assert_eq!(rect2.width, 32);
        assert_eq!(rect2.height, 32);
    }

    #[test]
    fn test_collision_rect_edges() {
        let rect = CollisionRect::new(Fixed::from_int(10), Fixed::from_int(20), 16, 24);

        assert_eq!(rect.right(), Fixed::from_int(26)); // 10 + 16
        assert_eq!(rect.bottom(), Fixed::from_int(44)); // 20 + 24
    }

    #[test]
    fn test_collision_rect_overlaps() {
        let rect1 = CollisionRect::new(Fixed::from_int(10), Fixed::from_int(10), 20, 20);
        let rect2 = CollisionRect::new(Fixed::from_int(20), Fixed::from_int(20), 20, 20);
        let rect3 = CollisionRect::new(Fixed::from_int(50), Fixed::from_int(50), 20, 20);

        // rect1 and rect2 should overlap
        assert!(rect1.overlaps(&rect2));
        assert!(rect2.overlaps(&rect1));

        // rect1 and rect3 should not overlap
        assert!(!rect1.overlaps(&rect3));
        assert!(!rect3.overlaps(&rect1));

        // rect2 and rect3 should not overlap
        assert!(!rect2.overlaps(&rect3));
        assert!(!rect3.overlaps(&rect2));
    }

    #[test]
    fn test_basic_collision_detection() {
        let mut tilemap = Tilemap::empty();

        // Set a block at tile (2, 2) - pixel coordinates 32-47, 32-47
        tilemap.set_tile(2, 2, TileType::Block);

        // Test collision with entity entirely within the block tile
        let rect_inside = CollisionRect::new(Fixed::from_int(35), Fixed::from_int(35), 8, 8);
        assert!(tilemap.check_collision(rect_inside));

        // Test collision with entity entirely outside the block tile
        let rect_outside = CollisionRect::new(Fixed::from_int(0), Fixed::from_int(0), 16, 16);
        assert!(!tilemap.check_collision(rect_outside));

        // Test collision with entity partially overlapping the block tile
        let rect_overlap = CollisionRect::new(Fixed::from_int(30), Fixed::from_int(30), 8, 8);
        assert!(tilemap.check_collision(rect_overlap));
    }

    #[test]
    fn test_collision_multiple_tiles() {
        let mut tilemap = Tilemap::empty();

        // Create a 2x2 block of solid tiles
        tilemap.set_tile(1, 1, TileType::Block);
        tilemap.set_tile(2, 1, TileType::Block);
        tilemap.set_tile(1, 2, TileType::Block);
        tilemap.set_tile(2, 2, TileType::Block);

        // Large entity that spans multiple tiles
        let large_rect = CollisionRect::new(Fixed::from_int(20), Fixed::from_int(20), 24, 24);
        assert!(tilemap.check_collision(large_rect));

        // Entity that fits in the gap between blocks
        let small_rect = CollisionRect::new(Fixed::from_int(0), Fixed::from_int(0), 8, 8);
        assert!(!tilemap.check_collision(small_rect));
    }

    #[test]
    fn test_horizontal_movement_collision() {
        let mut tilemap = Tilemap::empty();

        // Create a wall at x=32 (tile column 2)
        for y in 0..TILEMAP_HEIGHT {
            tilemap.set_tile(2, y, TileType::Block);
        }

        // Entity starting at x=0, trying to move right by 40 pixels
        let rect = CollisionRect::new(Fixed::from_int(0), Fixed::from_int(50), 16, 16);
        let desired_movement = Fixed::from_int(40);
        let actual_movement = tilemap.check_horizontal_movement(rect, desired_movement);

        // Debug: Let's understand what's happening
        // Wall is at tile column 2, which means pixels 32-47 are blocked
        // Entity is 16 pixels wide, so at x=16, entity spans pixels 16-31 (should not collide)
        // At x=17, entity spans pixels 17-32, where pixel 32 is blocked (should collide)

        // Test collision at x=16 (entity spans 16-31, should not collide with wall at 32-47)
        let test_rect_16 = CollisionRect::new(Fixed::from_int(16), Fixed::from_int(50), 16, 16);
        let collision_at_16 = tilemap.check_collision(test_rect_16);

        // Test collision at x=17 (entity spans 17-32, should collide with wall at 32-47)
        let test_rect_17 = CollisionRect::new(Fixed::from_int(17), Fixed::from_int(50), 16, 16);
        let collision_at_17 = tilemap.check_collision(test_rect_17);

        assert!(
            !collision_at_16,
            "Entity at x=16 (spans 16-31) should not collide with wall at x=32-47"
        );
        assert!(
            collision_at_17,
            "Entity at x=17 (spans 17-32) should collide with wall at x=32-47"
        );

        // The movement should allow moving to x=16 (entity right edge at pixel 31, not touching wall at 32)
        assert_eq!(
            actual_movement,
            Fixed::from_int(16),
            "Should be able to move exactly 16 pixels to position x=16 (right edge at 31, wall starts at 32)"
        );
    }

    #[test]
    fn test_horizontal_movement_no_collision() {
        let tilemap = Tilemap::empty();

        // Entity moving in empty space
        let rect = CollisionRect::new(Fixed::from_int(50), Fixed::from_int(50), 16, 16);
        let desired_movement = Fixed::from_int(20);
        let actual_movement = tilemap.check_horizontal_movement(rect, desired_movement);

        // Should be able to move the full distance
        assert_eq!(actual_movement, desired_movement);
    }

    #[test]
    fn test_vertical_movement_collision() {
        let mut tilemap = Tilemap::empty();

        // Create a floor at y=32 (tile row 2)
        for x in 0..TILEMAP_WIDTH {
            tilemap.set_tile(x, 2, TileType::Block);
        }

        // Entity starting at y=0, trying to move down by 40 pixels
        let rect = CollisionRect::new(Fixed::from_int(50), Fixed::from_int(0), 16, 16);
        let desired_movement = Fixed::from_int(40);
        let actual_movement = tilemap.check_vertical_movement(rect, desired_movement);

        // Should be able to move to y=16 (entity bottom edge at y=32, touching the floor)
        assert!(actual_movement.raw() <= Fixed::from_int(16).raw());
        assert!(actual_movement.raw() > Fixed::from_int(0).raw());
    }

    #[test]
    fn test_vertical_movement_no_collision() {
        let tilemap = Tilemap::empty();

        // Entity moving in empty space
        let rect = CollisionRect::new(Fixed::from_int(50), Fixed::from_int(50), 16, 16);
        let desired_movement = Fixed::from_int(20);
        let actual_movement = tilemap.check_vertical_movement(rect, desired_movement);

        // Should be able to move the full distance
        assert_eq!(actual_movement, desired_movement);
    }

    #[test]
    fn test_negative_movement() {
        let mut tilemap = Tilemap::empty();

        // Create a wall at x=32
        for y in 0..TILEMAP_HEIGHT {
            tilemap.set_tile(2, y, TileType::Block);
        }

        // Entity starting at x=100, trying to move left by -80 pixels
        let rect = CollisionRect::new(Fixed::from_int(100), Fixed::from_int(50), 16, 16);
        let desired_movement = Fixed::from_int(-80);
        let actual_movement = tilemap.check_horizontal_movement(rect, desired_movement);

        // Should be able to move to x=48 (entity left edge at x=48, touching the wall at x=47)
        assert!(actual_movement.raw() >= Fixed::from_int(-52).raw()); // 100 - 48 = 52
        assert!(actual_movement.raw() < Fixed::from_int(0).raw());
    }

    #[test]
    fn test_is_on_ground() {
        let mut tilemap = Tilemap::empty();

        // Create a floor at y=48 (tile row 3)
        for x in 0..TILEMAP_WIDTH {
            tilemap.set_tile(x, 3, TileType::Block);
        }

        // Entity standing on the floor (bottom at y=48)
        let rect_on_ground = CollisionRect::new(Fixed::from_int(50), Fixed::from_int(32), 16, 16);
        assert!(tilemap.is_on_ground(rect_on_ground));

        // Entity floating above the floor
        let rect_floating = CollisionRect::new(Fixed::from_int(50), Fixed::from_int(20), 16, 16);
        assert!(!tilemap.is_on_ground(rect_floating));

        // Entity in mid-air with no floor below
        let rect_midair = CollisionRect::new(Fixed::from_int(50), Fixed::from_int(100), 16, 16);
        assert!(!tilemap.is_on_ground(rect_midair));
    }

    #[test]
    fn test_zero_movement() {
        let tilemap = Tilemap::empty();
        let rect = CollisionRect::new(Fixed::from_int(50), Fixed::from_int(50), 16, 16);

        // Zero movement should return zero
        assert_eq!(
            tilemap.check_horizontal_movement(rect, Fixed::ZERO),
            Fixed::ZERO
        );
        assert_eq!(
            tilemap.check_vertical_movement(rect, Fixed::ZERO),
            Fixed::ZERO
        );
    }

    #[test]
    fn test_edge_cases() {
        let mut tilemap = Tilemap::empty();

        // Fill the entire tilemap with blocks
        for y in 0..TILEMAP_HEIGHT {
            for x in 0..TILEMAP_WIDTH {
                tilemap.set_tile(x, y, TileType::Block);
            }
        }

        // Any entity should collide
        let rect = CollisionRect::new(Fixed::from_int(10), Fixed::from_int(10), 8, 8);
        assert!(tilemap.check_collision(rect));

        // Movement should be blocked
        assert_eq!(
            tilemap.check_horizontal_movement(rect, Fixed::from_int(10)),
            Fixed::ZERO
        );
        assert_eq!(
            tilemap.check_vertical_movement(rect, Fixed::from_int(10)),
            Fixed::ZERO
        );
    }

    #[test]
    fn test_fractional_positions() {
        let mut tilemap = Tilemap::empty();
        tilemap.set_tile(2, 2, TileType::Block); // Block at pixel 32-47, 32-47

        // Entity with fractional position
        let rect = CollisionRect::new(
            Fixed::from_raw(35 * 32 + 16), // 35.5 pixels
            Fixed::from_raw(35 * 32 + 16), // 35.5 pixels
            8,
            8,
        );

        assert!(tilemap.check_collision(rect));
    }

    #[test]
    fn test_raw_tile_access() {
        let mut tilemap = Tilemap::empty();

        // Test getting raw tiles
        let raw_tiles = tilemap.get_raw_tiles();
        assert_eq!(raw_tiles.len(), TILEMAP_HEIGHT);
        assert_eq!(raw_tiles[0].len(), TILEMAP_WIDTH);
        assert_eq!(raw_tiles[0][0], 0);

        // Test getting mutable raw tiles
        let raw_tiles_mut = tilemap.get_raw_tiles_mut();
        raw_tiles_mut[5][7] = 1;

        assert_eq!(tilemap.get_tile(7, 5), TileType::Block);
    }
}
