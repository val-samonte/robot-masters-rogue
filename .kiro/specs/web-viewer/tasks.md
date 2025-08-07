# Implementation Plan

- [x] 1. Set up project structure and basic configuration

  - Create Vite + React + TypeScript project in web-viewer directory
  - Configure Tailwind 4 for styling
  - Set up Jotai for state management
  - Add React PIXI dependencies
  - Configure TypeScript for WASM wrapper integration
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 2. Create script constants library

  - Define ACTION_SCRIPTS constants with proper bytecode arrays
  - Define CONDITION_SCRIPTS constants with proper bytecode arrays
  - Use TypeScript constants from wasm-wrapper project for operator and property addresses
  - Import constants from wasm-wrapper/tests/constants.ts to avoid magic numbers
  - Implement run, turn around, jump, wall jump, and charge actions
  - Implement always, chance-based, energy-based, and collision-based conditions
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 3. Implement WASM wrapper integration

  - Set up WASM wrapper loading and initialization
  - Create Jotai atoms for game state management
  - Implement configuration loading and validation
  - Add error handling for WASM operations
  - Create helper functions for game state updates
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 4. Test script constants with WASM integration

  - Create test configurations using script constants from task 2
  - Verify ACTION_SCRIPTS work correctly with WASM game engine
  - Test CONDITION_SCRIPTS trigger properly in game scenarios
  - Validate script template mixing functionality
  - Test all action types: run, turn around, jump, wall jump, and charge
  - Test all condition types: always, chance-based, energy-based, and collision-based
  - Verify proper energy consumption and timing mechanics
  - Add debugging output for script execution validation
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2_

- [x] 5. Create configuration loader component

  - Build file input component for JSON configuration loading
  - Add configuration validation and error display
  - Implement script template mixing functionality
  - Allow easy swapping of actions and conditions in configurations
  - Add configuration preview and editing capabilities
  - _Requirements: 2.1, 2.2, 2.3, 1.4_

- [x] 6. Implement React PIXI game canvas

  - Set up React PIXI application and stage
  - Create tilemap background rendering
  - Implement character rendering based on position and size
  - Add spawn entity rendering
  - Create responsive viewport and scaling system
  - _Requirements: 3.1, 3.2, 3.3, 3.5_

- [x] 7. Add game state visualization

  - Connect PIXI rendering to Jotai game state atoms
  - Update entity positions based on game state changes
  - Display character properties and status indicators
  - Show spawn properties and visual effects
  - Implement real-time state updates during game execution
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 4.3_

- [x] 8. Create basic game controls and 60fps game loop

  - Implement 60fps game loop using requestAnimationFrame or PIXI ticker
  - Add play/pause/step functionality to control game execution
  - Implement frame counter and timing display
  - Create reset functionality to return to initial state
  - Add game status indicators (playing, paused, ended)
  - Handle automatic pause when game ends
  - Ensure smooth real-time game state updates and rendering
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 9. Implement global gravity system

  - Add global gravity as Fixed type to GameState with default value (e.g., Fixed::from_int(1) for downward)
  - Implement GAME_GRAVITY property accessor with both READ and WRITE access in script property system
  - Enable scripts to dynamically modify gravity during gameplay (e.g., gravity wells, anti-gravity zones)
  - Add gravity application in physics update loop - apply to entity velocity each frame
  - Implement gravity direction system using existing dir.1 (vertical direction) property:
    - dir.1 = 0: Downward gravity (multiply game_gravity by +1.0)
    - dir.1 = 1: Neutral gravity (multiply game_gravity by 0.0 - no gravity effect)
    - dir.1 = 2: Upward gravity (multiply game_gravity by -1.0 - inverted)
  - Apply gravity calculation: entity_velocity.y += game_state.gravity \* gravity_multiplier
  - Ensure both characters and spawns use the same dir.1 system for gravity control
  - Characters default to dir.1 = 0 (affected by downward gravity)
  - Spawns default to dir.1 = 1 (neutral - not affected by gravity)
  - Support inverted gravity (negative Fixed values for upward gravity)
  - Add gravity field to game configuration interface for initial setup
  - Document gravity direction system in code comments and constants file:
    - Document dir.1 values: 0=downward, 1=neutral, 2=upward
    - Document gravity calculation formula: velocity.y += gravity \* direction_multiplier
    - Document default values: characters=0 (downward), spawns=1 (neutral)
  - _Requirements: Core physics functionality for realistic movement_

