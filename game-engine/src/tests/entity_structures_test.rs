//! Unit tests for updated entity structures
//!
//! This module tests all the entity structures that were updated as part of the property updates feature,
//! including Character, ActionDefinition, ActionInstance, ConditionInstance, EntityCore, SpawnDefinition,
//! SpawnInstance, StatusEffectDefinition, and StatusEffectInstance.

use crate::{
    entity::{
        ActionDefinition, ActionInstance, Character, ConditionDefinition, ConditionInstance,
        Element, EntityCore, SpawnDefinition, SpawnInstance, StatusEffectDefinition,
        StatusEffectInstance,
    },
    math::Fixed,
};
use alloc::vec;

#[cfg(test)]
mod tests {
    use super::*;

    // ===== CHARACTER STRUCT TESTS =====

    #[test]
    fn test_character_new_properties_initialization() {
        let character = Character::new(1, 0);

        // Test new u16 health properties
        assert_eq!(character.health, 100);
        assert_eq!(character.health_cap, 100);

        // Test energy_cap property placement after energy
        assert_eq!(character.energy, 100);
        assert_eq!(character.energy_cap, 100);

        // Test new u8 properties
        assert_eq!(character.power, 0);
        assert_eq!(character.weight, 100);

        // Test new Fixed properties
        assert_eq!(character.jump_force, Fixed::from_int(5));
        assert_eq!(character.move_speed, Fixed::from_int(3));

        // Test that core EntityCore is properly initialized
        assert_eq!(character.core.id, 1);
        assert_eq!(character.core.group, 0);
    }

    #[test]
    fn test_character_property_types() {
        let mut character = Character::new(2, 1);

        // Test u16 health properties can hold larger values
        character.health = 65535;
        character.health_cap = 65535;
        assert_eq!(character.health, 65535);
        assert_eq!(character.health_cap, 65535);

        // Test Fixed properties can hold fractional values
        character.jump_force = Fixed::from_int(10) + Fixed::from_int(1).div(Fixed::from_int(2));
        character.move_speed = Fixed::from_int(7) + Fixed::from_int(3).div(Fixed::from_int(4));

        assert!(character.jump_force > Fixed::from_int(10));
        assert!(character.move_speed > Fixed::from_int(7));
    }

    #[test]
    fn test_character_armor_initialization() {
        let character = Character::new(3, 2);

        // Test armor array is properly initialized with baseline 100 values
        for i in 0..9 {
            assert_eq!(character.armor[i], 100);
        }

        // Test armor getter/setter methods
        assert_eq!(character.get_armor(Element::Punct), 100);
        assert_eq!(character.get_armor(Element::Heat), 100);
    }

    #[test]
    fn test_character_armor_modification() {
        let mut character = Character::new(4, 3);

        // Test armor modification
        character.set_armor(Element::Punct, 150);
        character.set_armor(Element::Heat, 50);

        assert_eq!(character.get_armor(Element::Punct), 150);
        assert_eq!(character.get_armor(Element::Heat), 50);
        assert_eq!(character.armor[0], 150); // Punct = 0
        assert_eq!(character.armor[4], 50); // Heat = 4
    }

    // ===== ACTION DEFINITION AND INSTANCE TESTS =====

    #[test]
    fn test_action_definition_removed_properties() {
        let action_def = ActionDefinition::new(50, 120, vec![1, 2, 3]);

        // Test that interval and duration properties are not present
        // (This is verified by compilation - if they existed, this wouldn't compile)
        assert_eq!(action_def.energy_cost, 50);
        assert_eq!(action_def.cooldown, 120);
        assert_eq!(action_def.script, vec![1, 2, 3]);
    }

    #[test]
    fn test_action_instance_renamed_properties() {
        let action_instance = ActionInstance::new(0);

        // Test that remaining_duration was renamed to cooldown
        assert_eq!(action_instance.cooldown, 0);
        assert_eq!(action_instance.last_used_frame, u16::MAX);

        // Test runtime_vars array is [u8; 4]
        assert_eq!(action_instance.runtime_vars.len(), 4);
        assert_eq!(action_instance.runtime_vars, [0; 4]);

        // Test runtime_fixed array
        assert_eq!(action_instance.runtime_fixed.len(), 4);
        assert_eq!(action_instance.runtime_fixed, [Fixed::ZERO; 4]);
    }

    #[test]
    fn test_action_instance_cooldown_functionality() {
        let mut action_instance = ActionInstance::new(1);

        // Test cooldown modification
        action_instance.cooldown = 60;
        assert_eq!(action_instance.cooldown, 60);
        assert!(action_instance.is_active());

        action_instance.cooldown = 0;
        assert!(!action_instance.is_active());
    }

