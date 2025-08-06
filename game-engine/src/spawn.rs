//! Spawn system for projectiles and temporary objects

use crate::{
    entity::{Element, SpawnDefinition, SpawnInstance},
    math::Fixed,
    script::{ScriptContext, ScriptEngine, ScriptError},
    state::GameState,
};

extern crate alloc;
use alloc::vec::Vec;

/// Script context for spawn behavior execution
pub struct SpawnBehaviorContext<'a> {
    pub game_state: &'a mut GameState,
    pub spawn_instance: &'a mut SpawnInstance,
    pub spawn_def: &'a SpawnDefinition,
    pub to_spawn: &'a mut Vec<SpawnInstance>,
}

impl SpawnDefinition {
    /// Create a new spawn definition from definition data
    pub fn from_def(props: Vec<u16>) -> Self {
        if props.len() < 4 {
            return Self {
                damage_base: 0,
                damage_range: 0,
                crit_chance: 0,
                crit_multiplier: 100,
                health_cap: 1,
                duration: 60,
                element: None,
                chance: 100,
                size: (16, 16), // Default size
                args: [0; 8],
                spawns: [0; 4],
                behavior_script: Vec::new(),
                collision_script: Vec::new(),
                despawn_script: Vec::new(),
            };
        }

        let damage_base = props[0];
        let health_cap = props[1] as u8;
        let duration = props[2];
        let element = if props[3] < 8 {
            Element::from_u8(props[3] as u8)
        } else {
            None
        };

        Self {
            damage_base,
            damage_range: 0,
            crit_chance: 0,
            crit_multiplier: 100,
            health_cap,
            duration,
            element,
            chance: 100,
            size: (16, 16), // Default size
            args: [0; 8],
            spawns: [0; 4],
            behavior_script: Vec::new(),
            collision_script: Vec::new(),
            despawn_script: Vec::new(),
        }
    }

    /// Create a spawn instance from this definition
    pub fn create_instance(
        &self,
        spawn_id: u8,
        owner_id: u8,
        pos: (Fixed, Fixed),
        vars: Option<[u8; 4]>,
    ) -> SpawnInstance {
        let mut instance = if let Some(element) = self.element {
            SpawnInstance::with_element(spawn_id, owner_id, pos, element)
        } else {
            SpawnInstance::new(spawn_id, owner_id, pos)
        };

        // Set size from definition
        instance.core.size = self.size;
        instance.life_span = self.duration;
        if let Some(vars) = vars {
            instance.runtime_vars = vars;
        }
        // Initialize fixed array independently (not from definition)
        instance.runtime_fixed = [Fixed::ZERO; 4];

        instance
    }

    /// Execute behavior script for spawn movement and logic
    pub fn execute_behavior_script(
        &self,
        game_state: &mut GameState,
        spawn_instance: &mut SpawnInstance,
        to_spawn: &mut Vec<SpawnInstance>,
    ) -> Result<u8, ScriptError> {
        if self.behavior_script.is_empty() {
            return Ok(0);
        }

        let mut engine = ScriptEngine::new_with_args_and_spawns(self.args, self.spawns);
        let mut context = SpawnBehaviorContext {
            game_state,
            spawn_instance,
            spawn_def: self,
            to_spawn,
        };

        engine.execute(&self.behavior_script, &mut context)
    }

    /// Execute collision script when spawn hits a target
    pub fn execute_collision_script(
        &self,
        game_state: &mut GameState,
        spawn_instance: &mut SpawnInstance,
        to_spawn: &mut Vec<SpawnInstance>,
        _target_id: u8,
        _element_damage: u8,
    ) -> Result<u8, ScriptError> {
        if self.collision_script.is_empty() {
            return Ok(0);
        }

        let mut engine = ScriptEngine::new_with_args_and_spawns(self.args, self.spawns);
        let mut context = SpawnBehaviorContext {
            game_state,
            spawn_instance,
            spawn_def: self,
            to_spawn,
        };

        engine.execute(&self.collision_script, &mut context)
    }

    /// Execute despawn script when spawn is removed
    pub fn execute_despawn_script(
        &self,
        game_state: &mut GameState,
        spawn_instance: &mut SpawnInstance,
        to_spawn: &mut Vec<SpawnInstance>,
    ) -> Result<u8, ScriptError> {
        if self.despawn_script.is_empty() {
            return Ok(0);
        }

        let mut engine = ScriptEngine::new_with_args_and_spawns(self.args, self.spawns);
        let mut context = SpawnBehaviorContext {
            game_state,
            spawn_instance,
            spawn_def: self,
            to_spawn,
        };

        engine.execute(&self.despawn_script, &mut context)
    }
}

