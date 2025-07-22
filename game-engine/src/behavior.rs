//! Character behavior system with condition and action execution

use crate::{
    constants::PropertyAddress,
    entity::{Character, SpawnInstance},
    math::Fixed,
    script::{ScriptContext, ScriptEngine, ScriptError},
    state::GameState,
};

extern crate alloc;
use alloc::vec;
use alloc::vec::Vec;

/// Condition definition with energy multiplier and script
#[derive(Debug, Clone)]
pub struct Condition {
    pub id: usize,
    pub energy_mul: Fixed,
    pub vars: [u8; 8],     // Variable storage (u8)
    pub fixed: [Fixed; 4], // Variable storage (FixedPoint)
    pub args: [u8; 8],     // Passed when calling scripts (read-only)
    pub spawns: [u8; 4],   // Spawn IDs
    pub script: Vec<u8>,
}

/// Action definition with energy cost, timing, and script
#[derive(Debug, Clone)]
pub struct Action {
    pub energy_cost: u8,
    pub interval: u16,
    pub duration: u16,
    pub cooldown: u16, // Cooldown duration in frames (read-only, set only during new_game)
    pub vars: [u8; 8], // Variable storage (u8)
    pub fixed: [Fixed; 4], // Variable storage (FixedPoint)
    pub args: [u8; 8], // Passed when calling scripts (read-only)
    pub spawns: [u8; 4], // Spawn IDs
    pub script: Vec<u8>,
}

/// Script context for condition evaluation
pub struct ConditionContext<'a> {
    pub game_state: &'a mut GameState,
    pub character: &'a Character,
    pub condition: &'a Condition,
}

/// Script context for action execution
pub struct ActionContext<'a> {
    pub game_state: &'a mut GameState,
    pub character: &'a mut Character,
    pub action: &'a Action,
    pub condition: &'a Condition,
    pub action_id: usize,
    pub to_spawn: Vec<SpawnInstance>,
}

impl Condition {
    /// Create a new condition from definition data
    pub fn from_def(id: usize, props: Vec<u16>) -> Self {
        Self {
            id,
            energy_mul: Fixed::from_int(props[0] as i16).div(Fixed::from_int(props[1] as i16)),
            vars: [0; 8],
            fixed: [Fixed::ZERO; 4],
            args: copy_args_8(&props, 2),
            spawns: [0; 4],
            script: extract_script(&props, 6),
        }
    }

    /// Evaluate condition using script engine
    pub fn evaluate(
        &self,
        game_state: &mut GameState,
        character: &Character,
    ) -> Result<bool, ScriptError> {
        let mut engine = ScriptEngine::new_with_args(self.args);
        let mut context = ConditionContext {
            game_state,
            character,
            condition: self,
        };

        let exit_flag = engine.execute(&self.script, &mut context)?;
        Ok(exit_flag == 1)
    }
}

impl Action {
    /// Create a new action from definition data
    pub fn from_def(props: Vec<u16>) -> Self {
        Self {
            energy_cost: props[0] as u8,
            interval: props[1],
            duration: props[2],
            cooldown: 0, // Default cooldown, set during new_game
            vars: [0; 8],
            fixed: [Fixed::ZERO; 4],
            args: copy_args_8(&props, 3),
            spawns: [0; 4],
            script: extract_script(&props, 7),
        }
    }

    /// Execute action using script engine
    pub fn execute(
        &self,
        game_state: &mut GameState,
        character: &mut Character,
        condition: &Condition,
        action_id: usize,
    ) -> Result<(bool, Vec<SpawnInstance>), ScriptError> {
        let mut engine = ScriptEngine::new_with_args(self.args);
        let mut context = ActionContext {
            game_state,
            character,
            action: self,
            condition,
            action_id,
            to_spawn: Vec::new(),
        };

        let exit_flag = engine.execute(&self.script, &mut context)?;
        let success = exit_flag == 1;

        Ok((success, context.to_spawn))
    }
}

