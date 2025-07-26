//! Status effects system for temporary character modifications

use crate::{
    entity::{Character, StatusEffectDefinition, StatusEffectInstance},
    math::Fixed,
    script::{ScriptContext, ScriptEngine, ScriptError},
    state::GameState,
};

extern crate alloc;
use alloc::vec;
use alloc::vec::Vec;

/// Script context for status effect execution
pub struct StatusEffectContext<'a> {
    pub game_state: &'a mut GameState,
    pub character: &'a mut Character,
    pub status_instance: &'a mut StatusEffectInstance,
    pub status_def: &'a StatusEffectDefinition,
}

impl StatusEffectDefinition {
    /// Create a new status effect from definition data
    pub fn from_def(props: Vec<u16>) -> Self {
        Self {
            duration: props[0],
            stack_limit: props[1] as u8,
            reset_on_stack: props[2] != 0,
            args: [0; 8],
            spawns: [0; 4],
            on_script: extract_script(&props, 3, props.len()),
            tick_script: extract_script(&props, 3, props.len()),
            off_script: extract_script(&props, 3, props.len()),
        }
    }

    /// Apply this status effect to a character
    pub fn apply_to_character(
        &self,
        character: &mut Character,
        game_state: &mut GameState,
        effect_id: u8,
    ) -> Result<bool, ScriptError> {
        // Check if this status effect is already active
        let existing_index = character
            .status_effects
            .iter()
            .position(|effect| effect.effect_id == effect_id);

        match existing_index {
            Some(index) => {
                // Status effect already exists
                let should_stack = character.status_effects[index].stack_count < self.stack_limit;

                if should_stack {
                    // Can stack more
                    character.status_effects[index].stack_count += 1;

                    if self.reset_on_stack {
                        character.status_effects[index].remaining_duration = self.duration;
                    }

                    // Execute on_script for new stack
                    let mut temp_instance = character.status_effects[index].clone();
                    self.execute_on_script(game_state, character, &mut temp_instance)?;
                    character.status_effects[index] = temp_instance;
                    Ok(true)
                } else {
                    // Already at stack limit
                    if self.reset_on_stack {
                        character.status_effects[index].remaining_duration = self.duration;
                    }
                    Ok(false)
                }
            }
            None => {
                // New status effect
                let mut new_instance = StatusEffectInstance {
                    effect_id,
                    remaining_duration: self.duration,
                    stack_count: 1,
                    vars: [0; 4],
                    fixed: [Fixed::ZERO; 4],
                };

                // Execute on_script for new effect
                self.execute_on_script(game_state, character, &mut new_instance)?;

                character.status_effects.push(new_instance);
                Ok(true)
            }
        }
    }

    /// Execute the on_script when status effect is applied
    pub fn execute_on_script(
        &self,
        game_state: &mut GameState,
        character: &mut Character,
        status_instance: &mut StatusEffectInstance,
    ) -> Result<u8, ScriptError> {
        if self.on_script.is_empty() {
            return Ok(0);
        }

        let mut engine = ScriptEngine::new();
        let mut context = StatusEffectContext {
            game_state,
            character,
            status_instance,
            status_def: self,
        };

        engine.execute(&self.on_script, &mut context)
    }

    /// Execute the tick_script every frame while active
    pub fn execute_tick_script(
        &self,
        game_state: &mut GameState,
        character: &mut Character,
        status_instance: &mut StatusEffectInstance,
    ) -> Result<u8, ScriptError> {
        if self.tick_script.is_empty() {
            return Ok(0);
        }

        let mut engine = ScriptEngine::new();
        let mut context = StatusEffectContext {
            game_state,
            character,
            status_instance,
            status_def: self,
        };

        engine.execute(&self.tick_script, &mut context)
    }

    /// Execute the off_script when status effect is removed
    pub fn execute_off_script(
        &self,
        game_state: &mut GameState,
        character: &mut Character,
        status_instance: &mut StatusEffectInstance,
    ) -> Result<u8, ScriptError> {
        if self.off_script.is_empty() {
            return Ok(0);
        }

        let mut engine = ScriptEngine::new();
        let mut context = StatusEffectContext {
            game_state,
            character,
            status_instance,
            status_def: self,
        };

        engine.execute(&self.off_script, &mut context)
    }
}

impl<'a> ScriptContext for StatusEffectContext<'a> {
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
                PropertyAddress::GameFrame => {
                    if var_index < engine.fixed.len() {
                        engine.fixed[var_index] = Fixed::from_int(self.game_state.frame as i16);
                    }
                }

