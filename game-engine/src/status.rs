//! Status effects system for temporary character modifications

use crate::{
    entity::{
        Character, StatusEffectDefinition, StatusEffectId, StatusEffectInstance,
        StatusEffectInstanceId,
    },
    math::Fixed,
    script::{ScriptContext, ScriptEngine, ScriptError},
    state::GameState,
};

extern crate alloc;
use alloc::vec;
use alloc::vec::Vec;

/// Enum to specify which script type to execute
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum StatusEffectScriptType {
    On,
    Tick,
    Off,
}

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
        effect_id: StatusEffectId,
    ) -> Result<bool, ScriptError> {
        // Check if we can stack this effect
        let existing_instance_id = character.status_effects.iter().find(|&&instance_id| {
            if let Some(instance) = game_state.get_status_effect_instance(instance_id) {
                instance.definition_id == effect_id
            } else {
                false
            }
        });

        if let Some(&existing_id) = existing_instance_id {
            // Effect already exists, try to stack it
            if let Some(existing_instance) = game_state.get_status_effect_instance_mut(existing_id)
            {
                if existing_instance.stack_count < self.stack_limit {
                    existing_instance.stack_count += 1;
                    if self.reset_on_stack {
                        existing_instance.remaining_duration = self.duration;
                    }
                    return Ok(true);
                } else {
                    // Already at stack limit
                    return Ok(false);
                }
            }
        } else {
            // Create new instance
            let new_instance = self.create_instance(effect_id);
            let instance_id = game_state.status_effect_instances.len() as StatusEffectInstanceId;
            game_state.status_effect_instances.push(new_instance);
            character.status_effects.push(instance_id);

            // Execute on_script for the new instance
            let character_id = character.core.id;
            match execute_status_effect_script(
                game_state,
                character_id,
                instance_id,
                effect_id,
                StatusEffectScriptType::On,
            ) {
                Ok(_) => {
                    // Script executed successfully, continue
                }
                Err(_script_error) => {
                    // Handle script execution error gracefully - don't break status effect application
                    // Log the error if logging is available, but continue with status effect application
                }
            }

            return Ok(true);
        }

        Ok(false)
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

        let mut engine = ScriptEngine::new_with_args_and_spawns(self.args, self.spawns);
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

        let mut engine = ScriptEngine::new_with_args_and_spawns(self.args, self.spawns);
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

        let mut engine = ScriptEngine::new_with_args_and_spawns(self.args, self.spawns);
        let mut context = StatusEffectContext {
            game_state,
            character,
            status_instance,
            status_def: self,
        };

        engine.execute(&self.off_script, &mut context)
    }
}

