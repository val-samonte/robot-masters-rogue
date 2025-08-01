//! Centralized address byte constants for operators and property accessors

/// Operator address constants for script operators
///
/// This module provides named constants for all operator byte values used in the scripting system,
/// improving code maintainability and reducing the risk of errors from hardcoded values.
pub mod operator_address {
    // ===== CONTROL FLOW OPERATORS (0-9) =====
    /// Exit script with specified flag
    pub const EXIT: u8 = 0;
    /// Exit if insufficient energy
    pub const EXIT_IF_NO_ENERGY: u8 = 1;
    /// Exit if action is on cooldown
    pub const EXIT_IF_COOLDOWN: u8 = 2;
    /// Skip specified number of bytes
    pub const SKIP: u8 = 3;
    /// Jump to specified position
    pub const GOTO: u8 = 4;

    // ===== PROPERTY OPERATIONS (10-11) =====
    /// Read property into variable: [ReadProp, var_index, prop_address]
    pub const READ_PROP: u8 = 10;
    /// Write variable to property: [WriteProp, prop_address, var_index]
    pub const WRITE_PROP: u8 = 11;

    // ===== VARIABLE OPERATIONS (20-24) =====
    /// Assign byte literal to variable: [AssignByte, var_index, literal_value]
    pub const ASSIGN_BYTE: u8 = 20;
    /// Assign fixed-point value: [AssignFixed, var_index, numerator, denominator]
    pub const ASSIGN_FIXED: u8 = 21;
    /// Assign random value: [AssignRandom, var_index]
    pub const ASSIGN_RANDOM: u8 = 22;
    /// Convert fixed to byte: [ToByte, to_var_index, from_fixed_index]
    pub const TO_BYTE: u8 = 23;
    /// Convert byte to fixed: [ToFixed, to_fixed_index, from_var_index]
    pub const TO_FIXED: u8 = 24;

    // ===== FIXED-POINT ARITHMETIC (30-34) =====
    /// Add fixed-point values: [Add, dest_fixed, left_fixed, right_fixed]
    pub const ADD: u8 = 30;
    /// Subtract fixed-point values: [Sub, dest_fixed, left_fixed, right_fixed]
    pub const SUB: u8 = 31;
    /// Multiply fixed-point values: [Mul, dest_fixed, left_fixed, right_fixed]
    pub const MUL: u8 = 32;
    /// Divide fixed-point values: [Div, dest_fixed, left_fixed, right_fixed]
    pub const DIV: u8 = 33;
    /// Negate fixed-point value: [Negate, fixed_index]
    pub const NEGATE: u8 = 34;

    // ===== BYTE ARITHMETIC (40-45) =====
    /// Add byte values: [AddByte, dest_var, left_var, right_var]
    pub const ADD_BYTE: u8 = 40;
    /// Subtract byte values: [SubByte, dest_var, left_var, right_var]
    pub const SUB_BYTE: u8 = 41;
    /// Multiply byte values: [MulByte, dest_var, left_var, right_var]
    pub const MUL_BYTE: u8 = 42;
    /// Divide byte values: [DivByte, dest_var, left_var, right_var]
    pub const DIV_BYTE: u8 = 43;
    /// Modulo byte values: [ModByte, dest_var, left_var, right_var]
    pub const MOD_BYTE: u8 = 44;
    /// Wrapping add byte values: [WrappingAdd, dest_var, left_var, right_var]
    pub const WRAPPING_ADD: u8 = 45;

    // ===== CONDITIONAL OPERATIONS (50-53) =====
    /// Equal comparison: [Equal, dest_var, left_var, right_var]
    pub const EQUAL: u8 = 50;
    /// Not equal comparison: [NotEqual, dest_var, left_var, right_var]
    pub const NOT_EQUAL: u8 = 51;
    /// Less than comparison: [LessThan, dest_var, left_var, right_var]
    pub const LESS_THAN: u8 = 52;
    /// Less than or equal comparison: [LessThanOrEqual, dest_var, left_var, right_var]
    pub const LESS_THAN_OR_EQUAL: u8 = 53;

    // ===== LOGICAL OPERATIONS (60-62) =====
    /// Logical NOT: [Not, dest_var, source_var]
    pub const NOT: u8 = 60;
    /// Logical OR: [Or, dest_var, left_var, right_var]
    pub const OR: u8 = 61;
    /// Logical AND: [And, dest_var, left_var, right_var]
    pub const AND: u8 = 62;

