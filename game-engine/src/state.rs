//! Game state management and serialization

use crate::api::GameResult;
use crate::behavior::{execute_character_behaviors, Action, Condition};
use crate::entity::{Character, SpawnDefinition, SpawnInstance, StatusEffect};
use crate::physics::Tilemap;
use crate::random::SeededRng;
use crate::script::ScriptEngine;
use crate::status::process_character_status_effects;
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

    // Lookup tables for scripts and definitions
    pub action_lookup: Vec<Action>,
    pub condition_lookup: Vec<Condition>,
    pub spawn_lookup: Vec<SpawnDefinition>,
    pub status_effect_lookup: Vec<StatusEffect>,

    // Script engine for bytecode execution
    script_engine: ScriptEngine,

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
            action_lookup: Vec::new(),
            condition_lookup: Vec::new(),
            spawn_lookup: spawn_definitions,
            status_effect_lookup,
            script_engine: ScriptEngine::new(),
            rng: SeededRng::new(seed),
        };

        // Apply passive energy regeneration to all characters
        crate::status::apply_passive_energy_regen_to_all_characters(&mut game_state.characters)
            .map_err(|_| "Failed to apply passive energy regeneration")?;

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

        // Lookup tables sizes (for deserialization)
        data.push(self.action_lookup.len() as u8);
        data.push(self.condition_lookup.len() as u8);
        data.push(self.spawn_lookup.len() as u8);
        data.push(self.status_effect_lookup.len() as u8);

        Ok(data)
    }

    /// Create GameState from binary data
    pub fn from_binary(data: &[u8]) -> GameResult<Self> {
        if data.len() < 5 {
            return Err("Invalid binary data: too short".into());
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
            _ => return Err("Invalid game status".into()),
        };
        pos += 1;

        // Read tilemap
        if data.len() < pos + 240 {
            return Err("Invalid binary data: tilemap too short".into());
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
            return Err("Invalid binary data: missing character count".into());
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
            return Err("Invalid binary data: missing spawn count".into());
        }
        let spawn_count = data[pos] as usize;
        pos += 1;

        let mut spawn_instances = Vec::new();
        for _ in 0..spawn_count {
            if pos >= data.len() {
                return Err("Invalid binary data: not enough data for spawn".into());
            }
            let (spawn, bytes_read) = Self::deserialize_spawn(&data[pos..])?;
            spawn_instances.push(spawn);
            pos += bytes_read;
        }

        // Read lookup table sizes (but don't use them for now, just skip them)
        if pos + 3 < data.len() {
            pos += 4; // Skip the 4 lookup table size bytes
        }

        Ok(Self {
            seed,
            frame,
            tile_map: Tilemap::new(tilemap),
            status,
            characters,
            spawn_instances,
            action_lookup: Vec::new(),
            condition_lookup: Vec::new(),
            spawn_lookup: Vec::new(),
            status_effect_lookup: Vec::new(),
            script_engine: ScriptEngine::new(),
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

        // Behaviors: count (1) + behaviors (count * 2)
        data.push(character.behaviors.len() as u8);
        for &(condition_id, action_id) in &character.behaviors {
            data.push(condition_id);
            data.push(action_id);
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
            return Err("Invalid character data: too short".into());
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
            return Err("Invalid character data: missing behavior count".into());
        }
        let behavior_count = data[pos] as usize;
        pos += 1;
        let mut behaviors = Vec::new();
        for _ in 0..behavior_count {
            if pos + 1 >= data.len() {
                return Err("Invalid character data: incomplete behavior".into());
            }
            behaviors.push((data[pos], data[pos + 1]));
            pos += 2;
        }

        // Locked action
        if pos + 1 >= data.len() {
            return Err("Invalid character data: missing locked action".into());
        }
        let locked_action = if data[pos] != 0 {
            Some(data[pos + 1])
        } else {
            None
        };
        pos += 2;

        // Status effects
        if pos >= data.len() {
            return Err("Invalid character data: missing status effect count".into());
        }
        let status_count = data[pos] as usize;
        pos += 1;
        let mut status_effects = Vec::new();
        for _ in 0..status_count {
            if pos + 7 >= data.len() {
                return Err("Invalid character data: incomplete status effect".into());
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
            return Err("Invalid spawn data: too short".into());
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
        // Process status effects for each character individually to avoid borrowing conflicts
        let status_definitions = self.status_effect_lookup.clone();

        // Process characters one by one to avoid borrowing conflicts
        for i in 0..self.characters.len() {
            // Create a temporary copy of the character for processing
            let mut character = self.characters[i].clone();

            if let Err(_) =
                process_character_status_effects(&mut character, self, &status_definitions)
            {
                // Handle script execution errors gracefully
                // For now, just continue to next character
                continue;
            }

            // Update the character in the game state
            self.characters[i] = character;
        }
        Ok(())
    }

    fn process_character_behaviors(&mut self) -> GameResult<()> {
        let mut all_spawns_to_create = Vec::new();

        // Process each character's behaviors individually to avoid borrowing conflicts
        let conditions = self.condition_lookup.clone();
        let actions = self.action_lookup.clone();

        // Process characters one by one
        let character_indices: Vec<usize> = (0..self.characters.len()).collect();

        for &i in &character_indices {
            // Create a temporary copy of the character for processing
            let mut character = self.characters[i].clone();

            // Execute character behaviors using the behavior system
            match execute_character_behaviors(self, &mut character, &conditions, &actions) {
                Ok(mut spawns) => {
                    // Update the character in the game state
                    self.characters[i] = character;
                    all_spawns_to_create.append(&mut spawns);
                }
                Err(_) => {
                    // Handle script execution errors gracefully
                    // For now, just continue to next character
                    continue;
                }
            }
        }

        // Add all created spawns to the game state
        for mut spawn in all_spawns_to_create {
            // Assign unique ID to spawn
            spawn.core.id = self.spawn_instances.len() as u8;
            self.spawn_instances.push(spawn);
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

#[cfg(test)]
mod tests {
    use super::*;
    use alloc::vec;

    #[test]
    fn test_deterministic_random_generation() {
        let seed = 12345;
        let tilemap = [[0u8; 16]; 15];

        let mut game1 = GameState::new(seed, tilemap, vec![], vec![]).unwrap();
        let mut game2 = GameState::new(seed, tilemap, vec![], vec![]).unwrap();

        // Generate several random values and ensure they match
        for _ in 0..50 {
            assert_eq!(game1.next_random(), game2.next_random());
            assert_eq!(game1.next_random_u8(), game2.next_random_u8());
            assert_eq!(game1.next_random_bool(), game2.next_random_bool());
            assert_eq!(game1.next_random_range(100), game2.next_random_range(100));
        }
    }

    #[test]
    fn test_different_seeds_produce_different_randoms() {
        let tilemap = [[0u8; 16]; 15];

        let mut game1 = GameState::new(12345, tilemap, vec![], vec![]).unwrap();
        let mut game2 = GameState::new(54321, tilemap, vec![], vec![]).unwrap();

        let mut differences = 0;
        for _ in 0..100 {
            if game1.next_random() != game2.next_random() {
                differences += 1;
            }
        }

        // Should have many differences
        assert!(differences > 80);
    }

    #[test]
    fn test_rng_reset_functionality() {
        let seed = 12345;
        let tilemap = [[0u8; 16]; 15];

        let mut game = GameState::new(seed, tilemap, vec![], vec![]).unwrap();

        // Generate some values
        let first_value = game.next_random();
        let second_value = game.next_random();

        // Reset and verify we get the same sequence
        game.reset_rng();
        assert_eq!(game.next_random(), first_value);
        assert_eq!(game.next_random(), second_value);
    }

    #[test]
    fn test_game_state_serialization_includes_seed() {
        let seed = 42;
        let tilemap = [[0u8; 16]; 15];

        let game = GameState::new(seed, tilemap, vec![], vec![]).unwrap();

        let binary_data = game.to_binary().unwrap();

        // First two bytes should be the seed in little-endian format
        let serialized_seed = u16::from_le_bytes([binary_data[0], binary_data[1]]);
        assert_eq!(serialized_seed, seed);
    }

    #[test]
    fn test_frame_advancement_maintains_rng_state() {
        let seed = 12345;
        let tilemap = [[0u8; 16]; 15];

        let mut game = GameState::new(seed, tilemap, vec![], vec![]).unwrap();

        // Generate a value before frame advancement
        let value_before = game.next_random();

        // Advance frame
        let _ = game.advance_frame();

        // Generate a value after frame advancement
        let value_after = game.next_random();

        // Values should be different (RNG state should continue)
        assert_ne!(value_before, value_after);
    }

    #[test]
    fn test_character_behavior_integration() {
        use crate::behavior::{Action, Condition};
        use crate::entity::Character;
        use crate::math::Fixed;

        let seed = 12345;
        let tilemap = [[0u8; 16]; 15];
        let mut character = Character::new(1, 0);

        // Add a behavior to the character
        character.behaviors.push((0, 0)); // condition_id: 0, action_id: 0
        character.energy = 50;

        let mut game = GameState::new(seed, tilemap, vec![character], vec![]).unwrap();

        // Add a simple condition that always succeeds
        let condition = Condition {
            id: 0,
            energy_mul: Fixed::from_int(1),
            vars: [0; 8],
            fixed: [Fixed::ZERO; 4],
            args: [0; 8],
            spawns: [0; 4],
            script: vec![0, 1], // Exit with flag 1 (success)
        };
        game.condition_lookup.push(condition);

        // Add a simple action that costs 10 energy
        let action = Action {
            energy_cost: 10,
            interval: 60,
            duration: 30,
            cooldown: 0,
            vars: [0; 8],
            fixed: [Fixed::ZERO; 4],
            args: [0; 8],
            spawns: [0; 4],
            script: vec![0, 1], // Exit with flag 1 (success)
        };
        game.action_lookup.push(action);

        // Verify initial state
        assert_eq!(game.characters[0].energy, 50);

        // Advance one frame to trigger behavior processing
        let _ = game.advance_frame();

        // Character should have consumed energy (50 - 10 = 40)
        assert_eq!(game.characters[0].energy, 40);
    }

    #[test]
    fn test_character_behavior_energy_requirement() {
        use crate::behavior::{Action, Condition};
        use crate::entity::Character;
        use crate::math::Fixed;

        let seed = 12345;
        let tilemap = [[0u8; 16]; 15];
        let mut character = Character::new(1, 0);

        // Add a behavior to the character
        character.behaviors.push((0, 0)); // condition_id: 0, action_id: 0
        character.energy = 5; // Not enough energy

        let mut game = GameState::new(seed, tilemap, vec![character], vec![]).unwrap();

        // Add a condition that always succeeds
        let condition = Condition {
            id: 0,
            energy_mul: Fixed::from_int(1),
            vars: [0; 8],
            fixed: [Fixed::ZERO; 4],
            args: [0; 8],
            spawns: [0; 4],
            script: vec![0, 1], // Exit with flag 1 (success)
        };
        game.condition_lookup.push(condition);

        // Add an action that costs 10 energy (more than character has)
        let action = Action {
            energy_cost: 10,
            interval: 60,
            duration: 30,
            cooldown: 0,
            vars: [0; 8],
            fixed: [Fixed::ZERO; 4],
            args: [0; 8],
            spawns: [0; 4],
            script: vec![0, 1], // Exit with flag 1 (success)
        };
        game.action_lookup.push(action);

        // Verify initial state
        assert_eq!(game.characters[0].energy, 5);

        // Advance one frame to trigger behavior processing
        let _ = game.advance_frame();

        // Character should not have consumed energy (insufficient energy)
        assert_eq!(game.characters[0].energy, 5);
    }

    #[test]
    fn test_locked_action_skips_behavior_processing() {
        use crate::behavior::{Action, Condition};
        use crate::entity::Character;
        use crate::math::Fixed;

        let seed = 12345;
        let tilemap = [[0u8; 16]; 15];
        let mut character = Character::new(1, 0);

        // Add a behavior and lock the character in an action
        character.behaviors.push((0, 0));
        character.energy = 50;
        character.locked_action = Some(1); // Character is locked

        let mut game = GameState::new(seed, tilemap, vec![character], vec![]).unwrap();

        // Add condition and action
        let condition = Condition {
            id: 0,
            energy_mul: Fixed::from_int(1),
            vars: [0; 8],
            fixed: [Fixed::ZERO; 4],
            args: [0; 8],
            spawns: [0; 4],
            script: vec![0, 1],
        };
        game.condition_lookup.push(condition);

        let action = Action {
            energy_cost: 10,
            interval: 60,
            duration: 30,
            cooldown: 0,
            vars: [0; 8],
            fixed: [Fixed::ZERO; 4],
            args: [0; 8],
            spawns: [0; 4],
            script: vec![0, 1],
        };
        game.action_lookup.push(action);

        // Verify initial state
        assert_eq!(game.characters[0].energy, 50);
        assert_eq!(game.characters[0].locked_action, Some(1));

        // Advance one frame
        let _ = game.advance_frame();

        // Character should not have consumed energy (locked in action)
        assert_eq!(game.characters[0].energy, 50);
    }

    #[test]
    fn test_binary_serialization_round_trip() {
        use crate::entity::Character;
        use crate::math::Fixed;

        let seed = 42;
        let mut tilemap = [[0u8; 16]; 15];
        // Set some non-zero tiles for testing (using only valid tile types 0 and 1)
        tilemap[0][0] = 1;
        tilemap[5][10] = 1;
        tilemap[14][15] = 1;

        // Create a simple character to test basic serialization
        let character = Character::new(1, 0);

        let game = GameState::new(seed, tilemap, vec![character], vec![]).unwrap();

        // Serialize to binary
        let binary_data = game.to_binary().unwrap();

        // Deserialize from binary
        let restored_game = match GameState::from_binary(&binary_data) {
            Ok(game) => game,
            Err(e) => panic!("Failed to deserialize game state: {:?}", e),
        };

        // Verify basic game state
        assert_eq!(restored_game.seed, seed);
        assert_eq!(restored_game.frame, 0);
        assert_eq!(restored_game.status, GameStatus::Playing);

        // Verify tilemap
        assert_eq!(restored_game.tile_map.get_tile(0, 0) as u8, 1);
        assert_eq!(restored_game.tile_map.get_tile(10, 5) as u8, 1);
        assert_eq!(restored_game.tile_map.get_tile(15, 14) as u8, 1);

        // Verify character
        assert_eq!(restored_game.characters.len(), 1);
        let restored_char = &restored_game.characters[0];
        assert_eq!(restored_char.core.id, 1);
        assert_eq!(restored_char.core.group, 0);
        assert_eq!(restored_char.health, 100); // Default value
        assert_eq!(restored_char.energy, 100); // Default value
        assert_eq!(restored_char.core.pos, (Fixed::ZERO, Fixed::ZERO)); // Default value
        assert_eq!(restored_char.core.vel, (Fixed::ZERO, Fixed::ZERO)); // Default value
        assert_eq!(restored_char.core.size, (16, 16)); // Default value
        assert_eq!(restored_char.core.collision, (true, true, true, true)); // Default value
        assert_eq!(restored_char.armor, [100; 8]); // Default armor values
        assert_eq!(restored_char.behaviors.len(), 0); // No behaviors added
        assert_eq!(restored_char.locked_action, None); // No locked action
        assert_eq!(restored_char.status_effects.len(), 1); // Passive energy regeneration status effect

        // Verify no spawns
        assert_eq!(restored_game.spawn_instances.len(), 0);
    }

    #[test]
    fn test_json_serialization_format() {
        use crate::entity::{Character, Element, SpawnInstance};
        use crate::math::Fixed;

        let seed = 123;
        let tilemap = [[0u8; 16]; 15];

        let mut character = Character::new(1, 0);
        character.health = 80;
        character.energy = 90;
        character.core.pos = (Fixed::from_int(10), Fixed::from_int(20));
        character.behaviors.push((1, 2));

        let spawn = SpawnInstance::with_element(
            5,
            1,
            (Fixed::from_int(30), Fixed::from_int(40)),
            Element::Cryo,
        );

        let mut game = GameState::new(seed, tilemap, vec![character], vec![]).unwrap();
        game.spawn_instances.push(spawn);
        game.frame = 100;

        let json = game.to_json().unwrap();

        // Verify JSON contains expected fields
        assert!(json.contains(r#""seed":123"#));
        assert!(json.contains(r#""frame":100"#));
        assert!(json.contains(r#""status":"Playing""#));
        assert!(json.contains(r#""tilemap":"#));
        assert!(json.contains(r#""characters":"#));
        assert!(json.contains(r#""spawn_instances":"#));
        assert!(json.contains(r#""health":80"#));
        assert!(json.contains(r#""energy":90"#));
        assert!(json.contains(r#""element":5"#)); // Cryo = 5
    }

    #[test]
    fn test_empty_game_state_serialization() {
        let seed = 999;
        let tilemap = [[0u8; 16]; 15];

        let game = GameState::new(seed, tilemap, vec![], vec![]).unwrap();

        // Test binary serialization
        let binary_data = game.to_binary().unwrap();
        let restored_game = GameState::from_binary(&binary_data).unwrap();

        assert_eq!(restored_game.seed, seed);
        assert_eq!(restored_game.frame, 0);
        assert_eq!(restored_game.status, GameStatus::Playing);
        assert_eq!(restored_game.characters.len(), 0);
        assert_eq!(restored_game.spawn_instances.len(), 0);

        // Test JSON serialization
        let json = game.to_json().unwrap();
        assert!(json.contains(r#""seed":999"#));
        assert!(json.contains(r#""frame":0"#));
        assert!(json.contains(r#""characters":[]"#));
        assert!(json.contains(r#""spawn_instances":[]"#));
    }

    #[test]
    fn test_game_status_serialization() {
        let seed = 456;
        let tilemap = [[0u8; 16]; 15];

        let mut game = GameState::new(seed, tilemap, vec![], vec![]).unwrap();
        game.status = GameStatus::Ended;

        // Test binary serialization
        let binary_data = game.to_binary().unwrap();
        let restored_game = GameState::from_binary(&binary_data).unwrap();
        assert_eq!(restored_game.status, GameStatus::Ended);

        // Test JSON serialization
        let json = game.to_json().unwrap();
        assert!(json.contains(r#""status":"Ended""#));
    }

    #[test]
    fn test_tilemap_serialization() {
        let seed = 789;
        let mut tilemap = [[0u8; 16]; 15];

        // Create a pattern in the tilemap (using only valid tile types 0 and 1)
        for row in 0..15 {
            for col in 0..16 {
                tilemap[row][col] = ((row + col) % 2) as u8;
            }
        }

        let game = GameState::new(seed, tilemap, vec![], vec![]).unwrap();

        // First verify the original game has the correct pattern
        for row in 0..15 {
            for col in 0..16 {
                assert_eq!(
                    game.tile_map.get_tile(col, row) as u8,
                    ((row + col) % 2) as u8,
                    "Original game tilemap mismatch at ({}, {})",
                    col,
                    row
                );
            }
        }

        // Test binary round-trip
        let binary_data = game.to_binary().unwrap();
        let restored_game = GameState::from_binary(&binary_data).unwrap();

        for row in 0..15 {
            for col in 0..16 {
                assert_eq!(
                    restored_game.tile_map.get_tile(col, row) as u8,
                    ((row + col) % 2) as u8,
                    "Restored game tilemap mismatch at ({}, {})",
                    col,
                    row
                );
            }
        }

        // Test JSON contains tilemap
        let json = game.to_json().unwrap();
        assert!(json.contains(r#""tilemap":"#));
        assert!(json.contains("[0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1]")); // First row pattern
    }

    #[test]
    fn test_character_with_multiple_status_effects() {
        use crate::entity::{Character, StatusEffectInstance};
        use crate::math::Fixed;

        let seed = 111;
        let tilemap = [[0u8; 16]; 15];

        let mut character = Character::new(1, 0);
        character.status_effects.push(StatusEffectInstance {
            effect_id: 1,
            remaining_duration: 100,
            stack_count: 1,
            vars: [10, 20, 30, 40],
        });
        character.status_effects.push(StatusEffectInstance {
            effect_id: 2,
            remaining_duration: 200,
            stack_count: 3,
            vars: [50, 60, 70, 80],
        });

        let game = GameState::new(seed, tilemap, vec![character], vec![]).unwrap();

        // Test binary round-trip
        let binary_data = game.to_binary().unwrap();
        let restored_game = GameState::from_binary(&binary_data).unwrap();

        assert_eq!(restored_game.characters[0].status_effects.len(), 3); // Including passive energy regen
        assert_eq!(restored_game.characters[0].status_effects[0].effect_id, 1);
        assert_eq!(
            restored_game.characters[0].status_effects[0].remaining_duration,
            100
        );
        assert_eq!(
            restored_game.characters[0].status_effects[0].vars,
            [10, 20, 30, 40]
        );
        assert_eq!(restored_game.characters[0].status_effects[1].effect_id, 2);
        assert_eq!(
            restored_game.characters[0].status_effects[1].remaining_duration,
            200
        );
        assert_eq!(restored_game.characters[0].status_effects[1].stack_count, 3);
        assert_eq!(
            restored_game.characters[0].status_effects[1].vars,
            [50, 60, 70, 80]
        );
    }

    #[test]
    fn test_single_character_serialization() {
        use crate::entity::Character;

        let seed = 222;
        let tilemap = [[0u8; 16]; 15];

        let character = Character::new(1, 0);
        let game = GameState::new(seed, tilemap, vec![character], vec![]).unwrap();

        // Test binary round-trip
        let binary_data = game.to_binary().unwrap();
        let restored_game = GameState::from_binary(&binary_data).unwrap();

        assert_eq!(restored_game.characters.len(), 1);
        assert_eq!(restored_game.characters[0].core.id, 1);
    }

    #[test]
    fn test_two_characters_serialization() {
        use crate::entity::Character;

        let seed = 222;
        let tilemap = [[0u8; 16]; 15];

        let char1 = Character::new(1, 0);
        let char2 = Character::new(2, 1);
        let game = GameState::new(seed, tilemap, vec![char1, char2], vec![]).unwrap();

        // Test binary round-trip
        let binary_data = game.to_binary().unwrap();
        let restored_game = GameState::from_binary(&binary_data).unwrap();

        assert_eq!(restored_game.characters.len(), 2);
        assert_eq!(restored_game.characters[0].core.id, 1);
        assert_eq!(restored_game.characters[1].core.id, 2);
    }

    #[test]
    fn test_binary_serialization_format() {
        use crate::entity::Character;

        let seed = 222;
        let tilemap = [[0u8; 16]; 15];

        let character = Character::new(1, 0);
        let game = GameState::new(seed, tilemap, vec![character], vec![]).unwrap();

        // Test that binary serialization works
        let binary_data = game.to_binary().unwrap();

        // Check basic format: seed (2) + frame (2) + status (1) + tilemap (240) + char count (1) + char data + spawn count (1) + lookup sizes (4)
        assert!(binary_data.len() >= 251); // Minimum size without character data
    }

    #[test]
    fn test_spawn_deserialization_directly() {
        use crate::entity::{Element, SpawnInstance};
        use crate::math::Fixed;

        // Create a spawn manually
        let spawn = SpawnInstance::with_element(
            1,
            1,
            (Fixed::from_int(10), Fixed::from_int(10)),
            Element::Punct,
        );

        // Serialize just the spawn
        let mut data = Vec::new();
        let game = GameState::new(222, [[0u8; 16]; 15], vec![], vec![]).unwrap();
        game.serialize_spawn(&spawn, &mut data).unwrap();

        // Check that we have the expected 27 bytes (EntityCore: 18 + Spawn-specific: 9)
        assert_eq!(data.len(), 27);

        // Try to deserialize
        let (deserialized_spawn, bytes_read) = GameState::deserialize_spawn(&data).unwrap();
        assert_eq!(bytes_read, 27);
        assert_eq!(deserialized_spawn.spawn_id, 1);
        assert_eq!(deserialized_spawn.element, Element::Punct);
    }

    #[test]
    fn test_single_spawn_serialization() {
        use crate::entity::{Character, Element, SpawnInstance};
        use crate::math::Fixed;

        let seed = 222;
        let tilemap = [[0u8; 16]; 15];

        let character = Character::new(1, 0);
        let mut game = GameState::new(seed, tilemap, vec![character], vec![]).unwrap();

        let spawn = SpawnInstance::with_element(
            1,
            1,
            (Fixed::from_int(10), Fixed::from_int(10)),
            Element::Punct,
        );

        game.spawn_instances.push(spawn);

        // Test that binary serialization works
        let binary_data = game.to_binary().unwrap();

        // Try to deserialize - this should work
        match GameState::from_binary(&binary_data) {
            Ok(restored_game) => {
                assert_eq!(restored_game.spawn_instances.len(), 1);
                assert_eq!(restored_game.spawn_instances[0].spawn_id, 1);
                assert_eq!(restored_game.spawn_instances[0].element, Element::Punct);
            }
            Err(_) => {
                // If deserialization fails, at least check that serialization produced reasonable data
                assert!(binary_data.len() > 250); // Should have reasonable size
                panic!("Deserialization failed but serialization succeeded");
            }
        }
    }

    #[test]
    fn test_spawns_serialization() {
        use crate::entity::{Character, Element, SpawnInstance};
        use crate::math::Fixed;

        let seed = 222;
        let tilemap = [[0u8; 16]; 15];

        let character = Character::new(1, 0);
        let mut game = GameState::new(seed, tilemap, vec![character], vec![]).unwrap();

        let spawn1 = SpawnInstance::with_element(
            1,
            1,
            (Fixed::from_int(10), Fixed::from_int(10)),
            Element::Punct,
        );
        let spawn2 = SpawnInstance::with_element(
            2,
            1,
            (Fixed::from_int(20), Fixed::from_int(20)),
            Element::Virus,
        );

        game.spawn_instances.push(spawn1);
        game.spawn_instances.push(spawn2);

        // Test binary round-trip
        let binary_data = game.to_binary().unwrap();
        let restored_game = GameState::from_binary(&binary_data).unwrap();

        assert_eq!(restored_game.spawn_instances.len(), 2);
        assert_eq!(restored_game.spawn_instances[0].spawn_id, 1);
        assert_eq!(restored_game.spawn_instances[0].element, Element::Punct);
        assert_eq!(restored_game.spawn_instances[1].spawn_id, 2);
        assert_eq!(restored_game.spawn_instances[1].element, Element::Virus);
    }

    #[test]
    fn test_multiple_characters_and_spawns() {
        use crate::entity::{Character, Element, SpawnInstance};
        use crate::math::Fixed;

        let seed = 222;
        let tilemap = [[0u8; 16]; 15];

        let char1 = Character::new(1, 0);
        let mut char2 = Character::new(2, 1);
        char2.health = 50;
        char2.energy = 25;

        let spawn1 = SpawnInstance::with_element(
            1,
            1,
            (Fixed::from_int(10), Fixed::from_int(10)),
            Element::Punct,
        );
        let spawn2 = SpawnInstance::with_element(
            2,
            2,
            (Fixed::from_int(20), Fixed::from_int(20)),
            Element::Virus,
        );

        let mut game = GameState::new(seed, tilemap, vec![char1, char2], vec![]).unwrap();
        game.spawn_instances.push(spawn1);
        game.spawn_instances.push(spawn2);

        // Test binary round-trip
        let binary_data = game.to_binary().unwrap();
        let restored_game = GameState::from_binary(&binary_data).unwrap();

        assert_eq!(restored_game.characters.len(), 2);
        assert_eq!(restored_game.characters[0].core.id, 1);
        assert_eq!(restored_game.characters[1].core.id, 2);
        assert_eq!(restored_game.characters[1].health, 50);
        assert_eq!(restored_game.characters[1].energy, 25);

        assert_eq!(restored_game.spawn_instances.len(), 2);
        assert_eq!(restored_game.spawn_instances[0].spawn_id, 1);
        assert_eq!(restored_game.spawn_instances[0].element, Element::Punct);
        assert_eq!(restored_game.spawn_instances[1].spawn_id, 2);
        assert_eq!(restored_game.spawn_instances[1].element, Element::Virus);
    }

    #[test]
    fn test_binary_serialization_size_efficiency() {
        use crate::entity::Character;

        let seed = 333;
        let tilemap = [[0u8; 16]; 15];

        // Create a game with one character
        let character = Character::new(1, 0);
        let game = GameState::new(seed, tilemap, vec![character], vec![]).unwrap();

        let binary_data = game.to_binary().unwrap();

        // Verify expected size components:
        // Header: 5 bytes (seed + frame + status)
        // Tilemap: 240 bytes (16x15)
        // Character count: 1 byte
        // Character data: ~37 bytes (24 EntityCore + 10 Character + 1 behavior count + 2 locked action + 1 status count)
        // Spawn count: 1 byte
        // Lookup table sizes: 4 bytes
        // Total: ~288 bytes
        assert!(binary_data.len() >= 250 && binary_data.len() <= 300);
    }

    #[test]
    fn test_invalid_binary_data_handling() {
        // Test with too short data
        let short_data = vec![1, 2, 3];
        assert!(GameState::from_binary(&short_data).is_err());

        // Test with invalid status
        let mut invalid_status_data = vec![0; 250];
        invalid_status_data[4] = 99; // Invalid status value
        assert!(GameState::from_binary(&invalid_status_data).is_err());

        // Test with truncated tilemap
        let truncated_data = vec![0; 100]; // Too short for tilemap
        assert!(GameState::from_binary(&truncated_data).is_err());
    }

    #[test]
    fn test_deterministic_frame_processing() {
        use crate::behavior::{Action, Condition};
        use crate::entity::Character;
        use crate::math::Fixed;

        let seed = 12345;
        let tilemap = [[0u8; 16]; 15];

        // Create two identical game states
        let mut game1 = GameState::new(seed, tilemap, vec![], vec![]).unwrap();
        let mut game2 = GameState::new(seed, tilemap, vec![], vec![]).unwrap();

        // Add identical characters to both games
        let mut character1 = Character::new(1, 0);
        character1.energy = 100;
        character1.behaviors.push((0, 0));

        let mut character2 = Character::new(1, 0);
        character2.energy = 100;
        character2.behaviors.push((0, 0));

        game1.characters.push(character1);
        game2.characters.push(character2);

        // Add identical conditions and actions
        let condition = Condition {
            id: 0,
            energy_mul: Fixed::from_int(1),
            vars: [0; 8],
            fixed: [Fixed::ZERO; 4],
            args: [0; 8],
            spawns: [0; 4],
            script: vec![22, 0, 0, 1], // AssignRandom vars[0], Exit success
        };

        let action = Action {
            energy_cost: 10,
            interval: 60,
            duration: 30,
            cooldown: 0,
            vars: [0; 8],
            fixed: [Fixed::ZERO; 4],
            args: [0; 8],
            spawns: [0; 4],
            script: vec![0, 1], // Exit success
        };

        game1.condition_lookup.push(condition.clone());
        game1.action_lookup.push(action.clone());
        game2.condition_lookup.push(condition);
        game2.action_lookup.push(action);

        // Process multiple frames and verify identical results
        for frame in 0..100 {
            assert_eq!(game1.frame, frame);
            assert_eq!(game2.frame, frame);
            assert_eq!(game1.characters[0].energy, game2.characters[0].energy);

            let _ = game1.advance_frame();
            let _ = game2.advance_frame();
        }

        // Both games should have identical final states
        assert_eq!(game1.frame, game2.frame);
        assert_eq!(game1.characters[0].energy, game2.characters[0].energy);
    }

    #[test]
    fn test_game_timing_and_frame_limit() {
        let seed = 12345;
        let tilemap = [[0u8; 16]; 15];
        let mut game = GameState::new(seed, tilemap, vec![], vec![]).unwrap();

        // Verify initial state
        assert_eq!(game.frame, 0);
        assert_eq!(game.status, GameStatus::Playing);

        // Advance frames until the game ends
        // The game should end when frame reaches MAX_FRAMES
        while game.status == GameStatus::Playing {
            let _ = game.advance_frame();
        }

        // Game should be ended and frame should be MAX_FRAMES
        assert_eq!(game.status, GameStatus::Ended);
        assert_eq!(game.frame, crate::core::MAX_FRAMES);

        // Further frame advances should not change the frame count
        let _ = game.advance_frame();
        assert_eq!(game.frame, crate::core::MAX_FRAMES);
        assert_eq!(game.status, GameStatus::Ended);
    }

    #[test]
    fn test_frame_processing_pipeline_order() {
        use crate::entity::{Character, SpawnInstance, StatusEffectInstance};

        let seed = 12345;
        let tilemap = [[0u8; 16]; 15];
        let mut character = Character::new(1, 0);
        character.energy = 100;

        // Add a status effect that should be processed first
        character.status_effects.push(StatusEffectInstance {
            effect_id: 0,
            remaining_duration: 10,
            stack_count: 1,
            vars: [0; 4],
        });

        let mut game = GameState::new(seed, tilemap, vec![character], vec![]).unwrap();

        // Add a spawn that should be cleaned up
        let mut spawn =
            SpawnInstance::new(0, 0, (crate::math::Fixed::ZERO, crate::math::Fixed::ZERO));
        spawn.lifespan = 0; // Should be cleaned up
        game.spawn_instances.push(spawn);

        let initial_spawn_count = game.spawn_instances.len();

        // Advance one frame to trigger the processing pipeline
        let _ = game.advance_frame();

        // Verify cleanup happened (spawn with 0 lifespan should be removed)
        assert!(game.spawn_instances.len() < initial_spawn_count);
    }

    #[test]
    fn test_frame_processing_determinism_with_randomness() {
        use crate::behavior::{Action, Condition};
        use crate::entity::Character;
        use crate::math::Fixed;

        let seed = 42;
        let tilemap = [[0u8; 16]; 15];

        // Create two identical games with the same seed
        let mut game1 = GameState::new(seed, tilemap, vec![], vec![]).unwrap();
        let mut game2 = GameState::new(seed, tilemap, vec![], vec![]).unwrap();

        // Add characters that use randomness in their behavior
        let mut character1 = Character::new(1, 0);
        character1.energy = 100;
        character1.behaviors.push((0, 0));

        let mut character2 = Character::new(1, 0);
        character2.energy = 100;
        character2.behaviors.push((0, 0));

        game1.characters.push(character1);
        game2.characters.push(character2);

        // Add condition that uses random assignment
        let condition = Condition {
            id: 0,
            energy_mul: Fixed::from_int(1),
            vars: [0; 8],
            fixed: [Fixed::ZERO; 4],
            args: [0; 8],
            spawns: [0; 4],
            script: vec![
                22, 0, // AssignRandom vars[0]
                52, 1, 0, 10, // LessThan vars[1] = (vars[0] < 10)
                0, 1, // Exit success
            ],
        };

        let action = Action {
            energy_cost: 5,
            interval: 60,
            duration: 30,
            cooldown: 0,
            vars: [0; 8],
            fixed: [Fixed::ZERO; 4],
            args: [0; 8],
            spawns: [0; 4],
            script: vec![0, 1], // Exit success
        };

        game1.condition_lookup.push(condition.clone());
        game1.action_lookup.push(action.clone());
        game2.condition_lookup.push(condition);
        game2.action_lookup.push(action);

        // Process frames and verify deterministic behavior despite randomness
        for _ in 0..50 {
            let energy1_before = game1.characters[0].energy;
            let energy2_before = game2.characters[0].energy;

            let _ = game1.advance_frame();
            let _ = game2.advance_frame();

            // Both games should have identical energy changes
            assert_eq!(game1.characters[0].energy, game2.characters[0].energy);

            // Verify that energy changes are consistent
            let energy1_after = game1.characters[0].energy;
            let energy2_after = game2.characters[0].energy;
            assert_eq!(
                energy1_after - energy1_before,
                energy2_after - energy2_before
            );
        }
    }
}
