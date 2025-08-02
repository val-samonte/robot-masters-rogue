/**
 * Robot Masters Game Engine - Script Constants
 *
 * This file contains TypeScript constants that mirror the Rust constants
 * defined in game-engine/src/constants.rs. These constants are used for
 * building script bytecode when working with the game engine from JavaScript/TypeScript.
 *
 * IMPORTANT: These values must stay in sync with the Rust constants!
 */

/**
 * Operator address constants for script operators
 *
 * These constants provide named values for all operator byte values used in the scripting system,
 * improving code maintainability and reducing the risk of errors from hardcoded values.
 */
export const OperatorAddress = {
  // ===== CONTROL FLOW OPERATORS (0-9) =====
  /** Exit script with specified flag */
  EXIT: 0,
  /** Exit if insufficient energy */
  EXIT_IF_NO_ENERGY: 1,
  /** Exit if action is on cooldown */
  EXIT_IF_COOLDOWN: 2,
  /** Skip specified number of bytes */
  SKIP: 3,
  /** Jump to specified position */
  GOTO: 4,

  // ===== PROPERTY OPERATIONS (10-11) =====
  /** Read property into variable: [ReadProp, var_index, prop_address] */
  READ_PROP: 10,
  /** Write variable to property: [WriteProp, prop_address, var_index] */
  WRITE_PROP: 11,

  // ===== VARIABLE OPERATIONS (20-24) =====
  /** Assign byte literal to variable: [AssignByte, var_index, literal_value] */
  ASSIGN_BYTE: 20,
  /** Assign fixed-point value: [AssignFixed, var_index, numerator, denominator] */
  ASSIGN_FIXED: 21,
  /** Assign random value: [AssignRandom, var_index] */
  ASSIGN_RANDOM: 22,
  /** Convert fixed to byte: [ToByte, to_var_index, from_fixed_index] */
  TO_BYTE: 23,
  /** Convert byte to fixed: [ToFixed, to_fixed_index, from_var_index] */
  TO_FIXED: 24,

  // ===== FIXED-POINT ARITHMETIC (30-34) =====
  /** Add fixed-point values: [Add, dest_fixed, left_fixed, right_fixed] */
  ADD: 30,
  /** Subtract fixed-point values: [Sub, dest_fixed, left_fixed, right_fixed] */
  SUB: 31,
  /** Multiply fixed-point values: [Mul, dest_fixed, left_fixed, right_fixed] */
  MUL: 32,
  /** Divide fixed-point values: [Div, dest_fixed, left_fixed, right_fixed] */
  DIV: 33,
  /** Negate fixed-point value: [Negate, fixed_index] */
  NEGATE: 34,

  // ===== BYTE ARITHMETIC (40-45) =====
  /** Add byte values: [AddByte, dest_var, left_var, right_var] */
  ADD_BYTE: 40,
  /** Subtract byte values: [SubByte, dest_var, left_var, right_var] */
  SUB_BYTE: 41,
  /** Multiply byte values: [MulByte, dest_var, left_var, right_var] */
  MUL_BYTE: 42,
  /** Divide byte values: [DivByte, dest_var, left_var, right_var] */
  DIV_BYTE: 43,
  /** Modulo byte values: [ModByte, dest_var, left_var, right_var] */
  MOD_BYTE: 44,
  /** Wrapping add byte values: [WrappingAdd, dest_var, left_var, right_var] */
  WRAPPING_ADD: 45,

  // ===== CONDITIONAL OPERATIONS (50-53) =====
  /** Equal comparison: [Equal, dest_var, left_var, right_var] */
  EQUAL: 50,
  /** Not equal comparison: [NotEqual, dest_var, left_var, right_var] */
  NOT_EQUAL: 51,
  /** Less than comparison: [LessThan, dest_var, left_var, right_var] */
  LESS_THAN: 52,
  /** Less than or equal comparison: [LessThanOrEqual, dest_var, left_var, right_var] */
  LESS_THAN_OR_EQUAL: 53,

  // ===== LOGICAL OPERATIONS (60-62) =====
  /** Logical NOT: [Not, dest_var, source_var] */
  NOT: 60,
  /** Logical OR: [Or, dest_var, left_var, right_var] */
  OR: 61,
  /** Logical AND: [And, dest_var, left_var, right_var] */
  AND: 62,

  // ===== UTILITY OPERATIONS (70-71) =====
  /** Minimum value: [Min, dest_var, left_var, right_var] */
  MIN: 70,
  /** Maximum value: [Max, dest_var, left_var, right_var] */
  MAX: 71,

  // ===== GAME ACTIONS (80-85) =====
  /** Lock current action */
  LOCK_ACTION: 80,
  /** Unlock current action */
  UNLOCK_ACTION: 81,
  /** Apply energy cost */
  APPLY_ENERGY_COST: 82,
  /** Apply duration */
  APPLY_DURATION: 83,
  /** Spawn entity: [Spawn, spawn_id_var] */
  SPAWN: 84,
  /** Spawn entity with variables: [SpawnWithVars, spawn_id_var, var1, var2, var3, var4] */
  SPAWN_WITH_VARS: 85,

  // ===== DEBUG OPERATIONS (90-91) =====
  /** Log variable value: [LogVariable, var_index] */
  LOG_VARIABLE: 90,
  /** Exit with variable value: [ExitWithVar, var_index] */
  EXIT_WITH_VAR: 91,

  // ===== ARGS AND SPAWNS ACCESS (96-98) =====
  /** Read argument to variable: [ReadArg, var_index, arg_index] */
  READ_ARG: 96,
  /** Read spawn ID to variable: [ReadSpawn, var_index, spawn_index] */
  READ_SPAWN: 97,
  /** Write variable to spawn ID: [WriteSpawn, spawn_index, var_index] */
  WRITE_SPAWN: 98,

  // ===== COOLDOWN OPERATIONS (100-103) =====
  /** Read action cooldown: [ReadActionCooldown, var_index] */
  READ_ACTION_COOLDOWN: 100,
  /** Read action last used timestamp: [ReadActionLastUsed, var_index] */
  READ_ACTION_LAST_USED: 101,
  /** Write action last used timestamp: [WriteActionLastUsed, var_index] */
  WRITE_ACTION_LAST_USED: 102,
  /** Check if action is on cooldown: [IsActionOnCooldown, var_index] */
  IS_ACTION_ON_COOLDOWN: 103,
} as const