    // ===== UTILITY OPERATIONS (70-71) =====
    /// Minimum value: [Min, dest_var, left_var, right_var]
    pub const MIN: u8 = 70;
    /// Maximum value: [Max, dest_var, left_var, right_var]
    pub const MAX: u8 = 71;

    // ===== GAME ACTIONS (80-85) =====
    /// Lock current action
    pub const LOCK_ACTION: u8 = 80;
    /// Unlock current action
    pub const UNLOCK_ACTION: u8 = 81;
    /// Apply energy cost
    pub const APPLY_ENERGY_COST: u8 = 82;
    /// Apply duration
    pub const APPLY_DURATION: u8 = 83;
    /// Spawn entity: [Spawn, spawn_id_var]
    pub const SPAWN: u8 = 84;
    /// Spawn entity with variables: [SpawnWithVars, spawn_id_var, var1, var2, var3, var4]
    pub const SPAWN_WITH_VARS: u8 = 85;

    // ===== DEBUG OPERATIONS (90-91) =====
    /// Log variable value: [LogVariable, var_index]
    pub const LOG_VARIABLE: u8 = 90;
    /// Exit with variable value: [ExitWithVar, var_index]
    pub const EXIT_WITH_VAR: u8 = 91;

    // ===== ARGS AND SPAWNS ACCESS (96-98) =====
    /// Read argument to variable: [ReadArg, var_index, arg_index]
    pub const READ_ARG: u8 = 96;
    /// Read spawn ID to variable: [ReadSpawn, var_index, spawn_index]
    pub const READ_SPAWN: u8 = 97;
    /// Write variable to spawn ID: [WriteSpawn, spawn_index, var_index]
    pub const WRITE_SPAWN: u8 = 98;

    // ===== COOLDOWN OPERATIONS (100-103) =====
    /// Read action cooldown: [ReadActionCooldown, var_index]
    pub const READ_ACTION_COOLDOWN: u8 = 100;
    /// Read action last used timestamp: [ReadActionLastUsed, var_index]
    pub const READ_ACTION_LAST_USED: u8 = 101;
    /// Write action last used timestamp: [WriteActionLastUsed, var_index]
    pub const WRITE_ACTION_LAST_USED: u8 = 102;
    /// Check if action is on cooldown: [IsActionOnCooldown, var_index]
    pub const IS_ACTION_ON_COOLDOWN: u8 = 103;

    // ===== ENTITY PROPERTY ACCESS OPERATIONS (104-107) =====
    /// Read character property: [ReadCharacterProperty, character_id, var_index, property_address]
    pub const READ_CHARACTER_PROPERTY: u8 = 104;
    /// Write character property: [WriteCharacterProperty, character_id, property_address, var_index]
    pub const WRITE_CHARACTER_PROPERTY: u8 = 105;
    /// Read spawn property: [ReadSpawnProperty, spawn_instance_id, var_index, property_address]
    pub const READ_SPAWN_PROPERTY: u8 = 106;
    /// Write spawn property: [WriteSpawnProperty, spawn_instance_id, property_address, var_index]
    pub const WRITE_SPAWN_PROPERTY: u8 = 107;
}

/// Property address constants for script property access
///
/// These constants define the property addresses used in ReadProp and WriteProp operations.
/// They are organized by category and data type for easier maintenance.
/// Properties are divided into definition properties (static, shared) and instance properties (runtime, per-instance).
pub mod property_address {
    // ===== GAME STATE PROPERTIES (0x01-0x03) =====
    /// Game seed value
    pub const GAME_SEED: u8 = 0x01;
    /// Current game frame
    pub const GAME_FRAME: u8 = 0x02;
    /// Game gravity value
    pub const GAME_GRAVITY: u8 = 0x03;

