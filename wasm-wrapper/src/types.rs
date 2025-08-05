//! JSON-compatible types for game configuration and serialization

use robot_masters_engine::{
    entity::{
        ActionDefinition, Character, ConditionDefinition, SpawnDefinition, StatusEffectDefinition,
    },
    math::Fixed,
};
use serde::{Deserialize, Serialize};

/// Complete game configuration structure for JSON input
#[derive(Deserialize, Serialize, Debug, Clone)]
pub struct GameConfig {
    pub seed: u16,
    pub gravity: Option<[i16; 2]>, // Optional gravity as [numerator, denominator], defaults to [1, 1] (downward)
    pub tilemap: Vec<Vec<u8>>,     // 15x16 tilemap as nested arrays
    pub characters: Vec<CharacterDefinitionJson>,
    pub actions: Vec<ActionDefinitionJson>,
    pub conditions: Vec<ConditionDefinitionJson>,
    pub spawns: Vec<SpawnDefinitionJson>,
    pub status_effects: Vec<StatusEffectDefinitionJson>,
}

/// JSON-compatible character definition
#[derive(Deserialize, Serialize, Debug, Clone)]
pub struct CharacterDefinitionJson {
    pub id: u8,
    pub group: u8,
    pub position: [[i16; 2]; 2], // [[x_num, x_den], [y_num, y_den]]
    pub size: [u8; 2],           // [width, height] in pixels
    pub health: u16,             // Updated from u8 to u16
    pub health_cap: u16,         // New property
    pub energy: u8,
    pub energy_cap: u8,       // New property
    pub power: u8,            // New property
    pub weight: u8,           // New property
    pub jump_force: [i16; 2], // New property [numerator, denominator]
    pub move_speed: [i16; 2], // New property [numerator, denominator]
    pub armor: [u8; 9],       // Armor values for all 9 elements
    pub energy_regen: u8,
    pub energy_regen_rate: u8,
    pub energy_charge: u8,
    pub energy_charge_rate: u8,
    pub dir: [u8; 2],               // New property replacing facing/gravity_dir
    pub enmity: u8,                 // New property
    pub target_id: Option<u8>,      // New property
    pub target_type: u8,            // New property
    pub behaviors: Vec<[usize; 2]>, // [condition_id, action_id] pairs
}

/// JSON-compatible action definition
#[derive(Deserialize, Serialize, Debug, Clone)]
pub struct ActionDefinitionJson {
    pub energy_cost: u8,
    pub cooldown: u16,
    pub args: [u8; 8],
    pub spawns: [u8; 4],
    pub script: Vec<u8>,
}

/// JSON-compatible condition definition
#[derive(Deserialize, Serialize, Debug, Clone)]
pub struct ConditionDefinitionJson {
    pub energy_mul: i16, // Fixed-point value as raw integer for JSON
    pub args: [u8; 8],
    pub script: Vec<u8>,
}

/// JSON-compatible spawn definition
#[derive(Deserialize, Serialize, Debug, Clone)]
pub struct SpawnDefinitionJson {
    pub damage_base: u16,    // Updated from u8 to u16
    pub damage_range: u16,   // New property
    pub crit_chance: u8,     // New property
    pub crit_multiplier: u8, // New property
    pub health_cap: u8,
    pub duration: u16,
    pub element: Option<u8>, // Element as u8 value (0-8)
    pub chance: u8,          // New property
    pub size: [u8; 2],       // [width, height] in pixels
    pub args: [u8; 8],
    pub spawns: [u8; 4],
    pub behavior_script: Vec<u8>,
    pub collision_script: Vec<u8>,
    pub despawn_script: Vec<u8>,
}

/// JSON-compatible status effect definition
#[derive(Deserialize, Serialize, Debug, Clone)]
pub struct StatusEffectDefinitionJson {
    pub duration: u16,
    pub stack_limit: u8,
    pub reset_on_stack: bool,
    pub chance: u8, // New property
    pub args: [u8; 8],
    pub spawns: [u8; 4],
    pub on_script: Vec<u8>,
    pub tick_script: Vec<u8>,
    pub off_script: Vec<u8>,
}

/// Validation error for game configuration
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ValidationError {
    pub field: String,
    pub message: String,
    pub context: Option<String>,
}

