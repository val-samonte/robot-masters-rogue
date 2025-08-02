//! Game state management

use crate::api::GameResult;
use crate::constants::property_address;
use crate::entity::{
    ActionDefinition, ActionId, ActionInstance, ActionInstanceId, Character, ConditionDefinition,
    ConditionId, ConditionInstance, SpawnDefinition, SpawnInstance, StatusEffectDefinition,
    StatusEffectId, StatusEffectInstance, StatusEffectInstanceId,
};
use crate::math::Fixed;
use crate::physics::Tilemap;
use crate::random::SeededRng;
use crate::script::ScriptError;

use alloc::vec::Vec;

/// Current game status
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum GameStatus {
    Playing,
    Ended,
}

/// Complete game state
#[derive(Debug)]
pub struct GameState {
    pub seed: u16,
    pub frame: u16,
    pub tile_map: Tilemap,
    pub status: GameStatus,
    pub characters: Vec<Character>,
    pub spawn_instances: Vec<SpawnInstance>,

    // Definition collections - shared templates
    pub action_definitions: Vec<ActionDefinition>,
    pub condition_definitions: Vec<ConditionDefinition>,
    pub spawn_definitions: Vec<SpawnDefinition>,
    pub status_effect_definitions: Vec<StatusEffectDefinition>,

    // Instance collections - runtime state
    pub action_instances: Vec<ActionInstance>,
    pub condition_instances: Vec<ConditionInstance>,
    pub status_effect_instances: Vec<StatusEffectInstance>,

    // Random number generator
    rng: SeededRng,
}

impl GameState {
    /// Create a new game instance
    pub fn new(
        seed: u16,
        tilemap: [[u8; 16]; 15],
        characters: Vec<Character>,
        action_definitions: Vec<ActionDefinition>,
        condition_definitions: Vec<ConditionDefinition>,
        spawn_definitions: Vec<SpawnDefinition>,
        status_effect_definitions: Vec<StatusEffectDefinition>,
    ) -> GameResult<Self> {
        let mut game_state = Self {
            seed,
            frame: 0,
            tile_map: Tilemap::new(tilemap),
            status: GameStatus::Playing,
            characters,
            spawn_instances: Vec::new(),

            // Initialize definition collections with provided data
            action_definitions,
            condition_definitions,
            spawn_definitions,
            status_effect_definitions,

            // Initialize instance collections
            action_instances: Vec::new(),
            condition_instances: Vec::new(),
            status_effect_instances: Vec::new(),
            rng: SeededRng::new(seed),
        };

        // Initialize action cooldown tracking for all characters
        let action_count = game_state.action_definitions.len();
        for character in &mut game_state.characters {
            character.init_action_cooldowns(action_count);
        }

        // Apply passive energy regeneration to all characters
        crate::status::apply_passive_energy_regen_to_all_characters(&mut game_state.characters)
            .map_err(|_| crate::api::GameError::InvalidGameState)?;

        Ok(game_state)
    }

    /// Advance the game state by one frame
    pub fn advance_frame(&mut self) -> GameResult<()> {
        if self.status != GameStatus::Playing {
            return Ok(());
        }

        // Check if game should end (3840 frames = 60 FPS × 64 seconds)
        if self.frame >= crate::core::MAX_FRAMES {
            self.status = GameStatus::Ended;
            return Ok(());
        }

        // Frame processing pipeline:
        // 1. Process status effects
        self.process_status_effects()?;

        // 2. Execute character behaviors
        self.process_character_behaviors()?;

        // 3. Update physics
        self.update_physics()?;

        // 4. Handle collisions
        self.process_collisions()?;

        // 5. Clean up expired entities
        self.cleanup_entities()?;

        // 6. Validate and recover game state if needed
        crate::error::ErrorRecovery::validate_and_recover_game_state(
            &mut self.characters,
            &mut self.spawn_instances,
        )?;

        self.frame += 1;
        Ok(())
    }

    /// Generate next random number using seeded PRNG
    pub fn next_random(&mut self) -> u16 {
        self.rng.next_u16()
    }

    /// Generate random number in range [0, max)
    pub fn next_random_range(&mut self, max: u16) -> u16 {
        self.rng.next_range(max)
    }

    /// Generate random boolean
    pub fn next_random_bool(&mut self) -> bool {
        self.rng.next_bool()
    }

    /// Generate random u8
    pub fn next_random_u8(&mut self) -> u8 {
        self.rng.next_u8()
    }

    /// Reset the random number generator to initial seed
    pub fn reset_rng(&mut self) {
        self.rng.reset();
    }

    /// Get the current RNG seed for external serialization
    pub fn get_rng_seed(&self) -> u16 {
        self.seed
    }

    /// Get action definition by ID
    pub fn get_action_definition(&self, id: ActionId) -> Option<&ActionDefinition> {
        self.action_definitions.get(id)
    }

    /// Get mutable action definition by ID
    pub fn get_action_definition_mut(&mut self, id: ActionId) -> Option<&mut ActionDefinition> {
        self.action_definitions.get_mut(id)
    }

    /// Get condition definition by ID
    pub fn get_condition_definition(&self, id: ConditionId) -> Option<&ConditionDefinition> {
        self.condition_definitions.get(id)
    }

    /// Get mutable condition definition by ID
    pub fn get_condition_definition_mut(
        &mut self,
        id: ConditionId,
    ) -> Option<&mut ConditionDefinition> {
        self.condition_definitions.get_mut(id)
    }

    /// Get status effect definition by ID
    pub fn get_status_effect_definition(
        &self,
        id: StatusEffectId,
    ) -> Option<&StatusEffectDefinition> {
        self.status_effect_definitions.get(id)
    }

    /// Get mutable status effect definition by ID
    pub fn get_status_effect_definition_mut(
        &mut self,
        id: StatusEffectId,
    ) -> Option<&mut StatusEffectDefinition> {
        self.status_effect_definitions.get_mut(id)
    }

