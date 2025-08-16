# Design Document

## Overview

This design addresses the comprehensive update of the wasm-wrapper to align with the property changes implemented in the property-updates spec. The wasm-wrapper serves as the JavaScript-compatible interface to the Robot Masters game engine, handling JSON serialization/deserialization, configuration validation, and state management. The updates ensure that all entity structures, property types, field names, and serialization logic match the enhanced game engine while maintaining deterministic behavior across the WASM boundary.

**Key Change**: All Fixed-point values will be represented as `[numerator, denominator]` pairs in JSON to provide clear, deterministic, and human-readable fractional values.

## Architecture

### Current State Analysis

The wasm-wrapper currently uses outdated JSON type definitions that don't match the updated game engine:

1. **Missing Properties**: New Character properties (health_cap, power, weight, jump_force, move_speed), SpawnDefinition combat properties, SpawnInstance comprehensive properties
2. **Incorrect Types**: Character health still u8 instead of u16, SpawnDefinition damage_base still u8 instead of u16
3. **Outdated Field Names**: Still using facing/gravity_dir instead of dir, remaining_duration instead of life_span, vars/fixed instead of runtime_vars/runtime_fixed
4. **Missing EntityCore Updates**: No enmity, target_id, target_type properties in serialization
5. **Fixed-Point Representation**: Currently using raw integer values instead of clear numerator/denominator pairs

### Design Principles

1. **Deterministic Serialization**: All Fixed-point values must be serialized as `[numerator, denominator]` pairs to maintain determinism and clarity
2. **Type Safety**: JSON types must exactly match game engine types to prevent runtime errors
3. **Backward Compatibility**: Since this is a fresh start project, we can break compatibility to achieve the cleanest design
4. **Validation Completeness**: All new properties and references must be validated during configuration parsing
5. **Human Readability**: Fixed-point values should be easily readable and debuggable in JSON format

## Components and Interfaces

### 1. Updated JSON Type Definitions

#### CharacterDefinitionJson

```rust
#[derive(Deserialize, Serialize, Debug, Clone)]
pub struct CharacterDefinitionJson {
    pub id: u8,
    pub group: u8,
    pub position: [[i16; 2]; 2], // [[x_num, x_den], [y_num, y_den]]
    pub health: u16,        // Updated from u8 to u16
    pub health_cap: u16,    // New property
    pub energy: u8,
    pub energy_cap: u8,     // New property
    pub power: u8,          // New property
    pub weight: u8,         // New property
    pub jump_force: [i16; 2],    // New property [numerator, denominator]
    pub move_speed: [i16; 2],    // New property [numerator, denominator]
    pub armor: [u8; 9],
    pub energy_regen: u8,
    pub energy_regen_rate: u8,
    pub energy_charge: u8,
    pub energy_charge_rate: u8,
    pub dir: [u8; 2],       // New property replacing facing/gravity_dir
    pub enmity: u8,         // New property
    pub target_id: Option<u8>, // New property
    pub target_type: u8,    // New property
    pub behaviors: Vec<[usize; 2]>, // [condition_id, action_id] pairs
}
```

#### ActionDefinitionJson

```rust
#[derive(Deserialize, Serialize, Debug, Clone)]
pub struct ActionDefinitionJson {
    pub energy_cost: u8,
    // interval and duration properties removed
    pub cooldown: u16,
    pub args: [u8; 8],
    pub spawns: [u8; 4],
    pub script: Vec<u8>,
}
```

#### SpawnDefinitionJson

```rust
#[derive(Deserialize, Serialize, Debug, Clone)]
pub struct SpawnDefinitionJson {
    pub damage_base: u16,   // Updated from u8 to u16
    pub damage_range: u16,  // New property
    pub crit_chance: u8,    // New property (0-100)
    pub crit_multiplier: u8, // New property (1-100)
    pub health_cap: u8,
    pub duration: u16,
    pub element: Option<u8>, // Element as u8 value (0-8)
    pub chance: u8,         // New property (0-100)
    pub args: [u8; 8],
    pub spawns: [u8; 4],
    pub behavior_script: Vec<u8>,
    pub collision_script: Vec<u8>,
    pub despawn_script: Vec<u8>,
}
```

#### StatusEffectDefinitionJson

