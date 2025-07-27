# Design Document

## Overview

The Robot Masters Game Engine is architected as a pure, deterministic computation library that operates entirely in no_std Rust with only alloc dependency. The engine follows a data-driven design where game behavior is defined through bytecode scripts executed by a custom virtual machine rather than hardcoded logic. The core architecture separates concerns into distinct modules: fixed-point mathematics (5-bit precision), entity management, scripting engine with 90+ operators, physics/collision detection, status effects system, and efficient serialization.

The engine operates on a tick-based system where each frame advances the game state deterministically through a structured pipeline: status effect processing, character behavior execution, physics updates, collision detection, and entity cleanup. All randomness uses a seeded Linear Congruential Generator, all arithmetic uses 5-bit fixed-point numbers (i16), and all behavior is script-driven to ensure identical execution across different platforms.

The design incorporates a comprehensive error recovery system, extensive test coverage with 275+ tests, and a clean separation between the pure game engine and platform-specific bindings. The scripting system uses OperatorAddress constants for maintainable bytecode, property-based access patterns for scalable game state interaction, and context-specific interpreters for different entity types.

## Architecture

### Core Engine Structure

```
Game Engine (no_std + alloc)
├── Public API (api.rs) - new_game, game_loop, game_state functions
├── Game State (state.rs) - Serializable game world state with frame processing pipeline
├── Entity System (entity.rs) - Characters, Spawns, Status Effects with EntityCore
├── Script Engine (script.rs) - Bytecode interpreter with 90+ operators
├── Behavior System (behavior.rs) - Condition/Action execution with context interpreters
├── Status Effects (status.rs) - Temporary character modifications with tick processing
├── Spawn System (spawn.rs) - Projectile and temporary object management
├── Math Module (math.rs) - 5-bit fixed-point arithmetic with trigonometry tables
├── Physics System (physics.rs, tilemap.rs) - Collision detection and tilemap
├── Random System (random.rs) - Deterministic LCG with full 65536 period
├── Constants (constants.rs) - OperatorAddress and PropertyAddress enums
├── Error Handling (error.rs) - ErrorRecovery system with graceful degradation
├── Core Constants (core.rs) - Game timing, screen dimensions, entity limits
└── Test Utilities (test_utils.rs) - Shared test helpers for consistent testing
```

### Data Flow

1. **Initialization**: new_game() receives seed (u16), tilemap ([[u8; 16]; 15]), characters (Vec<Character>), and spawn_definitions (Vec<SpawnDefinition>)
2. **Frame Processing Pipeline**: Each game_loop() call processes one frame through structured pipeline:
   - Status effect processing (tick_script execution for all active status effects)
   - Character behavior execution (condition evaluation → action execution with cooldown checks)
   - Physics updates (position/velocity updates, collision detection)
   - Collision processing (entity-entity and entity-tilemap interactions)
   - Entity cleanup (remove expired spawns, validate game state)
3. **Script Execution**: ScriptEngine executes bytecode with context-specific interpreters (ConditionContext, ActionContext, SpawnBehaviorContext, StatusEffectContext)
4. **State Management**: GameState maintains all entities, RNG state, lookup tables, and provides JSON/binary serialization
5. **Error Recovery**: ErrorRecovery system handles script failures, arithmetic errors, and validation issues gracefully

### Platform Integration

The engine exposes exactly three primary functions through a clean API:

```rust
// Initialize a new game instance
pub fn new_game(
    seed: u16,
    tilemap: [[u8; 16]; 15],
    characters: Vec<Character>,
    spawn_definitions: Vec<SpawnDefinition>,
) -> GameResult<GameState>

// Advance game state by exactly one frame (1/60th second)
pub fn game_loop(state: &mut GameState) -> GameResult<()>

// Get current state in both JSON and binary formats
pub fn game_state(state: &GameState) -> GameResult<(String, Vec<u8>)>
```

Platform-specific projects (WASM bindings, Solana programs) consume these functions without the engine needing platform-specific code. The engine uses GameError enum for error handling and ErrorRecovery system for graceful degradation across platforms.

### Error Handling System

The engine includes a comprehensive error handling system that provides graceful degradation:

```rust
// Comprehensive error types for all engine operations
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum GameError {
    // Script-related errors
    InvalidScript, ScriptExecutionError, InvalidOperator, ScriptIndexOutOfBounds,
    // Serialization errors
    SerializationError, DeserializationError, InvalidBinaryData, DataTooShort,
    // Game state errors
    InvalidGameState, InvalidCharacterData, InvalidSpawnData, InvalidTilemap,
    // Entity errors
    EntityNotFound, InvalidEntityId, InvalidPropertyAddress,
    // Math errors
    DivisionByZero, ArithmeticOverflow,
    // General errors
    OutOfBounds, InvalidInput,
}

// Error recovery strategies for different failure types
pub struct ErrorRecovery;

impl ErrorRecovery {
    pub fn handle_script_error(error: GameError) -> u8; // Safe exit codes
    pub fn handle_serialization_error(error: GameError) -> GameResult<()>; // Recovery options
    pub fn validate_and_recover_game_state(...) -> GameResult<()>; // State validation
    pub fn handle_arithmetic_error(error: GameError) -> Fixed; // Safe fallbacks
    pub fn is_recoverable(error: &GameError) -> bool; // Recovery classification
}
```

## Components and Interfaces

### Fixed-Point Mathematics

```rust
// 5-bit precision fixed-point number for optimal storage/performance balance
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord)]
pub struct Fixed(i16);

impl Fixed {
    pub const FRACTIONAL_BITS: u32 = 5;
    pub const ONE: Fixed = Fixed(1 << 5); // 32
    pub const ZERO: Fixed = Fixed(0);
    pub const MAX: Fixed = Fixed(i16::MAX);
    pub const MIN: Fixed = Fixed(i16::MIN);

    // Core arithmetic operations with overflow handling
    pub fn from_int(value: i16) -> Self;
    pub fn from_raw(raw: i16) -> Self;
    pub fn to_int(self) -> i32;
    pub fn add(self, other: Fixed) -> Fixed; // Saturating addition
    pub fn sub(self, other: Fixed) -> Fixed; // Saturating subtraction
    pub fn mul(self, other: Fixed) -> Fixed; // Clamped multiplication
    pub fn div(self, other: Fixed) -> Fixed; // Division with zero check
    pub fn abs(self) -> Fixed;
    pub fn neg(self) -> Fixed;
    // ... other operations
}

// Trigonometry tables are planned but not yet implemented
// Current implementation focuses on basic arithmetic operations
```

### Entity System

```rust
// Base entity properties shared by all game objects
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

// Programmable fighting characters
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

// Projectiles and temporary objects
#[derive(Debug, Clone)]
pub struct SpawnInstance {
    pub core: EntityCore,
    pub spawn_id: SpawnLookupId,
    pub owner_id: CharacterId,
    pub lifespan: u16,
    pub element: Element, // Element type carried by this spawn
    pub vars: [u8; 4],    // Script variables
}

// Definition template for spawn objects
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

// Active status effect on a character
#[derive(Debug, Clone)]
pub struct StatusEffectInstance {
    pub effect_id: u8,
    pub remaining_duration: u16,
    pub stack_count: u8,
    pub vars: [u8; 4], // Script variables
}

// Status effect definition
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
```

