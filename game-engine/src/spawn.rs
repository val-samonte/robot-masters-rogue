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
                vars: [0; 8],
                fixed: [Fixed::ZERO; 4],
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
            vars: [0; 8],
            fixed: [Fixed::ZERO; 4],
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
        match prop_address {
            0x01 => {
                if var_index < engine.fixed.len() {
                    engine.fixed[var_index] = Fixed::from_int(self.game_state.seed as i16);
                }
            }
            0x78 => {
                if var_index < engine.fixed.len() {
                    engine.fixed[var_index] = self.spawn_instance.core.pos.0;
                }
            }
            0x79 => {
                if var_index < engine.fixed.len() {
                    engine.fixed[var_index] = self.spawn_instance.core.pos.1;
                }
            }
            0x7A => {
                if var_index < engine.fixed.len() {
                    engine.fixed[var_index] = self.spawn_instance.core.vel.0;
                }
            }
            0x7B => {
                if var_index < engine.fixed.len() {
                    engine.fixed[var_index] = self.spawn_instance.core.vel.1;
                }
            }
            0x6F => {
                if var_index < engine.vars.len() {
                    engine.vars[var_index] = self.spawn_instance.core.id;
                }
            }
            0x70 => {
                if var_index < engine.vars.len() {
                    engine.vars[var_index] = self.spawn_instance.owner_id;
                }
            }
            0x5D => {
                if var_index < engine.vars.len() {
                    engine.vars[var_index] = self.spawn_def.damage_base;
                }
            }

            // Entity direction properties (0x4B-0x4C)
            0x4B => {
                if var_index < engine.fixed.len() {
                    engine.fixed[var_index] = self.spawn_instance.core.get_facing();
                }
            }
            0x4C => {
                if var_index < engine.fixed.len() {
                    engine.fixed[var_index] = self.spawn_instance.core.get_gravity_dir();
                }
            }

            // Note: Energy regeneration properties (0x25-0x28) and armor properties (0x40-0x47)
            // are not available in spawn context as spawns don't have direct access to character data
            _ => {}
        }
    }

    fn write_property(&mut self, engine: &mut ScriptEngine, prop_address: u8, var_index: usize) {
        match prop_address {
            0x78 => {
                if var_index < engine.fixed.len() {
                    self.spawn_instance.core.pos.0 = engine.fixed[var_index];
                }
            }
            0x79 => {
                if var_index < engine.fixed.len() {
                    self.spawn_instance.core.pos.1 = engine.fixed[var_index];
                }
            }
            0x7A => {
                if var_index < engine.fixed.len() {
                    self.spawn_instance.core.vel.0 = engine.fixed[var_index];
                }
            }
            0x7B => {
                if var_index < engine.fixed.len() {
                    self.spawn_instance.core.vel.1 = engine.fixed[var_index];
                }
            }

            // Entity direction properties (0x4B-0x4C) - write support
            0x4B => {
                if var_index < engine.fixed.len() {
                    self.spawn_instance.core.set_facing(engine.fixed[var_index]);
                }
            }
            0x4C => {
                if var_index < engine.fixed.len() {
                    self.spawn_instance
                        .core
                        .set_gravity_dir(engine.fixed[var_index]);
                }
            }

            _ => {}
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