                // Character properties
                PropertyAddress::CharacterId => {
                    if var_index < engine.vars.len() {
                        engine.vars[var_index] = self.character.core.id;
                    }
                }
                PropertyAddress::CharacterGroup => {
                    if var_index < engine.vars.len() {
                        engine.vars[var_index] = self.character.core.group;
                    }
                }
                PropertyAddress::CharacterPosX => {
                    if var_index < engine.fixed.len() {
                        engine.fixed[var_index] = self.character.core.pos.0;
                    }
                }
                PropertyAddress::CharacterPosY => {
                    if var_index < engine.fixed.len() {
                        engine.fixed[var_index] = self.character.core.pos.1;
                    }
                }
                PropertyAddress::CharacterVelX => {
                    if var_index < engine.fixed.len() {
                        engine.fixed[var_index] = self.character.core.vel.0;
                    }
                }
                PropertyAddress::CharacterVelY => {
                    if var_index < engine.fixed.len() {
                        engine.fixed[var_index] = self.character.core.vel.1;
                    }
                }
                PropertyAddress::CharacterHealth => {
                    if var_index < engine.vars.len() {
                        engine.vars[var_index] = self.character.health;
                    }
                }
                PropertyAddress::CharacterEnergy => {
                    if var_index < engine.vars.len() {
                        engine.vars[var_index] = self.character.energy;
                    }
                }
                PropertyAddress::CharacterEnergyRegen => {
                    if var_index < engine.vars.len() {
                        engine.vars[var_index] = self.character.energy_regen;
                    }
                }
                PropertyAddress::CharacterEnergyRegenRate => {
                    if var_index < engine.vars.len() {
                        engine.vars[var_index] = self.character.energy_regen_rate;
                    }
                }
                PropertyAddress::CharacterEnergyCharge => {
                    if var_index < engine.vars.len() {
                        engine.vars[var_index] = self.character.energy_charge;
                    }
                }
                PropertyAddress::CharacterEnergyChargeRate => {
                    if var_index < engine.vars.len() {
                        engine.vars[var_index] = self.character.energy_charge_rate;
                    }
                }

                // Character armor properties
                PropertyAddress::CharacterArmorPunct => {
                    if var_index < engine.vars.len() {
                        engine.vars[var_index] = self.character.armor[0];
                    }
                }
                PropertyAddress::CharacterArmorBlast => {
                    if var_index < engine.vars.len() {
                        engine.vars[var_index] = self.character.armor[1];
                    }
                }
                PropertyAddress::CharacterArmorForce => {
                    if var_index < engine.vars.len() {
                        engine.vars[var_index] = self.character.armor[2];
                    }
                }
                PropertyAddress::CharacterArmorSever => {
                    if var_index < engine.vars.len() {
                        engine.vars[var_index] = self.character.armor[3];
                    }
                }
                PropertyAddress::CharacterArmorHeat => {
                    if var_index < engine.vars.len() {
                        engine.vars[var_index] = self.character.armor[4];
                    }
                }
                PropertyAddress::CharacterArmorCryo => {
                    if var_index < engine.vars.len() {
                        engine.vars[var_index] = self.character.armor[5];
                    }
                }
                PropertyAddress::CharacterArmorJolt => {
                    if var_index < engine.vars.len() {
                        engine.vars[var_index] = self.character.armor[6];
                    }
                }
                PropertyAddress::CharacterArmorVirus => {
                    if var_index < engine.vars.len() {
                        engine.vars[var_index] = self.character.armor[7];
                    }
                }

                // Status effect definition properties
                PropertyAddress::StatusEffectDefDuration => {
                    if var_index < engine.fixed.len() {
                        engine.fixed[var_index] = Fixed::from_int(self.status_def.duration as i16);
                    }
                }
                PropertyAddress::StatusEffectDefStackLimit => {
                    if var_index < engine.vars.len() {
                        engine.vars[var_index] = self.status_def.stack_limit;
                    }
                }
                PropertyAddress::StatusEffectDefResetOnStack => {
                    if var_index < engine.vars.len() {
                        engine.vars[var_index] = if self.status_def.reset_on_stack { 1 } else { 0 };
                    }
                }
                PropertyAddress::StatusEffectDefArg0
                | PropertyAddress::StatusEffectDefArg1
                | PropertyAddress::StatusEffectDefArg2 => {
                    if var_index < engine.vars.len() {
                        let arg_index =
                            (prop_address - PropertyAddress::StatusEffectDefArg0 as u8) as usize;
                        if arg_index < self.status_def.args.len() {
                            engine.vars[var_index] = self.status_def.args[arg_index];
                        }
                    }
                }

