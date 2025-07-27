# Requirements Document

## Introduction

The current status effect script execution system is disabled due to borrow checker conflicts. However, the game already has the correct ID-based architecture in place - characters store `Vec<StatusEffectInstanceId>` and instances are stored in `GameState.status_effect_instances`. The solution is to fix the existing script execution code to properly use this ID-based system, not create a new deferred execution system.

## Requirements

### Requirement 1

**User Story:** As a game developer, I want status effect scripts (on_script, tick_script, off_script) to execute properly using the existing ScriptEngine system, so that status effects can have dynamic behavior and game logic.

#### Acceptance Criteria

1. WHEN a status effect is applied to a character THEN the on_script SHALL execute successfully using the existing ScriptEngine
2. WHEN a status effect is being processed each frame THEN the tick_script SHALL execute successfully using the existing ScriptEngine
3. WHEN a status effect is removed from a character THEN the off_script SHALL execute successfully using the existing ScriptEngine
4. WHEN script execution occurs THEN it SHALL use the existing ScriptEngine and ScriptContext system
5. WHEN script execution occurs THEN it SHALL maintain Rust's memory safety guarantees

### Requirement 2

**User Story:** As a game developer, I want status effect script execution to use the existing ID-based architecture, so that there are no borrow checker conflicts.

#### Acceptance Criteria

1. WHEN executing status effect scripts THEN the system SHALL use character_id to get character reference
2. WHEN executing status effect scripts THEN the system SHALL use instance_id to get status effect instance reference
3. WHEN executing status effect scripts THEN the system SHALL use definition_id to get status effect definition reference
4. WHEN executing status effect scripts THEN it SHALL NOT try to borrow multiple mutable references simultaneously

### Requirement 3

**User Story:** As a game developer, I want the script execution to work with the existing StatusEffectContext, so that no new context system is needed.

#### Acceptance Criteria

1. WHEN executing status effect scripts THEN it SHALL use the existing StatusEffectContext struct
2. WHEN creating StatusEffectContext THEN it SHALL properly sequence borrows to avoid conflicts
3. WHEN script execution occurs THEN it SHALL use the existing ScriptContext trait implementation
4. WHEN script execution occurs THEN it SHALL maintain compatibility with existing script bytecode

### Requirement 4

**User Story:** As a game developer, I want the fixed script execution to be simple and maintainable, so that it doesn't add unnecessary complexity.

#### Acceptance Criteria

1. WHEN implementing script execution THEN it SHALL NOT create new data structures for deferred execution
2. WHEN implementing script execution THEN it SHALL NOT create new coordinator or queue systems
3. WHEN implementing script execution THEN it SHALL fix the existing disabled code in status.rs
4. WHEN implementing script execution THEN it SHALL follow the existing patterns in the codebase
