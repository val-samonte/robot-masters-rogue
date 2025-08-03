# Property Address Reorganization Summary

## Task Completed: Defragment and reorganize property address constants (Final Cleanup)

### Changes Made

#### 1. Reorganized Property Address Space

The property addresses have been reorganized into logical, sequential blocks by entity type:

- **Game State**: 0x01-0x0F (15 addresses reserved)
- **Character Properties**: 0x10-0x3F (48 addresses reserved)
- **Entity Core Properties**: 0x40-0x4F (16 addresses reserved)
- **Spawn Properties**: 0x50-0x7F (48 addresses reserved)
- **Action Properties**: 0x80-0x9F (32 addresses reserved)
- **Condition Properties**: 0xA0-0xBF (32 addresses reserved)
- **Status Effect Properties**: 0xC0-0xDF (32 addresses reserved)
- **Reserved for Future**: 0xE0-0xFF (32 addresses reserved)

#### 2. Address Mapping Changes

**Character Properties** (moved from 0x20-0x48 to 0x10-0x3F):

- CHARACTER_ID: 0x20 → 0x10
- CHARACTER_GROUP: 0x21 → 0x11
- CHARACTER_POS_X: 0x22 → 0x12
- CHARACTER_POS_Y: 0x23 → 0x13
- CHARACTER_VEL_X: 0x24 → 0x14
- CHARACTER_VEL_Y: 0x25 → 0x15
- CHARACTER_SIZE_W: 0x26 → 0x16
- CHARACTER_SIZE_H: 0x27 → 0x17
- CHARACTER_HEALTH: 0x28 → 0x18
- CHARACTER_HEALTH_CAP: 0x2B → 0x19
- CHARACTER_ENERGY: 0x29 → 0x1A
- CHARACTER_ENERGY_CAP: 0x2A → 0x1B
- CHARACTER_POWER: 0x2C → 0x1C
- CHARACTER_WEIGHT: 0x2D → 0x1D
- CHARACTER_JUMP_FORCE: 0x2E → 0x1E
- CHARACTER_MOVE_SPEED: 0x2F → 0x1F
- CHARACTER_ENERGY_REGEN: 0x30 → 0x20
- CHARACTER_ENERGY_REGEN_RATE: 0x31 → 0x21
- CHARACTER_ENERGY_CHARGE: 0x32 → 0x22
- CHARACTER_ENERGY_CHARGE_RATE: 0x33 → 0x23
- CHARACTER_LOCKED_ACTION_ID: 0x34 → 0x24
- CHARACTER_STATUS_EFFECT_COUNT: 0x39 → 0x25
- CHARACTER_COLLISION_TOP: 0x35 → 0x26
- CHARACTER_COLLISION_RIGHT: 0x36 → 0x27
- CHARACTER_COLLISION_BOTTOM: 0x37 → 0x28
- CHARACTER_COLLISION_LEFT: 0x38 → 0x29
- CHARACTER_ARMOR_PUNCT: 0x40 → 0x2A
- CHARACTER_ARMOR_BLAST: 0x41 → 0x2B
- CHARACTER_ARMOR_FORCE: 0x42 → 0x2C
- CHARACTER_ARMOR_SEVER: 0x43 → 0x2D
- CHARACTER_ARMOR_HEAT: 0x44 → 0x2E
- CHARACTER_ARMOR_CRYO: 0x45 → 0x2F
- CHARACTER_ARMOR_JOLT: 0x46 → 0x30
- CHARACTER_ARMOR_ACID: 0x47 → 0x31
- CHARACTER_ARMOR_VIRUS: 0x48 → 0x32

**Entity Core Properties** (moved from 0x50-0x54 to 0x40-0x44):

- ENTITY_DIR_HORIZONTAL: 0x50 → 0x40
- ENTITY_DIR_VERTICAL: 0x51 → 0x41
- ENTITY_ENMITY: 0x52 → 0x42
- ENTITY_TARGET_ID: 0x53 → 0x43
- ENTITY_TARGET_TYPE: 0x54 → 0x44

**Spawn Properties** (consolidated from scattered addresses to 0x50-0x7F):

- SPAWN_DEF_DAMAGE_BASE: 0x60 → 0x50
- SPAWN_DEF_DAMAGE_RANGE: 0x61 → 0x51
- SPAWN_DEF_CRIT_CHANCE: 0x62 → 0x52
- SPAWN_DEF_CRIT_MULTIPLIER: 0x63 → 0x53
- SPAWN_DEF_CHANCE: 0x64 → 0x54
- SPAWN_DEF_HEALTH_CAP: 0x65 → 0x55
- SPAWN_DEF_DURATION: 0x66 → 0x56
- SPAWN_DEF_ELEMENT: 0x67 → 0x57
- SPAWN_DEF_ARG0-3: 0x68-0x6B → 0x58-0x5B
- SPAWN_CORE_ID: 0x55 → 0x60
- SPAWN_OWNER_ID: 0x56 → 0x61
- SPAWN_OWNER_TYPE: 0x57 → 0x62
- SPAWN_POS_X: 0x58 → 0x63
- SPAWN_POS_Y: 0x59 → 0x64
- SPAWN_VEL_X: 0x5A → 0x65
- SPAWN_VEL_Y: 0x5B → 0x66
- SPAWN_INST_HEALTH: 0xBA → 0x67
- SPAWN_INST_HEALTH_CAP: 0xBB → 0x68
- SPAWN_INST_ROTATION: 0xBC → 0x69
- SPAWN_INST_LIFE_SPAN: 0xBD → 0x6A
- SPAWN_INST_ELEMENT: 0xB9 → 0x6B
- SPAWN_INST_VAR0-3: 0xB0-0xB3 → 0x70-0x73
- SPAWN_INST_FIXED0-3: 0xB4-0xB7 → 0x74-0x77