    /// Get spawn definition by ID (already exists as spawn_definitions, but adding for consistency)
    pub fn get_spawn_definition(&self, id: usize) -> Option<&SpawnDefinition> {
        self.spawn_definitions.get(id)
    }

    /// Get mutable spawn definition by ID
    pub fn get_spawn_definition_mut(&mut self, id: usize) -> Option<&mut SpawnDefinition> {
        self.spawn_definitions.get_mut(id)
    }

    /// Safe action definition lookup with error handling
    pub fn safe_get_action_definition(&self, id: ActionId) -> GameResult<&ActionDefinition> {
        self.action_definitions
            .get(id)
            .ok_or(crate::api::GameError::ActionDefinitionNotFound)
    }

    /// Safe condition definition lookup with error handling
    pub fn safe_get_condition_definition(
        &self,
        id: ConditionId,
    ) -> GameResult<&ConditionDefinition> {
        self.condition_definitions
            .get(id)
            .ok_or(crate::api::GameError::ConditionDefinitionNotFound)
    }

    /// Safe status effect definition lookup with error handling
    pub fn safe_get_status_effect_definition(
        &self,
        id: StatusEffectId,
    ) -> GameResult<&StatusEffectDefinition> {
        self.status_effect_definitions
            .get(id)
            .ok_or(crate::api::GameError::StatusEffectDefinitionNotFound)
    }

    /// Safe spawn definition lookup with error handling
    pub fn safe_get_spawn_definition(&self, id: usize) -> GameResult<&SpawnDefinition> {
        self.spawn_definitions
            .get(id)
            .ok_or(crate::api::GameError::SpawnDefinitionNotFound)
    }

    /// Safe action instance lookup with error handling
    pub fn safe_get_action_instance(&self, id: usize) -> GameResult<&ActionInstance> {
        self.action_instances
            .get(id)
            .ok_or(crate::api::GameError::ActionInstanceNotFound)
    }

    /// Safe condition instance lookup with error handling
    pub fn safe_get_condition_instance(&self, id: usize) -> GameResult<&ConditionInstance> {
        self.condition_instances
            .get(id)
            .ok_or(crate::api::GameError::ConditionInstanceNotFound)
    }

    /// Safe status effect instance lookup with error handling
    pub fn safe_get_status_effect_instance(
        &self,
        id: StatusEffectInstanceId,
    ) -> GameResult<&StatusEffectInstance> {
        self.status_effect_instances
            .get(id as usize)
            .ok_or(crate::api::GameError::StatusEffectInstanceNotFound)
    }

    /// Validate all definition references in the current game state
    pub fn validate_definition_references(&self) -> GameResult<()> {
        // Validate character behavior references
        for character in &self.characters {
            for &(condition_id, action_id) in &character.behaviors {
                // Validate condition ID
                self.safe_get_condition_definition(condition_id)?;

                // Validate action ID
                self.safe_get_action_definition(action_id)?;
            }

            // Validate status effect references
            for &status_effect_id in &character.status_effects {
                self.safe_get_status_effect_instance(status_effect_id)?;
            }
        }

        // Validate action definition spawn references
        for action_def in &self.action_definitions {
            for &spawn_id in &action_def.spawns {
                if spawn_id != 0 {
                    self.safe_get_spawn_definition(spawn_id as usize)?;
                }
            }
        }

        // Validate status effect definition spawn references
        for status_effect_def in &self.status_effect_definitions {
            for &spawn_id in &status_effect_def.spawns {
                if spawn_id != 0 {
                    self.safe_get_spawn_definition(spawn_id as usize)?;
                }
            }
        }

        Ok(())
    }

    /// Detect and report any circular references in the current game state
    pub fn detect_runtime_circular_references(&self) -> GameResult<()> {
        // This is a more comprehensive check that can be run during gameplay
        // to detect any circular references that might have been introduced

        // Check spawn definition circular references
        for (spawn_id, _spawn_def) in self.spawn_definitions.iter().enumerate() {
            let mut visited = alloc::vec![false; self.spawn_definitions.len()];
            let mut recursion_stack = alloc::vec![false; self.spawn_definitions.len()];

            if self.detect_spawn_cycle_runtime(spawn_id, &mut visited, &mut recursion_stack)? {
                return Err(crate::api::GameError::CircularReference);
            }
        }

        Ok(())
    }

    /// Runtime circular reference detection for spawn definitions
    fn detect_spawn_cycle_runtime(
        &self,
        spawn_id: usize,
        visited: &mut [bool],
        recursion_stack: &mut [bool],
    ) -> GameResult<bool> {
        if spawn_id >= self.spawn_definitions.len() {
            return Err(crate::api::GameError::SpawnDefinitionNotFound);
        }

        visited[spawn_id] = true;
        recursion_stack[spawn_id] = true;

        let spawn_def = &self.spawn_definitions[spawn_id];
        for &referenced_spawn_id in &spawn_def.spawns {
            if referenced_spawn_id != 0 {
                let referenced_id = referenced_spawn_id as usize;

                // Validate referenced spawn ID exists
                if referenced_id >= self.spawn_definitions.len() {
                    return Err(crate::api::GameError::SpawnDefinitionNotFound);
                }

                // If not visited, recurse
                if !visited[referenced_id] {
                    if self.detect_spawn_cycle_runtime(referenced_id, visited, recursion_stack)? {
                        return Ok(true);
                    }
                }
                // If visited and in recursion stack, we found a cycle
                else if recursion_stack[referenced_id] {
                    return Ok(true);
                }
            }
        }

        recursion_stack[spawn_id] = false;
        Ok(false)
    }

    /// Get action instance by ID
    pub fn get_action_instance(&self, id: usize) -> Option<&ActionInstance> {
        self.action_instances.get(id)
    }

    /// Get mutable action instance by ID
    pub fn get_action_instance_mut(&mut self, id: usize) -> Option<&mut ActionInstance> {
        self.action_instances.get_mut(id)
    }

    /// Get condition instance by ID
    pub fn get_condition_instance(&self, id: usize) -> Option<&ConditionInstance> {
        self.condition_instances.get(id)
    }