impl<'a> ScriptContext for ConditionContext<'a> {
    fn read_property(&mut self, engine: &mut ScriptEngine, var_index: usize, prop_address: u8) {
        match prop_address {
            // Game state properties (Fixed-point values)
            0x01 => {
                if var_index < engine.fixed.len() {
                    engine.fixed[var_index] = Fixed::from_int(self.game_state.seed as i16);
                }
            }
            0x02 => {
                if var_index < engine.fixed.len() {
                    engine.fixed[var_index] = Fixed::from_int(self.game_state.frame as i16);
                }
            }

            // Condition properties
            0x11 => {
                if var_index < engine.vars.len() {
                    engine.vars[var_index] = self.condition.id as u8;
                }
            }
            0x12 => {
                if var_index < engine.fixed.len() {
                    engine.fixed[var_index] = self.condition.energy_mul;
                }
            }
            0x13..=0x16 => {
                if var_index < engine.vars.len() {
                    let arg_index = (prop_address - 0x13) as usize;
                    if arg_index < self.condition.args.len() {
                        engine.vars[var_index] = self.condition.args[arg_index];
                    }
                }
            }

            // Character properties
            0x17 => {
                if var_index < engine.vars.len() {
                    engine.vars[var_index] = self.character.core.id;
                }
            }
            0x18 => {
                if var_index < engine.vars.len() {
                    engine.vars[var_index] = self.character.core.group;
                }
            }
            0x19 => {
                if var_index < engine.fixed.len() {
                    engine.fixed[var_index] = self.character.core.pos.0;
                }
            }
            0x1A => {
                if var_index < engine.fixed.len() {
                    engine.fixed[var_index] = self.character.core.pos.1;
                }
            }

            0x1B => {
                if var_index < engine.fixed.len() {
                    engine.fixed[var_index] = self.character.core.vel.0;
                }
            }
            0x1C => {
                if var_index < engine.fixed.len() {
                    engine.fixed[var_index] = self.character.core.vel.1;
                }
            }
            0x1D => {
                if var_index < engine.fixed.len() {
                    engine.fixed[var_index] = Fixed::from_int(self.character.core.size.0 as i16);
                }
            }
            0x1E => {
                if var_index < engine.fixed.len() {
                    engine.fixed[var_index] = Fixed::from_int(self.character.core.size.1 as i16);
                }
            }

            0x1F => {
                if var_index < engine.vars.len() {
                    if 4 < self.condition.args.len() {
                        engine.vars[var_index] = self.condition.args[4];
                    }
                }
            }
            0x20 => {
                if var_index < engine.vars.len() {
                    if 5 < self.condition.args.len() {
                        engine.vars[var_index] = self.condition.args[5];
                    }
                }
            }
            0x21 => {
                if var_index < engine.vars.len() {
                    engine.vars[var_index] = self.character.health;
                }
            }
            0x22 => {
                if var_index < engine.vars.len() {
                    if 6 < self.condition.args.len() {
                        engine.vars[var_index] = self.condition.args[6];
                    }
                }
            }
            0x23 => {
                if var_index < engine.vars.len() {
                    engine.vars[var_index] = self.character.energy;
                }
            }
            // Energy regeneration properties (0x25-0x28)
            0x25 => {
                if var_index < engine.vars.len() {
                    engine.vars[var_index] = self.character.energy_regen;
                }
            }
            0x26 => {
                if var_index < engine.vars.len() {
                    engine.vars[var_index] = self.character.energy_regen_rate;
                }
            }
            0x27 => {
                if var_index < engine.vars.len() {
                    engine.vars[var_index] = self.character.energy_charge;
                }
            }
            0x28 => {
                if var_index < engine.vars.len() {
                    engine.vars[var_index] = self.character.energy_charge_rate;
                }
            }
            0x2B => {
                if var_index < engine.vars.len() {
                    engine.vars[var_index] = if self.character.core.collision.0 {
                        1
                    } else {
                        0
                    };
                }
            }
            0x2C => {
                if var_index < engine.vars.len() {
                    engine.vars[var_index] = if self.character.core.collision.1 {
                        1
                    } else {
                        0
                    };
                }
            }
            0x2D => {
                if var_index < engine.vars.len() {
                    engine.vars[var_index] = if self.character.core.collision.2 {
                        1
                    } else {
                        0
                    };
                }
            }
            0x2E => {
                if var_index < engine.vars.len() {
                    engine.vars[var_index] = if self.character.core.collision.3 {
                        1
                    } else {
                        0
                    };
                }
            }
            0x2F => {
                if var_index < engine.vars.len() {
                    engine.vars[var_index] =
                        if let Some(action_instance_id) = self.character.locked_action {
                            action_instance_id
                        } else {
                            0xFF
                        };
                }
            }
            0x39 => {
                if var_index < engine.vars.len() {
                    engine.vars[var_index] = self.character.status_effects.len() as u8;
                }
            }

            // Character armor properties (0x40-0x47)
            0x40 => {
                if var_index < engine.vars.len() {
                    engine.vars[var_index] = self.character.armor[0];
                    // Punct
                }
            }
            0x41 => {
                if var_index < engine.vars.len() {
                    engine.vars[var_index] = self.character.armor[1];
                    // Blast
                }
            }
            0x42 => {
                if var_index < engine.vars.len() {
                    engine.vars[var_index] = self.character.armor[2];
                    // Force
                }
            }
            0x43 => {
                if var_index < engine.vars.len() {
                    engine.vars[var_index] = self.character.armor[3];
                    // Sever
                }
            }
            0x44 => {
                if var_index < engine.vars.len() {
                    engine.vars[var_index] = self.character.armor[4];
                    // Heat
                }
            }
            0x45 => {
                if var_index < engine.vars.len() {
                    engine.vars[var_index] = self.character.armor[5];
                    // Cryo
                }
            }
            0x46 => {
                if var_index < engine.vars.len() {
                    engine.vars[var_index] = self.character.armor[6];
                    // Jolt
                }
            }
            0x47 => {
                if var_index < engine.vars.len() {
                    engine.vars[var_index] = self.character.armor[7];
                    // Virus
                }
            }

            // Entity direction properties (0x4B-0x4C)
            0x4B => {
                if var_index < engine.fixed.len() {
                    engine.fixed[var_index] = self.character.core.get_facing();
                }
            }
            0x4C => {
                if var_index < engine.fixed.len() {
                    engine.fixed[var_index] = self.character.core.get_gravity_dir();
                }
            }

            _ => {}
        }
    }

    fn write_property(&mut self, _engine: &mut ScriptEngine, _prop_address: u8, _var_index: usize) {
        // Conditions are read-only - no write operations allowed
    }

    fn get_energy_requirement(&self) -> u8 {
        // Conditions don't have energy requirements
        0
    }

    fn get_current_energy(&self) -> u8 {
        self.character.energy
    }

    fn is_on_cooldown(&self) -> bool {
        false // Conditions don't have cooldowns
    }

    fn get_random_u8(&mut self) -> u8 {
        // Use the game state's RNG
        self.game_state.next_random_u8()
    }

    fn lock_action(&mut self) {
        // Not supported in condition context
    }

    fn unlock_action(&mut self) {
        // Not supported in condition context
    }

    fn apply_energy_cost(&mut self) {
        // Not supported in condition context
    }

    fn apply_duration(&mut self) {
        // Not supported in condition context
    }

