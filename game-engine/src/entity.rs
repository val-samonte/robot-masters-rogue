//! Entity system for characters, spawns, and status effects

use crate::math::Fixed;
use alloc::vec;
use alloc::vec::Vec;

/// Unique identifier for entities
pub type EntityId = u8;
pub type CharacterId = u8;
pub type SpawnLookupId = u8;

/// Definition ID types for referencing shared definitions
pub type ActionId = usize;
pub type ConditionId = usize;
pub type StatusEffectId = usize;

/// Instance ID types for runtime state
pub type ActionInstanceId = u8;
pub type StatusEffectInstanceId = u8;

/// Action definition - static configuration for actions
#[derive(Debug, Clone)]
pub struct ActionDefinition {
    pub energy_cost: u8,
    pub cooldown: u16,
    pub args: [u8; 8],
    pub spawns: [u8; 4],
    pub script: Vec<u8>,
}

/// Action instance - runtime state for active actions
#[derive(Debug, Clone)]
pub struct ActionInstance {
    pub definition_id: ActionId,
    pub cooldown: u16,
    pub last_used_frame: u16,
    pub runtime_vars: [u8; 4],
    pub runtime_fixed: [Fixed; 4],
}

/// Programmable fighting characters
#[derive(Debug, Clone)]
pub struct Character {
    pub core: EntityCore,
    pub health: u16,
    pub health_cap: u16,
    pub energy: u8,
    pub energy_cap: u8,
    pub power: u8,
    pub weight: u8,
    pub jump_force: Fixed,
    pub move_speed: Fixed,
    pub armor: [u8; 9],         // Armor values for all 9 elements (baseline 100)
    pub energy_regen: u8,       // Passive energy recovery amount per rate
    pub energy_regen_rate: u8,  // Tick interval for passive energy recovery
    pub energy_charge: u8,      // Active energy recovery amount per rate during Charge action
    pub energy_charge_rate: u8, // Tick interval for active energy recovery during Charge action
    pub behaviors: Vec<(ConditionId, ActionId)>, // todo: add slot type Vec<(SlotType, ConditionId, ActionId)>. slot types are needed for the virus status effect to know which action should be disabled.
    pub locked_action: Option<ActionInstanceId>,
    pub status_effects: Vec<StatusEffectInstanceId>,
    pub action_last_used: Vec<u16>, // Tracks when each action was last executed (game frame timestamp)
}

/// Condition definition - static configuration for conditions
#[derive(Debug, Clone)]
pub struct ConditionDefinition {
    pub energy_mul: Fixed,
    pub args: [u8; 8],
    pub script: Vec<u8>,
}

/// Condition instance - runtime state for condition evaluations
#[derive(Debug, Clone)]
pub struct ConditionInstance {
    pub definition_id: ConditionId,
    pub runtime_vars: [u8; 4],
    pub runtime_fixed: [Fixed; 4],
}

/// Base entity properties shared by all game objects
#[derive(Debug, Clone)]
pub struct EntityCore {
    pub id: EntityId,
    pub group: u8,
    pub pos: (Fixed, Fixed),
    pub vel: (Fixed, Fixed),
    pub size: (u8, u8),
    pub collision: (bool, bool, bool, bool), // top, right, bottom, left
    pub dir: (u8, u8), // (horizontal: 0=left/1=right, vertical: 0=upward/1=downward)
    pub enmity: u8,    // Target ordering priority
    pub target_id: Option<EntityId>, // Target entity ID (can be Character or Spawn)
    pub target_type: u8, // Target entity type (1=Character, 2=Spawn)
}

/// Definition template for spawn objects
#[derive(Debug, Clone)]
pub struct SpawnDefinition {
    pub damage_base: u16,
    pub damage_range: u16,
    pub crit_chance: u8,
    pub crit_multiplier: u8,
    pub health_cap: u8,
    pub duration: u16,
    pub element: Option<Element>,
    pub chance: u8,
    pub args: [u8; 8],   // Passed when calling scripts (read-only)
    pub spawns: [u8; 4], // Spawn IDs
    pub behavior_script: Vec<u8>,
    pub collision_script: Vec<u8>,
    pub despawn_script: Vec<u8>,
}

/// Projectiles and temporary objects
#[derive(Debug, Clone)]
pub struct SpawnInstance {
    pub core: EntityCore,
    pub spawn_id: SpawnLookupId,
    pub owner_id: EntityId,
    pub owner_type: u8,
    pub health: u16,
    pub health_cap: u16,
    pub rotation: Fixed,
    pub life_span: u16,
    pub element: Element,          // Element type carried by this spawn
    pub runtime_vars: [u8; 4],     // Script variables
    pub runtime_fixed: [Fixed; 4], // Fixed-point variables
}

/// Status effect definition - static configuration for status effects
#[derive(Debug, Clone)]
pub struct StatusEffectDefinition {
    pub duration: u16,
    pub stack_limit: u8,
    pub reset_on_stack: bool,
    pub chance: u8,
    pub args: [u8; 8],        // Passed when calling scripts (read-only)
    pub spawns: [u8; 4],      // Spawn IDs
    pub on_script: Vec<u8>,   // Runs when applied
    pub tick_script: Vec<u8>, // Runs every frame
    pub off_script: Vec<u8>,  // Runs when removed
}

