# WASM Wrapper Test Documentation

This document describes the comprehensive test suite for the Robot Masters Game Engine WASM wrapper.

## Test Structure

The test suite is organized into four main categories:

### 1. Unit Tests (`unit_tests.rs`)

**Purpose**: Test individual components and JSON serialization/deserialization functionality.

**Test Coverage**:

- Character JSON conversion (position, health, energy, armor, behaviors)
- Action definition conversion (energy cost, duration, cooldown, scripts)
- Condition definition conversion (energy multiplier, arguments, scripts)
- Spawn definition conversion (damage, duration, element, scripts)
- Status effect definition conversion (duration, stacking, scripts)
- Tilemap conversion and validation
- Game configuration validation
- Fixed-point number conversion
- JSON serialization roundtrip testing

**Key Tests**:

- `test_character_json_conversion()` - Verifies character data conversion
- `test_tilemap_conversion()` - Tests tilemap format conversion
- `test_game_config_validation_success()` - Tests valid configuration acceptance
- `test_fixed_point_conversion()` - Tests fixed-point arithmetic conversion
- `test_json_serialization_roundtrip()` - Tests complete serialization cycle

### 2. Integration Tests (`integration_tests.rs`)

**Purpose**: Test complete game scenarios and end-to-end functionality.

**Test Coverage**:

- Game wrapper initialization
- Complete game initialization and execution
- Frame stepping and timing
- State serialization consistency
- Multi-character game scenarios
- Health and stability monitoring
- Multiple game instance management

**Key Tests**:

- `test_game_wrapper_initialization()` - Tests wrapper creation
- `test_game_initialization_and_basic_execution()` - Tests complete game setup
- `test_frame_stepping_and_timing()` - Tests frame advancement
- `test_complex_game_scenario()` - Tests multi-character interactions
- `test_state_serialization_consistency()` - Tests state caching
- `test_multiple_game_instances()` - Tests concurrent game instances

### 3. Error Handling Tests (`error_handling_tests.rs`)

**Purpose**: Test error conditions, edge cases, and recovery mechanisms.

**Test Coverage**:

- Invalid JSON configuration handling
- Configuration validation errors
- Reference validation (non-existent IDs)
- Element validation (invalid values)
- Operations without proper initialization
- Empty configuration edge cases
- Large configuration limits
- Script edge cases
- Extreme value handling
- Error recovery and stability

**Key Tests**:

- `test_invalid_json_configuration()` - Tests malformed JSON handling
- `test_reference_validation_errors()` - Tests invalid ID references
- `test_game_operations_without_initialization()` - Tests premature operations
- `test_empty_configuration_edge_cases()` - Tests minimal configurations
- `test_extreme_values()` - Tests boundary conditions
- `test_error_recovery_and_stability()` - Tests system recovery

### 4. Deterministic Tests (`deterministic_tests.rs`)

**Purpose**: Verify consistent, deterministic behavior across multiple runs.

**Test Coverage**:

- Same seed produces identical results
- Different seeds produce different results
- Deterministic behavior across restarts
- Character behavior consistency
- Spawn behavior consistency
- Energy and health tracking consistency
- Frame timing consistency
- Complex interaction determinism
- Edge case determinism
- Serialization consistency

**Key Tests**:

- `test_same_seed_produces_identical_results()` - Tests seed determinism
- `test_different_seeds_produce_different_results()` - Tests seed variation
- `test_deterministic_across_restarts()` - Tests restart consistency
- `test_deterministic_character_behavior()` - Tests character consistency
- `test_deterministic_spawn_behavior()` - Tests spawn consistency
- `test_deterministic_with_complex_interactions()` - Tests complex scenarios

## Running Tests

### Prerequisites

1. **Rust and Cargo**: Ensure Rust toolchain is installed
2. **wasm-pack**: Install wasm-pack for WASM testing
   ```bash
   curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh
   ```
3. **Chrome/Chromium**: Required for headless browser testing

### Running All Tests

Use the provided test runner script:

```bash
cd wasm-wrapper
./run_tests.sh
```

### Running Individual Test Suites

```bash
# Unit tests only
wasm-pack test --headless --chrome --test unit_tests

# Integration tests only
wasm-pack test --headless --chrome --test integration_tests

# Error handling tests only
wasm-pack test --headless --chrome --test error_handling_tests

# Deterministic tests only
wasm-pack test --headless --chrome --test deterministic_tests
```

### Running Tests in Browser (for debugging)

```bash
# Run tests in browser for interactive debugging
wasm-pack test --chrome
```

## Test Configuration

### Test Environment

- **Target**: WebAssembly (WASM)
- **Runtime**: Browser environment (Chrome headless)
- **Framework**: `wasm-bindgen-test`
- **Serialization**: `serde_json` for JSON handling

### Test Data

Tests use various configurations:

- **Minimal configs**: Basic setups for simple testing
- **Complex configs**: Multi-character scenarios with spawns and effects
- **Edge case configs**: Boundary conditions and extreme values
- **Invalid configs**: Malformed data for error testing

## Test Validation Requirements

### Requirement 1.5 - Deterministic Behavior

- ✅ Same seed produces identical results across runs
- ✅ Frame stepping is consistent and predictable
- ✅ Game state changes are deterministic

### Requirement 3.4 - Input Validation

- ✅ JSON configuration validation
- ✅ Reference validation (IDs, spawns, etc.)
- ✅ Data type and range validation
- ✅ Clear error messages for invalid input

### Requirement 5.5 - Error Handling

- ✅ Graceful error handling for all failure modes
- ✅ Meaningful error messages with context
- ✅ System stability despite errors
- ✅ Recovery mechanisms where possible

## Performance Considerations

### Test Performance

- Tests are designed to run quickly (< 5 minutes total)
- Deterministic tests use limited frame counts for speed
- Complex scenarios are balanced between coverage and execution time

### Memory Usage

- Tests monitor memory usage through health checks
- Large configuration tests verify memory limits
- Cleanup is verified between test runs

## Continuous Integration

### CI Requirements

The test suite is designed to run in CI environments:

- **Headless execution**: All tests run without GUI
- **Deterministic results**: Tests produce consistent results
- **Clear reporting**: Success/failure is clearly indicated
- **Fast execution**: Complete suite runs in reasonable time

### Test Reporting

Tests provide detailed output:

- Individual test results
- Error messages with context
- Performance metrics where relevant
- Coverage summary

## Troubleshooting

### Common Issues

1. **wasm-pack not found**: Install wasm-pack as shown above
2. **Chrome not found**: Install Chrome or Chromium browser
3. **Build failures**: Check Rust toolchain and dependencies
4. **Test timeouts**: May indicate infinite loops in game logic

### Debug Mode

For debugging test failures:

```bash
# Run with debug output
RUST_LOG=debug wasm-pack test --chrome

# Run specific test with browser debugging
wasm-pack test --chrome --test unit_tests -- --exact test_character_json_conversion
```

## Future Enhancements

### Planned Improvements

1. **Performance benchmarks**: Add timing measurements
2. **Stress testing**: Test with very large configurations
3. **Fuzzing**: Random input generation for edge case discovery
4. **Visual testing**: Screenshot comparison for rendering tests
5. **Network simulation**: Test with simulated network conditions

### Test Coverage Goals

- **Line coverage**: Target 90%+ code coverage
- **Branch coverage**: Test all conditional paths
- **Error coverage**: Test all error conditions
- **Integration coverage**: Test all public APIs

This comprehensive test suite ensures the WASM wrapper is robust, reliable, and ready for production use.
