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

- [-] 11. Update movement actions to work with fixed collision detection and gravity

  - Update jump action script to work properly with the new gravity system
  - Fix wall jump action to detect walls correctly using the updated collision detection
  - Ensure all movement actions (run, jump, wall jump) respect collision boundaries
  - Test that jump actions apply proper upward velocity that gets correctly modified by gravity
  - Verify wall jump detects wall collision flags properly (left/right collision detection)
  - Update action scripts to use proper velocity values that work with Fixed-point arithmetic
  - Test movement actions with different gravity values and directions
  - Ensure actions work correctly with position correction system
  - _Requirements: Core movement functionality that works with updated physics system_