impl GameConfig {
    /// Validate the complete game configuration
    pub fn validate(&self) -> Result<(), Vec<ValidationError>> {
        let mut errors = Vec::new();

        // Validate gravity field if present
        if let Some(gravity) = &self.gravity {
            if gravity[1] == 0 {
                errors.push(ValidationError {
                    field: "gravity".to_string(),
                    message: "Gravity denominator cannot be zero".to_string(),
                    context: Some("Fixed-point denominators must be non-zero".to_string()),
                });
            }
        }

        // Validate tilemap dimensions
        if self.tilemap.len() != 15 {
            errors.push(ValidationError {
                field: "tilemap".to_string(),
                message: "Tilemap must have exactly 15 rows".to_string(),
                context: Some(format!("Found {} rows", self.tilemap.len())),
            });
        } else {
            for (row_idx, row) in self.tilemap.iter().enumerate() {
                if row.len() != 16 {
                    errors.push(ValidationError {
                        field: "tilemap".to_string(),
                        message: format!("Row {} must have exactly 16 columns", row_idx),
                        context: Some(format!("Found {} columns", row.len())),
                    });
                }
            }
        }

        // Validate character properties
        for (char_idx, character) in self.characters.iter().enumerate() {
            // Validate health_cap >= health constraint
            if character.health_cap < character.health {
                errors.push(ValidationError {
                    field: format!("characters[{}].health_cap", char_idx),
                    message: "Health cap must be greater than or equal to current health"
                        .to_string(),
                    context: Some(format!(
                        "health_cap: {}, health: {}",
                        character.health_cap, character.health
                    )),
                });
            }

            // Validate Fixed-point denominators for position
            if character.position[0][1] == 0 {
                errors.push(ValidationError {
                    field: format!("characters[{}].position[0][1]", char_idx),
                    message: "Position X denominator cannot be zero".to_string(),
                    context: Some("Fixed-point denominators must be non-zero".to_string()),
                });
            }
            if character.position[1][1] == 0 {
                errors.push(ValidationError {
                    field: format!("characters[{}].position[1][1]", char_idx),
                    message: "Position Y denominator cannot be zero".to_string(),
                    context: Some("Fixed-point denominators must be non-zero".to_string()),
                });
            }

            // Validate Fixed-point denominators for jump_force and move_speed
            if character.jump_force[1] == 0 {
                errors.push(ValidationError {
                    field: format!("characters[{}].jump_force[1]", char_idx),
                    message: "Jump force denominator cannot be zero".to_string(),
                    context: Some("Fixed-point denominators must be non-zero".to_string()),
                });
            }
            if character.move_speed[1] == 0 {
                errors.push(ValidationError {
                    field: format!("characters[{}].move_speed[1]", char_idx),
                    message: "Move speed denominator cannot be zero".to_string(),
                    context: Some("Fixed-point denominators must be non-zero".to_string()),
                });
            }

            // Validate target_type when target_id is set
            if character.target_id.is_some() && character.target_type == 0 {
                errors.push(ValidationError {
                    field: format!("characters[{}].target_type", char_idx),
                    message: "Target type must be specified when target_id is set".to_string(),
                    context: Some("target_type cannot be 0 when target_id is Some".to_string()),
                });
            }

            // Validate character behavior references
            for (behavior_idx, &[condition_id, action_id]) in character.behaviors.iter().enumerate()
            {
                if condition_id >= self.conditions.len() {
                    errors.push(ValidationError {
                        field: format!("characters[{}].behaviors[{}]", char_idx, behavior_idx),
                        message: "Condition ID references non-existent condition".to_string(),
                        context: Some(format!("Condition ID {} not found", condition_id)),
                    });
                }
                if action_id >= self.actions.len() {
                    errors.push(ValidationError {
                        field: format!("characters[{}].behaviors[{}]", char_idx, behavior_idx),
                        message: "Action ID references non-existent action".to_string(),
                        context: Some(format!("Action ID {} not found", action_id)),
                    });
                }
            }
        }

        // Validate spawn references in actions
        for (action_idx, action) in self.actions.iter().enumerate() {
            for (spawn_idx, &spawn_id) in action.spawns.iter().enumerate() {
                if spawn_id != 0 && (spawn_id as usize) >= self.spawns.len() {
                    errors.push(ValidationError {
                        field: format!("actions[{}].spawns[{}]", action_idx, spawn_idx),
                        message: "Spawn ID references non-existent spawn".to_string(),
                        context: Some(format!("Spawn ID {} not found", spawn_id)),
                    });
                }
            }
        }

        // Validate spawn references in status effects
        for (status_idx, status_effect) in self.status_effects.iter().enumerate() {
            for (spawn_idx, &spawn_id) in status_effect.spawns.iter().enumerate() {
                if spawn_id != 0 && (spawn_id as usize) >= self.spawns.len() {
                    errors.push(ValidationError {
                        field: format!("status_effects[{}].spawns[{}]", status_idx, spawn_idx),
                        message: "Spawn ID references non-existent spawn".to_string(),
                        context: Some(format!("Spawn ID {} not found", spawn_id)),
                    });
                }
            }
        }

        // Validate spawn definition properties
        for (spawn_idx, spawn) in self.spawns.iter().enumerate() {
            // Validate element values
            if let Some(element) = spawn.element {
                if element > 8 {
                    errors.push(ValidationError {
                        field: format!("spawns[{}].element", spawn_idx),
                        message: "Element value must be between 0 and 8".to_string(),
                        context: Some(format!("Found element value {}", element)),
                    });
                }
            }
        }

        if errors.is_empty() {
            Ok(())
        } else {
            Err(errors)
        }
    }
}

