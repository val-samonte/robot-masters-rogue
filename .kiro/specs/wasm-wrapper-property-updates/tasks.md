# Implementation Plan

- [x] 1. Update CharacterDefinitionJson structure with new properties

  - Add health_cap property as u16 type to CharacterDefinitionJson struct
  - Add energy_cap property as u8 type to CharacterDefinitionJson struct
  - Add power property as u8 type to CharacterDefinitionJson struct
  - Add weight property as u8 type to CharacterDefinitionJson struct
  - Add jump_force property as [i16; 2] type (Fixed numerator/denominator) to CharacterDefinitionJson struct
  - Add move_speed property as [i16; 2] type (Fixed numerator/denominator) to CharacterDefinitionJson struct
  - Replace facing and gravity_dir with dir property as [u8; 2] array in CharacterDefinitionJson struct
  - Add enmity property as u8 type to CharacterDefinitionJson struct
  - Add target_id property as Option<u8> to CharacterDefinitionJson struct
  - Add target_type property as u8 type to CharacterDefinitionJson struct
  - Update health property from u8 to u16 type in CharacterDefinitionJson struct
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

- [x] 2. Update ActionDefinitionJson structure by removing obsolete properties

  - Remove interval property from ActionDefinitionJson struct
  - Remove duration property from ActionDefinitionJson struct
  - Ensure ActionDefinitionJson only contains energy_cost, cooldown, args, spawns, and script properties
  - _Requirements: 2.1, 2.2, 2.3_

- [x] 3. Update SpawnDefinitionJson structure with enhanced combat properties

  - Update damage_base property from u8 to u16 type in SpawnDefinitionJson struct
  - Add damage_range property as u16 type to SpawnDefinitionJson struct
  - Add crit_chance property as u8 type to SpawnDefinitionJson struct
  - Add crit_multiplier property as u8 type to SpawnDefinitionJson struct
  - Add chance property as u8 type to SpawnDefinitionJson struct
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 4. Update StatusEffectDefinitionJson structure with chance property

  - Add chance property as u8 type to StatusEffectDefinitionJson struct
  - _Requirements: 5.1_

- [x] 5. Update CharacterStateJson structure with new properties and field changes

  - Update health property from u8 to u16 type in CharacterStateJson struct
  - Add health_cap property as u16 type to CharacterStateJson struct
  - Add energy_cap property as u8 type to CharacterStateJson struct
  - Add power property as u8 type to CharacterStateJson struct
  - Add weight property as u8 type to CharacterStateJson struct
  - Add jump_force property as [i16; 2] type (Fixed numerator/denominator) to CharacterStateJson struct
  - Add move_speed property as [i16; 2] type (Fixed numerator/denominator) to CharacterStateJson struct
  - Replace facing and gravity_dir with dir property as [u8; 2] array in CharacterStateJson struct
  - Add enmity property as u8 type to CharacterStateJson struct
  - Add target_id property as Option<u8> to CharacterStateJson struct
  - Add target_type property as u8 type to CharacterStateJson struct
  - _Requirements: 1.7, 1.8, 1.9, 1.10, 1.11, 1.12, 1.13, 1.14, 1.15_

- [x] 6. Update SpawnStateJson structure with comprehensive property updates

  - Add health property as u16 type to SpawnStateJson struct
  - Add health_cap property as u16 type to SpawnStateJson struct
  - Add owner_type property as u8 type to SpawnStateJson struct
  - Update owner_id to support EntityId type in SpawnStateJson struct
  - Add rotation property as [i16; 2] type (Fixed numerator/denominator) to SpawnStateJson struct
  - Rename lifespan property to life_span in SpawnStateJson struct
  - Rename vars property to runtime_vars in SpawnStateJson struct
  - Rename fixed property to runtime_fixed in SpawnStateJson struct
  - Replace facing and gravity_dir with dir property as [u8; 2] array in SpawnStateJson struct
  - Add enmity property as u8 type to SpawnStateJson struct
  - Add target_id property as Option<u8> to SpawnStateJson struct
  - Add target_type property as u8 type to SpawnStateJson struct
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9, 4.10, 4.11, 4.12_

- [x] 7. Update StatusEffectStateJson structure with renamed fields

  - Rename remaining_duration property to life_span in StatusEffectStateJson struct
  - Rename vars property to runtime_vars in StatusEffectStateJson struct
  - Rename fixed property to runtime_fixed in StatusEffectStateJson struct
  - _Requirements: 5.2, 5.3, 5.4_

- [x] 8. Update Character conversion logic (From<CharacterDefinitionJson> for Character)

  - Initialize health_cap with provided value in Character conversion
  - Initialize energy_cap with provided value in Character conversion
  - Initialize power with provided value in Character conversion
  - Initialize weight with provided value in Character conversion
  - Initialize jump_force using Fixed::from_num(numerator) / Fixed::from_num(denominator) in Character conversion
  - Initialize move_speed using Fixed::from_num(numerator) / Fixed::from_num(denominator) in Character conversion
  - Set EntityCore.dir from provided direction values in Character conversion
  - Initialize enmity with provided value in Character conversion
  - Initialize target_id and target_type with provided values in Character conversion
  - Update health property to use u16 type in Character conversion
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8_