    // ===== ACTION DEFINITION PROPERTIES (0x04-0x0F) =====
    /// Action energy cost (byte) - from definition
    pub const ACTION_DEF_ENERGY_COST: u8 = 0x04;
    /// Action interval (fixed-point) - from definition
    pub const ACTION_DEF_INTERVAL: u8 = 0x05;
    /// Action duration (fixed-point) - from definition
    pub const ACTION_DEF_DURATION: u8 = 0x06;
    /// Action cooldown (fixed-point) - from definition
    pub const ACTION_DEF_COOLDOWN: u8 = 0x07;
    /// Action args[0] (byte) - from definition
    pub const ACTION_DEF_ARG0: u8 = 0x08;
    /// Action args[1] (byte) - from definition
    pub const ACTION_DEF_ARG1: u8 = 0x09;
    /// Action args[2] (byte) - from definition
    pub const ACTION_DEF_ARG2: u8 = 0x0A;
    /// Action args[3] (byte) - from definition
    pub const ACTION_DEF_ARG3: u8 = 0x0B;
    /// Action args[4] (byte) - from definition
    pub const ACTION_DEF_ARG4: u8 = 0x0C;
    /// Action args[5] (byte) - from definition
    pub const ACTION_DEF_ARG5: u8 = 0x0D;
    /// Action args[6] (byte) - from definition
    pub const ACTION_DEF_ARG6: u8 = 0x0E;
    /// Action args[7] (byte) - from definition
    pub const ACTION_DEF_ARG7: u8 = 0x0F;

    // ===== CONDITION DEFINITION PROPERTIES (0x10-0x1B) =====
    /// Condition ID (byte) - from definition
    pub const CONDITION_DEF_ID: u8 = 0x10;
    /// Condition energy multiplier (fixed-point) - from definition
    pub const CONDITION_DEF_ENERGY_MUL: u8 = 0x11;
    /// Condition args[0] (byte) - from definition
    pub const CONDITION_DEF_ARG0: u8 = 0x12;
    /// Condition args[1] (byte) - from definition
    pub const CONDITION_DEF_ARG1: u8 = 0x13;
    /// Condition args[2] (byte) - from definition
    pub const CONDITION_DEF_ARG2: u8 = 0x14;
    /// Condition args[3] (byte) - from definition
    pub const CONDITION_DEF_ARG3: u8 = 0x15;
    /// Condition args[4] (byte) - from definition
    pub const CONDITION_DEF_ARG4: u8 = 0x16;
    /// Condition args[5] (byte) - from definition
    pub const CONDITION_DEF_ARG5: u8 = 0x17;
    /// Condition args[6] (byte) - from definition
    pub const CONDITION_DEF_ARG6: u8 = 0x18;
    /// Condition args[7] (byte) - from definition
    pub const CONDITION_DEF_ARG7: u8 = 0x19;

    // ===== STATUS EFFECT DEFINITION PROPERTIES (0x1A-0x1F) =====
    /// Status effect duration (fixed-point) - from definition
    pub const STATUS_EFFECT_DEF_DURATION: u8 = 0x1A;
    /// Status effect stack limit (byte) - from definition
    pub const STATUS_EFFECT_DEF_STACK_LIMIT: u8 = 0x1B;
    /// Status effect reset on stack flag (byte) - from definition
    pub const STATUS_EFFECT_DEF_RESET_ON_STACK: u8 = 0x1C;
    /// Status effect args[0] (byte) - from definition
    pub const STATUS_EFFECT_DEF_ARG0: u8 = 0x1D;
    /// Status effect args[1] (byte) - from definition
    pub const STATUS_EFFECT_DEF_ARG1: u8 = 0x1E;
    /// Status effect args[2] (byte) - from definition
    pub const STATUS_EFFECT_DEF_ARG2: u8 = 0x1F;

    // ===== SPAWN DEFINITION PROPERTIES (0x5A-0x69) =====
    /// Spawn definition damage base (u16) - from definition
    pub const SPAWN_DEF_DAMAGE_BASE: u8 = 0x5A;
    /// Spawn definition damage range (u16) - from definition
    pub const SPAWN_DEF_DAMAGE_RANGE: u8 = 0x5B;
    /// Spawn definition crit chance (byte) - from definition
    pub const SPAWN_DEF_CRIT_CHANCE: u8 = 0x5C;
    /// Spawn definition crit multiplier (byte) - from definition
    pub const SPAWN_DEF_CRIT_MULTIPLIER: u8 = 0x5D;
    /// Spawn definition chance (byte) - from definition
    pub const SPAWN_DEF_CHANCE: u8 = 0x5E;
    /// Spawn definition health cap (byte) - from definition
    pub const SPAWN_DEF_HEALTH_CAP: u8 = 0x5F;
    /// Spawn definition duration (fixed-point) - from definition
    pub const SPAWN_DEF_DURATION: u8 = 0x65;
    /// Spawn definition element (byte) - from definition
    pub const SPAWN_DEF_ELEMENT: u8 = 0x66;
    /// Spawn definition args[0] (byte) - from definition
    pub const SPAWN_DEF_ARG0: u8 = 0x67;
    /// Spawn definition args[1] (byte) - from definition
    pub const SPAWN_DEF_ARG1: u8 = 0x68;
    /// Spawn definition args[2] (byte) - from definition
    pub const SPAWN_DEF_ARG2: u8 = 0x69;
    /// Spawn definition args[3] (byte) - from definition
    pub const SPAWN_DEF_ARG3: u8 = 0x6A;

