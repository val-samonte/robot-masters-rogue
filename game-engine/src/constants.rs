//! Centralized address byte constants for operators and property accessors

/// Operator address constants for script operators
///
/// This enum provides named constants for all operator byte values used in the scripting system,
/// improving code maintainability and reducing the risk of errors from hardcoded values.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
#[repr(u8)]
pub enum OperatorAddress {
    // ===== CONTROL FLOW OPERATORS =====
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

    // ===== PROPERTY OPERATIONS =====
    /// Read property into variable: [ReadProp, var_index, prop_address]
    ReadProp = 10,
    /// Write variable to property: [WriteProp, prop_address, var_index]
    WriteProp = 11,

    // ===== VARIABLE OPERATIONS =====
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

    // ===== FIXED-POINT ARITHMETIC =====
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

    // ===== BYTE ARITHMETIC =====
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

    // ===== CONDITIONAL OPERATIONS =====
    /// Equal comparison: [Equal, dest_var, left_var, right_var]
    Equal = 50,
    /// Not equal comparison: [NotEqual, dest_var, left_var, right_var]
    NotEqual = 51,
    /// Less than comparison: [LessThan, dest_var, left_var, right_var]
    LessThan = 52,
    /// Less than or equal comparison: [LessThanOrEqual, dest_var, left_var, right_var]
    LessThanOrEqual = 53,

    // ===== LOGICAL OPERATIONS =====
    /// Logical NOT: [Not, dest_var, source_var]
    Not = 60,
    /// Logical OR: [Or, dest_var, left_var, right_var]
    Or = 61,
    /// Logical AND: [And, dest_var, left_var, right_var]
    And = 62,

    // ===== UTILITY OPERATIONS =====
    /// Minimum value: [Min, dest_var, left_var, right_var]
    Min = 70,
    /// Maximum value: [Max, dest_var, left_var, right_var]
    Max = 71,

    // ===== GAME ACTIONS =====
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

    // ===== DEBUG OPERATIONS =====
    /// Log variable value: [LogVariable, var_index]
    LogVariable = 90,
    /// Exit with variable value: [ExitWithVar, var_index]
    ExitWithVar = 91,

    // ===== COOLDOWN OPERATIONS =====
    /// Read action cooldown: [ReadActionCooldown, var_index]
    ReadActionCooldown = 92,
    /// Read action last used timestamp: [ReadActionLastUsed, var_index]
    ReadActionLastUsed = 93,
    /// Write action last used timestamp: [WriteActionLastUsed, var_index]
    WriteActionLastUsed = 94,
    /// Check if action is on cooldown: [IsActionOnCooldown, var_index]
    IsActionOnCooldown = 95,

    // ===== ARGS AND SPAWNS ACCESS =====
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
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
#[repr(u8)]
pub enum PropertyAddress {
    // ===== GAME STATE PROPERTIES (Fixed-point values) =====
    /// Game seed value
    GameSeed = 0x01,
    /// Current game frame
    GameFrame = 0x02,
    /// Game gravity value
    GameGravity = 0x03,

    // ===== ACTION PROPERTIES (Mixed types) =====
    /// Action energy cost (byte)
    ActionEnergyCost = 0x04,
    /// Action interval (fixed-point)
    ActionInterval = 0x05,
    /// Action duration (fixed-point)
    ActionDuration = 0x06,
    /// Action args[0] (byte)
    ActionArg0 = 0x07,
    /// Action args[1] (byte)
    ActionArg1 = 0x08,
    /// Action args[2] (byte)
    ActionArg2 = 0x09,
    /// Action args[3] (byte)
    ActionArg3 = 0x0A,
    /// Action args[4] (byte)
    ActionArg4 = 0x0B,
    /// Action args[5] (byte)
    ActionArg5 = 0x0C,
    /// Action args[6] (byte)
    ActionArg6 = 0x0D,
    /// Action args[7] (byte)
    ActionArg7 = 0x0E,

