//! Centralized address byte constants for operators and property accessors

/// Operator address constants for script operators
///
/// This enum provides named constants for all operator byte values used in the scripting system,
/// improving code maintainability and reducing the risk of errors from hardcoded values.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
#[repr(u8)]
pub enum OperatorAddress {
    // ===== CONTROL FLOW OPERATORS (0-9) =====
    /// Exit script with specified flag
    Exit = 0,
    /// Exit if insufficient energy
    ExitIfNoEnergy = 1,
    /// Exit if action is on cooldown
    ExitIfCooldown = 2,
    /// Skip specified number of bytes
    Skip = 3,
    /// Jump to specified position
    Goto = 4,

    // ===== PROPERTY OPERATIONS (10-11) =====
    /// Read property into variable: [ReadProp, var_index, prop_address]
    ReadProp = 10,
    /// Write variable to property: [WriteProp, prop_address, var_index]
    WriteProp = 11,

    // ===== VARIABLE OPERATIONS (20-24) =====
    /// Assign byte literal to variable: [AssignByte, var_index, literal_value]
    AssignByte = 20,
    /// Assign fixed-point value: [AssignFixed, var_index, numerator, denominator]
    AssignFixed = 21,
    /// Assign random value: [AssignRandom, var_index]
    AssignRandom = 22,
    /// Convert fixed to byte: [ToByte, to_var_index, from_fixed_index]
    ToByte = 23,
    /// Convert byte to fixed: [ToFixed, to_fixed_index, from_var_index]
    ToFixed = 24,

    // ===== FIXED-POINT ARITHMETIC (30-34) =====
    /// Add fixed-point values: [Add, dest_fixed, left_fixed, right_fixed]
    Add = 30,
    /// Subtract fixed-point values: [Sub, dest_fixed, left_fixed, right_fixed]
    Sub = 31,
    /// Multiply fixed-point values: [Mul, dest_fixed, left_fixed, right_fixed]
    Mul = 32,
    /// Divide fixed-point values: [Div, dest_fixed, left_fixed, right_fixed]
    Div = 33,
    /// Negate fixed-point value: [Negate, fixed_index]
    Negate = 34,

    // ===== BYTE ARITHMETIC (40-45) =====
    /// Add byte values: [AddByte, dest_var, left_var, right_var]
    AddByte = 40,
    /// Subtract byte values: [SubByte, dest_var, left_var, right_var]
    SubByte = 41,
    /// Multiply byte values: [MulByte, dest_var, left_var, right_var]
    MulByte = 42,
    /// Divide byte values: [DivByte, dest_var, left_var, right_var]
    DivByte = 43,
    /// Modulo byte values: [ModByte, dest_var, left_var, right_var]
    ModByte = 44,
    /// Wrapping add byte values: [WrappingAdd, dest_var, left_var, right_var]
    WrappingAdd = 45,

    // ===== CONDITIONAL OPERATIONS (50-53) =====
    /// Equal comparison: [Equal, dest_var, left_var, right_var]
    Equal = 50,
    /// Not equal comparison: [NotEqual, dest_var, left_var, right_var]
    NotEqual = 51,
    /// Less than comparison: [LessThan, dest_var, left_var, right_var]
    LessThan = 52,
    /// Less than or equal comparison: [LessThanOrEqual, dest_var, left_var, right_var]
    LessThanOrEqual = 53,

    // ===== LOGICAL OPERATIONS (60-62) =====
    /// Logical NOT: [Not, dest_var, source_var]
    Not = 60,
    /// Logical OR: [Or, dest_var, left_var, right_var]
    Or = 61,
    /// Logical AND: [And, dest_var, left_var, right_var]
    And = 62,

    // ===== UTILITY OPERATIONS (70-71) =====
    /// Minimum value: [Min, dest_var, left_var, right_var]
    Min = 70,
    /// Maximum value: [Max, dest_var, left_var, right_var]
    Max = 71,

    // ===== GAME ACTIONS (80-85) =====
    /// Lock current action
    LockAction = 80,
    /// Unlock current action
    UnlockAction = 81,
    /// Apply energy cost
    ApplyEnergyCost = 82,
    /// Apply duration
    ApplyDuration = 83,
    /// Spawn entity: [Spawn, spawn_id_var]
    Spawn = 84,
    /// Spawn entity with variables: [SpawnWithVars, spawn_id_var, var1, var2, var3, var4]
    SpawnWithVars = 85,