```rust
#[derive(Deserialize, Serialize, Debug, Clone)]
pub struct StatusEffectDefinitionJson {
    pub duration: u16,
    pub stack_limit: u8,
    pub reset_on_stack: bool,
    pub chance: u8,         // New property (0-100)
    pub args: [u8; 8],
    pub spawns: [u8; 4],
    pub on_script: Vec<u8>,
    pub tick_script: Vec<u8>,
    pub off_script: Vec<u8>,
}
```

### 2. Updated State Serialization Types

#### CharacterStateJson

```rust
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct CharacterStateJson {
    pub id: u8,
    pub group: u8,
    pub position: [[i16; 2]; 2], // [[x_num, x_den], [y_num, y_den]]
    pub velocity: [[i16; 2]; 2], // [[vx_num, vx_den], [vy_num, vy_den]]
    pub health: u16,        // Updated from u8 to u16
    pub health_cap: u16,    // New property
    pub energy: u8,
    pub energy_cap: u8,     // New property
    pub power: u8,          // New property
    pub weight: u8,         // New property
    pub jump_force: [i16; 2],    // New property [numerator, denominator]
    pub move_speed: [i16; 2],    // New property [numerator, denominator]
    pub armor: [u8; 9],
    pub energy_regen: u8,
    pub energy_regen_rate: u8,
    pub energy_charge: u8,
    pub energy_charge_rate: u8,
    pub dir: [u8; 2],       // Replaces facing and gravity_dir
    pub enmity: u8,         // New property
    pub target_id: Option<u8>, // New property
    pub target_type: u8,    // New property
    pub size: [u8; 2],
    pub collision: [bool; 4], // [top, right, bottom, left]
    pub locked_action: Option<u8>,
    pub status_effects: Vec<u8>,
    pub behaviors: Vec<[usize; 2]>, // [condition_id, action_id] pairs
}
```

#### SpawnStateJson

```rust
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct SpawnStateJson {
    pub id: u8,
    pub spawn_id: u8,
    pub owner_id: u8,       // Now supports EntityId
    pub owner_type: u8,     // New property (1=Character, 2=Spawn)
    pub position: [[i16; 2]; 2], // [[x_num, x_den], [y_num, y_den]]
    pub velocity: [[i16; 2]; 2], // [[vx_num, vx_den], [vy_num, vy_den]]
    pub health: u16,        // New property
    pub health_cap: u16,    // New property
    pub rotation: [i16; 2], // New property [numerator, denominator]
    pub life_span: u16,     // Renamed from lifespan
    pub element: Option<u8>, // Element as u8 value (0-8)
    pub dir: [u8; 2],       // Replaces facing and gravity_dir
    pub enmity: u8,         // New property
    pub target_id: Option<u8>, // New property
    pub target_type: u8,    // New property
    pub size: [u8; 2],
    pub collision: [bool; 4], // [top, right, bottom, left]
    pub runtime_vars: [u8; 4], // Renamed from vars
    pub runtime_fixed: [[i16; 2]; 4], // Renamed from fixed, [numerator, denominator] pairs
}
```

#### StatusEffectStateJson

```rust
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct StatusEffectStateJson {
    pub instance_id: u8,
    pub definition_id: usize,
    pub life_span: u16,     // Renamed from remaining_duration
    pub stack_count: u8,
    pub runtime_vars: [u8; 4], // Renamed from vars
    pub runtime_fixed: [[i16; 2]; 4], // Renamed from fixed, [numerator, denominator] pairs
}
```

### 3. Conversion Logic Updates

#### Character Conversion

```rust
impl From<CharacterDefinitionJson> for Character {
    fn from(json: CharacterDefinitionJson) -> Self {
        let mut character = Character::new(json.id, json.group);

        // Set position using Fixed-point conversion from numerator/denominator
        character.core.pos = (
            Fixed::from_frac(json.position[0][0], json.position[0][1]),
            Fixed::from_frac(json.position[1][0], json.position[1][1]),
        );

        // Set updated properties
        character.health = json.health;
        character.health_cap = json.health_cap;
        character.energy = json.energy;
        character.energy_cap = json.energy_cap;
        character.power = json.power;
        character.weight = json.weight;
        character.jump_force = Fixed::from_frac(json.jump_force[0], json.jump_force[1]);
        character.move_speed = Fixed::from_frac(json.move_speed[0], json.move_speed[1]);
        character.armor = json.armor;
        character.energy_regen = json.energy_regen;
        character.energy_regen_rate = json.energy_regen_rate;
        character.energy_charge = json.energy_charge;
        character.energy_charge_rate = json.energy_charge_rate;

        // Set EntityCore properties
        character.core.dir = (json.dir[0], json.dir[1]);
        character.core.enmity = json.enmity;
        character.core.target_id = json.target_id;
        character.core.target_type = json.target_type;

        // Convert behavior pairs
        character.behaviors = json
            .behaviors
            .into_iter()
            .map(|[condition_id, action_id]| (condition_id, action_id))
            .collect();

        character
    }
}
```