/// Active status effect on a character
#[derive(Debug, Clone)]
pub struct StatusEffectInstance {
    pub definition_id: StatusEffectId,
    pub life_span: u16,
    pub stack_count: u8,
    pub runtime_vars: [u8; 4],     // Script variables
    pub runtime_fixed: [Fixed; 4], // Fixed-point variables
}

impl ActionDefinition {
    /// Create a new action definition with basic validation
    pub fn new(energy_cost: u8, cooldown: u16, script: Vec<u8>) -> Self {
        Self {
            energy_cost,
            cooldown,
            args: [0; 8],
            spawns: [0; 4],
            script,
        }
    }

    /// Validate the action definition
    pub fn validate(&self) -> Result<(), &'static str> {
        if self.script.is_empty() {
            return Err("Action script cannot be empty");
        }
        if self.script.len() > crate::core::MAX_SCRIPT_LENGTH {
            return Err("Action script exceeds maximum length");
        }
        Ok(())
    }

    /// Create an instance from this definition
    pub fn create_instance(&self, definition_id: ActionId) -> ActionInstance {
        ActionInstance {
            definition_id,
            cooldown: 0,
            last_used_frame: u16::MAX, // Never used
            runtime_vars: [0; 4],
            runtime_fixed: [Fixed::ZERO; 4],
        }
    }
}

impl ActionInstance {
    /// Create a new action instance
    pub fn new(definition_id: ActionId) -> Self {
        Self {
            definition_id,
            cooldown: 0,
            last_used_frame: u16::MAX,
            runtime_vars: [0; 4],
            runtime_fixed: [Fixed::ZERO; 4],
        }
    }

    /// Check if this action is currently active
    pub fn is_active(&self) -> bool {
        self.cooldown > 0
    }

    /// Check if this action is on cooldown
    pub fn is_on_cooldown(&self, current_frame: u16, cooldown_duration: u16) -> bool {
        if self.last_used_frame == u16::MAX {
            return false; // Never used
        }
        current_frame.saturating_sub(self.last_used_frame) < cooldown_duration
    }
}

impl Character {
    pub fn new(id: CharacterId, group: u8) -> Self {
        Self {
            core: EntityCore::new(id, group),
            health: 100,
            health_cap: 100,
            energy: 100,
            energy_cap: 100,
            power: 0,
            weight: 100,
            jump_force: Fixed::from_int(5),
            move_speed: Fixed::from_int(3),
            armor: [100; 9], // Default armor values (baseline 100)
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
        self.action_last_used = vec![u16::MAX; action_count]; // u16::MAX means "never used"
    }

    /// Get armor value for a specific element
    pub fn get_armor(&self, element: Element) -> u8 {
        self.armor[element as usize]
    }

    /// Set armor value for a specific element
    pub fn set_armor(&mut self, element: Element, value: u8) {
        self.armor[element as usize] = value;
    }
}

impl ConditionDefinition {
    /// Create a new condition definition with basic validation
    pub fn new(energy_mul: Fixed, script: Vec<u8>) -> Self {
        Self {
            energy_mul,
            args: [0; 8],
            script,
        }
    }

    /// Validate the condition definition
    pub fn validate(&self) -> Result<(), &'static str> {
        if self.script.is_empty() {
            return Err("Condition script cannot be empty");
        }
        if self.script.len() > crate::core::MAX_SCRIPT_LENGTH {
            return Err("Condition script exceeds maximum length");
        }
        if self.energy_mul < Fixed::ZERO {
            return Err("Energy multiplier cannot be negative");
        }
        Ok(())
    }

    /// Create an instance from this definition
    pub fn create_instance(&self, definition_id: ConditionId) -> ConditionInstance {
        ConditionInstance {
            definition_id,
            runtime_vars: [0; 4],
            runtime_fixed: [Fixed::ZERO; 4],
        }
    }
}

impl ConditionInstance {
    /// Create a new condition instance
    pub fn new(definition_id: ConditionId) -> Self {
        Self {
            definition_id,
            runtime_vars: [0; 4],
            runtime_fixed: [Fixed::ZERO; 4],
        }
    }
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
            dir: (1, 1),     // Default to right (1) and downward (1)
            enmity: 0,       // Default enmity
            target_id: None, // No target initially
            target_type: 0,  // No target type initially
        }
    }

    /// Get facing direction as Fixed value (-1.0 for left, 1.0 for right)
    pub fn get_facing(&self) -> Fixed {
        if self.dir.0 == 0 {
            Fixed::from_int(-1) // Left
        } else {
            Fixed::from_int(1) // Right
        }
    }

    /// Set facing direction from Fixed value (-1.0 → left, 1.0 → right)
    pub fn set_facing(&mut self, value: Fixed) {
        if value < Fixed::ZERO {
            self.dir.0 = 0; // Left
        } else {
            self.dir.0 = 1; // Right
        }
    }

    /// Get gravity direction as Fixed value (-1.0 for upward, 1.0 for downward)
    pub fn get_gravity_dir(&self) -> Fixed {
        if self.dir.1 == 0 {
            Fixed::from_int(-1) // Upward
        } else {
            Fixed::from_int(1) // Downward
        }
    }

    /// Set gravity direction from Fixed value (-1.0 → upward, 1.0 → downward)
    pub fn set_gravity_dir(&mut self, value: Fixed) {
        if value < Fixed::ZERO {
            self.dir.1 = 0; // Upward
        } else {
            self.dir.1 = 1; // Downward
        }
    }
}

