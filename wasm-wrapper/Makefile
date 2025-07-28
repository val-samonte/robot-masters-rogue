# Robot Masters WASM Wrapper Makefile

.PHONY: all build build-dev build-release clean check fmt clippy help

# Default target
all: build-dev

# Development build (fast compilation)
build-dev:
	@echo "Building development version..."
	@./build.sh --dev

# Release build (optimized)
build-release:
	@echo "Building release version..."
	@./build.sh --release

# Generic build target
build: build-dev

# Clean build artifacts
clean:
	@echo "Cleaning build artifacts..."
	@rm -rf pkg/
	@cargo clean

# Check code without building
check:
	@echo "Checking code..."
	@cargo check

# Format code
fmt:
	@echo "Formatting code..."
	@cargo fmt

# Run clippy linter
clippy:
	@echo "Running clippy..."
	@cargo clippy -- -D warnings

# Build for different targets
build-web:
	@./build.sh --release --target web

build-node:
	@./build.sh --release --target nodejs

build-bundler:
	@./build.sh --release --target bundler

# Development workflow
dev: fmt clippy build-dev

# Release workflow
release: fmt clippy build-release

# Show help
help:
	@echo "Available targets:"
	@echo "  build-dev     - Build development version (default)"
	@echo "  build-release - Build optimized release version"
	@echo "  clean         - Clean build artifacts"
	@echo "  check         - Check code without building"
	@echo "  fmt           - Format code"
	@echo "  clippy        - Run linter"
	@echo "  build-web     - Build for web target"
	@echo "  build-node    - Build for Node.js target"
	@echo "  build-bundler - Build for bundler target"
	@echo "  dev           - Development workflow (fmt + clippy + build-dev)"
	@echo "  release       - Release workflow (fmt + clippy + build-release)"
	@echo "  help          - Show this help message"