### Elemental System

The elemental system provides strategic depth through damage types and character resistances. Each character has armor values for all 8 elements, and spawns carry exactly one element type.

```rust
/// Element types for damage and interactions
#[repr(u8)]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Element {
    Punct = 0, // Puncture / piercing - goes through multiple enemies and walls, ignores force fields
    Blast = 1, // Explosive AOE damage
    Force = 2, // Blunt weapons - impact damage, bonus based on entity weight if melee
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

/// Helper functions for armor array access
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
```

### Action Cooldown System

The cooldown system provides timing control for actions to prevent them from being executed too frequently. This adds strategic depth by requiring players to time their actions carefully and prevents rapid-fire exploitation of powerful abilities.

**Cooldown Architecture:**

```rust
pub struct Action {
    pub energy_cost: u8,
    pub interval: u16,
    pub duration: u16,
    pub cooldown: u16,        // Cooldown duration in frames (read-only after initialization)
    pub vars: [u8; 8],
    pub fixed: [Fixed; 4],
    pub args: [u8; 8],
    pub spawns: [u8; 4],
    pub script: Vec<u8>,
}

pub struct Character {
    // ... existing fields ...
    pub action_last_used: Vec<u16>,  // Tracks when each action was last executed (by action index)
}
```

**Cooldown Evaluation Flow:**

1. **Behavior Processing**: Before evaluating conditions, check if action is on cooldown
2. **Cooldown Check**: Compare current frame vs (last_used + cooldown)
3. **Skip if On Cooldown**: Continue to next behavior if action is cooling down
4. **Update Timestamp**: Set last_used to current frame when action executes successfully

**Script Integration:**

The cooldown system integrates with the script engine through dedicated operators:

```rust
// Cooldown management operators
ReadActionCooldown = 92,    // Read action cooldown duration
ReadActionLastUsed = 93,    // Read when action was last used
WriteActionLastUsed = 94,   // Update when action was last used
IsActionOnCooldown = 95,    // Check if action is currently on cooldown
```

This allows actions to implement their own cooldown logic or modify cooldown behavior dynamically.

### Script Engine

The script engine uses a bytecode virtual machine with 90+ operators organized through OperatorAddress constants for maintainable code. The system supports context-specific interpreters for different entity types (characters, spawns, status effects) with property-based access patterns for scalable game state interaction.

The script system supports enhanced parameter passing through a read-only args array and working variables through vars/fixed arrays, enabling reusable script components like configurable actions (e.g., a Shoot action with different ammo capacities).

**ARGS/Vars Separation of Concerns:**

- **Args Array (`args: [u8; 8]`)**: Read-only parameters passed during entity definition, similar to function parameters. These remain constant throughout script execution and enable reusable script components.
- **Vars Array (`vars: [u8; 8]`)**: Working variables for temporary storage and calculations during script execution. Scripts can read from and write to these variables.
- **Spawns Array (`spawns: [u8; 4]`)**: Dedicated storage for spawn ID management, allowing scripts to create and track spawned entities.

**Example: Reusable Shoot Action with Args**

```rust
// Shoot action that can be configured with different ammo capacities
let shoot_action = Action {
    energy_cost: 10,
    duration: 30,
    args: [30, 0, 0, 0, 0, 0, 0, 0], // args[0] = ammo capacity (30 rounds)
    script: vec![
        // Read current ammo from args[0] into vars[0]
        95, 0, 0,        // ReadArg vars[0] = args[0] (ammo capacity)

        // Check if we have ammo
        52, 1, 0, 1,     // LessThan vars[1] = (vars[0] < 1) - out of ammo?

        // If out of ammo, exit with reload flag
        // ... reload logic here ...

        // Otherwise, shoot projectile
        20, 2, 5,        // AssignByte vars[2] = 5 (projectile ID)
        84, 2,           // Spawn vars[2] (create projectile)

        // Decrease ammo count
        41, 0, 0, 1,     // SubByte vars[0] = vars[0] - 1

        0, 1             // Exit success
    ],
    // ... other fields
};

// The same action can be reused with different ammo capacities:
// - Pistol: args[0] = 12 (12 rounds)
// - Rifle: args[0] = 30 (30 rounds)
// - Shotgun: args[0] = 8 (8 shells)
```

This design pattern allows for highly reusable and configurable game logic without code duplication.

