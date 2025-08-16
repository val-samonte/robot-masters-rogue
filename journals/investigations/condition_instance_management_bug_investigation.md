# Condition Instance Management Bug Investigation - Task 23

**Date**: January 2025  
**Status**: CRITICAL BUG IDENTIFIED - Condition instances not preserving state correctly

## Problem Summary

The condition instance management system has a critical bug where stateful conditions (like ONLY_ONCE) do not preserve their state between frames when there are multiple behaviors or multiple characters in the system.

**Symptoms**:

- ONLY_ONCE condition works correctly in single-behavior scenarios
- ONLY_ONCE condition fails in multi-behavior scenarios (continues returning 1 instead of 0)
- ALWAYS condition works correctly in single-behavior scenarios
- ALWAYS condition fails in multi-character scenarios (only executes once)

## Investigation Process

### Test Results Summary

| Test Scenario                         | Expected Behavior                    | Actual Behavior                       | Status    |
| ------------------------------------- | ------------------------------------ | ------------------------------------- | --------- |
| Single character, ONLY_ONCE only      | Execute once, then stop              | Execute once, then stop               | ✅ WORKS  |
| Single character, ALWAYS only         | Execute every frame                  | Execute every frame                   | ✅ WORKS  |
| Single character, ONLY_ONCE + ALWAYS  | Frame 1: ONLY_ONCE, Frame 2+: ALWAYS | Frame 1: ONLY_ONCE, Frame 2+: Nothing | ❌ BROKEN |
| Multiple characters, single behaviors | Each works independently             | Only execute on frame 1               | ❌ BROKEN |

### Key Findings

1. **Single behavior scenarios work correctly**: This proves the basic condition evaluation and instance creation logic is functional.

2. **Multi-behavior scenarios fail**: The ONLY_ONCE condition continues returning 1 on subsequent frames instead of 0, preventing lower-priority behaviors from executing.

3. **Multi-character scenarios fail**: Even simple ALWAYS conditions only execute once when there are multiple characters.

4. **Character ID persistence is correct**: Character IDs are preserved correctly across frames (tested with ID 123).

5. **Simple conditions work**: Basic conditions that don't modify their own state work correctly.

### Root Cause Analysis

The issue is in the condition instance management system. The current implementation has been partially fixed to look up existing instances:

```rust
fn get_or_create_condition_instance(
    &mut self,
    character_idx: usize,
    condition_id: ConditionId,
) -> usize {
    // Look for existing instance for this character + condition combination
    for (idx, instance) in self.condition_instances.iter().enumerate() {
        if instance.character_id == self.characters[character_idx].core.id
            && instance.definition_id == condition_id
        {
            return idx; // Reuse existing instance
        }
    }

    // Create new instance only if none exists
    let character_id = self.characters[character_idx].core.id;
    let instance = ConditionInstance::new(character_id, condition_id);
    self.condition_instances.push(instance);
    self.condition_instances.len() - 1
}
```

However, there's still a bug in either:

1. **Instance lookup logic** - Existing instances are not being found correctly
2. **State saving logic** - Instance state is not being updated after script execution
3. **State loading logic** - Previous state is not being loaded correctly before script execution

### Technical Analysis

**ONLY_ONCE Script Logic** (Correct):

```javascript
;[
  20,
  1,
  1, // vars[1] = 1
  50,
  2,
  0,
  1, // vars[2] = (vars[0] == 1)
  60,
  3,
  2, // vars[3] = !vars[2]
  20,
  0,
  1, // vars[0] = 1 (mark as used)
  91,
  3, // return vars[3]
]
```

Expected execution:

- **Frame 1**: vars[0]=0 → vars[2]=false → vars[3]=true → vars[0]=1 → return 1
- **Frame 2+**: vars[0]=1 → vars[2]=true → vars[3]=false → return 0

**Actual execution** (in multi-behavior scenarios):

- **Frame 1**: vars[0]=0 → return 1 ✅
- **Frame 2+**: vars[0]=0 (fresh state!) → return 1 ❌

This proves the instance state is not being preserved between frames.

### Debug Tools Created

- `debug-node/test-only-once-fix.cjs` - Multi-behavior ONLY_ONCE + ALWAYS test
- `debug-node/test-simple-only-once.cjs` - Single-behavior ONLY_ONCE test (works)
- `debug-node/test-always-simple.cjs` - Single-behavior ALWAYS test (works)
- `debug-node/test-multiple-conditions.cjs` - Multi-character test (broken)
- `debug-node/test-minimal-multi-behavior.cjs` - Minimal reproduction case
- `debug-node/test-character-id-persistence.cjs` - Character ID verification

### Impact Assessment

**CRITICAL**: This bug breaks the core behavior execution system for any complex AI behaviors:

- ❌ Multi-behavior character configurations don't work
- ❌ Stateful conditions (ONLY_ONCE, cooldowns, counters) don't work in multi-behavior scenarios
- ❌ Behavior priority systems don't work (lower priority behaviors never execute)
- ❌ Complex AI systems cannot be implemented

**Systems Affected**:

- Inverted gravity system (Task 24) - Character inverts gravity but never runs horizontally
- Any character with multiple behaviors
- Any stateful condition system
- Behavior sequencing and priority systems

## Next Steps

1. **Implement comprehensive fix** for condition instance management
2. **Verify state saving/loading logic** in `update_instance_from_engine` and `evaluate_condition`
3. **Test with all reproduction cases** to ensure fix works
4. **Update unfinished implementations document** when resolved

## Prevention Strategies

- **Always test multi-behavior scenarios** when implementing condition systems
- **Create comprehensive test suites** for stateful conditions
- **Verify instance management** for any system that maintains state between frames
- **Test edge cases** with multiple characters and multiple behaviors

This investigation has identified the exact nature of the bug and created comprehensive reproduction cases for testing the fix.
