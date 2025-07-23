//! Status effects system for temporary character modifications

use crate::{
    entity::{Character, StatusEffect, StatusEffectInstance},
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
    pub status_def: &'a StatusEffect,
}

impl StatusEffect {
    /// Create a new status effect from definition data
    pub fn from_def(props: Vec<u16>) -> Self {
        Self {
            duration: props[0],
            stack_limit: props[1] as u8,
            reset_on_stack: props[2] != 0,
            vars: [0; 8],
            fixed: [Fixed::ZERO; 4],
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
            0x21 => {
                if var_index < engine.vars.len() {
                    engine.vars[var_index] = self.character.health;
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

            // Character armor properties (0x40-0x47)
            0x40..=0x47 => {
                if var_index < engine.vars.len() {
                    let armor_index = (prop_address - 0x40) as usize;
                    engine.vars[var_index] = self.character.armor[armor_index];
                }
            }

            // Status effect definition properties
            0x84 => {
                if var_index < engine.fixed.len() {
                    engine.fixed[var_index] = Fixed::from_int(self.status_def.duration as i16);
                }
            }
            0x86 => {
                if var_index < engine.vars.len() {
                    engine.vars[var_index] = self.status_def.stack_limit;
                }
            }
            0x87 => {
                if var_index < engine.vars.len() {
                    engine.vars[var_index] = if self.status_def.reset_on_stack { 1 } else { 0 };
                }
            }

            // Status effect instance properties
            0x8C => {
                if var_index < engine.vars.len() {
                    engine.vars[var_index] = self.status_instance.effect_id;
                }
            }
            0x8D => {
                if var_index < engine.vars.len() {
                    engine.vars[var_index] = self.status_instance.stack_count;
                }
            }
            0x8E => {
                if var_index < engine.fixed.len() {
                    engine.fixed[var_index] =
                        Fixed::from_int(self.status_instance.remaining_duration as i16);
                }
            }

            // Status effect instance variables
            0x8F..=0x92 => {
                if var_index < engine.vars.len() {
                    let var_idx = (prop_address - 0x8F) as usize;
                    engine.vars[var_index] = self.status_instance.vars[var_idx];
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
            // Character properties (status effects can modify character state)
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

            // Character armor properties (0x40-0x47) - write support
            0x40..=0x47 => {
                if var_index < engine.vars.len() {
                    let armor_index = (prop_address - 0x40) as usize;
                    self.character.armor[armor_index] = engine.vars[var_index];
                }
            }

            // Status effect instance variables
            0x8F..=0x92 => {
                if var_index < engine.vars.len() {
                    let var_idx = (prop_address - 0x8F) as usize;
                    self.status_instance.vars[var_idx] = engine.vars[var_index];
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
    status_definitions: &[StatusEffect],
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
    status_definitions: &[StatusEffect],
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

/// Create the passive energy regeneration StatusEffect definition
pub fn create_passive_energy_regen_status_effect() -> StatusEffect {
    StatusEffect {
        duration: u16::MAX,    // Permanent effect (never expires)
        stack_limit: 1,        // Only one instance allowed
        reset_on_stack: false, // Don't reset duration when reapplied
        vars: [0; 8],
        fixed: [crate::math::Fixed::ZERO; 4],
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

#[cfg(test)]
mod tests {
    use super::*;
    use crate::test_utils::{create_test_character, create_test_game_state};
    use alloc::vec;

    #[test]
    fn test_status_effect_creation() {
        let props = vec![300, 5, 1]; // duration=300, stack_limit=5, reset_on_stack=true
        let status_effect = StatusEffect::from_def(props);

        assert_eq!(status_effect.duration, 300);
        assert_eq!(status_effect.stack_limit, 5);
        assert_eq!(status_effect.reset_on_stack, true);
        assert!(status_effect.on_script.is_empty());
        assert!(status_effect.tick_script.is_empty());
        assert!(status_effect.off_script.is_empty());
    }

    #[test]
    fn test_status_effect_instance_creation() {
        let instance = StatusEffectInstance {
            effect_id: 2,
            remaining_duration: 180,
            stack_count: 1,
            vars: [10, 20, 30, 40],
        };

        assert_eq!(instance.effect_id, 2);
        assert_eq!(instance.remaining_duration, 180);
        assert_eq!(instance.stack_count, 1);
        assert_eq!(instance.vars, [10, 20, 30, 40]);
    }

    #[test]
    fn test_status_effect_application_new() {
        let mut character = create_test_character();
        let mut game_state = create_test_game_state();

        let status_effect = StatusEffect {
            duration: 300,
            stack_limit: 3,
            reset_on_stack: false,
            vars: [0; 8],
            fixed: [Fixed::ZERO; 4],
            args: [0; 8],
            spawns: [0; 4],
            on_script: vec![0, 1], // Exit with flag 1
            tick_script: vec![],
            off_script: vec![],
        };

        let result = status_effect.apply_to_character(&mut character, &mut game_state, 1);
        assert!(result.is_ok());
        assert_eq!(character.status_effects.len(), 1);
        assert_eq!(character.status_effects[0].stack_count, 1);
        assert_eq!(character.status_effects[0].remaining_duration, 300);
        assert_eq!(character.status_effects[0].effect_id, 1);
    }

    #[test]
    fn test_status_effect_stacking() {
        let mut character = create_test_character();
        let mut game_state = create_test_game_state();

        // Add initial status effect
        character.status_effects.push(StatusEffectInstance {
            effect_id: 1,
            remaining_duration: 200,
            stack_count: 1,
            vars: [0; 4],
        });

        let status_effect = StatusEffect {
            duration: 300,
            stack_limit: 3,
            reset_on_stack: true,
            vars: [0; 8],
            fixed: [Fixed::ZERO; 4],
            args: [0; 8],
            spawns: [0; 4],
            on_script: vec![0, 1], // Exit with flag 1
            tick_script: vec![],
            off_script: vec![],
        };

        let result = status_effect.apply_to_character(&mut character, &mut game_state, 1);
        assert!(result.is_ok());
        assert_eq!(character.status_effects.len(), 1);
        assert_eq!(character.status_effects[0].stack_count, 2);
        assert_eq!(character.status_effects[0].remaining_duration, 300); // Reset due to reset_on_stack
    }

    #[test]
    fn test_status_effect_stack_limit() {
        let mut character = create_test_character();
        let mut game_state = create_test_game_state();

        // Add status effect at stack limit
        character.status_effects.push(StatusEffectInstance {
            effect_id: 1,
            remaining_duration: 200,
            stack_count: 2, // At limit
            vars: [0; 4],
        });

        let status_effect = StatusEffect {
            duration: 300,
            stack_limit: 2, // Stack limit is 2
            reset_on_stack: false,
            vars: [0; 8],
            fixed: [Fixed::ZERO; 4],
            args: [0; 8],
            spawns: [0; 4],
            on_script: vec![0, 1], // Exit with flag 1
            tick_script: vec![],
            off_script: vec![],
        };

        let result = status_effect.apply_to_character(&mut character, &mut game_state, 1);
        assert!(result.is_ok());
        assert_eq!(character.status_effects.len(), 1);
        assert_eq!(character.status_effects[0].stack_count, 2); // Should not increase
        assert_eq!(character.status_effects[0].remaining_duration, 200); // Should not reset
    }

    #[test]
    fn test_status_effect_processing() {
        let mut character = create_test_character();
        let mut game_state = create_test_game_state();

        // Add a status effect with 2 frames remaining
        character.status_effects.push(StatusEffectInstance {
            effect_id: 0,
            remaining_duration: 2,
            stack_count: 1,
            vars: [0; 4],
        });

        let status_definitions = vec![StatusEffect {
            duration: 300,
            stack_limit: 1,
            reset_on_stack: false,
            vars: [0; 8],
            fixed: [Fixed::ZERO; 4],
            args: [0; 8],
            spawns: [0; 4],
            on_script: vec![],
            tick_script: vec![0, 1], // Exit with flag 1
            off_script: vec![0, 1],  // Exit with flag 1
        }];

        // Process first frame
        let result =
            process_character_status_effects(&mut character, &mut game_state, &status_definitions);
        assert!(result.is_ok());
        assert_eq!(character.status_effects.len(), 1);
        assert_eq!(character.status_effects[0].remaining_duration, 1);

        // Process second frame - should remove the effect
        let result =
            process_character_status_effects(&mut character, &mut game_state, &status_definitions);
        assert!(result.is_ok());
        assert_eq!(character.status_effects.len(), 0); // Effect should be removed
    }

    #[test]
    fn test_status_effect_removal() {
        let mut character = create_test_character();
        let mut game_state = create_test_game_state();

        // Add two status effects
        character.status_effects.push(StatusEffectInstance {
            effect_id: 1,
            remaining_duration: 100,
            stack_count: 1,
            vars: [0; 4],
        });
        character.status_effects.push(StatusEffectInstance {
            effect_id: 2,
            remaining_duration: 200,
            stack_count: 1,
            vars: [0; 4],
        });

        let status_definitions = vec![
            StatusEffect {
                duration: 300,
                stack_limit: 1,
                reset_on_stack: false,
                vars: [0; 8],
                fixed: [Fixed::ZERO; 4],
                args: [0; 8],
                spawns: [0; 4],
                on_script: vec![],
                tick_script: vec![],
                off_script: vec![0, 1], // Exit with flag 1
            },
            StatusEffect {
                duration: 300,
                stack_limit: 1,
                reset_on_stack: false,
                vars: [0; 8],
                fixed: [Fixed::ZERO; 4],
                args: [0; 8],
                spawns: [0; 4],
                on_script: vec![],
                tick_script: vec![],
                off_script: vec![0, 1], // Exit with flag 1
            },
        ];

        // Remove effect with ID 1
        let result = remove_status_effect(&mut character, &mut game_state, 1, &status_definitions);
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), true);
        assert_eq!(character.status_effects.len(), 1);
        assert_eq!(character.status_effects[0].effect_id, 2);

        // Try to remove non-existent effect
        let result = remove_status_effect(&mut character, &mut game_state, 5, &status_definitions);
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), false);
        assert_eq!(character.status_effects.len(), 1);
    }

    #[test]
    fn test_status_effect_context_property_reading() {
        let mut character = create_test_character();
        let mut game_state = create_test_game_state();

        character.health = 75;
        character.energy = 50;

        let mut status_instance = StatusEffectInstance {
            effect_id: 1,
            remaining_duration: 120,
            stack_count: 2,
            vars: [10, 20, 30, 40],
        };

        let status_def = StatusEffect {
            duration: 300,
            stack_limit: 5,
            reset_on_stack: true,
            vars: [0; 8],
            fixed: [Fixed::ZERO; 4],
            args: [0; 8],
            spawns: [0; 4],
            on_script: vec![],
            tick_script: vec![],
            off_script: vec![],
        };

        let mut context = StatusEffectContext {
            game_state: &mut game_state,
            character: &mut character,
            status_instance: &mut status_instance,
            status_def: &status_def,
        };

        let mut engine = ScriptEngine::new();

        // Test reading character health
        context.read_property(&mut engine, 0, 0x21);
        assert_eq!(engine.vars[0], 75);

        // Test reading character energy
        context.read_property(&mut engine, 1, 0x23);
        assert_eq!(engine.vars[1], 50);

        // Test reading status effect stack count
        context.read_property(&mut engine, 2, 0x8D);
        assert_eq!(engine.vars[2], 2);

        // Test reading status effect variables
        context.read_property(&mut engine, 3, 0x8F);
        assert_eq!(engine.vars[3], 10);
        context.read_property(&mut engine, 4, 0x92);
        assert_eq!(engine.vars[4], 40);
    }

    #[test]
    fn test_status_effect_context_property_writing() {
        let mut character = create_test_character();
        let mut game_state = create_test_game_state();

        let mut status_instance = StatusEffectInstance {
            effect_id: 1,
            remaining_duration: 120,
            stack_count: 2,
            vars: [0; 4],
        };

        let status_def = StatusEffect {
            duration: 300,
            stack_limit: 5,
            reset_on_stack: true,
            vars: [0; 8],
            fixed: [Fixed::ZERO; 4],
            args: [0; 8],
            spawns: [0; 4],
            on_script: vec![],
            tick_script: vec![],
            off_script: vec![],
        };

        let mut engine = ScriptEngine::new();
        engine.vars[0] = 60;
        engine.vars[1] = 80;
        engine.vars[2] = 100;
        engine.vars[3] = 200;

        // Create context and perform writes
        {
            let mut context = StatusEffectContext {
                game_state: &mut game_state,
                character: &mut character,
                status_instance: &mut status_instance,
                status_def: &status_def,
            };

            // Test writing character health
            context.write_property(&mut engine, 0x21, 0);
            // Test writing character energy
            context.write_property(&mut engine, 0x23, 1);
            // Test writing status effect variables
            context.write_property(&mut engine, 0x8F, 2);
            context.write_property(&mut engine, 0x92, 3);
        }

        // Now test the results after context is dropped
        assert_eq!(character.health, 60);
        assert_eq!(character.energy, 80);
        assert_eq!(status_instance.vars[0], 100);
        assert_eq!(status_instance.vars[3], 200);
    }

    #[test]
    fn test_passive_energy_regen_status_effect_creation() {
        let passive_regen = create_passive_energy_regen_status_effect();

        assert_eq!(passive_regen.duration, u16::MAX); // Permanent effect
        assert_eq!(passive_regen.stack_limit, 1);
        assert_eq!(passive_regen.reset_on_stack, false);
        assert!(!passive_regen.tick_script.is_empty()); // Should have tick script
        assert_eq!(passive_regen.on_script, vec![0, 1]); // Simple success exit
        assert_eq!(passive_regen.off_script, vec![0, 1]); // Simple success exit
    }

    #[test]
    fn test_passive_energy_regen_application() {
        let mut character = create_test_character();
        let mut game_state = create_test_game_state();

        // Set up character with energy regeneration properties
        character.energy = 50;
        character.energy_regen = 5; // Recover 5 energy per rate
        character.energy_regen_rate = 10; // Every 10 frames

        let passive_regen = create_passive_energy_regen_status_effect();
        let status_definitions = vec![passive_regen];

        // Apply the passive regeneration effect
        let result = status_definitions[0].apply_to_character(&mut character, &mut game_state, 0);
        assert!(result.is_ok());
        assert_eq!(character.status_effects.len(), 1);
        assert_eq!(character.status_effects[0].effect_id, 0);
    }

    #[test]
    fn test_passive_energy_regen_timing() {
        let mut character = create_test_character();
        let mut game_state = create_test_game_state();

        // Set up character with energy regeneration
        character.energy = 50;
        character.energy_regen = 10; // Recover 10 energy per rate
        character.energy_regen_rate = 5; // Every 5 frames

        // Apply passive regeneration effect
        character.status_effects.push(StatusEffectInstance {
            effect_id: 0,
            remaining_duration: u16::MAX,
            stack_count: 1,
            vars: [0; 4],
        });

        let passive_regen = create_passive_energy_regen_status_effect();
        let status_definitions = vec![passive_regen];

        // Process frame 0: regeneration should occur (0 % 5 == 0)
        game_state.frame = 0;
        let result =
            process_character_status_effects(&mut character, &mut game_state, &status_definitions);
        assert!(result.is_ok());
        assert_eq!(character.energy, 60); // 50 + 10 = 60

        // Process frames 1-4: no regeneration should occur
        for frame in 1..5 {
            game_state.frame = frame;
            let result = process_character_status_effects(
                &mut character,
                &mut game_state,
                &status_definitions,
            );
            assert!(result.is_ok());
            assert_eq!(character.energy, 60); // No change
        }

        // Process frame 5: regeneration should occur again (5 % 5 == 0)
        game_state.frame = 5;
        let result =
            process_character_status_effects(&mut character, &mut game_state, &status_definitions);
        assert!(result.is_ok());
        assert_eq!(character.energy, 70); // 60 + 10 = 70

        // Process frames 6-9: no regeneration
        for frame in 6..10 {
            game_state.frame = frame;
            let result = process_character_status_effects(
                &mut character,
                &mut game_state,
                &status_definitions,
            );
            assert!(result.is_ok());
            assert_eq!(character.energy, 70); // No change
        }

        // Process frame 10: regeneration should occur again (10 % 5 == 0)
        game_state.frame = 10;
        let result =
            process_character_status_effects(&mut character, &mut game_state, &status_definitions);
        assert!(result.is_ok());
        assert_eq!(character.energy, 80); // 70 + 10 = 80
    }

    #[test]
    fn test_passive_energy_regen_disabled_when_rate_zero() {
        let mut character = create_test_character();
        let mut game_state = create_test_game_state();

        // Set up character with disabled energy regeneration (rate = 0)
        character.energy = 50;
        character.energy_regen = 10; // Amount doesn't matter if rate is 0
        character.energy_regen_rate = 0; // Disabled

        // Apply passive regeneration effect
        character.status_effects.push(StatusEffectInstance {
            effect_id: 0,
            remaining_duration: u16::MAX,
            stack_count: 1,
            vars: [0; 4],
        });

        let passive_regen = create_passive_energy_regen_status_effect();
        let status_definitions = vec![passive_regen];

        // Process several frames - no regeneration should occur
        for frame in 0..20 {
            game_state.frame = frame;
            let result = process_character_status_effects(
                &mut character,
                &mut game_state,
                &status_definitions,
            );
            assert!(result.is_ok());
            assert_eq!(character.energy, 50); // No change
        }
    }

    #[test]
    fn test_passive_energy_regen_saturation() {
        let mut character = create_test_character();
        let mut game_state = create_test_game_state();

        // Set up character near max energy
        character.energy = 250; // Near u8::MAX (255)
        character.energy_regen = 10; // Would overflow if not saturated
        character.energy_regen_rate = 1; // Every frame

        // Apply passive regeneration effect
        character.status_effects.push(StatusEffectInstance {
            effect_id: 0,
            remaining_duration: u16::MAX,
            stack_count: 1,
            vars: [0; 4],
        });

        let passive_regen = create_passive_energy_regen_status_effect();
        let status_definitions = vec![passive_regen];

        // Process frame 0: should saturate at 255
        game_state.frame = 0;
        let result =
            process_character_status_effects(&mut character, &mut game_state, &status_definitions);
        assert!(result.is_ok());
        assert_eq!(character.energy, 255); // Saturated at max u8 value

        // Process frame 1: should remain at 255
        game_state.frame = 1;
        let result =
            process_character_status_effects(&mut character, &mut game_state, &status_definitions);
        assert!(result.is_ok());
        assert_eq!(character.energy, 255); // Still at max
    }

    #[test]
    fn test_apply_passive_energy_regen_to_all_characters() {
        let mut characters = vec![
            create_test_character(),
            create_test_character(),
            create_test_character(),
        ];

        // Set different IDs for characters
        characters[0].core.id = 1;
        characters[1].core.id = 2;
        characters[2].core.id = 3;

        let _game_state = create_test_game_state();
        let passive_regen = create_passive_energy_regen_status_effect();
        let _status_definitions = vec![passive_regen];

        // Apply passive energy regen to all characters
        let result = apply_passive_energy_regen_to_all_characters(&mut characters);
        assert!(result.is_ok());

        // All characters should have the passive regen effect
        for character in &characters {
            assert_eq!(character.status_effects.len(), 1);
            assert_eq!(character.status_effects[0].effect_id, 0);
            assert_eq!(character.status_effects[0].remaining_duration, u16::MAX);
            assert_eq!(character.status_effects[0].stack_count, 1);
        }
    }

    #[test]
    fn test_apply_passive_energy_regen_no_duplicates() {
        let mut characters = vec![create_test_character()];
        characters[0].core.id = 1;

        // Manually add the passive regen effect first
        characters[0].status_effects.push(StatusEffectInstance {
            effect_id: 0,
            remaining_duration: u16::MAX,
            stack_count: 1,
            vars: [0; 4],
        });

        let _game_state = create_test_game_state();
        let passive_regen = create_passive_energy_regen_status_effect();
        let _status_definitions = vec![passive_regen];

        // Try to apply passive energy regen again
        let result = apply_passive_energy_regen_to_all_characters(&mut characters);
        assert!(result.is_ok());

        // Should still have only one instance
        assert_eq!(characters[0].status_effects.len(), 1);
        assert_eq!(characters[0].status_effects[0].effect_id, 0);
    }

    #[test]
    fn test_passive_energy_regen_integration_with_different_rates() {
        let mut character1 = create_test_character();
        let mut character2 = create_test_character();
        let mut game_state = create_test_game_state();

        // Set up characters with different regeneration rates
        character1.core.id = 1;
        character1.energy = 30;
        character1.energy_regen = 5;
        character1.energy_regen_rate = 3; // Every 3 frames

        character2.core.id = 2;
        character2.energy = 40;
        character2.energy_regen = 8;
        character2.energy_regen_rate = 6; // Every 6 frames

        // Apply passive regeneration effects
        let passive_regen = create_passive_energy_regen_status_effect();
        let status_definitions = vec![passive_regen];

        character1.status_effects.push(StatusEffectInstance {
            effect_id: 0,
            remaining_duration: u16::MAX,
            stack_count: 1,
            vars: [0; 4],
        });

        character2.status_effects.push(StatusEffectInstance {
            effect_id: 0,
            remaining_duration: u16::MAX,
            stack_count: 1,
            vars: [0; 4],
        });

        // Test frame progression
        for frame in 0..12 {
            game_state.frame = frame;

            // Process character1
            let result = process_character_status_effects(
                &mut character1,
                &mut game_state,
                &status_definitions,
            );
            assert!(result.is_ok());

            // Process character2
            let result = process_character_status_effects(
                &mut character2,
                &mut game_state,
                &status_definitions,
            );
            assert!(result.is_ok());

            // Check expected energy values
            let expected_char1_energy = 30 + (5 * ((frame + 1) / 3)); // Regenerates every 3 frames
            let expected_char2_energy = 40 + (8 * ((frame + 1) / 6)); // Regenerates every 6 frames

            // Only check when regeneration should have occurred
            if (frame + 1) % 3 == 0 {
                assert_eq!(character1.energy, expected_char1_energy as u8);
            }
            if (frame + 1) % 6 == 0 {
                assert_eq!(character2.energy, expected_char2_energy as u8);
            }
        }

        // Final check: character1 should have regenerated 4 times (frames 3, 6, 9, 12)
        // character2 should have regenerated 2 times (frames 6, 12)
        assert_eq!(character1.energy, 30 + (5 * 4)); // 30 + 20 = 50
        assert_eq!(character2.energy, 40 + (8 * 2)); // 40 + 16 = 56
    }

    #[test]
    fn test_complex_status_effect_scenario() {
        let mut character = create_test_character();
        let mut game_state = create_test_game_state();

        // Create a regeneration status effect that increases health every tick
        let regen_effect = StatusEffect {
            duration: 180, // 3 seconds at 60 FPS
            stack_limit: 3,
            reset_on_stack: false,
            vars: [0; 8],
            fixed: [Fixed::ZERO; 4],
            args: [0; 8],
            spawns: [0; 4],
            on_script: vec![0, 1], // Exit with flag 1
            tick_script: vec![
                // Read current health into var[0]
                10, 0, 0x21, // Add 2 to health (var[0] + 2 -> var[1])
                20, 1, 2, 40, 0, 0, 1, // Write new health back
                11, 0x21, 0, // Exit
                0, 1,
            ],
            off_script: vec![0, 1], // Exit with flag 1
        };

        character.health = 50;

        // Apply the regeneration effect
        let result = regen_effect.apply_to_character(&mut character, &mut game_state, 1);
        assert!(result.is_ok());
        assert_eq!(character.status_effects.len(), 1);

        let status_definitions = vec![
            create_passive_energy_regen_status_effect(), // Index 0 - passive energy regen
            regen_effect,                                // Index 1 - test effect
        ];

        // Process several frames
        for _ in 0..5 {
            let result = process_character_status_effects(
                &mut character,
                &mut game_state,
                &status_definitions,
            );
            assert!(result.is_ok());
        }

        // Health should have increased by 2 per frame for 5 frames
        assert_eq!(character.health, 60); // 50 + (2 * 5)
        assert_eq!(character.status_effects.len(), 1);
        assert_eq!(character.status_effects[0].remaining_duration, 175); // 180 - 5
    }

    #[test]
    fn test_status_effect_energy_regeneration_property_access() {
        let mut character = create_test_character();
        let mut game_state = create_test_game_state();

        // Set energy regeneration properties
        character.energy_regen = 3;
        character.energy_regen_rate = 30;
        character.energy_charge = 8;
        character.energy_charge_rate = 15;

        let mut status_instance = StatusEffectInstance {
            effect_id: 1,
            remaining_duration: 120,
            stack_count: 1,
            vars: [0; 4],
        };

        let status_def = StatusEffect {
            duration: 300,
            stack_limit: 1,
            reset_on_stack: false,
            vars: [0; 8],
            fixed: [Fixed::ZERO; 4],
            args: [0; 8],
            spawns: [0; 4],
            on_script: vec![],
            tick_script: vec![
                10, 0, 0x25, // ReadProp vars[0] = energy_regen (3)
                10, 1, 0x26, // ReadProp vars[1] = energy_regen_rate (30)
                10, 2, 0x27, // ReadProp vars[2] = energy_charge (8)
                10, 3, 0x28, // ReadProp vars[3] = energy_charge_rate (15)
                20, 4, 5, // AssignByte vars[4] = 5 (new energy_regen)
                20, 5, 20, // AssignByte vars[5] = 20 (new energy_regen_rate)
                11, 0x25, 4, // WriteProp energy_regen = vars[4] (5)
                11, 0x26, 5, // WriteProp energy_regen_rate = vars[5] (20)
                0, 1, // Exit with success
            ],
            off_script: vec![],
        };

        let mut context = StatusEffectContext {
            game_state: &mut game_state,
            character: &mut character,
            status_instance: &mut status_instance,
            status_def: &status_def,
        };

        let mut engine = ScriptEngine::new();
        let result = engine.execute(&status_def.tick_script, &mut context);
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), 1);

        // Verify energy regeneration properties were updated
        assert_eq!(character.energy_regen, 5);
        assert_eq!(character.energy_regen_rate, 20);
        assert_eq!(character.energy_charge, 8); // Unchanged
        assert_eq!(character.energy_charge_rate, 15); // Unchanged
    }

    #[test]
    fn test_status_effect_armor_property_access() {
        let mut character = create_test_character();
        let mut game_state = create_test_game_state();

        // Set armor values
        character.armor[0] = 80; // Punct
        character.armor[3] = 120; // Sever
        character.armor[6] = 60; // Jolt

        let mut status_instance = StatusEffectInstance {
            effect_id: 1,
            remaining_duration: 120,
            stack_count: 1,
            vars: [0; 4],
        };

        let status_def = StatusEffect {
            duration: 300,
            stack_limit: 1,
            reset_on_stack: false,
            vars: [0; 8],
            fixed: [Fixed::ZERO; 4],
            args: [0; 8],
            spawns: [0; 4],
            on_script: vec![],
            tick_script: vec![
                10, 0, 0x40, // ReadProp vars[0] = armor[0] (Punct - 80)
                10, 1, 0x43, // ReadProp vars[1] = armor[3] (Sever - 120)
                10, 2, 0x46, // ReadProp vars[2] = armor[6] (Jolt - 60)
                20, 3, 95, // AssignByte vars[3] = 95 (new Punct armor)
                20, 4, 140, // AssignByte vars[4] = 140 (new Sever armor)
                11, 0x40, 3, // WriteProp armor[0] = vars[3] (95)
                11, 0x43, 4, // WriteProp armor[3] = vars[4] (140)
                0, 1, // Exit with success
            ],
            off_script: vec![],
        };

        let mut context = StatusEffectContext {
            game_state: &mut game_state,
            character: &mut character,
            status_instance: &mut status_instance,
            status_def: &status_def,
        };

        let mut engine = ScriptEngine::new();
        let result = engine.execute(&status_def.tick_script, &mut context);
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), 1);

        // Verify armor properties were updated
        assert_eq!(character.armor[0], 95); // Punct updated
        assert_eq!(character.armor[3], 140); // Sever updated
        assert_eq!(character.armor[6], 60); // Jolt unchanged
    }
}