    // ===== DEBUG AND COOLDOWN OPERATIONS (90-98) =====
    /// Log variable value: [LogVariable, var_index]
    LogVariable = 90,
    /// Exit with variable value: [ExitWithVar, var_index]
    ExitWithVar = 91,
    /// Read action cooldown: [ReadActionCooldown, var_index]
    ReadActionCooldown = 92,
    /// Read action last used timestamp: [ReadActionLastUsed, var_index]
    ReadActionLastUsed = 93,
    /// Write action last used timestamp: [WriteActionLastUsed, var_index]
    WriteActionLastUsed = 94,
    /// Check if action is on cooldown: [IsActionOnCooldown, var_index]
    IsActionOnCooldown = 95,
    /// Read argument to variable: [ReadArg, var_index, arg_index]
    ReadArg = 96,
    /// Read spawn ID to variable: [ReadSpawn, var_index, spawn_index]
    ReadSpawn = 97,
    /// Write variable to spawn ID: [WriteSpawn, spawn_index, var_index]
    WriteSpawn = 98,
}

/// Property address constants for script property access
///
/// These constants define the property addresses used in ReadProp and WriteProp operations.
/// They are organized by category and data type for easier maintenance.
/// Properties are divided into definition properties (static, shared) and instance properties (runtime, per-instance).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
#[repr(u8)]
pub enum PropertyAddress {
    // ===== GAME STATE PROPERTIES (0x01-0x03) =====
    /// Game seed value
    GameSeed = 0x01,
    /// Current game frame
    GameFrame = 0x02,
    /// Game gravity value
    GameGravity = 0x03,

    // ===== ACTION DEFINITION PROPERTIES (0x04-0x0F) =====
    /// Action energy cost (byte) - from definition
    ActionDefEnergyCost = 0x04,
    /// Action interval (fixed-point) - from definition
    ActionDefInterval = 0x05,
    /// Action duration (fixed-point) - from definition
    ActionDefDuration = 0x06,
    /// Action cooldown (fixed-point) - from definition
    ActionDefCooldown = 0x07,
    /// Action args[0] (byte) - from definition
    ActionDefArg0 = 0x08,
    /// Action args[1] (byte) - from definition
    ActionDefArg1 = 0x09,
    /// Action args[2] (byte) - from definition
    ActionDefArg2 = 0x0A,
    /// Action args[3] (byte) - from definition
    ActionDefArg3 = 0x0B,
    /// Action args[4] (byte) - from definition
    ActionDefArg4 = 0x0C,
    /// Action args[5] (byte) - from definition
    ActionDefArg5 = 0x0D,
    /// Action args[6] (byte) - from definition
    ActionDefArg6 = 0x0E,
    /// Action args[7] (byte) - from definition
    ActionDefArg7 = 0x0F,

    // ===== CONDITION DEFINITION PROPERTIES (0x10-0x1B) =====
    /// Condition ID (byte) - from definition
    ConditionDefId = 0x10,
    /// Condition energy multiplier (fixed-point) - from definition
    ConditionDefEnergyMul = 0x11,
    /// Condition args[0] (byte) - from definition
    ConditionDefArg0 = 0x12,
    /// Condition args[1] (byte) - from definition
    ConditionDefArg1 = 0x13,
    /// Condition args[2] (byte) - from definition
    ConditionDefArg2 = 0x14,
    /// Condition args[3] (byte) - from definition
    ConditionDefArg3 = 0x15,
    /// Condition args[4] (byte) - from definition
    ConditionDefArg4 = 0x16,
    /// Condition args[5] (byte) - from definition
    ConditionDefArg5 = 0x17,
    /// Condition args[6] (byte) - from definition
    ConditionDefArg6 = 0x18,
    /// Condition args[7] (byte) - from definition
    ConditionDefArg7 = 0x19,

    // ===== STATUS EFFECT DEFINITION PROPERTIES (0x1A-0x1F) =====
    /// Status effect duration (fixed-point) - from definition
    StatusEffectDefDuration = 0x1A,
    /// Status effect stack limit (byte) - from definition
    StatusEffectDefStackLimit = 0x1B,
    /// Status effect reset on stack flag (byte) - from definition
    StatusEffectDefResetOnStack = 0x1C,
    /// Status effect args[0] (byte) - from definition
    StatusEffectDefArg0 = 0x1D,
    /// Status effect args[1] (byte) - from definition
    StatusEffectDefArg1 = 0x1E,
    /// Status effect args[2] (byte) - from definition
    StatusEffectDefArg2 = 0x1F,

