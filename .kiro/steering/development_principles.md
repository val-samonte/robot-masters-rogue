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

## Remember

This project is in active development. We can break things, change APIs, and redesign systems freely. Use this freedom to build something great, not to maintain something old.
