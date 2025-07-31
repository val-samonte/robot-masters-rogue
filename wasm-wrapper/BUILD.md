# Robot Masters WASM Build Guide

This document describes the build tooling and automation for the Robot Masters WASM wrapper.

## Quick Start

```bash
# Development build (fast compilation)
make dev

# Release build (optimized)
make release

# Clean build artifacts
make clean
```

## Build Scripts

### Shell Script (`build.sh`)

The main build script supports various options:

```bash
# Development build
./build.sh --dev

# Release build (optimized)
./build.sh --release

# Different targets
./build.sh --target web      # Default - for web browsers
./build.sh --target nodejs   # For Node.js environments
./build.sh --target bundler  # For webpack/bundler integration

# Custom output directory
./build.sh --out-dir custom-pkg
```

### Makefile

Convenient targets for common operations:

```bash
make build-dev      # Development build
make build-release  # Release build
make clean          # Clean artifacts
make check          # Check code
make fmt            # Format code
make clippy         # Run linter
make dev            # Full dev workflow (fmt + clippy + build-dev)
make release        # Full release workflow (fmt + clippy + build-release)
```

### NPM Scripts

If you prefer npm/yarn:

```bash
npm run build           # Development build
npm run build:release   # Release build
npm run build:node      # Node.js target
npm run build:bundler   # Bundler target
npm run clean           # Clean artifacts
npm run check           # Check code
npm run clippy          # Run linter
npm run fmt             # Format code
```

## Build Configurations

### Development Build

- Fast compilation
- Unoptimized code
- Debug information included
- No wasm-opt optimization
- Larger binary size (~1.2MB)

### Release Build

- Optimized compilation
- Link-time optimization (LTO)
- Size optimization (`opt-level = "s"`)
- wasm-opt optimization
- Smaller binary size (~158KB)

## Optimization Settings

The build is configured for optimal WASM performance:

### Cargo.toml Optimizations

```toml
[profile.release]
lto = true              # Link-time optimization
opt-level = "s"         # Optimize for size
debug = true            # Keep debug info for errors
panic = "abort"         # WASM panic strategy

[package.metadata.wasm-pack.profile.release]
wasm-opt = ["-Os", "--enable-mutable-globals"]
```

### WASM-specific Features

- `wee_alloc` for optimized memory allocation
- `console_error_panic_hook` for better error reporting
- Size-optimized builds with wasm-opt
- Mutable globals enabled for performance

## Build Targets

### Web (Default)

```bash
./build.sh --target web
```

Generates ES modules for direct browser use:

- `wasm_wrapper.js` - ES module
- `wasm_wrapper.d.ts` - TypeScript definitions
- `wasm_wrapper_bg.wasm` - WASM binary

### Node.js

```bash
./build.sh --target nodejs
```

Generates CommonJS modules for Node.js:

- Requires Node.js 16+
- Uses `require()` syntax
- Includes Node.js-specific WASM loading

### Bundler

```bash
./build.sh --target bundler
```

Generates modules for webpack/bundler integration:

- Optimized for bundler processing
- Smaller initial bundle size
- Requires bundler configuration

## TypeScript Support

The build automatically generates TypeScript definitions:

- `wasm_wrapper.d.ts` - Main type definitions
- `wasm_wrapper_bg.wasm.d.ts` - WASM binary types
- Full type safety for all exported functions
- Compatible with TypeScript 5.0+

## Continuous Integration

GitHub Actions workflow (`.github/workflows/build.yml`):

- Runs on push to main/wasm-build branches
- Checks code formatting and linting
- Builds both development and release versions
- Caches dependencies for faster builds
- Uploads build artifacts

## File Structure

```
wasm-wrapper/
├── build.sh              # Main build script
├── Makefile              # Make targets
├── package.json          # NPM configuration
├── Cargo.toml            # Rust configuration
├── wasm-pack.toml        # wasm-pack configuration
├── tsconfig.json         # TypeScript configuration
├── .github/workflows/    # CI configuration
└── pkg/                  # Build output (generated)
    ├── wasm_wrapper.js
    ├── wasm_wrapper.d.ts
    ├── wasm_wrapper_bg.wasm
    └── package.json
```

## Troubleshooting

### Build Failures

1. **Missing wasm-pack**: Install with `curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh`
2. **Missing target**: Add with `rustup target add wasm32-unknown-unknown`
3. **Clippy errors**: Fix with `cargo clippy --fix`
4. **Format errors**: Fix with `cargo fmt`

### Performance Issues

1. **Slow builds**: Use development builds for iteration
2. **Large binaries**: Use release builds for production
3. **Memory issues**: Check wee_alloc configuration

### Integration Issues

1. **TypeScript errors**: Check generated `.d.ts` files
2. **Module loading**: Verify target matches your environment
3. **WASM loading**: Ensure proper async initialization

## Best Practices

1. **Development**: Use `make dev` for fast iteration
2. **Production**: Use `make release` for deployment
3. **CI/CD**: Use the provided GitHub Actions workflow
4. **Testing**: Build before committing changes
5. **Optimization**: Profile before optimizing further