    // ===== SPAWN DEFINITION PROPERTIES (0x5A-0x61) =====
    /// Spawn definition damage base (byte) - from definition
    SpawnDefDamageBase = 0x5A,
    /// Spawn definition health cap (byte) - from definition
    SpawnDefHealthCap = 0x5B,
    /// Spawn definition duration (fixed-point) - from definition
    SpawnDefDuration = 0x5C,
    /// Spawn definition element (byte) - from definition
    SpawnDefElement = 0x5D,
    /// Spawn definition args[0] (byte) - from definition
    SpawnDefArg0 = 0x5E,
    /// Spawn definition args[1] (byte) - from definition
    SpawnDefArg1 = 0x5F,
    /// Spawn definition args[2] (byte) - from definition
    SpawnDefArg2 = 0x60,
    /// Spawn definition args[3] (byte) - from definition
    SpawnDefArg3 = 0x61,

    // ===== CHARACTER CORE PROPERTIES (0x20-0x2F) =====
    /// Character ID (byte)
    CharacterId = 0x20,
    /// Character group (byte)
    CharacterGroup = 0x21,
    /// Character position X (fixed-point)
    CharacterPosX = 0x22,
    /// Character position Y (fixed-point)
    CharacterPosY = 0x23,
    /// Character velocity X (fixed-point)
    CharacterVelX = 0x24,
    /// Character velocity Y (fixed-point)
    CharacterVelY = 0x25,
    /// Character size width (fixed-point)
    CharacterSizeW = 0x26,
    /// Character size height (fixed-point)
    CharacterSizeH = 0x27,
    /// Character health (byte)
    CharacterHealth = 0x28,
    /// Character energy (byte)
    CharacterEnergy = 0x29,
    /// Character energy cap (byte)
    CharacterEnergyCap = 0x2A,
    /// Passive energy recovery amount per rate (byte)
    CharacterEnergyRegen = 0x2B,
    /// Tick interval for passive energy recovery (byte)
    CharacterEnergyRegenRate = 0x2C,
    /// Active energy recovery amount per rate during Charge action (byte)
    CharacterEnergyCharge = 0x2D,
    /// Tick interval for active energy recovery during Charge action (byte)
    CharacterEnergyChargeRate = 0x2E,
    /// Locked action instance ID (byte)
    CharacterLockedActionId = 0x2F,

    // ===== CHARACTER COLLISION FLAGS (0x30-0x33) =====
    /// Top collision flag (byte: 0 or 1)
    CharacterCollisionTop = 0x30,
    /// Right collision flag (byte: 0 or 1)
    CharacterCollisionRight = 0x31,
    /// Bottom collision flag (byte: 0 or 1)
    CharacterCollisionBottom = 0x32,
    /// Left collision flag (byte: 0 or 1)
    CharacterCollisionLeft = 0x33,

    // ===== CHARACTER STATUS EFFECTS (0x34-0x34) =====
    /// Number of active status effects (byte)
    CharacterStatusEffectCount = 0x34,

    // ===== CHARACTER ARMOR VALUES (0x40-0x48) =====
    /// Armor value for Punct element (byte)
    CharacterArmorPunct = 0x40,
    /// Armor value for Blast element (byte)
    CharacterArmorBlast = 0x41,
    /// Armor value for Force element (byte)
    CharacterArmorForce = 0x42,
    /// Armor value for Sever element (byte)
    CharacterArmorSever = 0x43,
    /// Armor value for Heat element (byte)
    CharacterArmorHeat = 0x44,
    /// Armor value for Cryo element (byte)
    CharacterArmorCryo = 0x45,
    /// Armor value for Jolt element (byte)
    CharacterArmorJolt = 0x46,
    /// Armor value for Acid element (byte)
    CharacterArmorAcid = 0x47,
    /// Armor value for Virus element (byte)
    CharacterArmorVirus = 0x48,