                // Status effect instance properties
                PropertyAddress::StatusEffectInstVar0
                | PropertyAddress::StatusEffectInstVar1
                | PropertyAddress::StatusEffectInstVar2
                | PropertyAddress::StatusEffectInstVar3 => {
                    if var_index < engine.vars.len() {
                        let var_idx =
                            (prop_address - PropertyAddress::StatusEffectInstVar0 as u8) as usize;
                        if var_idx < self.status_instance.vars.len() {
                            engine.vars[var_index] = self.status_instance.vars[var_idx];
                        }
                    }
                }
                PropertyAddress::StatusEffectInstFixed0
                | PropertyAddress::StatusEffectInstFixed1
                | PropertyAddress::StatusEffectInstFixed2
                | PropertyAddress::StatusEffectInstFixed3 => {
                    if var_index < engine.fixed.len() {
                        let fixed_idx =
                            (prop_address - PropertyAddress::StatusEffectInstFixed0 as u8) as usize;
                        if fixed_idx < self.status_instance.fixed.len() {
                            engine.fixed[var_index] = self.status_instance.fixed[fixed_idx];
                        }
                    }
                }
                PropertyAddress::StatusEffectInstRemainingDuration => {
                    if var_index < engine.fixed.len() {
                        engine.fixed[var_index] =
                            Fixed::from_int(self.status_instance.remaining_duration as i16);
                    }
                }
                PropertyAddress::StatusEffectInstStackCount => {
                    if var_index < engine.vars.len() {
                        engine.vars[var_index] = self.status_instance.stack_count;
                    }
                }

                // Entity direction properties
                PropertyAddress::EntityFacing => {
                    if var_index < engine.fixed.len() {
                        engine.fixed[var_index] = self.character.core.get_facing();
                    }
                }
                PropertyAddress::EntityGravityDir => {
                    if var_index < engine.fixed.len() {
                        engine.fixed[var_index] = self.character.core.get_gravity_dir();
                    }
                }