/// Helper functions for converting JSON types to game engine types
impl From<CharacterDefinitionJson> for Character {
    fn from(json: CharacterDefinitionJson) -> Self {
        let mut character = Character::new(json.id, json.group);

        // Set position using Fixed-point conversion from numerator/denominator
        character.core.pos = (
            Fixed::from_num(json.position[0][0]) / Fixed::from_num(json.position[0][1]),
            Fixed::from_num(json.position[1][0]) / Fixed::from_num(json.position[1][1]),
        );

        // Set updated properties
        character.health = json.health;
        character.health_cap = json.health_cap;
        character.energy = json.energy;
        character.energy_cap = json.energy_cap;
        character.power = json.power;
        character.weight = json.weight;
        character.jump_force =
            Fixed::from_num(json.jump_force[0]) / Fixed::from_num(json.jump_force[1]);
        character.move_speed =
            Fixed::from_num(json.move_speed[0]) / Fixed::from_num(json.move_speed[1]);
        character.armor = json.armor;
        character.energy_regen = json.energy_regen;
        character.energy_regen_rate = json.energy_regen_rate;
        character.energy_charge = json.energy_charge;
        character.energy_charge_rate = json.energy_charge_rate;

        // Set EntityCore properties
        character.core.size = (json.size[0], json.size[1]);
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

impl From<ActionDefinitionJson> for ActionDefinition {
    fn from(json: ActionDefinitionJson) -> Self {
        ActionDefinition {
            energy_cost: json.energy_cost,
            cooldown: json.cooldown,
            args: json.args,
            spawns: json.spawns,
            script: json.script,
        }
    }
}

impl From<ConditionDefinitionJson> for ConditionDefinition {
    fn from(json: ConditionDefinitionJson) -> Self {
        ConditionDefinition {
            energy_mul: Fixed::from_raw(json.energy_mul), // Convert integer to fixed-point
            args: json.args,
            script: json.script,
        }
    }
}

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
            size: (json.size[0], json.size[1]),
            args: json.args,
            spawns: json.spawns,
            behavior_script: json.behavior_script,
            collision_script: json.collision_script,
            despawn_script: json.despawn_script,
        }
    }
}

impl From<StatusEffectDefinitionJson> for StatusEffectDefinition {
    fn from(json: StatusEffectDefinitionJson) -> Self {
        StatusEffectDefinition {
            duration: json.duration,
            stack_limit: json.stack_limit,
            reset_on_stack: json.reset_on_stack,
            chance: json.chance,
            args: json.args,
            spawns: json.spawns,
            on_script: json.on_script,
            tick_script: json.tick_script,
            off_script: json.off_script,
        }
    }
}

/// Helper function to convert tilemap from JSON format to game engine format
pub fn convert_tilemap(json_tilemap: &[Vec<u8>]) -> Result<[[u8; 16]; 15], ValidationError> {
    if json_tilemap.len() != 15 {
        return Err(ValidationError {
            field: "tilemap".to_string(),
            message: "Tilemap must have exactly 15 rows".to_string(),
            context: Some(format!("Found {} rows", json_tilemap.len())),
        });
    }

    let mut tilemap = [[0u8; 16]; 15];

    for (row_idx, row) in json_tilemap.iter().enumerate() {
        if row.len() != 16 {
            return Err(ValidationError {
                field: "tilemap".to_string(),
                message: format!("Row {} must have exactly 16 columns", row_idx),
                context: Some(format!("Found {} columns", row.len())),
            });
        }

        for (col_idx, &value) in row.iter().enumerate() {
            tilemap[row_idx][col_idx] = value;
        }
    }

    Ok(tilemap)
}
/// JSON-compatible game state representation for serialization
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct GameStateJson {
    pub frame: u16,
    pub seed: u16,
    pub gravity: [i16; 2], // Gravity as [numerator, denominator]
    pub status: String,
    pub characters: Vec<CharacterStateJson>,
    pub spawns: Vec<SpawnStateJson>,
    pub status_effects: Vec<StatusEffectStateJson>,
    pub tilemap: Vec<Vec<u8>>,
}

