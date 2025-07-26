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
                health_cap: 1,
                duration: 60,
                element: None,
                args: [0; 8],
                spawns: [0; 4],
                behavior_script: Vec::new(),
                collision_script: Vec::new(),
                despawn_script: Vec::new(),
            };
        }

        let damage_base = props[0] as u8;
        let health_cap = props[1] as u8;
        let duration = props[2];
        let element = if props[3] < 8 {
            Element::from_u8(props[3] as u8)
        } else {
            None
        };

        Self {
            damage_base,
            health_cap,
            duration,
            element,
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

        instance.lifespan = self.duration;
        if let Some(vars) = vars {
            instance.vars = vars;
        }
        // Initialize fixed array independently (not from definition)
        instance.fixed = [Fixed::ZERO; 4];

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

        let mut engine = ScriptEngine::new();
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

        let mut engine = ScriptEngine::new();
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

        let mut engine = ScriptEngine::new();
        let mut context = SpawnBehaviorContext {
            game_state,
            spawn_instance,
            spawn_def: self,
            to_spawn,
        };

        engine.execute(&self.despawn_script, &mut context)
    }
}

impl<'a> ScriptContext for SpawnBehaviorContext<'a> {
    fn read_property(&mut self, engine: &mut ScriptEngine, var_index: usize, prop_address: u8) {
        use crate::constants::PropertyAddress;

        if let Some(property) = PropertyAddress::from_u8(prop_address) {
            match property {
                // Game state properties
                PropertyAddress::GameSeed => {
                    if var_index < engine.fixed.len() {
                        engine.fixed[var_index] = Fixed::from_int(self.game_state.seed as i16);
                    }
                }

                // Spawn definition properties (read from definition)
                PropertyAddress::SpawnDefDamageBase => {
                    if var_index < engine.vars.len() {
                        engine.vars[var_index] = self.spawn_def.damage_base;
                    }
                }
                PropertyAddress::SpawnDefHealthCap => {
                    if var_index < engine.vars.len() {
                        engine.vars[var_index] = self.spawn_def.health_cap;
                    }
                }
                PropertyAddress::SpawnDefDuration => {
                    if var_index < engine.fixed.len() {
                        engine.fixed[var_index] = Fixed::from_int(self.spawn_def.duration as i16);
                    }
                }
                PropertyAddress::SpawnDefElement => {
                    if var_index < engine.vars.len() {
                        engine.vars[var_index] = self.spawn_def.element.map_or(255, |e| e as u8);
                    }
                }
                PropertyAddress::SpawnDefArg0
                | PropertyAddress::SpawnDefArg1
                | PropertyAddress::SpawnDefArg2
                | PropertyAddress::SpawnDefArg3 => {
                    if var_index < engine.vars.len() {
                        let arg_index =
                            (prop_address - PropertyAddress::SpawnDefArg0 as u8) as usize;
                        if arg_index < self.spawn_def.args.len() {
                            engine.vars[var_index] = self.spawn_def.args[arg_index];
                        }
                    }
                }

                // Spawn instance properties (read from instance)
                PropertyAddress::SpawnInstVar0
                | PropertyAddress::SpawnInstVar1
                | PropertyAddress::SpawnInstVar2
                | PropertyAddress::SpawnInstVar3 => {
                    if var_index < engine.vars.len() {
                        let var_idx =
                            (prop_address - PropertyAddress::SpawnInstVar0 as u8) as usize;
                        if var_idx < self.spawn_instance.vars.len() {
                            engine.vars[var_index] = self.spawn_instance.vars[var_idx];
                        }
                    }
                }
                PropertyAddress::SpawnInstFixed0
                | PropertyAddress::SpawnInstFixed1
                | PropertyAddress::SpawnInstFixed2
                | PropertyAddress::SpawnInstFixed3 => {
                    if var_index < engine.fixed.len() {
                        let fixed_idx =
                            (prop_address - PropertyAddress::SpawnInstFixed0 as u8) as usize;
                        if fixed_idx < self.spawn_instance.fixed.len() {
                            engine.fixed[var_index] = self.spawn_instance.fixed[fixed_idx];
                        }
                    }
                }
                PropertyAddress::SpawnInstLifespan => {
                    if var_index < engine.fixed.len() {
                        engine.fixed[var_index] =
                            Fixed::from_int(self.spawn_instance.lifespan as i16);
                    }
                }
                PropertyAddress::SpawnInstElement => {
                    if var_index < engine.vars.len() {
                        engine.vars[var_index] = self.spawn_instance.element as u8;
                    }
                }

                // Spawn core properties
                PropertyAddress::SpawnCoreId => {
                    if var_index < engine.vars.len() {
                        engine.vars[var_index] = self.spawn_instance.core.id;
                    }
                }
                PropertyAddress::SpawnOwnerId => {
                    if var_index < engine.vars.len() {
                        engine.vars[var_index] = self.spawn_instance.owner_id;
                    }
                }
                PropertyAddress::SpawnPosX => {
                    if var_index < engine.fixed.len() {
                        engine.fixed[var_index] = self.spawn_instance.core.pos.0;
                    }
                }
                PropertyAddress::SpawnPosY => {
                    if var_index < engine.fixed.len() {
                        engine.fixed[var_index] = self.spawn_instance.core.pos.1;
                    }
                }
                PropertyAddress::SpawnVelX => {
                    if var_index < engine.fixed.len() {
                        engine.fixed[var_index] = self.spawn_instance.core.vel.0;
                    }
                }
                PropertyAddress::SpawnVelY => {
                    if var_index < engine.fixed.len() {
                        engine.fixed[var_index] = self.spawn_instance.core.vel.1;
                    }
                }

                // Entity direction properties
                PropertyAddress::EntityFacing => {
                    if var_index < engine.fixed.len() {
                        engine.fixed[var_index] = self.spawn_instance.core.get_facing();
                    }
                }
                PropertyAddress::EntityGravityDir => {
                    if var_index < engine.fixed.len() {
                        engine.fixed[var_index] = self.spawn_instance.core.get_gravity_dir();
                    }
                }

                _ => {
                    // Property not supported in spawn context
                }
            }
        }
    }