    fn create_spawn(&mut self, _spawn_id: usize, _vars: Option<[u8; 4]>) {
        // Not supported in condition context
    }

    fn log_debug(&self, _message: &str) {
        // TODO: Implement logging when available
    }

    fn read_action_cooldown(&self, _engine: &mut ScriptEngine, _var_index: usize) {
        // Conditions don't have access to action cooldown data
    }

    fn read_action_last_used(&self, _engine: &mut ScriptEngine, _var_index: usize) {
        // Conditions don't have access to action last used data
    }

    fn write_action_last_used(&mut self, _engine: &mut ScriptEngine, _var_index: usize) {
        // Conditions can't modify action last used data
    }
}

impl<'a> ScriptContext for ActionContext<'a> {
    fn read_property(&mut self, engine: &mut ScriptEngine, var_index: usize, prop_address: u8) {
        match prop_address {
            // Game state properties (Fixed-point values)
            0x01 => {
                if var_index < engine.fixed.len() {
                    engine.fixed[var_index] = Fixed::from_int(self.game_state.seed as i16);
                }
            }
            0x02 => {
                if var_index < engine.vars.len() {
                    engine.vars[var_index] = (self.game_state.frame & 0xFF) as u8;
                }
            }

            // Action properties
            0x04 => {
                if var_index < engine.vars.len() {
                    engine.vars[var_index] = self.action.energy_cost;
                }
            }
            0x05 => {
                if var_index < engine.fixed.len() {
                    engine.fixed[var_index] = Fixed::from_int(self.action.interval as i16);
                }
            }
            0x06 => {
                if var_index < engine.fixed.len() {
                    engine.fixed[var_index] = Fixed::from_int(self.action.duration as i16);
                }
            }
            0x07..=0x0E => {
                if var_index < engine.vars.len() {
                    let arg_index = (prop_address - 0x07) as usize;
                    if arg_index < self.action.args.len() {
                        engine.vars[var_index] = self.action.args[arg_index];
                    }
                }
            }

            // Condition properties
            0x11 => {
                if var_index < engine.vars.len() {
                    engine.vars[var_index] = self.condition.id as u8;
                }
            }
            0x12 => {
                if var_index < engine.fixed.len() {
                    engine.fixed[var_index] = self.condition.energy_mul;
                }
            }
            0x13..=0x16 => {
                if var_index < engine.vars.len() {
                    let arg_index = (prop_address - 0x13) as usize;
                    if arg_index < self.condition.args.len() {
                        engine.vars[var_index] = self.condition.args[arg_index];
                    }
                }
            }

            // Character properties
            0x17 => {
                if var_index < engine.vars.len() {
                    engine.vars[var_index] = self.character.core.id;
                }
            }
            0x18 => {
                if var_index < engine.vars.len() {
                    engine.vars[var_index] = self.character.core.group;
                }
            }
            0x19 => {
                if var_index < engine.fixed.len() {
                    engine.fixed[var_index] = self.character.core.pos.0;
                }
            }
            0x1A => {
                if var_index < engine.fixed.len() {
                    engine.fixed[var_index] = self.character.core.pos.1;
                }
            }

            0x1B => {
                if var_index < engine.fixed.len() {
                    engine.fixed[var_index] = self.character.core.vel.0;
                }
            }
            0x1C => {
                if var_index < engine.fixed.len() {
                    engine.fixed[var_index] = self.character.core.vel.1;
                }
            }
            0x1D => {
                if var_index < engine.fixed.len() {
                    engine.fixed[var_index] = Fixed::from_int(self.character.core.size.0 as i16);
                }
            }
            0x1E => {
                if var_index < engine.fixed.len() {
                    engine.fixed[var_index] = Fixed::from_int(self.character.core.size.1 as i16);
                }
            }

            // Extended condition args (0x1F-0x22 for args[4-7]) - moved to avoid overlap with 0x21
            0x1F => {
                if var_index < engine.vars.len() {
                    if 4 < self.condition.args.len() {
                        engine.vars[var_index] = self.condition.args[4];
                    }
                }
            }
            0x20 => {
                if var_index < engine.vars.len() {
                    if 5 < self.condition.args.len() {
                        engine.vars[var_index] = self.condition.args[5];
                    }
                }
            }
            0x21 => {
                if var_index < engine.vars.len() {
                    engine.vars[var_index] = self.character.health;
                }
            }
            0x22 => {
                if var_index < engine.vars.len() {
                    if 6 < self.condition.args.len() {
                        engine.vars[var_index] = self.condition.args[6];
                    }
                }
            }
            // Extended condition arg 7 moved to avoid conflicts
            0x24 => {
                if var_index < engine.vars.len() {
                    if 7 < self.condition.args.len() {
                        engine.vars[var_index] = self.condition.args[7];
                    }
                }
            }
            0x23 => {
                if var_index < engine.vars.len() {
                    engine.vars[var_index] = self.character.energy;
                }
            }
            // Energy regeneration properties (0x25-0x28)
            0x25 => {
                if var_index < engine.vars.len() {
                    engine.vars[var_index] = self.character.energy_regen;
                }
            }
            0x26 => {
                if var_index < engine.vars.len() {
                    engine.vars[var_index] = self.character.energy_regen_rate;
                }
            }
            0x27 => {
                if var_index < engine.vars.len() {
                    engine.vars[var_index] = self.character.energy_charge;
                }
            }
            0x28 => {
                if var_index < engine.vars.len() {
                    engine.vars[var_index] = self.character.energy_charge_rate;
                }
            }
            0x2B => {
                if var_index < engine.vars.len() {
                    engine.vars[var_index] = if self.character.core.collision.0 {
                        1
                    } else {
                        0
                    };
                }
            }
            0x2C => {
                if var_index < engine.vars.len() {
                    engine.vars[var_index] = if self.character.core.collision.1 {
                        1
                    } else {
                        0
                    };
                }
            }
            0x2D => {
                if var_index < engine.vars.len() {
                    engine.vars[var_index] = if self.character.core.collision.2 {
                        1
                    } else {
                        0
                    };
                }
            }
            0x2E => {
                if var_index < engine.vars.len() {
                    engine.vars[var_index] = if self.character.core.collision.3 {
                        1
                    } else {
                        0
                    };
                }
            }
            0x2F => {
                if var_index < engine.vars.len() {
                    engine.vars[var_index] =
                        if let Some(action_instance_id) = self.character.locked_action {
                            action_instance_id
                        } else {
                            0xFF
                        };
                }
            }
            0x39 => {
                if var_index < engine.vars.len() {
                    engine.vars[var_index] = self.character.status_effects.len() as u8;
                }
            }

            // Character armor properties (0x40-0x47)
            0x40 => {
                if var_index < engine.vars.len() {
                    engine.vars[var_index] = self.character.armor[0];
                    // Punct
                }
            }
            0x41 => {
                if var_index < engine.vars.len() {
                    engine.vars[var_index] = self.character.armor[1];
                    // Blast
                }
            }
            0x42 => {
                if var_index < engine.vars.len() {
                    engine.vars[var_index] = self.character.armor[2];
                    // Force
                }
            }
            0x43 => {
                if var_index < engine.vars.len() {
                    engine.vars[var_index] = self.character.armor[3];
                    // Sever
                }
            }
            0x44 => {
                if var_index < engine.vars.len() {
                    engine.vars[var_index] = self.character.armor[4];
                    // Heat
                }
            }
            0x45 => {
                if var_index < engine.vars.len() {
                    engine.vars[var_index] = self.character.armor[5];
                    // Cryo
                }
            }
            0x46 => {
                if var_index < engine.vars.len() {
                    engine.vars[var_index] = self.character.armor[6];
                    // Jolt
                }
            }
            0x47 => {
                if var_index < engine.vars.len() {
                    engine.vars[var_index] = self.character.armor[7];
                    // Virus
                }
            }

            // Cooldown properties (0x48-0x4A)
            0x48 => {
                if var_index < engine.vars.len() {
                    engine.vars[var_index] = (self.action.cooldown & 0xFF) as u8;
                    // Action cooldown (low byte)
                }
            }
            0x49 => {
                if var_index < engine.vars.len()
                    && self.action_id < self.character.action_last_used.len()
                {
                    engine.vars[var_index] =
                        (self.character.action_last_used[self.action_id] & 0xFF) as u8;
                    // Action last used timestamp (low byte)
                }
            }

            // Entity direction properties (0x4B-0x4C)
            0x4B => {
                if var_index < engine.fixed.len() {
                    engine.fixed[var_index] = self.character.core.get_facing();
                }
            }
            0x4C => {
                if var_index < engine.fixed.len() {
                    engine.fixed[var_index] = self.character.core.get_gravity_dir();
                }
            }

            _ => {}
        }
    }

