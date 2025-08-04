# Requirements Document

## Introduction

This feature updates the wasm-wrapper to align with the comprehensive property changes implemented in the property-updates spec. The wasm-wrapper currently uses outdated entity structures and JSON representations that no longer match the updated game engine. This update ensures the WASM interface correctly handles all new properties, updated data types, renamed fields, and new entity property access operators while maintaining deterministic serialization.

## Requirements

### Requirement 1

**User Story:** As a JavaScript developer, I want updated Character JSON definitions with new properties and correct data types, so that character configuration and state serialization work with the enhanced game engine.

#### Acceptance Criteria

1. WHEN defining CharacterDefinitionJson THEN the system SHALL include health_cap property as u16 type
2. WHEN defining CharacterDefinitionJson THEN the system SHALL include power property as u8 type
3. WHEN defining CharacterDefinitionJson THEN the system SHALL include weight property as u8 type
4. WHEN defining CharacterDefinitionJson THEN the system SHALL include jump_force property as i16 type (Fixed raw value)
5. WHEN defining CharacterDefinitionJson THEN the system SHALL include move_speed property as i16 type (Fixed raw value)
6. WHEN defining CharacterStateJson THEN the system SHALL update health property to u16 type
7. WHEN defining CharacterStateJson THEN the system SHALL include health_cap property as u16 type
8. WHEN defining CharacterStateJson THEN the system SHALL include power property as u8 type
9. WHEN defining CharacterStateJson THEN the system SHALL include weight property as u8 type
10. WHEN defining CharacterStateJson THEN the system SHALL include jump_force property as i16 type
11. WHEN defining CharacterStateJson THEN the system SHALL include move_speed property as i16 type
12. WHEN defining CharacterStateJson THEN the system SHALL replace facing and gravity_dir with dir property as [u8; 2] array
13. WHEN defining CharacterStateJson THEN the system SHALL include enmity property as u8 type
14. WHEN defining CharacterStateJson THEN the system SHALL include target_id property as Option<u8>
15. WHEN defining CharacterStateJson THEN the system SHALL include target_type property as u8 type

### Requirement 2

**User Story:** As a JavaScript developer, I want updated ActionDefinition JSON with removed properties and correct structure, so that action configuration matches the simplified game engine design.

#### Acceptance Criteria

1. WHEN defining ActionDefinitionJson THEN the system SHALL remove interval property
2. WHEN defining ActionDefinitionJson THEN the system SHALL remove duration property
3. WHEN converting ActionDefinitionJson to ActionDefinition THEN the system SHALL only include energy_cost, cooldown, args, spawns, and script properties

### Requirement 3

**User Story:** As a JavaScript developer, I want updated SpawnDefinition JSON with enhanced combat properties, so that spawn configuration supports the new damage and critical hit system.

#### Acceptance Criteria

1. WHEN defining SpawnDefinitionJson THEN the system SHALL update damage_base property to u16 type
2. WHEN defining SpawnDefinitionJson THEN the system SHALL include damage_range property as u16 type
3. WHEN defining SpawnDefinitionJson THEN the system SHALL include crit_chance property as u8 type
4. WHEN defining SpawnDefinitionJson THEN the system SHALL include crit_multiplier property as u8 type
5. WHEN defining SpawnDefinitionJson THEN the system SHALL include chance property as u8 type

### Requirement 4

**User Story:** As a JavaScript developer, I want updated SpawnInstance JSON with comprehensive properties and correct field names, so that spawn state serialization includes all new targeting and lifecycle data.

#### Acceptance Criteria

1. WHEN defining SpawnStateJson THEN the system SHALL include health property as u16 type
2. WHEN defining SpawnStateJson THEN the system SHALL include health_cap property as u16 type
3. WHEN defining SpawnStateJson THEN the system SHALL include owner_type property as u8 type
4. WHEN defining SpawnStateJson THEN the system SHALL update owner_id to support EntityId type
5. WHEN defining SpawnStateJson THEN the system SHALL include rotation property as i16 type (Fixed raw value)
6. WHEN defining SpawnStateJson THEN the system SHALL rename lifespan property to life_span
7. WHEN defining SpawnStateJson THEN the system SHALL rename vars property to runtime_vars
8. WHEN defining SpawnStateJson THEN the system SHALL rename fixed property to runtime_fixed
9. WHEN defining SpawnStateJson THEN the system SHALL replace facing and gravity_dir with dir property as [u8; 2] array
10. WHEN defining SpawnStateJson THEN the system SHALL include enmity property as u8 type
11. WHEN defining SpawnStateJson THEN the system SHALL include target_id property as Option<u8>
12. WHEN defining SpawnStateJson THEN the system SHALL include target_type property as u8 type

### Requirement 5

**User Story:** As a JavaScript developer, I want updated StatusEffectDefinition and StatusEffectInstance JSON with chance property and consistent naming, so that status effect configuration and state match the updated game engine.

#### Acceptance Criteria

1. WHEN defining StatusEffectDefinitionJson THEN the system SHALL include chance property as u8 type
2. WHEN defining StatusEffectStateJson THEN the system SHALL rename remaining_duration property to life_span
3. WHEN defining StatusEffectStateJson THEN the system SHALL rename vars property to runtime_vars
4. WHEN defining StatusEffectStateJson THEN the system SHALL rename fixed property to runtime_fixed

