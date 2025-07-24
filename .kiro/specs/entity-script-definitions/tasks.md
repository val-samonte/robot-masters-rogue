# Implementation Plan

- [x] 1. Create definition structures and ID types

  - Define ActionDefinition, ConditionDefinition, and StatusEffectDefinition structs
  - Create type aliases for ActionId, ConditionId, and StatusEffectId
  - Implement basic constructors and validation methods for each definition type
  - _Requirements: 1.1, 4.1, 4.2, 4.3, 4.4_

- [x] 2. Create instance structures for runtime state

  - Define ActionInstance and ConditionInstance structs with definition_id references
  - Implement instance creation methods that link to definition IDs
  - Add runtime state management for active instances
  - _Requirements: 5.1, 5.2, 5.3_

- [x] 3. Move vars and fixed arrays from definitions to instances

  - Remove vars and fixed arrays from ActionDefinition, ConditionDefinition, and StatusEffectDefinition
  - Ensure ActionInstance and ConditionInstance have their own vars and fixed arrays for runtime state
  - Update create_instance methods to initialize instance variables independently from definitions
  - Update all tests to reflect that variables are instance-specific, not definition-specific
  - _Requirements: 5.2, 5.3_

- [x] 4. Update property accessors to handle definition vs instance properties

  - Modify PropertyAddress enum to distinguish between definition and instance properties
  - Update property accessor methods to resolve definition properties via definition ID lookup
  - Ensure instance properties (vars, fixed) are read directly from the instance
  - Update script execution to use the correct property resolution based on property type
  - _Requirements: 2.2, 3.1, 3.2, 5.2_

- [ ] 5. Modify Character struct to use ID-based behaviors

  - Change behaviors field from embedded objects to Vec<(ConditionId, ActionId)>
  - Update locked_action to reference ActionInstanceId instead of embedded action
  - Remove embedded Action and Condition objects from Character
  - _Requirements: 2.1, 2.2, 2.3_

- [ ] 6. Update GameState to include definition collections

  - Add action_definitions, condition_definitions, and status_effect_definitions fields
  - Add action_instances and condition_instances collections for runtime state
  - Implement definition lookup methods (get_action_definition, get_condition_definition, etc.)
  - _Requirements: 1.1, 1.2, 5.1, 5.4_

- [ ] 7. Modify public API to accept definition collections

  - Update new_game function signature to accept definition collections as parameters
  - Add validation logic to ensure all referenced IDs exist in the provided definitions
  - Implement circular reference detection for definition dependencies
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

- [ ] 8. Update behavior execution system for ID-based lookups

  - Modify execute_character_behaviors to resolve IDs to definitions at runtime
  - Update ConditionContext and ActionContext to work with definition references
  - Implement instance creation and management during behavior execution
  - _Requirements: 2.2, 2.4, 3.1, 3.2_

- [ ] 9. Update spawn system to use definition-based references

  - Modify spawn creation to resolve SpawnLookupId to SpawnDefinition
  - Update Action scripts to reference spawn definitions by ID rather than embedded data
  - Ensure spawn instances maintain reference to their definition ID
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [ ] 10. Implement error handling for invalid ID references

  - Add new GameError variants for invalid definition IDs
  - Implement graceful handling of missing definition lookups during runtime
  - Add validation methods to detect and report circular references
  - _Requirements: 2.4, 3.4, 4.6_

- [ ] 11. Update serialization to include definition collections

  - Modify GameState serialization to include all definition collections
  - Update binary serialization format to handle definition and instance separation
  - Ensure JSON serialization includes both definitions and active instances
  - _Requirements: 1.3, 5.4_

- [ ] 12. Convert existing test utilities to definition-based format

  - Update test_utils.rs to create definition collections instead of embedded objects
  - Implement helper functions for creating test ActionDefinitions and ConditionDefinitions
  - Modify character creation utilities to use (ConditionId, ActionId) behavior pairs
  - _Requirements: 6.2, 6.3_

- [ ] 13. Update behavior integration tests

  - Convert behavior_integration_test.rs to use definition-based architecture
  - Update test data to use definition collections and ID references
  - Verify that behavior execution produces equivalent results with new architecture
  - _Requirements: 6.1, 6.4_

- [ ] 14. Update cooldown system tests

  - Convert all cooldown test files to use definition-based actions
  - Update cooldown tracking to work with ActionInstance references
  - Verify cooldown behavior remains functionally equivalent
  - _Requirements: 6.1, 6.4_

- [ ] 15. Update core API tests

  - Convert api.rs tests to use definition collections in new_game calls
  - Update test assertions to work with ID-based character behaviors
  - Verify game state serialization includes definition collections
  - _Requirements: 6.1, 6.4_

- [ ] 16. Update entity and state tests

  - Convert entity.rs tests to use definition-based structures
  - Update state.rs tests to work with definition collections
  - Verify character behavior storage uses ID pairs correctly
  - _Requirements: 6.1, 6.4_

- [ ] 17. Update all remaining test files

  - Convert integration_tests.rs, error_test.rs, and other test files
  - Update spawn-related tests to use definition-based spawn references
  - Ensure all tests pass with the new architecture
  - _Requirements: 6.1, 6.4_

- [ ] 18. Code cleanup - Remove all legacy implementation

  - Remove all legacy property access code and outdated implementations
  - Clean up unreachable patterns and duplicate property handling logic
  - Remove all compiler warnings related to unused code and unreachable patterns
  - Remove outdated tests that are no longer relevant to the new architecture
  - Ensure codebase contains only the new definition-based implementation with no traces of old embedded approach
  - _Requirements: 1.1, 2.1, 3.1, 4.1, 5.1, 6.1_

- [ ] 19. Update README documentation
  - Update game-engine/README.md to reflect the new definition-based architecture
  - Document the new API signature for new_game function
  - Explain the benefits of the definition-based approach for memory efficiency
  - Provide examples of how to create and use definition collections
  - _Requirements: 4.1, 4.2, 4.3, 4.4_
