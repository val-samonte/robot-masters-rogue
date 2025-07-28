# Changelog

All notable changes to the Robot Masters Game Engine will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Script execution refactor spec for proper borrow checker conflict resolution
- Comprehensive requirements, design, and implementation plan for script execution system
- Fully functional status effect script execution system with proper borrow sequencing

### Changed

- Reverted unsafe script execution implementation in favor of proper architectural solution
- Refactored status effect script execution to use safe borrow sequencing patterns
- Improved script execution error handling with graceful degradation

### Fixed

- Resolved borrow checker conflicts in status effect script execution
- Fixed disabled script execution in status effect on/tick/off lifecycle methods
- Cleaned up temporary disabled code comments and placeholder documentation

## [0.2.0] - 2025-07-27

### Added

- Code quality improvements spec with comprehensive requirements and design
- Development principles documentation for consistent code standards
- Standard arithmetic trait implementations for Fixed and Vec2 types
- Comprehensive error handling with proper Result types throughout codebase
- Enhanced documentation with inline comments and examples
- Improved code organization with consistent module structure
- Performance optimizations for mathematical operations
- Memory safety improvements with proper ownership patterns

### Changed

- Refactored constants module for better organization and maintainability
- Improved error handling patterns across all modules
- Enhanced Fixed-point arithmetic with overflow protection
- Streamlined API design with consistent naming conventions
- Optimized spawn system for better performance
- Improved status effect system architecture

### Fixed

- Fixed potential overflow issues in Fixed-point arithmetic
- Resolved inconsistent error handling patterns
- Fixed documentation gaps and unclear code comments
- Addressed clippy warnings and code quality issues

### Security

- Eliminated unsafe code patterns where possible
- Improved memory safety with proper borrow checking
- Enhanced input validation and error boundaries

## [0.1.0] - 2025-07-17 to 2025-07-18

### Added

- Initial game engine implementation
- Core entity system with characters, spawns, and status effects
- Bytecode scripting system with ScriptEngine and ScriptContext
- Fixed-point arithmetic system for deterministic calculations
- Physics system foundation with collision detection
- Tilemap system for level representation
- Status effect system with on/tick/off script support
- Action system for character abilities
- Condition system for game logic
- Spawn system for dynamic entity creation
- Game state management with frame-based updates
- Random number generation with seeded RNG
- API layer for external integration

### Technical Details

- No-std compatible for embedded systems
- Deterministic execution for consistent gameplay
- Memory-efficient data structures
- Modular architecture for extensibility
- Comprehensive error handling
- Performance-optimized core loops

---

## Version History Notes

### Version 0.2.0 Focus: Code Quality & Architecture

This release focused on improving code quality, documentation, and architectural foundations. Major refactoring was done to establish better patterns and prepare for future features.

### Version 0.1.0 Focus: Core Engine

Initial implementation of the core game engine with all fundamental systems. Established the basic architecture and core gameplay mechanics.

---

## Contributing

When adding entries to this changelog:

1. **Follow the format**: Use the standard changelog format with Added/Changed/Fixed/Security sections
2. **Be specific**: Describe what changed, not just that something changed
3. **User-focused**: Write from the perspective of someone using the engine
4. **Group related changes**: Keep related changes together in logical sections
5. **Include breaking changes**: Clearly mark any breaking API changes
6. **Reference issues/PRs**: Link to relevant issues or pull requests when applicable

## Release Process

1. Update version number in `Cargo.toml`
2. Update this changelog with release date
3. Create git tag with version number
4. Build and test release
5. Publish release notes
