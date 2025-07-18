# Design Document

## Overview

The Robot Masters Game Engine is architected as a pure, deterministic computation library that operates entirely in no_std Rust. The engine follows a data-driven design where game behavior is defined through bytecode scripts rather than hardcoded logic. The core architecture separates concerns into distinct modules: fixed-point mathematics, entity management, scripting engine, and serialization.

The engine operates on a tick-based system where each frame advances the game state deterministically. All randomness is seeded, all arithmetic uses fixed-point numbers, and all behavior is script-driven to ensure identical execution across different platforms.

The design incorporates lessons learned from the existing codebase, particularly around efficient bytecode operator mapping and property access patterns to ensure scalable script execution.

## Architecture

### Core Engine Structure

```
Game Engine (no_std)
├── Math Module (Fixed-point arithmetic, trigonometry tables)
├── Entity System (Characters, Spawns, Status Effects)
├── Script Engine (Bytecode interpreter)
├── Physics System (Collision detection, movement)
├── Game State (Serializable game world state)
└── Public API (new_game, game_loop, game_state functions)
```

### Data Flow

1. **Initialization**: Game receives seed, tilemap, entity definitions, and scripts
2. **Frame Processing**: Each game_loop() call processes one frame (1/60th second)
3. **Script Execution**: Bytecode scripts determine entity behaviors
4. **Physics Update**: Positions, velocities, and collisions are resolved
5. **State Management**: Game state is updated and can be serialized

### Platform Integration

The engine exposes three primary functions:

- `new_game()`: Initializes a new game instance with seed, tilemap, and entity definitions
- `game_loop()`: Advances game state by one frame
- `game_state()`: Returns current state as JSON or serialized bytes

Platform-specific projects (WASM bindings, Solana programs) consume these functions without the engine needing platform-specific code.

### Logging System

The engine includes a malleable logging system that adapts to different environments:

```rust
// Logging trait that can be implemented for different platforms
pub trait Logger {
    fn log(&self, message: &str);
    fn debug(&self, message: &str);
    fn error(&self, message: &str);
}

// Platform-specific implementations
#[cfg(target_arch = "wasm32")]
pub struct WasmLogger;

impl Logger for WasmLogger {
    fn log(&self, message: &str) {
        web_sys::console::log_1(&message.into());
    }
}

// For Solana (using msg! macro)
#[cfg(feature = "solana")]
pub struct SolanaLogger;

impl Logger for SolanaLogger {
    fn log(&self, message: &str) {
        msg!("{}", message);
    }
}
```

## Components and Interfaces

### Fixed-Point Mathematics

```rust
// 5-bit precision fixed-point number for optimal storage/performance balance
pub struct Fixed(i16);

impl Fixed {
    const FRACTIONAL_BITS: u32 = 5;
    const ONE: Fixed = Fixed(1 << 5); // 32

    // Core arithmetic operations
    pub fn add(self, other: Fixed) -> Fixed;
    pub fn mul(self, other: Fixed) -> Fixed;
    // ... other operations
}

// Precomputed trigonometry tables for performance
pub struct TrigTables {
    sin_table: [Fixed; 360],    // 1-degree precision
    cos_table: [Fixed; 360],
    atan2_table: [[u8; 256]; 256], // Returns angle in degrees
}
```

### Entity System

```rust
// Base entity properties shared by all game objects
pub struct EntityCore {
    pub id: u8,
    pub group: u8,
    pub pos: (Fixed, Fixed),
    pub vel: (Fixed, Fixed),
    pub size: (u8, u8),
    pub collision: (bool, bool, bool, bool), // top, right, bottom, left
}

// Programmable fighting characters
pub struct Character {
    pub core: EntityCore,
    pub health: u8,
    pub energy: u8,
    pub elemental_immunity: [u8; 8], // Armor values for all 8 elements (baseline 100)
    pub behaviors: Vec<(ConditionId, ActionId)>,
    pub locked_action: Option<ActionInstanceId>,
    pub status_effects: Vec<StatusEffectInstance>,
    // ... additional character-specific properties
}

// Projectiles and temporary objects
pub struct SpawnInstance {
    pub core: EntityCore,
    pub spawn_id: SpawnLookupId,
    pub owner_id: CharacterId,
    pub lifespan: u16,
    pub element: Element, // Element type carried by this spawn
    pub vars: [u8; 4], // Script variables
    // ... additional spawn properties
}
```