    /// Get mutable condition instance by ID
    pub fn get_condition_instance_mut(&mut self, id: usize) -> Option<&mut ConditionInstance> {
        self.condition_instances.get_mut(id)
    }

    /// Get status effect instance by ID
    pub fn get_status_effect_instance(
        &self,
        id: StatusEffectInstanceId,
    ) -> Option<&StatusEffectInstance> {
        self.status_effect_instances.get(id as usize)
    }

    /// Get mutable status effect instance by ID
    pub fn get_status_effect_instance_mut(
        &mut self,
        id: StatusEffectInstanceId,
    ) -> Option<&mut StatusEffectInstance> {
        self.status_effect_instances.get_mut(id as usize)
    }

    // Private methods for frame processing
    fn process_status_effects(&mut self) -> GameResult<()> {
        // Process status effects for each character
        for character_idx in 0..self.characters.len() {
            self.process_character_status_effects_at_index(character_idx)
                .map_err(|_| crate::api::GameError::ScriptExecutionError)?;
        }
        Ok(())
    }

    /// Process character behaviors for all characters
    fn process_character_behaviors(&mut self) -> GameResult<()> {
        // Process behaviors for each character
        for character_idx in 0..self.characters.len() {
            self.execute_character_behaviors_at_index(character_idx)
                .map_err(|_| crate::api::GameError::ScriptExecutionError)?;
        }
        Ok(())
    }

    /// Execute behaviors for a character at a specific index
    fn execute_character_behaviors_at_index(
        &mut self,
        character_idx: usize,
    ) -> Result<(), crate::script::ScriptError> {
        // Skip if character doesn't exist
        if character_idx >= self.characters.len() {
            return Ok(());
        }

        // Skip if character has a locked action
        if self.characters[character_idx].locked_action.is_some() {
            return Ok(());
        }

        // Get character behaviors (clone to avoid borrow conflicts)
        let behaviors = self.characters[character_idx].behaviors.clone();

        // Process each behavior (condition + action pair)
        for &(condition_id, action_id) in &behaviors {
            // Validate IDs exist
            if condition_id >= self.condition_definitions.len()
                || action_id >= self.action_definitions.len()
            {
                continue; // Skip invalid behavior
            }

            // Check if action is on cooldown before evaluating condition
            let action_def = match self.safe_get_action_definition(action_id) {
                Ok(def) => def,
                Err(_) => {
                    // Action definition not found - skip this behavior
                    continue;
                }
            };
            let last_used = self.characters[character_idx]
                .action_last_used
                .get(action_id)
                .copied()
                .unwrap_or(u16::MAX);
            if last_used != u16::MAX && self.frame.saturating_sub(last_used) < action_def.cooldown {
                continue; // Skip if on cooldown
            }

            // Evaluate condition
            let condition_result = self.evaluate_condition(character_idx, condition_id)?;
            if condition_result == 0 {
                continue; // Condition failed, try next behavior
            }

            // Execute action
            self.execute_action(character_idx, action_id)?;
            break; // Only execute one action per frame per character
        }

        Ok(())
    }

    /// Evaluate a condition for a character
    fn evaluate_condition(
        &mut self,
        character_idx: usize,
        condition_id: ConditionId,
    ) -> Result<u8, crate::script::ScriptError> {
        // Get or create condition instance
        let instance_id = self.get_or_create_condition_instance(condition_id);

        // Create condition context
        let mut context = ConditionContext::new(self, character_idx, condition_id, instance_id);

        // Execute condition script
        let mut engine = crate::script::ScriptEngine::new_with_args(context.get_args());
        let result = engine.execute(&context.get_script(), &mut context)?;

        // Update instance state from engine
        context.update_instance_from_engine(&engine);

        Ok(result)
    }

    /// Execute an action for a character
    fn execute_action(
        &mut self,
        character_idx: usize,
        action_id: ActionId,
    ) -> Result<(), crate::script::ScriptError> {
        // Get or create action instance
        let instance_id = self.get_or_create_action_instance(action_id);

        // Create action context
        let mut context = ActionContext::new(self, character_idx, action_id, instance_id);

        // Execute action script
        let mut engine = crate::script::ScriptEngine::new_with_args_and_spawns(
            context.get_args(),
            context.get_spawns(),
        );
        engine.execute(&context.get_script(), &mut context)?;

        // Update instance state from engine
        context.update_instance_from_engine(&engine);

        Ok(())
    }

    /// Get or create a condition instance for the given definition
    fn get_or_create_condition_instance(&mut self, condition_id: ConditionId) -> usize {
        // For now, create a new instance each time
        // In a more sophisticated system, we might reuse instances
        let instance = ConditionInstance::new(condition_id);
        self.condition_instances.push(instance);
        self.condition_instances.len() - 1
    }

    /// Get or create an action instance for the given definition
    fn get_or_create_action_instance(&mut self, action_id: ActionId) -> usize {
        // For now, create a new instance each time
        // In a more sophisticated system, we might reuse instances
        let instance = ActionInstance::new(action_id);
        self.action_instances.push(instance);
        self.action_instances.len() - 1
    }