    #[test]
    fn test_action_instance_runtime_vars_size() {
        let mut action_instance = ActionInstance::new(2);

        // Test that runtime_vars is exactly [u8; 4]
        action_instance.runtime_vars = [10, 20, 30, 40];
        assert_eq!(action_instance.runtime_vars, [10, 20, 30, 40]);
        assert_eq!(action_instance.runtime_vars.len(), 4);
    }

    #[test]
    fn test_action_definition_create_instance() {
        let action_def = ActionDefinition::new(25, 90, vec![5, 6, 7, 8]);
        let instance = action_def.create_instance(3);

        assert_eq!(instance.definition_id, 3);
        assert_eq!(instance.cooldown, 0);
        assert_eq!(instance.last_used_frame, u16::MAX);
        assert_eq!(instance.runtime_vars, [0; 4]);
        assert_eq!(instance.runtime_fixed, [Fixed::ZERO; 4]);
    }

    // ===== CONDITION INSTANCE TESTS =====

    #[test]
    fn test_condition_instance_runtime_vars_size() {
        let condition_instance = ConditionInstance::new(0);

        // Test that runtime_vars is [u8; 4] (reduced from [u8; 8])
        assert_eq!(condition_instance.runtime_vars.len(), 4);
        assert_eq!(condition_instance.runtime_vars, [0; 4]);
        assert_eq!(condition_instance.runtime_fixed.len(), 4);
        assert_eq!(condition_instance.runtime_fixed, [Fixed::ZERO; 4]);
    }

    #[test]
    fn test_condition_instance_runtime_vars_modification() {
        let mut condition_instance = ConditionInstance::new(1);

        // Test runtime_vars modification
        condition_instance.runtime_vars = [100, 200, 50, 75];
        assert_eq!(condition_instance.runtime_vars, [100, 200, 50, 75]);

        // Test runtime_fixed modification
        condition_instance.runtime_fixed = [
            Fixed::from_int(1),
            Fixed::from_int(2),
            Fixed::from_int(3),
            Fixed::from_int(4),
        ];
        assert_eq!(condition_instance.runtime_fixed[0], Fixed::from_int(1));
        assert_eq!(condition_instance.runtime_fixed[3], Fixed::from_int(4));
    }

    #[test]
    fn test_condition_definition_create_instance() {
        let condition_def = ConditionDefinition::new(Fixed::from_int(2), vec![1, 2, 3, 4]);
        let instance = condition_def.create_instance(5);

        assert_eq!(instance.definition_id, 5);
        assert_eq!(instance.runtime_vars, [0; 4]);
        assert_eq!(instance.runtime_fixed, [Fixed::ZERO; 4]);
    }

    // ===== ENTITY CORE TESTS =====

    #[test]
    fn test_entity_core_consolidated_dir_property() {
        let entity_core = EntityCore::new(10, 5);

        // Test that facing and gravity_dir are combined into dir tuple
        assert_eq!(entity_core.dir, (1, 1)); // Default: right (1) and downward (1)

        // Test helper methods for direction access
        assert_eq!(entity_core.get_facing(), Fixed::from_int(1)); // Right
        assert_eq!(entity_core.get_gravity_dir(), Fixed::from_int(1)); // Downward
    }

    #[test]
    fn test_entity_core_dir_modification() {
        let mut entity_core = EntityCore::new(11, 6);

        // Test direction modification through helper methods
        entity_core.set_facing(Fixed::from_int(-1)); // Left
        entity_core.set_gravity_dir(Fixed::from_int(-1)); // Upward

        assert_eq!(entity_core.dir, (0, 0)); // Left (0) and upward (0)
        assert_eq!(entity_core.get_facing(), Fixed::from_int(-1));
        assert_eq!(entity_core.get_gravity_dir(), Fixed::from_int(-1));
    }

    #[test]
    fn test_entity_core_new_targeting_properties() {
        let mut entity_core = EntityCore::new(12, 7);

        // Test new enmity property
        assert_eq!(entity_core.enmity, 0); // Default enmity
        entity_core.enmity = 150;
        assert_eq!(entity_core.enmity, 150);

        // Test new target_id property
        assert_eq!(entity_core.target_id, None); // No target initially
        entity_core.target_id = Some(25);
        assert_eq!(entity_core.target_id, Some(25));

        // Test new target_type property
        assert_eq!(entity_core.target_type, 0); // No target type initially
        entity_core.target_type = 1; // Character target
        assert_eq!(entity_core.target_type, 1);
    }

