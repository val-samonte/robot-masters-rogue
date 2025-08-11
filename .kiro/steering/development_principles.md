# Development Principles

## Core Principles for This Project

### 1. NO BACKWARD COMPATIBILITY

- **NEVER maintain backward compatibility** when implementing new features
- This is a fresh start project with no legacy code to support
- Always implement the cleanest, most direct solution
- Remove old code paths when implementing new ones
- Focus on the best design, not compatibility with old systems

### 2. Clean Implementation

- Write minimal, focused code that solves the specific problem
- Avoid unnecessary abstractions or compatibility layers
- Remove unused code immediately
- Prioritize clarity and simplicity over flexibility

### 3. Fresh Start Mindset

- We are building from scratch
- No production systems to maintain
- No existing users to support during transitions
- Take advantage of this freedom to build the best possible system

### 4. No Tests During Development

- **NEVER create test files** unless explicitly asked to do so in a task
- We are in active development stage where APIs and implementations change rapidly
- Tests would become outdated quickly and slow down development
- Focus on implementation first, testing comes later when systems stabilize
- Avoid test-driven development during this rapid prototyping phase

### 5. Test File Organization

- **IF you really need to create test files** to test functionality during development:
  - Place all test files under a `/[PROJECT DIRECTORY]/tests/` directory in the project root
  - This ensures test files can be deleted without dependency problems
  - Keep test files completely separate from main source code
  - Example structure: `/game-engine/src/tests/`, `/wasm-wrapper/tests/`, etc.
- This separation allows easy cleanup when transitioning to production testing

### 6. Avoid preoptimization

- There is no point to optimize this project for now

### 7. NO FLOATING-POINT TYPES - DETERMINISM MANDATORY

- **NEVER use f32, f64, or any floating-point types anywhere in the codebase**
- **ALL numbers must be integers or Fixed-point types**
- Floating-point arithmetic is non-deterministic across platforms and will break game consistency
- Use Fixed-point arithmetic (Fixed type) for fractional values that need deterministic behavior
- Use integer types (u8, u16, i16, etc.) for whole numbers
- **This applies to ALL layers**: game engine, WASM wrapper, JSON serialization, everything
- When interfacing with external systems (JSON, JavaScript), convert Fixed-point to raw integers
- **VIOLATION OF THIS RULE WILL CAUSE DESYNC ISSUES IN MULTIPLAYER/REPLAY SYSTEMS**

### 8. Fixed-Point Arithmetic Only

- Use the `Fixed` type from the math module for all fractional calculations
- Serialize Fixed-point values as their raw integer representation (.raw())
- Never convert Fixed-point to floating-point for calculations
- All game logic must be deterministic and reproducible across platforms

### 9. WASM Debugging with Node.js

When debugging WASM-related issues that are hard to trace in the browser:

- **Create a Node.js debug script** in `debug-node/` directory
- **Replicate the exact game configuration** from the web viewer
- **Load WASM directly** using `import('../wasm-wrapper/pkg/wasm_wrapper.js')`
- **Run frame-by-frame analysis** with detailed logging of game state
- **Test specific behaviors** by isolating conditions and actions
- **Verify property reading/writing** by checking if script variables match expected values
- **Use this approach for**:
  - Script execution debugging
  - Property access issues
  - Behavior system problems
  - Collision detection verification
  - Direction/movement logic validation

**Example debugging pattern:**

```javascript
// Load WASM and create game
const gameWrapper = new GameWrapper(JSON.stringify(gameConfig))
gameWrapper.new_game()

// Run frames with detailed logging
for (let frame = 0; frame < 100; frame++) {
  const before = JSON.parse(gameWrapper.get_characters_json())
  gameWrapper.step_frame()
  const after = JSON.parse(gameWrapper.get_characters_json())

  // Log state changes and detect issues
  if (before[0].dir[0] !== after[0].dir[0]) {
    console.log(`Direction changed: ${before[0].dir[0]} → ${after[0].dir[0]}`)
  }
}
```

### 10. Property Implementation Consistency

To prevent bugs like the collision property issue:

- **Always implement properties in ALL contexts** (ConditionContext, ActionContext, etc.)
- **Use consistent array types**: `vars[]` for u8, `fixed[]` for Fixed
- **Check array bounds correctly**: `engine.vars.len()` for vars, `engine.fixed.len()` for fixed
- **Document unfinished implementations** in `.kiro/steering/unfinished_implementations.md`
- **Test property access** with Node.js debugging before assuming it works
- **Follow the property implementation checklist**:
  - [ ] Define constant in `constants.rs`
  - [ ] Implement in `ConditionContext::read_property`
  - [ ] Implement in `ActionContext::read_property`
  - [ ] Implement write methods if needed
  - [ ] Use correct array type and bounds check
  - [ ] Test with isolated script

### 11. CRITICAL: NEVER USE WEB VIEWER FOR DEBUGGING OR START DEV SERVERS

**MANDATORY RULE**: When debugging game engine issues, ALWAYS use Node.js debug scripts, NEVER the web viewer.

**NEVER START DEV SERVERS**:

- **NEVER run `npm run dev`, `vite dev`, or any web development server**
- **ASSUME a web viewer instance is already running** and accessible
- **Just tell the user to check their existing web viewer** instead of starting servers
- **Focus on Node.js debugging and code fixes only**

**Why this rule exists**:

- Web viewer has complex UI interactions that mask the real issues
- Browser environment adds layers of complexity (React, PIXI, state management)
- Web debugging is slow and unreliable for game engine logic
- Node.js provides direct access to WASM without UI interference
- Console logging is clearer and more detailed in Node.js
- Starting dev servers is unnecessary overhead when debugging

**What to do instead**:

- **Create Node.js debug scripts** in `debug-node/` directory
- **Use CommonJS format** (`.cjs` files) for reliable WASM loading
- **Test game logic directly** without UI complications
- **Log frame-by-frame state changes** to understand behavior
- **Isolate specific issues** with minimal test configurations

**When to use web viewer**:

- **ONLY for final verification** after fixing issues in Node.js
- **ONLY for visual confirmation** that fixes work in the UI
- **NEVER for initial debugging** or problem investigation
- **Tell user to check their existing web viewer instance** instead of starting one

**Example Node.js debugging pattern**:

```javascript
const { GameWrapper } = require('../wasm-wrapper/pkg/wasm_wrapper.js')

// Minimal test configuration
const gameConfig = {
  /* minimal config */
}

const gameWrapper = new GameWrapper(JSON.stringify(gameConfig))
gameWrapper.new_game()

// Frame-by-frame analysis
for (let frame = 0; frame < 100; frame++) {
  const before = JSON.parse(gameWrapper.get_characters_json())
  gameWrapper.step_frame()
  const after = JSON.parse(gameWrapper.get_characters_json())

  // Log specific changes
  console.log(`Frame ${frame}: energy ${before[0].energy} → ${after[0].energy}`)
}
```

**VIOLATION OF THIS RULE WASTES TIME AND CREATES CONFUSION**

### 12. Comprehensive Code Documentation

To prevent circular debugging and repeated work:

- **ALWAYS add comprehensive comments** to every critical piece of code
- **Document WHY decisions were made**, not just what the code does
- **Mark fixed bugs with detailed comments** explaining the problem and solution
- **Use clear section headers** in complex functions to identify different logic blocks
- **Comment any non-obvious logic** or workarounds
- **Include references to related tasks/issues** in comments
- **Document expected behavior** for complex systems like collision detection
- **Add TODO comments** for known limitations or future improvements

**Example of proper commenting:**

```rust
// COLLISION DETECTION SYSTEM - FIXED IN TASK 12
// Problem: Priority system was clearing wall collision flags when grounded
// Solution: Allow multiple collision flags simultaneously for proper turn-around behavior
// Related: Tasks 12-14, movement actions in Task 16
if flag_count > 1 {
    // KEEP ALL COLLISION FLAGS - DO NOT USE PRIORITY SYSTEM
    // This allows wall+ground collision for turn-around behavior
    // Previous bug: collision_flags = (false, false, true, false) cleared wall flags
    // Fixed: Keep original collision_flags with multiple flags set
}
```

### 13. Development Journals and Knowledge Management

**MANDATORY DOCUMENTATION SYSTEM**: All significant development work must be documented in the `/journals/` directory.

**Journal Categories**:

- **`/journals/task-successes/`** - Major completed tasks and milestones
- **`/journals/bug-fixes/`** - Detailed bug resolution documentation
- **`/journals/investigations/`** - Analysis of complex system behaviors
- **`/journals/research/`** - External technology and design pattern research

**When to Create Journal Entries**:

- **Task Successes**: After completing any major feature or resolving critical bugs
- **Bug Fixes**: For any non-trivial bug that required investigation or debugging
- **Investigations**: When analyzing complex behaviors, debugging issues, or understanding system interactions
- **Research**: When investigating external technologies, libraries, or design patterns

**Journal Entry Requirements**:

- **Problem Description**: Clear explanation of what was being solved
- **Investigation Process**: Steps taken to understand and debug the issue
- **Root Cause Analysis**: Why the problem occurred and what caused it
- **Solution Implementation**: How the problem was fixed
- **Impact Assessment**: What changed and broader implications
- **Prevention Strategies**: How to avoid similar issues in the future
- **Related References**: Links to tasks, files, and other relevant documentation

**Example Journal Structure**:

```markdown
# [Title] - [Date]

## Problem Summary

Brief description of the issue or task

## Investigation Process

- Step-by-step analysis
- Tools and methods used
- Key findings

## Root Cause

Why the problem occurred

## Solution Implemented

- Changes made
- Code examples
- Test results

## Impact

- What improved
- Side effects
- Performance implications

## Prevention

- How to avoid this issue
- Best practices learned
- Warning signs to watch for

## Related Files

- List of modified files
- Related tasks/issues
- Cross-references
```

**Benefits of Journal System**:

- **Prevents repeated debugging** of the same issues
- **Builds institutional knowledge** for complex systems
- **Documents successful patterns** and anti-patterns
- **Provides context** for future development decisions
- **Creates searchable knowledge base** of solutions
- **Tracks evolution** of system design and architecture

**Integration with Development Process**:

- **Reference journals** when encountering similar issues
- **Update journals** when systems change significantly
- **Cross-reference** related journal entries
- **Use journals** to onboard new developers
- **Archive outdated** journals to maintain relevance

**VIOLATION OF THIS RULE LEADS TO**:

- Repeated debugging of known issues
- Lost institutional knowledge
- Inefficient development cycles
- Forgotten solutions to complex problems

## Remember

This project is in active development. We can break things, change APIs, and redesign systems freely. Use this freedom to build something great, not to maintain something old.

**The journals system ensures we learn from our successes and failures, building a knowledge base that accelerates future development.**
