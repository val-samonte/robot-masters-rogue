# WASM Wrapper Test Documentation

This document describes the test suite for the Robot Masters Game Engine WASM wrapper.

## Test Structure

The test suite is implemented in a single file `src/tests.rs` with 8 comprehensive test functions that cover all aspects of the WASM wrapper functionality.

## Test Functions

### 1. `test_character_json_conversion()`

**Purpose**: Tests character definition JSON to engine type conversion.

**Coverage**:

- Character ID, group, position conversion
- Health, energy, armor array conversion
- Energy regeneration and charge settings
- Behavior tuple conversion
- Fixed-point position conversion (float to Fixed)

### 2. `test_tilemap_conversion()`

**Purpose**: Tests tilemap format conversion from JSON to engine format.

**Coverage**:

- 2D vector to 2D array conversion
- Dimension validation (15x16 tilemap)
- Tile value verification
- Edge case handling

### 3. `test_game_wrapper_creation()`

**Purpose**: Tests GameWrapper initialization with JSON configuration.

**Coverage**:

- JSON configuration parsing
- Configuration validation
- Wrapper state initialization
- Error handling for invalid configurations

### 4. `test_game_initialization()`

**Purpose**: Tests complete game initialization from configuration.

**Coverage**:

- Game state creation from JSON config
- Character, action, condition, spawn setup
- Initial game state validation
- Frame and status verification

### 5. `test_frame_stepping()`

**Purpose**: Tests frame-by-frame game execution.

**Coverage**:

- Frame advancement (step_frame method)
- Frame counter accuracy
- Game state consistency across frames
- Error handling during execution

### 6. `test_state_serialization()`

**Purpose**: Tests game state serialization to JSON.

**Coverage**:

- Complete state JSON export
- Character state serialization
- Spawn instances serialization
- Status effects serialization
- Frame info serialization

### 7. `test_deterministic_behavior()`

**Purpose**: Tests deterministic game behavior with same seed.

**Coverage**:

- Same seed produces identical results
- Frame-by-frame state consistency
- Multiple game instance comparison
- Deterministic execution validation

### 8. `test_error_handling()`

**Purpose**: Tests error conditions and edge cases.

**Coverage**:

- Invalid JSON configuration handling
- Missing required fields
- Operations without game initialization
- Graceful error responses

## Running Tests

### Prerequisites

1. **Rust and Cargo**: Ensure Rust toolchain is installed
2. **wasm-pack**: Install wasm-pack for WASM testing
   ```bash
   curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh
   ```
3. **Chrome/Chromium**: Required for headless browser testing

### Running All Tests

```bash
cd wasm-wrapper
wasm-pack test --headless --chrome
```

### Running Tests in Browser (for debugging)

```bash
# Run tests in browser for interactive debugging
wasm-pack test --chrome
```

### Running Regular Cargo Tests

```bash
# Run non-WASM tests (currently none, but for completeness)
cargo test
```

## Test Configuration

### Test Environment

- **Target**: WebAssembly (WASM)
- **Runtime**: Browser environment (Chrome headless)
- **Framework**: `wasm-bindgen-test`
- **Serialization**: `serde_json` for JSON handling
- **Constants**: Uses `operator_address` constants for script testing

### Test Data

Tests use realistic game configurations:

- **Basic character setup**: Single character with simple actions and conditions
- **Deterministic scenarios**: Multiple identical games for consistency testing
- **Error conditions**: Invalid JSON, missing fields, uninitialized operations
- **Script validation**: Uses proper operator constants instead of hardcoded values

## Test Coverage

### Core Functionality

- ✅ **JSON Configuration**: Parsing and validation of game configurations
- ✅ **Type Conversion**: JSON to engine type conversion (characters, actions, conditions)
- ✅ **Game Initialization**: Complete game setup from configuration
- ✅ **Frame Execution**: Step-by-step game advancement
- ✅ **State Serialization**: Game state export to JSON
- ✅ **Deterministic Behavior**: Consistent results with same seed
- ✅ **Error Handling**: Graceful handling of invalid inputs and edge cases
- ✅ **Fixed-Point Math**: Proper conversion between float and fixed-point numbers

### WASM-Specific Testing

- ✅ **WASM Bindings**: All `#[wasm_bindgen]` methods tested
- ✅ **JavaScript Interop**: JSON string passing between JS and WASM
- ✅ **Memory Management**: Proper cleanup and memory usage
- ✅ **Error Propagation**: Rust errors converted to JavaScript errors

## Test Results

### Current Status

All 8 tests pass successfully:

```
running 8 tests
test tests::test_error_handling ... ok
test tests::test_deterministic_behavior ... ok
test tests::test_state_serialization ... ok
test tests::test_frame_stepping ... ok
test tests::test_game_initialization ... ok
test tests::test_game_wrapper_creation ... ok
test tests::test_tilemap_conversion ... ok
test tests::test_character_json_conversion ... ok

test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out
```

### Performance

- **Execution Time**: All tests complete in under 1 second
- **Memory Usage**: Efficient memory usage with proper cleanup
- **Deterministic**: Consistent results across multiple runs

## Implementation Details

### Script Constants

Tests now use proper operator constants instead of hardcoded numbers:

```rust
// Before (hardcoded)
script: vec![82, 83, 0, 0],

// After (using constants)
script: vec![
    operator_address::APPLY_ENERGY_COST,
    operator_address::APPLY_DURATION,
    operator_address::EXIT,
    0,
],
```

### Test Configuration Examples

**Basic Action Script**:

```rust
script: vec![
    operator_address::EXIT_IF_NO_ENERGY,
    1,
    operator_address::APPLY_ENERGY_COST,
    operator_address::APPLY_DURATION,
    operator_address::EXIT,
    0,
],
```

**Basic Condition Script**:

```rust
script: vec![
    operator_address::ASSIGN_BYTE,
    0,
    1, // always true
    operator_address::EXIT,
    0,
],
```

## Troubleshooting

### Common Issues

1. **wasm-pack not found**: Install wasm-pack as shown above
2. **Chrome not found**: Install Chrome or Chromium browser
3. **Build failures**: Check Rust toolchain and dependencies
4. **Proc-macro errors**: Run `cargo clean` to clear corrupted build cache

### Debug Mode

For debugging test failures:

```bash
# Run with debug output
RUST_LOG=debug wasm-pack test --chrome

# Run in browser for interactive debugging
wasm-pack test --chrome
```

## Recent Updates

### Fixed Issues

- ✅ **Proc-macro compilation errors**: Fixed by cleaning build cache
- ✅ **Hardcoded script values**: Updated to use `operator_address` constants
- ✅ **Test maintainability**: Improved readability with named constants

### Current Implementation

The test suite provides comprehensive coverage of the WASM wrapper functionality with:

- **8 focused test functions** covering all major functionality
- **Proper constant usage** for maintainable script testing
- **Deterministic behavior validation** ensuring consistent results
- **Error handling verification** for robust error management
- **Complete WASM integration testing** validating JavaScript interop

This streamlined test suite ensures the WASM wrapper is reliable and ready for production use.
