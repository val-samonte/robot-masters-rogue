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
 */
export const OperatorAddress = {
  // ===== CONTROL FLOW OPERATORS (0-9) =====
  EXIT: 0,
  EXIT_IF_NO_ENERGY: 1,
  EXIT_IF_COOLDOWN: 2,
  SKIP: 3,
  GOTO: 4,

  // ===== PROPERTY OPERATIONS (10-11) =====
  READ_PROP: 10,
  WRITE_PROP: 11,

  // ===== VARIABLE OPERATIONS (20-24) =====
  ASSIGN_BYTE: 20,
  ASSIGN_FIXED: 21,
  ASSIGN_RANDOM: 22,
  TO_BYTE: 23,
  TO_FIXED: 24,

  // ===== FIXED-POINT ARITHMETIC (30-34) =====
  ADD: 30,
  SUB: 31,
  MUL: 32,
  DIV: 33,
  NEGATE: 34,

  // ===== BYTE ARITHMETIC (40-45) =====
  ADD_BYTE: 40,
  SUB_BYTE: 41,
  MUL_BYTE: 42,
  DIV_BYTE: 43,
  MOD_BYTE: 44,
  WRAPPING_ADD: 45,

  // ===== CONDITIONAL OPERATIONS (50-53) =====
  EQUAL: 50,
  NOT_EQUAL: 51,
  LESS_THAN: 52,
  LESS_THAN_OR_EQUAL: 53,

  // ===== LOGICAL OPERATIONS (60-62) =====
  NOT: 60,
  OR: 61,
  AND: 62,

  // ===== UTILITY OPERATIONS (70-71) =====
  MIN: 70,
  MAX: 71,

  // ===== GAME ACTIONS (80-85) =====
  LOCK_ACTION: 80,
  UNLOCK_ACTION: 81,
  APPLY_ENERGY_COST: 82,
  APPLY_DURATION: 83,
  SPAWN: 84,
  SPAWN_WITH_VARS: 85,

  // ===== DEBUG OPERATIONS (90-91) =====
  LOG_VARIABLE: 90,
  EXIT_WITH_VAR: 91,

  // ===== ARGS AND SPAWNS ACCESS (96-98) =====
  READ_ARG: 96,
  READ_SPAWN: 97,
  WRITE_SPAWN: 98,

  // ===== COOLDOWN OPERATIONS (100-103) =====
  READ_ACTION_COOLDOWN: 100,
  READ_ACTION_LAST_USED: 101,
  WRITE_ACTION_LAST_USED: 102,
  IS_ACTION_ON_COOLDOWN: 103,

  // ===== ENTITY PROPERTY ACCESS OPERATIONS (104-107) =====
  READ_CHARACTER_PROPERTY: 104,
  WRITE_CHARACTER_PROPERTY: 105,
  READ_SPAWN_PROPERTY: 106,
  WRITE_SPAWN_PROPERTY: 107,
} as const

/**
 * Property address constants for script property access
 */