```rust
/// Script execution engine with execution context
#[derive(Debug)]
pub struct ScriptEngine {
    /// Current instruction pointer
    pub pos: usize,
    /// Exit flag for script termination
    pub exit_flag: u8,
    /// Byte variables for script execution
    pub vars: [u8; 8],
    /// Fixed-point variables for script execution
    pub fixed: [Fixed; 4],
    /// Read-only arguments passed to script (like function parameters)
    pub args: [u8; 8],
    /// Spawn IDs for spawn creation
    pub spawns: [u8; 4],
}

/// Script context for condition evaluation
pub struct ConditionContext<'a> {
    pub game_state: &'a mut GameState,
    pub character: &'a Character,
    pub condition: &'a Condition,
}

/// Script context for action execution
pub struct ActionContext<'a> {
    pub game_state: &'a mut GameState,
    pub character: &'a mut Character,
    pub action: &'a Action,
    pub condition: &'a Condition,
    pub action_id: usize,
    pub to_spawn: Vec<SpawnInstance>,
}

/// Script context for spawn behavior execution
pub struct SpawnBehaviorContext<'a> {
    pub game_state: &'a mut GameState,
    pub spawn_instance: &'a mut SpawnInstance,
    pub spawn_def: &'a SpawnDefinition,
    pub to_spawn: &'a mut Vec<SpawnInstance>,
}

/// Script context for status effect execution
pub struct StatusEffectContext<'a> {
    pub game_state: &'a mut GameState,
    pub character: &'a mut Character,
    pub status_instance: &'a mut StatusEffectInstance,
    pub status_def: &'a StatusEffect,
}

// Bytecode operators using OperatorAddress constants for maintainability
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
#[repr(u8)]
pub enum OperatorAddress {
    // ===== CONTROL FLOW OPERATORS =====
    Exit = 0,                    // Exit script with specified flag
    ExitIfNoEnergy = 1,         // Exit if insufficient energy
    ExitIfCooldown = 2,         // Exit if action is on cooldown
    Skip = 3,                   // Skip specified number of bytes
    Goto = 4,                   // Jump to specified position

    // ===== PROPERTY OPERATIONS =====
    ReadProp = 10,              // Read property into variable: [ReadProp, var_index, prop_address]
    WriteProp = 11,             // Write variable to property: [WriteProp, prop_address, var_index]

    // ===== VARIABLE OPERATIONS =====
    AssignByte = 20,            // Assign byte literal to variable: [AssignByte, var_index, literal_value]
    AssignFixed = 21,           // Assign fixed-point value: [AssignFixed, var_index, numerator, denominator]
    AssignRandom = 22,          // Assign random value: [AssignRandom, var_index]
    ToByte = 23,                // Convert fixed to byte: [ToByte, to_var_index, from_fixed_index]
    ToFixed = 24,               // Convert byte to fixed: [ToFixed, to_fixed_index, from_var_index]

    // ===== FIXED-POINT ARITHMETIC =====
    Add = 30,                   // Add fixed-point values: [Add, dest_fixed, left_fixed, right_fixed]
    Sub = 31,                   // Subtract fixed-point values: [Sub, dest_fixed, left_fixed, right_fixed]
    Mul = 32,                   // Multiply fixed-point values: [Mul, dest_fixed, left_fixed, right_fixed]
    Div = 33,                   // Divide fixed-point values: [Div, dest_fixed, left_fixed, right_fixed]
    Negate = 34,                // Negate fixed-point value: [Negate, fixed_index]

    // ===== BYTE ARITHMETIC =====
    AddByte = 40,               // Add byte values: [AddByte, dest_var, left_var, right_var]
    SubByte = 41,               // Subtract byte values: [SubByte, dest_var, left_var, right_var]
    MulByte = 42,               // Multiply byte values: [MulByte, dest_var, left_var, right_var]
    DivByte = 43,               // Divide byte values: [DivByte, dest_var, left_var, right_var]
    ModByte = 44,               // Modulo byte values: [ModByte, dest_var, left_var, right_var]
    WrappingAdd = 45,           // Wrapping add byte values: [WrappingAdd, dest_var, left_var, right_var]

    // ===== CONDITIONAL OPERATIONS =====
    Equal = 50,                 // Equal comparison: [Equal, dest_var, left_var, right_var]
    NotEqual = 51,              // Not equal comparison: [NotEqual, dest_var, left_var, right_var]
    LessThan = 52,              // Less than comparison: [LessThan, dest_var, left_var, right_var]
    LessThanOrEqual = 53,       // Less than or equal comparison: [LessThanOrEqual, dest_var, left_var, right_var]

    // ===== LOGICAL OPERATIONS =====
    Not = 60,                   // Logical NOT: [Not, dest_var, source_var]
    Or = 61,                    // Logical OR: [Or, dest_var, left_var, right_var]
    And = 62,                   // Logical AND: [And, dest_var, left_var, right_var]

    // ===== UTILITY OPERATIONS =====
    Min = 70,                   // Minimum value: [Min, dest_var, left_var, right_var]
    Max = 71,                   // Maximum value: [Max, dest_var, left_var, right_var]

    // ===== GAME ACTIONS =====
    LockAction = 80,            // Lock current action
    UnlockAction = 81,          // Unlock current action
    ApplyEnergyCost = 82,       // Apply energy cost
    ApplyDuration = 83,         // Apply duration
    Spawn = 84,                 // Spawn entity: [Spawn, spawn_id_var]
    SpawnWithVars = 85,         // Spawn with variables: [SpawnWithVars, spawn_id_var, var1, var2, var3, var4]

    // ===== DEBUG OPERATIONS =====
    LogVariable = 90,           // Log variable: [LogVariable, var_index]
    ExitWithVar = 91,           // Exit with value from variable: [ExitWithVar, var_index]

    // ===== COOLDOWN OPERATORS =====
    ReadActionCooldown = 92,    // Read action cooldown duration
    ReadActionLastUsed = 93,    // Read when action was last used
    WriteActionLastUsed = 94,   // Update when action was last used
    IsActionOnCooldown = 95,    // Check if action is currently on cooldown

    // ===== ARGS/SPAWNS ACCESS =====
    ReadArg = 96,               // Read from args array: [ReadArg, var_index, arg_index]
    ReadSpawn = 97,             // Read from spawns array: [ReadSpawn, var_index, spawn_index]
    WriteSpawn = 98,            // Write to spawns array: [WriteSpawn, spawn_index, var_index]
}

impl Operator {
    // Simple byte-to-enum conversion
    pub fn from_u8(byte: u8) -> Option<Operator> {
        if byte <= 90 {
            Some(unsafe { core::mem::transmute(byte) })
        } else {
            None
        }
    }
}
```

**Key Design Improvements:**

1. **Structured Operand Patterns**: Operations are grouped by operand patterns, making it easy to add new operators without changing the interpreter structure:

   - 3-operand arithmetic: `[op, dest, left, right]`
   - 2-operand operations: `[op, dest, source]`
   - Property access: `[ReadProp/WriteProp, var_index, property_address]`

2. **Generic Operation Handling**: Similar operations share implementation code through pattern matching:

