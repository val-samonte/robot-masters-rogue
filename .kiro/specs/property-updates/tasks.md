# Implementation Plan

- [x] 1. Update Character structure with new properties

  - Modify Character struct in entity.rs to include new u16 health properties, energy_cap, power, weight, jump_force, and move_speed
  - Update Character constructor and related methods to handle new properties
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_
  - ✅ **COMPLETED**: Character struct updated with all new properties and constructor updated with appropriate defaults

- [x] 2. Update ActionDefinition and ActionInstance structures

  - Remove interval and duration properties from ActionDefinition struct
  - Rename remaining_duration to cooldown in ActionInstance struct
  - Reduce runtime_vars array size from [u8; 8] to [u8; 4] in ActionInstance
  - _Requirements: 2.1, 2.2, 2.3, 2.4_
  - ✅ **COMPLETED**: ActionDefinition updated to remove interval and duration properties, ActionInstance updated with cooldown field and reduced runtime_vars array

- [x] 3. Update ConditionInstance structure

  - Reduce runtime_vars array size from [u8; 8] to [u8; 4] in ConditionInstance
  - _Requirements: 3.1_
  - ✅ **COMPLETED**: ConditionInstance runtime_vars array reduced to [u8; 4]

- [x] 4. Update EntityCore structure with consolidated properties

  - Combine facing and gravity_dir into single dir property as (u8, u8) tuple
  - Add enmity property as u8 type
  - Add target_id property as Option<EntityId>
  - Add target_type property as u8 type
  - Update EntityCore constructor and related methods
  - _Requirements: 4.1, 4.2_
  - ✅ **COMPLETED**: EntityCore updated with consolidated dir property, enmity, target_id, and target_type properties

- [ ] 5. Update SpawnDefinition structure with enhanced combat properties

  - Update damage_base property from u8 to u16
  - Add damage_range property as u16 type
  - Add crit_chance property as u8 type (0-100 range)
  - Add crit_multiplier property as u8 type (1-100 range)
  - Add chance property as u8 type for application probability
  - _Requirements: 5.1, 5.2, 5.3, 5.4_
  - ✅ **COMPLETED**: SpawnDefinition updated with enhanced combat properties including damage_base (u16), damage_range, crit_chance, crit_multiplier, and chance

- [ ] 6. Update SpawnInstance structure with comprehensive properties

  - Add health and health_cap properties as u16 type
  - Add owner_type property as u8 type for entity type tracking
  - Update owner_id to use EntityId type instead of CharacterId
  - Add rotation property as Fixed type
  - Rename lifespan to life_span property
  - Rename vars to runtime_vars with [u8; 4] array size
  - Rename fixed to runtime_fixed
  - _Requirements: 6.1, 6.2, 6.6, 6.7, 6.8, 6.9, 6.10_
  - ✅ **COMPLETED**: SpawnInstance updated with comprehensive properties including health, health_cap, owner_type, rotation, and renamed fields

- [x] 7. Update StatusEffectDefinition and StatusEffectInstance structures

  - Add chance property to StatusEffectDefinition as u8 type
  - Rename remaining_duration to life_span in StatusEffectInstance
  - Rename vars to runtime_vars with [u8; 4] array in StatusEffectInstance
  - Rename fixed to runtime_fixed in StatusEffectInstance
  - _Requirements: 7.1, 7.2, 7.3, 7.4_
  - ✅ **COMPLETED**: StatusEffectDefinition updated with chance property, StatusEffectInstance updated with life_span, runtime_vars, and runtime_fixed field names

- [ ] 8. Update property address constants

  - Add new Character property addresses (health_cap, power, weight, jump_force, move_speed)
  - Update EntityCore property addresses (dir, enmity, target_id, target_type)
  - Add new SpawnDefinition property addresses (damage_range, crit_chance, crit_multiplier, chance)
  - Add new SpawnInstance property addresses (health, health_cap, owner_type, rotation, life_span)
  - Update runtime variable property addresses for reduced array sizes
  - _Requirements: 8.7_
  - ✅ **COMPLETED**: Property address constants updated with new EntityCore properties (dir, enmity, target_id, target_type), enhanced SpawnDefinition properties (damage_range, crit_chance, crit_multiplier, chance), new SpawnInstance properties (health, health_cap, owner_type, rotation, life_span), and reduced runtime variable arrays to [u8; 4]