    fn write_property(&mut self, engine: &mut ScriptEngine, prop_address: u8, var_index: usize) {
        use crate::constants::PropertyAddress;

        if let Some(property) = PropertyAddress::from_u8(prop_address) {
            match property {
                // Spawn instance properties (writable)
                PropertyAddress::SpawnInstVar0
                | PropertyAddress::SpawnInstVar1
                | PropertyAddress::SpawnInstVar2
                | PropertyAddress::SpawnInstVar3 => {
                    if var_index < engine.vars.len() {
                        let var_idx =
                            (prop_address - PropertyAddress::SpawnInstVar0 as u8) as usize;
                        if var_idx < self.spawn_instance.vars.len() {
                            self.spawn_instance.vars[var_idx] = engine.vars[var_index];
                        }
                    }
                }
                PropertyAddress::SpawnInstFixed0
                | PropertyAddress::SpawnInstFixed1
                | PropertyAddress::SpawnInstFixed2
                | PropertyAddress::SpawnInstFixed3 => {
                    if var_index < engine.fixed.len() {
                        let fixed_idx =
                            (prop_address - PropertyAddress::SpawnInstFixed0 as u8) as usize;
                        if fixed_idx < self.spawn_instance.fixed.len() {
                            self.spawn_instance.fixed[fixed_idx] = engine.fixed[var_index];
                        }
                    }
                }
                PropertyAddress::SpawnInstLifespan => {
                    if var_index < engine.fixed.len() {
                        self.spawn_instance.lifespan = engine.fixed[var_index].to_int() as u16;
                    }
                }
                PropertyAddress::SpawnInstElement => {
                    if var_index < engine.vars.len() {
                        if let Some(element) =
                            crate::entity::Element::from_u8(engine.vars[var_index])
                        {
                            self.spawn_instance.element = element;
                        }
                    }
                }

                // Spawn core properties (writable)
                PropertyAddress::SpawnPosX => {
                    if var_index < engine.fixed.len() {
                        self.spawn_instance.core.pos.0 = engine.fixed[var_index];
                    }
                }
                PropertyAddress::SpawnPosY => {
                    if var_index < engine.fixed.len() {
                        self.spawn_instance.core.pos.1 = engine.fixed[var_index];
                    }
                }
                PropertyAddress::SpawnVelX => {
                    if var_index < engine.fixed.len() {
                        self.spawn_instance.core.vel.0 = engine.fixed[var_index];
                    }
                }
                PropertyAddress::SpawnVelY => {
                    if var_index < engine.fixed.len() {
                        self.spawn_instance.core.vel.1 = engine.fixed[var_index];
                    }
                }

                // Entity direction properties (writable)
                PropertyAddress::EntityFacing => {
                    if var_index < engine.fixed.len() {
                        self.spawn_instance.core.set_facing(engine.fixed[var_index]);
                    }
                }
                PropertyAddress::EntityGravityDir => {
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
        if spawn_id < 256 {
            let mut new_spawn = SpawnInstance::new(
                spawn_id as u8,
                self.spawn_instance.owner_id,
                self.spawn_instance.core.pos,
            );

            if let Some(vars) = vars {
                new_spawn.vars = vars;
            }
            self.to_spawn.push(new_spawn);
        }
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

    for index in 0..spawn_instances.len() {
        if let Some(spawn_def) = spawn_definitions.get(spawn_instances[index].spawn_id as usize) {
            spawn_def.execute_behavior_script(
                game_state,
                &mut spawn_instances[index],
                &mut to_spawn,
            )?;

            if spawn_instances[index].lifespan > 0 {
                spawn_instances[index].lifespan -= 1;
            }

            if spawn_instances[index].lifespan == 0 {
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

    let element_damage = if spawn_def.damage_base > target_armor {
        spawn_def.damage_base - target_armor
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