/**
 * Property address constants for script property access
 *
 * These constants define the property addresses used in ReadProp and WriteProp operations.
 * They are organized by category and data type for easier maintenance.
 * Properties are divided into definition properties (static, shared) and instance properties (runtime, per-instance).
 */
export const PropertyAddress = {
  // ===== GAME STATE PROPERTIES (0x01-0x03) =====
  /** Game seed value */
  GAME_SEED: 0x01,
  /** Current game frame */
  GAME_FRAME: 0x02,
  /** Game gravity value */
  GAME_GRAVITY: 0x03,

  // ===== ACTION DEFINITION PROPERTIES (0x04-0x0F) =====
  /** Action energy cost (byte) - from definition */
  ACTION_DEF_ENERGY_COST: 0x04,
  /** Action interval (fixed-point) - from definition */
  ACTION_DEF_INTERVAL: 0x05,
  /** Action duration (fixed-point) - from definition */
  ACTION_DEF_DURATION: 0x06,
  /** Action cooldown (fixed-point) - from definition */
  ACTION_DEF_COOLDOWN: 0x07,
  /** Action args[0] (byte) - from definition */
  ACTION_DEF_ARG0: 0x08,
  /** Action args[1] (byte) - from definition */
  ACTION_DEF_ARG1: 0x09,
  /** Action args[2] (byte) - from definition */
  ACTION_DEF_ARG2: 0x0a,
  /** Action args[3] (byte) - from definition */
  ACTION_DEF_ARG3: 0x0b,
  /** Action args[4] (byte) - from definition */
  ACTION_DEF_ARG4: 0x0c,
  /** Action args[5] (byte) - from definition */
  ACTION_DEF_ARG5: 0x0d,
  /** Action args[6] (byte) - from definition */
  ACTION_DEF_ARG6: 0x0e,
  /** Action args[7] (byte) - from definition */
  ACTION_DEF_ARG7: 0x0f,

  // ===== CONDITION DEFINITION PROPERTIES (0x10-0x1B) =====
  /** Condition ID (byte) - from definition */
  CONDITION_DEF_ID: 0x10,
  /** Condition energy multiplier (fixed-point) - from definition */
  CONDITION_DEF_ENERGY_MUL: 0x11,
  /** Condition args[0] (byte) - from definition */
  CONDITION_DEF_ARG0: 0x12,
  /** Condition args[1] (byte) - from definition */
  CONDITION_DEF_ARG1: 0x13,
  /** Condition args[2] (byte) - from definition */
  CONDITION_DEF_ARG2: 0x14,
  /** Condition args[3] (byte) - from definition */
  CONDITION_DEF_ARG3: 0x15,
  /** Condition args[4] (byte) - from definition */
  CONDITION_DEF_ARG4: 0x16,
  /** Condition args[5] (byte) - from definition */
  CONDITION_DEF_ARG5: 0x17,
  /** Condition args[6] (byte) - from definition */
  CONDITION_DEF_ARG6: 0x18,
  /** Condition args[7] (byte) - from definition */
  CONDITION_DEF_ARG7: 0x19,

  // ===== STATUS EFFECT DEFINITION PROPERTIES (0x1A-0x1F) =====
  /** Status effect duration (fixed-point) - from definition */
  STATUS_EFFECT_DEF_DURATION: 0x1a,
  /** Status effect stack limit (byte) - from definition */
  STATUS_EFFECT_DEF_STACK_LIMIT: 0x1b,
  /** Status effect reset on stack flag (byte) - from definition */
  STATUS_EFFECT_DEF_RESET_ON_STACK: 0x1c,
  /** Status effect args[0] (byte) - from definition */
  STATUS_EFFECT_DEF_ARG0: 0x1d,
  /** Status effect args[1] (byte) - from definition */
  STATUS_EFFECT_DEF_ARG1: 0x1e,
  /** Status effect args[2] (byte) - from definition */
  STATUS_EFFECT_DEF_ARG2: 0x49,

  // ===== SPAWN DEFINITION PROPERTIES (0x5A-0x61) =====
  /** Spawn definition damage base (byte) - from definition */
  SPAWN_DEF_DAMAGE_BASE: 0x5a,
  /** Spawn definition health cap (byte) - from definition */
  SPAWN_DEF_HEALTH_CAP: 0x5b,
  /** Spawn definition duration (fixed-point) - from definition */
  SPAWN_DEF_DURATION: 0x5c,
  /** Spawn definition element (byte) - from definition */
  SPAWN_DEF_ELEMENT: 0x5d,
  /** Spawn definition args[0] (byte) - from definition */
  SPAWN_DEF_ARG0: 0x5e,
  /** Spawn definition args[1] (byte) - from definition */
  SPAWN_DEF_ARG1: 0x5f,
  /** Spawn definition args[2] (byte) - from definition */
  SPAWN_DEF_ARG2: 0x60,
  /** Spawn definition args[3] (byte) - from definition */
  SPAWN_DEF_ARG3: 0x61,

  // ===== CHARACTER CORE PROPERTIES (0x20-0x2F) =====
  /** Character ID (byte) */
  CHARACTER_ID: 0x20,
  /** Character group (byte) */
  CHARACTER_GROUP: 0x21,
  /** Character position X (fixed-point) */
  CHARACTER_POS_X: 0x22,
  /** Character position Y (fixed-point) */
  CHARACTER_POS_Y: 0x23,
  /** Character velocity X (fixed-point) */
  CHARACTER_VEL_X: 0x24,
  /** Character velocity Y (fixed-point) */
  CHARACTER_VEL_Y: 0x25,
  /** Character size width (fixed-point) */
  CHARACTER_SIZE_W: 0x26,
  /** Character size height (fixed-point) */
  CHARACTER_SIZE_H: 0x27,
  /** Character health (byte) */
  CHARACTER_HEALTH: 0x28,
  /** Character energy (byte) */
  CHARACTER_ENERGY: 0x29,
  /** Character energy cap (byte) */
  CHARACTER_ENERGY_CAP: 0x2a,
  /** Passive energy recovery amount per rate (byte) */
  CHARACTER_ENERGY_REGEN: 0x2b,
  /** Tick interval for passive energy recovery (byte) */
  CHARACTER_ENERGY_REGEN_RATE: 0x2c,
  /** Active energy recovery amount per rate during Charge action (byte) */
  CHARACTER_ENERGY_CHARGE: 0x2d,
  /** Tick interval for active energy recovery during Charge action (byte) */
  CHARACTER_ENERGY_CHARGE_RATE: 0x2e,
  /** Locked action instance ID (byte) */
  CHARACTER_LOCKED_ACTION_ID: 0x2f,

  // ===== CHARACTER COLLISION FLAGS (0x30-0x33) =====
  /** Top collision flag (byte: 0 or 1) */
  CHARACTER_COLLISION_TOP: 0x30,
  /** Right collision flag (byte: 0 or 1) */
  CHARACTER_COLLISION_RIGHT: 0x31,
  /** Bottom collision flag (byte: 0 or 1) */
  CHARACTER_COLLISION_BOTTOM: 0x32,
  /** Left collision flag (byte: 0 or 1) */
  CHARACTER_COLLISION_LEFT: 0x33,

  // ===== CHARACTER STATUS EFFECTS (0x34-0x34) =====
  /** Number of active status effects (byte) */
  CHARACTER_STATUS_EFFECT_COUNT: 0x34,

  // ===== CHARACTER ARMOR VALUES (0x40-0x48) =====
  /** Armor value for Punct element (byte) */
  CHARACTER_ARMOR_PUNCT: 0x40,
  /** Armor value for Blast element (byte) */
  CHARACTER_ARMOR_BLAST: 0x41,
  /** Armor value for Force element (byte) */
  CHARACTER_ARMOR_FORCE: 0x42,
  /** Armor value for Sever element (byte) */
  CHARACTER_ARMOR_SEVER: 0x43,
  /** Armor value for Heat element (byte) */
  CHARACTER_ARMOR_HEAT: 0x44,
  /** Armor value for Cryo element (byte) */
  CHARACTER_ARMOR_CRYO: 0x45,
  /** Armor value for Jolt element (byte) */
  CHARACTER_ARMOR_JOLT: 0x46,
  /** Armor value for Acid element (byte) */
  CHARACTER_ARMOR_ACID: 0x47,
  /** Armor value for Virus element (byte) */
  CHARACTER_ARMOR_VIRUS: 0x48,

  // ===== ENTITY DIRECTION PROPERTIES (0x50-0x51) =====
  /** Entity facing direction (byte: 0=left, 1=right, converts to Fixed -1.0/1.0) */
  ENTITY_FACING: 0x50,
  /** Entity gravity direction (byte: 0=upward, 1=downward, converts to Fixed -1.0/1.0) */
  ENTITY_GRAVITY_DIR: 0x51,

  // ===== SPAWN PROPERTIES (0x52-0x59) =====
  /** Spawn damage base (byte) */
  SPAWN_DAMAGE_BASE: 0x52,
  /** Spawn core ID (byte) */
  SPAWN_CORE_ID: 0x53,
  /** Spawn owner ID (byte) */
  SPAWN_OWNER_ID: 0x54,
  /** Spawn position X (fixed-point) */
  SPAWN_POS_X: 0x55,
  /** Spawn position Y (fixed-point) */
  SPAWN_POS_Y: 0x56,
  /** Spawn velocity X (fixed-point) */
  SPAWN_VEL_X: 0x57,
  /** Spawn velocity Y (fixed-point) */
  SPAWN_VEL_Y: 0x58,

  // ===== ACTION INSTANCE PROPERTIES (0x80-0x8D) =====
  /** Action instance vars[0] (byte) - from instance */
  ACTION_INST_VAR0: 0x80,
  /** Action instance vars[1] (byte) - from instance */
  ACTION_INST_VAR1: 0x81,
  /** Action instance vars[2] (byte) - from instance */
  ACTION_INST_VAR2: 0x82,
  /** Action instance vars[3] (byte) - from instance */
  ACTION_INST_VAR3: 0x83,
  /** Action instance vars[4] (byte) - from instance */
  ACTION_INST_VAR4: 0x84,
  /** Action instance vars[5] (byte) - from instance */
  ACTION_INST_VAR5: 0x85,
  /** Action instance vars[6] (byte) - from instance */
  ACTION_INST_VAR6: 0x86,
  /** Action instance vars[7] (byte) - from instance */
  ACTION_INST_VAR7: 0x87,
  /** Action instance fixed[0] (fixed-point) - from instance */
  ACTION_INST_FIXED0: 0x88,
  /** Action instance fixed[1] (fixed-point) - from instance */
  ACTION_INST_FIXED1: 0x89,
  /** Action instance fixed[2] (fixed-point) - from instance */
  ACTION_INST_FIXED2: 0x8a,
  /** Action instance fixed[3] (fixed-point) - from instance */
  ACTION_INST_FIXED3: 0x8b,
  /** Action instance remaining duration (fixed-point) - from instance */
  ACTION_INST_REMAINING_DURATION: 0x8c,
  /** Action instance last used frame (fixed-point) - from instance */
  ACTION_INST_LAST_USED_FRAME: 0x8d,

  // ===== CONDITION INSTANCE PROPERTIES (0x90-0x9B) =====
  /** Condition instance vars[0] (byte) - from instance */
  CONDITION_INST_VAR0: 0x90,
  /** Condition instance vars[1] (byte) - from instance */
  CONDITION_INST_VAR1: 0x91,
  /** Condition instance vars[2] (byte) - from instance */
  CONDITION_INST_VAR2: 0x92,
  /** Condition instance vars[3] (byte) - from instance */
  CONDITION_INST_VAR3: 0x93,
  /** Condition instance vars[4] (byte) - from instance */
  CONDITION_INST_VAR4: 0x94,
  /** Condition instance vars[5] (byte) - from instance */
  CONDITION_INST_VAR5: 0x95,
  /** Condition instance vars[6] (byte) - from instance */
  CONDITION_INST_VAR6: 0x96,
  /** Condition instance vars[7] (byte) - from instance */
  CONDITION_INST_VAR7: 0x97,
  /** Condition instance fixed[0] (fixed-point) - from instance */
  CONDITION_INST_FIXED0: 0x98,
  /** Condition instance fixed[1] (fixed-point) - from instance */
  CONDITION_INST_FIXED1: 0x99,
  /** Condition instance fixed[2] (fixed-point) - from instance */
  CONDITION_INST_FIXED2: 0x9a,
  /** Condition instance fixed[3] (fixed-point) - from instance */
  CONDITION_INST_FIXED3: 0x9b,

  // ===== STATUS EFFECT INSTANCE PROPERTIES (0xA0-0xAB) =====
  /** Status effect instance vars[0] (byte) - from instance */
  STATUS_EFFECT_INST_VAR0: 0xa0,
  /** Status effect instance vars[1] (byte) - from instance */
  STATUS_EFFECT_INST_VAR1: 0xa1,
  /** Status effect instance vars[2] (byte) - from instance */
  STATUS_EFFECT_INST_VAR2: 0xa2,
  /** Status effect instance vars[3] (byte) - from instance */
  STATUS_EFFECT_INST_VAR3: 0xa3,
  /** Status effect instance fixed[0] (fixed-point) - from instance */
  STATUS_EFFECT_INST_FIXED0: 0xa4,
  /** Status effect instance fixed[1] (fixed-point) - from instance */
  STATUS_EFFECT_INST_FIXED1: 0xa5,
  /** Status effect instance fixed[2] (fixed-point) - from instance */
  STATUS_EFFECT_INST_FIXED2: 0xa6,
  /** Status effect instance fixed[3] (fixed-point) - from instance */
  STATUS_EFFECT_INST_FIXED3: 0xa7,
  /** Status effect instance remaining duration (fixed-point) - from instance */
  STATUS_EFFECT_INST_REMAINING_DURATION: 0xa8,
  /** Status effect instance stack count (byte) - from instance */
  STATUS_EFFECT_INST_STACK_COUNT: 0xa9,

  // ===== SPAWN INSTANCE PROPERTIES (0xB0-0xBB) =====
  /** Spawn instance vars[0] (byte) - from instance */
  SPAWN_INST_VAR0: 0xb0,
  /** Spawn instance vars[1] (byte) - from instance */
  SPAWN_INST_VAR1: 0xb1,
  /** Spawn instance vars[2] (byte) - from instance */
  SPAWN_INST_VAR2: 0xb2,
  /** Spawn instance vars[3] (byte) - from instance */
  SPAWN_INST_VAR3: 0xb3,
  /** Spawn instance fixed[0] (fixed-point) - from instance */
  SPAWN_INST_FIXED0: 0xb4,
  /** Spawn instance fixed[1] (fixed-point) - from instance */
  SPAWN_INST_FIXED1: 0xb5,
  /** Spawn instance fixed[2] (fixed-point) - from instance */
  SPAWN_INST_FIXED2: 0xb6,
  /** Spawn instance fixed[3] (fixed-point) - from instance */
  SPAWN_INST_FIXED3: 0xb7,
  /** Spawn instance lifespan (fixed-point) - from instance */
  SPAWN_INST_LIFESPAN: 0xb8,
  /** Spawn instance element (byte) - from instance */
  SPAWN_INST_ELEMENT: 0xb9,
} as const