- [x] 10. Fix collision detection and wall constraints

  - Fix collision detection to properly prevent movement into walls
  - Ensure collision detection works for all directions (top, right, bottom, left)
  - Implement proper collision response that stops entities at wall boundaries
  - Fix position correction when entities are pushed into walls
  - Test collision detection with different entity sizes and positions
  - Verify entities cannot pass through tilemap boundaries
  - _Requirements: Core physics functionality for proper game boundaries_

- [x] 11. Analyze and document current collision detection issues

  - **Problem Statement**: Characters get stuck after turning around at walls due to collision detection timing and position overlap
  - **Current Symptoms**:
    - Character starts at x=230, should hit wall at x=240 (16-pixel wide character)
    - Character jumps from x=230 to x=256 between frame 0 and frame 1 (completely outside game area)
    - Collision flags show `[false, false, false, true]` (left collision) instead of right collision
    - Character has 0 horizontal velocity but position changes dramatically
  - **Investigation Tasks**:
    - Document exact frame execution order in `game-engine/src/state.rs::advance_frame()`
    - Trace character position changes through each frame processing step
    - Identify where the x=230 → x=256 jump occurs (collision detection vs position correction)
    - Document current tilemap coordinate system (16x15 tiles, 16 pixels per tile)
    - Verify tilemap wall positions: left wall at x=0, right wall at x=240 (column 15 \* 16)
  - **Debug Tools Setup**:
    - Ensure `debug-node/debug-collision-simple.js` works correctly
    - Add position tracking through each frame processing step
    - Create minimal test case with character near wall boundary
  - **Expected Outcome**: Clear documentation of where and why position jumps occur
  - _Requirements: Foundation for fixing collision detection system_

- [ ] 11.1. Fix tilemap collision detection coordinate system

  - **Problem**: Tilemap collision detection may have coordinate system issues
  - **Current Issues**:
    - Character at x=230 with width=16 should have right edge at x=246
    - Right wall at x=240 should block character, but character jumps to x=256
    - Collision detection may be using wrong coordinate calculations
  - **Investigation Tasks**:
    - Verify `CollisionRect::from_entity()` creates correct bounding boxes
    - Check `Tilemap::check_collision()` tile coordinate calculations
    - Ensure tile boundaries are calculated correctly (tile*x * 16, tile*y * 16)
    - Verify entity bounds calculation (pos_x to pos_x + width)
  - **Fix Tasks**:
    - Fix any coordinate conversion errors in `game-engine/src/tilemap.rs`
    - Ensure collision detection uses consistent coordinate system
    - Add bounds checking to prevent out-of-bounds tile access
    - Test collision detection with entities at exact tile boundaries
  - **Testing**:
    - Character at x=224 (exactly at wall boundary) should not move
    - Character at x=225 should be pushed back to x=224
    - Character at x=239 should be able to move to x=240 but not x=241
  - **Expected Outcome**: Collision detection works correctly at tile boundaries
  - _Requirements: Accurate collision detection for proper physics_

