# Script Constants Reference

This document provides a comprehensive reference for all script constants used in the Robot Masters game engine.

## Operator Constants

### Control Flow (0-4)

- `EXIT = 0` - Exit script execution
- `EXIT_IF_NO_ENERGY = 1` - Exit if insufficient energy
- `EXIT_IF_COOLDOWN = 2` - Exit if action is on cooldown
- `SKIP = 3` - Skip specified number of bytes
- `GOTO = 4` - Jump to specified position

### Property Operations (10-11)

- `READ_PROP = 10` - Read property into variable: `[ReadProp, var_index, prop_address]`
- `WRITE_PROP = 11` - Write variable to property: `[WriteProp, prop_address, var_index]`

### Variable Operations (20-24)

- `ASSIGN_BYTE = 20` - Assign byte literal: `[AssignByte, var_index, literal_value]`
- `ASSIGN_FIXED = 21` - Assign fixed-point value: `[AssignFixed, var_index, numerator, denominator]`
- `ASSIGN_RANDOM = 22` - Assign random value: `[AssignRandom, var_index]`
- `TO_BYTE = 23` - Convert fixed to byte: `[ToByte, to_var_index, from_fixed_index]`
- `TO_FIXED = 24` - Convert byte to fixed: `[ToFixed, to_fixed_index, from_var_index]`

### Fixed-Point Arithmetic (30-34)

- `ADD = 30` - Add fixed-point values: `[Add, dest_fixed, left_fixed, right_fixed]`
- `SUB = 31` - Subtract fixed-point values: `[Sub, dest_fixed, left_fixed, right_fixed]`
- `MUL = 32` - Multiply fixed-point values: `[Mul, dest_fixed, left_fixed, right_fixed]`
- `DIV = 33` - Divide fixed-point values: `[Div, dest_fixed, left_fixed, right_fixed]`

### Byte Arithmetic (40-44)

- `ADD_BYTE = 40` - Add byte values: `[AddByte, dest_var, left_var, right_var]`
- `SUB_BYTE = 41` - Subtract byte values: `[SubByte, dest_var, left_var, right_var]`
- `MUL_BYTE = 42` - Multiply byte values: `[MulByte, dest_var, left_var, right_var]`
- `DIV_BYTE = 43` - Divide byte values: `[DivByte, dest_var, left_var, right_var]`
- `MOD_BYTE = 44` - Modulo byte values: `[ModByte, dest_var, left_var, right_var]`

### Comparison Operations (50-54)

- `EQUAL = 50` - Equal comparison: `[Equal, dest_var, left_var, right_var]`
- `NOT_EQUAL = 51` - Not equal comparison: `[NotEqual, dest_var, left_var, right_var]`
- `LESS_THAN = 52` - Less than comparison: `[LessThan, dest_var, left_var, right_var]`
- `GREATER_THAN = 53` - Greater than comparison: `[GreaterThan, dest_var, left_var, right_var]`
- `LESS_EQUAL = 54` - Less than or equal: `[LessEqual, dest_var, left_var, right_var]`

### Logical Operations (60-62)

- `NOT = 60` - Logical NOT: `[Not, dest_var, src_var]`
- `OR = 61` - Logical OR: `[Or, dest_var, left_var, right_var]`
- `AND = 62` - Logical AND: `[And, dest_var, left_var, right_var]`

### Math Functions (70-71)

- `MIN = 70` - Minimum value: `[Min, dest_var, left_var, right_var]`
- `MAX = 71` - Maximum value: `[Max, dest_var, left_var, right_var]`

### Game Actions (80-85)

- `LOCK_ACTION = 80` - Lock current action
- `UNLOCK_ACTION = 81` - Unlock current action
- `APPLY_ENERGY_COST = 82` - Apply energy cost
- `APPLY_DURATION = 83` - Apply duration
- `SPAWN = 84` - Spawn entity: `[Spawn, spawn_id_var]`
- `SPAWN_WITH_VARS = 85` - Spawn with variables: `[SpawnWithVars, spawn_id_var, var1, var2, var3, var4]`

### Debug Operations (90-91)

- `LOG_VARIABLE = 90` - Log variable value: `[LogVariable, var_index]`
- `EXIT_WITH_VAR = 91` - Exit with variable value: `[ExitWithVar, var_index]`

## Property Address Constants

### Game Properties (0x01-0x0F)

- `GAME_SEED = 0x01` - Game seed value
- `GAME_FRAME = 0x02` - Current game frame

### Character Core Properties (0x10-0x1F)

