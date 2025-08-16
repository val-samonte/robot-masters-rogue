# Frame Processing Order Implementation Summary

## Task: 11.3. Fix frame processing order and timing

### Problem Identified

The original frame processing order was causing collision detection timing issues:

1. **Position correction happened during collision checking** - This caused conflicts between position correction and velocity constraints
2. **Collision flags were set before final position** - Behaviors in the next frame saw outdated collision flags
3. **Behaviors couldn't respond correctly** - Turn-around behaviors failed because collision state was inaccurate

### Original Frame Processing Order (PROBLEMATIC)

```
1. Process status effects
2. Execute character behaviors (sets velocity)
3. Apply gravity to velocity
4. Check collisions and constrain velocity + CORRECT POSITION (conflict!)
5. Apply velocity to position
```

### New Frame Processing Order (FIXED)

```
1. Process status effects
2. Correct position overlaps FIRST (before any movement)
3. Execute character behaviors (sets velocity based on current collision flags)
4. Apply gravity to velocity
5. Check collisions and constrain velocity (without position correction)
6. Apply constrained velocity to position
7. Update collision flags for next frame (after final position is set)
```

## Implementation Changes

### 1. Modified `advance_frame()` method

- Updated the frame processing pipeline to use the new order
- Added calls to new methods at appropriate stages

### 2. Added `correct_position_overlaps()` method

- Handles position overlap correction at the beginning of frame processing
- Ensures entities are in valid positions before behaviors execute
- Applies to both characters and spawns

### 3. Added `check_and_constrain_velocity_only()` method

- Handles collision detection and velocity constraints without position correction
- Separates velocity constraint logic from position correction
- Cleaner separation of concerns

### 4. Added `update_collision_flags_for_next_frame()` method

- Updates collision flags after final entity positions are determined
- Uses 1-pixel probe rectangles for accurate collision detection
- Ensures behaviors see accurate collision state in the next frame

### 5. Kept legacy `check_and_constrain_movement()` method

- Maintained for compatibility (though it now just calls the new method)
- Generates a warning but doesn't break existing code

## Key Improvements

### ✅ Timing Fixes

- **Position correction happens BEFORE behaviors execute**
- **Collision flags updated AFTER final position is set**
- **No more conflicts between position correction and movement**

### ✅ Behavior Accuracy

- **Behaviors see accurate collision state from previous frame**
- **Turn-around behaviors can trigger correctly**
- **Characters can move away from walls after turning around**

### ✅ Stability Improvements

- **No more position jumps from conflicting correction/movement**
- **Consistent collision detection timing**
- **Predictable entity behavior**

## Expected Outcomes

### For Wall Collision Scenarios:

1. Character approaches wall
2. Position correction ensures character isn't overlapping
3. Behavior executes based on accurate collision flags
4. Velocity is set appropriately (e.g., turn around)
5. Collision detection constrains movement
6. Position is updated with constrained velocity
7. Collision flags are updated for next frame

### For Turn-Around Behaviors:

- Character hitting wall will have `collision[1] = true` (right collision)
- Turn-around behavior will see this flag and execute
- Character direction will change
- Character can then move away from the wall

## Testing

The implementation has been verified to:

- ✅ Compile successfully in both game engine and WASM wrapper
- ✅ Maintain all existing functionality
- ✅ Follow the new frame processing order
- ✅ Separate position correction from velocity constraints
- ✅ Update collision flags at the correct timing

## Files Modified

- `game-engine/src/state.rs`: Updated frame processing order and added new methods
- Created test scripts to verify the implementation

## Compatibility

- All existing code continues to work
- No breaking changes to public APIs
- Legacy method maintained for compatibility
- Only internal frame processing order changed

This implementation resolves the collision detection timing issues and provides a solid foundation for accurate collision-based behaviors.