    #[test]
    fn test_entity_core_default_values() {
        let entity_core = EntityCore::new(13, 8);

        assert_eq!(entity_core.id, 13);
        assert_eq!(entity_core.group, 8);
        assert_eq!(entity_core.pos, (Fixed::ZERO, Fixed::ZERO));
        assert_eq!(entity_core.vel, (Fixed::ZERO, Fixed::ZERO));
        assert_eq!(entity_core.size, (16, 16)); // Default 16x16 pixel size
        assert_eq!(entity_core.collision, (true, true, true, true));
        assert_eq!(entity_core.dir, (1, 1)); // Right and downward
        assert_eq!(entity_core.enmity, 0);
        assert_eq!(entity_core.target_id, None);
        assert_eq!(entity_core.target_type, 0);
    }

    // ===== SPAWN DEFINITION TESTS =====

    #[test]
    fn test_spawn_definition_enhanced_combat_properties() {
        let mut spawn_def = SpawnDefinition {
            damage_base: 1000,    // Test u16 type (was u8)
            damage_range: 500,    // New property
            crit_chance: 25,      // New property (0-100)
            crit_multiplier: 150, // New property (1-100, but can exceed for testing)
            health_cap: 100,
            duration: 300,
            element: Some(Element::Heat),
            chance: 80,     // New property
            size: (16, 16), // New property
            args: [0; 8],
            spawns: [0; 4],
            behavior_script: vec![],
            collision_script: vec![],
            despawn_script: vec![],
        };

        // Test u16 damage_base can hold larger values
        assert_eq!(spawn_def.damage_base, 1000);
        spawn_def.damage_base = 65535;
        assert_eq!(spawn_def.damage_base, 65535);

        // Test new combat properties
        assert_eq!(spawn_def.damage_range, 500);
        assert_eq!(spawn_def.crit_chance, 25);
        assert_eq!(spawn_def.crit_multiplier, 150);
        assert_eq!(spawn_def.chance, 80);
    }

    #[test]
    fn test_spawn_definition_combat_property_ranges() {
        let spawn_def = SpawnDefinition {
            damage_base: 100,
            damage_range: 50,
            crit_chance: 100,   // Max value
            crit_multiplier: 1, // Min value
            health_cap: 50,
            duration: 120,
            element: Some(Element::Force),
            chance: 0,    // Min value
            size: (8, 8), // New property
            args: [0; 8],
            spawns: [0; 4],
            behavior_script: vec![],
            collision_script: vec![],
            despawn_script: vec![],
        };

        // Test boundary values
        assert_eq!(spawn_def.crit_chance, 100); // 0-100 range
        assert_eq!(spawn_def.crit_multiplier, 1); // 1-100 range
        assert_eq!(spawn_def.chance, 0); // Application chance
    }

    // ===== SPAWN INSTANCE TESTS =====

    #[test]
    fn test_spawn_instance_comprehensive_properties() {
        let spawn_instance =
            SpawnInstance::new(5, 10, (Fixed::from_int(100), Fixed::from_int(200)));

        // Test new health properties
        assert_eq!(spawn_instance.health, 1); // Default value
        assert_eq!(spawn_instance.health_cap, 1); // Default value

        // Test owner_type property
        assert_eq!(spawn_instance.owner_type, 1); // Default to Character owner

        // Test EntityId owner_id (can be Character or Spawn)
        assert_eq!(spawn_instance.owner_id, 10);

        // Test new rotation property
        assert_eq!(spawn_instance.rotation, Fixed::ZERO);

        // Test renamed life_span property
        assert_eq!(spawn_instance.life_span, 0); // Will be set from spawn definition

        // Test renamed runtime properties
        assert_eq!(spawn_instance.runtime_vars.len(), 4);
        assert_eq!(spawn_instance.runtime_vars, [0; 4]);
        assert_eq!(spawn_instance.runtime_fixed.len(), 4);
        assert_eq!(spawn_instance.runtime_fixed, [Fixed::ZERO; 4]);
    }

    #[test]
    fn test_spawn_instance_property_modification() {
        let mut spawn_instance = SpawnInstance::new(6, 11, (Fixed::ZERO, Fixed::ZERO));

        // Test health property modification (u16)
        spawn_instance.health = 5000;
        spawn_instance.health_cap = 10000;
        assert_eq!(spawn_instance.health, 5000);
        assert_eq!(spawn_instance.health_cap, 10000);

        // Test owner_type modification
        spawn_instance.owner_type = 2; // Spawn owner
        assert_eq!(spawn_instance.owner_type, 2);

        // Test rotation modification
        spawn_instance.rotation = Fixed::from_int(90);
        assert_eq!(spawn_instance.rotation, Fixed::from_int(90));

        // Test life_span modification
        spawn_instance.life_span = 600;
        assert_eq!(spawn_instance.life_span, 600);

        // Test runtime_vars modification
        spawn_instance.runtime_vars = [10, 20, 30, 40];
        assert_eq!(spawn_instance.runtime_vars, [10, 20, 30, 40]);
    }