    // ===== CONDITION PROPERTIES (Mixed types) =====
    /// Condition ID (byte)
    ConditionId = 0x11,
    /// Condition energy multiplier (fixed-point)
    ConditionEnergyMul = 0x12,
    /// Condition args[0] (byte)
    ConditionArg0 = 0x13,
    /// Condition args[1] (byte)
    ConditionArg1 = 0x14,
    /// Condition args[2] (byte)
    ConditionArg2 = 0x15,
    /// Condition args[3] (byte)
    ConditionArg3 = 0x16,

    // ===== CHARACTER CORE PROPERTIES (Mixed types) =====
    /// Character ID (byte)
    CharacterId = 0x17,
    /// Character group (byte)
    CharacterGroup = 0x18,
    /// Character position X (fixed-point)
    CharacterPosX = 0x19,
    /// Character position Y (fixed-point)
    CharacterPosY = 0x1A,
    /// Character velocity X (fixed-point)
    CharacterVelX = 0x1B,
    /// Character velocity Y (fixed-point)
    CharacterVelY = 0x1C,
    /// Character size width (fixed-point)
    CharacterSizeW = 0x1D,
    /// Character size height (fixed-point)
    CharacterSizeH = 0x1E,
    /// Condition args[4] (byte) - legacy
    ConditionArg4 = 0x1F,
    /// Condition args[5] (byte) - legacy
    ConditionArg5 = 0x20,

    // ===== CHARACTER STATS (Byte values) =====
    /// Character health (byte)
    CharacterHealth = 0x21,
    /// Condition args[6] (byte) - legacy
    ConditionArg6 = 0x22,
    /// Character energy (byte)
    CharacterEnergy = 0x23,
    /// Character energy cap (byte)
    CharacterEnergyCap = 0x24,

    // ===== ENERGY REGENERATION PROPERTIES (Byte values) =====
    /// Passive energy recovery amount per rate (byte)
    CharacterEnergyRegen = 0x25,
    /// Tick interval for passive energy recovery (byte)
    CharacterEnergyRegenRate = 0x26,
    /// Active energy recovery amount per rate during Charge action (byte)
    CharacterEnergyCharge = 0x27,
    /// Tick interval for active energy recovery during Charge action (byte)
    CharacterEnergyChargeRate = 0x28,

    // ===== CHARACTER COLLISION FLAGS (Byte values) =====
    /// Top collision flag (byte: 0 or 1)
    CharacterCollisionTop = 0x2B,
    /// Right collision flag (byte: 0 or 1)
    CharacterCollisionRight = 0x2C,
    /// Bottom collision flag (byte: 0 or 1)
    CharacterCollisionBottom = 0x2D,
    /// Left collision flag (byte: 0 or 1)
    CharacterCollisionLeft = 0x2E,
    /// Locked action instance ID (byte)
    CharacterLockedActionId = 0x2F,

    // ===== CHARACTER STATUS EFFECTS =====
    /// Number of active status effects (byte)
    CharacterStatusEffectCount = 0x39,

    // ===== CHARACTER ARMOR VALUES (Byte values 0-255, baseline 100) =====
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
    /// Armor value for Virus element (byte)
    CharacterArmorVirus = 0x47,

    // ===== ACTION COOLDOWN PROPERTIES =====
    /// Action cooldown duration (byte/fixed depending on context)
    ActionCooldown = 0x48,
    /// Action last used timestamp (byte/fixed depending on context)
    ActionLastUsed = 0x49,
    /// Write action last used timestamp (byte/fixed depending on context)
    ActionLastUsedWrite = 0x4A,

    // ===== ENTITY DIRECTION PROPERTIES =====
    /// Entity facing direction (byte: 0=left, 1=right, converts to Fixed -1.0/1.0)
    EntityFacing = 0x4B,
    /// Entity gravity direction (byte: 0=upward, 1=downward, converts to Fixed -1.0/1.0)
    EntityGravityDir = 0x4C,