    fn write_property(&mut self, engine: &mut ScriptEngine, prop_address: u8, var_index: usize) {
        match prop_address {
            // Character properties
            0x19 => {
                if var_index < engine.fixed.len() {
                    self.character.core.pos.0 = engine.fixed[var_index];
                }
            }
            0x1A => {
                if var_index < engine.fixed.len() {
                    self.character.core.pos.1 = engine.fixed[var_index];
                }
            }
            0x1B => {
                if var_index < engine.fixed.len() {
                    self.character.core.vel.0 = engine.fixed[var_index];
                }
            }
            0x1C => {
                if var_index < engine.fixed.len() {
                    self.character.core.vel.1 = engine.fixed[var_index];
                }
            }
            0x21 => {
                if var_index < engine.vars.len() {
                    self.character.health = engine.vars[var_index];
                }
            }
            0x23 => {
                if var_index < engine.vars.len() {
                    self.character.energy = engine.vars[var_index];
                }
            }
            // Energy regeneration properties (0x25-0x28) - write support
            0x25 => {
                if var_index < engine.vars.len() {
                    self.character.energy_regen = engine.vars[var_index];
                }
            }
            0x26 => {
                if var_index < engine.vars.len() {
                    self.character.energy_regen_rate = engine.vars[var_index];
                }
            }
            0x27 => {
                if var_index < engine.vars.len() {
                    self.character.energy_charge = engine.vars[var_index];
                }
            }
            0x28 => {
                if var_index < engine.vars.len() {
                    self.character.energy_charge_rate = engine.vars[var_index];
                }
            }
            0x2B => {
                if var_index < engine.vars.len() {
                    self.character.core.collision.0 = engine.vars[var_index] != 0;
                }
            }
            0x2C => {
                if var_index < engine.vars.len() {
                    self.character.core.collision.1 = engine.vars[var_index] != 0;
                }
            }
            0x2D => {
                if var_index < engine.vars.len() {
                    self.character.core.collision.2 = engine.vars[var_index] != 0;
                }
            }
            0x2E => {
                if var_index < engine.vars.len() {
                    self.character.core.collision.3 = engine.vars[var_index] != 0;
                }
            }
            0x2F => {
                if var_index < engine.vars.len() {
                    if engine.vars[var_index] != 0xFF {
                        self.character.locked_action = Some(engine.vars[var_index]);
                    } else {
                        self.character.locked_action = None;
                    }
                }
            }

            // Character armor properties (0x40-0x47) - write support
            0x40 => {
                if var_index < engine.vars.len() {
                    self.character.armor[0] = engine.vars[var_index];
                    // Punct
                }
            }
            0x41 => {
                if var_index < engine.vars.len() {
                    self.character.armor[1] = engine.vars[var_index];
                    // Blast
                }
            }
            0x42 => {
                if var_index < engine.vars.len() {
                    self.character.armor[2] = engine.vars[var_index];
                    // Force
                }
            }
            0x43 => {
                if var_index < engine.vars.len() {
                    self.character.armor[3] = engine.vars[var_index];
                    // Sever
                }
            }
            0x44 => {
                if var_index < engine.vars.len() {
                    self.character.armor[4] = engine.vars[var_index];
                    // Heat
                }
            }
            0x45 => {
                if var_index < engine.vars.len() {
                    self.character.armor[5] = engine.vars[var_index];
                    // Cryo
                }
            }
            0x46 => {
                if var_index < engine.vars.len() {
                    self.character.armor[6] = engine.vars[var_index];
                    // Jolt
                }
            }
            0x47 => {
                if var_index < engine.vars.len() {
                    self.character.armor[7] = engine.vars[var_index];
                    // Virus
                }
            }

            // Cooldown properties (0x4A for write)
            0x4A => {
                if var_index < engine.vars.len()
                    && self.action_id < self.character.action_last_used.len()
                {
                    // Update last used timestamp (preserving high byte)
                    let current_high = self.character.action_last_used[self.action_id] & 0xFF00;
                    self.character.action_last_used[self.action_id] =
                        current_high | (engine.vars[var_index] as u16);
                    // Action last used timestamp (low byte)
                }
            }

            // Entity direction properties (0x4B-0x4C) - write support
            0x4B => {
                if var_index < engine.fixed.len() {
                    self.character.core.set_facing(engine.fixed[var_index]);
                }
            }
            0x4C => {
                if var_index < engine.fixed.len() {
                    self.character.core.set_gravity_dir(engine.fixed[var_index]);
                }
            }

            _ => {}
        }
    }