/// JSON-compatible character state representation
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct CharacterStateJson {
    pub id: u8,
    pub group: u8,
    pub position: [[i16; 2]; 2], // [[x_num, x_den], [y_num, y_den]]
    pub velocity: [[i16; 2]; 2], // [[vx_num, vx_den], [vy_num, vy_den]]
    pub health: u16,             // Updated from u8 to u16
    pub health_cap: u16,         // New property
    pub energy: u8,
    pub energy_cap: u8,       // New property
    pub power: u8,            // New property
    pub weight: u8,           // New property
    pub jump_force: [i16; 2], // New property [numerator, denominator]
    pub move_speed: [i16; 2], // New property [numerator, denominator]
    pub armor: [u8; 9],
    pub energy_regen: u8,
    pub energy_regen_rate: u8,
    pub energy_charge: u8,
    pub energy_charge_rate: u8,
    pub dir: [u8; 2],          // Replaces facing and gravity_dir
    pub enmity: u8,            // New property
    pub target_id: Option<u8>, // New property
    pub target_type: u8,       // New property
    pub size: [u8; 2],
    pub collision: [bool; 4], // [top, right, bottom, left]
    pub locked_action: Option<u8>,
    pub status_effects: Vec<u8>,
    pub behaviors: Vec<[usize; 2]>, // [condition_id, action_id] pairs
}

/// JSON-compatible spawn instance state representation
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct SpawnStateJson {
    pub id: u8,
    pub spawn_id: u8,
    pub owner_id: u8,            // Now supports EntityId type
    pub owner_type: u8,          // New property (1=Character, 2=Spawn)
    pub position: [[i16; 2]; 2], // [[x_num, x_den], [y_num, y_den]]
    pub velocity: [[i16; 2]; 2], // [[vx_num, vx_den], [vy_num, vy_den]]
    pub health: u16,             // New property
    pub health_cap: u16,         // New property
    pub rotation: [i16; 2],      // New property [numerator, denominator]
    pub life_span: u16,          // Renamed from lifespan
    pub element: Option<u8>,     // Element as u8 value (0-8)
    pub dir: [u8; 2],            // Replaces facing and gravity_dir
    pub enmity: u8,              // New property
    pub target_id: Option<u8>,   // New property
    pub target_type: u8,         // New property
    pub size: [u8; 2],
    pub collision: [bool; 4],         // [top, right, bottom, left]
    pub runtime_vars: [u8; 4],        // Renamed from vars
    pub runtime_fixed: [[i16; 2]; 4], // Renamed from fixed, [numerator, denominator] pairs
}

/// JSON-compatible status effect instance state representation
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct StatusEffectStateJson {
    pub instance_id: u8,
    pub definition_id: usize,
    pub life_span: u16, // Renamed from remaining_duration
    pub stack_count: u8,
    pub runtime_vars: [u8; 4],        // Renamed from vars
    pub runtime_fixed: [[i16; 2]; 4], // Renamed from fixed, [numerator, denominator] pairs
}