```rust
impl ScriptEngine {
    fn execute_instruction(&mut self) {
        let op_byte = self.read_u8();
        if let Some(op) = Operator::from_u8(op_byte) {
            match op {
                // Control flow operations
                Operator::Exit => {
                    self.exit_flag = self.read_u8();
                    self.pos = self.action.script.len();
                }

                Operator::ExitIfNoEnergy => {
                    let exit_flag = self.read_u8();
                    let energy_req = self.calculate_energy_requirement();
                    if self.character.energy < energy_req {
                        self.exit_flag = exit_flag;
                        self.pos = self.action.script.len();
                    }
                }

                // Property operations - easily extensible
                Operator::ReadProp => {
                    let var_index = self.read_u8() as usize;
                    let prop_address = self.read_u8();
                    self.read_property(var_index, prop_address);
                }

                Operator::WriteProp => {
                    let prop_address = self.read_u8();
                    let var_index = self.read_u8() as usize;
                    self.write_property(prop_address, var_index);
                }

                // Variable assignment operations
                Operator::AssignByte => {
                    let var_index = self.read_u8() as usize;
                    let literal = self.read_u8();
                    self.vars[var_index] = literal;
                }

                Operator::AssignFixed => {
                    let var_index = self.read_u8() as usize;
                    let numerator = self.read_u8();
                    let denominator = self.read_u8();
                    self.fixed[var_index] = Fixed::from_fraction(numerator as i32, denominator as i32);
                }

                // Generic 3-operand fixed-point arithmetic
                Operator::Add | Operator::Sub | Operator::Mul | Operator::Div => {
                    self.execute_fixed_arithmetic(op);
                }

                // Generic 3-operand byte arithmetic
                Operator::AddByte | Operator::SubByte | Operator::MulByte |
                Operator::DivByte | Operator::ModByte | Operator::WrappingAdd => {
                    self.execute_byte_arithmetic(op);
                }

                // Generic 3-operand conditional operations
                Operator::Equal | Operator::NotEqual | Operator::LessThan | Operator::LessThanOrEqual => {
                    self.execute_conditional(op);
                }

                // Generic logical operations
                Operator::Or | Operator::And => {
                    self.execute_logical_binary(op);
                }

                Operator::Not => {
                    let dest_index = self.read_u8() as usize;
                    let source_index = self.read_u8() as usize;
                    self.vars[dest_index] = if self.vars[source_index] == 0 { 1 } else { 0 };
                }

                // Generic utility operations
                Operator::Min | Operator::Max => {
                    self.execute_utility_binary(op);
                }

                // Game-specific operations
                Operator::LockAction => {
                    self.character.locked_action = Some((self.condition.id, self.action_instance_id));
                }

                Operator::Spawn => {
                    let spawn_id = self.vars[self.read_u8() as usize] as usize;
                    self.create_spawn(spawn_id, None);
                }

                Operator::SpawnWithVars => {
                    let spawn_id = self.vars[self.read_u8() as usize] as usize;
                    let vars = [
                        self.vars[self.read_u8() as usize],
                        self.vars[self.read_u8() as usize],
                        self.vars[self.read_u8() as usize],
                        self.vars[self.read_u8() as usize],
                    ];
                    self.create_spawn(spawn_id, Some(vars));
                }

                // ... other operations
            }
        }
    }

    // Generic arithmetic operation handlers
    fn execute_fixed_arithmetic(&mut self, op: Operator) {
        let dest = self.read_u8() as usize;
        let left = self.read_u8() as usize;
        let right = self.read_u8() as usize;

        self.fixed[dest] = match op {
            Operator::Add => self.fixed[left].add(self.fixed[right]),
            Operator::Sub => self.fixed[left].sub(self.fixed[right]),
            Operator::Mul => self.fixed[left].mul(self.fixed[right]),
            Operator::Div => self.fixed[left].div(self.fixed[right]),
            _ => unreachable!(),
        };
    }

    fn execute_byte_arithmetic(&mut self, op: Operator) {
        let dest = self.read_u8() as usize;
        let left = self.read_u8() as usize;
        let right = self.read_u8() as usize;

        self.vars[dest] = match op {
            Operator::AddByte => self.vars[left].saturating_add(self.vars[right]),
            Operator::SubByte => self.vars[left].saturating_sub(self.vars[right]),
            Operator::MulByte => self.vars[left].saturating_mul(self.vars[right]),
            Operator::DivByte => self.vars[left].saturating_div(self.vars[right]),
            Operator::ModByte => self.vars[left] % self.vars[right],
            Operator::WrappingAdd => self.vars[left].wrapping_add(self.vars[right]),
            _ => unreachable!(),
        };
    }

    fn execute_conditional(&mut self, op: Operator) {
        let dest = self.read_u8() as usize;
        let left = self.read_u8() as usize;
        let right = self.read_u8() as usize;

        self.vars[dest] = match op {
            Operator::Equal => if self.vars[left] == self.vars[right] { 1 } else { 0 },
            Operator::NotEqual => if self.vars[left] != self.vars[right] { 1 } else { 0 },
            Operator::LessThan => if self.vars[left] < self.vars[right] { 1 } else { 0 },
            Operator::LessThanOrEqual => if self.vars[left] <= self.vars[right] { 1 } else { 0 },
            _ => unreachable!(),
        };
    }

    // Scalable property access with type safety
    fn read_property(&mut self, var_index: usize, prop_address: u8) {
        match prop_address {
            // Game state properties (Fixed-point values)
            0x01 => self.fixed[var_index] = Fixed::from_whole(self.game_state.seed as i32),
            0x02 => self.fixed[var_index] = Fixed::from_whole(self.game_state.frame as i32),
            0x03 => self.fixed[var_index] = self.game_state.gravity,

            // Character position and movement (Fixed-point values)
            0x19 => self.fixed[var_index] = self.character.pos.0,
            0x1A => self.fixed[var_index] = self.character.pos.1,
            0x1B => self.fixed[var_index] = self.character.vel.0,
            0x1C => self.fixed[var_index] = self.character.vel.1,

            // Character stats (Byte values)
            0x21 => self.vars[var_index] = self.character.health,
            0x22 => self.vars[var_index] = self.character.health_cap,
            0x23 => self.vars[var_index] = self.character.energy,
            0x24 => self.vars[var_index] = self.character.energy_cap,
            0x25 => self.vars[var_index] = self.character.energy_regen,
            0x26 => self.vars[var_index] = self.character.energy_regen_rate,
            0x27 => self.vars[var_index] = self.character.energy_charge,
            0x28 => self.vars[var_index] = self.character.energy_charge_rate,

            // Character armor values (Byte values) - addresses 0x40-0x47
            0x40 => self.vars[var_index] = self.character.armor[0], // Punct
            0x41 => self.vars[var_index] = self.character.armor[1], // Blast
            0x42 => self.vars[var_index] = self.character.armor[2], // Force
            0x43 => self.vars[var_index] = self.character.armor[3], // Sever
            0x44 => self.vars[var_index] = self.character.armor[4], // Heat
            0x45 => self.vars[var_index] = self.character.armor[5], // Cryo
            0x46 => self.vars[var_index] = self.character.armor[6], // Jolt
            0x47 => self.vars[var_index] = self.character.armor[7], // Virus

            // Character collision flags (Byte values)
            0x2B => self.vars[var_index] = if self.character.collision.0 { 1 } else { 0 },
            0x2C => self.vars[var_index] = if self.character.collision.1 { 1 } else { 0 },
            0x2D => self.vars[var_index] = if self.character.collision.2 { 1 } else { 0 },
            0x2E => self.vars[var_index] = if self.character.collision.3 { 1 } else { 0 },

            // ... easily add more properties here
            _ => {}
        }
    }

    fn write_property(&mut self, prop_address: u8, var_index: usize) {
        match prop_address {
            // Character position and movement (Fixed-point values)
            0x19 => self.character.pos.0 = self.fixed[var_index],
            0x1A => self.character.pos.1 = self.fixed[var_index],
            0x1B => self.character.vel.0 = self.fixed[var_index],
            0x1C => self.character.vel.1 = self.fixed[var_index],

            // Character stats (Byte values)
            0x21 => self.character.health = self.vars[var_index],
            0x22 => self.character.health_cap = self.vars[var_index],
            0x23 => self.character.energy = self.vars[var_index],
            0x24 => self.character.energy_cap = self.vars[var_index],
            0x25 => self.character.energy_regen = self.vars[var_index],
            0x26 => self.character.energy_regen_rate = self.vars[var_index],
            0x27 => self.character.energy_charge = self.vars[var_index],
            0x28 => self.character.energy_charge_rate = self.vars[var_index],

            // Character armor values (Byte values) - addresses 0x40-0x47
            0x40 => self.character.armor[0] = self.vars[var_index], // Punct
            0x41 => self.character.armor[1] = self.vars[var_index], // Blast
            0x42 => self.character.armor[2] = self.vars[var_index], // Force
            0x43 => self.character.armor[3] = self.vars[var_index], // Sever
            0x44 => self.character.armor[4] = self.vars[var_index], // Heat
            0x45 => self.character.armor[5] = self.vars[var_index], // Cryo
            0x46 => self.character.armor[6] = self.vars[var_index], // Jolt
            0x47 => self.character.armor[7] = self.vars[var_index], // Virus

            // ... easily add more properties here
            _ => {}
        }
    }
}
```