### Requirement 6

**User Story:** As a JavaScript developer, I want updated Character conversion logic with proper initialization of new properties, so that JSON character definitions are correctly converted to game engine Character structs.

#### Acceptance Criteria

1. WHEN converting CharacterDefinitionJson to Character THEN the system SHALL initialize health_cap with provided value
2. WHEN converting CharacterDefinitionJson to Character THEN the system SHALL initialize power with provided value
3. WHEN converting CharacterDefinitionJson to Character THEN the system SHALL initialize weight with provided value
4. WHEN converting CharacterDefinitionJson to Character THEN the system SHALL initialize jump_force using Fixed::from_raw()
5. WHEN converting CharacterDefinitionJson to Character THEN the system SHALL initialize move_speed using Fixed::from_raw()
6. WHEN converting CharacterDefinitionJson to Character THEN the system SHALL set EntityCore.dir from provided direction values
7. WHEN converting CharacterDefinitionJson to Character THEN the system SHALL initialize enmity with provided value
8. WHEN converting CharacterDefinitionJson to Character THEN the system SHALL initialize target_id and target_type with provided values

### Requirement 7

**User Story:** As a JavaScript developer, I want updated SpawnDefinition conversion logic with new combat properties, so that JSON spawn definitions are correctly converted to game engine SpawnDefinition structs.

#### Acceptance Criteria

1. WHEN converting SpawnDefinitionJson to SpawnDefinition THEN the system SHALL set damage_base as u16 type
2. WHEN converting SpawnDefinitionJson to SpawnDefinition THEN the system SHALL set damage_range with provided value
3. WHEN converting SpawnDefinitionJson to SpawnDefinition THEN the system SHALL set crit_chance with provided value
4. WHEN converting SpawnDefinitionJson to SpawnDefinition THEN the system SHALL set crit_multiplier with provided value
5. WHEN converting SpawnDefinitionJson to SpawnDefinition THEN the system SHALL set chance with provided value

### Requirement 8

**User Story:** As a JavaScript developer, I want updated StatusEffectDefinition conversion logic with chance property, so that JSON status effect definitions are correctly converted to game engine StatusEffectDefinition structs.

#### Acceptance Criteria

1. WHEN converting StatusEffectDefinitionJson to StatusEffectDefinition THEN the system SHALL set chance with provided value

### Requirement 9

**User Story:** As a JavaScript developer, I want updated state serialization methods that handle new properties and renamed fields, so that game state JSON output includes all current entity data with correct field names.

#### Acceptance Criteria

1. WHEN serializing Character to CharacterStateJson THEN the system SHALL include all new properties (health_cap, power, weight, jump_force, move_speed)
2. WHEN serializing Character to CharacterStateJson THEN the system SHALL serialize EntityCore.dir as dir array
3. WHEN serializing Character to CharacterStateJson THEN the system SHALL include enmity, target_id, and target_type properties
4. WHEN serializing SpawnInstance to SpawnStateJson THEN the system SHALL include all new properties (health, health_cap, owner_type, rotation)
5. WHEN serializing SpawnInstance to SpawnStateJson THEN the system SHALL use correct field names (life_span, runtime_vars, runtime_fixed)
6. WHEN serializing SpawnInstance to SpawnStateJson THEN the system SHALL serialize EntityCore.dir as dir array
7. WHEN serializing SpawnInstance to SpawnStateJson THEN the system SHALL include enmity, target_id, and target_type properties
8. WHEN serializing StatusEffectInstance to StatusEffectStateJson THEN the system SHALL use life_span instead of remaining_duration
9. WHEN serializing StatusEffectInstance to StatusEffectStateJson THEN the system SHALL use runtime_vars and runtime_fixed field names

### Requirement 10

**User Story:** As a JavaScript developer, I want updated validation logic that checks new properties and references, so that configuration validation catches errors with the enhanced entity structures.

#### Acceptance Criteria

1. WHEN validating GameConfig THEN the system SHALL validate new Character properties are within valid ranges
2. WHEN validating GameConfig THEN the system SHALL validate SpawnDefinition combat properties are within valid ranges
3. WHEN validating GameConfig THEN the system SHALL validate StatusEffectDefinition chance property is within 0-100 range
4. WHEN validating GameConfig THEN the system SHALL validate entity targeting references are valid
5. WHEN validating GameConfig THEN the system SHALL provide clear error messages for new property validation failures

### Requirement 11

**User Story:** As a JavaScript developer, I want deterministic serialization of all Fixed-point values, so that game state remains consistent across different JavaScript environments and WASM boundaries.

#### Acceptance Criteria

1. WHEN serializing Fixed-point values THEN the system SHALL use .raw() method to get integer representation
2. WHEN deserializing Fixed-point values THEN the system SHALL use Fixed::from_raw() to reconstruct Fixed-point values
3. WHEN handling Fixed-point values in JSON THEN the system SHALL never use floating-point conversion
4. WHEN serializing position, velocity, and other Fixed-point properties THEN the system SHALL maintain deterministic integer representation
5. WHEN converting between JSON and game engine types THEN the system SHALL preserve exact Fixed-point precision
