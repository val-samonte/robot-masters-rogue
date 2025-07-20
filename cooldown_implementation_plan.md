# Action Cooldown System Implementation Plan

## Overview

This document outlines the implementation of an Action cooldown system for the Robot Masters Game Engine. The cooldown system will prevent actions from being executed too frequently by tracking when each action was last used and comparing it against the action's cooldown duration.

## Requirements Summary

Based on the user requirements, the cooldown system needs:

1. **Dedicated cooldown field for Actions** - A `u16` field storing cooldown duration in frames (read-only, set only during new_game)
2. **Cooldown instance tracking** - A field to track the current timestamp (game frame) when each Action was last executed
3. **Script operators** - Operators to read and write cooldown state from scripts
4. **Behavior evaluation integration** - Skip actions during behavior evaluation if they are on cooldown

## Design Decisions

### 1. Data Structure Changes

#### Action Structure

```rust
pub struct Action {
    pub energy_cost: u8,
    pub interval: u16,
    pub duration: u16,
    pub cooldown: u16,        // NEW: Cooldown duration in frames (read-only after new_game)
    pub vars: [u8; 8],
    pub fixed: [Fixed; 4],
    pub args: [u8; 8],
    pub spawns: [u8; 4],
    pub script: Vec<u8>,
}
```

#### Character Structure

```rust
pub struct Character {
    pub core: EntityCore,
    pub health: u8,
    pub energy: u8,
    pub armor: [u8; 8],
    pub energy_regen: u8,
    pub energy_regen_rate: u8,
    pub energy_charge: u8,
    pub energy_charge_rate: u8,
    pub behaviors: Vec<(ConditionId, ActionId)>,
    pub locked_action: Option<ActionInstanceId>,
    pub status_effects: Vec<StatusEffectInstance>,
    pub action_last_used: Vec<u16>,  // NEW: Tracks when each action was last executed (by action index)
}
```

### 2. Script Operators

New operators to be added to the script engine:

```rust
#[repr(u8)]
pub enum Operator {
    // ... existing operators ...

    // Cooldown management operators
    ReadActionCooldown = 92,    // [ReadActionCooldown, var_index, action_index] - Read action cooldown into vars
    ReadActionLastUsed = 93,    // [ReadActionLastUsed, var_index, action_index] - Read when action was last used
    WriteActionLastUsed = 94,   // [WriteActionLastUsed, action_index, var_index] - Update when action was last used
    IsActionOnCooldown = 95,    // [IsActionOnCooldown, var_index, action_index] - Check if action is on cooldown (0/1)
}
```

### 3. Property Access Addresses

New property addresses for script access:

```rust
// Cooldown-related property addresses
0x48 => Action cooldown value (read-only)
0x49 => Current action's last used timestamp (read/write)
0x4A => Current game frame (read-only, for cooldown calculations)
```

### 4. Behavior Evaluation Logic

The cooldown check will be integrated into the behavior evaluation process:

```rust
pub fn execute_character_behaviors(
    game_state: &mut GameState,
    character: &mut Character,
    conditions: &[Condition],
    actions: &[Action],
) -> Result<Vec<SpawnInstance>, ScriptError> {
    // ... existing locked action logic ...

    for behavior in &character.behaviors {
        let condition_id = behavior.0 as usize;
        let action_id = behavior.1 as usize;

        if let (Some(condition), Some(action)) = (conditions.get(condition_id), actions.get(action_id)) {
            // NEW: Check if action is on cooldown
            if is_action_on_cooldown(character, action_id, action, game_state.frame) {
                continue; // Skip this behavior if action is on cooldown
            }

            // Check energy requirement
            let energy_requirement = calculate_energy_requirement(condition, action);
            if character.energy < energy_requirement {
                continue;
            }

            // Evaluate condition
            if condition.evaluate(game_state, character)? {
                // Execute action
                let (success, spawns) = action.execute(game_state, character, condition, action_id)?;

                if success {
                    // NEW: Update last used timestamp
                    if action_id < character.action_last_used.len() {
                        character.action_last_used[action_id] = game_state.frame;
                    }

                    // Apply energy cost and return spawns
                    character.energy = character.energy.saturating_sub(energy_requirement);
                    return Ok(spawns);
                }
            }
        }
    }

    Ok(Vec::new())
}

fn is_action_on_cooldown(character: &Character, action_id: usize, action: &Action, current_frame: u16) -> bool {
    if action_id >= character.action_last_used.len() {
        return false; // Action never used, not on cooldown
    }

    let last_used = character.action_last_used[action_id];
    let cooldown_expires = last_used.saturating_add(action.cooldown);

    current_frame < cooldown_expires
}
```