- [ ] 11.2. Implement robust position overlap correction

  - **Problem**: Characters can overlap with walls and need to be pushed to valid positions
  - **Current Issues**:
    - `correct_entity_overlap()` may be pushing characters too far (x=230 → x=256)
    - Position correction priority may be wrong (should prefer minimal movement)
    - Correction may not account for entity size properly
  - **Implementation Tasks**:
    - Rewrite `correct_entity_overlap()` in `game-engine/src/state.rs` with proper logic:
      - Calculate minimum distance to push entity out of collision
      - Use entity velocity direction to determine push direction preference
      - For rightward movement: prefer pushing left (back to valid position)
      - For leftward movement: prefer pushing right
      - Only push in other directions if primary direction fails
    - Add maximum correction distance limit (e.g., 8 pixels)
    - Add safety checks to prevent pushing entities outside game boundaries
  - **Algorithm Design**:
    ```rust
    // Pseudo-code for position correction
    if entity_overlaps_wall {
        if moving_right && can_push_left {
            push_left_minimal_distance();
        } else if moving_left && can_push_right {
            push_right_minimal_distance();
        } else {
            try_other_directions_with_minimal_distance();
        }
    }
    ```
  - **Testing**:
    - Character at x=242 overlapping right wall should be pushed to x=224
    - Character at x=14 overlapping left wall should be pushed to x=16
    - Character should never be pushed outside game boundaries (0 to 256)
  - **Expected Outcome**: Position correction moves entities minimally to valid positions
  - _Requirements: Prevent entities from getting stuck in walls_

- [ ] 11.3. Fix frame processing order and timing

  - **Problem**: Frame processing order may cause collision detection timing issues
  - **Current Frame Order** (in `advance_frame()`):
    1. Process status effects
    2. Execute character behaviors (sets velocity)
    3. Apply gravity to velocity
    4. Check collisions and constrain velocity (`check_and_constrain_movement`)
    5. Apply velocity to position (`apply_velocity_to_position`)
  - **Issues with Current Order**:
    - Position correction happens during step 4, but collision flags are set after position changes
    - Behaviors in next frame see outdated collision flags
    - Position correction may conflict with velocity constraints
  - **Proposed New Order**:
    1. Process status effects
    2. **Correct position overlaps first** (before any movement)
    3. Execute character behaviors (sets velocity based on current collision flags)
    4. Apply gravity to velocity
    5. Check collisions and constrain velocity (without position correction)
    6. Apply constrained velocity to position
    7. **Update collision flags for next frame** (after final position is set)
  - **Implementation Tasks**:
    - Move position overlap correction to beginning of frame processing
    - Update collision flags at end of frame processing
    - Ensure collision flags reflect final entity positions
    - Test that behaviors see accurate collision state
  - **Testing**:
    - Character hitting wall should have collision flags set correctly for next frame
    - Turn-around behavior should trigger based on accurate collision detection
    - Character should be able to move away from wall after turning around
  - **Expected Outcome**: Behaviors see accurate collision state and can respond correctly
  - _Requirements: Proper timing for collision-based behaviors_

- [ ] 11.4. Implement comprehensive collision flag detection

  - **Problem**: Collision flags may not accurately represent entity collision state
  - **Current Issues**:
    - Collision flags show wrong directions (left instead of right)
    - Flags may not be updated after position correction
    - Detection logic may not handle all collision scenarios
  - **Implementation Tasks**:

    - Rewrite collision flag detection in `check_and_constrain_movement()`:
      - Check collision in all 4 directions independently
      - Use small probe rectangles (1 pixel) to test each direction
      - Set flags based on actual tile collision, not just movement constraints
    - Add collision detection for current position (not just next position):

      ```rust
      // Check if entity is currently touching walls
      let current_rect = CollisionRect::from_entity(entity.pos, entity.size);

      // Check each direction with small probe
      let right_probe = CollisionRect::new(current_rect.right(), current_rect.y, 1, current_rect.height);
      collision_flags.1 = tilemap.check_collision(right_probe); // right collision

      let left_probe = CollisionRect::new(current_rect.x - 1, current_rect.y, 1, current_rect.height);
      collision_flags.3 = tilemap.check_collision(left_probe); // left collision
      ```

    - Ensure flags are updated after position changes
    - Add validation to ensure flags match actual collision state

  - **Testing**:
    - Character at x=224 (touching right wall) should have collision_flags[1] = true
    - Character at x=16 (touching left wall) should have collision_flags[3] = true
    - Character in middle of room should have all collision_flags = false
    - Flags should be accurate immediately after position correction
  - **Expected Outcome**: Collision flags accurately represent entity collision state
  - _Requirements: Accurate collision detection for script conditions_

