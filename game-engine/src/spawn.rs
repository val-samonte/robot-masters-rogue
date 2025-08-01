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
                if var_index < engine.vars.len() {
                    engine.vars[var_index] = (self.spawn_def.damage_base & 0xFF) as u8;
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
            property_address::SPAWN_INST_LIFESPAN => {
                if var_index < engine.fixed.len() {
                    engine.fixed[var_index] = Fixed::from_int(self.spawn_instance.life_span as i16);
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
            property_address::ENTITY_FACING => {
                if var_index < engine.fixed.len() {
                    engine.fixed[var_index] = self.spawn_instance.core.get_facing();
                }
            }
            property_address::ENTITY_GRAVITY_DIR => {
                if var_index < engine.fixed.len() {
                    engine.fixed[var_index] = self.spawn_instance.core.get_gravity_dir();
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
            property_address::SPAWN_INST_LIFESPAN => {
                if var_index < engine.fixed.len() {
                    self.spawn_instance.life_span = engine.fixed[var_index].to_int() as u16;
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
            property_address::ENTITY_FACING => {
                if var_index < engine.fixed.len() {
                    self.spawn_instance.core.set_facing(engine.fixed[var_index]);
                }
            }
            property_address::ENTITY_GRAVITY_DIR => {
                if var_index < engine.fixed.len() {
                    self.spawn_instance
                        .core
                        .set_gravity_dir(engine.fixed[var_index]);
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
