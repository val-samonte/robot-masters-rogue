//! Physics system for collision detection and movement

use crate::entity::EntityCore;
use alloc::vec::Vec;

/// AABB collision detection between two rectangles
pub fn aabb(
    a_pos_x: u16,
    a_pos_y: u16,
    a_width: u16,
    a_height: u16,
    b_pos_x: u16,
    b_pos_y: u16,
    b_width: u16,
    b_height: u16,
) -> bool {
    a_pos_x < b_pos_x + b_width
        && a_pos_x + a_width > b_pos_x
        && a_pos_y < b_pos_y + b_height
        && a_pos_y + a_height > b_pos_y
}

/// Get tile indices that a range spans
fn get_tile_indices(from: u16, to: u16) -> Vec<i16> {
    let mut output = Vec::new();
    for i in (from as i16)..=(to as i16) {
        let index = i / 16; // 16 pixels per tile
        if !output.contains(&index) {
            output.push(index);
        }
    }
    output
}

/// Result of collision detection with corrected position
#[derive(Debug)]
pub struct CollisionResult {
    pub pos_x: u16,
    pub pos_y: u16,
    pub sides: [bool; 4], // top, right, bottom, left
}

/// Check world collision and return corrected position
pub fn check_world_collision(
    pos_x: u16,
    pos_y: u16,
    vel_x: i16,
    vel_y: i16,
    width: u16,
    height: u16,
    tiles: &Vec<Vec<u8>>,
) -> CollisionResult {
    let mut sides = [false; 4]; // top, right, bottom, left
    let tiles_x = get_tile_indices(pos_x, pos_x + width - 1);
    let tiles_y = get_tile_indices(pos_y, pos_y + height - 1);
    let mut offset_x = pos_x;
    let mut offset_y = pos_y;

    for y in tiles_y.iter() {
        for x in tiles_x.iter() {
            // Bounds check for tile coordinates
            if *y < 0 || *x < 0 || *y as usize >= tiles.len() {
                continue;
            }

            let tile = tiles
                .get(*y as usize)
                .and_then(|row| row.get(*x as usize))
                .copied()
                .unwrap_or(1); // Default to solid for out-of-bounds

            if tile != 1 {
                continue; // Skip empty tiles
            }

            let tile_x = *x as u16 * 16; // 16 pixels per tile
            let tile_y = *y as u16 * 16;
            let tile_width = 16;
            let tile_height = 16;

            // Check if entity overlaps with this solid tile
            if aabb(
                pos_x,
                pos_y,
                width,
                height,
                tile_x,
                tile_y,
                tile_width,
                tile_height,
            ) {
                let entity_left = pos_x;
                let entity_right = pos_x + width;
                let entity_top = pos_y;
                let entity_bottom = pos_y + height;

                let tile_left = tile_x;
                let tile_right = tile_x + tile_width;
                let tile_top = tile_y;
                let tile_bottom = tile_y + tile_height;

                // Calculate overlap amounts
                let overlap_left = entity_right.saturating_sub(tile_left);
                let overlap_right = tile_right.saturating_sub(entity_left);
                let overlap_top = entity_bottom.saturating_sub(tile_top);
                let overlap_bottom = tile_bottom.saturating_sub(entity_top);

                // Find the smallest overlap to determine collision direction
                let min_overlap = overlap_left
                    .min(overlap_right)
                    .min(overlap_top)
                    .min(overlap_bottom);

                if min_overlap == overlap_left && vel_x > 0 {
                    // Colliding with left side of tile (entity moving right)
                    offset_x = tile_left.saturating_sub(width);
                    sides[1] = true; // right collision
                } else if min_overlap == overlap_right && vel_x < 0 {
                    // Colliding with right side of tile (entity moving left)
                    offset_x = tile_right;
                    sides[3] = true; // left collision
                } else if min_overlap == overlap_top && vel_y > 0 {
                    // Colliding with top side of tile (entity moving down)
                    offset_y = tile_top.saturating_sub(height);
                    sides[2] = true; // bottom collision (grounded)
                } else if min_overlap == overlap_bottom && vel_y < 0 {
                    // Colliding with bottom side of tile (entity moving up)
                    offset_y = tile_bottom;
                    sides[0] = true; // top collision
                }
            }
        }
    }

    CollisionResult {
        pos_x: offset_x,
        pos_y: offset_y,
        sides,
    }
}

/// Correct world collision with proper position and velocity handling
pub fn correct_world_collision(
    pos_x: u16,
    pos_y: u16,
    vel_x: i16,
    vel_y: i16,
    width: u16,
    height: u16,
    flipped: bool,
    tiles: &Vec<Vec<u8>>,
) -> (u16, u16, i16, i16, bool, bool, bool, bool) {
    let mut pos_x = pos_x;
    let mut pos_y = pos_y;
    let mut vel_x = vel_x;
    let mut vel_y = vel_y;

    // Check for collisions on the X axis
    let next_x_pos_x = ((pos_x as i16) + vel_x) as u16;
    let collision_x =
        check_world_collision(next_x_pos_x, pos_y, vel_x, vel_y, width, height, tiles);
    let is_colliding_right = collision_x.sides[1];
    let is_colliding_left = collision_x.sides[3];

    if collision_x.pos_x != next_x_pos_x {
        vel_x = 0;
        pos_x = collision_x.pos_x;
    } else {
        pos_x = (pos_x as i16 + vel_x) as u16;
    }

    // Check for collisions on the Y axis
    let next_y_pos_y = ((pos_y as i16) + vel_y) as u16;
    let collision_y =
        check_world_collision(pos_x, next_y_pos_y, vel_x, vel_y, width, height, tiles);
    let is_colliding_top = if flipped {
        collision_y.sides[0]
    } else {
        collision_y.sides[2]
    };
    let mut is_grounded = if flipped {
        collision_y.sides[2]
    } else {
        collision_y.sides[0]
    };

    if collision_y.pos_y != next_y_pos_y {
        vel_y = 0;
        pos_y = collision_y.pos_y;
    } else {
        pos_y = (pos_y as i16 + vel_y) as u16;
        is_grounded = false;
    }

    (
        pos_x,
        pos_y,
        vel_x,
        vel_y,
        is_colliding_top,
        is_colliding_right,
        is_grounded,
        is_colliding_left,
    )
}

/// Physics system for updating entity positions
pub struct PhysicsSystem;

impl PhysicsSystem {
    /// Update entity position based on velocity
    pub fn update_position(entity: &mut EntityCore) {
        entity.pos.0 = entity.pos.0.add(entity.vel.0);
        entity.pos.1 = entity.pos.1.add(entity.vel.1);
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