/**
 * Element type constants
 * These correspond to the Element enum in the Rust code
 */
export const Element = {
  /** Puncture / piercing - goes through multiple enemies and walls, ignores force fields */
  PUNCT: 0,
  /** Explosive AOE damage */
  BLAST: 1,
  /** Blunt weapons - impact damage, bonus based on entity weight if melee, negated by force fields */
  FORCE: 2,
  /** Critical chance (x1.5 to x2 damage) */
  SEVER: 3,
  /** Applies damage overtime / burning effect */
  HEAT: 4,
  /** Applies slow movement / cooldown, frostbite (max HP % damage) */
  CRYO: 5,
  /** Energy altering - slow recharging, energy damage, energy leak */
  JOLT: 6,
  /** Disables regenerative and other supportive buffs */
  ACID: 7,
  /** Alters target behavior - inject erratic bugs, disable behaviors */
  VIRUS: 8,
} as const

/**
 * Helper functions for building script bytecode
 */
export class ScriptBuilder {
  private bytecode: number[] = []

  /**
   * Add raw bytes to the script
   */
  addBytes(...bytes: number[]): this {
    this.bytecode.push(...bytes)
    return this
  }

  /**
   * Add an operator with its arguments
   */
  addOperator(operator: number, ...args: number[]): this {
    this.bytecode.push(operator, ...args)
    return this
  }

