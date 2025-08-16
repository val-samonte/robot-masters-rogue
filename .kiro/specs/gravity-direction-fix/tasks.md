# Implementation Plan

- [x] 1. Fix gravity multiplier logic in EntityCore

  - Correct the `get_gravity_multiplier()` method to return proper multipliers
  - Update logic: dir.1=0 → -1, dir.1=1 → 0, dir.1=2 → +1
  - Add comments explaining the corrected direction rule
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 2. Fix default character direction values

  - Change `EntityCore::new()` default from `dir: (2, 0)` to `dir: (2, 2)`
  - Ensure new characters have downward gravity by default
  - Verify spawns maintain neutral gravity default `dir: (*, 1)`
  - _Requirements: 2.1, 2.2, 2.3_

- [x] 3. Create Node.js debug script to verify gravity behavior

  - Create test script that creates characters with different gravity directions
  - Test upward gravity (dir.1=0) produces negative velocity changes
  - Test downward gravity (dir.1=2) produces positive velocity changes
  - Test neutral gravity (dir.1=1) produces no velocity changes
  - Log frame-by-frame velocity changes to verify correct physics
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 4. Verify grounding logic consistency

  - Review grounding logic in both ConditionContext and ActionContext
  - Ensure both contexts use the same gravity-aware grounding rules
  - Test that upward gravity characters are grounded when touching ceiling
  - Test that downward gravity characters are grounded when touching floor
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 5. Test integration with existing game systems

  - Verify normal characters still fall downward by default
  - Test inverted gravity systems work correctly with the fix
  - Ensure jump mechanics work properly for both gravity directions
  - Validate that collision detection works with corrected gravity
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2_
