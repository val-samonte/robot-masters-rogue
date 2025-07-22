//! Entity system for characters, spawns, and status effects

use crate::math::Fixed;
use alloc::vec;
use alloc::vec::Vec;

/// Unique identifier for entities
pub type EntityId = u8;
pub type CharacterId = u8;
pub type SpawnLookupId = u8;
pub type ActionId = u8;
pub type ConditionId = u8;
pub type ActionInstanceId = u8;

/// Base entity properties shared by all game objects
#[derive(Debug, Clone)]
pub struct EntityCore {
    pub id: EntityId,
    pub group: u8,
    pub pos: (Fixed, Fixed),
    pub vel: (Fixed, Fixed),
    pub size: (u8, u8),
    pub collision: (bool, bool, bool, bool), // top, right, bottom, left
    pub facing: u8,                          // 0 for left, 1 for right
    pub gravity_dir: u8,                     // 0 for upward, 1 for downward
}

/// Programmable fighting characters
#[derive(Debug, Clone)]
pub struct Character {
    pub core: EntityCore,
    pub health: u8,
    pub energy: u8,
    pub armor: [u8; 8],         // Armor values for all 8 elements (baseline 100)
    pub energy_regen: u8,       // Passive energy recovery amount per rate
    pub energy_regen_rate: u8,  // Tick interval for passive energy recovery
    pub energy_charge: u8,      // Active energy recovery amount per rate during Charge action
    pub energy_charge_rate: u8, // Tick interval for active energy recovery during Charge action
    pub behaviors: Vec<(ConditionId, ActionId)>,
    pub locked_action: Option<ActionInstanceId>,
    pub status_effects: Vec<StatusEffectInstance>,
    pub action_last_used: Vec<u16>, // Tracks when each action was last executed (game frame timestamp)
}

/// Projectiles and temporary objects
#[derive(Debug, Clone)]
pub struct SpawnInstance {
    pub core: EntityCore,
    pub spawn_id: SpawnLookupId,
    pub owner_id: CharacterId,
    pub lifespan: u16,
    pub element: Element, // Element type carried by this spawn
    pub vars: [u8; 4],    // Script variables
}

/// Definition template for spawn objects
#[derive(Debug, Clone)]
pub struct SpawnDefinition {
    pub damage_base: u8,
    pub health_cap: u8,
    pub duration: u16,
    pub element: Option<Element>,
    pub vars: [u8; 8],     // Variable storage (u8)
    pub fixed: [Fixed; 4], // Variable storage (FixedPoint)
    pub args: [u8; 8],     // Passed when calling scripts (read-only)
    pub spawns: [u8; 4],   // Spawn IDs
    pub behavior_script: Vec<u8>,
    pub collision_script: Vec<u8>,
    pub despawn_script: Vec<u8>,
}

/// Active status effect on a character
#[derive(Debug, Clone)]
pub struct StatusEffectInstance {
    pub effect_id: u8,
    pub remaining_duration: u16,
    pub stack_count: u8,
    pub vars: [u8; 4], // Script variables
}

/// Status effect definition
#[derive(Debug, Clone)]
pub struct StatusEffect {
    pub duration: u16,
    pub stack_limit: u8,
    pub reset_on_stack: bool,
    pub vars: [u8; 8],        // Variable storage (u8)
    pub fixed: [Fixed; 4],    // Variable storage (FixedPoint)
    pub args: [u8; 8],        // Passed when calling scripts (read-only)
    pub spawns: [u8; 4],      // Spawn IDs
    pub on_script: Vec<u8>,   // Runs when applied
    pub tick_script: Vec<u8>, // Runs every frame
    pub off_script: Vec<u8>,  // Runs when removed
}

/// Element types for damage and interactions
#[repr(u8)]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Element {
    Punct = 0, // Puncture/piercing - goes through multiple enemies and walls
    Blast = 1, // Explosive AOE damage
    Force = 2, // Blunt weapons - impact damage, bonus based on entity weight if melee
    Sever = 3, // Critical chance (x1.5 to x2 damage)
    Heat = 4,  // Applies overtime burning effect
    Cryo = 5,  // Applies slow movement/cooldown, frostbite (max HP % damage)
    Jolt = 6,  // Energy altering - slow recharging, energy damage, energy leak
    Virus = 7, // Alters target behavior - inject erratic bugs, disable behaviors
}