    // ===== ENTITY DIRECTION PROPERTIES (0x50-0x51) =====
    /// Entity facing direction (byte: 0=left, 1=right, converts to Fixed -1.0/1.0)
    EntityFacing = 0x50,
    /// Entity gravity direction (byte: 0=upward, 1=downward, converts to Fixed -1.0/1.0)
    EntityGravityDir = 0x51,

    // ===== SPAWN PROPERTIES (0x52-0x59) =====
    /// Spawn damage base (byte)
    SpawnDamageBase = 0x52,
    /// Spawn core ID (byte)
    SpawnCoreId = 0x53,
    /// Spawn owner ID (byte)
    SpawnOwnerId = 0x54,
    /// Spawn position X (fixed-point)
    SpawnPosX = 0x55,
    /// Spawn position Y (fixed-point)
    SpawnPosY = 0x56,
    /// Spawn velocity X (fixed-point)
    SpawnVelX = 0x57,
    /// Spawn velocity Y (fixed-point)
    SpawnVelY = 0x58,

    // ===== ACTION INSTANCE PROPERTIES (0x80-0x8D) =====
    /// Action instance vars[0] (byte) - from instance
    ActionInstVar0 = 0x80,
    /// Action instance vars[1] (byte) - from instance
    ActionInstVar1 = 0x81,
    /// Action instance vars[2] (byte) - from instance
    ActionInstVar2 = 0x82,
    /// Action instance vars[3] (byte) - from instance
    ActionInstVar3 = 0x83,
    /// Action instance vars[4] (byte) - from instance
    ActionInstVar4 = 0x84,
    /// Action instance vars[5] (byte) - from instance
    ActionInstVar5 = 0x85,
    /// Action instance vars[6] (byte) - from instance
    ActionInstVar6 = 0x86,
    /// Action instance vars[7] (byte) - from instance
    ActionInstVar7 = 0x87,
    /// Action instance fixed[0] (fixed-point) - from instance
    ActionInstFixed0 = 0x88,
    /// Action instance fixed[1] (fixed-point) - from instance
    ActionInstFixed1 = 0x89,
    /// Action instance fixed[2] (fixed-point) - from instance
    ActionInstFixed2 = 0x8A,
    /// Action instance fixed[3] (fixed-point) - from instance
    ActionInstFixed3 = 0x8B,
    /// Action instance remaining duration (fixed-point) - from instance
    ActionInstRemainingDuration = 0x8C,
    /// Action instance last used frame (fixed-point) - from instance
    ActionInstLastUsedFrame = 0x8D,

    // ===== CONDITION INSTANCE PROPERTIES (0x90-0x9B) =====
    /// Condition instance vars[0] (byte) - from instance
    ConditionInstVar0 = 0x90,
    /// Condition instance vars[1] (byte) - from instance
    ConditionInstVar1 = 0x91,
    /// Condition instance vars[2] (byte) - from instance
    ConditionInstVar2 = 0x92,
    /// Condition instance vars[3] (byte) - from instance
    ConditionInstVar3 = 0x93,
    /// Condition instance vars[4] (byte) - from instance
    ConditionInstVar4 = 0x94,
    /// Condition instance vars[5] (byte) - from instance
    ConditionInstVar5 = 0x95,
    /// Condition instance vars[6] (byte) - from instance
    ConditionInstVar6 = 0x96,
    /// Condition instance vars[7] (byte) - from instance
    ConditionInstVar7 = 0x97,
    /// Condition instance fixed[0] (fixed-point) - from instance
    ConditionInstFixed0 = 0x98,
    /// Condition instance fixed[1] (fixed-point) - from instance
    ConditionInstFixed1 = 0x99,
    /// Condition instance fixed[2] (fixed-point) - from instance
    ConditionInstFixed2 = 0x9A,
    /// Condition instance fixed[3] (fixed-point) - from instance
    ConditionInstFixed3 = 0x9B,