    fn get_energy_requirement(&self) -> u8 {
        let mult = self.condition.energy_mul;
        let cost = self.action.energy_cost;
        mult.mul(Fixed::from_int(cost as i16)).to_int() as u8
    }

    fn get_current_energy(&self) -> u8 {
        self.character.energy
    }

    fn is_on_cooldown(&self) -> bool {
        // Check if action is on cooldown
        if self.action.cooldown == 0 {
            return false; // No cooldown
        }

        // Get when this action was last used
        let last_used = if self.action_id < self.character.action_last_used.len() {
            self.character.action_last_used[self.action_id]
        } else {
            0 // Never used before
        };

        // Calculate frames since last use
        let current_frame = self.game_state.frame;
        let frames_since_last_use = if current_frame >= last_used {
            current_frame - last_used
        } else {
            // Handle overflow case (shouldn't happen in 64-second game)
            (u16::MAX - last_used) + current_frame + 1
        };

        // Action is on cooldown if not enough frames have passed
        frames_since_last_use < self.action.cooldown
    }

    fn get_random_u8(&mut self) -> u8 {
        // Use the game state's RNG
        self.game_state.next_random_u8()
    }

    fn lock_action(&mut self) {
        // Lock to the current action being executed
        self.character.locked_action = Some(self.action_id as u8);
    }

    fn unlock_action(&mut self) {
        self.character.locked_action = None;
    }

    fn apply_energy_cost(&mut self) {
        let mult = self.condition.energy_mul;
        let cost = self.action.energy_cost;
        let energy_req = mult.mul(Fixed::from_int(cost as i16)).to_int() as u8;
        self.character.energy = self.character.energy.saturating_sub(energy_req);
    }

    fn apply_duration(&mut self) {
        // Simplified for now - no action instance tracking
    }

    fn create_spawn(&mut self, spawn_id: usize, vars: Option<[u8; 4]>) {
        let mut spawn = SpawnInstance::new(
            spawn_id as u8,
            self.character.core.id,
            self.character.core.pos,
        );
        spawn.vars = vars.unwrap_or([0; 4]);
        self.to_spawn.push(spawn);
    }

    fn log_debug(&self, _message: &str) {
        // TODO: Implement logging when available
    }

    fn read_action_cooldown(&self, engine: &mut ScriptEngine, var_index: usize) {
        if var_index < engine.vars.len() {
            // Store low byte of cooldown (u16 -> u8)
            engine.vars[var_index] = (self.action.cooldown & 0xFF) as u8;
        }
    }

    fn read_action_last_used(&self, engine: &mut ScriptEngine, var_index: usize) {
        if var_index < engine.vars.len() && self.action_id < self.character.action_last_used.len() {
            // Store low byte of last used timestamp (u16 -> u8)
            engine.vars[var_index] = (self.character.action_last_used[self.action_id] & 0xFF) as u8;
        }
    }

    fn write_action_last_used(&mut self, engine: &mut ScriptEngine, var_index: usize) {
        if var_index < engine.vars.len() && self.action_id < self.character.action_last_used.len() {
            // Update last used timestamp from variable (u8 -> u16, preserving high byte)
            let current_high = self.character.action_last_used[self.action_id] & 0xFF00;
            self.character.action_last_used[self.action_id] =
                current_high | (engine.vars[var_index] as u16);
        }
    }
}

/// Helper function to extract script bytes from definition
fn extract_script(props: &[u16], from: usize) -> Vec<u8> {
    props
        .get(from..)
        .map_or_else(Vec::new, |slice| slice.iter().map(|&x| x as u8).collect())
}