  /**
   * Exit script with specified flag
   */
  exit(flag: number): this {
    return this.addOperator(OperatorAddress.EXIT, flag)
  }

  /**
   * Exit if insufficient energy
   */
  exitIfNoEnergy(flag: number): this {
    return this.addOperator(OperatorAddress.EXIT_IF_NO_ENERGY, flag)
  }

  /**
   * Exit if action is on cooldown
   */
  exitIfCooldown(flag: number): this {
    return this.addOperator(OperatorAddress.EXIT_IF_COOLDOWN, flag)
  }

  /**
   * Read property into variable
   */
  readProperty(varIndex: number, propertyAddress: number): this {
    return this.addOperator(
      OperatorAddress.READ_PROP,
      varIndex,
      propertyAddress
    )
  }

  /**
   * Write variable to property
   */
  writeProperty(propertyAddress: number, varIndex: number): this {
    return this.addOperator(
      OperatorAddress.WRITE_PROP,
      propertyAddress,
      varIndex
    )
  }

  /**
   * Assign byte literal to variable
   */
  assignByte(varIndex: number, value: number): this {
    return this.addOperator(OperatorAddress.ASSIGN_BYTE, varIndex, value)
  }

  /**
   * Assign fixed-point value (numerator/denominator)
   */
  assignFixed(varIndex: number, numerator: number, denominator: number): this {
    return this.addOperator(
      OperatorAddress.ASSIGN_FIXED,
      varIndex,
      numerator,
      denominator
    )
  }