    // ===== STATUS EFFECT INSTANCE PROPERTIES (0xA0-0xAB) =====
    /// Status effect instance vars[0] (byte) - from instance
    StatusEffectInstVar0 = 0xA0,
    /// Status effect instance vars[1] (byte) - from instance
    StatusEffectInstVar1 = 0xA1,
    /// Status effect instance vars[2] (byte) - from instance
    StatusEffectInstVar2 = 0xA2,
    /// Status effect instance vars[3] (byte) - from instance
    StatusEffectInstVar3 = 0xA3,
    /// Status effect instance fixed[0] (fixed-point) - from instance
    StatusEffectInstFixed0 = 0xA4,
    /// Status effect instance fixed[1] (fixed-point) - from instance
    StatusEffectInstFixed1 = 0xA5,
    /// Status effect instance fixed[2] (fixed-point) - from instance
    StatusEffectInstFixed2 = 0xA6,
    /// Status effect instance fixed[3] (fixed-point) - from instance
    StatusEffectInstFixed3 = 0xA7,
    /// Status effect instance remaining duration (fixed-point) - from instance
    StatusEffectInstRemainingDuration = 0xA8,
    /// Status effect instance stack count (byte) - from instance
    StatusEffectInstStackCount = 0xA9,

    // ===== SPAWN INSTANCE PROPERTIES (0xB0-0xBB) =====
    /// Spawn instance vars[0] (byte) - from instance
    SpawnInstVar0 = 0xB0,
    /// Spawn instance vars[1] (byte) - from instance
    SpawnInstVar1 = 0xB1,
    /// Spawn instance vars[2] (byte) - from instance
    SpawnInstVar2 = 0xB2,
    /// Spawn instance vars[3] (byte) - from instance
    SpawnInstVar3 = 0xB3,
    /// Spawn instance fixed[0] (fixed-point) - from instance
    SpawnInstFixed0 = 0xB4,
    /// Spawn instance fixed[1] (fixed-point) - from instance
    SpawnInstFixed1 = 0xB5,
    /// Spawn instance fixed[2] (fixed-point) - from instance
    SpawnInstFixed2 = 0xB6,
    /// Spawn instance fixed[3] (fixed-point) - from instance
    SpawnInstFixed3 = 0xB7,
    /// Spawn instance lifespan (fixed-point) - from instance
    SpawnInstLifespan = 0xB8,
    /// Spawn instance element (byte) - from instance
    SpawnInstElement = 0xB9,
}

impl OperatorAddress {
    /// Convert from u8 value to OperatorAddress enum
    pub fn from_u8(value: u8) -> Option<Self> {
        match value {
            0 => Some(Self::Exit),
            1 => Some(Self::ExitIfNoEnergy),
            2 => Some(Self::ExitIfCooldown),
            3 => Some(Self::Skip),
            4 => Some(Self::Goto),
            10 => Some(Self::ReadProp),
            11 => Some(Self::WriteProp),
            20 => Some(Self::AssignByte),
            21 => Some(Self::AssignFixed),
            22 => Some(Self::AssignRandom),
            23 => Some(Self::ToByte),
            24 => Some(Self::ToFixed),
            30 => Some(Self::Add),
            31 => Some(Self::Sub),
            32 => Some(Self::Mul),
            33 => Some(Self::Div),
            34 => Some(Self::Negate),
            40 => Some(Self::AddByte),
            41 => Some(Self::SubByte),
            42 => Some(Self::MulByte),
            43 => Some(Self::DivByte),
            44 => Some(Self::ModByte),
            45 => Some(Self::WrappingAdd),
            50 => Some(Self::Equal),
            51 => Some(Self::NotEqual),
            52 => Some(Self::LessThan),
            53 => Some(Self::LessThanOrEqual),
            60 => Some(Self::Not),
            61 => Some(Self::Or),
            62 => Some(Self::And),
            70 => Some(Self::Min),
            71 => Some(Self::Max),
            80 => Some(Self::LockAction),
            81 => Some(Self::UnlockAction),
            82 => Some(Self::ApplyEnergyCost),
            83 => Some(Self::ApplyDuration),
            84 => Some(Self::Spawn),
            85 => Some(Self::SpawnWithVars),
            90 => Some(Self::LogVariable),
            91 => Some(Self::ExitWithVar),
            92 => Some(Self::ReadActionCooldown),
            93 => Some(Self::ReadActionLastUsed),
            94 => Some(Self::WriteActionLastUsed),
            95 => Some(Self::IsActionOnCooldown),
            96 => Some(Self::ReadArg),
            97 => Some(Self::ReadSpawn),
            98 => Some(Self::WriteSpawn),
            _ => None,
        }
    }

    /// Convert to u8 value
    pub fn to_u8(self) -> u8 {
        self as u8
    }
}

impl From<OperatorAddress> for u8 {
    fn from(op: OperatorAddress) -> u8 {
        op as u8
    }
}

