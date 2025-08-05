# Game Controls Documentation

## Overview

The web viewer now includes a complete game control system with a 60fps game loop for real-time game execution.

## Features

### Game Controls

- **Play Button**: Starts continuous game execution at 60 FPS
- **Pause Button**: Stops game execution while maintaining current state
- **Step Button**: Advances exactly one frame when paused
- **Reset Button**: Reloads the configuration and returns to frame 0

### Game Status Indicators

- **Status Display**: Shows current game state (Not Loaded, Playing, Paused, Ended)
- **Frame Counter**: Displays current frame number
- **FPS Display**: Shows "Running at 60 FPS" when playing
- **Visual Status Indicator**: Color-coded dot showing game status

### Automatic Behavior

- **Auto-pause on End**: Game automatically pauses when it reaches the end
- **Error Handling**: Game pauses automatically if errors occur during execution
- **Smooth Updates**: Real-time state updates and rendering during playback

## Usage

1. **Load a Configuration**: Use the Configuration Loader to select from predefined TypeScript configs or build custom ones
2. **Start Playing**: Click the Play button to begin 60fps execution
3. **Control Playback**: Use Pause/Step for debugging specific frames
4. **Reset**: Use Reset to restart from the beginning with the same configuration

## Configuration System

### TypeScript Configurations

Instead of JSON files, we now use TypeScript configurations that leverage script constants:

- **MOVE_RIGHT**: Character runs continuously using `RUN` action with `ALWAYS` condition
- **JUMP**: Character jumps when grounded using `JUMP` action with `IS_GROUNDED` condition
- **WALL_JUMP**: Character wall jumps using `WALL_JUMP` action with `IS_WALL_SLIDING` condition
- **CHARGE**: Character charges energy using `CHARGE` action with `ENERGY_LOW_20` condition
- **RANDOM**: Character exhibits random behavior with multiple actions and chance conditions

### Script Builder

The Configuration Loader includes a Script Builder that allows you to:

- Mix and match action scripts (RUN, JUMP, WALL_JUMP, CHARGE, TURN_AROUND)
- Combine with condition scripts (ALWAYS, IS_GROUNDED, CHANCE_50, etc.)
- Set energy costs and cooldowns
- Generate complete configurations automatically

### Benefits

- **Type Safety**: Configurations are validated at compile time
- **Maintainable**: Easy to modify script constants without hunting through JSON
- **Reusable**: Script templates can be mixed and matched
- **Debuggable**: Clear separation between actions, conditions, and configuration

## Technical Details

### 60fps Game Loop

- Uses `requestAnimationFrame` for smooth, browser-optimized timing
- Runs at the browser's refresh rate (typically 60fps)
- Automatically handles FPS calculation and display
- Pauses automatically when game ends or errors occur
- No artificial frame rate limiting for maximum performance

### State Management

- Real-time updates to character positions and properties
- Live spawn tracking with lifespan indicators
- Frame-accurate game state synchronization
- Efficient rendering updates through React PIXI

### Error Handling

- Graceful error display in the controls panel
- Automatic pause on game engine errors
- Clear error messages with context
- Easy error clearing and recovery

## Testing

Multiple test configurations are available to demonstrate different behaviors:

### Available Configurations

1. **`test-config.json`** - Basic rightward movement
2. **`game-loop-test-config.json`** - Same as above with tilemap
3. **`move-right-config.json`** - Clean rightward movement example
4. **`jump-config.json`** - Character moves right and jumps
5. **`bounce-config.json`** - Character moves right and bounces up/down

### How to Test

1. Load any test configuration using the Configuration Loader
2. Click Play to see the character execute its script automatically
3. Test Pause/Step/Reset functionality
4. Observe the 60fps timing and frame counter

The test configurations demonstrate the real-time game loop and script execution system working together.

### Script Format and Constants

The test characters use proper bytecode scripts with engine constants:

#### Basic Movement Script (move-right-config.json)

**Condition Script**: `[20, 0, 1, 91, 0]`

- `20` = `ASSIGN_BYTE` - Assign byte literal to variable
- `0, 1` = Set variable 0 to 1 (always true)
- `91` = `EXIT_WITH_VAR` - Exit with variable value
- `0` = Return variable 0 (condition result)

**Action Script**: `[21, 0, 2, 1, 11, 20, 0, 0]`

- `21` = `ASSIGN_FIXED` - Assign fixed-point value
- `0, 2, 1` = Set fixed variable 0 to 2.0 (2/1)
- `11` = `WRITE_PROP` - Write variable to property
- `20, 0` = Write fixed variable 0 to property 20 (`CHARACTER_VEL_X`)
- `0` = `EXIT` - End script

#### Jump Script (jump-config.json)

**Action Script**: `[21, 0, 1, 1, 11, 20, 0, 21, 1, 251, 1, 11, 21, 1, 0]`

- `21, 0, 1, 1` = Set fixed variable 0 to 1.0 (X velocity)
- `11, 20, 0` = Write to `CHARACTER_VEL_X` (property 20)
- `21, 1, 251, 1` = Set fixed variable 1 to -5.0 (Y velocity, upward - 251 = -5 in two's complement)
- `11, 21, 1` = Write to `CHARACTER_VEL_Y` (property 21)
- `0` = Exit

#### Bounce Script (bounce-config.json)

**Action Script**: `[21, 0, 2, 1, 11, 20, 0, 21, 1, 253, 1, 11, 21, 1, 0]`

- `21, 0, 2, 1` = Set fixed variable 0 to 2.0 (X velocity)
- `11, 20, 0` = Write to `CHARACTER_VEL_X`
- `21, 1, 253, 1` = Set fixed variable 1 to -3.0 (Y velocity - 253 = -3 in two's complement)
- `11, 21, 1` = Write to `CHARACTER_VEL_Y`
- `0` = Exit

### Key Constants Used

- **Operators**: `ASSIGN_BYTE=20`, `ASSIGN_FIXED=21`, `WRITE_PROP=11`, `EXIT=0`, `EXIT_WITH_VAR=91`
- **Properties**: `CHARACTER_VEL_X=20`, `CHARACTER_VEL_Y=21`
- **Behavior**: `[[0, 0]]` links condition 0 with action 0

These scripts demonstrate proper use of engine constants and create various movement patterns for testing the 60fps game loop.
