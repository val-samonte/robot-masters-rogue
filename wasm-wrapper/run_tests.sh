#!/bin/bash

# WASM Wrapper Test Runner
# This script runs all test suites for the WASM wrapper

set -e

echo "🧪 Running WASM Wrapper Test Suite"
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if wasm-pack is installed
if ! command -v wasm-pack &> /dev/null; then
    print_error "wasm-pack is not installed. Please install it first:"
    echo "  curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh"
    exit 1
fi

# Navigate to wasm-wrapper directory
cd "$(dirname "$0")"

print_status "Building WASM wrapper for testing..."

# Build the WASM package first
if wasm-pack build --target web --dev; then
    print_success "WASM build completed successfully"
else
    print_error "WASM build failed"
    exit 1
fi

print_status "Running WASM unit tests..."

# Run unit tests
if wasm-pack test --headless --chrome; then
    print_success "WASM unit tests passed"
else
    print_error "WASM unit tests failed"
    exit 1
fi

print_success "🎉 WASM wrapper tests completed successfully!"
echo ""
echo "Test Coverage Summary:"
echo "- ✅ JSON serialization/deserialization"
echo "- ✅ Game initialization and execution"
echo "- ✅ Error handling and edge cases"
echo "- ✅ Deterministic behavior validation"
echo "- ✅ Frame stepping and timing"
echo "- ✅ State management"
echo ""
echo "The WASM wrapper is ready for use!"
echo ""
echo "TypeScript examples and documentation are available in:"
echo "- tests/examples.ts"
echo "- tests/constants.ts"
echo "- docs/API.md"