impl GameStateJson {
    /// Convert from game engine GameState to JSON-compatible representation
    pub fn from_game_state(game_state: &robot_masters_engine::state::GameState) -> Self {
        // Convert tilemap to nested Vec format by reconstructing from get_tile method
        let mut tilemap: Vec<Vec<u8>> = Vec::with_capacity(15);
        for y in 0..15 {
            let mut row: Vec<u8> = Vec::with_capacity(16);
            for x in 0..16 {
                let tile_type = game_state.tile_map.get_tile(x, y);
                row.push(match tile_type {
                    robot_masters_engine::physics::TileType::Empty => 0,
                    robot_masters_engine::physics::TileType::Block => 1,
                });
            }
            tilemap.push(row);
        }

        Self {
            frame: game_state.frame,
            seed: game_state.seed,
            gravity: [game_state.gravity.numer(), game_state.gravity.denom()],
            status: match game_state.status {
                robot_masters_engine::state::GameStatus::Playing => "playing".to_string(),
                robot_masters_engine::state::GameStatus::Ended => "ended".to_string(),
            },
            characters: game_state
                .characters
                .iter()
                .map(CharacterStateJson::from_character)
                .collect(),
            spawns: game_state
                .spawn_instances
                .iter()
                .map(SpawnStateJson::from_spawn_instance)
                .collect(),
            status_effects: game_state
                .status_effect_instances
                .iter()
                .enumerate()
                .map(|(index, instance)| {
                    StatusEffectStateJson::from_status_effect_instance(instance, index as u8)
                })
                .collect(),
            tilemap,
        }
    }
}

impl CharacterStateJson {
    /// Convert from game engine Character to JSON-compatible representation
    pub fn from_character(character: &robot_masters_engine::entity::Character) -> Self {
        Self {
            id: character.core.id,
            group: character.core.group,
            position: [
                Self::fixed_to_numer_denom(character.core.pos.0),
                Self::fixed_to_numer_denom(character.core.pos.1),
            ],
            velocity: [
                Self::fixed_to_numer_denom(character.core.vel.0),
                Self::fixed_to_numer_denom(character.core.vel.1),
            ],
            health: character.health,
            health_cap: character.health_cap,
            energy: character.energy,
            energy_cap: character.energy_cap,
            power: character.power,
            weight: character.weight,
            jump_force: Self::fixed_to_numer_denom(character.jump_force),
            move_speed: Self::fixed_to_numer_denom(character.move_speed),
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

    /// Convert Fixed-point value to [numerator, denominator] representation
    fn fixed_to_numer_denom(fixed: Fixed) -> [i16; 2] {
        [fixed.numer(), fixed.denom()]
    }
}

impl SpawnStateJson {
    /// Convert from game engine SpawnInstance to JSON-compatible representation
    pub fn from_spawn_instance(spawn: &robot_masters_engine::entity::SpawnInstance) -> Self {
        Self {
            id: spawn.core.id,
            spawn_id: spawn.spawn_id,
            owner_id: spawn.owner_id,
            owner_type: spawn.owner_type,
            position: [
                Self::fixed_to_numer_denom(spawn.core.pos.0),
                Self::fixed_to_numer_denom(spawn.core.pos.1),
            ],
            velocity: [
                Self::fixed_to_numer_denom(spawn.core.vel.0),
                Self::fixed_to_numer_denom(spawn.core.vel.1),
            ],
            health: spawn.health,
            health_cap: spawn.health_cap,
            rotation: Self::fixed_to_numer_denom(spawn.rotation),
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
                Self::fixed_to_numer_denom(spawn.runtime_fixed[0]),
                Self::fixed_to_numer_denom(spawn.runtime_fixed[1]),
                Self::fixed_to_numer_denom(spawn.runtime_fixed[2]),
                Self::fixed_to_numer_denom(spawn.runtime_fixed[3]),
            ],
        }
    }

    /// Convert Fixed-point value to [numerator, denominator] representation
    fn fixed_to_numer_denom(fixed: Fixed) -> [i16; 2] {
        [fixed.numer(), fixed.denom()]
    }
}

impl StatusEffectStateJson {
    /// Convert from game engine StatusEffectInstance to JSON-compatible representation
    pub fn from_status_effect_instance(
        instance: &robot_masters_engine::entity::StatusEffectInstance,
        instance_id: u8,
    ) -> Self {
        Self {
            instance_id,
            definition_id: instance.definition_id,
            life_span: instance.life_span, // Renamed from remaining_duration
            stack_count: instance.stack_count,
            runtime_vars: instance.runtime_vars, // Renamed from vars
            runtime_fixed: [
                // Renamed from fixed, [numerator, denominator] pairs
                Self::fixed_to_numer_denom(instance.runtime_fixed[0]),
                Self::fixed_to_numer_denom(instance.runtime_fixed[1]),
                Self::fixed_to_numer_denom(instance.runtime_fixed[2]),
                Self::fixed_to_numer_denom(instance.runtime_fixed[3]),
            ],
        }
    }

    /// Convert Fixed-point value to [numerator, denominator] representation
    fn fixed_to_numer_denom(fixed: Fixed) -> [i16; 2] {
        [fixed.numer(), fixed.denom()]
    }
}
