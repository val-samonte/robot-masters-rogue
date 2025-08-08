//! Industry-standard collision detection system
//!
//! Implements AABB collision detection with Minimum Translation Vector (MTV) resolution,
//! swept collision detection, and proper separation of collision detection from response.

use crate::core::{TILEMAP_HEIGHT, TILEMAP_WIDTH, TILE_SIZE};
use crate::math::Fixed;
use crate::tilemap::{TileType, Tilemap};

/// Axis-Aligned Bounding Box for collision detection
#[derive(Debug, Clone, Copy)]
pub struct AABB {
    pub x: Fixed,
    pub y: Fixed,
    pub width: Fixed,
    pub height: Fixed,
}

/// Collision result containing all collision information
#[derive(Debug, Clone, Copy)]
pub struct CollisionResult {
    pub hit: bool,
    pub normal: (Fixed, Fixed), // Surface normal (direction to push entity)
    pub distance: Fixed,        // Distance to collision point
    pub point: (Fixed, Fixed),  // Collision point
    pub mtv: (Fixed, Fixed),    // Minimum Translation Vector to resolve overlap
}

/// 2D Vector for collision calculations
#[derive(Debug, Clone, Copy)]
pub struct Vec2 {
    pub x: Fixed,
    pub y: Fixed,
}

impl AABB {
    /// Create a new AABB
    pub fn new(x: Fixed, y: Fixed, width: Fixed, height: Fixed) -> Self {
        Self {
            x,
            y,
            width,
            height,
        }
    }

    /// Create AABB from entity position and size
    pub fn from_entity(pos: (Fixed, Fixed), size: (u8, u8)) -> Self {
        Self {
            x: pos.0,
            y: pos.1,
            width: Fixed::from_int(size.0 as i16),
            height: Fixed::from_int(size.1 as i16),
        }
    }

    /// Get the right edge of the AABB
    pub fn right(&self) -> Fixed {
        self.x.add(self.width)
    }

    /// Get the bottom edge of the AABB
    pub fn bottom(&self) -> Fixed {
        self.y.add(self.height)
    }

    /// Get the center point of the AABB
    pub fn center(&self) -> (Fixed, Fixed) {
        (
            self.x.add(self.width.div(Fixed::from_int(2))),
            self.y.add(self.height.div(Fixed::from_int(2))),
        )
    }

    /// Check if this AABB overlaps with another AABB
    pub fn overlaps(&self, other: &AABB) -> bool {
        self.x.raw() < other.right().raw()
            && self.right().raw() > other.x.raw()
            && self.y.raw() < other.bottom().raw()
            && self.bottom().raw() > other.y.raw()
    }

    /// Calculate overlap amount with another AABB
    pub fn overlap_amount(&self, other: &AABB) -> (Fixed, Fixed) {
        if !self.overlaps(other) {
            return (Fixed::ZERO, Fixed::ZERO);
        }

        let overlap_x = Fixed::from_int(
            (self.right().to_int().min(other.right().to_int())
                - self.x.to_int().max(other.x.to_int()))
            .max(0) as i16,
        );

        let overlap_y = Fixed::from_int(
            (self.bottom().to_int().min(other.bottom().to_int())
                - self.y.to_int().max(other.y.to_int()))
            .max(0) as i16,
        );

        (overlap_x, overlap_y)
    }

    /// Calculate Minimum Translation Vector (MTV) to separate from another AABB
    pub fn calculate_mtv(&self, other: &AABB) -> (Fixed, Fixed) {
        let (overlap_x, overlap_y) = self.overlap_amount(other);

        if overlap_x.is_zero() || overlap_y.is_zero() {
            return (Fixed::ZERO, Fixed::ZERO);
        }

        // Choose the axis with smallest overlap for MTV
        if overlap_x.raw() < overlap_y.raw() {
            // Separate horizontally
            let self_center = self.center().0;
            let other_center = other.center().0;

            if self_center.raw() < other_center.raw() {
                (-overlap_x, Fixed::ZERO) // Push left
            } else {
                (overlap_x, Fixed::ZERO) // Push right
            }
        } else {
            // Separate vertically
            let self_center = self.center().1;
            let other_center = other.center().1;

            if self_center.raw() < other_center.raw() {
                (Fixed::ZERO, -overlap_y) // Push up
            } else {
                (Fixed::ZERO, overlap_y) // Push down
            }
        }
    }

