#[cfg(test)]
mod tests {
    use crate::constants::operator_address;
    use crate::entity::*;
    use crate::math::Fixed;
    use crate::script::*;
    use crate::state::*;
    use alloc::vec;

    #[test]
    fn test_read_character_property_operator() {
        // Create script with READ_CHARACTER_PROPERTY instruction
        // Format: [operator, character_id, var_index, property_address]
        let script = vec![
            operator_address::READ_CHARACTER_PROPERTY,
            0,    // character_id (will be valid)
            0,    // var_index
            0x20, // property_address (health)
        ];

        let mut engine = ScriptEngine::new();
        let mut state = create_test_state();
        let mut context = create_test_condition_context(&mut state);

        // This should execute without panicking
        let result = engine.execute_instruction(&script, &mut context);
        assert!(result.is_ok());
    }

    #[test]
    fn test_read_character_property_invalid_id() {
        // Create script with invalid character ID
        let script = vec![
            operator_address::READ_CHARACTER_PROPERTY,
            255,  // invalid character_id
            0,    // var_index
            0x20, // property_address
        ];

        let mut engine = ScriptEngine::new();
        let mut state = create_test_state();
        let mut context = create_test_condition_context(&mut state);

        // Should silently handle invalid ID without panicking
        let result = engine.execute_instruction(&script, &mut context);
        assert!(result.is_ok());
    }

    #[test]
    fn test_write_character_property_operator() {
        let script = vec![
            operator_address::WRITE_CHARACTER_PROPERTY,
            0,    // character_id
            0x20, // property_address (health)
            0,    // var_index
        ];

        let mut engine = ScriptEngine::new();
        let mut state = create_test_state();
        let mut context = create_test_action_context(&mut state);

        let result = engine.execute_instruction(&script, &mut context);
        assert!(result.is_ok());
    }

    #[test]
    fn test_write_character_property_invalid_id() {
        let script = vec![
            operator_address::WRITE_CHARACTER_PROPERTY,
            255,  // invalid character_id
            0x20, // property_address
            0,    // var_index
        ];

        let mut engine = ScriptEngine::new();
        let mut state = create_test_state();
        let mut context = create_test_action_context(&mut state);

        let result = engine.execute_instruction(&script, &mut context);
        assert!(result.is_ok());
    }

    #[test]
    fn test_read_spawn_property_operator() {
        let script = vec![
            operator_address::READ_SPAWN_PROPERTY,
            0,    // spawn_instance_id
            0,    // var_index
            0x52, // property_address
        ];

        let mut engine = ScriptEngine::new();
        let mut state = create_test_state_with_spawn();
        let mut context = create_test_condition_context(&mut state);

        let result = engine.execute_instruction(&script, &mut context);
        assert!(result.is_ok());
    }

    #[test]
    fn test_read_spawn_property_invalid_id() {
        let script = vec![
            operator_address::READ_SPAWN_PROPERTY,
            255,  // invalid spawn_instance_id
            0,    // var_index
            0x52, // property_address
        ];

        let mut engine = ScriptEngine::new();
        let mut state = create_test_state();
        let mut context = create_test_condition_context(&mut state);

        let result = engine.execute_instruction(&script, &mut context);
        assert!(result.is_ok());
    }

    #[test]
    fn test_write_spawn_property_operator() {
        let script = vec![
            operator_address::WRITE_SPAWN_PROPERTY,
            0,    // spawn_instance_id
            0x52, // property_address
            0,    // var_index
        ];

        let mut engine = ScriptEngine::new();
        let mut state = create_test_state_with_spawn();
        let mut context = create_test_action_context(&mut state);

        let result = engine.execute_instruction(&script, &mut context);
        assert!(result.is_ok());
    }

    #[test]
    fn test_write_spawn_property_invalid_id() {
        let script = vec![
            operator_address::WRITE_SPAWN_PROPERTY,
            255,  // invalid spawn_instance_id
            0x52, // property_address
            0,    // var_index
        ];

        let mut engine = ScriptEngine::new();
        let mut state = create_test_state();
        let mut context = create_test_action_context(&mut state);

        let result = engine.execute_instruction(&script, &mut context);
        assert!(result.is_ok());
    }

    // Helper functions to create test state and contexts
    fn create_test_state() -> GameState {
        GameState::new(
            0,                          // seed
            [[0; 16]; 15],              // tilemap
            vec![Character::new(0, 0)], // characters with one test character
            vec![],                     // action_definitions
            vec![],                     // condition_definitions
            vec![],                     // spawn_definitions
            vec![],                     // status_effect_definitions
        )
        .unwrap()
    }

    fn create_test_state_with_spawn() -> GameState {
        let mut state = create_test_state();
        // Add a spawn instance for testing
        let _spawn_def = SpawnDefinition::from_def(vec![]);
        let spawn_instance = SpawnInstance::new(
            0,                                        // spawn_id
            0,                                        // owner_id
            (Fixed::from_raw(0), Fixed::from_raw(0)), // pos
        );
        state.spawn_instances.push(spawn_instance);
        state
    }

    fn create_test_condition_context(state: &mut GameState) -> ConditionContext {
        ConditionContext::new(
            state, 0, // character_idx
            0, // condition_id
            0, // instance_id
        )
    }

    fn create_test_action_context(state: &mut GameState) -> ActionContext {
        ActionContext::new(
            state, 0, // character_idx
            0, // action_id
            0, // instance_id
        )
    }
}