- [ ] 11.5. Test and validate complete collision system

  - **Problem**: Need comprehensive testing to ensure collision system works correctly
  - **Testing Scenarios**:
    - **Basic Collision Detection**:
      - Character moving right hits wall and stops at correct position
      - Character moving left hits wall and stops at correct position
      - Character moving up/down hits ceiling/floor correctly
    - **Position Overlap Correction**:
      - Character starting overlapped with wall gets pushed to valid position
      - Correction uses minimal movement distance
      - Correction never pushes character outside game boundaries
    - **Turn-Around Behavior**:
      - Character hits wall → collision flag set → turn-around behavior triggers
      - Character turns around → collision flag cleared → character moves away
      - No stuck conditions where velocity > 0 but position doesn't change
    - **Edge Cases**:
      - Character exactly at tile boundaries (x=16, x=240, y=16, y=208)
      - Character with different sizes (8x8, 16x16, 16x32, 32x32)
      - Multiple characters colliding with walls simultaneously
  - **Debug Tools Enhancement**:
    - Update `debug-node/debug-wall-hit.js` to test complete turn-around sequence
    - Create `debug-node/debug-position-correction.js` to test overlap correction
    - Add frame-by-frame position and collision flag logging
    - Test with different starting positions and velocities
  - **Validation Criteria**:
    - No character position jumps (x=230 → x=256 type issues)
    - Collision flags accurately reflect collision state
    - Characters can turn around and move away from walls
    - Position correction works for all collision directions
    - System handles edge cases without crashes or infinite loops
  - **Expected Outcome**: Robust collision system that handles all game scenarios
  - _Requirements: Reliable physics system for game functionality_

- [ ] 11.6. Optimize collision detection performance

  - **Problem**: Collision detection may be inefficient with current implementation
  - **Performance Considerations**:
    - Multiple collision checks per entity per frame
    - Pixel-by-pixel movement checking in `check_horizontal_movement`
    - Position correction trying multiple distances
  - **Optimization Tasks**:
    - Profile collision detection performance with multiple entities
    - Optimize tile lookup calculations (avoid repeated division)
    - Cache collision results where possible
    - Use more efficient algorithms for position correction
    - Consider spatial partitioning for entity-entity collisions (future)
  - **Implementation**:
    - Pre-calculate tile boundaries for faster lookup
    - Use binary search for position correction instead of linear search
    - Batch collision checks where possible
    - Add early exit conditions for non-moving entities
  - **Testing**:
    - Measure frame processing time with 8 characters
    - Ensure 60 FPS performance is maintained
    - Test with complex tilemap layouts
  - **Expected Outcome**: Collision detection runs efficiently at 60 FPS
  - _Requirements: Performance optimization for smooth gameplay_

- [ ] 12. Update movement actions to work with fixed collision detection and gravity

  - Update jump action script to work properly with the new gravity system
  - Fix wall jump action to detect walls correctly using the updated collision detection
  - Ensure all movement actions (run, jump, wall jump) respect collision boundaries
  - Test that jump actions apply proper upward velocity that gets correctly modified by gravity
  - Verify wall jump detects wall collision flags properly (left/right collision detection)
  - Update action scripts to use proper velocity values that work with Fixed-point arithmetic
  - Test movement actions with different gravity values and directions
  - Ensure actions work correctly with position correction system
  - _Requirements: Core movement functionality that works with updated physics system_

- [x] 13. Fix WASM memory issues and simplify web viewer interface
  - Identify and fix multiple WASM initialization causing memory corruption
  - Ensure WASM is loaded only ONCE and properly call free() when needed
  - Simplify web interface to only show: canvas, playback controls, and COMBINATION_1 config
  - Remove all unused configuration options and complex UI elements
  - Remove unused game configurations (keep only COMBINATION_1)
  - Clean up and refactor codebase for clarity and maintainability
  - Implement proper WASM lifecycle management to prevent memory leaks
  - Test that the simplified interface works without memory access errors
  - _Requirements: Fix critical memory issues preventing game execution_
