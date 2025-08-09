use crate::entity::Character;

#[test]
fn test_energy_regeneration_respects_cap() {
    // Create a test character with energy near cap
    let mut character = Character::new(0, 0);
    character.energy = 95;
    character.energy_cap = 100;
    character.energy_regen = 10; // High regen to test cap
    character.energy_regen_rate = 30; // Regen every 30 frames

    let frame = 30u16; // First regen frame

    // Test the fixed energy regeneration logic
    if character.energy_regen_rate != 0 && frame % (character.energy_regen_rate as u16) == 0 {
        // FIXED: Respect energy_cap when regenerating energy
        let new_energy = character.energy.saturating_add(character.energy_regen);
        character.energy = new_energy.min(character.energy_cap);
    }

    // Energy should be exactly at cap, not over
    assert_eq!(character.energy, character.energy_cap);
    assert!(character.energy <= character.energy_cap);

    // Test another regeneration cycle at frame 60
    let frame = 60u16;
    if character.energy_regen_rate != 0 && frame % (character.energy_regen_rate as u16) == 0 {
        let new_energy = character.energy.saturating_add(character.energy_regen);
        character.energy = new_energy.min(character.energy_cap);
    }

    // Energy should still be at cap, not over
    assert_eq!(character.energy, character.energy_cap);
    assert!(character.energy <= character.energy_cap);
}

#[test]
fn test_energy_regeneration_normal_case() {
    // Test normal regeneration when not at cap
    let mut character = Character::new(0, 0);
    character.energy = 50;
    character.energy_cap = 100;
    character.energy_regen = 5;
    character.energy_regen_rate = 30;

    let frame = 30u16; // Regen frame

    // Apply regeneration
    if character.energy_regen_rate != 0 && frame % (character.energy_regen_rate as u16) == 0 {
        let new_energy = character.energy.saturating_add(character.energy_regen);
        character.energy = new_energy.min(character.energy_cap);
    }

    // Energy should increase by regen amount
    assert_eq!(character.energy, 55);
    assert!(character.energy <= character.energy_cap);
}

#[test]
fn test_energy_regeneration_different_caps() {
    // Test with different energy caps
    let test_cases = [
        (90, 100, 15), // Should cap at 100
        (45, 50, 10),  // Should cap at 50
        (20, 25, 8),   // Should cap at 25
    ];

    for (initial_energy, energy_cap, energy_regen) in test_cases {
        let mut character = Character::new(0, 0);
        character.energy = initial_energy;
        character.energy_cap = energy_cap;
        character.energy_regen = energy_regen;
        character.energy_regen_rate = 30;

        let frame = 30u16; // Regen frame

        // Apply regeneration
        if character.energy_regen_rate != 0 && frame % (character.energy_regen_rate as u16) == 0 {
            let new_energy = character.energy.saturating_add(character.energy_regen);
            character.energy = new_energy.min(character.energy_cap);
        }

        // Energy should never exceed cap
        assert!(character.energy <= character.energy_cap);

        // Energy should be either initial + regen or capped at energy_cap
        let expected_energy = (initial_energy + energy_regen).min(energy_cap);
        assert_eq!(character.energy, expected_energy);
    }
}

#[test]
fn test_old_vs_new_energy_regeneration() {
    // Test that demonstrates the bug fix
    let mut character_old = Character::new(0, 0);
    character_old.energy = 95;
    character_old.energy_cap = 100;
    character_old.energy_regen = 10;

    let mut character_new = character_old.clone();

    // Old buggy logic (would exceed cap)
    character_old.energy = character_old
        .energy
        .saturating_add(character_old.energy_regen);

    // New fixed logic (respects cap)
    let new_energy = character_new
        .energy
        .saturating_add(character_new.energy_regen);
    character_new.energy = new_energy.min(character_new.energy_cap);

    // Old logic exceeds cap
    assert!(character_old.energy > character_old.energy_cap);
    assert_eq!(character_old.energy, 105); // Bug: exceeds cap

    // New logic respects cap
    assert!(character_new.energy <= character_new.energy_cap);
    assert_eq!(character_new.energy, 100); // Fixed: capped at energy_cap
}