**Context-Specific Property Access:**

Each interpreter implements its own property access methods based on what data it has access to:

```rust
impl<'a> ConditionInterpreter<'a> {
    fn read_property(&mut self, var_index: usize, prop_address: u8) {
        match prop_address {
            // Game state properties
            0x01 => self.engine.fixed[var_index] = Fixed::from_whole(self.game_state.seed as i32),
            0x02 => self.engine.fixed[var_index] = Fixed::from_whole(self.game_state.frame as i32),

            // Character properties (read-only for conditions)
            0x19 => self.engine.fixed[var_index] = self.character.pos.0,
            0x1A => self.engine.fixed[var_index] = self.character.pos.1,
            0x21 => self.engine.vars[var_index] = self.character.health,
            0x23 => self.engine.vars[var_index] = self.character.energy,

            // Condition-specific properties
            0x11 => self.engine.vars[var_index] = self.condition.id as u8,
            0x12 => self.engine.fixed[var_index] = self.condition.energy_mul,

            _ => {}
        }
    }

    // Conditions typically don't write properties (read-only evaluation)
    fn write_property(&mut self, _prop_address: u8, _var_index: usize) {
        // No-op for conditions
    }
}

impl<'a> ActionInterpreter<'a> {
    fn read_property(&mut self, var_index: usize, prop_address: u8) {
        match prop_address {
            // Game state properties
            0x01 => self.engine.fixed[var_index] = Fixed::from_whole(self.game_state.seed as i32),
            0x02 => self.engine.fixed[var_index] = Fixed::from_whole(self.game_state.frame as i32),

            // Character properties (full access)
            0x19 => self.engine.fixed[var_index] = self.character.pos.0,
            0x1A => self.engine.fixed[var_index] = self.character.pos.1,
            0x1B => self.engine.fixed[var_index] = self.character.vel.0,
            0x1C => self.engine.fixed[var_index] = self.character.vel.1,
            0x21 => self.engine.vars[var_index] = self.character.health,
            0x23 => self.engine.vars[var_index] = self.character.energy,

            // Action-specific properties
            0x04 => self.engine.vars[var_index] = self.action.energy_cost,
            0x05 => self.engine.fixed[var_index] = Fixed::from_whole(self.action.interval as i32),
            0x06 => self.engine.fixed[var_index] = Fixed::from_whole(self.action.duration as i32),

            _ => {}
        }
    }

    fn write_property(&mut self, prop_address: u8, var_index: usize) {
        match prop_address {
            // Character properties (actions can modify character state)
            0x19 => self.character.pos.0 = self.engine.fixed[var_index],
            0x1A => self.character.pos.1 = self.engine.fixed[var_index],
            0x1B => self.character.vel.0 = self.engine.fixed[var_index],
            0x1C => self.character.vel.1 = self.engine.fixed[var_index],
            0x21 => self.character.health = self.engine.vars[var_index],
            0x23 => self.character.energy = self.engine.vars[var_index],

            _ => {}
        }
    }
}

impl<'a> SpawnInterpreter<'a> {
    fn read_property(&mut self, var_index: usize, prop_address: u8) {
        match prop_address {
            // Game state properties
            0x01 => self.engine.fixed[var_index] = Fixed::from_whole(self.game_state.seed as i32),
            0x02 => self.engine.fixed[var_index] = Fixed::from_whole(self.game_state.frame as i32),

            // Spawn instance properties
            0x78 => self.engine.fixed[var_index] = self.spawn_instance.pos.0,
            0x79 => self.engine.fixed[var_index] = self.spawn_instance.pos.1,
            0x7A => self.engine.fixed[var_index] = self.spawn_instance.vel.0,
            0x7B => self.engine.fixed[var_index] = self.spawn_instance.vel.1,
            0x6F => self.engine.vars[var_index] = self.spawn_instance.health,
            0x70 => self.engine.vars[var_index] = self.spawn_instance.owner_id,

            // Spawn definition properties
            0x5D => self.engine.vars[var_index] = self.spawn_def.damage_base,
            0x61 => self.engine.vars[var_index] = self.spawn_def.health_cap,

            // Spawn instance variables
            0x7F => self.engine.vars[var_index] = self.spawn_instance.vars[0],
            0x80 => self.engine.vars[var_index] = self.spawn_instance.vars[1],
            0x81 => self.engine.vars[var_index] = self.spawn_instance.vars[2],
            0x82 => self.engine.vars[var_index] = self.spawn_instance.vars[3],

            _ => {}
        }
    }

    fn write_property(&mut self, prop_address: u8, var_index: usize) {
        match prop_address {
            // Spawn instance properties
            0x78 => self.spawn_instance.pos.0 = self.engine.fixed[var_index],
            0x79 => self.spawn_instance.pos.1 = self.engine.fixed[var_index],
            0x7A => self.spawn_instance.vel.0 = self.engine.fixed[var_index],
            0x7B => self.spawn_instance.vel.1 = self.engine.fixed[var_index],
            0x6F => self.spawn_instance.health = self.engine.vars[var_index],

            // Spawn instance variables
            0x7F => self.spawn_instance.vars[0] = self.engine.vars[var_index],
            0x80 => self.spawn_instance.vars[1] = self.engine.vars[var_index],
            0x81 => self.spawn_instance.vars[2] = self.engine.vars[var_index],
            0x82 => self.spawn_instance.vars[3] = self.engine.vars[var_index],

            _ => {}
        }
    }
}

impl<'a> StatusEffectInterpreter<'a> {
    fn read_property(&mut self, var_index: usize, prop_address: u8) {
        match prop_address {
            // Game state properties
            0x01 => self.engine.fixed[var_index] = Fixed::from_whole(self.game_state.seed as i32),
            0x02 => self.engine.fixed[var_index] = Fixed::from_whole(self.game_state.frame as i32),

            // Character properties (status effects can read character state)
            0x19 => self.engine.fixed[var_index] = self.character.pos.0,
            0x1A => self.engine.fixed[var_index] = self.character.pos.1,
            0x21 => self.engine.vars[var_index] = self.character.health,
            0x23 => self.engine.vars[var_index] = self.character.energy,

            // Status effect definition properties
            0x84 => self.engine.fixed[var_index] = Fixed::from_whole(self.status_def.duration as i32),
            0x86 => self.engine.vars[var_index] = self.status_def.stack_limit,

            // Status effect instance properties
            0x8C => self.engine.vars[var_index] = self.status_instance.effect_id as u8,
            0x8D => self.engine.vars[var_index] = self.status_instance.stacks,
            0x8E => self.engine.fixed[var_index] = Fixed::from_whole(self.status_instance.life_span as i32),

            // Status effect instance variables
            0x8F => self.engine.vars[var_index] = self.status_instance.vars[0],
            0x90 => self.engine.vars[var_index] = self.status_instance.vars[1],
            0x91 => self.engine.vars[var_index] = self.status_instance.vars[2],
            0x92 => self.engine.vars[var_index] = self.status_instance.vars[3],

            _ => {}
        }
    }

    fn write_property(&mut self, prop_address: u8, var_index: usize) {
        match prop_address {
            // Character properties (status effects can modify character state)
            0x21 => self.character.health = self.engine.vars[var_index],
            0x23 => self.character.energy = self.engine.vars[var_index],

            // Status effect instance variables
            0x8F => self.status_instance.vars[0] = self.engine.vars[var_index],
            0x90 => self.status_instance.vars[1] = self.engine.vars[var_index],
            0x91 => self.status_instance.vars[2] = self.engine.vars[var_index],
            0x92 => self.status_instance.vars[3] = self.engine.vars[var_index],

            _ => {}
        }
    }
}

    // Conditions typically don't write properties (read-only evaluation)
    fn write_property(&mut self, _prop_address: u8, _var_index: usize) {
        // No-op for conditions
    }
}

impl<'a> ActionInterpreter<'a> {
    fn read_property(&mut self, var_index: usize, prop_address: u8) {
        match prop_address {
            // Game state properties
            0x01 => self.engine.fixed[var_index] = Fixed::from_whole(self.game_state.seed as i32),
            0x02 => self.engine.fixed[var_index] = Fixed::from_whole(self.game_state.frame as i32),

            // Character properties (full access)
            0x19 => self.engine.fixed[var_index] = self.character.pos.0,
            0x1A => self.engine.fixed[var_index] = self.character.pos.1,
            0x1B => self.engine.fixed[var_index] = self.character.vel.0,
            0x1C => self.engine.fixed[var_index] = self.character.vel.1,
            0x21 => self.engine.vars[var_index] = self.character.health,
            0x23 => self.engine.vars[var_index] = self.character.energy,

            // Action-specific properties
            0x04 => self.engine.vars[var_index] = self.action.energy_cost,
            0x05 => self.engine.fixed[var_index] = Fixed::from_whole(self.action.interval as i32),
            0x06 => self.engine.fixed[var_index] = Fixed::from_whole(self.action.duration as i32),

            _ => {}
        }
    }

    fn write_property(&mut self, prop_address: u8, var_index: usize) {
        match prop_address {
            // Character properties (actions can modify character state)
            0x19 => self.character.pos.0 = self.engine.fixed[var_index],
            0x1A => self.character.pos.1 = self.engine.fixed[var_index],
            0x1B => self.character.vel.0 = self.engine.fixed[var_index],
            0x1C => self.character.vel.1 = self.engine.fixed[var_index],
            0x21 => self.character.health = self.engine.vars[var_index],
            0x23 => self.character.energy = self.engine.vars[var_index],

            _ => {}
        }
    }
}

impl<'a> SpawnInterpreter<'a> {
    fn read_property(&mut self, var_index: usize, prop_address: u8) {
        match prop_address {
            // Game state properties
            0x01 => self.engine.fixed[var_index] = Fixed::from_whole(self.game_state.seed as i32),
            0x02 => self.engine.fixed[var_index] = Fixed::from_whole(self.game_state.frame as i32),

            // Spawn instance properties
            0x78 => self.engine.fixed[var_index] = self.spawn_instance.pos.0,
            0x79 => self.engine.fixed[var_index] = self.spawn_instance.pos.1,
            0x7A => self.engine.fixed[var_index] = self.spawn_instance.vel.0,
            0x7B => self.engine.fixed[var_index] = self.spawn_instance.vel.1,
            0x6F => self.engine.vars[var_index] = self.spawn_instance.health,
            0x70 => self.engine.vars[var_index] = self.spawn_instance.owner_id,

            // Spawn definition properties
            0x5D => self.engine.vars[var_index] = self.spawn_def.damage_base,
            0x61 => self.engine.vars[var_index] = self.spawn_def.health_cap,

            // Spawn instance variables
            0x7F => self.engine.vars[var_index] = self.spawn_instance.vars[0],
            0x80 => self.engine.vars[var_index] = self.spawn_instance.vars[1],
            0x81 => self.engine.vars[var_index] = self.spawn_instance.vars[2],
            0x82 => self.engine.vars[var_index] = self.spawn_instance.vars[3],

            _ => {}
        }
    }

    fn write_property(&mut self, prop_address: u8, var_index: usize) {
        match prop_address {
            // Spawn instance properties
            0x78 => self.spawn_instance.pos.0 = self.engine.fixed[var_index],
            0x79 => self.spawn_instance.pos.1 = self.engine.fixed[var_index],
            0x7A => self.spawn_instance.vel.0 = self.engine.fixed[var_index],
            0x7B => self.spawn_instance.vel.1 = self.engine.fixed[var_index],
            0x6F => self.spawn_instance.health = self.engine.vars[var_index],

            // Spawn instance variables
            0x7F => self.spawn_instance.vars[0] = self.engine.vars[var_index],
            0x80 => self.spawn_instance.vars[1] = self.engine.vars[var_index],
            0x81 => self.spawn_instance.vars[2] = self.engine.vars[var_index],
            0x82 => self.spawn_instance.vars[3] = self.engine.vars[var_index],

            _ => {}
        }
    }
}

impl<'a> StatusEffectInterpreter<'a> {
    fn read_property(&mut self, var_index: usize, prop_address: u8) {
        match prop_address {
            // Game state properties
            0x01 => self.engine.fixed[var_index] = Fixed::from_whole(self.game_state.seed as i32),
            0x02 => self.engine.fixed[var_index] = Fixed::from_whole(self.game_state.frame as i32),

            // Character properties (status effects can read character state)
            0x19 => self.engine.fixed[var_index] = self.character.pos.0,
            0x1A => self.engine.fixed[var_index] = self.character.pos.1,
            0x21 => self.engine.vars[var_index] = self.character.health,
            0x23 => self.engine.vars[var_index] = self.character.energy,

            // Status effect definition properties
            0x84 => self.engine.fixed[var_index] = Fixed::from_whole(self.status_def.duration as i32),
            0x86 => self.engine.vars[var_index] = self.status_def.stack_limit,

            // Status effect instance properties
            0x8C => self.engine.vars[var_index] = self.status_instance.effect_id as u8,
            0x8D => self.engine.vars[var_index] = self.status_instance.stacks,
            0x8E => self.engine.fixed[var_index] = Fixed::from_whole(self.status_instance.life_span as i32),

            // Status effect instance variables
            0x8F => self.engine.vars[var_index] = self.status_instance.vars[0],
            0x90 => self.engine.vars[var_index] = self.status_instance.vars[1],
            0x91 => self.engine.vars[var_index] = self.status_instance.vars[2],
            0x92 => self.engine.vars[var_index] = self.status_instance.vars[3],

            _ => {}
        }
    }

    fn write_property(&mut self, prop_address: u8, var_index: usize) {
        match prop_address {
            // Character properties (status effects can modify character state)
            0x21 => self.character.health = self.engine.vars[var_index],
            0x23 => self.character.energy = self.engine.vars[var_index],

            // Status effect instance variables
            0x8F => self.status_instance.vars[0] = self.engine.vars[var_index],
            0x90 => self.status_instance.vars[1] = self.engine.vars[var_index],
            0x91 => self.status_instance.vars[2] = self.engine.vars[var_index],
            0x92 => self.status_instance.vars[3] = self.engine.vars[var_index],

            _ => {}
        }
    }
}

    // Conditions typically don't write properties (read-only evaluation)
    fn write_property(&mut self, _prop_address: u8, _var_index: usize) {
        // No-op for conditions
    }
}

impl<'a> ActionInterpreter<'a> {
    fn read_property(&mut self, var_index: usize, prop_address: u8) {
        match prop_address {
            // Game state properties
            0x01 => self.engine.fixed[var_index] = Fixed::from_whole(self.game_state.seed as i32),
            0x02 => self.engine.fixed[var_index] = Fixed::from_whole(self.game_state.frame as i32),

            // Character properties (full access)
            0x19 => self.engine.fixed[var_index] = self.character.pos.0,
            0x1A => self.engine.fixed[var_index] = self.character.pos.1,
            0x1B => self.engine.fixed[var_index] = self.character.vel.0,
            0x1C => self.engine.fixed[var_index] = self.character.vel.1,
            0x21 => self.engine.vars[var_index] = self.character.health,
            0x23 => self.engine.vars[var_index] = self.character.energy,

            // Action-specific properties
            0x04 => self.engine.vars[var_index] = self.action.energy_cost,
            0x05 => self.engine.fixed[var_index] = Fixed::from_whole(self.action.interval as i32),
            0x06 => self.engine.fixed[var_index] = Fixed::from_whole(self.action.duration as i32),

            _ => {}
        }
    }

    fn write_property(&mut self, prop_address: u8, var_index: usize) {
        match prop_address {
            // Character properties (actions can modify character state)
            0x19 => self.character.pos.0 = self.engine.fixed[var_index],
            0x1A => self.character.pos.1 = self.engine.fixed[var_index],
            0x1B => self.character.vel.0 = self.engine.fixed[var_index],
            0x1C => self.character.vel.1 = self.engine.fixed[var_index],
            0x21 => self.character.health = self.engine.vars[var_index],
            0x23 => self.character.energy = self.engine.vars[var_index],

            _ => {}
        }
    }
}

impl<'a> SpawnInterpreter<'a> {
    fn read_property(&mut self, var_index: usize, prop_address: u8) {
        match prop_address {
            // Game state properties
            0x01 => self.engine.fixed[var_index] = Fixed::from_whole(self.game_state.seed as i32),
            0x02 => self.engine.fixed[var_index] = Fixed::from_whole(self.game_state.frame as i32),

            // Spawn instance properties
            0x78 => self.engine.fixed[var_index] = self.spawn_instance.pos.0,
            0x79 => self.engine.fixed[var_index] = self.spawn_instance.pos.1,
            0x7A => self.engine.fixed[var_index] = self.spawn_instance.vel.0,
            0x7B => self.engine.fixed[var_index] = self.spawn_instance.vel.1,
            0x6F => self.engine.vars[var_index] = self.spawn_instance.health,
            0x70 => self.engine.vars[var_index] = self.spawn_instance.owner_id,

            // Spawn definition properties
            0x5D => self.engine.vars[var_index] = self.spawn_def.damage_base,
            0x61 => self.engine.vars[var_index] = self.spawn_def.health_cap,

            // Spawn instance variables
            0x7F => self.engine.vars[var_index] = self.spawn_instance.vars[0],
            0x80 => self.engine.vars[var_index] = self.spawn_instance.vars[1],
            0x81 => self.engine.vars[var_index] = self.spawn_instance.vars[2],
            0x82 => self.engine.vars[var_index] = self.spawn_instance.vars[3],

            _ => {}
        }
    }

    fn write_property(&mut self, prop_address: u8, var_index: usize) {
        match prop_address {
            // Spawn instance properties
            0x78 => self.spawn_instance.pos.0 = self.engine.fixed[var_index],
            0x79 => self.spawn_instance.pos.1 = self.engine.fixed[var_index],
            0x7A => self.spawn_instance.vel.0 = self.engine.fixed[var_index],
            0x7B => self.spawn_instance.vel.1 = self.engine.fixed[var_index],
            0x6F => self.spawn_instance.health = self.engine.vars[var_index],

            // Spawn instance variables
            0x7F => self.spawn_instance.vars[0] = self.engine.vars[var_index],
            0x80 => self.spawn_instance.vars[1] = self.engine.vars[var_index],
            0x81 => self.spawn_instance.vars[2] = self.engine.vars[var_index],
            0x82 => self.spawn_instance.vars[3] = self.engine.vars[var_index],

            _ => {}
        }
    }
}

impl<'a> StatusEffectInterpreter<'a> {
    fn read_property(&mut self, var_index: usize, prop_address: u8) {
        match prop_address {
            // Game state properties
            0x01 => self.engine.fixed[var_index] = Fixed::from_whole(self.game_state.seed as i32),
            0x02 => self.engine.fixed[var_index] = Fixed::from_whole(self.game_state.frame as i32),

            // Character properties (status effects can read character state)
            0x19 => self.engine.fixed[var_index] = self.character.pos.0,
            0x1A => self.engine.fixed[var_index] = self.character.pos.1,
            0x21 => self.engine.vars[var_index] = self.character.health,
            0x23 => self.engine.vars[var_index] = self.character.energy,

            // Status effect definition properties
            0x84 => self.engine.fixed[var_index] = Fixed::from_whole(self.status_def.duration as i32),
            0x86 => self.engine.vars[var_index] = self.status_def.stack_limit,

            // Status effect instance properties
            0x8C => self.engine.vars[var_index] = self.status_instance.effect_id as u8,
            0x8D => self.engine.vars[var_index] = self.status_instance.stacks,
            0x8E => self.engine.fixed[var_index] = Fixed::from_whole(self.status_instance.life_span as i32),

            // Status effect instance variables
            0x8F => self.engine.vars[var_index] = self.status_instance.vars[0],
            0x90 => self.engine.vars[var_index] = self.status_instance.vars[1],
            0x91 => self.engine.vars[var_index] = self.status_instance.vars[2],
            0x92 => self.engine.vars[var_index] = self.status_instance.vars[3],

            _ => {}
        }
    }

    fn write_property(&mut self, prop_address: u8, var_index: usize) {
        match prop_address {
            // Character properties (status effects can modify character state)
            0x21 => self.character.health = self.engine.vars[var_index],
            0x23 => self.character.energy = self.engine.vars[var_index],

            // Status effect instance variables
            0x8F => self.status_instance.vars[0] = self.engine.vars[var_index],
            0x90 => self.status_instance.vars[1] = self.engine.vars[var_index],
            0x91 => self.status_instance.vars[2] = self.engine.vars[var_index],
            0x92 => self.status_instance.vars[3] = self.engine.vars[var_index],

            _ => {}
        }
    }
}
```