- [x] 9. Update SpawnDefinition conversion logic (From<SpawnDefinitionJson> for SpawnDefinition)

  - Set damage_base as u16 type in SpawnDefinition conversion
  - Set damage_range with provided value in SpawnDefinition conversion
  - Set crit_chance with provided value in SpawnDefinition conversion
  - Set crit_multiplier with provided value in SpawnDefinition conversion
  - Set chance with provided value in SpawnDefinition conversion
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 10. Update StatusEffectDefinition conversion logic (From<StatusEffectDefinitionJson> for StatusEffectDefinition)

  - Set chance with provided value in StatusEffectDefinition conversion
  - _Requirements: 8.1_

- [x] 11. Update CharacterStateJson serialization method (from_character)

  - Include all new properties (health_cap, energy_cap, power, weight, jump_force, move_speed) in Character serialization
  - Serialize EntityCore.dir as dir array in Character serialization
  - Include enmity, target_id, and target_type properties in Character serialization
  - Update health property to serialize as u16 type in Character serialization
  - Use Fixed::numer() and Fixed::denom() methods for jump_force and move_speed serialization
  - _Requirements: 9.1, 9.2, 9.3, 11.1, 11.2, 11.4_

- [x] 12. Update SpawnStateJson serialization method (from_spawn_instance)

  - Include all new properties (health, health_cap, owner_type, rotation) in SpawnInstance serialization
  - Use correct field names (life_span, runtime_vars, runtime_fixed) in SpawnInstance serialization
  - Serialize EntityCore.dir as dir array in SpawnInstance serialization
  - Include enmity, target_id, and target_type properties in SpawnInstance serialization
  - Use Fixed::numer() and Fixed::denom() methods for rotation and runtime_fixed array serialization
  - _Requirements: 9.4, 9.5, 9.6, 9.7, 11.1, 11.2, 11.4_

- [x] 13. Update StatusEffectStateJson serialization method (from_status_effect_instance)

  - Use life_span instead of remaining_duration in StatusEffectInstance serialization
  - Use runtime_vars and runtime_fixed field names in StatusEffectInstance serialization
  - Use Fixed::numer() and Fixed::denom() methods for runtime_fixed array serialization
  - _Requirements: 9.8, 9.9, 11.1, 11.2, 11.4_

- [x] 14. Update GameConfig validation logic with new property validations

  - Validate new Character properties are within valid ranges in GameConfig validation
  - Validate SpawnDefinition combat properties are within valid ranges in GameConfig validation
  - Validate entity targeting references are valid in GameConfig validation
  - Provide clear error messages for new property validation failures in GameConfig validation
  - Add validation for health_cap >= health constraint
  - Add validation for target_type when target_id is set
  - Add validation for Fixed-point denominators to ensure they are non-zero
  - Add validation for position and velocity Fixed-point denominators
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [x] 15. Update API documentation to reflect new JSON structures

  - Update API.md documentation with new CharacterDefinitionJson structure
  - Update API.md documentation with updated ActionDefinitionJson structure
  - Update API.md documentation with new SpawnDefinitionJson structure
  - Update API.md documentation with new StatusEffectDefinitionJson structure
  - Update API.md documentation with new CharacterStateJson structure
  - Update API.md documentation with new SpawnStateJson structure
  - Update API.md documentation with new StatusEffectStateJson structure
  - Add documentation for new validation rules and error messages
  - Add examples showing proper usage of new properties
  - Document Fixed-point value handling using numerator/denominator pairs and deterministic serialization
  - _Requirements: All requirements for documentation completeness_

- [x] 16. Update position and velocity handling to use numerator/denominator pairs

  - Update position property to [[i16; 2]; 2] type in CharacterDefinitionJson and CharacterStateJson
  - Update velocity property to [[i16; 2]; 2] type in CharacterStateJson and SpawnStateJson
  - Update position conversion logic to use Fixed::from_num(numerator) / Fixed::from_num(denominator)
  - Update position serialization logic to use Fixed::numer() and Fixed::denom() methods
  - Update velocity serialization logic to use Fixed::numer() and Fixed::denom() methods
  - Update runtime_fixed arrays to [[i16; 2]; 4] type in SpawnStateJson and StatusEffectStateJson
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [x] 17. Update TypeScript type definitions to match new JSON structures
  - Update TypeScript definitions in docs/TypeScript.d.ts with new CharacterDefinitionJson interface
  - Update TypeScript definitions with updated ActionDefinitionJson interface
  - Update TypeScript definitions with new SpawnDefinitionJson interface
  - Update TypeScript definitions with new StatusEffectDefinitionJson interface
  - Update TypeScript definitions with new CharacterStateJson interface
  - Update TypeScript definitions with new SpawnStateJson interface
  - Update TypeScript definitions with new StatusEffectStateJson interface
  - Add TypeScript documentation comments for new properties
  - Update GameConfig interface to include all new properties
  - Update TypeScript definitions to reflect numerator/denominator Fixed-point representation
  - _Requirements: All requirements for TypeScript compatibility_