impl PropertyAddress {
    /// Convert from u8 value to PropertyAddress enum
    pub fn from_u8(value: u8) -> Option<Self> {
        match value {
            // Game state properties
            0x01 => Some(Self::GameSeed),
            0x02 => Some(Self::GameFrame),
            0x03 => Some(Self::GameGravity),

            // Action definition properties
            0x04 => Some(Self::ActionDefEnergyCost),
            0x05 => Some(Self::ActionDefInterval),
            0x06 => Some(Self::ActionDefDuration),
            0x07 => Some(Self::ActionDefCooldown),
            0x08 => Some(Self::ActionDefArg0),
            0x09 => Some(Self::ActionDefArg1),
            0x0A => Some(Self::ActionDefArg2),
            0x0B => Some(Self::ActionDefArg3),
            0x0C => Some(Self::ActionDefArg4),
            0x0D => Some(Self::ActionDefArg5),
            0x0E => Some(Self::ActionDefArg6),
            0x0F => Some(Self::ActionDefArg7),

            // Condition definition properties
            0x10 => Some(Self::ConditionDefId),
            0x11 => Some(Self::ConditionDefEnergyMul),
            0x12 => Some(Self::ConditionDefArg0),
            0x13 => Some(Self::ConditionDefArg1),
            0x14 => Some(Self::ConditionDefArg2),
            0x15 => Some(Self::ConditionDefArg3),
            0x16 => Some(Self::ConditionDefArg4),
            0x17 => Some(Self::ConditionDefArg5),
            0x18 => Some(Self::ConditionDefArg6),
            0x19 => Some(Self::ConditionDefArg7),

            // Status effect definition properties
            0x1A => Some(Self::StatusEffectDefDuration),
            0x1B => Some(Self::StatusEffectDefStackLimit),
            0x1C => Some(Self::StatusEffectDefResetOnStack),
            0x1D => Some(Self::StatusEffectDefArg0),
            0x1E => Some(Self::StatusEffectDefArg1),
            0x1F => Some(Self::StatusEffectDefArg2),

            // Spawn definition properties
            0x5A => Some(Self::SpawnDefDamageBase),
            0x5B => Some(Self::SpawnDefHealthCap),
            0x5C => Some(Self::SpawnDefDuration),
            0x5D => Some(Self::SpawnDefElement),
            0x5E => Some(Self::SpawnDefArg0),
            0x5F => Some(Self::SpawnDefArg1),
            0x60 => Some(Self::SpawnDefArg2),
            0x61 => Some(Self::SpawnDefArg3),

            // Character properties
            0x20 => Some(Self::CharacterId),
            0x21 => Some(Self::CharacterGroup),
            0x22 => Some(Self::CharacterPosX),
            0x23 => Some(Self::CharacterPosY),
            0x24 => Some(Self::CharacterVelX),
            0x25 => Some(Self::CharacterVelY),
            0x26 => Some(Self::CharacterSizeW),
            0x27 => Some(Self::CharacterSizeH),
            0x28 => Some(Self::CharacterHealth),
            0x29 => Some(Self::CharacterEnergy),
            0x2A => Some(Self::CharacterEnergyCap),
            0x2B => Some(Self::CharacterEnergyRegen),
            0x2C => Some(Self::CharacterEnergyRegenRate),
            0x2D => Some(Self::CharacterEnergyCharge),
            0x2E => Some(Self::CharacterEnergyChargeRate),
            0x2F => Some(Self::CharacterLockedActionId),
            0x30 => Some(Self::CharacterCollisionTop),
            0x31 => Some(Self::CharacterCollisionRight),
            0x32 => Some(Self::CharacterCollisionBottom),
            0x33 => Some(Self::CharacterCollisionLeft),
            0x34 => Some(Self::CharacterStatusEffectCount),
            0x40 => Some(Self::CharacterArmorPunct),
            0x41 => Some(Self::CharacterArmorBlast),
            0x42 => Some(Self::CharacterArmorForce),
            0x43 => Some(Self::CharacterArmorSever),
            0x44 => Some(Self::CharacterArmorHeat),
            0x45 => Some(Self::CharacterArmorCryo),
            0x46 => Some(Self::CharacterArmorJolt),
            0x47 => Some(Self::CharacterArmorAcid),
            0x48 => Some(Self::CharacterArmorVirus),

            // Entity direction properties
            0x50 => Some(Self::EntityFacing),
            0x51 => Some(Self::EntityGravityDir),

            // Spawn properties
            0x52 => Some(Self::SpawnDamageBase),
            0x53 => Some(Self::SpawnCoreId),
            0x54 => Some(Self::SpawnOwnerId),
            0x55 => Some(Self::SpawnPosX),
            0x56 => Some(Self::SpawnPosY),
            0x57 => Some(Self::SpawnVelX),
            0x58 => Some(Self::SpawnVelY),

            // Action instance properties
            0x80 => Some(Self::ActionInstVar0),
            0x81 => Some(Self::ActionInstVar1),
            0x82 => Some(Self::ActionInstVar2),
            0x83 => Some(Self::ActionInstVar3),
            0x84 => Some(Self::ActionInstVar4),
            0x85 => Some(Self::ActionInstVar5),
            0x86 => Some(Self::ActionInstVar6),
            0x87 => Some(Self::ActionInstVar7),
            0x88 => Some(Self::ActionInstFixed0),
            0x89 => Some(Self::ActionInstFixed1),
            0x8A => Some(Self::ActionInstFixed2),
            0x8B => Some(Self::ActionInstFixed3),
            0x8C => Some(Self::ActionInstRemainingDuration),
            0x8D => Some(Self::ActionInstLastUsedFrame),

            // Condition instance properties
            0x90 => Some(Self::ConditionInstVar0),
            0x91 => Some(Self::ConditionInstVar1),
            0x92 => Some(Self::ConditionInstVar2),
            0x93 => Some(Self::ConditionInstVar3),
            0x94 => Some(Self::ConditionInstVar4),
            0x95 => Some(Self::ConditionInstVar5),
            0x96 => Some(Self::ConditionInstVar6),
            0x97 => Some(Self::ConditionInstVar7),
            0x98 => Some(Self::ConditionInstFixed0),
            0x99 => Some(Self::ConditionInstFixed1),
            0x9A => Some(Self::ConditionInstFixed2),
            0x9B => Some(Self::ConditionInstFixed3),

            // Status effect instance properties
            0xA0 => Some(Self::StatusEffectInstVar0),
            0xA1 => Some(Self::StatusEffectInstVar1),
            0xA2 => Some(Self::StatusEffectInstVar2),
            0xA3 => Some(Self::StatusEffectInstVar3),
            0xA4 => Some(Self::StatusEffectInstFixed0),
            0xA5 => Some(Self::StatusEffectInstFixed1),
            0xA6 => Some(Self::StatusEffectInstFixed2),
            0xA7 => Some(Self::StatusEffectInstFixed3),
            0xA8 => Some(Self::StatusEffectInstRemainingDuration),
            0xA9 => Some(Self::StatusEffectInstStackCount),

            // Spawn instance properties
            0xB0 => Some(Self::SpawnInstVar0),
            0xB1 => Some(Self::SpawnInstVar1),
            0xB2 => Some(Self::SpawnInstVar2),
            0xB3 => Some(Self::SpawnInstVar3),
            0xB4 => Some(Self::SpawnInstFixed0),
            0xB5 => Some(Self::SpawnInstFixed1),
            0xB6 => Some(Self::SpawnInstFixed2),
            0xB7 => Some(Self::SpawnInstFixed3),
            0xB8 => Some(Self::SpawnInstLifespan),
            0xB9 => Some(Self::SpawnInstElement),

            _ => None,
        }
    }