**Scalability Benefits:**

1. **Adding New Operators**: Simply add the enum variant with the next available byte value - no need to modify the interpreter structure
2. **Adding New Properties**: Only requires adding a new case to the appropriate interpreter's property match statements
3. **Context-Specific Access**: Each interpreter only exposes properties relevant to its execution context
4. **Consistent Patterns**: Similar operations share implementation through generic handler functions
5. **Performance**: Still uses efficient match statements while eliminating repetitive code
6. **Maintainability**: Clear separation between operation types and execution contexts

This approach maintains the performance benefits of match statements while dramatically reducing code repetition and making the system much more maintainable and extensible. Each interpreter has access only to the data it needs, providing better encapsulation and security.

### Game State Management

```rust
pub struct GameState {
    pub seed: u16,
    pub frame: u16,
    pub tile_map: [[u8; 16]; 15], // 16x15 tiles
    pub status: GameStatus,
    pub characters: Vec<Character>,
    pub spawn_instances: Vec<SpawnInstance>,
    // Lookup tables for scripts and definitions
    pub action_lookup: Vec<Action>,
    pub condition_lookup: Vec<Condition>,
    pub spawn_lookup: Vec<Spawn>,
    pub status_effect_lookup: Vec<StatusEffect>,
}
```

## Data Models