/// Check if an action is on cooldown
fn is_action_on_cooldown(current_frame: u16, last_used: u16, cooldown: u16) -> bool {
    if cooldown == 0 {
        return false; // No cooldown
    }

    // Calculate frames since last use
    let frames_since_last_use = if current_frame >= last_used {
        current_frame - last_used
    } else {
        // Handle overflow case (shouldn't happen in 64-second game)
        (u16::MAX - last_used) + current_frame + 1
    };

    // Action is on cooldown if not enough frames have passed
    frames_since_last_use < cooldown
}

/// Execute character behaviors in order until one succeeds
pub fn execute_character_behaviors(
    game_state: &mut GameState,
    character: &mut Character,
    conditions: &[Condition],
    actions: &[Action],
) -> Result<Vec<SpawnInstance>, ScriptError> {
    let mut spawns_to_create = Vec::new();

    // Check if character has a locked action
    if let Some(locked_action_id) = character.locked_action {
        // Execute the locked action directly, skipping condition evaluation
        let action_id = locked_action_id as usize;

        if let Some(action) = actions.get(action_id) {
            // For locked actions, we need a dummy condition since the action script
            // will handle its own condition logic internally
            let dummy_condition = Condition {
                id: 0,
                energy_mul: Fixed::ONE,
                vars: [0; 8],
                fixed: [Fixed::ZERO; 4],
                args: [0; 8],
                spawns: [0; 4],
                script: vec![0, 1], // Always true condition
            };

            // Execute the locked action
            let (success, mut spawns) =
                action.execute(game_state, character, &dummy_condition, action_id)?;

            if success {
                spawns_to_create.append(&mut spawns);
            }
        }

        return Ok(spawns_to_create);
    }

    // Normal behavior processing when not locked
    let behaviors = character.behaviors.clone();
    for behavior in &behaviors {
        let condition_id = behavior.0 as usize;
        let action_id = behavior.1 as usize;

        // Get condition and action from lookup tables
        if let (Some(condition), Some(action)) =
            (conditions.get(condition_id), actions.get(action_id))
        {
            // Check cooldown FIRST (before energy check for performance)
            if is_action_on_cooldown(
                game_state.frame,
                character
                    .action_last_used
                    .get(action_id)
                    .copied()
                    .unwrap_or(0),
                action.cooldown,
            ) {
                continue; // Skip this behavior - action is on cooldown
            }

            // Check if character has enough energy for this action
            let energy_requirement = condition
                .energy_mul
                .mul(Fixed::from_int(action.energy_cost as i16))
                .to_int() as u8;
            if character.energy < energy_requirement {
                continue; // Skip this behavior if not enough energy
            }

            // Evaluate condition
            if condition.evaluate(game_state, character)? {
                // Condition passed, execute action
                let (success, mut spawns) =
                    action.execute(game_state, character, condition, action_id)?;

                if success {
                    // Note: Cooldown setting is now manual and script-controlled only
                    // through WriteActionLastUsed operator. No automatic timestamp update.

                    // Apply energy cost
                    character.energy = character.energy.saturating_sub(energy_requirement);
                    spawns_to_create.append(&mut spawns);
                    break; // Stop processing behaviors after first successful action
                }
            }
        }
    }

    Ok(spawns_to_create)
}

/// Helper function to copy args from definition (legacy 4-byte version)
fn copy_args(props: &[u16], from: usize) -> [u8; 4] {
    let mut vars = [0; 4];
    for (i, &val) in props[from..].iter().take(4).enumerate() {
        vars[i] = val as u8;
    }
    vars
}