## Implementation Steps

### Step 1: Update Data Structures (Task 18.1)

1. Add `cooldown: u16` field to `Action` struct
2. Add `action_last_used: Vec<u16>` field to `Character` struct
3. Update `Action::new()` and `Character::new()` constructors
4. Update serialization/deserialization methods
5. Write unit tests for new fields

### Step 2: Implement Script Operators (Task 18.2)

1. Add new operator enum values (92-95)
2. Update `Operator::from_u8()` method
3. Implement operator execution logic in script engine
4. Write unit tests for each new operator

### Step 3: Update Behavior Evaluation (Task 18.3)

1. Modify `execute_character_behaviors()` function
2. Add cooldown checking before condition evaluation
3. Update action execution to set last_used timestamp
4. Write integration tests for cooldown behavior

### Step 4: Add Property Access (Task 18.4)

1. Add property addresses 0x48-0x4A to script interpreters
2. Update `read_property()` and `write_property()` methods
3. Write unit tests for property access

### Step 5: Create Integration Tests (Task 18.5)

1. Create test actions with different cooldown values
2. Test multi-frame scenarios with cooldown timing
3. Test interaction with locked actions and status effects
4. Write performance tests for cooldown checking

## Example Usage

### Action Definition with Cooldown

```rust
let shoot_action = Action {
    energy_cost: 5,
    interval: 1,
    duration: 10,
    cooldown: 30,  // 30 frames = 0.5 seconds at 60 FPS
    args: [10, 0, 0, 0, 0, 0, 0, 0], // 10 ammo
    script: vec![
        // Check if we're on cooldown
        95, 0, 0,        // IsActionOnCooldown vars[0] = is_on_cooldown(action_0)
        20, 1, 1,        // AssignByte vars[1] = 1
        50, 2, 0, 1,     // Equal vars[2] = (vars[0] == vars[1])
        // If on cooldown, exit early
        // ... conditional exit logic ...

        // Otherwise, execute shoot logic
        20, 3, 1,        // AssignByte vars[3] = 1 (bullet spawn ID)
        84, 3,           // Spawn vars[3]

        // Update last used timestamp
        10, 4, 0x4A,     // ReadProp vars[4] = current_frame
        94, 0, 4,        // WriteActionLastUsed action_0 = vars[4]

        0, 1             // Exit success
    ],
    // ... other fields
};
```

### Character Initialization

```rust
impl Character {
    pub fn new(id: u8, group: u8) -> Self {
        Self {
            // ... existing fields ...
            action_last_used: Vec::new(), // Will be sized during game initialization
        }
    }

    pub fn initialize_action_cooldowns(&mut self, num_actions: usize) {
        self.action_last_used = vec![0; num_actions];
    }
}
```

## Testing Strategy

### Unit Tests

- Test cooldown field initialization
- Test script operator functionality
- Test cooldown calculation logic
- Test property access methods

### Integration Tests

- Test multi-frame cooldown behavior
- Test cooldown with different action types
- Test cooldown interaction with energy system
- Test cooldown with locked actions

### Performance Tests

- Benchmark cooldown checking overhead
- Test with large numbers of actions
- Verify deterministic behavior across platforms

## Considerations

### Memory Usage

- `action_last_used` vector size scales with number of actions in game
- Each character needs separate cooldown tracking
- Consider memory constraints for Solana deployment

### Determinism

- Cooldown calculations must be deterministic across platforms
- Frame-based timing ensures consistent behavior
- No floating-point arithmetic used

### Backwards Compatibility

- New fields have sensible defaults (cooldown = 0 means no cooldown)
- Existing actions continue to work without modification
- Serialization format needs versioning consideration

## Future Enhancements

### Variable Cooldowns

- Actions could modify their own cooldown based on conditions
- Status effects could affect action cooldowns
- Character properties could influence cooldown rates

### Cooldown Categories

- Group actions into cooldown categories (e.g., all attacks share cooldown)
- Global cooldowns vs per-action cooldowns
- Cooldown reduction mechanics

### Advanced Timing

- Sub-frame timing for more precise cooldowns
- Cooldown reduction over time
- Conditional cooldown modifications