    /// Convert to u8 value
    pub fn to_u8(self) -> u8 {
        self as u8
    }

    /// Check if this property address refers to a definition property (static, shared)
    pub fn is_definition_property(self) -> bool {
        match self {
            // Action definition properties
            Self::ActionDefEnergyCost | Self::ActionDefInterval | Self::ActionDefDuration |
            Self::ActionDefCooldown | Self::ActionDefArg0 | Self::ActionDefArg1 |
            Self::ActionDefArg2 | Self::ActionDefArg3 | Self::ActionDefArg4 |
            Self::ActionDefArg5 | Self::ActionDefArg6 | Self::ActionDefArg7 |
            // Condition definition properties
            Self::ConditionDefId | Self::ConditionDefEnergyMul | Self::ConditionDefArg0 |
            Self::ConditionDefArg1 | Self::ConditionDefArg2 | Self::ConditionDefArg3 |
            Self::ConditionDefArg4 | Self::ConditionDefArg5 | Self::ConditionDefArg6 |
            Self::ConditionDefArg7 |
            // Status effect definition properties
            Self::StatusEffectDefDuration | Self::StatusEffectDefStackLimit |
            Self::StatusEffectDefResetOnStack | Self::StatusEffectDefArg0 |
            Self::StatusEffectDefArg1 | Self::StatusEffectDefArg2 |
            // Spawn definition properties
            Self::SpawnDefDamageBase | Self::SpawnDefHealthCap | Self::SpawnDefDuration |
            Self::SpawnDefElement | Self::SpawnDefArg0 | Self::SpawnDefArg1 |
            Self::SpawnDefArg2 | Self::SpawnDefArg3 => true,
            _ => false,
        }
    }