                _ => {
                    // Property not supported in status effect context
                }
            }
        }
    }

    fn write_property(&mut self, engine: &mut ScriptEngine, prop_address: u8, var_index: usize) {
        use crate::constants::PropertyAddress;

        if let Some(property) = PropertyAddress::from_u8(prop_address) {
            match property {
                // Character properties (status effects can modify character state)
                PropertyAddress::CharacterPosX => {
                    if var_index < engine.fixed.len() {
                        self.character.core.pos.0 = engine.fixed[var_index];
                    }
                }
                PropertyAddress::CharacterPosY => {
                    if var_index < engine.fixed.len() {
                        self.character.core.pos.1 = engine.fixed[var_index];
                    }
                }
                PropertyAddress::CharacterVelX => {
                    if var_index < engine.fixed.len() {
                        self.character.core.vel.0 = engine.fixed[var_index];
                    }
                }
                PropertyAddress::CharacterVelY => {
                    if var_index < engine.fixed.len() {
                        self.character.core.vel.1 = engine.fixed[var_index];
                    }
                }
                PropertyAddress::CharacterHealth => {
                    if var_index < engine.vars.len() {
                        self.character.health = engine.vars[var_index];
                    }
                }
                PropertyAddress::CharacterEnergy => {
                    if var_index < engine.vars.len() {
                        self.character.energy = engine.vars[var_index];
                    }
                }
                PropertyAddress::CharacterEnergyRegen => {
                    if var_index < engine.vars.len() {
                        self.character.energy_regen = engine.vars[var_index];
                    }
                }
                PropertyAddress::CharacterEnergyRegenRate => {
                    if var_index < engine.vars.len() {
                        self.character.energy_regen_rate = engine.vars[var_index];
                    }
                }
                PropertyAddress::CharacterEnergyCharge => {
                    if var_index < engine.vars.len() {
                        self.character.energy_charge = engine.vars[var_index];
                    }
                }
                PropertyAddress::CharacterEnergyChargeRate => {
                    if var_index < engine.vars.len() {
                        self.character.energy_charge_rate = engine.vars[var_index];
                    }
                }

                // Character armor properties (writable)
                PropertyAddress::CharacterArmorPunct => {
                    if var_index < engine.vars.len() {
                        self.character.armor[0] = engine.vars[var_index];
                    }
                }
                PropertyAddress::CharacterArmorBlast => {
                    if var_index < engine.vars.len() {
                        self.character.armor[1] = engine.vars[var_index];
                    }
                }
                PropertyAddress::CharacterArmorForce => {
                    if var_index < engine.vars.len() {
                        self.character.armor[2] = engine.vars[var_index];
                    }
                }
                PropertyAddress::CharacterArmorSever => {
                    if var_index < engine.vars.len() {
                        self.character.armor[3] = engine.vars[var_index];
                    }
                }
                PropertyAddress::CharacterArmorHeat => {
                    if var_index < engine.vars.len() {
                        self.character.armor[4] = engine.vars[var_index];
                    }
                }
                PropertyAddress::CharacterArmorCryo => {
                    if var_index < engine.vars.len() {
                        self.character.armor[5] = engine.vars[var_index];
                    }
                }
                PropertyAddress::CharacterArmorJolt => {
                    if var_index < engine.vars.len() {
                        self.character.armor[6] = engine.vars[var_index];
                    }
                }
                PropertyAddress::CharacterArmorVirus => {
                    if var_index < engine.vars.len() {
                        self.character.armor[7] = engine.vars[var_index];
                    }
                }

                // Status effect instance properties (writable)
                PropertyAddress::StatusEffectInstVar0
                | PropertyAddress::StatusEffectInstVar1
                | PropertyAddress::StatusEffectInstVar2
                | PropertyAddress::StatusEffectInstVar3 => {
                    if var_index < engine.vars.len() {
                        let var_idx =
                            (prop_address - PropertyAddress::StatusEffectInstVar0 as u8) as usize;
                        if var_idx < self.status_instance.vars.len() {
                            self.status_instance.vars[var_idx] = engine.vars[var_index];
                        }
                    }
                }
                PropertyAddress::StatusEffectInstFixed0
                | PropertyAddress::StatusEffectInstFixed1
                | PropertyAddress::StatusEffectInstFixed2
                | PropertyAddress::StatusEffectInstFixed3 => {
                    if var_index < engine.fixed.len() {
                        let fixed_idx =
                            (prop_address - PropertyAddress::StatusEffectInstFixed0 as u8) as usize;
                        if fixed_idx < self.status_instance.fixed.len() {
                            self.status_instance.fixed[fixed_idx] = engine.fixed[var_index];
                        }
                    }
                }

                // Entity direction properties (writable)
                PropertyAddress::EntityFacing => {
                    if var_index < engine.fixed.len() {
                        self.character.core.set_facing(engine.fixed[var_index]);
                    }
                }
                PropertyAddress::EntityGravityDir => {
                    if var_index < engine.fixed.len() {
                        self.character.core.set_gravity_dir(engine.fixed[var_index]);
                    }
                }

                _ => {
                    // Property not writable or not supported in status effect context
                }
            }
        }
    }

    fn get_energy_requirement(&self) -> u8 {
        0 // Status effects don't have energy requirements
    }

    fn get_current_energy(&self) -> u8 {
        self.character.energy
    }

    fn is_on_cooldown(&self) -> bool {
        false // Status effects don't have cooldowns
    }

    fn get_random_u8(&mut self) -> u8 {
        self.game_state.next_random_u8()
    }

    fn lock_action(&mut self) {
        self.character.locked_action = Some(1); // Simplified
    }

    fn unlock_action(&mut self) {
        self.character.locked_action = None;
    }

    fn apply_energy_cost(&mut self) {
        // Status effects don't apply energy costs
    }

    fn apply_duration(&mut self) {
        // Status effects don't apply durations
    }

    fn create_spawn(&mut self, _spawn_id: usize, _vars: Option<[u8; 4]>) {
        // Status effects can't create spawns directly
    }

    fn log_debug(&self, _message: &str) {
        // TODO: Implement logging when available
    }

    fn read_action_cooldown(&self, _engine: &mut ScriptEngine, _var_index: usize) {
        // Status effects don't have access to action cooldown data
    }

    fn read_action_last_used(&self, _engine: &mut ScriptEngine, _var_index: usize) {
        // Status effects don't have access to action last used data
    }

    fn write_action_last_used(&mut self, _engine: &mut ScriptEngine, _var_index: usize) {
        // Status effects can't modify action last used data
    }
}