export const PropertyAddress = {
  // ===== GAME STATE PROPERTIES (0x01-0x03) =====
  GAME_SEED: 0x01,
  GAME_FRAME: 0x02,
  GAME_GRAVITY: 0x03,

  // ===== CHARACTER CORE PROPERTIES (0x10-0x1F) =====
  CHARACTER_ID: 0x10,
  CHARACTER_GROUP: 0x11,
  CHARACTER_POS_X: 0x12,
  CHARACTER_POS_Y: 0x13,
  CHARACTER_VEL_X: 0x14,
  CHARACTER_VEL_Y: 0x15,
  CHARACTER_SIZE_W: 0x16,
  CHARACTER_SIZE_H: 0x17,
  CHARACTER_HEALTH: 0x18,
  CHARACTER_HEALTH_CAP: 0x19,
  CHARACTER_ENERGY: 0x1a,
  CHARACTER_ENERGY_CAP: 0x1b,
  CHARACTER_POWER: 0x1c,
  CHARACTER_WEIGHT: 0x1d,
  CHARACTER_JUMP_FORCE: 0x1e,
  CHARACTER_MOVE_SPEED: 0x1f,

  // ===== CHARACTER ENERGY SYSTEM (0x20-0x23) =====
  CHARACTER_ENERGY_REGEN: 0x20,
  CHARACTER_ENERGY_REGEN_RATE: 0x21,
  CHARACTER_ENERGY_CHARGE: 0x22,
  CHARACTER_ENERGY_CHARGE_RATE: 0x23,

  // ===== CHARACTER ACTION SYSTEM (0x24-0x25) =====
  CHARACTER_LOCKED_ACTION_ID: 0x24,
  CHARACTER_STATUS_EFFECT_COUNT: 0x25,

  // ===== CHARACTER COLLISION FLAGS (0x26-0x29) =====
  CHARACTER_COLLISION_TOP: 0x26,
  CHARACTER_COLLISION_RIGHT: 0x27,
  CHARACTER_COLLISION_BOTTOM: 0x28,
  CHARACTER_COLLISION_LEFT: 0x29,

  // ===== CHARACTER ARMOR VALUES (0x2A-0x32) =====
  CHARACTER_ARMOR_PUNCT: 0x2a,
  CHARACTER_ARMOR_BLAST: 0x2b,
  CHARACTER_ARMOR_FORCE: 0x2c,
  CHARACTER_ARMOR_SEVER: 0x2d,
  CHARACTER_ARMOR_HEAT: 0x2e,
  CHARACTER_ARMOR_CRYO: 0x2f,
  CHARACTER_ARMOR_JOLT: 0x30,
  CHARACTER_ARMOR_ACID: 0x31,
  CHARACTER_ARMOR_VIRUS: 0x32,

  // ===== ENTITY CORE PROPERTIES (0x40-0x44) =====
  ENTITY_DIR_HORIZONTAL: 0x40,
  ENTITY_DIR_VERTICAL: 0x41,
  ENTITY_ENMITY: 0x42,
  ENTITY_TARGET_ID: 0x43,
  ENTITY_TARGET_TYPE: 0x44,

  // ===== SPAWN DEFINITION PROPERTIES (0x50-0x5B) =====
  SPAWN_DEF_DAMAGE_BASE: 0x50,
  SPAWN_DEF_DAMAGE_RANGE: 0x51,
  SPAWN_DEF_CRIT_CHANCE: 0x52,
  SPAWN_DEF_CRIT_MULTIPLIER: 0x53,
  SPAWN_DEF_CHANCE: 0x54,
  SPAWN_DEF_HEALTH_CAP: 0x55,
  SPAWN_DEF_DURATION: 0x56,
  SPAWN_DEF_ELEMENT: 0x57,
  SPAWN_DEF_ARG0: 0x58,
  SPAWN_DEF_ARG1: 0x59,
  SPAWN_DEF_ARG2: 0x5a,
  SPAWN_DEF_ARG3: 0x5b,

  // ===== SPAWN INSTANCE CORE PROPERTIES (0x60-0x6B) =====
  SPAWN_CORE_ID: 0x60,
  SPAWN_OWNER_ID: 0x61,
  SPAWN_OWNER_TYPE: 0x62,
  SPAWN_POS_X: 0x63,
  SPAWN_POS_Y: 0x64,
  SPAWN_VEL_X: 0x65,
  SPAWN_VEL_Y: 0x66,
  SPAWN_INST_HEALTH: 0x67,
  SPAWN_INST_HEALTH_CAP: 0x68,
  SPAWN_INST_ROTATION: 0x69,
  SPAWN_INST_LIFE_SPAN: 0x6a,
  SPAWN_INST_ELEMENT: 0x6b,

  // ===== SPAWN INSTANCE RUNTIME VARIABLES (0x70-0x77) =====
  SPAWN_INST_VAR0: 0x70,
  SPAWN_INST_VAR1: 0x71,
  SPAWN_INST_VAR2: 0x72,
  SPAWN_INST_VAR3: 0x73,
  SPAWN_INST_FIXED0: 0x74,
  SPAWN_INST_FIXED1: 0x75,
  SPAWN_INST_FIXED2: 0x76,
  SPAWN_INST_FIXED3: 0x77,

  // ===== ACTION DEFINITION PROPERTIES (0x80-0x89) =====
  ACTION_DEF_ENERGY_COST: 0x80,
  ACTION_DEF_COOLDOWN: 0x81,
  ACTION_DEF_ARG0: 0x82,
  ACTION_DEF_ARG1: 0x83,
  ACTION_DEF_ARG2: 0x84,
  ACTION_DEF_ARG3: 0x85,
  ACTION_DEF_ARG4: 0x86,
  ACTION_DEF_ARG5: 0x87,
  ACTION_DEF_ARG6: 0x88,
  ACTION_DEF_ARG7: 0x89,

  // ===== ACTION INSTANCE PROPERTIES (0x90-0x99) =====
  ACTION_INST_VAR0: 0x90,
  ACTION_INST_VAR1: 0x91,
  ACTION_INST_VAR2: 0x92,
  ACTION_INST_VAR3: 0x93,
  ACTION_INST_FIXED0: 0x94,
  ACTION_INST_FIXED1: 0x95,
  ACTION_INST_FIXED2: 0x96,
  ACTION_INST_FIXED3: 0x97,
  ACTION_INST_COOLDOWN: 0x98,
  ACTION_INST_LAST_USED_FRAME: 0x99,

  // ===== CONDITION DEFINITION PROPERTIES (0xA0-0xA9) =====
  CONDITION_DEF_ID: 0xa0,
  CONDITION_DEF_ENERGY_MUL: 0xa1,
  CONDITION_DEF_ARG0: 0xa2,
  CONDITION_DEF_ARG1: 0xa3,
  CONDITION_DEF_ARG2: 0xa4,
  CONDITION_DEF_ARG3: 0xa5,
  CONDITION_DEF_ARG4: 0xa6,
  CONDITION_DEF_ARG5: 0xa7,
  CONDITION_DEF_ARG6: 0xa8,
  CONDITION_DEF_ARG7: 0xa9,

  // ===== CONDITION INSTANCE PROPERTIES (0xB0-0xB7) =====
  CONDITION_INST_VAR0: 0xb0,
  CONDITION_INST_VAR1: 0xb1,
  CONDITION_INST_VAR2: 0xb2,
  CONDITION_INST_VAR3: 0xb3,
  CONDITION_INST_FIXED0: 0xb4,
  CONDITION_INST_FIXED1: 0xb5,
  CONDITION_INST_FIXED2: 0xb6,
  CONDITION_INST_FIXED3: 0xb7,

  // ===== STATUS EFFECT DEFINITION PROPERTIES (0xC0-0xC6) =====
  STATUS_EFFECT_DEF_DURATION: 0xc0,
  STATUS_EFFECT_DEF_STACK_LIMIT: 0xc1,
  STATUS_EFFECT_DEF_RESET_ON_STACK: 0xc2,
  STATUS_EFFECT_DEF_CHANCE: 0xc3,
  STATUS_EFFECT_DEF_ARG0: 0xc4,
  STATUS_EFFECT_DEF_ARG1: 0xc5,
  STATUS_EFFECT_DEF_ARG2: 0xc6,

  // ===== STATUS EFFECT INSTANCE PROPERTIES (0xD0-0xD9) =====
  STATUS_EFFECT_INST_VAR0: 0xd0,
  STATUS_EFFECT_INST_VAR1: 0xd1,
  STATUS_EFFECT_INST_VAR2: 0xd2,
  STATUS_EFFECT_INST_VAR3: 0xd3,
  STATUS_EFFECT_INST_FIXED0: 0xd4,
  STATUS_EFFECT_INST_FIXED1: 0xd5,
  STATUS_EFFECT_INST_FIXED2: 0xd6,
  STATUS_EFFECT_INST_FIXED3: 0xd7,
  STATUS_EFFECT_INST_LIFE_SPAN: 0xd8,
  STATUS_EFFECT_INST_STACK_COUNT: 0xd9,
} as const