    // ===== CHARACTER CORE PROPERTIES (0x20-0x2F) =====
    /// Character ID (byte)
    pub const CHARACTER_ID: u8 = 0x20;
    /// Character group (byte)
    pub const CHARACTER_GROUP: u8 = 0x21;
    /// Character position X (fixed-point)
    pub const CHARACTER_POS_X: u8 = 0x22;
    /// Character position Y (fixed-point)
    pub const CHARACTER_POS_Y: u8 = 0x23;
    /// Character velocity X (fixed-point)
    pub const CHARACTER_VEL_X: u8 = 0x24;
    /// Character velocity Y (fixed-point)
    pub const CHARACTER_VEL_Y: u8 = 0x25;
    /// Character size width (fixed-point)
    pub const CHARACTER_SIZE_W: u8 = 0x26;
    /// Character size height (fixed-point)
    pub const CHARACTER_SIZE_H: u8 = 0x27;
    /// Character health (fixed-point, u16)
    pub const CHARACTER_HEALTH: u8 = 0x28;
    /// Character energy (byte)
    pub const CHARACTER_ENERGY: u8 = 0x29;
    /// Character energy cap (byte)
    pub const CHARACTER_ENERGY_CAP: u8 = 0x2A;
    /// Character health cap (fixed-point, u16)
    pub const CHARACTER_HEALTH_CAP: u8 = 0x2B;
    /// Character power (byte)
    pub const CHARACTER_POWER: u8 = 0x2C;
    /// Character weight (byte)
    pub const CHARACTER_WEIGHT: u8 = 0x2D;
    /// Character jump force (fixed-point)
    pub const CHARACTER_JUMP_FORCE: u8 = 0x2E;
    /// Character move speed (fixed-point)
    pub const CHARACTER_MOVE_SPEED: u8 = 0x2F;
    /// Passive energy recovery amount per rate (byte)
    pub const CHARACTER_ENERGY_REGEN: u8 = 0x30;
    /// Tick interval for passive energy recovery (byte)
    pub const CHARACTER_ENERGY_REGEN_RATE: u8 = 0x31;
    /// Active energy recovery amount per rate during Charge action (byte)
    pub const CHARACTER_ENERGY_CHARGE: u8 = 0x32;
    /// Tick interval for active energy recovery during Charge action (byte)
    pub const CHARACTER_ENERGY_CHARGE_RATE: u8 = 0x33;
    /// Locked action instance ID (byte)
    pub const CHARACTER_LOCKED_ACTION_ID: u8 = 0x34;

    // ===== CHARACTER COLLISION FLAGS (0x35-0x38) =====
    /// Top collision flag (byte: 0 or 1)
    pub const CHARACTER_COLLISION_TOP: u8 = 0x35;
    /// Right collision flag (byte: 0 or 1)
    pub const CHARACTER_COLLISION_RIGHT: u8 = 0x36;
    /// Bottom collision flag (byte: 0 or 1)
    pub const CHARACTER_COLLISION_BOTTOM: u8 = 0x37;
    /// Left collision flag (byte: 0 or 1)
    pub const CHARACTER_COLLISION_LEFT: u8 = 0x38;

    // ===== CHARACTER STATUS EFFECTS (0x39-0x39) =====
    /// Number of active status effects (byte)
    pub const CHARACTER_STATUS_EFFECT_COUNT: u8 = 0x39;

    // ===== CHARACTER ARMOR VALUES (0x40-0x48) =====
    /// Armor value for Punct element (byte)
    pub const CHARACTER_ARMOR_PUNCT: u8 = 0x40;
    /// Armor value for Blast element (byte)
    pub const CHARACTER_ARMOR_BLAST: u8 = 0x41;
    /// Armor value for Force element (byte)
    pub const CHARACTER_ARMOR_FORCE: u8 = 0x42;
    /// Armor value for Sever element (byte)
    pub const CHARACTER_ARMOR_SEVER: u8 = 0x43;
    /// Armor value for Heat element (byte)
    pub const CHARACTER_ARMOR_HEAT: u8 = 0x44;
    /// Armor value for Cryo element (byte)
    pub const CHARACTER_ARMOR_CRYO: u8 = 0x45;
    /// Armor value for Jolt element (byte)
    pub const CHARACTER_ARMOR_JOLT: u8 = 0x46;
    /// Armor value for Acid element (byte)
    pub const CHARACTER_ARMOR_ACID: u8 = 0x47;
    /// Armor value for Virus element (byte)
    pub const CHARACTER_ARMOR_VIRUS: u8 = 0x48;

