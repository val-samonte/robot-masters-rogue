# Implementation Plan

- [ ] 1. Fix gravity multiplier logic in EntityCore

  - Correct the `get_gravity_multiplier()` method to return proper multipliers
  - Update logic: dir.1=0 → -1, dir.1=1 → 0, dir.1=2 → +1
  - Add comments explaining the corrected direction rule
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ] 2. Fix default character direction values

  - Change `EntityCore::new()` default from `dir: (2, 0)` to `dir: (2, 2)`
  - Ensure new characters have downward gravity by default
  - Verify spawns maintain neutral gravity default `dir: (*, 1)`
  - _Requirements: 2.1, 2.2, 2.3_

- [ ] 3. Create Node.js debug script to verify gravity behavior

  - Create test script that creates characters with different gravity directions
  - Test upward gravity (dir.1=0) produces negative velocity changes
  - Test downward gravity (dir.1=2) produces positive velocity changes
  - Test neutral gravity (dir.1=1) produces no velocity changes
  - Log frame-by-frame velocity changes to verify correct physics
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ] 4. Verify grounding logic consistency

  - Review grounding logic in both ConditionContext and ActionContext
  - Ensure both contexts use the same gravity-aware grounding rules
  - Test that upward gravity characters are grounded when touching ceiling
  - Test that downward gravity characters are grounded when touching floor
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [ ] 5. Test integration with existing game systems

  - Verify normal characters still fall downward by default
  - Test inverted gravity systems work correctly with the fix
  - Ensure jump mechanics work properly for both gravity directions
  - Validate that collision detection works with corrected gravity
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2_

- [ ] 6. Implement gravity-aware jumping system (simplified - no wall jumping)
  - **Problem**: Create gravity-aware jumping system that works with inverted gravity
  - **Requirements**:
    1. **Duplicate "Inverted Gravity" configuration from dropdown selection** as base template
    2. **Add jump functionality** to the duplicated configuration (no wall jumping)
    3. **Use IS_GROUNDED condition**
    4. **Create gravity-aware JUMP action** that jumps away from grounded surface
    5. **Integrate jump action** with inverted gravity system
  - **Script Implementation**:
    - **IS_GROUNDED Condition (Always Gravity-Aware)**
    - **Gravity-Aware JUMP Action**:
      - **ALWAYS use EXIT_IF_NOT_GROUNDED operator** at the beginning of JUMP scripts to prevent jumping when not grounded
      - Read ENTITY_DIR_VERTICAL to determine gravity direction
      - Read CHARACTER_JUMP_FORCE for jump strength
      - Jump away from the surface the character is grounded on
    - **Update IS_GROUNDED condition script**:
      - **Use EXIT_IF_NOT_GROUNDED operator** instead of manual collision checking where appropriate
      - Leverage the gravity-aware grounding logic from Task 25
      - Ensure consistent behavior across all grounding-related scripts
  - **Configuration Setup**:
    - **Step 1**: Duplicate the existing `INVERTED_GRAVITY_CONFIG` from `gameConfigs.ts`
    - **Step 2**: Create new configuration called `INVERTED_GRAVITY_WITH_JUMPING_CONFIG`
    - **Step 3**: Use the duplicated configuration as the base and add jumping behavior
    - **Step 4**: Add the new configuration to the dropdown selection in the web viewer
  - **Configuration Integration**:
    - **Base from INVERTED_GRAVITY_CONFIG**:
      1. ONLY_ONCE → INVERT_GRAVITY (gravity inversion)
      2. IS_WALL_LEANING → TURN_AROUND (wall collision response)
      3. ALWAYS → RUN (constant horizontal movement)
    - **Add jumping behavior**: 4. IS_GROUNDED → JUMP (gravity-aware ground jumping)
  - **Testing Requirements**:
    - **Normal Gravity (dir.1 = 0)**:
      - IS_GROUNDED checks bottom collision (floor)
      - JUMP action jumps upward (negative Y velocity)
      - EXIT_IF_NOT_GROUNDED prevents jumping when not touching floor
    - **Inverted Gravity (dir.1 = 2)**:
      - IS_GROUNDED checks top collision (ceiling)
      - JUMP action jumps downward (positive Y velocity)
      - EXIT_IF_NOT_GROUNDED prevents jumping when not touching ceiling
  - **Integration Testing**:
    - Character inverts gravity, falls to ceiling, can jump toward floor
    - All movement actions work seamlessly with gravity inversion
    - EXIT_IF_NOT_GROUNDED operator works correctly in JUMP scripts
  - **Expected Behavior**:
    - Frame 1: Character gravity inverts (dir.1: 0 → 2)
    - Frame 2+: Character falls upward to ceiling
    - When touching ceiling: IS_GROUNDED returns true, character can jump toward floor
    - All jumping mechanics work correctly regardless of gravity orientation
    - JUMP actions only execute when character is properly grounded according to gravity direction
  - **Implementation Steps**:
    1. **Duplicate INVERTED_GRAVITY_CONFIG** in `gameConfigs.ts`
    2. **Add gravity-aware JUMP** to script constants library (uses EXIT_IF_NOT_GROUNDED)
    3. **Update IS_GROUNDED condition** to always be gravity-aware and use EXIT_IF_NOT_GROUNDED where appropriate
    4. **Create new configuration** with jumping functionality
    5. **Add to dropdown selection** in web viewer
    6. **Test gravity-aware jumping system** with inverted gravity
  - **Expected Outcome**: Gravity-aware jumping system where jump mechanics work correctly in both normal and inverted gravity, accessible via dropdown selection
  - _Requirements: Gravity-aware jumping system that works with inverted gravity_
