//! Game state management and serialization

use crate::api::GameResult;
use crate::entity::{
    ActionDefinition,
    ActionId,
    ActionInstance,
    Character,
    ConditionDefinition,
    ConditionId,
    ConditionInstance,
    SpawnDefinition,
    SpawnInstance,
    // StatusEffect,
    StatusEffectDefinition,
    StatusEffectId,
};
use crate::physics::Tilemap;
use crate::random::SeededRng;
// use crate::status::process_character_status_effects;
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

    // Random number generator
    rng: SeededRng,
}

impl GameState {
    /// Create a new game instance
    pub fn new(
        seed: u16,
        tilemap: [[u8; 16]; 15],
        characters: Vec<Character>,
        spawn_definitions: Vec<SpawnDefinition>,
    ) -> GameResult<Self> {
        // Create status effect lookup with passive energy regeneration as the first effect
        let mut status_effect_lookup = Vec::new();
        status_effect_lookup.push(crate::status::create_passive_energy_regen_status_effect());

        let mut game_state = Self {
            seed,
            frame: 0,
            tile_map: Tilemap::new(tilemap),
            status: GameStatus::Playing,
            characters,
            spawn_instances: Vec::new(),

            // Initialize new definition collections
            action_definitions: Vec::new(),
            condition_definitions: Vec::new(),
            spawn_definitions,
            status_effect_definitions: Vec::new(),

            // Initialize new instance collections
            action_instances: Vec::new(),
            condition_instances: Vec::new(),
            rng: SeededRng::new(seed),
        };

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

        // Read lookup table sizes (but don't use them for now, just skip them)
        if pos + 3 < data.len() {
            let _pos = pos + 4; // Skip the 4 lookup table size bytes
        }

        Ok(Self {
            seed,
            frame,
            tile_map: Tilemap::new(tilemap),
            status,
            characters,
            spawn_instances,

            // Initialize new definition collections
            action_definitions: Vec::new(),
            condition_definitions: Vec::new(),
            spawn_definitions: Vec::new(),
            status_effect_definitions: Vec::new(),

            // Initialize new instance collections
            action_instances: Vec::new(),
            condition_instances: Vec::new(),

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

        // Status effects
        json.push_str(r#""status_effects":["#);
        for (i, effect) in character.status_effects.iter().enumerate() {
            if i > 0 {
                json.push(',');
            }
            json.push_str(&format!(
                r#"{{"effect_id":{},"remaining_duration":{},"stack_count":{},"vars":[{},{},{},{}]}}"#,
                effect.effect_id, effect.remaining_duration, effect.stack_count,
                effect.vars[0], effect.vars[1], effect.vars[2], effect.vars[3]
            ));
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
            r#""vars":[{},{},{},{}]"#,
            spawn.vars[0], spawn.vars[1], spawn.vars[2], spawn.vars[3]
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

        // Status effects: count (1) + effects (count * 8)
        data.push(character.status_effects.len() as u8);
        for effect in &character.status_effects {
            data.push(effect.effect_id);
            data.extend_from_slice(&effect.remaining_duration.to_le_bytes());
            data.push(effect.stack_count);
            data.extend_from_slice(&effect.vars);
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

        // Spawn-specific: spawn_id (1) + owner_id (1) + lifespan (2) + element (1) + vars (4) = 9 bytes
        data.push(spawn.spawn_id);
        data.push(spawn.owner_id);
        data.extend_from_slice(&spawn.lifespan.to_le_bytes());
        data.push(spawn.element as u8);
        data.extend_from_slice(&spawn.vars);

        Ok(())
    }

    fn deserialize_character(data: &[u8]) -> GameResult<(Character, usize)> {
        if data.len() < 36 {
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

        // Status effects
        if pos >= data.len() {
            return Err(crate::api::GameError::InvalidCharacterData);
        }
        let status_count = data[pos] as usize;
        pos += 1;
        let mut status_effects = Vec::new();
        for _ in 0..status_count {
            if pos + 7 >= data.len() {
                return Err(crate::api::GameError::InvalidCharacterData);
            }
            let effect_id = data[pos];
            pos += 1;
            let remaining_duration = u16::from_le_bytes([data[pos], data[pos + 1]]);
            pos += 2;
            let stack_count = data[pos];
            pos += 1;
            let mut vars = [0u8; 4];
            vars.copy_from_slice(&data[pos..pos + 4]);
            pos += 4;

            status_effects.push(crate::entity::StatusEffectInstance {
                effect_id,
                remaining_duration,
                stack_count,
                vars,
            });
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
        if data.len() < 27 {
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
        };

        Ok((spawn, pos))
    }

    // Private methods for frame processing
    fn process_status_effects(&mut self) -> GameResult<()> {
        // // Process status effects for each character individually to avoid borrowing conflicts
        // let status_definitions = self.status_effect_lookup.clone();

        // // Process characters one by one to avoid borrowing conflicts
        // for i in 0..self.characters.len() {
        //     // Create a temporary copy of the character for processing
        //     let mut character = self.characters[i].clone();

        //     if let Err(error) =
        //         process_character_status_effects(&mut character, self, &status_definitions)
        //     {
        //         // Handle script execution errors gracefully using error recovery
        //         let game_error = crate::api::GameError::from(error);
        //         if crate::error::ErrorRecovery::is_recoverable(&game_error) {
        //             // Log error and continue with next character
        //             // Note: In no_std environment, we can't use eprintln!
        //             // Error logging would be handled by the platform-specific wrapper
        //             continue;
        //         } else {
        //             // Non-recoverable error, propagate it
        //             return Err(game_error);
        //         }
        //     }

        //     // Update the character in the game state
        //     self.characters[i] = character;
        // }
        Ok(())
    }

    fn process_character_behaviors(&mut self) -> GameResult<()> {
        // let mut all_spawns_to_create = Vec::new();

        // // Process each character's behaviors individually to avoid borrowing conflicts
        // let conditions = self.condition_lookup.clone();
        // let actions = self.action_lookup.clone();

        // // Process characters one by one
        // let character_indices: Vec<usize> = (0..self.characters.len()).collect();

        // for &i in &character_indices {
        //     // Create a temporary copy of the character for processing
        //     let mut character = self.characters[i].clone();

        //     // Execute character behaviors using the behavior system
        //     match execute_character_behaviors(self, &mut character, &conditions, &actions) {
        //         Ok(mut spawns) => {
        //             // Update the character in the game state
        //             self.characters[i] = character;
        //             all_spawns_to_create.append(&mut spawns);
        //         }
        //         Err(error) => {
        //             // Handle script execution errors gracefully using error recovery
        //             let game_error = crate::api::GameError::from(error);
        //             if crate::error::ErrorRecovery::is_recoverable(&game_error) {
        //                 // Log error and continue with next character
        //                 // Note: In no_std environment, we can't use eprintln!
        //                 // Error logging would be handled by the platform-specific wrapper
        //                 continue;
        //             } else {
        //                 // Non-recoverable error, propagate it
        //                 return Err(game_error);
        //             }
        //         }
        //     }
        // }

        // // Add all created spawns to the game state
        // for mut spawn in all_spawns_to_create {
        //     // Assign unique ID to spawn
        //     spawn.core.id = self.spawn_instances.len() as u8;
        //     self.spawn_instances.push(spawn);
        // }

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
