//! Test for task 6: GameState definition collections and lookup methods

#[cfg(test)]
mod tests {
    use crate::entity::{ActionDefinition, ConditionDefinition, StatusEffectDefinition};
    use crate::math::Fixed;
    use crate::state::GameState;
    use alloc::vec;

    #[test]
    fn test_definition_collections_initialization() {
        let tilemap = [[0u8; 16]; 15];
        let game_state = GameState::new(12345, tilemap, vec![], vec![]).unwrap();

        // Verify new definition collections are initialized
        assert_eq!(game_state.action_definitions.len(), 0);
        assert_eq!(game_state.condition_definitions.len(), 0);
        assert_eq!(game_state.status_effect_definitions.len(), 0);
        assert_eq!(game_state.spawn_definitions.len(), 0);

        // Verify new instance collections are initialized
        assert_eq!(game_state.action_instances.len(), 0);
        assert_eq!(game_state.condition_instances.len(), 0);
    }

    #[test]
    fn test_definition_lookup_methods() {
        let tilemap = [[0u8; 16]; 15];
        let mut game_state = GameState::new(12345, tilemap, vec![], vec![]).unwrap();

        // Add some test definitions
        let action_def = ActionDefinition {
            energy_cost: 10,
            interval: 60,
            duration: 30,
            cooldown: 120,
            args: [1, 2, 3, 4, 5, 6, 7, 8],
            spawns: [0, 1, 2, 3],
            script: vec![0x00], // Simple exit script
        };

        let condition_def = ConditionDefinition {
            energy_mul: Fixed::from_int(1),
            args: [1, 2, 3, 4, 5, 6, 7, 8],
            spawns: [0, 1, 2, 3],
            script: vec![0x01, 0x00], // Always true script
        };

        let status_effect_def = StatusEffectDefinition {
            duration: 300,
            stack_limit: 5,
            reset_on_stack: false,
            args: [1, 2, 3, 4, 5, 6, 7, 8],
            spawns: [0, 1, 2, 3],
            on_script: vec![0x00],
            tick_script: vec![0x00],
            off_script: vec![0x00],
        };

        // Add definitions to collections
        game_state.action_definitions.push(action_def.clone());
        game_state.condition_definitions.push(condition_def.clone());
        game_state
            .status_effect_definitions
            .push(status_effect_def.clone());

        // Test lookup methods
        let retrieved_action = game_state.get_action_definition(0);
        assert!(retrieved_action.is_some());
        assert_eq!(retrieved_action.unwrap().energy_cost, 10);
        assert_eq!(retrieved_action.unwrap().cooldown, 120);

        let retrieved_condition = game_state.get_condition_definition(0);
        assert!(retrieved_condition.is_some());
        assert_eq!(retrieved_condition.unwrap().energy_mul, Fixed::from_int(1));

        let retrieved_status_effect = game_state.get_status_effect_definition(0);
        assert!(retrieved_status_effect.is_some());
        assert_eq!(retrieved_status_effect.unwrap().duration, 300);
        assert_eq!(retrieved_status_effect.unwrap().stack_limit, 5);

        // Test invalid IDs return None
        assert!(game_state.get_action_definition(1).is_none());
        assert!(game_state.get_condition_definition(1).is_none());
        assert!(game_state.get_status_effect_definition(1).is_none());
    }

    #[test]
    fn test_mutable_definition_lookup_methods() {
        let tilemap = [[0u8; 16]; 15];
        let mut game_state = GameState::new(12345, tilemap, vec![], vec![]).unwrap();

        // Add a test action definition
        let action_def = ActionDefinition {
            energy_cost: 10,
            interval: 60,
            duration: 30,
            cooldown: 120,
            args: [1, 2, 3, 4, 5, 6, 7, 8],
            spawns: [0, 1, 2, 3],
            script: vec![0x00],
        };

        game_state.action_definitions.push(action_def);

        // Test mutable access
        {
            let action_mut = game_state.get_action_definition_mut(0);
            assert!(action_mut.is_some());
            action_mut.unwrap().energy_cost = 20;
        }

        // Verify the change was applied
        let action = game_state.get_action_definition(0);
        assert_eq!(action.unwrap().energy_cost, 20);
    }

    #[test]
    fn test_spawn_definition_lookup_consistency() {
        let tilemap = [[0u8; 16]; 15];
        let spawn_defs = vec![crate::entity::SpawnDefinition {
            damage_base: 10,
            health_cap: 100,
            duration: 300,
            element: Some(crate::entity::Element::Heat),
            vars: [0; 8],
            fixed: [Fixed::ZERO; 4],
            args: [0; 8],
            spawns: [0; 4],
            behavior_script: vec![0x00],
            collision_script: vec![0x00],
            despawn_script: vec![0x00],
        }];

        let game_state = GameState::new(12345, tilemap, vec![], spawn_defs).unwrap();

        // Test that spawn definitions are accessible through both old and new methods
        assert_eq!(game_state.spawn_definitions.len(), 1);
        assert!(game_state.get_spawn_definition(0).is_some());
        assert_eq!(game_state.get_spawn_definition(0).unwrap().damage_base, 10);
        assert!(game_state.get_spawn_definition(1).is_none());
    }
}