    /// Process status effects for a character at a specific index
    fn process_character_status_effects_at_index(
        &mut self,
        character_idx: usize,
    ) -> Result<(), ScriptError> {
        let mut effects_to_remove: Vec<StatusEffectInstanceId> = Vec::new();

        // Process each status effect on the character
        if let Some(character) = self.characters.get(character_idx) {
            for &effect_instance_id in &character.status_effects {
                if let Some(instance) = self.get_status_effect_instance(effect_instance_id) {
                    let definition_id = instance.definition_id;

                    // Get the definition for this instance
                    if let Some(_definition) =
                        self.status_effect_definitions.get(definition_id).cloned()
                    {
                        // Execute tick script - we need to be careful with borrowing here
                        // We'll process the script execution in a separate step to avoid borrow conflicts

                        // Decrease life span first
                        if let Some(instance_mut) = self
                            .status_effect_instances
                            .get_mut(effect_instance_id as usize)
                        {
                            if instance_mut.life_span > 0 {
                                instance_mut.life_span -= 1;
                            }

                            // Mark for removal if expired
                            if instance_mut.life_span == 0 {
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
        }

        // Remove expired effects
        for effect_id in effects_to_remove {
            self.remove_status_effect_from_character(character_idx, effect_id)?;
        }

        // Process passive energy regeneration
        if let Some(character) = self.characters.get_mut(character_idx) {
            // Inline the passive energy regeneration to avoid borrow checker issues
            if character.energy_regen_rate != 0
                && self.frame % (character.energy_regen_rate as u16) == 0
            {
                character.energy = character.energy.saturating_add(character.energy_regen);
            }
        }

        Ok(())
    }

    /// Remove a status effect from a character by instance ID
    fn remove_status_effect_from_character(
        &mut self,
        character_idx: usize,
        effect_instance_id: StatusEffectInstanceId,
    ) -> Result<(), ScriptError> {
        if let Some(character) = self.characters.get_mut(character_idx) {
            // Find and remove the effect from character's status effects list
            let position = character
                .status_effects
                .iter()
                .position(|&id| id == effect_instance_id);

            if let Some(pos) = position {
                character.status_effects.remove(pos);

                // Execute off_script before removing the instance
                // Note: We skip off_script execution for now to avoid borrow checker issues
                // This can be implemented later with a more sophisticated approach
            }
        }
        Ok(())
    }

    fn update_physics(&mut self) -> GameResult<()> {
        // Will be implemented in physics task
        Ok(())
    }

    fn process_collisions(&mut self) -> GameResult<()> {
        // Will be implemented in collision task
        Ok(())
    }

    fn cleanup_entities(&mut self) -> GameResult<()> {
        // Remove expired spawn instances
        self.spawn_instances.retain(|spawn| spawn.life_span > 0);
        Ok(())
    }
}
/// Context for condition script execution
pub struct ConditionContext<'a> {
    game_state: &'a mut GameState,
    character_idx: usize,
    condition_id: ConditionId,
    instance_id: usize,
}

impl<'a> ConditionContext<'a> {
    pub fn new(
        game_state: &'a mut GameState,
        character_idx: usize,
        condition_id: ConditionId,
        instance_id: usize,
    ) -> Self {
        Self {
            game_state,
            character_idx,
            condition_id,
            instance_id,
        }
    }

    pub fn get_args(&self) -> [u8; 8] {
        self.game_state
            .condition_definitions
            .get(self.condition_id)
            .map(|def| def.args)
            .unwrap_or([0; 8])
    }

    pub fn get_script(&self) -> Vec<u8> {
        self.game_state
            .condition_definitions
            .get(self.condition_id)
            .map(|def| def.script.clone())
            .unwrap_or_default()
    }

    pub fn update_instance_from_engine(&mut self, engine: &crate::script::ScriptEngine) {
        if let Some(instance) = self
            .game_state
            .condition_instances
            .get_mut(self.instance_id)
        {
            instance.runtime_vars.copy_from_slice(&engine.vars[..4]);
            instance.runtime_fixed = engine.fixed;
        }
    }
}

impl crate::script::ScriptContext for ConditionContext<'_> {
    fn read_property(
        &mut self,
        engine: &mut crate::script::ScriptEngine,
        var_index: usize,
        prop_address: u8,
    ) {
        // For now, implement basic property reading
        // This would need to be expanded based on the PropertyAddress enum
        if let Some(character) = self.game_state.characters.get(self.character_idx) {
            match prop_address {
                property_address::CHARACTER_HEALTH => {
                    // Health (u16) - store in fixed array
                    if var_index < engine.fixed.len() {
                        engine.fixed[var_index] = Fixed::from_int(character.health as i16);
                    }
                }
                property_address::CHARACTER_ENERGY => {
                    // Energy (u8) - store in vars array
                    if var_index < engine.vars.len() {
                        engine.vars[var_index] = character.energy;
                    }
                }
                property_address::CHARACTER_POS_X => {
                    // Position X (Fixed) - store in fixed array
                    if var_index < engine.fixed.len() {
                        engine.fixed[var_index] = character.core.pos.0;
                    }
                }
                property_address::CHARACTER_POS_Y => {
                    // Position Y (Fixed) - store in fixed array
                    if var_index < engine.fixed.len() {
                        engine.fixed[var_index] = character.core.pos.1;
                    }
                }
                property_address::ENTITY_DIR_HORIZONTAL => {
                    // Facing (u8) - store in vars array
                    if var_index < engine.vars.len() {
                        engine.vars[var_index] = character.core.dir.0;
                    }
                }
                property_address::CHARACTER_HEALTH_CAP => {
                    // Health Cap (u16) - store in fixed array
                    if var_index < engine.fixed.len() {
                        engine.fixed[var_index] = Fixed::from_int(character.health_cap as i16);
                    }
                }
                property_address::CHARACTER_ENERGY_CAP => {
                    // Energy Cap (u8) - store in vars array
                    if var_index < engine.vars.len() {
                        engine.vars[var_index] = character.energy_cap;
                    }
                }
                property_address::CHARACTER_POWER => {
                    // Power (u8) - store in vars array
                    if var_index < engine.vars.len() {
                        engine.vars[var_index] = character.power;
                    }
                }
                property_address::CHARACTER_WEIGHT => {
                    // Weight (u8) - store in vars array
                    if var_index < engine.vars.len() {
                        engine.vars[var_index] = character.weight;
                    }
                }
                property_address::CHARACTER_JUMP_FORCE => {
                    // Jump Force (Fixed) - store in fixed array
                    if var_index < engine.fixed.len() {
                        engine.fixed[var_index] = character.jump_force;
                    }
                }
                property_address::CHARACTER_MOVE_SPEED => {
                    // Move Speed (Fixed) - store in fixed array
                    if var_index < engine.fixed.len() {
                        engine.fixed[var_index] = character.move_speed;
                    }
                }
                _ => {}
            }
        }
    }

    fn write_property(
        &mut self,
        engine: &mut crate::script::ScriptEngine,
        prop_address: u8,
        var_index: usize,
    ) {
        // For now, implement basic property writing
        if let Some(character) = self.game_state.characters.get_mut(self.character_idx) {
            match prop_address {
                property_address::CHARACTER_HEALTH => {
                    // Health (u16) - read from fixed array
                    if var_index < engine.fixed.len() {
                        character.health = engine.fixed[var_index].to_int().max(0) as u16;
                    }
                }
                property_address::CHARACTER_ENERGY => {
                    // Energy (u8) - read from vars array
                    if var_index < engine.vars.len() {
                        character.energy = engine.vars[var_index];
                    }
                }
                property_address::CHARACTER_POS_X => {
                    // Position X (Fixed) - read from fixed array
                    if var_index < engine.fixed.len() {
                        character.core.pos.0 = engine.fixed[var_index];
                    }
                }
                property_address::CHARACTER_POS_Y => {
                    // Position Y (Fixed) - read from fixed array
                    if var_index < engine.fixed.len() {
                        character.core.pos.1 = engine.fixed[var_index];
                    }
                }
                property_address::ENTITY_DIR_HORIZONTAL => {
                    // Facing (u8) - read from vars array
                    if var_index < engine.vars.len() {
                        character.core.dir.0 = engine.vars[var_index];
                    }
                }
                property_address::CHARACTER_HEALTH_CAP => {
                    // Health Cap (u16) - read from fixed array
                    if var_index < engine.fixed.len() {
                        character.health_cap = engine.fixed[var_index].to_int().max(0) as u16;
                    }
                }
                property_address::CHARACTER_ENERGY_CAP => {
                    // Energy Cap (u8) - read from vars array
                    if var_index < engine.vars.len() {
                        character.energy_cap = engine.vars[var_index];
                    }
                }
                property_address::CHARACTER_POWER => {
                    // Power (u8) - read from vars array
                    if var_index < engine.vars.len() {
                        character.power = engine.vars[var_index];
                    }
                }
                property_address::CHARACTER_WEIGHT => {
                    // Weight (u8) - read from vars array
                    if var_index < engine.vars.len() {
                        character.weight = engine.vars[var_index];
                    }
                }
                property_address::CHARACTER_JUMP_FORCE => {
                    // Jump Force (Fixed) - read from fixed array
                    if var_index < engine.fixed.len() {
                        character.jump_force = engine.fixed[var_index];
                    }
                }
                property_address::CHARACTER_MOVE_SPEED => {
                    // Move Speed (Fixed) - read from fixed array
                    if var_index < engine.fixed.len() {
                        character.move_speed = engine.fixed[var_index];
                    }
                }
                _ => {}
            }
        }
    }

    fn get_energy_requirement(&self) -> u8 {
        self.game_state
            .condition_definitions
            .get(self.condition_id)
            .map(|def| {
                (def.energy_mul.to_int() as u8).saturating_mul(
                    self.game_state
                        .characters
                        .get(self.character_idx)
                        .map(|c| c.energy)
                        .unwrap_or(0),
                )
            })
            .unwrap_or(0)
    }

    fn get_current_energy(&self) -> u8 {
        self.game_state
            .characters
            .get(self.character_idx)
            .map(|c| c.energy)
            .unwrap_or(0)
    }

    fn is_on_cooldown(&self) -> bool {
        // Conditions don't have cooldowns
        false
    }

    fn get_random_u8(&mut self) -> u8 {
        self.game_state.next_random_u8()
    }

    fn lock_action(&mut self) {
        // Conditions don't lock actions
    }

    fn unlock_action(&mut self) {
        // Conditions don't unlock actions
    }

    fn apply_energy_cost(&mut self) {
        // Conditions don't apply energy costs
    }

    fn apply_duration(&mut self) {
        // Conditions don't apply duration
    }

    fn create_spawn(&mut self, _spawn_id: usize, _vars: Option<[u8; 4]>) {
        // Conditions don't create spawns
    }

    fn log_debug(&self, _message: &str) {
        // Debug logging not implemented
    }

    fn read_action_cooldown(&self, _engine: &mut crate::script::ScriptEngine, _var_index: usize) {
        // Conditions don't read action cooldowns
    }

    fn read_action_last_used(&self, _engine: &mut crate::script::ScriptEngine, _var_index: usize) {
        // Conditions don't read action last used
    }

    fn write_action_last_used(
        &mut self,
        _engine: &mut crate::script::ScriptEngine,
        _var_index: usize,
    ) {
        // Conditions don't write action last used
    }

    fn read_character_property(
        &mut self,
        engine: &mut crate::script::ScriptEngine,
        character_id: u8,
        var_index: usize,
        property_address: u8,
    ) {
        use crate::constants::property_address;

        // Validate character ID and property address compatibility
        if character_id as usize >= self.game_state.characters.len() {
            return; // Invalid character ID - silent failure
        }

        // Check if property address is compatible with Character properties (0x20-0x48)
        if !(0x20..=0x48).contains(&property_address) {
            return; // Incompatible property address - silent failure
        }

        let character = &self.game_state.characters[character_id as usize];

        match property_address {
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
            _ => {} // Other character properties handled similarly
        }
    }

    fn write_character_property(
        &mut self,
        engine: &mut crate::script::ScriptEngine,
        character_id: u8,
        property_address: u8,
        var_index: usize,
    ) {
        use crate::constants::property_address;

        // Validate character ID and property address compatibility
        if character_id as usize >= self.game_state.characters.len() {
            return; // Invalid character ID - silent failure
        }

        // Check if property address is compatible with Character properties (0x20-0x48)
        if !(0x20..=0x48).contains(&property_address) {
            return; // Incompatible property address - silent failure
        }

        let character = &mut self.game_state.characters[character_id as usize];

        match property_address {
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
            _ => {} // Other character properties handled similarly
        }
    }

    fn read_spawn_property(
        &mut self,
        engine: &mut crate::script::ScriptEngine,
        spawn_instance_id: u8,
        var_index: usize,
        property_address: u8,
    ) {
        use crate::constants::property_address;

        // Validate spawn instance ID and property address compatibility
        if spawn_instance_id as usize >= self.game_state.spawn_instances.len() {
            return; // Invalid spawn instance ID - silent failure
        }

        // Check if property address is compatible with Spawn properties (0x52-0xBE)
        if !(0x52..=0xBE).contains(&property_address) {
            return; // Incompatible property address - silent failure
        }

        let spawn_instance = &self.game_state.spawn_instances[spawn_instance_id as usize];

        match property_address {
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
            property_address::SPAWN_INST_LIFE_SPAN => {
                if var_index < engine.fixed.len() {
                    engine.fixed[var_index] = Fixed::from_int(spawn_instance.life_span as i16);
                }
            }
            property_address::SPAWN_INST_ROTATION => {
                if var_index < engine.fixed.len() {
                    engine.fixed[var_index] = spawn_instance.rotation;
                }
            }
            _ => {} // Other spawn properties handled similarly
        }
    }

    fn write_spawn_property(
        &mut self,
        engine: &mut crate::script::ScriptEngine,
        spawn_instance_id: u8,
        property_address: u8,
        var_index: usize,
    ) {
        use crate::constants::property_address;

        // Validate spawn instance ID and property address compatibility
        if spawn_instance_id as usize >= self.game_state.spawn_instances.len() {
            return; // Invalid spawn instance ID - silent failure
        }

        // Check if property address is compatible with Spawn properties (0x52-0xBE)
        if !(0x52..=0xBE).contains(&property_address) {
            return; // Incompatible property address - silent failure
        }

        let spawn_instance = &mut self.game_state.spawn_instances[spawn_instance_id as usize];

        match property_address {
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
            property_address::SPAWN_INST_LIFE_SPAN => {
                if var_index < engine.fixed.len() {
                    spawn_instance.life_span = engine.fixed[var_index].to_int() as u16;
                }
            }
            property_address::SPAWN_INST_ROTATION => {
                if var_index < engine.fixed.len() {
                    spawn_instance.rotation = engine.fixed[var_index];
                }
            }
            _ => {} // Other spawn properties handled similarly
        }
    }
}

/// Context for action script execution
pub struct ActionContext<'a> {
    game_state: &'a mut GameState,
    character_idx: usize,
    action_id: ActionId,
    instance_id: usize,
}

impl<'a> ActionContext<'a> {
    pub fn new(
        game_state: &'a mut GameState,
        character_idx: usize,
        action_id: ActionId,
        instance_id: usize,
    ) -> Self {
        Self {
            game_state,
            character_idx,
            action_id,
            instance_id,
        }
    }

    pub fn get_args(&self) -> [u8; 8] {
        self.game_state
            .action_definitions
            .get(self.action_id)
            .map(|def| def.args)
            .unwrap_or([0; 8])
    }

    pub fn get_script(&self) -> Vec<u8> {
        self.game_state
            .action_definitions
            .get(self.action_id)
            .map(|def| def.script.clone())
            .unwrap_or_default()
    }

    pub fn get_spawns(&self) -> [u8; 4] {
        self.game_state
            .action_definitions
            .get(self.action_id)
            .map(|def| def.spawns)
            .unwrap_or([0; 4])
    }

    pub fn update_instance_from_engine(&mut self, engine: &crate::script::ScriptEngine) {
        if let Some(instance) = self.game_state.action_instances.get_mut(self.instance_id) {
            instance.runtime_vars.copy_from_slice(&engine.vars[..4]);
            instance.runtime_fixed = engine.fixed;
        }
    }
}

impl crate::script::ScriptContext for ActionContext<'_> {
    fn read_property(
        &mut self,
        engine: &mut crate::script::ScriptEngine,
        var_index: usize,
        prop_address: u8,
    ) {
        // For now, implement basic property reading
        if let Some(character) = self.game_state.characters.get(self.character_idx) {
            match prop_address {
                property_address::CHARACTER_HEALTH => {
                    // Health (u16) - store in fixed array
                    if var_index < engine.fixed.len() {
                        engine.fixed[var_index] = Fixed::from_int(character.health as i16);
                    }
                }
                property_address::CHARACTER_ENERGY => {
                    // Energy (u8) - store in vars array
                    if var_index < engine.vars.len() {
                        engine.vars[var_index] = character.energy;
                    }
                }
                property_address::CHARACTER_POS_X => {
                    // Position X (Fixed) - store in fixed array
                    if var_index < engine.fixed.len() {
                        engine.fixed[var_index] = character.core.pos.0;
                    }
                }
                property_address::CHARACTER_POS_Y => {
                    // Position Y (Fixed) - store in fixed array
                    if var_index < engine.fixed.len() {
                        engine.fixed[var_index] = character.core.pos.1;
                    }
                }
                property_address::ENTITY_DIR_HORIZONTAL => {
                    // Facing (u8) - store in vars array
                    if var_index < engine.vars.len() {
                        engine.vars[var_index] = character.core.dir.0;
                    }
                }
                property_address::CHARACTER_HEALTH_CAP => {
                    // Health Cap (u16) - store in fixed array
                    if var_index < engine.fixed.len() {
                        engine.fixed[var_index] = Fixed::from_int(character.health_cap as i16);
                    }
                }
                property_address::CHARACTER_ENERGY_CAP => {
                    // Energy Cap (u8) - store in vars array
                    if var_index < engine.vars.len() {
                        engine.vars[var_index] = character.energy_cap;
                    }
                }
                property_address::CHARACTER_POWER => {
                    // Power (u8) - store in vars array
                    if var_index < engine.vars.len() {
                        engine.vars[var_index] = character.power;
                    }
                }
                property_address::CHARACTER_WEIGHT => {
                    // Weight (u8) - store in vars array
                    if var_index < engine.vars.len() {
                        engine.vars[var_index] = character.weight;
                    }
                }
                property_address::CHARACTER_JUMP_FORCE => {
                    // Jump Force (Fixed) - store in fixed array
                    if var_index < engine.fixed.len() {
                        engine.fixed[var_index] = character.jump_force;
                    }
                }
                property_address::CHARACTER_MOVE_SPEED => {
                    // Move Speed (Fixed) - store in fixed array
                    if var_index < engine.fixed.len() {
                        engine.fixed[var_index] = character.move_speed;
                    }
                }
                _ => {}
            }
        }
    }

    fn write_property(
        &mut self,
        engine: &mut crate::script::ScriptEngine,
        prop_address: u8,
        var_index: usize,
    ) {
        // For now, implement basic property writing
        if let Some(character) = self.game_state.characters.get_mut(self.character_idx) {
            match prop_address {
                property_address::CHARACTER_HEALTH => {
                    // Health (u16) - read from fixed array
                    if var_index < engine.fixed.len() {
                        character.health = engine.fixed[var_index].to_int().max(0) as u16;
                    }
                }
                property_address::CHARACTER_ENERGY => {
                    // Energy (u8) - read from vars array
                    if var_index < engine.vars.len() {
                        character.energy = engine.vars[var_index];
                    }
                }
                property_address::CHARACTER_POS_X => {
                    // Position X (Fixed) - read from fixed array
                    if var_index < engine.fixed.len() {
                        character.core.pos.0 = engine.fixed[var_index];
                    }
                }
                property_address::CHARACTER_POS_Y => {
                    // Position Y (Fixed) - read from fixed array
                    if var_index < engine.fixed.len() {
                        character.core.pos.1 = engine.fixed[var_index];
                    }
                }
                property_address::ENTITY_DIR_HORIZONTAL => {
                    // Facing (u8) - read from vars array
                    if var_index < engine.vars.len() {
                        character.core.dir.0 = engine.vars[var_index];
                    }
                }
                property_address::CHARACTER_HEALTH_CAP => {
                    // Health Cap (u16) - read from fixed array
                    if var_index < engine.fixed.len() {
                        character.health_cap = engine.fixed[var_index].to_int().max(0) as u16;
                    }
                }
                property_address::CHARACTER_ENERGY_CAP => {
                    // Energy Cap (u8) - read from vars array
                    if var_index < engine.vars.len() {
                        character.energy_cap = engine.vars[var_index];
                    }
                }
                property_address::CHARACTER_POWER => {
                    // Power (u8) - read from vars array
                    if var_index < engine.vars.len() {
                        character.power = engine.vars[var_index];
                    }
                }
                property_address::CHARACTER_WEIGHT => {
                    // Weight (u8) - read from vars array
                    if var_index < engine.vars.len() {
                        character.weight = engine.vars[var_index];
                    }
                }
                property_address::CHARACTER_JUMP_FORCE => {
                    // Jump Force (Fixed) - read from fixed array
                    if var_index < engine.fixed.len() {
                        character.jump_force = engine.fixed[var_index];
                    }
                }
                property_address::CHARACTER_MOVE_SPEED => {
                    // Move Speed (Fixed) - read from fixed array
                    if var_index < engine.fixed.len() {
                        character.move_speed = engine.fixed[var_index];
                    }
                }
                _ => {}
            }
        }
    }

    fn get_energy_requirement(&self) -> u8 {
        self.game_state
            .action_definitions
            .get(self.action_id)
            .map(|def| def.energy_cost)
            .unwrap_or(0)
    }

    fn get_current_energy(&self) -> u8 {
        self.game_state
            .characters
            .get(self.character_idx)
            .map(|c| c.energy)
            .unwrap_or(0)
    }

    fn is_on_cooldown(&self) -> bool {
        if let Some(action_def) = self.game_state.action_definitions.get(self.action_id) {
            if let Some(character) = self.game_state.characters.get(self.character_idx) {
                let last_used = character
                    .action_last_used
                    .get(self.action_id)
                    .copied()
                    .unwrap_or(u16::MAX);
                if last_used == u16::MAX {
                    return false; // Never used
                }
                return self.game_state.frame.saturating_sub(last_used) < action_def.cooldown;
            }
        }
        false
    }

    fn get_random_u8(&mut self) -> u8 {
        self.game_state.next_random_u8()
    }

    fn lock_action(&mut self) {
        if let Some(_instance) = self.game_state.action_instances.get(self.instance_id) {
            if let Some(character) = self.game_state.characters.get_mut(self.character_idx) {
                character.locked_action = Some(self.instance_id as ActionInstanceId);

                // Set cooldown from definition
                if let Some(action_def) = self.game_state.action_definitions.get(self.action_id) {
                    if let Some(instance_mut) =
                        self.game_state.action_instances.get_mut(self.instance_id)
                    {
                        instance_mut.cooldown = action_def.cooldown;
                    }
                }
            }
        }
    }

    fn unlock_action(&mut self) {
        if let Some(character) = self.game_state.characters.get_mut(self.character_idx) {
            character.locked_action = None;
        }
    }

    fn apply_energy_cost(&mut self) {
        if let Some(action_def) = self.game_state.action_definitions.get(self.action_id) {
            if let Some(character) = self.game_state.characters.get_mut(self.character_idx) {
                character.energy = character.energy.saturating_sub(action_def.energy_cost);
            }
        }
    }

    fn apply_duration(&mut self) {
        if let Some(action_def) = self.game_state.action_definitions.get(self.action_id) {
            if let Some(instance) = self.game_state.action_instances.get_mut(self.instance_id) {
                instance.cooldown = action_def.cooldown;
            }
        }
    }

    fn create_spawn(&mut self, spawn_id: usize, vars: Option<[u8; 4]>) {
        // Validate spawn definition exists
        // Get character position for spawn creation
        if let Some(character) = self.game_state.characters.get(self.character_idx) {
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
                character.core.id,
                character.core.pos,
            );

            // Set spawn variables if provided
            if let Some(spawn_vars) = vars {
                spawn.runtime_vars = spawn_vars;
            }

            // Assign unique ID
            spawn.core.id = self.game_state.spawn_instances.len() as u8;

            // Set properties from spawn definition
            spawn.life_span = spawn_def.duration;
            spawn.element = spawn_def.element.unwrap_or(crate::entity::Element::Punct);

            self.game_state.spawn_instances.push(spawn);
        }
    }