impl Element {
    /// Convert from u8 value
    pub fn from_u8(value: u8) -> Option<Element> {
        match value {
            0 => Some(Element::Punct),
            1 => Some(Element::Blast),
            2 => Some(Element::Force),
            3 => Some(Element::Sever),
            4 => Some(Element::Heat),
            5 => Some(Element::Cryo),
            6 => Some(Element::Jolt),
            7 => Some(Element::Virus),
            _ => None,
        }
    }
}

/// Character armor values (0-255, baseline 100) - simplified elemental immunity
/// Index corresponds to Element enum values: [Punct, Blast, Force, Sever, Heat, Cryo, Jolt, Virus]
/// Lower values = more vulnerable, higher values = more resistant
pub type Armor = [u8; 8];

/// Helper functions for armor array
impl Character {
    /// Get armor value for a specific element
    pub fn get_armor(&self, element: Element) -> u8 {
        self.armor[element as usize]
    }

    /// Set armor value for a specific element
    pub fn set_armor(&mut self, element: Element, value: u8) {
        self.armor[element as usize] = value;
    }
}

/// Condition for character behavior
#[derive(Debug, Clone)]
pub struct Condition {
    pub energy_mul: Fixed, // Energy requirement multiplier
    pub vars: [u8; 8],     // Variable storage (u8)
    pub fixed: [Fixed; 4], // Variable storage (FixedPoint)
    pub args: [u8; 8],     // Passed when calling scripts (read-only)
    pub spawns: [u8; 4],   // Spawn IDs
    pub script: Vec<u8>,   // Bytecode
}

/// Action for character behavior
#[derive(Debug, Clone)]
pub struct Action {
    pub energy_cost: u8,
    pub interval: u16,
    pub duration: u16,     // Frames this action locks the character
    pub cooldown: u16,     // Cooldown duration in frames (read-only, set only during new_game)
    pub vars: [u8; 8],     // Variable storage (u8)
    pub fixed: [Fixed; 4], // Variable storage (FixedPoint)
    pub args: [u8; 8],     // Passed when calling scripts (read-only)
    pub spawns: [u8; 4],   // Spawn IDs
    pub script: Vec<u8>,
}

impl EntityCore {
    pub fn new(id: EntityId, group: u8) -> Self {
        Self {
            id,
            group,
            pos: (Fixed::ZERO, Fixed::ZERO),
            vel: (Fixed::ZERO, Fixed::ZERO),
            size: (16, 16), // Default 16x16 pixel size
            collision: (true, true, true, true),
            facing: 1,      // Default to right (1)
            gravity_dir: 1, // Default to downward (1)
        }
    }

    /// Get facing direction as Fixed value (-1.0 for left, 1.0 for right)
    pub fn get_facing(&self) -> Fixed {
        if self.facing == 0 {
            Fixed::from_int(-1) // Left
        } else {
            Fixed::from_int(1) // Right
        }
    }

    /// Set facing direction from Fixed value (-1.0 → left, 1.0 → right)
    pub fn set_facing(&mut self, value: Fixed) {
        if value < Fixed::ZERO {
            self.facing = 0; // Left
        } else {
            self.facing = 1; // Right
        }
    }

    /// Get gravity direction as Fixed value (-1.0 for upward, 1.0 for downward)
    pub fn get_gravity_dir(&self) -> Fixed {
        if self.gravity_dir == 0 {
            Fixed::from_int(-1) // Upward
        } else {
            Fixed::from_int(1) // Downward
        }
    }

    /// Set gravity direction from Fixed value (-1.0 → upward, 1.0 → downward)
    pub fn set_gravity_dir(&mut self, value: Fixed) {
        if value < Fixed::ZERO {
            self.gravity_dir = 0; // Upward
        } else {
            self.gravity_dir = 1; // Downward
        }
    }
}

impl Character {
    pub fn new(id: CharacterId, group: u8) -> Self {
        Self {
            core: EntityCore::new(id, group),
            health: 100,
            energy: 100,
            armor: [100; 8], // Default armor values (baseline 100)
            energy_regen: 0, // Values will be set during new_game/game initialization
            energy_regen_rate: 0,
            energy_charge: 0,
            energy_charge_rate: 0,
            behaviors: Vec::new(),
            locked_action: None,
            status_effects: Vec::new(),
            action_last_used: Vec::new(), // Will be sized during game initialization
        }
    }

    /// Initialize action_last_used vector with appropriate size
    pub fn init_action_cooldowns(&mut self, action_count: usize) {
        self.action_last_used = vec![0; action_count];
    }
}

