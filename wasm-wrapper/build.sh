#!/bin/bash

# Robot Masters WASM Build Script
# Builds the WASM wrapper with different configurations

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default values
BUILD_TYPE="dev"
TARGET="web"
OUT_DIR="pkg"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --release)
      BUILD_TYPE="release"
      shift
      ;;
    --dev)
      BUILD_TYPE="dev"
      shift
      ;;
    --target)
      TARGET="$2"
      shift 2
      ;;
    --out-dir)
      OUT_DIR="$2"
      shift 2
      ;;
    -h|--help)
      echo "Usage: $0 [OPTIONS]"
      echo "Options:"
      echo "  --release     Build in release mode (optimized)"
      echo "  --dev         Build in development mode (default)"
      echo "  --target      Target platform (web, nodejs, bundler)"
      echo "  --out-dir     Output directory (default: pkg)"
      echo "  -h, --help    Show this help message"
      exit 0
      ;;
    *)
      echo "Unknown option $1"
      exit 1
      ;;
  esac
done

echo -e "${YELLOW}Building Robot Masters WASM wrapper...${NC}"
echo "Build type: $BUILD_TYPE"
echo "Target: $TARGET"
echo "Output directory: $OUT_DIR"
echo

# Clean previous build
if [ -d "$OUT_DIR" ]; then
  echo -e "${YELLOW}Cleaning previous build...${NC}"
  rm -rf "$OUT_DIR"
fi

# Build command based on type
if [ "$BUILD_TYPE" = "release" ]; then
  echo -e "${YELLOW}Building optimized release...${NC}"
  wasm-pack build --target "$TARGET" --out-dir "$OUT_DIR" --release
else
  echo -e "${YELLOW}Building development version...${NC}"
  wasm-pack build --target "$TARGET" --out-dir "$OUT_DIR" --dev
fi

echo -e "${GREEN}Build completed successfully!${NC}"
echo "Output available in: $OUT_DIR/"

# Show build artifacts
echo
echo "Generated files:"
ls -la "$OUT_DIR/"