/// Process all status effects on a character for one frame
pub fn process_character_status_effects(
    character: &mut Character,
    game_state: &mut GameState,
    status_definitions: &[StatusEffectDefinition],
) -> Result<(), ScriptError> {
    let mut effects_to_remove = Vec::new();

    // Process each active status effect by index to avoid borrowing conflicts
    for index in 0..character.status_effects.len() {
        if let Some(status_def) =
            status_definitions.get(character.status_effects[index].effect_id as usize)
        {
            // Special handling for passive energy regeneration (effect_id = 0)
            if character.status_effects[index].effect_id == 0 {
                process_passive_energy_regeneration(character, game_state)?;
            } else {
                // Create a temporary copy to avoid borrowing conflicts
                let mut temp_instance = character.status_effects[index].clone();
                let mut temp_character = character.clone();

                // Execute tick script
                status_def.execute_tick_script(
                    game_state,
                    &mut temp_character,
                    &mut temp_instance,
                )?;

                // Update the original character and instance with changes
                *character = temp_character;
                character.status_effects[index] = temp_instance;
            }

            // Decrease duration
            if character.status_effects[index].remaining_duration > 0 {
                character.status_effects[index].remaining_duration -= 1;
            }

            // Mark for removal if expired
            if character.status_effects[index].remaining_duration == 0 {
                effects_to_remove.push(index);
            }
        }
    }

    // Remove expired effects (in reverse order to maintain indices)
    for &index in effects_to_remove.iter().rev() {
        let mut removed_effect = character.status_effects.remove(index);

        // Execute off_script for removed effect
        if let Some(status_def) = status_definitions.get(removed_effect.effect_id as usize) {
            status_def.execute_off_script(game_state, character, &mut removed_effect)?;
        }
    }

    Ok(())
}

/// Process passive energy regeneration with timing logic handled in Rust
fn process_passive_energy_regeneration(
    character: &mut Character,
    game_state: &GameState,
) -> Result<(), ScriptError> {
    // Check if energy regeneration is disabled (rate = 0)
    if character.energy_regen_rate == 0 {
        return Ok(());
    }

    // Check if it's time to regenerate (frame % rate == 0)
    if game_state.frame % (character.energy_regen_rate as u16) == 0 {
        // Add energy with saturation
        character.energy = character.energy.saturating_add(character.energy_regen);
    }

    Ok(())
}

/// Remove a specific status effect from a character
pub fn remove_status_effect(
    character: &mut Character,
    game_state: &mut GameState,
    effect_id: u8,
    status_definitions: &[StatusEffectDefinition],
) -> Result<bool, ScriptError> {
    if let Some(index) = character
        .status_effects
        .iter()
        .position(|effect| effect.effect_id == effect_id)
    {
        let mut removed_effect = character.status_effects.remove(index);

        // Execute off_script for removed effect
        if let Some(status_def) = status_definitions.get(effect_id as usize) {
            status_def.execute_off_script(game_state, character, &mut removed_effect)?;
        }

        Ok(true)
    } else {
        Ok(false)
    }
}

/// Create the passive energy regeneration StatusEffectDefinition
pub fn create_passive_energy_regen_status_effect() -> StatusEffectDefinition {
    StatusEffectDefinition {
        duration: u16::MAX,    // Permanent effect (never expires)
        stack_limit: 1,        // Only one instance allowed
        reset_on_stack: false, // Don't reset duration when reapplied
        args: [0; 8],
        spawns: [0; 4],
        on_script: vec![0, 1], // Exit with success flag (no initialization needed)
        tick_script: vec![
            // Simple energy regeneration script - timing logic handled in Rust
            // Read energy_regen amount into vars[0]
            10, 0, 0x25, // ReadProp vars[0] = energy_regen
            // Read current energy into vars[1]
            10, 1, 0x23, // ReadProp vars[1] = current_energy
            // Add energy_regen to current energy (with saturation)
            40, 2, 1, 0, // AddByte vars[2] = vars[1] + vars[0] (current + regen)
            // Write new energy back to character
            11, 0x23, 2, // WriteProp energy = vars[2]
            // Exit with success
            0, 1,
        ],
        off_script: vec![0, 1], // Exit with success flag (no cleanup needed)
    }
}

/// Apply passive energy regeneration to all characters in the game
pub fn apply_passive_energy_regen_to_all_characters(
    characters: &mut Vec<Character>,
) -> Result<(), ScriptError> {
    for character in characters.iter_mut() {
        // Only apply if the character doesn't already have this effect
        let already_has_effect = character
            .status_effects
            .iter()
            .any(|effect| effect.effect_id == 0);

        if !already_has_effect {
            // Manually add the passive energy regeneration status effect instance
            character.status_effects.push(StatusEffectInstance {
                effect_id: 0,
                remaining_duration: u16::MAX, // Permanent effect
                stack_count: 1,
                vars: [0; 4],
                fixed: [Fixed::ZERO; 4],
            });
        }
    }

    Ok(())
}

/// Helper function to extract script bytes from definition
fn extract_script(props: &[u16], from: usize, to: usize) -> Vec<u8> {
    props
        .get(from..to)
        .map_or_else(Vec::new, |slice| slice.iter().map(|&x| x as u8).collect())
}