### Game State Structure

```rust
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

    // Random number generator
    rng: SeededRng,
}

/// Current game status
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum GameStatus {
    Playing,
    Ended,
}
```

### Frame Processing Pipeline

Each `game_loop()` call executes the following pipeline:

1. **Status Check**: Return early if game status is `Ended`
2. **Frame Limit Check**: End game if frame >= 3840 (60 FPS × 64 seconds)
3. **Status Effect Processing**: Execute `tick_script` for all active status effects on all characters
4. **Character Behavior Processing**: For each character, evaluate behaviors top-to-bottom until one condition passes and action executes
5. **Physics Updates**: Update entity positions, velocities, and physics state (placeholder for future implementation)
6. **Collision Processing**: Handle entity-entity and entity-tilemap collisions (placeholder for future implementation)
7. **Entity Cleanup**: Remove expired spawn instances and validate game state
8. **Frame Increment**: Increment frame counter

### Serialization Formats

**Binary Format Structure:**

- Header: seed (2 bytes) + frame (2 bytes) + status (1 byte)
- Tilemap: 16×15 = 240 bytes
- Characters: count (1 byte) + character data (variable length per character)
- Spawn instances: count (1 byte) + spawn data (variable length per spawn)
- Lookup table sizes: 4 bytes for action, condition, spawn, and status effect counts