impl SpawnInstance {
    pub fn new(spawn_id: SpawnLookupId, owner_id: EntityId, pos: (Fixed, Fixed)) -> Self {
        let mut core = EntityCore::new(0, 0); // ID will be assigned by game state
        core.pos = pos;

        Self {
            core,
            spawn_id,
            owner_id,
            owner_type: 1, // Default to Character owner
            health: 1,
            health_cap: 1,
            rotation: Fixed::ZERO,
            life_span: 0,            // Will be set from spawn definition
            element: Element::Punct, // Default element, will be set from spawn definition
            runtime_vars: [0; 4],
            runtime_fixed: [Fixed::ZERO; 4],
        }
    }

    pub fn with_element(
        spawn_id: SpawnLookupId,
        owner_id: EntityId,
        pos: (Fixed, Fixed),
        element: Element,
    ) -> Self {
        let mut core = EntityCore::new(0, 0); // ID will be assigned by game state
        core.pos = pos;

        Self {
            core,
            spawn_id,
            owner_id,
            owner_type: 1, // Default to Character owner
            health: 1,
            health_cap: 1,
            rotation: Fixed::ZERO,
            life_span: 0, // Will be set from spawn definition
            element,
            runtime_vars: [0; 4],
            runtime_fixed: [Fixed::ZERO; 4],
        }
    }
}

impl StatusEffectDefinition {
    /// Create a new status effect definition with basic validation
    pub fn new(
        duration: u16,
        stack_limit: u8,
        reset_on_stack: bool,
        chance: u8,
        on_script: Vec<u8>,
        tick_script: Vec<u8>,
        off_script: Vec<u8>,
    ) -> Self {
        Self {
            duration,
            stack_limit,
            reset_on_stack,
            chance,
            args: [0; 8],
            spawns: [0; 4],
            on_script,
            tick_script,
            off_script,
        }
    }

    /// Validate the status effect definition
    pub fn validate(&self) -> Result<(), &'static str> {
        if self.on_script.len() > crate::core::MAX_SCRIPT_LENGTH {
            return Err("On script exceeds maximum length");
        }
        if self.tick_script.len() > crate::core::MAX_SCRIPT_LENGTH {
            return Err("Tick script exceeds maximum length");
        }
        if self.off_script.len() > crate::core::MAX_SCRIPT_LENGTH {
            return Err("Off script exceeds maximum length");
        }
        if self.stack_limit == 0 {
            return Err("Stack limit must be at least 1");
        }
        Ok(())
    }

    /// Create an instance from this definition
    pub fn create_instance(&self, definition_id: StatusEffectId) -> StatusEffectInstance {
        StatusEffectInstance {
            definition_id,
            life_span: self.duration,
            stack_count: 1,
            runtime_vars: [0; 4],
            runtime_fixed: [Fixed::ZERO; 4],
        }
    }
}

impl StatusEffectInstance {
    /// Create a new status effect instance
    pub fn new(definition_id: StatusEffectId) -> Self {
        Self {
            definition_id,
            life_span: 0, // Will be set from definition
            stack_count: 1,
            runtime_vars: [0; 4],
            runtime_fixed: [Fixed::ZERO; 4],
        }
    }

    /// Check if this status effect has expired
    pub fn is_expired(&self) -> bool {
        self.life_span == 0
    }
}

/// Element types for damage and interactions
#[repr(u8)]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Element {
    Punct = 0, // Puncture / piercing - goes through multiple enemies and walls, ignores force fields
    Blast = 1, // Explosive AOE damage
    Force = 2, // Blunt weapons - impact damage, bonus based on entity weight if melee, negated by force fields
    Sever = 3, // Critical chance (x1.5 to x2 damage)
    Heat = 4,  // Applies damage overtime / burning effect
    Cryo = 5,  // Applies slow movement / cooldown, frostbite (max HP % damage)
    Jolt = 6,  // Energy altering - slow recharging, energy damage, energy leak
    Acid = 7,  // Disables regenerative and other supportive buffs
    Virus = 8, // Alters target behavior - inject erratic bugs, disable behaviors
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
            7 => Some(Element::Acid),
            8 => Some(Element::Virus),
            _ => None,
        }
    }
}

/// Character armor values (0-255, baseline 100) - simplified elemental immunity
/// Index corresponds to Element enum values: [Punct, Blast, Force, Sever, Heat, Cryo, Jolt, Acid, Virus]
/// Lower values = more vulnerable, higher values = more resistant
pub type Armor = [u8; 9];