impl SpawnInstance {
    pub fn new(spawn_id: SpawnLookupId, owner_id: CharacterId, pos: (Fixed, Fixed)) -> Self {
        let mut core = EntityCore::new(0, 0); // ID will be assigned by game state
        core.pos = pos;

        Self {
            core,
            spawn_id,
            owner_id,
            lifespan: 0,             // Will be set from spawn definition
            element: Element::Punct, // Default element, will be set from spawn definition
            vars: [0; 4],
        }
    }

    pub fn with_element(
        spawn_id: SpawnLookupId,
        owner_id: CharacterId,
        pos: (Fixed, Fixed),
        element: Element,
    ) -> Self {
        let mut core = EntityCore::new(0, 0); // ID will be assigned by game state
        core.pos = pos;

        Self {
            core,
            spawn_id,
            owner_id,
            lifespan: 0, // Will be set from spawn definition
            element,
            vars: [0; 4],
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use alloc::vec;

    #[test]
    fn test_entity_core_creation() {
        let core = EntityCore::new(5, 2);

        assert_eq!(core.id, 5);
        assert_eq!(core.group, 2);
        assert_eq!(core.pos, (Fixed::ZERO, Fixed::ZERO));
        assert_eq!(core.vel, (Fixed::ZERO, Fixed::ZERO));
        assert_eq!(core.size, (16, 16)); // Default 16x16 pixel size
        assert_eq!(core.collision, (true, true, true, true));
        assert_eq!(core.facing, 1); // Default to right
        assert_eq!(core.gravity_dir, 1); // Default to downward
    }

    #[test]
    fn test_entity_core_property_modification() {
        let mut core = EntityCore::new(1, 0);

        // Test position modification
        core.pos = (Fixed::from_int(10), Fixed::from_int(20));
        assert_eq!(core.pos, (Fixed::from_int(10), Fixed::from_int(20)));

        // Test velocity modification
        core.vel = (Fixed::from_int(-5), Fixed::from_int(3));
        assert_eq!(core.vel, (Fixed::from_int(-5), Fixed::from_int(3)));

        // Test size modification
        core.size = (32, 24);
        assert_eq!(core.size, (32, 24));

        // Test collision modification
        core.collision = (false, true, false, true);
        assert_eq!(core.collision, (false, true, false, true));

        // Test facing modification
        core.facing = 0; // Left
        assert_eq!(core.facing, 0);

        // Test gravity direction modification
        core.gravity_dir = 0; // Upward
        assert_eq!(core.gravity_dir, 0);
    }

    #[test]
    fn test_entity_core_facing_direction() {
        let mut core = EntityCore::new(1, 0);

        // Test default facing (right)
        assert_eq!(core.facing, 1);
        assert_eq!(core.get_facing(), Fixed::from_int(1));

        // Test setting facing to left using Fixed value
        core.set_facing(Fixed::from_int(-1));
        assert_eq!(core.facing, 0);
        assert_eq!(core.get_facing(), Fixed::from_int(-1));

        // Test setting facing to right using Fixed value
        core.set_facing(Fixed::from_int(1));
        assert_eq!(core.facing, 1);
        assert_eq!(core.get_facing(), Fixed::from_int(1));

        // Test setting facing with negative fractional value (should be left)
        core.set_facing(Fixed::from_raw(-5)); // Negative value
        assert_eq!(core.facing, 0);
        assert_eq!(core.get_facing(), Fixed::from_int(-1));

        // Test setting facing with positive fractional value (should be right)
        core.set_facing(Fixed::from_raw(5)); // Positive value
        assert_eq!(core.facing, 1);
        assert_eq!(core.get_facing(), Fixed::from_int(1));

        // Test setting facing with zero (should be right)
        core.set_facing(Fixed::ZERO);
        assert_eq!(core.facing, 1);
        assert_eq!(core.get_facing(), Fixed::from_int(1));
    }

    #[test]
    fn test_entity_core_gravity_direction() {
        let mut core = EntityCore::new(1, 0);

        // Test default gravity direction (downward)
        assert_eq!(core.gravity_dir, 1);
        assert_eq!(core.get_gravity_dir(), Fixed::from_int(1));

        // Test setting gravity direction to upward using Fixed value
        core.set_gravity_dir(Fixed::from_int(-1));
        assert_eq!(core.gravity_dir, 0);
        assert_eq!(core.get_gravity_dir(), Fixed::from_int(-1));

        // Test setting gravity direction to downward using Fixed value
        core.set_gravity_dir(Fixed::from_int(1));
        assert_eq!(core.gravity_dir, 1);
        assert_eq!(core.get_gravity_dir(), Fixed::from_int(1));

        // Test setting gravity direction with negative fractional value (should be upward)
        core.set_gravity_dir(Fixed::from_raw(-5)); // Negative value
        assert_eq!(core.gravity_dir, 0);
        assert_eq!(core.get_gravity_dir(), Fixed::from_int(-1));

        // Test setting gravity direction with positive fractional value (should be downward)
        core.set_gravity_dir(Fixed::from_raw(5)); // Positive value
        assert_eq!(core.gravity_dir, 1);
        assert_eq!(core.get_gravity_dir(), Fixed::from_int(1));

        // Test setting gravity direction with zero (should be downward)
        core.set_gravity_dir(Fixed::ZERO);
        assert_eq!(core.gravity_dir, 1);
        assert_eq!(core.get_gravity_dir(), Fixed::from_int(1));
    }

    #[test]
    fn test_character_creation() {
        let character = Character::new(10, 1);

        assert_eq!(character.core.id, 10);
        assert_eq!(character.core.group, 1);
        assert_eq!(character.health, 100);
        assert_eq!(character.energy, 100);
        assert!(character.behaviors.is_empty());
        assert!(character.locked_action.is_none());
        assert!(character.status_effects.is_empty());
    }

    #[test]
    fn test_character_property_management() {
        let mut character = Character::new(1, 0);

        // Test health modification
        character.health = 75;
        assert_eq!(character.health, 75);

        // Test energy modification
        character.energy = 50;
        assert_eq!(character.energy, 50);

        // Test behavior addition
        character.behaviors.push((1, 2)); // condition_id: 1, action_id: 2
        character.behaviors.push((3, 4)); // condition_id: 3, action_id: 4
        assert_eq!(character.behaviors.len(), 2);
        assert_eq!(character.behaviors[0], (1, 2));
        assert_eq!(character.behaviors[1], (3, 4));

        // Test locked action
        character.locked_action = Some(5);
        assert_eq!(character.locked_action, Some(5));

        // Test status effect addition
        let status_effect = StatusEffectInstance {
            effect_id: 1,
            remaining_duration: 300,
            stack_count: 1,
            vars: [10, 20, 30, 40],
        };
        character.status_effects.push(status_effect.clone());
        assert_eq!(character.status_effects.len(), 1);
        assert_eq!(character.status_effects[0].effect_id, 1);
        assert_eq!(character.status_effects[0].remaining_duration, 300);
        assert_eq!(character.status_effects[0].stack_count, 1);
        assert_eq!(character.status_effects[0].vars, [10, 20, 30, 40]);
    }

    #[test]
    fn test_character_position_and_movement() {
        let mut character = Character::new(1, 0);

        // Test initial position
        assert_eq!(character.core.pos, (Fixed::ZERO, Fixed::ZERO));

        // Test position modification
        character.core.pos = (Fixed::from_int(100), Fixed::from_int(50));
        assert_eq!(
            character.core.pos,
            (Fixed::from_int(100), Fixed::from_int(50))
        );

        // Test velocity modification
        character.core.vel = (Fixed::from_int(2), Fixed::from_int(-1));
        assert_eq!(
            character.core.vel,
            (Fixed::from_int(2), Fixed::from_int(-1))
        );

        // Test size modification for different character types
        character.core.size = (24, 32); // Taller character
        assert_eq!(character.core.size, (24, 32));
    }

    #[test]
    fn test_spawn_instance_creation() {
        let pos = (Fixed::from_int(50), Fixed::from_int(75));
        let spawn = SpawnInstance::new(3, 7, pos);

        assert_eq!(spawn.core.id, 0); // ID will be assigned by game state
        assert_eq!(spawn.core.group, 0);
        assert_eq!(spawn.core.pos, pos);
        assert_eq!(spawn.spawn_id, 3);
        assert_eq!(spawn.owner_id, 7);
        assert_eq!(spawn.lifespan, 0); // Will be set from spawn definition
        assert_eq!(spawn.vars, [0; 4]);
    }

    #[test]
    fn test_spawn_instance_property_management() {
        let mut spawn = SpawnInstance::new(1, 2, (Fixed::ZERO, Fixed::ZERO));

        // Test ID assignment (simulating game state assignment)
        spawn.core.id = 15;
        assert_eq!(spawn.core.id, 15);

        // Test group assignment
        spawn.core.group = 3;
        assert_eq!(spawn.core.group, 3);

        // Test lifespan modification
        spawn.lifespan = 120; // 2 seconds at 60 FPS
        assert_eq!(spawn.lifespan, 120);

        // Test velocity for projectile movement
        spawn.core.vel = (Fixed::from_int(5), Fixed::from_int(-2));
        assert_eq!(spawn.core.vel, (Fixed::from_int(5), Fixed::from_int(-2)));

        // Test size for different projectile types
        spawn.core.size = (8, 8); // Small projectile
        assert_eq!(spawn.core.size, (8, 8));

        // Test script variables
        spawn.vars = [100, 200, 50, 25];
        assert_eq!(spawn.vars, [100, 200, 50, 25]);

        // Test collision properties
        spawn.core.collision = (true, true, false, false); // Only collides on top and right
        assert_eq!(spawn.core.collision, (true, true, false, false));
    }

    #[test]
    fn test_status_effect_instance_creation() {
        let status_effect = StatusEffectInstance {
            effect_id: 5,
            remaining_duration: 600, // 10 seconds at 60 FPS
            stack_count: 3,
            vars: [255, 128, 64, 32],
        };

        assert_eq!(status_effect.effect_id, 5);
        assert_eq!(status_effect.remaining_duration, 600);
        assert_eq!(status_effect.stack_count, 3);
        assert_eq!(status_effect.vars, [255, 128, 64, 32]);
    }

    #[test]
    fn test_status_effect_instance_modification() {
        let mut status_effect = StatusEffectInstance {
            effect_id: 1,
            remaining_duration: 300,
            stack_count: 1,
            vars: [0; 4],
        };

        // Test duration countdown
        status_effect.remaining_duration -= 1;
        assert_eq!(status_effect.remaining_duration, 299);

        // Test stack count increase
        status_effect.stack_count += 1;
        assert_eq!(status_effect.stack_count, 2);

        // Test variable modification
        status_effect.vars[0] = 100;
        status_effect.vars[3] = 200;
        assert_eq!(status_effect.vars, [100, 0, 0, 200]);
    }

    #[test]
    fn test_element_enum() {
        // Test element creation and comparison
        let punct = Element::Punct;
        let blast = Element::Blast;
        let heat = Element::Heat;
        let virus = Element::Virus;

        assert_eq!(punct, Element::Punct);
        assert_ne!(punct, blast);
        assert_ne!(blast, heat);
        assert_ne!(heat, virus);

        // Test element conversion
        assert_eq!(Element::from_u8(0), Some(Element::Punct));
        assert_eq!(Element::from_u8(4), Some(Element::Heat));
        assert_eq!(Element::from_u8(8), None);

        // Test element in option
        let element_option: Option<Element> = Some(Element::Heat);
        assert_eq!(element_option, Some(Element::Heat));

        let no_element: Option<Element> = None;
        assert_eq!(no_element, None);
    }

    #[test]
    fn test_spawn_definition_creation() {
        let spawn_def = SpawnDefinition {
            damage_base: 25,
            health_cap: 1, // One-hit projectile
            duration: 180, // 3 seconds at 60 FPS
            element: Some(Element::Heat),
            vars: [0; 8],
            fixed: [Fixed::ZERO; 4],
            args: [10, 20, 30, 40, 50, 60, 70, 80],
            spawns: [1, 2, 0, 0], // Can spawn explosion (ID 1) and debris (ID 2)
            behavior_script: vec![1, 2, 3, 4], // Sample bytecode
            collision_script: vec![5, 6, 7], // Sample collision bytecode
            despawn_script: vec![8, 9], // Sample despawn bytecode
        };

        assert_eq!(spawn_def.damage_base, 25);
        assert_eq!(spawn_def.health_cap, 1);
        assert_eq!(spawn_def.duration, 180);
        assert_eq!(spawn_def.element, Some(Element::Heat));
        assert_eq!(spawn_def.args, [10, 20, 30, 40, 50, 60, 70, 80]);
        assert_eq!(spawn_def.spawns, [1, 2, 0, 0]);
        assert_eq!(spawn_def.behavior_script, vec![1, 2, 3, 4]);
        assert_eq!(spawn_def.collision_script, vec![5, 6, 7]);
        assert_eq!(spawn_def.despawn_script, vec![8, 9]);
    }

    #[test]
    fn test_status_effect_definition() {
        let status_def = StatusEffect {
            duration: 300,
            stack_limit: 5,
            reset_on_stack: true,
            vars: [0; 8],
            fixed: [Fixed::ZERO; 4],
            args: [0; 8],
            spawns: [0; 4],
            on_script: vec![10, 11, 12],
            tick_script: vec![13, 14, 15, 16],
            off_script: vec![17, 18],
        };

        assert_eq!(status_def.duration, 300);
        assert_eq!(status_def.stack_limit, 5);
        assert_eq!(status_def.reset_on_stack, true);
        assert_eq!(status_def.on_script, vec![10, 11, 12]);
        assert_eq!(status_def.tick_script, vec![13, 14, 15, 16]);
        assert_eq!(status_def.off_script, vec![17, 18]);
    }

    #[test]
    fn test_condition_and_action_creation() {
        let condition = Condition {
            energy_mul: Fixed::from_raw(16), // 0.5 multiplier
            vars: [0; 8],
            fixed: [Fixed::ZERO; 4],
            args: [10, 20, 30, 40, 50, 60, 70, 80],
            spawns: [0; 4],
            script: vec![1, 2, 3, 4, 5],
        };

        assert_eq!(condition.energy_mul, Fixed::from_raw(16));
        assert_eq!(condition.args, [10, 20, 30, 40, 50, 60, 70, 80]);
        assert_eq!(condition.script, vec![1, 2, 3, 4, 5]);

        let action = Action {
            energy_cost: 15,
            interval: 0,
            duration: 30, // 0.5 seconds at 60 FPS
            cooldown: 0,
            vars: [0; 8],
            fixed: [Fixed::ZERO; 4],
            args: [5, 10, 15, 20, 25, 30, 35, 40],
            spawns: [0; 4],
            script: vec![6, 7, 8, 9],
        };

        assert_eq!(action.energy_cost, 15);
        assert_eq!(action.duration, 30);
        assert_eq!(action.args, [5, 10, 15, 20, 25, 30, 35, 40]);
        assert_eq!(action.script, vec![6, 7, 8, 9]);
    }

    #[test]
    fn test_entity_id_types() {
        // Test that all ID types are u8 and can be used interchangeably where appropriate
        let entity_id: EntityId = 1;
        let character_id: CharacterId = 2;
        let spawn_lookup_id: SpawnLookupId = 3;
        let action_id: ActionId = 4;
        let condition_id: ConditionId = 5;
        let action_instance_id: ActionInstanceId = 6;

        // Test that they can be assigned and compared
        assert_eq!(entity_id, 1);
        assert_eq!(character_id, 2);
        assert_eq!(spawn_lookup_id, 3);
        assert_eq!(action_id, 4);
        assert_eq!(condition_id, 5);
        assert_eq!(action_instance_id, 6);

        // Test that they can be used in entity creation
        let core = EntityCore::new(entity_id, 0);
        assert_eq!(core.id, entity_id);

        let character = Character::new(character_id, 1);
        assert_eq!(character.core.id, character_id);
    }

    #[test]
    fn test_complex_character_scenario() {
        let mut character = Character::new(1, 0);

        // Set up a character with multiple behaviors and status effects
        character.health = 80;
        character.energy = 60;
        character.core.pos = (Fixed::from_int(128), Fixed::from_int(120)); // Center of 256x240 screen
        character.core.vel = (Fixed::from_int(1), Fixed::ZERO); // Moving right
        character.core.size = (20, 28); // Custom character size

        // Add multiple behaviors
        character.behaviors.push((1, 10)); // Condition 1 -> Action 10
        character.behaviors.push((2, 11)); // Condition 2 -> Action 11
        character.behaviors.push((3, 12)); // Condition 3 -> Action 12

        // Add status effects
        let invulnerability = StatusEffectInstance {
            effect_id: 1,
            remaining_duration: 120, // 2 seconds
            stack_count: 1,
            vars: [0; 4],
        };

        let energy_regen = StatusEffectInstance {
            effect_id: 2,
            remaining_duration: 600, // 10 seconds
            stack_count: 3,          // Stacked 3 times
            vars: [5, 0, 0, 0],      // 5 energy per tick
        };

        character.status_effects.push(invulnerability);
        character.status_effects.push(energy_regen);

        // Lock character in an action
        character.locked_action = Some(15);

        // Verify the complex state
        assert_eq!(character.health, 80);
        assert_eq!(character.energy, 60);
        assert_eq!(
            character.core.pos,
            (Fixed::from_int(128), Fixed::from_int(120))
        );
        assert_eq!(character.core.vel, (Fixed::from_int(1), Fixed::ZERO));
        assert_eq!(character.behaviors.len(), 3);
        assert_eq!(character.status_effects.len(), 2);
        assert_eq!(character.locked_action, Some(15));

        // Verify specific status effects
        assert_eq!(character.status_effects[0].effect_id, 1);
        assert_eq!(character.status_effects[0].remaining_duration, 120);
        assert_eq!(character.status_effects[1].effect_id, 2);
        assert_eq!(character.status_effects[1].stack_count, 3);
        assert_eq!(character.status_effects[1].vars[0], 5);
    }

    #[test]
    fn test_complex_spawn_scenario() {
        let mut spawn = SpawnInstance::new(5, 3, (Fixed::from_int(64), Fixed::from_int(32)));

        // Configure spawn as a homing projectile
        spawn.core.id = 20;
        spawn.core.group = 2; // Projectile group
        spawn.core.vel = (Fixed::from_int(3), Fixed::from_int(-1)); // Moving right and up
        spawn.core.size = (6, 6); // Small projectile
        spawn.core.collision = (true, true, true, true); // Collides on all sides
        spawn.lifespan = 300; // 5 seconds
        spawn.vars = [64, 32, 0, 1]; // Target X, Target Y, unused, homing flag

        // Verify the complex spawn state
        assert_eq!(spawn.core.id, 20);
        assert_eq!(spawn.core.group, 2);
        assert_eq!(spawn.spawn_id, 5);
        assert_eq!(spawn.owner_id, 3);
        assert_eq!(spawn.core.pos, (Fixed::from_int(64), Fixed::from_int(32)));
        assert_eq!(spawn.core.vel, (Fixed::from_int(3), Fixed::from_int(-1)));
        assert_eq!(spawn.core.size, (6, 6));
        assert_eq!(spawn.core.collision, (true, true, true, true));
        assert_eq!(spawn.lifespan, 300);
        assert_eq!(spawn.vars, [64, 32, 0, 1]);
    }

    #[test]
    fn test_entity_core_collision_flags() {
        let mut core = EntityCore::new(1, 0);

        // Test different collision configurations

        // Platform character (no top collision for jumping through platforms)
        core.collision = (false, true, true, true);
        assert_eq!(core.collision.0, false); // top
        assert_eq!(core.collision.1, true); // right
        assert_eq!(core.collision.2, true); // bottom
        assert_eq!(core.collision.3, true); // left

        // Projectile that only damages on contact (all sides)
        core.collision = (true, true, true, true);
        assert!(core.collision.0 && core.collision.1 && core.collision.2 && core.collision.3);

        // One-way platform (only bottom collision)
        core.collision = (false, false, true, false);
        assert!(!core.collision.0 && !core.collision.1 && core.collision.2 && !core.collision.3);

        // Intangible effect (no collision)
        core.collision = (false, false, false, false);
        assert!(!core.collision.0 && !core.collision.1 && !core.collision.2 && !core.collision.3);
    }

    #[test]
    fn test_character_armor_default() {
        let character = Character::new(1, 0);

        // All default armor values should be 100 (baseline)
        assert_eq!(character.armor[0], 100); // Punct
        assert_eq!(character.armor[1], 100); // Blast
        assert_eq!(character.armor[2], 100); // Force
        assert_eq!(character.armor[3], 100); // Sever
        assert_eq!(character.armor[4], 100); // Heat
        assert_eq!(character.armor[5], 100); // Cryo
        assert_eq!(character.armor[6], 100); // Jolt
        assert_eq!(character.armor[7], 100); // Virus
    }

    #[test]
    fn test_character_armor_get_set() {
        let mut character = Character::new(1, 0);

        // Test getting armor values
        assert_eq!(character.get_armor(Element::Punct), 100);
        assert_eq!(character.get_armor(Element::Heat), 100);

        // Test setting armor values
        character.set_armor(Element::Punct, 50); // More vulnerable to puncture
        character.set_armor(Element::Heat, 200); // More resistant to heat

        assert_eq!(character.get_armor(Element::Punct), 50);
        assert_eq!(character.get_armor(Element::Heat), 200);
        assert_eq!(character.armor[0], 50);
        assert_eq!(character.armor[4], 200);
    }

    #[test]
    fn test_character_armor_modification() {
        let mut character = Character::new(1, 0);

        // Test modifying armor values directly
        character.set_armor(Element::Virus, 25); // Very vulnerable to virus
        character.set_armor(Element::Force, 150); // Resistant to force

        assert_eq!(character.get_armor(Element::Virus), 25);
        assert_eq!(character.get_armor(Element::Force), 150);
    }

    #[test]
    fn test_spawn_with_element() {
        let pos = (Fixed::from_int(10), Fixed::from_int(20));
        let spawn = SpawnInstance::with_element(5, 3, pos, Element::Cryo);

        assert_eq!(spawn.element, Element::Cryo);
        assert_eq!(spawn.spawn_id, 5);
        assert_eq!(spawn.owner_id, 3);
        assert_eq!(spawn.core.pos, pos);
    }

    #[test]
    fn test_element_values() {
        // Test element numeric values
        assert_eq!(Element::Punct as u8, 0);
        assert_eq!(Element::Blast as u8, 1);
        assert_eq!(Element::Force as u8, 2);
        assert_eq!(Element::Sever as u8, 3);
        assert_eq!(Element::Heat as u8, 4);
        assert_eq!(Element::Cryo as u8, 5);
        assert_eq!(Element::Jolt as u8, 6);
        assert_eq!(Element::Virus as u8, 7);
    }

    #[test]
    fn test_character_energy_regeneration_properties() {
        let character = Character::new(1, 0);

        // Test default energy regeneration values (should be 0)
        assert_eq!(character.energy_regen, 0);
        assert_eq!(character.energy_regen_rate, 0);
        assert_eq!(character.energy_charge, 0);
        assert_eq!(character.energy_charge_rate, 0);
    }

    #[test]
    fn test_character_energy_regeneration_modification() {
        let mut character = Character::new(1, 0);

        // Test setting energy regeneration properties
        character.energy_regen = 5; // Recover 5 energy per rate
        character.energy_regen_rate = 60; // Every 60 ticks (1 second at 60 FPS)
        character.energy_charge = 10; // Recover 10 energy per rate during charge
        character.energy_charge_rate = 30; // Every 30 ticks (0.5 seconds at 60 FPS)

        assert_eq!(character.energy_regen, 5);
        assert_eq!(character.energy_regen_rate, 60);
        assert_eq!(character.energy_charge, 10);
        assert_eq!(character.energy_charge_rate, 30);
    }

    #[test]
    fn test_character_armor_array_access() {
        let mut character = Character::new(1, 0);

        // Test direct armor array access
        character.armor[Element::Punct as usize] = 75;
        character.armor[Element::Heat as usize] = 125;
        character.armor[Element::Virus as usize] = 50;

        assert_eq!(character.armor[0], 75); // Punct
        assert_eq!(character.armor[4], 125); // Heat
        assert_eq!(character.armor[7], 50); // Virus

        // Test that get_armor and set_armor still work
        assert_eq!(character.get_armor(Element::Punct), 75);
        assert_eq!(character.get_armor(Element::Heat), 125);
        assert_eq!(character.get_armor(Element::Virus), 50);
    }

    #[test]
    fn test_action_cooldown_initialization() {
        let mut character = Character::new(1, 0);

        // Initially, action_last_used should be empty
        assert!(character.action_last_used.is_empty());

        // Initialize cooldowns for 5 actions
        character.init_action_cooldowns(5);

        // Should now have 5 entries, all initialized to 0
        assert_eq!(character.action_last_used.len(), 5);
        assert_eq!(character.action_last_used, vec![0, 0, 0, 0, 0]);

        // Test updating a cooldown timestamp
        character.action_last_used[2] = 120; // Set action 2's last used timestamp to frame 120
        assert_eq!(character.action_last_used[2], 120);
    }

    #[test]
    fn test_facing_direction_serialization_compatibility() {
        use crate::state::GameState;

        // Create a character with custom facing direction
        let mut character = Character::new(1, 0);
        character.core.facing = 0; // Set to left

        // Create game state with the character
        let mut game = GameState::new(12345, [[0u8; 16]; 15], vec![character], vec![]).unwrap();

        // Manually add a spawn instance with custom facing direction
        let mut spawn = SpawnInstance::new(1, 1, (Fixed::from_int(50), Fixed::from_int(50)));
        spawn.core.facing = 0; // Set to left
        spawn.core.id = 10; // Set a unique ID
        game.spawn_instances.push(spawn);

        // Test binary serialization round-trip
        let binary_data = game.to_binary().unwrap();
        let restored_game = GameState::from_binary(&binary_data).unwrap();

        // Verify facing directions were preserved
        assert_eq!(restored_game.characters[0].core.facing, 0);
        assert_eq!(restored_game.spawn_instances[0].core.facing, 0);

        // Test that get_facing() returns correct Fixed values
        assert_eq!(
            restored_game.characters[0].core.get_facing(),
            Fixed::from_int(-1)
        );
        assert_eq!(
            restored_game.spawn_instances[0].core.get_facing(),
            Fixed::from_int(-1)
        );

        // Test JSON serialization (should not fail)
        let _json_data = game.to_json().unwrap();
    }
}
