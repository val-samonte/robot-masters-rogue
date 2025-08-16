# Design Document

## Overview

Simple bullet shooting system using the existing spawn system. Characters will randomly shoot bullets that travel horizontally and despawn after 3 seconds.

## Architecture

### Components

1. **Random Condition** - 20% chance trigger
2. **Shoot Action** - Creates a bullet spawn
3. **Bullet Spawn** - Horizontal movement script with 3-second lifespan

## Implementation Details

### 1. Random Condition (20% Chance)

```javascript
// Condition script that returns true 20% of the time
RANDOM_20_PERCENT: [
  ASSIGN_RANDOM,
  0,
  100, // vars[0] = random(0-99)
  LESS_THAN,
  1,
  0,
  20, // vars[1] = (vars[0] < 20)
  EXIT_WITH_VAR,
  1, // return vars[1]
]
```

### 2. Shoot Action

```javascript
// Action that creates a bullet spawn
SHOOT_BULLET: [
  ASSIGN_BYTE,
  0,
  0, // vars[0] = 0 (bullet spawn ID)
  SPAWN,
  0, // Create spawn with ID from vars[0]
  EXIT,
  1, // Success
]
```

### 3. Bullet Spawn Configuration

- **Size**: 8x4 pixels (small bullet)
- **Duration**: 180 frames (3 seconds at 60 FPS)
- **Behavior**: Move horizontally based on owner's direction

### 4. Bullet Movement Script

```javascript
// Bullet behavior script - move horizontally
BULLET_BEHAVIOR: [
  READ_PROP,
  0,
  ENTITY_DIR_HORIZONTAL, // Read owner direction
  READ_PROP,
  1,
  CHARACTER_MOVE_SPEED, // Read movement speed
  MUL,
  2,
  0,
  1, // Calculate velocity
  WRITE_PROP,
  CHARACTER_VEL_X,
  2, // Set horizontal velocity
  EXIT,
  1, // Continue existing
]
```

## Data Models

### Character Configuration

- Add behavior: `[RANDOM_20_PERCENT, SHOOT_BULLET]`
- No other changes needed

### Spawn Definition

```javascript
{
  id: 0,
  size: [8, 4],           // Small bullet size
  damage_base: 10,        // Basic damage
  damage_range: 0,        // No variance
  health_cap: 1,          // Dies in one hit
  duration: 180,          // 3 seconds
  element: 0,             // No element
  behavior_script: BULLET_BEHAVIOR,
  collision_script: [],   // No collision response
  despawn_script: []      // No special despawn
}
```

## Testing Strategy

Simple visual verification:

1. Run the game in web viewer
2. Watch characters occasionally shoot bullets
3. Verify bullets move horizontally
4. Verify bullets disappear after ~3 seconds

No complex testing framework needed - just visual confirmation that it works.
