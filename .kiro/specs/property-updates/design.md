# Design Document

## Overview

This design addresses the comprehensive update of entity properties across the game engine, focusing on data structure modifications, property access system enhancements, and new operator implementations. The changes involve updating Character, ActionDefinition, ActionInstance, ConditionInstance, EntityCore, SpawnDefinition, SpawnInstance, and StatusEffectDefinition/Instance structures, along with implementing new property access operators for owner and target entities.

## Architecture

### Data Structure Updates

The property updates follow a systematic approach to modernize entity data structures:

1. **Size Optimization**: Converting properties from u8 to u16 where larger ranges are needed (health, damage)
2. **Property Consolidation**: Combining related properties (facing + gravity_dir → dir)
3. **Runtime State Management**: Standardizing runtime variable naming and sizing
4. **Enhanced Targeting**: Adding comprehensive targeting system for spawn entities

### Property Access System Enhancement

The existing property access system uses u8 addresses (0-255 range) to identify properties. The new operators will extend this system to support owner and target entity property access while maintaining the same addressing scheme.

## Components and Interfaces

### 1. Character Structure Updates

```rust
pub struct Character {
    pub core: EntityCore,
    pub health: u16,        // Updated from u8 to u16
    pub health_cap: u16,    // Updated from u8 to u16
    pub energy: u8,
    pub energy_cap: u8,     // New property, placed after energy
    pub power: u8,          // New property
    pub weight: u8,         // New property
    pub jump_force: Fixed,  // New property
    pub move_speed: Fixed,  // New property
    pub armor: [u8; 9],
    pub energy_regen: u8,
    pub energy_regen_rate: u8,
    pub energy_charge: u8,
    pub energy_charge_rate: u8,
    pub behaviors: Vec<(ConditionId, ActionId)>,
    pub locked_action: Option<ActionInstanceId>,
    pub status_effects: Vec<StatusEffectInstanceId>,
    pub action_last_used: Vec<u16>,
}
```

### 2. Action System Updates

```rust
pub struct ActionDefinition {
    pub energy_cost: u8,
    // interval and duration properties removed
    pub cooldown: u16,
    pub args: [u8; 8],
    pub spawns: [u8; 4],
    pub script: Vec<u8>,
}

pub struct ActionInstance {
    pub definition_id: ActionId,
    pub cooldown: u16,          // Renamed from remaining_duration
    pub last_used_frame: u16,
    pub runtime_vars: [u8; 4],  // Reduced from [u8; 8]
    pub runtime_fixed: [Fixed; 4],
}
```

### 3. Condition System Updates

```rust
pub struct ConditionInstance {
    pub definition_id: ConditionId,
    pub runtime_vars: [u8; 4],  // Reduced from [u8; 8]
    pub runtime_fixed: [Fixed; 4],
}
```

### 4. EntityCore Updates

```rust
pub struct EntityCore {
    pub id: EntityId,
    pub group: u8,
    pub pos: (Fixed, Fixed),
    pub vel: (Fixed, Fixed),
    pub size: (u8, u8),
    pub collision: (bool, bool, bool, bool),
    pub dir: (u8, u8),          // Combined facing and gravity_dir
    pub enmity: u8,             // New property for target ordering
    pub target_id: Option<EntityId>, // New property for targeting (can be Character or Spawn entity ID)
    pub target_type: u8,        // New property (1=Character, 2=Spawn)
}
```

### 5. Spawn System Updates

```rust
pub struct SpawnDefinition {
    pub damage_base: u16,       // Updated from u8 to u16
    pub damage_range: u16,      // New property for RND damage
    pub crit_chance: u8,        // New property (0-100)
    pub crit_multiplier: u8,    // New property (1-100)
    pub health_cap: u8,
    pub duration: u16,
    pub element: Option<Element>,
    pub args: [u8; 8],
    pub spawns: [u8; 4],
    pub behavior_script: Vec<u8>,
    pub collision_script: Vec<u8>,
    pub despawn_script: Vec<u8>,
    pub chance: u8,             // New property for application chance
}

pub struct SpawnInstance {
    pub core: EntityCore,       // Contains target_id and target_type
    pub spawn_id: SpawnLookupId,
    pub owner_id: EntityId,     // Can be Character or Spawn entity ID
    pub owner_type: u8,         // New property (1=Character, 2=Spawn) for owner entity type checking
    pub health: u16,            // New property
    pub health_cap: u16,        // New property
    pub rotation: Fixed,        // New property
    pub life_span: u16,         // Renamed from lifespan
    pub element: Element,
    pub runtime_vars: [u8; 4],  // Renamed from vars
    pub runtime_fixed: [Fixed; 4], // Renamed from fixed
}
```