    fn log_debug(&self, _message: &str) {
        // Debug logging not implemented
    }

    fn read_action_cooldown(&self, engine: &mut crate::script::ScriptEngine, var_index: usize) {
        if let Some(action_def) = self.game_state.action_definitions.get(self.action_id) {
            if var_index < engine.vars.len() {
                engine.vars[var_index] = (action_def.cooldown & 0xFF) as u8;
            }
        }
    }

    fn read_action_last_used(&self, engine: &mut crate::script::ScriptEngine, var_index: usize) {
        if let Some(character) = self.game_state.characters.get(self.character_idx) {
            let last_used = character
                .action_last_used
                .get(self.action_id)
                .copied()
                .unwrap_or(u16::MAX);
            if var_index < engine.vars.len() {
                engine.vars[var_index] = (last_used & 0xFF) as u8;
            }
        }
    }

    fn write_action_last_used(
        &mut self,
        engine: &mut crate::script::ScriptEngine,
        var_index: usize,
    ) {
        if var_index < engine.vars.len() {
            let timestamp = engine.vars[var_index] as u16;
            if let Some(character) = self.game_state.characters.get_mut(self.character_idx) {
                if self.action_id < character.action_last_used.len() {
                    character.action_last_used[self.action_id] = timestamp;
                }
            }
        }
    }

