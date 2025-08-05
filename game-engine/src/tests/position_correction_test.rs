//! Test position correction specifically

use crate::entity::EntityCore;
use crate::math::Fixed;
use crate::state::GameState;
use crate::tilemap::Tilemap;

#[test]
fn test_position_correction_directly() {
    // Create a tilemap with floor at bottom
    let mut tilemap_data = [[0u8; 16]; 15];
    for x in 0..16 {
        tilemap_data[14][x] = 1; // Floor at row 14 (y = 224)
    }
    let tilemap = Tilemap::new(tilemap_data);

    // Create an entity that's overlapping with the floor
    let mut entity = EntityCore::new(1, 1);
    entity.pos = (Fixed::from_int(32), Fixed::from_int(193)); // y=193, bottom at 193+32=225 (overlaps floor at 224)
    entity.size = (16, 32);

    // Verify entity is initially overlapping
    let initial_rect = crate::tilemap::CollisionRect::from_entity(entity.pos, entity.size);
    assert!(
        tilemap.check_collision(initial_rect),
        "Entity should initially be overlapping with floor"
    );

    // Apply position correction
    GameState::correct_position_overlap(&tilemap, &mut entity);

    // Verify entity is no longer overlapping
    let corrected_rect = crate::tilemap::CollisionRect::from_entity(entity.pos, entity.size);
    assert!(
        !tilemap.check_collision(corrected_rect),
        "Entity should no longer be overlapping after correction"
    );

    // Entity should have been pushed up
    assert!(
        entity.pos.1.to_int() < 193,
        "Entity should have been pushed up from y=193"
    );

    // Entity should be at y=192 (224 - 32 = 192)
    assert_eq!(
        entity.pos.1.to_int(),
        192,
        "Entity should be positioned at y=192 to rest on floor"
    );
}
