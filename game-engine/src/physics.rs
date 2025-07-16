//! Physics system for collision detection and movement

use crate::entity::EntityCore;
use crate::math::Fixed;

/// Tilemap for collision detection
#[derive(Debug)]
pub struct Tilemap {
    tiles: [[u8; 16]; 15], // 16x15 tiles
}

/// Tile types
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TileType {
    Empty = 0,
    Block = 1,
}

impl Tilemap {
    pub fn new(tiles: [[u8; 16]; 15]) -> Self {
        Self { tiles }
    }

    /// Get tile type at given tile coordinates
    pub fn get_tile(&self, tile_x: usize, tile_y: usize) -> TileType {
        if tile_x >= 16 || tile_y >= 15 {
            return TileType::Block; // Out of bounds is solid
        }

        match self.tiles[tile_y][tile_x] {
            0 => TileType::Empty,
            _ => TileType::Block,
        }
    }

    /// Check collision between entity and tilemap
    pub fn check_collision(&self, entity: &EntityCore) -> CollisionResult {
        let (x, y) = entity.pos;
        let (width, height) = entity.size;

        // Convert pixel coordinates to tile coordinates
        let left_tile = (x.to_int() / 16) as usize;
        let right_tile = ((x.to_int() + width as i32) / 16) as usize;
        let top_tile = (y.to_int() / 16) as usize;
        let bottom_tile = ((y.to_int() + height as i32) / 16) as usize;

        let mut result = CollisionResult::default();

        // Check collision on each side if enabled
        if entity.collision.0 {
            // top
            for tx in left_tile..=right_tile {
                if self.get_tile(tx, top_tile) == TileType::Block {
                    result.top = true;
                    break;
                }
            }
        }

        if entity.collision.1 {
            // right
            for ty in top_tile..=bottom_tile {
                if self.get_tile(right_tile, ty) == TileType::Block {
                    result.right = true;
                    break;
                }
            }
        }

        if entity.collision.2 {
            // bottom
            for tx in left_tile..=right_tile {
                if self.get_tile(tx, bottom_tile) == TileType::Block {
                    result.bottom = true;
                    break;
                }
            }
        }

        if entity.collision.3 {
            // left
            for ty in top_tile..=bottom_tile {
                if self.get_tile(left_tile, ty) == TileType::Block {
                    result.left = true;
                    break;
                }
            }
        }

        result
    }
}

/// Result of collision detection
#[derive(Debug, Default)]
pub struct CollisionResult {
    pub top: bool,
    pub right: bool,
    pub bottom: bool,
    pub left: bool,
}

impl CollisionResult {
    pub fn any(&self) -> bool {
        self.top || self.right || self.bottom || self.left
    }
}

/// Physics system for updating entity positions
pub struct PhysicsSystem;

impl PhysicsSystem {
    /// Update entity position based on velocity
    pub fn update_position(entity: &mut EntityCore) {
        entity.pos.0 = entity.pos.0.add(entity.vel.0);
        entity.pos.1 = entity.pos.1.add(entity.vel.1);
    }

    /// Apply collision constraints to entity movement
    pub fn apply_collision_constraints(entity: &mut EntityCore, collision: &CollisionResult) {
        if collision.left && entity.vel.0.to_int() < 0 {
            entity.vel.0 = Fixed::ZERO;
        }
        if collision.right && entity.vel.0.to_int() > 0 {
            entity.vel.0 = Fixed::ZERO;
        }
        if collision.top && entity.vel.1.to_int() < 0 {
            entity.vel.1 = Fixed::ZERO;
        }
        if collision.bottom && entity.vel.1.to_int() > 0 {
            entity.vel.1 = Fixed::ZERO;
        }
    }

    /// Check collision between two entities
    pub fn check_entity_collision(a: &EntityCore, b: &EntityCore) -> bool {
        let (ax, ay) = a.pos;
        let (aw, ah) = a.size;
        let (bx, by) = b.pos;
        let (bw, bh) = b.size;

        // AABB collision detection
        ax.to_int() < bx.to_int() + bw as i32
            && ax.to_int() + aw as i32 > bx.to_int()
            && ay.to_int() < by.to_int() + bh as i32
            && ay.to_int() + ah as i32 > by.to_int()
    }
}