### 6. Status Effect System Updates

```rust
pub struct StatusEffectDefinition {
    pub duration: u16,
    pub stack_limit: u8,
    pub reset_on_stack: bool,
    pub chance: u8,             // New property for application chance
    pub args: [u8; 8],
    pub spawns: [u8; 4],
    pub on_script: Vec<u8>,
    pub tick_script: Vec<u8>,
    pub off_script: Vec<u8>,
}

pub struct StatusEffectInstance {
    pub definition_id: StatusEffectId,
    pub life_span: u16,         // Renamed from remaining_duration for consistency
    pub stack_count: u8,
    pub runtime_vars: [u8; 4],  // Renamed from vars
    pub runtime_fixed: [Fixed; 4], // Renamed from fixed
}
```

## Data Models

### Property Address Mapping

The property address system will be extended to accommodate new properties while maintaining the existing u8 address space:

#### New Character Properties

- `CHARACTER_HEALTH_CAP`: 0x35 (new address)
- `CHARACTER_POWER`: 0x36 (new address)
- `CHARACTER_WEIGHT`: 0x37 (new address)
- `CHARACTER_JUMP_FORCE`: 0x38 (new address)
- `CHARACTER_MOVE_SPEED`: 0x39 (new address)

#### Updated EntityCore Properties

- `ENTITY_DIR_HORIZONTAL`: 0x50 (replaces ENTITY_FACING)
- `ENTITY_DIR_VERTICAL`: 0x51 (replaces ENTITY_GRAVITY_DIR)
- `ENTITY_ENMITY`: 0x66 (new address, placed after spawn definition properties)
- `ENTITY_TARGET_ID`: 0x67 (new address)
- `ENTITY_TARGET_TYPE`: 0x68 (new address)

#### New SpawnDefinition Properties

- `SPAWN_DEF_DAMAGE_RANGE`: 0x62 (new address)
- `SPAWN_DEF_CRIT_CHANCE`: 0x63 (new address)
- `SPAWN_DEF_CRIT_MULTIPLIER`: 0x64 (new address)
- `SPAWN_DEF_CHANCE`: 0x65 (new address)

#### New SpawnInstance Properties

- `SPAWN_INST_HEALTH`: 0xBA (new address)
- `SPAWN_INST_HEALTH_CAP`: 0xBB (new address)
- `SPAWN_INST_OWNER_TYPE`: 0xBC (new address)
- `SPAWN_INST_ROTATION`: 0xBD (new address)
- `SPAWN_INST_LIFE_SPAN`: 0xBE (new address)

#### Updated SpawnInstance Properties

- `SPAWN_OWNER_ID`: 0x54 (existing address, updated to use EntityId instead of CharacterId)

#### New SpawnInstance Core Properties

- `SPAWN_INST_OWNER_TYPE`: 0x59 (new address, placed after existing spawn properties)

#### Updated Runtime Variables

- ActionInstance runtime_vars: `ACTION_INST_VAR0-3` (0x80-0x83)
- ConditionInstance runtime_vars: `CONDITION_INST_VAR0-3` (0x90-0x93)
- StatusEffectInstance runtime_vars: `STATUS_EFFECT_INST_VAR0-3` (0xA0-0xA3)
- SpawnInstance runtime_vars: `SPAWN_INST_VAR0-3` (0xB0-0xB3)

### New Operator Addresses

Four new operators will be added to the operator address space:

```rust
// Entity-specific property access operators (104-107)
pub const READ_CHARACTER_PROPERTY: u8 = 104;
pub const WRITE_CHARACTER_PROPERTY: u8 = 105;
pub const READ_SPAWN_PROPERTY: u8 = 106;
pub const WRITE_SPAWN_PROPERTY: u8 = 107;
```

### Entity Property Access Behavior

The new property access operators have the following signatures:

