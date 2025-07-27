# Implementation Plan

- [ ] 1. Create core script execution data structures

  - Implement ScriptExecutionRequest struct with script_type, script_data, args, spawns, and context_data fields
  - Implement ScriptType enum with StatusEffectOn, StatusEffectTick, StatusEffectOff variants
  - Implement ScriptContextData struct with character_id, instance_id, definition_id fields
  - Add proper Debug, Clone derives and validation methods
  - _Requirements: 1.1, 2.1, 3.1_

- [ ] 2. Implement ScriptExecutionCoordinator

  - Create ScriptExecutionCoordinator struct with pending_requests Vec and reusable script_engine
  - Implement queue_script_execution method to add requests to pending queue
  - Implement process_pending_scripts method to execute all queued requests with exclusive GameState access
  - Implement execute_script_immediately method for synchronous execution when safe
  - Add proper error handling and request validation
  - _Requirements: 2.1, 3.1, 5.1_

- [ ] 3. Add GameState integration for script coordination

  - Add script_coordinator field to GameState struct
  - Implement get_script_coordinator method to access coordinator
  - Implement process_all_pending_scripts method to process queued scripts
  - Integrate coordinator initialization in GameState::new
  - Add proper lifetime management for coordinator
  - _Requirements: 3.1, 4.1_

- [ ] 4. Create safe context creation utilities

  - Implement create_status_effect_context function that safely creates StatusEffectContext
  - Function should take GameState, character_id, instance_id, definition_id and return proper context
  - Handle cases where character or instance doesn't exist gracefully
  - Ensure no simultaneous mutable borrows through proper sequencing
  - Add comprehensive error handling for invalid context data
  - _Requirements: 1.1, 3.1, 3.2_

- [ ] 5. Refactor status effect on_script execution

  - Modify apply_to_character to queue script execution instead of executing inline
  - Create ScriptExecutionRequest for on_script when status effect is applied
  - Update apply_status_effect to process queued scripts after character modification
  - Ensure script execution happens with proper context and timing
  - Maintain identical functionality to original working implementation
  - _Requirements: 1.1, 1.2, 2.1_

- [ ] 6. Refactor status effect tick_script execution

  - Modify process_character_status_effects to queue tick_script executions
  - Create ScriptExecutionRequest for each active status effect's tick_script
  - Process all queued tick scripts after status effect processing is complete
  - Ensure scripts execute with current frame's status effect state
  - Handle multiple status effects per character correctly
  - _Requirements: 1.1, 1.3, 2.1_

- [ ] 7. Refactor status effect off_script execution

  - Modify remove_status_effect_by_instance_id to queue off_script execution
  - Create ScriptExecutionRequest for off_script before removing status effect
  - Ensure off_script executes with status effect data before removal
  - Process queued scripts after status effect removal operations
  - Handle batch removals correctly
  - _Requirements: 1.1, 1.4, 2.1_

- [ ] 8. Implement script execution processing in coordinator

  - Implement script execution logic in process_pending_scripts method
  - Create proper StatusEffectContext using safe context creation utilities
  - Execute scripts using existing ScriptEngine and context patterns
  - Handle script execution errors gracefully without crashing game
  - Clear processed requests and reuse ScriptEngine instance for performance
  - _Requirements: 2.1, 3.1, 5.1_

- [ ] 9. Add comprehensive error handling and validation

  - Implement validation for ScriptExecutionRequest data integrity
  - Add error handling for missing characters, instances, or definitions
  - Ensure script execution failures don't crash the game loop
  - Add logging for script execution errors and invalid contexts
  - Implement graceful degradation when script execution fails
  - _Requirements: 1.1, 3.1, 4.1_

- [ ] 10. Write comprehensive tests for script execution system

  - Write unit tests for ScriptExecutionRequest creation and validation
  - Write unit tests for ScriptExecutionCoordinator queuing and processing
  - Write integration tests for status effect script execution (on/tick/off)
  - Write tests for error handling and edge cases
  - Write performance tests to ensure no regression from original system
  - _Requirements: 1.1, 2.1, 3.1, 5.1_

- [ ] 11. Optimize performance and memory usage

  - Implement ScriptEngine reuse in coordinator to avoid repeated allocations
  - Optimize ScriptExecutionRequest to minimize memory usage
  - Implement batch processing optimizations for multiple queued scripts
  - Add performance monitoring and ensure no regression from original system
  - Profile memory usage and optimize context creation patterns
  - _Requirements: 5.1, 5.2, 5.3_

- [ ] 12. Clean up and document the new system
  - Remove old disabled script execution code and comments
  - Add comprehensive documentation for ScriptExecutionCoordinator usage
  - Document patterns for extending system to other script types (actions, conditions)
  - Add code examples for proper script execution request creation
  - Update existing documentation to reflect new script execution patterns
  - _Requirements: 2.1, 4.1, 4.2_
