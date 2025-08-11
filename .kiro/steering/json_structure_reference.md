---
inclusion: always
---

# WASM JSON Structure Reference

## CRITICAL: Fixed-Point Number Format

**ALL position, velocity, and fractional values use Fixed-point arithmetic as `[numerator, denominator]` arrays.**

```javascript
// WRONG - assuming simple arrays
const posX = char.pos[0] // ❌ WILL FAIL

// CORRECT - Fixed-point conversion
const posX = char.position[0][0] / char.position[0][1] // ✅ WORKS
```

## Character JSON Structure (get_characters_json)

```javascript
{
  "position": [[1024, 32], [6144, 32]],      // Fixed-point [x, y]
  "velocity": [[0, 32], [0, 32]],            // Fixed-point [vx, vy]
  "dir": [2, 0],                             // [horizontal, vertical] direction
  "collision": [false, false, false, false], // [top, right, bottom, left]
  "energy": 100,                              // Simple integer
  "health": 100,                              // Simple integer
  // ... other fields
}
```

## Helper Function for Debugging

```javascript
function extractCharacterState(char) {
  return {
    pos: {
      x: char.position[0][0] / char.position[0][1],
      y: char.position[1][0] / char.position[1][1],
    },
    vel: {
      x: char.velocity[0][0] / char.velocity[0][1],
      y: char.velocity[1][0] / char.velocity[1][1],
    },
    dir: char.dir,
    collision: char.collision,
    energy: char.energy,
    health: char.health,
  }
}
```

## Direction Values

```javascript
// Horizontal (dir[0]): 0=Left, 1=Neutral, 2=Right
// Vertical (dir[1]): 0=Downward, 1=Neutral, 2=Upward
```

**Full documentation: `wasm-wrapper/docs/JSON_STRUCTURE.md`**
