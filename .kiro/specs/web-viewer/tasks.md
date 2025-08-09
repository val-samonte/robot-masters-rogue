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

- [x] 11.1. Fix tilemap collision detection coordinate system

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

- [x] 11.2. Implement robust position overlap correction

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

- [x] 11.3. Fix frame processing order and timing

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

- [x] 11.4. Implement comprehensive collision flag detection

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

- [x] 11.5. Test and validate complete collision system

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

- [x] 12. Fix horizontal collision detection during movement

  - **Problem**: Characters never hit left/right walls during movement (only when stationary)
  - **Current Issues**:
    - Characters moving right/left pass through walls instead of stopping
    - `check_horizontal_movement` and `check_vertical_movement` in tilemap.rs may not be working correctly
    - Velocity constraint system may not be properly stopping movement at walls
    - Turn-around behavior never triggers because collision during movement isn't detected
  - **Investigation Tasks**:
    - Debug `check_horizontal_movement` function in `game-engine/src/tilemap.rs`
    - Verify that velocity constraints are being applied correctly in `check_and_constrain_velocity_only`
    - Test collision detection with moving characters vs stationary characters
    - Check if collision detection works differently for different movement speeds
  - **Fix Tasks**:
    - Fix `check_horizontal_movement` to properly detect wall collisions during movement
    - Ensure velocity is constrained to zero when hitting walls
    - Fix collision flag detection for moving entities
    - Test that characters stop at correct positions when hitting walls
  - **Testing**:
    - Character moving right should stop at x=224 when hitting right wall
    - Character moving left should stop at x=16 when hitting left wall
    - Collision flags should be set correctly when movement is stopped by walls
    - Turn-around behavior should trigger after hitting walls
  - **Expected Outcome**: Characters properly stop when hitting walls during movement
  - _Requirements: Core collision detection for movement actions_

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

- [x] 14. Fix turn-around behavior system

  - **Problem**: Characters hit walls and collision flags are set, but turn-around behavior never triggers
  - **Current Issues**:
    - Collision flags are correctly set (e.g., `[false, true, false, false]` for right wall)
    - Turn-around behavior condition should trigger when collision flags are true
    - Behavior system may not be reading collision flags correctly
    - Turn-around action may not be executing properly
  - **Investigation Tasks**:
    - Debug behavior condition evaluation in script system
    - Verify that collision-based conditions can read collision flags from entity state
    - Check if turn-around action script is correct and executes properly
    - Test behavior system with simple always-true conditions first
  - **Fix Tasks**:
    - Implement missing collision property reading in script contexts (CHARACTER_COLLISION_TOP, etc.)
    - Fix condition script evaluation to properly read collision flags
    - Ensure turn-around action properly changes entity direction
    - Test complete turn-around sequence: hit wall → detect collision → change direction → move away
  - **Testing**:
    - Character hits right wall → collision flag set → direction changes from 2 (right) to 0 (left)
    - Character hits left wall → collision flag set → direction changes from 0 (left) to 2 (right)
    - Character successfully moves away from wall after turning around
    - No stuck conditions where character has velocity but doesn't move
  - **Expected Outcome**: Complete turn-around behavior works correctly
  - _Requirements: Functional AI behavior system for character movement_

- [x] 15. Fix collision flag accuracy and multiple flag issues

  - **Problem**: Multiple collision flags are set simultaneously when only one should be active
  - **Current Issues**:
    - Character at tile boundaries shows multiple collision flags (e.g., `[false, true, true, false]`)
    - Should only show collision in the direction of actual wall contact
    - Collision detection may be too sensitive or using wrong probe sizes
  - **Investigation Tasks**:
    - Debug collision flag detection logic in `update_collision_flags_for_next_frame`
    - Check probe rectangle sizes and positions for each direction
    - Verify that boundary detection tolerance is appropriate
    - Test collision flags at exact tile boundaries vs slightly offset positions
  - **Fix Tasks**:
    - Refine collision flag detection to be more precise
    - Adjust probe sizes and positions to avoid false positives
    - Implement priority system for collision flags (prefer primary collision direction)
    - Add validation to ensure collision flags make logical sense
  - **Testing**:
    - Character at x=16 should only have left collision flag set
    - Character at x=224 should only have right collision flag set
    - Character at y=16 should only have top collision flag set
    - Character at y=192 should only have bottom collision flag set
    - Character in middle of room should have no collision flags set
  - **Expected Outcome**: Collision flags accurately represent single collision direction
  - _Requirements: Accurate collision detection for precise behavior triggers_

