# Requirements Document

## Introduction

This feature addresses missing properties from the old game engine and ensures proper property access for various game entities. The update involves modifying data structures across Character, ActionDefinition, ActionInstance, ConditionInstance, EntityCore, SpawnDefinition, SpawnInstance, and StatusEffectDefinition/Instance types, along with implementing new property access operators for owner and target entities.

## Requirements

### Requirement 1

**User Story:** As a game developer, I want updated Character properties with proper sizing and organization, so that character data is efficiently stored and accessed.

#### Acceptance Criteria

1. WHEN defining Character struct THEN the system SHALL update health property to u16 type
2. WHEN defining Character struct THEN the system SHALL update health_cap property to u16 type
3. WHEN defining Character struct THEN the system SHALL place energy_cap property as u8 type immediately after energy property
4. WHEN defining Character struct THEN the system SHALL include power property as u8 type
5. WHEN defining Character struct THEN the system SHALL include weight property as u8 type
6. WHEN defining Character struct THEN the system SHALL include jump_force property as Fixed type
7. WHEN defining Character struct THEN the system SHALL include move_speed property as Fixed type

### Requirement 2

**User Story:** As a game developer, I want simplified ActionDefinition and updated ActionInstance properties, so that action system is streamlined and properly manages cooldowns.

#### Acceptance Criteria

1. WHEN defining ActionDefinition struct THEN the system SHALL omit interval property
2. WHEN defining ActionDefinition struct THEN the system SHALL omit duration property
3. WHEN defining ActionInstance struct THEN the system SHALL rename remaining_duration property to cooldown
4. WHEN defining ActionInstance struct THEN the system SHALL include runtime_vars property as [u8; 4] array
5. WHEN updating ActionInstance struct THEN the system SHALL deallocate the property address previously used by removed properties

### Requirement 3

**User Story:** As a game developer, I want updated ConditionInstance with runtime variables, so that condition logic can store temporary state data.

#### Acceptance Criteria

1. WHEN defining ConditionInstance struct THEN the system SHALL include runtime_vars property as [u8; 4] array
2. WHEN updating ConditionInstance struct THEN the system SHALL deallocate the property address previously used by removed properties

### Requirement 4

**User Story:** As a game developer, I want consolidated EntityCore direction properties and enmity system, so that entity orientation and targeting behavior is properly managed.

#### Acceptance Criteria

1. WHEN defining EntityCore struct THEN the system SHALL combine facing and gravity_dir into single dir property as (u8, u8) tuple representing left/right and up/down directions
2. WHEN defining EntityCore struct THEN the system SHALL include enmity property as u8 type for determining target order

### Requirement 5

**User Story:** As a game developer, I want enhanced SpawnDefinition with damage and critical hit properties, so that spawn entities have comprehensive combat statistics.

#### Acceptance Criteria

1. WHEN defining SpawnDefinition struct THEN the system SHALL update damage_base property to u16 type
2. WHEN defining SpawnDefinition struct THEN the system SHALL include damage_range property as u16 type for RND value on top of base damage
3. WHEN defining SpawnDefinition struct THEN the system SHALL include crit_chance property as u8 type with range 0-100
4. WHEN defining SpawnDefinition struct THEN the system SHALL include crit_multiplier property as u8 type with range 1-100

### Requirement 6

**User Story:** As a game developer, I want comprehensive SpawnInstance properties with targeting and lifecycle management, so that spawn entities can properly track targets and manage their existence.

#### Acceptance Criteria

1. WHEN defining SpawnInstance struct THEN the system SHALL include health property as u16 type
2. WHEN defining SpawnInstance struct THEN the system SHALL include health_cap property as u16 type placed immediately after owner_id
3. WHEN defining EntityCore struct THEN the system SHALL include target_id property as Option<EntityId> for range checking (moved from SpawnInstance to EntityCore)
4. WHEN defining EntityCore struct THEN the system SHALL include target_type property as u8 type where 1 represents Character and 2 represents Spawn (moved from SpawnInstance to EntityCore)
5. WHEN defining SpawnInstance struct THEN the system SHALL include rotation property as Fixed type
6. WHEN defining SpawnInstance struct THEN the system SHALL include owner_type property as u8 type where 1 represents Character and 2 represents Spawn for entity type checking
7. WHEN defining SpawnInstance struct THEN the system SHALL update owner_id to use EntityId type to support both Character and Spawn owners
8. WHEN defining SpawnInstance struct THEN the system SHALL include life_span property as u16 type representing game frame plus spawn duration
9. WHEN defining SpawnInstance struct THEN the system SHALL rename vars property to runtime_vars as [u8; 4] array
10. WHEN defining SpawnInstance struct THEN the system SHALL rename fixed property to runtime_fixed

### Requirement 7

**User Story:** As a game developer, I want StatusEffectDefinition with chance property and updated StatusEffectInstance, so that status effects have proper application probability and runtime state management.

#### Acceptance Criteria

1. WHEN defining StatusEffectDefinition struct THEN the system SHALL include chance property as u8 type representing chance of being applied with 1:1 ratio against element armor
2. WHEN defining StatusEffectInstance struct THEN the system SHALL rename remaining_duration property to life_span for naming consistency
3. WHEN defining StatusEffectInstance struct THEN the system SHALL rename vars property to runtime_vars as [u8; 4] array
4. WHEN defining StatusEffectInstance struct THEN the system SHALL rename fixed property to runtime_fixed

### Requirement 8

**User Story:** As a game developer, I want new property access operators for character and spawn entities, so that scripts can read and write properties of any entity by ID during gameplay.

#### Acceptance Criteria

1. WHEN implementing property operators THEN the system SHALL provide READ CHARACTER PROPERTY operator
2. WHEN implementing property operators THEN the system SHALL provide WRITE CHARACTER PROPERTY operator
3. WHEN implementing property operators THEN the system SHALL provide READ SPAWN PROPERTY operator
4. WHEN implementing property operators THEN the system SHALL provide WRITE SPAWN PROPERTY operator
5. WHEN implementing property access operators THEN the system SHALL use the same property accessor addresses as spawn/character property access
6. WHEN implementing property access operators THEN the system SHALL directly access entities by ID and silently ignore operations when entity ID is invalid
7. WHEN implementing property access system THEN the system SHALL ensure property addresses do not overflow beyond 256 (u8) size limit