- [ ] 9. Implement new entity property access operators

  - Add READ_CHARACTER_PROPERTY operator (address 104) to operator_address constants
  - Add WRITE_CHARACTER_PROPERTY operator (address 105) to operator_address constants
  - Add READ_SPAWN_PROPERTY operator (address 106) to operator_address constants
  - Add WRITE_SPAWN_PROPERTY operator (address 107) to operator_address constants
  - _Requirements: 8.1, 8.2, 8.3, 8.4_
  - ✅ **COMPLETED**: New entity property access operators added to constants with addresses 104-107 for reading and writing character and spawn properties

- [x] 10. Implement entity property access operator logic in script engine

  - Add READ_CHARACTER_PROPERTY case to execute_instruction method with signature [character_id, var_index, property_address]
  - Add WRITE_CHARACTER_PROPERTY case to execute_instruction method with signature [character_id, property_address, var_index]
  - Add READ_SPAWN_PROPERTY case to execute_instruction method with signature [spawn_instance_id, var_index, property_address]
  - Add WRITE_SPAWN_PROPERTY case to execute_instruction method with signature [spawn_instance_id, property_address, var_index]
  - Implement entity ID validation and silent failure for invalid IDs
  - _Requirements: 8.5, 8.6_
  - ✅ **COMPLETED**: Entity property access operators implemented in script engine with proper signature handling and validation

- [x] 11. Update ScriptContext trait for new property access

  - Add methods to ScriptContext trait for character and spawn entity property access
  - Implement property address compatibility checking (Character properties 0x20-0x48, Spawn properties 0x52-0xBE, EntityCore properties 0x50-0x68)
  - Handle silent operation ignore for incompatible property addresses
  - _Requirements: 8.5, 8.6_
  - ✅ **COMPLETED**: ScriptContext trait updated with new methods and all implementations (ActionContext, ConditionContext, StatusEffectContext, SpawnBehaviorContext) include property address compatibility checking and silent failure handling

- [ ] 12. Create unit tests for updated entity structures

  - Write tests for Character struct with new properties and proper initialization
  - Write tests for ActionDefinition/ActionInstance with removed and renamed properties
  - Write tests for ConditionInstance with reduced runtime_vars array
  - Write tests for EntityCore with consolidated dir property and new targeting properties
  - Write tests for SpawnDefinition with new combat properties
  - Write tests for SpawnInstance with comprehensive property set
  - Write tests for StatusEffectDefinition/Instance with updated properties
  - _Requirements: All structural requirements_

- [ ] 13. Create unit tests for property address system

  - Write tests to verify all new property addresses are within u8 range (0-255)
  - Write tests to ensure no property address conflicts exist
  - Write tests for property address mapping to correct entity properties
  - Verify runtime variable array access with reduced sizes
  - _Requirements: 8.7_

- [ ] 14. Create unit tests for new entity property access operators

  - Write tests for READ_CHARACTER_PROPERTY operator with valid and invalid character IDs
  - Write tests for WRITE_CHARACTER_PROPERTY operator with valid and invalid character IDs
  - Write tests for READ_SPAWN_PROPERTY operator with valid and invalid spawn instance IDs
  - Write tests for WRITE_SPAWN_PROPERTY operator with valid and invalid spawn instance IDs
  - Write tests for property address compatibility checking
  - Write tests for silent operation ignore behavior
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

- [ ] 15. Update entity constructors and factory methods

  - Update Character::new() to initialize new properties with appropriate default values
  - Update EntityCore::new() to initialize dir tuple and new targeting properties
  - Update SpawnInstance constructors to handle new properties and EntityId owner_id
  - Update StatusEffectInstance constructors to use life_span instead of remaining_duration
  - _Requirements: All structural requirements_

- [ ] 16. Update existing code that references changed properties
  - Find and update all references to removed ActionDefinition properties (interval, duration)
  - Update all references to renamed ActionInstance.remaining_duration to cooldown
  - Update all references to EntityCore.facing and gravity_dir to use dir tuple
  - Update all references to SpawnInstance.vars/fixed to runtime_vars/runtime_fixed
  - Update all references to StatusEffectInstance.remaining_duration to life_span
  - _Requirements: All structural requirements_
