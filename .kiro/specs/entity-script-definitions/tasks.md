# Implementation Plan

## Development Policy

**Note: No tests will be created until the core engine is running well. Focus on core functionality first.**

**Note: No backward compatibility considerations - we are in active development and not in production yet.**

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

- [x] 3. Remove all test units and test files

  - Delete all test files from game-engine/src/ directory (all files ending with \_test.rs)
  - Remove all #[cfg(test)] modules from source files
  - Remove test utilities and test-related code
  - Clean up any test-specific imports and dependencies
  - Focus development on core functionality without test overhead
  - _Requirements: Development efficiency_

- [x] 4. Remove backward compatibility and legacy code

  - Remove all legacy code and related implementations
  - Remove any deprecated or unused code paths
  - Remove backward compatibility shims and legacy property handling
  - Clean up any code marked as "legacy" or "deprecated"
  - Simplify codebase by removing unused abstractions
  - _Requirements: Code simplification_

- [x] 5. Move vars and fixed arrays from definitions to instances

  - Remove vars and fixed arrays from ActionDefinition, ConditionDefinition, StatusEffectDefinition, and SpawnDefinition
  - Ensure ActionInstance, ConditionInstance, StatusEffectInstance, and SpawnInstance have their own vars and fixed arrays for runtime state
  - Update create_instance methods to initialize instance variables independently from definitions for all component types
  - Update all tests to reflect that variables are instance-specific, not definition-specific across all components
  - _Requirements: 5.2, 5.3_

- [x] 6. Update property accessors to handle definition vs instance properties

  - Modify PropertyAddress enum to distinguish between definition and instance properties for all component types (Action, Condition, StatusEffect, Spawn)
  - Update property accessor methods to resolve definition properties via definition ID lookup for all components
  - Ensure instance properties (vars, fixed) are read directly from the instance for ActionInstance, ConditionInstance, StatusEffectInstance, and SpawnInstance
  - Update script execution to use the correct property resolution based on property type across all component types
  - _Requirements: 2.2, 3.1, 3.2, 5.2_

- [x] 7. Modify Character struct to use ID-based behaviors

  - Change behaviors field from embedded objects to Vec<(ConditionId, ActionId)>
  - Update locked_action to reference ActionInstanceId instead of embedded action
  - Update status_effects to reference StatusEffectInstanceId instead of embedded status effects
  - Remove embedded Action, Condition, StatusEffect, and Spawn objects from Character
  - Ensure all character state references use instance IDs for all component types
  - _Requirements: 2.1, 2.2, 2.3_

- [x] 8. Update GameState to include definition collections

  - Add action_definitions, condition_definitions, and status_effect_definitions fields
  - Add action_instances and condition_instances collections for runtime state
  - Implement definition lookup methods (get_action_definition, get_condition_definition, etc.)
  - _Requirements: 1.1, 1.2, 5.1, 5.4_

- [x] 9. Modify public API to accept definition collections

  - Update new_game function signature to accept definition collections as parameters
  - Add validation logic to ensure all referenced IDs exist in the provided definitions
  - Implement circular reference detection for definition dependencies
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

- [x] 10. Fix status effects system for ID-based architecture

  - Update status effects to work with StatusEffectInstanceId instead of full StatusEffectInstance objects
  - Fix apply_status_effect method to work with the new ID-based character.status_effects Vec<StatusEffectInstanceId>
  - Update process_character_status_effects to resolve status effect IDs to instances and definitions
  - Fix remove_status_effect method to work with ID-based status effects
  - Update all status effect script execution methods to work with instance references
  - Fix status effect stacking and duration management with the new architecture
  - Update passive energy regeneration system to work with the new status effect structure
  - _Requirements: 2.3, 5.2, 5.3_

- [x] 11. Update behavior execution system for ID-based lookups

  - Modify execute_character_behaviors to resolve IDs to definitions at runtime
  - Update ConditionContext and ActionContext to work with definition references
  - Implement instance creation and management during behavior execution
  - _Requirements: 2.2, 2.4, 3.1, 3.2_

- [x] 12. Update spawn system to use definition-based references

  - Modify spawn creation to resolve SpawnLookupId to SpawnDefinition
  - Update Action scripts to reference spawn definitions by ID rather than embedded data
  - Ensure spawn instances maintain reference to their definition ID
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 13. Implement error handling for invalid ID references

  - Add new GameError variants for invalid definition IDs
  - Implement graceful handling of missing definition lookups during runtime
  - Add validation methods to detect and report circular references
  - _Requirements: 2.4, 3.4, 4.6_

- [x] 14. Expose game state and RNG seed through public API

  - Add public API method to get the current GameState for external serialization
  - Expose the current RNG seed through the public API so external wrappers can serialize it
  - Remove internal serialization logic - serialization will be handled by external wrappers
  - Ensure the public API provides complete access to game state for external persistence
  - _Requirements: 1.3, 5.4_

- [ ] 15. Update README documentation
  - Update game-engine/README.md to reflect the new definition-based architecture
  - Document the new API signature for new_game function
  - Explain the benefits of the definition-based approach for memory efficiency
  - Provide examples of how to create and use definition collections
  - _Requirements: 4.1, 4.2, 4.3, 4.4_