    #[test]
    fn test_spawn_instance_with_element() {
        let spawn_instance = SpawnInstance::with_element(
            7,
            12,
            (Fixed::from_int(50), Fixed::from_int(75)),
            Element::Cryo,
        );

        assert_eq!(spawn_instance.spawn_id, 7);
        assert_eq!(spawn_instance.owner_id, 12);
        assert_eq!(spawn_instance.element, Element::Cryo);
        assert_eq!(
            spawn_instance.core.pos,
            (Fixed::from_int(50), Fixed::from_int(75))
        );
    }

    #[test]
    fn test_spawn_instance_targeting_properties_in_core() {
        let mut spawn_instance = SpawnInstance::new(8, 13, (Fixed::ZERO, Fixed::ZERO));

        // Test that targeting properties are in EntityCore (moved from SpawnInstance)
        spawn_instance.core.target_id = Some(25);
        spawn_instance.core.target_type = 1; // Character target
        spawn_instance.core.enmity = 100;

        assert_eq!(spawn_instance.core.target_id, Some(25));
        assert_eq!(spawn_instance.core.target_type, 1);
        assert_eq!(spawn_instance.core.enmity, 100);
    }

    // ===== STATUS EFFECT DEFINITION AND INSTANCE TESTS =====

    #[test]
    fn test_status_effect_definition_chance_property() {
        let status_def = StatusEffectDefinition::new(
            300,           // duration
            5,             // stack_limit
            true,          // reset_on_stack
            75,            // chance - new property
            vec![1, 2, 3], // on_script
            vec![4, 5, 6], // tick_script
            vec![7, 8, 9], // off_script
        );

        assert_eq!(status_def.duration, 300);
        assert_eq!(status_def.stack_limit, 5);
        assert_eq!(status_def.reset_on_stack, true);
        assert_eq!(status_def.chance, 75); // New chance property
        assert_eq!(status_def.args, [0; 8]);
        assert_eq!(status_def.spawns, [0; 4]);
    }

    #[test]
    fn test_status_effect_instance_renamed_properties() {
        let status_instance = StatusEffectInstance::new(0);

        // Test that remaining_duration was renamed to life_span
        assert_eq!(status_instance.life_span, 0);

        // Test that vars was renamed to runtime_vars with [u8; 4]
        assert_eq!(status_instance.runtime_vars.len(), 4);
        assert_eq!(status_instance.runtime_vars, [0; 4]);

        // Test that fixed was renamed to runtime_fixed
        assert_eq!(status_instance.runtime_fixed.len(), 4);
        assert_eq!(status_instance.runtime_fixed, [Fixed::ZERO; 4]);

        assert_eq!(status_instance.stack_count, 1);
    }

    #[test]
    fn test_status_effect_instance_property_modification() {
        let mut status_instance = StatusEffectInstance::new(1);

        // Test life_span modification
        status_instance.life_span = 450;
        assert_eq!(status_instance.life_span, 450);

        // Test runtime_vars modification
        status_instance.runtime_vars = [50, 100, 150, 200];
        assert_eq!(status_instance.runtime_vars, [50, 100, 150, 200]);

        // Test runtime_fixed modification
        status_instance.runtime_fixed = [
            Fixed::from_int(10),
            Fixed::from_int(20),
            Fixed::from_int(30),
            Fixed::from_int(40),
        ];
        assert_eq!(status_instance.runtime_fixed[0], Fixed::from_int(10));
        assert_eq!(status_instance.runtime_fixed[3], Fixed::from_int(40));

        // Test stack_count modification
        status_instance.stack_count = 3;
        assert_eq!(status_instance.stack_count, 3);
    }

    #[test]
    fn test_status_effect_definition_create_instance() {
        let status_def = StatusEffectDefinition::new(
            600,   // duration
            10,    // stack_limit
            false, // reset_on_stack
            90,    // chance
            vec![],
            vec![],
            vec![], // scripts
        );

        let instance = status_def.create_instance(2);

        assert_eq!(instance.definition_id, 2);
        assert_eq!(instance.life_span, 600); // Set from definition duration
        assert_eq!(instance.stack_count, 1);
        assert_eq!(instance.runtime_vars, [0; 4]);
        assert_eq!(instance.runtime_fixed, [Fixed::ZERO; 4]);
    }

