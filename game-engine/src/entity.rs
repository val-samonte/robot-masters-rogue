//! Entity system for characters, spawns, and status effects

use crate::math::Fixed;
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
}

/// Programmable fighting characters
#[derive(Debug, Clone)]
pub struct Character {
    pub core: EntityCore,
    pub health: u8,
    pub energy: u8,
    pub behaviors: Vec<(ConditionId, ActionId)>,
    pub locked_action: Option<ActionInstanceId>,
    pub status_effects: Vec<StatusEffectInstance>,
}

/// Projectiles and temporary objects
#[derive(Debug, Clone)]
pub struct SpawnInstance {
    pub core: EntityCore,
    pub spawn_id: SpawnLookupId,
    pub owner_id: CharacterId,
    pub lifespan: u16,
    pub vars: [u8; 4], // Script variables
}

/// Definition template for spawn objects
#[derive(Debug, Clone)]
pub struct SpawnDefinition {
    pub damage_base: u8,
    pub health_cap: u8,
    pub duration: u16,
    pub element: Option<Element>,
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
    pub on_script: Vec<u8>,   // Runs when applied
    pub tick_script: Vec<u8>, // Runs every frame
    pub off_script: Vec<u8>,  // Runs when removed
}

/// Element types for damage and interactions
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Element {
    Fire,
    Ice,
    Electric,
    Kinetic,
}

/// Condition for character behavior
#[derive(Debug, Clone)]
pub struct Condition {
    pub energy_mul: Fixed, // Energy requirement multiplier
    pub args: [u8; 4],     // Script arguments
    pub script: Vec<u8>,   // Bytecode
}

/// Action for character behavior
#[derive(Debug, Clone)]
pub struct Action {
    pub energy_cost: u8,
    pub duration: u16, // Frames this action locks the character
    pub args: [u8; 4],
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
        }
    }
}

impl Character {
    pub fn new(id: CharacterId, group: u8) -> Self {
        Self {
            core: EntityCore::new(id, group),
            health: 100,
            energy: 100,
            behaviors: Vec::new(),
            locked_action: None,
            status_effects: Vec::new(),
        }
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
            lifespan: 0, // Will be set from spawn definition
            vars: [0; 4],
        }
    }
}