### Elemental System

The elemental system provides strategic depth through damage types and character resistances. Each character has immunity values for all 8 elements, and spawns carry exactly one element type.

```rust
/// Element types for damage and interactions
#[repr(u8)]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Element {
    // Damage/Armor types (0-3) - affect physical damage calculation
    DamagePunct = 0, // Puncture/piercing - goes through multiple enemies and walls
    Blast = 1,       // Explosive AOE damage
    Force = 2,       // Blunt weapons - impact damage, bonus based on entity weight if melee
    Sever = 3,       // Critical chance (x1.5 to x2 damage)

    // Debuff/Resistance types (4-7) - affect status effect application
    Heat = 4,        // Applies overtime burning effect
    Cryo = 5,        // Applies slow movement/cooldown, frostbite (max HP % damage)
    Jolt = 6,        // Energy altering - slow recharging, energy damage, energy leak
    Virus = 7,       // Alters target behavior - inject erratic bugs, disable behaviors
}

impl Element {
    /// Returns true if this element is a damage/armor type (first 4 elements)
    pub fn is_damage_type(&self) -> bool {
        (*self as u8) < 4
    }

    /// Returns true if this element is a debuff/resistance type (last 4 elements)
    pub fn is_debuff_type(&self) -> bool {
        (*self as u8) >= 4
    }

    /// Convert from u8 value
    pub fn from_u8(value: u8) -> Option<Element> {
        if value < 8 {
            Some(unsafe { core::mem::transmute(value) })
        } else {
            None
        }
    }
}

/// Character elemental immunity values (0-255, baseline 100)
/// Lower values = more vulnerable, higher values = more resistant
#[derive(Debug, Clone)]
pub struct ElementalImmunity {
    pub damage_punct: u8,  // Resistance to puncture/piercing damage
    pub blast: u8,         // Resistance to explosive damage
    pub force: u8,         // Resistance to blunt/impact damage
    pub sever: u8,         // Resistance to critical/cutting damage
    pub heat: u8,          // Resistance to burning effects
    pub cryo: u8,          // Resistance to freezing/slowing effects
    pub jolt: u8,          // Resistance to energy disruption effects
    pub virus: u8,         // Resistance to behavior alteration effects
}

impl ElementalImmunity {
    /// Create default immunity values (baseline 100 for all elements)
    pub fn default() -> Self {
        Self {
            damage_punct: 100,
            blast: 100,
            force: 100,
            sever: 100,
            heat: 100,
            cryo: 100,
            jolt: 100,
            virus: 100,
        }
    }

    /// Get immunity value for a specific element
    pub fn get_immunity(&self, element: Element) -> u8 {
        match element {
            Element::DamagePunct => self.damage_punct,
            Element::Blast => self.blast,
            Element::Force => self.force,
            Element::Sever => self.sever,
            Element::Heat => self.heat,
            Element::Cryo => self.cryo,
            Element::Jolt => self.jolt,
            Element::Virus => self.virus,
        }
    }

    /// Set immunity value for a specific element
    pub fn set_immunity(&mut self, element: Element, value: u8) {
        match element {
            Element::DamagePunct => self.damage_punct = value,
            Element::Blast => self.blast = value,
            Element::Force => self.force = value,
            Element::Sever => self.sever = value,
            Element::Heat => self.heat = value,
            Element::Cryo => self.cryo = value,
            Element::Jolt => self.jolt = value,
            Element::Virus => self.virus = value,
        }
    }
}
```

### Script Engine

The script engine uses a scalable approach that improves upon traditional match-based interpreters. While still using match syntax for clarity and performance, it eliminates repetitive code through structured operand patterns and generic operation handling.

The script system now supports enhanced parameter passing through a read-only args array and working variables through a vars array, enabling reusable script components like configurable actions (e.g., a Shoot action with different ammo capacities).

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
// Base script execution engine with shared operators
pub struct ScriptEngine {
    // Execution state
    pub pos: usize,
    pub exit_flag: u8,
    pub vars: [u8; 8],           // Byte variables
    pub fixed: [Fixed; 4],       // Fixed-point variables
}