    // ===== SPAWN PROPERTIES (Mixed types) =====
    /// Spawn damage base (byte)
    SpawnDamageBase = 0x5D,
    /// Spawn core ID (byte)
    SpawnCoreId = 0x6F,
    /// Spawn owner ID (byte)
    SpawnOwnerId = 0x70,
    /// Spawn position X (fixed-point)
    SpawnPosX = 0x78,
    /// Spawn position Y (fixed-point)
    SpawnPosY = 0x79,
    /// Spawn velocity X (fixed-point)
    SpawnVelX = 0x7A,
    /// Spawn velocity Y (fixed-point)
    SpawnVelY = 0x7B,
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
            0x01 => Some(Self::GameSeed),
            0x02 => Some(Self::GameFrame),
            0x03 => Some(Self::GameGravity),
            0x04 => Some(Self::ActionEnergyCost),
            0x05 => Some(Self::ActionInterval),
            0x06 => Some(Self::ActionDuration),
            0x07 => Some(Self::ActionArg0),
            0x08 => Some(Self::ActionArg1),
            0x09 => Some(Self::ActionArg2),
            0x0A => Some(Self::ActionArg3),
            0x0B => Some(Self::ActionArg4),
            0x0C => Some(Self::ActionArg5),
            0x0D => Some(Self::ActionArg6),
            0x0E => Some(Self::ActionArg7),
            0x11 => Some(Self::ConditionId),
            0x12 => Some(Self::ConditionEnergyMul),
            0x13 => Some(Self::ConditionArg0),
            0x14 => Some(Self::ConditionArg1),
            0x15 => Some(Self::ConditionArg2),
            0x16 => Some(Self::ConditionArg3),
            0x17 => Some(Self::CharacterId),
            0x18 => Some(Self::CharacterGroup),
            0x19 => Some(Self::CharacterPosX),
            0x1A => Some(Self::CharacterPosY),
            0x1B => Some(Self::CharacterVelX),
            0x1C => Some(Self::CharacterVelY),
            0x1D => Some(Self::CharacterSizeW),
            0x1E => Some(Self::CharacterSizeH),
            0x1F => Some(Self::ConditionArg4),
            0x20 => Some(Self::ConditionArg5),
            0x21 => Some(Self::CharacterHealth),
            0x22 => Some(Self::ConditionArg6),
            0x23 => Some(Self::CharacterEnergy),
            0x24 => Some(Self::CharacterEnergyCap),
            0x25 => Some(Self::CharacterEnergyRegen),
            0x26 => Some(Self::CharacterEnergyRegenRate),
            0x27 => Some(Self::CharacterEnergyCharge),
            0x28 => Some(Self::CharacterEnergyChargeRate),
            0x2B => Some(Self::CharacterCollisionTop),
            0x2C => Some(Self::CharacterCollisionRight),
            0x2D => Some(Self::CharacterCollisionBottom),
            0x2E => Some(Self::CharacterCollisionLeft),
            0x2F => Some(Self::CharacterLockedActionId),
            0x39 => Some(Self::CharacterStatusEffectCount),
            0x40 => Some(Self::CharacterArmorPunct),
            0x41 => Some(Self::CharacterArmorBlast),
            0x42 => Some(Self::CharacterArmorForce),
            0x43 => Some(Self::CharacterArmorSever),
            0x44 => Some(Self::CharacterArmorHeat),
            0x45 => Some(Self::CharacterArmorCryo),
            0x46 => Some(Self::CharacterArmorJolt),
            0x47 => Some(Self::CharacterArmorVirus),
            0x48 => Some(Self::ActionCooldown),
            0x49 => Some(Self::ActionLastUsed),
            0x4A => Some(Self::ActionLastUsedWrite),
            0x4B => Some(Self::EntityFacing),
            0x4C => Some(Self::EntityGravityDir),
            0x5D => Some(Self::SpawnDamageBase),
            0x6F => Some(Self::SpawnCoreId),
            0x70 => Some(Self::SpawnOwnerId),
            0x78 => Some(Self::SpawnPosX),
            0x79 => Some(Self::SpawnPosY),
            0x7A => Some(Self::SpawnVelX),
            0x7B => Some(Self::SpawnVelY),
            _ => None,
        }
    }

    /// Convert to u8 value
    pub fn to_u8(self) -> u8 {
        self as u8
    }
}