#### SpawnDefinition Conversion

```rust
impl From<SpawnDefinitionJson> for SpawnDefinition {
    fn from(json: SpawnDefinitionJson) -> Self {
        use robot_masters_engine::entity::Element;

        let element = json.element.and_then(Element::from_u8);

        SpawnDefinition {
            damage_base: json.damage_base,
            damage_range: json.damage_range,
            crit_chance: json.crit_chance,
            crit_multiplier: json.crit_multiplier,
            health_cap: json.health_cap,
            duration: json.duration,
            element,
            chance: json.chance,
            args: json.args,
            spawns: json.spawns,
            behavior_script: json.behavior_script,
            collision_script: json.collision_script,
            despawn_script: json.despawn_script,
        }
    }
}
```

### 4. State Serialization Updates

#### Character State Serialization

```rust
impl CharacterStateJson {
    pub fn from_character(character: &robot_masters_engine::entity::Character) -> Self {
        Self {
            id: character.core.id,
            group: character.core.group,
            position: [
                [character.core.pos.0.numer().to_num(), character.core.pos.0.denom().to_num()],
                [character.core.pos.1.numer().to_num(), character.core.pos.1.denom().to_num()],
            ],
            velocity: [
                [character.core.vel.0.numer().to_num(), character.core.vel.0.denom().to_num()],
                [character.core.vel.1.numer().to_num(), character.core.vel.1.denom().to_num()],
            ],
            health: character.health,
            health_cap: character.health_cap,
            energy: character.energy,
            energy_cap: character.energy_cap,
            power: character.power,
            weight: character.weight,
            jump_force: [character.jump_force.numer().to_num(), character.jump_force.denom().to_num()],
            move_speed: [character.move_speed.numer().to_num(), character.move_speed.denom().to_num()],
            armor: character.armor,
            energy_regen: character.energy_regen,
            energy_regen_rate: character.energy_regen_rate,
            energy_charge: character.energy_charge,
            energy_charge_rate: character.energy_charge_rate,
            dir: [character.core.dir.0, character.core.dir.1],
            enmity: character.core.enmity,
            target_id: character.core.target_id,
            target_type: character.core.target_type,
            size: [character.core.size.0, character.core.size.1],
            collision: [
                character.core.collision.0,
                character.core.collision.1,
                character.core.collision.2,
                character.core.collision.3,
            ],
            locked_action: character.locked_action,
            status_effects: character.status_effects.clone(),
            behaviors: character
                .behaviors
                .iter()
                .map(|&(condition_id, action_id)| [condition_id, action_id])
                .collect(),
        }
    }
}
```

#### SpawnInstance State Serialization

