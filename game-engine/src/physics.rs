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
        let (vx, vy) = entity.vel;
        let (width, height) = entity.size;

        // Calculate next position
        let next_x = x.add(vx);
        let next_y = y.add(vy);

        // Convert current and next pixel coordinates to tile coordinates
        let current_left = (x.to_int() / 16) as usize;
        let current_right = ((x.to_int() + width as i32 - 1) / 16) as usize;
        let current_top = (y.to_int() / 16) as usize;
        let current_bottom = ((y.to_int() + height as i32 - 1) / 16) as usize;

        let next_left = (next_x.to_int() / 16) as usize;
        let next_right = ((next_x.to_int() + width as i32 - 1) / 16) as usize;
        let next_top = (next_y.to_int() / 16) as usize;
        let next_bottom = ((next_y.to_int() + height as i32 - 1) / 16) as usize;

        let mut result = CollisionResult::default();

        // Check collision only if moving in that direction and collision is enabled
        if entity.collision.0 && vy.to_int() < 0 {
            // Moving up - check if next position would collide with tiles above
            for tx in next_left..=next_right {
                for ty in next_top..=current_top.saturating_sub(1) {
                    if self.get_tile(tx, ty) == TileType::Block {
                        result.top = true;
                        break;
                    }
                }
                if result.top {
                    break;
                }
            }
        }

        if entity.collision.1 && vx.to_int() > 0 {
            // Moving right - check if next position would collide with tiles to the right
            for ty in next_top..=next_bottom {
                for tx in current_right.saturating_add(1)..=next_right {
                    if self.get_tile(tx, ty) == TileType::Block {
                        result.right = true;
                        break;
                    }
                }
                if result.right {
                    break;
                }
            }
        }

        if entity.collision.2 && vy.to_int() > 0 {
            // Moving down - check if next position would collide with tiles below
            for tx in next_left..=next_right {
                for ty in current_bottom.saturating_add(1)..=next_bottom {
                    if self.get_tile(tx, ty) == TileType::Block {
                        result.bottom = true;
                        break;
                    }
                }
                if result.bottom {
                    break;
                }
            }
        }

        if entity.collision.3 && vx.to_int() < 0 {
            // Moving left - check if next position would collide with tiles to the left
            for ty in next_top..=next_bottom {
                for tx in next_left..=current_left.saturating_sub(1) {
                    if self.get_tile(tx, ty) == TileType::Block {
                        result.left = true;
                        break;
                    }
                }
                if result.left {
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
        // Only stop movement if there's actually a collision in the direction of movement
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