**JSON Format:** Human-readable representation with all game state including nested character behaviors, status effects, and spawn instances.

### Behavior System

Characters execute behaviors in priority order. Each behavior consists of:

1. **Condition**: Bytecode script that returns true/false
2. **Action**: Bytecode script that executes game actions

```rust
pub struct Condition {
    pub energy_mul: Fixed,    // Energy requirement multiplier
    pub args: [u8; 4],       // Script arguments
    pub script: Vec<u8>,     // Bytecode
}

pub struct Action {
    pub energy_cost: u8,
    pub duration: u16,       // Frames this action locks the character
    pub args: [u8; 4],
    pub script: Vec<u8>,
}
```

### Status Effects

Temporary effects that modify character behavior:

```rust
pub struct StatusEffect {
    pub duration: u16,
    pub stack_limit: u8,
    pub reset_on_stack: bool,
    pub on_script: Vec<u8>,   // Runs when applied
    pub tick_script: Vec<u8>, // Runs every frame
    pub off_script: Vec<u8>,  // Runs when removed
}
```

### Spawn Definitions

Templates for projectiles and temporary objects:

```rust
pub struct Spawn {
    pub damage_base: u8,
    pub health_cap: u8,
    pub duration: u16,
    pub element: Option<Element>,
    pub behavior_script: Vec<u8>,
    pub collision_script: Vec<u8>,
    pub despawn_script: Vec<u8>,
}
```

## Error Handling

The engine uses Result types for all fallible operations:

```rust
pub enum GameError {
    InvalidScript,
    SerializationError,
    InvalidGameState,
    ScriptExecutionError,
}

pub type GameResult<T> = Result<T, GameError>;
```

Error handling strategy:

- Script errors are contained and logged, but don't crash the game
- Serialization errors are propagated to the caller
- Invalid game states are rejected during initialization
- Runtime errors use graceful degradation where possible

## Testing Strategy

The engine includes comprehensive testing with 275+ tests covering all major systems:

### Test Organization

```rust
// Consolidated test utilities to reduce duplication
#[cfg(test)]
pub mod test_utils {
    pub fn create_test_character() -> Character; // Standard test character with full energy/health
    pub fn create_test_game_state() -> GameState; // Standard test game state with seed 12345
}
```

### Test Categories

1. **Unit Tests**: Individual module functionality

   - Math operations (fixed-point arithmetic, overflow handling)
   - Entity creation and property management
   - Script engine operator execution
   - Serialization/deserialization round-trips
   - Error handling and recovery

2. **Integration Tests**: Cross-module interactions

   - Complete behavior execution (condition → action → spawn creation)
   - Status effect application and processing
   - Cooldown system integration
   - Frame processing pipeline
   - Deterministic randomization

3. **Property-Based Tests**: System-wide properties

   - Serialization consistency across different game states
   - Deterministic execution with same seeds
   - Error recovery without crashes
   - Performance metrics and benchmarking

4. **Verification Tests**: Post-cleanup validation
   - Code cleanup verification (no broken functionality)
   - API workflow completeness
   - Cross-platform compatibility

### Test Coverage Areas

- **API Layer**: All three public functions (new_game, game_loop, game_state)
- **Script Engine**: All 90+ operators with various operand patterns
- **Entity System**: Character, spawn, and status effect lifecycle
- **Physics**: Tilemap collision detection and entity movement
- **Serialization**: Binary and JSON formats with error handling
- **Error Recovery**: Graceful degradation for all error types
- **Determinism**: Identical execution across platforms and runs

### Unit Testing

- Fixed-point arithmetic operations
- Individual script operators
- Entity collision detection
- Serialization/deserialization

### Integration Testing

- Complete game loop execution
- Multi-frame game scenarios
- Script execution with complex behaviors
- Cross-platform determinism verification

### Property-Based Testing

- Serialization round-trip consistency
- Deterministic execution with same seeds
- Fixed-point arithmetic properties
- Script execution bounds checking

### Performance Testing

- Frame processing time benchmarks
- Memory usage profiling
- Serialization size optimization
- Script execution performance

The testing approach ensures the engine maintains deterministic behavior across platforms while meeting performance requirements for both Solana's compute constraints and browser execution.