/**
 * Element type constants
 */
export const Element = {
  PUNCT: 0,
  BLAST: 1,
  FORCE: 2,
  SEVER: 3,
  HEAT: 4,
  CRYO: 5,
  JOLT: 6,
  ACID: 7,
  VIRUS: 8,
} as const

/**
 * Helper functions for building script bytecode
 */
export class ScriptBuilder {
  private bytecode: number[] = []

  addBytes(...bytes: number[]): this {
    this.bytecode.push(...bytes)
    return this
  }

  addOperator(operator: number, ...args: number[]): this {
    this.bytecode.push(operator, ...args)
    return this
  }

  exit(flag: number): this {
    return this.addOperator(OperatorAddress.EXIT, flag)
  }

  exitIfNoEnergy(flag: number): this {
    return this.addOperator(OperatorAddress.EXIT_IF_NO_ENERGY, flag)
  }

  exitIfCooldown(flag: number): this {
    return this.addOperator(OperatorAddress.EXIT_IF_COOLDOWN, flag)
  }

  readProperty(varIndex: number, propertyAddress: number): this {
    return this.addOperator(
      OperatorAddress.READ_PROP,
      varIndex,
      propertyAddress
    )
  }

  writeProperty(propertyAddress: number, varIndex: number): this {
    return this.addOperator(
      OperatorAddress.WRITE_PROP,
      propertyAddress,
      varIndex
    )
  }