```rust
impl SpawnStateJson {
    pub fn from_spawn_instance(spawn: &robot_masters_engine::entity::SpawnInstance) -> Self {
        Self {
            id: spawn.core.id,
            spawn_id: spawn.spawn_id,
            owner_id: spawn.owner_id,
            owner_type: spawn.owner_type,
            position: [
                [spawn.core.pos.0.numer().to_num(), spawn.core.pos.0.denom().to_num()],
                [spawn.core.pos.1.numer().to_num(), spawn.core.pos.1.denom().to_num()],
            ],
            velocity: [
                [spawn.core.vel.0.numer().to_num(), spawn.core.vel.0.denom().to_num()],
                [spawn.core.vel.1.numer().to_num(), spawn.core.vel.1.denom().to_num()],
            ],
            health: spawn.health,
            health_cap: spawn.health_cap,
            rotation: [spawn.rotation.numer().to_num(), spawn.rotation.denom().to_num()],
            life_span: spawn.life_span,
            element: Some(spawn.element as u8),
            dir: [spawn.core.dir.0, spawn.core.dir.1],
            enmity: spawn.core.enmity,
            target_id: spawn.core.target_id,
            target_type: spawn.core.target_type,
            size: [spawn.core.size.0, spawn.core.size.1],
            collision: [
                spawn.core.collision.0,
                spawn.core.collision.1,
                spawn.core.collision.2,
                spawn.core.collision.3,
            ],
            runtime_vars: spawn.runtime_vars,
            runtime_fixed: [
                [spawn.runtime_fixed[0].numer().to_num(), spawn.runtime_fixed[0].denom().to_num()],
                [spawn.runtime_fixed[1].numer().to_num(), spawn.runtime_fixed[1].denom().to_num()],
                [spawn.runtime_fixed[2].numer().to_num(), spawn.runtime_fixed[2].denom().to_num()],
                [spawn.runtime_fixed[3].numer().to_num(), spawn.runtime_fixed[3].denom().to_num()],
            ],
        }
    }
}
```

### 5. Enhanced Validation Logic

#### GameConfig Validation Updates

```rust
impl GameConfig {
    pub fn validate(&self) -> Result<(), Vec<ValidationError>> {
        let mut errors = Vec::new();

        // Existing validations...

        // Validate new Character properties
        for (char_idx, character) in self.characters.iter().enumerate() {
            // Validate health_cap >= health
            if character.health_cap < character.health {
                errors.push(ValidationError {
                    field: format!("characters[{}].health_cap", char_idx),
                    message: "Health cap must be greater than or equal to current health".to_string(),
                    context: Some(format!("health_cap: {}, health: {}", character.health_cap, character.health)),
                });
            }

            // Validate Fixed-point denominators are not zero
            if character.jump_force[1] == 0 {
                errors.push(ValidationError {
                    field: format!("characters[{}].jump_force", char_idx),
                    message: "Jump force denominator cannot be zero".to_string(),
                    context: Some("Denominator must be non-zero for valid fraction".to_string()),
                });
            }

            if character.move_speed[1] == 0 {
                errors.push(ValidationError {
                    field: format!("characters[{}].move_speed", char_idx),
                    message: "Move speed denominator cannot be zero".to_string(),
                    context: Some("Denominator must be non-zero for valid fraction".to_string()),
                });
            }

            // Validate position denominators
            if character.position[0][1] == 0 || character.position[1][1] == 0 {
                errors.push(ValidationError {
                    field: format!("characters[{}].position", char_idx),
                    message: "Position denominators cannot be zero".to_string(),
                    context: Some("Both X and Y denominators must be non-zero".to_string()),
                });
            }

            // Validate target_type if target_id is set
            if character.target_id.is_some() && character.target_type == 0 {
                errors.push(ValidationError {
                    field: format!("characters[{}].target_type", char_idx),
                    message: "Target type must be specified when target_id is set".to_string(),
                    context: Some("target_type must be 1 (Character) or 2 (Spawn)".to_string()),
                });
            }
        }

        // Validate SpawnDefinition combat properties
        for (spawn_idx, spawn) in self.spawns.iter().enumerate() {
            // Validate crit_chance range (0-100)
            if spawn.crit_chance > 100 {
                errors.push(ValidationError {
                    field: format!("spawns[{}].crit_chance", spawn_idx),
                    message: "Critical chance must be between 0 and 100".to_string(),
                    context: Some(format!("Found crit_chance: {}", spawn.crit_chance)),
                });
            }

            // Validate crit_multiplier range (1-100)
            if spawn.crit_multiplier == 0 || spawn.crit_multiplier > 100 {
                errors.push(ValidationError {
                    field: format!("spawns[{}].crit_multiplier", spawn_idx),
                    message: "Critical multiplier must be between 1 and 100".to_string(),
                    context: Some(format!("Found crit_multiplier: {}", spawn.crit_multiplier)),
                });
            }

            // Validate chance range (0-100)
            if spawn.chance > 100 {
                errors.push(ValidationError {
                    field: format!("spawns[{}].chance", spawn_idx),
                    message: "Application chance must be between 0 and 100".to_string(),
                    context: Some(format!("Found chance: {}", spawn.chance)),
                });
            }
        }

        // Validate StatusEffectDefinition chance property
        for (status_idx, status_effect) in self.status_effects.iter().enumerate() {
            if status_effect.chance > 100 {
                errors.push(ValidationError {
                    field: format!("status_effects[{}].chance", status_idx),
                    message: "Application chance must be between 0 and 100".to_string(),
                    context: Some(format!("Found chance: {}", status_effect.chance)),
                });
            }
        }

        if errors.is_empty() {
            Ok(())
        } else {
            Err(errors)
        }
    }
}
```