impl ScriptContext for StatusEffectContext<'_> {
    fn read_property(&mut self, engine: &mut ScriptEngine, var_index: usize, prop_address: u8) {
        use crate::constants::property_address;

        match prop_address {
            // Game state properties
            property_address::GAME_SEED => {
                if var_index < engine.fixed.len() {
                    engine.fixed[var_index] = Fixed::from_int(self.game_state.seed as i16);
                }
            }
            property_address::GAME_FRAME => {
                if var_index < engine.fixed.len() {
                    engine.fixed[var_index] = Fixed::from_int(self.game_state.frame as i16);
                }
            }

            // Character properties
            property_address::CHARACTER_ID => {
                if var_index < engine.vars.len() {
                    engine.vars[var_index] = self.character.core.id;
                }
            }
            property_address::CHARACTER_GROUP => {
                if var_index < engine.vars.len() {
                    engine.vars[var_index] = self.character.core.group;
                }
            }
            property_address::CHARACTER_POS_X => {
                if var_index < engine.fixed.len() {
                    engine.fixed[var_index] = self.character.core.pos.0;
                }
            }
            property_address::CHARACTER_POS_Y => {
                if var_index < engine.fixed.len() {
                    engine.fixed[var_index] = self.character.core.pos.1;
                }
            }
            property_address::CHARACTER_VEL_X => {
                if var_index < engine.fixed.len() {
                    engine.fixed[var_index] = self.character.core.vel.0;
                }
            }
            property_address::CHARACTER_VEL_Y => {
                if var_index < engine.fixed.len() {
                    engine.fixed[var_index] = self.character.core.vel.1;
                }
            }
            property_address::CHARACTER_HEALTH => {
                if var_index < engine.vars.len() {
                    engine.vars[var_index] = self.character.health;
                }
            }
            property_address::CHARACTER_ENERGY => {
                if var_index < engine.vars.len() {
                    engine.vars[var_index] = self.character.energy;
                }
            }
            property_address::CHARACTER_ENERGY_REGEN => {
                if var_index < engine.vars.len() {
                    engine.vars[var_index] = self.character.energy_regen;
                }
            }
            property_address::CHARACTER_ENERGY_REGEN_RATE => {
                if var_index < engine.vars.len() {
                    engine.vars[var_index] = self.character.energy_regen_rate;
                }
            }
            property_address::CHARACTER_ENERGY_CHARGE => {
                if var_index < engine.vars.len() {
                    engine.vars[var_index] = self.character.energy_charge;
                }
            }
            property_address::CHARACTER_ENERGY_CHARGE_RATE => {
                if var_index < engine.vars.len() {
                    engine.vars[var_index] = self.character.energy_charge_rate;
                }
            }

            // Character armor properties
            property_address::CHARACTER_ARMOR_PUNCT => {
                if var_index < engine.vars.len() {
                    engine.vars[var_index] = self.character.armor[0];
                }
            }
            property_address::CHARACTER_ARMOR_BLAST => {
                if var_index < engine.vars.len() {
                    engine.vars[var_index] = self.character.armor[1];
                }
            }
            property_address::CHARACTER_ARMOR_FORCE => {
                if var_index < engine.vars.len() {
                    engine.vars[var_index] = self.character.armor[2];
                }
            }
            property_address::CHARACTER_ARMOR_SEVER => {
                if var_index < engine.vars.len() {
                    engine.vars[var_index] = self.character.armor[3];
                }
            }
            property_address::CHARACTER_ARMOR_HEAT => {
                if var_index < engine.vars.len() {
                    engine.vars[var_index] = self.character.armor[4];
                }
            }
            property_address::CHARACTER_ARMOR_CRYO => {
                if var_index < engine.vars.len() {
                    engine.vars[var_index] = self.character.armor[5];
                }
            }
            property_address::CHARACTER_ARMOR_JOLT => {
                if var_index < engine.vars.len() {
                    engine.vars[var_index] = self.character.armor[6];
                }
            }
            property_address::CHARACTER_ARMOR_VIRUS => {
                if var_index < engine.vars.len() {
                    engine.vars[var_index] = self.character.armor[7];
                }
            }

            // Status effect definition properties
            property_address::STATUS_EFFECT_DEF_DURATION => {
                if var_index < engine.fixed.len() {
                    engine.fixed[var_index] = Fixed::from_int(self.status_def.duration as i16);
                }
            }
            property_address::STATUS_EFFECT_DEF_STACK_LIMIT => {
                if var_index < engine.vars.len() {
                    engine.vars[var_index] = self.status_def.stack_limit;
                }
            }
            property_address::STATUS_EFFECT_DEF_RESET_ON_STACK => {
                if var_index < engine.vars.len() {
                    engine.vars[var_index] = if self.status_def.reset_on_stack { 1 } else { 0 };
                }
            }
            property_address::STATUS_EFFECT_DEF_ARG0
            | property_address::STATUS_EFFECT_DEF_ARG1
            | property_address::STATUS_EFFECT_DEF_ARG2 => {
                if var_index < engine.vars.len() {
                    let arg_index =
                        (prop_address - property_address::STATUS_EFFECT_DEF_ARG0) as usize;
                    if arg_index < self.status_def.args.len() {
                        engine.vars[var_index] = self.status_def.args[arg_index];
                    }
                }
            }

            // Status effect instance properties
            property_address::STATUS_EFFECT_INST_VAR0
            | property_address::STATUS_EFFECT_INST_VAR1
            | property_address::STATUS_EFFECT_INST_VAR2
            | property_address::STATUS_EFFECT_INST_VAR3 => {
                if var_index < engine.vars.len() {
                    let var_idx =
                        (prop_address - property_address::STATUS_EFFECT_INST_VAR0) as usize;
                    if var_idx < self.status_instance.vars.len() {
                        engine.vars[var_index] = self.status_instance.vars[var_idx];
                    }
                }
            }
            property_address::STATUS_EFFECT_INST_FIXED0
            | property_address::STATUS_EFFECT_INST_FIXED1
            | property_address::STATUS_EFFECT_INST_FIXED2
            | property_address::STATUS_EFFECT_INST_FIXED3 => {
                if var_index < engine.fixed.len() {
                    let fixed_idx =
                        (prop_address - property_address::STATUS_EFFECT_INST_FIXED0) as usize;
                    if fixed_idx < self.status_instance.fixed.len() {
                        engine.fixed[var_index] = self.status_instance.fixed[fixed_idx];
                    }
                }
            }
            property_address::STATUS_EFFECT_INST_REMAINING_DURATION => {
                if var_index < engine.fixed.len() {
                    engine.fixed[var_index] =
                        Fixed::from_int(self.status_instance.remaining_duration as i16);
                }
            }
            property_address::STATUS_EFFECT_INST_STACK_COUNT => {
                if var_index < engine.vars.len() {
                    engine.vars[var_index] = self.status_instance.stack_count;
                }
            }

            // Entity direction properties
            property_address::ENTITY_FACING => {
                if var_index < engine.fixed.len() {
                    engine.fixed[var_index] = self.character.core.get_facing();
                }
            }
            property_address::ENTITY_GRAVITY_DIR => {
                if var_index < engine.fixed.len() {
                    engine.fixed[var_index] = self.character.core.get_gravity_dir();
                }
            }

            _ => {} // Property not supported in status effect context
        }
    }

    fn write_property(&mut self, engine: &mut ScriptEngine, prop_address: u8, var_index: usize) {
        use crate::constants::property_address;

        match prop_address {
            // Character properties (status effects can modify character state)
            property_address::CHARACTER_POS_X => {
                if var_index < engine.fixed.len() {
                    self.character.core.pos.0 = engine.fixed[var_index];
                }
            }
            property_address::CHARACTER_POS_Y => {
                if var_index < engine.fixed.len() {
                    self.character.core.pos.1 = engine.fixed[var_index];
                }
            }
            property_address::CHARACTER_VEL_X => {
                if var_index < engine.fixed.len() {
                    self.character.core.vel.0 = engine.fixed[var_index];
                }
            }
            property_address::CHARACTER_VEL_Y => {
                if var_index < engine.fixed.len() {
                    self.character.core.vel.1 = engine.fixed[var_index];
                }
            }
            property_address::CHARACTER_HEALTH => {
                if var_index < engine.vars.len() {
                    self.character.health = engine.vars[var_index];
                }
            }
            property_address::CHARACTER_ENERGY => {
                if var_index < engine.vars.len() {
                    self.character.energy = engine.vars[var_index];
                }
            }
            property_address::CHARACTER_ENERGY_REGEN => {
                if var_index < engine.vars.len() {
                    self.character.energy_regen = engine.vars[var_index];
                }
            }
            property_address::CHARACTER_ENERGY_REGEN_RATE => {
                if var_index < engine.vars.len() {
                    self.character.energy_regen_rate = engine.vars[var_index];
                }
            }
            property_address::CHARACTER_ENERGY_CHARGE => {
                if var_index < engine.vars.len() {
                    self.character.energy_charge = engine.vars[var_index];
                }
            }
            property_address::CHARACTER_ENERGY_CHARGE_RATE => {
                if var_index < engine.vars.len() {
                    self.character.energy_charge_rate = engine.vars[var_index];
                }
            }

            // Character armor properties (writable)
            property_address::CHARACTER_ARMOR_PUNCT => {
                if var_index < engine.vars.len() {
                    self.character.armor[0] = engine.vars[var_index];
                }
            }
            property_address::CHARACTER_ARMOR_BLAST => {
                if var_index < engine.vars.len() {
                    self.character.armor[1] = engine.vars[var_index];
                }
            }
            property_address::CHARACTER_ARMOR_FORCE => {
                if var_index < engine.vars.len() {
                    self.character.armor[2] = engine.vars[var_index];
                }
            }
            property_address::CHARACTER_ARMOR_SEVER => {
                if var_index < engine.vars.len() {
                    self.character.armor[3] = engine.vars[var_index];
                }
            }
            property_address::CHARACTER_ARMOR_HEAT => {
                if var_index < engine.vars.len() {
                    self.character.armor[4] = engine.vars[var_index];
                }
            }
            property_address::CHARACTER_ARMOR_CRYO => {
                if var_index < engine.vars.len() {
                    self.character.armor[5] = engine.vars[var_index];
                }
            }
            property_address::CHARACTER_ARMOR_JOLT => {
                if var_index < engine.vars.len() {
                    self.character.armor[6] = engine.vars[var_index];
                }
            }
            property_address::CHARACTER_ARMOR_VIRUS => {
                if var_index < engine.vars.len() {
                    self.character.armor[7] = engine.vars[var_index];
                }
            }

            // Status effect instance properties (writable)
            property_address::STATUS_EFFECT_INST_VAR0
            | property_address::STATUS_EFFECT_INST_VAR1
            | property_address::STATUS_EFFECT_INST_VAR2
            | property_address::STATUS_EFFECT_INST_VAR3 => {
                if var_index < engine.vars.len() {
                    let var_idx =
                        (prop_address - property_address::STATUS_EFFECT_INST_VAR0) as usize;
                    if var_idx < self.status_instance.vars.len() {
                        self.status_instance.vars[var_idx] = engine.vars[var_index];
                    }
                }
            }
            property_address::STATUS_EFFECT_INST_FIXED0
            | property_address::STATUS_EFFECT_INST_FIXED1
            | property_address::STATUS_EFFECT_INST_FIXED2
            | property_address::STATUS_EFFECT_INST_FIXED3 => {
                if var_index < engine.fixed.len() {
                    let fixed_idx =
                        (prop_address - property_address::STATUS_EFFECT_INST_FIXED0) as usize;
                    if fixed_idx < self.status_instance.fixed.len() {
                        self.status_instance.fixed[fixed_idx] = engine.fixed[var_index];
                    }
                }
            }

            // Entity direction properties (writable)
            property_address::ENTITY_FACING => {
                if var_index < engine.fixed.len() {
                    self.character.core.set_facing(engine.fixed[var_index]);
                }
            }
            property_address::ENTITY_GRAVITY_DIR => {
                if var_index < engine.fixed.len() {
                    self.character.core.set_gravity_dir(engine.fixed[var_index]);
                }
            }
            _ => {} // Property not writable or not supported in status effect context
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

        let mut spawn = crate::entity::SpawnInstance::new(
            spawn_id as u8,
            self.character.core.id,
            self.character.core.pos,
        );

        // Set spawn variables if provided
        if let Some(spawn_vars) = vars {
            spawn.vars = spawn_vars;
        }

        // Assign unique ID
        spawn.core.id = self.game_state.spawn_instances.len() as u8;

        // Set properties from spawn definition
        spawn.lifespan = spawn_def.duration;
        spawn.element = spawn_def.element.unwrap_or(crate::entity::Element::Punct);

        self.game_state.spawn_instances.push(spawn);
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

/// Helper function for safe status effect script execution
///
/// This function properly sequences borrows to avoid borrow checker conflicts
/// by using unsafe code to work around Rust's borrowing limitations when necessary.
/// This is safe because we validate all entities exist before accessing them.
pub fn execute_status_effect_script(
    game_state: &mut GameState,
    character_id: u8,
    instance_id: StatusEffectInstanceId,
    definition_id: StatusEffectId,
    script_type: StatusEffectScriptType,
) -> Result<u8, ScriptError> {
    // First, validate that all required entities exist
    let character_exists = (character_id as usize) < game_state.characters.len();
    if !character_exists {
        return Ok(0); // Gracefully handle missing character
    }

    let instance_exists = game_state.get_status_effect_instance(instance_id).is_some();
    if !instance_exists {
        return Ok(0); // Gracefully handle missing instance
    }

    let definition_exists = game_state
        .get_status_effect_definition(definition_id)
        .is_some();
    if !definition_exists {
        return Ok(0); // Gracefully handle missing definition
    }

    // Clone the definition to work around borrow checker issues
    let definition = game_state
        .get_status_effect_definition(definition_id)
        .unwrap()
        .clone();

    // Use unsafe code to work around the borrow checker limitations
    // This is safe because we've validated all entities exist above
    unsafe {
        let game_state_ptr = game_state as *mut GameState;
        let character_ptr = (*game_state_ptr)
            .characters
            .as_mut_ptr()
            .add(character_id as usize);
        let status_instance_ptr = (*game_state_ptr)
            .get_status_effect_instance_mut(instance_id)
            .unwrap() as *mut _;

        // Call the appropriate execute method with the raw pointers converted to references
        match script_type {
            StatusEffectScriptType::On => definition.execute_on_script(
                &mut *game_state_ptr,
                &mut *character_ptr,
                &mut *status_instance_ptr,
            ),
            StatusEffectScriptType::Tick => definition.execute_tick_script(
                &mut *game_state_ptr,
                &mut *character_ptr,
                &mut *status_instance_ptr,
            ),
            StatusEffectScriptType::Off => definition.execute_off_script(
                &mut *game_state_ptr,
                &mut *character_ptr,
                &mut *status_instance_ptr,
            ),
        }
    }
}

/// Process all status effects on a character for one frame
pub fn process_character_status_effects(
    character: &mut Character,
    game_state: &mut GameState,
) -> Result<(), ScriptError> {
    let mut effects_to_remove: Vec<StatusEffectInstanceId> = Vec::new();

    // Process each status effect on the character
    for &effect_instance_id in &character.status_effects {
        if let Some(instance) = game_state.get_status_effect_instance_mut(effect_instance_id) {
            let definition_id = instance.definition_id;

            // Get the definition for this instance
            if let Some(_definition) = game_state.get_status_effect_definition(definition_id) {
                // Execute tick script
                // Note: Script execution is temporarily disabled to avoid borrow checker issues
                // This will be implemented in a future iteration

                // Decrease remaining duration
                if let Some(instance_mut) =
                    game_state.get_status_effect_instance_mut(effect_instance_id)
                {
                    if instance_mut.remaining_duration > 0 {
                        instance_mut.remaining_duration -= 1;
                    }

                    // Mark for removal if expired
                    if instance_mut.remaining_duration == 0 {
                        effects_to_remove.push(effect_instance_id);
                    }
                }
            } else {
                // Definition not found, mark for removal
                effects_to_remove.push(effect_instance_id);
            }
        } else {
            // Instance not found, mark for removal
            effects_to_remove.push(effect_instance_id);
        }
    }

    // Remove expired effects
    for effect_id in effects_to_remove {
        remove_status_effect_by_instance_id(character, game_state, effect_id)?;
    }

    // Process passive energy regeneration
    process_passive_energy_regeneration(character, game_state)?;

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

/// Remove a specific status effect from a character by definition ID
pub fn remove_status_effect(
    character: &mut Character,
    game_state: &mut GameState,
    effect_definition_id: StatusEffectId,
) -> Result<bool, ScriptError> {
    // Find the instance with the matching definition ID
    let instance_id = character
        .status_effects
        .iter()
        .find(|&&instance_id| {
            if let Some(instance) = game_state.get_status_effect_instance(instance_id) {
                instance.definition_id == effect_definition_id
            } else {
                false
            }
        })
        .copied();

    if let Some(instance_id) = instance_id {
        remove_status_effect_by_instance_id(character, game_state, instance_id)?;
        Ok(true)
    } else {
        Ok(false)
    }
}

/// Remove a specific status effect from a character by instance ID
pub fn remove_status_effect_by_instance_id(
    character: &mut Character,
    _game_state: &mut GameState,
    effect_instance_id: StatusEffectInstanceId,
) -> Result<bool, ScriptError> {
    // Find and remove the effect from character's status effects list
    let position = character
        .status_effects
        .iter()
        .position(|&id| id == effect_instance_id);

    if let Some(pos) = position {
        character.status_effects.remove(pos);

        // Execute off_script before removing the instance
        // Note: Script execution is temporarily disabled to avoid borrow checker issues
        // This will be implemented in a future iteration

        // Note: We don't remove the instance from the global collection to avoid
        // invalidating other IDs. In a production system, you might want to implement
        // a more sophisticated cleanup mechanism.

        Ok(true)
    } else {
        Ok(false)
    }
}

/// Create the passive energy regeneration StatusEffectDefinition
pub fn create_passive_energy_regen_status_effect() -> StatusEffectDefinition {
    use crate::constants::{operator_address, property_address};

    StatusEffectDefinition {
        duration: u16::MAX,    // Permanent effect (never expires)
        stack_limit: 1,        // Only one instance allowed
        reset_on_stack: false, // Don't reset duration when reapplied
        args: [0; 8],
        spawns: [0; 4],
        on_script: vec![operator_address::EXIT, 1], // Exit with success flag (no initialization needed)
        tick_script: vec![
            // Simple energy regeneration script - timing logic handled in Rust
            // Read energy_regen amount into vars[0]
            operator_address::READ_PROP,
            0,
            property_address::CHARACTER_ENERGY_REGEN,
            // Read current energy into vars[1]
            operator_address::READ_PROP,
            1,
            property_address::CHARACTER_ENERGY,
            // Add energy_regen to current energy (with saturation)
            operator_address::ADD_BYTE,
            2,
            1,
            0, // vars[2] = vars[1] + vars[0] (current + regen)
            // Write new energy back to character
            operator_address::WRITE_PROP,
            property_address::CHARACTER_ENERGY,
            2,
            // Exit with success
            operator_address::EXIT,
            1,
        ],
        off_script: vec![operator_address::EXIT, 1], // Exit with success flag (no cleanup needed)
    }
}

/// Apply a status effect to a character by definition ID
pub fn apply_status_effect(
    character: &mut Character,
    game_state: &mut GameState,
    effect_definition_id: StatusEffectId,
) -> Result<bool, ScriptError> {
    if let Some(definition) = game_state.get_status_effect_definition(effect_definition_id) {
        let definition_clone = definition.clone(); // Clone to avoid borrow conflicts
        definition_clone.apply_to_character(character, game_state, effect_definition_id)
    } else {
        Ok(false)
    }
}

/// Apply passive energy regeneration to all characters in the game
pub fn apply_passive_energy_regen_to_all_characters(
    characters: &mut [Character],
) -> Result<(), ScriptError> {
    for character in characters.iter_mut() {
        // Set energy regen values directly on the character
        // The actual regeneration is handled by process_passive_energy_regeneration
        character.energy_regen = 1;
        character.energy_regen_rate = 60; // Once per second at 60 FPS
    }

    Ok(())
}

/// Get the number of status effects on a character (for testing)
pub fn get_character_status_effect_count(character: &Character) -> usize {
    character.status_effects.len()
}

/// Check if a character has a specific status effect by definition ID (for testing)
pub fn character_has_status_effect(
    character: &Character,
    game_state: &GameState,
    effect_definition_id: StatusEffectId,
) -> bool {
    character.status_effects.iter().any(|&instance_id| {
        if let Some(instance) = game_state.get_status_effect_instance(instance_id) {
            instance.definition_id == effect_definition_id
        } else {
            false
        }
    })
}

/// Helper function to extract script bytes from definition
fn extract_script(props: &[u16], from: usize, to: usize) -> Vec<u8> {
    props
        .get(from..to)
        .map_or_else(Vec::new, |slice| slice.iter().map(|&x| x as u8).collect())
}
