//! Game state management and serialization

use crate::api::GameResult;
use crate::entity::{
    ActionDefinition, ActionId, ActionInstance, ActionInstanceId, Character, ConditionDefinition,
    ConditionId, ConditionInstance, SpawnDefinition, SpawnInstance, StatusEffectDefinition,
    StatusEffectId, StatusEffectInstance, StatusEffectInstanceId,
};
use crate::physics::Tilemap;
use crate::random::SeededRng;
use crate::script::ScriptError;
use alloc::format;
use alloc::string::{String, ToString};
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

    /// Export game state as JSON string
    pub fn to_json(&self) -> GameResult<String> {
        let mut json = String::new();
        json.push_str("{");

        // Basic game state
        json.push_str(&format!(r#""seed":{},"#, self.seed));
        json.push_str(&format!(r#""frame":{},"#, self.frame));
        json.push_str(&format!(
            r#""status":"{}","#,
            match self.status {
                GameStatus::Playing => "Playing",
                GameStatus::Ended => "Ended",
            }
        ));

        // Tilemap - access through getter method
        json.push_str(r#""tilemap":["#);
        for row_idx in 0..15 {
            if row_idx > 0 {
                json.push(',');
            }
            json.push('[');
            for col_idx in 0..16 {
                if col_idx > 0 {
                    json.push(',');
                }
                let tile = self.tile_map.get_tile(col_idx, row_idx) as u8;
                json.push_str(&tile.to_string());
            }
            json.push(']');
        }
        json.push_str("],");

        // Characters
        json.push_str(r#""characters":["#);
        for (idx, character) in self.characters.iter().enumerate() {
            if idx > 0 {
                json.push(',');
            }
            json.push_str(&self.character_to_json(character)?);
        }
        json.push_str("],");

        // Spawn instances
        json.push_str(r#""spawn_instances":["#);
        for (idx, spawn) in self.spawn_instances.iter().enumerate() {
            if idx > 0 {
                json.push(',');
            }
            json.push_str(&self.spawn_to_json(spawn)?);
        }
        json.push_str("]");

        json.push('}');
        Ok(json)
    }

    /// Export game state as binary data for efficient storage
    pub fn to_binary(&self) -> GameResult<Vec<u8>> {
        let mut data = Vec::new();

        // Header: seed (2 bytes) + frame (2 bytes) + status (1 byte)
        data.extend_from_slice(&self.seed.to_le_bytes());
        data.extend_from_slice(&self.frame.to_le_bytes());
        data.push(match self.status {
            GameStatus::Playing => 0,
            GameStatus::Ended => 1,
        });

        // Tilemap: 16x15 = 240 bytes
        for row_idx in 0..15 {
            for col_idx in 0..16 {
                let tile = self.tile_map.get_tile(col_idx, row_idx) as u8;
                data.push(tile);
            }
        }

        // Characters count + character data
        data.push(self.characters.len() as u8);
        for character in &self.characters {
            self.serialize_character(character, &mut data)?;
        }

        // Spawn instances count + spawn data
        data.push(self.spawn_instances.len() as u8);
        for spawn in &self.spawn_instances {
            self.serialize_spawn(spawn, &mut data)?;
        }

        Ok(data)
    }

    /// Create GameState from binary data
    pub fn from_binary(data: &[u8]) -> GameResult<Self> {
        if data.len() < 5 {
            return Err(crate::api::GameError::DataTooShort);
        }

        let mut pos = 0;

        // Read header
        let seed = u16::from_le_bytes([data[pos], data[pos + 1]]);
        pos += 2;
        let frame = u16::from_le_bytes([data[pos], data[pos + 1]]);
        pos += 2;
        let status = match data[pos] {
            0 => GameStatus::Playing,
            1 => GameStatus::Ended,
            _ => return Err(crate::api::GameError::InvalidBinaryData),
        };
        pos += 1;

        // Read tilemap
        if data.len() < pos + 240 {
            return Err(crate::api::GameError::DataTooShort);
        }
        let mut tilemap = [[0u8; 16]; 15];
        for row in 0..15 {
            for col in 0..16 {
                tilemap[row][col] = data[pos];
                pos += 1;
            }
        }

        // Read characters
        if pos >= data.len() {
            return Err(crate::api::GameError::DataTooShort);
        }
        let character_count = data[pos] as usize;
        pos += 1;

        let mut characters = Vec::new();
        for _ in 0..character_count {
            let (character, bytes_read) = Self::deserialize_character(&data[pos..])?;
            characters.push(character);
            pos += bytes_read;
        }

        // Read spawn instances
        if pos >= data.len() {
            return Err(crate::api::GameError::DataTooShort);
        }
        let spawn_count = data[pos] as usize;
        pos += 1;

        let mut spawn_instances = Vec::new();
        for _ in 0..spawn_count {
            if pos >= data.len() {
                return Err(crate::api::GameError::DataTooShort);
            }
            let (spawn, bytes_read) = Self::deserialize_spawn(&data[pos..])?;
            spawn_instances.push(spawn);
            pos += bytes_read;
        }

        // Note: from_binary is not updated to handle definition collections
        // This is a breaking change and requires new serialization format
        // For now, create empty definition collections
        Ok(Self {
            seed,
            frame,
            tile_map: Tilemap::new(tilemap),
            status,
            characters,
            spawn_instances,

            // Initialize empty definition collections (breaking change)
            action_definitions: Vec::new(),
            condition_definitions: Vec::new(),
            spawn_definitions: Vec::new(),
            status_effect_definitions: Vec::new(),

            // Initialize empty instance collections
            action_instances: Vec::new(),
            condition_instances: Vec::new(),
            status_effect_instances: Vec::new(),

            rng: SeededRng::new(seed),
        })
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

    // Helper methods for JSON serialization
    fn character_to_json(&self, character: &Character) -> GameResult<String> {
        let mut json = String::new();
        json.push('{');

        json.push_str(&format!(r#""id":{},"#, character.core.id));
        json.push_str(&format!(r#""group":{},"#, character.core.group));
        json.push_str(&format!(
            r#""pos":[{},{}],"#,
            character.core.pos.0.to_int(),
            character.core.pos.1.to_int()
        ));
        json.push_str(&format!(
            r#""vel":[{},{}],"#,
            character.core.vel.0.to_int(),
            character.core.vel.1.to_int()
        ));
        json.push_str(&format!(
            r#""size":[{},{}],"#,
            character.core.size.0, character.core.size.1
        ));
        json.push_str(&format!(
            r#""collision":[{},{},{},{}],"#,
            character.core.collision.0,
            character.core.collision.1,
            character.core.collision.2,
            character.core.collision.3
        ));
        json.push_str(&format!(r#""facing":{},"#, character.core.facing));
        json.push_str(&format!(r#""gravity_dir":{},"#, character.core.gravity_dir));
        json.push_str(&format!(r#""health":{},"#, character.health));
        json.push_str(&format!(r#""energy":{},"#, character.energy));

        // Elemental immunity array
        json.push_str(r#""armor":["#);
        for (i, &immunity) in character.armor.iter().enumerate() {
            if i > 0 {
                json.push(',');
            }
            json.push_str(&immunity.to_string());
        }
        json.push_str("],");

        // Behaviors
        json.push_str(r#""behaviors":["#);
        for (i, &(condition_id, action_id)) in character.behaviors.iter().enumerate() {
            if i > 0 {
                json.push(',');
            }
            json.push_str(&format!("[{},{}]", condition_id, action_id));
        }
        json.push_str("],");

        json.push_str(&format!(
            r#""locked_action":{},"#,
            match character.locked_action {
                Some(id) => id.to_string(),
                None => "null".to_string(),
            }
        ));

        // Status effects (now just IDs)
        json.push_str(r#""status_effects":["#);
        for (i, &effect_id) in character.status_effects.iter().enumerate() {
            if i > 0 {
                json.push(',');
            }
            json.push_str(&effect_id.to_string());
        }
        json.push_str("]");

        json.push('}');
        Ok(json)
    }

    fn spawn_to_json(&self, spawn: &SpawnInstance) -> GameResult<String> {
        let mut json = String::new();
        json.push('{');

        json.push_str(&format!(r#""id":{},"#, spawn.core.id));
        json.push_str(&format!(r#""group":{},"#, spawn.core.group));
        json.push_str(&format!(
            r#""pos":[{},{}],"#,
            spawn.core.pos.0.to_int(),
            spawn.core.pos.1.to_int()
        ));
        json.push_str(&format!(
            r#""vel":[{},{}],"#,
            spawn.core.vel.0.to_int(),
            spawn.core.vel.1.to_int()
        ));
        json.push_str(&format!(
            r#""size":[{},{}],"#,
            spawn.core.size.0, spawn.core.size.1
        ));
        json.push_str(&format!(
            r#""collision":[{},{},{},{}],"#,
            spawn.core.collision.0,
            spawn.core.collision.1,
            spawn.core.collision.2,
            spawn.core.collision.3
        ));
        json.push_str(&format!(r#""facing":{},"#, spawn.core.facing));
        json.push_str(&format!(r#""gravity_dir":{},"#, spawn.core.gravity_dir));
        json.push_str(&format!(r#""spawn_id":{},"#, spawn.spawn_id));
        json.push_str(&format!(r#""owner_id":{},"#, spawn.owner_id));
        json.push_str(&format!(r#""lifespan":{},"#, spawn.lifespan));
        json.push_str(&format!(r#""element":{},"#, spawn.element as u8));
        json.push_str(&format!(
            r#""vars":[{},{},{},{}],"#,
            spawn.vars[0], spawn.vars[1], spawn.vars[2], spawn.vars[3]
        ));
        json.push_str(&format!(
            r#""fixed":[{},{},{},{}]"#,
            spawn.fixed[0].to_int(),
            spawn.fixed[1].to_int(),
            spawn.fixed[2].to_int(),
            spawn.fixed[3].to_int()
        ));

        json.push('}');
        Ok(json)
    }

    // Helper methods for binary serialization
    fn serialize_character(&self, character: &Character, data: &mut Vec<u8>) -> GameResult<()> {
        // EntityCore: id (1) + group (1) + pos (4) + vel (4) + size (2) + collision (4) + facing (1) + gravity_dir (1) = 18 bytes
        data.push(character.core.id);
        data.push(character.core.group);
        data.extend_from_slice(&character.core.pos.0.raw().to_le_bytes());
        data.extend_from_slice(&character.core.pos.1.raw().to_le_bytes());
        data.extend_from_slice(&character.core.vel.0.raw().to_le_bytes());
        data.extend_from_slice(&character.core.vel.1.raw().to_le_bytes());
        data.push(character.core.size.0);
        data.push(character.core.size.1);
        data.push(if character.core.collision.0 { 1 } else { 0 });
        data.push(if character.core.collision.1 { 1 } else { 0 });
        data.push(if character.core.collision.2 { 1 } else { 0 });
        data.push(if character.core.collision.3 { 1 } else { 0 });
        data.push(character.core.facing);
        data.push(character.core.gravity_dir);

        // Character-specific: health (1) + energy (1) + armor (8) = 10 bytes
        data.push(character.health);
        data.push(character.energy);
        data.extend_from_slice(&character.armor);

        // Behaviors: count (1) + behaviors (count * 8) - each ID is now usize (4 bytes on 32-bit, 8 bytes on 64-bit)
        data.push(character.behaviors.len() as u8);
        for &(condition_id, action_id) in &character.behaviors {
            // Serialize usize as 4 bytes for cross-platform compatibility
            data.extend_from_slice(&(condition_id as u32).to_le_bytes());
            data.extend_from_slice(&(action_id as u32).to_le_bytes());
        }

        // Locked action: flag (1) + optional value (1)
        match character.locked_action {
            Some(id) => {
                data.push(1);
                data.push(id);
            }
            None => {
                data.push(0);
                data.push(0);
            }
        }

        // Status effects: count (1) + effect IDs (count * 1)
        data.push(character.status_effects.len() as u8);
        for &effect_id in &character.status_effects {
            data.push(effect_id);
        }

        Ok(())
    }

    fn serialize_spawn(&self, spawn: &SpawnInstance, data: &mut Vec<u8>) -> GameResult<()> {
        // EntityCore: id (1) + group (1) + pos (4) + vel (4) + size (2) + collision (4) + facing (1) + gravity_dir (1) = 18 bytes
        data.push(spawn.core.id);
        data.push(spawn.core.group);
        data.extend_from_slice(&spawn.core.pos.0.raw().to_le_bytes());
        data.extend_from_slice(&spawn.core.pos.1.raw().to_le_bytes());
        data.extend_from_slice(&spawn.core.vel.0.raw().to_le_bytes());
        data.extend_from_slice(&spawn.core.vel.1.raw().to_le_bytes());
        data.push(spawn.core.size.0);
        data.push(spawn.core.size.1);
        data.push(if spawn.core.collision.0 { 1 } else { 0 });
        data.push(if spawn.core.collision.1 { 1 } else { 0 });
        data.push(if spawn.core.collision.2 { 1 } else { 0 });
        data.push(if spawn.core.collision.3 { 1 } else { 0 });
        data.push(spawn.core.facing);
        data.push(spawn.core.gravity_dir);

        // Spawn-specific: spawn_id (1) + owner_id (1) + lifespan (2) + element (1) + vars (4) + fixed (8) = 17 bytes
        data.push(spawn.spawn_id);
        data.push(spawn.owner_id);
        data.extend_from_slice(&spawn.lifespan.to_le_bytes());
        data.push(spawn.element as u8);
        data.extend_from_slice(&spawn.vars);
        // Serialize fixed array
        for fixed_val in &spawn.fixed {
            data.extend_from_slice(&fixed_val.raw().to_le_bytes());
        }

        Ok(())
    }

    fn deserialize_character(data: &[u8]) -> GameResult<(Character, usize)> {
        if data.len() < 30 {
            return Err(crate::api::GameError::InvalidCharacterData);
        }

        let mut pos = 0;

        // EntityCore
        let id = data[pos];
        pos += 1;
        let group = data[pos];
        pos += 1;
        let pos_x = crate::math::Fixed::from_raw(i16::from_le_bytes([data[pos], data[pos + 1]]));
        pos += 2;
        let pos_y = crate::math::Fixed::from_raw(i16::from_le_bytes([data[pos], data[pos + 1]]));
        pos += 2;
        let vel_x = crate::math::Fixed::from_raw(i16::from_le_bytes([data[pos], data[pos + 1]]));
        pos += 2;
        let vel_y = crate::math::Fixed::from_raw(i16::from_le_bytes([data[pos], data[pos + 1]]));
        pos += 2;
        let size_w = data[pos];
        pos += 1;
        let size_h = data[pos];
        pos += 1;
        let collision = (
            data[pos] != 0,
            data[pos + 1] != 0,
            data[pos + 2] != 0,
            data[pos + 3] != 0,
        );
        pos += 4;
        let facing = data[pos];
        pos += 1;
        let gravity_dir = data[pos];
        pos += 1;

        // Character-specific
        let health = data[pos];
        pos += 1;
        let energy = data[pos];
        pos += 1;
        let mut armor = [0u8; 8];
        armor.copy_from_slice(&data[pos..pos + 8]);
        pos += 8;

        // Behaviors
        if pos >= data.len() {
            return Err(crate::api::GameError::InvalidCharacterData);
        }
        let behavior_count = data[pos] as usize;
        pos += 1;
        let mut behaviors = Vec::new();
        for _ in 0..behavior_count {
            if pos + 7 >= data.len() {
                return Err(crate::api::GameError::InvalidCharacterData);
            }
            let condition_id =
                u32::from_le_bytes([data[pos], data[pos + 1], data[pos + 2], data[pos + 3]])
                    as usize;
            pos += 4;
            let action_id =
                u32::from_le_bytes([data[pos], data[pos + 1], data[pos + 2], data[pos + 3]])
                    as usize;
            pos += 4;
            behaviors.push((condition_id, action_id));
        }

        // Locked action
        if pos + 1 >= data.len() {
            return Err(crate::api::GameError::InvalidCharacterData);
        }
        let locked_action = if data[pos] != 0 {
            Some(data[pos + 1])
        } else {
            None
        };
        pos += 2;

        // Status effects (now just IDs)
        if pos >= data.len() {
            return Err(crate::api::GameError::InvalidCharacterData);
        }
        let status_count = data[pos] as usize;
        pos += 1;
        let mut status_effects = Vec::new();
        for _ in 0..status_count {
            if pos >= data.len() {
                return Err(crate::api::GameError::InvalidCharacterData);
            }
            let effect_id = data[pos];
            pos += 1;
            status_effects.push(effect_id);
        }

        let character = Character {
            core: crate::entity::EntityCore {
                id,
                group,
                pos: (pos_x, pos_y),
                vel: (vel_x, vel_y),
                size: (size_w, size_h),
                collision,
                facing,
                gravity_dir,
            },
            health,
            energy,
            armor,
            energy_regen: 0, // Will be set during game initialization
            energy_regen_rate: 0,
            energy_charge: 0,
            energy_charge_rate: 0,
            behaviors,
            locked_action,
            status_effects,
            action_last_used: Vec::new(),
        };

        Ok((character, pos))
    }

    fn deserialize_spawn(data: &[u8]) -> GameResult<(SpawnInstance, usize)> {
        if data.len() < 35 {
            // Updated size: 27 + 8 for fixed array
            return Err(crate::api::GameError::InvalidSpawnData);
        }

        let mut pos = 0;

        // EntityCore
        let id = data[pos];
        pos += 1;
        let group = data[pos];
        pos += 1;
        let pos_x = crate::math::Fixed::from_raw(i16::from_le_bytes([data[pos], data[pos + 1]]));
        pos += 2;
        let pos_y = crate::math::Fixed::from_raw(i16::from_le_bytes([data[pos], data[pos + 1]]));
        pos += 2;
        let vel_x = crate::math::Fixed::from_raw(i16::from_le_bytes([data[pos], data[pos + 1]]));
        pos += 2;
        let vel_y = crate::math::Fixed::from_raw(i16::from_le_bytes([data[pos], data[pos + 1]]));
        pos += 2;
        let size_w = data[pos];
        pos += 1;
        let size_h = data[pos];
        pos += 1;
        let collision = (
            data[pos] != 0,
            data[pos + 1] != 0,
            data[pos + 2] != 0,
            data[pos + 3] != 0,
        );
        pos += 4;
        let facing = data[pos];
        pos += 1;
        let gravity_dir = data[pos];
        pos += 1;

        // Spawn-specific
        let spawn_id = data[pos];
        pos += 1;
        let owner_id = data[pos];
        pos += 1;
        let lifespan = u16::from_le_bytes([data[pos], data[pos + 1]]);
        pos += 2;
        let element =
            crate::entity::Element::from_u8(data[pos]).unwrap_or(crate::entity::Element::Punct);
        pos += 1;
        let mut vars = [0u8; 4];
        vars.copy_from_slice(&data[pos..pos + 4]);
        pos += 4;
        // Deserialize fixed array
        let mut fixed = [crate::math::Fixed::ZERO; 4];
        for i in 0..4 {
            fixed[i] = crate::math::Fixed::from_raw(i16::from_le_bytes([data[pos], data[pos + 1]]));
            pos += 2;
        }

        let spawn = SpawnInstance {
            core: crate::entity::EntityCore {
                id,
                group,
                pos: (pos_x, pos_y),
                vel: (vel_x, vel_y),
                size: (size_w, size_h),
                collision,
                facing,
                gravity_dir,
            },
            spawn_id,
            owner_id,
            lifespan,
            element,
            vars,
            fixed,
        };

        Ok((spawn, pos))
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

                        // Decrease remaining duration first
                        if let Some(instance_mut) = self
                            .status_effect_instances
                            .get_mut(effect_instance_id as usize)
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
        self.spawn_instances.retain(|spawn| spawn.lifespan > 0);
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
            instance.runtime_vars = engine.vars;
            instance.runtime_fixed = engine.fixed;
        }
    }
}

impl<'a> crate::script::ScriptContext for ConditionContext<'a> {
    fn read_property(
        &mut self,
        engine: &mut crate::script::ScriptEngine,
        var_index: usize,
        prop_address: u8,
    ) {
        // For now, implement basic property reading
        // This would need to be expanded based on the PropertyAddress enum
        if let Some(character) = self.game_state.characters.get(self.character_idx) {
            let value = match prop_address {
                0 => character.health,
                1 => character.energy,
                2 => character.core.pos.0.to_int() as u8,
                3 => character.core.pos.1.to_int() as u8,
                4 => character.core.facing,
                _ => 0,
            };

            if var_index < engine.vars.len() {
                engine.vars[var_index] = value;
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
        if var_index >= engine.vars.len() {
            return;
        }

        if let Some(character) = self.game_state.characters.get_mut(self.character_idx) {
            let value = engine.vars[var_index];
            match prop_address {
                0 => character.health = value,
                1 => character.energy = value,
                4 => character.core.facing = value,
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
            instance.runtime_vars = engine.vars;
            instance.runtime_fixed = engine.fixed;
        }
    }
}

impl<'a> crate::script::ScriptContext for ActionContext<'a> {
    fn read_property(
        &mut self,
        engine: &mut crate::script::ScriptEngine,
        var_index: usize,
        prop_address: u8,
    ) {
        // For now, implement basic property reading
        if let Some(character) = self.game_state.characters.get(self.character_idx) {
            let value = match prop_address {
                0 => character.health,
                1 => character.energy,
                2 => character.core.pos.0.to_int() as u8,
                3 => character.core.pos.1.to_int() as u8,
                4 => character.core.facing,
                _ => 0,
            };

            if var_index < engine.vars.len() {
                engine.vars[var_index] = value;
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
        if var_index >= engine.vars.len() {
            return;
        }

        if let Some(character) = self.game_state.characters.get_mut(self.character_idx) {
            let value = engine.vars[var_index];
            match prop_address {
                0 => character.health = value,
                1 => character.energy = value,
                4 => character.core.facing = value,
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

                // Set duration from definition
                if let Some(action_def) = self.game_state.action_definitions.get(self.action_id) {
                    if let Some(instance_mut) =
                        self.game_state.action_instances.get_mut(self.instance_id)
                    {
                        instance_mut.remaining_duration = action_def.duration;
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
                instance.remaining_duration = action_def.duration;
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
                spawn.vars = spawn_vars;
            }

            // Assign unique ID
            spawn.core.id = self.game_state.spawn_instances.len() as u8;

            // Set properties from spawn definition
            spawn.lifespan = spawn_def.duration;
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
}