- `[READ_CHARACTER_PROPERTY, character_id, var_index, property_address]`
- `[WRITE_CHARACTER_PROPERTY, character_id, property_address, var_index]`
- `[READ_SPAWN_PROPERTY, spawn_instance_id, var_index, property_address]`
- `[WRITE_SPAWN_PROPERTY, spawn_instance_id, property_address, var_index]`

**Entity ID Resolution**: The operators directly access entities by their ID:

1. **Character Property Access**:

   - Uses character_id to directly access Character entity
   - Works with Character properties (0x20-0x48) and EntityCore properties (0x50-0x68)
   - If character_id is invalid, operation is silently ignored

2. **Spawn Property Access**:
   - Uses spawn_instance_id to directly access SpawnInstance entity
   - Works with Spawn properties (0x52-0xBE) and EntityCore properties (0x50-0x68)
   - If spawn_instance_id is invalid, operation is silently ignored

**Property Address Compatibility**:

- Character operators work with Character properties (0x20-0x48) and EntityCore properties (0x50-0x68)
- Spawn operators work with Spawn properties (0x52-0xBE) and EntityCore properties (0x50-0x68)
- Using incompatible property addresses results in silent operation ignore

### Entity ID Types

Since we have type fields (owner_type, target_type) to distinguish entity types, we can use simple EntityId for both owner_id and target_id:

```rust
pub type SpawnInstanceId = u8; // New type for spawn instance IDs
```

## Error Handling

### Property Address Overflow Protection

The system will validate that property addresses remain within the u8 range (0-255). Current usage analysis:

- Game State: 0x01-0x03 (3 addresses)
- Action Definition: 0x04-0x0F (12 addresses)
- Condition Definition: 0x10-0x1B (12 addresses)
- Status Effect Definition: 0x1A-0x1F (6 addresses)
- Character Properties: 0x20-0x39 (26 addresses, including new ones)
- Character Collision: 0x30-0x33 (4 addresses)
- Character Status Effects: 0x34 (1 address)
- Character Armor: 0x40-0x48 (9 addresses)
- Entity Direction: 0x50-0x51 (2 addresses, dir horizontal/vertical)
- Spawn Properties: 0x52-0x59 (8 addresses, including new owner_type)
- Spawn Definition: 0x5A-0x65 (12 addresses, including new ones)
- Entity Targeting: 0x66-0x68 (3 addresses, enmity, target_id, target_type)
- Action Instance: 0x80-0x8D (14 addresses)
- Condition Instance: 0x90-0x9B (12 addresses)
- Status Effect Instance: 0xA0-0xAB (12 addresses)
- Spawn Instance: 0xB0-0xBE (15 addresses, including new ones)

**Total Usage**: Approximately 130 addresses out of 256 available, leaving sufficient room for future expansion.

### Migration Strategy

1. **Backward Compatibility**: Since this is a fresh start project with no backward compatibility requirements, all changes will be applied directly
2. **Property Address Deallocation**: Removed properties will have their addresses freed for future use
3. **Runtime Variable Validation**: Scripts accessing the reduced runtime_vars arrays will be validated during script execution

## Testing Strategy

### Unit Testing Approach

1. **Structure Validation Tests**

   - Verify all new properties are accessible
   - Validate property size changes (u8 → u16)
   - Test property address mappings

2. **Property Access Tests**

   - Test new owner/target property operators
   - Validate property address bounds checking
   - Test runtime variable array access with reduced sizes

3. **Entity Relationship Tests**

   - Test target_id assignment and retrieval
   - Validate EntityReference enum functionality
   - Test enmity-based targeting logic

4. **Script Execution Tests**
   - Test scripts using new property addresses
   - Validate new operator functionality
   - Test error handling for invalid property access

### Integration Testing

1. **Cross-Entity Property Access**

   - Test owner property access from spawn scripts
   - Test target property access with different entity types
   - Validate property synchronization between related entities

2. **Game Loop Integration**
   - Test property updates during game frame processing
   - Validate targeting system updates based on enmity values
   - Test lifecycle management with new life_span property

### Performance Considerations

1. **Memory Usage**: The property updates will slightly increase memory usage due to u16 properties and additional fields
2. **Property Access Performance**: New operators will have similar performance characteristics to existing property access
3. **Targeting System**: The new targeting system will require additional processing during game loop updates

The design maintains the existing architecture patterns while extending functionality to support the enhanced property system and targeting capabilities required by the updated game engine.