/// Helper function to copy args from definition (8-byte version)
fn copy_args_8(props: &[u16], from: usize) -> [u8; 8] {
    let mut vars = [0; 8];
    for (i, &val) in props[from..].iter().take(8).enumerate() {
        vars[i] = val as u8;
    }
    vars
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::entity::Character;
    use crate::state::GameState;
    use alloc::vec;

    fn create_test_character() -> Character {
        Character::new(1, 0)
    }

    fn create_test_game_state() -> GameState {
        GameState::new(12345, [[0; 16]; 15], vec![], vec![]).unwrap()
    }

    #[test]
    fn test_condition_creation() {
        let props = vec![2, 3, 10, 20, 30, 40, 0, 1]; // energy_mul 2/3, args [10,20,30,40], script [0,1]
        let condition = Condition::from_def(5, props);

        assert_eq!(condition.id, 5);
        assert_eq!(
            condition.energy_mul,
            Fixed::from_int(2).div(Fixed::from_int(3))
        );
        assert_eq!(condition.args[0..4], [10, 20, 30, 40]);
        assert_eq!(condition.script, vec![0, 1]);
    }

    #[test]
    fn test_action_creation() {
        let props = vec![15, 60, 120, 5, 10, 15, 20, 0, 1]; // cost 15, interval 60, duration 120, args [5,10,15,20], script [0,1]
        let action = Action::from_def(props);

        assert_eq!(action.energy_cost, 15);
        assert_eq!(action.interval, 60);
        assert_eq!(action.duration, 120);
        assert_eq!(action.args[0..4], [5, 10, 15, 20]);
        assert_eq!(action.script, vec![0, 1]);
    }

    #[test]
    fn test_condition_evaluation_success() {
        let mut game_state = create_test_game_state();
        let character = create_test_character();

        // Simple condition that always succeeds: [Exit, 1]
        let condition = Condition {
            id: 0,
            energy_mul: Fixed::from_int(1),
            vars: [0; 8],
            fixed: [Fixed::ZERO; 4],
            args: [0; 8],
            spawns: [0; 4],
            script: vec![0, 1], // Exit with flag 1
        };

        let result = condition.evaluate(&mut game_state, &character).unwrap();
        assert!(result);
    }

    #[test]
    fn test_condition_evaluation_failure() {
        let mut game_state = create_test_game_state();
        let character = create_test_character();

        // Simple condition that always fails: [Exit, 0]
        let condition = Condition {
            id: 0,
            energy_mul: Fixed::from_int(1),
            vars: [0; 8],
            fixed: [Fixed::ZERO; 4],
            args: [0; 8],
            spawns: [0; 4],
            script: vec![0, 0], // Exit with flag 0
        };

        let result = condition.evaluate(&mut game_state, &character).unwrap();
        assert!(!result);
    }

    #[test]
    fn test_action_execution_success() {
        let mut game_state = create_test_game_state();
        let mut character = create_test_character();

        let action = Action {
            energy_cost: 10,
            interval: 60,
            duration: 30,
            cooldown: 0,
            vars: [0; 8],
            fixed: [Fixed::ZERO; 4],
            args: [0; 8],
            spawns: [0; 4],
            script: vec![0, 1], // Exit with flag 1
        };

        let condition = Condition {
            id: 0,
            energy_mul: Fixed::from_int(1),
            vars: [0; 8],
            fixed: [Fixed::ZERO; 4],
            args: [0; 8],
            spawns: [0; 4],
            script: vec![],
        };

        let (success, spawns) = action
            .execute(&mut game_state, &mut character, &condition, 0)
            .unwrap();
        assert!(success);
        assert!(spawns.is_empty());
    }

    #[test]
    fn test_condition_context_property_reading() {
        let mut game_state = create_test_game_state();
        let character = create_test_character();

        // Test reading character health: [ReadProp, 0, 0x21, Exit, 1]
        let condition = Condition {
            id: 0,
            energy_mul: Fixed::from_int(1),
            vars: [0; 8],
            fixed: [Fixed::ZERO; 4],
            args: [0; 8],
            spawns: [0; 4],
            script: vec![10, 0, 0x21, 0, 1], // ReadProp var[0] = character.health, Exit 1
        };

        let result = condition.evaluate(&mut game_state, &character).unwrap();
        assert!(result);
    }

    #[test]
    fn test_action_context_spawn_creation() {
        let mut game_state = create_test_game_state();
        let mut character = create_test_character();

        // Test spawn creation: [AssignByte, 0, 5, Spawn, 0, Exit, 1]
        let action = Action {
            energy_cost: 10,
            interval: 0,
            duration: 0,
            cooldown: 0,
            vars: [0; 8],
            fixed: [Fixed::ZERO; 4],
            args: [0; 8],
            spawns: [0; 4],
            script: vec![20, 0, 5, 84, 0, 0, 1], // AssignByte var[0] = 5, Spawn var[0], Exit 1
        };

        let condition = Condition {
            id: 0,
            energy_mul: Fixed::from_int(1),
            vars: [0; 8],
            fixed: [Fixed::ZERO; 4],
            args: [0; 8],
            spawns: [0; 4],
            script: vec![],
        };

        let (success, spawns) = action
            .execute(&mut game_state, &mut character, &condition, 0)
            .unwrap();
        assert!(success);
        assert_eq!(spawns.len(), 1);
        assert_eq!(spawns[0].spawn_id, 5);
        assert_eq!(spawns[0].owner_id, character.core.id);
    }

    #[test]
    fn test_behavior_execution_flow() {
        let mut game_state = create_test_game_state();
        let mut character = create_test_character();

        // Set up character with behaviors: [(condition_id, action_id)]
        character.behaviors = vec![(0, 0), (1, 1)];
        character.energy = 100; // Ensure enough energy

        // Create conditions and actions
        let conditions = vec![
            // Condition 0: Always fails [Exit, 0]
            Condition {
                id: 0,
                energy_mul: Fixed::from_int(1),
                vars: [0; 8],
                fixed: [Fixed::ZERO; 4],
                args: [0; 8],
                spawns: [0; 4],
                script: vec![0, 0], // Exit with flag 0 (fail)
            },
            // Condition 1: Always succeeds [Exit, 1]
            Condition {
                id: 1,
                energy_mul: Fixed::from_int(1),
                vars: [0; 8],
                fixed: [Fixed::ZERO; 4],
                args: [0; 8],
                spawns: [0; 4],
                script: vec![0, 1], // Exit with flag 1 (success)
            },
        ];

        let actions = vec![
            // Action 0: Should not execute (condition 0 fails)
            Action {
                energy_cost: 10,
                interval: 0,
                duration: 0,
                cooldown: 0,
                vars: [0; 8],
                fixed: [Fixed::ZERO; 4],
                args: [0; 8],
                spawns: [0; 4],
                script: vec![20, 0, 1, 84, 0, 0, 1], // Create spawn with id 1
            },
            // Action 1: Should execute (condition 1 succeeds)
            Action {
                energy_cost: 15,
                interval: 0,
                duration: 0,
                cooldown: 0,
                vars: [0; 8],
                fixed: [Fixed::ZERO; 4],
                args: [0; 8],
                spawns: [0; 4],
                script: vec![20, 0, 2, 84, 0, 0, 1], // Create spawn with id 2
            },
        ];

        // Execute behaviors
        let spawns =
            execute_character_behaviors(&mut game_state, &mut character, &conditions, &actions)
                .unwrap();

        // Should only execute action 1 (spawn id 2) since condition 0 failed
        assert_eq!(spawns.len(), 1);
        assert_eq!(spawns[0].spawn_id, 2);

        // Character energy should be reduced by action 1's cost (15)
        assert_eq!(character.energy, 85);
    }

    #[test]
    fn test_behavior_execution_energy_requirement() {
        let mut game_state = create_test_game_state();
        let mut character = create_test_character();

        // Set up character with low energy
        character.behaviors = vec![(0, 0)];
        character.energy = 5; // Not enough for the action

        let conditions = vec![Condition {
            id: 0,
            energy_mul: Fixed::from_int(2), // 2x energy multiplier
            vars: [0; 8],
            fixed: [Fixed::ZERO; 4],
            args: [0; 8],
            spawns: [0; 4],
            script: vec![0, 1], // Always succeeds
        }];

        let actions = vec![Action {
            energy_cost: 10, // Requires 20 energy with 2x multiplier
            interval: 0,
            duration: 0,
            cooldown: 0,
            vars: [0; 8],
            fixed: [Fixed::ZERO; 4],
            args: [0; 8],
            spawns: [0; 4],
            script: vec![0, 1], // Success
        }];

        // Execute behaviors - should skip due to insufficient energy
        let spawns =
            execute_character_behaviors(&mut game_state, &mut character, &conditions, &actions)
                .unwrap();

        // No spawns should be created due to insufficient energy
        assert_eq!(spawns.len(), 0);

        // Character energy should remain unchanged
        assert_eq!(character.energy, 5);
    }

    #[test]
    fn test_energy_regeneration_property_access() {
        let mut game_state = create_test_game_state();
        let mut character = Character::new(1, 0);

        // Set energy regeneration properties
        character.energy_regen = 5;
        character.energy_regen_rate = 60;
        character.energy_charge = 10;
        character.energy_charge_rate = 30;

        // Test condition context reading energy regeneration properties
        let condition = Condition {
            id: 1,
            energy_mul: Fixed::ONE,
            vars: [0; 8],
            fixed: [Fixed::ZERO; 4],
            args: [0; 8],
            spawns: [0; 4],
            script: vec![
                10, 0, 0x25, // ReadProp vars[0] = energy_regen
                10, 1, 0x26, // ReadProp vars[1] = energy_regen_rate
                10, 2, 0x27, // ReadProp vars[2] = energy_charge
                10, 3, 0x28, // ReadProp vars[3] = energy_charge_rate
                0, 1, // Exit with success
            ],
        };

        let result = condition.evaluate(&mut game_state, &character);
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), true);

        // Test action context reading and writing energy regeneration properties
        let action = Action {
            energy_cost: 0,
            interval: 0,
            duration: 0,
            cooldown: 0,
            vars: [0; 8],
            fixed: [Fixed::ZERO; 4],
            args: [0; 8],
            spawns: [0; 4],
            script: vec![
                10, 0, 0x25, // ReadProp vars[0] = energy_regen (5)
                10, 1, 0x26, // ReadProp vars[1] = energy_regen_rate (60)
                20, 2, 15, // AssignByte vars[2] = 15 (new energy_regen)
                20, 3, 45, // AssignByte vars[3] = 45 (new energy_regen_rate)
                11, 0x25, 2, // WriteProp energy_regen = vars[2] (15)
                11, 0x26, 3, // WriteProp energy_regen_rate = vars[3] (45)
                0, 1, // Exit with success
            ],
        };

        let result = action.execute(&mut game_state, &mut character, &condition, 0);
        assert!(result.is_ok());
        let (success, _spawns) = result.unwrap();
        assert_eq!(success, true);

        // Verify properties were updated
        assert_eq!(character.energy_regen, 15);
        assert_eq!(character.energy_regen_rate, 45);
        assert_eq!(character.energy_charge, 10); // Unchanged
        assert_eq!(character.energy_charge_rate, 30); // Unchanged
    }

    #[test]
    fn test_armor_property_access() {
        let mut game_state = create_test_game_state();
        let mut character = Character::new(1, 0);

        // Set armor values
        character.armor[0] = 75; // Punct
        character.armor[1] = 125; // Blast
        character.armor[4] = 50; // Heat
        character.armor[7] = 200; // Virus

        // Test condition context reading armor properties
        let condition = Condition {
            id: 1,
            energy_mul: Fixed::ONE,
            vars: [0; 8],
            fixed: [Fixed::ZERO; 4],
            args: [0; 8],
            spawns: [0; 4],
            script: vec![
                10, 0, 0x40, // ReadProp vars[0] = armor[0] (Punct)
                10, 1, 0x41, // ReadProp vars[1] = armor[1] (Blast)
                10, 2, 0x44, // ReadProp vars[2] = armor[4] (Heat)
                10, 3, 0x47, // ReadProp vars[3] = armor[7] (Virus)
                0, 1, // Exit with success
            ],
        };

        let result = condition.evaluate(&mut game_state, &character);
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), true);

        // Test action context reading and writing armor properties
        let action = Action {
            energy_cost: 0,
            interval: 0,
            duration: 0,
            cooldown: 0,
            vars: [0; 8],
            fixed: [Fixed::ZERO; 4],
            args: [0; 8],
            spawns: [0; 4],
            script: vec![
                10, 0, 0x40, // ReadProp vars[0] = armor[0] (75)
                10, 1, 0x44, // ReadProp vars[1] = armor[4] (50)
                20, 2, 90, // AssignByte vars[2] = 90 (new Punct armor)
                20, 3, 150, // AssignByte vars[3] = 150 (new Heat armor)
                11, 0x40, 2, // WriteProp armor[0] = vars[2] (90)
                11, 0x44, 3, // WriteProp armor[4] = vars[3] (150)
                0, 1, // Exit with success
            ],
        };

        let result = action.execute(&mut game_state, &mut character, &condition, 0);
        assert!(result.is_ok());
        let (success, _spawns) = result.unwrap();
        assert_eq!(success, true);

        // Verify armor properties were updated
        assert_eq!(character.armor[0], 90); // Punct updated
        assert_eq!(character.armor[1], 125); // Blast unchanged
        assert_eq!(character.armor[4], 150); // Heat updated
        assert_eq!(character.armor[7], 200); // Virus unchanged
    }
}