// Condition interpreter for behavior evaluation
pub struct ConditionInterpreter<'a> {
    pub engine: ScriptEngine,
    pub game_state: &'a GameState,
    pub character: &'a Character,
    pub condition: &'a Condition,
}

// Action interpreter for behavior execution
pub struct ActionInterpreter<'a> {
    pub engine: ScriptEngine,
    pub to_spawn: Vec<SpawnInstance>,
    pub game_state: &'a mut GameState,
    pub character: &'a mut Character,
    pub action: &'a Action,
    pub condition: &'a Condition,
    pub action_instance_id: usize,
}

// Spawn interpreter for projectile lifecycle
pub struct SpawnInterpreter<'a> {
    pub engine: ScriptEngine,
    pub to_spawn: Vec<SpawnInstance>,
    pub game_state: &'a mut GameState,
    pub spawn_instance: &'a mut SpawnInstance,
    pub spawn_def: &'a Spawn,
}

// Status effect interpreter for temporary effects
pub struct StatusEffectInterpreter<'a> {
    pub engine: ScriptEngine,
    pub game_state: &'a mut GameState,
    pub character: &'a mut Character,
    pub status_instance: &'a mut StatusEffectInstance,
    pub status_def: &'a StatusEffect,
}

// Bytecode operators with explicit byte values
#[repr(u8)]
pub enum Operator {
    // Control flow
    Exit = 0,
    ExitIfNoEnergy = 1,
    ExitIfCooldown = 2,
    Skip = 3,
    Goto = 4,

    // Property operations (scalable approach)
    ReadProp = 10,   // [ReadProp, var_index, prop_address]
    WriteProp = 11,  // [WriteProp, prop_address, var_index]

    // Variable operations
    AssignByte = 20,     // [AssignByte, var_index, literal_value]
    AssignFixed = 21,    // [AssignFixed, var_index, numerator, denominator]
    AssignRandom = 22,   // [AssignRandom, var_index]
    ToByte = 23,         // [ToByte, to_var_index, from_fixed_index]
    ToFixed = 24,        // [ToFixed, to_fixed_index, from_var_index]

    // Arithmetic (Fixed-point) - generic 3-operand pattern
    Add = 30,      // [Add, dest_fixed, left_fixed, right_fixed]
    Sub = 31,      // [Sub, dest_fixed, left_fixed, right_fixed]
    Mul = 32,      // [Mul, dest_fixed, left_fixed, right_fixed]
    Div = 33,      // [Div, dest_fixed, left_fixed, right_fixed]
    Negate = 34,   // [Negate, fixed_index]

    // Arithmetic (Byte) - generic 3-operand pattern
    AddByte = 40,        // [AddByte, dest_var, left_var, right_var]
    SubByte = 41,        // [SubByte, dest_var, left_var, right_var]
    MulByte = 42,        // [MulByte, dest_var, left_var, right_var]
    DivByte = 43,        // [DivByte, dest_var, left_var, right_var]
    ModByte = 44,        // [ModByte, dest_var, left_var, right_var]
    WrappingAdd = 45,    // [WrappingAdd, dest_var, left_var, right_var]

    // Conditionals - generic 3-operand pattern
    Equal = 50,          // [Equal, dest_var, left_var, right_var]
    NotEqual = 51,       // [NotEqual, dest_var, left_var, right_var]
    LessThan = 52,       // [LessThan, dest_var, left_var, right_var]
    LessThanOrEqual = 53, // [LessThanOrEqual, dest_var, left_var, right_var]

    // Logical operations - generic patterns
    Not = 60,            // [Not, dest_var, source_var]
    Or = 61,             // [Or, dest_var, left_var, right_var]
    And = 62,            // [And, dest_var, left_var, right_var]

    // Utility operations
    Min = 70,            // [Min, dest_var, left_var, right_var]
    Max = 71,            // [Max, dest_var, left_var, right_var]

    // Game actions
    LockAction = 80,
    UnlockAction = 81,
    ApplyEnergyCost = 82,
    ApplyDuration = 83,
    Spawn = 84,          // [Spawn, spawn_id_var]
    SpawnWithVars = 85,  // [SpawnWithVars, spawn_id_var, var1, var2, var3, var4]

    // Debug
    LogVariable = 90,    // [LogVariable, var_index]
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