    fn read_character_property(
        &mut self,
        engine: &mut crate::script::ScriptEngine,
        character_id: u8,
        var_index: usize,
        property_address: u8,
    ) {
        use crate::constants::property_address;

        // Validate character ID and property address compatibility
        if character_id as usize >= self.game_state.characters.len() {
            return; // Invalid character ID - silent failure
        }

        // Check if property address is compatible with Character properties (0x20-0x48)
        if !(0x20..=0x48).contains(&property_address) {
            return; // Incompatible property address - silent failure
        }

        let character = &self.game_state.characters[character_id as usize];

        match property_address {
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
            _ => {} // Other character properties handled similarly
        }
    }

    fn write_character_property(
        &mut self,
        engine: &mut crate::script::ScriptEngine,
        character_id: u8,
        property_address: u8,
        var_index: usize,
    ) {
        use crate::constants::property_address;

        // Validate character ID and property address compatibility
        if character_id as usize >= self.game_state.characters.len() {
            return; // Invalid character ID - silent failure
        }

        // Check if property address is compatible with Character properties (0x20-0x48)
        if !(0x20..=0x48).contains(&property_address) {
            return; // Incompatible property address - silent failure
        }

        let character = &mut self.game_state.characters[character_id as usize];

        match property_address {
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
            _ => {} // Other character properties handled similarly
        }
    }