- [x] 16. Update movement actions to work with fixed collision detection and gravity

  - Update jump action script to work properly with the new gravity system
  - Fix wall jump action to detect walls correctly using the updated collision detection
  - Ensure all movement actions (run, jump, wall jump) respect collision boundaries
  - Test that jump actions apply proper upward velocity that gets correctly modified by gravity
  - Verify wall jump detects wall collision flags properly (left/right collision detection)
  - Update action scripts to use proper velocity values that work with Fixed-point arithmetic
  - Test movement actions with different gravity values and directions
  - Ensure actions work correctly with position correction system
  - _Requirements: Core movement functionality that works with updated physics system_

- [x] 17. **CRITICAL: Fix Turn-Around Velocity Bug - Wall Escape System**

  - **Problem**: Characters can detect wall collisions and change direction correctly, but **cannot move away from walls** after turning around. The `WRITE_PROP CHARACTER_VEL_X` operation fails or gets immediately overridden when characters are overlapping with walls.

  - **Root Cause**: The collision constraint system (`check_and_constrain_velocity_only`) resets velocity to 0 when characters are overlapping with walls, preventing movement away from walls even after turning around.

  - **Current Behavior**:

    ```
    Frame 96: pos=224.0, vel=2.0, dir=2, collision=[false, false, true, false]  // Moving right
    Frame 97: pos=224.0, vel=0.0, dir=0, collision=[false, true, true, false]   // Hit wall, turned left, velocity=0
    Frame 98: pos=224.0, vel=0.0, dir=2, collision=[false, true, true, false]   // Turned right, velocity=0
    // Infinite oscillation with zero velocity
    ```

  - **Investigation Results**:

    - ✅ Wall collision detection works: `collision=[false, true, true, false]` correctly set
    - ✅ IS_WALL_LEANING condition triggers correctly when touching walls
    - ✅ TURN_AROUND action works: Direction flips correctly (2→0→2→0...)
    - ✅ Script execution works: Both separate and combined scripts execute without errors
    - ❌ **Velocity setting fails**: `WRITE_PROP CHARACTER_VEL_X` doesn't set velocity when character is against wall
    - ❌ **Movement blocked**: Character stays at same position with velocity=0.0

  - **Frame Processing Pipeline Issue**:

    1. **Step 4**: Execute character behaviors → Script sets `character.core.vel.0 = -2.0` ✅
    2. **Step 5**: Apply gravity to velocity → Modifies velocity ⚠️
    3. **Step 6**: `check_and_constrain_velocity_only()` → **RESETS VELOCITY TO 0.0** ❌
    4. **Step 7**: Apply velocity to position → No movement (velocity=0) ❌

  - **Technical Analysis**:

    - `check_horizontal_movement()` detects immediate collision for overlapping entities
    - Swept collision detection returns distance=0 for any movement when overlapping
    - Velocity gets constrained to 0 regardless of direction (even away from wall)
    - Position correction creates overlapping state, but collision system can't handle escape

  - **Solution Requirements**:

    1. **Detect wall overlap state**: Identify when character is overlapping with wall
    2. **Allow escape movement**: Permit velocity in directions that reduce overlap
    3. **Preserve script velocities**: Don't override script-set velocities for wall escape
    4. **Maintain collision safety**: Still prevent movement that increases overlap

  - **Implementation Tasks**:

    - **Modify `check_and_constrain_velocity_only()` in `game-engine/src/state.rs`**:
      ```rust
      // Add wall escape logic
      if entity_overlaps_wall {
          if velocity_direction_reduces_overlap {
              // Allow movement away from wall - preserve script-set velocity
              allow_escape_velocity();
          } else {
              // Constrain movement that increases overlap
              constrain_velocity_to_zero();
          }
      } else {
          // Normal collision constraint for non-overlapping entities
          apply_normal_collision_constraint();
      }
      ```
    - **Add overlap detection method**: `is_entity_overlapping_wall()`
    - **Add escape direction detection**: `does_velocity_reduce_overlap()`
    - **Test wall escape in all directions**: left, right, up, down

  - **Alternative Approaches** (if primary solution fails):

    1. **Modify frame processing order**: Move collision constraint before behavior execution
    2. **Add position push in scripts**: Make TURN_AROUND script push character away from wall
    3. **Implement collision-aware velocity setting**: Special velocity write for overlapping entities

  - **Testing Requirements**:

    - **Primary Test**: Character hits right wall → turns left → moves away with velocity=-2.0
    - **Secondary Test**: Character hits left wall → turns right → moves away with velocity=+2.0
    - **Edge Cases**: Character in corner, multiple collision directions, different entity sizes
    - **Performance**: Ensure fix doesn't impact 60 FPS performance
    - **Regression**: Verify normal collision detection still works for non-overlapping entities

  - **Debug Tools Available**:

    - `debug-node/test-300-frames.js` - Main reproduction test (consistently reproduces bug)
    - `debug-node/test-combined-turn-around-run.js` - Combined script approach testing
    - `debug-node/debug-run-script-values.js` - Property value verification
    - `debug-node/debug-action-execution-order.js` - Behavior execution analysis

  - **Success Criteria**:

    - Character bounces between walls continuously without getting stuck
    - Direction changes result in immediate movement away from walls
    - Velocity is preserved when moving away from walls
    - No infinite oscillation with zero velocity
    - Turn-around behavior works as intended: hit wall → turn around → move away

  - **Priority**: **CRITICAL** - This bug prevents core turn-around behavior from working
  - _Requirements: Functional AI behavior system for character movement_