- `CHARACTER_ID = 0x10` - Character ID (byte)
- `CHARACTER_GROUP = 0x11` - Character group (byte)
- `CHARACTER_POS_X = 0x12` - Position X (fixed-point)
- `CHARACTER_POS_Y = 0x13` - Position Y (fixed-point)
- `CHARACTER_VEL_X = 0x14` - Velocity X (fixed-point)
- `CHARACTER_VEL_Y = 0x15` - Velocity Y (fixed-point)
- `CHARACTER_SIZE_W = 0x16` - Size width (fixed-point)
- `CHARACTER_SIZE_H = 0x17` - Size height (fixed-point)
- `CHARACTER_HEALTH = 0x18` - Health (u16)
- `CHARACTER_HEALTH_CAP = 0x19` - Health cap (u16)
- `CHARACTER_ENERGY = 0x1A` - Energy (byte)
- `CHARACTER_ENERGY_CAP = 0x1B` - Energy cap (byte)
- `CHARACTER_POWER = 0x1C` - Power (byte)
- `CHARACTER_WEIGHT = 0x1D` - Weight (byte)
- `CHARACTER_JUMP_FORCE = 0x1E` - Jump force (fixed-point)
- `CHARACTER_MOVE_SPEED = 0x1F` - Move speed (fixed-point)

### Character Energy System (0x20-0x23)

- `CHARACTER_ENERGY_REGEN = 0x20` - Energy regen amount (byte)
- `CHARACTER_ENERGY_REGEN_RATE = 0x21` - Energy regen rate (byte)
- `CHARACTER_ENERGY_CHARGE = 0x22` - Energy charge amount (byte)
- `CHARACTER_ENERGY_CHARGE_RATE = 0x23` - Energy charge rate (byte)

### Character Armor (0x2A-0x32)

- `CHARACTER_ARMOR_NORMAL = 0x2A` - Normal armor (byte)
- `CHARACTER_ARMOR_FIRE = 0x2B` - Fire armor (byte)
- `CHARACTER_ARMOR_ICE = 0x2C` - Ice armor (byte)
- `CHARACTER_ARMOR_ELEC = 0x2D` - Electric armor (byte)
- `CHARACTER_ARMOR_WOOD = 0x2E` - Wood armor (byte)
- `CHARACTER_ARMOR_WIND = 0x2F` - Wind armor (byte)
- `CHARACTER_ARMOR_AQUA = 0x30` - Aqua armor (byte)
- `CHARACTER_ARMOR_JOLT = 0x31` - Jolt armor (byte)
- `CHARACTER_ARMOR_ACID = 0x32` - Acid armor (byte)
- `CHARACTER_ARMOR_VIRUS = 0x33` - Virus armor (byte)

### Entity Direction (0x40-0x42)

- `ENTITY_DIR_HORIZONTAL = 0x40` - Horizontal direction (byte: 0=left, 1=right)
- `ENTITY_DIR_VERTICAL = 0x41` - Vertical direction (byte: 0=upward, 1=downward)
- `ENTITY_ENMITY = 0x42` - Enmity level (byte)

## Common Script Patterns

### Always True Condition

```
[20, 0, 1, 91, 0]
```

- Set variable 0 to 1, return it (always true)

### Move Right

```
[21, 0, 2, 1, 11, 20, 0, 0]
```

- Set X velocity to 2.0, exit

### Move Left

```
[21, 0, 254, 1, 11, 20, 0, 0]
```

- Set X velocity to -2.0 (254 = -2 in two's complement), exit

### Jump Up

```
[21, 0, 251, 1, 11, 21, 0, 0]
```

- Set Y velocity to -5.0 (251 = -5 in two's complement), exit

### Stop Movement

```
[21, 0, 0, 1, 11, 20, 0, 21, 1, 0, 1, 11, 21, 1, 0]
```

- Set both X and Y velocity to 0.0, exit

## Two's Complement Reference

For negative numbers in ASSIGN_FIXED numerator:

- -1 = 255
- -2 = 254
- -3 = 253
- -4 = 252
- -5 = 251
- -10 = 246
- -16 = 240
- -32 = 224

## Decimal Conversions

Common property addresses in decimal:

- `CHARACTER_VEL_X = 0x14 = 20`
- `CHARACTER_VEL_Y = 0x15 = 21`
- `CHARACTER_POS_X = 0x12 = 18`
- `CHARACTER_POS_Y = 0x13 = 19`
- `CHARACTER_HEALTH = 0x18 = 24`
- `CHARACTER_ENERGY = 0x1A = 26`