    fn read_spawn_property(
        &mut self,
        engine: &mut crate::script::ScriptEngine,
        spawn_instance_id: u8,
        var_index: usize,
        property_address: u8,
    ) {
        use crate::constants::property_address;

        // Validate spawn instance ID and property address compatibility
        if spawn_instance_id as usize >= self.game_state.spawn_instances.len() {
            return; // Invalid spawn instance ID - silent failure
        }

        // Check if property address is compatible with Spawn properties (0x52-0xBE)
        if !(0x52..=0xBE).contains(&property_address) {
            return; // Incompatible property address - silent failure
        }

        let spawn_instance = &self.game_state.spawn_instances[spawn_instance_id as usize];

        match property_address {
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
            property_address::SPAWN_INST_LIFE_SPAN => {
                if var_index < engine.fixed.len() {
                    engine.fixed[var_index] = Fixed::from_int(spawn_instance.life_span as i16);
                }
            }
            property_address::SPAWN_INST_ROTATION => {
                if var_index < engine.fixed.len() {
                    engine.fixed[var_index] = spawn_instance.rotation;
                }
            }
            _ => {} // Other spawn properties handled similarly
        }
    }

    fn write_spawn_property(
        &mut self,
        engine: &mut crate::script::ScriptEngine,
        spawn_instance_id: u8,
        property_address: u8,
        var_index: usize,
    ) {
        use crate::constants::property_address;

        // Validate spawn instance ID and property address compatibility
        if spawn_instance_id as usize >= self.game_state.spawn_instances.len() {
            return; // Invalid spawn instance ID - silent failure
        }

        // Check if property address is compatible with Spawn properties (0x52-0xBE)
        if !(0x52..=0xBE).contains(&property_address) {
            return; // Incompatible property address - silent failure
        }

        let spawn_instance = &mut self.game_state.spawn_instances[spawn_instance_id as usize];

        match property_address {
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
            property_address::SPAWN_INST_LIFE_SPAN => {
                if var_index < engine.fixed.len() {
                    spawn_instance.life_span = engine.fixed[var_index].to_int() as u16;
                }
            }
            property_address::SPAWN_INST_ROTATION => {
                if var_index < engine.fixed.len() {
                    spawn_instance.rotation = engine.fixed[var_index];
                }
            }
            _ => {} // Other spawn properties handled similarly
        }
    }
}

// Additional implementations for ConditionContext
impl ConditionContext<'_> {
    fn read_character_property_impl(
        &mut self,
        engine: &mut crate::script::ScriptEngine,
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
        engine: &mut crate::script::ScriptEngine,
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
        engine: &mut crate::script::ScriptEngine,
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
        engine: &mut crate::script::ScriptEngine,
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

// Additional implementations for ActionContext
impl ActionContext<'_> {
    fn read_character_property_impl(
        &mut self,
        engine: &mut crate::script::ScriptEngine,
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
        engine: &mut crate::script::ScriptEngine,
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
        engine: &mut crate::script::ScriptEngine,
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
        engine: &mut crate::script::ScriptEngine,
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