    /// Expand AABB by a margin (for swept collision detection)
    pub fn expand(&self, margin: Fixed) -> AABB {
        AABB {
            x: self.x.sub(margin),
            y: self.y.sub(margin),
            width: self.width.add(margin.mul(Fixed::from_int(2))),
            height: self.height.add(margin.mul(Fixed::from_int(2))),
        }
    }
}

impl Vec2 {
    pub fn new(x: Fixed, y: Fixed) -> Self {
        Self { x, y }
    }

    pub fn zero() -> Self {
        Self {
            x: Fixed::ZERO,
            y: Fixed::ZERO,
        }
    }

    pub fn length_squared(&self) -> Fixed {
        self.x.mul(self.x).add(self.y.mul(self.y))
    }
}

/// Industry-standard collision detection system
pub struct CollisionSystem;

impl CollisionSystem {
    /// Swept AABB collision detection - finds the time of impact
    /// Returns the fraction of movement (0.0 to 1.0) before collision
    pub fn sweep_aabb(moving: &AABB, velocity: Vec2, stationary: &AABB) -> Option<Fixed> {
        // Expand the stationary AABB by the moving AABB's size (Minkowski sum)
        let expanded = AABB {
            x: stationary.x.sub(moving.width),
            y: stationary.y.sub(moving.height),
            width: stationary.width.add(moving.width.mul(Fixed::from_int(2))),
            height: stationary.height.add(moving.height.mul(Fixed::from_int(2))),
        };

        // Treat moving AABB as a point at its center
        let point = moving.center();

        // Ray-box intersection test
        Self::ray_box_intersection(point, velocity, &expanded)
    }

    /// Ray-box intersection test
    fn ray_box_intersection(origin: (Fixed, Fixed), direction: Vec2, aabb: &AABB) -> Option<Fixed> {
        if direction.x.is_zero() && direction.y.is_zero() {
            return None;
        }

        let mut t_min = Fixed::ZERO;
        let mut t_max = Fixed::from_int(1000); // Large number representing infinity

        // X axis
        if !direction.x.is_zero() {
            let t1 = aabb.x.sub(origin.0).div(direction.x);
            let t2 = aabb.right().sub(origin.0).div(direction.x);

            let t_min_x = Fixed::from_int(t1.to_int().min(t2.to_int()) as i16);
            let t_max_x = Fixed::from_int(t1.to_int().max(t2.to_int()) as i16);

            t_min = Fixed::from_int(t_min.to_int().max(t_min_x.to_int()) as i16);
            t_max = Fixed::from_int(t_max.to_int().min(t_max_x.to_int()) as i16);
        } else {
            // Ray is parallel to X axis
            if origin.0.raw() < aabb.x.raw() || origin.0.raw() > aabb.right().raw() {
                return None;
            }
        }

        // Y axis
        if !direction.y.is_zero() {
            let t1 = aabb.y.sub(origin.1).div(direction.y);
            let t2 = aabb.bottom().sub(origin.1).div(direction.y);

            let t_min_y = Fixed::from_int(t1.to_int().min(t2.to_int()) as i16);
            let t_max_y = Fixed::from_int(t1.to_int().max(t2.to_int()) as i16);

            t_min = Fixed::from_int(t_min.to_int().max(t_min_y.to_int()) as i16);
            t_max = Fixed::from_int(t_max.to_int().min(t_max_y.to_int()) as i16);
        } else {
            // Ray is parallel to Y axis
            if origin.1.raw() < aabb.y.raw() || origin.1.raw() > aabb.bottom().raw() {
                return None;
            }
        }

        // Check if intersection exists and is in valid range
        if t_max.raw() < Fixed::ZERO.raw() || t_min.raw() > t_max.raw() {
            return None;
        }

        // Return the first intersection time (entry point)
        let t = if t_min.raw() >= Fixed::ZERO.raw() {
            t_min
        } else {
            t_max
        };

        if t.raw() >= Fixed::ZERO.raw() && t.raw() <= Fixed::ONE.raw() {
            Some(t)
        } else {
            None
        }
    }

