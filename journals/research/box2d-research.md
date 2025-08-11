# Box2D Standard Collision Detection Research

## The Bouncing Problem

The issue we're experiencing is a classic problem in physics engines where objects at exact boundary positions (like y=192 with bottom=224 at ground level) experience micro-bouncing due to floating-point precision issues.

## Box2D's Solution

Box2D solves this with several key concepts:

### 1. Linear Slop (b2_linearSlop)

- **Value**: 0.005 meters (in Box2D units)
- **Purpose**: Tolerance for collision detection to prevent jittering
- **Usage**: Objects within this distance are considered "touching" but not penetrating

### 2. Contact Offset

- **Purpose**: Creates a "skin" around objects
- **Effect**: Collision detection triggers slightly before actual contact
- **Benefit**: Prevents deep penetration that causes bouncing

### 3. Velocity Bias

- **Purpose**: Applies small corrective velocities to separate overlapping objects
- **Method**: Uses position error to calculate bias velocity
- **Result**: Smooth separation without visible bouncing

### 4. Contact Persistence

- **Purpose**: Maintains contact information across frames
- **Benefit**: Prevents contact creation/destruction oscillation
- **Implementation**: Contacts are cached and updated rather than recreated

## Implementation for Our Engine

For our fixed-point deterministic engine, we should implement:

### 1. Contact Tolerance (Linear Slop equivalent)

```rust
const CONTACT_TOLERANCE: Fixed = Fixed::from_raw(164); // ~0.005 in our fixed-point scale
```

### 2. Collision Detection with Offset

- Check collision with tolerance: `distance <= CONTACT_TOLERANCE`
- Treat objects as "resting contact" when within tolerance
- Only apply separation if penetration > tolerance

### 3. Resting Contact Handling

- When object is within tolerance of ground: set velocity.y = 0
- Apply normal force to counteract gravity
- Prevent micro-bouncing by clamping small velocities to zero

### 4. Position Correction with Bias

- Instead of immediate position snapping, use gradual correction
- Apply bias velocity over multiple frames
- Prevents sudden position changes that cause bouncing

## Specific Fix for Our Bouncing Bug

The character bouncing between y=192 and y=192.5 should be handled as:

1. **Detect resting contact**: bottom_edge within CONTACT_TOLERANCE of ground
2. **Clamp position**: Set y = ground_level - character_height
3. **Zero vertical velocity**: Prevent further falling
4. **Apply normal force**: Counter gravity to maintain position

This is the industry-standard approach used by Box2D, Bullet Physics, and other established engines.