    #[test]
    fn test_status_effect_instance_expiration() {
        let mut status_instance = StatusEffectInstance::new(3);

        // Test expiration check
        assert!(status_instance.is_expired()); // life_span = 0

        status_instance.life_span = 100;
        assert!(!status_instance.is_expired());

        status_instance.life_span = 0;
        assert!(status_instance.is_expired());
    }

    // ===== INTEGRATION TESTS =====

    #[test]
    fn test_character_with_updated_entity_core() {
        let mut character = Character::new(20, 10);

        // Test that Character contains updated EntityCore with new properties
        character.core.dir = (0, 1); // Left and downward
        character.core.enmity = 200;
        character.core.target_id = Some(15);
        character.core.target_type = 2; // Spawn target

        assert_eq!(character.core.dir, (0, 1));
        assert_eq!(character.core.enmity, 200);
        assert_eq!(character.core.target_id, Some(15));
        assert_eq!(character.core.target_type, 2);

        // Test that Character has all new properties
        character.health = 2000;
        character.health_cap = 3000;
        character.power = 50;
        character.weight = 80;
        character.jump_force = Fixed::from_int(8);
        character.move_speed = Fixed::from_int(6);

        assert_eq!(character.health, 2000);
        assert_eq!(character.health_cap, 3000);
        assert_eq!(character.power, 50);
        assert_eq!(character.weight, 80);
        assert_eq!(character.jump_force, Fixed::from_int(8));
        assert_eq!(character.move_speed, Fixed::from_int(6));
    }

    #[test]
    fn test_spawn_instance_with_updated_entity_core() {
        let mut spawn_instance =
            SpawnInstance::new(9, 14, (Fixed::from_int(300), Fixed::from_int(400)));

        // Test that SpawnInstance contains updated EntityCore
        spawn_instance.core.dir = (1, 0); // Right and upward
        spawn_instance.core.enmity = 75;
        spawn_instance.core.target_id = Some(30);
        spawn_instance.core.target_type = 1; // Character target

        assert_eq!(spawn_instance.core.dir, (1, 0));
        assert_eq!(spawn_instance.core.enmity, 75);
        assert_eq!(spawn_instance.core.target_id, Some(30));
        assert_eq!(spawn_instance.core.target_type, 1);

        // Test SpawnInstance specific properties
        spawn_instance.health = 800;
        spawn_instance.health_cap = 1200;
        spawn_instance.owner_type = 2; // Spawn owner
        spawn_instance.rotation = Fixed::from_int(45);
        spawn_instance.life_span = 240;

        assert_eq!(spawn_instance.health, 800);
        assert_eq!(spawn_instance.health_cap, 1200);
        assert_eq!(spawn_instance.owner_type, 2);
        assert_eq!(spawn_instance.rotation, Fixed::from_int(45));
        assert_eq!(spawn_instance.life_span, 240);
    }

    #[test]
    fn test_all_runtime_vars_arrays_are_size_4() {
        // Test that all runtime_vars arrays are consistently [u8; 4]
        let action_instance = ActionInstance::new(0);
        let condition_instance = ConditionInstance::new(0);
        let status_instance = StatusEffectInstance::new(0);
        let spawn_instance = SpawnInstance::new(0, 0, (Fixed::ZERO, Fixed::ZERO));

        assert_eq!(action_instance.runtime_vars.len(), 4);
        assert_eq!(condition_instance.runtime_vars.len(), 4);
        assert_eq!(status_instance.runtime_vars.len(), 4);
        assert_eq!(spawn_instance.runtime_vars.len(), 4);

        // Test that all runtime_fixed arrays are consistently [Fixed; 4]
        assert_eq!(action_instance.runtime_fixed.len(), 4);
        assert_eq!(condition_instance.runtime_fixed.len(), 4);
        assert_eq!(status_instance.runtime_fixed.len(), 4);
        assert_eq!(spawn_instance.runtime_fixed.len(), 4);
    }

    #[test]
    fn test_element_enum_functionality() {
        // Test Element enum used in spawn instances
        let spawn_instance =
            SpawnInstance::with_element(10, 15, (Fixed::ZERO, Fixed::ZERO), Element::Virus);

        assert_eq!(spawn_instance.element, Element::Virus);

        // Test Element conversion
        assert_eq!(Element::from_u8(0), Some(Element::Punct));
        assert_eq!(Element::from_u8(8), Some(Element::Virus));
        assert_eq!(Element::from_u8(9), None); // Invalid
    }
}