    /// Check collision between entity and tilemap using industry-standard methods
    pub fn check_tilemap_collision(tilemap: &Tilemap, entity_aabb: &AABB) -> CollisionResult {
        // Calculate which tiles the entity overlaps
        let left_tile = (entity_aabb.x.to_int().max(0) as usize) / (TILE_SIZE as usize);
        let right_tile = ((entity_aabb.right().to_int() - 1).max(0) as usize
            / (TILE_SIZE as usize))
            .min(TILEMAP_WIDTH - 1);
        let top_tile = (entity_aabb.y.to_int().max(0) as usize) / (TILE_SIZE as usize);
        let bottom_tile = ((entity_aabb.bottom().to_int() - 1).max(0) as usize
            / (TILE_SIZE as usize))
            .min(TILEMAP_HEIGHT - 1);

        let mut total_mtv = (Fixed::ZERO, Fixed::ZERO);
        let mut has_collision = false;

        // Check each overlapping tile
        for tile_y in top_tile..=bottom_tile {
            for tile_x in left_tile..=right_tile {
                if tilemap.get_tile(tile_x, tile_y) == TileType::Block {
                    // Create AABB for this tile
                    let tile_aabb = AABB::new(
                        Fixed::from_int((tile_x * TILE_SIZE as usize) as i16),
                        Fixed::from_int((tile_y * TILE_SIZE as usize) as i16),
                        Fixed::from_int(TILE_SIZE as i16),
                        Fixed::from_int(TILE_SIZE as i16),
                    );

                    if entity_aabb.overlaps(&tile_aabb) {
                        has_collision = true;
                        let mtv = entity_aabb.calculate_mtv(&tile_aabb);

                        // Accumulate MTV (choose the one with larger magnitude)
                        if mtv.0.abs().raw() > total_mtv.0.abs().raw() {
                            total_mtv.0 = mtv.0;
                        }
                        if mtv.1.abs().raw() > total_mtv.1.abs().raw() {
                            total_mtv.1 = mtv.1;
                        }
                    }
                }
            }
        }

        CollisionResult {
            hit: has_collision,
            normal: if has_collision {
                // Calculate normal based on MTV direction
                if total_mtv.0.abs().raw() > total_mtv.1.abs().raw() {
                    (
                        if total_mtv.0.is_positive() {
                            Fixed::ONE
                        } else {
                            -Fixed::ONE
                        },
                        Fixed::ZERO,
                    )
                } else {
                    (
                        Fixed::ZERO,
                        if total_mtv.1.is_positive() {
                            Fixed::ONE
                        } else {
                            -Fixed::ONE
                        },
                    )
                }
            } else {
                (Fixed::ZERO, Fixed::ZERO)
            },
            distance: if has_collision {
                Fixed::from_int((total_mtv.0.abs().to_int() + total_mtv.1.abs().to_int()) as i16)
            } else {
                Fixed::ZERO
            },
            point: entity_aabb.center(), // Simplified - could be more precise
            mtv: total_mtv,
        }
    }