impl ScriptContext for SpawnBehaviorContext<'_> {
    fn read_property(&mut self, engine: &mut ScriptEngine, var_index: usize, prop_address: u8) {
        use crate::constants::property_address;

        match prop_address {
            // Game state properties
            property_address::GAME_SEED => {
                if var_index < engine.fixed.len() {
                    engine.fixed[var_index] = Fixed::from_int(self.game_state.seed as i16);
                }
            }

            // Spawn definition properties (read from definition)
            property_address::SPAWN_DEF_DAMAGE_BASE => {
                if var_index < engine.fixed.len() {
                    engine.fixed[var_index] = Fixed::from_int(self.spawn_def.damage_base as i16);
                }
            }
            property_address::SPAWN_DEF_DAMAGE_RANGE => {
                if var_index < engine.fixed.len() {
                    engine.fixed[var_index] = Fixed::from_int(self.spawn_def.damage_range as i16);
                }
            }
            property_address::SPAWN_DEF_CRIT_CHANCE => {
                if var_index < engine.vars.len() {
                    engine.vars[var_index] = self.spawn_def.crit_chance;
                }
            }
            property_address::SPAWN_DEF_CRIT_MULTIPLIER => {
                if var_index < engine.vars.len() {
                    engine.vars[var_index] = self.spawn_def.crit_multiplier;
                }
            }
            property_address::SPAWN_DEF_CHANCE => {
                if var_index < engine.vars.len() {
                    engine.vars[var_index] = self.spawn_def.chance;
                }
            }
            property_address::SPAWN_DEF_HEALTH_CAP => {
                if var_index < engine.vars.len() {
                    engine.vars[var_index] = self.spawn_def.health_cap;
                }
            }
            property_address::SPAWN_DEF_DURATION => {
                if var_index < engine.fixed.len() {
                    engine.fixed[var_index] = Fixed::from_int(self.spawn_def.duration as i16);
                }
            }
            property_address::SPAWN_DEF_ELEMENT => {
                if var_index < engine.vars.len() {
                    engine.vars[var_index] = self.spawn_def.element.map_or(255, |e| e as u8);
                }
            }
            property_address::SPAWN_DEF_ARG0
            | property_address::SPAWN_DEF_ARG1
            | property_address::SPAWN_DEF_ARG2
            | property_address::SPAWN_DEF_ARG3 => {
                if var_index < engine.vars.len() {
                    let arg_index = (prop_address - property_address::SPAWN_DEF_ARG0) as usize;
                    if arg_index < self.spawn_def.args.len() {
                        engine.vars[var_index] = self.spawn_def.args[arg_index];
                    }
                }
            }

            // Spawn instance properties (read from instance)
            property_address::SPAWN_INST_VAR0
            | property_address::SPAWN_INST_VAR1
            | property_address::SPAWN_INST_VAR2
            | property_address::SPAWN_INST_VAR3 => {
                if var_index < engine.vars.len() {
                    let var_idx = (prop_address - property_address::SPAWN_INST_VAR0) as usize;
                    if var_idx < self.spawn_instance.runtime_vars.len() {
                        engine.vars[var_index] = self.spawn_instance.runtime_vars[var_idx];
                    }
                }
            }
            property_address::SPAWN_INST_FIXED0
            | property_address::SPAWN_INST_FIXED1
            | property_address::SPAWN_INST_FIXED2
            | property_address::SPAWN_INST_FIXED3 => {
                if var_index < engine.fixed.len() {
                    let fixed_idx = (prop_address - property_address::SPAWN_INST_FIXED0) as usize;
                    if fixed_idx < self.spawn_instance.runtime_fixed.len() {
                        engine.fixed[var_index] = self.spawn_instance.runtime_fixed[fixed_idx];
                    }
                }
            }
            property_address::SPAWN_INST_LIFE_SPAN => {
                if var_index < engine.fixed.len() {
                    engine.fixed[var_index] = Fixed::from_int(self.spawn_instance.life_span as i16);
                }
            }
            property_address::SPAWN_INST_HEALTH => {
                if var_index < engine.fixed.len() {
                    engine.fixed[var_index] = Fixed::from_int(self.spawn_instance.health as i16);
                }
            }
            property_address::SPAWN_INST_HEALTH_CAP => {
                if var_index < engine.fixed.len() {
                    engine.fixed[var_index] =
                        Fixed::from_int(self.spawn_instance.health_cap as i16);
                }
            }
            property_address::SPAWN_INST_ROTATION => {
                if var_index < engine.fixed.len() {
                    engine.fixed[var_index] = self.spawn_instance.rotation;
                }
            }
            property_address::SPAWN_INST_ELEMENT => {
                if var_index < engine.vars.len() {
                    engine.vars[var_index] = self.spawn_instance.element as u8;
                }
            }

            // Spawn core properties
            property_address::SPAWN_CORE_ID => {
                if var_index < engine.vars.len() {
                    engine.vars[var_index] = self.spawn_instance.core.id;
                }
            }
            property_address::SPAWN_OWNER_ID => {
                if var_index < engine.vars.len() {
                    engine.vars[var_index] = self.spawn_instance.owner_id;
                }
            }
            property_address::SPAWN_OWNER_TYPE => {
                if var_index < engine.vars.len() {
                    engine.vars[var_index] = self.spawn_instance.owner_type;
                }
            }
            property_address::SPAWN_POS_X => {
                if var_index < engine.fixed.len() {
                    engine.fixed[var_index] = self.spawn_instance.core.pos.0;
                }
            }
            property_address::SPAWN_POS_Y => {
                if var_index < engine.fixed.len() {
                    engine.fixed[var_index] = self.spawn_instance.core.pos.1;
                }
            }
            property_address::SPAWN_VEL_X => {
                if var_index < engine.fixed.len() {
                    engine.fixed[var_index] = self.spawn_instance.core.vel.0;
                }
            }
            property_address::SPAWN_VEL_Y => {
                if var_index < engine.fixed.len() {
                    engine.fixed[var_index] = self.spawn_instance.core.vel.1;
                }
            }

            // Entity direction properties
            property_address::ENTITY_DIR_HORIZONTAL => {
                if var_index < engine.vars.len() {
                    engine.vars[var_index] = self.spawn_instance.core.dir.0;
                }
            }
            property_address::ENTITY_DIR_VERTICAL => {
                if var_index < engine.vars.len() {
                    engine.vars[var_index] = self.spawn_instance.core.dir.1;
                }
            }

            _ => {
                // Property not supported in spawn context
            }
        }
    }

    fn write_property(&mut self, engine: &mut ScriptEngine, prop_address: u8, var_index: usize) {
        use crate::constants::property_address;

        match prop_address {
            // Spawn instance properties (writable)
            property_address::SPAWN_INST_VAR0
            | property_address::SPAWN_INST_VAR1
            | property_address::SPAWN_INST_VAR2
            | property_address::SPAWN_INST_VAR3 => {
                if var_index < engine.vars.len() {
                    let var_idx = (prop_address - property_address::SPAWN_INST_VAR0) as usize;
                    if var_idx < self.spawn_instance.runtime_vars.len() {
                        self.spawn_instance.runtime_vars[var_idx] = engine.vars[var_index];
                    }
                }
            }
            property_address::SPAWN_INST_FIXED0
            | property_address::SPAWN_INST_FIXED1
            | property_address::SPAWN_INST_FIXED2
            | property_address::SPAWN_INST_FIXED3 => {
                if var_index < engine.fixed.len() {
                    let fixed_idx = (prop_address - property_address::SPAWN_INST_FIXED0) as usize;
                    if fixed_idx < self.spawn_instance.runtime_fixed.len() {
                        self.spawn_instance.runtime_fixed[fixed_idx] = engine.fixed[var_index];
                    }
                }
            }
            property_address::SPAWN_INST_LIFE_SPAN => {
                if var_index < engine.fixed.len() {
                    self.spawn_instance.life_span = engine.fixed[var_index].to_int() as u16;
                }
            }
            property_address::SPAWN_INST_HEALTH => {
                if var_index < engine.fixed.len() {
                    self.spawn_instance.health = engine.fixed[var_index].to_int().max(0) as u16;
                }
            }
            property_address::SPAWN_INST_HEALTH_CAP => {
                if var_index < engine.fixed.len() {
                    self.spawn_instance.health_cap = engine.fixed[var_index].to_int().max(0) as u16;
                }
            }
            property_address::SPAWN_INST_ROTATION => {
                if var_index < engine.fixed.len() {
                    self.spawn_instance.rotation = engine.fixed[var_index];
                }
            }
            property_address::SPAWN_INST_ELEMENT => {
                if var_index < engine.vars.len() {
                    if let Some(element) = crate::entity::Element::from_u8(engine.vars[var_index]) {
                        self.spawn_instance.element = element;
                    }
                }
            }

            // Spawn core properties (writable)
            property_address::SPAWN_POS_X => {
                if var_index < engine.fixed.len() {
                    self.spawn_instance.core.pos.0 = engine.fixed[var_index];
                }
            }
            property_address::SPAWN_POS_Y => {
                if var_index < engine.fixed.len() {
                    self.spawn_instance.core.pos.1 = engine.fixed[var_index];
                }
            }
            property_address::SPAWN_VEL_X => {
                if var_index < engine.fixed.len() {
                    self.spawn_instance.core.vel.0 = engine.fixed[var_index];
                }
            }
            property_address::SPAWN_VEL_Y => {
                if var_index < engine.fixed.len() {
                    self.spawn_instance.core.vel.1 = engine.fixed[var_index];
                }
            }

            // Entity direction properties (writable)
            property_address::ENTITY_DIR_HORIZONTAL => {
                if var_index < engine.vars.len() {
                    self.spawn_instance.core.dir.0 = engine.vars[var_index];
                }
            }
            property_address::ENTITY_DIR_VERTICAL => {
                if var_index < engine.vars.len() {
                    self.spawn_instance.core.dir.1 = engine.vars[var_index];
                }
            }

            _ => {
                // Property not writable or not supported in spawn context
            }
        }
    }

    fn get_energy_requirement(&self) -> u8 {
        0
    }
    fn get_current_energy(&self) -> u8 {
        255
    }
    fn is_on_cooldown(&self) -> bool {
        false
    }
    fn is_grounded(&self) -> bool {
        // Spawns don't have grounding concept, always return false
        false
    }
    fn get_random_u8(&mut self) -> u8 {
        self.game_state.next_random_u8()
    }
    fn lock_action(&mut self) {}
    fn unlock_action(&mut self) {}
    fn apply_energy_cost(&mut self) {}
    fn apply_duration(&mut self) {}

    fn create_spawn(&mut self, spawn_id: usize, vars: Option<[u8; 4]>) {
        // Validate spawn definition exists
        // Safe spawn definition lookup with error handling
        let spawn_def = match self.game_state.safe_get_spawn_definition(spawn_id) {
            Ok(def) => def,
            Err(_) => {
                // Spawn definition not found - skip spawn creation silently
                return;
            }
        };

        let mut new_spawn = SpawnInstance::new(
            spawn_id as u8,
            self.spawn_instance.owner_id,
            self.spawn_instance.core.pos,
        );

        // Set spawn variables if provided
        if let Some(spawn_vars) = vars {
            new_spawn.runtime_vars = spawn_vars;
        }

        // Set properties from spawn definition
        new_spawn.life_span = spawn_def.duration;
        new_spawn.element = spawn_def.element.unwrap_or(crate::entity::Element::Punct);

        self.to_spawn.push(new_spawn);
    }

    fn log_debug(&self, _message: &str) {}

    fn read_action_cooldown(&self, _engine: &mut ScriptEngine, _var_index: usize) {
        // Spawns don't have access to action cooldown data
    }

    fn read_action_last_used(&self, _engine: &mut ScriptEngine, _var_index: usize) {
        // Spawns don't have access to action last used data
    }

    fn write_action_last_used(&mut self, _engine: &mut ScriptEngine, _var_index: usize) {
        // Spawns can't modify action last used data
    }

    fn read_character_property_impl(
        &mut self,
        engine: &mut ScriptEngine,
        character_id: u8,
        var_index: usize,
        property_address: u8,
    ) {
        use crate::constants::property_address;

        // Validate character ID
        if character_id as usize >= self.game_state.characters.len() {
            return; // Invalid character ID - silent failure
        }

        let character = &self.game_state.characters[character_id as usize];

        match property_address {
            // Character core properties
            property_address::CHARACTER_ID => {
                if var_index < engine.vars.len() {
                    engine.vars[var_index] = character.core.id;
                }
            }
            property_address::CHARACTER_GROUP => {
                if var_index < engine.vars.len() {
                    engine.vars[var_index] = character.core.group;
                }
            }
            property_address::CHARACTER_POS_X => {
                if var_index < engine.fixed.len() {
                    engine.fixed[var_index] = character.core.pos.0;
                }
            }
            property_address::CHARACTER_POS_Y => {
                if var_index < engine.fixed.len() {
                    engine.fixed[var_index] = character.core.pos.1;
                }
            }
            property_address::CHARACTER_VEL_X => {
                if var_index < engine.fixed.len() {
                    engine.fixed[var_index] = character.core.vel.0;
                }
            }
            property_address::CHARACTER_VEL_Y => {
                if var_index < engine.fixed.len() {
                    engine.fixed[var_index] = character.core.vel.1;
                }
            }
            property_address::CHARACTER_SIZE_W => {
                if var_index < engine.fixed.len() {
                    engine.fixed[var_index] = Fixed::from_int(character.core.size.0 as i16);
                }
            }
            property_address::CHARACTER_SIZE_H => {
                if var_index < engine.fixed.len() {
                    engine.fixed[var_index] = Fixed::from_int(character.core.size.1 as i16);
                }
            }
            property_address::CHARACTER_HEALTH => {
                if var_index < engine.fixed.len() {
                    engine.fixed[var_index] = Fixed::from_int(character.health as i16);
                }
            }
            property_address::CHARACTER_ENERGY => {
                if var_index < engine.vars.len() {
                    engine.vars[var_index] = character.energy;
                }
            }
            property_address::CHARACTER_ENERGY_CAP => {
                if var_index < engine.vars.len() {
                    engine.vars[var_index] = character.energy_cap;
                }
            }
            property_address::CHARACTER_HEALTH_CAP => {
                if var_index < engine.fixed.len() {
                    engine.fixed[var_index] = Fixed::from_int(character.health_cap as i16);
                }
            }
            property_address::CHARACTER_POWER => {
                if var_index < engine.vars.len() {
                    engine.vars[var_index] = character.power;
                }
            }
            property_address::CHARACTER_WEIGHT => {
                if var_index < engine.vars.len() {
                    engine.vars[var_index] = character.weight;
                }
            }
            property_address::CHARACTER_JUMP_FORCE => {
                if var_index < engine.fixed.len() {
                    engine.fixed[var_index] = character.jump_force;
                }
            }
            property_address::CHARACTER_MOVE_SPEED => {
                if var_index < engine.fixed.len() {
                    engine.fixed[var_index] = character.move_speed;
                }
            }
            property_address::CHARACTER_ENERGY_REGEN => {
                if var_index < engine.vars.len() {
                    engine.vars[var_index] = character.energy_regen;
                }
            }
            property_address::CHARACTER_ENERGY_REGEN_RATE => {
                if var_index < engine.vars.len() {
                    engine.vars[var_index] = character.energy_regen_rate;
                }
            }
            property_address::CHARACTER_ENERGY_CHARGE => {
                if var_index < engine.vars.len() {
                    engine.vars[var_index] = character.energy_charge;
                }
            }
            property_address::CHARACTER_ENERGY_CHARGE_RATE => {
                if var_index < engine.vars.len() {
                    engine.vars[var_index] = character.energy_charge_rate;
                }
            }
            property_address::CHARACTER_LOCKED_ACTION_ID => {
                if var_index < engine.vars.len() {
                    engine.vars[var_index] = character.locked_action.unwrap_or(255);
                }
            }
            // Character collision flags
            property_address::CHARACTER_COLLISION_TOP => {
                if var_index < engine.vars.len() {
                    engine.vars[var_index] = if character.core.collision.0 { 1 } else { 0 };
                }
            }
            property_address::CHARACTER_COLLISION_RIGHT => {
                if var_index < engine.vars.len() {
                    engine.vars[var_index] = if character.core.collision.1 { 1 } else { 0 };
                }
            }
            property_address::CHARACTER_COLLISION_BOTTOM => {
                if var_index < engine.vars.len() {
                    engine.vars[var_index] = if character.core.collision.2 { 1 } else { 0 };
                }
            }
            property_address::CHARACTER_COLLISION_LEFT => {
                if var_index < engine.vars.len() {
                    engine.vars[var_index] = if character.core.collision.3 { 1 } else { 0 };
                }
            }
            // Character status effects count
            property_address::CHARACTER_STATUS_EFFECT_COUNT => {
                if var_index < engine.vars.len() {
                    engine.vars[var_index] = character.status_effects.len().min(255) as u8;
                }
            }
            // Character armor values
            property_address::CHARACTER_ARMOR_PUNCT => {
                if var_index < engine.vars.len() {
                    engine.vars[var_index] = character.armor[0];
                }
            }
            property_address::CHARACTER_ARMOR_BLAST => {
                if var_index < engine.vars.len() {
                    engine.vars[var_index] = character.armor[1];
                }
            }
            property_address::CHARACTER_ARMOR_FORCE => {
                if var_index < engine.vars.len() {
                    engine.vars[var_index] = character.armor[2];
                }
            }
            property_address::CHARACTER_ARMOR_SEVER => {
                if var_index < engine.vars.len() {
                    engine.vars[var_index] = character.armor[3];
                }
            }
            property_address::CHARACTER_ARMOR_HEAT => {
                if var_index < engine.vars.len() {
                    engine.vars[var_index] = character.armor[4];
                }
            }
            property_address::CHARACTER_ARMOR_CRYO => {
                if var_index < engine.vars.len() {
                    engine.vars[var_index] = character.armor[5];
                }
            }
            property_address::CHARACTER_ARMOR_JOLT => {
                if var_index < engine.vars.len() {
                    engine.vars[var_index] = character.armor[6];
                }
            }
            property_address::CHARACTER_ARMOR_ACID => {
                if var_index < engine.vars.len() {
                    engine.vars[var_index] = character.armor[7];
                }
            }
            property_address::CHARACTER_ARMOR_VIRUS => {
                if var_index < engine.vars.len() {
                    engine.vars[var_index] = character.armor[8];
                }
            }
            // EntityCore properties
            property_address::ENTITY_DIR_HORIZONTAL => {
                if var_index < engine.vars.len() {
                    engine.vars[var_index] = character.core.dir.0;
                }
            }
            property_address::ENTITY_DIR_VERTICAL => {
                if var_index < engine.vars.len() {
                    engine.vars[var_index] = character.core.dir.1;
                }
            }
            property_address::ENTITY_ENMITY => {
                if var_index < engine.vars.len() {
                    engine.vars[var_index] = character.core.enmity;
                }
            }
            property_address::ENTITY_TARGET_ID => {
                if var_index < engine.vars.len() {
                    engine.vars[var_index] = character.core.target_id.unwrap_or(255);
                }
            }
            property_address::ENTITY_TARGET_TYPE => {
                if var_index < engine.vars.len() {
                    engine.vars[var_index] = character.core.target_type;
                }
            }
            _ => {} // Property not supported or invalid
        }
    }

    fn write_character_property_impl(
        &mut self,
        engine: &mut ScriptEngine,
        character_id: u8,
        property_address: u8,
        var_index: usize,
    ) {
        use crate::constants::property_address;

        // Validate character ID
        if character_id as usize >= self.game_state.characters.len() {
            return; // Invalid character ID - silent failure
        }

        let character = &mut self.game_state.characters[character_id as usize];

        match property_address {
            // Character core properties (writable)
            property_address::CHARACTER_POS_X => {
                if var_index < engine.fixed.len() {
                    character.core.pos.0 = engine.fixed[var_index];
                }
            }
            property_address::CHARACTER_POS_Y => {
                if var_index < engine.fixed.len() {
                    character.core.pos.1 = engine.fixed[var_index];
                }
            }
            property_address::CHARACTER_VEL_X => {
                if var_index < engine.fixed.len() {
                    character.core.vel.0 = engine.fixed[var_index];
                }
            }
            property_address::CHARACTER_VEL_Y => {
                if var_index < engine.fixed.len() {
                    character.core.vel.1 = engine.fixed[var_index];
                }
            }
            property_address::CHARACTER_HEALTH => {
                if var_index < engine.fixed.len() {
                    character.health = engine.fixed[var_index].to_int().max(0) as u16;
                }
            }
            property_address::CHARACTER_ENERGY => {
                if var_index < engine.vars.len() {
                    character.energy = engine.vars[var_index];
                }
            }
            property_address::CHARACTER_ENERGY_CAP => {
                if var_index < engine.vars.len() {
                    character.energy_cap = engine.vars[var_index];
                }
            }
            property_address::CHARACTER_HEALTH_CAP => {
                if var_index < engine.fixed.len() {
                    character.health_cap = engine.fixed[var_index].to_int().max(0) as u16;
                }
            }
            property_address::CHARACTER_POWER => {
                if var_index < engine.vars.len() {
                    character.power = engine.vars[var_index];
                }
            }
            property_address::CHARACTER_WEIGHT => {
                if var_index < engine.vars.len() {
                    character.weight = engine.vars[var_index];
                }
            }
            property_address::CHARACTER_JUMP_FORCE => {
                if var_index < engine.fixed.len() {
                    character.jump_force = engine.fixed[var_index];
                }
            }
            property_address::CHARACTER_MOVE_SPEED => {
                if var_index < engine.fixed.len() {
                    character.move_speed = engine.fixed[var_index];
                }
            }
            property_address::CHARACTER_ENERGY_REGEN => {
                if var_index < engine.vars.len() {
                    character.energy_regen = engine.vars[var_index];
                }
            }
            property_address::CHARACTER_ENERGY_REGEN_RATE => {
                if var_index < engine.vars.len() {
                    character.energy_regen_rate = engine.vars[var_index];
                }
            }
            property_address::CHARACTER_ENERGY_CHARGE => {
                if var_index < engine.vars.len() {
                    character.energy_charge = engine.vars[var_index];
                }
            }
            property_address::CHARACTER_ENERGY_CHARGE_RATE => {
                if var_index < engine.vars.len() {
                    character.energy_charge_rate = engine.vars[var_index];
                }
            }
            // Character armor values (writable)
            property_address::CHARACTER_ARMOR_PUNCT => {
                if var_index < engine.vars.len() {
                    character.armor[0] = engine.vars[var_index];
                }
            }
            property_address::CHARACTER_ARMOR_BLAST => {
                if var_index < engine.vars.len() {
                    character.armor[1] = engine.vars[var_index];
                }
            }
            property_address::CHARACTER_ARMOR_FORCE => {
                if var_index < engine.vars.len() {
                    character.armor[2] = engine.vars[var_index];
                }
            }
            property_address::CHARACTER_ARMOR_SEVER => {
                if var_index < engine.vars.len() {
                    character.armor[3] = engine.vars[var_index];
                }
            }
            property_address::CHARACTER_ARMOR_HEAT => {
                if var_index < engine.vars.len() {
                    character.armor[4] = engine.vars[var_index];
                }
            }
            property_address::CHARACTER_ARMOR_CRYO => {
                if var_index < engine.vars.len() {
                    character.armor[5] = engine.vars[var_index];
                }
            }
            property_address::CHARACTER_ARMOR_JOLT => {
                if var_index < engine.vars.len() {
                    character.armor[6] = engine.vars[var_index];
                }
            }
            property_address::CHARACTER_ARMOR_ACID => {
                if var_index < engine.vars.len() {
                    character.armor[7] = engine.vars[var_index];
                }
            }
            property_address::CHARACTER_ARMOR_VIRUS => {
                if var_index < engine.vars.len() {
                    character.armor[8] = engine.vars[var_index];
                }
            }
            // EntityCore properties (writable)
            property_address::ENTITY_DIR_HORIZONTAL => {
                if var_index < engine.vars.len() {
                    character.core.dir.0 = engine.vars[var_index];
                }
            }
            property_address::ENTITY_DIR_VERTICAL => {
                if var_index < engine.vars.len() {
                    character.core.dir.1 = engine.vars[var_index];
                }
            }
            property_address::ENTITY_ENMITY => {
                if var_index < engine.vars.len() {
                    character.core.enmity = engine.vars[var_index];
                }
            }
            property_address::ENTITY_TARGET_ID => {
                if var_index < engine.vars.len() {
                    character.core.target_id = if engine.vars[var_index] == 255 {
                        None
                    } else {
                        Some(engine.vars[var_index])
                    };
                }
            }
            property_address::ENTITY_TARGET_TYPE => {
                if var_index < engine.vars.len() {
                    character.core.target_type = engine.vars[var_index];
                }
            }
            _ => {} // Property not writable or not supported
        }
    }

    fn read_spawn_property_impl(
        &mut self,
        engine: &mut ScriptEngine,
        spawn_instance_id: u8,
        var_index: usize,
        property_address: u8,
    ) {
        use crate::constants::property_address;

        // Validate spawn instance ID
        if spawn_instance_id as usize >= self.game_state.spawn_instances.len() {
            return; // Invalid spawn instance ID - silent failure
        }

        let spawn_instance = &self.game_state.spawn_instances[spawn_instance_id as usize];

        match property_address {
            // EntityCore properties
            property_address::ENTITY_DIR_HORIZONTAL => {
                if var_index < engine.vars.len() {
                    engine.vars[var_index] = spawn_instance.core.dir.0;
                }
            }
            property_address::ENTITY_DIR_VERTICAL => {
                if var_index < engine.vars.len() {
                    engine.vars[var_index] = spawn_instance.core.dir.1;
                }
            }
            property_address::ENTITY_ENMITY => {
                if var_index < engine.vars.len() {
                    engine.vars[var_index] = spawn_instance.core.enmity;
                }
            }
            property_address::ENTITY_TARGET_ID => {
                if var_index < engine.vars.len() {
                    engine.vars[var_index] = spawn_instance.core.target_id.unwrap_or(255);
                }
            }
            property_address::ENTITY_TARGET_TYPE => {
                if var_index < engine.vars.len() {
                    engine.vars[var_index] = spawn_instance.core.target_type;
                }
            }
            // Spawn core properties
            property_address::SPAWN_CORE_ID => {
                if var_index < engine.vars.len() {
                    engine.vars[var_index] = spawn_instance.core.id;
                }
            }
            property_address::SPAWN_OWNER_ID => {
                if var_index < engine.vars.len() {
                    engine.vars[var_index] = spawn_instance.owner_id;
                }
            }
            property_address::SPAWN_OWNER_TYPE => {
                if var_index < engine.vars.len() {
                    engine.vars[var_index] = spawn_instance.owner_type;
                }
            }
            property_address::SPAWN_POS_X => {
                if var_index < engine.fixed.len() {
                    engine.fixed[var_index] = spawn_instance.core.pos.0;
                }
            }
            property_address::SPAWN_POS_Y => {
                if var_index < engine.fixed.len() {
                    engine.fixed[var_index] = spawn_instance.core.pos.1;
                }
            }
            property_address::SPAWN_VEL_X => {
                if var_index < engine.fixed.len() {
                    engine.fixed[var_index] = spawn_instance.core.vel.0;
                }
            }
            property_address::SPAWN_VEL_Y => {
                if var_index < engine.fixed.len() {
                    engine.fixed[var_index] = spawn_instance.core.vel.1;
                }
            }
            // Spawn instance properties
            property_address::SPAWN_INST_HEALTH => {
                if var_index < engine.fixed.len() {
                    engine.fixed[var_index] = Fixed::from_int(spawn_instance.health as i16);
                }
            }
            property_address::SPAWN_INST_HEALTH_CAP => {
                if var_index < engine.fixed.len() {
                    engine.fixed[var_index] = Fixed::from_int(spawn_instance.health_cap as i16);
                }
            }
            property_address::SPAWN_INST_ROTATION => {
                if var_index < engine.fixed.len() {
                    engine.fixed[var_index] = spawn_instance.rotation;
                }
            }
            property_address::SPAWN_INST_LIFE_SPAN => {
                if var_index < engine.fixed.len() {
                    engine.fixed[var_index] = Fixed::from_int(spawn_instance.life_span as i16);
                }
            }
            property_address::SPAWN_INST_ELEMENT => {
                if var_index < engine.vars.len() {
                    engine.vars[var_index] = spawn_instance.element as u8;
                }
            }
            // Spawn instance runtime variables
            property_address::SPAWN_INST_VAR0
            | property_address::SPAWN_INST_VAR1
            | property_address::SPAWN_INST_VAR2
            | property_address::SPAWN_INST_VAR3 => {
                if var_index < engine.vars.len() {
                    let var_idx = (property_address - property_address::SPAWN_INST_VAR0) as usize;
                    if var_idx < spawn_instance.runtime_vars.len() {
                        engine.vars[var_index] = spawn_instance.runtime_vars[var_idx];
                    }
                }
            }
            property_address::SPAWN_INST_FIXED0
            | property_address::SPAWN_INST_FIXED1
            | property_address::SPAWN_INST_FIXED2
            | property_address::SPAWN_INST_FIXED3 => {
                if var_index < engine.fixed.len() {
                    let fixed_idx =
                        (property_address - property_address::SPAWN_INST_FIXED0) as usize;
                    if fixed_idx < spawn_instance.runtime_fixed.len() {
                        engine.fixed[var_index] = spawn_instance.runtime_fixed[fixed_idx];
                    }
                }
            }
            _ => {} // Property not supported or invalid
        }
    }

    fn write_spawn_property_impl(
        &mut self,
        engine: &mut ScriptEngine,
        spawn_instance_id: u8,
        property_address: u8,
        var_index: usize,
    ) {
        use crate::constants::property_address;

        // Validate spawn instance ID
        if spawn_instance_id as usize >= self.game_state.spawn_instances.len() {
            return; // Invalid spawn instance ID - silent failure
        }

        let spawn_instance = &mut self.game_state.spawn_instances[spawn_instance_id as usize];

        match property_address {
            // EntityCore properties (writable)
            property_address::ENTITY_DIR_HORIZONTAL => {
                if var_index < engine.vars.len() {
                    spawn_instance.core.dir.0 = engine.vars[var_index];
                }
            }
            property_address::ENTITY_DIR_VERTICAL => {
                if var_index < engine.vars.len() {
                    spawn_instance.core.dir.1 = engine.vars[var_index];
                }
            }
            property_address::ENTITY_ENMITY => {
                if var_index < engine.vars.len() {
                    spawn_instance.core.enmity = engine.vars[var_index];
                }
            }
            property_address::ENTITY_TARGET_ID => {
                if var_index < engine.vars.len() {
                    spawn_instance.core.target_id = if engine.vars[var_index] == 255 {
                        None
                    } else {
                        Some(engine.vars[var_index])
                    };
                }
            }
            property_address::ENTITY_TARGET_TYPE => {
                if var_index < engine.vars.len() {
                    spawn_instance.core.target_type = engine.vars[var_index];
                }
            }
            // Spawn core properties (writable)
            property_address::SPAWN_POS_X => {
                if var_index < engine.fixed.len() {
                    spawn_instance.core.pos.0 = engine.fixed[var_index];
                }
            }
            property_address::SPAWN_POS_Y => {
                if var_index < engine.fixed.len() {
                    spawn_instance.core.pos.1 = engine.fixed[var_index];
                }
            }
            property_address::SPAWN_VEL_X => {
                if var_index < engine.fixed.len() {
                    spawn_instance.core.vel.0 = engine.fixed[var_index];
                }
            }
            property_address::SPAWN_VEL_Y => {
                if var_index < engine.fixed.len() {
                    spawn_instance.core.vel.1 = engine.fixed[var_index];
                }
            }
            // Spawn instance properties (writable)
            property_address::SPAWN_INST_HEALTH => {
                if var_index < engine.fixed.len() {
                    spawn_instance.health = engine.fixed[var_index].to_int().max(0) as u16;
                }
            }
            property_address::SPAWN_INST_HEALTH_CAP => {
                if var_index < engine.fixed.len() {
                    spawn_instance.health_cap = engine.fixed[var_index].to_int().max(0) as u16;
                }
            }
            property_address::SPAWN_INST_ROTATION => {
                if var_index < engine.fixed.len() {
                    spawn_instance.rotation = engine.fixed[var_index];
                }
            }
            property_address::SPAWN_INST_LIFE_SPAN => {
                if var_index < engine.fixed.len() {
                    spawn_instance.life_span = engine.fixed[var_index].to_int() as u16;
                }
            }
            property_address::SPAWN_INST_ELEMENT => {
                if var_index < engine.vars.len() {
                    if let Some(element) = crate::entity::Element::from_u8(engine.vars[var_index]) {
                        spawn_instance.element = element;
                    }
                }
            }
            // Spawn instance runtime variables (writable)
            property_address::SPAWN_INST_VAR0
            | property_address::SPAWN_INST_VAR1
            | property_address::SPAWN_INST_VAR2
            | property_address::SPAWN_INST_VAR3 => {
                if var_index < engine.vars.len() {
                    let var_idx = (property_address - property_address::SPAWN_INST_VAR0) as usize;
                    if var_idx < spawn_instance.runtime_vars.len() {
                        spawn_instance.runtime_vars[var_idx] = engine.vars[var_index];
                    }
                }
            }
            property_address::SPAWN_INST_FIXED0
            | property_address::SPAWN_INST_FIXED1
            | property_address::SPAWN_INST_FIXED2
            | property_address::SPAWN_INST_FIXED3 => {
                if var_index < engine.fixed.len() {
                    let fixed_idx =
                        (property_address - property_address::SPAWN_INST_FIXED0) as usize;
                    if fixed_idx < spawn_instance.runtime_fixed.len() {
                        spawn_instance.runtime_fixed[fixed_idx] = engine.fixed[var_index];
                    }
                }
            }
            _ => {} // Property not writable or not supported
        }
    }
}