## Data Models

### Fixed-Point Serialization Strategy

All Fixed-point values are serialized using numerator/denominator representation to maintain determinism and clarity:

1. **Position/Velocity**: `[[i16; 2]; 2]` arrays containing `[numerator, denominator]` pairs for each axis
2. **Movement Properties**: `[i16; 2]` arrays containing `[numerator, denominator]` for jump_force, move_speed, rotation
3. **Runtime Fixed Arrays**: `[[i16; 2]; 4]` arrays containing `[numerator, denominator]` pairs for each Fixed value

This approach provides:

- **Clarity**: Explicit representation of fractional values
- **Determinism**: Exact mathematical representation across platforms
- **Debuggability**: Human-readable fractional values in JSON
- **Precision**: No loss of precision during serialization/deserialization

### Entity ID Handling

The updated design handles EntityId types properly:

- `owner_id` in SpawnInstance can reference either Character or Spawn entities
- `target_id` in EntityCore can reference either Character or Spawn entities
- Type discrimination is handled by `owner_type` and `target_type` fields

### Memory Layout Considerations

The updated JSON structures maintain efficient memory usage:

- New u16 properties (health, health_cap, damage_base, damage_range) provide necessary range expansion
- Fixed-point values are stored as `[numerator, denominator]` pairs for clear representation
- Array sizes remain optimal for game requirements

## Error Handling

### Validation Error Categories

1. **Type Validation**: Ensure all numeric values are within valid ranges
2. **Reference Validation**: Verify all entity references are valid
3. **Consistency Validation**: Check that related properties are consistent (e.g., health <= health_cap)
4. **Range Validation**: Validate percentage values (0-100) and other constrained ranges
5. **Fixed-Point Validation**: Ensure denominators are non-zero for all Fixed-point values

### Error Recovery Strategy

1. **Configuration Errors**: Fail fast with detailed error messages during initialization
2. **Serialization Errors**: Log warnings but continue operation where possible
3. **Type Conversion Errors**: Provide clear error context for debugging

## Testing Strategy

### Unit Testing Approach

1. **JSON Conversion Tests**

   - Test all From implementations with valid and edge case data
   - Verify Fixed-point serialization/deserialization maintains precision using numerator/denominator
   - Test new property initialization and default values
   - Test zero denominator handling and validation

2. **Validation Tests**

   - Test all new validation rules with valid and invalid configurations
   - Verify error messages are clear and actionable
   - Test edge cases for numeric ranges and references
   - Test Fixed-point validation (zero denominators, overflow conditions)

3. **State Serialization Tests**
   - Test complete game state serialization with new properties
   - Verify JSON output matches expected structure with numerator/denominator pairs
   - Test serialization performance with large game states

### Integration Testing

1. **End-to-End Configuration**

   - Test complete game initialization with updated JSON configuration using numerator/denominator Fixed-point values
   - Verify all new properties are properly initialized in game engine
   - Test game state serialization after multiple frame steps

2. **WASM Boundary Testing**
   - Test JSON serialization across WASM boundary with numerator/denominator representation
   - Verify deterministic behavior in different JavaScript environments
   - Test error handling and recovery mechanisms

### Performance Considerations

1. **Serialization Performance**: Numerator/denominator representation adds minimal overhead compared to raw values
2. **Memory Usage**: Additional properties and Fixed-point pairs increase memory usage but remain within reasonable bounds
3. **Validation Performance**: Enhanced validation including Fixed-point checks adds minimal overhead during initialization

The design maintains the existing architecture patterns while extending functionality to support all property updates from the game engine, ensuring the wasm-wrapper provides a complete and accurate interface to the enhanced Robot Masters game engine with clear, deterministic Fixed-point representation.