    /// Swept collision detection for moving entity against tilemap
    pub fn sweep_tilemap_collision(
        tilemap: &Tilemap,
        entity_aabb: &AABB,
        velocity: Vec2,
    ) -> CollisionResult {
        if velocity.x.is_zero() && velocity.y.is_zero() {
            return Self::check_tilemap_collision(tilemap, entity_aabb);
        }

        // Calculate the swept area
        let swept_aabb = AABB {
            x: if velocity.x.is_negative() {
                entity_aabb.x.add(velocity.x)
            } else {
                entity_aabb.x
            },
            y: if velocity.y.is_negative() {
                entity_aabb.y.add(velocity.y)
            } else {
                entity_aabb.y
            },
            width: entity_aabb.width.add(velocity.x.abs()),
            height: entity_aabb.height.add(velocity.y.abs()),
        };

        // Find tiles in the swept area
        let left_tile = (swept_aabb.x.to_int().max(0) as usize) / (TILE_SIZE as usize);
        let right_tile = ((swept_aabb.right().to_int() - 1).max(0) as usize / (TILE_SIZE as usize))
            .min(TILEMAP_WIDTH - 1);
        let top_tile = (swept_aabb.y.to_int().max(0) as usize) / (TILE_SIZE as usize);
        let bottom_tile = ((swept_aabb.bottom().to_int() - 1).max(0) as usize
            / (TILE_SIZE as usize))
            .min(TILEMAP_HEIGHT - 1);

        let mut closest_collision: Option<(Fixed, CollisionResult)> = None;

        // Test collision with each solid tile in the swept area
        for tile_y in top_tile..=bottom_tile {
            for tile_x in left_tile..=right_tile {
                if tilemap.get_tile(tile_x, tile_y) == TileType::Block {
                    let tile_aabb = AABB::new(
                        Fixed::from_int((tile_x * TILE_SIZE as usize) as i16),
                        Fixed::from_int((tile_y * TILE_SIZE as usize) as i16),
                        Fixed::from_int(TILE_SIZE as i16),
                        Fixed::from_int(TILE_SIZE as i16),
                    );

                    if let Some(t) = Self::sweep_aabb(entity_aabb, velocity, &tile_aabb) {
                        if closest_collision.is_none()
                            || t.raw() < closest_collision.unwrap().0.raw()
                        {
                            // Calculate collision point and normal
                            let collision_point = (
                                entity_aabb.center().0.add(velocity.x.mul(t)),
                                entity_aabb.center().1.add(velocity.y.mul(t)),
                            );

                            // Calculate normal based on which side was hit
                            let normal =
                                Self::calculate_collision_normal(entity_aabb, &tile_aabb, velocity);

                            closest_collision = Some((
                                t,
                                CollisionResult {
                                    hit: true,
                                    normal,
                                    distance: t, // Return the time fraction, let caller calculate actual distance
                                    point: collision_point,
                                    mtv: (Fixed::ZERO, Fixed::ZERO), // MTV not applicable for swept collision
                                },
                            ));
                        }
                    }
                }
            }
        }

        closest_collision
            .map(|(_, result)| result)
            .unwrap_or(CollisionResult {
                hit: false,
                normal: (Fixed::ZERO, Fixed::ZERO),
                distance: Fixed::ZERO,
                point: (Fixed::ZERO, Fixed::ZERO),
                mtv: (Fixed::ZERO, Fixed::ZERO),
            })
    }

    /// Calculate collision normal based on the direction of approach
    fn calculate_collision_normal(entity: &AABB, tile: &AABB, velocity: Vec2) -> (Fixed, Fixed) {
        let _entity_center = entity.center();
        let _tile_center = tile.center();

        // Determine which side of the tile was hit based on velocity direction
        if velocity.x.abs().raw() > velocity.y.abs().raw() {
            // Horizontal collision
            if velocity.x.is_positive() {
                (-Fixed::ONE, Fixed::ZERO) // Hit left side of tile
            } else {
                (Fixed::ONE, Fixed::ZERO) // Hit right side of tile
            }
        } else {
            // Vertical collision
            if velocity.y.is_positive() {
                (Fixed::ZERO, -Fixed::ONE) // Hit top side of tile
            } else {
                (Fixed::ZERO, Fixed::ONE) // Hit bottom side of tile
            }
        }
    }
}
