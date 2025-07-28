# Implementation Plan

- [x] 1. Create helper function for safe status effect script execution

  - Implement execute_status_effect_script function that takes game_state, character_id, instance_id, definition_id, and script_type
  - Function should properly sequence borrows to avoid borrow checker conflicts
  - Use existing ScriptEngine and StatusEffectContext without creating new systems
  - Handle cases where character, instance, or definition doesn't exist gracefully
  - Return script execution result or appropriate error
  - _Requirements: 1.1, 2.1, 3.1_

- [x] 2. Fix status effect on_script execution in apply_to_character

  - Remove "temporarily disabled" comments from apply_to_character method
  - Replace disabled code with call to execute_status_effect_script for on_script
  - Ensure on_script executes when status effect is successfully applied to character
  - Handle script execution errors gracefully without breaking status effect application
  - Maintain identical functionality to original working implementation
  - _Requirements: 1.1, 1.2, 3.1_

- [x] 3. Fix status effect tick_script execution in process_character_status_effects

  - Remove "temporarily disabled" comments from process_character_status_effects method
  - Replace disabled code with call to execute_status_effect_script for tick_script
  - Ensure tick_script executes for each active status effect every frame
  - Handle script execution errors gracefully without breaking status effect processing
  - Maintain proper timing and state for tick script execution
  - _Requirements: 1.1, 1.3, 3.1_

- [x] 4. Fix status effect off_script execution in remove_status_effect_by_instance_id

  - Remove "temporarily disabled" comments from remove_status_effect_by_instance_id method
  - Replace disabled code with call to execute_status_effect_script for off_script
  - Ensure off_script executes before status effect is removed from character
  - Handle script execution errors gracefully without breaking status effect removal
  - Maintain access to status effect data during off_script execution
  - _Requirements: 1.1, 1.4, 3.1_

- [ ] 5. Test status effect script execution functionality

  - Test that on_script executes when status effect is applied to character
  - Test that tick_script executes every frame for active status effects
  - Test that off_script executes when status effect is removed from character
  - Test error handling when character, instance, or definition is missing
  - Test that script execution errors don't crash the game
  - _Requirements: 1.1, 2.1, 3.1, 4.1_

- [ ] 6. Clean up disabled code comments and documentation
  - Remove all "temporarily disabled" comments from status.rs
  - Remove any placeholder comments about future implementation
  - Update any documentation that references disabled script execution
  - Ensure code is clean and production-ready
  - _Requirements: 4.1_