impl From<PropertyAddress> for u8 {
    fn from(prop: PropertyAddress) -> u8 {
        prop as u8
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_operator_address_conversion() {
        // Test a few key operators
        assert_eq!(OperatorAddress::from_u8(0), Some(OperatorAddress::Exit));
        assert_eq!(
            OperatorAddress::from_u8(10),
            Some(OperatorAddress::ReadProp)
        );
        assert_eq!(
            OperatorAddress::from_u8(20),
            Some(OperatorAddress::AssignByte)
        );
        assert_eq!(OperatorAddress::from_u8(30), Some(OperatorAddress::Add));
        assert_eq!(OperatorAddress::from_u8(50), Some(OperatorAddress::Equal));
        assert_eq!(OperatorAddress::from_u8(84), Some(OperatorAddress::Spawn));
        assert_eq!(OperatorAddress::from_u8(96), Some(OperatorAddress::ReadArg));

        // Test invalid value
        assert_eq!(OperatorAddress::from_u8(255), None);

        // Test round-trip conversion
        assert_eq!(OperatorAddress::Exit.to_u8(), 0);
        assert_eq!(OperatorAddress::ReadProp.to_u8(), 10);
        assert_eq!(OperatorAddress::Spawn.to_u8(), 84);
    }

    #[test]
    fn test_property_address_conversion() {
        // Test a few key property addresses
        assert_eq!(
            PropertyAddress::from_u8(0x01),
            Some(PropertyAddress::GameSeed)
        );
        assert_eq!(
            PropertyAddress::from_u8(0x19),
            Some(PropertyAddress::CharacterPosX)
        );
        assert_eq!(
            PropertyAddress::from_u8(0x23),
            Some(PropertyAddress::CharacterEnergy)
        );
        assert_eq!(
            PropertyAddress::from_u8(0x2D),
            Some(PropertyAddress::CharacterCollisionBottom)
        );
        assert_eq!(
            PropertyAddress::from_u8(0x40),
            Some(PropertyAddress::CharacterArmorPunct)
        );
        assert_eq!(
            PropertyAddress::from_u8(0x78),
            Some(PropertyAddress::SpawnPosX)
        );

        // Test invalid value
        assert_eq!(PropertyAddress::from_u8(0xFF), None);

        // Test round-trip conversion
        assert_eq!(PropertyAddress::GameSeed.to_u8(), 0x01);
        assert_eq!(PropertyAddress::CharacterEnergy.to_u8(), 0x23);
        assert_eq!(PropertyAddress::CharacterArmorPunct.to_u8(), 0x40);
    }

    #[test]
    fn test_enum_values_match_expected_bytes() {
        // Verify that enum values match the expected byte assignments
        // This ensures compatibility with existing bytecode

        // Control flow
        assert_eq!(OperatorAddress::Exit as u8, 0);
        assert_eq!(OperatorAddress::ExitIfNoEnergy as u8, 1);
        assert_eq!(OperatorAddress::Skip as u8, 3);

        // Property operations
        assert_eq!(OperatorAddress::ReadProp as u8, 10);
        assert_eq!(OperatorAddress::WriteProp as u8, 11);

        // Variable operations
        assert_eq!(OperatorAddress::AssignByte as u8, 20);
        assert_eq!(OperatorAddress::AssignFixed as u8, 21);

        // Arithmetic
        assert_eq!(OperatorAddress::Add as u8, 30);
        assert_eq!(OperatorAddress::AddByte as u8, 40);

        // Conditionals
        assert_eq!(OperatorAddress::Equal as u8, 50);
        assert_eq!(OperatorAddress::LessThan as u8, 52);

        // Game actions
        assert_eq!(OperatorAddress::Spawn as u8, 84);

        // Args access
        assert_eq!(OperatorAddress::ReadArg as u8, 96);

        // Property addresses
        assert_eq!(PropertyAddress::GameSeed as u8, 0x01);
        assert_eq!(PropertyAddress::CharacterPosX as u8, 0x19);
        assert_eq!(PropertyAddress::CharacterEnergy as u8, 0x23);
        assert_eq!(PropertyAddress::CharacterCollisionBottom as u8, 0x2D);
        assert_eq!(PropertyAddress::CharacterArmorPunct as u8, 0x40);
    }
}
