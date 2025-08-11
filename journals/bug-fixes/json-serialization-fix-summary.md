# JSON Serialization Error Fix Summary

## Problem

The user encountered a JSON serialization error:

```
"JSON serialization/deserialization failed: invalid type: map, expected a sequence at line 7 column 13"
```

## Root Cause Analysis

The error was caused by an incorrect tilemap format in the game configuration. The WASM wrapper expected a 2D array format, but the configuration was using an object format with `width`, `height`, and `tiles` properties.

**Problematic Format:**

```typescript
tilemap: {
  width: number
  height: number
  tiles: number[]  // Flat array - WRONG
}
```

**Expected Format:**

```typescript
tilemap: number[][]  // 2D array - CORRECT
```

## Solution Applied

### 1. Fixed GameConfig Interface

Updated the TypeScript interface in `web-viewer/src/config/gameConfigs.ts`:

```typescript
export interface GameConfig {
  seed: number
  gravity?: [number, number]
  tilemap: number[][] // Changed from object to 2D array
  // ... other properties
}
```

### 2. Fixed BASIC_TILEMAP Definition

Converted from flat array format to 2D array format:

```typescript
const BASIC_TILEMAP = [
  // Row 0 - Top wall
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  // Rows 1-13 - Side walls with empty space
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  // ... more rows
  // Row 14 - Bottom wall
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
]
```

### 3. Updated Related Interfaces

- **GameStateData interface** in `web-viewer/src/atoms/gameState.ts`
- **TilemapProps interface** in `web-viewer/src/components/GameCanvas.tsx`
- **Tilemap rendering logic** to handle 2D array format

### 4. Fixed Tilemap Rendering

Updated the rendering logic in GameCanvas.tsx:

```typescript
{
  tilemap &&
    tilemap.map((row, rowIndex) =>
      row.map((tileType, colIndex) => {
        if (tileType === 1) {
          return (
            <TileBlock
              key={`tile-${rowIndex}-${colIndex}`}
              x={colIndex * TILE_SIZE}
              y={rowIndex * TILE_SIZE}
            />
          )
        }
        return null
      })
    )
}
```

## Files Modified

1. `web-viewer/src/config/gameConfigs.ts` - Fixed tilemap format and interface
2. `web-viewer/src/atoms/gameState.ts` - Updated GameStateData interface
3. `web-viewer/src/components/GameCanvas.tsx` - Updated TilemapProps and rendering logic

## Verification

- ✅ JSON serialization error resolved
- ✅ Tilemap format matches WASM wrapper expectations
- ✅ 2D array format properly represents 15x16 tile grid
- ✅ Rendering logic correctly processes 2D array structure
- ✅ Game configurations (COMBINATION_1, ADVANCED_MOVEMENT) now valid

## Impact

- **Configuration Loading**: Game configurations can now be loaded without serialization errors
- **Tilemap Rendering**: Tilemap displays correctly in the web viewer
- **WASM Integration**: Proper data format for WASM wrapper communication
- **Development**: Developers can now test game configurations without JSON errors

This fix resolves the fundamental configuration format issue that was preventing the web viewer from loading game configurations correctly.
