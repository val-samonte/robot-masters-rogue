# Requirements Document

## Introduction

The game engine currently has incorrect gravity direction logic that violates the established direction rule where 0=upward, 1=neutral, 2=downward for vertical direction. The current implementation has the gravity multiplier logic backwards, causing characters with upward gravity (dir.1 = 0) to fall downward and characters with downward gravity (dir.1 = 2) to fall upward.

## Requirements

### Requirement 1

**User Story:** As a game developer, I want the gravity system to respect the direction rule (0=upward, 1=neutral, 2=downward), so that characters behave predictably when gravity is inverted.

#### Acceptance Criteria

1. WHEN a character has dir.1 = 0 (upward gravity) THEN the character SHALL fall upward (negative velocity)
2. WHEN a character has dir.1 = 1 (neutral gravity) THEN the character SHALL not be affected by gravity (zero velocity change)
3. WHEN a character has dir.1 = 2 (downward gravity) THEN the character SHALL fall downward (positive velocity)
4. WHEN the global gravity value is positive THEN downward gravity SHALL result in positive velocity change
5. WHEN the global gravity value is positive THEN upward gravity SHALL result in negative velocity change

### Requirement 2

**User Story:** As a game developer, I want the default character direction to follow the established rule, so that new characters have correct gravity behavior by default.

#### Acceptance Criteria

1. WHEN a new character is created THEN the character SHALL have dir.1 = 2 (downward gravity) by default
2. WHEN a new character is created THEN the character SHALL fall downward under normal gravity conditions
3. WHEN a spawn is created THEN the spawn SHALL have dir.1 = 1 (neutral gravity) by default to avoid unintended gravity effects

### Requirement 3

**User Story:** As a game developer, I want the grounding logic to correctly identify when characters are grounded based on their gravity direction, so that gravity-inverted characters can jump properly.

#### Acceptance Criteria

1. WHEN a character has dir.1 = 0 (upward gravity) THEN the character SHALL be considered grounded when touching the ceiling (collision.0 = true)
2. WHEN a character has dir.1 = 2 (downward gravity) THEN the character SHALL be considered grounded when touching the floor (collision.2 = true)
3. WHEN a character has dir.1 = 1 (neutral gravity) THEN the character SHALL be considered grounded when touching either ceiling or floor
4. WHEN the grounding logic is applied THEN it SHALL be consistent across all contexts (ConditionContext and ActionContext)