**Action Properties** (moved from 0x04-0x0F and 0x80-0x89 to 0x80-0x99):

- ACTION_DEF_ENERGY_COST: 0x04 → 0x80
- ACTION_DEF_COOLDOWN: 0x07 → 0x81
- ACTION_DEF_ARG0-7: 0x08-0x0F → 0x82-0x89
- ACTION_INST_VAR0-3: 0x80-0x83 → 0x90-0x93
- ACTION_INST_FIXED0-3: 0x84-0x87 → 0x94-0x97
- ACTION_INST_COOLDOWN: 0x88 → 0x98
- ACTION_INST_LAST_USED_FRAME: 0x89 → 0x99

**Condition Properties** (moved from 0x10-0x19 and 0x90-0x97 to 0xA0-0xB7):

- CONDITION_DEF_ID: 0x10 → 0xA0
- CONDITION_DEF_ENERGY_MUL: 0x11 → 0xA1
- CONDITION_DEF_ARG0-7: 0x12-0x19 → 0xA2-0xA9
- CONDITION_INST_VAR0-3: 0x90-0x93 → 0xB0-0xB3
- CONDITION_INST_FIXED0-3: 0x94-0x97 → 0xB4-0xB7

**Status Effect Properties** (moved from 0x1A-0x1F, 0x49, and 0xA0-0xA9 to 0xC0-0xD9):

- STATUS_EFFECT_DEF_DURATION: 0x1A → 0xC0
- STATUS_EFFECT_DEF_STACK_LIMIT: 0x1B → 0xC1
- STATUS_EFFECT_DEF_RESET_ON_STACK: 0x1C → 0xC2
- STATUS_EFFECT_DEF_CHANCE: 0x1D → 0xC3
- STATUS_EFFECT_DEF_ARG0-2: 0x1E-0x1F, 0x49 → 0xC4-0xC6
- STATUS_EFFECT_INST_VAR0-3: 0xA0-0xA3 → 0xD0-0xD3
- STATUS_EFFECT_INST_FIXED0-3: 0xA4-0xA7 → 0xD4-0xD7
- STATUS_EFFECT_INST_LIFE_SPAN: 0xA8 → 0xD8
- STATUS_EFFECT_INST_STACK_COUNT: 0xA9 → 0xD9

#### 3. Updated Property Address Compatibility Ranges

**Script Engine (script.rs)**:

- Character property compatibility: 0x20-0x48 → 0x10-0x3F
- Entity Core compatibility: 0x50-0x68 → 0x40-0x4F
- Spawn property compatibility: 0x52-0xBE → 0x50-0x7F

**State Management (state.rs)**:

- Character property validation: 0x20-0x48 → 0x10-0x3F
- Spawn property validation: 0x52-0xBE → 0x50-0x7F

### Benefits Achieved

1. **Eliminated Fragmentation**: All property addresses are now organized in contiguous blocks
2. **Logical Grouping**: Related properties are grouped together by entity type
3. **Reserved Expansion Space**: Each entity type has reserved address ranges for future properties
4. **No Address Conflicts**: All 130 addresses are unique and within u8 range (0-255)
5. **Maintainable Structure**: Clear organization makes it easy to add new properties
6. **Efficient Address Space Usage**: Uses addresses 0x01-0xD9 with room for expansion up to 0xFF

### Verification Results

- ✅ All 130 addresses are unique
- ✅ All addresses are within u8 range (0-255)
- ✅ No address conflicts detected
- ✅ Code compiles successfully
- ✅ Property address compatibility ranges updated correctly
- ✅ Reserved ranges provide room for future expansion

### Future Expansion Capacity

- Game State: 12 unused addresses (0x04-0x0F)
- Character: 13 unused addresses (0x33-0x3F)
- Entity Core: 11 unused addresses (0x45-0x4F)
- Spawn: 8 unused addresses (0x78-0x7F)
- Action: 6 unused addresses (0x9A-0x9F)
- Condition: 8 unused addresses (0xB8-0xBF)
- Status Effect: 6 unused addresses (0xDA-0xDF)
- Future Expansion: 32 unused addresses (0xE0-0xFF)

**Total unused capacity: 96 addresses available for future expansion**