    // ===== ENTITY CORE PROPERTIES (0x50-0x68) =====
    /// Entity facing direction (byte: 0=left, 1=right, converts to Fixed -1.0/1.0)
    pub const ENTITY_FACING: u8 = 0x50;
    /// Entity gravity direction (byte: 0=upward, 1=downward, converts to Fixed -1.0/1.0)
    pub const ENTITY_GRAVITY_DIR: u8 = 0x51;
    /// Entity direction tuple (dir.0, dir.1) - consolidated facing and gravity
    pub const ENTITY_DIR_X: u8 = 0x60;
    /// Entity direction tuple (dir.0, dir.1) - consolidated facing and gravity
    pub const ENTITY_DIR_Y: u8 = 0x61;
    /// Entity enmity level (byte)
    pub const ENTITY_ENMITY: u8 = 0x62;
    /// Entity target ID (byte) - Option<EntityId>
    pub const ENTITY_TARGET_ID: u8 = 0x63;
    /// Entity target type (byte)
    pub const ENTITY_TARGET_TYPE: u8 = 0x64;

    // ===== SPAWN INSTANCE CORE PROPERTIES (0x52-0x5E) =====
    /// Spawn core ID (byte)
    pub const SPAWN_CORE_ID: u8 = 0x52;
    /// Spawn owner ID (EntityId) - from instance
    pub const SPAWN_OWNER_ID: u8 = 0x53;
    /// Spawn owner type (byte) - from instance
    pub const SPAWN_OWNER_TYPE: u8 = 0x54;
    /// Spawn position X (fixed-point)
    pub const SPAWN_POS_X: u8 = 0x55;
    /// Spawn position Y (fixed-point)
    pub const SPAWN_POS_Y: u8 = 0x56;
    /// Spawn velocity X (fixed-point)
    pub const SPAWN_VEL_X: u8 = 0x57;
    /// Spawn velocity Y (fixed-point)
    pub const SPAWN_VEL_Y: u8 = 0x58;
    /// Spawn health (u16) - from instance
    pub const SPAWN_HEALTH: u8 = 0x70;
    /// Spawn health cap (u16) - from instance
    pub const SPAWN_HEALTH_CAP: u8 = 0x71;
    /// Spawn rotation (fixed-point) - from instance
    pub const SPAWN_ROTATION: u8 = 0x72;
    /// Spawn life span (u16) - from instance
    pub const SPAWN_LIFE_SPAN: u8 = 0x73;

    // ===== ACTION INSTANCE PROPERTIES (0x80-0x8B) =====
    /// Action instance runtime_vars[0] (byte) - from instance
    pub const ACTION_INST_VAR0: u8 = 0x80;
    /// Action instance runtime_vars[1] (byte) - from instance
    pub const ACTION_INST_VAR1: u8 = 0x81;
    /// Action instance runtime_vars[2] (byte) - from instance
    pub const ACTION_INST_VAR2: u8 = 0x82;
    /// Action instance runtime_vars[3] (byte) - from instance
    pub const ACTION_INST_VAR3: u8 = 0x83;
    /// Action instance runtime_fixed[0] (fixed-point) - from instance
    pub const ACTION_INST_FIXED0: u8 = 0x84;
    /// Action instance runtime_fixed[1] (fixed-point) - from instance
    pub const ACTION_INST_FIXED1: u8 = 0x85;
    /// Action instance runtime_fixed[2] (fixed-point) - from instance
    pub const ACTION_INST_FIXED2: u8 = 0x86;
    /// Action instance runtime_fixed[3] (fixed-point) - from instance
    pub const ACTION_INST_FIXED3: u8 = 0x87;
    /// Action instance cooldown (fixed-point) - from instance
    pub const ACTION_INST_COOLDOWN: u8 = 0x88;
    /// Action instance last used frame (fixed-point) - from instance
    pub const ACTION_INST_LAST_USED_FRAME: u8 = 0x89;