  /**
   * Add fixed-point values
   */
  addFixed(destFixed: number, leftFixed: number, rightFixed: number): this {
    return this.addOperator(
      OperatorAddress.ADD,
      destFixed,
      leftFixed,
      rightFixed
    )
  }

  /**
   * Subtract fixed-point values
   */
  subFixed(destFixed: number, leftFixed: number, rightFixed: number): this {
    return this.addOperator(
      OperatorAddress.SUB,
      destFixed,
      leftFixed,
      rightFixed
    )
  }

  /**
   * Multiply fixed-point values
   */
  mulFixed(destFixed: number, leftFixed: number, rightFixed: number): this {
    return this.addOperator(
      OperatorAddress.MUL,
      destFixed,
      leftFixed,
      rightFixed
    )
  }

  /**
   * Divide fixed-point values
   */
  divFixed(destFixed: number, leftFixed: number, rightFixed: number): this {
    return this.addOperator(
      OperatorAddress.DIV,
      destFixed,
      leftFixed,
      rightFixed
    )
  }

  /**
   * Add byte values
   */
  addByte(destVar: number, leftVar: number, rightVar: number): this {
    return this.addOperator(
      OperatorAddress.ADD_BYTE,
      destVar,
      leftVar,
      rightVar
    )
  }

  /**
   * Apply energy cost
   */
  applyEnergyCost(): this {
    return this.addOperator(OperatorAddress.APPLY_ENERGY_COST)
  }

  /**
   * Apply duration
   */
  applyDuration(): this {
    return this.addOperator(OperatorAddress.APPLY_DURATION)
  }

  /**
   * Spawn entity
   */
  spawn(spawnIdVar: number): this {
    return this.addOperator(OperatorAddress.SPAWN, spawnIdVar)
  }

  /**
   * Lock current action
   */
  lockAction(): this {
    return this.addOperator(OperatorAddress.LOCK_ACTION)
  }

  /**
   * Unlock current action
   */
  unlockAction(): this {
    return this.addOperator(OperatorAddress.UNLOCK_ACTION)
  }

  /**
   * Get the compiled bytecode
   */
  build(): number[] {
    return [...this.bytecode]
  }

  /**
   * Clear the builder
   */
  clear(): this {
    this.bytecode = []
    return this
  }
}

/**
 * Type definitions for better TypeScript support
 */
export type OperatorAddressType =
  (typeof OperatorAddress)[keyof typeof OperatorAddress]
export type PropertyAddressType =
  (typeof PropertyAddress)[keyof typeof PropertyAddress]
export type ElementType = (typeof Element)[keyof typeof Element]
