# Requirements Document

## Introduction

The current game engine embeds scripts directly into Characters and Spawns, leading to redundant data storage and bloated game state. This feature will refactor the system to use definition-based references, where Actions, Conditions, Spawns, and StatusEffects are defined once and referenced by ID, significantly reducing memory usage and improving maintainability.

## Requirements

### Requirement 1

**User Story:** As a game developer, I want to define Actions, Conditions, Spawns, and StatusEffects once and reference them by ID, so that I can reduce memory usage and eliminate redundant data in the game state.

#### Acceptance Criteria

1. WHEN the game engine initializes THEN the system SHALL accept definitions for Actions, Conditions, Spawns, and StatusEffects as separate collections
2. WHEN multiple characters use the same Action THEN the system SHALL store only one definition and reference it by ID
3. WHEN the game state is serialized THEN the system SHALL include definition collections at the top level
4. IF a definition is referenced by ID THEN the system SHALL be able to retrieve the complete definition from the collections

### Requirement 2

**User Story:** As a game developer, I want Characters to store behavior as pairs of Condition+Action IDs, so that I can reference shared definitions instead of duplicating script data.

#### Acceptance Criteria

1. WHEN a Character is created THEN the system SHALL store behaviors as a Vec of (Condition ID, Action ID) pairs
2. WHEN a Character executes a behavior THEN the system SHALL resolve the IDs to their corresponding definitions
3. WHEN multiple Characters share the same behavior THEN the system SHALL reference the same definition IDs
4. IF a behavior ID is invalid THEN the system SHALL handle the error gracefully

### Requirement 3

**User Story:** As a game developer, I want Spawn actions to reference shared projectile definitions by ID, so that identical projectiles don't create duplicate definitions.

#### Acceptance Criteria

1. WHEN a Shoot action creates a projectile THEN the system SHALL reference a Spawn definition by ID
2. WHEN multiple Actions spawn the same projectile type THEN the system SHALL reference the same Spawn definition ID
3. WHEN a Spawn is instantiated THEN the system SHALL create an instance from the definition while maintaining the reference
4. IF a Spawn definition ID is not found THEN the system SHALL return an appropriate error

### Requirement 4

**User Story:** As a game developer, I want the public API to accept definition collections, so that I can initialize the game engine with all necessary definitions upfront.

#### Acceptance Criteria

1. WHEN initializing the game engine THEN the API SHALL accept collections of Action definitions
2. WHEN initializing the game engine THEN the API SHALL accept collections of Condition definitions
3. WHEN initializing the game engine THEN the API SHALL accept collections of Spawn definitions
4. WHEN initializing the game engine THEN the API SHALL accept collections of StatusEffect definitions
5. WHEN definitions are provided THEN the system SHALL validate that all referenced IDs exist
6. IF circular references exist in definitions THEN the system SHALL detect and report the error

### Requirement 5

**User Story:** As a game developer, I want definition instances to be managed at the game state level, so that I can track active instances separately from their definitions.

#### Acceptance Criteria

1. WHEN the game state is created THEN the system SHALL maintain definition collections at the top level
2. WHEN definitions are instantiated THEN the system SHALL create instances that reference their definition IDs
3. WHEN instances are modified during gameplay THEN the system SHALL preserve the original definitions
4. WHEN the game state is saved THEN the system SHALL include both definitions and active instances

### Requirement 6

**User Story:** As a game developer, I want the status effects system to work with the new ID-based architecture, so that status effects can be managed efficiently without duplicating definition data.

#### Acceptance Criteria

1. WHEN status effects are applied to characters THEN the system SHALL store StatusEffectInstanceId references instead of full objects
2. WHEN status effects are processed THEN the system SHALL resolve IDs to definitions and instances at runtime
3. WHEN status effects stack or expire THEN the system SHALL manage instance state while preserving definition data
4. IF status effect IDs are invalid THEN the system SHALL handle errors gracefully without crashing