    /// Check if this property address refers to an instance property (runtime, per-instance)
    pub fn is_instance_property(self) -> bool {
        match self {
            // Action instance properties
            Self::ActionInstVar0 | Self::ActionInstVar1 | Self::ActionInstVar2 |
            Self::ActionInstVar3 | Self::ActionInstVar4 | Self::ActionInstVar5 |
            Self::ActionInstVar6 | Self::ActionInstVar7 | Self::ActionInstFixed0 |
            Self::ActionInstFixed1 | Self::ActionInstFixed2 | Self::ActionInstFixed3 |
            Self::ActionInstRemainingDuration | Self::ActionInstLastUsedFrame |
            // Condition instance properties
            Self::ConditionInstVar0 | Self::ConditionInstVar1 | Self::ConditionInstVar2 |
            Self::ConditionInstVar3 | Self::ConditionInstVar4 | Self::ConditionInstVar5 |
            Self::ConditionInstVar6 | Self::ConditionInstVar7 | Self::ConditionInstFixed0 |
            Self::ConditionInstFixed1 | Self::ConditionInstFixed2 | Self::ConditionInstFixed3 |
            // Status effect instance properties
            Self::StatusEffectInstVar0 | Self::StatusEffectInstVar1 | Self::StatusEffectInstVar2 |
            Self::StatusEffectInstVar3 | Self::StatusEffectInstFixed0 | Self::StatusEffectInstFixed1 |
            Self::StatusEffectInstFixed2 | Self::StatusEffectInstFixed3 |
            Self::StatusEffectInstRemainingDuration | Self::StatusEffectInstStackCount |
            // Spawn instance properties
            Self::SpawnInstVar0 | Self::SpawnInstVar1 | Self::SpawnInstVar2 |
            Self::SpawnInstVar3 | Self::SpawnInstFixed0 | Self::SpawnInstFixed1 |
            Self::SpawnInstFixed2 | Self::SpawnInstFixed3 | Self::SpawnInstLifespan |
            Self::SpawnInstElement => true,
            _ => false,
        }
    }

    /// Check if this property address refers to a character property (direct access)
    pub fn is_character_property(self) -> bool {
        match self {
            Self::CharacterId
            | Self::CharacterGroup
            | Self::CharacterPosX
            | Self::CharacterPosY
            | Self::CharacterVelX
            | Self::CharacterVelY
            | Self::CharacterSizeW
            | Self::CharacterSizeH
            | Self::CharacterHealth
            | Self::CharacterEnergy
            | Self::CharacterEnergyCap
            | Self::CharacterEnergyRegen
            | Self::CharacterEnergyRegenRate
            | Self::CharacterEnergyCharge
            | Self::CharacterEnergyChargeRate
            | Self::CharacterCollisionTop
            | Self::CharacterCollisionRight
            | Self::CharacterCollisionBottom
            | Self::CharacterCollisionLeft
            | Self::CharacterLockedActionId
            | Self::CharacterStatusEffectCount
            | Self::CharacterArmorPunct
            | Self::CharacterArmorBlast
            | Self::CharacterArmorForce
            | Self::CharacterArmorSever
            | Self::CharacterArmorHeat
            | Self::CharacterArmorCryo
            | Self::CharacterArmorJolt
            | Self::CharacterArmorAcid
            | Self::CharacterArmorVirus => true,
            _ => false,
        }
    }
}

impl From<PropertyAddress> for u8 {
    fn from(prop: PropertyAddress) -> u8 {
        prop as u8
    }
}