- [x] 18. Fix energy regeneration going beyond energy cap

  - **Problem**: Character energy can exceed the energy_cap due to regeneration system
  - **Current Behavior**: Energy regeneration adds energy without checking the cap limit
  - **Expected Behavior**: Energy should never exceed energy_cap, regeneration should stop at cap
  - **Investigation**:
    - Check `apply_passive_energy_regen_to_all_characters` function in game engine
    - Verify energy regeneration logic respects energy_cap
    - Test with characters that have different energy_cap values
  - **Implementation**:
    - Add cap checking in energy regeneration logic
    - Ensure `character.energy = min(character.energy + regen_amount, character.energy_cap)`
    - Test with various regeneration rates and energy caps
  - **Testing**:
    - Character with energy_cap=100 should never exceed 100 energy
    - Verify regeneration stops when at cap
    - Test with different energy_regen and energy_regen_rate values
  - _Requirements: Proper energy system balance and game mechanics_

- [ ] 19. Fix direction indicator in web viewer not respecting current facing direction

  - **Problem**: The circular direction indicator in the web viewer doesn't show the correct facing direction
  - **Current Behavior**: Direction indicator may not update or shows wrong direction
  - **Expected Behavior**: Direction indicator should accurately reflect character's current facing direction (left/right)
  - **Investigation**:
    - Check how character direction is read from game state JSON
    - Verify direction indicator rendering logic in web viewer
    - Test with characters that change direction (turn-around behavior)
  - **Implementation**:
    - Fix direction indicator to read `character.dir[0]` correctly
    - Map direction values: 0=left, 1=neutral, 2=right
    - Update indicator visual to show correct facing direction
    - Ensure indicator updates in real-time as character turns around
  - **Testing**:
    - Character facing left should show left-pointing indicator
    - Character facing right should show right-pointing indicator
    - Indicator should update immediately when character turns around
    - Test with turn-around behavior from Task 17
  - _Requirements: Accurate visual feedback for character state in web viewer_

- [ ] 20. Clean up debug-node directory and remove outdated test files

  - **Problem**: debug-node directory contains many outdated and irrelevant test/debug files from Task 17 development
  - **Current State**: 70+ debug files accumulated during turn-around velocity bug investigation
  - **Files to Keep**:
    - `test-wall-escape-working.cjs` - Final working test for Task 17
    - `test-300-frames.js` - Comprehensive behavior testing
    - `package.json` - Node.js configuration
    - Any files that test current functionality
  - **Files to Remove**:
    - All `debug-*` files related to collision detection experiments
    - Outdated `test-*` files that test old/broken implementations
    - Duplicate test files with similar functionality
    - Files related to failed approaches and debugging attempts
  - **Implementation**:
    - Review each file to determine relevance to current codebase
    - Keep only essential test files for regression testing
    - Remove all experimental and debugging files from Task 17 investigation
    - Organize remaining files with clear naming
  - **Testing**:
    - Ensure remaining test files still work with current implementation
    - Verify no important test cases are lost
    - Clean directory should have <10 essential files
  - _Requirements: Clean and maintainable debug/test environment_

- [ ] 21. Optimize collision detection performance

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