/// Process all spawn instances for one frame
pub fn process_spawn_instances(
    spawn_instances: &mut Vec<SpawnInstance>,
    spawn_definitions: &[SpawnDefinition],
    game_state: &mut GameState,
) -> Result<Vec<SpawnInstance>, ScriptError> {
    let mut to_spawn = Vec::new();
    let mut spawns_to_remove = Vec::new();

    for (index, spawn_instance) in spawn_instances.iter_mut().enumerate() {
        if let Some(spawn_def) = spawn_definitions.get(spawn_instance.spawn_id as usize) {
            spawn_def.execute_behavior_script(game_state, spawn_instance, &mut to_spawn)?;

            if spawn_instance.life_span > 0 {
                spawn_instance.life_span -= 1;
            }

            if spawn_instance.life_span == 0 {
                spawns_to_remove.push(index);
            }
        }
    }

    for &index in spawns_to_remove.iter().rev() {
        let mut removed_spawn = spawn_instances.remove(index);
        if let Some(spawn_def) = spawn_definitions.get(removed_spawn.spawn_id as usize) {
            spawn_def.execute_despawn_script(game_state, &mut removed_spawn, &mut to_spawn)?;
        }
    }

    Ok(to_spawn)
}

/// Handle collision between spawn and target
pub fn handle_spawn_collision(
    spawn_instance: &mut SpawnInstance,
    spawn_def: &SpawnDefinition,
    target_id: u8,
    target_armor: u8,
    game_state: &mut GameState,
) -> Result<(u8, Vec<SpawnInstance>), ScriptError> {
    let mut to_spawn = Vec::new();

    let element_damage = if spawn_def.damage_base > target_armor.into() {
        (spawn_def.damage_base - target_armor as u16) as u8
    } else {
        0
    };

    spawn_def.execute_collision_script(
        game_state,
        spawn_instance,
        &mut to_spawn,
        target_id,
        element_damage,
    )?;

    Ok((element_damage, to_spawn))
}
