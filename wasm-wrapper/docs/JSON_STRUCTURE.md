# WASM Wrapper JSON Structure Documentation

## Overview

This document describes the JSON structure returned by WASM wrapper methods like `get_characters_json()`, `get_spawns_json()`, and `get_game_state_json()`. Understanding this structure is CRITICAL for debugging and testing.

## Fixed-Point Number Representation

**CRITICAL**: All position, velocity, and other fractional values use Fixed-point arithmetic represented as `[numerator, denominator]` arrays.

```javascript
// Fixed-point value representation
position: [
  [1024, 32],
  [6144, 32],
] // [[x_num, x_den], [y_num, y_den]]

// Convert to decimal:
const posX = position[0][0] / position[0][1] // 1024/32 = 32.0
const posY = position[1][0] / position[1][1] // 6144/32 = 192.0
```

## Character JSON Structure

### get_characters_json() Returns Array of:

```javascript
{
  "id": 1,                                    // u8 - Character ID
  "group": 1,                                 // u8 - Character group
  "position": [[1024, 32], [6144, 32]],      // [[i16, i16], [i16, i16]] - Fixed-point [x, y]
  "velocity": [[0, 32], [0, 32]],            // [[i16, i16], [i16, i16]] - Fixed-point [vx, vy]
  "health": 100,                              // u16 - Current health
  "health_cap": 100,                          // u16 - Maximum health
  "energy": 100,                              // u8 - Current energy
  "energy_cap": 100,                          // u8 - Maximum energy
  "power": 10,                                // u8 - Power stat
  "weight": 5,                                // u8 - Weight stat
  "jump_force": [160, 32],                    // [i16, i16] - Fixed-point jump force
  "move_speed": [64, 32],                     // [i16, i16] - Fixed-point move speed
  "armor": [0, 0, 0, 0, 0, 0, 0, 0, 0],      // [u8; 9] - Armor values for 9 elements
  "energy_regen": 1,                          // u8 - Energy regeneration amount
  "energy_regen_rate": 60,                    // u8 - Frames between energy regen
  "energy_charge": 5,                         // u8 - Energy charge amount
  "energy_charge_rate": 30,                   // u8 - Frames between energy charge
  "dir": [2, 0],                             // [u8, u8] - [horizontal, vertical] direction
  "enmity": 0,                               // u8 - Enmity level
  "target_id": null,                         // Option<u8> - Target entity ID
  "target_type": 0,                          // u8 - Target entity type
  "size": [16, 32],                          // [u8, u8] - [width, height] in pixels
  "collision": [false, false, false, false], // [bool; 4] - [top, right, bottom, left]
  "locked_action": null,                      // Option<u8> - Locked action ID
  "status_effects": [],                       // Vec<u8> - Active status effect IDs
  "behaviors": [[2, 2], [0, 0], [1, 1]]     // Vec<[usize, usize]> - [condition_id, action_id] pairs
}
```

### Direction System

```javascript
// Horizontal direction (dir[0])
0 = Left
1 = Neutral
2 = Right

// Vertical direction (dir[1]) - Gravity direction
0 = Downward gravity (normal)
1 = Neutral gravity (no gravity effect)
2 = Upward gravity (inverted)
```

### Collision System

```javascript
// collision array: [top, right, bottom, left]
collision: [false, true, true, false] // Touching right wall and ground
```

## Spawn JSON Structure

### get_spawns_json() Returns Array of:

```javascript
{
  "id": 1,                                    // u8 - Spawn instance ID
  "spawn_id": 0,                              // u8 - Spawn definition ID
  "owner_id": 1,                              // u8 - Owner entity ID
  "owner_type": 1,                            // u8 - Owner type (1=Character, 2=Spawn)
  "position": [[1024, 32], [6144, 32]],      // [[i16, i16], [i16, i16]] - Fixed-point [x, y]
  "velocity": [[0, 32], [0, 32]],            // [[i16, i16], [i16, i16]] - Fixed-point [vx, vy]
  "health": 50,                               // u16 - Current health
  "health_cap": 50,                           // u16 - Maximum health
  "rotation": [0, 32],                        // [i16, i16] - Fixed-point rotation
  "life_span": 120,                           // u16 - Remaining lifespan in frames
  "element": 0,                               // Option<u8> - Element type (0-8)
  "dir": [2, 1],                             // [u8, u8] - [horizontal, vertical] direction
  "enmity": 5,                               // u8 - Enmity level
  "target_id": 1,                            // Option<u8> - Target entity ID
  "target_type": 1,                          // u8 - Target entity type
  "size": [8, 8],                           // [u8, u8] - [width, height] in pixels
  "collision": [false, false, false, false], // [bool; 4] - [top, right, bottom, left]
  "runtime_vars": [0, 0, 0, 0],              // [u8; 4] - Runtime variables
  "runtime_fixed": [[0, 32], [0, 32], [0, 32], [0, 32]] // [[i16, i16]; 4] - Runtime fixed-point values
}
```

## Game State JSON Structure

### get_game_state_json() Returns:

```javascript
{
  "frame": 150,                               // u16 - Current frame number
  "seed": 12345,                              // u16 - Random seed
  "gravity": [32, 64],                        // [i16, i16] - Fixed-point gravity value
  "status": "playing",                        // String - "playing" or "ended"
  "characters": [...],                        // Array of character objects (see above)
  "spawns": [...],                           // Array of spawn objects (see above)
  "status_effects": [...],                   // Array of status effect objects
  "tilemap": [                               // Vec<Vec<u8>> - 15x16 tilemap
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    // ... 13 more rows
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
  ]
}
```

## Status Effect JSON Structure

```javascript
{
  "instance_id": 0,                           // u8 - Status effect instance ID
  "definition_id": 0,                         // usize - Status effect definition ID
  "life_span": 60,                           // u16 - Remaining duration in frames
  "stack_count": 1,                          // u8 - Number of stacks
  "runtime_vars": [0, 0, 0, 0],              // [u8; 4] - Runtime variables
  "runtime_fixed": [[0, 32], [0, 32], [0, 32], [0, 32]] // [[i16, i16]; 4] - Runtime fixed-point values
}
```

## Common Debugging Patterns

### Extract Character Position and Velocity

```javascript
const charactersJson = gameWrapper.get_characters_json()
const characters = JSON.parse(charactersJson)
const char = characters[0]

// Convert Fixed-point to decimal
const posX = char.position[0][0] / char.position[0][1]
const posY = char.position[1][0] / char.position[1][1]
const velX = char.velocity[0][0] / char.velocity[0][1]
const velY = char.velocity[1][0] / char.velocity[1][1]

console.log(`Position: (${posX.toFixed(1)}, ${posY.toFixed(1)})`)
console.log(`Velocity: (${velX.toFixed(1)}, ${velY.toFixed(1)})`)
console.log(`Direction: [${char.dir[0]}, ${char.dir[1]}]`)
console.log(`Collision: [${char.collision.join(', ')}]`)
```

### Helper Function for Fixed-Point Conversion

```javascript
function fixedToDecimal(fixedArray) {
  return fixedArray[0] / fixedArray[1]
}

function extractCharacterState(char) {
  return {
    id: char.id,
    pos: {
      x: fixedToDecimal(char.position[0]),
      y: fixedToDecimal(char.position[1]),
    },
    vel: {
      x: fixedToDecimal(char.velocity[0]),
      y: fixedToDecimal(char.velocity[1]),
    },
    dir: char.dir,
    collision: char.collision,
    energy: char.energy,
    health: char.health,
  }
}

// Usage
const state = JSON.parse(gameWrapper.get_characters_json())
const char = extractCharacterState(state[0])
console.log('Character state:', char)
```

### Frame-by-Frame Analysis Template

```javascript
for (let frame = 1; frame <= 30; frame++) {
  const beforeState = JSON.parse(gameWrapper.get_characters_json())
  const beforeChar = extractCharacterState(beforeState[0])

  gameWrapper.step_frame()

  const afterState = JSON.parse(gameWrapper.get_characters_json())
  const afterChar = extractCharacterState(afterState[0])

  console.log(`Frame ${frame}:`)
  console.log(
    `  Before: pos=(${beforeChar.pos.x.toFixed(1)}, ${beforeChar.pos.y.toFixed(
      1
    )}), vel=(${beforeChar.vel.x.toFixed(1)}, ${beforeChar.vel.y.toFixed(
      1
    )}), dir=[${beforeChar.dir[0]}, ${beforeChar.dir[1]}]`
  )
  console.log(
    `  After:  pos=(${afterChar.pos.x.toFixed(1)}, ${afterChar.pos.y.toFixed(
      1
    )}), vel=(${afterChar.vel.x.toFixed(1)}, ${afterChar.vel.y.toFixed(
      1
    )}), dir=[${afterChar.dir[0]}, ${afterChar.dir[1]}]`
  )

  // Check for changes
  if (beforeChar.dir[1] !== afterChar.dir[1]) {
    console.log(
      `  *** GRAVITY DIRECTION CHANGED: ${beforeChar.dir[1]} -> ${afterChar.dir[1]} ***`
    )
  }
}
```

## CRITICAL NOTES

1. **NEVER assume simple arrays for position/velocity** - they are always Fixed-point `[numerator, denominator]` pairs
2. **Direction values are 0/1/2**, not -1/0/+1 like in scripts
3. **Collision array is [top, right, bottom, left]**, not [left, right, top, bottom]
4. **All Fixed-point values must be converted** using division: `value[0] / value[1]`
5. **Energy and health are simple integers**, not Fixed-point
6. **Frame numbers start at 0** and increment each step

## File Location

This documentation is located at `wasm-wrapper/docs/JSON_STRUCTURE.md` and should be referenced whenever working with WASM JSON output.

## Related Files

- `wasm-wrapper/src/types.rs` - Rust type definitions
- `wasm-wrapper/src/lib.rs` - WASM wrapper implementation
- `debug-node/` - Node.js debugging scripts using this JSON structure