  assignByte(varIndex: number, value: number): this {
    return this.addOperator(OperatorAddress.ASSIGN_BYTE, varIndex, value)
  }

  assignFixed(varIndex: number, numerator: number, denominator: number): this {
    return this.addOperator(
      OperatorAddress.ASSIGN_FIXED,
      varIndex,
      numerator,
      denominator
    )
  }

  addFixed(destFixed: number, leftFixed: number, rightFixed: number): this {
    return this.addOperator(
      OperatorAddress.ADD,
      destFixed,
      leftFixed,
      rightFixed
    )
  }

  subFixed(destFixed: number, leftFixed: number, rightFixed: number): this {
    return this.addOperator(
      OperatorAddress.SUB,
      destFixed,
      leftFixed,
      rightFixed
    )
  }

  mulFixed(destFixed: number, leftFixed: number, rightFixed: number): this {
    return this.addOperator(
      OperatorAddress.MUL,
      destFixed,
      leftFixed,
      rightFixed
    )
  }

  divFixed(destFixed: number, leftFixed: number, rightFixed: number): this {
    return this.addOperator(
      OperatorAddress.DIV,
      destFixed,
      leftFixed,
      rightFixed
    )
  }

  addByte(destVar: number, leftVar: number, rightVar: number): this {
    return this.addOperator(
      OperatorAddress.ADD_BYTE,
      destVar,
      leftVar,
      rightVar
    )
  }

  applyEnergyCost(): this {
    return this.addOperator(OperatorAddress.APPLY_ENERGY_COST)
  }

  applyDuration(): this {
    return this.addOperator(OperatorAddress.APPLY_DURATION)
  }

  spawn(spawnIdVar: number): this {
    return this.addOperator(OperatorAddress.SPAWN, spawnIdVar)
  }

  lockAction(): this {
    return this.addOperator(OperatorAddress.LOCK_ACTION)
  }

  unlockAction(): this {
    return this.addOperator(OperatorAddress.UNLOCK_ACTION)
  }

  build(): number[] {
    return [...this.bytecode]
  }

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