    // ===== CONDITION INSTANCE PROPERTIES (0x90-0x97) =====
    /// Condition instance runtime_vars[0] (byte) - from instance
    pub const CONDITION_INST_VAR0: u8 = 0x90;
    /// Condition instance runtime_vars[1] (byte) - from instance
    pub const CONDITION_INST_VAR1: u8 = 0x91;
    /// Condition instance runtime_vars[2] (byte) - from instance
    pub const CONDITION_INST_VAR2: u8 = 0x92;
    /// Condition instance runtime_vars[3] (byte) - from instance
    pub const CONDITION_INST_VAR3: u8 = 0x93;
    /// Condition instance runtime_fixed[0] (fixed-point) - from instance
    pub const CONDITION_INST_FIXED0: u8 = 0x94;
    /// Condition instance runtime_fixed[1] (fixed-point) - from instance
    pub const CONDITION_INST_FIXED1: u8 = 0x95;
    /// Condition instance runtime_fixed[2] (fixed-point) - from instance
    pub const CONDITION_INST_FIXED2: u8 = 0x96;
    /// Condition instance runtime_fixed[3] (fixed-point) - from instance
    pub const CONDITION_INST_FIXED3: u8 = 0x97;

    // ===== STATUS EFFECT INSTANCE PROPERTIES (0xA0-0xA9) =====
    /// Status effect instance vars[0] (byte) - from instance
    pub const STATUS_EFFECT_INST_VAR0: u8 = 0xA0;
    /// Status effect instance vars[1] (byte) - from instance
    pub const STATUS_EFFECT_INST_VAR1: u8 = 0xA1;
    /// Status effect instance vars[2] (byte) - from instance
    pub const STATUS_EFFECT_INST_VAR2: u8 = 0xA2;
    /// Status effect instance vars[3] (byte) - from instance
    pub const STATUS_EFFECT_INST_VAR3: u8 = 0xA3;
    /// Status effect instance fixed[0] (fixed-point) - from instance
    pub const STATUS_EFFECT_INST_FIXED0: u8 = 0xA4;
    /// Status effect instance fixed[1] (fixed-point) - from instance
    pub const STATUS_EFFECT_INST_FIXED1: u8 = 0xA5;
    /// Status effect instance fixed[2] (fixed-point) - from instance
    pub const STATUS_EFFECT_INST_FIXED2: u8 = 0xA6;
    /// Status effect instance fixed[3] (fixed-point) - from instance
    pub const STATUS_EFFECT_INST_FIXED3: u8 = 0xA7;
    /// Status effect instance remaining duration (fixed-point) - from instance
    pub const STATUS_EFFECT_INST_REMAINING_DURATION: u8 = 0xA8;
    /// Status effect instance stack count (byte) - from instance
    pub const STATUS_EFFECT_INST_STACK_COUNT: u8 = 0xA9;

    // ===== SPAWN INSTANCE PROPERTIES (0xB0-0xB9) =====
    /// Spawn instance runtime_vars[0] (byte) - from instance
    pub const SPAWN_INST_VAR0: u8 = 0xB0;
    /// Spawn instance runtime_vars[1] (byte) - from instance
    pub const SPAWN_INST_VAR1: u8 = 0xB1;
    /// Spawn instance runtime_vars[2] (byte) - from instance
    pub const SPAWN_INST_VAR2: u8 = 0xB2;
    /// Spawn instance runtime_vars[3] (byte) - from instance
    pub const SPAWN_INST_VAR3: u8 = 0xB3;
    /// Spawn instance runtime_fixed[0] (fixed-point) - from instance
    pub const SPAWN_INST_FIXED0: u8 = 0xB4;
    /// Spawn instance runtime_fixed[1] (fixed-point) - from instance
    pub const SPAWN_INST_FIXED1: u8 = 0xB5;
    /// Spawn instance runtime_fixed[2] (fixed-point) - from instance
    pub const SPAWN_INST_FIXED2: u8 = 0xB6;
    /// Spawn instance runtime_fixed[3] (fixed-point) - from instance
    pub const SPAWN_INST_FIXED3: u8 = 0xB7;
    /// Spawn instance lifespan (fixed-point) - from instance
    pub const SPAWN_INST_LIFESPAN: u8 = 0xB8;
    /// Spawn instance element (byte) - from instance
    pub const SPAWN_INST_ELEMENT: u8 = 0xB9;
}
